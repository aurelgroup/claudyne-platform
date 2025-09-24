# 🚀 **GUIDE PUBLICATION CLAUDYNE - ÉTAPES EXACTES**

## 🔐 **ÉTAPE 1: CONNEXION EXPO (2 minutes)**
```bash
# Ouvrir un terminal dans le dossier claudyne-mobile
cd "C:/Users/fa_nono/Documents/CADD/Claudyne/claudyne-mobile"

# Se connecter à votre compte Expo
eas login
```
**↪️ Entrer vos identifiants Expo du compte "aurelgroup"**

## 🔧 **ÉTAPE 2: CONFIGURATION PROJET (3 minutes)**
```bash
# Configurer le projet pour votre compte
eas build:configure
```
**↪️ Répondre "Y" aux questions, choisir "Android" en premier**

## 📦 **ÉTAPE 3: BUILD DE TEST (10-15 minutes)**
```bash
# Créer un APK de test
eas build --platform android --profile preview
```
**↪️ Attendre la fin du build, télécharger l'APK généré**

## 🏪 **ÉTAPE 4: BUILD PRODUCTION (15-20 minutes)**
```bash
# Créer l'AAB pour Google Play Store
eas build --platform android --profile production
```
**↪️ Télécharger le fichier .AAB généré**

## 📱 **ÉTAPE 5: GOOGLE PLAY CONSOLE**
1. Aller sur [Google Play Console](https://play.google.com/console)
2. Créer une nouvelle application
3. Upload le fichier .AAB
4. Remplir les métadonnées (voir ci-dessous)
5. Soumettre pour review

## 📝 **MÉTADONNÉES POUR GOOGLE PLAY:**
```
Nom: Claudyne
Description courte: Plateforme éducative camerounaise révolutionnaire
Catégorie: Éducation
Public cible: Tout public
Pays: Cameroun, Afrique francophone
```

## ⏱️ **TEMPS TOTAL ESTIMÉ: 45 minutes**

## 🆘 **EN CAS DE PROBLÈME:**
- Vérifier la connexion internet
- S'assurer d'être dans le bon dossier
- Redémarrer le terminal si nécessaire

**🇨🇲 Votre app Claudyne sera bientôt sur Google Play Store !**