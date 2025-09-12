@echo off
echo ==========================================
echo    DEPLOIEMENT CLAUDYNE DEPUIS LOCAL
echo ==========================================
echo.

:: Variables
set VPS_IP=89.117.58.53
set VPS_USER=root

echo 🔍 Vérification des modifications locales...
git status --porcelain
if errorlevel 1 (
    echo ❌ Erreur Git
    pause
    exit /b 1
)

echo.
echo 📤 Push vers GitHub...
git add .
set /p commit_msg="💬 Message de commit: "
git commit -m "%commit_msg%"
git push origin main

if errorlevel 1 (
    echo ❌ Erreur lors du push
    pause
    exit /b 1
)

echo.
echo 🚀 Déploiement sur le serveur...

:: Upload et exécution du script de mise à jour
scp deploy-scripts\quick-update.sh %VPS_USER%@%VPS_IP%:/var/www/claudyne/claudyne-platform/
ssh %VPS_USER%@%VPS_IP% "cd /var/www/claudyne/claudyne-platform && chmod +x quick-update.sh && ./quick-update.sh"

echo.
echo 📊 Repository GitHub: https://github.com/aurelgroup/claudyne-platform

echo.
echo ✅ Déploiement terminé!
echo 🌐 Site accessible sur: https://claudyne.com
echo.
pause