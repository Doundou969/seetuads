"use client";

import Link from "next/link";
import { DataTable } from "@/components/admin/data-table";
import { deleteZone } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

type ZoneRow = Record<string, unknown> & {
  id: string;
  name: string;
  city: string;
  district: string | null;
  status: string;
};

export function ZonesDataTable({ zones }: { zones: ZoneRow[] }) {
  return (
    <DataTable
      columns={[
        { key: "name", label: "Nom" },
        { key: "city", label: "Ville" },
        { key: "district", label: "Quartier" },
        { key: "status", label: "Statut" },
      ]}
      rows={zones}
      actions={(row) => {
        const z = row as ZoneRow;
        return (
          <div className="flex items-center gap-2 justify-end">
            <Link href={`/admin/zones/${z.id}/edit`}>
              <Button variant="ghost" size="sm">
                <Pencil className="w-4 h-4" />
              </Button>
            </Link>
            <form action={deleteZone.bind(null, z.id)}>
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