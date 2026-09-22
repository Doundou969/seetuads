const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const screenId = "f0fc1989-b015-40e2-a487-cca4c73211d3";

  const playlists = await prisma.playlist.findMany({
    where: { screenId },
    orderBy: { version: "desc" },
    select: {
      id: true,
      version: true,
      status: true,
      publishedAt: true,
      createdAt: true,
      items: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          campaignId: true,
          mediaId: true,
          position: true,
          durationSeconds: true,
          startDate: true,
          endDate: true,
        },
      },
    },
  });

  console.log(
    JSON.stringify(
      playlists,
      (_, value) =>
        value instanceof Date ? value.toISOString() : value,
      2
    )
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
