import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  ArrowLeft,
  Monitor,
  MapPin,
  Wifi,
  WifiOff,
  Clock,
  Play,
  Activity,
  Server,
} from "lucide-react";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

function getScreenStatus(lastHeartbeat: Date | null) {
  if (!lastHeartbeat) {
    return {
      label: "HORS LIGNE",
      color: "bg-red-100 text-red-700",
      dot: "bg-red-500",
    };
  }

  const elapsed = Date.now() - new Date(lastHeartbeat).getTime();
  const seconds = elapsed / 1000;

  if (seconds <= 120) {
    return {
      label: "EN LIGNE",
      color: "bg-green-100 text-green-700",
      dot: "bg-green-500",
    };
  }

  if (seconds <= 300) {
    return {
      label: "AVERTISSEMENT",
      color: "bg-orange-100 text-orange-700",
      dot: "bg-orange-500",
    };
  }

  return {
    label: "HORS LIGNE",
    color: "bg-red-100 text-red-700",
    dot: "bg-red-500",
  };
}

function formatDate(date: Date | null) {
  if (!date) return "Jamais";

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(date));
}

function formatRelative(date: Date | null) {
  if (!date) return "Jamais";

  const seconds = Math.floor(
    (Date.now() - new Date(date).getTime()) / 1000
  );

  if (seconds < 60) return `il y a ${seconds}s`;

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) return `il y a ${minutes} min`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `il y a ${hours} h`;

  return `il y a ${Math.floor(hours / 24)} j`;
}

