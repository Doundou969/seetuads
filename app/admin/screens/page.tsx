import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ScreensDataTable } from "./screens-data-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function ScreensPage() {
  const screens = await prisma.screen.findMany({
    orderBy: { createdAt: "desc" },
    include: { location: true, zone: true },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ecrans</h1>
          <p className="text-gray-600">Gerer les ecrans publicitaires</p>
        </div>
        <Link href="/admin/screens/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Nouvel ecran
          </Button>
        </Link>
      </div>

      <ScreensDataTable
        screens={screens.map((s) => ({
          id: s.id,
          screenCode: s.screenCode,
          name: s.name,
          locationName: s.location?.name || "-",
          zoneName: s.zone?.name || "-",
          resolution: s.resolution,
          status: String(s.status),
        }))}
      />
    </div>
  );
}