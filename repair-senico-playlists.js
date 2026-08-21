const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const CAMPAIGN_ID =
  "208ddc29-47f7-4a94-942e-04530e22803a";

async function main() {
  console.log("");
  console.log("========================================");
  console.log(" RÉPARATION DES PLAYLISTS SENICO");
  console.log("========================================");
  console.log("");

  const campaign = await prisma.campaign.findUnique({
    where: {
      id: CAMPAIGN_ID,
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
        orderBy: {
          displayOrder: "asc",
        },
      },
    },
  });

  if (!campaign) {
    throw new Error("Campagne SENICO introuvable.");
  }

  console.log(`Campagne : ${campaign.name}`);
  console.log(`Statut   : ${campaign.status}`);
  console.log(`Écrans   : ${campaign.campaignScreens.length}`);
  console.log(`Médias   : ${campaign.campaignMedia.length}`);
  console.log("");

  if (campaign.campaignScreens.length === 0) {
    throw new Error(
      "La campagne ne contient aucun écran."
    );
  }

  if (campaign.campaignMedia.length === 0) {
    throw new Error(
      "La campagne ne contient aucun média."
    );
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    for (const campaignScreen of campaign.campaignScreens) {
      const screenId = campaignScreen.screenId;

      console.log(
        `Réparation : ${
          campaignScreen.screen.name ||
          campaignScreen.screen.screenCode ||
          screenId
        }`
      );

      // Récupérer les playlists actuellement actives.
      const activePlaylists =
        await tx.playlist.findMany({
          where: {
            screenId,
            status: "ACTIVE",
          },
          include: {
            items: true,
          },
        });

      // Conserver les items des autres campagnes
      // qui sont encore dans leur période de diffusion.
      const existingItems = activePlaylists
        .flatMap((playlist) => playlist.items)
        .filter(
          (item) =>
            item.campaignId !== campaign.id &&
            item.startDate !== null &&
            item.endDate !== null &&
            item.startDate <= now &&
            item.endDate >= now
        )
        .map((item) => ({
          campaignId: item.campaignId,
          mediaId: item.mediaId,
          durationSeconds: item.durationSeconds,
          startDate: item.startDate,
          endDate: item.endDate,
        }));

      // Trouver la dernière version existante.
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

      // Désactiver les anciennes playlists actives.
      await tx.playlist.updateMany({
        where: {
          screenId,
          status: "ACTIVE",
        },
        data: {
          status: "INACTIVE",
        },
      });

      // Construire les items de SENICO.
      const senicoItems =
        campaign.campaignMedia.map(
          (campaignMedia) => ({
            campaignId: campaign.id,
            mediaId: campaignMedia.mediaId,
            durationSeconds:
              campaignMedia.durationSeconds,
            startDate: campaign.startDate,
            endDate: campaign.endDate,
          })
        );

      const allItems = [
        ...existingItems,
        ...senicoItems,
      ];

      // Créer la nouvelle playlist avec tous les items.
      const playlist =
        await tx.playlist.create({
          data: {
            screenId,
            version: newVersion,
            status: "ACTIVE",
            publishedAt: now,
            items: {
              create: allItems.map(
                (item, index) => ({
                  campaignId: item.campaignId,
                  mediaId: item.mediaId,
                  position: index + 1,
                  durationSeconds:
                    item.durationSeconds,
                  startDate: item.startDate,
                  endDate: item.endDate,
                })
              ),
            },
          },
          include: {
            items: true,
          },
        });

      console.log(
        `  Version créée     : ${playlist.version}`
      );

      console.log(
        `  Items conservés   : ${existingItems.length}`
      );

      console.log(
        `  Items SENICO      : ${senicoItems.length}`
      );

      console.log(
        `  Total items       : ${playlist.items.length}`
      );

      console.log("");
    }
  });

  console.log("========================================");
  console.log(" RÉPARATION TERMINÉE AVEC SUCCÈS");
  console.log("========================================");
}

main()
  .catch((error) => {
    console.error("");
    console.error("ERREUR :");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });