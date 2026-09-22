import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("MediaOrders :", await prisma.mediaOrder.count());
  console.log("MediaOrderItems :", await prisma.mediaOrderItem.count());
  console.log("MediaOrderItemMedia :", await prisma.mediaOrderItemMedia.count());
  console.log("Media :", await prisma.media.count());
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
