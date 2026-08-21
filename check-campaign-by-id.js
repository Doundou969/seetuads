const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// ID de la campagne à vérifier
const CAMPAIGN_ID = "208ddc29-47f7-4a94-942e-04530e22803a";

async function main() {
  console.log("");
  console.log("========================================");
  console.log(" VÉRIFICATION D'UNE CAMPAGNE");
  console.log("========================================");
  console.log("");

  const campaign = await prisma.campaign.findUnique({
    where: {
      id: CAMPAIGN_ID
    },

    include: {
      advertiser: true,

      campaignMedia: {
        include: {
          media: true
        },
        orderBy: {
          displayOrder: "asc"
        }
      },

      campaignScreens: {
        include: {
          screen: {
            include: {
              location: true,
              zone: true
            }
          }
        }
      }
    }
  });

  if (!campaign) {
    console.log("❌ Campagne introuvable.");
    console.log("");
    return;
  }

  // ========================================
  // INFORMATIONS CAMPAGNE
  // ========================================

  console.log("=== CAMPAGNE ===");

  console.table([
    {
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      advertiser: campaign.advertiser
        ? campaign.advertiser.name
        : null
    }
  ]);

  // ========================================
  // MÉDIAS
  // ========================================

  console.log("");
  console.log("=== MÉDIAS DE LA CAMPAGNE ===");

  if (campaign.campaignMedia.length === 0) {
    console.log("Aucun média associé.");
  } else {
    console.table(
      campaign.campaignMedia.map((item, index) => ({
        index: index + 1,

        campaignMediaId: item.id,

        mediaId: item.media
          ? item.media.id
          : item.mediaId,

        name: item.media
          ? item.media.name
          : null,

        status: item.media
          ? item.media.status
          : null,

        displayOrder: item.displayOrder,

        durationSeconds: item.media
          ? item.media.durationSeconds
          : null
      }))
    );
  }

  // ========================================
  // ÉCRANS
  // ========================================

  console.log("");
  console.log("=== ÉCRANS DE LA CAMPAGNE ===");

  if (campaign.campaignScreens.length === 0) {
    console.log("Aucun écran associé.");
  } else {
    console.table(
      campaign.campaignScreens.map((item, index) => ({
        index: index + 1,

        campaignScreenId: item.id,

        screenId: item.screen
          ? item.screen.id
          : item.screenId,

        screen: item.screen
          ? item.screen.name
          : null,

        status: item.screen
          ? item.screen.status
          : null,

        location:
          item.screen && item.screen.location
            ? item.screen.location.name
            : null,

        zone:
          item.screen && item.screen.zone
            ? item.screen.zone.name
            : null
      }))
    );
  }

  console.log("");
  console.log("========================================");
  console.log(" RÉSUMÉ");
  console.log("========================================");

  console.log("ID      :", campaign.id);
  console.log("Nom     :", campaign.name);
  console.log("Statut  :", campaign.status);
  console.log("Début   :", campaign.startDate);
  console.log("Fin     :", campaign.endDate);
  console.log("Médias  :", campaign.campaignMedia.length);
  console.log("Écrans  :", campaign.campaignScreens.length);

  console.log("");
  console.log("========================================");
  console.log(" VÉRIFICATION TERMINÉE");
  console.log("========================================");
  console.log("");
}

main()
  .catch((error) => {
    console.error("");
    console.error("❌ ERREUR :");
    console.error(error);
    console.error("");
  })
  .finally(async () => {
    await prisma.$disconnect();
  });