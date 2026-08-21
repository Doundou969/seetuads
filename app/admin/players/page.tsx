import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PlayersDataTable } from "./players-data-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function PlayersPage() {
  const players = await prisma.player.findMany({
    orderBy: { createdAt: "desc" },
    include: { screen: true },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Players</h1>
          <p className="text-gray-600">Gerer les appareils de lecture</p>
        </div>
        <Link href="/admin/players/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Nouveau player
          </Button>
        </Link>
      </div>

      <PlayersDataTable
        players={players.map((p) => ({
          id: p.id,
          deviceId: p.deviceId,
          screenCode: p.screen?.screenCode || "-",
          appVersion: p.appVersion,
          status: String(p.status),
          lastHeartbeat: p.lastHeartbeat
            ? new Date(p.lastHeartbeat).toLocaleString("fr-FR")
            : "Jamais",
        }))}
      />
    </div>
  );
}