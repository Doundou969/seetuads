import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireMediaUploader } from "@/lib/permissions";

const ALLOWED_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

const MAX_SIZE = 50 * 1024 * 1024;

function getExtension(filename: string): string {
  const parts = filename.toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() || "" : "";
}

function getSafeExtension(
  mimeType: string,
  filename: string
): string | null {
  const extension = getExtension(filename);

  const allowedExtensions: Record<string, string[]> = {
    "video/mp4": ["mp4"],
    "video/webm": ["webm"],
    "video/quicktime": ["mov"],
    "image/jpeg": ["jpg", "jpeg"],
    "image/png": ["png"],
    "image/webp": ["webp"],
  };

  if (!allowedExtensions[mimeType]?.includes(extension)) {
    return null;
  }

  return extension;
}

export async function POST(req: Request) {
  try {
    await requireMediaUploader();

    let file: File | null = null;

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const uploaded = formData.get("file");

      if (uploaded instanceof File) {
        file = uploaded;
      }
    } else if (
      contentType.startsWith("video/") ||
      contentType.startsWith("image/")
    ) {
      const buffer = await req.arrayBuffer();

      if (buffer.byteLength === 0) {
        return NextResponse.json(
          { error: "Fichier vide." },
          { status: 400 }
        );
      }

      const filename =
        new URL(req.url).searchParams.get("filename") ||
        `media-${Date.now()}`;

      file = new File([buffer], filename, {
        type: contentType,
      });
    }

    if (!file) {
      return NextResponse.json(
        {
          error:
            "Aucun fichier reçu. Envoyez le fichier avec le champ 'file'.",
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
      return NextResponse.json(
        {
          error:
            "Type de fichier non supporté. Utilisez MP4, WebM, MOV, JPG, PNG ou WebP.",
        },
        { status: 400 }
      );
    }

    if (file.size <= 0) {
      return NextResponse.json(
        {
          error: "Le fichier est vide.",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        {
          error: "Fichier trop volumineux. Taille maximale : 50 MB.",
        },
        { status: 400 }
      );
    }

    const extension = getSafeExtension(file.type, file.name);

    if (!extension) {
      return NextResponse.json(
        {
          error:
            "L'extension du fichier ne correspond pas à son type.",
        },
        { status: 400 }
      );
    }

    const safeFilename = `${crypto.randomUUID()}.${extension}`;

    const blob = await put(safeFilename, file, {
      access: "public",
      addRandomSuffix: true,
    });

    return NextResponse.json({
      success: true,
      url: blob.url,
      name: safeFilename,
      originalName: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error: unknown) {
    console.error("Upload error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Impossible d'effectuer l'upload.",
      },
      { status: 500 }
    );
  }
}