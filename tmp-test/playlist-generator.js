"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.regenerate = regenerate;
const prisma_1 = require("@/lib/prisma");
function startOfUtcDay(date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
/**
 * Verrouille un Ã©cran pendant toute la transaction.
 *
 * Le verrou doit Ãªtre acquis avant les lectures qui servent
 * Ã  construire la playlist.
 */
async function lockScreen(screenId, db) {
    await db.$executeRaw `
    SELECT pg_advisory_xact_lock(
      hashtextextended(${screenId}, 0)
    )
  `;
}
/**
 * GÃ©nÃ¨re les occurrences physiques d'une campagne.
 *
 * Exemple :
 * frÃ©quence = 5
 * mÃ©dias = A, B, C
 *
 * RÃ©sultat :
 * A, B, C, A, B
 */
function buildCampaignOccurrences(campaign) {
    const media = [...campaign.campaignMedia].sort((a, b) => a.displayOrder - b.displayOrder ||
        a.mediaId.localeCompare(b.mediaId));
    if (media.length === 0) {
        throw new Error(`La campagne ${campaign.id} ne contient aucun mÃ©dia.`);
    }
    for (const campaignMedia of media) {
        if (campaignMedia.media.status !== "APPROVED") {
            throw new Error(`Le mÃ©dia ${campaignMedia.mediaId} de la campagne ${campaign.id} n'est pas approuvÃ©.`);
        }
        if (campaignMedia.durationSeconds !==
            campaign.spotDuration) {
            throw new Error(`DurÃ©e incohÃ©rente pour le mÃ©dia ${campaignMedia.mediaId} de la campagne ${campaign.id}.`);
        }
    }
    const occurrences = [];
    for (let index = 0; index < campaign.frequencyPerLoop; index++) {
        const campaignMedia = media[index % media.length];
        occurrences.push({
            campaignId: campaign.id,
            mediaId: campaignMedia.mediaId,
            durationSeconds: campaignMedia.durationSeconds,
            startDate: campaign.startDate,
            endDate: campaign.endDate,
        });
    }
    return occurrences;
}
/**
 * Distribue les occurrences des diffÃ©rentes campagnes
 * en Ã©vitant autant que possible deux occurrences successives
 * de la mÃªme campagne.
 *
 * Le nombre total d'occurrences de chaque campagne reste
 * strictement Ã©gal Ã  frequencyPerLoop.
 */
function distributeOccurrences(campaigns) {
    const queues = campaigns
        .map((campaign) => ({
        campaign,
        items: buildCampaignOccurrences(campaign),
    }))
        .sort((a, b) => a.campaign.createdAt.getTime() -
        b.campaign.createdAt.getTime() ||
        a.campaign.id.localeCompare(b.campaign.id));
    const result = [];
    let lastCampaignId = null;
    while (queues.some((queue) => queue.items.length > 0)) {
        const available = queues.filter((queue) => queue.items.length > 0);
        /*
         * PrivilÃ©gier une campagne diffÃ©rente de la prÃ©cÃ©dente.
         * En cas d'Ã©galitÃ©, prendre celle ayant le plus
         * d'occurrences restantes.
         */
        available.sort((a, b) => {
            const aDifferent = a.campaign.id === lastCampaignId ? 1 : 0;
            const bDifferent = b.campaign.id === lastCampaignId ? 1 : 0;
            if (aDifferent !== bDifferent) {
                return aDifferent - bDifferent;
            }
            if (a.items.length !== b.items.length) {
                return b.items.length - a.items.length;
            }
            return (a.campaign.createdAt.getTime() -
                b.campaign.createdAt.getTime() ||
                a.campaign.id.localeCompare(b.campaign.id));
        });
        const selected = available[0];
        const item = selected.items.shift();
        if (!item) {
            throw new Error("Erreur interne lors de la gÃ©nÃ©ration de la playlist.");
        }
        result.push(item);
        lastCampaignId = item.campaignId;
    }
    return result;
}
/**
 * RÃ©gÃ©nÃ¨re la playlist opÃ©rationnelle d'un Ã©cran.
 *
 * Cette fonction doit Ãªtre appelÃ©e dans une transaction lorsque
 * le changement de lifecycle de la campagne fait lui-mÃªme partie
 * de la mÃªme opÃ©ration.
 *
 * Si la gÃ©nÃ©ration Ã©choue, la transaction appelante est annulÃ©e
 * et l'ancienne playlist ACTIVE reste donc disponible.
 */
async function regenerate(screenId, db = prisma_1.prisma) {
    if (!screenId) {
        throw new Error("Un Ã©cran est requis pour rÃ©gÃ©nÃ©rer une playlist.");
    }
    /*
     * IMPORTANT :
     * verrou avant les lectures d'inventaire et de campagnes.
     */
    await lockScreen(screenId, db);
    const today = startOfUtcDay(new Date());
    const screen = await db.screen.findUnique({
        where: {
            id: screenId,
        },
        select: {
            id: true,
            inventoryLoopSeconds: true,
            status: true,
        },
    });
    if (!screen) {
        throw new Error(`Ã‰cran introuvable : ${screenId}.`);
    }
    if (screen.inventoryLoopSeconds <= 0) {
        throw new Error(`La capacitÃ© de boucle de l'Ã©cran ${screenId} est invalide.`);
    }
    /*
     * La rÃ©servation est la source de vÃ©ritÃ© commerciale
     * de l'allocation.
     */
    const reservations = await db.inventoryReservation.findMany({
        where: {
            screenId,
            status: "CONFIRMED",
            startDate: {
                lte: today,
            },
            endDate: {
                gt: today,
            },
        },
        include: {
            campaign: {
                include: {
                    campaignScreens: {
                        where: {
                            screenId,
                            status: "ACTIVE",
                        },
                        select: {
                            screenId: true,
                            status: true,
                        },
                    },
                    campaignMedia: {
                        orderBy: {
                            displayOrder: "asc",
                        },
                        include: {
                            media: {
                                select: {
                                    id: true,
                                    status: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });
    const campaignsById = new Map();
    for (const reservation of reservations) {
        const campaign = reservation.campaign;
        console.log("[regenerate] RESERVATION CANDIDATE", {
            screenId,
            reservationId: reservation.id,
            campaignId: campaign.id,
            campaignStatus: campaign.status,
            campaignStartDate: campaign.startDate,
            campaignEndDate: campaign.endDate,
            today,
            reservedSeconds: reservation.reservedSeconds,
            spotDuration: campaign.spotDuration,
            frequencyPerLoop: campaign.frequencyPerLoop,
        });
        if (campaign.status !== "ACTIVE") {
            console.log("[regenerate] SKIP STATUS", {
                campaignId: campaign.id,
            });
            continue;
        }
        if (campaign.startDate > today) {
            console.log("[regenerate] SKIP START DATE", {
                campaignId: campaign.id,
                startDate: campaign.startDate,
                today,
            });
            continue;
        }
        if (campaign.endDate <= today) {
            console.log("[regenerate] SKIP END DATE", {
                campaignId: campaign.id,
                endDate: campaign.endDate,
                today,
            });
            continue;
        }
        if (campaign.campaignScreens.length === 0) {
            throw new Error(`La rÃ©servation ${reservation.id} ne correspond pas Ã  un CampaignScreen actif pour l'Ã©cran ${screenId}.`);
        }
        if (!Number.isInteger(campaign.spotDuration) ||
            campaign.spotDuration <= 0) {
            throw new Error(`La durÃ©e du spot de la campagne ${campaign.id} est invalide.`);
        }
        if (!Number.isInteger(campaign.frequencyPerLoop) ||
            campaign.frequencyPerLoop <= 0) {
            throw new Error(`La frÃ©quence de la campagne ${campaign.id} est invalide.`);
        }
        const expectedReservedSeconds = campaign.spotDuration *
            campaign.frequencyPerLoop;
        if (reservation.reservedSeconds !==
            expectedReservedSeconds) {
            throw new Error(`Allocation incohÃ©rente pour la campagne ${campaign.id} : rÃ©servation ${reservation.reservedSeconds}s, attendu ${expectedReservedSeconds}s.`);
        }
        /*
         * Une seule allocation CONFIRMED active par campagne/Ã©cran
         * doit alimenter une gÃ©nÃ©ration. Plusieurs lignes identiques
         * indiquent une incohÃ©rence d'allocation et ne doivent pas
         * Ãªtre masquÃ©es par un dedupe silencieux.
         */
        if (campaignsById.has(campaign.id)) {
            throw new Error(`Plusieurs rÃ©servations CONFIRMED alimentent la campagne ${campaign.id} sur l'Ã©cran ${screenId}.`);
        }
        campaignsById.set(campaign.id, campaign);
    }
    const campaigns = [...campaignsById.values()];
    console.log("[regenerate] ELIGIBLE CAMPAIGNS", {
        screenId,
        campaignCount: campaigns.length,
        campaigns: campaigns.map((campaign) => ({
            id: campaign.id,
            spotDuration: campaign.spotDuration,
            frequencyPerLoop: campaign.frequencyPerLoop,
        })),
    });
    const generatedItems = distributeOccurrences(campaigns);
    console.log("[regenerate] GENERATED ITEMS", {
        screenId,
        itemCount: generatedItems.length,
        items: generatedItems.map((item) => ({
            campaignId: item.campaignId,
            mediaId: item.mediaId,
            durationSeconds: item.durationSeconds,
            startDate: item.startDate,
            endDate: item.endDate,
        })),
    });
    const generatedSeconds = generatedItems.reduce((total, item) => total + item.durationSeconds, 0);
    const reservedSeconds = campaigns.reduce((total, campaign) => total +
        campaign.spotDuration *
            campaign.frequencyPerLoop, 0);
    if (generatedSeconds !== reservedSeconds) {
        throw new Error(`La durÃ©e gÃ©nÃ©rÃ©e (${generatedSeconds}s) ne correspond pas Ã  la durÃ©e rÃ©servÃ©e (${reservedSeconds}s) sur l'Ã©cran ${screenId}.`);
    }
    if (generatedSeconds >
        screen.inventoryLoopSeconds) {
        throw new Error(`La playlist de l'Ã©cran ${screenId} dÃ©passe sa capacitÃ© : ${generatedSeconds}s gÃ©nÃ©rÃ©es pour ${screen.inventoryLoopSeconds}s disponibles.`);
    }
    /*
     * Avant de remplacer la playlist ACTIVE, vÃ©rifier son type.
     *
     * Une playlist manuelle contient des PlaylistItem avec
     * campaignId = NULL.
     *
     * Une playlist commerciale contient des PlaylistItem avec
     * campaignId renseignÃ©.
     */
    const currentActivePlaylist = await db.playlist.findFirst({
        where: {
            screenId,
            status: "ACTIVE",
        },
        include: {
            items: {
                select: {
                    campaignId: true,
                },
            },
        },
    });
    const hasManualItems = currentActivePlaylist !== null &&
        currentActivePlaylist.items.length > 0 &&
        currentActivePlaylist.items.every((item) => item.campaignId === null);
    /*
     * Aucun Ã©lÃ©ment commercial Ã  gÃ©nÃ©rer :
     *
     * - si une playlist manuelle existe dÃ©jÃ , on la conserve ;
     * - sinon, on dÃ©sactive l'ancienne playlist commerciale pour
     *   empÃªcher la diffusion de campagnes qui ne sont plus Ã©ligibles.
     */
    if (generatedItems.length === 0) {
        if (hasManualItems) {
            console.log(`Aucune campagne commerciale Ã©ligible pour l'Ã©cran ${screenId}. ` +
                `Conservation de la playlist manuelle ACTIVE ` +
                `${currentActivePlaylist.id}.`);
            return {
                playlist: currentActivePlaylist,
                screenId,
                version: currentActivePlaylist.version,
                itemCount: currentActivePlaylist.items.length,
                generatedSeconds: 0,
                reservedSeconds,
                campaignCount: 0,
            };
        }
        const fallbackPlaylist = await db.playlist.findFirst({
            where: {
                screenId,
                items: {
                    some: {},
                    every: {
                        campaignId: null,
                    },
                },
            },
            include: {
                items: {
                    select: {
                        id: true,
                    },
                },
            },
            orderBy: {
                version: "desc",
            },
        });
        if (fallbackPlaylist) {
            await db.playlist.updateMany({
                where: {
                    screenId,
                    status: "ACTIVE",
                },
                data: {
                    status: "INACTIVE",
                },
            });
            const restoredPlaylist = await db.playlist.update({
                where: {
                    id: fallbackPlaylist.id,
                },
                data: {
                    status: "ACTIVE",
                },
            });
            console.log(`Aucune campagne commerciale Ã©ligible pour l'Ã©cran ${screenId}. ` +
                `RÃ©activation de la playlist manuelle ${restoredPlaylist.id}.`);
            return {
                playlist: restoredPlaylist,
                screenId,
                version: restoredPlaylist.version,
                itemCount: fallbackPlaylist.items.length,
                generatedSeconds: 0,
                reservedSeconds,
                campaignCount: 0,
            };
        }
    }
    await db.playlist.updateMany({
        where: {
            screenId,
            status: "ACTIVE",
        },
        data: {
            status: "INACTIVE",
        },
    });
    const lastPlaylist = await db.playlist.findFirst({
        where: {
            screenId,
        },
        orderBy: {
            version: "desc",
        },
        select: {
            version: true,
        },
    });
    const newVersion = (lastPlaylist?.version ?? 0) + 1;
    const playlist = await db.playlist.create({
        data: {
            screenId,
            version: newVersion,
            status: "ACTIVE",
            publishedAt: new Date(),
        },
    });
    if (generatedItems.length > 0) {
        await db.playlistItem.createMany({
            data: generatedItems.map((item, index) => ({
                playlistId: playlist.id,
                campaignId: item.campaignId,
                mediaId: item.mediaId,
                position: index + 1,
                durationSeconds: item.durationSeconds,
                startDate: item.startDate,
                endDate: item.endDate,
            })),
        });
    }
    return {
        playlist,
        screenId,
        version: newVersion,
        itemCount: generatedItems.length,
        generatedSeconds,
        reservedSeconds,
        campaignCount: campaigns.length,
    };
}
