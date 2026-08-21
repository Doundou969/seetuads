# ============================================================
# SEETUADS V1 - SCRIPT DE SETUP COMPLET
# Place ce fichier dans C:\Users\PC\SeetuAds puis :
# clic droit -> "Executer avec PowerShell"
# ============================================================

$ErrorActionPreference = "Stop"
$baseDir = $PSScriptRoot
if (-not $baseDir) { $baseDir = Get-Location }
Set-Location $baseDir

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SETUP SEETUADS V1 - CREATION COMPLETE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Dossier: $baseDir" -ForegroundColor Gray
Write-Host ""

# 1. CREATION DES DOSSIERS
$folders = @(
    "app\(auth)\sign-in\[[...sign-in]]",
    "app\(auth)\sign-up\[[...sign-up]]",
    "app\(dashboard)\admin\screens",
    "app\(dashboard)\admin\campaigns",
    "app\(dashboard)\admin\partners",
    "app\(dashboard)\admin\advertisers",
    "app\(dashboard)\admin\economy",
    "app\(dashboard)\admin\maintenance",
    "app\(dashboard)\admin\settings",
    "app\(dashboard)\advertiser\campaigns\new",
    "app\(dashboard)\advertiser\media",
    "app\(dashboard)\partner",
    "app\api\admin\screens",
    "app\api\admin\campaigns",
    "app\api\admin\partners",
    "app\api\admin\advertisers",
    "app\api\admin\payments",
    "app\api\admin\economy",
    "app\api\admin\maintenance",
    "app\api\advertiser\profile",
    "app\api\campaigns\[id]",
    "app\api\zones",
    "app\api\screens\[id]",
    "app\api\inventory\check",
    "app\api\inventory\reserve",
    "app\api\inventory\release",
    "app\api\media\[id]",
    "app\api\player\register",
    "app\api\player\heartbeat",
    "app\api\player\playlist",
    "app\api\player\log",
    "app\api\payments\initiate",
    "app\api\payments\webhook\wave",
    "app\api\payments\webhook\orange",
    "app\api\partner\profile",
    "app\api\upload",
    "app\api\sync-profile",
    "app\ecran\[id]",
    "components\admin",
    "components\advertiser",
    "components\shared",
    "lib",
    "public"
)

foreach ($folder in $folders) {
    $path = Join-Path $baseDir $folder
    if (-not (Test-Path $path)) {
        New-Item -ItemType Directory -Force -Path $path | Out-Null
        Write-Host "[+] Dossier: $folder" -ForegroundColor Green
    } else {
        Write-Host "[o] Existe: $folder" -ForegroundColor DarkGray
    }
}

# 2. FONCTION HELPER
function Write-SeetuFile($relativePath, $content) {
    $fullPath = Join-Path $baseDir $relativePath
    Set-Content -Path $fullPath -Value $content -Encoding UTF8 -Force
    Write-Host "[>] Fichier: $relativePath" -ForegroundColor Yellow
}


# 3. FICHIERS CONFIGURATION

Write-SeetuFile "package.json" @'
{
  "name": "seetuads",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@clerk/nextjs": "^6.12.0",
    "@neondatabase/serverless": "^0.10.0",
    "cloudinary": "^2.6.0",
    "next": "^15.2.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.7.0"
  }
}
'@

Write-SeetuFile "tsconfig.json" @'
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
'@

