import { prisma } from "@/lib/prisma";
import {
  BarChart3,
  Monitor,
  Play,
  Clock,
  CheckCircle2,
  XCircle,
  Activity,
} from "lucide-react";

export const dynamic = "force-dynamic";

function formatDuration(seconds: number) {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
}

export default async function AdminAnalyticsPage() {
  const now = new Date();

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const sevenDaysStart = new Date(now);
  sevenDaysStart.setDate(sevenDaysStart.getDate() - 6);
  sevenDaysStart.setHours(0, 0, 0, 0);

  const [
    todayLogs,
    sevenDaysLogs,
    totalScreens,
    onlineScreens,
    totalPlayers,
    recentLogs,
  ] = await Promise.all([
    prisma.playbackLog.count({
      where: {
        startedAt: {
          gte: todayStart,
        },
      },
    }),

    prisma.playbackLog.findMany({
      where: {
        startedAt: {
          gte: sevenDaysStart,
        },
      },
      select: {
        id: true,
        startedAt: true,
        durationSeconds: true,
        status: true,
        screen: {
          select: {
            id: true,
            name: true,
            screenCode: true,
          },
        },
        media: {
          select: {
            id: true,
            name: true,
          },
        },
        campaign: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        startedAt: "desc",
      },
    }),

    prisma.screen.count(),

    prisma.screen.count({
      where: {
        status: "ONLINE",
      },
    }),

    prisma.player.count(),

    prisma.playbackLog.findMany({
      take: 20,
      orderBy: {
        startedAt: "desc",
      },
      select: {
        id: true,
        startedAt: true,
        durationSeconds: true,
        status: true,
        screen: {
          select: {
            name: true,
            screenCode: true,
          },
        },
        media: {
          select: {
            name: true,
          },
        },
        campaign: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  const playedLogs = sevenDaysLogs.filter(
    (log) => log.status === "PLAYED"
  );

  const failedLogs = sevenDaysLogs.filter(
    (log) => log.status === "FAILED"
  );

  const interruptedLogs = sevenDaysLogs.filter(
    (log) => log.status === "INTERRUPTED"
  );

  const skippedLogs = sevenDaysLogs.filter(
    (log) => log.status === "SKIPPED"
  );

  const totalDuration = sevenDaysLogs.reduce(
    (total, log) => total + (log.durationSeconds ?? 0),
    0
  );

  const successRate =
    sevenDaysLogs.length > 0
      ? Math.round(
          (playedLogs.length / sevenDaysLogs.length) * 100
        )
      : 0;

  const byScreen = new Map<
    string,
    {
      name: string;
      code: string;
      count: number;
      duration: number;
    }
  >();

  for (const log of sevenDaysLogs) {
    const key = log.screen.id;

    const current = byScreen.get(key) ?? {
      name: log.screen.name || "Écran sans nom",
      code: log.screen.screenCode,
      count: 0,
      duration: 0,
    };

    current.count += 1;
    current.duration += log.durationSeconds ?? 0;

    byScreen.set(key, current);
  }

  const screenStats = Array.from(byScreen.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const byCampaign = new Map<
    string,
    {
      name: string;
      count: number;
      duration: number;
    }
  >();

  for (const log of sevenDaysLogs) {
    if (!log.campaign) continue;

    const key = log.campaign.id;

    const current = byCampaign.get(key) ?? {
      name: log.campaign.name,
      count: 0,
      duration: 0,
    };

    current.count += 1;
    current.duration += log.durationSeconds ?? 0;

    byCampaign.set(key, current);
  }

  const campaignStats = Array.from(byCampaign.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const byMedia = new Map<
    string,
    {
      name: string;
      count: number;
      duration: number;
    }
  >();

  for (const log of sevenDaysLogs) {
    const key = log.media.id;

    const current = byMedia.get(key) ?? {
      name: log.media.name,
      count: 0,
      duration: 0,
    };

    current.count += 1;
    current.duration += log.durationSeconds ?? 0;

    byMedia.set(key, current);
  }

  const mediaStats = Array.from(byMedia.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const cards = [
    {
      label: "Diffusions aujourd'hui",
      value: todayLogs,
      icon: Play,
    },
    {
      label: "Diffusions — 7 jours",
      value: sevenDaysLogs.length,
      icon: BarChart3,
    },
    {
      label: "Temps de diffusion",
      value: formatDuration(totalDuration),
      icon: Clock,
    },
    {
      label: "Taux de lecture réussie",
      value: `${successRate}%`,
      icon: CheckCircle2,
    },
    {
      label: "Écrans en ligne",
      value: `${onlineScreens}/${totalScreens}`,
      icon: Monitor,
    },
    {
      label: "Players enregistrés",
      value: totalPlayers,
      icon: Activity,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary-600" />

          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Analytics
            </h1>

            <p className="text-gray-600">
              Performances du réseau publicitaire SeetuAds
            </p>
          </div>
        </div>
      </div>

      {/* KPI */}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className="rounded-xl border bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    {card.label}
                  </p>

                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {card.value}
                  </p>
                </div>

                <div className="rounded-xl bg-primary-50 p-3">
                  <Icon className="h-6 w-6 text-primary-600" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Statuts */}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">PLAYED</p>
          <p className="mt-2 text-2xl font-bold text-green-600">
            {playedLogs.length}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">INTERRUPTED</p>
          <p className="mt-2 text-2xl font-bold text-yellow-600">
            {interruptedLogs.length}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">FAILED</p>
          <p className="mt-2 text-2xl font-bold text-red-600">
            {failedLogs.length}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">SKIPPED</p>
          <p className="mt-2 text-2xl font-bold text-gray-600">
            {skippedLogs.length}
          </p>
        </div>
      </div>

      {/* Écrans */}

      <div className="rounded-xl border bg-white shadow-sm">
        <div className="border-b p-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Diffusions par écran
          </h2>

          <p className="text-sm text-gray-500">
            Activité des écrans sur les 7 derniers jours
          </p>
        </div>

        <div className="divide-y">
          {screenStats.length === 0 ? (
            <div className="p-6 text-gray-500">
              Aucune diffusion enregistrée.
            </div>
          ) : (
            screenStats.map((screen) => (
              <div
                key={screen.code}
                className="flex items-center justify-between p-5"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {screen.name}
                  </p>

                  <p className="text-sm text-gray-500">
                    {screen.code}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    {screen.count} diffusions
                  </p>

                  <p className="text-sm text-gray-500">
                    {formatDuration(screen.duration)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Campagnes */}

      <div className="rounded-xl border bg-white shadow-sm">
        <div className="border-b p-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Performances par campagne
          </h2>
        </div>

        <div className="divide-y">
          {campaignStats.length === 0 ? (
            <div className="p-6 text-gray-500">
              Aucune campagne associée aux diffusions.
            </div>
          ) : (
            campaignStats.map((campaign) => (
              <div
                key={campaign.name}
                className="flex items-center justify-between p-5"
              >
                <p className="font-medium text-gray-900">
                  {campaign.name}
                </p>

                <div className="text-right">
                  <p className="font-bold">
                    {campaign.count} diffusions
                  </p>

                  <p className="text-sm text-gray-500">
                    {formatDuration(campaign.duration)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Médias */}

      <div className="rounded-xl border bg-white shadow-sm">
        <div className="border-b p-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Performances par média
          </h2>
        </div>

        <div className="divide-y">
          {mediaStats.length === 0 ? (
            <div className="p-6 text-gray-500">
              Aucun média diffusé.
            </div>
          ) : (
            mediaStats.map((media) => (
              <div
                key={media.name}
                className="flex items-center justify-between p-5"
              >
                <p className="font-medium text-gray-900">
                  {media.name}
                </p>

                <div className="text-right">
                  <p className="font-bold">
                    {media.count} diffusions
                  </p>

                  <p className="text-sm text-gray-500">
                    {formatDuration(media.duration)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Dernières diffusions */}

      <div className="rounded-xl border bg-white shadow-sm">
        <div className="border-b p-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Dernières diffusions
          </h2>
        </div>

        <div className="divide-y">
          {recentLogs.length === 0 ? (
            <div className="p-6 text-gray-500">
              Aucune diffusion.
            </div>
          ) : (
            recentLogs.map((log) => (
              <div
                key={log.id}
                className="flex flex-col gap-2 p-5 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {log.media.name}
                  </p>

                  <p className="text-sm text-gray-500">
                    {log.screen.name || log.screen.screenCode}
                    {log.campaign
                      ? ` · ${log.campaign.name}`
                      : ""}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      log.status === "PLAYED"
                        ? "bg-green-100 text-green-700"
                        : log.status === "FAILED"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {log.status}
                  </span>

                  <span className="text-sm text-gray-500">
                    {log.durationSeconds ?? 0}s
                  </span>

                  <span className="text-sm text-gray-500">
                    {new Date(log.startedAt).toLocaleString(
                      "fr-FR"
                    )}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-xl border border-primary-100 bg-primary-50 p-5">
        <p className="text-sm text-primary-800">
          Analytics calculées à partir des PlaybackLogs générés
          directement par les Players SeetuAds.
        </p>
      </div>
    </div>
  );
}