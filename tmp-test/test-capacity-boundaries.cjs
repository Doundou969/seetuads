const { prisma } = require("./lib/prisma");
const { getAvailableCapacity } = require("./lib/inventory");

const screenId = "f0fc1989-b015-40e2-a487-cca4c73211d3";

const tests = [
  ["AVANT", "2026-09-17T00:00:00.000Z", "2026-09-18T00:00:00.000Z"],
  ["RESERVATION", "2026-09-18T00:00:00.000Z", "2026-09-19T00:00:00.000Z"],
  ["APRES", "2026-09-19T00:00:00.000Z", "2026-09-20T00:00:00.000Z"],
  ["PERIODE COMPLETE", "2026-09-17T00:00:00.000Z", "2026-09-20T00:00:00.000Z"],
];

async function main() {
  console.log("=== TEST COMPLET getAvailableCapacity ===");
  console.log("screenId =", screenId);
  console.log("");

  for (const [label, start, end] of tests) {
    const result = await getAvailableCapacity(
      screenId,
      new Date(start),
      new Date(end)
    );

    console.log(`--- ${label} ---`);
    console.log(`${start} -> ${end}`);
    console.dir(result, { depth: null });
    console.log("");
  }
}

main()
  .catch((error) => {
    console.error("=== ERREUR ===");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
