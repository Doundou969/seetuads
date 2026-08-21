import { prisma } from "@/lib/prisma";
import {
  Monitor,
  Play,
  Store,
  MapPin,
  Eye,
  Clock,
  Activity,
  CheckCircle,
  XCircle,
  Megaphone,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const now = new Date();

  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);

  const start7Days = new Date(now);
  start7Days.setDate(start7Days.getDate() - 7);

  const start30Days = new Date(now);
  start30Days.setDate(start30Days.getDate() - 30);

  const [
    zones,
    partners,
    screens,
    players,
    campaigns,
    totalLogs,
    todayLogs,
    logs7Days,
    logs30Days,
    playedLogs,
    failedLogs,
    onlineScreens,
    activeCampaigns,
  ] = await Promise.all([
    prisma.zone.count(),

    prisma.partner.count(),

    prisma.screen.count(),

    prisma.player.count(),

    prisma.campaign.count(),

    prisma.playbackLog.count(),

    prisma.playbackLog.count({
      where: {
        startedAt: {
          gte: startToday,
        },
      },
    }),

    prisma.playbackLog.count({
      where: {
        startedAt: {
          gte: start7Days,
        },
      },
    }),

    prisma.playbackLog.count({
      where: {
        startedAt: {
          gte: start30Days,
        },
      },
    }),

    prisma.playbackLog.count({
      where: {
        status: "PLAYED",
      },
    }),

    prisma.playbackLog.count({
      where: {
        status: {
          in: ["FAILED", "INTERRUPTED"],
        },
      },
    }),

    prisma.screen.count({
      where: {
        status: "ONLINE",
      },
    }),

    prisma.campaign.count({
      where: {
        status: "ACTIVE",
      },
    }),
  ]);

  const successRate =
    totalLogs > 0
      ? Math.round((playedLogs / totalLogs) * 1000) / 10
      : 0;

  const stats = [
    {
      icon: Eye,
      value: todayLogs,
      label: "Impressions aujourd'hui",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      icon: Activity,
      value: logs7Days,
      label: "Impressions · 7 jours",
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      icon: Megaphone,
      value: activeCampaigns,
      label: "Campagnes actives",
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      icon: Monitor,
      value: `${onlineScreens}/${screens}`,
      label: "Écrans en ligne",
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      icon: CheckCircle,
      value: `${successRate}%`,
      label: "Taux de diffusion réussie",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      icon: XCircle,
      value: failedLogs,
      label: "Échecs / interruptions",
      color: "text-red-600",
      bg: "bg-red-50",
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-primary-700 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-3">
            Analytics SeetuAds
          </h1>

          <p className="text-primary-100 text-lg">
            Performance réelle du réseau publicitaire
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-10 px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="bg-white rounded-xl shadow-sm border p-6"
              >
                <div
                  className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center mb-4`}
                >
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>

                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </p>

                <p className="text-gray-500">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-5 h-5 text-primary-600" />
              <h2 className="font-semibold text-gray-900">
                30 derniers jours
              </h2>
            </div>

            <p className="text-3xl font-bold text-gray-900">
              {logs30Days}
            </p>

            <p className="text-sm text-gray-500 mt-1">
              diffusions enregistrées
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-4">
              <Play className="w-5 h-5 text-primary-600" />
              <h2 className="font-semibold text-gray-900">
                Lectures totales
              </h2>
            </div>

            <p className="text-3xl font-bold text-gray-900">
              {totalLogs}
            </p>

            <p className="text-sm text-gray-500 mt-1">
              depuis le lancement du réseau
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-5 h-5 text-primary-600" />
              <h2 className="font-semibold text-gray-900">
                Réseau
              </h2>
            </div>

            <p className="text-3xl font-bold text-gray-900">
              {onlineScreens}
            </p>

            <p className="text-sm text-gray-500 mt-1">
              écrans actuellement en ligne
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Vue générale du réseau
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-500">Zones</p>
              <p className="text-2xl font-bold">{zones}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Partenaires
              </p>
              <p className="text-2xl font-bold">{partners}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Players</p>
              <p className="text-2xl font-bold">{players}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Campagnes
              </p>
              <p className="text-2xl font-bold">{campaigns}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}