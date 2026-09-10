const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const CAMPAIGN_ID = "2a009253-a574-46fa-873d-910b89a4fe14";

async function main() {
  const association = await prisma.campaignScreen.findFirst({
    where: {
      campaignId: CAMPAIGN_ID,
      status: "INACTIVE",
    },
    select: {
      id: true,
      status: true,
      screen: {
        select: {
          name: true,
          screenCode: true,
        },
      },
      campaign: {
        select: {
          name: true,
          status: true,
          endDate: true,
        },
      },
    },
  });

  if (!association) {
    throw new Error("Aucune association INACTIVE disponible pour le test.");
  }

  console.log("\n=== ASSOCIATION CHOISIE ===");
  console.log({
    campaign: association.campaign.name,
    campaignStatus: association.campaign.status,
    campaignEndDate: association.campaign.endDate,
    screen: association.screen.name,
    screenCode: association.screen.screenCode,
    beforeStatus: association.status,
  });

  const updated = await prisma.campaignScreen.update({
    where: {
      id: association.id,
    },
    data: {
      status: "ACTIVE",
    },
    select: {
      id: true,
      status: true,
    },
  });

  console.log("\n=== AVANT CRON ===");
  console.log({
    associationId: updated.id,
    status: updated.status,
  });

  console.log("\n=== RESULTAT ATTENDU ===");
  console.log("L'association est maintenant ACTIVE.");
  console.log("Le cron doit la remettre en INACTIVE.");
}

main()
  .catch((error) => {
    console.error("\n=== ERREUR ===");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
