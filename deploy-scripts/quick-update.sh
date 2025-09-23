#!/bin/bash

echo "🔄 ================================================"
echo "   MISE À JOUR RAPIDE CLAUDYNE"
echo "🔄 ================================================"
echo "En hommage à Meffo Mehtah Tchandjio Claudine 👨‍👩‍👧‍👦"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "package.json" ]; then
    error "Exécuter depuis /var/www/claudyne/claudyne-platform/"
fi

log "🔍 Sauvegarde des modifications locales..."
git stash push -m "Sauvegarde avant mise à jour $(date)"

log "📥 Récupération des dernières modifications..."
git pull origin main
if [ $? -ne 0 ]; then
    error "Erreur lors du git pull"
fi

log "📦 Mise à jour des dépendances principales..."
npm install --production
if [ $? -ne 0 ]; then
    warning "Problème avec npm install principal"
fi

log "📦 Mise à jour des dépendances backend..."
cd backend && npm install --production && cd ..
if [ $? -ne 0 ]; then
    warning "Problème avec npm install backend"
fi

log "♻️ Redémarrage des services PM2..."
pm2 reload all
sleep 3

log "🔍 Vérification du statut..."
pm2 status

log "🧪 Test de santé de l'application..."
if curl -f -s http://localhost:3000 > /dev/null; then
    log "✅ Frontend accessible"
else
    error "❌ Frontend inaccessible"
fi

if curl -f -s http://localhost:3001 > /dev/null; then
    log "✅ Backend accessible"
else
    warning "⚠️ Backend non accessible (normal si pas d'API)"
fi

log "📊 Logs récents..."
pm2 logs --lines 5

echo ""
log "✅ Mise à jour terminée avec succès!"
log "🌐 Site accessible sur: https://claudyne.com"
echo ""
log "📋 Commandes utiles:"
echo "   pm2 status        - Statut des processus"
echo "   pm2 logs          - Voir les logs en temps réel"
echo "   pm2 restart all   - Redémarrer tous les services"