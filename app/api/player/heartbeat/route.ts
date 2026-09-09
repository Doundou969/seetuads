import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    let body: Record<string, unknown>;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "JSON invalide" },
        { status: 400 }
      );
    }

    const deviceId =
      typeof body.deviceId === "string"
        ? body.deviceId.trim()
        : "";

    const apiKey = req.headers.get("x-player-key")?.trim();

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

    if (!player) {
      return NextResponse.json(
        { error: "Player non autorisé" },
        { status: 401 }
      );
    }

    const forwardedIp = req.headers
      .get("x-forwarded-for")
      ?.split(",")[0]
      ?.trim();

    const now = new Date();

    const updated = await prisma.$transaction(async (tx) => {
      const updatedPlayer = await tx.player.update({
        where: {
          id: player.id,
        },
        data: {
          lastHeartbeat: now,
          status: "ONLINE",

          lastIp:
            (typeof body.ipAddress === "string" &&
              body.ipAddress.trim()) ||
            forwardedIp ||
            player.lastIp,

          appVersion:
            (typeof body.appVersion === "string" &&
              body.appVersion.trim()) ||
            player.appVersion,

          osVersion:
            (typeof body.osVersion === "string" &&
              body.osVersion.trim()) ||
            player.osVersion,

          ...(body.storageStatus !== undefined
            ? {
                storageStatus:
                  body.storageStatus as Prisma.InputJsonValue,
              }
            : {}),
        },
      });

      if (player.screenId) {
        await tx.screen.update({
          where: {
            id: player.screenId,
          },
          data: {
            status: "ONLINE",
          },
        });
      }

      return updatedPlayer;
    });

    return NextResponse.json(
      {
        success: true,
        message: "Heartbeat enregistré",
        player: {
          id: updated.id,
          deviceId: updated.deviceId,
          status: updated.status,
          lastHeartbeat: updated.lastHeartbeat,
          screenId: updated.screenId,
        },
        serverTime: now.toISOString(),
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Erreur heartbeat player :", error);

    return NextResponse.json(
      {
        error: "Erreur serveur lors du heartbeat du player",
      },
      {
        status: 500,
      }
    );
  }
}
