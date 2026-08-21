"use client";

import { useMemo, useState } from "react";
import { createCampaign } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import {
  Monitor,
  Calendar,
  Clock,
  Calculator,
  Film,
  Building2,
} from "lucide-react";

interface Screen {
  id: string;
  screenCode: string;
  name: string | null;
  location: { name: string } | null;
  zone: { name: string; id: string } | null;
  monthlyPartnerFee: number;
}

interface Media {
  id: string;
  name: string;
  fileType: string;
  mimeType: string | null;
  durationSeconds: number;
  advertiserId: string;
}

interface PricingRule {
  id: string;
  zoneId: string | null;
  screenId: string | null;
  basePrice: number;
  durationMultiplier: number;
  frequencyMultiplier: number;
  zoneMultiplier: number;
}

interface Advertiser {
  id: string;
  companyName: string;
}

export function CampaignForm({
  screens,
  pricingRules,
  media,
  advertisers,
}: {
  screens: Screen[];
  pricingRules: PricingRule[];
  media: Media[];
  advertisers: Advertiser[];
}) {
  const [selectedScreens, setSelectedScreens] = useState<string[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [selectedAdvertiser, setSelectedAdvertiser] = useState("");
  const [spotDuration, setSpotDuration] = useState(15);
  const [frequency, setFrequency] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleScreen = (id: string) => {
    if (isSubmitting) return;

    setSelectedScreens((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  const toggleMedia = (id: string) => {
    if (isSubmitting) return;

    setSelectedMedia((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  /*
   * Les médias sont filtrés par annonceur.
   *
   * Exemple actuel de la base :
   *
   * Test SeetuAds
   *   -> aucun média
   *
   * Annonceur Temporaire
   *   -> plusieurs médias APPROVED
   */
  const availableMedia = useMemo(() => {
    if (!selectedAdvertiser) {
      return [];
    }

    return media.filter(
      (item) => item.advertiserId === selectedAdvertiser
    );
  }, [media, selectedAdvertiser]);

  const handleAdvertiserChange = (
    advertiserId: string
  ) => {
    if (isSubmitting) return;

    setSelectedAdvertiser(advertiserId);

    /*
     * Très important :
     * lorsqu'on change d'annonceur, les médias précédemment
     * sélectionnés ne sont plus valides.
     */
    setSelectedMedia([]);
  };

  const numberOfDays = useMemo(() => {
    if (!startDate || !endDate) {
      return 0;
    }

    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end < start
    ) {
      return 0;
    }

    /*
     * Le dernier jour n'est pas compté comme une journée
     * supplémentaire.
     *
     * 19/08 -> 31/08 = 12 jours
     */
    return Math.max(
      1,
      Math.ceil(
        (end.getTime() - start.getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );
  }, [startDate, endDate]);

  const estimatedPrice = useMemo(() => {
    if (
      numberOfDays === 0 ||
      selectedScreens.length === 0
    ) {
      return 0;
    }

    let total = 0;

    for (const screenId of selectedScreens) {
      const screen = screens.find(
        (item) => item.id === screenId
      );

      if (!screen) {
        continue;
      }

      const rule =
        pricingRules.find(
          (item) => item.screenId === screenId
        ) ||
        pricingRules.find(
          (item) => item.zoneId === screen.zone?.id
        ) ||
        pricingRules[0];

      if (!rule) {
        continue;
      }

      const durationMultiplier =
        Number(rule.durationMultiplier) || 1;

      const frequencyMultiplier =
        Number(rule.frequencyMultiplier) || 1;

      const zoneMultiplier =
        Number(rule.zoneMultiplier) || 1;

      const basePrice =
        Number(rule.basePrice) || 0;

      total +=
        basePrice *
        durationMultiplier *
        frequencyMultiplier *
        zoneMultiplier *
        numberOfDays;
    }

    return Math.round(total);
  }, [
    numberOfDays,
    selectedScreens,
    screens,
    pricingRules,
  ]);

  const invalidDates =
    Boolean(startDate) &&
    Boolean(endDate) &&
    new Date(`${endDate}T00:00:00`) <
      new Date(`${startDate}T00:00:00`);

  /*
   * Vérification côté client avant d'appeler l'action serveur.
   *
   * Cela évite notamment l'erreur :
   * "Un ou plusieurs médias sélectionnés..."
   */
  const canSubmit =
    !isSubmitting &&
    Boolean(selectedAdvertiser) &&
    selectedScreens.length > 0 &&
    selectedMedia.length > 0 &&
    availableMedia.length > 0 &&
    numberOfDays > 0 &&
    !invalidDates;

  const handleSubmit = async (formData: FormData) => {
    if (isSubmitting) {
      return;
    }

    /*
     * Protection supplémentaire contre une soumission
     * invalide ou un double clic.
     */
    if (!selectedAdvertiser) {
      window.alert("Veuillez sélectionner un annonceur.");
      return;
    }

    if (selectedScreens.length === 0) {
      window.alert(
        "Veuillez sélectionner au moins un écran."
      );
      return;
    }

    if (availableMedia.length === 0) {
      window.alert(
        "Cet annonceur ne possède aucun média approuvé. " +
          "Veuillez choisir un annonceur disposant d'un média approuvé."
      );
      return;
    }

    if (selectedMedia.length === 0) {
      window.alert(
        "Veuillez sélectionner au moins un média."
      );
      return;
    }

    if (!startDate || !endDate) {
      window.alert(
        "Veuillez renseigner les dates de début et de fin."
      );
      return;
    }

    if (invalidDates) {
      window.alert(
        "La date de fin doit être postérieure ou égale à la date de début."
      );
      return;
    }

    /*
     * Vérification finale :
     * tous les médias sélectionnés doivent appartenir
     * à l'annonceur choisi.
     */
    const selectedMediaBelongsToAdvertiser =
      selectedMedia.every((mediaId) =>
        availableMedia.some(
          (item) => item.id === mediaId
        )
      );

    if (!selectedMediaBelongsToAdvertiser) {
      window.alert(
        "Un ou plusieurs médias ne correspondent pas à l'annonceur sélectionné."
      );
      return;
    }

    /*
     * Empêche immédiatement les doubles clics.
     */
    setIsSubmitting(true);

    formData.set(
      "advertiserId",
      selectedAdvertiser
    );

    formData.set(
      "screenIds",
      JSON.stringify(selectedScreens)
    );

    formData.set(
      "mediaIds",
      JSON.stringify(selectedMedia)
    );

    formData.set(
      "estimatedPrice",
      estimatedPrice.toString()
    );

    formData.set(
      "spotDuration",
      spotDuration.toString()
    );

    formData.set(
      "frequencyPerLoop",
      frequency.toString()
    );

    try {
      await createCampaign(formData);
    } catch (error) {
      /*
       * Si l'action serveur retourne une erreur,
       * on autorise une nouvelle tentative.
       */
      setIsSubmitting(false);

      console.error(
        "Erreur lors de la création de la campagne :",
        error
      );

      window.alert(
        error instanceof Error
          ? error.message
          : "Impossible de créer la campagne."
      );
    }
  };

  return (
    <form
      action={handleSubmit}
      className="space-y-8 max-w-4xl"
    >
      {/* INFORMATIONS GÉNÉRALES */}
      <div className="bg-white p-6 rounded-xl border space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary-600" />
          Informations générales
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* NOM */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nom de la campagne
            </label>

            <input
              id="name"
              name="name"
              required
              disabled={isSubmitting}
              placeholder="Campagne Été 2026"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
            />
          </div>

          {/* OBJECTIF */}
          <div>
            <label
              htmlFor="objective"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Objectif
            </label>

            <input
              id="objective"
              name="objective"
              disabled={isSubmitting}
              placeholder="Notoriété, ventes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
            />
          </div>

          {/* ANNONCEUR */}
          <div className="md:col-span-2">
            <label
              htmlFor="advertiserId"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Annonceur
            </label>

            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

              <select
                id="advertiserId"
                name="advertiserId"
                required
                disabled={isSubmitting}
                value={selectedAdvertiser}
                onChange={(event) =>
                  handleAdvertiserChange(
                    event.target.value
                  )
                }
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
              >
                <option value="">
                  Sélectionner un annonceur
                </option>

                {advertisers.map((advertiser) => {
                  const advertiserMediaCount =
                    media.filter(
                      (item) =>
                        item.advertiserId ===
                        advertiser.id
                    ).length;

                  return (
                    <option
                      key={advertiser.id}
                      value={advertiser.id}
                    >
                      {advertiser.companyName}
                      {advertiserMediaCount > 0
                        ? ` — ${advertiserMediaCount} média(s)`
                        : " — aucun média"}
                    </option>
                  );
                })}
              </select>
            </div>

            {selectedAdvertiser &&
              availableMedia.length === 0 && (
                <p className="mt-2 text-sm text-red-600">
                  Cet annonceur ne possède aucun média
                  approuvé. Sélectionnez un autre annonceur
                  ou ajoutez/approuvez d'abord un média.
                </p>
              )}

            {advertisers.length === 0 && (
              <p className="mt-2 text-sm text-yellow-700">
                Aucun annonceur actif n'est disponible.
              </p>
            )}
          </div>

          {/* DATE DEBUT */}
          <div>
            <label
              htmlFor="startDate"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Date de début
            </label>

            <input
              id="startDate"
              name="startDate"
              type="date"
              required
              disabled={isSubmitting}
              value={startDate}
              onChange={(event) =>
                setStartDate(event.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
            />
          </div>

          {/* DATE FIN */}
          <div>
            <label
              htmlFor="endDate"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Date de fin
            </label>

            <input
              id="endDate"
              name="endDate"
              type="date"
              required
              disabled={isSubmitting}
              min={startDate || undefined}
              value={endDate}
              onChange={(event) =>
                setEndDate(event.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
            />

            {invalidDates && (
              <p className="mt-2 text-sm text-red-600">
                La date de fin doit être postérieure ou
                égale à la date de début.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* CONFIGURATION DU SPOT */}
      <div className="bg-white p-6 rounded-xl border space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary-600" />
          Configuration du spot
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* DUREE */}
          <div>
            <label
              htmlFor="spotDuration"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Durée du spot (secondes)
            </label>

            <input
              id="spotDuration"
              name="spotDuration"
              type="number"
              min={5}
              max={60}
              required
              disabled={isSubmitting}
              value={spotDuration}
              onChange={(event) =>
                setSpotDuration(
                  Math.max(
                    5,
                    Math.min(
                      60,
                      Number(event.target.value) || 5
                    )
                  )
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
            />
          </div>

          {/* FREQUENCE */}
          <div>
            <label
              htmlFor="frequencyPerLoop"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Fréquence par boucle
            </label>

            <input
              id="frequencyPerLoop"
              name="frequencyPerLoop"
              type="number"
              min={1}
              max={10}
              required
              disabled={isSubmitting}
              value={frequency}
              onChange={(event) =>
                setFrequency(
                  Math.max(
                    1,
                    Math.min(
                      10,
                      Number(event.target.value) || 1
                    )
                  )
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
            />
          </div>
        </div>
      </div>

      {/* MEDIAS */}
      <div className="bg-white p-6 rounded-xl border space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Film className="w-5 h-5 text-primary-600" />

          Sélection des médias (
          {selectedMedia.length} sélectionné
          {selectedMedia.length > 1 ? "s" : ""})
        </h2>

        {!selectedAdvertiser ? (
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-800">
            Sélectionnez d'abord un annonceur pour
            afficher ses médias approuvés.
          </div>
        ) : availableMedia.length === 0 ? (
          <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-sm text-yellow-800">
            Aucun média approuvé n'est disponible pour
            <strong className="mx-1">
              {
                advertisers.find(
                  (item) =>
                    item.id === selectedAdvertiser
                )?.companyName
              }
            </strong>
            .
            <br />
            Ajoutez et approuvez d'abord un média pour cet
            annonceur.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {availableMedia.map((item) => (
              <label
                key={item.id}
                className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition ${
                  selectedMedia.includes(item.id)
                    ? "border-primary-500 bg-primary-50"
                    : "border-gray-200 hover:border-gray-300"
                } ${
                  isSubmitting
                    ? "opacity-60 cursor-not-allowed"
                    : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedMedia.includes(
                    item.id
                  )}
                  disabled={isSubmitting}
                  onChange={() =>
                    toggleMedia(item.id)
                  }
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {item.name}
                  </p>

                  <p className="text-xs text-gray-500">
                    {item.fileType} ·{" "}
                    {item.durationSeconds}s
                  </p>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* ECRANS */}
      <div className="bg-white p-6 rounded-xl border space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Monitor className="w-5 h-5 text-primary-600" />

          Sélection des écrans (
          {selectedScreens.length} sélectionné
          {selectedScreens.length > 1 ? "s" : ""})
        </h2>

        {screens.length === 0 ? (
          <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-sm text-yellow-800">
            Aucun écran disponible.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {screens.map((screen) => (
              <label
                key={screen.id}
                className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition ${
                  selectedScreens.includes(screen.id)
                    ? "border-primary-500 bg-primary-50"
                    : "border-gray-200 hover:border-gray-300"
                } ${
                  isSubmitting
                    ? "opacity-60 cursor-not-allowed"
                    : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedScreens.includes(
                    screen.id
                  )}
                  disabled={isSubmitting}
                  onChange={() =>
                    toggleScreen(screen.id)
                  }
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />

                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {screen.name ||
                      screen.screenCode}
                  </p>

                  <p className="text-xs text-gray-500">
                    {screen.location?.name ||
                      "Emplacement inconnu"}{" "}
                    ·{" "}
                    {screen.zone?.name ||
                      "Sans zone"}
                  </p>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* PRIX */}
      <div className="bg-primary-50 p-6 rounded-xl border border-primary-200">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-primary-800">
          <Calculator className="w-5 h-5" />
          Prix estimé
        </h2>

        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-4xl font-bold text-primary-700">
            {estimatedPrice.toLocaleString("fr-FR")}
          </span>

          <span className="text-primary-600">
            XOF
          </span>
        </div>

        <p className="text-sm text-primary-600 mt-2">
          {selectedScreens.length} écran
          {selectedScreens.length > 1 ? "s" : ""} ·{" "}
          {numberOfDays} jour
          {numberOfDays > 1 ? "s" : ""}
        </p>
      </div>

      {/* ACTIONS */}
      <div className="flex gap-4">
        <Button
          type="submit"
          size="lg"
          disabled={!canSubmit}
        >
          {isSubmitting
            ? "Création en cours..."
            : "Créer la campagne"}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={isSubmitting}
          onClick={() => window.history.back()}
        >
          Annuler
        </Button>
      </div>
    </form>
  );
}