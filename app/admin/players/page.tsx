import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { PlayersMonitoring } from "./players-monitoring";

export const dynamic = "force-dynamic";

export default function PlayersPage() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Players
          </h1>

          <p className="text-gray-600">
            Surveiller les appareils de lecture en temps réel
          </p>
        </div>

        <Link href="/admin/players/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nouveau player
          </Button>
        </Link>
      </div>

      <PlayersMonitoring />
    </div>
  );
}