"use client";

import { DataTable } from "@/components/admin/data-table";
import { deleteMedia } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Trash2, ExternalLink } from "lucide-react";

type MediaRow = Record<string, unknown> & {
  id: string;
  name: string;
  fileUrl: string;
  fileType: string;
  durationSeconds: number;
  status: string;
  advertiser: string;
};

export function MediaDataTable({ media }: { media: MediaRow[] }) {
  return (
    <DataTable
      columns={[
        { key: "name", label: "Nom" },
        { key: "fileType", label: "Type" },
        { key: "durationSeconds", label: "Duree (s)" },
        { key: "advertiser", label: "Annonceur" },
        { key: "status", label: "Statut" },
      ]}
      rows={media}
      actions={(row) => {
        const m = row as MediaRow;
        return (
          <div className="flex items-center gap-2 justify-end">
            <a href={m.fileUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm">
                <ExternalLink className="w-4 h-4" />
              </Button>
            </a>
            <form action={deleteMedia.bind(null, m.id)}>
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