"use client";

import Link from "next/link";
import { DataTable } from "@/components/admin/data-table";
import { deleteScreen } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

type ScreenRow = Record<string, unknown> & {
  id: string;
  screenCode: string;
  name: string | null;
  locationName: string;
  zoneName: string;
  resolution: string;
  status: string;
};

export function ScreensDataTable({
  screens,
}: {
  screens: ScreenRow[];
}) {
  return (
    <DataTable
      columns={[
        { key: "screenCode", label: "Code" },
        { key: "name", label: "Nom" },
        { key: "locationName", label: "Emplacement" },
        { key: "zoneName", label: "Zone" },
        { key: "resolution", label: "Résolution" },
        { key: "status", label: "Statut" },
      ]}
      rows={screens}
      actions={(row) => {
        const s = row as ScreenRow;

        return (
          <div className="flex items-center gap-1">
            <Link href={`/admin/screens/${s.id}`}>
              <Button variant="ghost" size="sm">
                Voir
              </Button>
            </Link>

            <form action={deleteScreen.bind(null, s.id)}>
              <Button
                type="submit"
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