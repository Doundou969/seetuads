"use client";

import { useEffect, useMemo, useState } from "react";
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

export default function NewCampaignPage() {
  const router = useRouter();

  const [options, setOptions] = useState<CampaignOptions | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

    loadOptions();

    return () => {
      cancelled = true;
    };
  }, []);

  const numberOfDays = useMemo(() => {
    if (!form.startDate || !form.endDate) return 0;

    const start = new Date(`${form.startDate}T00:00:00`);
    const end = new Date(`${form.endDate}T00:00:00`);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end < start
    ) {
      return 0;
    }

    return Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / 86400000)
    );
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
  }, [
    options,
    selectedScreens,
    numberOfDays,
  ]);

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
        throw new Error(
          "Veuillez s�lectionner les dates de d�but et de fin."
        );
      }

      if (new Date(`${form.endDate}T00:00:00`) < new Date(`${form.startDate}T00:00:00`)) {
        throw new Error(
          "La date de fin doit �tre post�rieure ou �gale � la date de d�but."
        );
      }

      if (selectedScreens.length === 0) {
        throw new Error("Veuillez s�lectionner au moins un �cran.");
      }

      if (selectedMedia.length === 0) {
        throw new Error("Veuillez s�lectionner au moins un m�dia.");
      }

      if (screensWithoutPricing.length > 0) {
        throw new Error(
          "Un ou plusieurs �crans s�lectionn�s n'ont pas de r�gle de tarification active."
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
          data.error || "Erreur lors de la cr�ation de la campagne."
        );
      }

      router.push("/advertiser/campaigns");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la cr�ation de la campagne."
      );
      setLoading(false);
    }
  };

  if (loadingOptions) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="rounded-lg border bg-white p-6">
          Chargement des options de campagne...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Nouvelle campagne
        </h1>
        <p className="text-gray-600">
          S�lectionnez vos �crans et vos m�dias, puis d�finissez la p�riode.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!options ? (
        <div className="rounded-lg border bg-white p-6">
          Impossible de charger les options de campagne.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-lg border bg-white p-6 space-y-4">
            <h2 className="text-lg font-semibold">Informations</h2>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Nom de la campagne
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    name: e.target.value,
                  }))
                }
                className="w-full rounded-md border px-3 py-2"
                placeholder="Ex. Campagne rentr�e 2026"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Objectif
              </label>
              <textarea
                value={form.objective}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    objective: e.target.value,
                  }))
                }
                className="w-full rounded-md border px-3 py-2"
                rows={3}
                placeholder="D�crivez l'objectif de la campagne"
              />
            </div>
          </div>

          <div className="rounded-lg border bg-white p-6 space-y-4">
            <h2 className="text-lg font-semibold">P�riode</h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Date de d�but
                </label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      startDate: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Date de fin
                </label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      endDate: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border px-3 py-2"
                />
              </div>
            </div>

            {numberOfDays > 0 && (
              <p className="text-sm text-gray-600">
                Dur�e : <strong>{numberOfDays}</strong>{" "}
                {numberOfDays > 1 ? "jours" : "jour"}
              </p>
            )}
          </div>

          <div className="rounded-lg border bg-white p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold">�crans</h2>
              <p className="text-sm text-gray-600">
                S�lectionnez un ou plusieurs �crans.
              </p>
            </div>

            <div className="space-y-2">
              {options.screens.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Aucun �cran disponible.
                </p>
              ) : (
                options.screens.map((screen) => (
                  <label
                    key={screen.id}
                    className="flex cursor-pointer items-start gap-3 rounded-md border p-3 hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedScreens.includes(screen.id)}
                      onChange={() => toggleScreen(screen.id)}
                      className="mt-1"
                    />

                    <div className="min-w-0">
                      <div className="font-medium">
                        {screen.name || screen.screenCode}
                      </div>

                      <div className="text-sm text-gray-600">
                        {screen.screenCode}
                        {screen.location?.name
                          ? ` � ${screen.location.name}`
                          : ""}
                        {screen.zone?.name
                          ? ` � ${screen.zone.name}`
                          : ""}
                      </div>

                      <div className="text-xs text-gray-500">
                        Statut : {screen.status}
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>

            {selectedScreens.length > 0 && (
              <p className="text-sm text-gray-600">
                {selectedScreens.length} �cran
                {selectedScreens.length > 1 ? "s" : ""} s�lectionn�
                {selectedScreens.length > 1 ? "s" : ""}
              </p>
            )}
          </div>

          <div className="rounded-lg border bg-white p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold">M�dias</h2>
              <p className="text-sm text-gray-600">
                Seuls vos m�dias approuv�s sont disponibles.
              </p>
            </div>

            <div className="space-y-2">
              {options.media.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Aucun m�dia approuv� disponible.
                </p>
              ) : (
                options.media.map((media) => (
                  <label
                    key={media.id}
                    className="flex cursor-pointer items-start gap-3 rounded-md border p-3 hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMedia.includes(media.id)}
                      onChange={() => toggleMedia(media.id)}
                      className="mt-1"
                    />

                    <div className="min-w-0">
                      <div className="font-medium">{media.name}</div>
                      <div className="text-sm text-gray-600">
                        {media.fileType || media.mimeType}
                        {media.durationSeconds
                          ? ` � ${media.durationSeconds}s`
                          : ""}
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>

            {selectedMedia.length > 0 && (
              <p className="text-sm text-gray-600">
                {selectedMedia.length} m�dia
                {selectedMedia.length > 1 ? "s" : ""} s�lectionn�
                {selectedMedia.length > 1 ? "s" : ""}
              </p>
            )}
          </div>

          <div className="rounded-lg border bg-white p-6 space-y-4">
            <h2 className="text-lg font-semibold">Param�tres de diffusion</h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Dur�e du spot
                </label>
                <select
                  value={form.spotDuration}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      spotDuration: Number(e.target.value),
                    }))
                  }
                  className="w-full rounded-md border px-3 py-2"
                >
                  {[5, 10, 15, 20, 30, 45, 60].map((value) => (
                    <option key={value} value={value}>
                      {value} secondes
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Fr�quence par boucle
                </label>
                <select
                  value={form.frequencyPerLoop}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      frequencyPerLoop: Number(e.target.value),
                    }))
                  }
                  className="w-full rounded-md border px-3 py-2"
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
          </div>

          <div className="rounded-lg border bg-gray-50 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-gray-600">Prix estim�</p>
                <p className="text-2xl font-bold">
                  {estimatedPrice.toLocaleString("fr-FR")} XOF
                </p>
              </div>

              <div className="text-right text-sm text-gray-600">
                <div>
                  {selectedScreens.length} �cran
                  {selectedScreens.length > 1 ? "s" : ""}
                </div>
                <div>
                  {numberOfDays} jour
                  {numberOfDays > 1 ? "s" : ""}
                </div>
              </div>
            </div>

            {screensWithoutPricing.length > 0 && (
              <p className="mt-3 text-sm text-red-600">
                Certains �crans s�lectionn�s n'ont pas de tarification active.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={
              loading ||
              selectedScreens.length === 0 ||
              selectedMedia.length === 0 ||
              screensWithoutPricing.length > 0
            }
            className="w-full rounded-md bg-black px-4 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Cr�ation..." : "Cr�er la campagne"}
          </button>
        </form>
      )}
    </div>
  );
}
