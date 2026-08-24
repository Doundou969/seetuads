import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "AccÃ¨s non autorisÃ©" }, { status: 403 });
  }

  try {
    const screens = await prisma.screen.findMany({
      include: {
        location: {
          include: { partner: { select: { businessName: true } } },
        },
        player: { select: { deviceId: true, status: true } },
        playlists: {
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            items: {
              orderBy: { position: "asc" },
              include: { media: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const serializedScreens = JSON.parse(
      JSON.stringify(screens, (_key, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );

    return NextResponse.json(serializedScreens);
  } catch (error) {
    console.error("ERREUR /api/admin/screens:", error);

    return NextResponse.json(
      {
        error: "Impossible de charger les ecrans",
        details:
          error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

