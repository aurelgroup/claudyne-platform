#!/bin/bash
# Script de démarrage Claudyne avec le VRAI backend
# La force du savoir en héritage

echo "🎓 ============================================"
echo "   DÉMARRAGE CLAUDYNE - BACKEND RÉEL"
echo "🎓 ============================================"
echo ""
echo "👨‍👩‍👧‍👦 En hommage à Meffo Mehtah Tchandjio Claudine"
echo "💚 La force du savoir en héritage"
echo ""

# Vérification des prérequis
echo "🔍 Vérification des prérequis..."

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Vérifier npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

echo "✅ Node.js $(node --version) détecté"
echo "✅ npm $(npm --version) détecté"

# Installation des dépendances si nécessaire
echo ""
echo "📦 Installation des dépendances..."

if [ ! -d "node_modules" ]; then
    echo "🔧 Installation des dépendances frontend..."
    npm install
fi

if [ ! -d "backend/node_modules" ]; then
    echo "🔧 Installation des dépendances backend..."
    cd backend && npm install && cd ..
fi

echo "✅ Dépendances installées"

# Configuration de l'environnement
echo ""
echo "⚙️ Configuration de l'environnement..."

# Copier les fichiers de configuration s'ils n'existent pas
if [ ! -f "backend/.env" ]; then
    if [ -f "backend/.env.example" ]; then
        echo "📝 Création du fichier .env backend..."
        cp backend/.env.example backend/.env
        echo "⚠️  IMPORTANT: Configurez backend/.env avec vos vraies clés API"
    else
        echo "❌ Fichier .env.example non trouvé dans backend/"
        exit 1
    fi
fi

# Démarrage des services
echo ""
echo "🚀 Démarrage des services Claudyne..."

# Fonction pour tuer les processus en arrière-plan à la fin
cleanup() {
    echo ""
    echo "🛑 Arrêt des services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo "✅ Services arrêtés proprement"
    echo "👋 À bientôt sur Claudyne !"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Démarrer le backend RÉEL
echo "🔧 Démarrage du backend API (port 3001)..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Attendre que le backend démarre
echo "⏳ Attente du démarrage du backend..."
sleep 5

# Vérifier si le backend fonctionne
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Backend démarré avec succès sur http://localhost:3001"
else
    echo "❌ Erreur: Le backend n'a pas pu démarrer"
    echo "🔍 Vérifiez les logs ci-dessus pour plus d'informations"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Démarrer le serveur frontend
echo "🌐 Démarrage du serveur frontend (port 3000)..."
node server.js &
FRONTEND_PID=$!

# Attendre que le frontend démarre
sleep 3

# Vérifier si le frontend fonctionne
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend démarré avec succès sur http://localhost:3000"
else
    echo "❌ Erreur: Le frontend n'a pas pu démarrer"
    cleanup
    exit 1
fi

echo ""
echo "🎉 ============================================"
echo "   CLAUDYNE OPÉRATIONNEL - BACKEND RÉEL"
echo "🎉 ============================================"
echo ""
echo "🌍 Interfaces disponibles:"
echo "   🏠 Interface Principale:     http://localhost:3000"
echo "   👨‍💼 Interface Admin:          http://localhost:3000/admin"
echo "   👮 Interface Modérateur:     http://localhost:3000/moderator"
echo "   👨‍🏫 Interface Enseignant:     http://localhost:3000/teacher"
echo "   🎓 Interface Étudiant:       http://localhost:3000/student"
echo "   👨‍👩‍👧‍👦 Interface Parent:         http://localhost:3000/parent"
echo ""
echo "🔧 API Backend:"
echo "   📡 API Base:               http://localhost:3001/api"
echo "   🩺 Health Check:           http://localhost:3001/health"
echo "   📖 Documentation:          http://localhost:3001/api/docs"
echo ""
echo "💾 Base de données:"
echo "   📊 PostgreSQL:             Configuré via .env"
echo "   🔄 Redis Cache:            Configuré via .env"
echo ""
echo "💳 Paiements:"
echo "   📱 MTN Mobile Money:       MAVIANCE Smobil Pay"
echo "   🧡 Orange Money:           MAVIANCE Smobil Pay"
echo "   🏦 Cartes bancaires:       Intégration prête"
echo ""
echo "🏆 Fonctionnalités RÉELLES activées:"
echo "   ✅ Authentification JWT"
echo "   ✅ Base de données PostgreSQL"
echo "   ✅ API complètes (Admin, Parent, Student)"
echo "   ✅ Système de paiement MAVIANCE"
echo "   ✅ Progression étudiante réelle"
echo "   ✅ Battle Royale éducatif"
echo "   ✅ Prix Claudine"
echo "   ✅ Mentor IA (partiellement)"
echo ""
echo "⚠️  CONFIGURATION REQUISE:"
echo "   1. Configurez backend/.env avec vos vraies clés"
echo "   2. Configurez PostgreSQL (voir docker-compose.yml)"
echo "   3. Configurez Redis cache"
echo "   4. Obtenez les clés MAVIANCE pour les paiements"
echo ""
echo "🔧 Pour arrêter: Ctrl+C"
echo "📚 Documentation: README.md"
echo ""
echo "💚 Prêt pour la production VPS Contabo ! 🇨🇲"
echo ""

# Garder le script en vie
wait