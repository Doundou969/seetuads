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
      campaignId: true,
      mediaId: true,
      status: true,
      campaign: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
      media: {
        select: {
          name: true,
          fileType: true,
        },
      },
    },
  });

  console.log("\n=== VERIFICATION CAMPAGNES PLAYBACK LOG ===\n");

  for (const log of logs.reverse()) {
    console.log({
      startedAt: log.startedAt,
      status: log.status,
      campaignId: log.campaignId,
      campaign: log.campaign,
      media: log.media.name,
      mediaType: log.media.fileType,
    });
  }

  const withoutCampaignId = logs.filter(
    (log) => !log.campaignId
  );

  const unresolvedCampaign = logs.filter(
    (log) => log.campaignId && !log.campaign
  );

  console.log("\n=== RESUME ===");
  console.log({
    totalLogs: logs.length,
    withoutCampaignId: withoutCampaignId.length,
    unresolvedCampaign: unresolvedCampaign.length,
    resolvedCampaign: logs.filter(
      (log) => log.campaign
    ).length,
  });
}

main()
  .catch((error) => {
    console.error("\n=== ERREUR ===");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
