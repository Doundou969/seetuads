const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.update({
    where: {
      clerkUserId: "user_3ICr96CYTWtxVi0ITkmudPe2PDh",
    },
    data: {
      role: "ADMIN",
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

  console.log("UTILISATEUR MIS À JOUR :");
  console.dir(user, { depth: null });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
