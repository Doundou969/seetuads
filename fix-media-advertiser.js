const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const advertiser = await prisma.advertiser.findUnique({
    where: {
      id: "640b285d-745a-418f-8f81-d39e863efda2",
    },
    select: {
      id: true,
      companyName: true,
    },
  });

  if (!advertiser) {
    throw new Error("Annonceur Test SeetuAds introuvable.");
  }

  const result = await prisma.media.updateMany({
    where: {
      advertiserId: "eabcb72e-0f7d-4c7e-9118-b6edfc13b0ee",
      status: "APPROVED",
    },
    data: {
      advertiserId: advertiser.id,
    },
  });

  console.log(
    `${result.count} média(s) réattribué(s) à ${advertiser.companyName}.`
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());