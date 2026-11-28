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
    classes: "bg-blue-50 text-blue-700 ring-blue-600/20",
    dot: "bg-blue-500",
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

export default function AdvertiserDashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, draft: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

        if (cancelled) {
          return;
        }

        const campaignData = data as Campaign[];

        setCampaigns(campaignData.slice(0, 5));
        setStats({
          total: campaignData.length,
          active: campaignData.filter((campaign) => campaign.status === "ACTIVE")
            .length,
          draft: campaignData.filter((campaign) => campaign.status === "DRAFT")
            .length,
        });
      } catch {
        if (!cancelled) {
          setError(
            "Impossible de charger les campagnes. Vérifie ta connexion puis réessaie.",
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

  const statCards = [
    {
      label: "Campagnes totales",
      value: stats.total,
      caption: "Toutes tes campagnes",
      accent: "border-t-sky-500",
      valueColor: "text-slate-900",
    },
    {
      label: "Campagnes actives",
      value: stats.active,
      caption: "En cours de diffusion",
      accent: "border-t-emerald-500",
      valueColor: "text-emerald-700",
    },
    {
      label: "Brouillons",
      value: stats.draft,
      caption: "À finaliser",
      accent: "border-t-orange-400",
      valueColor: "text-orange-600",
    },
  ];

  return (
    <div className="space-y-7 pb-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-sky-700">
            Espace annonceur
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Tableau de bord
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
            Suis tes campagnes et prépare ta prochaine diffusion.
          </p>
        </div>

        <Link
          href="/advertiser/campaigns/new"
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:ring-offset-2 sm:w-auto"
          style={{ color: "#fff" }}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            className="h-5 w-5"
          >
            <path
              d="M10 4v12M4 10h12"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
          Créer une campagne
        </Link>
      </header>

      <section
        aria-label="Résumé des campagnes"
        aria-busy={loading}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`rounded-2xl border border-slate-200 border-t-4 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-6 ${card.accent}`}
          >
            <p className="text-sm font-medium text-slate-500">{card.label}</p>
            {loading ? (
              <div className="mt-3 h-9 w-16 animate-pulse rounded-lg bg-slate-100" />
            ) : (
              <p
                className={`mt-2 text-3xl font-bold tracking-tight ${card.valueColor}`}
              >
                {card.value}
              </p>
            )}
            <p className="mt-2 text-xs text-slate-400">{card.caption}</p>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Dernières campagnes
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Retrouve rapidement l’état de tes campagnes récentes.
            </p>
          </div>

          <Link
            href="/advertiser/campaigns"
            className="inline-flex min-h-10 items-center text-sm font-semibold text-sky-700 transition hover:text-sky-900"
          >
            Voir toutes les campagnes
            <span aria-hidden="true" className="ml-1">
              →
            </span>
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3 p-5 sm:p-6" role="status">
            <span className="sr-only">Chargement des campagnes…</span>
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-14 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center sm:p-12">
            <p className="font-semibold text-slate-800">
              Les campagnes ne sont pas disponibles.
            </p>
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
          <div className="px-6 py-10 text-center sm:px-12 sm:py-14">
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
            <h3 className="mt-4 text-base font-semibold text-slate-900">
              Ta première campagne commence ici
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
              Crée une campagne pour commencer à promouvoir ton activité.
            </p>
            <Link
              href="/advertiser/campaigns/new"
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:ring-offset-2"
              style={{ color: "#fff" }}
            >
              Créer ma première campagne
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3 p-4 md:hidden">
              {campaigns.map((campaign) => (
                <article
                  key={campaign.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="min-w-0 break-words font-semibold text-slate-900">
                      {campaign.name}
                    </h3>
                    <CampaignStatus status={campaign.status} />
                  </div>

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
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[720px] text-left text-sm">
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
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                        {formatDate(campaign.startDate)}
                        <span className="mx-2 text-slate-300">→</span>
                        {formatDate(campaign.endDate)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-700">
                        {formatPrice(campaign.estimatedPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}