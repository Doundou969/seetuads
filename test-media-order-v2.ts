import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const advertiser = await prisma.advertiser.findFirst({
    select: {
      id: true,
      companyName: true,
    },
  });

  const media = await prisma.media.findMany({
    where: {
      status: "APPROVED",
      advertiserId: advertiser?.id,
    },
    select: {
      id: true,
      name: true,
      status: true,
    },
    take: 3,
  });

  if (!advertiser) {
    throw new Error("Aucun advertiser trouvé.");
  }

  if (media.length === 0) {
    throw new Error("Aucun média APPROVED appartenant à cet advertiser.");
  }

  console.log("Advertiser :", advertiser);
  console.log("Médias utilisés :", media);

  const screen = await prisma.screen.findFirst({
    select: {
      id: true,
      name: true,
      zoneId: true,
    },
  });

  if (!screen) {
    throw new Error("Aucun écran trouvé.");
  }

  const pricingRule = await prisma.pricingRule.findFirst({
    where: {
      active: true,
      OR: [
        { screenId: screen.id },
        ...(screen.zoneId ? [{ zoneId: screen.zoneId }] : []),
      ],
    },
    select: {
      id: true,
      screenId: true,
      zoneId: true,
    },
  });

  if (!pricingRule) {
    throw new Error(
      "Aucune règle de tarification active pour l'écran sélectionné."
    );
  }

  console.log("Écran :", screen);
  console.log("PricingRule :", pricingRule);

  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.mediaOrder.create({
        data: {
          orderNumber: `TEST-MEDIA-${Date.now()}`,
          advertiserId: advertiser.id,
          status: "PENDING_PAYMENT",
          currency: "XOF",
          subtotal: 50000,
          taxAmount: 0,
          totalAmount: 50000,
        },
      });

      const item = await tx.mediaOrderItem.create({
        data: {
          orderId: order.id,
          name: "TEST médias relation V2",
          startDate: new Date("2026-10-01"),
          endDate: new Date("2026-10-31"),
          spotDuration: 15,
          frequencyPerLoop: 1,
          subtotal: 50000,
          currency: "XOF",
          pricingSnapshot: {
            test: true,
          },
        },
      });

      await tx.mediaOrderItemScreen.create({
        data: {
          orderItemId: item.id,
          screenId: screen.id,
          pricingRuleId: pricingRule.id,
          unitPrice: 50000,
          subtotal: 50000,
          pricingSnapshot: {
            test: true,
          },
        },
      });

      await tx.mediaOrderItemMedia.createMany({
        data: media.map((m, index) => ({
          orderItemId: item.id,
          mediaId: m.id,
          displayOrder: index + 1,
          durationSeconds: 15,
        })),
      });

      const verified = await tx.mediaOrderItem.findUnique({
        where: {
          id: item.id,
        },
        include: {
          media: {
            include: {
              media: true,
            },
            orderBy: {
              displayOrder: "asc",
            },
          },
          screens: true,
        },
      });

      console.log("");
      console.log("========== TEST V2 ==========");
      console.dir(verified, { depth: null });

      if (!verified) {
        throw new Error("MediaOrderItem introuvable.");
      }

      if (verified.media.length !== media.length) {
        throw new Error(
          `ERREUR : ${verified.media.length} relation(s) trouvée(s), ${media.length} attendue(s).`
        );
      }

      for (let i = 0; i < media.length; i++) {
        if (verified.media[i].mediaId !== media[i].id) {
          throw new Error(
            `ERREUR : le média ${i + 1} ne correspond pas.`
          );
        }

        if (verified.media[i].displayOrder !== i + 1) {
          throw new Error(
            `ERREUR : displayOrder incorrect pour le média ${i + 1}.`
          );
        }
      }

      if (verified.screens.length !== 1) {
        throw new Error(
          `ERREUR : ${verified.screens.length} écran(s) trouvé(s).`
        );
      }

      console.log("");
      console.log("==========================================");
      console.log("✅ TEST RÉUSSI");
      console.log("==========================================");
      console.log(
        `✅ ${verified.media.length} média(s) correctement associé(s)`
      );
      console.log("✅ displayOrder correct");
      console.log("✅ MediaOrderItemMedia → Media correct");
      console.log("✅ MediaOrderItemScreen correct");
      console.log("==========================================");

      // Rollback volontaire.
      throw new Error("__ROLLBACK_TEST__");
    });
  } catch (error) {
    if (error instanceof Error && error.message === "__ROLLBACK_TEST__") {
      console.log("");
      console.log("✅ ROLLBACK EFFECTUÉ");
      console.log("Aucune donnée de test n'a été conservée.");
      return;
    }

    throw error;
  }
}

main()
  .catch((error) => {
    console.error("");
    console.error("❌ TEST ÉCHOUÉ");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
