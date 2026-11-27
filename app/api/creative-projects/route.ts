import { NextResponse } from "next/server";
import type { CreativeKind, Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const CREATIVE_KINDS = [
  "SLIDESHOW",
  "DIGITAL_MENU",
  "ADVERTISEMENT",
] as const;
const ALLOWED_ROLES = ["ADMIN", "OPERATOR", "ADVERTISER", "PARTNER"] as const;
const MAX_DATA_BYTES = 1_000_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function getAuthorizedUser() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (!(ALLOWED_ROLES as readonly string[]).includes(user.role)) return null;
  return user;
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function parseProjectInput(body: unknown) {
  if (!isRecord(body)) return null;

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const kind = body.kind;
  const canvasWidth = body.canvasWidth ?? 1920;
  const canvasHeight = body.canvasHeight ?? 1080;
  const data = body.data;
  const id = typeof body.id === "string" ? body.id.trim() : undefined;

  if (!name || name.length > 100) return null;
  if (typeof kind !== "string" || !(CREATIVE_KINDS as readonly string[]).includes(kind)) {
    return null;
  }
  if (!Number.isInteger(canvasWidth) || Number(canvasWidth) < 320 || Number(canvasWidth) > 3840) {
    return null;
  }
  if (!Number.isInteger(canvasHeight) || Number(canvasHeight) < 180 || Number(canvasHeight) > 2160) {
    return null;
  }
  if (!isRecord(data)) return null;
  if (id !== undefined && !id) return null;

  let serialized: string;
  try {
    serialized = JSON.stringify(data);
  } catch {
    return null;
  }
  if (Buffer.byteLength(serialized, "utf8") > MAX_DATA_BYTES) return null;

  return {
    id,
    name,
    kind: kind as CreativeKind,
    canvasWidth: Number(canvasWidth),
    canvasHeight: Number(canvasHeight),
    data: JSON.parse(serialized) as Prisma.InputJsonValue,
  };
}

export async function GET(request: Request) {
  try {
    const user = await getAuthorizedUser();
    if (!user) return errorResponse("Connexion requise.", 401);

    const id = new URL(request.url).searchParams.get("id");
    if (id) {
      const project = await prisma.creativeProject.findFirst({
        where: { id, userId: user.id },
      });
      if (!project) return errorResponse("Projet introuvable.", 404);
      return NextResponse.json(project, {
        headers: { "Cache-Control": "no-store" },
      });
    }

    const projects = await prisma.creativeProject.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        kind: true,
        canvasWidth: true,
        canvasHeight: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(projects, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("CREATIVE PROJECT GET ERROR:", error);
    return errorResponse("Impossible de charger les projets.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthorizedUser();
    if (!user) return errorResponse("Connexion requise.", 401);

    const body: unknown = await request.json().catch(() => null);
    const input = parseProjectInput(body);
    if (!input) return errorResponse("Les informations du projet sont invalides.", 400);

    const project = await prisma.creativeProject.create({
      data: {
        userId: user.id,
        name: input.name,
        kind: input.kind,
        canvasWidth: input.canvasWidth,
        canvasHeight: input.canvasHeight,
        data: input.data,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("CREATIVE PROJECT CREATE ERROR:", error);
    return errorResponse("Impossible d’enregistrer le projet.", 500);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getAuthorizedUser();
    if (!user) return errorResponse("Connexion requise.", 401);

    const body: unknown = await request.json().catch(() => null);
    const input = parseProjectInput(body);
    if (!input || !input.id) {
      return errorResponse("Identifiant ou informations du projet invalides.", 400);
    }

    const existing = await prisma.creativeProject.findFirst({
      where: { id: input.id, userId: user.id },
      select: { id: true },
    });
    if (!existing) return errorResponse("Projet introuvable.", 404);

    const project = await prisma.creativeProject.update({
      where: { id: existing.id },
      data: {
        name: input.name,
        kind: input.kind,
        canvasWidth: input.canvasWidth,
        canvasHeight: input.canvasHeight,
        data: input.data,
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("CREATIVE PROJECT UPDATE ERROR:", error);
    return errorResponse("Impossible de mettre à jour le projet.", 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getAuthorizedUser();
    if (!user) return errorResponse("Connexion requise.", 401);

    const body: unknown = await request.json().catch(() => null);
    const id = isRecord(body) && typeof body.id === "string" ? body.id.trim() : "";
    if (!id) return errorResponse("Identifiant de projet manquant.", 400);

    const result = await prisma.creativeProject.deleteMany({
      where: { id, userId: user.id },
    });
    if (result.count === 0) return errorResponse("Projet introuvable.", 404);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("CREATIVE PROJECT DELETE ERROR:", error);
    return errorResponse("Impossible de supprimer le projet.", 500);
  }
}