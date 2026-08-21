const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const screens = await prisma.playlist.findMany({
    select: {
      screenId: true,
    },
    distinct: ["screenId"],
  });

  console.log(`Écrans à vérifier : ${screens.length}`);

  for (const { screenId } of screens) {
    const playlists = await prisma.playlist.findMany({
      where: {
        screenId,
      },
      orderBy: {
        version: "desc",
      },
      select: {
        id: true,
        version: true,
        status: true,
      },
    });

    if (playlists.length === 0) {
      continue;
    }

    const latestPlaylist = playlists[0];

    // Toutes les anciennes playlists actives deviennent INACTIVE
    await prisma.playlist.updateMany({
      where: {
        screenId,
        id: {
          not: latestPlaylist.id,
        },
        status: "ACTIVE",
      },
      data: {
        status: "INACTIVE",
      },
    });

    // La playlist la plus récente reste ACTIVE
    await prisma.playlist.update({
      where: {
        id: latestPlaylist.id,
      },
      data: {
        status: "ACTIVE",
      },
    });

    console.log(
      `Screen ${screenId}: version ${latestPlaylist.version} = ACTIVE`
    );
  }

  console.log("\n=================================");
  console.log(" NETTOYAGE TERMINÉ AVEC SUCCÈS");
  console.log("=================================");
}

main()
  .catch((error) => {
    console.error("ERREUR :", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });