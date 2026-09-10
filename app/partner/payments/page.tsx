import { requirePartner } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PartnerPaymentsPage() {
  const { partner } = await requirePartner();

  const payouts = await prisma.partnerPayout.findMany({
    where: {
      partnerId: partner.id,
    },
    include: {
      screen: true,
    },
    orderBy: {
      periodStart: "desc",
    },
  });

  const totalAmount = payouts.reduce(
    (total, payout) => total + Number(payout.amount),
    0
  );

  const paidAmount = payouts
    .filter((payout) => payout.status === "PAID")
    .reduce((total, payout) => total + Number(payout.amount), 0);

  const pendingAmount = payouts
    .filter((payout) => payout.status === "PENDING")
    .reduce((total, payout) => total + Number(payout.amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Paiements / Revenus</h1>
        <p className="text-muted-foreground">
          Consultez vos revenus et l'historique de vos paiements.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Total des revenus</p>
          <p className="mt-2 text-2xl font-bold">
            {totalAmount.toLocaleString("fr-FR")} XOF
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Déjà payé</p>
          <p className="mt-2 text-2xl font-bold">
            {paidAmount.toLocaleString("fr-FR")} XOF
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">En attente</p>
          <p className="mt-2 text-2xl font-bold">
            {pendingAmount.toLocaleString("fr-FR")} XOF
          </p>
        </div>
      </div>

      {payouts.length === 0 ? (
        <div className="rounded-lg border bg-card p-6">
          <p className="text-muted-foreground">
            Aucun paiement ou revenu n'est actuellement enregistré.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {payouts.map((payout) => (
            <div
              key={payout.id}
              className="rounded-lg border bg-card p-6"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-3">
                  <div>
                    <p className="text-lg font-semibold">
                      {Number(payout.amount).toLocaleString("fr-FR")}{" "}
                      XOF
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Période du{" "}
                      {payout.periodStart.toLocaleDateString("fr-FR")} au{" "}
                      {payout.periodEnd.toLocaleDateString("fr-FR")}
                    </p>
                  </div>

                  <div className="grid gap-2 text-sm md:grid-cols-2">
                    <div>
                      <span className="text-muted-foreground">
                        Méthode :{" "}
                      </span>
                      <span>{payout.paymentMethod}</span>
                    </div>

                    <div>
                      <span className="text-muted-foreground">
                        Statut :{" "}
                      </span>
                      <span>{payout.status}</span>
                    </div>

                    {payout.screen && (
                      <div>
                        <span className="text-muted-foreground">
                          Écran :{" "}
                        </span>
                        <span>
                          {payout.screen.name || payout.screen.screenCode}
                        </span>
                      </div>
                    )}

                    {payout.paidAt && (
                      <div>
                        <span className="text-muted-foreground">
                          Payé le :{" "}
                        </span>
                        <span>
                          {payout.paidAt.toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                    )}
                  </div>

                  {payout.transactionReference && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">
                        Référence :{" "}
                      </span>
                      <span>{payout.transactionReference}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
