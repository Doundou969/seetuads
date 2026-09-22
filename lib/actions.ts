"use server";

import { randomUUID, randomInt } from "crypto";
import { regenerate } from "@/lib/playlist-generator";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  requireAuth,
  requireAdmin,
} from "@/lib/permissions";

// ============================================================================
// ZONES
// ============================================================================

export async function createZone(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const district = String(formData.get("district") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  const latitudeValue = String(formData.get("latitude") ?? "").trim();
  const longitudeValue = String(formData.get("longitude") ?? "").trim();

  const latitude = latitudeValue ? parseFloat(latitudeValue) : null;
  const longitude = longitudeValue ? parseFloat(longitudeValue) : null;

  if (!name) {
    throw new Error("Le nom de la zone est requis.");
  }

  if (!city) {
    throw new Error("La ville est requise.");
  }

  await prisma.zone.create({
    data: {
      name,
      city,
      district: district || null,
      description: description || null,
      latitude,
      longitude,
    },
  });

  revalidatePath("/admin/zones");
  redirect("/admin/zones");
}

export async function updateZone(
  id: string,
  formData: FormData
) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const district = String(formData.get("district") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  const latitudeValue = String(formData.get("latitude") ?? "").trim();
  const longitudeValue = String(formData.get("longitude") ?? "").trim();

  const latitude = latitudeValue ? parseFloat(latitudeValue) : null;
  const longitude = longitudeValue ? parseFloat(longitudeValue) : null;

  if (!id) {
    throw new Error("Zone introuvable.");
  }

  if (!name) {
    throw new Error("Le nom de la zone est requis.");
  }

  if (!city) {
    throw new Error("La ville est requise.");
  }

  await prisma.zone.update({
    where: { id },
    data: {
      name,
      city,
      district: district || null,
      description: description || null,
      latitude,
      longitude,
    },
  });

  revalidatePath("/admin/zones");
  redirect("/admin/zones");
}

export async function deleteZone(id: string) {
  await requireAdmin();
  if (!id) {
    throw new Error("Zone introuvable.");
  }

  await prisma.zone.delete({
    where: { id },
  });

  revalidatePath("/admin/zones");
}

// ============================================================================
// PARTNERS
// ============================================================================

export async function createPartner(formData: FormData) {
  await requireAdmin();
  const businessName = String(
    formData.get("businessName") ?? ""
  ).trim();

  const ownerName = String(
    formData.get("ownerName") ?? ""
  ).trim();

  const phone = String(
    formData.get("phone") ?? ""
  ).trim();

  const email = String(
    formData.get("email") ?? ""
  ).trim();

  const businessType = String(
    formData.get("businessType") ?? ""
  ).trim();

  const address = String(
    formData.get("address") ?? ""
  ).trim();

  const city =
    String(formData.get("city") ?? "").trim() || "Dakar";

  if (!businessName) {
    throw new Error(
      "Le nom de l'entreprise est requis."
    );
  }

  if (!phone) {
    throw new Error(
      "Le tÃƒÂ©lÃƒÂ©phone est requis."
    );
  }

  // --------------------------------------------------------------------------
  // CRÃƒâ€°ATION D'UN UTILISATEUR PARTENAIRE
  // --------------------------------------------------------------------------
  //
  // Partner.userId est une clÃƒÂ© ÃƒÂ©trangÃƒÂ¨re obligatoire vers users.id.
  // On crÃƒÂ©e donc d'abord un vrai User, puis on utilise son id pour Partner.
  //

  const generatedClerkUserId =
    `admin-created-${randomUUID()}`;

  const user = await prisma.user.create({
    data: {
      clerkUserId: generatedClerkUserId,
      role: "PARTNER",
      email:
        email ||
        `partner-${randomUUID()}@seetuads.local`,
      firstName: ownerName || null,
      lastName: null,
      phone,
    },
  });

  await prisma.partner.create({
    data: {
      userId: user.id,
      businessName,
      ownerName: ownerName || null,
      phone,
      email: email || null,
      businessType: businessType || null,
      address: address || null,
      city,
    },
  });

  revalidatePath("/admin/partners");
  revalidatePath("/admin/users");

  redirect("/admin/partners");
}
export async function deletePartner(id: string) {
  await requireAdmin();
  if (!id) {
    throw new Error("Partenaire introuvable.");
  }

  await prisma.partner.delete({
    where: { id },
  });

  revalidatePath("/admin/partners");
}

// ============================================================================
// LOCATIONS
// ============================================================================

export async function createLocation(formData: FormData) {
  await requireAdmin();
  const partnerId = String(
    formData.get("partnerId") ?? ""
  ).trim();

  const name = String(
    formData.get("name") ?? ""
  ).trim();

  const address = String(
    formData.get("address") ?? ""
  ).trim();

  const city =
    String(formData.get("city") ?? "").trim() || "Dakar";

  const district = String(
    formData.get("district") ?? ""
  ).trim();

  const latitudeValue = String(
    formData.get("latitude") ?? ""
  ).trim();

  const longitudeValue = String(
    formData.get("longitude") ?? ""
  ).trim();

  const latitude = latitudeValue
    ? parseFloat(latitudeValue)
    : null;

  const longitude = longitudeValue
    ? parseFloat(longitudeValue)
    : null;

  if (!partnerId) {
    throw new Error("Le partenaire est requis.");
  }

  if (!name) {
    throw new Error("Le nom de l'emplacement est requis.");
  }

  if (!address) {
    throw new Error("L'adresse est requise.");
  }

  await prisma.location.create({
    data: {
      partnerId,
      name,
      address,
      city,
      district: district || null,
      latitude,
      longitude,
    },
  });

  revalidatePath("/admin/locations");
  redirect("/admin/locations");
}

export async function deleteLocation(id: string) {
  await requireAdmin();
  if (!id) {
    throw new Error("Emplacement introuvable.");
  }

  await prisma.location.delete({
    where: { id },
  });

  revalidatePath("/admin/locations");
}

// ============================================================================
// SCREENS
// ============================================================================

export async function createScreen(formData: FormData) {
  await requireAdmin();
  const locationId = String(
    formData.get("locationId") ?? ""
  ).trim();

  const zoneId = String(
    formData.get("zoneId") ?? ""
  ).trim();

  const screenCode = String(
    formData.get("screenCode") ?? ""
  ).trim();

  const name = String(
    formData.get("name") ?? ""
  ).trim();

  const resolution =
    String(formData.get("resolution") ?? "").trim() ||
    "1920x1080";

  const orientation =
    String(formData.get("orientation") ?? "").trim() ||
    "landscape";

  const monthlyPartnerFeeValue = String(
    formData.get("monthlyPartnerFee") ?? ""
  ).trim();

  const inventoryLoopSecondsValue = String(
    formData.get("inventoryLoopSeconds") ?? ""
  ).trim();

  const monthlyPartnerFee =
    parseFloat(monthlyPartnerFeeValue) || 20000;

  const inventoryLoopSeconds =
    parseInt(inventoryLoopSecondsValue, 10) || 120;

  if (!locationId) {
    throw new Error("L'emplacement est requis.");
  }

  if (!screenCode) {
    throw new Error("Le code ÃƒÂ©cran est requis.");
  }

  await prisma.screen.create({
    data: {
      locationId,
      zoneId: zoneId || null,
      screenCode,
      name: name || null,
      resolution,
      orientation,
      monthlyPartnerFee,
      inventoryLoopSeconds,
    },
  });

  revalidatePath("/admin/screens");
  redirect("/admin/screens");
}

export async function deleteScreen(id: string) {
  await requireAdmin();
  if (!id) {
    throw new Error("Ãƒâ€°cran introuvable.");
  }

  const playbackLogs = await prisma.playbackLog.count({
    where: { screenId: id },
  });

  if (playbackLogs > 0) {
    throw new Error(
      "\u00c9cran avec historique de diffusion : suppression impossible."
    );
  }

  await prisma.screen.delete({
    where: { id },
  });

  revalidatePath("/admin/screens");
}

// ============================================================================
// PLAYERS
// ============================================================================

const SHORT_CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function generateShortCode(length = 6) {
  let code = "";
  for (let i = 0; i < length; i++) {
    const index = randomInt(SHORT_CODE_ALPHABET.length);
    code += SHORT_CODE_ALPHABET[index];
  }
  return code;
}

export async function createPlayer(formData: FormData) {
  await requireAdmin();
  const screenId = String(
    formData.get("screenId") ?? ""
  ).trim();

  const deviceId = String(
    formData.get("deviceId") ?? ""
  ).trim();

  const serialNumber = String(
    formData.get("serialNumber") ?? ""
  ).trim();

  const appVersion =
    String(formData.get("appVersion") ?? "").trim() ||
    "1.0.0";

  if (!deviceId) {
    throw new Error("Le Device ID est requis.");
  }

  let created = null;
  let attempts = 0;

  while (!created && attempts < 5) {
    attempts++;
    const shortCode = generateShortCode();

    try {
      created = await prisma.player.create({
        data: {
          screenId: screenId || null,
          deviceId,
          serialNumber: serialNumber || null,
          appVersion,
          shortCode,
        },
      });
    } catch (err: any) {
      if (err?.code === "P2002" && attempts < 5) {
        continue;
      }
      throw err;
    }
  }

  if (!created) {
    throw new Error(
      "Impossible de generer un code court unique, veuillez reessayer."
    );
  }

  revalidatePath("/admin/players");
  redirect("/admin/players");
}

export async function generatePlayerShortCode(id: string) {
  const user = await requireAuth();

  if (user.role !== "ADMIN" && user.role !== "OPERATOR") {
    throw new Error(
      "Seuls les administrateurs peuvent generer un lien court."
    );
  }

  if (!id) {
    throw new Error("Player introuvable.");
  }

  const player = await prisma.player.findUnique({
    where: { id },
    select: { id: true, shortCode: true },
  });

  if (!player) {
    throw new Error("Player introuvable.");
  }

  if (player.shortCode) {
    return player.shortCode;
  }

  let updated = null;
  let attempts = 0;

  while (!updated && attempts < 5) {
    attempts++;
    const shortCode = generateShortCode();

    try {
      updated = await prisma.player.update({
        where: { id },
        data: { shortCode },
      });
    } catch (err: any) {
      if (err?.code === "P2002" && attempts < 5) {
        continue;
      }
      throw err;
    }
  }

  if (!updated) {
    throw new Error(
      "Impossible de generer un code court unique, veuillez reessayer."
    );
  }

  revalidatePath("/admin/players");

  return updated.shortCode;
}

export async function deletePlayer(id: string) {
  await requireAdmin();
  if (!id) {
    throw new Error("Player introuvable.");
  }

  const playbackLogs = await prisma.playbackLog.count({
    where: { playerId: id },
  });

  if (playbackLogs > 0) {
    throw new Error(
      "Player avec historique de diffusion : suppression impossible."
    );
  }

  await prisma.player.delete({
    where: { id },
  });

  revalidatePath("/admin/players");
}

// ============================================================================
// CAMPAIGNS
// ============================================================================

export async function createCampaign(formData: FormData) {
  const user = await requireAuth();

  const name = String(formData.get("name") ?? "").trim();

  const objective = String(
    formData.get("objective") ?? ""
  ).trim();

  const startDateValue = String(
    formData.get("startDate") ?? ""
  ).trim();

  const endDateValue = String(
    formData.get("endDate") ?? ""
  ).trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDateValue)) {
    throw new Error("La date de dÃƒÂ©but est invalide.");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(endDateValue)) {
    throw new Error("La date de fin est invalide.");
  }

  const startDate = new Date(`${startDateValue}T00:00:00`);
  const endDate = new Date(`${endDateValue}T00:00:00`);

  if (Number.isNaN(startDate.getTime())) {
    throw new Error("La date de dÃƒÂ©but est invalide.");
  }

  if (Number.isNaN(endDate.getTime())) {
    throw new Error("La date de fin est invalide.");
  }

  if (endDate <= startDate) {
    throw new Error(
      "La date de fin doit être strictement postérieure à la date de début."
    );
  }

  const spotDuration = Number(
    formData.get("spotDuration") ?? 15
  );

  const frequencyPerLoop = Number(
    formData.get("frequencyPerLoop") ?? 1
  );

  if (
    !Number.isInteger(spotDuration) ||
    spotDuration < 5 ||
    spotDuration > 60
  ) {
    throw new Error(
      "La durÃƒÂ©e du spot doit ÃƒÂªtre comprise entre 5 et 60 secondes."
    );
  }

  if (
    !Number.isInteger(frequencyPerLoop) ||
    frequencyPerLoop < 1 ||
    frequencyPerLoop > 10
  ) {
    throw new Error(
      "La frÃƒÂ©quence doit ÃƒÂªtre comprise entre 1 et 10."
    );
  }

  const parseIdList = (
    value: string,
    label: string
  ): string[] => {
    try {
      const parsed: unknown = value
        ? JSON.parse(value)
        : [];

      if (
        !Array.isArray(parsed) ||
        !parsed.every(
          (item) =>
            typeof item === "string" &&
            item.trim().length > 0
        )
      ) {
        throw new Error("invalid");
      }

      const ids = parsed.map((item) => item.trim());

      return [...new Set(ids)];
    } catch {
      throw new Error(
        `La sÃƒÂ©lection des ${label} est invalide.`
      );
    }
  };

  const screenIds = parseIdList(
    String(formData.get("screenIds") ?? ""),
    "ÃƒÂ©crans"
  );

  const mediaIds = parseIdList(
    String(formData.get("mediaIds") ?? ""),
    "mÃƒÂ©dias"
  );

  if (!name) {
    throw new Error("Le nom de la campagne est requis.");
  }

  if (screenIds.length === 0) {
    throw new Error(
      "La campagne doit contenir au moins un ÃƒÂ©cran."
    );
  }

  if (mediaIds.length === 0) {
    throw new Error(
      "La campagne doit contenir au moins un mÃƒÂ©dia."
    );
  }

  const selectedAdvertiserId = String(
    formData.get("advertiserId") ?? ""
  ).trim();

  let advertiserId: string;

  if (
    user.role === "ADMIN" ||
    user.role === "OPERATOR"
  ) {
    if (!selectedAdvertiserId) {
      throw new Error(
        "Veuillez sÃƒÂ©lectionner un annonceur."
      );
    }

    advertiserId = selectedAdvertiserId;
  } else {
    if (!user.advertiser) {
      throw new Error(
        "AccÃƒÂ¨s rÃƒÂ©servÃƒÂ© aux annonceurs."
      );
    }

    advertiserId = user.advertiser.id;
  }

  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  const numberOfDays =
    Math.floor(
      (endDate.getTime() - startDate.getTime()) /
        MS_PER_DAY
    ) ;

  await prisma.$transaction(async (tx) => {
    const advertiser =
      await tx.advertiser.findFirst({
        where: {
          id: advertiserId,
          status: "ACTIVE",
        },
        select: {
          id: true,
        },
      });

    if (!advertiser) {
      throw new Error(
        "L'annonceur sÃƒÂ©lectionnÃƒÂ© est introuvable ou inactif."
      );
    }

    const approvedMedia =
      await tx.media.findMany({
        where: {
          id: {
            in: mediaIds,
          },
          advertiserId,
          status: "APPROVED",
        },
        select: {
          id: true,
        },
      });

    if (
      approvedMedia.length !== mediaIds.length
    ) {
      throw new Error(
        "Un ou plusieurs mÃƒÂ©dias sÃƒÂ©lectionnÃƒÂ©s sont introuvables, appartiennent ÃƒÂ  un autre annonceur ou ne sont pas approuvÃƒÂ©s."
      );
    }

    const validScreens =
      await tx.screen.findMany({
        where: {
          id: {
            in: screenIds,
          },
        },
        select: {
          id: true,
          zoneId: true,
        },
      });

    if (
      validScreens.length !== screenIds.length
    ) {
      throw new Error(
        "Un ou plusieurs ÃƒÂ©crans sÃƒÂ©lectionnÃƒÂ©s sont introuvables."
      );
    }

    const conflictingScreens =
      await tx.campaignScreen.findMany({
        where: {
          screenId: {
            in: screenIds,
          },
          status: "ACTIVE",
          campaign: {
            status: {
              in: [
                "PENDING_REVIEW",
                "AWAITING_PAYMENT",
                "SCHEDULED",
                "ACTIVE",
              ],
            },
            startDate: {
              lt: endDate,
            },
            endDate: {
              gt: startDate,
            },
          },
        },
        select: {
          screenId: true,
        },
      });

    if (conflictingScreens.length > 0) {
      throw new Error(
        "Un ou plusieurs écrans sélectionnés sont déjà réservés sur cette période."
      );
    }
    const zoneIds = [
      ...new Set(
        validScreens
          .map((screen) => screen.zoneId)
          .filter(
            (zoneId): zoneId is string =>
              Boolean(zoneId)
          )
      ),
    ];

    const pricingRules =
      await tx.pricingRule.findMany({
        where: {
          active: true,
          OR:
            zoneIds.length > 0
              ? [
                  {
                    screenId: {
                      in: screenIds,
                    },
                  },
                  {
                    zoneId: {
                      in: zoneIds,
                    },
                  },
                ]
              : [
                  {
                    screenId: {
                      in: screenIds,
                    },
                  },
                ],
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          screenId: true,
          zoneId: true,
          basePrice: true,
          durationMultiplier: true,
          frequencyMultiplier: true,
          zoneMultiplier: true,
        },
      });

    let totalPrice = 0;

    for (const screen of validScreens) {
      const screenRule =
        pricingRules.find(
          (rule) =>
            rule.screenId === screen.id
        );

      const zoneRule = screen.zoneId
        ? pricingRules.find(
            (rule) =>
              rule.zoneId === screen.zoneId
          )
        : undefined;

      const rule =
        screenRule ?? zoneRule;

      if (!rule) {
        throw new Error(
          `Aucune rÃƒÂ¨gle de tarification active n'est dÃƒÂ©finie pour l'ÃƒÂ©cran sÃƒÂ©lectionnÃƒÂ©.`
        );
      }

      const screenPrice =
        Number(rule.basePrice) *
        Number(rule.durationMultiplier) *
        Number(rule.frequencyMultiplier) *
        Number(rule.zoneMultiplier) *
        numberOfDays;

      totalPrice += screenPrice;
    }

    const estimatedPrice =
      Math.round(totalPrice * 100) / 100;

    const campaign =
      await tx.campaign.create({
        data: {
          advertiserId,
          name,
          objective: objective || null,
          startDate,
          endDate,
          spotDuration,
          frequencyPerLoop,
          estimatedPrice,
          status: "PENDING_REVIEW",
        },
      });

    await tx.campaignScreen.createMany({
      data: screenIds.map((screenId) => ({
        campaignId: campaign.id,
        screenId,
        reservedSeconds: spotDuration * frequencyPerLoop,
        status: "ACTIVE",
      })),
    });

    await tx.campaignMedia.createMany({
      data: mediaIds.map((mediaId, index) => ({
        campaignId: campaign.id,
        mediaId,
        displayOrder: index + 1,
        durationSeconds: spotDuration,
      })),
    });
  });

  revalidatePath("/admin/campaigns");
  revalidatePath("/admin/campaigns/new");

  redirect("/admin/campaigns");
}
async function getAuthorizedCampaign(
  id: string
) {
  const user = await requireAuth();

  if (!id) {
    throw new Error("Campagne introuvable.");
  }

  // ADMIN / OPERATOR :
  // accÃƒÂ¨s aux campagnes de tous les annonceurs.
  if (
    user.role === "ADMIN" ||
    user.role === "OPERATOR"
  ) {
    const campaign =
      await prisma.campaign.findUnique({
        where: { id },
        include: {
          advertiser: {
            select: {
              id: true,
              companyName: true,
              status: true,
            },
          },
          campaignScreens: {
            include: {
              screen: true,
            },
          },
          campaignMedia: {
            include: {
              media: true,
            },
          },
        },
      });

    if (!campaign) {
      throw new Error("Campagne introuvable.");
    }

    return {
      user,
      campaign,
    };
  }

  // ANNONCEUR :
  // accÃƒÂ¨s uniquement ÃƒÂ  ses propres campagnes.
  if (!user.advertiser) {
    throw new Error(
      "AccÃƒÂ¨s rÃƒÂ©servÃƒÂ© aux annonceurs."
    );
  }

  const campaign =
    await prisma.campaign.findFirst({
      where: {
        id,
        advertiserId: user.advertiser.id,
      },
      include: {
        advertiser: {
          select: {
            id: true,
            companyName: true,
            status: true,
          },
        },
        campaignScreens: {
          include: {
            screen: true,
          },
        },
        campaignMedia: {
          include: {
            media: true,
          },
        },
      },
    });

  if (!campaign) {
    throw new Error("Campagne introuvable.");
  }

  return {
    user,
    campaign,
  };
}

