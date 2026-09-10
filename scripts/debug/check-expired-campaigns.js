const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const campaigns = await prisma.campaign.findMany({
    select: {
      id: true,
      name: true,
      status: true,
      startDate: true,
      endDate: true,
      campaignScreens: {
        select: {
          id: true,
          status: true,
          screen: {
            select: {
              name: true,
              screenCode: true,
            },
          },
        },
      },
    },
    orderBy: {
      endDate: "asc",
    },
  });

  console.log("\n=== CAMPAGNES ===\n");

  for (const campaign of campaigns) {
    console.log({
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      associations: campaign.campaignScreens,
    });
  }

  console.log("\n=== RESUME ===");

  const now = new Date();

  let testsPossibles = 0;

  for (const campaign of campaigns) {
    const expired =
      campaign.endDate &&
      new Date(campaign.endDate) < now;

    const activeAssociations = campaign.campaignScreens.filter(
      (item) => item.status === "ACTIVE"
    ).length;

    if (expired && activeAssociations > 0) {
      testsPossibles++;

      console.log(
        `TEST POSSIBLE: ${campaign.name} | expiree | ${activeAssociations} association(s) ACTIVE`
      );
    }
  }

  if (testsPossibles === 0) {
    console.log(
      "Aucune campagne expiree avec une association ACTIVE trouvee."
    );
  }
}

main()
  .catch((error) => {
    console.error("\n=== ERREUR ===");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
