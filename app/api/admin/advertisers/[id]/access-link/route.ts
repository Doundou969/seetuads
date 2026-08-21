import { NextResponse } from "next/server";
import crypto from "crypto";
import { requireAdmin, hashToken } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Annonceur invalide",
        },
        { status: 400 }
      );
    }

    const advertiser = await prisma.advertiser.findUnique({
      where: { id },
      select: {
        id: true,
        companyName: true,
      },
    });

    if (!advertiser) {
      return NextResponse.json(
        {
          success: false,
          error: "Annonceur introuvable",
        },
        { status: 404 }
      );
    }

    let body: { hours?: number } = {};

    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const requestedHours = Number(body.hours ?? 24);

    const hours = Math.min(
      Math.max(
        Number.isFinite(requestedHours) ? requestedHours : 24,
        1
      ),
      168
    );

    const now = new Date();

    // Révoquer les anciens accès encore actifs
    await prisma.advertiserAccessToken.updateMany({
      where: {
        advertiserId: advertiser.id,
        revokedAt: null,
        expiresAt: {
          gt: now,
        },
      },
      data: {
        revokedAt: now,
      },
    });

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);

    const expiresAt = new Date(
      Date.now() + hours * 60 * 60 * 1000
    );

    await prisma.advertiserAccessToken.create({
      data: {
        advertiserId: advertiser.id,
        tokenHash,
        expiresAt,
      },
    });

    const origin =
      process.env.NEXT_PUBLIC_APP_URL ||
      new URL(req.url).origin;

    const url =
      `${origin}/advertiser/access/${rawToken}`;

    return NextResponse.json({
      success: true,
      advertiser: advertiser.companyName,
      url,
      expiresAt,
      expiresInHours: hours,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Erreur inconnue";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      {
        status: 403,
      }
    );
  }
}
