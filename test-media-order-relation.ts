import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const advertiser = await prisma.advertiser.findFirst({
    select: {
      id: true,
      companyName: true,
    },
  });

  const media = await prisma.media.findFirst({
    select: {
      id: true,
      name: true,
    },
  });

  if (!advertiser || !media) {
    throw new Error("Advertiser ou Media manquant.");
  }

  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.mediaOrder.create({
        data: {
          orderNumber: `TEST-RELATION-${Date.now()}`,
          advertiserId: advertiser.id,
          status: "DRAFT",
          currency: "XOF",
          subtotal: 50000,
          taxAmount: 0,
          totalAmount: 50000,
        },
      });

      const item = await tx.mediaOrderItem.create({
        data: {
          orderId: order.id,
          name: "TEST - relation Media",
          startDate: new Date("2026-10-01"),
          endDate: new Date("2026-10-31"),
          spotDuration: 15,
          frequencyPerLoop: 1,
          subtotal: 50000,
          currency: "XOF",
          pricingSnapshot: {},
        },
      });

      await tx.mediaOrderItemMedia.create({
        data: {
          orderItemId: item.id,
          mediaId: media.id,
          displayOrder: 1,
          durationSeconds: 15,
        },
      });

      const verified = await tx.mediaOrderItem.findUnique({
        where: { id: item.id },
        include: {
          media: {
            include: {
              media: true,
            },
          },
        },
      });

      console.dir(verified, { depth: null });

      if (!verified || verified.media.length !== 1) {
        throw new Error("La relation n'a pas été créée correctement.");
      }

      if (verified.media[0].media.id !== media.id) {
        throw new Error("Le Media associé ne correspond pas.");
      }

      console.log(
        "\n✅ MediaOrderItem → MediaOrderItemMedia → Media fonctionne."
      );

      // Rollback volontaire : aucune donnée de test ne sera conservée.
      throw new Error("__ROLLBACK_TEST__");
    });
  } catch (error) {
    if (error instanceof Error && error.message === "__ROLLBACK_TEST__") {
      console.log("✅ Rollback effectué : aucune donnée de test conservée.");
      return;
    }

    throw error;
  }
}

main()
  .catch((error) => {
    console.error("\n❌ TEST ÉCHOUÉ");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
