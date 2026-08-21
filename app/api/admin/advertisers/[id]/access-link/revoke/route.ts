import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/permissions";
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
      select: { id: true },
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

    const result =
      await prisma.advertiserAccessToken.updateMany({
        where: {
          advertiserId: advertiser.id,
          revokedAt: null,
          expiresAt: {
            gt: new Date(),
          },
        },
        data: {
          revokedAt: new Date(),
        },
      });

    return NextResponse.json({
      success: true,
      revokedCount: result.count,
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
