"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  CheckCircle2,
  Monitor,
  RefreshCw,
  Wifi,
  WifiOff,
  XCircle,
} from "lucide-react";

type MonitoredPlayer = {
  id: string;
  deviceId: string;
  status: string;
  lastHeartbeat: string | null;
  lastIp: string | null;
  appVersion: string | null;
  osVersion: string | null;
  screen: {
    id: string;
    name: string;
    screenCode: string;
  } | null;
  realTimeStatus: "ONLINE" | "OFFLINE";
  isOnline: boolean;
};

type MonitoringResponse = {
  success: boolean;
  timestamp: string;
  summary: {
    total: number;
    online: number;
    offline: number;
  };
  players: MonitoredPlayer[];
};

function formatDate(date: string | null) {
  if (!date) return "Jamais";

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(date));
}

function formatTimeAgo(date: string | null) {
  if (!date) return "Jamais";

  const seconds = Math.floor(
    (Date.now() - new Date(date).getTime()) / 1000
  );

  if (seconds < 10) return "À l'instant";
  if (seconds < 60) return `Il y a ${seconds} sec`;

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) return `Il y a ${minutes} min`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `Il y a ${hours} h`;

  const days = Math.floor(hours / 24);

  return `Il y a ${days} j`;
}

export function PlayersMonitoring() {
  const [data, setData] = useState<MonitoringResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMonitoring = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      }

      setError(null);

      const response = await fetch("/api/monitoring/players", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }

      const result: MonitoringResponse = await response.json();

      if (!result.success) {
        throw new Error("Impossible de récupérer le monitoring");
      }

      setData(result);
    } catch (err) {
      console.error("Monitoring loading error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger le monitoring"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMonitoring();

    const interval = window.setInterval(() => {
      loadMonitoring();
    }, 10000);

    return () => window.clearInterval(interval);
  }, [loadMonitoring]);

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-lg border bg-white py-12">
        <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
        Chargement du monitoring...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
        <div className="flex items-center gap-2 font-medium">
          <XCircle className="h-5 w-5" />
          Erreur de monitoring
        </div>

        <p className="mt-2 text-sm">{error}</p>

        <button
          onClick={() => loadMonitoring(true)}
          className="mt-4 rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium hover:bg-red-100"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-600">
              Players total
            </p>
            <Monitor className="h-5 w-5 text-gray-500" />
          </div>

          <p className="mt-3 text-3xl font-bold text-gray-900">
            {data.summary.total}
          </p>
        </div>

        <div className="rounded-lg border border-green-200 bg-green-50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-green-700">
              En ligne
            </p>
            <Wifi className="h-5 w-5 text-green-600" />
          </div>

          <p className="mt-3 text-3xl font-bold text-green-700">
            {data.summary.online}
          </p>
        </div>

        <div className="rounded-lg border border-red-200 bg-red-50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-red-700">
              Hors ligne
            </p>
            <WifiOff className="h-5 w-5 text-red-600" />
          </div>

          <p className="mt-3 text-3xl font-bold text-red-700">
            {data.summary.offline}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Activity className="h-5 w-5" />
              Monitoring en temps réel
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Actualisation automatique toutes les 10 secondes
            </p>
          </div>

          <button
            onClick={() => loadMonitoring(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Actualiser
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3">Statut</th>
                <th className="px-5 py-3">Player</th>
                <th className="px-5 py-3">Écran</th>
                <th className="px-5 py-3">Dernier heartbeat</th>
                <th className="px-5 py-3">IP</th>
                <th className="px-5 py-3">Application</th>
                <th className="px-5 py-3">Système</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {data.players.map((player) => (
                <tr
                  key={player.id}
                  className="transition hover:bg-gray-50"
                >
                  <td className="px-5 py-4">
                    {player.isOnline ? (
                      <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                        <CheckCircle2 className="h-4 w-4" />
                        ONLINE
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                        <XCircle className="h-4 w-4" />
                        OFFLINE
                      </div>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <div className="font-medium text-gray-900">
                      {player.deviceId}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {player.status}
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    {player.screen ? (
                      <>
                        <div className="font-medium text-gray-900">
                          {player.screen.name}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {player.screen.screenCode}
                        </div>
                      </>
                    ) : (
                      <span className="text-gray-400">
                        Aucun écran
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <div className="font-medium text-gray-900">
                      {formatTimeAgo(player.lastHeartbeat)}
                    </div>

                    <div className="mt-1 text-xs text-gray-500">
                      {formatDate(player.lastHeartbeat)}
                    </div>
                  </td>

                  <td className="px-5 py-4 font-mono text-xs text-gray-600">
                    {player.lastIp || "-"}
                  </td>

                  <td className="px-5 py-4">
                    {player.appVersion || "-"}
                  </td>

                  <td className="px-5 py-4">
                    {player.osVersion || "-"}
                  </td>
                </tr>
              ))}

              {data.players.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-gray-500"
                  >
                    Aucun player enregistré.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t bg-gray-50 px-5 py-3 text-xs text-gray-500">
          Dernière mise à jour : {formatDate(data.timestamp)}
        </div>
      </div>
    </div>
  );
}
