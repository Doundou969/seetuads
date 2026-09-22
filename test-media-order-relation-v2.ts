import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const advertiserId = "e2ca00e2-3db7-4f33-9918-4bd31c4b199a";

  const media = await prisma.media.findMany({
    where: {
      advertiserId,
      status: "APPROVED",
    },
    select: {
      id: true,
      name: true,
      status: true,
    },
    take: 2,
  });

  if (media.length === 0) {
    throw new Error("Aucun média APPROVED trouvé pour cet advertiser.");
  }

  const screens = await prisma.screen.findMany({
    select: {
      id: true,
      name: true,
      zoneId: true,
    },
    take: 2,
  });

  if (screens.length === 0) {
    throw new Error("Aucun écran trouvé.");
  }

  console.log("Advertiser :", advertiserId);
  console.log("Médias utilisés :", media);
  console.log("Écrans utilisés :", screens);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 1);

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 2);

  const payload = {
    name: "TEST MEDIA ORDER V2",
    objective: "Test relation MediaOrderItemMedia",
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    spotDuration: 15,
    frequencyPerLoop: 1,
    screenIds: screens.map((s) => s.id),
    mediaIds: media.map((m) => m.id),
  };

  console.log("\nPayload :");
  console.dir(payload, { depth: null });

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.mediaOrder.create({
      data: {
        orderNumber: `TEST-V2-${Date.now()}`,
        advertiserId,
        status: "PENDING_PAYMENT",
        subtotal: 0,
        totalAmount: 0,
      },
    });

    const campaign = await tx.campaign.create({
      data: {
        advertiserId,
        name: payload.name,
        objective: payload.objective,
        startDate,
        endDate,
        spotDuration: payload.spotDuration,
        frequencyPerLoop: payload.frequencyPerLoop,
        estimatedPrice: 0,
        status: "DRAFT",
      },
    });

    const item = await tx.mediaOrderItem.create({
      data: {
        orderId: order.id,
        campaignId: campaign.id,
        name: payload.name,
        startDate,
        endDate,
        spotDuration: payload.spotDuration,
        frequencyPerLoop: payload.frequencyPerLoop,
        subtotal: 0,
        pricingSnapshot: {
          test: true,
          generatedAt: new Date().toISOString(),
        },
      },
    });

    await tx.mediaOrderItemMedia.createMany({
      data: payload.mediaIds.map((mediaId) => ({
        orderItemId: item.id,
        mediaId,
      })),
    });

    return {
      order,
      campaign,
      item,
    };
  });

  console.log("\n✅ TEST RÉUSSI");
  console.dir(result, { depth: null });

  const relation = await prisma.mediaOrderItemMedia.findMany({
    where: {
      orderItemId: result.item.id,
    },
    include: {
      media: true,
    },
  });

  console.log("\nRelations MediaOrderItemMedia créées :");
  console.dir(relation, { depth: null });

  // Nettoyage du test
  await prisma.mediaOrderItemMedia.deleteMany({
    where: {
      orderItemId: result.item.id,
    },
  });

  await prisma.mediaOrderItem.delete({
    where: {
      id: result.item.id,
    },
  });

  await prisma.campaign.delete({
    where: {
      id: result.campaign.id,
    },
  });

  await prisma.mediaOrder.delete({
    where: {
      id: result.order.id,
    },
  });

  console.log("\n🧹 Nettoyage terminé.");
}

main()
  .catch((error) => {
    console.error("\n❌ TEST ÉCHOUÉ");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
