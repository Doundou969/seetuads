import { del } from "@vercel/blob";
import { NextResponse } from "next/server";
import {
  HttpError,
  requirePartner,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { partner } = await requirePartner();
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Identifiant du média manquant." },
        { status: 400 }
      );
    }

    const media = await prisma.media.findFirst({
      where: {
        id,
        partnerId: partner.id,
      },
    });

    if (!media) {
      return NextResponse.json(
        { error: "Média introuvable." },
        { status: 404 }
      );
    }

    const playbackLogs = await prisma.playbackLog.count({
      where: {
        mediaId: media.id,
      },
    });

    if (playbackLogs > 0) {
      return NextResponse.json(
        {
          error:
            "Ce média a déjà été diffusé et ne peut pas être supprimé.",
        },
        { status: 409 }
      );
    }

    if (
      media.fileUrl &&
      media.fileUrl.includes("public.blob.vercel-storage.com")
    ) {
      try {
        await del(media.fileUrl, {
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
      } catch (error) {
        // On poursuit la suppression de l'enregistrement en base,
        // comme dans la route de suppression des médias annonceur.
        console.error(
          "PARTNER MEDIA BLOB DELETE ERROR:",
          error
        );
      }
    }

    await prisma.media.delete({
      where: {
        id: media.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    console.error("PARTNER MEDIA DELETE ERROR:", error);

    return NextResponse.json(
      { error: "Impossible de supprimer le média." },
      { status: 500 }
    );
  }
}