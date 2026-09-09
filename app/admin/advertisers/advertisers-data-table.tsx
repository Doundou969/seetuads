"use client";

import { useMemo, useState } from "react";
import {
CheckCircle2,
Clock3,
Copy,
ExternalLink,
FileDown,
Link2,
MoreHorizontal,
Search,
ShieldCheck,
ShieldOff,
Users,
XCircle,
} from "lucide-react";
import { updateAdvertiserStatus } from "@/lib/actions";

interface AccessToken {
expiresAt: string;
revokedAt: string | null;
lastUsedAt: string | null;
}

interface Advertiser {
id: string;
companyName: string;
contactName: string | null;
email: string;
phone: string | null;
city: string;
status: string;
campaignsCount: number;
mediaCount: number;
accessToken: AccessToken | null;
}

interface Props {
advertisers: Advertiser[];
}

type FilterStatus = "ALL" | "ACTIVE" | "PENDING" | "SUSPENDED";

export function AdvertisersDataTable({
advertisers,
}: Props) {
const [items, setItems] = useState(advertisers);
const [loadingId, setLoadingId] = useState<string | null>(null);
type HoursMap = { [key: string]: number };
  const [hours, setHours] = useState<HoursMap>({});
  type GeneratedLinksMap = { [key: string]: string };
  const [generatedLinks, setGeneratedLinks] = useState<GeneratedLinksMap>({});
({});
const [message, setMessage] = useState("");
const [search, setSearch] = useState("");
const [statusFilter, setStatusFilter] =
useState<FilterStatus>("ALL");

const filteredItems = useMemo(() => {
const query = search.trim().toLowerCase();

return items.filter((advertiser) => {
  const matchesSearch =
    !query ||
    advertiser.companyName
      .toLowerCase()
      .includes(query) ||
    advertiser.email
      .toLowerCase()
      .includes(query) ||
    advertiser.city
      .toLowerCase()
      .includes(query) ||
    advertiser.contactName
      ?.toLowerCase()
      .includes(query);

  const matchesStatus =
    statusFilter === "ALL" ||
    advertiser.status === statusFilter;

  return matchesSearch && matchesStatus;
});

}, [items, search, statusFilter]);

const stats = useMemo(() => {
return {
total: items.length,
active: items.filter(
(item) => item.status === "ACTIVE"
).length,
pending: items.filter(
(item) => item.status === "PENDING"
).length,
suspended: items.filter(
(item) => item.status === "SUSPENDED"
).length,
};
}, [items]);

const changeStatus = async (
id: string,
status: "ACTIVE" | "SUSPENDED"
) => {
const advertiser = items.find(
(item) => item.id === id
);

if (!advertiser) return;

if (status === "SUSPENDED") {
  const confirmed = window.confirm(
    `Suspendre l'annonceur "${advertiser.companyName}" ?`
  );

  if (!confirmed) return;
}

setLoadingId(id);
setMessage("");

try {
  await updateAdvertiserStatus(id, status);

  setItems((current) =>
    current.map((item) =>
      item.id === id
        ? {
            ...item,
            status,
          }
        : item
    )
  );

  setMessage(
    status === "ACTIVE"
      ? "Annonceur activé avec succès."
      : "Annonceur suspendu avec succès."
  );
} catch (error) {
  setMessage(
    error instanceof Error
      ? error.message
      : "Impossible de modifier le statut."
  );
} finally {
  setLoadingId(null);
}

};

const generateLink = async (id: string) => {
setLoadingId(id);
setMessage("");

try {
  const response = await fetch(
    `/api/admin/advertisers/${id}/access-link`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        hours: hours[id] || 24,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(
      data.error || "Impossible de générer le lien."
    );
  }

  setGeneratedLinks((current) => ({
    ...current,
    [id]: data.url,
  }));

  setItems((current) =>
    current.map((advertiser) =>
      advertiser.id === id
        ? {
            ...advertiser,
            accessToken: {
              expiresAt: data.expiresAt,
              revokedAt: null,
              lastUsedAt: null,
            },
          }
        : advertiser
    )
  );

  setMessage("Lien généré avec succès.");
} catch (error) {
  setMessage(
    error instanceof Error
      ? error.message
      : "Erreur inconnue."
  );
} finally {
  setLoadingId(null);
}

};

const revokeLink = async (id: string) => {
const confirmed = window.confirm(
"Révoquer tous les liens actifs de cet annonceur ?"
);

if (!confirmed) return;

setLoadingId(id);
setMessage("");

try {
  const response = await fetch(
    `/api/admin/advertisers/${id}/access-link/revoke`,
    {
      method: "POST",
    }
  );

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(
      data.error || "Impossible de révoquer le lien."
    );
  }

  setItems((current) =>
    current.map((advertiser) =>
      advertiser.id === id && advertiser.accessToken
        ? {
            ...advertiser,
            accessToken: {
              ...advertiser.accessToken,
              revokedAt: new Date().toISOString(),
            },
          }
        : advertiser
    )
  );

  setGeneratedLinks((current) => {
    const copy = { ...current };
    delete copy[id];
    return copy;
  });

  setMessage(
    `${data.revokedCount} lien(s) révoqué(s).`
  );
} catch (error) {
  setMessage(
    error instanceof Error
      ? error.message
      : "Erreur inconnue."
  );
} finally {
  setLoadingId(null);
}

};

