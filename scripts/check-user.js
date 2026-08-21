const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      clerkUserId: true,
      role: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  });

  console.log("\n=== UTILISATEURS PRISMA ===\n");

  for (const user of users) {
    console.log(user);
  }

  console.log("\n=== UTILISATEURS ADMIN ===\n");

  const admins = users.filter(
    (user) => user.role === "ADMIN" || user.role === "OPERATOR"
  );

  console.log(admins);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());