const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const media = await prisma.media.findMany();
  console.log("=== MEDIAS EN BASE ===\n");
  for (const m of media) {
    console.log(`ID: ${m.id}`);
    console.log(`Nom: ${m.name}`);
    console.log(`URL: ${m.fileUrl}`);
    console.log(`Type: ${m.fileType}`);
    console.log(`Status: ${m.status}`);
    console.log("---");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());