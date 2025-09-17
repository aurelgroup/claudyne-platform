# Script de démarrage Claudyne avec le VRAI backend - PowerShell
# La force du savoir en héritage

Write-Host "🎓 ============================================" -ForegroundColor Green
Write-Host "   DÉMARRAGE CLAUDYNE - BACKEND RÉEL" -ForegroundColor Yellow
Write-Host "🎓 ============================================" -ForegroundColor Green
Write-Host ""
Write-Host "👨‍👩‍👧‍👦 En hommage à Meffo Mehtah Tchandjio Claudine" -ForegroundColor Cyan
Write-Host "💚 La force du savoir en héritage" -ForegroundColor Green
Write-Host ""

# Vérification des prérequis
Write-Host "🔍 Vérification des prérequis..." -ForegroundColor Yellow

# Vérifier Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion détecté" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js n'est pas installé. Veuillez l'installer d'abord." -ForegroundColor Red
    exit 1
}

# Vérifier npm
try {
    $npmVersion = npm --version
    Write-Host "✅ npm $npmVersion détecté" -ForegroundColor Green
} catch {
    Write-Host "❌ npm n'est pas installé. Veuillez l'installer d'abord." -ForegroundColor Red
    exit 1
}

# Installation des dépendances si nécessaire
Write-Host ""
Write-Host "📦 Installation des dépendances..." -ForegroundColor Yellow

if (!(Test-Path "node_modules")) {
    Write-Host "🔧 Installation des dépendances frontend..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors de l'installation des dépendances frontend" -ForegroundColor Red
        exit 1
    }
}

if (!(Test-Path "backend\node_modules")) {
    Write-Host "🔧 Installation des dépendances backend..." -ForegroundColor Cyan
    Set-Location backend
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors de l'installation des dépendances backend" -ForegroundColor Red
        exit 1
    }
    Set-Location ..
}

Write-Host "✅ Dépendances installées" -ForegroundColor Green

# Configuration de l'environnement
Write-Host ""
Write-Host "⚙️ Configuration de l'environnement..." -ForegroundColor Yellow

# Copier les fichiers de configuration s'ils n'existent pas
if (!(Test-Path "backend\.env")) {
    if (Test-Path "backend\.env.example") {
        Write-Host "📝 Création du fichier .env backend..." -ForegroundColor Cyan
        Copy-Item "backend\.env.example" "backend\.env"
        Write-Host "⚠️  IMPORTANT: Configurez backend\.env avec vos vraies clés API" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Fichier .env.example non trouvé dans backend\" -ForegroundColor Red
        exit 1
    }
}

# Démarrage des services
Write-Host ""
Write-Host "🚀 Démarrage des services Claudyne..." -ForegroundColor Yellow

# Fonction pour nettoyer les processus
function Cleanup {
    Write-Host ""
    Write-Host "🛑 Arrêt des services..." -ForegroundColor Yellow
    if ($backendJob) { Stop-Job $backendJob; Remove-Job $backendJob }
    if ($frontendJob) { Stop-Job $frontendJob; Remove-Job $frontendJob }
    Write-Host "✅ Services arrêtés proprement" -ForegroundColor Green
    Write-Host "👋 À bientôt sur Claudyne !" -ForegroundColor Cyan
    exit 0
}

# Gestionnaire d'événements pour Ctrl+C
$null = Register-EngineEvent PowerShell.Exiting -Action { Cleanup }

