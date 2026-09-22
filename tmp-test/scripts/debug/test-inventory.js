"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../../lib/prisma");
const inventory_1 = require("../../lib/inventory");
async function main() {
    const screenId = "f0fc1989-b015-40e2-a487-cca4c73211d3";
    console.log("=== TEST getAvailableCapacity ===");
    console.log("screenId =", screenId);
    const result = await (0, inventory_1.getAvailableCapacity)(screenId, new Date("2026-09-19T00:00:00.000Z"), new Date("2026-09-20T00:00:00.000Z"));
    console.log("=== RESULTAT ===");
    console.dir(result, { depth: null });
}
main()
    .catch((error) => {
    console.error("=== ERREUR ===");
    console.error(error);
    process.exitCode = 1;
})
    .finally(async () => {
    await prisma_1.prisma.$disconnect();
});
