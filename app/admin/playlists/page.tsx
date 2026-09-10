"use client";

import { useEffect, useState } from "react";

interface Media {
  id: string;
  name: string;
  fileUrl: string;
  fileType: string;
  durationSeconds: number;
  advertiser: { companyName: string } | null;
}

interface PlaylistItem {
  id: string;
  position: number;
  durationSeconds: number;
  media: {
    id: string;
    name: string;
    fileType: string;
  };
}

interface Screen {
  id: string;
  screenCode: string;
  name: string | null;
  status: string;
  location: {
    name: string;
    partner: { businessName: string } | null;
  } | null;
  player: { deviceId: string; status: string } | null;
  playlists: {
    id: string;
    status: string;
    version: number | string;
    items: PlaylistItem[];
  }[];
}

type PlaylistEditorItem = {
  mediaId: string;
  durationSeconds: number;
  mediaName: string;
  fileType: string;
};

export default function AdminPlaylistsPage() {
  const [screens, setScreens] = useState<Screen[]>([]);
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [selectedScreenId, setSelectedScreenId] = useState("");
  const [playlistItems, setPlaylistItems] = useState<PlaylistEditorItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);

      const [screensResponse, mediaResponse] = await Promise.all([
        fetch("/api/admin/screens", { cache: "no-store" }),
        fetch("/api/admin/media", { cache: "no-store" }),
      ]);

      if (!screensResponse.ok) {
        throw new Error("Impossible de charger les écrans");
      }

      if (!mediaResponse.ok) {
        throw new Error("Impossible de charger les médias");
      }

      const screensData = await screensResponse.json();
      const mediaData = await mediaResponse.json();

      setScreens(Array.isArray(screensData) ? screensData : []);
      setMediaList(Array.isArray(mediaData) ? mediaData : []);
    } catch (error) {
      console.error("Erreur chargement playlists :", error);
      setSaveError(
        error instanceof Error
          ? error.message
          : "Impossible de charger les données"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getActivePlaylist = (screen: Screen) => {
    return (
      screen.playlists?.find(
        (playlist) => playlist.status === "ACTIVE"
      ) ?? screen.playlists?.[0]
    );
  };

  const loadPlaylist = (screenId: string) => {
    setSaveError("");
    setSaveSuccess(false);

    const screen = screens.find((item) => item.id === screenId);

    if (!screen) {
      setPlaylistItems([]);
      setSelectedScreenId("");
      return;
    }

    const playlist = getActivePlaylist(screen);

    if (playlist?.items && Array.isArray(playlist.items)) {
      const sortedItems = [...playlist.items].sort(
        (a, b) => a.position - b.position
      );

      setPlaylistItems(
        sortedItems.map((item) => ({
          mediaId: item.media.id,
          durationSeconds: item.durationSeconds,
          mediaName: item.media.name,
          fileType: item.media.fileType,
        }))
      );
    } else {
      setPlaylistItems([]);
    }

    setSelectedScreenId(screenId);
  };

  const addToPlaylist = (media: Media) => {
    if (!selectedScreenId) {
      setSaveError(
        "Sélectionnez d'abord un écran avant d'ajouter un média"
      );
      return;
    }

    setSaveError("");
    setSaveSuccess(false);

    setPlaylistItems((previous) => [
      ...previous,
      {
        mediaId: media.id,
        durationSeconds:
          Number.isInteger(media.durationSeconds) &&
          media.durationSeconds > 0
            ? media.durationSeconds
            : 15,
        mediaName: media.name,
        fileType: media.fileType,
      },
    ]);
  };

  const removeFromPlaylist = (index: number) => {
    setSaveSuccess(false);

    setPlaylistItems((previous) =>
      previous.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  const updateDuration = (index: number, duration: number) => {
    setSaveSuccess(false);

    const safeDuration = Math.min(
      300,
      Math.max(1, Number.isFinite(duration) ? duration : 15)
    );

    setPlaylistItems((previous) =>
      previous.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              durationSeconds: safeDuration,
            }
          : item
      )
    );
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;

    if (newIndex < 0 || newIndex >= playlistItems.length) {
      return;
    }

    setSaveSuccess(false);

    setPlaylistItems((previous) => {
      const copy = [...previous];
      const [removed] = copy.splice(index, 1);

      if (!removed) {
        return previous;
      }

      copy.splice(newIndex, 0, removed);

      return copy;
    });
  };

  const savePlaylist = async () => {
    if (!selectedScreenId) {
      setSaveError("Aucun écran sélectionné");
      return;
    }

    if (playlistItems.length === 0) {
      setSaveError("La playlist ne peut pas être vide");
      return;
    }

    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);

    try {
      const response = await fetch(
        `/api/admin/screens/${selectedScreenId}/playlist`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items: playlistItems.map((item) => ({
              mediaId: item.mediaId,
              durationSeconds: Math.min(
                300,
                Math.max(1, Math.round(item.durationSeconds))
              ),
            })),
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error || `Erreur serveur ${response.status}`
        );
      }

      setSaveSuccess(true);

      const updatedResponse = await fetch(
        "/api/admin/screens",
        { cache: "no-store" }
      );

      if (updatedResponse.ok) {
        const updatedScreens = await updatedResponse.json();

        setScreens(
          Array.isArray(updatedScreens) ? updatedScreens : []
        );
      }
    } catch (error) {
      console.error("Erreur sauvegarde playlist :", error);

      setSaveError(
        error instanceof Error
          ? error.message
          : "Erreur lors de la sauvegarde"
      );
    } finally {
      setSaving(false);
    }
  };

  const selectedScreen = screens.find(
    (screen) => screen.id === selectedScreenId
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">
          Chargement...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-7xl mx-auto bg-gray-50 p-8">
      <h1 className="mb-2 text-3xl font-bold">
        Lier les Médias aux Écrans
      </h1>

      <p className="mb-8 text-gray-500">
        Sélectionnez un écran, composez sa playlist, puis sauvegardez.
      </p>

      {saveError && !selectedScreenId && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {saveError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">
            Écrans ({screens.length})
          </h2>

          <div className="max-h-[70vh] space-y-2 overflow-y-auto">
            {screens.map((screen) => (
              <button
                key={screen.id}
                type="button"
                onClick={() => loadPlaylist(screen.id)}
                className={`w-full rounded-lg border p-3 text-left transition ${
                  selectedScreenId === screen.id
                    ? "border-blue-300 bg-blue-50 ring-1 ring-blue-300"
                    : "border-gray-200 bg-white hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">
                    {screen.name || screen.screenCode}
                  </span>

                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      screen.status === "ONLINE"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {screen.status}
                  </span>
                </div>

                <p className="mt-1 text-xs text-gray-400">
                  {screen.location?.partner?.businessName ||
                    "Sans partenaire"}
                  {" • "}
                  {screen.location?.name || "Sans emplacement"}
                </p>

                {screen.player && (
                  <p className="mt-0.5 text-[10px] text-gray-400">
                    Player: {screen.player.deviceId}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">
            Playlist
            {selectedScreen
              ? ` — ${
                  selectedScreen.name ||
                  selectedScreen.screenCode
                }`
              : ""}
          </h2>

          {!selectedScreenId ? (
            <div className="py-12 text-center text-sm text-gray-400">
              Sélectionnez un écran pour voir sa playlist
            </div>
          ) : playlistItems.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">
              Aucun média dans cette playlist
            </div>
          ) : (
            <div className="max-h-[50vh] space-y-2 overflow-y-auto">
              {playlistItems.map((item, index) => (
                <div
                  key={`${item.mediaId}-${index}`}
                  className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3"
                >
                  <span className="w-5 text-xs font-bold text-gray-400">
                    {index + 1}
                  </span>

                  <div className="h-16 w-24 shrink-0 overflow-hidden rounded-md border bg-gray-100">
                    {(() => {
                      const media = mediaList.find(
                        (entry) => entry.id === item.mediaId
                      );

                      if (!media?.fileUrl) {
                        return (
                          <div className="flex h-full items-center justify-center text-[10px] text-gray-400">
                            Aucun aperçu
                          </div>
                        );
                      }

                      if (item.fileType === "video") {
                        return (
                          <video
                            src={media.fileUrl}
                            className="h-full w-full object-cover"
                            muted
                            playsInline
                            preload="metadata"
                          />
                        );
                      }

                      return (
                        <img
                          src={media.fileUrl}
                          alt={item.mediaName}
                          className="h-full w-full object-cover"
                        />
                      );
                    })()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {item.mediaName}
                    </p>

                    <p className="text-[10px] text-gray-400">
                      {item.fileType === "video"
                        ? "Vidéo"
                        : "Image"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-400">
                        Durée
                      </span>

                      <input
                        type="number"
                        min={1}
                        max={300}
                        value={item.durationSeconds}
                        onChange={(event) =>
                          updateDuration(
                            index,
                            parseInt(event.target.value, 10) || 15
                          )
                        }
                        className="w-14 rounded border px-1 py-0.5 text-center text-xs"
                      />

                      <span className="text-xs text-gray-400">
                        s
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => moveItem(index, -1)}
                      disabled={index === 0}
                      className="text-xs text-gray-400 hover:text-gray-700 disabled:opacity-30"
                      title="Monter"
                    >
                      ↑
                    </button>

                    <button
                      type="button"
                      onClick={() => moveItem(index, 1)}
                      disabled={
                        index === playlistItems.length - 1
                      }
                      className="text-xs text-gray-400 hover:text-gray-700 disabled:opacity-30"
                      title="Descendre"
                    >
                      ↓
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        removeFromPlaylist(index)
                      }
                      className="ml-1 text-xs text-red-400 hover:text-red-600"
                      title="Supprimer"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedScreenId && (
            <div className="mt-4 space-y-2">
              {saveError && (
                <div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
                  {saveError}
                </div>
              )}

              {saveSuccess && (
                <div className="rounded border border-green-200 bg-green-50 p-2 text-sm text-green-700">
                  Playlist sauvegardée et activée !
                </div>
              )}

              <button
                type="button"
                onClick={savePlaylist}
                disabled={saving}
                className="w-full rounded-lg bg-blue-600 py-2.5 font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {saving
                  ? "Sauvegarde..."
                  : "Sauvegarder la playlist"}
              </button>
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">
            Médiathèque ({mediaList.length})
          </h2>

          {!selectedScreenId && (
            <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-700">
              Sélectionnez un écran avant d'ajouter des médias.
            </div>
          )}

          <div className="grid max-h-[70vh] grid-cols-1 gap-3 overflow-y-auto">
            {mediaList.map((media) => (
              <button
                key={media.id}
                type="button"
                onClick={() => addToPlaylist(media)}
                className="group text-left rounded-lg border border-gray-200 p-3 transition hover:border-blue-300 hover:bg-blue-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div
                      className={`mb-1 inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                        media.fileType === "video"
                          ? "bg-gray-800 text-white"
                          : "bg-green-600 text-white"
                      }`}
                    >
                      {media.fileType === "video"
                        ? "VIDÉO"
                        : "IMAGE"}
                    </div>

                    <p className="text-sm font-medium transition group-hover:text-blue-700">
                      {media.name}
                    </p>

                    <p className="mt-0.5 text-[10px] text-gray-400">
                      {media.advertiser?.companyName ||
                        "Sans annonceur"}
                    </p>
                  </div>

                  <span className="text-lg text-blue-600 opacity-0 transition group-hover:opacity-100">
                    +
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

