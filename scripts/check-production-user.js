const fs = require("fs");

const envFile = ".env.production.local";

const content = fs.readFileSync(envFile, "utf8");

for (const line of content.split(/\r?\n/)) {
  const match = line.match(/^([^#=\s]+)=(.*)$/);

  if (!match) continue;

  let [, key, value] = match;

  value = value.trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  process.env[key] = value;
}

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("\n=== BASE DE PRODUCTION ===\n");

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

  for (const user of users) {
    console.log(user);
  }

  console.log("\n=== ADMIN PRODUCTION ===\n");

  const admins = users.filter(
    (user) => user.role === "ADMIN" || user.role === "OPERATOR"
  );

  console.log(admins);
}

main()
  .catch((error) => {
    console.error("ERREUR :", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });