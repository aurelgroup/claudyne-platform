# Script de demarrage Claudyne avec le VRAI backend - PowerShell
# La force du savoir en heritage

Write-Host "🎓 ============================================" -ForegroundColor Green
Write-Host "   DEMARRAGE CLAUDYNE - BACKEND REEL" -ForegroundColor Yellow
Write-Host "🎓 ============================================" -ForegroundColor Green
Write-Host ""
Write-Host "👨‍👩‍👧‍👦 En hommage a Meffo Mehtah Tchandjio Claudine" -ForegroundColor Cyan
Write-Host "💚 La force du savoir en heritage" -ForegroundColor Green
Write-Host ""

# Verification des prerequis
Write-Host "🔍 Verification des prerequis..." -ForegroundColor Yellow

# Verifier Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion detecte" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js n'est pas installe. Veuillez l'installer d'abord." -ForegroundColor Red
    exit 1
}

# Verifier npm
try {
    $npmVersion = npm --version
    Write-Host "✅ npm $npmVersion detecte" -ForegroundColor Green
} catch {
    Write-Host "❌ npm n'est pas installe. Veuillez l'installer d'abord." -ForegroundColor Red
    exit 1
}

# Installation des dependances si necessaire
Write-Host ""
Write-Host "📦 Installation des dependances..." -ForegroundColor Yellow

if (!(Test-Path "node_modules")) {
    Write-Host "🔧 Installation des dependances frontend..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors de l'installation des dependances frontend" -ForegroundColor Red
        exit 1
    }
}

if (!(Test-Path "backend\node_modules")) {
    Write-Host "🔧 Installation des dependances backend..." -ForegroundColor Cyan
    Set-Location backend
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors de l'installation des dependances backend" -ForegroundColor Red
        exit 1
    }
    Set-Location ..
}

Write-Host "✅ Dependances installees" -ForegroundColor Green

# Configuration de l'environnement
Write-Host ""
Write-Host "⚙️ Configuration de l'environnement..." -ForegroundColor Yellow

# Copier les fichiers de configuration s'ils n'existent pas
if (!(Test-Path "backend\.env")) {
    if (Test-Path "backend\.env.example") {
        Write-Host "📝 Creation du fichier .env backend..." -ForegroundColor Cyan
        Copy-Item "backend\.env.example" "backend\.env"
        Write-Host "⚠️  IMPORTANT: Configurez backend\.env avec vos vraies cles API" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Fichier .env.example non trouve dans backend\" -ForegroundColor Red
        exit 1
    }
}

# Demarrage des services
Write-Host ""
Write-Host "🚀 Demarrage des services Claudyne..." -ForegroundColor Yellow

# Fonction pour nettoyer les processus
function Cleanup {
    Write-Host ""
    Write-Host "🛑 Arret des services..." -ForegroundColor Yellow
    if ($backendJob) { Stop-Job $backendJob -ErrorAction SilentlyContinue; Remove-Job $backendJob -ErrorAction SilentlyContinue }
    if ($frontendJob) { Stop-Job $frontendJob -ErrorAction SilentlyContinue; Remove-Job $frontendJob -ErrorAction SilentlyContinue }
    Write-Host "✅ Services arretes proprement" -ForegroundColor Green
    Write-Host "👋 A bientot sur Claudyne !" -ForegroundColor Cyan
    exit 0
}

# Gestionnaire d'evenements pour Ctrl+C
$null = Register-EngineEvent PowerShell.Exiting -Action { Cleanup }

