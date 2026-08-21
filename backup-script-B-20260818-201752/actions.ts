"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdvertiser } from "@/lib/permissions";

// ============================================================================
// ZONES
// ============================================================================

export async function createZone(formData: FormData) {
  const name = formData.get("name") as string;
  const city = formData.get("city") as string;
  const district = formData.get("district") as string;
  const description = formData.get("description") as string;
  const latitude = formData.get("latitude")
    ? parseFloat(formData.get("latitude") as string)
    : null;
  const longitude = formData.get("longitude")
    ? parseFloat(formData.get("longitude") as string)
    : null;

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

export async function updateZone(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const city = formData.get("city") as string;
  const district = formData.get("district") as string;
  const description = formData.get("description") as string;
  const latitude = formData.get("latitude")
    ? parseFloat(formData.get("latitude") as string)
    : null;
  const longitude = formData.get("longitude")
    ? parseFloat(formData.get("longitude") as string)
    : null;

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
  await prisma.zone.delete({ where: { id } });
  revalidatePath("/admin/zones");
}

// ============================================================================
// PARTNERS
// ============================================================================

export async function createPartner(formData: FormData) {
  const businessName = formData.get("businessName") as string;
  const ownerName = formData.get("ownerName") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const businessType = formData.get("businessType") as string;
  const address = formData.get("address") as string;
  const city = formData.get("city") as string;

  await prisma.partner.create({
    data: {
      businessName,
      ownerName: ownerName || null,
      phone,
      email: email || null,
      businessType: businessType || null,
      address: address || null,
      city: city || "Dakar",
      userId: "temp-user-id",
    },
  });

  revalidatePath("/admin/partners");
  redirect("/admin/partners");
}

export async function deletePartner(id: string) {
  await prisma.partner.delete({ where: { id } });
  revalidatePath("/admin/partners");
}

// ============================================================================
// LOCATIONS
// ============================================================================

export async function createLocation(formData: FormData) {
  const partnerId = formData.get("partnerId") as string;
  const name = formData.get("name") as string;
  const address = formData.get("address") as string;
  const city = formData.get("city") as string;
  const district = formData.get("district") as string;
  const latitude = formData.get("latitude")
    ? parseFloat(formData.get("latitude") as string)
    : null;
  const longitude = formData.get("longitude")
    ? parseFloat(formData.get("longitude") as string)
    : null;

  await prisma.location.create({
    data: {
      partnerId,
      name,
      address,
      city: city || "Dakar",
      district: district || null,
      latitude,
      longitude,
    },
  });

  revalidatePath("/admin/locations");
  redirect("/admin/locations");
}

export async function deleteLocation(id: string) {
  await prisma.location.delete({ where: { id } });
  revalidatePath("/admin/locations");
}

// ============================================================================
// SCREENS
// ============================================================================

export async function createScreen(formData: FormData) {
  const locationId = formData.get("locationId") as string;
  const zoneId = formData.get("zoneId") as string;
  const screenCode = formData.get("screenCode") as string;
  const name = formData.get("name") as string;
  const resolution = formData.get("resolution") as string;
  const orientation = formData.get("orientation") as string;
  const monthlyPartnerFee =
    parseFloat(formData.get("monthlyPartnerFee") as string) || 20000;
  const inventoryLoopSeconds =
    parseInt(formData.get("inventoryLoopSeconds") as string) || 120;

  await prisma.screen.create({
    data: {
      locationId,
      zoneId: zoneId || null,
      screenCode,
      name: name || null,
      resolution: resolution || "1920x1080",
      orientation: orientation || "landscape",
      monthlyPartnerFee,
      inventoryLoopSeconds,
    },
  });

  revalidatePath("/admin/screens");
  redirect("/admin/screens");
}

export async function deleteScreen(id: string) {
  await prisma.screen.delete({ where: { id } });
  revalidatePath("/admin/screens");
}

// ============================================================================
// PLAYERS
// ============================================================================

export async function createPlayer(formData: FormData) {
  const screenId = formData.get("screenId") as string;
  const deviceId = formData.get("deviceId") as string;
  const serialNumber = formData.get("serialNumber") as string;
  const appVersion = formData.get("appVersion") as string;

  await prisma.player.create({
    data: {
      screenId: screenId || null,
      deviceId,
      serialNumber: serialNumber || null,
      appVersion: appVersion || "1.0.0",
    },
  });

  revalidatePath("/admin/players");
  redirect("/admin/players");
}

export async function deletePlayer(id: string) {
  await prisma.player.delete({ where: { id } });
  revalidatePath("/admin/players");
}

// ============================================================================
// CAMPAIGNS
// ============================================================================

export async function createCampaign(formData: FormData) {
  // --------------------------------------------------------------------------
  // L'annonceur doit être celui de l'utilisateur actuellement connecté.
  // Aucun "Annonceur Temporaire" n'est créé.
  // --------------------------------------------------------------------------
  const { advertiser } = await requireAdvertiser();

  const name = formData.get("name") as string;
  const objective = formData.get("objective") as string;

  const startDateValue = formData.get("startDate") as string;
  const endDateValue = formData.get("endDate") as string;

  const startDate = new Date(startDateValue);
  const endDate = new Date(endDateValue);

  const spotDuration =
    parseInt(formData.get("spotDuration") as string) || 15;

  const frequencyPerLoop =
    parseInt(formData.get("frequencyPerLoop") as string) || 1;

  const screenIdsValue = formData.get("screenIds") as string;

  const screenIds = screenIdsValue
    ? (JSON.parse(screenIdsValue) as string[])
    : [];

  const estimatedPrice =
    parseFloat(formData.get("estimatedPrice") as string) || 0;

  if (!name) {
    throw new Error("Le nom de la campagne est requis.");
  }

  if (Number.isNaN(startDate.getTime())) {
    throw new Error("La date de début est invalide.");
  }

  if (Number.isNaN(endDate.getTime())) {
    throw new Error("La date de fin est invalide.");
  }

  if (endDate <= startDate) {
    throw new Error(
      "La date de fin doit être postérieure à la date de début."
    );
  }

  const campaign = await prisma.campaign.create({
    data: {
      advertiserId: advertiser.id,
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

  for (const screenId of screenIds) {
    await prisma.campaignScreen.create({
      data: {
        campaignId: campaign.id,
        screenId,
        reservedSeconds: spotDuration,
        status: "ACTIVE",
      },
    });
  }

  revalidatePath("/admin/campaigns");
  revalidatePath("/advertiser/campaigns");

  redirect("/admin/campaigns");
}

export async function deleteCampaign(id: string) {
  const { advertiser } = await requireAdvertiser();

  const campaign = await prisma.campaign.findFirst({
    where: {
      id,
      advertiserId: advertiser.id,
    },
  });

  if (!campaign) {
    throw new Error("Campagne introuvable.");
  }

  await prisma.campaign.delete({
    where: { id },
  });

  revalidatePath("/admin/campaigns");
  revalidatePath("/advertiser/campaigns");
}

// ============================================================================
// CAMPAIGN ACTIVATION
// ============================================================================

export async function activateCampaign(id: string) {
  const { advertiser } = await requireAdvertiser();

  const campaign = await prisma.campaign.findFirst({
    where: {
      id,
      advertiserId: advertiser.id,
    },
    include: {
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

  for (const cs of campaign.campaignScreens) {
    const lastPlaylist = await prisma.playlist.findFirst({
      where: {
        screenId: cs.screenId,
      },
      orderBy: {
        version: "desc",
      },
    });

    const newVersion = (lastPlaylist?.version || 0) + 1;

    const playlist = await prisma.playlist.create({
      data: {
        screenId: cs.screenId,
        version: newVersion,
        status: "ACTIVE",
        publishedAt: new Date(),
      },
    });

    for (const cm of campaign.campaignMedia) {
      await prisma.playlistItem.create({
        data: {
          playlistId: playlist.id,
          campaignId: campaign.id,
          mediaId: cm.mediaId,
          position: cm.displayOrder,
          durationSeconds: cm.durationSeconds,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
        },
      });
    }
  }

  await prisma.campaign.update({
    where: {
      id: campaign.id,
    },
    data: {
      status: "ACTIVE",
    },
  });

  revalidatePath("/admin/campaigns");
  revalidatePath("/advertiser/campaigns");
}

// ============================================================================
// MEDIA
// ============================================================================

export async function createMedia(formData: FormData) {
  // --------------------------------------------------------------------------
  // Même logique que pour les campagnes :
  // le média appartient à l'annonceur connecté.
  // --------------------------------------------------------------------------
  const { advertiser } = await requireAdvertiser();

  const name = formData.get("name") as string;
  const fileUrl = formData.get("fileUrl") as string;
  const fileType = formData.get("fileType") as string;

  const durationSeconds =
    parseInt(formData.get("durationSeconds") as string) || 15;

  if (!name) {
    throw new Error("Le nom du média est requis.");
  }

  if (!fileUrl) {
    throw new Error("L'URL du média est requise.");
  }

  if (!fileType) {
    throw new Error("Le type du média est requis.");
  }

  await prisma.media.create({
    data: {
      advertiserId: advertiser.id,
      name,
      fileUrl,
      fileType,
      mimeType: fileType.startsWith("video")
        ? "video/mp4"
        : "image/jpeg",
      durationSeconds,
      status: "APPROVED",
    },
  });

  revalidatePath("/admin/media");
  revalidatePath("/advertiser/media");

  redirect("/admin/media");
}

export async function deleteMedia(id: string) {
  const { advertiser } = await requireAdvertiser();

  const media = await prisma.media.findFirst({
    where: {
      id,
      advertiserId: advertiser.id,
    },
  });

  if (!media) {
    throw new Error("Média introuvable.");
  }

  await prisma.media.delete({
    where: {
      id,
    },
  });

  revalidatePath("/admin/media");
  revalidatePath("/advertiser/media");
}