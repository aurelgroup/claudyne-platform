#!/bin/bash

# Script de démarrage rapide Claudyne
# La force du savoir en héritage

echo "🎓 Démarrage de Claudyne - La force du savoir en héritage"
echo ""

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez installer Node.js 18+"
    exit 1
fi

# Vérifier si nous sommes dans le bon dossier
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Veuillez exécuter ce script depuis le dossier racine de Claudyne"
    exit 1
fi

echo "📁 Structure du projet détectée ✅"

# Option 1: Docker (recommandé)
if command -v docker-compose &> /dev/null; then
    echo ""
    echo "🐳 Docker Compose détecté - Démarrage recommandé"
    echo "Voulez-vous utiliser Docker? (y/n)"
    read -r use_docker
    
    if [ "$use_docker" = "y" ] || [ "$use_docker" = "Y" ]; then
        echo "🚀 Démarrage avec Docker Compose..."
        docker-compose up -d
        
        echo ""
        echo "⏳ Attente du démarrage des services..."
        sleep 10
        
        echo ""
        echo "🌐 Services Claudyne disponibles:"
        echo "  📱 Application Web: http://localhost:3000"
        echo "  🔧 API Backend: http://localhost:3001/api"
        echo "  📧 MailHog (dev): http://localhost:8025"
        echo "  💾 Adminer (BDD): http://localhost:8080"
        echo ""
        echo "🎉 Claudyne est prêt ! Ouvrez http://localhost:3000"
        exit 0
    fi
fi

# Option 2: Installation manuelle
echo ""
echo "📦 Démarrage manuel..."

# Installation Backend
echo "🔧 Installation des dépendances backend..."
cd backend
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "📝 Fichier .env créé - veuillez le configurer avec vos paramètres"
fi

# Check si node_modules existe
if [ ! -d "node_modules" ]; then
    echo "⏳ Installation npm en cours..."
    npm install --no-audit --no-fund
fi

# Démarrage backend en arrière-plan
echo "🚀 Démarrage du backend..."
npm run dev &
BACKEND_PID=$!

# Retour au dossier racine
cd ..

# Installation Frontend
echo "🎨 Installation des dépendances frontend..."
cd frontend
if [ ! -f ".env.local" ]; then
    cp .env.local.example .env.local
    echo "📝 Fichier .env.local créé"
fi

# Check si node_modules existe
if [ ! -d "node_modules" ]; then
    echo "⏳ Installation npm frontend..."
    npm install --no-audit --no-fund
fi

# Démarrage frontend
echo "🚀 Démarrage du frontend..."
npm run dev &
FRONTEND_PID=$!

# Attendre un peu
echo "⏳ Démarrage en cours..."
sleep 15

echo ""
echo "🌐 Services Claudyne disponibles:"
echo "  📱 Application Web: http://localhost:3000"
echo "  🔧 API Backend: http://localhost:3001/api"
echo ""
echo "🎉 Claudyne est prêt !"
echo ""
echo "Pour arrêter les services:"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "👥 Première utilisation:"
echo "  1. Ouvrir http://localhost:3000"
echo "  2. Cliquer sur 'Créer un compte famille'"
echo "  3. Remplir les informations"
echo "  4. Profiter de 7 jours d'essai gratuit !"
echo ""
echo "🏆 En mémoire de Meffo Mehtah Tchandjio Claudine"