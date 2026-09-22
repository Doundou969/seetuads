const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const rules = await prisma.pricingRule.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      screenId: true,
      zoneId: true,
      basePrice: true,
      durationMultiplier: true,
      frequencyMultiplier: true,
      zoneMultiplier: true,
    },
  });

  console.log("=== PRICING RULES ===");
  console.dir(rules, { depth: null });

  const screens = await prisma.screen.findMany({
    select: {
      id: true,
      name: true,
      zoneId: true,
    },
  });

  console.log("\n=== SCREENS ===");
  console.dir(screens, { depth: null });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
