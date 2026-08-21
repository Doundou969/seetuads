# ============================================================
# SEETUADS - SCRIPT DE CORRECTION AUTOMATIQUE
# Executer dans PowerShell : .\fix-seetuads.ps1
# ============================================================

$ErrorActionPreference = "Stop"
$baseDir = "C:\Users\PC\SeetuAds"
Set-Location $baseDir

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CORRECTION SEETUADS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. ECRIRE UN PACKAGE.JSON PROPRE
$packageJson = @'
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

Set-Content -Path "$baseDir\package.json" -Value $packageJson -Encoding UTF8 -Force
Write-Host "[OK] package.json corrige" -ForegroundColor Green

# 2. SUPPRIMER node_modules ET package-lock SI EXISTENT
if (Test-Path "$baseDir\node_modules") {
    Remove-Item -Recurse -Force "$baseDir\node_modules"
    Write-Host "[OK] node_modules supprime" -ForegroundColor Green
}
if (Test-Path "$baseDir\package-lock.json") {
    Remove-Item -Force "$baseDir\package-lock.json"
    Write-Host "[OK] package-lock.json supprime" -ForegroundColor Green
}
if (Test-Path "$baseDir\prisma") {
    Remove-Item -Recurse -Force "$baseDir\prisma"
    Write-Host "[OK] prisma/ supprime" -ForegroundColor Green
}

# 3. SUPPRIMER LE CACHE NPM
npm cache clean --force 2>$null | Out-Null
Write-Host "[OK] Cache npm nettoye" -ForegroundColor Green

# 4. INSTALLER
Write-Host "" -ForegroundColor Cyan
Write-Host "Installation en cours..." -ForegroundColor Cyan
npm install

Write-Host "" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "  INSTALLATION TERMINEE !" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Lancez : npm run dev" -ForegroundColor White
Write-Host ""
Pause
