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
    const media = await prisma.media.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        fileUrl: true,
        fileType: true,
        durationSeconds: true,
        advertiser: { select: { companyName: true } },
      },
    });

    return NextResponse.json(media);
  } catch {
    return NextResponse.json(
      { error: "Impossible de charger les médias" },
      { status: 500 }
    );
  }
}