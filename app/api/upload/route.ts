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

const MIME_EXTENSIONS: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function getMimeTypeFromFilename(filename: string): string {
  const extension = getExtension(filename);

  const mimeByExtension: Record<string, string> = {
    mp4: "video/mp4",
    m4v: "video/mp4",
    webm: "video/webm",
    mov: "video/quicktime",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
  };

  return extension && mimeByExtension[extension]
    ? mimeByExtension[extension]
    : "";
}
function getExtension(filename: string): string {
  const cleanName = filename.split("?")[0].split("#")[0];
  const parts = cleanName.toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() || "" : "";
}

function getSafeExtension(
  mimeType: string,
  filename: string
): string | null {
  const fallbackExtension = MIME_EXTENSIONS[mimeType];

  if (!fallbackExtension) {
    return null;
  }

  const uploadedExtension = getExtension(filename);

  const compatibleExtensions: Record<string, string[]> = {
    "video/mp4": ["mp4", "m4v"],
    "video/webm": ["webm"],
    "video/quicktime": ["mov"],
    "image/jpeg": ["jpg", "jpeg"],
    "image/png": ["png"],
    "image/webp": ["webp"],
  };

  if (compatibleExtensions[mimeType]?.includes(uploadedExtension)) {
    return uploadedExtension;
  }

  return fallbackExtension;
}

export async function POST(req: Request) {
  try {
    await requireMediaUploader();

    const contentType = req.headers.get("content-type") || "";

    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        {
          success: false,
          error: "Le fichier doit ÃƒÆ’Ã‚Âªtre envoyÃƒÆ’Ã‚Â© en multipart/form-data.",
        },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const uploaded = formData.get("file");

    if (!(uploaded instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: "Aucun fichier reÃƒÆ’Ã‚Â§u avec le champ 'file'.",
        },
        { status: 400 }
      );
    }

    const file = uploaded;

    const normalizedMimeType = file.type
      .toLowerCase()
      .split(";")[0]
      .trim();

    const extensionMimeType =
      getMimeTypeFromFilename(file.name);

    const resolvedMimeType = ALLOWED_TYPES.includes(
      normalizedMimeType as (typeof ALLOWED_TYPES)[number]
    )
      ? normalizedMimeType
      : extensionMimeType;

    if (
      !ALLOWED_TYPES.includes(
        resolvedMimeType as (typeof ALLOWED_TYPES)[number]
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            `Type non supportÃƒÆ’Ã‚Â© : ${
              file.type || "inconnu"
            }. ` +
            "Utilisez MP4, WebM, MOV, JPG, PNG ou WebP.",
        },
        { status: 400 }
      );
    }

    if (file.size <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Le fichier est vide.",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: "Fichier trop volumineux. Taille maximale : 50 MB.",
        },
        { status: 400 }
      );
    }

    const extension = getSafeExtension(resolvedMimeType, file.name);

    if (!extension) {
      return NextResponse.json(
        {
          success: false,
          error: "Impossible de dÃƒÆ’Ã‚Â©terminer une extension valide.",
        },
        { status: 400 }
      );
    }

    const safeFilename = `${crypto.randomUUID()}.${extension}`;

    console.log("Vercel Blob upload via connected OIDC store:", {
      filename: safeFilename,
      mimeType: resolvedMimeType,
      size: file.size,
      hasStoreId: Boolean(process.env.BLOB_STORE_ID),
    });

    const blob = await put(safeFilename, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: resolvedMimeType,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    console.log("Vercel Blob upload successful:", {
      url: blob.url,
      pathname: blob.pathname,
    });

    return NextResponse.json({
      success: true,
      url: blob.url,
      name: blob.pathname,
      originalName: file.name,
      size: file.size,
      type: resolvedMimeType,
    });
  } catch (error: unknown) {
    console.error("Upload error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

