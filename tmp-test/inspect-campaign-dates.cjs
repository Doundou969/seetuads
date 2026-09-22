const { prisma } = require("./lib/prisma");

async function main() {
  const campaigns = await prisma.campaign.findMany({
    where: {
      startDate: {
        not: undefined
      }
    },
    select: {
      id: true,
      name: true,
      status: true,
      startDate: true,
      endDate: true,
    },
    orderBy: {
      startDate: "asc",
    },
  });

  console.log("=== CAMPAGNES ===");

  for (const c of campaigns) {
    const sameDay =
      c.startDate.getTime() === c.endDate.getTime();

    console.log(
      `${c.id} | ${c.name} | ${c.status} | ` +
      `${c.startDate.toISOString()} -> ${c.endDate.toISOString()} | ` +
      `sameDay=${sameDay}`
    );
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
