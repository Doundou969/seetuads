import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const advertisers = await prisma.advertiser.findMany({
    select: {
      id: true,
      companyName: true,
      media: {
        where: {
          status: "APPROVED",
        },
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
    },
  });

  const result = advertisers
    .filter((a) => a.media.length > 0)
    .map((a) => ({
      advertiserId: a.id,
      companyName: a.companyName,
      approvedMediaCount: a.media.length,
      media: a.media,
    }));

  console.dir(result, { depth: null });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
