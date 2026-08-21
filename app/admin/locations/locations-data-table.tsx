"use client";

import { DataTable } from "@/components/admin/data-table";
import { deleteLocation } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

type LocationRow = Record<string, unknown> & {
  id: string;
  name: string;
  partnerName: string;
  address: string;
  district: string | null;
  city: string;
  status: string;
};

export function LocationsDataTable({ locations }: { locations: LocationRow[] }) {
  return (
    <DataTable
      columns={[
        { key: "name", label: "Nom" },
        { key: "partnerName", label: "Partenaire" },
        { key: "address", label: "Adresse" },
        { key: "district", label: "Quartier" },
        { key: "city", label: "Ville" },
        { key: "status", label: "Statut" },
      ]}
      rows={locations}
      actions={(row) => {
        const l = row as LocationRow;
        return (
          <form action={deleteLocation.bind(null, l.id)}>
            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
              <Trash2 className="w-4 h-4" />
            </Button>
          </form>
        );
      }}
    />
  );
}