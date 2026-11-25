import { NextResponse } from "next/server";
import {
  HttpError,
  requirePartner,
} from "@/lib/permissions";
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

function optionalPositiveInteger(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numberValue = Number(value);

  if (!Number.isSafeInteger(numberValue) || numberValue <= 0) {
    return Number.NaN;
  }

  return numberValue;
}

export async function GET() {
  try {
    const { partner } = await requirePartner();

    const media = await prisma.media.findMany({
      where: {
        partnerId: partner.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(serializeData(media));
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    console.error("PARTNER MEDIA GET ERROR:", error);

    return NextResponse.json(
      { error: "Impossible de charger vos médias." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { partner } = await requirePartner();

    const body: unknown = await req.json().catch(() => null);

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      throw new HttpError(
        "Les données du média sont invalides.",
        400
      );
    }

    const data = body as Record<string, unknown>;

    const name =
      typeof data.name === "string"
        ? data.name.trim()
        : "";

    const fileUrl =
      typeof data.fileUrl === "string"
        ? data.fileUrl.trim()
        : "";

    const fileType =
      typeof data.fileType === "string"
        ? data.fileType.trim().toLowerCase()
        : "";

    const mimeType =
      typeof data.mimeType === "string"
        ? data.mimeType.trim().toLowerCase().split(";")[0]
        : "";

    const durationSeconds =
      data.durationSeconds === undefined ||
      data.durationSeconds === null
        ? 15
        : Number(data.durationSeconds);

    const widthPx = optionalPositiveInteger(data.widthPx);
    const heightPx = optionalPositiveInteger(data.heightPx);
    const fileSizeBytes = optionalPositiveInteger(
      data.fileSizeBytes
    );

    if (!name) {
      throw new HttpError(
        "Le nom du média est requis.",
        400
      );
    }

    if (!fileUrl) {
      throw new HttpError(
        "L’URL du fichier est requise.",
        400
      );
    }

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(fileUrl);
    } catch {
      throw new HttpError(
        "L’URL du fichier est invalide.",
        400
      );
    }

    if (parsedUrl.protocol !== "https:") {
      throw new HttpError(
        "L’URL du fichier doit utiliser HTTPS.",
        400
      );
    }

    if (fileType !== "video" && fileType !== "image") {
      throw new HttpError(
        "Le type du média doit être video ou image.",
        400
      );
    }

    if (!ALLOWED_TYPES.includes(mimeType)) {
      throw new HttpError(
        `Type de fichier non supporté : ${mimeType || "inconnu"}.`,
        400
      );
    }

    if (
      (fileType === "video" && !mimeType.startsWith("video/")) ||
      (fileType === "image" && !mimeType.startsWith("image/"))
    ) {
      throw new HttpError(
        "Le type du média ne correspond pas au fichier.",
        400
      );
    }

    if (
      !Number.isSafeInteger(durationSeconds) ||
      durationSeconds <= 0
    ) {
      throw new HttpError(
        "La durée du média est invalide.",
        400
      );
    }

    if (Number.isNaN(widthPx)) {
      throw new HttpError(
        "La largeur du média est invalide.",
        400
      );
    }

    if (Number.isNaN(heightPx)) {
      throw new HttpError(
        "La hauteur du média est invalide.",
        400
      );
    }

    if (
      Number.isNaN(fileSizeBytes) ||
      (fileSizeBytes !== null && fileSizeBytes > MAX_SIZE)
    ) {
      throw new HttpError(
        "La taille du fichier est invalide ou dépasse 50 MB.",
        400
      );
    }

    const media = await prisma.media.create({
      data: {
        partnerId: partner.id,
        advertiserId: null,
        name,
        fileUrl,
        fileType,
        mimeType,
        durationSeconds,
        widthPx,
        heightPx,
        fileSizeBytes:
          fileSizeBytes === null
            ? null
            : BigInt(fileSizeBytes),
        status: "UPLOADED",
      },
    });

    return NextResponse.json(serializeData(media), {
      status: 201,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    console.error("PARTNER MEDIA POST ERROR:", error);

    return NextResponse.json(
      { error: "Impossible d’enregistrer le média." },
      { status: 500 }
    );
  }
}