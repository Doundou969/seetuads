const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("=== CAMPAIGNS ===");
  const campaigns = await prisma.campaign.findMany();
  for (const c of campaigns) {
    console.log(`${c.id} | ${c.name} | ${c.status}`);
  }

  console.log("\n=== MEDIAS ===");
  const medias = await prisma.media.findMany();
  for (const m of medias) {
    console.log(`${m.id} | ${m.name} | ${m.fileType}`);
  }

  console.log("\n=== PLAYLISTS ===");
  const playlists = await prisma.playlist.findMany({ include: { items: true } });
  for (const p of playlists) {
    console.log(`${p.id} | Screen: ${p.screenId} | v${p.version} | ${p.items.length} items`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());