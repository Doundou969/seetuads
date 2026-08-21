"use client";

import { useState } from "react";

interface AccessToken {
  id: string;
  createdAt: string;
  expiresAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

interface Advertiser {
  id: string;
  companyName: string;
  contactName: string | null;
  email: string;
  phone: string | null;
  city: string;
  status: string;
  createdAt: string;
  campaignsCount: number;
  mediaCount: number;
  accessToken: AccessToken | null;
}

interface Props {
  advertisers: Advertiser[];
}

export function AdvertisersTable({ advertisers }: Props) {
  const [hours, setHours] = useState(24);
  const [loading, setLoading] = useState<string | null>(null);
  const [links, setLinks] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});

  async function generateLink(advertiserId: string) {
    setLoading(advertiserId);

    setMessages((current) => ({
      ...current,
      [advertiserId]: "",
    }));

    try {
      const response = await fetch(
        `/api/admin/advertisers/${advertiserId}/access-link`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ hours }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Impossible de générer le lien."
        );
      }

      setLinks((current) => ({
        ...current,
        [advertiserId]: data.url,
      }));

      setMessages((current) => ({
        ...current,
        [advertiserId]:
          `Lien généré. Valable ${data.expiresInHours} heure(s).`,
      }));
    } catch (error) {
      setMessages((current) => ({
        ...current,
        [advertiserId]:
          error instanceof Error
            ? error.message
            : "Erreur inconnue.",
      }));
    } finally {
      setLoading(null);
    }
  }

  async function copyLink(advertiserId: string) {
    const link = links[advertiserId];

    if (!link) {
      return;
    }

    await navigator.clipboard.writeText(link);

    setMessages((current) => ({
      ...current,
      [advertiserId]: "Lien copié.",
    }));
  }

  function getStatusClass(status: string) {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-700";

      case "PENDING":
        return "bg-yellow-100 text-yellow-700";

      case "SUSPENDED":
        return "bg-red-100 text-red-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  function getTokenStatus(token: AccessToken | null) {
    if (!token) {
      return {
        label: "Aucun accès",
        className: "text-gray-400",
      };
    }

    if (token.revokedAt) {
      return {
        label: "Révoqué",
        className: "text-red-600",
      };
    }

    if (new Date(token.expiresAt) <= new Date()) {
      return {
        label: "Expiré",
        className: "text-gray-400",
      };
    }

    return {
      label: "Actif",
      className: "text-green-600",
    };
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-medium text-gray-900">
              Durée des nouveaux accès
            </p>

            <p className="text-sm text-gray-500">
              Cette durée sera utilisée lors de la génération d'un lien.
            </p>
          </div>

          <select
            value={hours}
            onChange={(event) =>
              setHours(Number(event.target.value))
            }
            className="rounded-lg border px-4 py-2 text-sm"
          >
            <option value={24}>24 heures</option>
            <option value={48}>48 heures</option>
            <option value={72}>72 heures</option>
            <option value={168}>7 jours</option>
          </select>
        </div>
      </div>

      {advertisers.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Aucun annonceur
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Aucun annonceur n'est encore enregistré dans SeetuAds.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left font-medium text-gray-500">
                    Entreprise
                  </th>

                  <th className="px-6 py-4 text-left font-medium text-gray-500">
                    Contact
                  </th>

                  <th className="px-6 py-4 text-left font-medium text-gray-500">
                    Activité
                  </th>

                  <th className="px-6 py-4 text-left font-medium text-gray-500">
                    Statut
                  </th>

                  <th className="px-6 py-4 text-left font-medium text-gray-500">
                    Accès
                  </th>

                  <th className="px-6 py-4 text-right font-medium text-gray-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {advertisers.map((advertiser) => {
                  const tokenStatus = getTokenStatus(
                    advertiser.accessToken
                  );

                  const generatedLink =
                    links[advertiser.id];

                  return (
                    <tr
                      key={advertiser.id}
                      className="align-top hover:bg-gray-50"
                    >
                      <td className="px-6 py-5">
                        <div className="font-semibold text-gray-900">
                          {advertiser.companyName}
                        </div>

                        <div className="mt-1 text-xs text-gray-500">
                          {advertiser.city}
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div className="text-gray-900">
                          {advertiser.contactName ||
                            "Non renseigné"}
                        </div>

                        <div className="mt-1 text-xs text-gray-500">
                          {advertiser.email}
                        </div>

                        {advertiser.phone && (
                          <div className="mt-1 text-xs text-gray-500">
                            {advertiser.phone}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-5">
                        <div>
                          <span className="font-medium">
                            {advertiser.campaignsCount}
                          </span>{" "}
                          campagne(s)
                        </div>

                        <div className="mt-1 text-xs text-gray-500">
                          {advertiser.mediaCount} média(s)
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                            advertiser.status
                          )}`}
                        >
                          {advertiser.status}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <div
                          className={`font-medium ${tokenStatus.className}`}
                        >
                          {tokenStatus.label}
                        </div>

                        {advertiser.accessToken && (
                          <div className="mt-1 text-xs text-gray-500">
                            Expire le{" "}
                            {new Date(
                              advertiser.accessToken.expiresAt
                            ).toLocaleString("fr-FR")}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-5 text-right">
                        <button
                          type="button"
                          disabled={
                            loading === advertiser.id
                          }
                          onClick={() =>
                            generateLink(advertiser.id)
                          }
                          className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {loading === advertiser.id
                            ? "Génération..."
                            : "Générer un lien"}
                        </button>
                      </td>

                      {generatedLink && (
                        <td
                          colSpan={6}
                          className="px-6 pb-6"
                        >
                          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                            <p className="text-sm font-semibold text-blue-900">
                              Lien d'accès généré
                            </p>

                            <div className="mt-3 flex flex-col gap-2 md:flex-row">
                              <input
                                readOnly
                                value={generatedLink}
                                className="min-w-0 flex-1 rounded-lg border bg-white px-3 py-2 text-xs"
                              />

                              <button
                                type="button"
                                onClick={() =>
                                  copyLink(advertiser.id)
                                }
                                className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-medium text-white"
                              >
                                Copier
                              </button>

                              <a
                                href={generatedLink}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-lg border bg-white px-4 py-2 text-center text-xs font-medium text-gray-700"
                              >
                                Ouvrir
                              </a>
                            </div>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {Object.keys(messages).length > 0 && (
            <div className="border-t bg-gray-50 px-6 py-3">
              {Object.entries(messages).map(
                ([advertiserId, message]) =>
                  message && (
                    <p
                      key={advertiserId}
                      className="text-sm text-green-600"
                    >
                      {message}
                    </p>
                  )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
