import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ZonesDataTable } from "./zones-data-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function ZonesPage() {
  const zones = await prisma.zone.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Zones</h1>
          <p className="text-gray-600">Gerer les zones geographiques</p>
        </div>
        <Link href="/admin/zones/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Nouvelle zone
          </Button>
        </Link>
      </div>

      <ZonesDataTable
        zones={zones.map((z) => ({
          id: z.id,
          name: z.name,
          city: z.city,
          district: z.district,
          status: String(z.status),
        }))}
      />
    </div>
  );
}