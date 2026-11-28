"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Screen = {
  id: string;
  screenCode: string;
  name: string | null;
  status: string;
  location: { name: string } | null;
  zone: { id: string; name: string } | null;
};

type PricingRule = {
  id: string;
  zoneId: string | null;
  screenId: string | null;
  basePrice: number;
  durationMultiplier: number;
  frequencyMultiplier: number;
  zoneMultiplier: number;
};

type Media = {
  id: string;
  name: string;
  fileType: string;
  mimeType: string;
  durationSeconds: number | null;
};

type CampaignOptions = {
  screens: Screen[];
  pricingRules: PricingRule[];
  media: Media[];
};

const SCREEN_STATUS_CONFIG: Record<
  string,
  { label: string; classes: string; dot: string }
> = {
  ONLINE: {
    label: "En ligne",
    classes: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    dot: "bg-emerald-500",
  },
  OFFLINE: {
    label: "Hors ligne",
    classes: "bg-rose-50 text-rose-700 ring-rose-600/20",
    dot: "bg-rose-500",
  },
};

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20";

function ScreenStatus({ status }: { status: string }) {
  const config = SCREEN_STATUS_CONFIG[status] ?? {
    label: "À vérifier",
    classes: "bg-slate-100 text-slate-700 ring-slate-600/10",
    dot: "bg-slate-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${config.classes}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

export default function NewCampaignPage() {
  const router = useRouter();

  const [options, setOptions] = useState<CampaignOptions | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [optionsRetry, setOptionsRetry] = useState(0);

  const [form, setForm] = useState({
    name: "",
    objective: "",
    startDate: "",
    endDate: "",
    spotDuration: 15,
    frequencyPerLoop: 1,
  });

  const [selectedScreens, setSelectedScreens] = useState<string[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadOptions() {
      try {
        setLoadingOptions(true);
        setError("");

        const res = await fetch("/api/advertiser/campaign-options");

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            data.error || "Impossible de charger les options de campagne."
          );
        }

        const data = await res.json();

        if (!cancelled) {
          setOptions(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Impossible de charger les options de campagne."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingOptions(false);
        }
      }
    }

    void loadOptions();

    return () => {
      cancelled = true;
    };
  }, [optionsRetry]);

  const numberOfDays = useMemo(() => {
    if (!form.startDate || !form.endDate) return 0;

    const start = new Date(`${form.startDate}T00:00:00`);
    const end = new Date(`${form.endDate}T00:00:00`);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end <= start
    ) {
      return 0;
    }

    return Math.floor((end.getTime() - start.getTime()) / 86400000);
  }, [form.startDate, form.endDate]);

  const estimatedPrice = useMemo(() => {
    if (!options || selectedScreens.length === 0 || numberOfDays === 0) {
      return 0;
    }

    let total = 0;

    for (const screenId of selectedScreens) {
      const screen = options.screens.find((item) => item.id === screenId);

      if (!screen) continue;

      const screenRule = options.pricingRules.find(
        (rule) => rule.screenId === screen.id
      );

      const zoneRule = screen.zone
        ? options.pricingRules.find(
            (rule) => rule.zoneId === screen.zone?.id
          )
        : undefined;

      const rule = screenRule ?? zoneRule;

      if (!rule) continue;

      total +=
        rule.basePrice *
        rule.durationMultiplier *
        rule.frequencyMultiplier *
        rule.zoneMultiplier *
        numberOfDays;
    }

    return Math.round(total * 100) / 100;
  }, [options, selectedScreens, numberOfDays]);

  const screensWithoutPricing = useMemo(() => {
    if (!options) return [];

    return selectedScreens.filter((screenId) => {
      const screen = options.screens.find((item) => item.id === screenId);

      if (!screen) return true;

      const screenRule = options.pricingRules.find(
        (rule) => rule.screenId === screen.id
      );

      const zoneRule = screen.zone
        ? options.pricingRules.find(
            (rule) => rule.zoneId === screen.zone?.id
          )
        : undefined;

      return !screenRule && !zoneRule;
    });
  }, [options, selectedScreens]);

  const toggleScreen = (screenId: string) => {
    setSelectedScreens((current) =>
      current.includes(screenId)
        ? current.filter((id) => id !== screenId)
        : [...current, screenId]
    );
  };

  const toggleMedia = (mediaId: string) => {
    setSelectedMedia((current) =>
      current.includes(mediaId)
        ? current.filter((id) => id !== mediaId)
        : [...current, mediaId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!form.name.trim()) {
        throw new Error("Le nom de la campagne est requis.");
      }

      if (!form.startDate || !form.endDate) {
        throw new Error("Veuillez sélectionner les dates de début et de fin.");
      }

      if (
        new Date(`${form.endDate}T00:00:00`) <=
        new Date(`${form.startDate}T00:00:00`)
      ) {
        throw new Error(
          "La date de fin doit être strictement postérieure à la date de début."
        );
      }

      if (selectedScreens.length === 0) {
        throw new Error("Veuillez sélectionner au moins un écran.");
      }

      if (selectedMedia.length === 0) {
        throw new Error("Veuillez sélectionner au moins un média.");
      }

      if (screensWithoutPricing.length > 0) {
        throw new Error(
          "Un ou plusieurs écrans sélectionnés n'ont pas de règle de tarification active."
        );
      }

      if (estimatedPrice <= 0) {
        throw new Error("Impossible de calculer le prix de la campagne.");
      }

      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          objective: form.objective.trim(),
          startDate: form.startDate,
          endDate: form.endDate,
          spotDuration: form.spotDuration,
          frequencyPerLoop: form.frequencyPerLoop,
          screenIds: selectedScreens,
          mediaIds: selectedMedia,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data.error || "Erreur lors de la création de la campagne."
        );
      }

      router.push("/advertiser/campaigns");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la création de la campagne."
      );
      setLoading(false);
    }
  };

  if (loadingOptions) {
    return (
      <div className="mx-auto max-w-4xl">
        <div
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
          role="status"
        >
          <span className="sr-only">Chargement des options de campagne…</span>
          <div className="h-8 w-2/5 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-28 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-28 animate-pulse rounded-xl bg-slate-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl pb-8">
      <header className="mb-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-sky-700">
          Nouvelle campagne
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Créer une campagne
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
          Renseigne les informations, choisis des écrans et des médias, puis
          vérifie le résumé avant de creer la campagne.
        </p>
      </header>

      <ol
        aria-label="Étapes de création"
        className="mb-6 grid gap-2 sm:grid-cols-3"
      >
        {[
          ["1", "Informations"],
          ["2", "Écrans et médias"],
          ["3", "Résumé et création"],
        ].map(([step, label]) => (
          <li
            key={step}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
          >
            <span
              aria-hidden="true"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-50 text-xs font-bold text-sky-700"
            >
              {step}
            </span>
            <span className="text-sm font-medium text-slate-700">{label}</span>
          </li>
        ))}
      </ol>

      {error && (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {!options ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center sm:p-12">
          <h2 className="text-lg font-semibold text-slate-900">
            Les options de campagne ne sont pas disponibles.
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Réessaie dans un instant. Si le problème continue, contacte le
            support.
          </p>
          <button
            type="button"
            onClick={() => setOptionsRetry((value) => value + 1)}
            className="mt-5 inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:ring-offset-2"
          >
            Réessayer
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Informations
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Présente clairement ta campagne.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="campaign-name"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Nom de la campagne
                </label>
                <input
                  id="campaign-name"
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      name: e.target.value,
                    }))
                  }
                  className={inputClass}
                  placeholder="Ex. Campagne rentrée 2026"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="campaign-objective"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Objectif{" "}
                  <span className="font-normal text-slate-400">
                    (facultatif)
                  </span>
                </label>
                <textarea
                  id="campaign-objective"
                  value={form.objective}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      objective: e.target.value,
                    }))
                  }
                  className={`${inputClass} min-h-24 resize-y`}
                  rows={3}
                  placeholder="Décris l'objectif de la campagne"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">Période</h2>
              <p className="mt-1 text-sm text-slate-500">
                Choisis quand la campagne sera diffusée.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="campaign-start-date"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Date de début
                </label>
                <input
                  id="campaign-start-date"
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      startDate: e.target.value,
                      endDate:
                        current.endDate && current.endDate < e.target.value
                          ? ""
                          : current.endDate,
                    }))
                  }
                  min={form.startDate || undefined}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="campaign-end-date"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Date de fin
                </label>
                <input
                  id="campaign-end-date"
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      endDate: e.target.value,
                    }))
                  }
                  min={form.startDate || undefined}
                  className={inputClass}
                  required
                />
              </div>
            </div>

            <p className="mt-3 text-sm text-slate-500">
              Durée :{" "}
              <strong className="font-semibold text-slate-800">
                {numberOfDays > 0
                  ? `${numberOfDays} ${numberOfDays > 1 ? "jours" : "jour"}`
                  : "à définir"}
              </strong>
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Écrans
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Sélectionne les écrans sur lesquels diffuser.
                </p>
              </div>
              <p className="text-sm font-medium text-slate-600">
                {selectedScreens.length} écran
                {selectedScreens.length > 1 ? "s" : ""} sélectionné
                {selectedScreens.length > 1 ? "s" : ""}
              </p>
            </div>

            <div className="space-y-3">
              {options.screens.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 px-4 py-5 text-center text-sm text-slate-500">
                  Aucun écran disponible.
                </div>
              ) : (
                options.screens.map((screen) => {
                  const selected = selectedScreens.includes(screen.id);

                  return (
                    <label
                      key={screen.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                        selected
                          ? "border-sky-500 bg-sky-50/50 ring-1 ring-sky-600/10"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleScreen(screen.id)}
                        className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 accent-sky-700"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="break-words font-semibold text-slate-900">
                              {screen.name || screen.screenCode}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              {screen.screenCode}
                              {screen.location?.name
                                ? ` — ${screen.location.name}`
                                : ""}
                              {screen.zone?.name
                                ? ` — ${screen.zone.name}`
                                : ""}
                            </p>
                          </div>

                          <ScreenStatus status={screen.status} />
                        </div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Médias
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Seuls tes médias approuvés sont disponibles.
                </p>
              </div>
              <p className="text-sm font-medium text-slate-600">
                {selectedMedia.length} média
                {selectedMedia.length > 1 ? "s" : ""} sélectionné
                {selectedMedia.length > 1 ? "s" : ""}
              </p>
            </div>

            <div className="space-y-3">
              {options.media.length === 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  <p className="font-semibold">
                    Aucun média approuvé disponible.
                  </p>
                  <p className="mt-1">
                    Ajoute un média dans la médiathèque et attends son
                    approbation avant de creer la campagne.
                  </p>
                  <Link
                    href="/advertiser/media"
                    className="mt-3 inline-flex min-h-10 items-center rounded-lg border border-amber-300 bg-white px-3 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
                  >
                    Ouvrir la médiathèque
                  </Link>
                </div>
              ) : (
                options.media.map((media) => {
                  const selected = selectedMedia.includes(media.id);

                  return (
                    <label
                      key={media.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                        selected
                          ? "border-sky-500 bg-sky-50/50 ring-1 ring-sky-600/10"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleMedia(media.id)}
                        className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 accent-sky-700"
                      />

                      <div className="min-w-0">
                        <p className="break-words font-semibold text-slate-900">
                          {media.name}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {media.fileType || media.mimeType}
                          {media.durationSeconds
                            ? ` — ${media.durationSeconds} secondes`
                            : ""}
                        </p>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Paramètres de diffusion
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Définis la durée et la fréquence du spot.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="spot-duration"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Durée du spot
                </label>
                <select
                  id="spot-duration"
                  value={form.spotDuration}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      spotDuration: Number(e.target.value),
                    }))
                  }
                  className={inputClass}
                >
                  {[5, 10, 15, 20, 30, 45, 60].map((value) => (
                    <option key={value} value={value}>
                      {value} secondes
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="frequency-per-loop"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Fréquence par boucle
                </label>
                <select
                  id="frequency-per-loop"
                  value={form.frequencyPerLoop}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      frequencyPerLoop: Number(e.target.value),
                    }))
                  }
                  className={inputClass}
                >
                  {Array.from({ length: 10 }, (_, index) => index + 1).map(
                    (value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-sky-100 bg-sky-50 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-sky-800">Prix estimé</p>
                <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                  {estimatedPrice.toLocaleString("fr-FR")} XOF
                </p>
              </div>

              <div className="text-sm leading-6 text-slate-600 sm:text-right">
                <div>
                  {selectedScreens.length} écran
                  {selectedScreens.length > 1 ? "s" : ""}
                </div>
                <div>
                  {numberOfDays} jour{numberOfDays > 1 ? "s" : ""}
                </div>
                <div>
                  {form.spotDuration} secondes • {form.frequencyPerLoop}{" "}
                  diffusion
                  {form.frequencyPerLoop > 1 ? "s" : ""} par boucle
                </div>
              </div>
            </div>

            {screensWithoutPricing.length > 0 && (
              <p className="mt-3 rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-700">
                Certains écrans sélectionnés n'ont pas de tarification active.
              </p>
            )}
          </section>

          <button
            type="submit"
            disabled={
              loading ||
              selectedScreens.length === 0 ||
              selectedMedia.length === 0 ||
              screensWithoutPricing.length > 0
            }
            className="min-h-12 w-full rounded-xl bg-sky-700 px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-white"
            style={{ color: "#fff" }}
          >
            {loading ? "Création…" : "Créer la campagne"}
          </button>
        </form>
      )}
    </div>
  );
}