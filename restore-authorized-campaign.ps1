$currentPath = "lib\actions.ts"
$backupPath = "lib\actions.ts.backup"

Write-Host ""
Write-Host "=== SAUVEGARDE ===" -ForegroundColor Cyan

Copy-Item -LiteralPath $currentPath `
    -Destination "lib\actions.ts.before-restore-authorized-campaign" `
    -Force

Write-Host "=== RESTAURATION DE getAuthorizedCampaign ===" -ForegroundColor Cyan

$current = Get-Content -LiteralPath $currentPath -Raw
$backup = Get-Content -LiteralPath $backupPath -Raw

$functionName = "getAuthorizedCampaign"
$pattern = "async\s+function\s+$functionName\b"

if ($current -match $pattern) {
    Write-Host "La fonction existe deja." -ForegroundColor Green
}
else {
    $match = [regex]::Match($backup, $pattern)

    if (-not $match.Success) {
        Write-Host "ERREUR : fonction introuvable dans le backup." -ForegroundColor Red
    }
    else {
        $start = $match.Index
        $braceStart = $backup.IndexOf("{", $start)

        if ($braceStart -lt 0) {
            Write-Host "ERREUR : accolade ouvrante introuvable." -ForegroundColor Red
        }
        else {
            $depth = 0
            $end = -1

            for ($i = $braceStart; $i -lt $backup.Length; $i++) {
                if ($backup[$i] -eq "{") {
                    $depth++
                }
                elseif ($backup[$i] -eq "}") {
                    $depth--

                    if ($depth -eq 0) {
                        $end = $i
                        break
                    }
                }
            }

            if ($end -lt 0) {
                Write-Host "ERREUR : fin de fonction introuvable." -ForegroundColor Red
            }
            else {
                $block = $backup.Substring($start, $end - $start + 1)

                $mediaIndex = $current.IndexOf(
                    "// MEDIA"
                )

                if ($mediaIndex -lt 0) {
                    Write-Host "ERREUR : section MEDIA introuvable." -ForegroundColor Red
                }
                else {
                    $lineStart = $current.LastIndexOf(
                        "// ============================================================================",
                        $mediaIndex
                    )

                    if ($lineStart -lt 0) {
                        $lineStart = $mediaIndex
                    }

                    $updated =
                        $current.Substring(0, $lineStart) +
                        $block +
                        "`r`n`r`n" +
                        $current.Substring($lineStart)

                    Set-Content `
                        -LiteralPath $currentPath `
                        -Value $updated `
                        -Encoding UTF8

                    Write-Host ""
                    Write-Host "OK - getAuthorizedCampaign restauree." -ForegroundColor Green
                }
            }
        }
    }
}

Write-Host ""
Write-Host "=== VERIFICATION ===" -ForegroundColor Cyan

Select-String `
    -LiteralPath $currentPath `
    -Pattern "async function getAuthorizedCampaign" `
    -Context 1,5

Write-Host ""
Write-Host "=== TYPESCRIPT ===" -ForegroundColor Cyan

npx tsc --noEmit

Write-Host ""
Write-Host "=== FIN ===" -ForegroundColor Cyan
Write-Host "PowerShell reste ouvert."
