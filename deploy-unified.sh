#!/bin/bash

# ====================================================================
# 🚀 CLAUDYNE - DÉPLOIEMENT UNIFIÉ WEB + MOBILE
# ====================================================================
# Script de déploiement complet pour les applications Web et Mobile
# Usage: ./deploy-unified.sh [--web] [--mobile] [--all] [--dry-run]
# ====================================================================

set -e

# Configuration
VPS_HOST="89.117.58.53"
VPS_USER="root"
VPS_WEB_PATH="/var/www/claudyne"
VPS_MOBILE_PATH="/var/www/claudyne/download"
LOCAL_DIR="$(pwd)"
LOG_FILE="./unified-deployment.log"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Variables de déploiement
DEPLOY_WEB=false
DEPLOY_MOBILE=false
DRY_RUN=false

# ====================================================================
# 🛠️ FONCTIONS UTILITAIRES
# ====================================================================

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
    log "INFO: $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
    log "SUCCESS: $1"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    log "WARNING: $1"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    log "ERROR: $1"
    exit 1
}

progress() {
    echo -e "${PURPLE}🔄 $1${NC}"
    log "PROGRESS: $1"
}

# ====================================================================
# 📋 VÉRIFICATIONS PRÉLIMINAIRES
# ====================================================================

check_dependencies() {
    info "Vérification des dépendances..."

    # Vérifier Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js n'est pas installé"
    fi

    # Vérifier npm
    if ! command -v npm &> /dev/null; then
        error "NPM n'est pas installé"
    fi

    # Vérifier SSH
    if ! command -v ssh &> /dev/null; then
        error "SSH n'est pas disponible"
    fi

    # Vérifier EAS CLI si déploiement mobile
    if [ "$DEPLOY_MOBILE" == "true" ] && ! command -v eas &> /dev/null; then
        error "EAS CLI n'est pas installé. Installez avec: npm install -g @expo/eas-cli"
    fi

    success "Toutes les dépendances sont présentes"
}

# ====================================================================
# 🌐 DÉPLOIEMENT APPLICATION WEB
# ====================================================================

deploy_web() {
    info "🌐 Démarrage du déploiement Web..."

    # Sauvegarder la version actuelle
    progress "Sauvegarde de l'application web actuelle"
    if [ "$DRY_RUN" == "false" ]; then
        ssh "$VPS_USER@$VPS_HOST" "
            if [ -d '$VPS_WEB_PATH' ]; then
                cp -r '$VPS_WEB_PATH' '$VPS_WEB_PATH.backup.$(date +%Y%m%d_%H%M%S)'
            fi
        " || warning "Impossible de sauvegarder (première installation?)"
    fi

    # Construire l'application web
    progress "Construction de l'application web"
    if [ "$DRY_RUN" == "false" ]; then
        # Installer les dépendances si nécessaire
        if [ -f "package.json" ]; then
            npm install
        fi

        # Minifier les fichiers si nécessaire
        if [ -f "index.html" ]; then
            # Créer une version minifiée si les outils sont disponibles
            if command -v html-minifier &> /dev/null; then
                html-minifier --collapse-whitespace --remove-comments index.html > index.min.html
            fi
        fi
    fi

    # Synchroniser les fichiers web
    progress "Synchronisation des fichiers web vers le serveur"
    if [ "$DRY_RUN" == "false" ]; then
        # Créer le répertoire de destination
        ssh "$VPS_USER@$VPS_HOST" "mkdir -p '$VPS_WEB_PATH'"

        # Synchroniser les fichiers importants
        rsync -avz --delete \
            --exclude 'node_modules/' \
            --exclude '.git/' \
            --exclude 'claudyne-mobile/' \
            --exclude '*.log' \
            --exclude '.env*' \
            ./ "$VPS_USER@$VPS_HOST:$VPS_WEB_PATH/"
    fi

    # Redémarrer les services web
    progress "Redémarrage des services web"
    if [ "$DRY_RUN" == "false" ]; then
        ssh "$VPS_USER@$VPS_HOST" "
            # Redémarrer Nginx
            systemctl reload nginx || true

            # Redémarrer Node.js si PM2 est utilisé
            if command -v pm2 &> /dev/null; then
                pm2 restart claudyne || pm2 start '$VPS_WEB_PATH/server.js' --name claudyne
            fi
        "
    fi

    success "Déploiement web terminé"
}

