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
    items: {
      id: string;
      position: number;
      durationSeconds: number;
      media: { id: string; name: string; fileType: string };
    }[];
  }[];
}

export default function AdminPlaylistsPage() {
  const [screens, setScreens] = useState<Screen[]>([]);
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [selectedScreenId, setSelectedScreenId] = useState<string>("");
  const [playlistItems, setPlaylistItems] = useState<
    { mediaId: string; durationSeconds: number; mediaName: string; fileType: string }[]
  >([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/screens").then((r) => r.json()),
      fetch("/api/admin/media").then((r) => r.json()),
    ])
      .then(([s, m]) => {
        setScreens(s);
        setMediaList(m);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const loadPlaylist = (screenId: string) => {
    setSaveError("");
    setSaveSuccess(false);
    const screen = screens.find((s) => s.id === screenId);
    if (screen?.playlists?.[0]?.items) {
      setPlaylistItems(
        screen.playlists[0].items.map((i) => ({
          mediaId: i.media.id,
          durationSeconds: i.durationSeconds,
          mediaName: i.media.name,
          fileType: i.media.fileType,
        }))
      );
    } else {
      setPlaylistItems([]);
    }
    setSelectedScreenId(screenId);
  };

  const addToPlaylist = (media: Media) => {
    setSaveSuccess(false);
    setPlaylistItems((prev) => [
      ...prev,
      {
        mediaId: media.id,
        durationSeconds: media.fileType === "video" ? media.durationSeconds || 15 : media.durationSeconds || 15,
        mediaName: media.name,
        fileType: media.fileType,
      },
    ]);
  };

  const removeFromPlaylist = (index: number) => {
    setPlaylistItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateDuration = (index: number, duration: number) => {
    setPlaylistItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, durationSeconds: duration } : item))
    );
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= playlistItems.length) return;
    setPlaylistItems((prev) => {
      const copy = [...prev];
      const [removed] = copy.splice(index, 1);
      copy.splice(newIndex, 0, removed);
      return copy;
    });
  };

  const savePlaylist = async () => {
    if (!selectedScreenId) return;
    if (playlistItems.length === 0) {
      setSaveError("La playlist ne peut pas être vide");
      return;
    }
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);

    try {
      const res = await fetch(`/api/admin/screens/${selectedScreenId}/playlist`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: playlistItems.map((item) => ({
            mediaId: item.mediaId,
            durationSeconds: item.durationSeconds,
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Erreur ${res.status}`);
      }

      setSaveSuccess(true);
      // Rafraîchir la liste des écrans
      const updated = await fetch("/api/admin/screens").then((r) => r.json());
      setScreens(updated);
    } catch (err: any) {
      setSaveError(err.message || "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const selectedScreen = screens.find((s) => s.id === selectedScreenId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-xl text-gray-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-2">Relier les Médias aux Écrans</h1>
      <p className="text-gray-500 mb-8">Sélectionne un écran, compose sa playlist, puis sauvegarde.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Écrans */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h2 className="text-lg font-semibold mb-4">Écrans ({screens.length})</h2>
          <div className="space-y-2 max-h-[70vh] overflow-y-auto">
            {screens.map((screen) => (
              <button
                key={screen.id}
                onClick={() => loadPlaylist(screen.id)}
                className={`w-full text-left p-3 rounded-lg border transition ${
                  selectedScreenId === screen.id
                    ? "bg-blue-50 border-blue-300 ring-1 ring-blue-300"
                    : "bg-white hover:bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{screen.name || screen.screenCode}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    screen.status === "ONLINE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                  }`}>{screen.status}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {screen.location?.partner?.businessName || "Sans partenaire"} • {screen.location?.name}
                </p>
                {screen.player && (
                  <p className="text-[10px] text-gray-400 mt-0.5">Player: {screen.player.deviceId}</p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Playlist */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h2 className="text-lg font-semibold mb-4">
            Playlist {selectedScreen ? `— ${selectedScreen.name || selectedScreen.screenCode}` : ""}
          </h2>

          {!selectedScreenId ? (
            <div className="text-gray-400 text-sm text-center py-12">Sélectionne un écran pour voir sa playlist</div>
          ) : playlistItems.length === 0 ? (
            <div className="text-gray-400 text-sm text-center py-12">Aucun média dans cette playlist</div>
          ) : (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {playlistItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-xs font-bold text-gray-400 w-5">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.mediaName}</p>
                    <p className="text-[10px] text-gray-400">{item.fileType === "video" ? "Vidéo" : "Image"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.fileType !== "video" && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">Durée</span>
                        <input
                          type="number"
                          min={1}
                          value={item.durationSeconds}
                          onChange={(e) => updateDuration(idx, parseInt(e.target.value) || 15)}
                          className="w-14 text-xs border rounded px-1 py-0.5 text-center"
                        />
                        <span className="text-xs text-gray-400">s</span>
                      </div>
                    )}
                    <button onClick={() => moveItem(idx, -1)} disabled={idx === 0} className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs">↑</button>
                    <button onClick={() => moveItem(idx, 1)} disabled={idx === playlistItems.length - 1} className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs">↓</button>
                    <button onClick={() => removeFromPlaylist(idx)} className="text-red-400 hover:text-red-600 text-xs ml-1">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedScreenId && (
            <div className="mt-4 space-y-2">
              {saveError && (
                <div className="bg-red-50 text-red-700 text-sm p-2 rounded border border-red-200">{saveError}</div>
              )}
              {saveSuccess && (
                <div className="bg-green-50 text-green-700 text-sm p-2 rounded border border-green-200">Playlist sauvegardée et activée !</div>
              )}
              <button
                onClick={savePlaylist}
                disabled={saving}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition"
              >
                {saving ? "Sauvegarde..." : "Sauvegarder la playlist"}
              </button>
            </div>
          )}
        </div>

        {/* Médiathèque */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h2 className="text-lg font-semibold mb-4">Médiathèque ({mediaList.length})</h2>
          <div className="grid grid-cols-1 gap-3 max-h-[70vh] overflow-y-auto">
            {mediaList.map((m) => (
              <button
                key={m.id}
                onClick={() => addToPlaylist(m)}
                className="text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded mb-1 ${
                      m.fileType === "video" ? "bg-gray-800 text-white" : "bg-green-600 text-white"
                    }`}>{m.fileType === "video" ? "VIDÉO" : "IMAGE"}</div>
                    <p className="text-sm font-medium group-hover:text-blue-700 transition">{m.name}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{m.advertiser?.companyName || "Sans annonceur"}</p>
                  </div>
                  <span className="text-blue-600 text-lg opacity-0 group-hover:opacity-100 transition">+</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}