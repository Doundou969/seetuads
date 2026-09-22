const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const now = new Date();

  const today = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  ));

  const campaigns = await prisma.campaign.findMany({
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
      endDate: true,
    },
  });

  console.log("TODAY UTC:", today.toISOString());
  console.log("EXPIRED ACTIVE:", JSON.stringify(campaigns, null, 2));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