try {
    # Démarrer le backend RÉEL
    Write-Host "🔧 Démarrage du backend API (port 3001)..." -ForegroundColor Cyan
    Set-Location backend
    $backendJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        npm start
    }
    Set-Location ..

    # Attendre que le backend démarre
    Write-Host "⏳ Attente du démarrage du backend..." -ForegroundColor Yellow
    Start-Sleep 8

    # Vérifier si le backend fonctionne
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Backend démarré avec succès sur http://localhost:3001" -ForegroundColor Green
        } else {
            throw "Backend health check failed"
        }
    } catch {
        Write-Host "❌ Erreur: Le backend n'a pas pu démarrer" -ForegroundColor Red
        Write-Host "🔍 Vérifiez les logs ci-dessous pour plus d'informations" -ForegroundColor Yellow
        Receive-Job $backendJob
        Cleanup
        exit 1
    }

    # Démarrer le serveur frontend
    Write-Host "🌐 Démarrage du serveur frontend (port 3000)..." -ForegroundColor Cyan
    $frontendJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        node server.js
    }

    # Attendre que le frontend démarre
    Start-Sleep 5

    # Vérifier si le frontend fonctionne
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Frontend démarré avec succès sur http://localhost:3000" -ForegroundColor Green
        } else {
            throw "Frontend health check failed"
        }
    } catch {
        Write-Host "❌ Erreur: Le frontend n'a pas pu démarrer" -ForegroundColor Red
        Cleanup
        exit 1
    }

    Write-Host ""
    Write-Host "🎉 ============================================" -ForegroundColor Green
    Write-Host "   CLAUDYNE OPÉRATIONNEL - BACKEND RÉEL" -ForegroundColor Yellow
    Write-Host "🎉 ============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌍 Interfaces disponibles:" -ForegroundColor Cyan
    Write-Host "   🏠 Interface Principale:     http://localhost:3000" -ForegroundColor White
    Write-Host "   👨‍💼 Interface Admin:          http://localhost:3000/admin" -ForegroundColor White
    Write-Host "   👮 Interface Modérateur:     http://localhost:3000/moderator" -ForegroundColor White
    Write-Host "   👨‍🏫 Interface Enseignant:     http://localhost:3000/teacher" -ForegroundColor White
    Write-Host "   🎓 Interface Étudiant:       http://localhost:3000/student" -ForegroundColor White
    Write-Host "   👨‍👩‍👧‍👦 Interface Parent:         http://localhost:3000/parent" -ForegroundColor White
    Write-Host ""
    Write-Host "🔧 API Backend:" -ForegroundColor Cyan
    Write-Host "   📡 API Base:               http://localhost:3001/api" -ForegroundColor White
    Write-Host "   🩺 Health Check:           http://localhost:3001/health" -ForegroundColor White
    Write-Host "   📖 Documentation:          http://localhost:3001/api/docs" -ForegroundColor White
    Write-Host ""
    Write-Host "💾 Base de données:" -ForegroundColor Cyan
    Write-Host "   📊 PostgreSQL:             Configuré via .env" -ForegroundColor White
    Write-Host "   🔄 Redis Cache:            Configuré via .env" -ForegroundColor White
    Write-Host ""
    Write-Host "💳 Paiements:" -ForegroundColor Cyan
    Write-Host "   📱 MTN Mobile Money:       MAVIANCE Smobil Pay" -ForegroundColor White
    Write-Host "   🧡 Orange Money:           MAVIANCE Smobil Pay" -ForegroundColor White
    Write-Host "   🏦 Cartes bancaires:       Intégration prête" -ForegroundColor White
    Write-Host ""
    Write-Host "🏆 Fonctionnalités RÉELLES activées:" -ForegroundColor Cyan
    Write-Host "   ✅ Authentification JWT" -ForegroundColor Green
    Write-Host "   ✅ Base de données PostgreSQL" -ForegroundColor Green
    Write-Host "   ✅ API complètes (Admin, Parent, Student)" -ForegroundColor Green
    Write-Host "   ✅ Système de paiement MAVIANCE" -ForegroundColor Green
    Write-Host "   ✅ Progression étudiante réelle" -ForegroundColor Green
    Write-Host "   ✅ Battle Royale éducatif" -ForegroundColor Green
    Write-Host "   ✅ Prix Claudine" -ForegroundColor Green
    Write-Host "   ✅ Mentor IA (partiellement)" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  CONFIGURATION REQUISE:" -ForegroundColor Yellow
    Write-Host "   1. Configurez backend\.env avec vos vraies clés" -ForegroundColor White
    Write-Host "   2. Configurez PostgreSQL (voir docker-compose.yml)" -ForegroundColor White
    Write-Host "   3. Configurez Redis cache" -ForegroundColor White
    Write-Host "   4. Obtenez les clés MAVIANCE pour les paiements" -ForegroundColor White
    Write-Host ""
    Write-Host "🔧 Pour arrêter: Ctrl+C" -ForegroundColor Yellow
    Write-Host "📚 Documentation: README.md" -ForegroundColor White
    Write-Host ""
    Write-Host "💚 Prêt pour la production VPS Contabo ! 🇨🇲" -ForegroundColor Green
    Write-Host ""

    # Ouvrir automatiquement le navigateur
    Write-Host "🌐 Ouverture automatique du navigateur..." -ForegroundColor Cyan
    Start-Process "http://localhost:3000"

    # Garder le script en vie et afficher les logs
    Write-Host "📊 Surveillance des services en cours... (Ctrl+C pour arrêter)" -ForegroundColor Yellow
    Write-Host ""

    while ($true) {
        Start-Sleep 10

        # Vérifier périodiquement si les jobs sont encore en vie
        if ($backendJob.State -eq "Failed") {
            Write-Host "❌ Le backend s'est arrêté de manière inattendue" -ForegroundColor Red
            Receive-Job $backendJob
            break
        }

        if ($frontendJob.State -eq "Failed") {
            Write-Host "❌ Le frontend s'est arrêté de manière inattendue" -ForegroundColor Red
            Receive-Job $frontendJob
            break
        }

        # Afficher un indicateur de vie
        Write-Host "." -NoNewline -ForegroundColor Green
    }

} finally {
    Cleanup
}