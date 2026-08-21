const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const CAMPAIGN_ID = "fb734810-d99f-4675-8244-516a722a42ea";

async function main() {
  console.log("");
  console.log("========================================");
  console.log(" RÉPARATION DES PLAYLISTS");
  console.log("========================================");
  console.log("");

  const campaign = await prisma.campaign.findUnique({
    where: {
      id: CAMPAIGN_ID,
    },
    include: {
      campaignScreens: true,
    },
  });

  if (!campaign) {
    throw new Error("Campagne introuvable.");
  }

  console.log(`Campagne : ${campaign.name}`);
  console.log(`Statut   : ${campaign.status}`);
  console.log(`Écrans   : ${campaign.campaignScreens.length}`);
  console.log("");

  if (campaign.status !== "PAUSED") {
    throw new Error(
      "Cette réparation est prévue pour une campagne PAUSED."
    );
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    for (const campaignScreen of campaign.campaignScreens) {
      const screenId = campaignScreen.screenId;

      console.log("----------------------------------------");
      console.log(`Écran : ${screenId}`);

      // Chercher uniquement les campagnes réellement actives
      const activeCampaigns = await tx.campaign.findMany({
        where: {
          status: "ACTIVE",

          campaignScreens: {
            some: {
              screenId,
            },
          },

          startDate: {
            lte: now,
          },

          endDate: {
            gte: now,
          },
        },

        include: {
          campaignMedia: {
            orderBy: {
              displayOrder: "asc",
            },
          },
        },
      });

      console.log(
        `Campagnes actives trouvées : ${activeCampaigns.length}`
      );

      // Construire les items de la nouvelle playlist
      const allItems = activeCampaigns.flatMap(
        (activeCampaign) =>
          activeCampaign.campaignMedia.map(
            (campaignMedia) => ({
              campaignId: activeCampaign.id,
              mediaId: campaignMedia.mediaId,
              durationSeconds:
                campaignMedia.durationSeconds || 15,
              startDate: activeCampaign.startDate,
              endDate: activeCampaign.endDate,
            })
          )
      );

      console.log(
        `Items à publier : ${allItems.length}`
      );

      // Trouver la dernière version
      const lastPlaylist = await tx.playlist.findFirst({
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

      // Désactiver les anciennes playlists actives
      await tx.playlist.updateMany({
        where: {
          screenId,
          status: "ACTIVE",
        },
        data: {
          status: "INACTIVE",
        },
      });

      // Créer la nouvelle playlist
      const newPlaylist = await tx.playlist.create({
        data: {
          screenId,
          version: newVersion,
          status: "ACTIVE",
          publishedAt: now,

          items: {
            create: allItems.map((item, index) => ({
              campaignId: item.campaignId,
              mediaId: item.mediaId,
              position: index + 1,
              durationSeconds:
                item.durationSeconds,
              startDate: item.startDate,
              endDate: item.endDate,
            })),
          },
        },

        include: {
          items: true,
        },
      });

      console.log(
        `Nouvelle playlist : ${newPlaylist.id}`
      );

      console.log(
        `Version           : ${newPlaylist.version}`
      );

      console.log(
        `Nombre d'items    : ${newPlaylist.items.length}`
      );
    }
  });

  console.log("");
  console.log("========================================");
  console.log(" RÉPARATION TERMINÉE AVEC SUCCÈS");
  console.log("========================================");
}

main()
  .catch((error) => {
    console.error("");
    console.error("ERREUR :", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });