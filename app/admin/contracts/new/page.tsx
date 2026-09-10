import { createContract } from "@/lib/actions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NewContractPage() {
  const [partners, screens] = await Promise.all([
    prisma.partner.findMany({
      orderBy: {
        businessName: "asc",
      },
    }),
    prisma.screen.findMany({
      orderBy: {
        screenCode: "asc",
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2">
          <a
            href="/admin/contracts"
            className="text-sm text-muted-foreground underline"
          >
            ← Retour aux contrats
          </a>
        </div>

        <h1 className="text-2xl font-bold">Nouveau contrat partenaire</h1>
        <p className="text-muted-foreground">
          Créez un contrat pour un partenaire SeetuAds.
        </p>
      </div>

      <form
        action={createContract}
        className="max-w-2xl space-y-6 rounded-lg border bg-card p-6"
      >
        <div className="space-y-2">
          <label htmlFor="partnerId" className="text-sm font-medium">
            Partenaire
          </label>

          <select
            id="partnerId"
            name="partnerId"
            required
            className="w-full rounded-md border bg-background px-3 py-2"
            defaultValue=""
          >
            <option value="" disabled>
              Sélectionner un partenaire
            </option>

            {partners.map((partner) => (
              <option key={partner.id} value={partner.id}>
                {partner.businessName}
                {partner.ownerName ? ` — ${partner.ownerName}` : ""}
              </option>
            ))}
          </select>

          {partners.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Aucun partenaire disponible.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="screenId" className="text-sm font-medium">
            Écran
          </label>

          <select
            id="screenId"
            name="screenId"
            className="w-full rounded-md border bg-background px-3 py-2"
            defaultValue=""
          >
            <option value="">
              Tous les écrans / aucun écran spécifique
            </option>

            {screens.map((screen) => (
              <option key={screen.id} value={screen.id}>
                {screen.name
                  ? `${screen.name} — ${screen.screenCode}`
                  : screen.screenCode}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="startDate" className="text-sm font-medium">
              Date de début
            </label>

            <input
              id="startDate"
              name="startDate"
              type="date"
              required
              className="w-full rounded-md border bg-background px-3 py-2"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="endDate" className="text-sm font-medium">
              Date de fin
            </label>

            <input
              id="endDate"
              name="endDate"
              type="date"
              required
              className="w-full rounded-md border bg-background px-3 py-2"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="monthlyAmount" className="text-sm font-medium">
            Montant mensuel (XOF)
          </label>

          <input
            id="monthlyAmount"
            name="monthlyAmount"
            type="number"
            min="0"
            step="1"
            defaultValue="20000"
            required
            className="w-full rounded-md border bg-background px-3 py-2"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="status" className="text-sm font-medium">
            Statut initial
          </label>

          <select
            id="status"
            name="status"
            defaultValue="DRAFT"
            className="w-full rounded-md border bg-background px-3 py-2"
          >
            <option value="DRAFT">Brouillon</option>
            <option value="ACTIVE">Actif</option>
            <option value="EXPIRED">Expiré</option>
            <option value="TERMINATED">Résilié</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="documentUrl" className="text-sm font-medium">
            URL du document
          </label>

          <input
            id="documentUrl"
            name="documentUrl"
            type="url"
            placeholder="https://..."
            className="w-full rounded-md border bg-background px-3 py-2"
          />

          <p className="text-xs text-muted-foreground">
            Facultatif. Ajoutez le lien vers le contrat signé ou son document.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <a
            href="/admin/contracts"
            className="rounded-md border px-4 py-2 text-sm font-medium"
          >
            Annuler
          </a>

          <button
            type="submit"
            disabled={partners.length === 0}
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            Créer le contrat
          </button>
        </div>
      </form>
    </div>
  );
}
