"use client";

import { DataTable } from "@/components/admin/data-table";
import { deleteCampaign, activateCampaign } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Trash2, Play } from "lucide-react";

type CampaignRow = Record<string, unknown> & {
  id: string;
  name: string;
  advertiser: string;
  screensCount: number;
  startDate: string;
  endDate: string;
  estimatedPrice: string;
  status: string;
};

export function CampaignsDataTable({ campaigns }: { campaigns: CampaignRow[] }) {
  return (
    <DataTable
      columns={[
        { key: "name", label: "Nom" },
        { key: "advertiser", label: "Annonceur" },
        { key: "screensCount", label: "Ecrans" },
        { key: "startDate", label: "Debut" },
        { key: "endDate", label: "Fin" },
        { key: "estimatedPrice", label: "Prix estime (XOF)" },
        { key: "status", label: "Statut" },
      ]}
      rows={campaigns}
      actions={(row) => {
        const c = row as CampaignRow;
        return (
          <div className="flex items-center gap-2 justify-end">
            {c.status === "DRAFT" && (
              <form action={() => activateCampaign(c.id)}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-green-600 hover:text-green-700"
                  type="submit"
                >
                  <Play className="w-4 h-4" />
                </Button>
              </form>
            )}
            <form action={deleteCampaign.bind(null, c.id)}>
              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                <Trash2 className="w-4 h-4" />
              </Button>
            </form>
          </div>
        );
      }}
    />
  );
}