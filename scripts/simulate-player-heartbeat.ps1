```powershell
$deviceId = "DEV-PLT-001-B"
$apiKey = "19f83dc2-540f-4c89-9cd5-1cb15ab468b0"

$serverUrl = "https://seetu-ads.vercel.app"

while ($true) {
    try {
        $body = @{
            deviceId = $deviceId
            appVersion = "1.0.0"
            osVersion = "Windows 11"
            ipAddress = "127.0.0.1"
            storageStatus = @{
                free = 50000000000
                total = 100000000000
            }
        } | ConvertTo-Json -Depth 10

        $response = Invoke-RestMethod `
            -Uri "$serverUrl/api/player/heartbeat" `
            -Method POST `
            -ContentType "application/json" `
            -Headers @{
                "x-player-key" = $apiKey
            } `
            -Body $body

        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Heartbeat OK - $($response.deviceId) - $($response.status)" -ForegroundColor Green
    }
    catch {
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Erreur: $($_.Exception.Message)" -ForegroundColor Red
    }

    Start-Sleep -Seconds 30
}
```
