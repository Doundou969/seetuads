import { prisma } from "@/lib/prisma";
import ContractStatusSelect from "./contract-status-select";
import ContractDeleteButton from "./contract-delete-button";

export const dynamic = "force-dynamic";

const STATUS_LABELS = {
  DRAFT: "Brouillon",
  ACTIVE: "Actif",
  EXPIRED: "Expiré",
  TERMINATED: "Résilié",
} as const;

export default async function AdminContractsPage() {
  const contracts = await prisma.contract.findMany({
    include: {
      partner: true,
      screen: true,
    },
    orderBy: {
      startDate: "desc",
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contrats partenaires</h1>
          <p className="text-muted-foreground">
            Consultez et gérez les contrats associés aux partenaires SeetuAds.
          </p>
        </div>

        <a
          href="/admin/contracts/new"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Nouveau contrat
        </a>
      </div>

      {contracts.length === 0 ? (
        <div className="rounded-lg border bg-card p-6">
          <p className="text-muted-foreground">
            Aucun contrat n'est actuellement enregistré.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {contracts.map((contract) => (
            <div
              key={contract.id}
              className="rounded-lg border bg-card p-6 space-y-4"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="font-semibold">
                    {contract.partner.businessName}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Contrat {contract.id}
                  </p>
                </div>

                <ContractStatusSelect
                  contractId={contract.id}
                  status={contract.status}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">Début</p>
                  <p className="font-medium">
                    {contract.startDate.toLocaleDateString("fr-FR")}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Fin</p>
                  <p className="font-medium">
                    {contract.endDate.toLocaleDateString("fr-FR")}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    Montant mensuel
                  </p>
                  <p className="font-medium">
                    {Number(contract.monthlyAmount).toLocaleString("fr-FR")} XOF
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Écran</p>
                  <p className="font-medium">
                    {contract.screen
                      ? contract.screen.name || contract.screen.screenCode
                      : "Tous les écrans"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="rounded-full border px-3 py-1">
                  {STATUS_LABELS[contract.status]}
                </span>

                <a
                  href={`/admin/contracts/${contract.id}/edit`}
                  className="rounded-md border px-3 py-1 underline-offset-4 hover:underline"
                >
                  Modifier
                </a>

                <ContractDeleteButton contractId={contract.id} />

                {contract.documentUrl && (
                  <a
                    href={contract.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Voir le document
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
