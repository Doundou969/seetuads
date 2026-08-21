const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const campaign = await prisma.campaign.findFirst({
    where: { name: "SENICO" },
  });

  if (!campaign) {
    console.log("Campagne SENICO non trouvee");
    return;
  }

  // Prend le media video (meilleur pour le player)
  const media = await prisma.media.findFirst({
    where: { fileType: "video" },
  }) || await prisma.media.findFirst();

  if (!media) {
    console.log("Aucun media trouve");
    return;
  }

  console.log(`Campagne: ${campaign.name}`);
  console.log(`Media: ${media.name} (${media.fileType})`);

  const playlists = await prisma.playlist.findMany({
    include: { items: true },
  });

  for (const pl of playlists) {
    if (pl.items.length === 0) {
      await prisma.playlistItem.create({
        data: {
          playlistId: pl.id,
          campaignId: campaign.id,
          mediaId: media.id,
          position: 1,
          durationSeconds: media.durationSeconds || 15,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
        },
      });
      console.log(`✅ Item ajoute a la playlist ${pl.id} (screen: ${pl.screenId})`);
    } else {
      console.log(`⏭️ Playlist ${pl.id} deja OK (${pl.items.length} items)`);
    }
  }

  console.log("\nTermine !");
}

main().catch(console.error).finally(() => prisma.$disconnect());