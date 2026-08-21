"use client";

import { useState } from "react";

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

export function AdvertisersDataTable({
  advertisers,
}: Props) {
  const [items, setItems] = useState(advertisers);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [hours, setHours] = useState<Record<string, number>>({});
  const [generatedLinks, setGeneratedLinks] = useState<
    Record<string, string>
  >({});
  const [message, setMessage] = useState("");

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
    await navigator.clipboard.writeText(link);
    setMessage("Lien copié dans le presse-papiers.");
  };

  const getTokenStatus = (
    token: AccessToken | null
  ) => {
    if (!token) {
      return {
        label: "Aucun lien",
        className:
          "bg-gray-100 text-gray-700",
      };
    }

    if (token.revokedAt) {
      return {
        label: "Révoqué",
        className:
          "bg-red-100 text-red-700",
      };
    }

    if (
      new Date(token.expiresAt) <= new Date()
    ) {
      return {
        label: "Expiré",
        className:
          "bg-orange-100 text-orange-700",
      };
    }

    return {
      label: "Actif",
      className:
        "bg-green-100 text-green-700",
    };
  };

  return (
    <div className="space-y-4">
      {message && (
        <div className="rounded-lg border bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {message}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left font-medium text-gray-500">
                  Entreprise
                </th>

                <th className="px-5 py-3 text-left font-medium text-gray-500">
                  Contact
                </th>

                <th className="px-5 py-3 text-left font-medium text-gray-500">
                  Campagnes
                </th>

                <th className="px-5 py-3 text-left font-medium text-gray-500">
                  Accès
                </th>

                <th className="px-5 py-3 text-left font-medium text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {items.map((advertiser) => {
                const tokenStatus =
                  getTokenStatus(
                    advertiser.accessToken
                  );

                const generatedLink =
                  generatedLinks[advertiser.id];

                return (
                  <tr
                    key={advertiser.id}
                    className="align-top hover:bg-gray-50"
                  >
                    <td className="px-5 py-5">
                      <div className="font-semibold text-gray-900">
                        {advertiser.companyName}
                      </div>

                      <div className="mt-1 text-xs text-gray-500">
                        {advertiser.city}
                      </div>
                    </td>

                    <td className="px-5 py-5">
                      <div className="text-gray-900">
                        {advertiser.contactName ||
                          "—"}
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

                    <td className="px-5 py-5">
                      <div className="font-medium">
                        {advertiser.campaignsCount}
                      </div>

                      <div className="text-xs text-gray-500">
                        {advertiser.mediaCount} média(s)
                      </div>
                    </td>

                    <td className="px-5 py-5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tokenStatus.className}`}
                      >
                        {tokenStatus.label}
                      </span>

                      {advertiser.accessToken &&
                        !advertiser.accessToken.revokedAt && (
                          <div className="mt-2 text-xs text-gray-500">
                            Expire le{" "}
                            {new Date(
                              advertiser.accessToken.expiresAt
                            ).toLocaleString("fr-FR")}
                          </div>
                        )}
                    </td>

                    <td className="min-w-[360px] px-5 py-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={
                            hours[advertiser.id] ||
                            24
                          }
                          onChange={(event) =>
                            setHours((current) => ({
                              ...current,
                              [advertiser.id]:
                                Number(
                                  event.target.value
                                ),
                            }))
                          }
                          className="rounded-lg border px-3 py-2 text-sm"
                        >
                          <option value={24}>
                            24 heures
                          </option>

                          <option value={48}>
                            48 heures
                          </option>

                          <option value={72}>
                            72 heures
                          </option>

                          <option value={168}>
                            7 jours
                          </option>
                        </select>

                        <button
                          type="button"
                          disabled={
                            loadingId === advertiser.id
                          }
                          onClick={() =>
                            generateLink(
                              advertiser.id
                            )
                          }
                          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {loadingId ===
                          advertiser.id
                            ? "..."
                            : "Générer"}
                        </button>

                        {advertiser.accessToken &&
                          !advertiser.accessToken
                            .revokedAt && (
                            <button
                              type="button"
                              disabled={
                                loadingId ===
                                advertiser.id
                              }
                              onClick={() =>
                                revokeLink(
                                  advertiser.id
                                )
                              }
                              className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                            >
                              Révoquer
                            </button>
                          )}
                      </div>

                      {generatedLink && (
                        <div className="mt-3 rounded-lg border bg-gray-50 p-3">
                          <div className="break-all text-xs text-gray-600">
                            {generatedLink}
                          </div>

                          <div className="mt-2 flex gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                copyLink(
                                  generatedLink
                                )
                              }
                              className="rounded-lg border bg-white px-3 py-2 text-xs font-medium hover:bg-gray-100"
                            >
                              Copier
                            </button>

                            <a
                              href={generatedLink}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white hover:bg-gray-800"
                            >
                              Ouvrir
                            </a>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-gray-500"
                  >
                    Aucun annonceur enregistré.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
