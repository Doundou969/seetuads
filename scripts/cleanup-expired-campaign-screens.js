const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const now = new Date();

  console.log("\n=== NETTOYAGE DES CAMPAGNES EXPIREES ===");
  console.log("Date actuelle :", now.toISOString());

  const expiredLinks = await prisma.campaignScreen.findMany({
    where: {
      status: "ACTIVE",
      campaign: {
        endDate: {
          lt: now
        }
      }
    },
    include: {
      campaign: {
        select: {
          id: true,
          name: true,
          status: true,
          endDate: true
        }
      },
      screen: {
        select: {
          id: true,
          name: true,
          screenCode: true
        }
      }
    }
  });

  console.log(
    `\nAssociations expirées trouvées : ${expiredLinks.length}\n`
  );

  if (expiredLinks.length === 0) {
    console.log("Aucune association expirée à nettoyer.");
    return;
  }

  for (const link of expiredLinks) {
    console.log({
      campaign: link.campaign.name,
      campaignId: link.campaign.id,
      campaignStatus: link.campaign.status,
      campaignEndDate: link.campaign.endDate,
      screen: link.screen.name,
      screenCode: link.screen.screenCode,
      oldCampaignScreenStatus: link.status
    });
  }

  const result = await prisma.campaignScreen.updateMany({
    where: {
      id: {
        in: expiredLinks.map((link) => link.id)
      }
    },
    data: {
      status: "INACTIVE"
    }
  });

  console.log("\n=== RESULTAT ===");
  console.log(
    `${result.count} association(s) passée(s) en INACTIVE.`
  );

  console.log(
    "\nLes campagnes elles-mêmes n'ont pas été supprimées ni modifiées."
  );
}

main()
  .catch((error) => {
    console.error("\nERREUR :", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
