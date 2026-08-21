'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  duree: number;
  public_id: string;
  campagne_nom: string;
}

interface PlaylistData {
  ecran_id?: string;
  playlist?: MediaItem[];
  total?: number;
  error?: string;
}

// Force le rendu dynamique (pas de statique)
export const dynamic = 'force-dynamic';

export default function PlayerTV({ params }: { params: { serial: string } }) {
  const serial = params.serial;

  const [playlist, setPlaylist] = useState<MediaItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fade, setFade] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Charger la playlist
  useEffect(() => {
    if (!serial) return;

    const fetchPlaylist = async () => {
      try {
        const res = await fetch(`/api/ecrans/${serial}/playlist`);
        const data: PlaylistData = await res.json();
        if (data.error) throw new Error(data.error);
        setPlaylist(data.playlist || []);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Erreur de chargement');
        setLoading(false);
      }
    };

    fetchPlaylist();
    const interval = setInterval(fetchPlaylist, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [serial]);

  const goNext = useCallback(() => {
    setFade(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.max(playlist.length, 1));
      setFade(false);
    }, 500);
  }, [playlist.length]);

  // Timer pour images
  useEffect(() => {
    if (playlist.length === 0) return;
    const current = playlist[currentIndex];
    if (!current) return;

    if (current.type === 'image') {
      timerRef.current = setTimeout(goNext, current.duree * 1000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, playlist, goNext]);

  const handleVideoEnded = () => goNext();

  // Ping toutes les 30s
  useEffect(() => {
    if (!serial) return;
    const ping = () => {
      fetch(`/api/ecrans/${serial}/ping`, { method: 'POST' }).catch(() => {});
    };
    ping();
    const interval = setInterval(ping, 30 * 1000);
    return () => clearInterval(interval);
  }, [serial]);

  const goFullscreen = () => {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
  };

  if (loading) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-4xl mb-4 animate-spin">⏳</div>
          <p className="text-lg">Chargement de la playlist...</p>
          <p className="text-sm text-gray-500 mt-2">Ecran: {serial}</p>
        </div>
      </div>
    );
  }

  if (error || playlist.length === 0) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center" onClick={goFullscreen}>
        <div className="text-white text-center">
          <div className="text-6xl mb-4">📺</div>
          <h1 className="text-3xl font-bold mb-2">SeetuAds Player</h1>
          <p className="text-gray-400">{error || 'Aucun media a diffuser'}</p>
          <p className="text-sm text-gray-600 mt-4">Ecran: {serial}</p>
          <p className="text-xs text-gray-700 mt-2">Cliquez pour plein ecran</p>
        </div>
      </div>
    );
  }

  const current = playlist[currentIndex];
  if (!current) return null;

  return (
    <div
      className="w-screen h-screen bg-black overflow-hidden relative cursor-none"
      onClick={goFullscreen}
    >
      <div
        className={`w-full h-full flex items-center justify-center transition-opacity duration-500 ${
          fade ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {current.type === 'image' ? (
          <img
            src={current.url}
            alt={current.campagne_nom}
            className="w-full h-full object-contain"
          />
        ) : (
          <video
            ref={videoRef}
            src={current.url}
            autoPlay
            muted
            playsInline
            onEnded={handleVideoEnded}
            className="w-full h-full object-contain"
          />
        )}
      </div>

      <PlayerOverlay serial={serial} current={current} index={currentIndex} total={playlist.length} />

      {current.type === 'image' && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
          <div
            className="h-full bg-orange-500"
            style={{
              width: '100%',
              animation: `progress ${current.duree}s linear forwards`
            }}
          />
        </div>
      )}

      <style jsx global>{`
        @keyframes progress {
          from { width: 100%; }
          to { width: 0%; }
        }
        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
          background: black;
        }
      `}</style>
    </div>
  );
}

function PlayerOverlay({
  serial,
  current,
  index,
  total
}: {
  serial: string;
  current: MediaItem;
  index: number;
  total: number;
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(timer);
  }, [index]);

  if (!visible) return null;

  return (
    <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
      <div className="bg-black/60 text-white px-3 py-1.5 rounded-lg text-xs backdrop-blur-sm">
        <span className="font-bold">{current.campagne_nom}</span>
        <span className="text-gray-400 ml-2">
          {index + 1}/{total} · {current.type === 'image' ? `${current.duree}s` : 'video'}
        </span>
      </div>
      <div className="bg-black/60 text-gray-400 px-3 py-1.5 rounded-lg text-xs backdrop-blur-sm font-mono">
        {serial}
      </div>
    </div>
  );
}