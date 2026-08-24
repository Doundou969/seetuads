import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const players = await prisma.player.findMany({
    select: {
      id: true,
      deviceId: true,
      serialNumber: true,
      status: true,
      apiKey: true,
      lastHeartbeat: true,
    },
  });

  console.table(players);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
