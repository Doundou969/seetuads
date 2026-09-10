import { requirePartner } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PartnerScreensPage() {
  const { partner } = await requirePartner();

  const screens = await prisma.screen.findMany({
    where: {
      location: {
        partnerId: partner.id,
      },
    },
    include: {
      location: true,
      zone: true,
    },
    orderBy: {
      screenCode: "asc",
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mes écrans</h1>
        <p className="text-muted-foreground">
          Consultez les écrans associés à vos emplacements.
        </p>
      </div>

      {screens.length === 0 ? (
        <div className="rounded-lg border bg-card p-6">
          <p className="text-muted-foreground">
            Aucun écran n'est actuellement associé à votre compte.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {screens.map((screen) => (
            <div
              key={screen.id}
              className="rounded-lg border bg-card p-6 space-y-4"
            >
              <div>
                <h2 className="text-lg font-semibold">
                  {screen.name || screen.screenCode}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {screen.screenCode}
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Emplacement : </span>
                  <span>{screen.location.name}</span>
                </div>

                {screen.zone && (
                  <div>
                    <span className="text-muted-foreground">Zone : </span>
                    <span>{screen.zone.name}</span>
                  </div>
                )}

                <div>
                  <span className="text-muted-foreground">Résolution : </span>
                  <span>
                    {screen.widthPx} × {screen.heightPx}
                  </span>
                </div>

                <div>
                  <span className="text-muted-foreground">Statut : </span>
                  <span>{screen.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

