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
      { error: "Accès non autorisé" },
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

  // La propriété items doit obligatoirement être un tableau.
  if (!Array.isArray(items)) {
    return NextResponse.json(
      { error: "La playlist doit contenir une liste d'éléments" },
      { status: 400 }
    );
  }

  // IMPORTANT :
  // Une playlist vide ne doit jamais être publiée.
  // Sans cette vérification, le code désactive l'ancienne playlist
  // puis crée une nouvelle playlist ACTIVE avec 0 item.
  if (items.length === 0) {
    return NextResponse.json(
      { error: "Impossible de publier une playlist vide" },
      { status: 400 }
    );
  }

  // Validation de chaque élément.
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
          "Chaque élément doit contenir un média et une durée de 1 à 300 secondes",
      },
      { status: 400 }
    );
  }

  const { id: screenId } = await params;

  try {
    // Vérifier que l'écran existe.
    const screen = await prisma.screen.findUnique({
      where: { id: screenId },
      select: { id: true },
    });

    if (!screen) {
      return NextResponse.json(
        { error: "Écran non trouvé" },
        { status: 404 }
      );
    }

    // Récupérer les IDs uniques des médias.
    const mediaIds = [...new Set(items.map((item) => item.mediaId))];

    // Vérifier que tous les médias existent et sont APPROVED.
    const approvedMedia = await prisma.media.findMany({
      where: {
        id: { in: mediaIds },
        status: "APPROVED",
      },
      select: { id: true },
    });

    if (approvedMedia.length !== mediaIds.length) {
      return NextResponse.json(
        { error: "Certains médias sont absents ou non approuvés" },
        { status: 400 }
      );
    }

    // Créer une nouvelle version de la playlist dans une transaction.
    const playlist = await prisma.$transaction(async (tx) => {
      // Désactiver uniquement l'ancienne playlist ACTIVE.
      await tx.playlist.updateMany({
        where: {
          screenId,
          status: "ACTIVE",
        },
        data: {
          status: "INACTIVE",
        },
      });

      // Récupérer la dernière version pour calculer la suivante.
      const lastPlaylist = await tx.playlist.findFirst({
        where: { screenId },
        orderBy: { version: "desc" },
        select: { version: true },
      });

      const newVersion = (lastPlaylist?.version ?? 0) + 1;

      // Créer la nouvelle playlist ACTIVE avec ses items.
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

    return NextResponse.json(playlist);
  } catch (error) {
    console.error(
      `Erreur lors de la création de la playlist pour l'écran ${screenId}:`,
      error
    );

    return NextResponse.json(
      { error: "Impossible de créer la playlist" },
      { status: 500 }
    );
  }
}