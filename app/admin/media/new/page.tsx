
"use client";

import { useEffect, useState } from "react";
import { createMedia } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import {
  Upload,
  Film,
  Image as ImageIcon,
  Loader2,
  Globe,
} from "lucide-react";

type FileType = "image" | "video";

type Advertiser = {
  id: string;
  companyName: string;
};

const MIME_BY_EXTENSION: Record<string, string> = {
  mp4: "video/mp4",
  m4v: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

const MIME_BY_FILE_TYPE: Record<FileType, string> = {
  image: "image/jpeg",
  video: "video/mp4",
};

function getExtensionFromUrl(url: string): string {
  try {
    const cleanUrl = url.split("?")[0].split("#")[0];
    const filename = cleanUrl.split("/").pop() ?? "";

    if (!filename.includes(".")) {
      return "";
    }

    return filename.split(".").pop()?.toLowerCase() ?? "";
  } catch {
    return "";
  }
}

function getMimeTypeFromFilename(filename: string): string {
  const extension = getExtensionFromUrl(filename);

  return MIME_BY_EXTENSION[extension] ?? "";
}

function getFileTypeFromMime(mimeType: string): FileType {
  return mimeType.toLowerCase().startsWith("video/")
    ? "video"
    : "image";
}

function getFileTypeFromUrl(url: string): FileType {
  const extension = getExtensionFromUrl(url);

  if (
    ["mp4", "m4v", "webm", "mov"].includes(extension)
  ) {
    return "video";
  }

  return "image";
}

function getMimeTypeFromUrl(url: string): string {
  const extension = getExtensionFromUrl(url);

  return MIME_BY_EXTENSION[extension] ?? "";
}

export default function NewMediaPage() {
  const [mode, setMode] = useState<"upload" | "url">(
    "upload"
  );

  const [file, setFile] = useState<File | null>(null);

  const [uploading, setUploading] = useState(false);

  const [uploadedUrl, setUploadedUrl] = useState("");

  const [fileType, setFileType] = useState<FileType | "">(
    ""
  );

  const [mimeType, setMimeType] = useState("");

  const [manualUrl, setManualUrl] = useState("");

  const [advertisers, setAdvertisers] = useState<
    Advertiser[]
  >([]);

  const [advertiserId, setAdvertiserId] = useState("");

  // ==========================================================================
  // CHARGEMENT DES ANNONCEURS
  // ==========================================================================

  useEffect(() => {
    async function loadAdvertisers() {
      try {
        const response = await fetch(
          "/api/admin/advertisers"
        );

        if (!response.ok) {
          throw new Error(
            `Impossible de charger les annonceurs (${response.status})`
          );
        }

        const data = await response.json();

        const items = Array.isArray(data)
          ? data
          : data.advertisers ?? [];

        setAdvertisers(
          items.map(
            (advertiser: {
              id: string;
              companyName: string;
            }) => ({
              id: advertiser.id,
              companyName: advertiser.companyName,
            })
          )
        );
      } catch (error) {
        console.error(
          "Erreur chargement annonceurs :",
          error
        );
      }
    }

    loadAdvertisers();
  }, []);

  // ==========================================================================
  // SÉLECTION DU FICHIER
  // ==========================================================================

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selected = e.target.files?.[0];

    if (!selected) {
      return;
    }

    const detectedMime =
      selected.type ||
      getMimeTypeFromFilename(selected.name);

    const detectedType = getFileTypeFromMime(
      detectedMime
    );

    setFile(selected);

    setMimeType(detectedMime);

    setFileType(detectedType);
  };

  // ==========================================================================
  // UPLOAD
  // ==========================================================================

  const handleUpload = async () => {
    if (!file) {
      alert("Veuillez sélectionner un fichier.");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();

      formData.append("file", file);

      /*
       * IMPORTANT :
       *
       * Ne surtout pas définir manuellement Content-Type.
       * Le navigateur ajoute automatiquement :
       *
       * multipart/form-data; boundary=...
       */

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const text = await response.text();

      let data: {
        url?: string;
        error?: string;
      };

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          text || "Réponse invalide du serveur."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            `Erreur upload (${response.status})`
        );
      }

      if (!data.url) {
        throw new Error(
          "Le serveur n'a pas retourné l'URL du fichier."
        );
      }

      /*
       * L'API d'upload peut retourner une URL différente
       * du nom original du fichier.
       *
       * On conserve le MIME réel du fichier sélectionné.
       */

      const detectedMime =
        file.type ||
        getMimeTypeFromFilename(file.name);

      const detectedType = getFileTypeFromMime(
        detectedMime
      );

      setUploadedUrl(data.url);

      setMimeType(detectedMime);

      setFileType(detectedType);

      alert("Upload réussi !");
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Erreur inconnue";

      alert("Erreur upload : " + message);

      console.error(
        "Upload admin error:",
        error
      );
    } finally {
      setUploading(false);
    }
  };

  // ==========================================================================
  // URL FINALE
  // ==========================================================================

  const finalUrl =
    mode === "upload"
      ? uploadedUrl
      : manualUrl.trim();

  /*
   * Pour un upload :
   * on utilise le type détecté lors de la sélection.
   *
   * Pour une URL :
   * on essaie d'abord l'extension.
   * Si aucune extension n'est trouvée, on considère
   * l'URL comme une image par défaut.
   */

  const finalType: FileType | "" =
    mode === "upload"
      ? fileType
      : manualUrl.trim()
        ? getFileTypeFromUrl(manualUrl.trim())
        : "";

  /*
   * MIME final.
   *
   * Pour un upload, on utilise le MIME réel du fichier.
   *
   * Pour une URL externe, on essaie l'extension.
   * Si l'URL ne contient pas d'extension reconnue,
   * on fournit un MIME cohérent avec le type détecté.
   */

  const finalMimeType =
    mode === "upload"
      ? mimeType ||
        (file
          ? getMimeTypeFromFilename(file.name)
          : "")
      : getMimeTypeFromUrl(manualUrl.trim()) ||
        (finalType
          ? MIME_BY_FILE_TYPE[finalType]
          : "");

  // ==========================================================================
  // UTILISATION D'UNE URL EXTERNE
  // ==========================================================================

  const handleUseManualUrl = () => {
    const url = manualUrl.trim();

    if (!url) {
      alert("Veuillez saisir une URL.");
      return;
    }

    try {
      const parsedUrl = new URL(url);

      if (
        parsedUrl.protocol !== "http:" &&
        parsedUrl.protocol !== "https:"
      ) {
        alert(
          "L'URL doit commencer par http:// ou https://."
        );
        return;
      }
    } catch {
      alert("L'URL saisie est invalide.");
      return;
    }

    const detectedType = getFileTypeFromUrl(url);

    const detectedMime =
      getMimeTypeFromUrl(url) ||
      MIME_BY_FILE_TYPE[detectedType];

    setFileType(detectedType);

    setMimeType(detectedMime);

    setUploadedUrl(url);
  };

  // ==========================================================================
  // RESET
  // ==========================================================================

  const resetForm = () => {
    setUploadedUrl("");
    setFile(null);
    setManualUrl("");
    setFileType("");
    setMimeType("");
    setAdvertiserId("");
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Nouveau média
      </h1>

      <p className="text-gray-600 mb-6">
        Ajoutez une image ou une vidéo
      </p>

      {/* =====================================================================
          MODE
      ====================================================================== */}

      <div className="flex gap-4 mb-6">
        <button
          type="button"
          onClick={() => {
            setMode("upload");
            setUploadedUrl("");
            setManualUrl("");
            setFileType("");
            setMimeType("");
          }}
          className={`flex-1 py-3 rounded-lg border text-center font-medium transition ${
            mode === "upload"
              ? "border-primary-500 bg-primary-50 text-primary-700"
              : "border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Upload className="w-5 h-5 mx-auto mb-1" />

          Upload fichier
        </button>

        <button
          type="button"
          onClick={() => {
            setMode("url");
            setUploadedUrl("");
            setFile(null);
            setFileType("");
            setMimeType("");
          }}
          className={`flex-1 py-3 rounded-lg border text-center font-medium transition ${
            mode === "url"
              ? "border-primary-500 bg-primary-50 text-primary-700"
              : "border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Globe className="w-5 h-5 mx-auto mb-1" />

          URL externe
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl border space-y-6">
        {/* ===================================================================
            UPLOAD
        ==================================================================== */}

        {mode === "upload" && !uploadedUrl && (
          <>
            <div
              onClick={() =>
                document
                  .getElementById("fileInput")
                  ?.click()
              }
              className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition"
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />

              <p className="text-gray-600 font-medium">
                Cliquez pour sélectionner un fichier
              </p>

              <p className="text-sm text-gray-400 mt-1">
                Images JPG, PNG, WebP ou vidéos MP4,
                WebM, MOV
              </p>

              <input
                id="fileInput"
                type="file"
                accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {file && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  {fileType === "video" ? (
                    <Film className="w-5 h-5 text-blue-500" />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-green-500" />
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {file.name}
                    </p>

                    <p className="text-xs text-gray-500">
                      {(
                        file.size /
                        1024 /
                        1024
                      ).toFixed(2)}{" "}
                      MB
                    </p>

                    {mimeType && (
                      <p className="text-xs text-gray-400 mt-1">
                        MIME : {mimeType}
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={handleUpload}
                    disabled={uploading}
                    type="button"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Upload...
                      </>
                    ) : (
                      "Uploader"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ===================================================================
            URL EXTERNE
        ==================================================================== */}

        {mode === "url" && !uploadedUrl && (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              URL du média
            </label>

            <input
              type="url"
              value={manualUrl}
              onChange={(e) =>
                setManualUrl(e.target.value)
              }
              placeholder="https://example.com/video.mp4"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />

            <p className="text-xs text-gray-500">
              Formats reconnus : JPG, PNG, WebP, MP4,
              WebM ou MOV.
            </p>

            <Button
              type="button"
              onClick={handleUseManualUrl}
              disabled={!manualUrl.trim()}
            >
              Utiliser cette URL
            </Button>
          </div>
        )}

        {/* ===================================================================
            MÉDIA PRÊT
        ==================================================================== */}

        {finalUrl && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <p className="text-green-800 font-medium">
                ✓ Média prêt !
              </p>

              <p className="text-sm text-green-600 truncate">
                {finalUrl}
              </p>

              <div className="mt-2 text-xs text-green-700 space-y-1">
                {finalType && (
                  <p>
                    Type :{" "}
                    <strong>{finalType}</strong>
                  </p>
                )}

                {finalMimeType && (
                  <p>
                    MIME :{" "}
                    <strong>{finalMimeType}</strong>
                  </p>
                )}
              </div>
            </div>

            {/* PREVIEW */}

            {finalType === "video" ? (
              <video
                src={finalUrl}
                controls
                className="w-full rounded-lg max-h-64 bg-black"
              />
            ) : (
              <img
                src={finalUrl}
                alt="Preview"
                className="w-full rounded-lg max-h-64 object-contain"
              />
            )}

            {/* =================================================================
                FORMULAIRE CRÉATION MEDIA
            ================================================================== */}

            <form
              action={createMedia}
              className="space-y-4"
            >
              <input
                type="hidden"
                name="fileUrl"
                value={finalUrl}
              />

              <input
                type="hidden"
                name="fileType"
                value={finalType}
              />

              <input
                type="hidden"
                name="mimeType"
                value={finalMimeType}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Annonceur propriétaire
                </label>

                <select
                  name="advertiserId"
                  required
                  value={advertiserId}
                  onChange={(e) =>
                    setAdvertiserId(e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">
                    Sélectionnez un annonceur
                  </option>

                  {advertisers.map((advertiser) => (
                    <option
                      key={advertiser.id}
                      value={advertiser.id}
                    >
                      {advertiser.companyName}
                    </option>
                  ))}
                </select>

                {advertisers.length === 0 && (
                  <p className="mt-1 text-sm text-yellow-700">
                    Aucun annonceur actif disponible.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du média
                </label>

                <input
                  name="name"
                  required
                  placeholder="Spot publicitaire 15s"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Durée (secondes)
                </label>

                <input
                  name="durationSeconds"
                  type="number"
                  min={5}
                  max={60}
                  defaultValue={15}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* INFOS TECHNIQUES */}

              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 space-y-1">
                <p>
                  <span className="font-medium">
                    Type :
                  </span>{" "}
                  {finalType || "—"}
                </p>

                <p>
                  <span className="font-medium">
                    MIME :
                  </span>{" "}
                  {finalMimeType || "—"}
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={
                    !finalUrl ||
                    !finalType ||
                    !finalMimeType ||
                    !advertiserId
                  }
                >
                  Enregistrer le média
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

