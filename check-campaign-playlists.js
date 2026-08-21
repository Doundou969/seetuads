const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const campaign = await prisma.campaign.findFirst({
    where: {
      id: "208ddc29-47f7-4a94-942e-04530e22803a",
    },
    include: {
      campaignScreens: {
        include: {
          screen: {
            include: {
              location: true,
              zone: true,
            },
          },
        },
      },
      campaignMedia: {
        include: {
          media: true,
        },
        orderBy: {
          displayOrder: "asc",
        },
      },
    },
  });

  if (!campaign) {
    console.log("Campagne introuvable.");
    return;
  }

  console.log("\n=== CAMPAGNE ===");
  console.table({
    id: campaign.id,
    name: campaign.name,
    status: campaign.status,
    startDate: campaign.startDate.toISOString(),
    endDate: campaign.endDate.toISOString(),
  });

  console.log("\n=== ÉCRANS ===");
  console.table(
    campaign.campaignScreens.map((cs) => ({
      screenId: cs.screenId,
      screen: cs.screen.name || cs.screen.screenCode,
      location: cs.screen.location?.name || null,
      zone: cs.screen.zone?.name || null,
      status: cs.status,
      reservedSeconds: cs.reservedSeconds,
    }))
  );

  console.log("\n=== MÉDIAS ===");
  console.table(
    campaign.campaignMedia.map((cm) => ({
      mediaId: cm.mediaId,
      name: cm.media.name,
      status: cm.media.status,
      displayOrder: cm.displayOrder,
      durationSeconds: cm.durationSeconds,
    }))
  );

  const screenIds = campaign.campaignScreens.map(
    (cs) => cs.screenId
  );

  const playlists = await prisma.playlist.findMany({
    where: {
      screenId: {
        in: screenIds,
      },
      status: "ACTIVE",
    },
    include: {
      screen: true,
      items: {
        where: {
          campaignId: campaign.id,
        },
        include: {
          media: true,
        },
        orderBy: {
          position: "asc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  console.log("\n=== PLAYLISTS ACTIVES ===");
  console.table(
    playlists.map((playlist) => ({
      playlistId: playlist.id,
      screenId: playlist.screenId,
      screen:
        playlist.screen.name ||
        playlist.screen.screenCode,
      version: playlist.version,
      status: playlist.status,
      items: playlist.items.length,
      publishedAt:
        playlist.publishedAt?.toISOString() || null,
    }))
  );

  console.log("\n=== ITEMS DE PLAYLIST ===");
  console.table(
    playlists.flatMap((playlist) =>
      playlist.items.map((item) => ({
        playlistId: playlist.id,
        screenId: playlist.screenId,
        media: item.media.name,
        position: item.position,
        durationSeconds: item.durationSeconds,
        startDate: item.startDate.toISOString(),
        endDate: item.endDate.toISOString(),
      }))
    )
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
