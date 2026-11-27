import { NextResponse } from "next/server";
import { getCurrentUser, requireAdvertiser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Connexion requise.", 401);

    // Do not trust a role or owner ID supplied by the browser. The destination
    // is derived exclusively from the authenticated account.
    if (user.role !== "ADVERTISER" && user.role !== "PARTNER") {
      return errorResponse(
        "L’envoi direct au catalogue est réservé aux comptes annonceur et partenaire.",
        403,
      );
    }

    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return errorResponse("Les informations du média sont invalides.", 400);
    }
    const data = body as Record<string, unknown>;
    const name = typeof data.name === "string" ? data.name.trim() : "";
    const fileUrl = typeof data.fileUrl === "string" ? data.fileUrl.trim() : "";
    const mimeType = typeof data.mimeType === "string"
      ? data.mimeType.trim().toLowerCase().split(";")[0]
      : "";
    const durationSeconds = Number(data.durationSeconds);
    const widthPx = Number(data.widthPx);
    const heightPx = Number(data.heightPx);
    const fileSizeBytes = Number(data.fileSizeBytes);

    if (!name || name.length > 150) {
      return errorResponse("Le nom du média doit contenir de 1 à 150 caractères.", 400);
    }
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(fileUrl);
    } catch {
      return errorResponse("L’URL du fichier est invalide.", 400);
    }
    if (parsedUrl.protocol !== "https:") {
      return errorResponse("L’URL du fichier doit utiliser HTTPS.", 400);
    }
    if (data.fileType !== "image" || !ALLOWED_IMAGE_TYPES.has(mimeType)) {
      return errorResponse("Le fichier doit être une image PNG, JPEG ou WebP.", 400);
    }
    if (!Number.isSafeInteger(durationSeconds) || durationSeconds < 1 || durationSeconds > 120) {
      return errorResponse("La durée de diffusion doit être comprise entre 1 et 120 secondes.", 400);
    }
    if (!Number.isSafeInteger(widthPx) || widthPx < 1 || widthPx > 3840 ||
        !Number.isSafeInteger(heightPx) || heightPx < 1 || heightPx > 2160) {
      return errorResponse("Les dimensions de l’image sont invalides.", 400);
    }
    if (!Number.isSafeInteger(fileSizeBytes) || fileSizeBytes < 1 || fileSizeBytes > MAX_FILE_SIZE) {
      return errorResponse("La taille du fichier est invalide ou dépasse 50 MB.", 400);
    }

    let advertiserId: string | null = null;
    let partnerId: string | null = null;
    if (user.role === "ADVERTISER") {
      const { advertiser } = await requireAdvertiser();
      advertiserId = advertiser.id;
    } else {
      if (!user.partner) {
        return errorResponse("Aucun profil partenaire n’est associé à ce compte.", 403);
      }
      partnerId = user.partner.id;
    }

    const media = await prisma.media.create({
      data: {
        advertiserId,
        partnerId,
        name,
        fileUrl,
        fileType: "image",
        mimeType,
        durationSeconds,
        widthPx,
        heightPx,
        fileSizeBytes: BigInt(fileSizeBytes),
        status: "UPLOADED",
      },
      select: { id: true, name: true, status: true },
    });

    return NextResponse.json(media, { status: 201 });
  } catch (error) {
    console.error("STUDIO MEDIA PUBLISH ERROR:", error);
    return errorResponse("Impossible d’ajouter ce visuel à la médiathèque.", 500);
  }
}