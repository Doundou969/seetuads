"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../../lib/prisma");
async function main() {
    console.log("=== PRISMA CLIENT TEST ===");
    const result = await prisma_1.prisma.$queryRaw `SELECT NOW() AS now`;
    console.log(result);
    const count = await prisma_1.prisma.player.count();
    console.log("PLAYER COUNT =", count);
    await prisma_1.prisma.$disconnect();
    console.log("=== OK ===");
}
main().catch(async (error) => {
    console.error("=== PRISMA ERROR ===");
    console.error(error);
    await prisma_1.prisma.$disconnect();
    process.exit(1);
});
