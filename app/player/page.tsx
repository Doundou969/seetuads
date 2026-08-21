import { Suspense } from "react";
import PlayerView from "./player-view";

export default function PlayerPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen bg-black text-white text-2xl">Chargement du player...</div>}>
      <PlayerView />
    </Suspense>
  );
}