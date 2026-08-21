import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding...");

  const zones = await prisma.$transaction([
    prisma.zone.create({ data: { name: "Plateau", city: "Dakar", district: "Plateau" } }),
    prisma.zone.create({ data: { name: "Almadies", city: "Dakar", district: "Almadies" } }),
    prisma.zone.create({ data: { name: "Médina", city: "Dakar", district: "Médina" } }),
    prisma.zone.create({ data: { name: "Parcelles Assainies", city: "Dakar", district: "Parcelles Assainies" } }),
    prisma.zone.create({ data: { name: "Ouakam", city: "Dakar", district: "Ouakam" } }),
    prisma.zone.create({ data: { name: "Mermoz", city: "Dakar", district: "Mermoz" } }),
  ]);
  console.log(`Zones créées: ${zones.length}`);

  await prisma.pricingRule.create({
    data: { name: "Forfait Starter", basePrice: 50000, durationMultiplier: 1.0, frequencyMultiplier: 1.0, zoneMultiplier: 1.0, active: true },
  });

  await prisma.pricingRule.create({
    data: { name: "Forfait Pro", basePrice: 150000, durationMultiplier: 1.5, frequencyMultiplier: 2.0, zoneMultiplier: 1.2, active: true },
  });

  await prisma.pricingRule.create({
    data: { name: "Forfait Enterprise", basePrice: 500000, durationMultiplier: 2.0, frequencyMultiplier: 3.0, zoneMultiplier: 1.5, active: true },
  });

  console.log("Seed terminé !");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });