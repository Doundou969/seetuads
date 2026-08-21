"use client";

import { useState } from "react";
import { createMedia } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import {
  Upload,
  Film,
  Image as ImageIcon,
  Loader2,
  Globe,
} from "lucide-react";

export default function NewMediaPage() {
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [fileType, setFileType] = useState("");
  const [manualUrl, setManualUrl] = useState("");

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selected = e.target.files?.[0];

    if (!selected) return;

    setFile(selected);

    setFileType(
      selected.type.startsWith("video")
        ? "video"
        : "image"
    );
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);

    try {
      /*
       * IMPORTANT :
       * On utilise FormData.
       * Ne pas définir manuellement Content-Type.
       * Le navigateur ajoute automatiquement multipart/form-data
       * avec sa boundary.
       */
      const formData = new FormData();

      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const text = await response.text();

      let data: any;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          text || "Réponse invalide du serveur"
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

      setUploadedUrl(data.url);

      alert("Upload réussi !");
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Erreur inconnue";

      alert("Erreur upload : " + message);

      console.error("Upload admin error:", error);
    } finally {
      setUploading(false);
    }
  };

  const finalUrl =
    mode === "upload"
      ? uploadedUrl
      : manualUrl;

  const finalType =
    mode === "upload"
      ? fileType
      : manualUrl.match(
          /\.(mp4|mov|avi|webm)$/i
        )
        ? "video"
        : "image";

  const resetForm = () => {
    setUploadedUrl("");
    setFile(null);
    setManualUrl("");
    setFileType("");
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Nouveau média
      </h1>

      <p className="text-gray-600 mb-6">
        Ajoutez une image ou une vidéo
      </p>

      <div className="flex gap-4 mb-6">
        <button
          type="button"
          onClick={() => setMode("upload")}
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
          onClick={() => setMode("url")}
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
                Images JPG, PNG, WebP ou vidéos MP4, WebM, MOV
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

                  <div className="flex-1">
                    <p className="font-medium text-sm">
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

            <Button
              type="button"
              onClick={() =>
                setUploadedUrl(manualUrl)
              }
              disabled={!manualUrl}
            >
              Utiliser cette URL
            </Button>
          </div>
        )}

        {finalUrl && (
          <div className="space-y-4">

            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <p className="text-green-800 font-medium">
                ✓ Média prêt !
              </p>

              <p className="text-sm text-green-600 truncate">
                {finalUrl}
              </p>
            </div>

            {finalType === "video" ? (
              <video
                src={finalUrl}
                controls
                className="w-full rounded-lg max-h-64"
              />
            ) : (
              <img
                src={finalUrl}
                alt="Preview"
                className="w-full rounded-lg max-h-64 object-contain"
              />
            )}

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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit">
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