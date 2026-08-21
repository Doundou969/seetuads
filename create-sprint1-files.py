#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Creation complete des fichiers Sprint 1 - SeetuAds"""

import os

BASE = os.getcwd()

def write(rel_path, content):
    full = os.path.join(BASE, rel_path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8") as out:
        out.write(content)
    print(f"  OK {rel_path}")

print("=" * 60)
print("  CREATION FICHIERS SPRINT 1")
print("=" * 60)

# 1. lib/prisma.ts
write("lib/prisma.ts", r"""import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
""")

# 2. middleware.ts
write("middleware.ts", r"""import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/admin(.*)",
  "/api/campaigns(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\.(html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
""")

# 3. app/layout.tsx
write("app/layout.tsx", r"""import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SeetuAds - Votre plateforme publicitaire",
  description: "Gerez vos campagnes, boutiques et statistiques en un seul endroit.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="fr">
        <body className={inter.className}>{children}</body>
      </html>
    </ClerkProvider>
  );
}
""")

# 4. app/sign-in/[[...sign-in]]/page.tsx
write(r"app/sign-in/[[...sign-in]]/page.tsx", r"""import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <SignIn />
    </div>
  );
}
""")

# 5. app/sign-up/[[...sign-up]]/page.tsx
write(r"app/sign-up/[[...sign-up]]/page.tsx", r"""import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <SignUp />
    </div>
  );
}
""")

# 6. app/dashboard/page.tsx
write("app/dashboard/page.tsx", r"""import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tableau de bord</h1>
        <p className="text-gray-600 mb-8">Bienvenue sur SeetuAds</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="text-sm font-medium text-gray-500">Role</h3>
            <p className="text-2xl font-bold text-primary-600 mt-1">{user?.role || "N/A"}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="text-sm font-medium text-gray-500">Campagnes</h3>
            <p className="text-2xl font-bold text-primary-600 mt-1">0</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="text-sm font-medium text-gray-500">Ecrans</h3>
            <p className="text-2xl font-bold text-primary-600 mt-1">0</p>
          </div>
        </div>
      </div>
    </main>
  );
}
""")

# 7. app/api/webhooks/clerk/route.ts
write("app/api/webhooks/clerk/route.ts", r"""import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    return new Response("Webhook secret manquant", { status: 500 });
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Headers Svix manquants", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    return new Response("Verification webhook invalide", { status: 400 });
  }

  const eventType = evt.type;

  if (eventType === "user.created") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;
    const primaryEmail = email_addresses?.[0]?.email_address;

    await prisma.user.create({
      data: {
        clerkUserId: id as string,
        email: primaryEmail,
        firstName: first_name,
        lastName: last_name,
        avatarUrl: image_url,
        role: "ADVERTISER",
      },
    });
  }

  if (eventType === "user.updated") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;
    const primaryEmail = email_addresses?.[0]?.email_address;

    await prisma.user.update({
      where: { clerkUserId: id as string },
      data: {
        email: primaryEmail,
        firstName: first_name,
        lastName: last_name,
        avatarUrl: image_url,
      },
    });
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data;
    await prisma.user.deleteMany({
      where: { clerkUserId: id as string },
    });
  }

  return new Response("OK", { status: 200 });
}
""")

# 8. scripts/seed.ts
write("scripts/seed.ts", r"""import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding...");

  const zones = await prisma.$transaction([
    prisma.zone.create({ data: { name: "Plateau", city: "Dakar", district: "Plateau" } }),
    prisma.zone.create({ data: { name: "Almadies", city: "Dakar", district: "Almadies" } }),
    prisma.zone.create({ data: { name: "Medina", city: "Dakar", district: "Medina" } }),
    prisma.zone.create({ data: { name: "Parcelles Assainies", city: "Dakar", district: "Parcelles Assainies" } }),
    prisma.zone.create({ data: { name: "Ouakam", city: "Dakar", district: "Ouakam" } }),
    prisma.zone.create({ data: { name: "Mermoz", city: "Dakar", district: "Mermoz" } }),
  ]);
  console.log(`Zones creees: ${zones.length}`);

  await prisma.pricingRule.create({
    data: {
      name: "Forfait Starter",
      basePrice: 50000,
      durationMultiplier: 1.0,
      frequencyMultiplier: 1.0,
      zoneMultiplier: 1.0,
      active: true,
    },
  });

  await prisma.pricingRule.create({
    data: {
      name: "Forfait Pro",
      basePrice: 150000,
      durationMultiplier: 1.5,
      frequencyMultiplier: 2.0,
      zoneMultiplier: 1.2,
      active: true,
    },
  });

  await prisma.pricingRule.create({
    data: {
      name: "Forfait Enterprise",
      basePrice: 500000,
      durationMultiplier: 2.0,
      frequencyMultiplier: 3.0,
      zoneMultiplier: 1.5,
      active: true,
    },
  });

  console.log("Seed termine !");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
""")

print()
print("=" * 60)
print("  TOUS LES FICHIERS SONT CREES")
print("=" * 60)
print()
print("Prochaines etapes :")
print("  1. Remplir DATABASE_URL et les cles Clerk dans .env.local")
print("  2. npx prisma generate")
print("  3. npx prisma db push")
print("  4. npm install svix")
print("  5. npm run dev")
