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
        : null;

    const mediaId =
      typeof body.mediaId === "string"
        ? body.mediaId.trim()
        : null;

    const apiKey = req.headers.get("x-player-key");

    if (!deviceId || !mediaId) {
      return NextResponse.json(
        { error: "deviceId et mediaId requis" },
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

    if (!player.screen) {
      return NextResponse.json(
        { error: "Player non associé à un écran" },
        { status: 401 }
      );
    }

    const screenId = player.screen.id;

    /*
     * ============================================================
     * MEDIA DANS LA PLAYLIST ACTIVE
     * ============================================================
     */

    const playlistItem =
      await prisma.playlistItem.findFirst({
        where: {
          mediaId,
          playlist: {
            screenId,
            status: "ACTIVE",
          },
        },
        orderBy: {
          playlist: {
            version: "desc",
          },
        },
        select: {
          id: true,
          campaignId: true,
          playlistId: true,
          durationSeconds: true,
        },
      });

    /*
     * ============================================================
     * FALLBACK CAMPAGNE
     * ============================================================
     */

    let campaignId: string | null =
      playlistItem?.campaignId ?? null;

    if (!campaignId) {
      const now = new Date();

      const campaignMedia =
        await prisma.campaignMedia.findFirst({
          where: {
            mediaId,
            campaign: {
              status: "ACTIVE",
              startDate: {
                lte: now,
              },
              endDate: {
                gte: now,
              },
              campaignScreens: {
                some: {
                  screenId,
                  status: "ACTIVE",
                },
              },
            },
          },
          select: {
            campaignId: true,
          },
        });

      campaignId = campaignMedia?.campaignId ?? null;
    }

    if (!playlistItem && !campaignId) {
      return NextResponse.json(
        {
          error:
            "Média absent de la playlist active pour cet écran",
        },
        { status: 400 }
      );
    }

    /*
     * ============================================================
     * DATES
     * ============================================================
     */

    const startedAt =
      typeof body.startedAt === "string"
        ? new Date(body.startedAt)
        : new Date();

    if (Number.isNaN(startedAt.getTime())) {
      return NextResponse.json(
        { error: "Date de début invalide" },
        { status: 400 }
      );
    }

    const endedAt =
      typeof body.endedAt === "string"
        ? new Date(body.endedAt)
        : null;

    if (
      endedAt &&
      Number.isNaN(endedAt.getTime())
    ) {
      return NextResponse.json(
        { error: "Date de fin invalide" },
        { status: 400 }
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
     * DURÉE
     * ============================================================
     *
     * RÈGLE IMPORTANTE :
     *
     * PLAYED = durée programmée de la playlist.
     *
     * On ne fait JAMAIS confiance à une durée PLAYED
     * envoyée par le navigateur.
     *
     * Pour INTERRUPTED / FAILED / SKIPPED :
     * on accepte la durée envoyée, mais on la borne.
     */

    const configuredDuration =
      playlistItem?.durationSeconds ?? null;

    const requestedDuration =
      typeof body.durationSeconds === "number" &&
      Number.isFinite(body.durationSeconds) &&
      body.durationSeconds >= 0
        ? Math.round(body.durationSeconds)
        : null;

    let durationSeconds: number | null = null;

    if (status === "PLAYED") {
      if (
        configuredDuration !== null &&
        Number.isFinite(configuredDuration) &&
        configuredDuration > 0
      ) {
        durationSeconds = Math.round(
          configuredDuration
        );
      } else if (requestedDuration !== null) {
        durationSeconds = Math.min(
          requestedDuration,
          86400
        );
      }
    } else if (requestedDuration !== null) {
      durationSeconds = Math.min(
        requestedDuration,
        configuredDuration ??
          requestedDuration,
        86400
      );
    }

    /*
     * Protection supplémentaire contre les durées absurdes.
     */

    if (
      durationSeconds !== null &&
      durationSeconds < 0
    ) {
      durationSeconds = 0;
    }

    /*
     * ============================================================
     * CRÉATION DU LOG
     * ============================================================
     */

    const log = await prisma.playbackLog.create({
      data: {
        playerId: player.id,
        screenId,
        mediaId,
        campaignId,
        startedAt,
        endedAt,
        durationSeconds,
        status,
      },
    });

    console.log(
      "PLAYBACK LOG ENREGISTRÉ :",
      {
        logId: log.id,
        deviceId,
        screenId,
        mediaId,
        campaignId,
        status,
        configuredDuration,
        requestedDuration,
        durationSeconds,
      }
    );

    return NextResponse.json({
      success: true,
      logId: log.id,
      campaignId,
      durationSeconds,
    });
  } catch (error) {
    console.error(
      "PLAYER LOG ERROR:",
      error
    );

    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

