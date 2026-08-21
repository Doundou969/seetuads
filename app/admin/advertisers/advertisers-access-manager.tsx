"use client";

import { useState } from "react";

interface AccessToken {
  id: string;
  expiresAt: string;
  createdAt: string;
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
  accessTokens: AccessToken[];
}

interface Props {
  advertisers: Advertiser[];
}

export function AdvertisersAccessManager({
  advertisers,
}: Props) {
  const [hours, setHours] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [generatedLinks, setGeneratedLinks] = useState<
    Record<string, string>
  >({});
  const [messages, setMessages] = useState<
    Record<string, string>
  >({});

  async function generateAccess(advertiserId: string) {
    setLoading(advertiserId);

    setMessages((previous) => ({
      ...previous,
      [advertiserId]: "",
    }));

    try {
      const response = await fetch(
        "/api/admin/advertisers/access",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            advertiserId,
            hours: hours[advertiserId] ?? 24,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Impossible de générer le lien."
        );
      }

      setGeneratedLinks((previous) => ({
        ...previous,
        [advertiserId]: data.url,
      }));

      setMessages((previous) => ({
        ...previous,
        [advertiserId]: `Lien généré — valable ${data.expiresInHours} h.`,
      }));
    } catch (error) {
      setMessages((previous) => ({
        ...previous,
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
    const url = generatedLinks[advertiserId];

    if (!url) return;

    await navigator.clipboard.writeText(url);

    setMessages((previous) => ({
      ...previous,
      [advertiserId]: "Lien copié dans le presse-papiers.",
    }));
  }

  return (
    <div className="space-y-6">
      {advertisers.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center">
          <p className="text-gray-500">
            Aucun annonceur enregistré.
          </p>
        </div>
      ) : (
        advertisers.map((advertiser) => {
          const currentLink = generatedLinks[advertiser.id];

          return (
            <div
              key={advertiser.id}
              className="rounded-2xl border bg-white shadow-sm"
            >
              <div className="border-b p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {advertiser.companyName}
                    </h2>

                    <div className="mt-2 space-y-1 text-sm text-gray-500">
                      <p>
                        Contact :{" "}
                        {advertiser.contactName || "Non renseigné"}
                      </p>

                      <p>
                        Email : {advertiser.email}
                      </p>

                      <p>
                        Téléphone :{" "}
                        {advertiser.phone || "Non renseigné"}
                      </p>

                      <p>
                        Ville : {advertiser.city}
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    {advertiser.status}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <h3 className="font-semibold text-gray-900">
                  Accès temporaire
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Générer un lien permettant à cet annonceur
                  d'accéder à son espace sans compte Clerk.
                </p>

                <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Durée
                    </label>

                    <select
                      value={hours[advertiser.id] ?? 24}
                      onChange={(event) =>
                        setHours((previous) => ({
                          ...previous,
                          [advertiser.id]: Number(
                            event.target.value
                          ),
                        }))
                      }
                      className="mt-1 rounded-lg border px-3 py-2 text-sm"
                    >
                      <option value={24}>24 heures</option>
                      <option value={48}>48 heures</option>
                      <option value={72}>72 heures</option>
                      <option value={168}>7 jours</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    disabled={loading === advertiser.id}
                    onClick={() =>
                      generateAccess(advertiser.id)
                    }
                    className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading === advertiser.id
                      ? "Génération..."
                      : "Générer un lien d'accès"}
                  </button>
                </div>

                {currentLink && (
                  <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
                    <p className="text-sm font-semibold text-blue-900">
                      Nouveau lien d'accès
                    </p>

                    <div className="mt-3 flex flex-col gap-3 md:flex-row">
                      <input
                        readOnly
                        value={currentLink}
                        className="min-w-0 flex-1 rounded-lg border bg-white px-3 py-2 text-sm"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          copyLink(advertiser.id)
                        }
                        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                      >
                        Copier
                      </button>

                      <a
                        href={currentLink}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border bg-white px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Ouvrir
                      </a>
                    </div>

                    <p className="mt-3 text-xs text-blue-700">
                      Ce lien donne un accès temporaire à
                      l'espace annonceur.
                    </p>
                  </div>
                )}

                {messages[advertiser.id] && (
                  <p className="mt-4 text-sm text-green-600">
                    {messages[advertiser.id]}
                  </p>
                )}

                <div className="mt-6 border-t pt-5">
                  <h4 className="text-sm font-semibold text-gray-700">
                    Derniers accès
                  </h4>

                  {advertiser.accessTokens.length === 0 ? (
                    <p className="mt-2 text-sm text-gray-400">
                      Aucun lien généré.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {advertiser.accessTokens.map((token) => (
                        <div
                          key={token.id}
                          className="flex flex-col gap-1 rounded-lg bg-gray-50 p-3 text-xs text-gray-500 md:flex-row md:items-center md:justify-between"
                        >
                          <span>
                            Créé le{" "}
                            {new Date(
                              token.createdAt
                            ).toLocaleString("fr-FR")}
                          </span>

                          <span>
                            Expire le{" "}
                            {new Date(
                              token.expiresAt
                            ).toLocaleString("fr-FR")}
                          </span>

                          <span
                            className={
                              token.revokedAt
                                ? "font-medium text-red-600"
                                : new Date(
                                      token.expiresAt
                                    ) <= new Date()
                                  ? "font-medium text-gray-400"
                                  : "font-medium text-green-600"
                            }
                          >
                            {token.revokedAt
                              ? "Révoqué"
                              : new Date(
                                    token.expiresAt
                                  ) <= new Date()
                                ? "Expiré"
                                : "Actif"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
