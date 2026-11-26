import { createPartnerLocation } from "@/lib/actions";
import { requirePartner } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PartnerLocationsPage() {
  const { partner } = await requirePartner();

  const locations = await prisma.location.findMany({
    where: { partnerId: partner.id },
    include: { screens: { select: { id: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mes emplacements</h1>
        <p className="text-muted-foreground">
          Ajoutez un emplacement et consultez ceux de votre compte partenaire.
        </p>
      </div>

      <section className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Ajouter un emplacement</h2>
        <form action={createPartnerLocation} className="grid max-w-2xl gap-4">
          <label className="grid gap-2 text-sm">
            Nom du commerce ou de l’emplacement
            <input name="name" type="text" required maxLength={120}
              className="rounded-md border bg-background px-3 py-2"
              placeholder="Ex. Boutique Diallo" />
          </label>

          <label className="grid gap-2 text-sm">
            Adresse
            <input name="address" type="text" required maxLength={250}
              className="rounded-md border bg-background px-3 py-2"
              placeholder="Ex. VDN, Dakar" />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm">
              Ville
              <input name="city" type="text" defaultValue={partner.city || "Dakar"}
                maxLength={100} className="rounded-md border bg-background px-3 py-2" />
            </label>
            <label className="grid gap-2 text-sm">
              Quartier (facultatif)
              <input name="district" type="text" maxLength={100}
                className="rounded-md border bg-background px-3 py-2"
                placeholder="Ex. Mermoz" />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm">
              Latitude (facultative)
              <input name="latitude" type="number" step="any" min="-90" max="90"
                className="rounded-md border bg-background px-3 py-2"
                placeholder="Ex. 14.7167" />
            </label>
            <label className="grid gap-2 text-sm">
              Longitude (facultative)
              <input name="longitude" type="number" step="any" min="-180" max="180"
                className="rounded-md border bg-background px-3 py-2"
                placeholder="Ex. -17.4677" />
            </label>
          </div>

          <button type="submit"
            className="w-fit rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            style={{ color: "#fff" }}>
            Ajouter l’emplacement
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Emplacements enregistrés</h2>
        {locations.length === 0 ? (
          <div className="rounded-lg border bg-card p-6">
            <p className="text-muted-foreground">
              Aucun emplacement n’est actuellement associé à votre compte.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {locations.map((location) => (
              <article key={location.id} className="space-y-4 rounded-lg border bg-card p-6">
                <div>
                  <h3 className="text-lg font-semibold">{location.name}</h3>
                  <p className="text-sm text-muted-foreground">{location.city}</p>
                </div>
                <div className="space-y-2 text-sm">
                  <p><span className="text-muted-foreground">Adresse : </span>{location.address}</p>
                  {location.district && (
                    <p><span className="text-muted-foreground">Quartier : </span>{location.district}</p>
                  )}
                  <p><span className="text-muted-foreground">Écrans : </span>{location.screens.length}</p>
                  <p><span className="text-muted-foreground">Statut : </span>{location.status}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
