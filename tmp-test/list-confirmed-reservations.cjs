const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const reservations = await prisma.inventoryReservation.findMany({
    where: {
      status: "CONFIRMED",
    },
    select: {
      id: true,
      screenId: true,
      startDate: true,
      endDate: true,
      reservedSeconds: true,
      status: true,
      campaignId: true,
    },
    orderBy: [
      { screenId: "asc" },
      { startDate: "asc" },
    ],
  });

  console.log("=== TOUTES LES RESERVATIONS CONFIRMEES ===");
  console.table(reservations);
  console.log("COUNT =", reservations.length);

  const grouped = new Map();

  for (const r of reservations) {
    if (!grouped.has(r.screenId)) {
      grouped.set(r.screenId, []);
    }
    grouped.get(r.screenId).push(r);
  }

  console.log("");
  console.log("=== RESERVATIONS PAR ECRAN ===");

  for (const [screenId, items] of grouped) {
    console.log("");
    console.log("SCREEN =", screenId);
    console.log("Nombre =", items.length);

    for (const r of items) {
      console.log(
        `  ${r.startDate.toISOString()} -> ${r.endDate.toISOString()} | ` +
        `${r.reservedSeconds}s | campaign=${r.campaignId}`
      );
    }
  }
}

main()
  .catch((error) => {
    console.error("=== ERREUR ===");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
