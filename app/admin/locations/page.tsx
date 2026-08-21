import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { LocationsDataTable } from "./locations-data-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function LocationsPage() {
  const locations = await prisma.location.findMany({
    orderBy: { createdAt: "desc" },
    include: { partner: true },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Emplacements</h1>
          <p className="text-gray-600">Gerer les boutiques et points de vente</p>
        </div>
        <Link href="/admin/locations/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Nouvel emplacement
          </Button>
        </Link>
      </div>

      <LocationsDataTable
        locations={locations.map((l) => ({
          id: l.id,
          name: l.name,
          partnerName: l.partner?.businessName || "-",
          address: l.address,
          district: l.district,
          city: l.city,
          status: String(l.status),
        }))}
      />
    </div>
  );
}