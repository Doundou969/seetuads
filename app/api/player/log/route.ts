import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const playbackStatuses = [
  "PLAYED",
  "INTERRUPTED",
  "FAILED",
  "SKIPPED",
] as const;

export async function POST(req: NextRequest) {
  try {
    let body: Record<string, unknown>;

    /*
     * ============================================================
     * JSON
     * ============================================================
     */

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          error: "JSON invalide",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ============================================================
     * PARAMETRES
     * ============================================================
     */

    const deviceId =
      typeof body.deviceId === "string"
        ? body.deviceId.trim()
        : null;

    const mediaId =
      typeof body.mediaId === "string"
        ? body.mediaId.trim()
        : null;

    const apiKey = req.headers.get("x-player-key");

    if (!deviceId || !mediaId) {
      return NextResponse.json(
        {
          error: "deviceId et mediaId requis",
        },
        {
          status: 400,
        }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "Clé player requise",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * ============================================================
     * AUTHENTIFICATION PLAYER
     * ============================================================
     */

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
        {
          error: "Player non autorisé",
        },
        {
          status: 401,
        }
      );
    }

    if (!player.screen) {
      return NextResponse.json(
        {
          error: "Player non associé à un écran",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * ============================================================
     * VERIFICATION MEDIA DANS PLAYLIST ACTIVE
     * ============================================================
     */

    const playlistItem =
      await prisma.playlistItem.findFirst({
        where: {
          mediaId,
          playlist: {
            screenId: player.screen.id,
            status: "ACTIVE",
          },
        },
        select: {
          campaignId: true,
        },
      });

    if (!playlistItem) {
      return NextResponse.json(
        {
          error:
            "Média absent de la playlist active",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ============================================================
     * DATE DEBUT
     * ============================================================
     */

    const startedAt =
      typeof body.startedAt === "string"
        ? new Date(body.startedAt)
        : new Date();

    if (Number.isNaN(startedAt.getTime())) {
      return NextResponse.json(
        {
          error: "Date de début invalide",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ============================================================
     * DATE FIN
     * ============================================================
     */

    const endedAt =
      typeof body.endedAt === "string"
        ? new Date(body.endedAt)
        : null;

    if (
      endedAt &&
      Number.isNaN(endedAt.getTime())
    ) {
      return NextResponse.json(
        {
          error: "Date de fin invalide",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ============================================================
     * STATUS
     * ============================================================
     */

    const requestedStatus =
      typeof body.status === "string"
        ? body.status
        : "PLAYED";

    const status = playbackStatuses.includes(
      requestedStatus as (typeof playbackStatuses)[number]
    )
      ? (requestedStatus as (typeof playbackStatuses)[number])
      : "PLAYED";

    /*
     * ============================================================
     * DUREE
     * ============================================================
     */

    const durationSeconds =
      typeof body.durationSeconds === "number" &&
      Number.isFinite(body.durationSeconds) &&
      body.durationSeconds >= 0
        ? Math.round(body.durationSeconds)
        : null;

    /*
     * ============================================================
     * CREATION PLAYBACK LOG
     * ============================================================
     */

    const log =
      await prisma.playbackLog.create({
        data: {
          playerId: player.id,
          screenId: player.screen.id,
          mediaId,
          campaignId:
            playlistItem.campaignId,
          startedAt,
          endedAt,
          durationSeconds,
          status,
        },
      });

    /*
     * ============================================================
     * REPONSE
     * ============================================================
     */

    return NextResponse.json({
      success: true,
      logId: log.id,
    });
  } catch (error) {
    console.error(
      "PLAYER LOG ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Erreur serveur",
      },
      {
        status: 500,
      }
    );
  }
}