// ============================================================================
// MEDIA
// ============================================================================

export async function createMedia(formData: FormData) {
  const user = await requireAuth();

  const name = String(
    formData.get("name") ?? ""
  ).trim();

  const fileUrl = String(
    formData.get("fileUrl") ?? ""
  ).trim();

  const fileType = String(
    formData.get("fileType") ?? ""
  ).trim();

  const mimeType = String(
    formData.get("mimeType") ?? ""
  ).trim();

  const durationSeconds =
    Number(formData.get("durationSeconds") ?? 15);

  const widthValue = String(
    formData.get("widthPx") ?? ""
  ).trim();

  const heightValue = String(
    formData.get("heightPx") ?? ""
  ).trim();

  const fileSizeValue = String(
    formData.get("fileSizeBytes") ?? ""
  ).trim();

  const selectedAdvertiserId = String(
    formData.get("advertiserId") ?? ""
  ).trim();

  const widthPx = widthValue
    ? Number(widthValue)
    : null;

  const heightPx = heightValue
    ? Number(heightValue)
    : null;

  const fileSizeBytes = fileSizeValue
    ? BigInt(fileSizeValue)
    : null;

  if (!name) {
    throw new Error(
      "Le nom du mÃƒÂ©dia est requis."
    );
  }

  if (!fileUrl) {
    throw new Error(
      "L'URL du mÃƒÂ©dia est requise."
    );
  }

  if (
    fileType !== "image" &&
    fileType !== "video"
  ) {
    throw new Error(
      "Le type du mÃƒÂ©dia est invalide."
    );
  }

  const allowedMimeTypes = [
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "image/jpeg",
    "image/png",
    "image/webp",
  ] as const;

  const mimeByExtension: Record<string, string> = {
    mp4: "video/mp4",
    m4v: "video/mp4",
    webm: "video/webm",
    mov: "video/quicktime",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
  };

  const normalizedMimeType = mimeType
    .toLowerCase()
    .split(";")[0]
    .trim();

  let resolvedMimeType = normalizedMimeType;

  if (
    !allowedMimeTypes.includes(
      resolvedMimeType as (typeof allowedMimeTypes)[number]
    )
  ) {
    const cleanUrl = fileUrl
      .split("?")[0]
      .split("#")[0];

    const extension = cleanUrl
      .split(".")
      .pop()
      ?.toLowerCase();

    if (extension && mimeByExtension[extension]) {
      resolvedMimeType = mimeByExtension[extension];
    }
  }

  if (
    !allowedMimeTypes.includes(
      resolvedMimeType as (typeof allowedMimeTypes)[number]
    )
  ) {
    throw new Error(
      `Le type MIME du mÃƒÂ©dia est invalide : ${
        mimeType || "non renseignÃƒÂ©"
      }.`
    );
  }

  if (
    !Number.isFinite(durationSeconds) ||
    durationSeconds < 5 ||
    durationSeconds > 60
  ) {
    throw new Error(
      "La durÃƒÂ©e doit ÃƒÂªtre comprise entre 5 et 60 secondes."
    );
  }

  if (
    widthPx !== null &&
    (
      !Number.isFinite(widthPx) ||
      widthPx <= 0
    )
  ) {
    throw new Error(
      "La largeur du mÃƒÂ©dia est invalide."
    );
  }

  if (
    heightPx !== null &&
    (
      !Number.isFinite(heightPx) ||
      heightPx <= 0
    )
  ) {
    throw new Error(
      "La hauteur du mÃƒÂ©dia est invalide."
    );
  }

  if (
    fileSizeBytes !== null &&
    fileSizeBytes <= BigInt(0)
  ) {
    throw new Error(
      "La taille du mÃƒÂ©dia est invalide."
    );
  }

  let advertiserId: string;

  // ADMIN / OPERATOR
  if (
    user.role === "ADMIN" ||
    user.role === "OPERATOR"
  ) {
    if (!selectedAdvertiserId) {
      throw new Error(
        "Veuillez sÃƒÂ©lectionner l'annonceur propriÃƒÂ©taire du mÃƒÂ©dia."
      );
    }

    const advertiser =
      await prisma.advertiser.findFirst({
        where: {
          id: selectedAdvertiserId,
          status: "ACTIVE",
        },
        select: {
          id: true,
        },
      });

    if (!advertiser) {
      throw new Error(
        "L'annonceur sÃƒÂ©lectionnÃƒÂ© est introuvable ou inactif."
      );
    }

    advertiserId = advertiser.id;
  } else {
    // ANNONCEUR
    if (!user.advertiser) {
      throw new Error(
        "AccÃƒÂ¨s rÃƒÂ©servÃƒÂ© aux annonceurs."
      );
    }

    advertiserId = user.advertiser.id;
  }

  await prisma.media.create({
    data: {
      advertiserId,
      name,
      fileUrl,
      fileType,
      mimeType: resolvedMimeType,
      durationSeconds,
      widthPx,
      heightPx,
      fileSizeBytes,

      // Le mÃƒÂ©dia attend la validation admin
      status: "UPLOADED",
    },
  });

  revalidatePath("/admin/media");
  revalidatePath("/advertiser/media");

  redirect(
    user.role === "ADVERTISER"
      ? "/advertiser/media"
      : "/admin/media"
  );
}


