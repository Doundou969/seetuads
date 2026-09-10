import { updateContract } from "@/lib/actions";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const STATUS_LABELS = {
  DRAFT: "Brouillon",
  ACTIVE: "Actif",
  EXPIRED: "Expiré",
  TERMINATED: "Résilié",
} as const;

export default async function EditContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [contract, partners, screens] = await Promise.all([
    prisma.contract.findUnique({
      where: { id },
      include: {
        partner: true,
        screen: true,
      },
    }),
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

  if (!contract) {
    notFound();
  }

  const updateContractWithId = updateContract.bind(null, contract.id);

  const startDate = contract.startDate.toISOString().slice(0, 10);
  const endDate = contract.endDate.toISOString().slice(0, 10);

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

        <h1 className="text-2xl font-bold">Modifier le contrat</h1>

        <p className="text-muted-foreground">
          Modifiez les informations du contrat partenaire.
        </p>
      </div>

      <form
        action={updateContractWithId}
        className="max-w-2xl space-y-6 rounded-lg border bg-card p-6"
      >
        <div className="rounded-md bg-muted p-4 text-sm">
          <p>
            <span className="font-medium">Contrat :</span>{" "}
            {contract.id}
          </p>

          <p className="mt-1">
            <span className="font-medium">Partenaire actuel :</span>{" "}
            {contract.partner.businessName}
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="partnerId" className="text-sm font-medium">
            Partenaire
          </label>

          <select
            id="partnerId"
            name="partnerId"
            required
            defaultValue={contract.partnerId}
            className="w-full rounded-md border bg-background px-3 py-2"
          >
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
            defaultValue={contract.screenId ?? ""}
            className="w-full rounded-md border bg-background px-3 py-2"
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
              defaultValue={startDate}
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
              defaultValue={endDate}
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
            required
            defaultValue={Number(contract.monthlyAmount)}
            className="w-full rounded-md border bg-background px-3 py-2"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="status" className="text-sm font-medium">
            Statut
          </label>

          <select
            id="status"
            name="status"
            defaultValue={contract.status}
            className="w-full rounded-md border bg-background px-3 py-2"
          >
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
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
            defaultValue={contract.documentUrl ?? ""}
            className="w-full rounded-md border bg-background px-3 py-2"
          />

          <p className="text-xs text-muted-foreground">
            Facultatif. Laissez vide pour supprimer le lien actuel.
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
            Enregistrer les modifications
          </button>
        </div>
      </form>
    </div>
  );
}