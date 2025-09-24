#!/bin/bash

# ====================================================================
# 🚀 CLAUDYNE APK DEPLOYMENT SCRIPT
# ====================================================================
# Automatise le build, téléchargement et déploiement de l'APK
# Usage: ./deploy-apk.sh [--version <version>] [--profile <profile>] [--dry-run]
# ====================================================================

set -e  # Exit on any error

# Configuration
VPS_HOST="89.117.58.53"
VPS_USER="root"
VPS_PATH="/var/www/claudyne/download"
LOCAL_APK_DIR="./builds"
BACKUP_DIR="./backups"
LOG_FILE="./deployment.log"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonctions utilitaires
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

# Vérifications préliminaires
check_dependencies() {
    info "Vérification des dépendances..."

    if ! command -v eas &> /dev/null; then
        error "EAS CLI n'est pas installé. Installez avec: npm install -g @expo/eas-cli"
    fi

    if ! command -v ssh &> /dev/null; then
        error "SSH n'est pas disponible"
    fi

    if ! command -v scp &> /dev/null; then
        error "SCP n'est pas disponible"
    fi

    success "Toutes les dépendances sont présentes"
}

# Créer les répertoires nécessaires
setup_directories() {
    mkdir -p "$LOCAL_APK_DIR"
    mkdir -p "$BACKUP_DIR"
    success "Répertoires créés"
}

# Récupérer les informations de version
get_version_info() {
    if [ -f "app.json" ]; then
        VERSION=$(grep -o '"version": *"[^"]*"' app.json | cut -d'"' -f4)
    elif [ -f "package.json" ]; then
        VERSION=$(grep -o '"version": *"[^"]*"' package.json | cut -d'"' -f4)
    else
        VERSION="1.0.0"
    fi

    BUILD_NUMBER=$(date +%Y%m%d%H%M%S)
    APK_NAME="claudyne-v${VERSION}-${BUILD_NUMBER}.apk"

    info "Version: $VERSION"
    info "Build: $BUILD_NUMBER"
    info "APK: $APK_NAME"
}

# Build avec EAS
build_apk() {
    local profile=${1:-preview}

    info "🔨 Lancement du build EAS (profil: $profile)..."

    if [ "$DRY_RUN" == "true" ]; then
        warning "Mode dry-run: simulation du build"
        return 0
    fi

    # Lancer le build
    eas build --platform android --profile "$profile" --non-interactive --wait

    if [ $? -eq 0 ]; then
        success "Build terminé avec succès"
    else
        error "Échec du build EAS"
    fi
}

# Récupérer le lien de téléchargement du dernier build
get_download_url() {
    info "🔍 Récupération du lien de téléchargement..."

    # Récupérer les informations du dernier build
    BUILD_INFO=$(eas build:list --platform=android --limit=1 --json)

    # Extraire l'URL de téléchargement
    DOWNLOAD_URL=$(echo "$BUILD_INFO" | grep -o '"artifacts":{"applicationArchiveUrl":"[^"]*"' | cut -d'"' -f4)

    if [ -z "$DOWNLOAD_URL" ]; then
        error "Impossible de récupérer l'URL de téléchargement"
    fi

    success "URL récupérée: $DOWNLOAD_URL"
}

# Télécharger l'APK
download_apk() {
    info "📥 Téléchargement de l'APK..."

    if [ "$DRY_RUN" == "true" ]; then
        warning "Mode dry-run: simulation du téléchargement"
        touch "$LOCAL_APK_DIR/$APK_NAME"
        return 0
    fi

    curl -L -o "$LOCAL_APK_DIR/$APK_NAME" "$DOWNLOAD_URL"

    if [ -f "$LOCAL_APK_DIR/$APK_NAME" ]; then
        APK_SIZE=$(du -h "$LOCAL_APK_DIR/$APK_NAME" | cut -f1)
        success "APK téléchargé ($APK_SIZE): $LOCAL_APK_DIR/$APK_NAME"
    else
        error "Échec du téléchargement de l'APK"
    fi
}

# Sauvegarder l'APK actuel
backup_current_apk() {
    info "💾 Sauvegarde de l'APK actuel..."

    if [ "$DRY_RUN" == "true" ]; then
        warning "Mode dry-run: simulation de la sauvegarde"
        return 0
    fi

    # Télécharger l'APK actuel pour sauvegarde
    BACKUP_NAME="claudyne-backup-$(date +%Y%m%d_%H%M%S).apk"

    if scp "$VPS_USER@$VPS_HOST:$VPS_PATH/claudyne.apk" "$BACKUP_DIR/$BACKUP_NAME" 2>/dev/null; then
        success "APK actuel sauvegardé: $BACKUP_DIR/$BACKUP_NAME"
    else
        warning "Aucun APK existant à sauvegarder (première installation?)"
    fi
}