export async function deactivateCampaign(
  id: string
) {
  console.log("[deactivateCampaign] START", id);

  const { campaign } =
    await getAuthorizedCampaign(id);

  console.log("[deactivateCampaign] AUTHORIZED", {
    id,
    status: campaign.status,
    mediaCount: campaign.campaignMedia.length,
    screenCount: campaign.campaignScreens.length,
  });

  if (campaign.status !== "ACTIVE") {
    throw new Error(
      "Seules les campagnes actives peuvent etre desactivees."
    );
  }

  await prisma.$transaction(async (tx) => {
    const currentCampaign =
      await tx.campaign.findUnique({
        where: {
          id: campaign.id,
        },
        select: {
          id: true,
          status: true,
          spotDuration: true,
          frequencyPerLoop: true,
          endDate: true,
          startDate: true,
        },
      });

    if (!currentCampaign) {
      throw new Error("Campagne introuvable.");
    }

    if (currentCampaign.status !== "ACTIVE") {
      throw new Error(
        "La campagne n'est plus active ou ne peut plus etre desactivee."
      );
    }

    const screenIds = [
      ...new Set(
        campaign.campaignScreens
          .filter(
            (campaignScreen) =>
              campaignScreen.status === "ACTIVE"
          )
          .map(
            (campaignScreen) =>
              campaignScreen.screenId
          )
      ),
    ].sort();

    /*
     * Verrouiller tous les ecrans dans un ordre deterministe
     * avant la transition et la regeneration.
     */
    for (const screenId of screenIds) {
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(
          hashtextextended(${screenId}, 0)
        )
      `;
    }

    /*
     * regenerate() ignore les campagnes qui ne sont pas ACTIVE.
     */
    console.log(
      "[deactivateCampaign] TRANSITION",
      currentCampaign.id,
      currentCampaign.status,
      "-> PAUSED"
    );

    await tx.campaign.update({
      where: {
        id: campaign.id,
      },
      data: {
        status: "PAUSED",
      },
    });

    /*
     * Les reservations CONFIRMED sont conservees pendant la pause.
     */
    for (const screenId of screenIds) {
      console.log("[deactivateCampaign] BEFORE REGENERATE", {
        campaignId: campaign.id,
        screenId,
      });

      await regenerate(screenId, tx);

      console.log("[deactivateCampaign] AFTER REGENERATE", {
        campaignId: campaign.id,
        screenId,
      });
    }

    console.log("[deactivateCampaign] TRANSACTION BODY COMPLETE", {
      campaignId: campaign.id,
    });

    console.log(
      "[deactivateCampaign] TRANSACTION READY",
      campaign.id
    );
  });

  revalidatePath("/admin/campaigns");
  revalidatePath("/advertiser/campaigns");
  revalidatePath("/admin/playlists");
}

export async function deleteCampaign(
  id: string
) {
  const { campaign } =
    await getAuthorizedCampaign(id);

  if (campaign.status === "ACTIVE") {
    throw new Error(
      "Une campagne active ne peut pas ÃƒÂªtre supprimÃƒÂ©e."
    );
  }

  await prisma.campaign.delete({
    where: { id },
  });

  revalidatePath("/admin/campaigns");
  revalidatePath("/advertiser/campaigns");
}


export async function activateCampaign(
  id: string
) {
  console.log("[activateCampaign] START", id);
  const { campaign } =
    await getAuthorizedCampaign(id);

  console.log("[activateCampaign] AUTHORIZED", {
    id,
    status: campaign.status,
    mediaCount: campaign.campaignMedia.length,
    screenCount: campaign.campaignScreens.length,
  });

  if (campaign.status !== "SCHEDULED") {
    throw new Error(
      "Seules les campagnes planifiÃƒÂ©es peuvent ÃƒÂªtre activÃƒÂ©es."
    );
  }

  const today = new Date();
  const todayUtc = new Date(
    Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate()
    )
  );

  if (campaign.startDate > todayUtc) {
    throw new Error(
      "La campagne ne peut ÃƒÂªtre activÃƒÂ©e qu'ÃƒÂ  partir de sa date de dÃƒÂ©but."
    );
  }

  if (campaign.campaignMedia.length === 0) {
    throw new Error(
      "La campagne doit contenir au moins un mÃƒÂ©dia."
    );
  }

  const unapprovedMedia =
    campaign.campaignMedia.find(
      (campaignMedia) =>
        campaignMedia.media.status !== "APPROVED"
    );

  if (unapprovedMedia) {
    throw new Error(
      `Le mÃƒÂ©dia "${unapprovedMedia.media.name}" n'est pas approuvÃƒÂ©.`
    );
  }

  if (campaign.campaignScreens.length === 0) {
    throw new Error(
      "La campagne doit contenir au moins un ÃƒÂ©cran."
    );
  }

  await prisma.$transaction(async (tx) => {
    const currentCampaign =
      await tx.campaign.findUnique({
        where: {
          id: campaign.id,
        },
        select: {
          id: true,
          status: true,
          startDate: true,
          endDate: true,
          spotDuration: true,
          frequencyPerLoop: true,
          campaignScreens: {
            where: {
              status: "ACTIVE",
            },
            select: {
              screenId: true,
            },
          },
        },
      });

    if (!currentCampaign) {
      throw new Error(
        "Campagne introuvable."
      );
    }

    if (currentCampaign.status !== "SCHEDULED") {
      throw new Error(
        "La campagne n'est plus planifiÃƒÂ©e ou ne peut plus ÃƒÂªtre activÃƒÂ©e."
      );
    }

    if (currentCampaign.startDate > todayUtc) {
      throw new Error(
        "La campagne ne peut ÃƒÂªtre activÃƒÂ©e qu'ÃƒÂ  partir de sa date de dÃƒÂ©but."
      );
    }

    if (currentCampaign.campaignScreens.length === 0) {
      throw new Error(
        "La campagne ne possÃƒÂ¨de aucun ÃƒÂ©cran actif."
      );
    }

    const screenIds = [
      ...new Set(
        currentCampaign.campaignScreens
          .map(
            (campaignScreen) =>
              campaignScreen.screenId
          )
      ),
    ].sort();

    /*
     * Une campagne SCHEDULED doit possÃƒÂ©der une rÃƒÂ©servation
     * CONFIRMED pour chaque ÃƒÂ©cran avant de pouvoir devenir ACTIVE.
     *
     * On verrouille dans un ordre dÃƒÂ©terministe afin d'ÃƒÂ©viter
     * les deadlocks avec les autres opÃƒÂ©rations d'inventaire.
     */
    for (const screenId of screenIds) {
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(
          hashtextextended(${screenId}, 0)
        )
      `;
    }

    const reservations =
      await tx.inventoryReservation.findMany({
        where: {
          campaignId: currentCampaign.id,
          screenId: {
            in: screenIds,
          },
          status: "CONFIRMED",
          startDate: {
            lt: currentCampaign.endDate,
          },
          endDate: {
            gt: currentCampaign.startDate,
          },
        },
        select: {
          id: true,
          screenId: true,
          reservedSeconds: true,
        },
      });

    const reservationByScreen =
      new Map(
        reservations.map(
          (reservation) => [
            reservation.screenId,
            reservation,
          ]
        )
      );

    const expectedReservedSeconds =
      currentCampaign.spotDuration *
      currentCampaign.frequencyPerLoop;

    for (const screenId of screenIds) {
      const reservation =
        reservationByScreen.get(screenId);

      if (!reservation) {
        throw new Error(
          `Aucune rÃƒÂ©servation CONFIRMED n'est disponible pour l'ÃƒÂ©cran ${screenId}.`
        );
      }

      if (
        reservation.reservedSeconds !==
        expectedReservedSeconds
      ) {
        throw new Error(
          `La rÃƒÂ©servation de l'ÃƒÂ©cran ${screenId} est incohÃƒÂ©rente : ${reservation.reservedSeconds}s rÃƒÂ©servÃƒÂ©es, ${expectedReservedSeconds}s attendues.`
        );
      }
    }

    /*
     * La campagne devient ACTIVE avant la rÃƒÂ©gÃƒÂ©nÃƒÂ©ration afin que
     * regenerate() puisse la sÃƒÂ©lectionner comme campagne ÃƒÂ©ligible.
     *
     * Si regenerate() ÃƒÂ©choue, toute la transaction est annulÃƒÂ©e :
     * la campagne reste donc SCHEDULED et l'ancienne playlist
     * reste ACTIVE.
     */
    await tx.campaign.update({
      where: {
        id: currentCampaign.id,
      },
      data: {
        status: "ACTIVE",
      },
    });

    for (const screenId of screenIds) {
      console.log("[activateCampaign] BEFORE REGENERATE", {
        campaignId: campaign.id,
        screenId,
      });

      await regenerate(screenId, tx);

      console.log("[activateCampaign] AFTER REGENERATE", {
        campaignId: campaign.id,
        screenId,
      });
    }

    console.log("[activateCampaign] TRANSACTION BODY COMPLETE", {
      campaignId: campaign.id,
    });
  });

  revalidatePath("/admin/campaigns");
  revalidatePath("/advertiser/campaigns");
  revalidatePath("/admin/playlists");
}
export async function reactivateCampaign(
  id: string
) {
  console.log("[reactivateCampaign] START", id);
  const { campaign } =
    await getAuthorizedCampaign(id);

  console.log("[reactivateCampaign] AUTHORIZED", {
    id,
    status: campaign.status,
    mediaCount: campaign.campaignMedia.length,
    screenCount: campaign.campaignScreens.length,
  });

  if (campaign.status !== "PAUSED") {
    throw new Error(
      "Seules les campagnes en pause peuvent etre reactivees."
    );
  }

  if (campaign.campaignMedia.length === 0) {
    throw new Error(
      "La campagne doit contenir au moins un media."
    );
  }

  const unapprovedMedia =
    campaign.campaignMedia.find(
      (campaignMedia) =>
        campaignMedia.media.status !==
        "APPROVED"
    );

  if (unapprovedMedia) {
    throw new Error(
      `Le media "${unapprovedMedia.media.name}" n'est pas approuve.`
    );
  }

  if (campaign.campaignScreens.length === 0) {
    throw new Error(
      "La campagne doit contenir au moins un ecran."
    );
  }

  await prisma.$transaction(async (tx) => {
    const currentCampaign =
      await tx.campaign.findUnique({
        where: {
          id: campaign.id,
        },
        select: {
          id: true,
          status: true,
          spotDuration: true,
          frequencyPerLoop: true,
          endDate: true,
          startDate: true,
        },
      });

    if (!currentCampaign) {
      throw new Error(
        "Campagne introuvable."
      );
    }

    console.log("[reactivateCampaign] CURRENT CAMPAIGN", {
      status: currentCampaign.status,
      startDate: currentCampaign.startDate,
      endDate: currentCampaign.endDate,
    });

    if (currentCampaign.status !== "PAUSED") {
      throw new Error(
        "La campagne n'est plus en pause ou ne peut plus etre reactivee."
      );
    }

    const today = new Date();
    const todayUtc = new Date(
      Date.UTC(
        today.getUTCFullYear(),
        today.getUTCMonth(),
        today.getUTCDate()
      )
    );

    if (currentCampaign.startDate > todayUtc) {
      throw new Error(
        "La campagne ne peut pas etre reactivee avant sa date de debut."
      );
    }

    if (currentCampaign.endDate <= todayUtc) {
      throw new Error(
        "La campagne ne peut pas etre reactivee car sa date de fin est depassee."
      );
    }

    const screenIds = [
      ...new Set(
        campaign.campaignScreens
          .filter(
            (campaignScreen) =>
              campaignScreen.status === "ACTIVE"
          )
          .map(
            (campaignScreen) =>
              campaignScreen.screenId
          )
      ),
    ].sort();

    console.log("[reactivateCampaign] SCREEN IDS", screenIds);

    /*
     * Meme ordre de verrouillage que reserve() et le cron.
     */
    for (const screenId of screenIds) {
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(
          hashtextextended(${screenId}, 0)
        )
      `;
    }

    /*
     * Une campagne PAUSED conserve ses reservations CONFIRMED.
     * On verifie leur presence et leur coherence avant de reactiver
     * afin que ACTIVE implique toujours une allocation d'inventaire valide.
     */
    const reservations =
      await tx.inventoryReservation.findMany({
        where: {
          campaignId: currentCampaign.id,
          screenId: {
            in: screenIds,
          },
          status: "CONFIRMED",
          startDate: {
            lt: currentCampaign.endDate,
          },
          endDate: {
            gt: currentCampaign.startDate,
          },
        },
        select: {
          id: true,
          screenId: true,
          reservedSeconds: true,
        },
      });

    const reservationByScreen =
      new Map(
        reservations.map(
          (reservation) => [
            reservation.screenId,
            reservation,
          ]
        )
      );

    const expectedReservedSeconds =
      currentCampaign.spotDuration *
      currentCampaign.frequencyPerLoop;

    for (const screenId of screenIds) {
      const reservation =
        reservationByScreen.get(screenId);

      if (!reservation) {
        throw new Error(
          `Aucune rÃƒÂ©servation CONFIRMED n'est disponible pour l'ÃƒÂ©cran ${screenId}.`
        );
      }

      if (
        reservation.reservedSeconds !==
        expectedReservedSeconds
      ) {
        throw new Error(
          `La rÃƒÂ©servation de l'ÃƒÂ©cran ${screenId} est incohÃƒÂ©rente : ${reservation.reservedSeconds}s rÃƒÂ©servÃƒÂ©es, ${expectedReservedSeconds}s attendues.`
        );
      }
    }

    console.log("[reactivateCampaign] VALIDATION OK", {
      expectedReservedSeconds,
    });

    /*
     * La campagne doit etre ACTIVE avant regenerate().
     */
    console.log("[reactivateCampaign] BEFORE CAMPAIGN UPDATE", {
      campaignId: campaign.id,
      currentStatus: currentCampaign.status,
    });

    await tx.campaign.update({
      where: {
        id: campaign.id,
      },
      data: {
        status: "ACTIVE",
      },
    });

    console.log("[reactivateCampaign] AFTER CAMPAIGN UPDATE", {
      campaignId: campaign.id,
      status: "ACTIVE",
    });

    /*
     * regenerate() construit la playlist depuis les reservations
     * CONFIRMED, et non directement depuis CampaignMedia.
     */
    for (const screenId of screenIds) {
      console.log("[reactivateCampaign] BEFORE REGENERATE", {
        campaignId: campaign.id,
        screenId,
      });

      await regenerate(screenId, tx);

      console.log("[reactivateCampaign] AFTER REGENERATE", {
        campaignId: campaign.id,
        screenId,
      });
    }

    console.log("[reactivateCampaign] TRANSACTION BODY COMPLETE", {
      campaignId: campaign.id,
    });
  });

  revalidatePath("/admin/campaigns");
  revalidatePath("/advertiser/campaigns");
  revalidatePath("/admin/playlists");
}

