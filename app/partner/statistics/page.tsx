import { requirePartner } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PartnerStatisticsPage() {
  const { partner } = await requirePartner();

  const screens = await prisma.screen.findMany({
    where: {
      location: {
        partnerId: partner.id,
      },
    },
    select: {
      id: true,
      name: true,
      screenCode: true,
    },
  });

  const screenIds = screens.map((screen) => screen.id);

  const playbackLogs =
    screenIds.length > 0
      ? await prisma.playbackLog.findMany({
          where: {
            screenId: {
              in: screenIds,
            },
          },
          select: {
            id: true,
            screenId: true,
            campaignId: true,
            durationSeconds: true,
            status: true,
            startedAt: true,
          },
          orderBy: {
            startedAt: "desc",
          },
        })
      : [];

  const totalPlaybacks = playbackLogs.length;

  const totalDuration = playbackLogs.reduce(
    (total, log) => total + (log.durationSeconds ?? 0),
    0
  );

  const playedCount = playbackLogs.filter(
    (log) => log.status === "PLAYED"
  ).length;

  const screenStats = screens.map((screen) => {
    const logs = playbackLogs.filter(
      (log) => log.screenId === screen.id
    );

    return {
      ...screen,
      playbacks: logs.length,
      duration: logs.reduce(
        (total, log) => total + (log.durationSeconds ?? 0),
        0
      ),
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Statistiques</h1>
        <p className="text-muted-foreground">
          Consultez les performances de vos écrans.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            Diffusions totales
          </p>
          <p className="mt-2 text-3xl font-bold">
            {totalPlaybacks.toLocaleString("fr-FR")}
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            Diffusions réussies
          </p>
          <p className="mt-2 text-3xl font-bold">
            {playedCount.toLocaleString("fr-FR")}
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            Temps diffusé
          </p>
          <p className="mt-2 text-3xl font-bold">
            {Math.floor(totalDuration / 60)} min
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="border-b p-6">
          <h2 className="text-lg font-semibold">Performance par écran</h2>
        </div>

        {screenStats.length === 0 ? (
          <div className="p-6">
            <p className="text-muted-foreground">
              Aucun écran n'est actuellement associé à votre compte.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {screenStats.map((screen) => (
              <div
                key={screen.id}
                className="flex flex-col gap-3 p-6 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-semibold">
                    {screen.name || screen.screenCode}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {screen.screenCode}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div>
                    <p className="text-muted-foreground">Diffusions</p>
                    <p className="font-semibold">
                      {screen.playbacks.toLocaleString("fr-FR")}
                    </p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Temps diffusé</p>
                    <p className="font-semibold">
                      {Math.floor(screen.duration / 60)} min
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
