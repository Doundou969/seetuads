import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Player introuvable." },
        { status: 400 }
      );
    }

    const player = await prisma.player.findUnique({
      where: { id },
      select: {
        id: true,
        deviceId: true,
        apiKey: true,
      },
    });

    if (!player) {
      return NextResponse.json(
        { error: "Player introuvable." },
        { status: 404 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    const url = new URL("/player", baseUrl);

    url.searchParams.set("deviceId", player.deviceId);
    url.searchParams.set("key", player.apiKey);

    return NextResponse.json({
      success: true,
      url: url.toString(),
      deviceId: player.deviceId,
    });
  } catch (error) {
    console.error("Player access link error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Impossible de générer le lien Player.",
      },
      { status: 500 }
    );
  }
}
