import Link from "next/link";
import { requirePartner } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { createPartnerScreen } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function PartnerScreensPage() {
  const { partner } = await requirePartner();

  const [locations, screens] = await Promise.all([
    prisma.location.findMany({
      where: {
        partnerId: partner.id,
      },
      select: {
        id: true,
        name: true,
        address: true,
      },
      orderBy: {
        name: "asc",
      },
    }),

    prisma.screen.findMany({
      where: {
        location: {
          partnerId: partner.id,
        },
      },
      include: {
        location: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/partner"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Retour au tableau de bord
        </Link>

        <h1 className="mt-3 text-2xl font-bold">Mes écrans</h1>
        <p className="text-muted-foreground">
          Ajoutez et consultez les écrans de vos emplacements.
        </p>
      </div>

      <section className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Ajouter un écran</h2>

        {locations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun emplacement n’est associé à votre compte. Contactez
            l’administration pour en faire ajouter un.
          </p>
        ) : (
          <form action={createPartnerScreen} className="grid max-w-xl gap-4">
            <label className="grid gap-2 text-sm">
              Emplacement
              <select
                name="locationId"
                required
                defaultValue=""
                className="rounded-md border bg-background px-3 py-2"
              >
                <option value="" disabled>
                  Choisir un emplacement
                </option>

                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name} — {location.address}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm">
              Référence de l’écran
              <input
                name="screenCode"
                type="text"
                required
                maxLength={100}
                autoComplete="off"
                placeholder="Ex. BOUTIQUE-DIALLO-01"
                className="rounded-md border bg-background px-3 py-2"
              />
            </label>

            <label className="grid gap-2 text-sm">
              Nom de l’écran (facultatif)
              <input
                name="name"
                type="text"
                maxLength={100}
                placeholder="Ex. Écran entrée principale"
                className="rounded-md border bg-background px-3 py-2"
              />
            </label>

            <button
              type="submit"
              className="w-fit rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Ajouter l’écran
            </button>
          </form>
        )}
      </section>

      <section className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Écrans enregistrés</h2>

        {screens.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun écran n’a encore été ajouté.
          </p>
        ) : (
          <div className="space-y-3">
            {screens.map((screen) => (
              <div
                key={screen.id}
                className="flex flex-wrap justify-between gap-2 rounded-md border p-4"
              >
                <div>
                  <p className="font-medium">
                    {screen.name || screen.screenCode}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Référence : {screen.screenCode} · Emplacement :{" "}
                    {screen.location.name}
                  </p>
                </div>

                <span className="text-sm">{screen.status}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}