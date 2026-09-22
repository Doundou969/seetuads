const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const screenId = "f0fc1989-b015-40e2-a487-cca4c73211d3";

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  console.log("DATE UTC:", today.toISOString());
  console.log("\nPLAYLIST ACTIVE AVANT:");

  const active = await prisma.playlist.findMany({
    where: {
      screenId,
      status: "ACTIVE",
    },
    orderBy: { version: "desc" },
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

  for (const playlist of active) {
    console.log(
      `v${playlist.version} | ${playlist.status} | items=${playlist.items.length}`
    );
    console.dir(playlist.items, { depth: null });
  }

  console.log("\nRESERVATIONS CONFIRMEES ACTIVES:");

  const reservations = await prisma.inventoryReservation.findMany({
    where: {
      screenId,
      status: "CONFIRMED",
      startDate: { lte: today },
      endDate: { gt: today },
    },
    select: {
      id: true,
      campaignId: true,
      startDate: true,
      endDate: true,
      reservedSeconds: true,
      campaign: {
        select: {
          id: true,
          name: true,
          status: true,
          startDate: true,
          endDate: true,
        },
      },
    },
  });

  console.dir(reservations, { depth: null });

  const fallbackPlaylist = await prisma.playlist.findFirst({
    where: {
      screenId,
      items: {
        some: {},
        every: {
          campaignId: null,
        },
      },
    },
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
    orderBy: {
      version: "desc",
    },
  });

  console.log("\nFALLBACK SELECTIONNE:");
  console.dir(fallbackPlaylist, { depth: null });

  if (!fallbackPlaylist) {
    console.log("\nAUCUNE PLAYLIST MANUELLE TROUVEE.");
    return;
  }

  console.log(
    `\nLa logique de fallback selectionnerait v${fallbackPlaylist.version}.`
  );
}

main()
  .catch((error) => {
    console.error("ERREUR:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
