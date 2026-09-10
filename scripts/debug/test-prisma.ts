import { prisma } from "./lib/prisma";

async function main() {
  console.log("=== PRISMA CLIENT TEST ===");

  const result = await prisma.$queryRaw`SELECT NOW() AS now`;

  console.log(result);

  const count = await prisma.player.count();

  console.log("PLAYER COUNT =", count);

  await prisma.$disconnect();

  console.log("=== OK ===");
}

main().catch(async (error) => {
  console.error("=== PRISMA ERROR ===");
  console.error(error);

  await prisma.$disconnect();

  process.exit(1);
});
