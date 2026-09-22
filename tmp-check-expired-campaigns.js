const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  const today = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  ));

  console.log("NOW UTC :", now.toISOString());
  console.log("TODAY UTC :", today.toISOString());

  const expiredActive = await prisma.campaign.findMany({
    where: {
      status: "ACTIVE",
      endDate: {
        lte: today,
      },
    },
    select: {
      id: true,
      name: true,
      status: true,
      startDate: true,
      endDate: true,
    },
    orderBy: {
      endDate: "asc",
    },
  });

  console.log("\n=== CAMPAGNES ACTIVE EXPIREES ===");
  console.log(JSON.stringify(expiredActive, null, 2));

  const activeFuture = await prisma.campaign.findMany({
    where: {
      status: "ACTIVE",
      endDate: {
        gt: today,
      },
    },
    select: {
      id: true,
      name: true,
      status: true,
      startDate: true,
      endDate: true,
    },
  });

  console.log("\n=== CAMPAGNES ACTIVE ENCORE VALIDES ===");
  console.log(JSON.stringify(activeFuture, null, 2));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
