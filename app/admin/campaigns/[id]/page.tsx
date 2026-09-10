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
  Clock3,
  Film,
  FileCheck2,
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

      _count: {
        select: {
          playbackLogs: true,
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

  /*
   * Statistiques globales :
   * on utilise TOUS les PlaybackLogs de la campagne.
   */
  const allPlaybackLogs = await prisma.playbackLog.findMany({
    where: {
      campaignId: campaign.id,
    },
    select: {
      status: true,
      startedAt: true,
      endedAt: true,
      durationSeconds: true,
      screenId: true,
      mediaId: true,
      playerId: true,
      media: {
        select: {
          id: true,
          name: true,
          durationSeconds: true,
        },
      },
      screen: {
        select: {
          id: true,
          name: true,
          screenCode: true,
        },
      },
      player: {
        select: {
          id: true,
          deviceId: true,
        },
      },
    },
  });

  const totalAttempts = allPlaybackLogs.length;

  const totalPlayed = allPlaybackLogs.filter(
    (log) => log.status === "PLAYED"
  ).length;

  const playedToday = allPlaybackLogs.filter(
    (log) =>
      log.status === "PLAYED" &&
      log.startedAt >= todayStart
  ).length;

  const playedLast7Days = allPlaybackLogs.filter(
    (log) =>
      log.status === "PLAYED" &&
      log.startedAt >= sevenDaysAgo
  ).length;

  const failedCount = allPlaybackLogs.filter(
    (log) => log.status !== "PLAYED"
  ).length;

  const successRate =
    totalAttempts > 0
      ? Math.round((totalPlayed / totalAttempts) * 100)
      : 0;

  const playedLogs = allPlaybackLogs
    .filter((log) => log.status === "PLAYED")
    .sort(
      (a, b) =>
        b.startedAt.getTime() - a.startedAt.getTime()
    );

  const totalDurationSeconds = playedLogs.reduce(
    (total, log) =>
      total + (log.durationSeconds ?? log.media.durationSeconds ?? 0),
    0
  );

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }

    if (minutes > 0) {
      return `${minutes}min ${remainingSeconds}s`;
    }

    return `${remainingSeconds}s`;
  };

  const lastPlayedLog = playedLogs[0] ?? null;

  /*
   * Statistiques par écran.
   */
  const screenStats = campaign.campaignScreens.map(
    (campaignScreen) => {
      const screenLogs = allPlaybackLogs.filter(
        (log) => log.screenId === campaignScreen.screenId
      );

      const played = screenLogs.filter(
        (log) => log.status === "PLAYED"
      ).length;

      const failed = screenLogs.filter(
        (log) => log.status !== "PLAYED"
      ).length;

      const duration = screenLogs
        .filter((log) => log.status === "PLAYED")
        .reduce(
          (total, log) =>
            total +
            (log.durationSeconds ??
              log.media.durationSeconds ??
              0),
          0
        );

      return {
        id: campaignScreen.screen.id,
        name:
          campaignScreen.screen.name ||
          "Écran sans nom",
        code: campaignScreen.screen.screenCode,
        played,
        failed,
        total: screenLogs.length,
        duration,
      };
    }
  );

  /*
   * Statistiques par média.
   */
  const mediaStats = campaign.campaignMedia.map(
    (campaignMedia) => {
      const mediaLogs = allPlaybackLogs.filter(
        (log) => log.mediaId === campaignMedia.mediaId
      );

      const played = mediaLogs.filter(
        (log) => log.status === "PLAYED"
      ).length;

      const failed = mediaLogs.filter(
        (log) => log.status !== "PLAYED"
      ).length;

      const duration = mediaLogs
        .filter((log) => log.status === "PLAYED")
        .reduce(
          (total, log) =>
            total +
            (log.durationSeconds ??
              campaignMedia.media.durationSeconds ??
              0),
          0
        );

      return {
        id: campaignMedia.media.id,
        name: campaignMedia.media.name,
        durationPerPlay:
          campaignMedia.media.durationSeconds,
        played,
        failed,
        total: mediaLogs.length,
        duration,
      };
    }
  );

  return (
    <div className="space-y-6">
      {/* En-tête */}

      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/admin/campaigns">
            <Button
              variant="ghost"
              className="mb-3 gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour aux campagnes
            </Button>
          </Link>

          <h1 className="text-2xl font-bold text-gray-900">
            {campaign.name}
          </h1>

          <p className="text-gray-600">
            {campaign.advertiser?.companyName ||
              "Annonceur inconnu"}
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Du{" "}
            {new Date(campaign.startDate).toLocaleDateString(
              "fr-FR"
            )}{" "}
            au{" "}
            {new Date(campaign.endDate).toLocaleDateString(
              "fr-FR"
            )}
          </p>
        </div>

        <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
          {String(campaign.status)}
        </span>
      </div>

      {/* KPI existants + nouveaux indicateurs */}

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

          <p className="mt-1 text-sm text-gray-500">
            {totalAttempts} tentative(s)
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

      {/* Nouvelles statistiques */}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-5">
          <div className="flex items-center gap-3">
            <Clock3 className="h-5 w-5 text-orange-600" />
            <span className="text-sm text-gray-500">
              Durée totale diffusée
            </span>
          </div>

          <p className="mt-3 text-3xl font-bold">
            {formatDuration(totalDurationSeconds)}
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Basée sur les diffusions PLAYED
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <div className="flex items-center gap-3">
            <Film className="h-5 w-5 text-indigo-600" />
            <span className="text-sm text-gray-500">
              Médias diffusés
            </span>
          </div>

          <p className="mt-3 text-3xl font-bold">
            {
              new Set(
                playedLogs.map((log) => log.mediaId)
              ).size
            }
          </p>

          <p className="mt-1 text-sm text-gray-500">
            sur {campaign.campaignMedia.length} média(s)
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <div className="flex items-center gap-3">
            <FileCheck2 className="h-5 w-5 text-emerald-600" />
            <span className="text-sm text-gray-500">
              Dernière diffusion
            </span>
          </div>

          <p className="mt-3 text-lg font-bold">
            {lastPlayedLog
              ? lastPlayedLog.startedAt.toLocaleString("fr-FR")
              : "Aucune"}
          </p>

          {lastPlayedLog && (
            <p className="mt-1 text-sm text-gray-500">
              {lastPlayedLog.screen.name ||
                lastPlayedLog.screen.screenCode}{" "}
              · {lastPlayedLog.player.deviceId}
            </p>
          )}
        </div>
      </div>

      {/* Diffusion par écran */}

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
                <th className="px-5 py-3">Durée</th>
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

                  <td className="px-5 py-4 font-medium text-green-600">
                    {screen.played}
                  </td>

                  <td className="px-5 py-4 text-red-600">
                    {screen.failed}
                  </td>

                  <td className="px-5 py-4">
                    {formatDuration(screen.duration)}
                  </td>

                  <td className="px-5 py-4">
                    {screen.total}
                  </td>
                </tr>
              ))}

              {screenStats.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
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

      {/* Diffusion par média */}

      <div className="rounded-xl border bg-white">
        <div className="border-b p-5">
          <h2 className="text-lg font-semibold">
            Diffusion par média
          </h2>

          <p className="text-sm text-gray-500">
            Nombre de diffusions et durée réelle enregistrée pour chaque média
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-5 py-3">Média</th>
                <th className="px-5 py-3">Durée / lecture</th>
                <th className="px-5 py-3">Lectures</th>
                <th className="px-5 py-3">Échecs</th>
                <th className="px-5 py-3">Durée totale</th>
              </tr>
            </thead>

            <tbody>
              {mediaStats.map((media) => (
                <tr
                  key={media.id}
                  className="border-t"
                >
                  <td className="px-5 py-4 font-medium">
                    {media.name}
                  </td>

                  <td className="px-5 py-4 text-gray-500">
                    {media.durationPerPlay}s
                  </td>

                  <td className="px-5 py-4 font-medium text-green-600">
                    {media.played}
                  </td>

                  <td className="px-5 py-4 text-red-600">
                    {media.failed}
                  </td>

                  <td className="px-5 py-4">
                    {formatDuration(media.duration)}
                  </td>
                </tr>
              ))}

              {mediaStats.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-gray-500"
                  >
                    Aucun média associé à cette campagne.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preuve de diffusion */}

      <div className="rounded-xl border bg-white">
        <div className="border-b p-5">
          <div className="flex items-center gap-3">
            <FileCheck2 className="h-5 w-5 text-emerald-600" />

            <div>
              <h2 className="text-lg font-semibold">
                Preuve de diffusion
              </h2>

              <p className="text-sm text-gray-500">
                Synthèse basée sur les PlaybackLogs réels du Player
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-500">
              Campagne
            </p>

            <p className="mt-1 font-semibold">
              {campaign.name}
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-500">
              Diffusions validées
            </p>

            <p className="mt-1 text-2xl font-bold text-green-600">
              {totalPlayed}
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-500">
              Durée cumulée
            </p>

            <p className="mt-1 text-2xl font-bold">
              {formatDuration(totalDurationSeconds)}
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-500">
              Écran / Player
            </p>

            <p className="mt-1 font-semibold">
              {lastPlayedLog
                ? `${lastPlayedLog.screen.screenCode} / ${lastPlayedLog.player.deviceId}`
                : "Aucune diffusion"}
            </p>
          </div>
        </div>

        <div className="border-t p-5 text-sm text-gray-600">
          <p>
            Cette preuve est calculée à partir des événements
            de lecture enregistrés avec le statut{" "}
            <strong>PLAYED</strong>.
          </p>

          {lastPlayedLog && (
            <p className="mt-2">
              Dernière diffusion constatée le{" "}
              <strong>
                {lastPlayedLog.startedAt.toLocaleString("fr-FR")}
              </strong>
              .
            </p>
          )}
        </div>
      </div>

      {/* Historique */}

      <div className="rounded-xl border bg-white">
        <div className="border-b p-5">
          <h2 className="text-lg font-semibold">
            Historique récent
          </h2>

          <p className="text-sm text-gray-500">
            Les 100 dernières tentatives de diffusion
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
                <th className="px-5 py-3">Durée</th>
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
                    {log.screen.name ||
                      log.screen.screenCode}
                  </td>

                  <td className="px-5 py-4 text-gray-500">
                    {log.player.deviceId}
                  </td>

                  <td className="px-5 py-4">
                    {log.media.name}
                  </td>

                  <td className="px-5 py-4">
                    {log.durationSeconds ?? log.media.durationSeconds}s
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
                    colSpan={6}
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