export async function deleteMedia(
  id: string
) {
  const user = await requireAuth();

  if (!id) {
    throw new Error("MÃƒÂ©dia introuvable.");
  }

  const media = await prisma.media.findUnique({
    where: {
      id,
    },
  });

  if (!media) {
    throw new Error("MÃƒÂ©dia introuvable.");
  }

  // Seuls ADMIN et OPERATOR peuvent supprimer un mÃƒÂ©dia depuis l'administration.
  if (
    user.role !== "ADMIN" &&
    user.role !== "OPERATOR"
  ) {
    throw new Error(
      "Vous n'avez pas l'autorisation de supprimer ce mÃƒÂ©dia."
    );
  }

  const playbackLogs = await prisma.playbackLog.count({
    where: { mediaId: id },
  });

  if (playbackLogs > 0) {
    throw new Error(
      "M\u00e9dia avec historique de diffusion : suppression impossible."
    );
  }

  await prisma.media.delete({
    where: {
      id,
    },
  });

  revalidatePath("/admin/media");
  revalidatePath("/advertiser/media");
}

export async function approveMedia(
  id: string
) {
  const user = await requireAuth();

  if (
    user.role !== "ADMIN" &&
    user.role !== "OPERATOR"
  ) {
    throw new Error(
      "Vous n'avez pas l'autorisation d'approuver un mÃƒÂ©dia."
    );
  }

  if (!id) {
    throw new Error("MÃƒÂ©dia introuvable.");
  }

  const media = await prisma.media.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
    },
  });

  if (!media) {
    throw new Error("MÃƒÂ©dia introuvable.");
  }

  await prisma.media.update({
    where: {
      id,
    },
    data: {
      status: "APPROVED",
    },
  });

  revalidatePath("/admin/media");
  revalidatePath("/advertiser/media");
}


