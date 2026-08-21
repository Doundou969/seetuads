export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const deviceId = searchParams.get("deviceId");
  const apiKey = req.headers.get("x-player-key");

  if (!deviceId) {
    return NextResponse.json({ error: "deviceId requis" }, { status: 400 });
  }

  if (!apiKey) {
    return NextResponse.json({ error: "Clé player requise" }, { status: 401 });
  }

  const player = await prisma.player.findFirst({
    where: { deviceId, apiKey },
    include: {
      screen: {
        include: {
          playlists: {
            where: { status: "ACTIVE" },
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
              items: {
                orderBy: { position: "asc" },
                include: { media: true },
              },
            },
          },
        },
      },
    },
  });

  if (!player?.screen) {
    return NextResponse.json({ error: "Player non autorisé" }, { status: 401 });
  }

  const playlist = player.screen.playlists[0];

  if (!playlist) {
    return NextResponse.json(
      { error: "Aucune playlist active" },
      { status: 404 }
    );
  }

  return NextResponse.json({ playlist });
}