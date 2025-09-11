@echo off
REM Script de démarrage rapide Claudyne pour Windows
REM La force du savoir en héritage

echo.
echo 🎓 Claudyne - La force du savoir en héritage
echo.

REM Vérifier si nous sommes dans le bon dossier
if not exist "docker-compose.yml" (
    echo ❌ Veuillez exécuter ce script depuis le dossier racine de Claudyne
    pause
    exit /b 1
)

echo 📁 Structure du projet détectée ✅
echo.

REM Essayer avec Docker d'abord
docker-compose --version >nul 2>&1
if %errorlevel% == 0 (
    echo 🐳 Docker Compose détecté !
    echo.
    set /p use_docker="Utiliser Docker pour un démarrage rapide? (y/n): "
    
    if /i "%use_docker%"=="y" (
        echo.
        echo 🚀 Démarrage avec Docker Compose...
        docker-compose up -d
        
        echo.
        echo ⏳ Attente du démarrage des services...
        timeout /t 15 /nobreak >nul
        
        echo.
        echo 🌐 Services Claudyne disponibles:
        echo   📱 Application Web: http://localhost:3000
        echo   🔧 API Backend: http://localhost:3001/api
        echo   📧 MailHog ^(dev^): http://localhost:8025
        echo   💾 Adminer ^(BDD^): http://localhost:8080
        echo.
        echo 🎉 Claudyne est prêt ! Ouvrez http://localhost:3000
        echo.
        start http://localhost:3000
        pause
        exit /b 0
    )
)

REM Démarrage manuel
echo.
echo 📦 Démarrage manuel...
echo.

REM Installation Backend
echo 🔧 Préparation du backend...
cd backend

if not exist ".env" (
    copy .env.example .env >nul
    echo 📝 Fichier .env créé
)

REM Vérifier Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js n'est pas installé. Veuillez installer Node.js 18+
    echo 📥 Télécharger sur: https://nodejs.org/
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo ⏳ Installation des dépendances backend...
    npm install --no-audit --no-fund
)

echo 🚀 Démarrage du backend...
start "Claudyne Backend" cmd /k "npm run dev"

REM Attendre un peu
timeout /t 5 /nobreak >nul

cd ..

REM Installation Frontend
echo 🎨 Préparation du frontend...
cd frontend

if not exist ".env.local" (
    copy .env.local.example .env.local >nul
    echo 📝 Fichier .env.local créé
)

if not exist "node_modules" (
    echo ⏳ Installation des dépendances frontend...
    npm install --no-audit --no-fund
)

echo 🚀 Démarrage du frontend...
start "Claudyne Frontend" cmd /k "npm run dev"

cd ..

echo.
echo ⏳ Démarrage en cours...
timeout /t 15 /nobreak >nul

echo.
echo 🌐 Services Claudyne disponibles:
echo   📱 Application Web: http://localhost:3000
echo   🔧 API Backend: http://localhost:3001/api
echo.
echo 🎉 Claudyne est prêt !
echo.
echo 👥 Première utilisation:
echo   1. Ouvrir http://localhost:3000
echo   2. Cliquer sur 'Créer un compte famille'
echo   3. Remplir les informations
echo   4. Profiter de 7 jours d'essai gratuit !
echo.
echo 🏆 En mémoire de Meffo Mehtah Tchandjio Claudine
echo.

REM Ouvrir automatiquement le navigateur
start http://localhost:3000

pause