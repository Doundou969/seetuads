"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type MediaItem = {
  id: string;
  name: string;
  fileUrl: string;
  fileType: "image" | "video";
  mimeType: string | null;
  durationSeconds: number;
  fileSizeBytes: string | null;
  status: string;
  createdAt: string;
};

const MAX_FILE_SIZE = 50 * 1024 * 1024;

function formatBytes(value: string | null) {
  if (!value) return "Taille inconnue";

  const bytes = Number(value);

  if (!Number.isFinite(bytes)) return "Taille inconnue";
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} Ko`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function PartnerMediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [durationSeconds, setDurationSeconds] = useState("15");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMedia = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/partner/media");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Impossible de charger les médias.");
      }

      setMedia(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger les médias."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMedia();
  }, [loadMedia]);

  async function handleUpload(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!file) {
      setError("Choisis d’abord une image ou une vidéo.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Le fichier dépasse la limite de 50 Mo.");
      return;
    }

    const duration = Number(durationSeconds);

    if (!Number.isInteger(duration) || duration <= 0) {
      setError("La durée doit être un nombre entier supérieur à zéro.");
      return;
    }

    setUploading(true);

    try {
      const uploadForm = new FormData();
      uploadForm.append("file", file);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: uploadForm,
      });

      const uploaded = await uploadResponse.json();

      if (!uploadResponse.ok || !uploaded?.url) {
        throw new Error(
          uploaded?.error || "Le téléversement du fichier a échoué."
        );
      }

      const mimeType = uploaded.type || file.type;
      const fileType = mimeType.startsWith("video/")
        ? "video"
        : "image";

      const saveResponse = await fetch("/api/partner/media", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim() || file.name,
          fileUrl: uploaded.url,
          fileType,
          mimeType,
          durationSeconds: duration,
          fileSizeBytes: file.size,
        }),
      });

      const saved = await saveResponse.json();

      if (!saveResponse.ok) {
        throw new Error(
          saved?.error || "Impossible d’enregistrer le média."
        );
      }

      setMessage("Le média a été ajouté.");
      setFile(null);
      setName("");
      setDurationSeconds("15");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await loadMedia();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue pendant l’ajout."
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(item: MediaItem) {
    const confirmed = window.confirm(
      `Supprimer le média « ${item.name} » ?`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");
    setDeletingId(item.id);

    try {
      const response = await fetch(
        `/api/partner/media/${encodeURIComponent(item.id)}`,
        { method: "DELETE" }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error || "Impossible de supprimer ce média."
        );
      }

      setMessage("Le média a été supprimé.");
      await loadMedia();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue pendant la suppression."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Mes médias</h1>
        <p className="mt-1 text-sm text-gray-600">
          Ajoute et consulte les images et vidéos de ton compte partenaire.
          Taille maximale : 50 Mo par fichier.
        </p>
      </header>

      <form
        onSubmit={handleUpload}
        className="space-y-4 rounded-xl border bg-white p-5"
      >
        <h2 className="text-lg font-semibold">Ajouter un média</h2>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Fichier *</span>
          <input
            ref={fileInputRef}
            type="file"
            required
            accept="video/mp4,video/webm,video/quicktime,image/jpeg,image/png,image/webp"
            onChange={(event) => {
              const selected = event.target.files?.[0] ?? null;
              setFile(selected);

              if (selected && !name) {
                setName(selected.name);
              }
            }}
            className="block w-full rounded border p-2 text-sm"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Nom du média</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex. Promotion de novembre"
            className="block w-full rounded border p-2"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium">
            Durée de diffusion (secondes)
          </span>
          <input
            type="number"
            min="1"
            step="1"
            value={durationSeconds}
            onChange={(event) => setDurationSeconds(event.target.value)}
            className="block w-full rounded border p-2"
          />
        </label>

        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}

        {message && (
          <p role="status" className="text-sm text-green-700">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={uploading}
          className="rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? "Envoi en cours…" : "Envoyer le média"}
        </button>
      </form>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          Médias enregistrés ({media.length})
        </h2>

        {loading ? (
          <p className="text-sm text-gray-600">Chargement des médias…</p>
        ) : media.length === 0 ? (
          <div className="rounded-xl border bg-white p-5 text-sm text-gray-600">
            Aucun média n’est encore associé à ton compte.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {media.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-xl border bg-white"
              >
                {item.fileType === "video" ? (
                  <video
                    controls
                    preload="metadata"
                    className="aspect-video w-full bg-black object-contain"
                  >
                    <source
                      src={item.fileUrl}
                      type={item.mimeType || undefined}
                    />
                  </video>
                ) : (
                  <img
                    src={item.fileUrl}
                    alt={item.name}
                    className="aspect-video w-full bg-gray-100 object-contain"
                  />
                )}

                <div className="space-y-2 p-4">
                  <h3 className="break-words font-semibold">{item.name}</h3>

                  <p className="text-sm text-gray-600">
                    {item.fileType === "video" ? "Vidéo" : "Image"} ·{" "}
                    {formatBytes(item.fileSizeBytes)}
                  </p>

                  <p className="text-sm text-gray-600">
                    Statut : {item.status}
                  </p>

                  <p className="text-xs text-gray-500">
                    Ajouté le{" "}
                    {new Date(item.createdAt).toLocaleDateString("fr-FR")}
                  </p>

                  <button
                    type="button"
                    onClick={() => void handleDelete(item)}
                    disabled={deletingId === item.id}
                    className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
                  >
                    {deletingId === item.id
                      ? "Suppression…"
                      : "Supprimer"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}