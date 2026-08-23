import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ONLINE_THRESHOLD_MS = 2 * 60 * 1000;

export async function GET() {
  try {
    const now = new Date();
    const onlineThreshold = new Date(
      now.getTime() - ONLINE_THRESHOLD_MS
    );

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

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      summary: {
        total: monitoredPlayers.length,
        online: onlineCount,
        offline: monitoredPlayers.length - onlineCount,
      },
      players: monitoredPlayers,
    });
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
      { status: 500 }
    );
  }
}