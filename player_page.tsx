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

export default function PlayerTV() {
  const [serial, setSerial] = useState<string>('');
  const [playlist, setPlaylist] = useState<MediaItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fade, setFade] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Extraire le serial de l'URL au montage
  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/\/player\/([^\/]+)/);
    const extracted = match ? match[1] : '';
    setSerial(extracted || 'UNKNOWN');
  }, []);

  // 2. Charger la playlist
  useEffect(() => {
    if (!serial || serial === 'UNKNOWN') return;

    const fetchPlaylist = async () => {
      try {
        const res = await fetch(`/api/ecrans/${serial}/playlist`);
        const data: PlaylistData = await res.json();
        if (data.error) throw new Error(data.error);
        setPlaylist(data.playlist || []);
      } catch (err: any) {
        setError(err.message || 'Erreur de chargement');
      } finally {
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

  // 3. Timer pour les images
  useEffect(() => {
    if (playlist.length === 0) return;
    const current = playlist[currentIndex];
    if (!current || current.type !== 'image') return;

    timerRef.current = setTimeout(goNext, current.duree * 1000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [currentIndex, playlist, goNext]);

  const handleVideoEnded = () => goNext();

  // 4. Ping en ligne toutes les 30s
  useEffect(() => {
    if (!serial || serial === 'UNKNOWN') return;
    const ping = () => {
      fetch(`/api/ecrans/${serial}/ping`, { method: 'POST' }).catch(() => {});
    };
    ping();
    const interval = setInterval(ping, 30 * 1000);
    return () => clearInterval(interval);
  }, [serial]);

  const goFullscreen = () => {
    document.documentElement.requestFullscreen?.().catch(() => {});
  };

  // ─── RENDUS ───

  if (!serial || serial === 'UNKNOWN') {
    return (
      <div style={S.container}>
        <div style={S.center}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
          <p style={{ color: 'white' }}>Serial non detecte</p>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
            URL attendue : /player/TV-001
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={S.container}>
        <div style={S.center}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem', animation: 'spin 1s linear infinite' }}>⏳</div>
          <p style={{ color: 'white', fontSize: '1.125rem' }}>Chargement...</p>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>Ecran: {serial}</p>
        </div>
      </div>
    );
  }

  if (error || playlist.length === 0) {
    return (
      <div style={S.container} onClick={goFullscreen}>
        <div style={S.center}>
          <div style={{ fontSize: '3.75rem', marginBottom: '1rem' }}>📺</div>
          <h1 style={{ color: 'white', fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>SeetuAds</h1>
          <p style={{ color: '#9ca3af' }}>{error || 'Aucun media actif'}</p>
          <p style={{ fontSize: '0.875rem', color: '#4b5563', marginTop: '1rem' }}>{serial}</p>
          <p style={{ fontSize: '0.75rem', color: '#374151', marginTop: '0.5rem' }}>Cliquez pour plein ecran</p>
        </div>
      </div>
    );
  }

  const current = playlist[currentIndex];
  if (!current) return null;

  return (
    <div style={S.container} onClick={goFullscreen}>
      <div style={{ ...S.mediaWrap, opacity: fade ? 0 : 1, transition: 'opacity 500ms' }}>
        {current.type === 'image' ? (
          <img src={current.url} alt={current.campagne_nom} style={S.media} />
        ) : (
          <video ref={videoRef} src={current.url} autoPlay muted playsInline onEnded={handleVideoEnded} style={S.media} />
        )}
      </div>

      <Overlay serial={serial} current={current} index={currentIndex} total={playlist.length} />

      {current.type === 'image' && (
        <div style={S.bar}>
          <div style={{ ...S.fill, animation: `progress ${current.duree}s linear forwards` }} />
        </div>
      )}

      <style>{`
        @keyframes progress { from { width: 100%; } to { width: 0%; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        body { margin: 0 !important; padding: 0 !important; overflow: hidden !important; background: black !important; }
      `}</style>
    </div>
  );
}

function Overlay({ serial, current, index, total }: {
  serial: string; current: MediaItem; index: number; total: number;
}) {
  const [visible, setVisible] = useState(true);
  useEffect(() => { setVisible(true); const t = setTimeout(() => setVisible(false), 3000); return () => clearTimeout(t); }, [index]);
  if (!visible) return null;
  return (
    <div style={S.overlay}>
      <div style={S.box}>
        <span style={{ fontWeight: 'bold' }}>{current.campagne_nom}</span>
        <span style={{ color: '#9ca3af', marginLeft: '0.5rem' }}>{index + 1}/{total} · {current.type === 'image' ? `${current.duree}s` : 'video'}</span>
      </div>
      <div style={{ ...S.box, fontFamily: 'monospace', color: '#9ca3af' }}>{serial}</div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  container: { width: '100vw', height: '100vh', background: 'black', overflow: 'hidden', position: 'relative', cursor: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  center: { color: 'white', textAlign: 'center' },
  mediaWrap: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  media: { width: '100%', height: '100%', objectFit: 'contain' },
  bar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: '#1f2937' },
  fill: { height: '100%', background: '#f97316', width: '100%' },
  overlay: { position: 'absolute', top: '1rem', left: '1rem', right: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pointerEvents: 'none' },
  box: { background: 'rgba(0,0,0,0.6)', color: 'white', padding: '0.375rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.75rem', backdropFilter: 'blur(4px)' },
};