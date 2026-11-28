"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Campaign {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  estimatedPrice: string | null;
  finalPrice: string | null;
  rejectionReason: string | null;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; classes: string; dot: string }
> = {
  DRAFT: {
    label: "Brouillon",
    classes: "bg-slate-100 text-slate-700 ring-slate-600/10",
    dot: "bg-slate-400",
  },
  PENDING_REVIEW: {
    label: "En examen",
    classes: "bg-amber-50 text-amber-700 ring-amber-600/20",
    dot: "bg-amber-500",
  },
  AWAITING_PAYMENT: {
    label: "En attente de paiement",
    classes: "bg-purple-50 text-purple-700 ring-purple-600/20",
    dot: "bg-purple-500",
  },
  SCHEDULED: {
    label: "Planifiée",
    classes: "bg-blue-50 text-blue-700 ring-blue-600/20",
    dot: "bg-blue-500",
  },
  ACTIVE: {
    label: "Active",
    classes: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    dot: "bg-emerald-500",
  },
  PAUSED: {
    label: "En pause",
    classes: "bg-orange-50 text-orange-700 ring-orange-600/20",
    dot: "bg-orange-500",
  },
  COMPLETED: {
    label: "Terminée",
    classes: "bg-slate-100 text-slate-700 ring-slate-600/10",
    dot: "bg-slate-400",
  },
  CANCELLED: {
    label: "Annulée",
    classes: "bg-rose-50 text-rose-700 ring-rose-600/20",
    dot: "bg-rose-500",
  },
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatPrice(value: string | null) {
  if (!value) {
    return "—";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "—";
  }

  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(amount)} FCFA`;
}

function CampaignStatus({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? {
    label: status.replaceAll("_", " "),
    classes: "bg-slate-100 text-slate-700 ring-slate-600/10",
    dot: "bg-slate-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${config.classes}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadCampaigns() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/campaigns");

        if (!response.ok) {
          throw new Error("La récupération des campagnes a échoué.");
        }

        const data: unknown = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("La réponse reçue est invalide.");
        }

        if (!cancelled) {
          setCampaigns(data as Campaign[]);
        }
      } catch {
        if (!cancelled) {
          setError(
            "Impossible de charger tes campagnes. Vérifie ta connexion puis réessaie.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCampaigns();

    return () => {
      cancelled = true;
    };
  }, [retry]);

  const deleteCampaign = async (id: string) => {
    if (!window.confirm("Supprimer cette campagne ?")) {
      return;
    }

    setDeleteError(null);
    setDeletingId(id);

    try {
      const response = await fetch(`/api/campaigns/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("La suppression a échoué.");
      }

      setCampaigns((previous) => previous.filter((campaign) => campaign.id !== id));
    } catch {
      setDeleteError(
        "Impossible de supprimer cette campagne. Réessaie dans un instant.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-sky-700">
            Espace annonceur
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Mes campagnes
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Consulte et gère tes campagnes publicitaires.
          </p>
        </div>

        <Link
          href="/advertiser/campaigns/new"
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-sky-700 px-5 py-3 text-sm font-semibold shadow-sm transition hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:ring-offset-2 sm:w-auto"
          style={{ color: "#fff" }}
        >
          <span aria-hidden="true" className="text-lg leading-none">
            +
          </span>
          Nouvelle campagne
        </Link>
      </header>

      {deleteError && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {deleteError}
        </div>
      )}

      {loading ? (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
          <span className="sr-only" role="status">
            Chargement des campagnes…
          </span>
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-14 animate-pulse rounded-xl bg-slate-100"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center sm:py-14">
          <h2 className="text-lg font-semibold text-slate-900">
            Les campagnes ne sont pas disponibles.
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            {error}
          </p>
          <button
            type="button"
            onClick={() => setRetry((value) => value + 1)}
            className="mt-5 inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:ring-offset-2"
          >
            Réessayer
          </button>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center shadow-sm sm:px-12 sm:py-14">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="h-7 w-7"
            >
              <path
                d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-13Z"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <path
                d="M8 12h8m-4-4v8"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            Ta première campagne commence ici
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Crée une campagne pour promouvoir ton activité et suivre sa
            diffusion depuis cet espace.
          </p>

          <Link
            href="/advertiser/campaigns/new"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-sky-700 px-5 py-3 text-sm font-semibold transition hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:ring-offset-2"
            style={{ color: "#fff" }}
          >
            Créer ma première campagne
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {campaigns.map((campaign) => (
              <article
                key={campaign.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col gap-3">
                  <h2 className="break-words font-semibold text-slate-900">
                    {campaign.name}
                  </h2>
                  <div>
                    <CampaignStatus status={campaign.status} />
                  </div>
                </div>

                {campaign.status === "CANCELLED" &&
                  campaign.rejectionReason && (
                    <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-700">
                      <span className="font-semibold">Motif :</span>{" "}
                      {campaign.rejectionReason}
                    </p>
                  )}

                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                  <div>
                    <p className="text-xs text-slate-400">Période</p>
                    <p className="mt-1 text-sm font-medium text-slate-700">
                      {formatDate(campaign.startDate)}
                    </p>
                    <p className="text-sm font-medium text-slate-700">
                      au {formatDate(campaign.endDate)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">Prix estimé</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {formatPrice(campaign.estimatedPrice)}
                    </p>
                  </div>
                </div>

                {campaign.status === "DRAFT" && (
                  <div className="mt-4 border-t border-slate-100 pt-3 text-right">
                    <button
                      type="button"
                      onClick={() => deleteCampaign(campaign.id)}
                      disabled={deletingId === campaign.id}
                      className="min-h-10 rounded-lg px-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingId === campaign.id
                        ? "Suppression…"
                        : "Supprimer"}
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 font-semibold text-slate-500">
                    Campagne
                  </th>
                  <th className="px-6 py-3 font-semibold text-slate-500">
                    Statut
                  </th>
                  <th className="px-6 py-3 font-semibold text-slate-500">
                    Période
                  </th>
                  <th className="px-6 py-3 font-semibold text-slate-500">
                    Prix estimé
                  </th>
                  <th className="px-6 py-3 text-right font-semibold text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {campaigns.map((campaign) => (
                  <tr
                    key={campaign.id}
                    className="transition hover:bg-slate-50/80"
                  >
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {campaign.name}
                    </td>

                    <td className="px-6 py-4">
                      <CampaignStatus status={campaign.status} />
                      {campaign.status === "CANCELLED" &&
                        campaign.rejectionReason && (
                          <p className="mt-2 max-w-xs text-xs leading-5 text-slate-500">
                            Motif : {campaign.rejectionReason}
                          </p>
                        )}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                      {formatDate(campaign.startDate)}
                      <span className="mx-2 text-slate-300">→</span>
                      {formatDate(campaign.endDate)}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-700">
                      {formatPrice(campaign.estimatedPrice)}
                    </td>

                    <td className="px-6 py-4 text-right">
                      {campaign.status === "DRAFT" && (
                        <button
                          type="button"
                          onClick={() => deleteCampaign(campaign.id)}
                          disabled={deletingId === campaign.id}
                          className="min-h-9 rounded-lg px-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId === campaign.id
                            ? "Suppression…"
                            : "Supprimer"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}