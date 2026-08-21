# SeetuAds - Script de setup complet
# Place ce fichier dans C:\Users\PC\SeetuAds puis clic droit -> "Executer avec PowerShell"

$ErrorActionPreference = "Stop"
$baseDir = $PSScriptRoot
if (-not $baseDir) { $baseDir = Get-Location }
Set-Location $baseDir

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SETUP SEETUADS - CREATION COMPLETE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Dossier: $baseDir" -ForegroundColor Gray
Write-Host ""

# 1. CREATION DES DOSSIERS
$folders = @(
    "app\admin\ecrans",
    "app\admin\medias",
    "app\admin\playlist",
    "app\api\ecrans\[id]",
    "app\api\medias\[id]",
    "app\api\paiements\[id]",
    "app\api\paiements\initier",
    "app\api\paiements\webhook\wave",
    "app\api\paiements\webhook\orange",
    "app\api\playlist\reorder",
    "app\api\upload",
    "app\ecran\[id]",
    "components",
    "lib"
)

foreach ($folder in $folders) {
    $path = Join-Path $baseDir $folder
    if (-not (Test-Path $path)) {
        New-Item -ItemType Directory -Force -Path $path | Out-Null
        Write-Host "[+] Dossier: $folder" -ForegroundColor Green
    } else {
        Write-Host "[o] Dossier existe: $folder" -ForegroundColor DarkGray
    }
}

# 2. FONCTION HELPER
function Write-SeetuFile($relativePath, $content) {
    $fullPath = Join-Path $baseDir $relativePath
    Set-Content -Path $fullPath -Value $content -Encoding UTF8 -Force
    Write-Host "[>] Fichier: $relativePath" -ForegroundColor Yellow
}

# 3. FICHIERS

# --- app/layout.tsx ---
Write-SeetuFile "app\layout.tsx" @'
export const metadata = {
  title: 'SeetuAds',
  description: 'Gestion de campagnes publicitaires digitales',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
'@

# --- app/page.tsx ---
Write-SeetuFile "app\page.tsx" @'
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">SeetuAds</h1>
      <p className="text-gray-600 mb-8">Systeme de gestion de campagnes publicitaires</p>
      <div className="flex gap-4">
        <a href="/admin/medias" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Admin Medias
        </a>
        <a href="/admin/playlist" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
          Admin Playlist
        </a>
        <a href="/admin/ecrans" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
          Admin Ecrans
        </a>
        <a href="/ecran/1" className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900">
          Player Test
        </a>
      </div>
    </main>
  );
}
'@

# --- app/admin/ecrans/page.tsx ---
Write-SeetuFile "app\admin\ecrans\page.tsx" @'
'use client';

import { useEffect, useState } from 'react';

interface Ecran {
  id: number;
  nom: string;
  localisation: string;
  resolution: string;
  actif: boolean;
  created_at: string;
}

