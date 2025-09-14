@echo off
echo ==========================================
echo    DEPLOY RAPIDE CLAUDYNE
echo ==========================================
echo En hommage a Meffo Mehtah Tchandjio Claudine
echo.

:: Variables
set VPS_IP=89.117.58.53
set VPS_USER=root

echo 📝 Ajout des fichiers...
git add .

set /p commit_msg="💬 Message de commit (ou Entree pour message par defaut): "
if "%commit_msg%"=="" set commit_msg=🚀 Mise a jour Claudyne - Nouvelles fonctionnalites

echo 📤 Commit et push...
git commit -m "%commit_msg%"
git push origin main

if errorlevel 1 (
    echo ❌ Erreur lors du push
    pause
    exit /b 1
)

echo ✅ Push GitHub reussi!
echo.
echo 🚀 Deploiement sur le serveur...

:: Copie et execution du script de mise a jour
scp deploy-scripts\quick-update.sh %VPS_USER%@%VPS_IP%:/var/www/claudyne/claudyne-platform/
ssh %VPS_USER%@%VPS_IP% "cd /var/www/claudyne/claudyne-platform && chmod +x quick-update.sh && ./quick-update.sh"

echo.
echo 🎉 DEPLOIEMENT TERMINE !
echo 🌐 Site accessible sur: https://claudyne.com
echo 📊 Repository: https://github.com/aurelgroup/claudyne-platform
echo.
pause