# Déployer sur le serveur
deploy_to_server() {
    info "🚀 Déploiement sur le serveur..."

    if [ "$DRY_RUN" == "true" ]; then
        warning "Mode dry-run: simulation du déploiement"
        return 0
    fi

    # Upload de l'APK
    if scp "$LOCAL_APK_DIR/$APK_NAME" "$VPS_USER@$VPS_HOST:$VPS_PATH/claudyne.apk"; then
        success "APK déployé sur le serveur"
    else
        error "Échec du déploiement sur le serveur"
    fi

    # Vérifier le déploiement
    if ssh "$VPS_USER@$VPS_HOST" "ls -la $VPS_PATH/claudyne.apk" > /dev/null 2>&1; then
        # Récupérer la taille du fichier sur le serveur
        REMOTE_SIZE=$(ssh "$VPS_USER@$VPS_HOST" "du -h $VPS_PATH/claudyne.apk" | cut -f1)
        success "Vérification réussie - Taille sur serveur: $REMOTE_SIZE"
    else
        error "Échec de la vérification du déploiement"
    fi
}

# Tester l'URL de téléchargement
test_download_url() {
    info "🧪 Test de l'URL de téléchargement..."

    if [ "$DRY_RUN" == "true" ]; then
        warning "Mode dry-run: simulation du test"
        return 0
    fi

    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://claudyne.com/download/claudyne.apk")

    if [ "$HTTP_CODE" == "200" ]; then
        success "URL de téléchargement fonctionnelle (HTTP $HTTP_CODE)"
    else
        error "URL de téléchargement non fonctionnelle (HTTP $HTTP_CODE)"
    fi
}

# Nettoyer les fichiers temporaires (garder les 5 derniers)
cleanup() {
    info "🧹 Nettoyage des anciens fichiers..."

    # Garder seulement les 5 derniers APK
    find "$LOCAL_APK_DIR" -name "claudyne-v*.apk" -type f | sort -r | tail -n +6 | xargs rm -f 2>/dev/null || true

    # Garder seulement les 10 dernières sauvegardes
    find "$BACKUP_DIR" -name "claudyne-backup-*.apk" -type f | sort -r | tail -n +11 | xargs rm -f 2>/dev/null || true

    success "Nettoyage terminé"
}

# Afficher le résumé
show_summary() {
    echo ""
    echo "======================================================================"
    echo "🎉 DÉPLOIEMENT TERMINÉ AVEC SUCCÈS!"
    echo "======================================================================"
    echo "Version: $VERSION"
    echo "Build: $BUILD_NUMBER"
    echo "APK: $APK_NAME"
    echo "URL: https://claudyne.com/download/claudyne.apk"
    echo "Page: https://claudyne.com/download/"
    echo "Log: $LOG_FILE"
    echo "======================================================================"
}

# Afficher l'aide
show_help() {
    cat << EOF
🚀 CLAUDYNE APK DEPLOYMENT SCRIPT

Usage: $0 [OPTIONS]

Options:
  --version <version>    Spécifier une version personnalisée
  --profile <profile>    Profil EAS à utiliser (défaut: preview)
  --dry-run             Mode simulation (aucune action réelle)
  --help                Afficher cette aide

Examples:
  $0                                    # Build et déploiement standard
  $0 --profile production               # Build en production
  $0 --version 2.0.0 --profile preview # Version et profil spécifiques
  $0 --dry-run                         # Simulation complète

Environment:
  VPS_HOST: $VPS_HOST
  VPS_USER: $VPS_USER
  VPS_PATH: $VPS_PATH
EOF
}

# ====================================================================
# SCRIPT PRINCIPAL
# ====================================================================

# Parser les arguments
PROFILE="preview"
DRY_RUN="false"
CUSTOM_VERSION=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --version)
            CUSTOM_VERSION="$2"
            shift 2
            ;;
        --profile)
            PROFILE="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN="true"
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

# Banner
echo ""
echo "🚀======================================================================"
echo "   CLAUDYNE APK AUTOMATED DEPLOYMENT"
echo "======================================================================🚀"
echo ""

# Initialiser le log
log "=== DÉBUT DU DÉPLOIEMENT ==="

# Étapes du déploiement
check_dependencies
setup_directories
get_version_info

# Utiliser la version personnalisée si fournie
if [ -n "$CUSTOM_VERSION" ]; then
    VERSION="$CUSTOM_VERSION"
    APK_NAME="claudyne-v${VERSION}-${BUILD_NUMBER}.apk"
    info "Version personnalisée utilisée: $VERSION"
fi

# Déploiement
build_apk "$PROFILE"
get_download_url
download_apk
backup_current_apk
deploy_to_server
test_download_url
cleanup
show_summary

log "=== FIN DU DÉPLOIEMENT ==="

echo ""
success "🎉 Déploiement terminé! L'APK est maintenant disponible sur https://claudyne.com/download/"