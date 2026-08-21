import { NextResponse } from "next/server";
import crypto from "crypto";
import { requireAdmin, hashToken } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const body = await req.json();

    const advertiserId = String(body.advertiserId || "");
    const requestedHours = Number(body.hours ?? 24);

    if (!advertiserId) {
      return NextResponse.json(
        { success: false, error: "Annonceur obligatoire" },
        { status: 400 }
      );
    }

    const hours = Math.min(
      Math.max(
        Number.isFinite(requestedHours) ? requestedHours : 24,
        1
      ),
      168
    );

    const advertiser = await prisma.advertiser.findUnique({
      where: { id: advertiserId },
      select: {
        id: true,
        companyName: true,
      },
    });

    if (!advertiser) {
      return NextResponse.json(
        { success: false, error: "Annonceur introuvable" },
        { status: 404 }
      );
    }

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
      url,
      expiresAt,
      expiresInHours: hours,
      advertiser: {
        id: advertiser.id,
        companyName: advertiser.companyName,
      },
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
      { status: 403 }
    );
  }
}
