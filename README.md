# SeetuAds MVP — Guide de démarrage

Réseau publicitaire numérique en points de vente — Dakar, Sénégal.

---

## Stack technique

- **Frontend** : Next.js 14 (App Router)
- **Backend** : Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Styles** : Tailwind CSS
- **Validation** : Zod
- **État** : Zustand (à venir)

---

## Installation

```bash
# 1. Cloner le repo
git clone https://github.com/votre-org/seetuads.git
cd seetuads

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.local.example .env.local
# Éditer .env.local avec vos clés Supabase

# 4. Lancer en développement
npm run dev
```

---

## Configuration Supabase

1. Créez un projet sur [supabase.com](https://supabase.com)
2. Copiez vos clés dans `.env.local`
3. Dans **SQL Editor**, exécutez `supabase_schema.sql`
4. Dans **Storage**, créez un bucket `medias` (public)
5. Activez **Email Auth** dans Authentication > Providers

---

## Structure des rôles

| Rôle        | Accès                                    |
|-------------|------------------------------------------|
| `admin`     | `/admin/**` — gestion globale du réseau  |
| `annonceur` | `/annonceur/**` — campagnes et médias    |
| `commercant`| `/commercant/**` — écran et revenus      |

---

## API Player Android

Le player Android appelle ces endpoints :

```
GET  /api/ecrans/{id}/playlist  → Liste des campagnes actives
POST /api/ecrans/{id}/ping      → Heartbeat + log impression
```

### Exemple playlist response
```json
{
  "playlist": [
    {
      "campagne_id": "uuid",
      "nom": "Ramadan Promo",
      "frequence_par_heure": 3,
      "media": {
        "url": "https://...",
        "type": "video",
        "duree_sec": 30
      }
    }
  ],
  "synced_at": "2025-06-20T10:00:00Z"
}
```

### Logique player (pseudo-code)
```
1. GET /playlist → télécharger les médias en cache local
2. Diffuser en boucle selon frequence_par_heure
3. Après chaque diffusion → POST /ping { type: "impression", campagne_id }
4. Si pas de réseau → lire le cache local
5. Retry toutes les 5 minutes
```

---

## Déploiement

```bash
# Vercel (recommandé)
npm install -g vercel
vercel --prod

# Variables à configurer sur Vercel :
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
# SUPABASE_SERVICE_ROLE_KEY
# NEXT_PUBLIC_APP_URL
```

---

## Roadmap MVP → v2

### MVP (v1.0) ✅
- Auth multi-rôles
- Dashboard admin, annonceur, commerçant
- Création et validation de campagnes
- API player Android
- Log impressions

### v2.0 (après pilote)
- Paiement Wave + Orange Money
- QR codes dynamiques
- Coupons digitaux
- Analytics avancés
- Publicité programmatique

---

## Contact

**SeetuAds** · Dakar, Sénégal  
contact@seetuads.sn · +221 XX XXX XX XX
