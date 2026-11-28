"use client";

import { useCallback, useEffect, useState } from "react";

interface MediaItem {
  id: string;
  name: string;
  fileUrl: string;
  fileType: string;
  mimeType: string;
  durationSeconds: number | null;
  status: string;
  createdAt: string;
}

interface MediaForm {
  name: string;
  fileUrl: string;
  fileType: "video" | "image";
  mimeType: string;
  durationSeconds: number;
  widthPx: number | null;
  heightPx: number | null;
  fileSizeBytes: number | null;
}

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

const ACCEPTED_FILE_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const EMPTY_FORM: MediaForm = {
  name: "",
  fileUrl: "",
  fileType: "video",
  mimeType: "",
  durationSeconds: 15,
  widthPx: null,
  heightPx: null,
  fileSizeBytes: null,
};

const MEDIA_STATUS_CONFIG: Record<
  string,
  { label: string; classes: string; dot: string }
> = {
  PENDING: {
    label: "En attente de validation",
    classes: "bg-amber-50 text-amber-700 ring-amber-600/20",
    dot: "bg-amber-500",
  },
  PENDING_REVIEW: {
    label: "En attente de validation",
    classes: "bg-amber-50 text-amber-700 ring-amber-600/20",
    dot: "bg-amber-500",
  },
  APPROVED: {
    label: "Approuvé",
    classes: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    dot: "bg-emerald-500",
  },
  REJECTED: {
    label: "Refusé",
    classes: "bg-rose-50 text-rose-700 ring-rose-600/20",
    dot: "bg-rose-500",
  },
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date inconnue";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatFileSize(value: number | null) {
  if (!value || value <= 0) {
    return "";
  }

  return value < 1024 * 1024
    ? `${Math.max(1, Math.round(value / 1024))} Ko`
    : `${(value / (1024 * 1024)).toFixed(1)} Mo`;
}

