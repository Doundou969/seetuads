const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const players = await prisma.player.findMany({
    include: { screen: { include: { playlists: { include: { items: { include: { media: true } } } } } } },
  });

  for (const p of players) {
    const pl = p.screen?.playlists?.[0];
    console.log(`${p.deviceId}:`);
    console.log(`  Screen: ${p.screen?.screenCode}`);
    console.log(`  Playlist: ${pl ? `v${pl.version} (${pl.items.length} items)` : "AUCUNE"}`);
    console.log("---");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());