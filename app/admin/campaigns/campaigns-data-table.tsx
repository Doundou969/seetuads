"use client";

import Link from "next/link";
import { DataTable } from "@/components/admin/data-table";
import { deleteCampaign, approveAndActivateCampaign, deactivateCampaign, reactivateCampaign } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Trash2, Play, Pause, RotateCcw, BarChart3 } from "lucide-react";

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
  playCount: number;
  playedToday: number;
  failedCount: number;
  successRate: number;
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
        { key: "playCount", label: "Lectures" },
        { key: "playedToday", label: "Aujourd'hui" },
        { key: "failedCount", label: "Echecs" },
        { key: "successRate", label: "Reussite (%)" },
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
            <Link href={`/admin/campaigns/${c.id}`}>
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:text-blue-700"
                title="Voir les statistiques"
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
            </Link>

            {c.status === "DRAFT" && (
              <form
                action={() => approveAndActivateCampaign(c.id)}
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
                      ? "Valider et activer (approuve automatiquement les medias en attente)"
                      : "Ajoutez au moins un ecran et un media avant l'activation"
                  }
                >
                  <Play className="w-4 h-4" />
                </Button>
              </form>
            )}

            {c.status === "PAUSED" && (
              <form action={reactivateCampaign.bind(null, c.id)}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-green-600 hover:text-green-700"
                  type="submit"
                  title="Réactiver la campagne"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </form>
            )}
            {c.status === "ACTIVE" && (
              <form action={deactivateCampaign.bind(null, c.id)}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-orange-600 hover:text-orange-700"
                  type="submit"
                  title="Desactiver la campagne"
                >
                  <Pause className="w-4 h-4" />
                </Button>
              </form>
            )}

            <form action={deleteCampaign.bind(null, c.id)}>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700"
                title="Supprimer la campagne"
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

