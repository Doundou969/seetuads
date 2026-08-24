$ServerUrl = "https://seetu-ads.vercel.app"
$HealthUrl = "$ServerUrl/api/health"

$DeviceId = "DEV-PLT-001-B"
$PlayerKey = "19f83dc2-540f-4c89-9cd5-1cb15ab468b0"

$PlayerUrl = "$ServerUrl/player?deviceId=$DeviceId&key=$PlayerKey"

$CheckIntervalSeconds = 10

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "   SEETUADS - PLAYER VERCEL" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que Vercel est accessible avant d'ouvrir le Player
try {
    Invoke-RestMethod `
        -Uri $HealthUrl `
        -Method GET `
        -TimeoutSec 15 `
        -ErrorAction Stop | Out-Null

    Write-Host "Vercel est accessible." -ForegroundColor Green
}
catch {
    Write-Host "Vercel est indisponible. Player non lancé." -ForegroundColor Red
    exit 1
}

# OUVRIR LE PLAYER UNE SEULE FOIS
Write-Host "Ouverture du Player : $DeviceId" -ForegroundColor Cyan

Start-Process `
    -FilePath "chrome.exe" `
    -ArgumentList @(
        "--kiosk",
        "--autoplay-policy=no-user-gesture-required",
        "--no-first-run",
        "--disable-session-crashed-bubble",
        $PlayerUrl
    )

Write-Host "Player lancé une seule fois." -ForegroundColor Green

# Le watchdog vérifie uniquement Vercel.
# Il ne relance jamais Chrome.
while ($true) {
    try {
        Invoke-RestMethod `
            -Uri $HealthUrl `
            -Method GET `
            -TimeoutSec 10 `
            -ErrorAction Stop | Out-Null

        Write-Host "$(Get-Date -Format 'HH:mm:ss') - SeetuAds Vercel : OK" -ForegroundColor Green
    }
    catch {
        Write-Host "$(Get-Date -Format 'HH:mm:ss') - SeetuAds Vercel : INDISPONIBLE" -ForegroundColor Red
    }

    Start-Sleep -Seconds $CheckIntervalSeconds
}