# ====================================================================
# 📱 DÉPLOIEMENT APPLICATION MOBILE
# ====================================================================

deploy_mobile() {
    info "📱 Démarrage du déploiement Mobile..."

    # Aller dans le répertoire mobile
    cd "${LOCAL_DIR}/claudyne-mobile" || error "Répertoire claudyne-mobile introuvable"

    # Vérifier la configuration
    if [ ! -f "eas.json" ]; then
        error "Fichier eas.json introuvable dans claudyne-mobile"
    fi

    # Récupérer la version
    VERSION=$(grep -o '"version": *"[^"]*"' app.json | cut -d'"' -f4 2>/dev/null || echo "1.0.0")
    BUILD_NUMBER=$(date +%Y%m%d%H%M%S)
    APK_NAME="claudyne-v${VERSION}-${BUILD_NUMBER}.apk"

    info "Version: $VERSION"
    info "Build: $BUILD_NUMBER"
    info "APK: $APK_NAME"

    # Build EAS
    progress "Lancement du build EAS"
    if [ "$DRY_RUN" == "false" ]; then
        eas build --platform android --profile preview --non-interactive --wait
    fi

    # Récupérer l'URL de téléchargement
    progress "Récupération du lien de téléchargement"
    if [ "$DRY_RUN" == "false" ]; then
        BUILD_INFO=$(eas build:list --platform=android --limit=1 --json 2>/dev/null || echo '[]')
        DOWNLOAD_URL=$(echo "$BUILD_INFO" | grep -o '"artifacts":{"applicationArchiveUrl":"[^"]*"' | cut -d'"' -f4)

        if [ -z "$DOWNLOAD_URL" ]; then
            error "Impossible de récupérer l'URL de téléchargement"
        fi

        success "URL récupérée: $DOWNLOAD_URL"
    else
        DOWNLOAD_URL="https://example.com/fake-url.apk"
    fi

    # Télécharger l'APK
    progress "Téléchargement de l'APK"
    mkdir -p builds
    if [ "$DRY_RUN" == "false" ]; then
        curl -L -o "builds/$APK_NAME" "$DOWNLOAD_URL"
        APK_SIZE=$(du -h "builds/$APK_NAME" | cut -f1)
        success "APK téléchargé ($APK_SIZE): builds/$APK_NAME"
    fi

    # Sauvegarder l'APK actuel sur le serveur
    progress "Sauvegarde de l'APK actuel"
    if [ "$DRY_RUN" == "false" ]; then
        BACKUP_NAME="claudyne-backup-$(date +%Y%m%d_%H%M%S).apk"
        scp "$VPS_USER@$VPS_HOST:$VPS_MOBILE_PATH/claudyne.apk" "./backups/$BACKUP_NAME" 2>/dev/null || warning "Aucun APK existant à sauvegarder"
    fi

    # Déployer le nouvel APK
    progress "Déploiement du nouvel APK"
    if [ "$DRY_RUN" == "false" ]; then
        # S'assurer que le répertoire existe
        ssh "$VPS_USER@$VPS_HOST" "mkdir -p '$VPS_MOBILE_PATH'"

        # Upload de l'APK
        scp "builds/$APK_NAME" "$VPS_USER@$VPS_HOST:$VPS_MOBILE_PATH/claudyne.apk"

        # Vérifier le déploiement
        REMOTE_SIZE=$(ssh "$VPS_USER@$VPS_HOST" "du -h '$VPS_MOBILE_PATH/claudyne.apk'" | cut -f1)
        success "APK déployé - Taille sur serveur: $REMOTE_SIZE"
    fi

    # Retourner au répertoire racine
    cd "$LOCAL_DIR"

    success "Déploiement mobile terminé"
}

# ====================================================================
# 🧪 TESTS POST-DÉPLOIEMENT
# ====================================================================

