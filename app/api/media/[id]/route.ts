import { del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireAdvertiser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { advertiser } = await requireAdvertiser();
    const { id } = await params;

    const media = await prisma.media.findFirst({
      where: {
        id,
        advertiserId: advertiser.id,
      },
    });

    if (!media) {
      return NextResponse.json(
        { error: "Média non trouvé" },
        { status: 404 }
      );
    }

    console.log("MEDIA DELETE:", {
      id: media.id,
      name: media.name,
      fileUrl: media.fileUrl,
      advertiserId: media.advertiserId,
    });

    // Supprime le fichier du Vercel Blob.
    // Si l'URL n'est pas un Blob Vercel, on continue quand même
    // afin de ne pas bloquer la suppression de l'enregistrement DB.
    try {
      if (
        media.fileUrl &&
        media.fileUrl.includes("public.blob.vercel-storage.com")
      ) {
        await del(media.fileUrl, {
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });

        console.log("VERCEL BLOB DELETED:", media.fileUrl);
      } else {
        console.log(
          "VERCEL BLOB DELETE SKIPPED: URL non Vercel Blob",
          media.fileUrl
        );
      }
    } catch (blobError) {
      console.error("VERCEL BLOB DELETE ERROR:", blobError);
    }

    await prisma.media.delete({
      where: {
        id: media.id,
      },
    });

    console.log("MEDIA DATABASE DELETED:", media.id);

    return NextResponse.json({
      success: true,
      id: media.id,
    });
  } catch (err: unknown) {
    console.error("MEDIA DELETE ERROR:", err);

    const details =
      err instanceof Error ? err.message : String(err);

    return NextResponse.json(
      {
        error: details,
      },
      { status: 500 }
    );
  }
}
