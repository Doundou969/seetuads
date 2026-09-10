import { requirePartner } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PartnerLocationsPage() {
  const { partner } = await requirePartner();

  const locations = await prisma.location.findMany({
    where: {
      partnerId: partner.id,
    },
    include: {
      screens: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mes emplacements</h1>
        <p className="text-muted-foreground">
          Consultez les emplacements associés à votre compte partenaire.
        </p>
      </div>

      {locations.length === 0 ? (
        <div className="rounded-lg border bg-card p-6">
          <p className="text-muted-foreground">
            Aucun emplacement n'est actuellement associé à votre compte.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {locations.map((location) => (
            <div
              key={location.id}
              className="rounded-lg border bg-card p-6 space-y-4"
            >
              <div>
                <h2 className="text-lg font-semibold">{location.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {location.city}
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Adresse : </span>
                  <span>{location.address}</span>
                </div>

                <div>
                  <span className="text-muted-foreground">Ville : </span>
                  <span>{location.city}</span>
                </div>

                <div>
                  <span className="text-muted-foreground">Écrans : </span>
                  <span>{location.screens.length}</span>
                </div>

                <div>
                  <span className="text-muted-foreground">Statut : </span>
                  <span>{location.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
