const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const screenId = "f0fc1989-b015-40e2-a487-cca4c73211d3";

  const reservations = await prisma.inventoryReservation.findMany({
    where: {
      screenId,
    },
    select: {
      id: true,
      screenId: true,
      startDate: true,
      endDate: true,
      reservedSeconds: true,
      status: true,
      expiresAt: true,
      campaignId: true,
    },
    orderBy: {
      startDate: "asc",
    },
  });

  console.log("=== INVENTORY RESERVATIONS ===");
  console.log("screenId =", screenId);
  console.table(reservations);
  console.log("COUNT =", reservations.length);
}

main()
  .catch((error) => {
    console.error("=== ERREUR ===");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
