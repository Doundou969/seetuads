const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const campaigns = await prisma.campaign.findMany({
    where: {
      name: "SENICO",
      advertiser: {
        companyName: "Test SeetuAds",
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
    },
  });

  console.log("Campagnes trouvées :", campaigns.length);
  console.table(campaigns);

  if (campaigns.length === 0) {
    console.log("Aucune campagne à supprimer.");
    return;
  }

  const result = await prisma.campaign.deleteMany({
    where: {
      id: {
        in: campaigns.map((campaign) => campaign.id),
      },
    },
  });

  console.log(`Supprimé : ${result.count} campagne(s).`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
