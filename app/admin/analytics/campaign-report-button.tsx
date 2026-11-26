"use client";

import { Download } from "lucide-react";

export function CampaignReportButton({
  campaignId,
}: {
  campaignId: string;
}) {
  return (
    <a
      href={`/api/admin/analytics/campaign-report/${encodeURIComponent(campaignId)}`}
      className="inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold shadow-sm transition hover:bg-gray-50"
    >
      <Download className="h-4 w-4" />
      Télécharger le rapport
    </a>
  );
}
