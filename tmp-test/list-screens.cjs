const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const screens = await prisma.screen.findMany({
    select: {
      id: true,
      name: true,
      status: true,
      inventoryLoopSeconds: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  console.table(screens);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