export default function AdminEcransPage() {
  const [ecrans, setEcrans] = useState<Ecran[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Ecran | null>(null);
  const [form, setForm] = useState({ nom: '', localisation: '', resolution: '1920x1080', actif: true });

  const fetchEcrans = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ecrans');
      const data = await res.json();
      setEcrans(data.ecrans || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchEcrans(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editing ? `/api/ecrans/${editing.id}` : '/api/ecrans';
    const method = editing ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ nom: '', localisation: '', resolution: '1920x1080', actif: true });
      setShowForm(false);
      setEditing(null);
      fetchEcrans();
    }
  };

  const handleEdit = (ecran: Ecran) => {
    setEditing(ecran);
    setForm({ nom: ecran.nom, localisation: ecran.localisation, resolution: ecran.resolution, actif: ecran.actif });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cet ecran ?')) return;
    await fetch(`/api/ecrans/${id}`, { method: 'DELETE' });
    fetchEcrans();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ecrans</h1>
            <p className="text-gray-500 mt-1">Gere tes ecrans publicitaires</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            {showForm ? 'Annuler' : '+ Ajouter un ecran'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">{editing ? "Modifier" : "Nouvel ecran"}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input type="text" value={form.nom} onChange={(e) => setForm({...form, nom: e.target.value})} className="w-full border rounded-lg px-3 py-2" placeholder="Ex: Ecran Centre Commercial" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Localisation</label>
                <input type="text" value={form.localisation} onChange={(e) => setForm({...form, localisation: e.target.value})} className="w-full border rounded-lg px-3 py-2" placeholder="Ex: Dakar, Plateau" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resolution</label>
                <select value={form.resolution} onChange={(e) => setForm({...form, resolution: e.target.value})} className="w-full border rounded-lg px-3 py-2">
                  <option value="1920x1080">1920x1080 (Full HD)</option>
                  <option value="3840x2160">3840x2160 (4K)</option>
                  <option value="1280x720">1280x720 (HD)</option>
                  <option value="1080x1920">1080x1920 (Portrait)</option>
                </select>
              </div>
              <div className="flex items-center gap-2 h-full pt-7">
                <input type="checkbox" id="actif" checked={form.actif} onChange={(e) => setForm({...form, actif: e.target.checked})} className="w-4 h-4" />
                <label htmlFor="actif" className="text-sm text-gray-700">Actif</label>
              </div>
              <div className="md:col-span-2 flex gap-2">
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">{editing ? 'Enregistrer' : 'Creer'}</button>
                <button type="button" onClick={() => {setEditing(null); setShowForm(false);}} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium">Annuler</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
        ) : ecrans.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed">
            <p className="text-gray-400 text-lg">Aucun ecran configure</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ecrans.map((ecran) => (
              <div key={ecran.id} className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{ecran.nom}</h3>
                    <p className="text-sm text-gray-500">{ecran.localisation}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${ecran.actif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{ecran.actif ? 'Actif' : 'Inactif'}</span>
                </div>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <p>Resolution: <span className="font-mono">{ecran.resolution}</span></p>
                  <p>Cree le: {new Date(ecran.created_at).toLocaleDateString('fr-FR')}</p>
                  <p>URL Player: <code className="text-xs bg-gray-100 px-1 rounded">/ecran/{ecran.id}</code></p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(ecran)} className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium">Modifier</button>
                  <button onClick={() => handleDelete(ecran.id)} className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium">Supprimer</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
'@

# --- app/admin/medias/page.tsx ---
Write-SeetuFile "app\admin\medias\page.tsx" @'
'use client';

import { useEffect, useState } from 'react';

interface Media {
  id: number;
  url: string;
  public_id: string;
  type: 'image' | 'video';
  duree: number;
  ordre: number;
  campagne_id: number | null;
  created_at: string;
}

export default function AdminMediasPage() {
  const [medias, setMedias] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');
  const [uploads, setUploads] = useState<{file: File; status: string; error?: string; result?: any}[]>([]);

  const fetchMedias = async () => {
    setLoading(true);
    const res = await fetch('/api/medias');
    const data = await res.json();
    setMedias(data.medias || []);
    setLoading(false);
  };

  useEffect(() => { fetchMedias(); }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newUploads = Array.from(files).map(f => ({ file: f, status: 'uploading' as string }));
    setUploads(prev => [...prev, ...newUploads]);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');

        setUploads(prev => {
          const copy = [...prev];
          const idx = copy.findIndex(u => u.file === file && u.status === 'uploading');
          if (idx >= 0) copy[idx] = { ...copy[idx], status: 'done', result: data };
          return copy;
        });
      } catch (err: any) {
        setUploads(prev => {
          const copy = [...prev];
          const idx = copy.findIndex(u => u.file === file && u.status === 'uploading');
          if (idx >= 0) copy[idx] = { ...copy[idx], status: 'error', error: err.message };
          return copy;
        });
      }
    }
    fetchMedias();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce media ?')) return;
    await fetch(`/api/medias?id=${id}`, { method: 'DELETE' });
    fetchMedias();
  };

  const handleUpdateDuree = async (id: number, duree: number) => {
    await fetch(`/api/medias/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duree }),
    });
    fetchMedias();
  };

  const filtered = medias.filter(m => filter === 'all' ? true : m.type === filter);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Medias</h1>
            <p className="text-gray-500 mt-1">Gere tes images et videos</p>
          </div>
          <div className="flex gap-2">
            {(['all','image','video'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border'}`}>
                {f === 'all' ? 'Tous' : f === 'image' ? 'Images' : 'Videos'}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Uploader</h2>
          <input type="file" multiple accept="image/*,video/*" onChange={handleFileSelect} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
          {uploads.length > 0 && (
            <div className="mt-4 space-y-2">
              {uploads.map((u, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span>{u.status === 'done' ? '✅' : u.status === 'error' ? '❌' : '⏳'}</span>
                  <span className="flex-1">{u.file.name}</span>
                  {u.error && <span className="text-red-500 text-xs">{u.error}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Bibliotheque ({filtered.length})</h2>
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed"><p className="text-gray-400">Aucun media</p></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filtered.map(media => (
                <div key={media.id} className="group bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative aspect-video bg-gray-100">
                    {media.type === 'video' ? (
                      <video src={media.url} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={media.url} alt="" className="w-full h-full object-cover" />
                    )}
                    <span className="absolute top-2 left-2 px-2 py-1 text-xs font-medium bg-black/60 text-white rounded-full">#{media.id}</span>
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{new Date(media.created_at).toLocaleDateString('fr-FR')}</span>
                      <button onClick={() => handleDelete(media.id)} className="text-red-400 hover:text-red-600 text-sm">🗑️</button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Duree:</span>
                      <input type="number" value={media.duree} onChange={(e) => handleUpdateDuree(media.id, parseInt(e.target.value)||5)} className="w-16 text-sm border rounded px-2 py-1 text-center" min={1} max={300} />
                      <span className="text-xs text-gray-400">s</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
'@

# --- app/admin/playlist/page.tsx ---
Write-SeetuFile "app\admin\playlist\page.tsx" @'
'use client';

import { useEffect, useState } from 'react';

interface Ecran { id: number; nom: string; localisation: string; }
interface Media { id: number; url: string; type: 'image' | 'video'; duree: number; }
interface PlaylistItem { id: number; ecran_id: number; media_id: number; ordre: number; url: string; type: 'image' | 'video'; duree: number; }

export default function AdminPlaylistPage() {
  const [ecrans, setEcrans] = useState<Ecran[]>([]);
  const [selectedEcran, setSelectedEcran] = useState<number | null>(null);
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [medias, setMedias] = useState<Media[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/ecrans').then(r => r.json()).then(d => setEcrans(d.ecrans || []));
    fetch('/api/medias').then(r => r.json()).then(d => setMedias(d.medias || []));
  }, []);

  useEffect(() => {
    if (!selectedEcran) return;
    setLoading(true);
    fetch(`/api/playlist?ecran_id=${selectedEcran}`).then(r => r.json()).then(d => {
      setPlaylist(d.playlist || []);
      setLoading(false);
    });
  }, [selectedEcran]);

  const addMedia = async (mediaId: number) => {
    if (!selectedEcran) return;
    await fetch('/api/playlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ecran_id: selectedEcran, media_id: mediaId }),
    });
    const res = await fetch(`/api/playlist?ecran_id=${selectedEcran}`);
    const d = await res.json();
    setPlaylist(d.playlist || []);
  };

  const removeItem = async (id: number) => {
    await fetch(`/api/playlist?id=${id}`, { method: 'DELETE' });
    const res = await fetch(`/api/playlist?ecran_id=${selectedEcran}`);
    const d = await res.json();
    setPlaylist(d.playlist || []);
  };

  const moveItem = async (id: number, direction: 'up' | 'down') => {
    const idx = playlist.findIndex(p => p.id === id);
    if (idx < 0) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= playlist.length) return;

    const newPlaylist = [...playlist];
    [newPlaylist[idx], newPlaylist[newIdx]] = [newPlaylist[newIdx], newPlaylist[idx]];

    await fetch('/api/playlist/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: newPlaylist.map((item, i) => ({ id: item.id, ordre: i })) }),
    });

    setPlaylist(newPlaylist);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 border-b bg-white">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Playlists</h1>
        <p className="text-gray-500 mt-1">Assigne des medias aux ecrans</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 max-w-7xl mx-auto">
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-800">Ecrans</h2>
          <div className="space-y-2">
            {ecrans.map(ecran => (
              <button key={ecran.id} onClick={() => setSelectedEcran(ecran.id)} className={`w-full text-left p-3 rounded-lg border transition-all ${selectedEcran === ecran.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}`}>
                <p className="font-medium">{ecran.nom}</p>
                <p className="text-xs text-gray-500">{ecran.localisation}</p>
              </button>
            ))}
          </div>
          <h3 className="text-md font-bold text-gray-800 mt-6">Medias disponibles</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {medias.map(media => (
              <div key={media.id} className="flex items-center gap-2 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => addMedia(media.id)}>
                {media.type === 'video' ? <video src={media.url} className="w-10 h-8 object-cover rounded" muted /> : <img src={media.url} alt="" className="w-10 h-8 object-cover rounded" />}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">#{media.id}</p>
                  <p className="text-xs text-gray-400">{media.type} • {media.duree}s</p>
                </div>
                <span className="text-blue-500 text-lg">+</span>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">Playlist {selectedEcran ? `- Ecran #${selectedEcran}` : ''}</h2>
            {playlist.length > 0 && <span className="text-sm text-gray-500">{playlist.length} items • {playlist.reduce((a,i) => a+i.duree, 0)}s</span>}
          </div>
          {!selectedEcran ? (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200"><p className="text-gray-400">Selectionne un ecran</p></div>
          ) : loading ? (
            <div className="flex items-center justify-center h-64"><p className="text-gray-400">Chargement...</p></div>
          ) : playlist.length === 0 ? (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200"><p className="text-gray-400">Playlist vide. Clique sur un media a gauche.</p></div>
          ) : (
            <div className="space-y-2">
              {playlist.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-white border rounded-lg shadow-sm">
                  <span className="text-gray-400 font-mono w-6">{idx + 1}</span>
                  {item.type === 'video' ? <video src={item.url} className="w-16 h-12 object-cover rounded" muted /> : <img src={item.url} alt="" className="w-16 h-12 object-cover rounded" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">Media #{item.media_id}</p>
                    <p className="text-xs text-gray-500">{item.type} • {item.duree}s</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => moveItem(item.id, 'up')} disabled={idx === 0} className="px-2 py-1 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-30">↑</button>
                    <button onClick={() => moveItem(item.id, 'down')} disabled={idx === playlist.length - 1} className="px-2 py-1 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-30">↓</button>
                    <button onClick={() => removeItem(item.id)} className="px-2 py-1 text-red-400 hover:bg-red-50 rounded">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
'@

# --- app/ecran/[id]/page.tsx ---
Write-SeetuFile "app\ecran\[id]\page.tsx" @'
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';

interface PlaylistItem {
  id: number;
  url: string;
  type: 'image' | 'video';
  duree: number;
}

export default function EcranPage() {
  const params = useParams();
  const ecranId = parseInt(params.id as string);
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchPlaylist = useCallback(async () => {
    try {
      const res = await fetch(`/api/playlist?ecran_id=${ecranId}`);
      const data = await res.json();
      setPlaylist(data.playlist || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [ecranId]);

  useEffect(() => {
    fetchPlaylist();
    const interval = setInterval(fetchPlaylist, 30000);
    return () => clearInterval(interval);
  }, [fetchPlaylist]);

  useEffect(() => {
    if (playlist.length === 0) return;
    const current = playlist[currentIndex];
    if (timerRef.current) clearTimeout(timerRef.current);
    if (current.type === 'image') {
      timerRef.current = setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % playlist.length);
      }, current.duree * 1000);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [currentIndex, playlist]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!document.fullscreenElement && containerRef.current) {
        containerRef.current.requestFullscreen().catch(() => {});
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <div className="fixed inset-0 bg-black flex items-center justify-center text-white animate-pulse">Chargement...</div>;
  if (playlist.length === 0) return <div className="fixed inset-0 bg-black flex items-center justify-center text-white flex-col gap-4"><div className="text-6xl">📺</div><div className="text-2xl">Aucun contenu programme</div></div>;

  const current = playlist[currentIndex];

  return (
    <div ref={containerRef} className="fixed inset-0 bg-black overflow-hidden" onDoubleClick={() => containerRef.current?.requestFullscreen()}>
      {current.type === 'video' ? (
        <video src={current.url} autoPlay muted playsInline className="w-full h-full object-contain" onEnded={() => setCurrentIndex(prev => (prev + 1) % playlist.length)} />
      ) : (
        <img src={current.url} alt="" className="w-full h-full object-contain" />
      )}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {playlist.map((_, idx) => (
          <div key={idx} className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentIndex ? 'w-8 bg-white' : 'w-2 bg-white/30'}`} />
        ))}
      </div>
      <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/40 text-white/70 text-xs rounded-full">
        Ecran #{ecranId} • {currentIndex + 1}/{playlist.length}
      </div>
    </div>
  );
}
'@

# --- app/api/ecrans/route.ts ---
Write-SeetuFile "app\api\ecrans\route.ts" @'
import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    const ecrans = await sql`SELECT * FROM ecrans ORDER BY created_at DESC`;
    return NextResponse.json({ ecrans });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { nom, localisation, resolution, actif } = await request.json();
    if (!nom || !localisation) {
      return NextResponse.json({ error: 'Nom et localisation requis' }, { status: 400 });
    }
    const result = await sql`
      INSERT INTO ecrans (nom, localisation, resolution, actif, created_at)
      VALUES (${nom}, ${localisation}, ${resolution || '1920x1080'}, ${actif ?? true}, NOW())
      RETURNING *
    `;
    return NextResponse.json({ ecran: result[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
'@

# --- app/api/ecrans/[id]/route.ts ---
Write-SeetuFile "app\api\ecrans\[id]\route.ts" @'
import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

const sql = neon(process.env.DATABASE_URL!);

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { nom, localisation, resolution, actif } = await request.json();
    const id = parseInt(params.id);
    const result = await sql`
      UPDATE ecrans SET
        nom = COALESCE(${nom}, nom),
        localisation = COALESCE(${localisation}, localisation),
        resolution = COALESCE(${resolution}, resolution),
        actif = COALESCE(${actif}, actif)
      WHERE id = ${id}
      RETURNING *
    `;
    if (result.length === 0) return NextResponse.json({ error: 'Ecran non trouve' }, { status: 404 });
    return NextResponse.json({ ecran: result[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    await sql`DELETE FROM ecrans WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
'@

# --- app/api/medias/route.ts ---
Write-SeetuFile "app\api\medias\route.ts" @'
import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

const sql = neon(process.env.DATABASE_URL!);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const campagneId = searchParams.get('campagne_id');
    const medias = await sql`
      SELECT m.*, c.titre as campagne_titre
      FROM medias m
      LEFT JOIN campagnes c ON m.campagne_id = c.id
      ${campagneId ? sql`WHERE m.campagne_id = ${parseInt(campagneId)}` : sql``}
      ORDER BY m.ordre ASC, m.created_at DESC
    `;
    return NextResponse.json({ medias });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 });

    const media = await sql`SELECT * FROM medias WHERE id = ${parseInt(id)}`;
    if (media.length === 0) return NextResponse.json({ error: 'Media non trouve' }, { status: 404 });

    if (media[0].public_id) {
      await cloudinary.uploader.destroy(media[0].public_id, {
        resource_type: media[0].type === 'video' ? 'video' : 'image'
      });
    }
    await sql`DELETE FROM medias WHERE id = ${parseInt(id)}`;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
'@

# --- app/api/medias/[id]/route.ts ---
Write-SeetuFile "app\api\medias\[id]\route.ts" @'
import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

const sql = neon(process.env.DATABASE_URL!);

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { duree, ordre, campagne_id } = await request.json();
    const id = parseInt(params.id);
    const result = await sql`
      UPDATE medias SET
        duree = COALESCE(${duree}, duree),
        ordre = COALESCE(${ordre}, ordre),
        campagne_id = COALESCE(${campagne_id}, campagne_id)
      WHERE id = ${id}
      RETURNING *
    `;
    return NextResponse.json({ media: result[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
'@

# --- app/api/playlist/route.ts ---
Write-SeetuFile "app\api\playlist\route.ts" @'
import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ecranId = searchParams.get('ecran_id');
    if (!ecranId) return NextResponse.json({ error: 'ecran_id requis' }, { status: 400 });

    const items = await sql`
      SELECT pi.*, m.url, m.type, m.duree, m.public_id
      FROM playlist_items pi
      JOIN medias m ON pi.media_id = m.id
      WHERE pi.ecran_id = ${parseInt(ecranId)} AND pi.actif = true
      ORDER BY pi.ordre ASC
    `;
    return NextResponse.json({ playlist: items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { ecran_id, media_id } = await request.json();
    if (!ecran_id || !media_id) {
      return NextResponse.json({ error: 'ecran_id et media_id requis' }, { status: 400 });
    }

    const existing = await sql`SELECT * FROM playlist_items WHERE ecran_id = ${ecran_id} AND media_id = ${media_id}`;
    if (existing.length > 0) {
      await sql`UPDATE playlist_items SET actif = true, ordre = (SELECT COALESCE(MAX(ordre), 0) + 1 FROM playlist_items WHERE ecran_id = ${ecran_id}) WHERE id = ${existing[0].id}`;
      return NextResponse.json({ success: true });
    }

    const result = await sql`
      INSERT INTO playlist_items (ecran_id, media_id, ordre, actif, created_at)
      VALUES (${ecran_id}, ${media_id}, (SELECT COALESCE(MAX(ordre), 0) + 1 FROM playlist_items WHERE ecran_id = ${ecran_id}), true, NOW())
      RETURNING *
    `;
    return NextResponse.json({ playlistItem: result[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 });
    await sql`UPDATE playlist_items SET actif = false WHERE id = ${parseInt(id)}`;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
'@

# --- app/api/playlist/reorder/route.ts ---
Write-SeetuFile "app\api\playlist\reorder\route.ts" @'
import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: Request) {
  try {
    const { items } = await request.json();
    if (!Array.isArray(items)) return NextResponse.json({ error: 'Format invalide' }, { status: 400 });
    for (const item of items) {
      await sql`UPDATE playlist_items SET ordre = ${item.ordre} WHERE id = ${item.id}`;
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
'@

# --- app/api/upload/route.ts ---
Write-SeetuFile "app\api\upload\route.ts" @'
import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'Aucun fichier recu' }, { status: 400 });

    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: `Fichier trop lourd: ${(file.size / 1024 / 1024).toFixed(1)}MB` }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const resourceType = file.type.startsWith('video') ? 'video' : 'image';

    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'seetuads/campagnes', resource_type: resourceType },
        (error, result) => { if (error) reject(error); else resolve(result); }
      );
      uploadStream.end(buffer);
    });

    const duree = resourceType === 'video' ? 15 : 10;
    const inserted = await sql`
      INSERT INTO medias (url, type, duree, public_id, campagne_id)
      VALUES (${result.secure_url}, ${resourceType}, ${duree}, ${result.public_id}, NULL)
      RETURNING id, url, type, duree, public_id
    `;

    return NextResponse.json({ url: result.secure_url, public_id: result.public_id, type: resourceType, duree, id: inserted[0]?.id });
  } catch (err: any) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Upload echoue: ' + (err.message || 'inconnu') }, { status: 500 });
  }
}
'@

# --- lib/cloudinary.ts ---
Write-SeetuFile "lib\cloudinary.ts" @'
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };
'@

# --- middleware.ts ---
Write-SeetuFile "middleware.ts" @'
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isAdminRoute = createRouteMatcher(['/admin(.*)']);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  if (isAdminRoute(req) && !userId) {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
'@

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  SETUP TERMINE AVEC SUCCES !" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Prochaines etapes:" -ForegroundColor Cyan
Write-Host "1. Verifie ton .env.local" -ForegroundColor White
Write-Host "2. npm run dev" -ForegroundColor White
Write-Host "3. Ouvre http://localhost:3000" -ForegroundColor White
Write-Host ""
Pause
