const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: {
      clerkUserId: "user_3ICr96CYTWtxVi0ITkmudPe2PDh",
    },
    select: {
      id: true,
      clerkUserId: true,
      role: true,
      email: true,
      advertiser: {
        select: {
          id: true,
          companyName: true,
        },
      },
    },
  });

  console.dir(user, { depth: null });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
