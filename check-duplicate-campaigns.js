const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const campaigns = await prisma.campaign.findMany({
    where: {
      name: "SENICO",
    },
    include: {
      advertiser: {
        select: {
          companyName: true,
        },
      },
      _count: {
        select: {
          campaignScreens: true,
          campaignMedia: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  console.table(
    campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      advertiser: c.advertiser.companyName,
      status: c.status,
      startDate: c.startDate.toISOString().slice(0, 10),
      endDate: c.endDate.toISOString().slice(0, 10),
      screens: c._count.campaignScreens,
      media: c._count.campaignMedia,
      createdAt: c.createdAt.toISOString(),
    }))
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
