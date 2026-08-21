"use client";

import { DataTable } from "@/components/admin/data-table";
import {
  deleteMedia,
  approveMedia,
  rejectMedia,
} from "@/lib/actions";
import { Button } from "@/components/ui/button";
import {
  Trash2,
  ExternalLink,
  Check,
  X,
} from "lucide-react";

type MediaRow = Record<string, unknown> & {
  id: string;
  name: string;
  fileUrl: string;
  fileType: string;
  durationSeconds: number;
  status: string;
  advertiser: string;
};

export function MediaDataTable({
  media,
}: {
  media: MediaRow[];
}) {
  return (
    <DataTable
      columns={[
        { key: "name", label: "Nom" },
        { key: "fileType", label: "Type" },
        { key: "durationSeconds", label: "Durée (s)" },
        { key: "advertiser", label: "Annonceur" },
        { key: "status", label: "Statut" },
      ]}
      rows={media}
      actions={(row) => {
        const m = row as MediaRow;

        return (
          <div className="flex items-center gap-2 justify-end">

            <a
              href={m.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="ghost"
                size="sm"
                title="Voir le média"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </a>

            {m.status === "UPLOADED" && (
              <>
                <form
                  action={approveMedia.bind(null, m.id)}
                >
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="text-green-600 hover:text-green-700"
                    title="Approuver le média"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                </form>

                <form
                  action={rejectMedia.bind(null, m.id)}
                >
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="text-orange-600 hover:text-orange-700"
                    title="Refuser le média"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </form>
              </>
            )}

            <form
              action={deleteMedia.bind(null, m.id)}
            >
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700"
                title="Supprimer le média"
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
