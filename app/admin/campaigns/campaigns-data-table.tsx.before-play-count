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
  mediaCount: number;
  startDate: string;
  endDate: string;
  estimatedPrice: string;
  status: string;
};

export function CampaignsDataTable({
  campaigns,
}: {
  campaigns: CampaignRow[];
}) {
  return (
    <DataTable
      columns={[
        { key: "name", label: "Nom" },
        { key: "advertiser", label: "Annonceur" },
        { key: "screensCount", label: "Ecrans" },
        { key: "mediaCount", label: "Medias" },
        { key: "startDate", label: "Debut" },
        { key: "endDate", label: "Fin" },
        { key: "estimatedPrice", label: "Prix estime (XOF)" },
        { key: "status", label: "Statut" },
      ]}
      rows={campaigns}
      actions={(row) => {
        const c = row as CampaignRow;

        const canActivate =
          c.status === "DRAFT" &&
          c.screensCount > 0 &&
          c.mediaCount > 0;

        return (
          <div className="flex items-center gap-2 justify-end">
            {c.status === "DRAFT" && (
              <form
                action={() => activateCampaign(c.id)}
                onSubmit={(event) => {
                  if (!canActivate) {
                    event.preventDefault();
                  }
                }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className={
                    canActivate
                      ? "text-green-600 hover:text-green-700"
                      : "text-gray-400 cursor-not-allowed"
                  }
                  type="submit"
                  disabled={!canActivate}
                  title={
                    canActivate
                      ? "Activer la campagne"
                      : "Ajoutez au moins un écran et un média avant l'activation"
                  }
                >
                  <Play className="w-4 h-4" />
                </Button>
              </form>
            )}

            <form action={deleteCampaign.bind(null, c.id)}>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </form>
          </div>
        );
      }}
    />
  );
}