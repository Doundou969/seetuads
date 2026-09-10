const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

(async () => {
  try {
    const logs = await prisma.playbackLog.findMany({
      select: {
        playerId: true,
        durationSeconds: true,
        status: true,
        startedAt: true,
        player: {
          select: {
            deviceId: true
          }
        }
      },
      orderBy: {
        startedAt: "desc"
      }
    });

    const stats = {};

    for (const log of logs) {
      const deviceId = log.player?.deviceId ?? log.playerId;

      if (!stats[deviceId]) {
        stats[deviceId] = {
          logs: 0,
          PLAYED: 0,
          INTERRUPTED: 0,
          FAILED: 0,
          SKIPPED: 0,
          duration: 0
        };
      }

      stats[deviceId].logs++;

      if (stats[deviceId][log.status] !== undefined) {
        stats[deviceId][log.status]++;
      }

      stats[deviceId].duration += Number(log.durationSeconds || 0);
    }

    console.table(
      Object.entries(stats).map(([deviceId, s]) => ({
        deviceId,
        logs: s.logs,
        PLAYED: s.PLAYED,
        INTERRUPTED: s.INTERRUPTED,
        FAILED: s.FAILED,
        SKIPPED: s.SKIPPED,
        dureeMinutes: Math.round(s.duration / 60)
      }))
    );

    const total = Object.values(stats).reduce(
      (a, s) => ({
        logs: a.logs + s.logs,
        PLAYED: a.PLAYED + s.PLAYED,
        INTERRUPTED: a.INTERRUPTED + s.INTERRUPTED,
        FAILED: a.FAILED + s.FAILED,
        SKIPPED: a.SKIPPED + s.SKIPPED,
        duration: a.duration + s.duration
      }),
      {
        logs: 0,
        PLAYED: 0,
        INTERRUPTED: 0,
        FAILED: 0,
        SKIPPED: 0,
        duration: 0
      }
    );

    console.log("");
    console.log("=== TOTAL BASE ===");
    console.table([{
      logs: total.logs,
      PLAYED: total.PLAYED,
      INTERRUPTED: total.INTERRUPTED,
      FAILED: total.FAILED,
      SKIPPED: total.SKIPPED,
      dureeMinutes: Math.round(total.duration / 60)
    }]);

    console.log(
      `Duree totale: ${Math.floor(total.duration / 3600)}h ${Math.floor((total.duration % 3600) / 60)}m ${total.duration % 60}s`
    );

  } catch (e) {
    console.error("ERREUR:", e);
  } finally {
    await prisma.$disconnect();
  }
})();