export default async function ScreenDashboardPage({
  params,
}: PageProps) {
  const { id } = await params;

  const screen = await prisma.screen.findUnique({
    where: { id },
    include: {
      location: {
        include: {
          partner: {
            select: {
              businessName: true,
            },
          },
        },
      },
      zone: true,
      player: true,
      playlists: {
        where: {
          status: "ACTIVE",
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
        include: {
          items: {
            orderBy: {
              position: "asc",
            },
            include: {
              media: true,
              campaign: true,
            },
          },
        },
      },
    },
  });

  if (!screen) {
    notFound();
  }

  const player = screen.player;
  const playlist = screen.playlists[0] ?? null;

  const screenStatus = getScreenStatus(
    player?.lastHeartbeat ?? null
  );

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [todayLogs, totalLogs, failedLogs] = await Promise.all([
    prisma.playbackLog.count({
      where: {
        screenId: screen.id,
        startedAt: {
          gte: todayStart,
        },
        status: "PLAYED",
      },
    }),

    prisma.playbackLog.count({
      where: {
        screenId: screen.id,
      },
    }),

    prisma.playbackLog.count({
      where: {
        screenId: screen.id,
        status: {
          in: ["FAILED", "INTERRUPTED"],
        },
      },
    }),
  ]);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-6">
          <Link
            href="/admin/screens"
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux écrans
          </Link>

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">
                  {screen.name || "Écran sans nom"}
                </h1>

                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${screenStatus.color}`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${screenStatus.dot}`}
                  />
                  {screenStatus.label}
                </span>
              </div>

              <p className="mt-1 text-gray-500">
                {screen.screenCode}
              </p>
            </div>
          </div>
        </div>

        {/* INFORMATIONS PRINCIPALES */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2">
                <Monitor className="h-5 w-5 text-blue-600" />
              </div>

              <span className="text-sm font-medium text-gray-500">
                Écran
              </span>
            </div>

            <p className="font-semibold text-gray-900">
              {screen.resolution}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              {screen.orientation === "landscape"
                ? "Paysage"
                : screen.orientation === "portrait"
                  ? "Portrait"
                  : screen.orientation}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-lg bg-purple-50 p-2">
                <MapPin className="h-5 w-5 text-purple-600" />
              </div>

              <span className="text-sm font-medium text-gray-500">
                Emplacement
              </span>
            </div>

            <p className="font-semibold text-gray-900">
              {screen.location?.name || "-"}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              {screen.zone?.name || "Aucune zone"}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-lg bg-green-50 p-2">
                <Wifi className="h-5 w-5 text-green-600" />
              </div>

              <span className="text-sm font-medium text-gray-500">
                Player
              </span>
            </div>

            <p className="font-semibold text-gray-900">
              {player ? player.deviceId : "Aucun player"}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              {player
                ? `Version ${player.appVersion}`
                : "Non connecté"}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-lg bg-orange-50 p-2">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>

              <span className="text-sm font-medium text-gray-500">
                Dernier contact
              </span>
            </div>

            <p className="font-semibold text-gray-900">
              {formatRelative(player?.lastHeartbeat ?? null)}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              {formatDate(player?.lastHeartbeat ?? null)}
            </p>
          </div>
        </div>

        {/* PLAYER */}
        <div className="mb-6 rounded-xl border bg-white shadow-sm">
          <div className="border-b p-5">
            <div className="flex items-center gap-3">
              <Server className="h-5 w-5 text-gray-700" />
              <h2 className="text-lg font-semibold text-gray-900">
                Informations du Player
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 p-5 md:grid-cols-2 lg:grid-cols-4">

            <div>
              <p className="text-sm text-gray-500">Device ID</p>
              <p className="mt-1 font-medium text-gray-900">
                {player?.deviceId || "-"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Version</p>
              <p className="mt-1 font-medium text-gray-900">
                {player?.appVersion || "-"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Système</p>
              <p className="mt-1 font-medium text-gray-900">
                {player?.osVersion || "-"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Adresse IP</p>
              <p className="mt-1 font-medium text-gray-900">
                {player?.lastIp || "-"}
              </p>
            </div>

          </div>
        </div>

        {/* STATISTIQUES */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Lectures aujourd'hui
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {todayLogs}
                </p>
              </div>

              <div className="rounded-lg bg-blue-50 p-3">
                <Play className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Lectures totales
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {totalLogs}
                </p>
              </div>

              <div className="rounded-lg bg-green-50 p-3">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Échecs / interruptions
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {failedLogs}
                </p>
              </div>

              <div className="rounded-lg bg-red-50 p-3">
                <WifiOff className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

        </div>

        {/* PLAYLIST */}
        <div className="rounded-xl border bg-white shadow-sm">

          <div className="border-b p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Playlist active
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {playlist
                    ? `Version ${playlist.version}`
                    : "Aucune playlist active"}
                </p>
              </div>
            </div>
          </div>

          {!playlist ? (
            <div className="p-8 text-center text-gray-500">
              Aucune playlist active pour cet écran.
            </div>
          ) : playlist.items.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              La playlist est vide.
            </div>
          ) : (
            <div className="divide-y">

              {playlist.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 p-5"
                >
                  <div className="flex min-w-0 items-center gap-4">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 font-semibold text-gray-600">
                      {item.position}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-900">
                        {item.media.name}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {item.campaign?.name || "Sans campagne"}
                      </p>
                    </div>

                  </div>

                  <div className="shrink-0 text-right">
                    <p className="font-medium text-gray-900">
                      {item.durationSeconds}s
                    </p>

                    <p className="text-xs text-gray-500">
                      {item.media.fileType}
                    </p>
                  </div>
                </div>
              ))}

            </div>
          )}

        </div>

        {/* INFOS INSTALLATION */}
        <div className="mt-6 rounded-xl border bg-white p-5 shadow-sm">

          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Informations de l'écran
          </h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

            <div>
              <p className="text-sm text-gray-500">
                Partenaire
              </p>

              <p className="mt-1 font-medium text-gray-900">
                {screen.location?.partner?.businessName || "-"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Installation
              </p>

              <p className="mt-1 font-medium text-gray-900">
                {screen.installationDate
                  ? new Intl.DateTimeFormat("fr-FR").format(
                      new Date(screen.installationDate)
                    )
                  : "-"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Boucle d'inventaire
              </p>

              <p className="mt-1 font-medium text-gray-900">
                {screen.inventoryLoopSeconds} secondes
              </p>
            </div>

          </div>

        </div>

      </div>
    </main>
  );
}