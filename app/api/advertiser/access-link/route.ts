import { NextResponse } from "next/server";
import crypto from "crypto";
import { requireAdvertiser, hashToken } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { advertiser } = await requireAdvertiser();

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
      `${origin}/api/advertiser/access-link/${rawToken}`;

    return NextResponse.json({
      success: true,
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
