import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import { prisma } from "@/lib/prisma";
import { requireAdmin, HttpError } from "@/lib/permissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function safeText(value: string | null | undefined, maxLength = 100) {
  const text = (value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/[\\/_*]+/g, " ")
    .replace(/\s+/g, " ")
    .trim() || "Sans nom";

  return text.length > maxLength
    ? `${text.slice(0, maxLength - 3).trim()}...`
    : text;
}

function formatDuration(seconds: number) {
  const value = Math.max(0, Math.round(seconds || 0));
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const remainingSeconds = value % 60;

  if (hours) return `${hours}h ${minutes}m ${remainingSeconds}s`;
  if (minutes) return `${minutes}m ${remainingSeconds}s`;
  return `${remainingSeconds}s`;
}

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    await requireAdmin();

    const { id } = await params;
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        status: true,
        objective: true,
        startDate: true,
        endDate: true,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: "Campagne introuvable." },
        { status: 404 }
      );
    }

    const now = new Date();
    const endExclusive = new Date(campaign.endDate);
    endExclusive.setDate(endExclusive.getDate() + 1);
    const queryEnd = new Date(
      Math.min(endExclusive.getTime(), now.getTime())
    );

    const logs = await prisma.playbackLog.findMany({
      where: {
        campaignId: campaign.id,
        startedAt: { gte: campaign.startDate, lt: queryEnd },
      },
      select: {
        durationSeconds: true,
        status: true,
        screen: {
          select: { id: true, name: true, screenCode: true },
        },
        media: {
          select: { id: true, name: true },
        },
      },
    });

    const countStatus = (status: string) =>
      logs.filter((log) => log.status === status).length;

    const played = countStatus("PLAYED");
    const failed = countStatus("FAILED");
    const interrupted = countStatus("INTERRUPTED");
    const skipped = countStatus("SKIPPED");
    const totalDuration = logs.reduce(
      (sum, log) => sum + (log.durationSeconds ?? 0),
      0
    );
    const successRate = logs.length
      ? ((played / logs.length) * 100).toFixed(2)
      : "0.00";

    const screens = new Map<
      string,
      { name: string; code: string; count: number; duration: number }
    >();
    const media = new Map<
      string,
      { name: string; count: number; duration: number }
    >();

    for (const log of logs) {
      const screen = screens.get(log.screen.id) ?? {
        name: safeText(log.screen.name || "Ecran sans nom"),
        code: safeText(log.screen.screenCode),
        count: 0,
        duration: 0,
      };
      screen.count += 1;
      screen.duration += log.durationSeconds ?? 0;
      screens.set(log.screen.id, screen);

      const item = media.get(log.media.id) ?? {
        name: safeText(log.media.name),
        count: 0,
        duration: 0,
      };
      item.count += 1;
      item.duration += log.durationSeconds ?? 0;
      media.set(log.media.id, item);
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    let y = 20;

    function addText(text: string, size = 10, bold = false) {
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(size);
      const lines = doc.splitTextToSize(safeText(text, 180), contentWidth);

      if (y + lines.length * 6 > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }

      doc.text(lines, margin, y);
      y += lines.length * 6 + 3;
    }

    function addSection(title: string) {
      y += 3;
      addText(title, 13, true);
    }

    addText("SeetuAds - Rapport de campagne", 20, true);
    addText(`Campagne : ${safeText(campaign.name)}`, 15, true);
    addText(`Statut : ${campaign.status}`);
    if (campaign.objective) {
      addText(`Objectif : ${safeText(campaign.objective)}`);
    }
    addText(
      `Periode : ${campaign.startDate.toLocaleDateString("fr-FR")} au ${campaign.endDate.toLocaleDateString("fr-FR")}`
    );
    addText(`Rapport genere le : ${now.toLocaleString("fr-FR")}`);

    addSection("Resume des diffusions");
    addText(`Diffusions totales : ${logs.length}`);
    addText(`Temps total diffuse : ${formatDuration(totalDuration)}`);
    addText(`Taux de lecture reussie : ${successRate}%`);
    addText(
      `PLAYED : ${played} | FAILED : ${failed} | INTERRUPTED : ${interrupted} | SKIPPED : ${skipped}`
    );

    addSection("Ecrans de la campagne");
    const screenRows = [...screens.values()].sort(
      (a, b) => b.count - a.count
    );
    if (!screenRows.length) addText("Aucune diffusion enregistree.");
    for (const item of screenRows) {
      addText(
        `${item.name} (${item.code}) - ${item.count} diffusions - ${formatDuration(item.duration)}`
      );
    }

    addSection("Medias diffuses");
    const mediaRows = [...media.values()].sort(
      (a, b) => b.count - a.count
    );
    if (!mediaRows.length) addText("Aucun media diffuse.");
    for (const item of mediaRows) {
      addText(
        `${item.name} - ${item.count} diffusions - ${formatDuration(item.duration)}`
      );
    }

    const pdf = doc.output("arraybuffer");

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="rapport-campagne-${campaign.id}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    console.error("Erreur de generation du rapport de campagne :", error);
    return NextResponse.json(
      { success: false, error: "Impossible de generer le rapport." },
      { status: 500 }
    );
  }
          }
