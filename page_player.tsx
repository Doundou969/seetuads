"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";

interface Media {
  id: number;
  url: string;
  type: string;
  duree: number | null;
  audio_url?: string | null;
}

export default function PlayerPage() {
  const { serial } = useParams();
  const [medias, setMedias] = useState<Media[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [kioskReady, setKioskReady] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    fetch(`/api/player/${serial}`)
      .then((r) => r.json())
      .then((data) => {
        setMedias(data.medias || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [serial]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => {
      if (medias.length <= 1) return 0;
      return (prev + 1) % medias.length;
    });
  }, [medias.length]);

  useEffect(() => {
    if (medias.length === 0) return;
    const current = medias[currentIndex];
    if (current.type !== "video") {
      const duration = (current.duree ?? 5) * 1000;
      timerRef.current = setTimeout(() => goToNext(), duration);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [currentIndex, medias, goToNext]);

  const enterKiosk = async () => {
    try {
      const el = document.documentElement as any;
      if (el.requestFullscreen) await el.requestFullscreen();
    } catch {}
    setKioskReady(true);
  };

  if (!kioskReady) {
    return (
      <div className="h-screen w-screen bg-black flex flex-col items-center justify-center text-white cursor-pointer" onClick={enterKiosk}>
        <div className="text-3xl font-bold mb-4">SeetuAds</div>
        <div className="text-lg text-gray-400">{serial}</div>
        <div className="mt-8 px-6 py-3 bg-blue-600 rounded-full text-sm font-bold">Cliquez pour demarrer</div>
      </div>
    );
  }

  if (loading) return <div className="h-screen w-screen bg-black flex items-center justify-center text-white text-2xl">Chargement...</div>;
  if (medias.length === 0) return <div className="h-screen w-screen bg-black flex items-center justify-center text-white text-xl">Aucun media</div>;

  const current = medias[currentIndex];
  const isSingleVideo = medias.length === 1 && current.type === "video";

  return (
    <div className="h-screen w-screen bg-black relative overflow-hidden">
      {current.type === "video" ? (
        <>
          <video
            ref={videoRef}
            src={current.url}
            className="absolute inset-0 h-full w-full object-contain"
            autoPlay
            muted={!!current.audio_url}
            playsInline
            loop={isSingleVideo}
            onEnded={isSingleVideo ? undefined : goToNext}
          />
          {current.audio_url && (
            <audio src={current.audio_url} autoPlay style={{ display: "none" }} />
          )}
        </>
      ) : (
        <img
          src={current.url}
          alt=""
          className="absolute inset-0 h-full w-full object-contain"
        />
      )}
      <div className="absolute top-4 left-4 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full">
        {serial} - {currentIndex + 1}/{medias.length}
      </div>
    </div>
  );
}