const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const reservations = await prisma.inventoryReservation.findMany({
    include: {
      campaign: {
        select: {
          id: true,
          name: true,
          status: true,
          startDate: true,
          endDate: true,
          spotDuration: true,
          frequencyPerLoop: true,
        },
      },
      screen: {
        select: {
          id: true,
          screenCode: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  console.log(
    JSON.stringify(
      reservations.map((r) => ({
        reservationId: r.id,
        status: r.status,
        startDate: r.startDate,
        endDate: r.endDate,
        reservedSeconds: r.reservedSeconds,
        campaign: r.campaign,
        screen: r.screen,
      })),
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
