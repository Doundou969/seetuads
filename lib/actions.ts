"use server";

import { randomUUID, randomInt } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  requireAdvertiser,
  requireAuth,
  requireAdmin,
} from "@/lib/permissions";

// ============================================================================
// ZONES
// ============================================================================

export async function createZone(formData: FormData) {
  await requireAuth();

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
  await requireAuth();

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
  await requireAuth();

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
  await requireAuth();

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
      "Le tÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©lÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©phone est requis."
    );
  }

  // --------------------------------------------------------------------------
  // CRÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â°ATION D'UN UTILISATEUR PARTENAIRE
  // --------------------------------------------------------------------------
  //
  // Partner.userId est une clÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â© ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©trangÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨re obligatoire vers users.id.
  // On crÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©e donc d'abord un vrai User, puis on utilise son id pour Partner.
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
  await requireAuth();

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
  await requireAuth();

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
  await requireAuth();

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
  await requireAuth();

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
    throw new Error("Le code ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©cran est requis.");
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
  await requireAuth();

  if (!id) {
    throw new Error("ÃƒÆ’Ã¢â‚¬Â°cran introuvable.");
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
  await requireAuth();

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
  await requireAuth();

  if (!id) {
    throw new Error("Player introuvable.");
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
    throw new Error("La date de dÃƒÆ’Ã‚Â©but est invalide.");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(endDateValue)) {
    throw new Error("La date de fin est invalide.");
  }

  const startDate = new Date(`${startDateValue}T00:00:00`);
  const endDate = new Date(`${endDateValue}T00:00:00`);

  if (Number.isNaN(startDate.getTime())) {
    throw new Error("La date de dÃƒÆ’Ã‚Â©but est invalide.");
  }

  if (Number.isNaN(endDate.getTime())) {
    throw new Error("La date de fin est invalide.");
  }

  if (endDate < startDate) {
    throw new Error(
      "La date de fin doit ÃƒÆ’Ã‚Âªtre postÃƒÆ’Ã‚Â©rieure ou ÃƒÆ’Ã‚Â©gale ÃƒÆ’Ã‚Â  la date de dÃƒÆ’Ã‚Â©but."
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
      "La durÃƒÆ’Ã‚Â©e du spot doit ÃƒÆ’Ã‚Âªtre comprise entre 5 et 60 secondes."
    );
  }

  if (
    !Number.isInteger(frequencyPerLoop) ||
    frequencyPerLoop < 1 ||
    frequencyPerLoop > 10
  ) {
    throw new Error(
      "La frÃƒÆ’Ã‚Â©quence doit ÃƒÆ’Ã‚Âªtre comprise entre 1 et 10."
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
        `La sÃƒÆ’Ã‚Â©lection des ${label} est invalide.`
      );
    }
  };

  const screenIds = parseIdList(
    String(formData.get("screenIds") ?? ""),
    "ÃƒÆ’Ã‚Â©crans"
  );

  const mediaIds = parseIdList(
    String(formData.get("mediaIds") ?? ""),
    "mÃƒÆ’Ã‚Â©dias"
  );

  if (!name) {
    throw new Error("Le nom de la campagne est requis.");
  }

  if (screenIds.length === 0) {
    throw new Error(
      "La campagne doit contenir au moins un ÃƒÆ’Ã‚Â©cran."
    );
  }

  if (mediaIds.length === 0) {
    throw new Error(
      "La campagne doit contenir au moins un mÃƒÆ’Ã‚Â©dia."
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
        "Veuillez sÃƒÆ’Ã‚Â©lectionner un annonceur."
      );
    }

    advertiserId = selectedAdvertiserId;
  } else {
    if (!user.advertiser) {
      throw new Error(
        "AccÃƒÆ’Ã‚Â¨s rÃƒÆ’Ã‚Â©servÃƒÆ’Ã‚Â© aux annonceurs."
      );
    }

    advertiserId = user.advertiser.id;
  }

  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  const numberOfDays = Math.max(
    1,
    Math.ceil(
      (endDate.getTime() - startDate.getTime()) /
        MS_PER_DAY
    )
  );

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
        "L'annonceur sÃƒÆ’Ã‚Â©lectionnÃƒÆ’Ã‚Â© est introuvable ou inactif."
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
        "Un ou plusieurs mÃƒÆ’Ã‚Â©dias sÃƒÆ’Ã‚Â©lectionnÃƒÆ’Ã‚Â©s sont introuvables, appartiennent ÃƒÆ’Ã‚Â  un autre annonceur ou ne sont pas approuvÃƒÆ’Ã‚Â©s."
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
        "Un ou plusieurs ÃƒÆ’Ã‚Â©crans sÃƒÆ’Ã‚Â©lectionnÃƒÆ’Ã‚Â©s sont introuvables."
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
          `Aucune rÃƒÆ’Ã‚Â¨gle de tarification active n'est dÃƒÆ’Ã‚Â©finie pour l'ÃƒÆ’Ã‚Â©cran sÃƒÆ’Ã‚Â©lectionnÃƒÆ’Ã‚Â©.`
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
          status: "DRAFT",
        },
      });

    await tx.campaignScreen.createMany({
      data: screenIds.map((screenId) => ({
        campaignId: campaign.id,
        screenId,
        reservedSeconds: spotDuration,
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
  // accÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨s aux campagnes de tous les annonceurs.
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
  // accÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨s uniquement ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  ses propres campagnes.
  if (!user.advertiser) {
    throw new Error(
      "AccÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨s rÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©servÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â© aux annonceurs."
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
      "Le nom du mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©dia est requis."
    );
  }

  if (!fileUrl) {
    throw new Error(
      "L'URL du mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©dia est requise."
    );
  }

  if (
    fileType !== "image" &&
    fileType !== "video"
  ) {
    throw new Error(
      "Le type du mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©dia est invalide."
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
      `Le type MIME du mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©dia est invalide : ${
        mimeType || "non renseignÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©"
      }.`
    );
  }

  if (
    !Number.isFinite(durationSeconds) ||
    durationSeconds < 5 ||
    durationSeconds > 60
  ) {
    throw new Error(
      "La durÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©e doit ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âªtre comprise entre 5 et 60 secondes."
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
      "La largeur du mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©dia est invalide."
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
      "La hauteur du mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©dia est invalide."
    );
  }

  if (
    fileSizeBytes !== null &&
    fileSizeBytes <= BigInt(0)
  ) {
    throw new Error(
      "La taille du mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©dia est invalide."
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
        "Veuillez sÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©lectionner l'annonceur propriÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©taire du mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©dia."
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
        "L'annonceur sÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©lectionnÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â© est introuvable ou inactif."
      );
    }

    advertiserId = advertiser.id;
  } else {
    // ANNONCEUR
    if (!user.advertiser) {
      throw new Error(
        "AccÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨s rÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©servÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â© aux annonceurs."
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

      // Le mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©dia attend la validation admin
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
  const { campaign } =
    await getAuthorizedCampaign(id);

  if (campaign.status !== "ACTIVE") {
    throw new Error(
      "Seules les campagnes actives peuvent etre desactivees."
    );
  }

  // Verifier et effectuer toute la transition dans une transaction.
  await prisma.$transaction(async (tx) => {
    const currentCampaign =
      await tx.campaign.findUnique({
        where: {
          id: campaign.id,
        },
        select: {
          status: true,
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

    // Trier les ecrans pour eviter les deadlocks
    // lorsque plusieurs campagnes sont modifiees simultanement.
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

    for (const screenId of screenIds) {
      // Verrou transactionnel par ecran.
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(
          hashtextextended(${screenId}, 0)
        )
      `;

      // L'ancienne playlist ne doit plus etre servie au player.
      await tx.playlist.updateMany({
        where: {
          screenId,
          status: "ACTIVE",
        },
        data: {
          status: "INACTIVE",
        },
      });

      // Recuperer les autres campagnes encore actives sur cet ecran.
      const activeCampaigns =
        await tx.campaign.findMany({
          where: {
            status: "ACTIVE",
            id: {
              not: campaign.id,
            },
            campaignScreens: {
              some: {
                screenId,
                status: "ACTIVE",
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
          include: {
            campaignMedia: {
              orderBy: {
                displayOrder: "asc",
              },
            },
          },
        });

      // Determiner la prochaine version de playlist.
      const lastPlaylist =
        await tx.playlist.findFirst({
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

      const newVersion =
        (lastPlaylist?.version ?? 0) + 1;

      const playlist =
        await tx.playlist.create({
          data: {
            screenId,
            version: newVersion,
            status: "ACTIVE",
            publishedAt: new Date(),
          },
        });

      // Reconstruire la playlist uniquement avec
      // les campagnes qui restent ACTIVE.
      let position = 1;

      for (const activeCampaign of activeCampaigns) {
        for (const campaignMedia of activeCampaign.campaignMedia) {
          await tx.playlistItem.create({
            data: {
              playlistId: playlist.id,
              campaignId: activeCampaign.id,
              mediaId: campaignMedia.mediaId,
              position,
              durationSeconds:
                campaignMedia.durationSeconds,
              startDate: activeCampaign.startDate,
              endDate: activeCampaign.endDate,
            },
          });

          position++;
        }
      }
    }

    // La campagne est mise en pause apres reconstruction
    // des playlists des ecrans concernes.
    await tx.campaign.update({
      where: {
        id: campaign.id,
      },
      data: {
        status: "PAUSED",
      },
    });
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
      "Une campagne active ne peut pas Ãªtre supprimÃ©e."
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
  const { campaign } =
    await getAuthorizedCampaign(id);

  if (campaign.status !== "DRAFT") {
    throw new Error(
      "Seules les campagnes en brouillon peuvent ÃƒÂªtre activÃƒÂ©es."
    );
  }

  if (
    campaign.campaignMedia.length === 0
  ) {
    throw new Error(
      "La campagne doit contenir au moins un mÃƒÂ©dia."
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
      `Le mÃƒÂ©dia "${unapprovedMedia.media.name}" n'est pas approuvÃƒÂ©.`
    );
  }

  if (
    campaign.campaignScreens.length === 0
  ) {
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
          status: true,
        },
      });

    if (!currentCampaign) {
      throw new Error(
        "Campagne introuvable."
      );
    }

    if (currentCampaign.status !== "DRAFT") {
      throw new Error(
        "La campagne a dÃƒÂ©jÃƒÂ  ÃƒÂ©tÃƒÂ© activÃƒÂ©e ou ne peut plus ÃƒÂªtre activÃƒÂ©e."
      );
    }

    // --------------------------------------------------------------------------
    // CRÃƒâ€°ATION DES PLAYLISTS
    // --------------------------------------------------------------------------

    for (const campaignScreen of campaign.campaignScreens) {
      // Verrou transactionnel par Ã©cran :
      // une seule activation Ã  la fois peut calculer/crÃ©er la prochaine version.
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(
          hashtextextended(${campaignScreen.screenId}, 0)
        )
      `;

      // DÃ©sactiver toutes les anciennes playlists actives de cet Ã©cran.
      await tx.playlist.updateMany({
        where: {
          screenId: campaignScreen.screenId,
          status: "ACTIVE",
        },
        data: {
          status: "INACTIVE",
        },
      });

      // RÃ©cupÃ©rer la derniÃ¨re version aprÃ¨s acquisition du verrou.
      const lastPlaylist = await tx.playlist.findFirst({
        where: {
          screenId: campaignScreen.screenId,
        },
        orderBy: {
          version: "desc",
        },
        select: {
          version: true,
        },
      });

      const newVersion = (lastPlaylist?.version ?? 0) + 1;

      // CrÃ©er la nouvelle playlist ACTIVE.
      const playlist = await tx.playlist.create({
        data: {
          screenId: campaignScreen.screenId,
          version: newVersion,
          status: "ACTIVE",
          publishedAt: new Date(),
        },
      });

      await tx.playlistItem.createMany({
        data: campaign.campaignMedia.map((campaignMedia) => ({
          playlistId: playlist.id,
          campaignId: campaign.id,
          mediaId: campaignMedia.mediaId,
          position: campaignMedia.displayOrder,
          durationSeconds: campaignMedia.durationSeconds,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
        })),
      });
    }

    // --------------------------------------------------------------------------
    // ACTIVATION
    // --------------------------------------------------------------------------

    await tx.campaign.update({
      where: {
        id: campaign.id,
      },
      data: {
        status: "ACTIVE",
      },
    });
  });

  revalidatePath("/admin/campaigns");
  revalidatePath("/advertiser/campaigns");
}
export async function reactivateCampaign(
  id: string
) {
  const { campaign } =
    await getAuthorizedCampaign(id);

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
          status: true,
        },
      });

    if (!currentCampaign) {
      throw new Error(
        "Campagne introuvable."
      );
    }

    if (currentCampaign.status !== "PAUSED") {
      throw new Error(
        "La campagne n'est plus en pause ou ne peut plus etre reactivee."
      );
    }

    // RÃ©activer la campagne dans la transaction.
    // Si une Ã©tape suivante Ã©choue, toute la transaction est annulÃ©e.
    await tx.campaign.update({
      where: {
        id: campaign.id,
      },
      data: {
        status: "ACTIVE",
      },
    });

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

    for (const screenId of screenIds) {
      // Verrou transactionnel par Ã©cran.
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(
          hashtextextended(${screenId}, 0)
        )
      `;

      // DÃ©sactiver l'ancienne playlist ACTIVE.
      await tx.playlist.updateMany({
        where: {
          screenId,
          status: "ACTIVE",
        },
        data: {
          status: "INACTIVE",
        },
      });

      // RÃ©cupÃ©rer TOUTES les campagnes actuellement actives
      // sur cet Ã©cran, y compris celle que nous venons de rÃ©activer.
      const activeCampaigns =
        await tx.campaign.findMany({
          where: {
            status: "ACTIVE",
            campaignScreens: {
              some: {
                screenId,
                status: "ACTIVE",
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
          include: {
            campaignMedia: {
              orderBy: {
                displayOrder: "asc",
              },
            },
          },
        });

      // Calculer la prochaine version aprÃ¨s le verrou.
      const lastPlaylist =
        await tx.playlist.findFirst({
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

      const newVersion =
        (lastPlaylist?.version ?? 0) + 1;

      // CrÃ©er la nouvelle playlist ACTIVE.
      const playlist =
        await tx.playlist.create({
          data: {
            screenId,
            version: newVersion,
            status: "ACTIVE",
            publishedAt: new Date(),
          },
        });

      let position = 1;

      // Reconstruire la playlist avec toutes les campagnes actives.
      for (const activeCampaign of activeCampaigns) {
        for (const campaignMedia of activeCampaign.campaignMedia) {
          await tx.playlistItem.create({
            data: {
              playlistId: playlist.id,
              campaignId: activeCampaign.id,
              mediaId: campaignMedia.mediaId,
              position,
              durationSeconds:
                campaignMedia.durationSeconds,
              startDate:
                activeCampaign.startDate,
              endDate:
                activeCampaign.endDate,
            },
          });

          position++;
        }
      }
    }
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
    throw new Error("MÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©dia introuvable.");
  }

  const media = await prisma.media.findUnique({
    where: {
      id,
    },
  });

  if (!media) {
    throw new Error("MÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©dia introuvable.");
  }

  // Seuls ADMIN et OPERATOR peuvent supprimer un mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©dia depuis l'administration.
  if (
    user.role !== "ADMIN" &&
    user.role !== "OPERATOR"
  ) {
    throw new Error(
      "Vous n'avez pas l'autorisation de supprimer ce mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©dia."
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
      "Vous n'avez pas l'autorisation d'approuver un mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©dia."
    );
  }

  if (!id) {
    throw new Error("MÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©dia introuvable.");
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
    throw new Error("MÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©dia introuvable.");
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
      "Vous n'avez pas l'autorisation de rejeter un mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©dia."
    );
  }

  if (!id) {
    throw new Error("MÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©dia introuvable.");
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
    throw new Error("MÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©dia introuvable.");
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
    throw new Error("Les dates de dÃƒÆ’Ã‚Â©but et de fin sont requises.");
  }

  const startDate = new Date(`${startDateValue}T00:00:00`);
  const endDate = new Date(`${endDateValue}T00:00:00`);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new Error("Les dates du contrat sont invalides.");
  }

  if (endDate < startDate) {
    throw new Error(
      "La date de fin doit ÃƒÆ’Ã‚Âªtre postÃƒÆ’Ã‚Â©rieure ou ÃƒÆ’Ã‚Â©gale ÃƒÆ’Ã‚Â  la date de dÃƒÆ’Ã‚Â©but."
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
      throw new Error("ÃƒÆ’Ã¢â‚¬Â°cran introuvable.");
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
    throw new Error("Les dates de dÃƒÆ’Ã‚Â©but et de fin sont requises.");
  }

  const startDate = new Date(`${startDateValue}T00:00:00`);
  const endDate = new Date(`${endDateValue}T00:00:00`);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new Error("Les dates du contrat sont invalides.");
  }

  if (endDate < startDate) {
    throw new Error(
      "La date de fin doit ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âªtre postÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©rieure ou ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©gale ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  la date de dÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©but."
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
      throw new Error("ÃƒÆ’Ã¢â‚¬Â°cran introuvable.");
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





// ============================================================================
// VALIDATION SIMPLIFIEE (approuve les medias + active en une seule action)
// ============================================================================

export async function approveAndActivateCampaign(id: string) {
  const user = await requireAuth();

  if (user.role !== "ADMIN" && user.role !== "OPERATOR") {
    throw new Error(
      "Seuls les administrateurs peuvent valider une campagne."
    );
  }

  const { campaign } = await getAuthorizedCampaign(id);

  if (campaign.status !== "DRAFT") {
    throw new Error(
      "Seules les campagnes en brouillon peuvent etre activees."
    );
  }

  if (campaign.campaignMedia.length === 0) {
    throw new Error(
      "La campagne doit contenir au moins un media."
    );
  }

  if (campaign.campaignScreens.length === 0) {
    throw new Error(
      "La campagne doit contenir au moins un ecran."
    );
  }

  const rejectedMedia = campaign.campaignMedia.find(
    (campaignMedia) => campaignMedia.media.status === "REJECTED"
  );

  if (rejectedMedia) {
    throw new Error(
      `Le media "${rejectedMedia.media.name}" a ete rejete et doit etre remplace avant d'activer la campagne.`
    );
  }

  const mediaIdsToApprove = campaign.campaignMedia
    .filter((campaignMedia) => campaignMedia.media.status !== "APPROVED")
    .map((campaignMedia) => campaignMedia.mediaId);

  await prisma.$transaction(async (tx) => {
    const currentCampaign = await tx.campaign.findUnique({
      where: { id: campaign.id },
      select: { status: true },
    });

    if (!currentCampaign) {
      throw new Error("Campagne introuvable.");
    }

    if (currentCampaign.status !== "DRAFT") {
      throw new Error(
        "La campagne a deja ete activee ou ne peut plus etre activee."
      );
    }

    if (mediaIdsToApprove.length > 0) {
      await tx.media.updateMany({
        where: { id: { in: mediaIdsToApprove } },
        data: { status: "APPROVED" },
      });
    }

    for (const campaignScreen of campaign.campaignScreens) {
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(
          hashtextextended(${campaignScreen.screenId}, 0)
        )
      `;

      await tx.playlist.updateMany({
        where: {
          screenId: campaignScreen.screenId,
          status: "ACTIVE",
        },
        data: { status: "INACTIVE" },
      });

      const lastPlaylist = await tx.playlist.findFirst({
        where: { screenId: campaignScreen.screenId },
        orderBy: { version: "desc" },
        select: { version: true },
      });

      const newVersion = (lastPlaylist?.version ?? 0) + 1;

      const playlist = await tx.playlist.create({
        data: {
          screenId: campaignScreen.screenId,
          version: newVersion,
          status: "ACTIVE",
          publishedAt: new Date(),
        },
      });

      await tx.playlistItem.createMany({
        data: campaign.campaignMedia.map((campaignMedia) => ({
          playlistId: playlist.id,
          campaignId: campaign.id,
          mediaId: campaignMedia.mediaId,
          position: campaignMedia.displayOrder,
          durationSeconds: campaignMedia.durationSeconds,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
        })),
      });
    }

    await tx.campaign.update({
      where: { id: campaign.id },
      data: { status: "ACTIVE" },
    });
  });

  revalidatePath("/admin/campaigns");
  revalidatePath("/admin/media");
  revalidatePath("/advertiser/campaigns");
  revalidatePath("/advertiser/media");
}
