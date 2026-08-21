import { NextResponse } from "next/server";
import crypto from "crypto";
import { requireAdmin, hashToken } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const body = await req.json();

    const companyName = String(body.companyName ?? "").trim();
    const contactName = String(body.contactName ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const phone = String(body.phone ?? "").trim();
    const status = String(body.status ?? "PENDING").trim();

    if (!companyName) {
      return NextResponse.json(
        {
          success: false,
          error: "Le nom de l'entreprise est obligatoire.",
        },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: "L'adresse email est obligatoire.",
        },
        { status: 400 }
      );
    }

    const existingAdvertiser =
      await prisma.advertiser.findFirst({
        where: {
          email,
        },
        select: {
          id: true,
          companyName: true,
        },
      });

    if (existingAdvertiser) {
      return NextResponse.json(
        {
          success: false,
          error: `Un annonceur existe déjà avec cet email : ${existingAdvertiser.companyName}`,
        },
        { status: 409 }
      );
    }

    const clerkUserId =
      `admin-created-${crypto.randomUUID()}`;

    const result = await prisma.$transaction(
      async (tx) => {
        const user = await tx.user.create({
          data: {
            clerkUserId,
            role: "ADVERTISER",
            email,
            firstName: contactName || null,
          },
        });

        const advertiser =
          await tx.advertiser.create({
            data: {
              userId: user.id,
              companyName,
              contactName: contactName || null,
              phone: phone || null,
              email,
              status: status as any,
            },
          });

        const rawToken =
          crypto.randomBytes(32).toString("hex");

        const tokenHash = hashToken(rawToken);

        const expiresAt = new Date(
          Date.now() + 24 * 60 * 60 * 1000
        );

        await tx.advertiserAccessToken.create({
          data: {
            advertiserId: advertiser.id,
            tokenHash,
            expiresAt,
          },
        });

        return {
          advertiser,
          rawToken,
          expiresAt,
        };
      }
    );

    const origin =
      process.env.NEXT_PUBLIC_APP_URL ||
      new URL(req.url).origin;

    const accessUrl =
      `${origin}/advertiser/access/${result.rawToken}`;

    return NextResponse.json({
      success: true,
      advertiser: {
        id: result.advertiser.id,
        companyName: result.advertiser.companyName,
        email: result.advertiser.email,
      },
      url: accessUrl,
      expiresAt: result.expiresAt,
      expiresInHours: 24,
    });
  } catch (error: unknown) {
    console.error("CREATE ADVERTISER ERROR:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Erreur inconnue.";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