const copyLink = async (link: string) => {
try {
await navigator.clipboard.writeText(link);
setMessage("Lien copié dans le presse-papiers.");
} catch {
setMessage("Impossible de copier le lien.");
}
};

const getTokenStatus = (
token: AccessToken | null
) => {
if (!token) {
return {
label: "Aucun accès",
icon: Link2,
className:
"border-slate-200 bg-slate-50 text-slate-600",
};
}

if (token.revokedAt) {
  return {
    label: "Révoqué",
    icon: ShieldOff,
    className:
      "border-red-200 bg-red-50 text-red-700",
  };
}

if (new Date(token.expiresAt) <= new Date()) {
  return {
    label: "Expiré",
    icon: Clock3,
    className:
      "border-amber-200 bg-amber-50 text-amber-700",
  };
}

return {
  label: "Actif",
  icon: ShieldCheck,
  className:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
};

};

const getAdvertiserStatus = (status: string) => {
switch (status) {
case "ACTIVE":
return {
label: "Actif",
icon: CheckCircle2,
className:
"border-emerald-200 bg-emerald-50 text-emerald-700",
};

  case "SUSPENDED":
    return {
      label: "Suspendu",
      icon: XCircle,
      className:
        "border-red-200 bg-red-50 text-red-700",
    };

  case "PENDING":
    return {
      label: "En attente",
      icon: Clock3,
      className:
        "border-amber-200 bg-amber-50 text-amber-700",
    };

  default:
    return {
      label: status,
      icon: Clock3,
      className:
        "border-slate-200 bg-slate-50 text-slate-600",
    };
}

};

