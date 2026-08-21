"use client";

import { useEffect, useState, useCallback } from "react";

interface MediaItem {
  id: string;
  name: string;
  fileUrl: string;
  fileType: string;
  mimeType: string;
  durationSeconds: number;
  status: string;
  createdAt: string;
}

export default function MediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    fileUrl: "",
    fileType: "video",
    mimeType: "",
    durationSeconds: 15,
    widthPx: null as number | null,
    heightPx: null as number | null,
    fileSizeBytes: null as number | null,
  });

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = () => {
    fetch("/api/media")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setMedia(data);
        }

        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const resetForm = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setShowForm(false);
    setPreviewUrl(null);

    setForm({
      name: "",
      fileUrl: "",
      fileType: "video",
      mimeType: "",
      durationSeconds: 15,
      widthPx: null,
      heightPx: null,
      fileSizeBytes: null,
    });
  };

  const handleDrag = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (
        e.type === "dragenter" ||
        e.type === "dragover"
      ) {
        setDragActive(true);
      }

      if (e.type === "dragleave") {
        setDragActive(false);
      }
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setDragActive(false);

      if (e.dataTransfer.files?.[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    []
  );

  const handleFileInput = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files?.[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const url = URL.createObjectURL(file);

    setPreviewUrl(url);

    const isVideo = file.type.startsWith("video/");

    setForm((prev) => ({
      ...prev,
      name: file.name.replace(/\.[^/.]+$/, ""),
      fileType: isVideo ? "video" : "image",
      mimeType: file.type,
      fileSizeBytes: file.size,
    }));

    setShowForm(true);

    uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);

    const fd = new FormData();

    fd.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();

      if (!res.ok) {
        alert(
          data.error || "Erreur d'upload"
        );

        return;
      }

      setForm((prev) => ({
        ...prev,
        fileUrl: data.url,
        mimeType: data.type || file.type,
        fileSizeBytes: data.size || file.size,
      }));

      setUploadProgress(100);
    } catch (error) {
      console.error("Erreur upload:", error);

      alert(
        "Erreur réseau lors de l'upload"
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!form.fileUrl) {
      alert(
        "Veuillez d'abord uploader un fichier"
      );

      return;
    }

    if (!form.mimeType) {
      alert(
        "Type MIME du fichier introuvable"
      );

      return;
    }

    try {
      const res = await fetch("/api/media", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(
          "Erreur API media:",
          data
        );

        alert(
          data.error ||
            "Erreur lors de l'enregistrement"
        );

        return;
      }

      resetForm();

      fetchMedia();

      alert(
        "Média enregistré avec succès !"
      );
    } catch (error) {
      console.error(
        "Erreur enregistrement:",
        error
      );

      alert(
        "Erreur réseau lors de l'enregistrement"
      );
    }
  };

  const deleteMedia = async (id: string) => {
    if (!confirm("Supprimer ce média ?")) {
      return;
    }

    const res = await fetch(
      `/api/media/${id}`,
      {
        method: "DELETE",
      }
    );

    if (res.ok) {
      fetchMedia();
    } else {
      alert(
        "Impossible de supprimer"
      );
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        Chargement...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          Médiathèque
        </h1>

        <button
          onClick={() =>
            setShowForm(!showForm)
          }
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          {showForm
            ? "Fermer"
            : "+ Ajouter un média"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4 max-w-xl">

          {!form.fileUrl && (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
                dragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 bg-gray-50"
              }`}
            >
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime,image/jpeg,image/png,image/webp"
                onChange={handleFileInput}
                className="hidden"
                id="file-upload"
              />

              <label
                htmlFor="file-upload"
                className="cursor-pointer"
              >
                <p className="text-sm text-gray-600">
                  {dragActive
                    ? "Déposez le fichier ici"
                    : "Glissez-déposez ou cliquez pour choisir"}
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  MP4, WebM, MOV, JPG, PNG, WebP — max 50 MB
                </p>
              </label>
            </div>
          )}

          {previewUrl && (
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              {form.fileType ===
              "video" ? (
                <video
                  src={previewUrl}
                  controls
                  className="w-full h-full object-contain"
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          )}

          {uploading && (
            <div className="space-y-1">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{
                    width: `${uploadProgress}%`,
                  }}
                />
              </div>

              <p className="text-xs text-gray-500 text-center">
                Upload en cours...
              </p>
            </div>
          )}

          {form.fileUrl && (
            <p className="text-xs text-green-600 text-center">
              ✓ Fichier uploadé
            </p>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom *
              </label>

              <input
                type="text"
                required
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>

                <select
                  value={form.fileType}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      fileType:
                        e.target.value,
                    })
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="video">
                    Vidéo
                  </option>

                  <option value="image">
                    Image
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Durée (sec)
                </label>

                <input
                  type="number"
                  min={1}
                  value={
                    form.durationSeconds
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      durationSeconds:
                        Number(
                          e.target.value
                        ),
                    })
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={
                  !form.fileUrl ||
                  uploading
                }
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                Enregistrer dans la médiathèque
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {media.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-400">
          Aucun média. Ajoutez votre premier
          spot publicitaire.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {media.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-xl border shadow-sm overflow-hidden"
            >
              <div className="aspect-video bg-gray-100 flex items-center justify-center">
                {m.fileType ===
                "video" ? (
                  <video
                    src={m.fileUrl}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={m.fileUrl}
                    alt={m.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      m.fileType ===
                      "video"
                        ? "bg-gray-800 text-white"
                        : "bg-green-600 text-white"
                    }`}
                  >
                    {m.fileType ===
                    "video"
                      ? "VIDÉO"
                      : "IMAGE"}
                  </span>

                  <button
                    onClick={() =>
                      deleteMedia(m.id)
                    }
                    className="text-red-400 hover:text-red-600 text-xs"
                  >
                    Supprimer
                  </button>
                </div>

                <p className="font-medium text-sm mt-2 truncate">
                  {m.name}
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  {m.durationSeconds}s •{" "}
                  {m.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}