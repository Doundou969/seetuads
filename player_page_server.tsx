import PlayerClient from './PlayerClient';

// Force le rendu dynamique pour les routes [serial]
export const dynamic = 'force-dynamic';

export default function PlayerPage({ params }: { params: { serial: string } }) {
  return <PlayerClient serial={params.serial} />;
}