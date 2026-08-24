$ProjectPath = "C:\Users\PC\SeetuAds"
$PlayerScript = Join-Path $ProjectPath "start-player.ps1"
$ServerScript = Join-Path $ProjectPath "start-server.ps1"
$HealthUrl = "http://localhost:3000/api/health"

$CheckIntervalSeconds = 10
$ServerRestartWaitSeconds = 10
$PlayerRestartWaitSeconds = 15

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "   SEETUADS - WATCHDOG AVEC HEALTH CHECK" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Health Check : $HealthUrl"
Write-Host "Verification toutes les $CheckIntervalSeconds secondes"
Write-Host ""

if (-not (Test-Path $PlayerScript)) {
    Write-Host "ERREUR : start-player.ps1 introuvable !" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $ServerScript)) {
    Write-Host "ERREUR : start-server.ps1 introuvable !" -ForegroundColor Red
    exit 1
}

function Test-SeetuAdsServer {
    try {
        $response = Invoke-RestMethod `
            -Uri $HealthUrl `
            -Method GET `
            -TimeoutSec 5 `
            -ErrorAction Stop

        return (
            $response.success -eq $true -and
            $response.status -eq "healthy"
        )
    }
    catch {
        return $false
    }
}

function Test-SeetuAdsPlayer {
    $chromeProcesses = Get-CimInstance Win32_Process `
        -Filter "Name = 'chrome.exe'" `
        -ErrorAction SilentlyContinue

    if (-not $chromeProcesses) {
        return $false
    }

    foreach ($process in $chromeProcesses) {
        $commandLine = $process.CommandLine

        if (
            $commandLine -and
            $commandLine -match "localhost:3000/player"
        ) {
            return $true
        }
    }

    return $false
}

function Start-SeetuAdsServer {
    Write-Host ""
    Write-Host "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - SERVEUR INDISPONIBLE" -ForegroundColor Red
    Write-Host "Demarrage du serveur SeetuAds..." -ForegroundColor Yellow

    Start-Process `
        -FilePath "powershell.exe" `
        -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$ServerScript`"" `
        -WindowStyle Hidden

    Start-Sleep -Seconds $ServerRestartWaitSeconds
}

function Start-SeetuAdsPlayer {
    Write-Host ""
    Write-Host "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - PLAYER INDISPONIBLE" -ForegroundColor Yellow
    Write-Host "Demarrage du Player SeetuAds..." -ForegroundColor Cyan

    Start-Process `
        -FilePath "powershell.exe" `
        -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PlayerScript`"" `
        -WindowStyle Hidden

    Start-Sleep -Seconds $PlayerRestartWaitSeconds
}

Write-Host "Verification initiale..." -ForegroundColor Cyan
Write-Host ""

while ($true) {

    # 1. Vérifier le serveur
    $serverHealthy = Test-SeetuAdsServer

    if ($serverHealthy) {
        Write-Host "$(Get-Date -Format 'HH:mm:ss') - Serveur SeetuAds : OK" -ForegroundColor Green
    }
    else {
        Start-SeetuAdsServer

        # Après tentative de démarrage, on attend puis on reteste.
        $serverHealthy = Test-SeetuAdsServer

        if (-not $serverHealthy) {
            Write-Host "Le serveur ne repond toujours pas." -ForegroundColor Red
            Start-Sleep -Seconds $CheckIntervalSeconds
            continue
        }

        Write-Host "Serveur SeetuAds recupere." -ForegroundColor Green
    }

    # 2. Vérifier le Player seulement si le serveur est OK
    $playerRunning = Test-SeetuAdsPlayer

    if ($playerRunning) {
        Write-Host "$(Get-Date -Format 'HH:mm:ss') - Player SeetuAds : OK" -ForegroundColor Green
    }
    else {
        Start-SeetuAdsPlayer
    }

    Write-Host ""

    # 3. Attendre avant le prochain contrôle
    Start-Sleep -Seconds $CheckIntervalSeconds
}
