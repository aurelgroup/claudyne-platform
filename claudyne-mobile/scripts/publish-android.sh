#!/bin/bash

# 🚀 SCRIPT DE PUBLICATION CLAUDYNE - GOOGLE PLAY STORE
# Honneur à Ma'a Meffo TCHANDJIO Claudine

echo "🇨🇲 CLAUDYNE - Publication Google Play Store"
echo "=================================================="

# Vérifications pré-build
echo "📋 Vérifications pré-build..."

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "app.json" ]; then
    echo "❌ Erreur : app.json introuvable. Êtes-vous dans le répertoire claudyne-mobile ?"
    exit 1
fi

# Vérifier la version
CURRENT_VERSION=$(grep '"version"' app.json | cut -d'"' -f4)
echo "📱 Version actuelle : $CURRENT_VERSION"

# Installer les dépendances
echo "📦 Installation des dépendances..."
npm install

# Configuration EAS si pas encore fait
echo "🔧 Configuration EAS..."
if [ ! -f "eas.json" ]; then
    echo "eas.json non trouvé, configuration EAS..."
    eas build:configure
fi

# Build production Android
echo "🏗️ Build production Android (.aab)..."
eas build --platform android --profile production --non-interactive

echo ""
echo "✅ Build terminé !"
echo ""
echo "📋 PROCHAINES ÉTAPES :"
echo "1. Télécharger le fichier .aab depuis Expo"
echo "2. Aller sur https://play.google.com/console"
echo "3. Créer une nouvelle version en production"
echo "4. Upload le fichier .aab"
echo "5. Remplir les métadonnées"
echo "6. Publier en test interne d'abord"
echo ""
echo "🇨🇲 La force du savoir en héritage !"