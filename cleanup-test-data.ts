import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.mediaOrder.findMany({
    where: {
      orderNumber: {
        startsWith: "TEST-RELATION-",
      },
    },
    select: {
      id: true,
      orderNumber: true,
    },
  });

  console.log("Commandes de test trouvées :", orders);

  if (orders.length === 0) {
    console.log("Aucune donnée de test à supprimer.");
    return;
  }

  for (const order of orders) {
    await prisma.mediaOrder.delete({
      where: {
        id: order.id,
      },
    });

    console.log(`Supprimée : ${order.orderNumber}`);
  }

  console.log("Nettoyage terminé.");
}

main()
  .catch((error) => {
    console.error("ERREUR :", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
