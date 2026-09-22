const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const screenId = "f0fc1989-b015-40e2-a487-cca4c73211d3";

  const screen = await prisma.screen.findUnique({
    where: { id: screenId },
    select: { id: true, name: true, zoneId: true },
  });

  if (!screen) throw new Error("Écran introuvable.");

  const rule = await prisma.pricingRule.findFirst({
    where: {
      active: true,
      zoneId: screen.zoneId,
      screenId: null,
    },
    orderBy: { createdAt: "desc" },
    select: {
      basePrice: true,
      durationMultiplier: true,
      frequencyMultiplier: true,
      zoneMultiplier: true,
    },
  });

  if (!rule) throw new Error("Règle de tarification introuvable.");

  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  const startDate = new Date("2026-09-18T00:00:00");
  const endDate1 = new Date("2026-09-19T00:00:00");
  const endDate2 = new Date("2026-09-20T00:00:00");

  const numberOfDays1 = Math.floor(
    (endDate1.getTime() - startDate.getTime()) / MS_PER_DAY
  );

  const numberOfDays2 = Math.floor(
    (endDate2.getTime() - startDate.getTime()) / MS_PER_DAY
  );

  const dailyPrice =
    Number(rule.basePrice) *
    Number(rule.durationMultiplier) *
    Number(rule.frequencyMultiplier) *
    Number(rule.zoneMultiplier);

  console.log("=== TEST PRIX RÉEL ===");
  console.log("Écran :", screen.name);
  console.log("Prix journalier :", dailyPrice);

  console.log("\n18 -> 19");
  console.log("numberOfDays :", numberOfDays1);
  console.log("estimatedPrice :", dailyPrice * numberOfDays1);

  console.log("\n18 -> 20");
  console.log("numberOfDays :", numberOfDays2);
  console.log("estimatedPrice :", dailyPrice * numberOfDays2);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
