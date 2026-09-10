const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const ASSOCIATION_ID = "1c341739-817e-4081-9a54-77772ea28a11";

async function main() {
  const association = await prisma.campaignScreen.findUnique({
    where: {
      id: ASSOCIATION_ID,
    },
    select: {
      id: true,
      status: true,
      campaign: {
        select: {
          name: true,
          endDate: true,
        },
      },
      screen: {
        select: {
          name: true,
          screenCode: true,
        },
      },
    },
  });

  console.log("\n=== VERIFICATION APRES CRON ===");
  console.log(association);

  if (association?.status === "INACTIVE") {
    console.log("\n=== SUCCES ===");
    console.log("Le cron a correctement desactive l'association expiree.");
  } else {
    console.log("\n=== ECHEC ===");
    console.log("L'association est toujours ACTIVE.");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
