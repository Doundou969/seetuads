const { prisma } = require("./lib/prisma");
const { getAvailableCapacity } = require("./lib/inventory");

async function main() {
  const screenId = "f0fc1989-b015-40e2-a487-cca4c73211d3";

  const result = await getAvailableCapacity(
    screenId,
    new Date("2026-09-18T00:00:00.000Z"),
    new Date("2026-09-19T00:00:00.000Z")
  );

  console.log("=== RESULTAT ===");
  console.dir(result, { depth: null });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