run_tests() {
    info "🧪 Exécution des tests post-déploiement..."

    if [ "$DEPLOY_WEB" == "true" ]; then
        progress "Test de l'application web"
        if [ "$DRY_RUN" == "false" ]; then
            HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://claudyne.com/" || echo "000")
            if [ "$HTTP_CODE" == "200" ]; then
                success "Application web accessible (HTTP $HTTP_CODE)"
            else
                warning "Application web non accessible (HTTP $HTTP_CODE)"
            fi
        fi
    fi

    if [ "$DEPLOY_MOBILE" == "true" ]; then
        progress "Test de l'URL de téléchargement mobile"
        if [ "$DRY_RUN" == "false" ]; then
            HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://claudyne.com/download/claudyne.apk" || echo "000")
            if [ "$HTTP_CODE" == "200" ]; then
                success "APK téléchargeable (HTTP $HTTP_CODE)"
            else
                warning "APK non téléchargeable (HTTP $HTTP_CODE)"
            fi
        fi
    fi

    success "Tests terminés"
}

# ====================================================================
# 📊 RÉSUMÉ DU DÉPLOIEMENT
# ====================================================================

show_summary() {
    echo ""
    echo "======================================================================"
    echo "🎉 DÉPLOIEMENT CLAUDYNE TERMINÉ!"
    echo "======================================================================"

    if [ "$DEPLOY_WEB" == "true" ]; then
        echo "🌐 Application Web déployée:"
        echo "   └─ URL: https://claudyne.com"
        echo "   └─ Admin: https://claudyne.com/admin-secure-k7m9x4n2p8w5z1c6"
        echo "   └─ API: https://claudyne.com/api"
    fi

    if [ "$DEPLOY_MOBILE" == "true" ]; then
        echo "📱 Application Mobile déployée:"
        echo "   └─ APK: https://claudyne.com/download/claudyne.apk"
        echo "   └─ Page: https://claudyne.com/download/"
        echo "   └─ Version: $VERSION"
    fi

    echo "📋 Logs: $LOG_FILE"
    echo "⏰ Déploiement: $(date)"
    echo "======================================================================"
}

# ====================================================================
# 💁 AIDE
# ====================================================================

show_help() {
    cat << EOF
🚀 CLAUDYNE - DÉPLOIEMENT UNIFIÉ WEB + MOBILE

Usage: $0 [OPTIONS]

Options:
  --web                 Déployer uniquement l'application web
  --mobile              Déployer uniquement l'application mobile
  --all                 Déployer web ET mobile (défaut)
  --dry-run            Mode simulation (aucune action réelle)
  --help               Afficher cette aide

Examples:
  $0                    # Déploiement complet (web + mobile)
  $0 --web              # Déploiement web uniquement
  $0 --mobile           # Déploiement mobile uniquement
  $0 --all --dry-run    # Simulation complète

Environment:
  VPS_HOST: $VPS_HOST
  VPS_USER: $VPS_USER
  WEB_PATH: $VPS_WEB_PATH
  MOBILE_PATH: $VPS_MOBILE_PATH
EOF
}

# ====================================================================
# 📝 ANALYSE DES ARGUMENTS
# ====================================================================

# Si aucun argument, déploier tout
if [ $# -eq 0 ]; then
    DEPLOY_WEB=true
    DEPLOY_MOBILE=true
fi

while [[ $# -gt 0 ]]; do
    case $1 in
        --web)
            DEPLOY_WEB=true
            shift
            ;;
        --mobile)
            DEPLOY_MOBILE=true
            shift
            ;;
        --all)
            DEPLOY_WEB=true
            DEPLOY_MOBILE=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            error "Option inconnue: $1. Utilisez --help pour l'aide."
            ;;
    esac
done

# ====================================================================
# 🚀 EXÉCUTION PRINCIPALE
# ====================================================================

# Banner
echo ""
echo "🚀======================================================================"
echo "   CLAUDYNE - DÉPLOIEMENT UNIFIÉ"
echo "======================================================================🚀"
echo ""

if [ "$DRY_RUN" == "true" ]; then
    warning "MODE DRY-RUN ACTIVÉ - Simulation uniquement"
fi

# Log de début
log "=== DÉBUT DÉPLOIEMENT UNIFIÉ ==="
log "Web: $DEPLOY_WEB | Mobile: $DEPLOY_MOBILE | Dry-run: $DRY_RUN"

# Vérifications
check_dependencies

# Déploiements
if [ "$DEPLOY_WEB" == "true" ]; then
    deploy_web
fi

if [ "$DEPLOY_MOBILE" == "true" ]; then
    deploy_mobile
fi

# Tests
run_tests

# Résumé
show_summary

log "=== FIN DÉPLOIEMENT UNIFIÉ ==="

echo ""
success "🎉 Déploiement terminé! Claudyne est maintenant à jour."