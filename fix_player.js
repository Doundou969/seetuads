const fs = require('fs');

const content = `'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { getPlayerUrl } from '@/lib/cloudinary';

interface Media {
  id: number;
  url: string;
  type: string;
  duree: number | null;
  ordre: number;
}

interface EcranData {
  id: number;
  nom: string | null;
  serial: string;
  campagne_id: number | null;
}

export default function PlayerPage() {
  const { serial } = useParams();
  const [ecran, setEcran] = useState<EcranData | null>(null);
  const [medias, setMedias] = useState<Media[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playKey, setPlayKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [kioskReady, setKioskReady] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchPlaylist = useCallback(async () => {
    try {
      const res = await fetch(\\`/api/player/\\${serial}\\`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur inconnue');

      const optimized = (data.medias || []).map((m: any) => ({
        ...m,
        url: getPlayerUrl(m.url, m.type === 'video'),
      }));

      setEcran(data.ecran);
      setMedias((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(optimized)) return prev;
        return optimized;
      });
      setIsOnline(true);
      setError(null);
    } catch (e: any) {
      setError(e.message);
      setIsOnline(false);
    } finally {
      setLoading(false);
    }
  }, [serial]);

  useEffect(() => {
    fetchPlaylist();
    const interval = setInterval(fetchPlaylist, 30000);
    return () => clearInterval(interval);
  }, [fetchPlaylist]);

  useEffect(() => {
    if (!ecran?.id) return;
    const sendPing = () => {
      fetch(\\`/api/ecrans/\\${ecran.id}/ping\\`, {
        method: 'POST',
        keepalive: true,
      }).catch(() => {});
    };
    sendPing();
    const interval = setInterval(sendPing, 30000);
    return () => clearInterval(interval);
  }, [ecran?.id]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const enterKiosk = async () => {
    try {
      const el = document.documentElement as any;
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      else if (el.msRequestFullscreen) await el.msRequestFullscreen();
    } catch {
      // ignore
    } finally {
      setKioskReady(true);
    }
  };

  const preloadNext = useCallback(() => {
    if (medias.length === 0) return;
    const nextIndex = (currentIndex + 1) % medias.length;
    const next = medias[nextIndex];
    if (!next) return;
    if (next.type === 'video') {
      const vid = document.createElement('video');
      vid.src = next.url;
      vid.preload = 'auto';
    } else {
      const img = new Image();
      img.src = next.url;
    }
  }, [currentIndex, medias]);

  useEffect(() => {
    if (medias.length === 0) return;
    preloadNext();

    const current = medias[currentIndex];
    const isVideo = current.type === 'video';
    const duration = isVideo ? undefined : (current.duree ?? 5) * 1000;

    if (!isVideo && duration) {
      timerRef.current = setTimeout(() => {
        goToNext();
      }, duration);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, medias, preloadNext]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % medias.length);
    setPlayKey((k) => k + 1);
  }, [medias.length]);

  const handleVideoEnd = useCallback(() => {
    goToNext();
  }, [goToNext]);

  const handleMediaError = () => {
    setTimeout(() => {
      goToNext();
    }, 3000);
  };

  if (!kioskReady) {
    return (
      <div
        className="h-screen w-screen bg-black flex flex-col items-center justify-center text-white cursor-pointer select-none"
        onClick={enterKiosk}
      >
        <div className="text-4xl font-bold mb-4 animate-pulse">SeetuAds Player</div>
        <div className="text-lg text-gray-400">Série : {serial}</div>
        <div className="mt-8 px-6 py-3 bg-blue-600 rounded-full text-sm font-bold hover:bg-blue-700 transition">
          Appuyez pour démarrer le lecteur
        </div>
        <div className="mt-4 text-xs text-gray-600">Mode plein écran automatique</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center text-white text-2xl">
        Chargement...
      </div>
    );
  }

  if (error && medias.length === 0) {
    return (
      <div className="h-screen w-screen bg-black flex flex-col items-center justify-center text-red-500 gap-4">
        <p className="text-xl">{error}</p>
        <button
          onClick={() => { setLoading(true); fetchPlaylist(); }}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (medias.length === 0) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center text-white text-xl">
        Aucun média assigné
      </div>
    );
  }

  const current = medias[currentIndex];
  const progress = ((currentIndex + 1) / medias.length) * 100;

  return (
    <div className="h-screen w-screen bg-black relative overflow-hidden">
      {current.type === 'video' ? (
        <video
          key={\\`video-\\${currentIndex}-\\${playKey}\\`}
          src={current.url}
          className="h-full w-full object-contain"
          autoPlay
          muted
          playsInline
          onEnded={handleVideoEnd}
          onError={handleMediaError}
        />
      ) : (
        <img
          key={\\`img-\\${currentIndex}-\\${playKey}\\`}
          src={current.url}
          alt=""
          className="h-full w-full object-contain"
          onError={handleMediaError}
        />
      )}

      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full border border-white/10">
        {serial} — {currentIndex + 1}/{medias.length}
      </div>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/40 text-white text-[10px] px-2 py-0.5 rounded-full">
        {ecran?.id ? \\`● \\${ecran.id}\\` : '●'}
      </div>

      {!isOnline && (
        <div className="absolute top-4 right-4 bg-yellow-500 text-black text-xs px-3 py-1.5 rounded-full font-bold shadow-lg animate-pulse">
          OFFLINE
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800/80">
        <div
          className="h-full bg-blue-500 transition-all duration-300 ease-linear"
          style={{ width: \\`\\${progress}%\\` }}
        />
      </div>

      {current.type !== 'video' && current.duree && (
        <TimerBar key={\\`timer-\\${currentIndex}-\\${playKey}\\`} duration={current.duree} />
      )}
    </div>
  );
}

function TimerBar({ duration }: { duration: number }) {
  return (
    <div className="absolute bottom-1 left-0 right-0 h-0.5 bg-gray-700">
      <div
        className="h-full bg-green-400 origin-left"
        style={{ animation: \\`shrink \\${duration}s linear forwards\\` }}
      />
      <style jsx>{\`
        @keyframes shrink {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
      \`}</style>
    </div>
  );
}
`;

fs.writeFileSync('app/player/[serial]/page.tsx', content, 'utf8');
console.log('Fichier ecrit avec succes !');