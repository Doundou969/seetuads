import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import { prisma } from "@/lib/prisma";
import { requireAdmin, HttpError } from "@/lib/permissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function formatDuration(seconds: number) {
  const safe = Math.max(0, Math.round(seconds || 0));

  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;

  if (hours > 0) {
    return secs > 0
      ? `${hours}h ${minutes}m ${secs}s`
      : `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return secs > 0
      ? `${minutes}m ${secs}s`
      : `${minutes}m`;
  }

  return `${secs}s`;
}

function formatDate(date: Date) {
  return date.toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "medium",
  });
}

function cleanText(value: string | null | undefined) {
  return (value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanMediaName(
  name: string | null | undefined,
  maxLength = 55
) {
  const value = cleanText(name) || "Média sans nom";

  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3)}...`;
}

export async function GET() {
  try {
    await requireAdmin();

    const now = new Date();

    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const sevenDaysStart = new Date(now);
    sevenDaysStart.setDate(sevenDaysStart.getDate() - 6);
    sevenDaysStart.setHours(0, 0, 0, 0);

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
        take: 15,
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

    const totalDuration = sevenDaysLogs.reduce(
      (total, log) => total + (log.durationSeconds ?? 0),
      0
    );

    /*
     * Taux de lecture réussie.
     *
     * On utilise Math.floor() afin d'éviter qu'un taux
     * de 99,50 % soit affiché à tort comme 100 %.
     *
     * Exemple :
     * 4202 / 4223 = 99,50 % -> affichage 99 %
     */
    const successRate =
      sevenDaysLogs.length > 0
        ? Number(
            ((playedLogs.length / sevenDaysLogs.length) * 100).toFixed(2)
          )
        : 0;

    const logsWithoutCampaign = sevenDaysLogs.filter(
      (log) => !log.campaign
    ).length;

    const durationWithoutCampaign = sevenDaysLogs
      .filter((log) => !log.campaign)
      .reduce(
        (total, log) => total + (log.durationSeconds ?? 0),
        0
      );

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

    for (const log of sevenDaysLogs) {
      const screen = byScreen.get(log.screen.id) ?? {
        name: cleanText(log.screen.name) || "Écran sans nom",
        code: cleanText(log.screen.screenCode),
        count: 0,
        duration: 0,
      };

      screen.count += 1;
      screen.duration += log.durationSeconds ?? 0;

      byScreen.set(log.screen.id, screen);

      if (log.campaign) {
        const campaign = byCampaign.get(log.campaign.id) ?? {
          name:
            cleanText(log.campaign.name) ||
            "Campagne sans nom",
          count: 0,
          duration: 0,
        };

        campaign.count += 1;
        campaign.duration += log.durationSeconds ?? 0;

        byCampaign.set(log.campaign.id, campaign);
      }

      const media = byMedia.get(log.media.id) ?? {
        name: cleanMediaName(log.media.name, 70),
        count: 0,
        duration: 0,
      };

      media.count += 1;
      media.duration += log.durationSeconds ?? 0;

      byMedia.set(log.media.id, media);
    }

    const screenStats = Array.from(byScreen.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const campaignStats = Array.from(byCampaign.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const mediaStats = Array.from(byMedia.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);


    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const marginLeft = 15;
    const marginRight = 15;
    const topMargin = 20;

    // Espace réservé au footer.
    const footerReserved = 24;

    const contentWidth =
      pageWidth - marginLeft - marginRight;

    const maxContentY =
      pageHeight - footerReserved;

    let y = topMargin;

    const newPage = () => {
      doc.addPage();
      y = topMargin;
    };

    const ensureSpace = (height: number) => {
      if (y + height > maxContentY) {
        newPage();
      }
    };

    const addTitle = (text: string) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);

      const lines = doc.splitTextToSize(
        text,
        contentWidth
      );

      ensureSpace(lines.length * 8 + 12);

      doc.text(lines, marginLeft, y);

      y += lines.length * 8 + 4;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      doc.text(
        "Plateforme de gestion d'affichage publicitaire",
        marginLeft,
        y
      );

      y += 10;
    };

    const addSection = (text: string) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);

      const lines = doc.splitTextToSize(
        text,
        contentWidth
      );

      ensureSpace(lines.length * 7 + 12);

      y += 3;

      doc.text(lines, marginLeft, y);

      y += lines.length * 7 + 5;
    };

    const addLine = (
      label: string,
      value: string | number
    ) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);

      const text = `${label} : ${value}`;

      const lines = doc.splitTextToSize(
        text,
        contentWidth
      );

      ensureSpace(lines.length * 5.5 + 3);

      doc.text(lines, marginLeft, y);

      y += lines.length * 5.5 + 3;
    };

    const addBullet = (text: string) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      const lines = doc.splitTextToSize(
        `• ${text}`,
        contentWidth
      );

      ensureSpace(lines.length * 5 + 3);

      doc.text(lines, marginLeft, y);

      y += lines.length * 5 + 3;
    };

    const addDivider = () => {
      ensureSpace(5);

      doc.setLineWidth(0.2);
      doc.line(
        marginLeft,
        y,
        pageWidth - marginRight,
        y
      );

      y += 5;
    };

    addTitle("SeetuAds - Rapport Analytics");

    addLine(
      "Période",
      `${formatDate(sevenDaysStart)} au ${formatDate(now)}`
    );

    addLine(
      "Rapport généré le",
      formatDate(now)
    );

    addDivider();

    addSection("Résumé général");

    addLine(
      "Diffusions aujourd'hui",
      todayLogs
    );

    addLine(
      "Diffusions sur 7 jours",
      sevenDaysLogs.length
    );

    addLine(
      "Temps total de diffusion",
      formatDuration(totalDuration)
    );

    addLine(
      "Taux de lecture réussie",
      `${successRate.toFixed(2)}%`
    );

    addLine(
      "Écrans en ligne",
      `${onlineScreens}/${totalScreens}`
    );

    addLine(
      "Players enregistrés",
      totalPlayers
    );

    addDivider();

    addSection("Statuts des diffusions");

    const totalLogs = sevenDaysLogs.length;

    const playedRate =
      totalLogs > 0
        ? ((playedLogs.length / totalLogs) * 100).toFixed(2)
        : "0.00";

    const interruptedRate =
      totalLogs > 0
        ? ((interruptedLogs.length / totalLogs) * 100).toFixed(2)
        : "0.00";

    const failedRate =
      totalLogs > 0
        ? ((failedLogs.length / totalLogs) * 100).toFixed(2)
        : "0.00";

    const skippedRate =
      totalLogs > 0
        ? ((skippedLogs.length / totalLogs) * 100).toFixed(2)
        : "0.00";

    addLine(
      "PLAYED",
      `${playedLogs.length} (${playedRate}%)`
    );

    addLine(
      "INTERRUPTED",
      `${interruptedLogs.length} (${interruptedRate}%)`
    );

    addLine(
      "FAILED",
      `${failedLogs.length} (${failedRate}%)`
    );

    addLine(
      "SKIPPED",
      `${skippedLogs.length} (${skippedRate}%)`
    );

    addDivider();

    addSection("Couverture des campagnes");

    const campaignLogs =
      sevenDaysLogs.length - logsWithoutCampaign;

    const campaignCoverageRate =
      totalLogs > 0
        ? ((campaignLogs / totalLogs) * 100).toFixed(2)
        : "0.00";

    const withoutCampaignRate =
      totalLogs > 0
        ? ((logsWithoutCampaign / totalLogs) * 100).toFixed(2)
        : "0.00";

    addLine(
      "Diffusions avec campagne",
      `${campaignLogs} (${campaignCoverageRate}%)`
    );

    addLine(
      "Diffusions sans campagne",
      `${logsWithoutCampaign} (${withoutCampaignRate}%)`
    );

    addDivider();

    addSection("Top écrans");

    if (screenStats.length === 0) {
      addLine(
        "Information",
        "Aucune diffusion enregistrée"
      );
    } else {
      screenStats.forEach((screen, index) => {
        addBullet(
          `${index + 1}. ${screen.name} (${screen.code}) — ` +
            `${screen.count} diffusions — ` +
            `${formatDuration(screen.duration)}`
        );
      });
    }

    addDivider();

    addSection("Top campagnes");

    if (campaignStats.length === 0) {
      addLine(
        "Information",
        "Aucune campagne associée"
      );
    } else {
      campaignStats.forEach((campaign, index) => {
        addBullet(
          `${index + 1}. ${campaign.name} — ` +
            `${campaign.count} diffusions — ` +
            `${formatDuration(campaign.duration)}`
        );
      });
    }

    addDivider();

    addSection("Top médias");

    if (mediaStats.length === 0) {
      addLine(
        "Information",
        "Aucun média diffusé"
      );
    } else {
      mediaStats.forEach((media, index) => {
        addBullet(
          `${index + 1}. ${media.name} — ` +
            `${media.count} diffusions — ` +
            `${formatDuration(media.duration)}`
        );
      });
    }

    addDivider();

    addSection("15 dernières diffusions");

    if (recentLogs.length === 0) {
      addLine(
        "Information",
        "Aucune diffusion enregistrée"
      );
    } else {
      recentLogs.forEach((log, index) => {
        const screenName =
          cleanText(log.screen.name) ||
          cleanText(log.screen.screenCode) ||
          "Écran inconnu";

        const campaignText = log.campaign
          ? cleanText(log.campaign.name)
          : "Sans campagne";

        const recentText =
          `${index + 1}. ` +
          `${cleanMediaName(log.media.name)} | ` +
          `${screenName} | ` +
          `${campaignText} | ` +
          `${log.status} | ` +
          `${formatDuration(log.durationSeconds ?? 0)} | ` +
          `${formatDate(log.startedAt)}`;

        addBullet(recentText);
      });
    }

    // Footer ajouté après la génération de tout le contenu.
    const totalPages = doc.getNumberOfPages();

    for (
      let pageNumber = 1;
      pageNumber <= totalPages;
      pageNumber += 1
    ) {
      doc.setPage(pageNumber);

      const footerY = pageHeight - 9;

      doc.setDrawColor(180);
      doc.setLineWidth(0.2);

      doc.line(
        marginLeft,
        footerY - 4,
        pageWidth - marginRight,
        footerY - 4
      );

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);

      doc.text(
        "SeetuAds • Rapport Analytics",
        marginLeft,
        footerY
      );

      doc.text(
        `Page ${pageNumber} / ${totalPages}`,
        pageWidth - marginRight,
        footerY,
        {
          align: "right",
        }
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
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

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
      }
    );
  }
}









