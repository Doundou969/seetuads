import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ONLINE_THRESHOLD_MS = 2 * 60 * 1000;

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const now = new Date();

    const onlineThreshold = new Date(
      now.getTime() - ONLINE_THRESHOLD_MS
    );

    /*
     * ============================================================
     * SYNCHRONISATION DES STATUTS
     * ============================================================
     *
     * Un player est considéré OFFLINE s'il n'a pas envoyé
     * de heartbeat depuis plus de 2 minutes.
     */

    const stalePlayers = await prisma.player.findMany({
      where: {
        OR: [
          {
            lastHeartbeat: null,
            status: "ONLINE",
          },
          {
            lastHeartbeat: {
              lt: onlineThreshold,
            },
            status: "ONLINE",
          },
        ],
      },
      select: {
        id: true,
        screenId: true,
      },
    });

    if (stalePlayers.length > 0) {
      await prisma.player.updateMany({
        where: {
          id: {
            in: stalePlayers.map((player) => player.id),
          },
        },
        data: {
          status: "OFFLINE",
        },
      });

      const screenIds = Array.from(
        new Set(
          stalePlayers
            .map((player) => player.screenId)
            .filter(
              (screenId): screenId is string =>
                typeof screenId === "string"
            )
        )
      );

      if (screenIds.length > 0) {
        await prisma.screen.updateMany({
          where: {
            id: {
              in: screenIds,
            },
          },
          data: {
            status: "OFFLINE",
          },
        });
      }
    }

    /*
     * ============================================================
     * PLAYERS
     * ============================================================
     */

    const players = await prisma.player.findMany({
      orderBy: {
        lastHeartbeat: "desc",
      },
      select: {
        id: true,
        deviceId: true,
        status: true,
        lastHeartbeat: true,
        lastIp: true,
        appVersion: true,
        osVersion: true,
        screen: {
          select: {
            id: true,
            name: true,
            screenCode: true,
          },
        },
      },
    });

    /*
     * ============================================================
     * CALCUL DU STATUT TEMPS RÉEL
     * ============================================================
     */

    const monitoredPlayers = players.map((player) => {
      const isOnline =
        player.lastHeartbeat !== null &&
        player.lastHeartbeat >= onlineThreshold;

      return {
        ...player,
        realTimeStatus: isOnline ? "ONLINE" : "OFFLINE",
        isOnline,
      };
    });

    const onlineCount = monitoredPlayers.filter(
      (player) => player.isOnline
    ).length;

    return NextResponse.json(
      {
        success: true,
        timestamp: now.toISOString(),
        summary: {
          total: monitoredPlayers.length,
          online: onlineCount,
          offline: monitoredPlayers.length - onlineCount,
        },
        players: monitoredPlayers,
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Player monitoring error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown monitoring error",
      },
      {
        status: 500,
      }
    );
  }
}
