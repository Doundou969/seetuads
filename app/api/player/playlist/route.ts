export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const deviceId = searchParams.get("deviceId");
    const apiKey = req.headers.get("x-player-key");

    if (!deviceId) {
      return NextResponse.json(
        { error: "deviceId requis" },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: "Clé player requise" },
        { status: 401 }
      );
    }

    const player = await prisma.player.findFirst({
      where: {
        deviceId,
        apiKey,
      },
      include: {
        screen: {
          include: {
            playlists: {
              where: {
                status: "ACTIVE",
              },
              orderBy: {
                createdAt: "asc",
              },
              include: {
                items: {
                  orderBy: {
                    position: "asc",
                  },
                  include: {
                    media: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!player?.screen) {
      return NextResponse.json(
        { error: "Player non autorisé" },
        { status: 401 }
      );
    }

    const playlists = player.screen.playlists;

    if (!playlists || playlists.length === 0) {
      return NextResponse.json(
        { error: "Aucune playlist active" },
        { status: 404 }
      );
    }

    // Fusionne toutes les publicités de toutes les playlists actives.
    const items = playlists.flatMap((playlist) =>
      playlist.items.map((item) => ({
        ...item,
        playlistId: playlist.id,
      }))
    );

    if (items.length === 0) {
      return NextResponse.json(
        { error: "Aucune publicité dans les playlists actives" },
        { status: 404 }
      );
    }

    const serializedData = JSON.parse(
      JSON.stringify(
        {
          id: `screen-${player.screen.id}`,
          name: `${player.screen.name} - Multi Ads Loop`,
          items,
          playlistsCount: playlists.length,
        },
        (_key, value) =>
          typeof value === "bigint"
            ? value.toString()
            : value
      )
    );

    return NextResponse.json({
      playlist: serializedData,
    });
  } catch (error) {
    console.error("Erreur récupération playlist player :", error);

    return NextResponse.json(
      { error: "Erreur serveur lors de la récupération des publicités" },
      { status: 500 }
    );
  }
}
