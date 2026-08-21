const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const advertisers = await prisma.advertiser.findMany({
    select: {
      id: true,
      companyName: true,
      status: true,
    },
    orderBy: {
      companyName: "asc",
    },
  });

  console.log("\n=== ANNONCEURS ===");
  console.table(advertisers);

  const media = await prisma.media.findMany({
    select: {
      id: true,
      name: true,
      status: true,
      advertiserId: true,
      advertiser: {
        select: {
          companyName: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  console.log("\n=== MEDIAS ===");
  console.table(
    media.map((m) => ({
      id: m.id,
      name: m.name,
      status: m.status,
      advertiserId: m.advertiserId,
      advertiser: m.advertiser?.companyName ?? null,
    }))
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
