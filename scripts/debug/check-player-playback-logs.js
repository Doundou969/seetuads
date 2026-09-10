const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const DEVICE_ID = "DEV-PLT-002-C";

async function main() {
  const player = await prisma.player.findUnique({
    where: {
      deviceId: DEVICE_ID,
    },
    select: {
      id: true,
      deviceId: true,
      screen: {
        select: {
          id: true,
          name: true,
          screenCode: true,
        },
      },
    },
  });

  if (!player) {
    throw new Error(`Player introuvable : ${DEVICE_ID}`);
  }

  const logs = await prisma.playbackLog.findMany({
    where: {
      playerId: player.id,
    },
    orderBy: {
      startedAt: "desc",
    },
    take: 20,
    select: {
      id: true,
      startedAt: true,
      endedAt: true,
      durationSeconds: true,
      status: true,
      media: {
        select: {
          id: true,
          name: true,
          fileType: true,
        },
      },
      campaign: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  console.log("\n=== PLAYER ===");
  console.log({
    deviceId: player.deviceId,
    screen: player.screen,
  });

  console.log("\n=== NOMBRE DE LOGS ===");
  console.log(logs.length);

  console.log("\n=== DERNIERS PLAYBACK LOGS ===");

  for (const log of logs.reverse()) {
    console.log({
      startedAt: log.startedAt,
      endedAt: log.endedAt,
      durationSeconds: log.durationSeconds,
      status: log.status,
      campaign: log.campaign?.name,
      mediaType: log.media.fileType,
      media: log.media.name,
    });
  }

  if (logs.length === 0) {
    console.log("\n=== ATTENTION ===");
    console.log(
      "Aucun playback log trouve. Le Player joue peut-etre les medias, mais les logs ne sont pas enregistres."
    );
  } else {
    console.log("\n=== SUCCES ===");
    console.log(
      "Des playback logs ont ete enregistres pour ce Player."
    );
  }
}

main()
  .catch((error) => {
    console.error("\n=== ERREUR ===");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
