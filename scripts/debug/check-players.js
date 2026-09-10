const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const players = await prisma.player.findMany({
    select: {
      id: true,
      deviceId: true,
      apiKey: true,
      status: true,
      lastHeartbeat: true,
      screen: {
        select: {
          name: true,
          screenCode: true,
        },
      },
    },
  });

  console.log("\n=== PLAYERS ===\n");

  for (const player of players) {
    console.log({
      deviceId: player.deviceId,
      apiKey: player.apiKey,
      status: player.status,
      lastHeartbeat: player.lastHeartbeat,
      screen: player.screen,
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
