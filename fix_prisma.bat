@echo off
echo === FIX PRISMA SINGLETON ===
echo.

call :fix "app\api\campagnes\route.ts"
call :fix "app\api\campagnes\[id]\ecrans\route.ts"
call :fix "app\api\campagnes\[id]\medias\route.ts"
call :fix "app\api\campagnes\[id]\route.ts"
call :fix "app\api\ecrans\[id]\playlist\route.ts"
call :fix "app\api\medias\route.ts"
call :fix "app\api\medias\[id]\route.ts"
call :fix "app\api\paiements\route.ts"
call :fix "app\api\paiements\verify\route.ts"
call :fix "app\api\upload\route.ts"

echo.
echo === VERIFICATION ===
findstr /s /c:"new PrismaClient" app\*.ts lib\*.ts
echo.
echo Si aucun resultat = TOUT EST BON !
pause
exit /b

:fix
if not exist "%~1" (
    echo [SKIP] %~1 - introuvable
    exit /b
)
powershell -Command "$c=Get-Content '%~1' -Raw; $c=$c -replace \"import { PrismaClient } from '@prisma/client';`r`n`r`nconst prisma = new PrismaClient();\", \"import { prisma } from '@/lib/prisma';\"; Set-Content '%~1' $c -NoNewline"
echo [FIXED] %~1
exit /b
