const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const { regenerate } = require("../../lib/playlist-generator.ts");

  const screenId = "f0fc1989-b015-40e2-a487-cca4c73211d3";

  console.log("AVANT:");

  const before = await prisma.playlist.findMany({
    where: {
      screenId,
      status: "ACTIVE",
    },
    orderBy: { version: "desc" },
    include: {
      items: {
        select: {
          campaignId: true,
          mediaId: true,
          position: true,
          durationSeconds: true,
        },
      },
    },
  });

  for (const p of before) {
    console.log(
      `v${p.version} | ${p.status} | items=${p.items.length}`
    );
  }

  console.log("\nEXECUTION DE regenerate()...\n");

  const result = await regenerate(screenId, prisma);

  console.log("RESULTAT:");
  console.dir(result, { depth: null });

  console.log("\nAPRES:");

  const after = await prisma.playlist.findMany({
    where: {
      screenId,
      status: "ACTIVE",
    },
    orderBy: { version: "desc" },
    include: {
      items: {
        select: {
          campaignId: true,
          mediaId: true,
          position: true,
          durationSeconds: true,
        },
      },
    },
  });

  for (const p of after) {
    console.log(
      `v${p.version} | ${p.status} | items=${p.items.length}`
    );
    console.dir(p.items, { depth: null });
  }
}

main()
  .catch((error) => {
    console.error("ERREUR:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
