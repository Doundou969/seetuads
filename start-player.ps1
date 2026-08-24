```powershell
$ServerUrl = "https://seetu-ads.vercel.app"

$DeviceId = "DEV-PLT-001-B"
$PlayerKey = "19f83dc2-540f-4c89-9cd5-1cb15ab468b0"

$PlayerUrl = "$ServerUrl/player?deviceId=$DeviceId&key=$PlayerKey"

# Vérifier si CE Player est déjà ouvert
$existingPlayer = Get-CimInstance Win32_Process `
    -Filter "Name = 'chrome.exe'" `
    -ErrorAction SilentlyContinue |
    Where-Object {
        $_.CommandLine -and
        $_.CommandLine -match "seetu-ads\.vercel\.app/player" -and
        $_.CommandLine -match [regex]::Escape($DeviceId)
    } |
    Select-Object -First 1

if ($existingPlayer) {
    Write-Host "Le Player $DeviceId est déjà ouvert." -ForegroundColor Yellow
    exit 0
}

Write-Host "Démarrage du Player : $DeviceId" -ForegroundColor Green
Write-Host "URL : $PlayerUrl"

Start-Process `
    -FilePath "chrome.exe" `
    -ArgumentList @(
        "--kiosk",
        "--autoplay-policy=no-user-gesture-required",
        "--no-first-run",
        "--disable-session-crashed-bubble",
        $PlayerUrl
    )

Write-Host "Player SeetuAds lancé !" -ForegroundColor Green
```
