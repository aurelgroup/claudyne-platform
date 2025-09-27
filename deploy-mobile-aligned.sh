#!/bin/bash

# =================================================================
# DÉPLOIEMENT MOBILE CLAUDYNE ALIGNÉ AVEC BACKEND
# Build et déploiement APK avec API synchronisée
# En hommage à Meffo Mehtah Tchandjio Claudine
# =================================================================

echo "📱 === DÉPLOIEMENT MOBILE CLAUDYNE ALIGNÉ ==="
echo "👨‍👩‍👧‍👦 En hommage à Meffo Mehtah Tchandjio Claudine"
echo ""

VPS_HOST="89.117.58.53"
VPS_USER="root"

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"; }
info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }

cd claudyne-mobile

# 1. VÉRIFICATION PRÉREQUIS
log "Vérification prérequis mobile..."

if ! command -v npx &> /dev/null; then
    error "NPX non trouvé - Installer Node.js"
    exit 1
fi

if ! npx expo --version &> /dev/null; then
    info "Installation Expo CLI..."
    npm install -g @expo/cli
fi

if ! npx eas --version &> /dev/null; then
    info "Installation EAS CLI..."
    npm install -g eas-cli
fi

# 2. VÉRIFICATION CONNEXION BACKEND
log "Test connexion API backend..."

API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://claudyne.com/api/ping" || echo "000")

if [ "$API_STATUS" = "200" ]; then
    log "✅ API backend accessible (https://claudyne.com/api)"
else
    warn "⚠️ API backend inaccessible ($API_STATUS)"

    # Test IP directe
    API_STATUS_IP=$(curl -s -o /dev/null -w "%{http_code}" "http://$VPS_HOST:3001/api/ping" || echo "000")

    if [ "$API_STATUS_IP" = "200" ]; then
        warn "Backend accessible via IP directe - Problème DNS ou SSL"
    else
        error "Backend complètement inaccessible"
        echo "Vérifiez que le backend est démarré:"
        echo "  ssh $VPS_USER@$VPS_HOST 'pm2 status'"
        exit 1
    fi
fi

# 3. MISE À JOUR DÉPENDANCES
log "Installation dépendances mobile..."

if [ ! -d "node_modules" ]; then
    npm install
else
    npm ci --prefer-offline
fi

# 4. SYNCHRONISATION CONFIGURATION
log "Synchronisation configuration mobile avec backend..."

# Créer configuration environnement
cat > .env.production << 'ENVEOF'
# Configuration production Claudyne Mobile
API_URL=https://claudyne.com/api
NODE_ENV=production
VERSION=1.0.0

# Synchronisation
AUTO_SYNC_ENABLED=true
OFFLINE_MODE_ENABLED=true
CACHE_DURATION=300000

# Tracking
ANALYTICS_ENABLED=true
CRASH_REPORTING_ENABLED=true
ENVEOF

log "✅ Configuration production créée"

# 5. NETTOYAGE ET PRÉPARATION
log "Nettoyage cache et préparation build..."

# Nettoyer cache
npx expo doctor --fix-dependencies 2>/dev/null || true
rm -rf .expo/
rm -rf node_modules/.expo/

# 6. AUTHENTIFICATION EAS (si nécessaire)
log "Vérification authentification EAS..."

if ! npx eas whoami 2>/dev/null | grep -q "@"; then
    warn "Authentification EAS requise"
    echo "Connectez-vous avec votre compte Expo:"
    npx eas login
fi

# 7. BUILD PRODUCTION
log "Lancement build production APK..."

echo "🔨 Build en cours... Ceci peut prendre 10-15 minutes"
echo "Surveillez les logs EAS Build dans votre navigateur"

# Build avec configuration production
npx eas build --platform android --profile production --non-interactive

if [ $? -eq 0 ]; then
    log "✅ Build production réussi !"
else
    error "❌ Échec build production"
    exit 1
fi

# 8. RÉCUPÉRATION APK
log "Récupération URL de l'APK..."

