const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const clerkUserId = process.argv[2];
  const email = process.argv[3];

  if (!clerkUserId || !email) {
    console.error(
      "\n❌ Usage : node scripts\\make-admin.js <CLERK_USER_ID> <EMAIL>\n"
    );
    process.exit(1);
  }

  const existingUser = await prisma.user.findUnique({
    where: { clerkUserId },
  });

  if (existingUser) {
    const updatedUser = await prisma.user.update({
      where: { clerkUserId },
      data: {
        role: "ADMIN",
        email,
      },
    });

    console.log("\n✅ UTILISATEUR EXISTANT PROMU ADMIN\n");
    console.log(updatedUser);
    return;
  }

  const newUser = await prisma.user.create({
    data: {
      clerkUserId,
      email,
      role: "ADMIN",
    },
  });

  console.log("\n✅ UTILISATEUR CLERK CRÉÉ DANS PRISMA\n");
  console.log("✅ RÔLE ADMIN ATTRIBUÉ\n");
  console.log(newUser);
}

main()
  .catch((error) => {
    console.error("\n❌ Erreur :", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());