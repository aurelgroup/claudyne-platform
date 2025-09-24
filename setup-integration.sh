#!/bin/bash

# ====================================================================
# 🚀 SCRIPT D'INITIALISATION INTÉGRATION CLAUDYNE
# ====================================================================
# Configure l'intégration complète Web + Mobile en une seule commande
# Usage: ./setup-integration.sh
# ====================================================================

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
NC='\033[0m'

# ====================================================================
# 📝 FONCTIONS UTILITAIRES
# ====================================================================

info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

progress() {
    echo -e "${PURPLE}🔄 $1${NC}"
}

# ====================================================================
# 🚀 SCRIPT PRINCIPAL
# ====================================================================

echo ""
echo "🚀======================================================================"
echo "   INITIALISATION INTÉGRATION CLAUDYNE"
echo "======================================================================🚀"
echo ""

# 1. Vérifications préliminaires
info "1️⃣ Vérification des prérequis..."

if ! command -v node &> /dev/null; then
    error "Node.js n'est pas installé. Installez-le depuis https://nodejs.org"
fi

if ! command -v npm &> /dev/null; then
    error "NPM n'est pas installé"
fi

NODE_VERSION=$(node --version)
success "Node.js détecté: $NODE_VERSION"

# 2. Installation des dépendances
info "2️⃣ Installation des dépendances..."

progress "Installation des dépendances principales"
npm install

if [ -d "claudyne-mobile" ]; then
    progress "Installation des dépendances mobile"
    cd claudyne-mobile
    npm install
    cd ..
    success "Dépendances mobile installées"
fi

if [ -d "backend" ]; then
    progress "Installation des dépendances backend"
    cd backend
    npm install
    cd ..
    success "Dépendances backend installées"
fi

# 3. Configuration des variables d'environnement
info "3️⃣ Configuration de l'environnement..."

if [ ! -f ".env.local" ]; then
    progress "Création du fichier .env.local"
    cp .env.shared .env.local
    success "Fichier .env.local créé à partir du template"
    warning "⚠️  Pensez à modifier .env.local avec vos vraies valeurs"
else
    warning "Fichier .env.local existe déjà"
fi

# 4. Création des répertoires nécessaires
info "4️⃣ Création de la structure des répertoires..."

mkdir -p shared/data
mkdir -p shared/logs
mkdir -p claudyne-mobile/builds
mkdir -p claudyne-mobile/backups
mkdir -p logs
mkdir -p temp

success "Structure des répertoires créée"

# 5. Configuration des permissions
info "5️⃣ Configuration des permissions..."

chmod +x deploy-unified.sh
chmod +x setup-integration.sh

if [ -d "claudyne-mobile" ]; then
    chmod +x claudyne-mobile/deploy-apk.sh 2>/dev/null || true
fi

success "Permissions configurées"

# 6. Vérification de la connectivité
info "6️⃣ Test de connectivité..."

progress "Test de connectivité Internet"
if curl -s --head https://google.com | head -n 1 | grep -q "200 OK"; then
    success "Connexion Internet OK"
else
    warning "Connexion Internet limitée - certaines fonctionnalités peuvent être affectées"
fi

# 7. Test de l'API unifiée
info "7️⃣ Test de l'API unifiée..."

progress "Démarrage temporaire de l'API"
timeout 10s node shared/api/unified-api.js > /dev/null 2>&1 &
API_PID=$!

sleep 3

if curl -s http://localhost:3001/api > /dev/null; then
    success "API unifiée fonctionne correctement"
else
    warning "API unifiée non accessible - vérifiez la configuration"
fi

kill $API_PID 2>/dev/null || true

# 8. Résumé de l'installation
echo ""
echo "======================================================================"
echo "🎉 INTÉGRATION CLAUDYNE CONFIGURÉE AVEC SUCCÈS!"
echo "======================================================================"
echo ""
echo "📁 Structure créée:"
echo "   ├── 🌐 Application Web (port 3007)"
echo "   ├── 📱 Application Mobile (claudyne-mobile/)"
echo "   ├── 🔗 API Unifiée (port 3001)"
echo "   └── ⚙️  Configuration partagée (shared/)"
echo ""
echo "🚀 Commandes disponibles:"
echo "   npm run dev              # Démarrer web + mobile simultanément"
echo "   npm run dev:web          # Démarrer uniquement le web"
echo "   npm run dev:mobile       # Démarrer uniquement le mobile"
echo "   npm run dev:api          # Démarrer uniquement l'API unifiée"
echo ""
echo "   npm run build            # Build web + mobile"
echo "   npm run deploy           # Déployer web + mobile"
echo "   npm run deploy:web       # Déployer uniquement web"
echo "   npm run deploy:mobile    # Déployer uniquement mobile"
echo ""
echo "📖 Documentation:"
echo "   📋 INTEGRATION_GUIDE.md  # Guide complet d'intégration"
echo "   🏗️  MONOREPO_STRUCTURE.md # Structure du projet"
echo "   🚀 DEPLOYMENT_GUIDE.md   # Guide de déploiement"
echo ""
echo "⚠️  Prochaines étapes:"
echo "   1. Modifier .env.local avec vos vraies valeurs"
echo "   2. Configurer votre serveur VPS (89.117.58.53)"
echo "   3. Tester avec: npm run dev"
echo "   4. Déployer avec: npm run deploy:dry-run puis npm run deploy"
echo ""
echo "======================================================================"

success "🎉 Configuration terminée! Votre écosystème Claudyne unifié est prêt."

echo ""
echo "💡 Conseil: Commencez par 'npm run dev' pour tester l'intégration locale"