const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      clerkUserId: true,
      role: true,
      advertiser: {
        select: {
          id: true,
          companyName: true,
        },
      },
      partner: {
        select: {
          id: true,
        },
      },
    },
  });

  console.dir(users, { depth: null });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
