const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const advertisers = await prisma.advertiser.findMany({
    select: {
      id: true,
      companyName: true,
      contactName: true,
      email: true,
      userId: true,
    },
  });

  console.log("");
  console.log("===== ANNONCEURS TROUVES =====");

  for (const advertiser of advertisers) {
    console.log("");
    console.log("ID         :", advertiser.id);
    console.log("Entreprise :", advertiser.companyName);
    console.log("Contact    :", advertiser.contactName || "-");
    console.log("Email      :", advertiser.email);
    console.log("User ID    :", advertiser.userId);
  }

  const advertiser = advertisers.find(
    (a) =>
      a.companyName.trim().toLowerCase() ===
      "annonceur temporaire"
  );

  if (!advertiser) {
    throw new Error(
      'Impossible de trouver l annonceur "Annonceur Temporaire".'
    );
  }

  const rawToken = crypto.randomBytes(32).toString("hex");

  const tokenHash = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  const expiresAt = new Date(
    Date.now() + 24 * 60 * 60 * 1000
  );

  await prisma.advertiserAccessToken.create({
    data: {
      advertiserId: advertiser.id,
      tokenHash,
      expiresAt,
    },
  });

  console.log("");
  console.log("==========================================");
  console.log("TOKEN CREE AVEC SUCCES");
  console.log("==========================================");
  console.log("");
  console.log("Annonceur :", advertiser.companyName);
  console.log("ID        :", advertiser.id);
  console.log("");
  console.log("LIEN D ACCES :");
  console.log(
    "http://localhost:3000/advertiser/access/" + rawToken
  );
  console.log("");
  console.log("Expiration :", expiresAt.toLocaleString("fr-FR"));
  console.log("");
  console.log("==========================================");
}

main()
  .catch((error) => {
    console.error("");
    console.error("ERREUR :", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
