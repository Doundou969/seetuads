import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("CLERK_WEBHOOK_SECRET manquant");
    return new NextResponse("Configuration webhook manquante", {
      status: 500,
    });
  }

  const headerPayload = await headers();

  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new NextResponse("Headers Svix manquants", {
      status: 400,
    });
  }

  const body = await req.text();

  let evt: any;

  try {
    const wh = new Webhook(WEBHOOK_SECRET);

    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch (error) {
    console.error("Webhook Clerk : signature invalide", error);

    return new NextResponse("Signature invalide", {
      status: 400,
    });
  }

  const { type, data } = evt;

  const clerkUserId = data?.id;

  if (!clerkUserId) {
    return new NextResponse("Clerk user ID manquant", {
      status: 400,
    });
  }

  try {
    switch (type) {
      case "user.created": {
        const email =
          data.email_addresses?.[0]?.email_address ?? null;

        await prisma.user.upsert({
          where: {
            clerkUserId,
          },
          update: {
            email,
            firstName: data.first_name ?? null,
            lastName: data.last_name ?? null,
          },
          create: {
            clerkUserId,
            email,
            firstName: data.first_name ?? null,
            lastName: data.last_name ?? null,
            role: "ADVERTISER",
          },
        });

        console.log(`✅ Clerk user créé/synchronisé : ${clerkUserId}`);

        break;
      }

      case "user.updated": {
        const email =
          data.email_addresses?.[0]?.email_address ?? null;

        const existingUser = await prisma.user.findUnique({
          where: {
            clerkUserId,
          },
        });

        if (existingUser) {
          await prisma.user.update({
            where: {
              clerkUserId,
            },
            data: {
              email,
              firstName: data.first_name ?? null,
              lastName: data.last_name ?? null,
            },
          });

          console.log(`✅ Clerk user mis à jour : ${clerkUserId}`);
        } else {
          await prisma.user.create({
            data: {
              clerkUserId,
              email,
              firstName: data.first_name ?? null,
              lastName: data.last_name ?? null,
              role: "ADVERTISER",
            },
          });

          console.log(
            `✅ Clerk user absent de Prisma, créé : ${clerkUserId}`
          );
        }

        break;
      }

      case "user.deleted": {
        const existingUser = await prisma.user.findUnique({
          where: {
            clerkUserId,
          },
        });

        if (existingUser) {
          await prisma.user.delete({
            where: {
              clerkUserId,
            },
          });

          console.log(`✅ Clerk user supprimé : ${clerkUserId}`);
        } else {
          console.log(
            `ℹ️ User Prisma déjà absent : ${clerkUserId}`
          );
        }

        break;
      }

      default:
        console.log(`ℹ️ Événement Clerk ignoré : ${type}`);
    }

    return NextResponse.json({
      success: true,
      type,
    });
  } catch (error) {
    console.error(
      `❌ Erreur webhook Clerk (${type}):`,
      error
    );

    return new NextResponse("Erreur base de données", {
      status: 500,
    });
  }
}