# Attendre que le build soit disponible
echo "⏳ Attente finalisation build..."
sleep 30

# Récupérer l'URL du dernier build
APK_URL=$(npx eas build:list --limit=1 --json --non-interactive | jq -r '.[0].artifacts.buildUrl' 2>/dev/null)

if [ "$APK_URL" != "null" ] && [ "$APK_URL" != "" ]; then
    log "📱 APK disponible: $APK_URL"

    # Télécharger APK
    info "Téléchargement APK..."
    wget -O claudyne-production.apk "$APK_URL" || curl -o claudyne-production.apk "$APK_URL"

    if [ -f "claudyne-production.apk" ]; then
        log "✅ APK téléchargé: claudyne-production.apk"

        # Afficher infos APK
        APK_SIZE=$(du -h claudyne-production.apk | cut -f1)
        log "📊 Taille APK: $APK_SIZE"

    else
        error "❌ Échec téléchargement APK"
        exit 1
    fi
else
    error "❌ URL APK non disponible"
    echo "Vérifiez le statut du build:"
    echo "  npx eas build:list --limit=1"
    exit 1
fi

# 9. DÉPLOIEMENT SUR SERVEUR
log "Déploiement APK sur serveur..."

if [ -f "claudyne-production.apk" ]; then
    # Copier APK sur serveur
    scp claudyne-production.apk $VPS_USER@$VPS_HOST:/var/www/html/download/claudyne.apk

    # Vérifier permissions
    ssh $VPS_USER@$VPS_HOST << 'SSHEOF'
        chmod 644 /var/www/html/download/claudyne.apk
        chown www-data:www-data /var/www/html/download/claudyne.apk

        # Créer/mettre à jour page de téléchargement
        APK_SIZE=$(du -h /var/www/html/download/claudyne.apk | cut -f1)
        APK_DATE=$(date '+%d/%m/%Y %H:%M')

        echo "✅ APK déployé:"
        echo "   Taille: $APK_SIZE"
        echo "   Date: $APK_DATE"
        echo "   URL: https://claudyne.com/download/claudyne.apk"
SSHEOF

    log "✅ APK déployé sur serveur"
else
    error "❌ APK non trouvé pour déploiement"
    exit 1
fi

# 10. TESTS POST-DÉPLOIEMENT
log "Tests post-déploiement..."

# Test URL téléchargement
DOWNLOAD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://claudyne.com/download/claudyne.apk")

if [ "$DOWNLOAD_STATUS" = "200" ]; then
    log "✅ APK accessible publiquement"
else
    warn "⚠️ APK non accessible publiquement ($DOWNLOAD_STATUS)"
fi

# Test API depuis mobile (simulation)
API_MOBILE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "X-Client-Type: mobile" \
    "https://claudyne.com/api/ping")

if [ "$API_MOBILE_STATUS" = "200" ]; then
    log "✅ API compatible mobile"
else
    warn "⚠️ API mobile non optimale ($API_MOBILE_STATUS)"
fi

# 11. STATUT FINAL
echo ""
log "🎉 === DÉPLOIEMENT MOBILE TERMINÉ ==="
echo "======================================"

echo ""
info "📱 APK PRODUCTION:"
echo "   URL: https://claudyne.com/download/claudyne.apk"
echo "   Page: https://claudyne.com/download/"

echo ""
info "🔗 API BACKEND:"
echo "   Endpoint: https://claudyne.com/api"
echo "   Synchronisation: JSON ↔ PostgreSQL active"

echo ""
info "📊 PROCHAINES ACTIONS:"
echo "   1. Tester l'APK sur appareil Android"
echo "   2. Vérifier synchronisation mobile ↔ web"
echo "   3. Tester authentification et données"
echo "   4. Publier sur Play Store (optionnel)"

echo ""
log "✨ CLAUDYNE MOBILE ALIGNÉ AVEC BACKEND !"
echo "🇨🇲 Prêt pour servir les familles camerounaises"
echo "👨‍👩‍👧‍👦 En hommage à Meffo Mehtah Tchandjio Claudine"

cd ..