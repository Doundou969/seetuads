"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewAdvertiserPage() {
  const router = useRouter();

  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("PENDING");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{
    companyName: string;
    url: string;
    expiresAt: string;
  } | null>(null);

  const submit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setLoading(true);
    setError("");
    setSuccess(null);

    try {
      const response = await fetch(
        "/api/admin/advertisers",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            companyName,
            contactName,
            email,
            phone,
            status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Impossible de créer l'annonceur."
        );
      }

      setSuccess({
        companyName: data.advertiser.companyName,
        url: data.url,
        expiresAt: data.expiresAt,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur inconnue."
      );
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (!success) return;

    await navigator.clipboard.writeText(
      success.url
    );
  };

  if (success) {
    return (
      <div className="max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Annonceur créé
          </h1>

          <p className="mt-1 text-gray-600">
            Le compte annonceur et son accès temporaire
            ont été créés.
          </p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="font-semibold text-green-800">
              {success.companyName}
            </p>

            <p className="mt-1 text-sm text-green-700">
              Lien temporaire valide pendant 24 heures.
            </p>
          </div>

          <div className="mt-6">
            <label className="text-sm font-medium text-gray-700">
              Lien d'accès
            </label>

            <div className="mt-2 rounded-lg border bg-gray-50 p-4">
              <div className="break-all text-sm text-gray-700">
                {success.url}
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={copyLink}
                  className="rounded-lg border bg-white px-4 py-2 text-sm font-medium hover:bg-gray-100"
                >
                  Copier le lien
                </button>

                <a
                  href={success.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Ouvrir
                </a>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Link
              href="/admin/advertisers"
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Retour aux annonceurs
            </Link>

            <button
              type="button"
              onClick={() => {
                setSuccess(null);
                setCompanyName("");
                setContactName("");
                setEmail("");
                setPhone("");
                setStatus("PENDING");
              }}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Créer un autre annonceur
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link
          href="/admin/advertisers"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Retour aux annonceurs
        </Link>

        <h1 className="mt-3 text-2xl font-bold text-gray-900">
          Nouvel annonceur
        </h1>

        <p className="mt-1 text-gray-600">
          Créer un annonceur et générer automatiquement
          son lien d'accès temporaire.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={submit}
        className="space-y-6 rounded-xl border bg-white p-6 shadow-sm"
      >
        <div>
          <label className="text-sm font-medium text-gray-700">
            Entreprise *
          </label>

          <input
            required
            value={companyName}
            onChange={(event) =>
              setCompanyName(event.target.value)
            }
            placeholder="Ex. Wave Sénégal"
            className="mt-2 w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">
            Nom du contact
          </label>

          <input
            value={contactName}
            onChange={(event) =>
              setContactName(event.target.value)
            }
            placeholder="Ex. Mamadou Ndiaye"
            className="mt-2 w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Email *
            </label>

            <input
              required
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="contact@entreprise.com"
              className="mt-2 w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Téléphone
            </label>

            <input
              value={phone}
              onChange={(event) =>
                setPhone(event.target.value)
              }
              placeholder="+221 77 000 00 00"
              className="mt-2 w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">
            Statut
          </label>

          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
            className="mt-2 w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
          >
            <option value="PENDING">
              En attente
            </option>

            <option value="ACTIVE">
              Actif
            </option>

            <option value="SUSPENDED">
              Suspendu
            </option>
          </select>
        </div>

        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
          <strong>Accès automatique :</strong>{" "}
          après création, SeetuAds générera un lien
          temporaire valable 24 heures.
        </div>

        <div className="flex justify-end gap-3">
          <Link
            href="/admin/advertisers"
            className="rounded-lg border px-5 py-3 text-sm font-medium hover:bg-gray-50"
          >
            Annuler
          </Link>

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading
              ? "Création..."
              : "Créer l'annonceur"}
          </button>
        </div>
      </form>
    </div>
  );
}
