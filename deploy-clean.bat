@echo off
echo ==========================================
echo    SCRIPT DE DEPLOIEMENT CLAUDYNE
echo ==========================================
echo.

:: Arrêter tous les processus Node existants
echo 🔄 Arrêt des processus Node...
taskkill /F /IM node.exe 2>nul
timeout /t 2 >nul

:: Nettoyer les modules et cache
echo 🧹 Nettoyage des modules...
if exist node_modules rmdir /s /q node_modules
if exist backend\node_modules rmdir /s /q backend\node_modules
if exist package-lock.json del package-lock.json
if exist backend\package-lock.json del backend\package-lock.json
npm cache clean --force

:: Réinstaller les dépendances
echo 📦 Installation des dépendances...
call npm install
if errorlevel 1 (
    echo ❌ Erreur lors de l'installation principale
    pause
    exit /b 1
)

echo 📦 Installation des dépendances backend...
cd backend
call npm install
if errorlevel 1 (
    echo ❌ Erreur lors de l'installation backend
    pause
    exit /b 1
)
cd ..

:: Redémarrer le serveur
echo 🚀 Démarrage du serveur...
call npm start

pause