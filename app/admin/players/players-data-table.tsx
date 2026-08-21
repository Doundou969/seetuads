"use client";

import { DataTable } from "@/components/admin/data-table";
import { deletePlayer } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

type PlayerRow = Record<string, unknown> & {
  id: string;
  deviceId: string;
  screenCode: string;
  appVersion: string;
  status: string;
  lastHeartbeat: string;
};

export function PlayersDataTable({ players }: { players: PlayerRow[] }) {
  return (
    <DataTable
      columns={[
        { key: "deviceId", label: "Device ID" },
        { key: "screenCode", label: "Ecran" },
        { key: "appVersion", label: "Version" },
        { key: "status", label: "Statut" },
        { key: "lastHeartbeat", label: "Dernier contact" },
      ]}
      rows={players}
      actions={(row) => {
        const p = row as PlayerRow;
        return (
          <form action={deletePlayer.bind(null, p.id)}>
            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
              <Trash2 className="w-4 h-4" />
            </Button>
          </form>
        );
      }}
    />
  );
}