function MediaStatus({ status }: { status: string }) {
  const config = MEDIA_STATUS_CONFIG[status.toUpperCase()] ?? {
    label: status.replaceAll("_", " ") || "Statut inconnu",
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

export default function MediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState<MediaForm>({ ...EMPTY_FORM });

  useEffect(() => {
    if (!previewUrl) {
      return;
    }

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const response = await fetch("/api/media");

      if (!response.ok) {
        throw new Error("Impossible de charger la médiathèque.");
      }

      const data: unknown = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("La liste de médias reçue est invalide.");
      }

      setMedia(data as MediaItem[]);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Impossible de charger la médiathèque."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMedia();
  }, [fetchMedia]);

  const resetForm = () => {
    if (uploading || saving) {
      return;
    }

    setShowForm(false);
    setPreviewUrl(null);
    setForm({ ...EMPTY_FORM });
    setFormError("");
    setNotice("");
    setDragActive(false);
  };

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true);
    setFormError("");
    setNotice("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data: {
        url?: string;
        type?: string;
        size?: number;
        error?: string;
      } = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Le transfert du fichier a échoué.");
      }

      if (!data.url) {
        throw new Error("Le fichier a été transféré, mais son adresse manque.");
      }

      setForm((current) => ({
        ...current,
        fileUrl: data.url ?? "",
        mimeType: data.type || file.type,
        fileSizeBytes: data.size || file.size,
      }));

      setNotice("Fichier transféré. Complète les informations puis enregistre le média.");
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Erreur réseau lors du transfert du fichier."
      );
    } finally {
      setUploading(false);
    }
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      if (!ACCEPTED_FILE_TYPES.has(file.type)) {
        setFormError(
          "Format non pris en charge. Choisis un fichier MP4, WebM, MOV, JPG, PNG ou WebP."
        );
        return;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setFormError("Le fichier dépasse la taille maximale de 50 Mo.");
        return;
      }

      setFormError("");
      setNotice("");

      const url = URL.createObjectURL(file);
      const isVideo = file.type.startsWith("video/");

      setPreviewUrl(url);
      setShowForm(true);
      setForm({
        ...EMPTY_FORM,
        name: file.name.replace(/\.[^/.]+$/, ""),
        fileType: isVideo ? "video" : "image",
        mimeType: file.type,
        fileSizeBytes: file.size,
      });

      if (isVideo) {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.src = url;

        video.onloadedmetadata = () => {
          setForm((current) => ({
            ...current,
            durationSeconds:
              Number.isFinite(video.duration) && video.duration > 0
                ? Math.max(1, Math.round(video.duration))
                : 15,
            widthPx: video.videoWidth || null,
            heightPx: video.videoHeight || null,
          }));
        };
      } else {
        const image = new Image();

        image.onload = () => {
          setForm((current) => ({
            ...current,
            widthPx: image.naturalWidth || null,
            heightPx: image.naturalHeight || null,
          }));
        };

        image.src = url;
      }

      void uploadFile(file);
    },
    [uploadFile]
  );

  const handleDrag = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      if (uploading) {
        return;
      }

      if (event.type === "dragenter" || event.type === "dragover") {
        setDragActive(true);
      } else if (event.type === "dragleave") {
        setDragActive(false);
      }
    },
    [uploading]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setDragActive(false);

      if (!uploading && event.dataTransfer.files?.[0]) {
        handleFile(event.dataTransfer.files[0]);
      }
    },
    [handleFile, uploading]
  );

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    // Permet de choisir à nouveau le même fichier si un transfert échoue.
    event.target.value = "";

    if (file) {
      handleFile(file);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setNotice("");

    if (!form.fileUrl) {
      setFormError("Transfère un fichier avant d’enregistrer le média.");
      return;
    }

    if (!form.mimeType) {
      setFormError("Le type du fichier n’a pas pu être déterminé.");
      return;
    }

    if (!form.name.trim()) {
      setFormError("Le nom du média est requis.");
      return;
    }

    if (form.durationSeconds < 1) {
      setFormError("La durée doit être supérieure à zéro.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/media", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          name: form.name.trim(),
        }),
      });

      const data: { error?: string } = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "L’enregistrement du média a échoué.");
      }

      setShowForm(false);
      setPreviewUrl(null);
      setForm({ ...EMPTY_FORM });
      setNotice(
        "Média enregistré. Il sera soumis à validation avant de pouvoir être utilisé dans une campagne."
      );

      await fetchMedia();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Erreur réseau lors de l’enregistrement du média."
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteMedia = async (id: string) => {
    if (!window.confirm("Supprimer ce média ? Cette action est définitive.")) {
      return;
    }

    setFormError("");
    setDeletingId(id);

    try {
      const response = await fetch(`/api/media/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Impossible de supprimer ce média.");
      }

      setMedia((current) => current.filter((item) => item.id !== id));
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Erreur réseau lors de la suppression."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-sky-700">
            Espace annonceur
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Médiathèque
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Gère les visuels et vidéos que tu souhaites utiliser dans tes
            campagnes.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormError("");
            setNotice("");
            setShowForm((current) => !current);
          }}
          disabled={uploading || saving}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-sky-700 px-5 py-3 text-sm font-semibold shadow-sm transition hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          style={{ color: "#fff" }}
        >
          {showForm ? "Fermer le formulaire" : "+ Ajouter un média"}
        </button>
      </header>

      {notice && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {notice}
        </div>
      )}

      {formError && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
        >
          {formError}
        </div>
      )}

      {showForm && (
        <section className="max-w-3xl space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Ajouter un média
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Après l’enregistrement, le média sera vérifié. Seuls les médias
              approuvés pourront être ajoutés à une campagne.
            </p>
          </div>

          {!form.fileUrl && (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`rounded-2xl border-2 border-dashed p-6 text-center transition sm:p-8 ${
                dragActive
                  ? "border-sky-500 bg-sky-50"
                  : "border-slate-300 bg-slate-50"
              } ${uploading ? "pointer-events-none opacity-60" : ""}`}
            >
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime,image/jpeg,image/png,image/webp"
                onChange={handleFileInput}
                disabled={uploading}
                className="sr-only"
                id="media-file-upload"
              />

              <label
                htmlFor="media-file-upload"
                className="cursor-pointer"
              >
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-sky-700 shadow-sm">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-6 w-6"
                  >
                    <path
                      d="M12 16V4m0 0L7 9m5-5 5 5M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>

                <span className="mt-4 block text-sm font-semibold text-slate-800">
                  {dragActive
                    ? "Dépose le fichier ici"
                    : "Choisis un fichier ou glisse-le ici"}
                </span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">
                  MP4, WebM, MOV, JPG, PNG ou WebP — maximum 50 Mo
                </span>
              </label>
            </div>
          )}

          {uploading && (
            <div
              className="rounded-xl border border-sky-100 bg-sky-50 p-4"
              role="status"
              aria-live="polite"
            >
              <p className="text-sm font-medium text-sky-900">
                Transfert du fichier en cours…
              </p>
              <p className="mt-1 text-xs text-sky-700">
                Garde cette page ouverte jusqu’à la fin du transfert.
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-sky-100">
                <div className="h-full w-1/3 animate-pulse rounded-full bg-sky-600" />
              </div>
            </div>
          )}

          {previewUrl && (
            <div>
              <div className="aspect-video overflow-hidden rounded-xl bg-slate-950">
                {form.fileType === "video" ? (
                  <video
                    src={previewUrl}
                    controls
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <img
                    src={previewUrl}
                    alt={form.name || "Aperçu du média"}
                    className="h-full w-full object-contain"
                  />
                )}
              </div>

              {form.fileUrl && (
                <p className="mt-2 text-sm font-medium text-emerald-700">
                  Fichier transféré{form.fileSizeBytes
                    ? ` · ${formatFileSize(form.fileSizeBytes)}`
                    : ""}
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="media-name"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Nom du média
              </label>
              <input
                id="media-name"
                type="text"
                required
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                placeholder="Ex. Spot promotion été"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="media-type"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Type de fichier
                </label>
                <input
                  id="media-type"
                  type="text"
                  readOnly
                  value={form.fileType === "video" ? "Vidéo" : "Image"}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
                />
              </div>

              <div>
                <label
                  htmlFor="media-duration"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Durée d’affichage (secondes)
                </label>
                <input
                  id="media-duration"
                  type="number"
                  min={1}
                  required
                  value={form.durationSeconds}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      durationSeconds: Math.max(
                        1,
                        Number(event.target.value) || 1
                      ),
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
            </div>

            {form.widthPx && form.heightPx && (
              <p className="text-xs text-slate-500">
                Dimensions : {form.widthPx} × {form.heightPx} px
              </p>
            )}

            {!form.fileUrl && (
              <p className="text-xs text-slate-500">
                Transfère d’abord un fichier pour pouvoir l’enregistrer.
              </p>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={!form.fileUrl || uploading || saving}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-sky-700 px-4 py-3 text-sm font-semibold transition hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
                style={{ color: "#fff" }}
              >
                {saving
                  ? "Enregistrement…"
                  : "Enregistrer dans la médiathèque"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                disabled={uploading || saving}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Annuler
              </button>
            </div>
          </form>
        </section>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="status">
          <span className="sr-only">Chargement de la médiathèque…</span>
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-56 animate-pulse rounded-2xl bg-slate-100"
            />
          ))}
        </div>
      ) : loadError ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center">
          <p className="font-semibold text-slate-900">
            La médiathèque n’a pas pu être chargée.
          </p>
          <p className="mt-2 text-sm text-slate-500">{loadError}</p>
          <button
            type="button"
            onClick={() => void fetchMedia()}
            className="mt-5 min-h-10 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Réessayer
          </button>
        </div>
      ) : media.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center shadow-sm sm:px-12 sm:py-14">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="h-7 w-7"
            >
              <path
                d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-13Z"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <path
                d="M8 12h8m-4-4v8"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            Ta médiathèque est prête
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Ajoute une image ou une vidéo pour commencer. Après vérification,
            les médias approuvés pourront être utilisés dans tes campagnes.
          </p>

          <button
            type="button"
            onClick={() => {
              setFormError("");
              setNotice("");
              setShowForm(true);
            }}
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-sky-700 px-5 py-3 text-sm font-semibold transition hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:ring-offset-2"
            style={{ color: "#fff" }}
          >
            Ajouter mon premier média
          </button>

          <p className="mt-4 text-xs text-slate-400">
            MP4, WebM, MOV, JPG, PNG ou WebP · maximum 50 Mo
          </p>
        </div>
      ) : (
        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">
              Tes médias
            </h2>
            <span className="text-sm text-slate-500">
              {media.length} élément{media.length > 1 ? "s" : ""}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {media.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="aspect-video bg-slate-100">
                  {item.fileType === "video" ? (
                    <video
                      src={item.fileUrl}
                      controls
                      playsInline
                      preload="metadata"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <img
                      src={item.fileUrl}
                      alt={item.name}
                      className="h-full w-full object-contain"
                    />
                  )}
                </div>

                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words font-semibold text-slate-900">
                        {item.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.fileType === "video" ? "Vidéo" : "Image"}
                        {item.durationSeconds
                          ? ` · ${item.durationSeconds} s`
                          : ""}
                      </p>
                    </div>

                    <MediaStatus status={item.status} />
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                    <p className="text-xs text-slate-400">
                      Ajouté le {formatDate(item.createdAt)}
                    </p>
                    <button
                      type="button"
                      onClick={() => void deleteMedia(item.id)}
                      disabled={deletingId === item.id}
                      className="min-h-9 rounded-lg px-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingId === item.id ? "Suppression…" : "Supprimer"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
