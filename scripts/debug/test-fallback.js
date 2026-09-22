const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const { regenerate } = require("../../lib/playlist-generator.ts");

  const screenId = "f0fc1989-b015-40e2-a487-cca4c73211d3";

  console.log("AVANT regenerate:");

  const before = await prisma.playlist.findMany({
    where: { screenId },
    orderBy: { version: "desc" },
    take: 3,
    include: {
      items: {
        select: {
          id: true,
          campaignId: true,
          mediaId: true,
          position: true,
          durationSeconds: true,
        },
      },
    },
  });

  for (const playlist of before) {
    console.log(
      `v${playlist.version} | ${playlist.status} | items=${playlist.items.length}`
    );
    console.log(playlist.items);
  }

  console.log("\nEXECUTION regenerate()...\n");

  const result = await regenerate(screenId, prisma);

  console.log("RESULTAT:");
  console.dir(result, { depth: null });

  console.log("\nAPRES regenerate:");

  const after = await prisma.playlist.findMany({
    where: { screenId },
    orderBy: { version: "desc" },
    take: 3,
    include: {
      items: {
        select: {
          id: true,
          campaignId: true,
          mediaId: true,
          position: true,
          durationSeconds: true,
        },
      },
    },
  });

  for (const playlist of after) {
    console.log(
      `v${playlist.version} | ${playlist.status} | items=${playlist.items.length}`
    );
    console.log(playlist.items);
  }
}

main()
  .catch((error) => {
    console.error("ERREUR:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

