const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const tokens = await prisma.advertiserAccessToken.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
    include: {
      advertiser: {
        select: {
          companyName: true,
        },
      },
    },
  });

  console.log("");
  console.log("===== DERNIERS TOKENS ANNONCEURS =====");

  for (const token of tokens) {
    console.log("");
    console.log("Entreprise :", token.advertiser.companyName);
    console.log("Créé       :", token.createdAt.toLocaleString("fr-FR"));
    console.log("Expire     :", token.expiresAt.toLocaleString("fr-FR"));
    console.log(
      "Utilisé    :",
      token.lastUsedAt
        ? token.lastUsedAt.toLocaleString("fr-FR")
        : "-"
    );
    console.log(
      "Révoqué    :",
      token.revokedAt
        ? token.revokedAt.toLocaleString("fr-FR")
        : "-"
    );
  }
}

main()
  .catch((error) => {
    console.error("ERREUR :", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
