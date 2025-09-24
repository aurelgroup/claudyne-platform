@echo off
setlocal enabledelayedexpansion

REM ====================================================================
REM 🚀 CLAUDYNE APK DEPLOYMENT SCRIPT (Windows)
REM ====================================================================
REM Automatise le build, téléchargement et déploiement de l'APK
REM Usage: deploy-apk.bat [profile] [dry-run]
REM ====================================================================

echo.
echo 🚀======================================================================
echo    CLAUDYNE APK AUTOMATED DEPLOYMENT (Windows)
echo ======================================================================🚀
echo.

REM Configuration
set VPS_HOST=89.117.58.53
set VPS_USER=root
set VPS_PATH=/var/www/claudyne/download
set LOCAL_APK_DIR=builds
set BACKUP_DIR=backups
set LOG_FILE=deployment.log

REM Arguments
set PROFILE=%1
if "%PROFILE%"=="" set PROFILE=preview

set DRY_RUN=%2
if "%DRY_RUN%"=="dry-run" (
    echo ⚠️  MODE DRY-RUN ACTIVÉ - Simulation uniquement
    echo.
)

REM Créer les répertoires
if not exist "%LOCAL_APK_DIR%" mkdir "%LOCAL_APK_DIR%"
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

REM Log de début
echo %date% %time% - DÉBUT DU DÉPLOIEMENT >> "%LOG_FILE%"

REM Vérifier EAS CLI
echo ℹ️  Vérification d'EAS CLI...
eas --version >nul 2>&1
if errorlevel 1 (
    echo ❌ EAS CLI non trouvé. Installez avec: npm install -g @expo/eas-cli
    pause
    exit /b 1
)
echo ✅ EAS CLI présent

REM Récupérer la version
echo ℹ️  Récupération des informations de version...
set VERSION=1.0.0
if exist app.json (
    for /f "tokens=2 delims=:, " %%a in ('findstr /c:"\"version\"" app.json') do (
        set VERSION=%%~a
        set VERSION=!VERSION:"=!
    )
)

REM Build timestamp
for /f "tokens=1-6 delims=/: " %%a in ("%date% %time%") do (
    set BUILD_NUMBER=%%c%%a%%b%%d%%e%%f
)
set BUILD_NUMBER=!BUILD_NUMBER: =0!
set BUILD_NUMBER=!BUILD_NUMBER:~0,12!

set APK_NAME=claudyne-v!VERSION!-!BUILD_NUMBER!.apk

echo ✅ Version: !VERSION!
echo ✅ Build: !BUILD_NUMBER!
echo ✅ APK: !APK_NAME!
echo.

REM Build EAS
echo 🔨 Lancement du build EAS (profil: %PROFILE%)...
if "%DRY_RUN%"=="dry-run" (
    echo ⚠️  Mode dry-run: simulation du build
    echo. > "%LOCAL_APK_DIR%\!APK_NAME!"
) else (
    eas build --platform android --profile %PROFILE% --non-interactive --wait
    if errorlevel 1 (
        echo ❌ Échec du build EAS
        pause
        exit /b 1
    )
    echo ✅ Build terminé avec succès
)

REM Récupérer l'URL de téléchargement
echo 🔍 Récupération du lien de téléchargement...
if "%DRY_RUN%"=="dry-run" (
    set DOWNLOAD_URL=https://example.com/fake-url.apk
    echo ⚠️  Mode dry-run: URL simulée
) else (
    REM Utiliser PowerShell pour parser le JSON
    for /f "delims=" %%i in ('eas build:list --platform^=android --limit^=1 --json ^| powershell -command "$input | ConvertFrom-Json | Select-Object -ExpandProperty artifacts | Select-Object -ExpandProperty applicationArchiveUrl"') do set DOWNLOAD_URL=%%i

    if "!DOWNLOAD_URL!"=="" (
        echo ❌ Impossible de récupérer l'URL de téléchargement
        pause
        exit /b 1
    )
)
echo ✅ URL récupérée: !DOWNLOAD_URL!

REM Télécharger l'APK
echo 📥 Téléchargement de l'APK...
if "%DRY_RUN%"=="dry-run" (
    echo ⚠️  Mode dry-run: simulation du téléchargement
) else (
    curl -L -o "%LOCAL_APK_DIR%\!APK_NAME!" "!DOWNLOAD_URL!"
    if not exist "%LOCAL_APK_DIR%\!APK_NAME!" (
        echo ❌ Échec du téléchargement de l'APK
        pause
        exit /b 1
    )
    echo ✅ APK téléchargé: %LOCAL_APK_DIR%\!APK_NAME!
)

REM Sauvegarder l'APK actuel
echo 💾 Sauvegarde de l'APK actuel...
if "%DRY_RUN%"=="dry-run" (
    echo ⚠️  Mode dry-run: simulation de la sauvegarde
) else (
    set BACKUP_NAME=claudyne-backup-%date:~-4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.apk
    set BACKUP_NAME=!BACKUP_NAME: =0!
    scp %VPS_USER%@%VPS_HOST%:%VPS_PATH%/claudyne.apk "%BACKUP_DIR%\!BACKUP_NAME!" 2>nul
    if exist "%BACKUP_DIR%\!BACKUP_NAME!" (
        echo ✅ APK actuel sauvegardé: %BACKUP_DIR%\!BACKUP_NAME!
    ) else (
        echo ⚠️  Aucun APK existant à sauvegarder
    )
)

REM Déployer sur le serveur
echo 🚀 Déploiement sur le serveur...
if "%DRY_RUN%"=="dry-run" (
    echo ⚠️  Mode dry-run: simulation du déploiement
) else (
    scp "%LOCAL_APK_DIR%\!APK_NAME!" %VPS_USER%@%VPS_HOST%:%VPS_PATH%/claudyne.apk
    if errorlevel 1 (
        echo ❌ Échec du déploiement sur le serveur
        pause
        exit /b 1
    )
    echo ✅ APK déployé sur le serveur
)

REM Tester l'URL
echo 🧪 Test de l'URL de téléchargement...
if "%DRY_RUN%"=="dry-run" (
    echo ⚠️  Mode dry-run: simulation du test
) else (
    for /f %%i in ('curl -s -o nul -w "%%{http_code}" "https://claudyne.com/download/claudyne.apk"') do set HTTP_CODE=%%i
    if "!HTTP_CODE!"=="200" (
        echo ✅ URL de téléchargement fonctionnelle (HTTP !HTTP_CODE!)
    ) else (
        echo ❌ URL de téléchargement non fonctionnelle (HTTP !HTTP_CODE!)
        pause
        exit /b 1
    )
)

REM Log de fin
echo %date% %time% - FIN DU DÉPLOIEMENT >> "%LOG_FILE%"

REM Résumé
echo.
echo ======================================================================
echo 🎉 DÉPLOIEMENT TERMINÉ AVEC SUCCÈS!
echo ======================================================================
echo Version: !VERSION!
echo Build: !BUILD_NUMBER!
echo APK: !APK_NAME!
echo URL: https://claudyne.com/download/claudyne.apk
echo Page: https://claudyne.com/download/
echo Log: %LOG_FILE%
echo ======================================================================
echo.

echo ✅ Déploiement terminé! L'APK est maintenant disponible sur https://claudyne.com/download/

pause