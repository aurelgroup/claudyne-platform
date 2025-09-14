@echo off
echo ==========================================
echo    TEST CONNEXION SSH CLAUDYNE
echo ==========================================
echo.

set VPS_IP=89.117.58.53
set VPS_USER=root

echo 🔍 Test de connexion SSH vers %VPS_USER%@%VPS_IP%...
echo.

:: Test de connexion et verification du serveur
ssh %VPS_USER%@%VPS_IP% "echo '✅ Connexion SSH reussie!' && echo '📊 Informations serveur:' && uname -a && echo '📁 Repertoire Claudyne:' && ls -la /var/www/claudyne/claudyne-platform/ | head -5 && echo '⚡ Statut PM2:' && pm2 status || echo 'PM2 non installe'"

if errorlevel 1 (
    echo.
    echo ❌ Erreur de connexion SSH
    echo 💡 Verifiez:
    echo    - La cle SSH est bien configuree
    echo    - Le serveur est accessible
    echo    - L'adresse IP est correcte: %VPS_IP%
) else (
    echo.
    echo ✅ Test de connexion reussi!
    echo 🚀 Vous pouvez utiliser deploy-rapide.bat ou deploy-github-prod.ps1
)

echo.
pause