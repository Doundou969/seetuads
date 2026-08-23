$ProjectPath = "C:\Users\PC\SeetuAds"
$LogPath = Join-Path $ProjectPath "server.log"

function Test-SeetuAdsServer {
    try {
        Invoke-WebRequest `
            -Uri "http://localhost:3000" `
            -UseBasicParsing `
            -TimeoutSec 3 `
            -ErrorAction Stop | Out-Null

        return $true
    }
    catch {
        return $false
    }
}

if (Test-SeetuAdsServer) {
    Write-Host "Le serveur SeetuAds est deja demarre." -ForegroundColor Green
    exit 0
}

Write-Host "Demarrage du serveur SeetuAds..." -ForegroundColor Yellow

Start-Process `
    -FilePath "cmd.exe" `
    -WorkingDirectory $ProjectPath `
    -WindowStyle Hidden `
    -ArgumentList "/c npm run start >> `"$LogPath`" 2>&1"

Start-Sleep -Seconds 2

Write-Host "Serveur SeetuAds lance." -ForegroundColor Green