export async function rejectMedia(
  id: string
) {
  const user = await requireAuth();

  if (
    user.role !== "ADMIN" &&
    user.role !== "OPERATOR"
  ) {
    throw new Error(
      "Vous n'avez pas l'autorisation de rejeter un mÃƒÂ©dia."
    );
  }

  if (!id) {
    throw new Error("MÃƒÂ©dia introuvable.");
  }

  const media = await prisma.media.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
    },
  });

  if (!media) {
    throw new Error("MÃƒÂ©dia introuvable.");
  }

  await prisma.media.update({
    where: {
      id,
    },
    data: {
      status: "REJECTED",
    },
  });

  revalidatePath("/admin/media");
  revalidatePath("/advertiser/media");
}

// ============================================================================
// CONTRATS PARTENAIRES
// ============================================================================

export async function deleteContract(contractId: string) {
  await requireAdmin();

  if (!contractId) {
    throw new Error("Le contrat est requis.");
  }

  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    select: { id: true },
  });

  if (!contract) {
    throw new Error("Contrat introuvable.");
  }

  await prisma.contract.delete({
    where: { id: contractId },
  });

  revalidatePath("/admin/contracts");
  revalidatePath("/partner/contracts");

  redirect("/admin/contracts");
}
export async function updateContract(
  contractId: string,
  formData: FormData
) {
  await requireAdmin();

  if (!contractId) {
    throw new Error("Le contrat est requis.");
  }

  const partnerId = String(formData.get("partnerId") ?? "").trim();
  const screenIdValue = String(formData.get("screenId") ?? "").trim();
  const startDateValue = String(formData.get("startDate") ?? "").trim();
  const endDateValue = String(formData.get("endDate") ?? "").trim();
  const monthlyAmountValue = String(
    formData.get("monthlyAmount") ?? ""
  ).trim();
  const statusValue = String(formData.get("status") ?? "DRAFT").trim();
  const documentUrlValue = String(
    formData.get("documentUrl") ?? ""
  ).trim();

  if (!partnerId) {
    throw new Error("Le partenaire est requis.");
  }

  if (!startDateValue || !endDateValue) {
    throw new Error("Les dates de dÃƒÂ©but et de fin sont requises.");
  }

  const startDate = new Date(`${startDateValue}T00:00:00`);
  const endDate = new Date(`${endDateValue}T00:00:00`);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new Error("Les dates du contrat sont invalides.");
  }

  if (endDate < startDate) {
    throw new Error(
      "La date de fin doit être strictement postérieure à la date de début."
    );
  }

  const monthlyAmount = Number(monthlyAmountValue);

  if (!Number.isFinite(monthlyAmount) || monthlyAmount < 0) {
    throw new Error("Le montant mensuel est invalide.");
  }

  const validStatuses = [
    "DRAFT",
    "ACTIVE",
    "EXPIRED",
    "TERMINATED",
  ] as const;

  if (
    !validStatuses.includes(
      statusValue as (typeof validStatuses)[number]
    )
  ) {
    throw new Error("Le statut du contrat est invalide.");
  }

  if (documentUrlValue) {
    try {
      const documentUrl = new URL(documentUrlValue);

      if (!["http:", "https:"].includes(documentUrl.protocol)) {
        throw new Error("URL invalide.");
      }
    } catch {
      throw new Error("L'URL du document est invalide.");
    }
  }

  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    select: { id: true },
  });

  if (!contract) {
    throw new Error("Contrat introuvable.");
  }

  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
    select: { id: true },
  });

  if (!partner) {
    throw new Error("Partenaire introuvable.");
  }

  if (screenIdValue) {
    const screen = await prisma.screen.findUnique({
      where: { id: screenIdValue },
      select: { id: true },
    });

    if (!screen) {
      throw new Error("Ãƒâ€°cran introuvable.");
    }
  }

  await prisma.contract.update({
    where: { id: contractId },
    data: {
      partnerId,
      screenId: screenIdValue || null,
      startDate,
      endDate,
      monthlyAmount,
      status: statusValue as (typeof validStatuses)[number],
      documentUrl: documentUrlValue || null,
    },
  });

  revalidatePath("/admin/contracts");
  revalidatePath(`/admin/contracts/${contractId}/edit`);
  revalidatePath("/partner/contracts");

  redirect("/admin/contracts");
}
export async function updateContractStatus(
  contractId: string,
  status: "DRAFT" | "ACTIVE" | "EXPIRED" | "TERMINATED"
) {
  await requireAdmin();

  if (!contractId) {
    throw new Error("Le contrat est requis.");
  }

  const validStatuses = [
    "DRAFT",
    "ACTIVE",
    "EXPIRED",
    "TERMINATED",
  ] as const;

  if (!validStatuses.includes(status)) {
    throw new Error("Le statut du contrat est invalide.");
  }

  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    select: { id: true },
  });

  if (!contract) {
    throw new Error("Contrat introuvable.");
  }

  await prisma.contract.update({
    where: { id: contractId },
    data: { status },
  });

  revalidatePath("/admin/contracts");
  revalidatePath("/partner/contracts");
}
export async function createContract(formData: FormData) {
  await requireAdmin();

  const partnerId = String(formData.get("partnerId") ?? "").trim();
  const screenIdValue = String(formData.get("screenId") ?? "").trim();
  const startDateValue = String(formData.get("startDate") ?? "").trim();
  const endDateValue = String(formData.get("endDate") ?? "").trim();
  const monthlyAmountValue = String(
    formData.get("monthlyAmount") ?? ""
  ).trim();
  const statusValue = String(formData.get("status") ?? "DRAFT").trim();
  const documentUrlValue = String(
    formData.get("documentUrl") ?? ""
  ).trim();

  if (!partnerId) {
    throw new Error("Le partenaire est requis.");
  }

  if (!startDateValue || !endDateValue) {
    throw new Error("Les dates de dÃƒÂ©but et de fin sont requises.");
  }

  const startDate = new Date(`${startDateValue}T00:00:00`);
  const endDate = new Date(`${endDateValue}T00:00:00`);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new Error("Les dates du contrat sont invalides.");
  }

  if (endDate < startDate) {
    throw new Error(
      "La date de fin doit être strictement postérieure à la date de début."
    );
  }

  const monthlyAmount = Number(monthlyAmountValue);

  if (!Number.isFinite(monthlyAmount) || monthlyAmount < 0) {
    throw new Error("Le montant mensuel est invalide.");
  }

  const validStatuses = [
    "DRAFT",
    "ACTIVE",
    "EXPIRED",
    "TERMINATED",
  ] as const;

  if (
    !validStatuses.includes(
      statusValue as (typeof validStatuses)[number]
    )
  ) {
    throw new Error("Le statut du contrat est invalide.");
  }

  if (documentUrlValue) {
    try {
      const documentUrl = new URL(documentUrlValue);

      if (!["http:", "https:"].includes(documentUrl.protocol)) {
        throw new Error("URL invalide.");
      }
    } catch {
      throw new Error("L'URL du document est invalide.");
    }
  }

  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
    select: { id: true },
  });

  if (!partner) {
    throw new Error("Partenaire introuvable.");
  }

  if (screenIdValue) {
    const screen = await prisma.screen.findUnique({
      where: { id: screenIdValue },
      select: { id: true },
    });

    if (!screen) {
      throw new Error("Ãƒâ€°cran introuvable.");
    }
  }

  await prisma.contract.create({
    data: {
      partnerId,
      screenId: screenIdValue || null,
      startDate,
      endDate,
      monthlyAmount,
      status: statusValue as (typeof validStatuses)[number],
      documentUrl: documentUrlValue || null,
    },
  });

  revalidatePath("/admin/contracts");
  revalidatePath("/partner/contracts");

  redirect("/admin/contracts");
}























export async function updateAdvertiserStatus(
  advertiserId: string,
  status: "ACTIVE" | "SUSPENDED" | "PENDING"
) {
  await requireAdmin();

  if (!advertiserId) {
    throw new Error("L'annonceur est requis.");
  }

  const validStatuses = [
    "ACTIVE",
    "SUSPENDED",
    "PENDING",
  ] as const;

  if (!validStatuses.includes(status)) {
    throw new Error("Le statut de l'annonceur est invalide.");
  }

  const advertiser = await prisma.advertiser.findUnique({
    where: { id: advertiserId },
    select: {
      id: true,
      status: true,
    },
  });

  if (!advertiser) {
    throw new Error("Annonceur introuvable.");
  }

  await prisma.advertiser.update({
    where: { id: advertiserId },
    data: { status },
  });

  revalidatePath("/admin/advertisers");
}