try {
    # Demarrer le backend REEL
    Write-Host "🔧 Demarrage du backend API (port 3001)..." -ForegroundColor Cyan
    Set-Location backend
    $backendJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        npm start
    }
    Set-Location ..

    # Attendre que le backend demarre
    Write-Host "⏳ Attente du demarrage du backend..." -ForegroundColor Yellow
    Start-Sleep 8

    # Verifier si le backend fonctionne
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Backend demarre avec succes sur http://localhost:3001" -ForegroundColor Green
        } else {
            throw "Backend health check failed"
        }
    } catch {
        Write-Host "❌ Erreur: Le backend n'a pas pu demarrer" -ForegroundColor Red
        Write-Host "🔍 Verifiez les logs ci-dessous pour plus d'informations" -ForegroundColor Yellow
        Receive-Job $backendJob
        Cleanup
        exit 1
    }

    # Demarrer le serveur frontend
    Write-Host "🌐 Demarrage du serveur frontend (port 3000)..." -ForegroundColor Cyan
    $frontendJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        node server.js
    }

    # Attendre que le frontend demarre
    Start-Sleep 5

    # Verifier si le frontend fonctionne
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Frontend demarre avec succes sur http://localhost:3000" -ForegroundColor Green
        } else {
            throw "Frontend health check failed"
        }
    } catch {
        Write-Host "❌ Erreur: Le frontend n'a pas pu demarrer" -ForegroundColor Red
        Cleanup
        exit 1
    }

    Write-Host ""
    Write-Host "🎉 ============================================" -ForegroundColor Green
    Write-Host "   CLAUDYNE OPERATIONNEL - BACKEND REEL" -ForegroundColor Yellow
    Write-Host "🎉 ============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌍 Interfaces disponibles:" -ForegroundColor Cyan
    Write-Host "   🏠 Interface Principale:     http://localhost:3000" -ForegroundColor White
    Write-Host "   👨‍💼 Interface Admin:          http://localhost:3000/admin" -ForegroundColor White
    Write-Host "   👮 Interface Moderateur:     http://localhost:3000/moderator" -ForegroundColor White
    Write-Host "   👨‍🏫 Interface Enseignant:     http://localhost:3000/teacher" -ForegroundColor White
    Write-Host "   🎓 Interface Etudiant:       http://localhost:3000/student" -ForegroundColor White
    Write-Host "   👨‍👩‍👧‍👦 Interface Parent:         http://localhost:3000/parent" -ForegroundColor White
    Write-Host ""
    Write-Host "🔧 API Backend:" -ForegroundColor Cyan
    Write-Host "   📡 API Base:               http://localhost:3001/api" -ForegroundColor White
    Write-Host "   🩺 Health Check:           http://localhost:3001/health" -ForegroundColor White
    Write-Host "   📖 Documentation:          http://localhost:3001/api/docs" -ForegroundColor White
    Write-Host ""
    Write-Host "💾 Base de donnees:" -ForegroundColor Cyan
    Write-Host "   📊 PostgreSQL:             Configure via .env" -ForegroundColor White
    Write-Host "   🔄 Redis Cache:            Configure via .env" -ForegroundColor White
    Write-Host ""
    Write-Host "💳 Paiements:" -ForegroundColor Cyan
    Write-Host "   📱 MTN Mobile Money:       MAVIANCE Smobil Pay" -ForegroundColor White
    Write-Host "   🧡 Orange Money:           MAVIANCE Smobil Pay" -ForegroundColor White
    Write-Host "   🏦 Cartes bancaires:       Integration prete" -ForegroundColor White
    Write-Host ""
    Write-Host "🏆 Fonctionnalites REELLES activees:" -ForegroundColor Cyan
    Write-Host "   ✅ Authentification JWT" -ForegroundColor Green
    Write-Host "   ✅ Base de donnees PostgreSQL" -ForegroundColor Green
    Write-Host "   ✅ API completes (Admin, Parent, Student)" -ForegroundColor Green
    Write-Host "   ✅ Systeme de paiement MAVIANCE" -ForegroundColor Green
    Write-Host "   ✅ Progression etudiante reelle" -ForegroundColor Green
    Write-Host "   ✅ Battle Royale educatif" -ForegroundColor Green
    Write-Host "   ✅ Prix Claudine" -ForegroundColor Green
    Write-Host "   ✅ Mentor IA (partiellement)" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  CONFIGURATION REQUISE:" -ForegroundColor Yellow
    Write-Host "   1. Configurez backend\.env avec vos vraies cles" -ForegroundColor White
    Write-Host "   2. Configurez PostgreSQL (voir docker-compose.yml)" -ForegroundColor White
    Write-Host "   3. Configurez Redis cache" -ForegroundColor White
    Write-Host "   4. Obtenez les cles MAVIANCE pour les paiements" -ForegroundColor White
    Write-Host ""
    Write-Host "🔧 Pour arreter: Ctrl+C" -ForegroundColor Yellow
    Write-Host "📚 Documentation: README.md" -ForegroundColor White
    Write-Host ""
    Write-Host "💚 Pret pour la production VPS Contabo ! 🇨🇲" -ForegroundColor Green
    Write-Host ""

    # Ouvrir automatiquement le navigateur
    Write-Host "🌐 Ouverture automatique du navigateur..." -ForegroundColor Cyan
    Start-Process "http://localhost:3000"

    # Garder le script en vie et afficher les logs
    Write-Host "📊 Surveillance des services en cours... (Ctrl+C pour arreter)" -ForegroundColor Yellow
    Write-Host ""

    while ($true) {
        Start-Sleep 10

        # Verifier periodiquement si les jobs sont encore en vie
        if ($backendJob.State -eq "Failed") {
            Write-Host "❌ Le backend s'est arrete de maniere inattendue" -ForegroundColor Red
            Receive-Job $backendJob
            break
        }

        if ($frontendJob.State -eq "Failed") {
            Write-Host "❌ Le frontend s'est arrete de maniere inattendue" -ForegroundColor Red
            Receive-Job $frontendJob
            break
        }

        # Afficher un indicateur de vie
        Write-Host "." -NoNewline -ForegroundColor Green
    }

} finally {
    Cleanup
}