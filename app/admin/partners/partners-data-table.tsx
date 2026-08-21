"use client";

import { DataTable } from "@/components/admin/data-table";
import { deletePartner } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

type PartnerRow = Record<string, unknown> & {
  id: string;
  businessName: string;
  ownerName: string | null;
  phone: string;
  city: string;
  locationsCount: number;
  status: string;
};

export function PartnersDataTable({ partners }: { partners: PartnerRow[] }) {
  return (
    <DataTable
      columns={[
        { key: "businessName", label: "Entreprise" },
        { key: "ownerName", label: "Proprietaire" },
        { key: "phone", label: "Telephone" },
        { key: "city", label: "Ville" },
        { key: "locationsCount", label: "Emplacements" },
        { key: "status", label: "Statut" },
      ]}
      rows={partners}
      actions={(row) => {
        const p = row as PartnerRow;
        return (
          <form action={deletePartner.bind(null, p.id)}>
            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
              <Trash2 className="w-4 h-4" />
            </Button>
          </form>
        );
      }}
    />
  );
}