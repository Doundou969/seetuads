# app/player/player-view.tsx

```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

interface PlaylistItem {
  id: string;
  position: number;
  durationSeconds: number;
  media: {
    id: string;
    name: string;
    fileUrl: string;
    fileType: string;
  };
}

export default function PlayerView() {
  const searchParams = useSearchParams();

  const deviceId = searchParams.get("deviceId");
  const playerKey = searchParams.get("key");

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [items, setItems] = useState<PlaylistItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const startTimeRef = useRef<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /*
   * ============================================================
   * FETCH PLAYLIST
   * ============================================================
   */

  const fetchPlaylist = useCallback(async () => {
    if (!deviceId || !playerKey) return;

    try {
      const res = await fetch(
        `/api/player/playlist?deviceId=${encodeURIComponent(deviceId)}`,
        {
          method: "GET",
          cache: "no-store",
          headers: {
            "X-Player-Key": playerKey,
          },
        }
      );

      if (!res.ok) {
        throw new Error(`Playlist API error: ${res.status}`);
      }

      const data = await res.json();

      const playlistItems: PlaylistItem[] = Array.isArray(
        data.playlist?.items
      )
        ? data.playlist.items
        : [];

      if (playlistItems.length > 0) {
        setItems((previousItems) => {
          const newIds = playlistItems.map((item) => item.id).join(",");
          const oldIds = previousItems.map((item) => item.id).join(",");

          if (newIds !== oldIds) {
            setCurrentIndex(0);
          }

          return playlistItems;
        });

        setError("");
      } else {
        setItems([]);
        setError("Aucune playlist active");
      }
    } catch (err) {
      console.error("Erreur playlist:", err);

      setError((previousError) => {
        if (items.length === 0) {
          return "Erreur de connexion au serveur";
        }

        return previousError;
      });
    } finally {
      setLoading(false);
    }
  }, [deviceId, playerKey, items.length]);

  /*
   * ============================================================
   * PLAYLIST INITIALE + SYNCHRONISATION
   * ============================================================
   */

  useEffect(() => {
    fetchPlaylist();

    const interval = setInterval(() => {
      fetchPlaylist();
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchPlaylist]);

  /*
   * ============================================================
   * HEARTBEAT
   * ============================================================
   */

  useEffect(() => {
    if (!deviceId || !playerKey) return;

    const sendHeartbeat = async () => {
      try {
        await fetch("/api/player/heartbeat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Player-Key": playerKey,
          },
          body: JSON.stringify({
            deviceId,
          }),
        });
      } catch (err) {
        console.error("Heartbeat error:", err);
      }
    };

    sendHeartbeat();

    const interval = setInterval(() => {
      sendHeartbeat();
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [deviceId, playerKey]);


  /*
   * ============================================================
   * CURRENT ITEM
   * ============================================================
   */

  const currentItem = items[currentIndex];

  /*
   * ============================================================
   * PRECHARGER LE MEDIA SUIVANT
   * ============================================================
   */

  useEffect(() => {
    if (items.length < 2) return;

    const nextIndex = (currentIndex + 1) % items.length;
    const nextItem = items[nextIndex];

    if (!nextItem?.media?.fileUrl) return;

    if (nextItem.media.fileType === "video") {
      const video = document.createElement("video");

      video.src = nextItem.media.fileUrl;
      video.preload = "auto";
      video.muted = true;
      video.load();
    } else {
      const image = new Image();

      image.src = nextItem.media.fileUrl;
    }
  }, [items, currentIndex]);

  /*
   * ============================================================
   * LOG PLAYBACK
   * ============================================================
   */

  const logPlayback = useCallback(
    async (
      startedAt: Date,
      duration: number,
      status: "PLAYED" | "FAILED" | "INTERRUPTED" | "SKIPPED" = "PLAYED"
    ) => {
      if (!deviceId || !playerKey || !currentItem) {
        console.warn("Playback log ignorÃ© : donnÃ©es manquantes", {
          deviceId,
          hasPlayerKey: Boolean(playerKey),
          hasCurrentItem: Boolean(currentItem),
        });

        return;
      }

      const payload = {
        deviceId,
        mediaId: currentItem.media.id,
        startedAt: startedAt.toISOString(),
        endedAt: new Date().toISOString(),
        durationSeconds: Math.max(0, Math.round(duration)),
        status,
      };

      try {
        console.log("Envoi playback log :", payload);

        const response = await fetch("/api/player/log", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Player-Key": playerKey,
          },
          body: JSON.stringify(payload),
        });

        const responseText = await response.text();

        if (!response.ok) {
          console.error("Erreur playback log :", {
            status: response.status,
            response: responseText,
            payload,
          });

          return;
        }

        console.log("Playback log enregistrÃ© :", responseText);
      } catch (err) {
        console.error("Erreur rÃ©seau playback log :", err);
      }
    },
    [deviceId, playerKey, currentItem]
  );

  /*
   * ============================================================
   * PASSER AU MEDIA SUIVANT
   * ============================================================
   */

  const goNext = useCallback(() => {
    if (items.length === 0) return;

    setCurrentIndex((previousIndex) => {
      return (previousIndex + 1) % items.length;
    });
  }, [items.length]);

  /*
   * ============================================================
   * TIMER IMAGE
   * ============================================================
   */

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!currentItem) {
      return;
    }

    // Les vidÃ©os sont gÃ©rÃ©es par onEnded.
    if (currentItem.media.fileType === "video") {
      return;
    }

    const startedAt = new Date();

    startTimeRef.current = startedAt;

    const durationSeconds =
      currentItem.durationSeconds > 0
        ? currentItem.durationSeconds
        : 15;

    timerRef.current = setTimeout(() => {
      const duration =
        (Date.now() - startedAt.getTime()) / 1000;

      logPlayback(startedAt, duration, "PLAYED");

      goNext();
    }, durationSeconds * 1000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentItem, goNext, logPlayback]);

  /*
   * ============================================================
   * REINITIALISER UNE VIDEO QUAND L'INDEX CHANGE
   * ============================================================
   */

  useEffect(() => {
    if (!currentItem) return;

    if (currentItem.media.fileType !== "video") {
      return;
    }

    startTimeRef.current = null;

    const video = videoRef.current;

    if (!video) return;

    video.currentTime = 0;

    video.play().catch((error) => {
      console.warn("Autoplay bloquÃ©:", error);
    });
  }, [currentItem]);

  /*
   * ============================================================
   * URL / PARAMETRES MANQUANTS
   * ============================================================
   */

  if (!deviceId || !playerKey) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="mb-4 text-2xl font-bold">
            Player SeetuAds
          </div>

          <div className="text-lg text-red-400">
            ParamÃ¨tres manquants
          </div>

          <div className="mt-4 text-sm text-gray-400">
            Ajoutez ?deviceId=VOTRE_ID&key=VOTRE_PLAYER_KEY
          </div>
        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="text-2xl">
            Chargement de SeetuAds...
          </div>

          <div className="mt-3 text-sm text-gray-500">
            Connexion au serveur Player
          </div>
        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * ERREUR / PLAYLIST VIDE
   * ============================================================
   */

  if (error && items.length === 0) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="mb-4 text-2xl">
            {error}
          </div>

          <div className="text-sm text-gray-500">
            Reconnexion automatique toutes les 30 secondes...
          </div>

          <div className="mt-6 text-xs text-gray-700">
            Device: {deviceId}
          </div>
        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * PLAYER
   * ============================================================
   */

  return (
    <div
      ref={containerRef}
      className="relative flex h-screen w-screen cursor-none items-center justify-center overflow-hidden bg-black"
      onClick={goFullscreen}
    >
      {!document.fullscreenElement && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            goFullscreen();
          }}
          className="absolute right-4 top-4 z-50 rounded bg-black/60 px-4 py-2 text-sm text-white"
        >
          Plein Ã©cran
        </button>
      )}

      {currentItem?.media.fileType === "video" ? (
        <video
          ref={videoRef}
          key={currentItem.id}
          src={currentItem.media.fileUrl}
          autoPlay
          muted
          playsInline
          preload="auto"
          className="h-full w-full object-contain"
          onPlay={() => {
            startTimeRef.current = new Date();
          }}
          onEnded={() => {
            const startedAt = startTimeRef.current;

            if (startedAt) {
              const duration =
                (Date.now() - startedAt.getTime()) / 1000;

              logPlayback(startedAt, duration, "PLAYED");
            }

            startTimeRef.current = null;

            goNext();
          }}
          onError={(event) => {
            console.error(
              "Erreur lecture vidÃ©o:",
              event
            );

            const startedAt =
              startTimeRef.current ?? new Date();

            const duration =
              startTimeRef.current
                ? Math.max(
                    0,
                    (Date.now() -
                      startTimeRef.current.getTime()) /
                      1000
                  )
                : 0;

            logPlayback(
              startedAt,
              duration,
              "FAILED"
            );

            startTimeRef.current = null;

            setTimeout(() => {
              goNext();
            }, 3000);
          }}
        />
      ) : (
        <img
          key={currentItem?.id}
          src={currentItem?.media.fileUrl}
          alt={currentItem?.media.name || "SeetuAds"}
          className="h-full w-full object-contain"
          onError={(event) => {
            console.error(
              "Erreur chargement image:",
              event
            );

            const startedAt =
              startTimeRef.current ?? new Date();

            logPlayback(
              startedAt,
              0,
              "FAILED"
            );

            startTimeRef.current = null;

            setTimeout(() => {
              goNext();
            }, 3000);
          }}
        />
      )}
    </div>
  );
}
```


