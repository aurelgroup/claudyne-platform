@echo off
echo ==========================================
echo    DEMARRAGE PROPRE CLAUDYNE
echo ==========================================
echo.

:: Arrêter tous les processus Node existants
echo 🔄 Arrêt des processus existants...
taskkill /F /IM node.exe 2>nul
timeout /t 2 >nul

:: Démarrer le serveur
echo 🚀 Démarrage de Claudyne...
call npm start