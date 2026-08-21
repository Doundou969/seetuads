import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PartnersDataTable } from "./partners-data-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function PartnersPage() {
  const partners = await prisma.partner.findMany({
    orderBy: { createdAt: "desc" },
    include: { locations: true },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Partenaires</h1>
          <p className="text-gray-600">Gerer les commercants partenaires</p>
        </div>
        <Link href="/admin/partners/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Nouveau partenaire
          </Button>
        </Link>
      </div>

      <PartnersDataTable
        partners={partners.map((p) => ({
          id: p.id,
          businessName: p.businessName,
          ownerName: p.ownerName,
          phone: p.phone,
          city: p.city,
          locationsCount: p.locations.length,
          status: String(p.status),
        }))}
      />
    </div>
  );
}