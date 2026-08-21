import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  TEMP_ADVERTISER_COOKIE,
  hashToken,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token || token.length < 32) {
      return NextResponse.json(
        {
          error: "Lien temporaire invalide",
        },
        {
          status: 400,
        }
      );
    }

    const tokenHash = hashToken(token);

    const accessToken =
      await prisma.advertiserAccessToken.findUnique({
        where: {
          tokenHash,
        },
        include: {
          advertiser: true,
        },
      });

    if (!accessToken) {
      return NextResponse.json(
        {
          error: "Lien temporaire introuvable",
        },
        {
          status: 404,
        }
      );
    }

    if (accessToken.revokedAt) {
      return NextResponse.json(
        {
          error: "Ce lien temporaire a été révoqué",
        },
        {
          status: 410,
        }
      );
    }

    if (accessToken.expiresAt <= new Date()) {
      return NextResponse.json(
        {
          error: "Ce lien temporaire a expiré",
        },
        {
          status: 410,
        }
      );
    }

    const cookieStore = await cookies();

    cookieStore.set(
      TEMP_ADVERTISER_COOKIE,
      token,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: accessToken.expiresAt,
      }
    );

    await prisma.advertiserAccessToken.update({
      where: {
        id: accessToken.id,
      },
      data: {
        lastUsedAt: new Date(),
      },
    });

    const origin =
      process.env.NEXT_PUBLIC_APP_URL ||
      new URL(req.url).origin;

    return NextResponse.redirect(
      new URL(
        "/advertiser/dashboard",
        origin
      )
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Erreur inconnue";

    return NextResponse.json(
      {
        error: message,
      },
      {
        status: 500,
      }
    );
  }
}
