const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function replacer(key, value) {
  return typeof value === "bigint" ? value.toString() : value;
}

async function main() {
  const campaign = await prisma.campaign.findUnique({
    where: {
      id: "f164dc69-9480-4fcc-9bd0-3a6849b6a5a3",
    },
    include: {
      campaignScreens: true,
      campaignMedia: {
        include: {
          media: true,
        },
      },
      inventoryReservations: {
        include: {
          screen: true,
        },
      },
    },
  });

  console.log(JSON.stringify(campaign, replacer, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
