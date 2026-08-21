# ============================================================
# SEETUADS - PURGE COMPLETE DES FICHIERS RESIDUELS
# ============================================================

$ErrorActionPreference = "Stop"
$baseDir = "C:\Users\PC\SeetuAds"
Set-Location $baseDir

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PURGE FICHIERS RESIDUELS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. SIGN-IN PAGE PROPRE
$signIn = @'
import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <SignIn routing="hash" />
    </div>
  )
}
'@

[System.IO.File]::WriteAllText("$baseDir\app\(auth)\sign-in\[[...sign-in]]\page.tsx", $signIn, [System.Text.UTF8Encoding]::new($false))
Write-Host "[OK] sign-in/page.tsx corrige" -ForegroundColor Green

# 2. SIGN-UP PAGE PROPRE
$signUp = @'
import { SignUp } from "@clerk/nextjs"

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <SignUp routing="hash" />
    </div>
  )
}
'@

[System.IO.File]::WriteAllText("$baseDir\app\(auth)\sign-up\[[...sign-up]]\page.tsx", $signUp, [System.Text.UTF8Encoding]::new($false))
Write-Host "[OK] sign-up/page.tsx corrige" -ForegroundColor Green

# 3. PAGE.TSX PROPRE (au cas ou)
$page = @'
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
        <div className="inline-block px-4 py-1.5 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium mb-6">V1 MVP - Senegal</div>
        <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">Votre campagne publique,<br /><span className="text-blue-400">sur tous les ecrans.</span></h2>
        <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">Plateforme SaaS de gestion de campagnes publicitaires digitales. Reseau DOOH, player intelligent, paiement mobile.</p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/advertiser/campaigns/new" className="px-8 py-4 bg-blue-600 rounded-xl hover:bg-blue-700 font-semibold text-lg transition-all hover:scale-105">Lancer une campagne</Link>
          <Link href="/ecran/1" className="px-8 py-4 bg-white/10 rounded-xl hover:bg-white/20 font-semibold text-lg transition-all">Voir le player</Link>
        </div>
      </div>
    </main>
  )
}
'@

[System.IO.File]::WriteAllText("$baseDir\app\page.tsx", $page, [System.Text.UTF8Encoding]::new($false))
Write-Host "[OK] page.tsx corrige" -ForegroundColor Green

# 4. LAYOUT PROPRE
$layout = @'
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

[System.IO.File]::WriteAllText("$baseDir\app\layout.tsx", $layout, [System.Text.UTF8Encoding]::new($false))
Write-Host "[OK] layout.tsx corrige" -ForegroundColor Green

# 5. GLOBALS.CSS PROPRE
$css = @'
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

[System.IO.File]::WriteAllText("$baseDir\app\globals.css", $css, [System.Text.UTF8Encoding]::new($false))
Write-Host "[OK] globals.css corrige" -ForegroundColor Green

# 6. CHERCHER ET LISTER TOUS LES FICHIERS AVEC IMPORTS PROBLEMATIQUES
Write-Host "" -ForegroundColor Yellow
Write-Host "Recherche d'autres fichiers residuels..." -ForegroundColor Yellow

$problematic = Select-String -Path "app\*.tsx", "app\*.ts", "app\*.css" -Pattern "lucide-react|framer-motion|leaflet" -ErrorAction SilentlyContinue
if ($problematic) {
    Write-Host "FICHIERS PROBLEMATIQUES TROUVES:" -ForegroundColor Red
    $problematic | ForEach-Object { Write-Host "  - $($_.Path)" -ForegroundColor Red }
    Write-Host "Ces fichiers doivent etre corriges manuellement ou supprimes." -ForegroundColor Red
} else {
    Write-Host "[OK] Aucun autre fichier residuel trouve!" -ForegroundColor Green
}

Write-Host "" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "  PURGE TERMINEE !" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Relancez: npm run dev" -ForegroundColor White
Write-Host ""
Pause
