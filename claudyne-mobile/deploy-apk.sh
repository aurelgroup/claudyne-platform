#!/bin/bash

# Script de déploiement APK Claudyne
# Usage: bash deploy-apk.sh [BUILD_ID]

set -e

echo "🚀 Déploiement APK Claudyne sur www.claudyne.com"
echo "================================================"

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Build ID (optionnel, sinon on prend le dernier)
BUILD_ID=$1

if [ -z "$BUILD_ID" ]; then
    echo -e "${BLUE}📋 Récupération du dernier build APK...${NC}"
    BUILD_ID=$(npx eas build:list --platform android --limit 1 --non-interactive 2>/dev/null | grep -A 1 "ID" | tail -1 | awk '{print $1}')
    echo -e "${GREEN}✓ Build ID trouvé: $BUILD_ID${NC}"
fi

# Télécharger l'APK
echo -e "${BLUE}📥 Téléchargement de l'APK (Build: $BUILD_ID)...${NC}"
npx eas build:download $BUILD_ID --output claudyne.apk

# Vérifier que le fichier existe
if [ ! -f "claudyne.apk" ]; then
    echo -e "${YELLOW}❌ Erreur: Le fichier claudyne.apk n'a pas été téléchargé${NC}"
    exit 1
fi

# Afficher la taille du fichier
SIZE=$(du -h claudyne.apk | cut -f1)
echo -e "${GREEN}✓ APK téléchargé: $SIZE${NC}"

# Upload sur le serveur
echo -e "${BLUE}📤 Upload sur le serveur (89.117.58.53)...${NC}"
scp claudyne.apk root@89.117.58.53:/opt/claudyne/frontend/public/download/

# Vérifier l'upload
echo -e "${BLUE}🔍 Vérification sur le serveur...${NC}"
ssh root@89.117.58.53 "ls -lh /opt/claudyne/frontend/public/download/"

# Tester l'URL
echo ""
echo -e "${GREEN}✅ DÉPLOIEMENT RÉUSSI !${NC}"
echo ""
echo "📱 Page de téléchargement:"
echo "   https://www.claudyne.com/download-futuristic.html"
echo ""
echo "📦 Lien direct APK:"
echo "   https://www.claudyne.com/download/claudyne.apk"
echo ""
echo "📸 QR Code:"
echo "   Disponible sur la page de téléchargement"
echo ""

# Nettoyer
read -p "Supprimer le fichier local claudyne.apk ? (o/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Oo]$ ]]; then
    rm claudyne.apk
    echo -e "${GREEN}✓ Fichier local supprimé${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Déploiement terminé avec succès !${NC}"