return (
<div className="space-y-5">
{message && (
<div className="flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
<span>{message}</span>

      <button
        type="button"
        onClick={() => setMessage("")}
        className="ml-4 text-blue-500 hover:text-blue-700"
        aria-label="Fermer"
      >
        ×
      </button>
    </div>
  )}

  {/* Statistics */}
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
    <button
      type="button"
      onClick={() => setStatusFilter("ALL")}
      className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:border-slate-300 ${
        statusFilter === "ALL"
          ? "border-blue-300 ring-2 ring-blue-100"
          : "border-slate-200"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Total
        </span>
        <Users className="h-4 w-4 text-slate-400" />
      </div>

      <div className="mt-2 text-2xl font-bold text-slate-900">
        {stats.total}
      </div>
    </button>

    <button
      type="button"
      onClick={() => setStatusFilter("ACTIVE")}
      className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:border-emerald-300 ${
        statusFilter === "ACTIVE"
          ? "border-emerald-300 ring-2 ring-emerald-100"
          : "border-slate-200"
      }`}
    >
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Actifs
      </span>

      <div className="mt-2 text-2xl font-bold text-emerald-600">
        {stats.active}
      </div>
    </button>

    <button
      type="button"
      onClick={() => setStatusFilter("PENDING")}
      className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:border-amber-300 ${
        statusFilter === "PENDING"
          ? "border-amber-300 ring-2 ring-amber-100"
          : "border-slate-200"
      }`}
    >
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        En attente
      </span>

      <div className="mt-2 text-2xl font-bold text-amber-600">
        {stats.pending}
      </div>
    </button>

    <button
      type="button"
      onClick={() => setStatusFilter("SUSPENDED")}
      className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:border-red-300 ${
        statusFilter === "SUSPENDED"
          ? "border-red-300 ring-2 ring-red-100"
          : "border-slate-200"
      }`}
    >
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Suspendus
      </span>

      <div className="mt-2 text-2xl font-bold text-red-600">
        {stats.suspended}
      </div>
    </button>
  </div>

  {/* Filters */}
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

        <input
          type="search"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Rechercher une entreprise, un contact, une ville..."
          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
        />
      </div>

      <select
        value={statusFilter}
        onChange={(event) =>
          setStatusFilter(
            event.target.value as FilterStatus
          )
        }
        className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
      >
        <option value="ALL">Tous les statuts</option>
        <option value="ACTIVE">Actifs</option>
        <option value="PENDING">En attente</option>
        <option value="SUSPENDED">Suspendus</option>
      </select>
    </div>

    <div className="mt-3 text-xs text-slate-500">
      {filteredItems.length} annonceur
      {filteredItems.length !== 1 ? "s" : ""} affiché
      {filteredItems.length !== 1 ? "s" : ""}
    </div>
  </div>

  {/* Table */}
  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1100px] text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80">
            <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Annonceur
            </th>

            <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Contact
            </th>

            <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Statut
            </th>

            <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Activité
            </th>

            <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Accès
            </th>

            <th className="px-5 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {filteredItems.map((advertiser) => {
            const tokenStatus = getTokenStatus(
              advertiser.accessToken
            );

            const advertiserStatus =
              getAdvertiserStatus(
                advertiser.status
              );

            const TokenIcon = tokenStatus.icon;
            const StatusIcon = advertiserStatus.icon;

            const generatedLink =
              generatedLinks[advertiser.id];

            const isLoading =
              loadingId === advertiser.id;

            return (
              <tr
                key={advertiser.id}
                className="group align-top transition-colors hover:bg-slate-50/70"
              >
                {/* Advertiser */}
                <td className="px-5 py-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-sm">
                      {advertiser.companyName
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900">
                        {advertiser.companyName}
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        {advertiser.city}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Contact */}
                <td className="px-5 py-5">
                  <div className="font-medium text-slate-800">
                    {advertiser.contactName || "—"}
                  </div>

                  <div className="mt-1 text-xs text-slate-500">
                    {advertiser.email}
                  </div>

                  {advertiser.phone && (
                    <div className="mt-1 text-xs text-slate-500">
                      {advertiser.phone}
                    </div>
                  )}
                </td>

                {/* Status */}
                <td className="px-5 py-5">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${advertiserStatus.className}`}
                  >
                    <StatusIcon className="h-3.5 w-3.5" />
                    {advertiserStatus.label}
                  </span>
                </td>

                {/* Activity */}
                <td className="px-5 py-5">
                  <div className="flex gap-5">
                    <div>
                      <div className="font-semibold text-slate-900">
                        {advertiser.campaignsCount}
                      </div>

                      <div className="mt-0.5 text-[11px] text-slate-500">
                        campagnes
                      </div>
                    </div>

                    <div>
                      <div className="font-semibold text-slate-900">
                        {advertiser.mediaCount}
                      </div>

                      <div className="mt-0.5 text-[11px] text-slate-500">
                        médias
                      </div>
                    </div>
                  </div>
                </td>

                {/* Access */}
                <td className="px-5 py-5">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${tokenStatus.className}`}
                  >
                    <TokenIcon className="h-3.5 w-3.5" />
                    {tokenStatus.label}
                  </span>

                  {advertiser.accessToken &&
                    !advertiser.accessToken.revokedAt && (
                      <div className="mt-2 text-[11px] leading-4 text-slate-500">
                        Expire le{" "}
                        {new Date(
                          advertiser.accessToken.expiresAt
                        ).toLocaleString("fr-FR")}
                      </div>
                    )}
                </td>

                {/* Actions */}
                <td className="min-w-[480px] px-5 py-5">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <a
                      href={`/api/admin/advertisers/${advertiser.id}/report`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      <FileDown className="h-3.5 w-3.5" />
                      PDF
                    </a>

                    {advertiser.status === "PENDING" && (
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() =>
                          changeStatus(
                            advertiser.id,
                            "ACTIVE"
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {isLoading ? "..." : "Activer"}
                      </button>
                    )}

                    {advertiser.status === "ACTIVE" && (
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() =>
                          changeStatus(
                            advertiser.id,
                            "SUSPENDED"
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        {isLoading
                          ? "..."
                          : "Suspendre"}
                      </button>
                    )}

                    {advertiser.status === "SUSPENDED" && (
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() =>
                          changeStatus(
                            advertiser.id,
                            "ACTIVE"
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {isLoading
                          ? "..."
                          : "Réactiver"}
                      </button>
                    )}

                    <select
                      value={
                        hours[advertiser.id] || 24
                      }
                      onChange={(event) =>
                        setHours((current) => ({
                          ...current,
                          [advertiser.id]: Number(
                            event.target.value
                          ),
                        }))
                      }
                      className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value={24}>
                        24 h
                      </option>
                      <option value={48}>
                        48 h
                      </option>
                      <option value={72}>
                        72 h
                      </option>
                      <option value={168}>
                        7 jours
                      </option>
                    </select>

                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() =>
                        generateLink(
                          advertiser.id
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Link2 className="h-3.5 w-3.5" />
                      {isLoading
                        ? "..."
                        : "Générer"}
                    </button>

                    {advertiser.accessToken &&
                      !advertiser.accessToken.revokedAt && (
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() =>
                            revokeLink(
                              advertiser.id
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          <ShieldOff className="h-3.5 w-3.5" />
                          Révoquer
                        </button>
                      )}

                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                      aria-label="Plus d'actions"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>

                  {generatedLink && (
                    <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-blue-900">
                        <ShieldCheck className="h-4 w-4" />
                        Lien d'accès généré
                      </div>

                      <div className="mt-2 break-all rounded-lg border border-blue-100 bg-white px-3 py-2 font-mono text-[11px] text-slate-600">
                        {generatedLink}
                      </div>

                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            copyLink(generatedLink)
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Copier
                        </button>

                        <a
                          href={generatedLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Ouvrir
                        </a>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}

          {filteredItems.length === 0 && (
            <tr>
              <td
                colSpan={6}
                className="px-5 py-16 text-center"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                  <Search className="h-5 w-5 text-slate-400" />
                </div>

                <div className="mt-4 font-semibold text-slate-900">
                  Aucun résultat
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  Aucun annonceur ne correspond à
                  votre recherche.
                </p>

                {(search ||
                  statusFilter !== "ALL") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setStatusFilter("ALL");
                    }}
                    className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Réinitialiser les filtres
                  </button>
                )}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>

    <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-3 text-xs text-slate-500">
      Affichage de{" "}
      <span className="font-semibold text-slate-700">
        {filteredItems.length}
      </span>{" "}
      sur{" "}
      <span className="font-semibold text-slate-700">
        {items.length}
      </span>{" "}
      annonceur
      {items.length !== 1 ? "s" : ""}.
    </div>
  </div>
</div>

);
}
