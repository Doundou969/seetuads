import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TIME_ZONE = "Africa/Dakar";

function formatDuration(seconds: number) {
  const safeSeconds = Math.max(0, Math.round(seconds || 0));

  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  }

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  return `${remainingSeconds}s`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function truncate(text: string, maxLength = 60) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 3)}...`;
}

function startOfDayInDakar(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  const year = Number(values.year);
  const month = Number(values.month);
  const day = Number(values.day);

  return new Date(Date.UTC(year, month - 1, day));
}

function getSevenDaysStart(now: Date) {
  const start = startOfDayInDakar(now);

  start.setUTCDate(start.getUTCDate() - 6);

  return start;
}

export async function GET() {
  try {
    const now = new Date();

    const todayStart = startOfDayInDakar(now);
    const sevenDaysStart = getSevenDaysStart(now);

    const [
      todayLogs,
      sevenDaysLogs,
      totalScreens,
      onlineScreens,
      totalPlayers,
      recentLogs,
    ] = await Promise.all([
      prisma.playbackLog.count({
        where: {
          startedAt: {
            gte: todayStart,
          },
        },
      }),

      prisma.playbackLog.findMany({
        where: {
          startedAt: {
            gte: sevenDaysStart,
          },
        },
        select: {
          id: true,
          startedAt: true,
          durationSeconds: true,
          status: true,

          screen: {
            select: {
              id: true,
              name: true,
              screenCode: true,
            },
          },

          media: {
            select: {
              id: true,
              name: true,
            },
          },

          campaign: {
            select: {
              id: true,
              name: true,
            },
          },
        },

        orderBy: {
          startedAt: "desc",
        },
      }),

      prisma.screen.count(),

      prisma.screen.count({
        where: {
          status: "ONLINE",
        },
      }),

      prisma.player.count(),

      prisma.playbackLog.findMany({
        take: 20,

        orderBy: {
          startedAt: "desc",
        },

        select: {
          startedAt: true,
          durationSeconds: true,
          status: true,

          screen: {
            select: {
              name: true,
              screenCode: true,
            },
          },

          media: {
            select: {
              name: true,
            },
          },

          campaign: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);

    const playedLogs = sevenDaysLogs.filter(
      (log) => log.status === "PLAYED"
    );

    const failedLogs = sevenDaysLogs.filter(
      (log) => log.status === "FAILED"
    );

    const interruptedLogs = sevenDaysLogs.filter(
      (log) => log.status === "INTERRUPTED"
    );

    const skippedLogs = sevenDaysLogs.filter(
      (log) => log.status === "SKIPPED"
    );

    const logsWithoutCampaign = sevenDaysLogs.filter(
      (log) => !log.campaign
    );

    const successfulDuration = playedLogs.reduce(
      (total, log) =>
        total + Math.max(0, log.durationSeconds ?? 0),
      0
    );

    const successRate =
      sevenDaysLogs.length > 0
        ? Math.round(
            (playedLogs.length / sevenDaysLogs.length) * 100
          )
        : 0;

    const byScreen = new Map<
      string,
      {
        name: string;
        code: string;
        count: number;
        duration: number;
      }
    >();

    const byCampaign = new Map<
      string,
      {
        name: string;
        count: number;
        duration: number;
      }
    >();

    const byMedia = new Map<
      string,
      {
        name: string;
        count: number;
        duration: number;
      }
    >();

    for (const log of playedLogs) {
      if (log.screen) {
        const screenKey = log.screen.id;

        const screen = byScreen.get(screenKey) ?? {
          name: log.screen.name || "Écran sans nom",
          code: log.screen.screenCode || "Sans code",
          count: 0,
          duration: 0,
        };

        screen.count += 1;
        screen.duration += Math.max(
          0,
          log.durationSeconds ?? 0
        );

        byScreen.set(screenKey, screen);
      }

      if (log.campaign) {
        const campaignKey = log.campaign.id;

        const campaign =
          byCampaign.get(campaignKey) ?? {
            name:
              log.campaign.name ||
              "Campagne sans nom",
            count: 0,
            duration: 0,
          };

        campaign.count += 1;
        campaign.duration += Math.max(
          0,
          log.durationSeconds ?? 0
        );

        byCampaign.set(
          campaignKey,
          campaign
        );
      }

      if (log.media) {
        const mediaKey = log.media.id;

        const media = byMedia.get(mediaKey) ?? {
          name:
            log.media.name ||
            "Média sans nom",
          count: 0,
          duration: 0,
        };

        media.count += 1;
        media.duration += Math.max(
          0,
          log.durationSeconds ?? 0
        );

        byMedia.set(mediaKey, media);
      }
    }

    const screenStats = Array.from(
      byScreen.values()
    )
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const campaignStats = Array.from(
      byCampaign.values()
    )
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const mediaStats = Array.from(
      byMedia.values()
    )
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const doc = new jsPDF({
      unit: "mm",
      format: "a4",
    });

    const pageWidth =
      doc.internal.pageSize.getWidth();

    const pageHeight =
      doc.internal.pageSize.getHeight();

    const margin = 15;
    const contentWidth =
      pageWidth - margin * 2;

    let y = 18;

    const addPageIfNeeded = (
      requiredHeight = 10
    ) => {
      if (
        y + requiredHeight >
        pageHeight - 18
      ) {
        doc.addPage();
        y = 18;
      }
    };

    const addTitle = (text: string) => {
      addPageIfNeeded(15);

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.setFontSize(18);

      const lines =
        doc.splitTextToSize(
          text,
          contentWidth
        );

      doc.text(
        lines,
        margin,
        y
      );

      y += lines.length * 8 + 5;
    };

    const addSection = (
      text: string
    ) => {
      addPageIfNeeded(12);

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.setFontSize(13);

      doc.text(
        text,
        margin,
        y
      );

      y += 8;
    };

    const addLine = (
      label: string,
      value: string | number
    ) => {
      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setFontSize(10);

      const line =
        `${label}: ${value}`;

      const lines =
        doc.splitTextToSize(
          line,
          contentWidth
        );

      addPageIfNeeded(
        lines.length * 5 + 2
      );

      doc.text(
        lines,
        margin,
        y
      );

      y += lines.length * 5 + 2;
    };

    const addSpacing = (
      amount = 4
    ) => {
      y += amount;
    };

    addTitle(
      "SeetuAds - Rapport Analytics"
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(9);

    addLine(
      "Période",
      `${formatDate(
        sevenDaysStart
      )} au ${formatDate(now)}`
    );

    addLine(
      "Rapport généré le",
      formatDate(now)
    );

    addSpacing(4);

    addSection(
      "Résumé général"
    );

    addLine(
      "Diffusions aujourd'hui",
      todayLogs
    );

    addLine(
      "Diffusions sur 7 jours",
      sevenDaysLogs.length
    );

    addLine(
      "Diffusions réussies",
      playedLogs.length
    );

    addLine(
      "Temps réel de diffusion",
      formatDuration(
        successfulDuration
      )
    );

    addLine(
      "Taux de lecture réussie",
      `${successRate}%`
    );

    addLine(
      "Écrans en ligne",
      `${onlineScreens}/${totalScreens}`
    );

    addLine(
      "Players enregistrés",
      totalPlayers
    );

    addLine(
      "Logs sans campagne",
      logsWithoutCampaign.length
    );

    addSpacing(4);

    addSection(
      "Statuts des diffusions"
    );

    addLine(
      "PLAYED",
      playedLogs.length
    );

    addLine(
      "INTERRUPTED",
      interruptedLogs.length
    );

    addLine(
      "FAILED",
      failedLogs.length
    );

    addLine(
      "SKIPPED",
      skippedLogs.length
    );

    addSpacing(4);

    addSection(
      "Top écrans"
    );

    if (
      screenStats.length === 0
    ) {
      addLine(
        "Information",
        "Aucune diffusion réussie enregistrée"
      );
    } else {
      screenStats.forEach(
        (screen, index) => {
          addLine(
            `${index + 1}. ${screen.name}`,
            `${screen.code} - ${screen.count} diffusions - ${formatDuration(
              screen.duration
            )}`
          );
        }
      );
    }

    addSpacing(4);

    addSection(
      "Top campagnes"
    );

    if (
      campaignStats.length === 0
    ) {
      addLine(
        "Information",
        "Aucune campagne associée à une diffusion réussie"
      );
    } else {
      campaignStats.forEach(
        (
          campaign,
          index
        ) => {
          addLine(
            `${index + 1}. ${truncate(
              campaign.name,
              65
            )}`,
            `${campaign.count} diffusions - ${formatDuration(
              campaign.duration
            )}`
          );
        }
      );
    }

    addSpacing(4);

    addSection(
      "Top médias"
    );

    if (
      mediaStats.length === 0
    ) {
      addLine(
        "Information",
        "Aucun média diffusé avec succès"
      );
    } else {
      mediaStats.forEach(
        (media, index) => {
          addLine(
            `${index + 1}. ${truncate(
              media.name,
              70
            )}`,
            `${media.count} diffusions - ${formatDuration(
              media.duration
            )}`
          );
        }
      );
    }

    addSpacing(4);

    addSection(
      "Dernières diffusions"
    );

    if (
      recentLogs.length === 0
    ) {
      addLine(
        "Information",
        "Aucune diffusion enregistrée"
      );
    } else {
      recentLogs.forEach(
        (log, index) => {
          const mediaName =
            log.media?.name ||
            "Média inconnu";

          const screenName =
            log.screen?.name ||
            log.screen?.screenCode ||
            "Écran inconnu";

          const campaignName =
            log.campaign?.name
              ? ` | Campagne: ${truncate(
                  log.campaign.name,
                  35
                )}`
              : " | Sans campagne";

          addLine(
            `${index + 1}. ${truncate(
              mediaName,
              55
            )}`,
            `${screenName}${campaignName} | ${log.status} | ${formatDuration(
              log.durationSeconds ?? 0
            )} | ${formatDate(
              log.startedAt
            )}`
          );
        }
      );
    }

    const totalPages =
      doc.getNumberOfPages();

    for (
      let page = 1;
      page <= totalPages;
      page += 1
    ) {
      doc.setPage(page);

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setFontSize(8);

      doc.text(
        `SeetuAds | Page ${page}/${totalPages}`,
        margin,
        pageHeight - 10
      );
    }

    const pdfArrayBuffer =
      doc.output("arraybuffer");

    const fileName =
      `seetuads-rapport-${now
        .toISOString()
        .slice(0, 10)}.pdf`;

    return new NextResponse(
      pdfArrayBuffer,
      {
        headers: {
          "Content-Type":
            "application/pdf",

          "Content-Disposition":
            `attachment; filename="${fileName}"`,

          "Cache-Control":
            "no-store, no-cache, must-revalidate, max-age=0",

          Pragma: "no-cache",

          Expires: "0",
        },
      }
    );
  } catch (error) {
    console.error(
      "Erreur génération rapport PDF :",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Impossible de générer le rapport PDF.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }
}
