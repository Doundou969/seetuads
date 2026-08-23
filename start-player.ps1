$ProjectPath = "C:\Users\PC\SeetuAds"
$ServerUrl = "http://localhost:3000"

$DeviceId = "DEV-PLT-001-B"
$PlayerKey = "19f83dc2-540f-4c89-9cd5-1cb15ab468b0"

$PlayerUrl = "$ServerUrl/player?deviceId=$DeviceId&key=$PlayerKey"

# 1. Vérifier si le serveur est disponible
$ServerReady = $false

try {
    Invoke-WebRequest `
        -Uri $ServerUrl `
        -UseBasicParsing `
        -TimeoutSec 3 `
        -ErrorAction Stop | Out-Null

    $ServerReady = $true
}
catch {
    $ServerReady = $false
}

# 2. Démarrer le serveur si nécessaire
if (-not $ServerReady) {
    Write-Host "Demarrage du serveur SeetuAds..."

    Start-Process `
        -FilePath "powershell.exe" `
        -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File "C:\Users\PC\SeetuAds\start-server.ps1"' `
        -WindowStyle Hidden
}

# 3. Attendre que le serveur soit prêt
Write-Host "Attente du serveur SeetuAds..."

$TimeoutSeconds = 60
$ElapsedSeconds = 0

while ($ElapsedSeconds -lt $TimeoutSeconds) {
    try {
        Invoke-WebRequest `
            -Uri $ServerUrl `
            -UseBasicParsing `
            -TimeoutSec 3 `
            -ErrorAction Stop | Out-Null

        Write-Host "Serveur pret !" -ForegroundColor Green
        break
    }
    catch {
        Start-Sleep -Seconds 2
        $ElapsedSeconds += 2
    }
}

if ($ElapsedSeconds -ge $TimeoutSeconds) {
    Write-Host "Le serveur SeetuAds n'a pas demarre apres 60 secondes." -ForegroundColor Red
    exit 1
}

# 4. Fermer les anciennes fenêtres Chrome du Player si nécessaire
# Stop-Process -Name "chrome" -Force -ErrorAction SilentlyContinue

# 5. Lancer le Player en mode Kiosk
Write-Host "Demarrage du Player : $DeviceId"

Start-Process `
    -FilePath "chrome.exe" `
    -ArgumentList @(
        "--kiosk",
        "--autoplay-policy=no-user-gesture-required",
        "--no-first-run",
        "--disable-session-crashed-bubble",
        $PlayerUrl
    )

Write-Host "Player SeetuAds lance !" -ForegroundColor Green