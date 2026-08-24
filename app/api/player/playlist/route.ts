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

    const now = new Date();

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
                  include: {
                    media: true,
                  },
                  orderBy: {
                    position: "asc",
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

    // Fusionne toutes les publicités des playlists actives,
    // puis filtre précisément celles qui sont actuellement diffusables.
    const items = playlists
  .flatMap((playlist) =>
    playlist.items
      .filter((item) => {
        // Le média doit être approuvé.
        if (item.media.status !== "APPROVED") {
          return false;
        }

        // Si une date de début existe,
        // la publicité ne doit pas commencer dans le futur.
        if (item.startDate) {
          const startDate = new Date(item.startDate);

          if (startDate.getTime() > now.getTime()) {
            return false;
          }
        }

        // Si aucune date de fin n'existe,
        // la publicité reste active.
        if (!item.endDate) {
          return true;
        }

        const endDate = new Date(item.endDate);

        // Une date enregistrée à minuit signifie
        // que la publicité reste active toute cette journée.
        if (
          endDate.getHours() === 0 &&
          endDate.getMinutes() === 0 &&
          endDate.getSeconds() === 0 &&
          endDate.getMilliseconds() === 0
        ) {
          endDate.setHours(23, 59, 59, 999);
        }

        return endDate.getTime() >= now.getTime();
      })
      .map((item) => ({
        ...item,
        playlistId: playlist.id,
      }))
  )
  .sort((a, b) => a.position - b.position);

    if (items.length === 0) {
      return NextResponse.json(
        {
          error: "Aucune publicité active actuellement",
          serverTime: now.toISOString(),
        },
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
          activeItemsCount: items.length,
          serverTime: now.toISOString(),
        },
        (_key, value) =>
          typeof value === "bigint" ? value.toString() : value
      )
    );

    return NextResponse.json({
      playlist: serializedData,
    });
  } catch (error) {
    console.error("Erreur récupération playlist player :", error);

    return NextResponse.json(
      {
        error: "Erreur serveur lors de la récupération des publicités",
      },
      { status: 500 }
    );
  }
}

