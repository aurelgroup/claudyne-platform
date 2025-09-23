#!/bin/bash

echo "🔄 ================================================"
echo "   MISE À JOUR CLAUDYNE - CONTABO VPS"
echo "🔄 ================================================"
echo "En hommage à Meffo Mehtah Tchandjio Claudine 👨‍👩‍👧‍👦"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Vérifier qu'on est l'utilisateur claudyne
if [ "$USER" != "claudyne" ]; then
    error "Ce script doit être exécuté par l'utilisateur 'claudyne'"
fi

cd /var/www/claudyne/claudyne-platform || error "Répertoire du projet non trouvé"

log "🔍 Vérification du statut Git..."
git status --porcelain

if [ ! -z "$(git status --porcelain)" ]; then
    warning "Il y a des modifications locales non commitées"
    echo "Modifications détectées:"
    git status --short
    echo ""
    read -p "Voulez-vous sauvegarder ces modifications avec git stash? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log "💾 Sauvegarde des modifications locales..."
        git stash push -m "Sauvegarde avant mise à jour $(date)"
    fi
fi

log "📥 Récupération des dernières modifications..."
git fetch origin

CURRENT_BRANCH=$(git branch --show-current)
log "Branche actuelle: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
    warning "Vous n'êtes pas sur la branche main/master"
    read -p "Continuer quand même? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

log "⬇️ Mise à jour du code source..."
git pull origin $CURRENT_BRANCH

if [ $? -ne 0 ]; then
    error "Erreur lors de la mise à jour Git"
fi

log "📦 Mise à jour des dépendances principales..."
npm install

if [ $? -ne 0 ]; then
    error "Erreur lors de l'installation des dépendances principales"
fi

log "📦 Mise à jour des dépendances backend..."
cd backend && npm install && cd ..

if [ $? -ne 0 ]; then
    error "Erreur lors de l'installation des dépendances backend"
fi

# Migrations de base de données (si applicable)
if [ -f "backend/package.json" ] && grep -q "sequelize" backend/package.json; then
    log "🗄️ Exécution des migrations de base de données..."
    cd backend && npm run migrate 2>/dev/null || echo "Pas de migrations à exécuter"
    cd ..
fi

log "♻️ Redémarrage des services PM2..."
pm2 reload all

# Attendre que les services redémarrent
sleep 5

log "🔍 Vérification du statut des services..."
pm2 status

log "🧪 Test de santé de l'application..."
sleep 3

# Test de la page principale
if curl -f -s http://localhost:3000 >/dev/null; then
    log "✅ Frontend accessible sur le port 3000"
else
    error "❌ Frontend non accessible sur le port 3000"
fi

# Test de l'API backend (si elle existe)
if curl -f -s http://localhost:3001 >/dev/null; then
    log "✅ Backend accessible sur le port 3001"
else
    warning "⚠️ Backend non accessible sur le port 3001 (normal si pas d'API)"
fi

log "📊 Affichage des logs récents..."
pm2 logs --lines 10

echo ""
log "✅ Mise à jour terminée avec succès!"
log "🌐 Votre site est accessible sur:"
log "   - Frontend: http://localhost:3000"
log "   - Backend: http://localhost:3001 (si applicable)"
echo ""
log "📋 Commandes utiles:"
log "   - pm2 status        : Statut des processus"
log "   - pm2 logs          : Voir les logs en temps réel"
log "   - pm2 monit         : Monitoring en temps réel"
log "   - pm2 restart all   : Redémarrer tous les services"