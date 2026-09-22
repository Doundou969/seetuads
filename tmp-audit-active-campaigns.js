const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function replacer(key, value) {
  return typeof value === "bigint" ? value.toString() : value;
}

async function main() {
  const campaigns = await prisma.campaign.findMany({
    where: {
      status: {
        in: ["SCHEDULED", "ACTIVE"],
      },
    },
    orderBy: {
      startDate: "asc",
    },
    include: {
      campaignScreens: {
        select: {
          screenId: true,
          status: true,
          screen: {
            select: {
              screenCode: true,
              name: true,
            },
          },
        },
      },
      campaignMedia: {
        select: {
          mediaId: true,
          durationSeconds: true,
          media: {
            select: {
              name: true,
              status: true,
              durationSeconds: true,
            },
          },
        },
      },
      inventoryReservations: {
        select: {
          id: true,
          screenId: true,
          status: true,
          startDate: true,
          endDate: true,
          reservedSeconds: true,
        },
      },
    },
  });

  console.log(JSON.stringify(
    campaigns.map(c => ({
      id: c.id,
      name: c.name,
      status: c.status,
      startDate: c.startDate,
      endDate: c.endDate,
      spotDuration: c.spotDuration,
      frequencyPerLoop: c.frequencyPerLoop,
      campaignScreens: c.campaignScreens,
      campaignMedia: c.campaignMedia,
      inventoryReservations: c.inventoryReservations,
    })),
    replacer,
    2
  ));
}

main()
  .catch(error => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
