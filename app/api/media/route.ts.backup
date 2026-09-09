import { NextResponse } from "next/server";
import { requireAdvertiser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const ALLOWED_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_SIZE = 50 * 1024 * 1024;

function serializeData<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_key, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

export async function GET() {
  try {
    const { advertiser } = await requireAdvertiser();

    const media = await prisma.media.findMany({
      where: {
        advertiserId: advertiser.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(serializeData(media));
  } catch (error) {
    console.error("MEDIA GET ERROR:", error);

    const details =
      error instanceof Error ? error.message : "Erreur inconnue";

    return NextResponse.json(
      {
        error: "Accès non autorisé.",
        details,
      },
      {
        status: 403,
      }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { advertiser } = await requireAdvertiser();

    const body = await req.json();

    console.log("MEDIA CREATE BODY:", body);
    console.log("ADVERTISER ID:", advertiser.id);

    const name =
      typeof body.name === "string" ? body.name.trim() : "";

    const fileUrl =
      typeof body.fileUrl === "string" ? body.fileUrl.trim() : "";

    const fileType =
      typeof body.fileType === "string" ? body.fileType.trim() : "";

    const mimeType =
      typeof body.mimeType === "string" ? body.mimeType.trim() : "";

    const durationSeconds = Number(body.durationSeconds);

    const widthPx =
      body.widthPx == null ? null : Number(body.widthPx);

    const heightPx =
      body.heightPx == null ? null : Number(body.heightPx);

    const fileSizeBytes =
      body.fileSizeBytes == null
        ? null
        : Number(body.fileSizeBytes);

    if (!name) {
      return NextResponse.json(
        {
          error: "Le nom du média est requis.",
        },
        {
          status: 400,
        }
      );
    }

    if (!fileUrl) {
      return NextResponse.json(
        {
          error: "L'URL du fichier est requise.",
        },
        {
          status: 400,
        }
      );
    }

    if (fileType !== "video" && fileType !== "image") {
      return NextResponse.json(
        {
          error: "Le type du média doit être video ou image.",
        },
        {
          status: 400,
        }
      );
    }

    if (!mimeType) {
      return NextResponse.json(
        {
          error: "Le type MIME du fichier est requis.",
        },
        {
          status: 400,
        }
      );
    }

    if (!ALLOWED_TYPES.includes(mimeType)) {
      return NextResponse.json(
        {
          error: `Type de fichier non supporté : ${mimeType}`,
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isFinite(durationSeconds) ||
      durationSeconds <= 0
    ) {
      return NextResponse.json(
        {
          error: "La durée du média est invalide.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      widthPx !== null &&
      (!Number.isFinite(widthPx) || widthPx <= 0)
    ) {
      return NextResponse.json(
        {
          error: "La largeur du média est invalide.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      heightPx !== null &&
      (!Number.isFinite(heightPx) || heightPx <= 0)
    ) {
      return NextResponse.json(
        {
          error: "La hauteur du média est invalide.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      fileSizeBytes !== null &&
      (
        !Number.isFinite(fileSizeBytes) ||
        fileSizeBytes <= 0 ||
        fileSizeBytes > MAX_SIZE
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Taille du fichier invalide ou supérieure à 50 MB.",
        },
        {
          status: 400,
        }
      );
    }

    const media = await prisma.media.create({
      data: {
        advertiserId: advertiser.id,
        name,
        fileUrl,
        fileType,
        mimeType,
        durationSeconds,
        widthPx,
        heightPx,
        fileSizeBytes,
        status: "UPLOADED",
      },
    });

    console.log("MEDIA CREATED:", media.id);

    return NextResponse.json(
      serializeData(media),
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("MEDIA POST ERROR:", error);

    const details =
      error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        error: "Impossible de créer le média.",
        details,
      },
      {
        status: 500,
      }
    );
  }
}