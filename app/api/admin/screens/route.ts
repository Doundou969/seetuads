import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
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

    return NextResponse.json(screens);
  } catch {
    return NextResponse.json(
      { error: "Impossible de charger les écrans" },
      { status: 500 }
    );
  }
}