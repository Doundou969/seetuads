$ProjectPath = "C:\Users\PC\SeetuAds"
$PlayerScript = Join-Path $ProjectPath "start-player.ps1"
$ServerUrl = "http://localhost:3000"

$CheckIntervalSeconds = 10
$RestartDelaySeconds = 15

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   SEETUADS PLAYER WATCHDOG INTELLIGENT" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Projet : $ProjectPath"
Write-Host "Serveur : $ServerUrl"
Write-Host "Verification toutes les $CheckIntervalSeconds secondes"
Write-Host ""

if (-not (Test-Path $PlayerScript)) {
    Write-Host "ERREUR : start-player.ps1 introuvable !" -ForegroundColor Red
    Write-Host "Chemin attendu : $PlayerScript" -ForegroundColor Red
    exit 1
}

function Test-SeetuAdsPlayer {

    try {
        $connection = Get-NetTCPConnection `
            -LocalPort 3000 `
            -State Listen `
            -ErrorAction SilentlyContinue

        if (-not $connection) {
            return $false
        }
    }
    catch {
        return $false
    }

    $chromeProcesses = Get-CimInstance Win32_Process `
        -Filter "Name = 'chrome.exe'" `
        -ErrorAction SilentlyContinue

    if (-not $chromeProcesses) {
        return $false
    }

    foreach ($process in $chromeProcesses) {

        if (
            $process.CommandLine -match "localhost:3000/player" -or
            $process.CommandLine -match "SeetuAds"
        ) {
            return $true
        }
    }

    return $false
}

function Start-SeetuAdsPlayer {

    Write-Host ""
    Write-Host "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Yellow
    Write-Host "Player SeetuAds absent ou arrete." -ForegroundColor Yellow
    Write-Host "Demarrage du Player..." -ForegroundColor Cyan

    Start-Process `
        -FilePath "powershell.exe" `
        -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PlayerScript`"" `
        -WindowStyle Hidden

    Write-Host "Commande de demarrage envoyee." -ForegroundColor Green

    Start-Sleep -Seconds $RestartDelaySeconds
}

Write-Host "Verification initiale..." -ForegroundColor Cyan

while ($true) {

    $playerRunning = Test-SeetuAdsPlayer

    if ($playerRunning) {
        Write-Host "$(Get-Date -Format 'HH:mm:ss') - Player SeetuAds actif et surveille" -ForegroundColor Green
    }
    else {
        Start-SeetuAdsPlayer
    }

    Start-Sleep -Seconds $CheckIntervalSeconds
}
