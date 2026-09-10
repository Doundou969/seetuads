"use client";

import jsPDF from "jspdf";
import { Download } from "lucide-react";

type ScreenStat = {
  name: string;
  code: string;
  count: number;
  duration: number;
};

type CampaignStat = {
  name: string;
  count: number;
  duration: number;
};

type MediaStat = {
  name: string;
  count: number;
  duration: number;
};

type AnalyticsReportData = {
  generatedAt: string;
  periodLabel: string;

  todayLogs: number;
  totalLogs: number;
  totalDuration: number;
  successRate: number;

  totalScreens: number;
  onlineScreens: number;
  totalPlayers: number;

  played: number;
  interrupted: number;
  failed: number;
  skipped: number;

  screenStats: ScreenStat[];
  campaignStats: CampaignStat[];
  mediaStats: MediaStat[];
};

function formatDuration(seconds: number) {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
}

export function DownloadPdfButton({
  data,
}: {
  data: AnalyticsReportData;
}) {
  const downloadPdf = () => {
    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    let y = 20;

    const ensureSpace = (needed: number) => {
      if (y + needed > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }
    };

    const addText = (text: string, fontSize = 10) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(fontSize);

      const lines = doc.splitTextToSize(text, pageWidth - 30);

      ensureSpace(lines.length * 6 + 5);

      doc.text(lines, 15, y);
      y += lines.length * 6 + 4;
    };

    const addSection = (title: string) => {
      ensureSpace(20);

      y += 4;

      doc.setDrawColor(210);
      doc.line(15, y, pageWidth - 15, y);

      y += 8;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(title, 15, y);

      y += 8;
    };

    // ========================================================
    // EN-TETE
    // ========================================================

    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("SeetuAds", 15, y);

    y += 10;

    doc.setFontSize(17);
    doc.text("Rapport Analytics", 15, y);

    y += 12;

    addText(`Genere le : ${data.generatedAt}`);
    addText(`Periode : ${data.periodLabel}`);

    // ========================================================
    // RESUME
    // ========================================================

    addSection("Resume general");

    addText(`Diffusions aujourd'hui : ${data.todayLogs}`);
    addText(`Diffusions sur la periode : ${data.totalLogs}`);
    addText(
      `Temps total de diffusion : ${formatDuration(
        data.totalDuration
      )}`
    );
    addText(`Taux de lecture reussie : ${data.successRate}%`);
    addText(
      `Ecrans en ligne : ${data.onlineScreens}/${data.totalScreens}`
    );
    addText(`Players enregistres : ${data.totalPlayers}`);

    // ========================================================
    // STATUTS
    // ========================================================

    addSection("Statut des diffusions");

    addText(`PLAYED : ${data.played}`);
    addText(`INTERRUPTED : ${data.interrupted}`);
    addText(`FAILED : ${data.failed}`);
    addText(`SKIPPED : ${data.skipped}`);

    // ========================================================
    // ECRANS
    // ========================================================

    addSection("Top ecrans");

    if (data.screenStats.length === 0) {
      addText("Aucune diffusion enregistree.");
    } else {
      data.screenStats.forEach((screen, index) => {
        addText(
          `${index + 1}. ${screen.name} (${screen.code}) - ${
            screen.count
          } diffusions - ${formatDuration(screen.duration)}`
        );
      });
    }

    // ========================================================
    // CAMPAGNES
    // ========================================================

    addSection("Top campagnes");

    if (data.campaignStats.length === 0) {
      addText("Aucune campagne associee aux diffusions.");
    } else {
      data.campaignStats.forEach((campaign, index) => {
        addText(
          `${index + 1}. ${campaign.name} - ${
            campaign.count
          } diffusions - ${formatDuration(campaign.duration)}`
        );
      });
    }

    // ========================================================
    // MEDIAS
    // ========================================================

    addSection("Top medias");

    if (data.mediaStats.length === 0) {
      addText("Aucun media diffuse.");
    } else {
      data.mediaStats.forEach((media, index) => {
        addText(
          `${index + 1}. ${media.name} - ${
            media.count
          } diffusions - ${formatDuration(media.duration)}`
        );
      });
    }

    // ========================================================
    // PIED DE PAGE
    // ========================================================

    const totalPages = doc.getNumberOfPages();

    for (let page = 1; page <= totalPages; page++) {
      doc.setPage(page);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(120);

      doc.text(
        `SeetuAds - Rapport Analytics - Page ${page}/${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        {
          align: "center",
        }
      );
    }

    const date = new Date().toISOString().slice(0, 10);

    doc.save(`SeetuAds-Rapport-Analytics-${date}.pdf`);
  };

  return (
    <button
      type="button"
      onClick={downloadPdf}
      className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
    >
      <Download className="h-4 w-4" />

      Télécharger le rapport PDF
    </button>
  );
}