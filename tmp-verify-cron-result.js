const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const campaign = await prisma.campaign.findUnique({
    where: {
      id: "f164dc69-9480-4fcc-9bd0-3a6849b6a5a3",
    },
    select: {
      id: true,
      name: true,
      status: true,
      startDate: true,
      endDate: true,
    },
  });

  const screen = await prisma.screen.findUnique({
    where: {
      screenCode: "SCR-MER-001",
    },
    select: {
      id: true,
      screenCode: true,
      name: true,
      status: true,
      playlists: {
        where: {
          status: "ACTIVE",
        },
        orderBy: {
          version: "desc",
        },
        take: 1,
        select: {
          id: true,
          version: true,
          status: true,
          generatedAt: true,
          publishedAt: true,
          items: {
            orderBy: {
              position: "asc",
            },
            select: {
              position: true,
              mediaId: true,
              campaignId: true,
              durationSeconds: true,
              media: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  console.log("\n=== CAMPAGNE ===");
  console.log(JSON.stringify(campaign, null, 2));

  console.log("\n=== PLAYLIST ACTIVE SCR-MER-001 ===");
  console.log(JSON.stringify(screen, null, 2));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
