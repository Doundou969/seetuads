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

type PlaybackStatus = "PLAYED" | "FAILED" | "INTERRUPTED" | "SKIPPED";

const DEFAULT_DURATION_SECONDS = 15;
const VIDEO_WATCHDOG_MIN_SECONDS = 30;
const VIDEO_WATCHDOG_EXTRA_SECONDS = 30;
const MEDIA_ERROR_DELAY_MS = 3000;
const PLAYLIST_REFRESH_MS = 60000;
const HEARTBEAT_INTERVAL_MS = 60000;

const PENDING_LOGS_KEY = "seetuads_pending_playback_logs";

function getPendingLogs(): any[] {
  try {
    const raw = localStorage.getItem(PENDING_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePendingLogs(logs: any[]) {
  try {
    localStorage.setItem(PENDING_LOGS_KEY, JSON.stringify(logs));
  } catch (err) {
    console.warn("Impossible de sauvegarder les logs en attente :", err);
  }
}

function queuePendingLog(payload: unknown, playerKey: string) {
  const logs = getPendingLogs();
  logs.push({ payload, playerKey, queuedAt: new Date().toISOString() });
  savePendingLogs(logs);
  console.log("Log playback mis en file d'attente (hors ligne) :", payload);
}

async function flushPendingLogs() {
  const logs = getPendingLogs();

  if (logs.length === 0) {
    return;
  }

  const remaining: typeof logs = [];

  for (const entry of logs) {
    try {
      const response = await fetch("/api/player/log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Player-Key": entry.playerKey,
        },
        body: JSON.stringify(entry.payload),
      });

      if (!response.ok) {
        remaining.push(entry);
      }
    } catch {
      remaining.push(entry);
    }
  }

  savePendingLogs(remaining);

  if (remaining.length !== logs.length) {
    console.log(
      "Logs en attente envoyes :",
      logs.length - remaining.length,
      "restants :",
      remaining.length
    );
  }
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [screenOrientation, setScreenOrientation] = useState<string>("landscape");
  const [needsRotation, setNeedsRotation] = useState(false);

  useEffect(() => {
    const checkRotation = () => {
      const isWindowLandscape = window.innerWidth >= window.innerHeight;

      if (screenOrientation === "portrait" && isWindowLandscape) {
        setNeedsRotation(true);
      } else {
        setNeedsRotation(false);
      }
    };

    checkRotation();

    window.addEventListener("resize", checkRotation);

    return () => {
      window.removeEventListener("resize", checkRotation);
    };
  }, [screenOrientation]);

  const itemsRef = useRef<PlaylistItem[]>([]);
  const currentIndexRef = useRef(0);

  const startTimeRef = useRef<Date | null>(null);

  const imageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const watchdogTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const configuredDurationTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Verrouille une transition afin d'éviter :
   * - onEnded + timer
   * - onError + watchdog
   * - plusieurs événements simultanés
   */
  const transitionLockRef = useRef(false);

  /**
   * Identifiant de la session de lecture actuelle.
   * Tout événement provenant d'une ancienne session est ignoré.
   */
  const playbackSessionRef = useRef(0);

  /**
   * Empêche plusieurs logs PLAYED/FAILED pour une même session.
   */
  const loggedSessionRef = useRef<number | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      console.warn("Service Worker non supporte sur ce navigateur.");
      return;
    }

    navigator.serviceWorker
      .register("/sw-player.js")
      .then((registration) => {
        console.log("Service Worker enregistre :", registration.scope);
      })
      .catch((err) => {
        console.error("Erreur enregistrement Service Worker :", err);
      });

    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().then((granted) => {
        console.log("Stockage persistant accorde :", granted);
      });
    }
  }, []);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  /**
   * ============================================================
   * OUTILS
   * ============================================================
   */

  const getDurationSeconds = useCallback((item: PlaylistItem) => {
    if (
      Number.isFinite(item.durationSeconds) &&
      item.durationSeconds > 0
    ) {
      return item.durationSeconds;
    }

    return DEFAULT_DURATION_SECONDS;
  }, []);

  const playlistSignature = useCallback(
    (playlistItems: PlaylistItem[]) => {
      return playlistItems
        .filter(
          (item) =>
            item &&
            item.id &&
            item.media &&
            item.media.id &&
            item.media.fileUrl &&
            item.media.fileType
        )
        .map((item) =>
          [
            item.id,
            item.position ?? 0,
            item.durationSeconds ?? DEFAULT_DURATION_SECONDS,
            item.media.id,
            item.media.fileUrl,
            item.media.fileType,
          ].join("|")
        )
        .join("||");
    },
    []
  );

  const clearPlaybackTimers = useCallback(() => {
    if (imageTimerRef.current) {
      clearTimeout(imageTimerRef.current);
      imageTimerRef.current = null;
    }

    if (watchdogTimerRef.current) {
      clearTimeout(watchdogTimerRef.current);
      watchdogTimerRef.current = null;
    }

    if (configuredDurationTimerRef.current) {
      clearTimeout(configuredDurationTimerRef.current);
      configuredDurationTimerRef.current = null;
    }

    if (errorDelayTimerRef.current) {
      clearTimeout(errorDelayTimerRef.current);
      errorDelayTimerRef.current = null;
    }
  }, []);

  /**
   * ============================================================
   * FETCH PLAYLIST
   * ============================================================
   */

  const fetchPlaylist = useCallback(async () => {
    if (!deviceId || !playerKey) {
      return;
    }

    try {
      const response = await fetch(
        `/api/player/playlist?deviceId=${encodeURIComponent(deviceId)}`,
        {
          method: "GET",
          cache: "no-store",
          headers: {
            "X-Player-Key": playerKey,
          },
        }
      );

      if (response.status === 404) {
        clearPlaybackTimers();

        playbackSessionRef.current += 1;
        transitionLockRef.current = false;
        loggedSessionRef.current = null;
        startTimeRef.current = null;

        setItems([]);
        setCurrentIndex(0);
        setError("Aucune publicité active actuellement");

        return;
      }

      if (!response.ok) {
        throw new Error(
          `Playlist API error: ${response.status}`
        );
      }

      const data = await response.json();

      if (data.playlist?.orientation) {
        setScreenOrientation(data.playlist.orientation);
      }

      const rawPlaylistItems = Array.isArray(data.playlist?.items)
        ? data.playlist.items
        : [];

      const playlistItems: PlaylistItem[] =
        rawPlaylistItems.filter(
          (item: unknown): item is PlaylistItem => {
            if (!item || typeof item !== "object") {
              return false;
            }

            const playlistItem =
              item as Partial<PlaylistItem>;

            return Boolean(
              playlistItem.id &&
                playlistItem.media &&
                playlistItem.media.id &&
                playlistItem.media.fileUrl &&
                playlistItem.media.fileType
            );
          }
        );

      console.log("Playlist reçue :", {
        total: rawPlaylistItems.length,
        valides: playlistItems.length,
        invalides:
          rawPlaylistItems.length - playlistItems.length,
      });

      /**
       * Playlist non vide.
       */
      if (playlistItems.length > 0) {
        const previousItems = itemsRef.current;
        const previousIndex = currentIndexRef.current;

        const oldSignature =
          playlistSignature(previousItems);

        const newSignature =
          playlistSignature(playlistItems);

        /**
         * On ne touche pas à l'index si la playlist
         * est identique.
         */
        if (newSignature !== oldSignature) {
          const currentItemId =
            previousItems[previousIndex]?.id;

          const newCurrentIndex =
            playlistItems.findIndex(
              (item) => item.id === currentItemId
            );

          const safeIndex =
            newCurrentIndex >= 0
              ? newCurrentIndex
              : 0;

          console.log("Playlist mise à jour :", {
            previousItems: previousItems.length,
            newItems: playlistItems.length,
            currentItemId,
            newCurrentIndex: safeIndex,
          });

          setItems(playlistItems);
          setCurrentIndex(safeIndex);

          if (navigator.serviceWorker.controller) {
            const mediaUrls = playlistItems.map((item) => item.media.fileUrl);

            navigator.serviceWorker.controller.postMessage({
              type: "SET_PLAYLIST_URLS",
              urls: mediaUrls,
            });

            navigator.serviceWorker.controller.postMessage({
              type: "PREFETCH_URLS",
              urls: mediaUrls,
            });
          }
        }

        setError("");

        return;
      }

      /**
       * Playlist vide.
       */
      if (itemsRef.current.length > 0) {
        clearPlaybackTimers();

        playbackSessionRef.current += 1;
        transitionLockRef.current = false;
        loggedSessionRef.current = null;
        startTimeRef.current = null;
      }

      setItems([]);
      setCurrentIndex(0);
      setError("Aucune playlist active");
    } catch (err) {
      console.error("Erreur playlist :", err);

      /**
       * On ne remplace pas une playlist fonctionnelle
       * par un écran d'erreur à cause d'une erreur réseau
       * temporaire.
       */
      if (itemsRef.current.length === 0) {
        setError("Erreur de connexion au serveur");
      }
    } finally {
      setLoading(false);
    }
  }, [
    deviceId,
    playerKey,
    playlistSignature,
    clearPlaybackTimers,
  ]);

  /**
   * ============================================================
   * INITIALISATION + SYNCHRONISATION PLAYLIST
   * ============================================================
   */

  useEffect(() => {
    fetchPlaylist();

    const interval = setInterval(() => {
      fetchPlaylist();
    }, PLAYLIST_REFRESH_MS);

    return () => {
      clearInterval(interval);
    };
  }, [fetchPlaylist]);

  useEffect(() => {
    flushPendingLogs();

    const handleOnline = () => {
      console.log("Connexion retablie : envoi des logs en attente");
      flushPendingLogs();
    };

    window.addEventListener("online", handleOnline);

    const flushInterval = setInterval(() => {
      flushPendingLogs();
    }, 30000);

    return () => {
      window.removeEventListener("online", handleOnline);
      clearInterval(flushInterval);
    };
  }, []);

  /**
   * ============================================================
   * HEARTBEAT
   * ============================================================
   */

  useEffect(() => {
    if (!deviceId || !playerKey) {
      return;
    }

    const sendHeartbeat = async () => {
      try {
        const response = await fetch(
          "/api/player/heartbeat",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Player-Key": playerKey,
            },
            body: JSON.stringify({
              deviceId,
            }),
          }
        );

        if (!response.ok) {
          console.warn(
            "Heartbeat refusé :",
            response.status
          );
        }
      } catch (err) {
        console.error("Heartbeat error :", err);
      }
    };

    sendHeartbeat();

    const interval = setInterval(() => {
      sendHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, [deviceId, playerKey]);

  /**
   * ============================================================
   * CURRENT ITEM
   * ============================================================
   */

  const currentItem = items[currentIndex];

  /**
   * ============================================================
   * FULLSCREEN
   * ============================================================
   */

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        Boolean(document.fullscreenElement)
      );
    };

    handleFullscreenChange();

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );
    };
  }, []);

  const goFullscreen = useCallback(() => {
    const element = containerRef.current;

    if (!element) {
      return;
    }

    if (document.fullscreenElement) {
      return;
    }

    if (!document.fullscreenEnabled) {
      console.warn(
        "Le plein écran n'est pas disponible."
      );
      return;
    }

    element.requestFullscreen().catch((fullscreenError) => {
      console.warn(
        "Impossible d'activer le plein écran :",
        fullscreenError
      );
    });
  }, []);

  /**
   * ============================================================
   * PRÉCHARGEMENT DU MEDIA SUIVANT
   * ============================================================
   */

  useEffect(() => {
    if (items.length < 2) {
      return;
    }

    const nextIndex =
      (currentIndex + 1) % items.length;

    const nextItem = items[nextIndex];

    if (!nextItem?.media?.fileUrl) {
      return;
    }

    if (nextItem.media.fileType === "video") {
      const video = document.createElement("video");

      video.src = nextItem.media.fileUrl;
      video.preload = "auto";
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;

      video.load();

      return () => {
        video.pause();
        video.removeAttribute("src");
        video.load();
      };
    }

    const image = new Image();
    image.src = nextItem.media.fileUrl;
  }, [items, currentIndex]);

  /**
   * ============================================================
   * LOG PLAYBACK
   * ============================================================
   */

  const logPlayback = useCallback(
    async (
      item: PlaylistItem,
      startedAt: Date,
      duration: number,
      status: PlaybackStatus,
      sessionId: number
    ) => {
      /**
       * Une session ne peut être loggée qu'une seule fois.
       */
      if (loggedSessionRef.current === sessionId) {
        console.warn(
          "Playback log ignoré : session déjà enregistrée",
          {
            sessionId,
            mediaId: item.media.id,
            status,
          }
        );

        return;
      }

      if (!deviceId || !playerKey) {
        console.warn(
          "Playback log ignoré : player non identifié"
        );

        return;
      }

      /**
       * Verrouillage immédiat avant le fetch.
       */
      loggedSessionRef.current = sessionId;

      const payload = {
        deviceId,
        mediaId: item.media.id,
        startedAt: startedAt.toISOString(),
        endedAt: new Date().toISOString(),
        durationSeconds: Math.max(
          0,
          Math.round(duration)
        ),
        status,
      };

      try {
        console.log(
          "Envoi playback log :",
          payload
        );

        const response = await fetch(
          "/api/player/log",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Player-Key": playerKey,
            },
            body: JSON.stringify(payload),
          }
        );

        const responseText =
          await response.text();

        if (!response.ok) {
          console.error(
            "Erreur playback log :",
            {
              status: response.status,
              response: responseText,
              payload,
            }
          );

          return;
        }

        console.log(
          "Playback log enregistré :",
          responseText
        );
      } catch (err) {
        console.error(
          "Erreur réseau playback log :",
          err
        );

        queuePendingLog(payload, playerKey);
      }
    },
    [deviceId, playerKey]
  );

  /**
   * ============================================================
   * PASSAGE AU MEDIA SUIVANT
   * ============================================================
   */

  const finishCurrentItem = useCallback(
    async (
      item: PlaylistItem,
      sessionId: number,
      status: PlaybackStatus,
      startedAt?: Date | null
    ) => {
      /**
       * Ignore un ancien événement.
       */
      if (
        sessionId !==
        playbackSessionRef.current
      ) {
        console.warn(
          "Événement ignoré : ancienne session",
          {
            sessionId,
            currentSession:
              playbackSessionRef.current,
            media: item.media.name,
          }
        );

        return;
      }

      /**
       * Une seule transition à la fois.
       */
      if (transitionLockRef.current) {
        console.warn(
          "Transition ignorée : déjà en cours",
          {
            sessionId,
            media: item.media.name,
            status,
          }
        );

        return;
      }

      transitionLockRef.current = true;

      clearPlaybackTimers();

      const actualStartedAt =
        startedAt ??
        startTimeRef.current ??
        new Date();

      const elapsedDuration = Math.max(
        0,
        (Date.now() -
          actualStartedAt.getTime()) /
          1000
      );

      const configuredDuration =
        getDurationSeconds(item);

      /**
       * Pour une diffusion validée, on enregistre
       * la durée configurée de la publicité.
       *
       * Pour les erreurs/interruption, on conserve
       * la durée réellement observée.
       */
      const duration =
        status === "PLAYED"
          ? configuredDuration
          : elapsedDuration;

      console.log("Fin média :", {
        sessionId,
        media: item.media.name,
        status,
        duration,
      });

      await logPlayback(
        item,
        actualStartedAt,
        duration,
        status,
        sessionId
      );

      /**
       * Pendant l'appel réseau, la session peut
       * avoir été remplacée.
       */
      if (
        sessionId !==
        playbackSessionRef.current
      ) {
        return;
      }

      startTimeRef.current = null;

      /**
       * Nouvelle session pour le prochain média.
       */
      playbackSessionRef.current += 1;
      transitionLockRef.current = false;
      loggedSessionRef.current = null;

      const totalItems =
        itemsRef.current.length;

      if (totalItems === 0) {
        return;
      }

      setCurrentIndex((previousIndex) => {
        return (
          (previousIndex + 1) %
          totalItems
        );
      });
    },
    [
      clearPlaybackTimers,
      getDurationSeconds,
      logPlayback,
    ]
  );

  /**
   * ============================================================
   * NOUVELLE SESSION MEDIA
   * ============================================================
   */

  useEffect(() => {
    clearPlaybackTimers();

    transitionLockRef.current = false;
    loggedSessionRef.current = null;
    startTimeRef.current = null;

    if (!currentItem) {
      return;
    }

    playbackSessionRef.current += 1;

    console.log(
      "Nouvelle session média :",
      {
        sessionId:
          playbackSessionRef.current,
        itemId: currentItem.id,
        mediaId:
          currentItem.media.id,
        media: currentItem.media.name,
        type:
          currentItem.media.fileType,
      }
    );

    return () => {
      clearPlaybackTimers();
    };
  }, [
    currentItem,
    clearPlaybackTimers,
  ]);

  /**
   * ============================================================
   * LECTURE DES IMAGES
   * ============================================================
   */

  useEffect(() => {
    if (!currentItem) {
      return;
    }

    if (
      currentItem.media.fileType ===
      "video"
    ) {
      return;
    }

    const item = currentItem;
    const sessionId =
      playbackSessionRef.current;

    const startedAt = new Date();

    startTimeRef.current = startedAt;

    const durationSeconds =
      getDurationSeconds(item);

    console.log(
      "Image affichée :",
      item.media.name,
      "pendant",
      durationSeconds,
      "secondes",
      "session",
      sessionId
    );

    imageTimerRef.current =
      setTimeout(() => {
        if (
          sessionId !==
          playbackSessionRef.current
        ) {
          return;
        }

        finishCurrentItem(
          item,
          sessionId,
          "PLAYED",
          startedAt
        );
      }, durationSeconds * 1000);

    return () => {
      if (imageTimerRef.current) {
        clearTimeout(
          imageTimerRef.current
        );

        imageTimerRef.current = null;
      }
    };
  }, [
    currentItem,
    finishCurrentItem,
    getDurationSeconds,
  ]);

  /**
   * ============================================================
   * LANCEMENT AUTOMATIQUE DES VIDEOS
   * ============================================================
   */

  useEffect(() => {
    if (!currentItem) {
      return;
    }

    if (
      currentItem.media.fileType !==
      "video"
    ) {
      return;
    }

    const sessionId =
      playbackSessionRef.current;

    const video = videoRef.current;

    if (!video) {
      return;
    }

    let cancelled = false;

    const playVideo = async () => {
      if (cancelled) {
        return;
      }

      if (
        sessionId !==
        playbackSessionRef.current
      ) {
        return;
      }

      try {
        video.muted = true;
        video.defaultMuted = true;
        video.volume = 0;
        video.playsInline = true;

        await video.play();
      } catch (playError) {
        if (cancelled) {
          return;
        }

        if (
          playError instanceof DOMException &&
          playError.name === "AbortError"
        ) {
          return;
        }

        console.warn(
          "Impossible de démarrer la vidéo :",
          playError
        );
      }
    };

    const handleCanPlay = () => {
      playVideo();
    };

    if (
      video.readyState >=
      HTMLMediaElement.HAVE_FUTURE_DATA
    ) {
      playVideo();
    } else {
      video.addEventListener(
        "canplay",
        handleCanPlay,
        { once: true }
      );

      video.load();
    }

    return () => {
      cancelled = true;

      video.removeEventListener(
        "canplay",
        handleCanPlay
      );
    };
  }, [currentItem]);

  /**
   * ============================================================
   * NETTOYAGE GENERAL
   * ============================================================
   */

  useEffect(() => {
    return () => {
      clearPlaybackTimers();
    };
  }, [clearPlaybackTimers]);

  /**
   * ============================================================
   * PARAMETRES MANQUANTS
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
            Paramètres manquants
          </div>

          <div className="mt-4 text-sm text-gray-400">
            Ajoutez ?deviceId=VOTRE_ID&key=VOTRE_PLAYER_KEY
          </div>
        </div>
      </div>
    );
  }

  /**
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

  /**
   * ============================================================
   * PLAYLIST VIDE / ERREUR
   * ============================================================
   */

  if (
    error &&
    items.length === 0
  ) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="mb-4 text-2xl">
            {error}
          </div>

          <div className="text-sm text-gray-500">
            Synchronisation automatique toutes les 5 secondes...
          </div>

          <div className="mt-6 text-xs text-gray-700">
            Device: {deviceId}
          </div>
        </div>
      </div>
    );
  }

  /**
   * ============================================================
   * PLAYER
   * ============================================================
   */

  return (
    <div
      ref={containerRef}
      className="relative flex h-screen w-screen cursor-none items-center justify-center overflow-hidden bg-black"
      onClick={goFullscreen}
      style={
        needsRotation
          ? {
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vh",
              height: "100vw",
              transformOrigin: "top left",
              transform: "rotate(90deg) translate(0, -100%)",
            }
          : undefined
      }
    >
      {!isFullscreen && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            goFullscreen();
          }}
          className="absolute right-4 top-4 z-50 rounded bg-black/60 px-4 py-2 text-sm text-white"
        >
          Plein écran
        </button>
      )}

      {currentItem?.media.fileType ===
      "video" ? (
        <video
          ref={videoRef}
          key={currentItem.id}
          src={currentItem.media.fileUrl}
          muted
          playsInline
          preload="auto"
          className="h-full w-full object-contain"
          onLoadedMetadata={(event) => {
            const video =
              event.currentTarget;

            const physicalDuration =
              Number.isFinite(
                video.duration
              ) && video.duration > 0
                ? video.duration
                : 0;

            const configuredDuration =
              getDurationSeconds(
                currentItem
              );

            console.log(
              "Métadonnées vidéo :",
              {
                media:
                  currentItem.media.name,
                duration:
                  physicalDuration,
                configuredDuration,
              }
            );

            video.muted = true;
            video.defaultMuted = true;
            video.volume = 0;
          }}
          onPlay={(event) => {
            const item = currentItem;
            const sessionId =
              playbackSessionRef.current;

            if (!item) {
              return;
            }

            if (
              item.media.fileType !==
              "video"
            ) {
              return;
            }

            /**
             * onPlay peut être déclenché plusieurs fois
             * pendant les boucles.
             *
             * Le démarrage de la session ne doit avoir
             * lieu qu'une seule fois.
             */
            if (startTimeRef.current) {
              return;
            }

            const startedAt = new Date();

            startTimeRef.current =
              startedAt;

            const physicalDuration =
              Number.isFinite(
                event.currentTarget.duration
              ) &&
              event.currentTarget
                .duration > 0
                ? event.currentTarget
                    .duration
                : 0;

            const configuredDuration =
              getDurationSeconds(item);

            /**
             * Watchdog de sécurité.
             *
             * Il ne sert pas à terminer une vidéo normale.
             * Il protège uniquement contre une vidéo bloquée.
             */
            const watchdogSeconds = Math.max(
              VIDEO_WATCHDOG_MIN_SECONDS,
              Math.ceil(
                Math.max(
                  physicalDuration,
                  configuredDuration
                )
              ) + VIDEO_WATCHDOG_EXTRA_SECONDS
            );

            console.log(
              "Vidéo démarrée :",
              item.media.name,
              "watchdog :",
              watchdogSeconds,
              "secondes"
            );

            if (
              watchdogTimerRef.current
            ) {
              clearTimeout(
                watchdogTimerRef.current
              );
            }

            watchdogTimerRef.current =
              setTimeout(() => {
                if (
                  sessionId !==
                  playbackSessionRef.current
                ) {
                  return;
                }

                console.warn(
                  "Watchdog vidéo déclenché :",
                  item.media.name
                );

                finishCurrentItem(
                  item,
                  sessionId,
                  "FAILED",
                  startedAt
                );
              }, watchdogSeconds * 1000);

            /**
             * Durée réellement facturée/diffusée.
             *
             * Exemple :
             * vidéo physique = 10 s
             * durée configurée = 15 s
             *
             * La vidéo boucle jusqu'à 15 s.
             */
            console.log(
              "Durée de diffusion vidéo configurée :",
              item.media.name,
              configuredDuration,
              "secondes"
            );

            if (
              configuredDurationTimerRef.current
            ) {
              clearTimeout(
                configuredDurationTimerRef.current
              );
            }

            configuredDurationTimerRef.current =
              setTimeout(() => {
                if (
                  sessionId !==
                  playbackSessionRef.current
                ) {
                  return;
                }

                console.log(
                  "Durée configurée atteinte :",
                  item.media.name
                );

                finishCurrentItem(
                  item,
                  sessionId,
                  "PLAYED",
                  startedAt
                );
              }, configuredDuration * 1000);
          }}
          onEnded={(event) => {
            const item = currentItem;
            const sessionId =
              playbackSessionRef.current;

            const video =
              event.currentTarget;

            if (!item) {
              return;
            }

            if (
              item.media.fileType !==
              "video"
            ) {
              return;
            }

            if (
              sessionId !==
              playbackSessionRef.current
            ) {
              return;
            }

            if (
              transitionLockRef.current
            ) {
              return;
            }

            const startedAt =
              startTimeRef.current ??
              new Date();

            const physicalDuration =
              Number.isFinite(
                video.duration
              ) && video.duration > 0
                ? video.duration
                : DEFAULT_DURATION_SECONDS;

            const targetDuration =
              getDurationSeconds(item);

            const elapsedSeconds =
              (Date.now() -
                startedAt.getTime()) /
              1000;

            console.log(
              "Vidéo terminée physiquement :",
              {
                media:
                  item.media.name,
                elapsedSeconds,
                physicalDuration,
                targetDuration,
                sessionId,
              }
            );

            /**
             * Si la vidéo physique est plus courte
             * que la durée configurée, on la reboucle.
             */
            if (
              elapsedSeconds + 0.25 <
              targetDuration
            ) {
              console.log(
                "Vidéo plus courte que la durée configurée : boucle",
                item.media.name
              );

              if (
                sessionId !==
                  playbackSessionRef.current ||
                transitionLockRef.current
              ) {
                return;
              }

              video.currentTime = 0;

              video
                .play()
                .catch((playError) => {
                  console.warn(
                    "Impossible de relancer la vidéo :",
                    playError
                  );
                });

              return;
            }

            /**
             * Si la durée cible est atteinte,
             * le timer de durée configurée aura normalement
             * déjà déclenché finishCurrentItem().
             *
             * Cette sécurité couvre les cas où onEnded arrive
             * juste après la durée cible.
             */
            finishCurrentItem(
              item,
              sessionId,
              "PLAYED",
              startedAt
            );
          }}
          onError={(event) => {
            const item = currentItem;
            const sessionId =
              playbackSessionRef.current;

            if (!item) {
              return;
            }

            console.error(
              "Erreur lecture vidéo :",
              event.currentTarget.error
            );

            if (
              transitionLockRef.current
            ) {
              return;
            }

            if (
              errorDelayTimerRef.current
            ) {
              clearTimeout(
                errorDelayTimerRef.current
              );
            }

            errorDelayTimerRef.current =
              setTimeout(() => {
                if (
                  sessionId !==
                  playbackSessionRef.current
                ) {
                  return;
                }

                finishCurrentItem(
                  item,
                  sessionId,
                  "FAILED",
                  startTimeRef.current
                );
              }, MEDIA_ERROR_DELAY_MS);
          }}
        />
      ) : currentItem ? (
        <img
          key={currentItem.id}
          src={currentItem.media.fileUrl}
          alt={
            currentItem.media.name ||
            "SeetuAds"
          }
          className="h-full w-full object-contain"
          onError={(event) => {
            const item = currentItem;
            const sessionId =
              playbackSessionRef.current;

            console.error(
              "Erreur chargement image :",
              event.currentTarget
            );

            if (
              transitionLockRef.current
            ) {
              return;
            }

            if (
              imageTimerRef.current
            ) {
              clearTimeout(
                imageTimerRef.current
              );

              imageTimerRef.current =
                null;
            }

            if (
              errorDelayTimerRef.current
            ) {
              clearTimeout(
                errorDelayTimerRef.current
              );
            }

            errorDelayTimerRef.current =
              setTimeout(() => {
                if (
                  sessionId !==
                  playbackSessionRef.current
                ) {
                  return;
                }

                finishCurrentItem(
                  item,
                  sessionId,
                  "FAILED",
                  startTimeRef.current
                );
              }, MEDIA_ERROR_DELAY_MS);
          }}
        />
      ) : (
        <div className="text-white">
          Aucun média à afficher
        </div>
      )}
    </div>
  );
}



