import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  BarChart3,
  Monitor,
  PlayCircle,
  AlertTriangle,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CampaignDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      advertiser: true,
      campaignScreens: {
        include: {
          screen: true,
        },
      },
      campaignMedia: {
        include: {
          media: true,
        },
      },
      playbackLogs: {
        orderBy: {
          startedAt: "desc",
        },
        take: 100,
        include: {
          screen: true,
          media: true,
          player: true,
        },
      },
    },
  });

  if (!campaign) {
    notFound();
  }

  const now = new Date();

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const totalAttempts = campaign.playbackLogs.length;

  const playedLogs = campaign.playbackLogs.filter(
    (log) => log.status === "PLAYED"
  );

  const totalPlayed = playedLogs.length;

  const playedToday = playedLogs.filter(
    (log) => log.startedAt >= todayStart
  ).length;

  const playedLast7Days = playedLogs.filter(
    (log) => log.startedAt >= sevenDaysAgo
  ).length;

  const failedCount = campaign.playbackLogs.filter(
    (log) => log.status !== "PLAYED"
  ).length;

  const successRate =
    totalAttempts > 0
      ? Math.round((totalPlayed / totalAttempts) * 100)
      : 0;

  const screenStats = campaign.campaignScreens.map(
    (campaignScreen) => {
      const screenLogs = campaign.playbackLogs.filter(
        (log) => log.screenId === campaignScreen.screenId
      );

      const played = screenLogs.filter(
        (log) => log.status === "PLAYED"
      ).length;

      const failed = screenLogs.filter(
        (log) => log.status !== "PLAYED"
      ).length;

      return {
        id: campaignScreen.screen.id,
        name: campaignScreen.screen.name,
        code: campaignScreen.screen.id,
        played,
        failed,
        total: screenLogs.length,
      };
    }
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/admin/campaigns">
            <Button
              variant="ghost"
              className="mb-3 gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour aux campagnes
            </Button>
          </Link>

          <h1 className="text-2xl font-bold text-gray-900">
            {campaign.name}
          </h1>

          <p className="text-gray-600">
            {campaign.advertiser?.companyName || "Annonceur inconnu"}
          </p>
        </div>

        <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
          {String(campaign.status)}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border bg-white p-5">
          <div className="flex items-center gap-3">
            <PlayCircle className="h-5 w-5 text-blue-600" />
            <span className="text-sm text-gray-500">
              Lectures totales
            </span>
          </div>

          <p className="mt-3 text-3xl font-bold">
            {totalPlayed}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-green-600" />
            <span className="text-sm text-gray-500">
              Aujourd'hui
            </span>
          </div>

          <p className="mt-3 text-3xl font-bold">
            {playedToday}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <div className="flex items-center gap-3">
            <Monitor className="h-5 w-5 text-purple-600" />
            <span className="text-sm text-gray-500">
              7 derniers jours
            </span>
          </div>

          <p className="mt-3 text-3xl font-bold">
            {playedLast7Days}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="text-sm text-gray-500">
              Réussite
            </span>
          </div>

          <p className="mt-3 text-3xl font-bold">
            {successRate}%
          </p>

          <p className="mt-1 text-sm text-gray-500">
            {failedCount} échec(s)
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-white">
        <div className="border-b p-5">
          <h2 className="text-lg font-semibold">
            Diffusion par écran
          </h2>

          <p className="text-sm text-gray-500">
            Performances réelles de chaque écran de la campagne
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-5 py-3">Écran</th>
                <th className="px-5 py-3">Code</th>
                <th className="px-5 py-3">Lectures</th>
                <th className="px-5 py-3">Échecs</th>
                <th className="px-5 py-3">Total</th>
              </tr>
            </thead>

            <tbody>
              {screenStats.map((screen) => (
                <tr
                  key={screen.id}
                  className="border-t"
                >
                  <td className="px-5 py-4 font-medium">
                    {screen.name}
                  </td>

                  <td className="px-5 py-4 text-gray-500">
                    {screen.code}
                  </td>

                  <td className="px-5 py-4">
                    {screen.played}
                  </td>

                  <td className="px-5 py-4">
                    {screen.failed}
                  </td>

                  <td className="px-5 py-4">
                    {screen.total}
                  </td>
                </tr>
              ))}

              {screenStats.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-gray-500"
                  >
                    Aucun écran associé à cette campagne.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border bg-white">
        <div className="border-b p-5">
          <h2 className="text-lg font-semibold">
            Historique récent
          </h2>

          <p className="text-sm text-gray-500">
            100 dernières tentatives de diffusion
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Écran</th>
                <th className="px-5 py-3">Player</th>
                <th className="px-5 py-3">Média</th>
                <th className="px-5 py-3">Statut</th>
              </tr>
            </thead>

            <tbody>
              {campaign.playbackLogs.map((log) => (
                <tr
                  key={log.id.toString()}
                  className="border-t"
                >
                  <td className="px-5 py-4">
                    {log.startedAt.toLocaleString("fr-FR")}
                  </td>

                  <td className="px-5 py-4">
                    {log.screen.name}
                  </td>

                  <td className="px-5 py-4 text-gray-500">
                    {log.player.deviceId}
                  </td>

                  <td className="px-5 py-4">
                    {log.media.name}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={
                        log.status === "PLAYED"
                          ? "font-medium text-green-600"
                          : "font-medium text-red-600"
                      }
                    >
                      {String(log.status)}
                    </span>
                  </td>
                </tr>
              ))}

              {campaign.playbackLogs.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-gray-500"
                  >
                    Aucune diffusion enregistrée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}