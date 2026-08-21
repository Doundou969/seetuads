const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// ID de la campagne à mettre en pause
const CAMPAIGN_ID = "fb734810-d99f-4675-8244-516a722a42ea";

async function main() {
  console.log("");
  console.log("========================================");
  console.log(" MISE EN PAUSE D'UNE CAMPAGNE");
  console.log("========================================");
  console.log("");

  // Vérifier l'état actuel
  const before = await prisma.campaign.findUnique({
    where: {
      id: CAMPAIGN_ID,
    },
    select: {
      id: true,
      name: true,
      status: true,
      startDate: true,
      endDate: true,
    },
  });

  if (!before) {
    console.log("❌ Campagne introuvable.");
    console.log("ID :", CAMPAIGN_ID);
    return;
  }

  console.log("=== AVANT MODIFICATION ===");
  console.table([before]);

  // Mettre la campagne en pause
  const updated = await prisma.campaign.update({
    where: {
      id: CAMPAIGN_ID,
    },
    data: {
      status: "PAUSED",
    },
    select: {
      id: true,
      name: true,
      status: true,
      startDate: true,
      endDate: true,
    },
  });

  console.log("");
  console.log("=== APRÈS MODIFICATION ===");
  console.table([updated]);

  console.log("");
  console.log("========================================");

  if (updated.status === "PAUSED") {
    console.log("✅ CAMPAGNE MISE EN PAUSE AVEC SUCCÈS");
  } else {
    console.log("⚠️ La campagne n'est pas en PAUSED");
  }

  console.log("========================================");
  console.log("");
}

main()
  .catch((error) => {
    console.error("");
    console.error("❌ ERREUR :");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });