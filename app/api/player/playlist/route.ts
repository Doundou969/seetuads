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
        screen: true,
      },
    });

    if (!player?.screen) {
      return NextResponse.json(
        { error: "Player non autorisé ou aucun écran associé" },
        { status: 401 }
      );
    }

    const screen = player.screen;

    /*
     * ============================================================
     * PLAYLIST ACTIVE DE L'ÉCRAN
     * ============================================================
     *
     * La page admin /admin/playlists sauvegarde les médias dans :
     *
     * Playlist
     *   -> PlaylistItem
     *      -> Media
     *
     * Le player doit donc lire cette même source.
     */

    const playlist = await prisma.playlist.findFirst({
      where: {
        screenId: screen.id,
        status: "ACTIVE",
      },
      orderBy: {
        version: "desc",
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
    });

    if (!playlist) {
      console.log("Playlist player :", {
        deviceId,
        screenId: screen.id,
        playlistFound: false,
      });

      return NextResponse.json(
        {
          playlist: {
            id: `screen-${screen.id}`,
            name: `${screen.name || screen.screenCode} - Playlist`,
            screenId: screen.id,
            screenCode: screen.screenCode,
            playerId: player.id,
            deviceId: player.deviceId,
            items: [],
            activeCampaignsCount: 0,
            activeItemsCount: 0,
            serverTime: new Date().toISOString(),
          },
        },
        { status: 200 }
      );
    }

    const validItems = playlist.items
      .filter((item) => {
        return (
          Boolean(item.media?.id) &&
          Boolean(item.media?.fileUrl) &&
          Boolean(item.media?.fileType)
        );
      })
      .map((item, position) => ({
        id: item.id,
        position,
        durationSeconds:
          item.durationSeconds ||
          item.media.durationSeconds ||
          15,
        startDate: item.startDate,
        endDate: item.endDate,
        campaignId: item.campaignId,
        media: {
          id: item.media.id,
          name: item.media.name,
          fileUrl: item.media.fileUrl,
          fileType: item.media.fileType,
          mimeType: item.media.mimeType,
        },
      }));

    console.log("Playlist API :", {
      deviceId,
      screenId: screen.id,
      playlistId: playlist.id,
      playlistVersion: playlist.version,
      playlistStatus: playlist.status,
      totalItems: playlist.items.length,
      validItems: validItems.length,
      invalidItems: playlist.items.length - validItems.length,
    });

    const serializedData = JSON.parse(
      JSON.stringify(
        {
          id: playlist.id,
          name:
            `${screen.name || screen.screenCode} - Playlist`,
          screenId: screen.id,
          screenCode: screen.screenCode,
          playerId: player.id,
          deviceId: player.deviceId,
          playlistVersion: playlist.version,
          items: validItems,
          activeCampaignsCount: 0,
          activeItemsCount: validItems.length,
          serverTime: new Date().toISOString(),
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
    console.error(
      "Erreur récupération playlist player :",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erreur serveur lors de la récupération des publicités",
      },
      { status: 500 }
    );
  }
}
