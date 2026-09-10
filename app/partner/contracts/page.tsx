import { requirePartner } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const STATUS_LABELS = {
  DRAFT: "Brouillon",
  ACTIVE: "Actif",
  EXPIRED: "Expiré",
  TERMINATED: "Résilié",
} as const;

export default async function PartnerContractsPage() {
  const { partner } = await requirePartner();

  const contracts = await prisma.contract.findMany({
    where: {
      partnerId: partner.id,
    },
    include: {
      screen: true,
    },
    orderBy: {
      startDate: "desc",
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mes contrats</h1>
        <p className="text-muted-foreground">
          Consultez vos contrats et leurs informations.
        </p>
      </div>

      {contracts.length === 0 ? (
        <div className="rounded-lg border bg-card p-6">
          <p className="text-muted-foreground">
            Aucun contrat n'est actuellement associé à votre compte.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {contracts.map((contract) => (
            <div
              key={contract.id}
              className="rounded-lg border bg-card p-6"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold">
                      Contrat partenaire
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {contract.id}
                    </p>
                  </div>

                  <div className="grid gap-3 text-sm md:grid-cols-2">
                    <div>
                      <span className="text-muted-foreground">
                        Début :{" "}
                      </span>
                      <span className="font-medium">
                        {contract.startDate.toLocaleDateString("fr-FR")}
                      </span>
                    </div>

                    <div>
                      <span className="text-muted-foreground">
                        Fin :{" "}
                      </span>
                      <span className="font-medium">
                        {contract.endDate.toLocaleDateString("fr-FR")}
                      </span>
                    </div>

                    <div>
                      <span className="text-muted-foreground">
                        Montant mensuel :{" "}
                      </span>
                      <span className="font-medium">
                        {Number(contract.monthlyAmount).toLocaleString(
                          "fr-FR"
                        )}{" "}
                        XOF
                      </span>
                    </div>

                    <div>
                      <span className="text-muted-foreground">
                        Statut :{" "}
                      </span>
                      <span className="font-medium">
                        {STATUS_LABELS[contract.status]}
                      </span>
                    </div>
                  </div>

                  <div className="text-sm">
                    <span className="text-muted-foreground">
                      Écran :{" "}
                    </span>
                    <span className="font-medium">
                      {contract.screen
                        ? contract.screen.name || contract.screen.screenCode
                        : "Tous les écrans"}
                    </span>
                  </div>
                </div>

                {contract.documentUrl && (
                  <a
                    href={contract.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
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
