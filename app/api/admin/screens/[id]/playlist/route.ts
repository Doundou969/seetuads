import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

type PlaylistItemInput = {
  mediaId: string;
  durationSeconds: number;
};

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json(
      { error: "AccÃ¨s non autorisÃ©" },
      { status: 403 }
    );
  }

  let body: { items?: PlaylistItemInput[] };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "JSON invalide" },
      { status: 400 }
    );
  }

  const { items } = body;

  // La propriÃ©tÃ© items doit obligatoirement Ãªtre un tableau.
  if (!Array.isArray(items)) {
    return NextResponse.json(
      { error: "La playlist doit contenir une liste d'Ã©lÃ©ments" },
      { status: 400 }
    );
  }

  // IMPORTANT :
  // Une playlist vide ne doit jamais Ãªtre publiÃ©e.
  // Sans cette vÃ©rification, le code dÃ©sactive l'ancienne playlist
  // puis crÃ©e une nouvelle playlist ACTIVE avec 0 item.
  if (items.length === 0) {
    return NextResponse.json(
      { error: "Impossible de publier une playlist vide" },
      { status: 400 }
    );
  }

  // Validation de chaque Ã©lÃ©ment.
  if (
    !items.every(
      (item) =>
        typeof item.mediaId === "string" &&
        item.mediaId.length > 0 &&
        Number.isInteger(item.durationSeconds) &&
        item.durationSeconds >= 1 &&
        item.durationSeconds <= 300
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Chaque Ã©lÃ©ment doit contenir un mÃ©dia et une durÃ©e de 1 Ã  300 secondes",
      },
      { status: 400 }
    );
  }

  const { id: screenId } = await params;

  try {
    // VÃ©rifier que l'Ã©cran existe.
    const screen = await prisma.screen.findUnique({
      where: { id: screenId },
      select: { id: true },
    });

    if (!screen) {
      return NextResponse.json(
        { error: "Ã‰cran non trouvÃ©" },
        { status: 404 }
      );
    }

    // RÃ©cupÃ©rer les IDs uniques des mÃ©dias.
    const mediaIds = [...new Set(items.map((item) => item.mediaId))];

    // VÃ©rifier que tous les mÃ©dias existent et sont APPROVED.
    const approvedMedia = await prisma.media.findMany({
      where: {
        id: { in: mediaIds },
        status: "APPROVED",
      },
      select: { id: true },
    });

    if (approvedMedia.length !== mediaIds.length) {
      return NextResponse.json(
        { error: "Certains mÃ©dias sont absents ou non approuvÃ©s" },
        { status: 400 }
      );
    }

    // CrÃ©er une nouvelle version de la playlist dans une transaction.
    const playlist = await prisma.$transaction(async (tx) => {
      // Verrou transactionnel par écran :
      // une seule publication à la fois peut calculer la prochaine version.
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(
          hashtextextended(${screenId}, 0)
        )
      `;
      // DÃ©sactiver uniquement l'ancienne playlist ACTIVE.
      await tx.playlist.updateMany({
        where: {
          screenId,
          status: "ACTIVE",
        },
        data: {
          status: "INACTIVE",
        },
      });

      // RÃ©cupÃ©rer la derniÃ¨re version pour calculer la suivante.
      const lastPlaylist = await tx.playlist.findFirst({
        where: { screenId },
        orderBy: { version: "desc" },
        select: { version: true },
      });

      const newVersion = (lastPlaylist?.version ?? 0) + 1;

      // CrÃ©er la nouvelle playlist ACTIVE avec ses items.
      return tx.playlist.create({
        data: {
          screenId,
          version: newVersion,
          status: "ACTIVE",
          publishedAt: new Date(),
          items: {
            create: items.map((item, index) => ({
              mediaId: item.mediaId,
              position: index,
              durationSeconds: item.durationSeconds,
            })),
          },
        },
        include: {
          items: {
            orderBy: { position: "asc" },
            include: {
              media: true,
            },
          },
        },
      });
    });

    return NextResponse.json(
      JSON.parse(
        JSON.stringify(playlist, (_key, value) =>
          typeof value === "bigint" ? value.toString() : value
        )
      )
    );
  } catch (error) {
    console.error(
      `Erreur lors de la crÃ©ation de la playlist pour l'Ã©cran ${screenId}:`,
      error
    );

    return NextResponse.json(
      { error: "Impossible de crÃ©er la playlist" },
      { status: 500 }
    );
  }
}