Write-SeetuFile "next.config.js" @'
/** @type {import("next").NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "img.clerk.com" }
    ]
  }
}
module.exports = nextConfig
'@

Write-SeetuFile "tailwind.config.ts" @'
import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        seetu: {
          900: "#0f172a",
          800: "#1e293b",
          700: "#334155",
          600: "#2563eb",
          500: "#3b82f6",
          400: "#60a5fa",
        }
      }
    }
  },
  plugins: [],
}
export default config
'@

Write-SeetuFile "postcss.config.js" @'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
'@

Write-SeetuFile ".env.example" @'
# Database Neon
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/seetuads?sslmode=require

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Cloudinary
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx

# Wave API (sandbox)
WAVE_API_KEY=wave_test_xxx

# Orange Money API
ORANGE_MONEY_API_KEY=om_test_xxx

# Player API Key (secret partage entre serveur et players)
PLAYER_API_SECRET=seetu_player_secret_xxx_change_this
'@


# 4. STYLES & LAYOUT & MIDDLEWARE

Write-SeetuFile "app\globals.css" @'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body { @apply bg-gray-50 text-gray-900; }
}

@layer components {
  .btn-primary { @apply px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors; }
  .btn-danger { @apply px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors; }
  .btn-secondary { @apply px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors; }
  .btn-success { @apply px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors; }
  .card { @apply bg-white rounded-xl shadow-sm border p-6; }
  .input { @apply w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent; }
  .badge { @apply px-2 py-1 text-xs rounded-full font-medium; }
  .sidebar-link { @apply flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors; }
  .sidebar-link-active { @apply flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg font-medium; }
}
'@

Write-SeetuFile "app\layout.tsx" @'
import type { Metadata } from "next"
import { ClerkProvider } from "@clerk/nextjs"
import "./globals.css"

export const metadata: Metadata = {
  title: "SeetuAds - Gestion de campagnes publicitaires",
  description: "Plateforme SaaS de digital signage et reseau DOOH",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="fr">
        <body className="antialiased">{children}</body>
      </html>
    </ClerkProvider>
  )
}
'@

Write-SeetuFile "middleware.ts" @'
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isDashboardRoute = createRouteMatcher(["/(dashboard)(.*)"])
const isAdminRoute = createRouteMatcher(["/admin(.*)"])
const isAdvertiserRoute = createRouteMatcher(["/advertiser(.*)"])
const isPartnerRoute = createRouteMatcher(["/partner(.*)"])
const isPlayerApi = createRouteMatcher(["/api/player(.*)"])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()

  if (isPlayerApi(req)) {
    return NextResponse.next()
  }

  if (isDashboardRoute(req) && !userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
'@

# 5. LIBRAIRIES

Write-SeetuFile "lib\db.ts" @'
import { neon } from "@neondatabase/serverless"

export const sql = neon(process.env.DATABASE_URL!)
'@

Write-SeetuFile "lib\cloudinary.ts" @'
import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export { cloudinary }
'@

Write-SeetuFile "lib\utils.ts" @'
export function formatFCFA(amount: number): string {
  return new Intl.NumberFormat("fr-SN", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function classNames(...classes: (string | false | undefined)[]): string {
  return classes.filter(Boolean).join(" ")
}
'@

Write-SeetuFile "lib\auth.ts" @'
import { auth } from "@clerk/nextjs/server"
import { sql } from "./db"

export async function getCurrentProfile() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return null

  const rows = await sql`
    SELECT user_id, role, full_name, phone, avatar_url
    FROM profiles
    WHERE clerk_user_id = ${clerkId}
  `
  return rows[0] || null
}

export async function requireRole(allowedRoles: string[]) {
  const profile = await getCurrentProfile()
  if (!profile) throw new Error("Non authentifie")
  if (!allowedRoles.includes(profile.role)) throw new Error("Acces interdit")
  return profile
}

export async function syncProfile(clerkUserId: string, email: string, name: string) {
  const existing = await sql`SELECT user_id FROM profiles WHERE clerk_user_id = ${clerkUserId}`
  if (existing.length === 0) {
    await sql`
      INSERT INTO profiles (clerk_user_id, role, full_name)
      VALUES (${clerkUserId}, 'ADVERTISER', ${name})
    `
  }
}
'@

Write-SeetuFile "lib\types.ts" @'
export type UserRole = "ADMIN" | "OPERATOR" | "ADVERTISER" | "PARTNER"

export interface Profile {
  user_id: string
  clerk_user_id: string
  role: UserRole
  full_name: string | null
  phone: string | null
  avatar_url: string | null
}

export interface Zone {
  id: number
  name: string
  city: string
  district: string | null
  description: string | null
  status: string
}

export interface Screen {
  id: number
  screen_code: string
  name: string
  location_id: number | null
  zone_id: number | null
  zone_name?: string
  resolution: string
  orientation: string
  status: string
  monthly_partner_fee: number
}

export interface Campaign {
  id: number
  advertiser_id: number
  name: string
  objective: string | null
  start_date: string
  end_date: string
  spot_duration: number
  frequency_per_hour: number
  status: string
  estimated_price: number
  final_price: number
}

export interface Media {
  id: number
  file_url: string
  file_type: "image" | "video"
  duration_seconds: number
  status: string
  name: string | null
}

export interface PlaylistItem {
  id: number
  media_id: number
  file_url: string
  file_type: "image" | "video"
  duration_seconds: number
  position: number
}

export interface PlaybackLog {
  id: number
  screen_id: number
  campaign_id: number | null
  media_id: number | null
  started_at: string
  duration_seconds: number
  status: string
}
'@


# 6. COMPOSANTS PARTAGES

Write-SeetuFile "components\shared\RoleGuard.tsx" @'
"use client"

import { useUser } from "@clerk/nextjs"
import { useEffect, useState } from "react"

export function RoleGuard({ allowedRoles, children, fallback }: {
  allowedRoles: string[]
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const { user, isLoaded } = useUser()
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    const metaRole = user.publicMetadata.role as string
    if (metaRole) setRole(metaRole)
    else {
      fetch("/api/sync-profile", { method: "POST" })
        .then(r => r.json())
        .then(d => setRole(d.role))
    }
  }, [user])

  if (!isLoaded) return <div className="p-8 text-center">Chargement...</div>
  if (!role) return <div className="p-8 text-center">Synchronisation...</div>
  if (!allowedRoles.includes(role)) {
    return fallback || <div className="p-8 text-center text-red-600">Acces refuse</div>
  }
  return <>{children}</>
}
'@

Write-SeetuFile "components\admin\Sidebar.tsx" @'
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { classNames } from "@/lib/utils"

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/screens", label: "Ecrans", icon: "🖥️" },
  { href: "/admin/campaigns", label: "Campagnes", icon: "📢" },
  { href: "/admin/partners", label: "Partenaires", icon: "🤝" },
  { href: "/admin/advertisers", label: "Annonceurs", icon: "👔" },
  { href: "/admin/economy", label: "Economie", icon: "💰" },
  { href: "/admin/maintenance", label: "Maintenance", icon: "🔧" },
  { href: "/admin/settings", label: "Parametres", icon: "⚙️" },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { user, signOut } = useUser()

  return (
    <aside className="w-64 bg-white border-r min-h-screen flex flex-col">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold text-blue-700">SeetuAds</h1>
        <p className="text-xs text-gray-500">Administration</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {adminLinks.map(link => (
          <Link key={link.href} href={link.href}
            className={classNames(
              pathname === link.href ? "sidebar-link-active" : "sidebar-link"
            )}>
            <span>{link.icon}</span>
            <span>{link.label}</span>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold">
            {user?.firstName?.[0] || "A"}
          </div>
          <div className="text-sm">
            <p className="font-medium">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-gray-500">{user?.primaryEmailAddress?.emailAddress}</p>
          </div>
        </div>
        <button onClick={() => signOut()} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">
          Deconnexion
        </button>
      </div>
    </aside>
  )
}
'@

Write-SeetuFile "components\admin\StatCard.tsx" @'
export function StatCard({ title, value, icon, color = "blue" }: {
  title: string
  value: string | number
  icon: string
  color?: "blue" | "green" | "purple" | "orange" | "red"
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    purple: "bg-purple-50 text-purple-700",
    orange: "bg-orange-50 text-orange-700",
    red: "bg-red-50 text-red-700",
  }
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )
}
'@

Write-SeetuFile "components\advertiser\CampaignWizard.tsx" @'
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const STEPS = ["Zone", "Ecrans", "Dates", "Media", "Prix", "Paiement"]

export function CampaignWizard() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name: "",
    zone_id: "",
    screens: [] as number[],
    start_date: "",
    end_date: "",
    spot_duration: 15,
    frequency_per_hour: 1,
    media_id: "",
    estimated_price: 0,
  })
  const [zones, setZones] = useState<any[]>([])
  const [screens, setScreens] = useState<any[]>([])
  const [medias, setMedias] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const loadZones = async () => {
    const res = await fetch("/api/zones")
    const data = await res.json()
    setZones(data.zones || [])
  }

  const loadScreens = async (zoneId: string) => {
    const res = await fetch(`/api/screens?zone_id=${zoneId}`)
    const data = await res.json()
    setScreens(data.screens || [])
  }

  const loadMedias = async () => {
    const res = await fetch("/api/media")
    const data = await res.json()
    setMedias(data.medias || [])
  }

  const checkInventory = async () => {
    setLoading(true)
    const res = await fetch("/api/inventory/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        screen_ids: form.screens,
        start_date: form.start_date,
        end_date: form.end_date,
        spot_duration: form.spot_duration,
      }),
    })
    const data = await res.json()
    if (data.available) {
      setForm(f => ({ ...f, estimated_price: data.estimated_price }))
      setStep(4)
    } else {
      alert("Inventaire insuffisant: " + data.reason)
    }
    setLoading(false)
  }

  const createCampaign = async () => {
    setLoading(true)
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      router.push("/advertiser/campaigns")
    }
    setLoading(false)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className={`flex flex-col items-center ${i <= step ? "text-blue-600" : "text-gray-400"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-1 ${i <= step ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
              {i + 1}
            </div>
            <span className="text-xs">{s}</span>
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="card space-y-4">
          <h2 className="text-lg font-bold">1. Choisissez une zone</h2>
          <button onClick={loadZones} className="btn-secondary">Charger les zones</button>
          <div className="grid grid-cols-2 gap-3">
            {zones.map(z => (
              <button key={z.id} onClick={() => { setForm(f => ({...f, zone_id: z.id})); setStep(1); loadScreens(z.id); }}
                className={`p-4 border rounded-xl text-left hover:border-blue-500 transition-colors ${form.zone_id == z.id ? "border-blue-500 bg-blue-50" : ""}`}>
                <p className="font-semibold">{z.name}</p>
                <p className="text-sm text-gray-500">{z.city} - {z.district}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="card space-y-4">
          <h2 className="text-lg font-bold">2. Selectionnez les ecrans</h2>
          <div className="space-y-2">
            {screens.map(s => (
              <label key={s.id} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="checkbox" checked={form.screens.includes(s.id)} onChange={e => {
                  setForm(f => ({
                    ...f,
                    screens: e.target.checked ? [...f.screens, s.id] : f.screens.filter(id => id !== s.id)
                  }))
                }} className="w-5 h-5" />
                <div>
                  <p className="font-medium">{s.name} ({s.screen_code})</p>
                  <p className="text-sm text-gray-500">{s.resolution} - {s.status}</p>
                </div>
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(0)} className="btn-secondary">Retour</button>
            <button onClick={() => setStep(2)} disabled={form.screens.length === 0} className="btn-primary">Continuer</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card space-y-4">
          <h2 className="text-lg font-bold">3. Dates et spot</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date debut</label>
              <input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date fin</label>
              <input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Duree spot (sec)</label>
              <select value={form.spot_duration} onChange={e => setForm({...form, spot_duration: parseInt(e.target.value)})} className="input">
                <option value={5}>5s</option>
                <option value={10}>10s</option>
                <option value={15}>15s</option>
                <option value={20}>20s</option>
                <option value={30}>30s</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Freq. / heure</label>
              <input type="number" min={1} max={60} value={form.frequency_per_hour} onChange={e => setForm({...form, frequency_per_hour: parseInt(e.target.value)})} className="input" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="btn-secondary">Retour</button>
            <button onClick={() => { setStep(3); loadMedias(); }} className="btn-primary">Continuer</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card space-y-4">
          <h2 className="text-lg font-bold">4. Choisissez le media</h2>
          <div className="grid grid-cols-3 gap-3">
            {medias.map(m => (
              <button key={m.id} onClick={() => setForm(f => ({...f, media_id: m.id}))}
                className={`border rounded-xl overflow-hidden hover:border-blue-500 transition-colors ${form.media_id == m.id ? "ring-2 ring-blue-500" : ""}`}>
                {m.file_type === "video" ? (
                  <video src={m.file_url} className="w-full h-24 object-cover" muted />
                ) : (
                  <img src={m.file_url} alt="" className="w-full h-24 object-cover" />
                )}
                <div className="p-2 text-xs">#{m.id} - {m.duration_seconds}s</div>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="btn-secondary">Retour</button>
            <button onClick={checkInventory} disabled={!form.media_id} className="btn-primary">
              {loading ? "Calcul..." : "Verifier inventaire & prix"}
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="card space-y-4">
          <h2 className="text-lg font-bold">5. Prix estime</h2>
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">Total estime</p>
            <p className="text-4xl font-bold text-blue-700">{form.estimated_price.toLocaleString()} FCFA</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(3)} className="btn-secondary">Retour</button>
            <button onClick={() => setStep(5)} className="btn-success">Confirmer & payer</button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="card space-y-4">
          <h2 className="text-lg font-bold">6. Paiement</h2>
          <p className="text-gray-600">Montant: <strong>{form.estimated_price.toLocaleString()} FCFA</strong></p>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-4 border rounded-xl hover:border-blue-500 text-center">
              <div className="text-2xl mb-2">📱</div>
              <p className="font-medium">Wave</p>
            </button>
            <button className="p-4 border rounded-xl hover:border-orange-500 text-center">
              <div className="text-2xl mb-2">🍊</div>
              <p className="font-medium">Orange Money</p>
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(4)} className="btn-secondary">Retour</button>
            <button onClick={createCampaign} disabled={loading} className="btn-success">
              {loading ? "Creation..." : "Creer la campagne"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
'@

# 7. PAGES AUTH

Write-SeetuFile "app\(auth)\sign-in\[[...sign-in]]\page.tsx" @'
import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <SignIn routing="hash" />
    </div>
  )
}
'@

Write-SeetuFile "app\(auth)\sign-up\[[...sign-up]]\page.tsx" @'
import { SignUp } from "@clerk/nextjs"

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <SignUp routing="hash" />
    </div>
  )
}
'@

# 8. LANDING PAGE

Write-SeetuFile "app\page.tsx" @'
import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
      <nav className="flex items-center justify-between px-8 py-6">
        <h1 className="text-2xl font-bold">SeetuAds</h1>
        <div className="flex gap-4">
          <Link href="/sign-in" className="px-4 py-2 text-white/80 hover:text-white">Connexion</Link>
          <Link href="/sign-up" className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 font-medium">Inscription</Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-8 pt-20 pb-32 text-center">
        <div className="inline-block px-4 py-1.5 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium mb-6">
          V1 MVP - Sénégal
        </div>
        <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
          Votre campagne publique,<br />
          <span className="text-blue-400">sur tous les écrans.</span>
        </h2>
        <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
          Plateforme SaaS de gestion de campagnes publicitaires digitales. 
          Réseau DOOH, player intelligent, paiement mobile.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/advertiser/campaigns/new" className="px-8 py-4 bg-blue-600 rounded-xl hover:bg-blue-700 font-semibold text-lg transition-all hover:scale-105">
            Lancer une campagne
          </Link>
          <Link href="/ecran/1" className="px-8 py-4 bg-white/10 rounded-xl hover:bg-white/20 font-semibold text-lg transition-all">
            Voir le player
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 text-left">
          <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="text-lg font-bold mb-2">Ciblage par zone</h3>
            <p className="text-gray-400 text-sm">Sélectionnez les quartiers et emplacements précis pour votre campagne.</p>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
            <div className="text-3xl mb-3">💳</div>
            <h3 className="text-lg font-bold mb-2">Paiement mobile</h3>
            <p className="text-gray-400 text-sm">Wave, Orange Money. Paiement sécurisé et confirmation instantanée.</p>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="text-lg font-bold mb-2">Reporting temps réel</h3>
            <p className="text-gray-400 text-sm">Suivez vos diffusions, impressions et ROI en direct.</p>
          </div>
        </div>
      </div>
    </main>
  )
}
'@

# 9. DASHBOARD LAYOUT

Write-SeetuFile "app\(dashboard)\layout.tsx" @'
import { AdminSidebar } from "@/components/admin/Sidebar"
import { getCurrentProfile } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile()
  if (!profile) redirect("/sign-in")

  return (
    <div className="flex min-h-screen bg-gray-50">
      {profile.role === "ADMIN" || profile.role === "OPERATOR" ? <AdminSidebar /> : null}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
'@


# 10. PAGES ADMIN

Write-SeetuFile "app\(dashboard)\admin\page.tsx" @'
import { sql } from "@/lib/db"
import { StatCard } from "@/components/admin/StatCard"
import { formatFCFA } from "@/lib/utils"

export default async function AdminDashboard() {
  const screens = await sql`SELECT COUNT(*) as count FROM screens`
  const campaigns = await sql`SELECT COUNT(*) as count FROM campaigns WHERE status IN ('ACTIVE', 'SCHEDULED')`
  const players = await sql`SELECT COUNT(*) as count FROM players WHERE status = 'ONLINE'`
  const revenue = await sql`SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'COMPLETED'`
  const recentCampaigns = await sql`
    SELECT c.*, a.company_name 
    FROM campaigns c 
    JOIN advertisers a ON c.advertiser_id = a.id 
    ORDER BY c.created_at DESC LIMIT 5
  `
  const offlineScreens = await sql`
    SELECT s.*, z.name as zone_name 
    FROM screens s 
    LEFT JOIN zones z ON s.zone_id = z.id 
    WHERE s.status = 'OFFLINE' LIMIT 5
  `

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Vue d'ensemble du reseau SeetuAds</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Ecrans" value={screens[0].count} icon="🖥️" color="blue" />
        <StatCard title="Campagnes actives" value={campaigns[0].count} icon="📢" color="green" />
        <StatCard title="Players online" value={players[0].count} icon="📡" color="purple" />
        <StatCard title="Revenus totaux" value={formatFCFA(Number(revenue[0].total))} icon="💰" color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-bold mb-4">Campagnes recentes</h2>
          <div className="space-y-3">
            {recentCampaigns.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-gray-500">{c.company_name} - {c.status}</p>
                </div>
                <span className="badge bg-blue-100 text-blue-700">{formatFCFA(Number(c.estimated_price))}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-bold mb-4">Ecrans offline</h2>
          <div className="space-y-3">
            {offlineScreens.length === 0 ? (
              <p className="text-gray-400 text-sm">Tous les ecrans sont en ligne</p>
            ) : (
              offlineScreens.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.zone_name} - {s.screen_code}</p>
                  </div>
                  <span className="badge bg-red-100 text-red-700">OFFLINE</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
'@

Write-SeetuFile "app\(dashboard)\admin\screens\page.tsx" @'
"use client"

import { useEffect, useState } from "react"

export default function AdminScreens() {
  const [screens, setScreens] = useState<any[]>([])
  const [zones, setZones] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: "", zone_id: "", resolution: "1920x1080", screen_code: "" })

  useEffect(() => {
    fetch("/api/admin/screens").then(r => r.json()).then(d => setScreens(d.screens || []))
    fetch("/api/zones").then(r => r.json()).then(d => setZones(d.zones || []))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch("/api/screens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setShowForm(false)
    fetch("/api/admin/screens").then(r => r.json()).then(d => setScreens(d.screens || []))
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ecrans</h1>
          <p className="text-gray-500">Gestion du parc d'ecrans</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">+ Ajouter un ecran</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card grid grid-cols-1 md:grid-cols-4 gap-4">
          <input type="text" placeholder="Nom" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input" required />
          <input type="text" placeholder="Code (ex: SDA-DKR-001)" value={form.screen_code} onChange={e => setForm({...form, screen_code: e.target.value})} className="input" required />
          <select value={form.zone_id} onChange={e => setForm({...form, zone_id: e.target.value})} className="input" required>
            <option value="">Choisir une zone</option>
            {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
          </select>
          <select value={form.resolution} onChange={e => setForm({...form, resolution: e.target.value})} className="input">
            <option value="1920x1080">1920x1080</option>
            <option value="3840x2160">4K</option>
            <option value="1080x1920">Portrait</option>
          </select>
          <div className="md:col-span-4 flex gap-2">
            <button type="submit" className="btn-success">Creer</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Annuler</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {screens.map(s => (
          <div key={s.id} className="card">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold">{s.name}</h3>
                <p className="text-xs text-gray-500">{s.screen_code}</p>
              </div>
              <span className={`badge ${s.status === 'ONLINE' ? 'bg-green-100 text-green-700' : s.status === 'OFFLINE' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {s.status}
              </span>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Zone: {s.zone_name || "N/A"}</p>
              <p>Resolution: {s.resolution}</p>
              <p>Player: {s.device_id ? "Connecte" : "Aucun"}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
'@

Write-SeetuFile "app\(dashboard)\admin\campaigns\page.tsx" @'
"use client"

import { useEffect, useState } from "react"
import { formatFCFA, formatDate } from "@/lib/utils"

export default function AdminCampaigns() {
  const [campaigns, setCampaigns] = useState<any[]>([])

  useEffect(() => {
    fetch("/api/admin/campaigns").then(r => r.json()).then(d => setCampaigns(d.campaigns || []))
  }, [])

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700",
    SCHEDULED: "bg-blue-100 text-blue-700",
    PENDING_REVIEW: "bg-yellow-100 text-yellow-700",
    AWAITING_PAYMENT: "bg-orange-100 text-orange-700",
    DRAFT: "bg-gray-100 text-gray-700",
    COMPLETED: "bg-purple-100 text-purple-700",
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Campagnes</h1>
        <p className="text-gray-500">Supervision de toutes les campagnes</p>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-3 font-semibold">Nom</th>
              <th className="pb-3 font-semibold">Client</th>
              <th className="pb-3 font-semibold">Periode</th>
              <th className="pb-3 font-semibold">Prix</th>
              <th className="pb-3 font-semibold">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {campaigns.map(c => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="py-3 font-medium">{c.name}</td>
                <td className="py-3">{c.company_name}</td>
                <td className="py-3">{formatDate(c.start_date)} - {formatDate(c.end_date)}</td>
                <td className="py-3">{formatFCFA(Number(c.final_price || c.estimated_price))}</td>
                <td className="py-3">
                  <span className={`badge ${statusColors[c.status] || "bg-gray-100"}`}>{c.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
'@

Write-SeetuFile "app\(dashboard)\admin\partners\page.tsx" @'
"use client"

import { useEffect, useState } from "react"

export default function AdminPartners() {
  const [partners, setPartners] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ business_name: "", owner_name: "", phone: "", city: "Dakar" })

  useEffect(() => {
    fetch("/api/admin/partners").then(r => r.json()).then(d => setPartners(d.partners || []))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch("/api/admin/partners", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    setShowForm(false)
    fetch("/api/admin/partners").then(r => r.json()).then(d => setPartners(d.partners || []))
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Partenaires</h1>
          <p className="text-gray-500">Commercants et emplacements</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">+ Ajouter</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card grid grid-cols-1 md:grid-cols-4 gap-4">
          <input placeholder="Nom commerce" value={form.business_name} onChange={e => setForm({...form, business_name: e.target.value})} className="input" required />
          <input placeholder="Nom proprietaire" value={form.owner_name} onChange={e => setForm({...form, owner_name: e.target.value})} className="input" />
          <input placeholder="Telephone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="input" />
          <input placeholder="Ville" value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="input" />
          <div className="md:col-span-4 flex gap-2">
            <button type="submit" className="btn-success">Creer</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Annuler</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {partners.map(p => (
          <div key={p.id} className="card">
            <h3 className="font-semibold">{p.business_name}</h3>
            <p className="text-sm text-gray-500">{p.owner_name} - {p.phone}</p>
            <p className="text-sm text-gray-500">{p.city}</p>
            <span className={`badge mt-2 ${p.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{p.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
'@

Write-SeetuFile "app\(dashboard)\admin\advertisers\page.tsx" @'
"use client"

import { useEffect, useState } from "react"

export default function AdminAdvertisers() {
  const [advertisers, setAdvertisers] = useState<any[]>([])
  useEffect(() => {
    fetch("/api/admin/advertisers").then(r => r.json()).then(d => setAdvertisers(d.advertisers || []))
  }, [])
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Annonceurs</h1>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left"><th className="pb-3">Societe</th><th className="pb-3">Contact</th><th className="pb-3">Email</th><th className="pb-3">Statut</th></tr></thead>
          <tbody className="divide-y">
            {advertisers.map(a => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="py-3 font-medium">{a.company_name}</td>
                <td className="py-3">{a.contact_name}</td>
                <td className="py-3">{a.email}</td>
                <td className="py-3"><span className={`badge ${a.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{a.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
'@

Write-SeetuFile "app\(dashboard)\admin\economy\page.tsx" @'
import { sql } from "@/lib/db"
import { formatFCFA } from "@/lib/utils"

export default async function AdminEconomy() {
  const economy = await sql`
    SELECT * FROM v_screen_economy ORDER BY total_revenue DESC
  `
  const totalRevenue = economy.reduce((a: number, s: any) => a + Number(s.total_revenue), 0)
  const totalScreens = economy.length
  const avgRevenue = totalScreens > 0 ? totalRevenue / totalScreens : 0

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Economie du reseau</h1>
        <p className="text-gray-500">Rentabilite et performance par ecran</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-sm text-gray-500">Revenu total</p>
          <p className="text-3xl font-bold text-blue-700">{formatFCFA(totalRevenue)}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">Ecrans actifs</p>
          <p className="text-3xl font-bold text-green-700">{totalScreens}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">Revenu moyen / ecran</p>
          <p className="text-3xl font-bold text-purple-700">{formatFCFA(avgRevenue)}</p>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-bold mb-4">Detail par ecran</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-3">Code</th>
              <th className="pb-3">Nom</th>
              <th className="pb-3">Zone</th>
              <th className="pb-3">Revenus</th>
              <th className="pb-3">Diffusions</th>
              <th className="pb-3">Frais partenaire</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {economy.map((s: any) => (
              <tr key={s.screen_id} className="hover:bg-gray-50">
                <td className="py-3 font-mono text-xs">{s.screen_code}</td>
                <td className="py-3">{s.name}</td>
                <td className="py-3">{s.zone_name}</td>
                <td className="py-3 font-medium">{formatFCFA(Number(s.total_revenue))}</td>
                <td className="py-3">{s.total_playbacks}</td>
                <td className="py-3">{formatFCFA(Number(s.monthly_partner_fee))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
'@

Write-SeetuFile "app\(dashboard)\admin\maintenance\page.tsx" @'
"use client"

import { useEffect, useState } from "react"

export default function AdminMaintenance() {
  const [tickets, setTickets] = useState<any[]>([])
  useEffect(() => {
    fetch("/api/admin/maintenance").then(r => r.json()).then(d => setTickets(d.tickets || []))
  }, [])
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Maintenance</h1>
      <div className="space-y-3">
        {tickets.map(t => (
          <div key={t.id} className="card flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{t.title}</h3>
              <p className="text-sm text-gray-500">{t.description}</p>
              <p className="text-xs text-gray-400">Priorite: {t.priority} - {t.status}</p>
            </div>
            <span className={`badge ${t.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' : t.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
              {t.priority}
            </span>
          </div>
        ))}
        {tickets.length === 0 && <p className="text-gray-400">Aucun ticket de maintenance</p>}
      </div>
    </div>
  )
}
'@

Write-SeetuFile "app\(dashboard)\admin\settings\page.tsx" @'
"use client"

import { useState } from "react"

export default function AdminSettings() {
  const [config, setConfig] = useState({
    inventory_loop_seconds: 120,
    reservation_ttl_minutes: 15,
    offline_threshold_minutes: 5,
    amortization_months: 48,
  })

  return (
    <div className="p-8 space-y-6 max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900">Parametres systeme</h1>
      <div className="card space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Duree boucle playlist (secondes)</label>
          <input type="number" value={config.inventory_loop_seconds} onChange={e => setConfig({...config, inventory_loop_seconds: parseInt(e.target.value)})} className="input" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">TTL reservation temporaire (minutes)</label>
          <input type="number" value={config.reservation_ttl_minutes} onChange={e => setConfig({...config, reservation_ttl_minutes: parseInt(e.target.value)})} className="input" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Seuil offline (minutes)</label>
          <input type="number" value={config.offline_threshold_minutes} onChange={e => setConfig({...config, offline_threshold_minutes: parseInt(e.target.value)})} className="input" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Amortissement (mois)</label>
          <input type="number" value={config.amortization_months} onChange={e => setConfig({...config, amortization_months: parseInt(e.target.value)})} className="input" />
        </div>
        <button className="btn-primary">Enregistrer</button>
      </div>
    </div>
  )
}
'@


# 11. PAGES ADVERTISER

Write-SeetuFile "app\(dashboard)\advertiser\page.tsx" @'
"use client"

import { useUser } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import Link from "next/link"
import { formatFCFA } from "@/lib/utils"

export default function AdvertiserDashboard() {
  const { user } = useUser()
  const [stats, setStats] = useState({ campaigns: 0, active: 0, spent: 0 })
  const [campaigns, setCampaigns] = useState<any[]>([])

  useEffect(() => {
    fetch("/api/advertiser/profile").then(r => r.json()).then(d => {
      if (d.advertiser) {
        fetch(`/api/campaigns?advertiser_id=${d.advertiser.id}`).then(r => r.json()).then(c => {
          setCampaigns(c.campaigns || [])
          setStats({
            campaigns: c.campaigns?.length || 0,
            active: c.campaigns?.filter((x: any) => x.status === "ACTIVE").length || 0,
            spent: c.campaigns?.reduce((a: number, x: any) => a + Number(x.final_price || x.estimated_price), 0) || 0,
          })
        })
      }
    })
  }, [])

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bonjour {user?.firstName}</h1>
        <p className="text-gray-500">Votre espace annonceur</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-sm text-gray-500">Campagnes</p>
          <p className="text-3xl font-bold text-blue-700">{stats.campaigns}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">Actives</p>
          <p className="text-3xl font-bold text-green-700">{stats.active}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">Total depense</p>
          <p className="text-3xl font-bold text-purple-700">{formatFCFA(stats.spent)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Vos campagnes</h2>
        <Link href="/advertiser/campaigns/new" className="btn-primary">+ Nouvelle campagne</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {campaigns.map(c => (
          <div key={c.id} className="card">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold">{c.name}</h3>
              <span className={`badge ${c.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : c.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>{c.status}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">{c.start_date} - {c.end_date}</p>
            <p className="text-sm font-medium mt-2">{formatFCFA(Number(c.final_price || c.estimated_price))}</p>
          </div>
        ))}
        {campaigns.length === 0 && <p className="text-gray-400 col-span-2 text-center py-8">Aucune campagne. Creez votre premiere !</p>}
      </div>
    </div>
  )
}
'@

Write-SeetuFile "app\(dashboard)\advertiser\campaigns\page.tsx" @'
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { formatFCFA, formatDate } from "@/lib/utils"

export default function AdvertiserCampaigns() {
  const [campaigns, setCampaigns] = useState<any[]>([])
  useEffect(() => {
    fetch("/api/advertiser/profile").then(r => r.json()).then(d => {
      if (d.advertiser) {
        fetch(`/api/campaigns?advertiser_id=${d.advertiser.id}`).then(r => r.json()).then(c => setCampaigns(c.campaigns || []))
      }
    })
  }, [])

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Mes campagnes</h1>
        <Link href="/advertiser/campaigns/new" className="btn-primary">+ Nouvelle</Link>
      </div>
      <div className="space-y-3">
        {campaigns.map(c => (
          <div key={c.id} className="card flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{c.name}</h3>
              <p className="text-sm text-gray-500">{formatDate(c.start_date)} - {formatDate(c.end_date)} • {c.spot_duration}s • {c.frequency_per_hour}x/h</p>
            </div>
            <div className="text-right">
              <p className="font-bold">{formatFCFA(Number(c.final_price || c.estimated_price))}</p>
              <span className={`badge ${c.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : c.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>{c.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
'@

Write-SeetuFile "app\(dashboard)\advertiser\campaigns\new\page.tsx" @'
import { CampaignWizard } from "@/components/advertiser/CampaignWizard"

export default function NewCampaignPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Nouvelle campagne</h1>
      <p className="text-gray-500 mb-8">Suivez les etapes pour creer et lancer votre campagne</p>
      <CampaignWizard />
    </div>
  )
}
'@

Write-SeetuFile "app\(dashboard)\advertiser\media\page.tsx" @'
"use client"

import { useEffect, useState } from "react"

export default function AdvertiserMedia() {
  const [medias, setMedias] = useState<any[]>([])
  const [uploads, setUploads] = useState<any[]>([])

  useEffect(() => {
    loadMedias()
  }, [])

  const loadMedias = () => {
    fetch("/api/media").then(r => r.json()).then(d => setMedias(d.medias || []))
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    for (const file of Array.from(files)) {
      const formData = new FormData()
      formData.append("file", file)
      setUploads(prev => [...prev, { name: file.name, status: "uploading" }])
      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData })
        if (res.ok) {
          setUploads(prev => prev.map(u => u.name === file.name ? { ...u, status: "done" } : u))
        } else {
          setUploads(prev => prev.map(u => u.name === file.name ? { ...u, status: "error" } : u))
        }
      } catch {
        setUploads(prev => prev.map(u => u.name === file.name ? { ...u, status: "error" } : u))
      }
    }
    setTimeout(loadMedias, 1000)
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Mes medias</h1>
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Uploader</h2>
        <input type="file" multiple accept="image/*,video/*" onChange={handleFile} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
        {uploads.length > 0 && (
          <div className="mt-4 space-y-1">
            {uploads.map((u, i) => (
              <div key={i} className="text-sm flex items-center gap-2">
                <span>{u.status === "done" ? "✅" : u.status === "error" ? "❌" : "⏳"}</span>
                <span>{u.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {medias.map(m => (
          <div key={m.id} className="bg-white rounded-xl border overflow-hidden">
            {m.file_type === "video" ? (
              <video src={m.file_url} className="w-full h-32 object-cover" muted />
            ) : (
              <img src={m.file_url} alt="" className="w-full h-32 object-cover" />
            )}
            <div className="p-2 text-xs text-gray-500">#{m.id} - {m.duration_seconds}s - {m.status}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
'@

# 12. PAGE PARTNER

Write-SeetuFile "app\(dashboard)\partner\page.tsx" @'
"use client"

import { useUser } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import { formatFCFA } from "@/lib/utils"

export default function PartnerDashboard() {
  const { user } = useUser()
  const [partner, setPartner] = useState<any>(null)
  const [payouts, setPayouts] = useState<any[]>([])

  useEffect(() => {
    fetch("/api/partner/profile").then(r => r.json()).then(d => {
      setPartner(d.partner)
      if (d.partner) {
        fetch(`/api/admin/payments?partner_id=${d.partner.id}`).then(r => r.json()).then(p => setPayouts(p.payouts || []))
      }
    })
  }, [])

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bonjour {user?.firstName}</h1>
        <p className="text-gray-500">Votre espace partenaire</p>
      </div>

      {partner && (
        <div className="card">
          <h2 className="text-lg font-bold mb-2">{partner.business_name}</h2>
          <p className="text-gray-600">{partner.address}, {partner.city}</p>
          <p className="text-gray-600">{partner.phone}</p>
          <span className={`badge mt-2 ${partner.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{partner.status}</span>
        </div>
      )}

      <div className="card">
        <h2 className="text-lg font-bold mb-4">Paiements recus</h2>
        <div className="space-y-2">
          {payouts.map(p => (
            <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">{formatDate(p.period_start)} - {formatDate(p.period_end)}</p>
                <p className="text-xs text-gray-500">{p.status}</p>
              </div>
              <span className="font-bold">{formatFCFA(Number(p.amount))}</span>
            </div>
          ))}
          {payouts.length === 0 && <p className="text-gray-400">Aucun paiement enregistre</p>}
        </div>
      </div>
    </div>
  )
}
'@

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR")
}
'@

# 13. PLAYER WEB

Write-SeetuFile "app\ecran\[id]\page.tsx" @'
"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useParams } from "next/navigation"

interface PlaylistItem {
  id: number
  file_url: string
  file_type: "image" | "video"
  duration_seconds: number
  position: number
}

export default function EcranPage() {
  const params = useParams()
  const ecranId = parseInt(params.id as string)
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const fetchPlaylist = useCallback(async () => {
    try {
      const res = await fetch(`/api/player/playlist?screen_id=${ecranId}`)
      const data = await res.json()
      setPlaylist(data.items || [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [ecranId])

  useEffect(() => {
    fetchPlaylist()
    const interval = setInterval(fetchPlaylist, 30000)
    return () => clearInterval(interval)
  }, [fetchPlaylist])

  useEffect(() => {
    if (playlist.length === 0) return
    const current = playlist[currentIndex]
    if (timerRef.current) clearTimeout(timerRef.current)
    if (current.file_type === "image") {
      timerRef.current = setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % playlist.length)
      }, current.duration_seconds * 1000)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [currentIndex, playlist])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!document.fullscreenElement && containerRef.current) {
        containerRef.current.requestFullscreen().catch(() => {})
      }
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  if (loading) return <div className="fixed inset-0 bg-black flex items-center justify-center text-white animate-pulse">Chargement...</div>
  if (playlist.length === 0) return (
    <div className="fixed inset-0 bg-black flex items-center justify-center text-white flex-col gap-4">
      <div className="text-6xl">📺</div>
      <div className="text-2xl">Aucun contenu programme</div>
    </div>
  )

  const current = playlist[currentIndex]

  return (
    <div ref={containerRef} className="fixed inset-0 bg-black overflow-hidden" onDoubleClick={() => containerRef.current?.requestFullscreen()}>
      {current.file_type === "video" ? (
        <video src={current.file_url} autoPlay muted playsInline className="w-full h-full object-contain" onEnded={() => setCurrentIndex(prev => (prev + 1) % playlist.length)} />
      ) : (
        <img src={current.file_url} alt="" className="w-full h-full object-contain" />
      )}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {playlist.map((_, idx) => (
          <div key={idx} className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentIndex ? "w-8 bg-white" : "w-2 bg-white/30"}`} />
        ))}
      </div>
      <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/40 text-white/70 text-xs rounded-full">
        Ecran #{ecranId} • {currentIndex + 1}/{playlist.length}
      </div>
    </div>
  )
}
'@


# 14. API ROUTES

Write-SeetuFile "app\api\sync-profile\route.ts" @'
import { auth } from "@clerk/nextjs/server"
import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: "Non authentifie" }, { status: 401 })

    const existing = await sql`SELECT user_id, role FROM profiles WHERE clerk_user_id = ${clerkId}`
    if (existing.length > 0) {
      return NextResponse.json({ role: existing[0].role })
    }

    const result = await sql`
      INSERT INTO profiles (clerk_user_id, role, full_name)
      VALUES (${clerkId}, 'ADVERTISER', 'Nouvel utilisateur')
      RETURNING user_id, role
    `
    return NextResponse.json({ role: result[0].role })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
'@

Write-SeetuFile "app\api\zones\route.ts" @'
import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const zones = await sql`SELECT * FROM zones WHERE status = 'ACTIVE' ORDER BY name`
    return NextResponse.json({ zones })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { name, city, district } = await request.json()
    const result = await sql`
      INSERT INTO zones (name, city, district, status)
      VALUES (${name}, ${city}, ${district}, 'ACTIVE')
      RETURNING *
    `
    return NextResponse.json({ zone: result[0] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
'@

Write-SeetuFile "app\api\screens\route.ts" @'
import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const zoneId = searchParams.get("zone_id")
    const screens = zoneId
      ? await sql`SELECT s.*, z.name as zone_name FROM screens s LEFT JOIN zones z ON s.zone_id = z.id WHERE s.zone_id = ${parseInt(zoneId)} ORDER BY s.name`
      : await sql`SELECT s.*, z.name as zone_name FROM screens s LEFT JOIN zones z ON s.zone_id = z.id ORDER BY s.name`
    return NextResponse.json({ screens })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { name, screen_code, zone_id, resolution } = await request.json()
    const result = await sql`
      INSERT INTO screens (name, screen_code, zone_id, resolution, status, created_at)
      VALUES (${name}, ${screen_code}, ${zone_id ? parseInt(zone_id) : null}, ${resolution || '1920x1080'}, 'OFFLINE', NOW())
      RETURNING *
    `
    return NextResponse.json({ screen: result[0] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
'@

Write-SeetuFile "app\api\screens\[id]\route.ts" @'
import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const screen = await sql`SELECT * FROM screens WHERE id = ${parseInt(id)}`
    if (screen.length === 0) return NextResponse.json({ error: "Ecran non trouve" }, { status: 404 })
    return NextResponse.json({ screen: screen[0] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const result = await sql`
      UPDATE screens SET
        name = COALESCE(${body.name}, name),
        zone_id = COALESCE(${body.zone_id ? parseInt(body.zone_id) : null}, zone_id),
        resolution = COALESCE(${body.resolution}, resolution),
        status = COALESCE(${body.status}, status),
        monthly_partner_fee = COALESCE(${body.monthly_partner_fee}, monthly_partner_fee)
      WHERE id = ${parseInt(id)}
      RETURNING *
    `
    return NextResponse.json({ screen: result[0] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await sql`DELETE FROM screens WHERE id = ${parseInt(id)}`
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
'@

Write-SeetuFile "app\api\campaigns\route.ts" @'
import { auth } from "@clerk/nextjs/server"
import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const advertiserId = searchParams.get("advertiser_id")
    const campaigns = advertiserId
      ? await sql`SELECT * FROM campaigns WHERE advertiser_id = ${parseInt(advertiserId)} ORDER BY created_at DESC`
      : await sql`SELECT c.*, a.company_name FROM campaigns c JOIN advertisers a ON c.advertiser_id = a.id ORDER BY c.created_at DESC`
    return NextResponse.json({ campaigns })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: "Non authentifie" }, { status: 401 })

    const body = await request.json()
    const adv = await sql`SELECT id FROM advertisers WHERE user_id = (SELECT user_id FROM profiles WHERE clerk_user_id = ${clerkId})`
    const advertiserId = adv[0]?.id
    if (!advertiserId) return NextResponse.json({ error: "Profil annonceur non trouve" }, { status: 400 })

    const result = await sql`
      INSERT INTO campaigns (advertiser_id, name, objective, start_date, end_date, spot_duration, frequency_per_hour, status, estimated_price, final_price, created_at)
      VALUES (${advertiserId}, ${body.name}, ${body.objective || ''}, ${body.start_date}, ${body.end_date}, ${body.spot_duration || 15}, ${body.frequency_per_hour || 1}, 'PENDING_REVIEW', ${body.estimated_price || 0}, ${body.estimated_price || 0}, NOW())
      RETURNING *
    `

    // Associer ecrans
    if (body.screens && body.screens.length > 0) {
      for (const screenId of body.screens) {
        await sql`INSERT INTO campaign_screens (campaign_id, screen_id, status) VALUES (${result[0].id}, ${screenId}, 'SCHEDULED')`
      }
    }

    // Associer media
    if (body.media_id) {
      await sql`INSERT INTO campaign_media (campaign_id, media_id, display_order, duration_seconds) VALUES (${result[0].id}, ${parseInt(body.media_id)}, 1, ${body.spot_duration || 15})`
    }

    return NextResponse.json({ campaign: result[0] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
'@

Write-SeetuFile "app\api\campaigns\[id]\route.ts" @'
import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const campaign = await sql`SELECT * FROM campaigns WHERE id = ${parseInt(id)}`
    if (campaign.length === 0) return NextResponse.json({ error: "Campagne non trouvee" }, { status: 404 })
    return NextResponse.json({ campaign: campaign[0] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const result = await sql`
      UPDATE campaigns SET
        name = COALESCE(${body.name}, name),
        status = COALESCE(${body.status}, status),
        final_price = COALESCE(${body.final_price}, final_price)
      WHERE id = ${parseInt(id)}
      RETURNING *
    `
    return NextResponse.json({ campaign: result[0] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await sql`DELETE FROM campaigns WHERE id = ${parseInt(id)}`
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
'@

Write-SeetuFile "app\api\media\route.ts" @'
import { auth } from "@clerk/nextjs/server"
import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: "Non authentifie" }, { status: 401 })

    const adv = await sql`SELECT id FROM advertisers WHERE user_id = (SELECT user_id FROM profiles WHERE clerk_user_id = ${clerkId})`
    const advertiserId = adv[0]?.id
    if (!advertiserId) return NextResponse.json({ medias: [] })

    const medias = await sql`SELECT * FROM media WHERE advertiser_id = ${advertiserId} ORDER BY created_at DESC`
    return NextResponse.json({ medias })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
'@

Write-SeetuFile "app\api\media\[id]\route.ts" @'
import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await sql`DELETE FROM media WHERE id = ${parseInt(id)}`
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
'@

Write-SeetuFile "app\api\upload\route.ts" @'
import { v2 as cloudinary } from "cloudinary"
import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { auth } from "@clerk/nextjs/server"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: "Non authentifie" }, { status: 401 })

    const adv = await sql`SELECT id FROM advertisers WHERE user_id = (SELECT user_id FROM profiles WHERE clerk_user_id = ${clerkId})`
    const advertiserId = adv[0]?.id
    if (!advertiserId) return NextResponse.json({ error: "Profil annonceur requis" }, { status: 400 })

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file) return NextResponse.json({ error: "Aucun fichier" }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const resourceType = file.type.startsWith("video") ? "video" : "image"

    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "seetuads/campagnes", resource_type: resourceType },
        (error, result) => { if (error) reject(error); else resolve(result) }
      )
      uploadStream.end(buffer)
    })

    const duration = resourceType === "video" ? 15 : 10
    const inserted = await sql`
      INSERT INTO media (advertiser_id, name, file_url, file_type, mime_type, duration_seconds, file_size, public_id, status)
      VALUES (${advertiserId}, ${file.name}, ${result.secure_url}, ${resourceType}, ${file.type}, ${duration}, ${file.size}, ${result.public_id}, 'APPROVED')
      RETURNING *
    `

    return NextResponse.json({ media: inserted[0] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Upload echoue" }, { status: 500 })
  }
}
'@


Write-SeetuFile "app\api\inventory\check\route.ts" @'
import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { screen_ids, start_date, end_date, spot_duration } = await request.json()
    if (!screen_ids?.length || !start_date || !end_date || !spot_duration) {
      return NextResponse.json({ error: "Parametres manquants" }, { status: 400 })
    }

    const config = await sql`SELECT value FROM system_config WHERE key = 'inventory_loop_seconds'`
    const loopSeconds = parseInt(config[0]?.value || "120")

    const start = new Date(start_date)
    const end = new Date(end_date)
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1)

    // Verifier chaque ecran
    for (const screenId of screen_ids) {
      const reserved = await sql`
        SELECT COALESCE(SUM(reserved_seconds), 0) as total
        FROM inventory_reservations
        WHERE screen_id = ${screenId} AND status = 'CONFIRMED'
        AND start_date <= ${end_date} AND end_date >= ${start_date}
      `
      const totalReserved = parseInt(reserved[0].total)
      // Capacite par boucle = loopSeconds. On considere que chaque campagne prend spot_duration par boucle.
      // Simplification : on verifie que spot_duration + reserved <= loopSeconds
      if (totalReserved + spot_duration > loopSeconds) {
        return NextResponse.json({ available: false, reason: `Inventaire insuffisant sur ecran ${screenId}` })
      }
    }

    // Calcul prix estime (simplifie)
    const pricing = await sql`SELECT base_price FROM pricing_rules WHERE zone_id = (SELECT zone_id FROM screens WHERE id = ${screen_ids[0]}) AND active = true LIMIT 1`
    const basePrice = pricing[0]?.base_price ? parseFloat(pricing[0].base_price) : 50000
    const estimatedPrice = basePrice * screen_ids.length * days

    return NextResponse.json({ available: true, estimated_price: estimatedPrice, loop_seconds: loopSeconds })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
'@

Write-SeetuFile "app\api\inventory\reserve\route.ts" @'
import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { campaign_id, screen_ids, start_date, end_date, spot_duration } = await request.json()
    const config = await sql`SELECT value FROM system_config WHERE key = 'reservation_ttl_minutes'`
    const ttlMinutes = parseInt(config[0]?.value || "15")
    const expiresAt = new Date(Date.now() + ttlMinutes * 60000)

    for (const screenId of screen_ids) {
      await sql`
        INSERT INTO inventory_reservations (campaign_id, screen_id, start_date, end_date, reserved_seconds, status, expires_at)
        VALUES (${campaign_id}, ${screenId}, ${start_date}, ${end_date}, ${spot_duration}, 'TEMPORARY', ${expiresAt.toISOString()})
      `
    }
    return NextResponse.json({ reserved: true, expires_at: expiresAt })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
'@

Write-SeetuFile "app\api\inventory\release\route.ts" @'
import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { campaign_id } = await request.json()
    await sql`UPDATE inventory_reservations SET status = 'CANCELLED' WHERE campaign_id = ${campaign_id}`
    return NextResponse.json({ released: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
'@

Write-SeetuFile "app\api\player\register\route.ts" @'
import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { device_id, serial_number, screen_code } = await request.json()
    if (!device_id) return NextResponse.json({ error: "device_id requis" }, { status: 400 })

    const existing = await sql`SELECT * FROM players WHERE device_id = ${device_id}`
    if (existing.length > 0) {
      await sql`UPDATE players SET last_heartbeat = NOW(), status = 'ONLINE' WHERE device_id = ${device_id}`
      return NextResponse.json({ player: existing[0], token: existing[0].device_token })
    }

    const screen = screen_code ? await sql`SELECT id FROM screens WHERE screen_code = ${screen_code}` : []
    const screenId = screen[0]?.id

    const token = crypto.randomUUID()
    const result = await sql`
      INSERT INTO players (screen_id, device_id, device_token, serial_number, status, last_heartbeat, created_at)
      VALUES (${screenId || null}, ${device_id}, ${token}, ${serial_number}, 'ONLINE', NOW(), NOW())
      RETURNING *
    `
    return NextResponse.json({ player: result[0], token })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
'@

Write-SeetuFile "app\api\player\heartbeat\route.ts" @'
import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { device_id, app_version, playlist_version, storage_status } = await request.json()
    await sql`
      UPDATE players SET
        last_heartbeat = NOW(),
        status = 'ONLINE',
        app_version = COALESCE(${app_version}, app_version),
        storage_status = COALESCE(${storage_status}, storage_status)
      WHERE device_id = ${device_id}
    `
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
'@

Write-SeetuFile "app\api\player\playlist\route.ts" @'
import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const screenId = searchParams.get("screen_id")
    if (!screenId) return NextResponse.json({ error: "screen_id requis" }, { status: 400 })

    // Recuperer la playlist active la plus recente
    const playlist = await sql`
      SELECT * FROM playlists 
      WHERE screen_id = ${parseInt(screenId)} AND status = 'ACTIVE' 
      ORDER BY version DESC LIMIT 1
    `

    if (playlist.length === 0) {
      // Generer une playlist a la volee depuis les campagnes actives
      const items = await sql`
        SELECT cm.media_id, m.file_url, m.file_type, cm.duration_seconds, c.id as campaign_id
        FROM campaign_screens cs
        JOIN campaigns c ON cs.campaign_id = c.id AND c.status = 'ACTIVE'
        JOIN campaign_media cm ON c.id = cm.campaign_id
        JOIN media m ON cm.media_id = m.id
        WHERE cs.screen_id = ${parseInt(screenId)} AND m.status = 'APPROVED'
        ORDER BY cm.display_order
      `
      return NextResponse.json({ items: items.map((it: any, idx: number) => ({ ...it, position: idx + 1 })), version: 0 })
    }

    const items = await sql`
      SELECT pi.*, m.file_url, m.file_type 
      FROM playlist_items pi
      JOIN media m ON pi.media_id = m.id
      WHERE pi.playlist_id = ${playlist[0].id}
      ORDER BY pi.position
    `
    return NextResponse.json({ items, version: playlist[0].version })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
'@

Write-SeetuFile "app\api\player\log\route.ts" @'
import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { player_id, screen_id, campaign_id, media_id, started_at, duration_seconds, status } = await request.json()
    await sql`
      INSERT INTO playback_logs (player_id, screen_id, campaign_id, media_id, started_at, duration_seconds, status, created_at)
      VALUES (${player_id}, ${screen_id}, ${campaign_id}, ${media_id}, ${started_at}, ${duration_seconds}, ${status || 'PLAYED'}, NOW())
    `
    return NextResponse.json({ logged: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
'@

Write-SeetuFile "app\api\payments\initiate\route.ts" @'
import { auth } from "@clerk/nextjs/server"
import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: "Non authentifie" }, { status: 401 })

    const { campaign_id, amount, method, telephone } = await request.json()
    const adv = await sql`SELECT id FROM advertisers WHERE user_id = (SELECT user_id FROM profiles WHERE clerk_user_id = ${clerkId})`
    const advertiserId = adv[0]?.id

    const result = await sql`
      INSERT INTO payments (advertiser_id, campaign_id, amount, currency, provider, status, created_at)
      VALUES (${advertiserId}, ${campaign_id}, ${amount}, 'XOF', ${method}, 'PENDING', NOW())
      RETURNING *
    `

    // TODO: Appeler API Wave/Orange Money ici
    return NextResponse.json({ payment: result[0], checkout_url: "/paiement-manuel" })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
'@

Write-SeetuFile "app\api\payments\webhook\wave\route.ts" @'
import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    // Verifier signature ici
    if (body.status === "success" && body.transaction_reference) {
      await sql`UPDATE payments SET status = 'COMPLETED', paid_at = NOW(), transaction_reference = ${body.transaction_reference} WHERE id = ${body.payment_id}`
      // Activer campagne
      const payment = await sql`SELECT campaign_id FROM payments WHERE id = ${body.payment_id}`
      if (payment[0]?.campaign_id) {
        await sql`UPDATE campaigns SET status = 'SCHEDULED' WHERE id = ${payment[0].campaign_id}`
        await sql`UPDATE inventory_reservations SET status = 'CONFIRMED' WHERE campaign_id = ${payment[0].campaign_id}`
      }
    }
    return NextResponse.json({ received: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
'@

Write-SeetuFile "app\api\payments\webhook\orange\route.ts" @'
import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (body.status === "SUCCESS" && body.payment_id) {
      await sql`UPDATE payments SET status = 'COMPLETED', paid_at = NOW(), transaction_reference = ${body.transaction_id} WHERE id = ${body.payment_id}`
      const payment = await sql`SELECT campaign_id FROM payments WHERE id = ${body.payment_id}`
      if (payment[0]?.campaign_id) {
        await sql`UPDATE campaigns SET status = 'SCHEDULED' WHERE id = ${payment[0].campaign_id}`
        await sql`UPDATE inventory_reservations SET status = 'CONFIRMED' WHERE campaign_id = ${payment[0].campaign_id}`
      }
    }
    return NextResponse.json({ received: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
'@

Write-SeetuFile "app\api\advertiser\profile\route.ts" @'
import { auth } from "@clerk/nextjs/server"
import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: "Non authentifie" }, { status: 401 })

    const profile = await sql`SELECT user_id, role FROM profiles WHERE clerk_user_id = ${clerkId}`
    if (profile.length === 0) return NextResponse.json({ error: "Profil non trouve" }, { status: 404 })

    const advertiser = await sql`SELECT * FROM advertisers WHERE user_id = ${profile[0].user_id}`
    if (advertiser.length === 0) {
      // Creer automatiquement
      const user = await sql`SELECT full_name FROM profiles WHERE clerk_user_id = ${clerkId}`
      const newAdv = await sql`
        INSERT INTO advertisers (user_id, company_name, contact_name, email, status, created_at)
        VALUES (${profile[0].user_id}, ${user[0]?.full_name || 'Societe'}, ${user[0]?.full_name || ''}, '', 'ACTIVE', NOW())
        RETURNING *
      `
      return NextResponse.json({ advertiser: newAdv[0], profile: profile[0] })
    }
    return NextResponse.json({ advertiser: advertiser[0], profile: profile[0] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
'@

Write-SeetuFile "app\api\partner\profile\route.ts" @'
import { auth } from "@clerk/nextjs/server"
import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: "Non authentifie" }, { status: 401 })

    const profile = await sql`SELECT user_id FROM profiles WHERE clerk_user_id = ${clerkId}`
    if (profile.length === 0) return NextResponse.json({ error: "Profil non trouve" }, { status: 404 })

    const partner = await sql`SELECT * FROM partners WHERE user_id = ${profile[0].user_id}`
    if (partner.length === 0) return NextResponse.json({ error: "Partenaire non trouve" }, { status: 404 })
    return NextResponse.json({ partner: partner[0] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
'@

Write-SeetuFile "app\api\admin\screens\route.ts" @'
import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const screens = await sql`
      SELECT s.*, z.name as zone_name, p.device_id 
      FROM screens s 
      LEFT JOIN zones z ON s.zone_id = z.id 
      LEFT JOIN players p ON s.id = p.screen_id
      ORDER BY s.created_at DESC
    `
    return NextResponse.json({ screens })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
'@

Write-SeetuFile "app\api\admin\campaigns\route.ts" @'
import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const campaigns = await sql`
      SELECT c.*, a.company_name 
      FROM campaigns c 
      JOIN advertisers a ON c.advertiser_id = a.id 
      ORDER BY c.created_at DESC
    `
    return NextResponse.json({ campaigns })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
'@

Write-SeetuFile "app\api\admin\partners\route.ts" @'
import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const partners = await sql`SELECT * FROM partners ORDER BY created_at DESC`
    return NextResponse.json({ partners })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = await sql`
      INSERT INTO partners (business_name, owner_name, phone, city, status, created_at)
      VALUES (${body.business_name}, ${body.owner_name}, ${body.phone}, ${body.city}, 'ACTIVE', NOW())
      RETURNING *
    `
    return NextResponse.json({ partner: result[0] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
'@

Write-SeetuFile "app\api\admin\advertisers\route.ts" @'
import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const advertisers = await sql`SELECT * FROM advertisers ORDER BY created_at DESC`
    return NextResponse.json({ advertisers })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
'@

Write-SeetuFile "app\api\admin\payments\route.ts" @'
import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const partnerId = searchParams.get("partner_id")
    if (partnerId) {
      const payouts = await sql`SELECT * FROM partner_payouts WHERE partner_id = ${parseInt(partnerId)} ORDER BY created_at DESC`
      return NextResponse.json({ payouts })
    }
    const payments = await sql`
      SELECT p.*, c.name as campaign_name, a.company_name 
      FROM payments p 
      LEFT JOIN campaigns c ON p.campaign_id = c.id 
      LEFT JOIN advertisers a ON p.advertiser_id = a.id
      ORDER BY p.created_at DESC
    `
    return NextResponse.json({ payments })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
'@

Write-SeetuFile "app\api\admin\economy\route.ts" @'
import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const economy = await sql`SELECT * FROM v_screen_economy ORDER BY total_revenue DESC`
    return NextResponse.json({ economy })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
'@

Write-SeetuFile "app\api\admin\maintenance\route.ts" @'
import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const tickets = await sql`
      SELECT mt.*, s.name as screen_name 
      FROM maintenance_tickets mt 
      LEFT JOIN screens s ON mt.screen_id = s.id 
      ORDER BY mt.created_at DESC
    `
    return NextResponse.json({ tickets })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = await sql`
      INSERT INTO maintenance_tickets (screen_id, title, description, priority, status, opened_at, created_at)
      VALUES (${body.screen_id}, ${body.title}, ${body.description}, ${body.priority || 'MEDIUM'}, 'OPEN', NOW(), NOW())
      RETURNING *
    `
    return NextResponse.json({ ticket: result[0] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
'@

# 15. FINALISATION

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  SETUP SEETUADS V1 TERMINE !" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Prochaines etapes:" -ForegroundColor Cyan
Write-Host "1. Renommer .env.example en .env.local et remplir les cles" -ForegroundColor White
Write-Host "2. Executer le schema SQL dans Neon (seetuads-v1-schema.sql)" -ForegroundColor White
Write-Host "3. npm install" -ForegroundColor White
Write-Host "4. npm run dev" -ForegroundColor White
Write-Host "5. Ouvrir http://localhost:3000" -ForegroundColor White
Write-Host ""
Pause
