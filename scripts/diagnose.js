const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("=== PLAYERS ===");
  const players = await prisma.player.findMany({ include: { screen: true } });
  for (const p of players) {
    console.log(`${p.deviceId} -> ${p.screen?.screenCode || "NO SCREEN"}`);
  }

  console.log("\n=== PLAYLISTS ===");
  const playlists = await prisma.playlist.findMany({
    include: { screen: true, items: { include: { media: true } } },
  });
  for (const pl of playlists) {
    console.log(`Screen ${pl.screen?.screenCode || "?"} | v${pl.version} | ${pl.status} | ${pl.items.length} items`);
  }

  console.log("\n=== CAMPAIGNS ===");
  const campaigns = await prisma.campaign.findMany({
    include: { campaignScreens: { include: { screen: true } } },
  });
  for (const c of campaigns) {
    console.log(`${c.name} (${c.status}) - ${c.campaignScreens.length} screens:`);
    for (const cs of c.campaignScreens) {
      console.log(`  -> ${cs.screen?.screenCode}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());