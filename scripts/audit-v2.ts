import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const campaigns = await prisma.campaign.groupBy({
    by: ["status"],
    _count: {
      _all: true,
    },
    orderBy: {
      status: "asc",
    },
  });

  console.log("\n=== CAMPAIGN STATUSES ===\n");
  console.table(
    campaigns.map((row) => ({
      status: row.status,
      count: row._count._all,
    }))
  );

  const awaitingPayment = await prisma.campaign.findMany({
    where: {
      status: "AWAITING_PAYMENT",
    },
    select: {
      id: true,
      name: true,
      status: true,
      createdAt: true,
      startDate: true,
      endDate: true,
    },
  });

  console.log("\n=== CAMPAIGNS AWAITING_PAYMENT ===\n");
  console.dir(awaitingPayment, { depth: null });
}

main()
  .catch((error) => {
    console.error("\nERREUR :", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
