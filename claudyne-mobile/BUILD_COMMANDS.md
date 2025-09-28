# 🚀 COMMANDES BUILD CLAUDYNE MOBILE - ULTRA-SÉCURISÉ

## 🔥 **BUILDS DISPONIBLES (PRÊTS À UTILISER)**

### 📱 **1. APK Preview (Tests & Démo)**
```bash
npx eas build --platform android --profile preview
```
**Usage:**
- ✅ Tests internes
- ✅ Démonstrations clients
- ✅ Distribution interne
- ✅ Upload claudyne.com/download

### 🏪 **2. Bundle Production (Play Store)**
```bash
npx eas build --platform android --profile production-secure
```
**Usage:**
- ✅ Google Play Store
- ✅ Obfuscation code activée
- ✅ Certificat de production
- ✅ Sécurité niveau MAXIMUM

### 🍎 **3. iOS Production (App Store)**
```bash
npx eas build --platform ios --profile production-secure
```
**Usage:**
- ✅ Apple App Store
- ✅ Keychain sécurisé iOS
- ✅ Certificat Apple

---

## ⚡ **BUILDS SIMULTANÉS (EFFICACITÉ MAX)**

### **Android + iOS en parallèle:**
```bash
npx eas build --platform all --profile production-secure
```

### **Builds multiples:**
```bash
# APK + Bundle simultané
npx eas build --platform android --profile preview &
npx eas build --platform android --profile production-secure &
wait
```

---

## 🔧 **COMMANDES UTILITAIRES**

### **Vérifier status builds:**
```bash
npx eas build:list
```

### **Annuler build en cours:**
```bash
npx eas build:cancel [BUILD_ID]
```

### **Télécharger APK:**
```bash
npx eas build:download [BUILD_ID]
```

### **Voir logs détaillés:**
```bash
npx eas build:view [BUILD_ID]
```

---

## 📦 **SOUMISSION STORES**

### **Google Play Store:**
```bash
npx eas submit --platform android --latest
```

### **Apple App Store:**
```bash
npx eas submit --platform ios --latest
```

---

## 🛡️ **VÉRIFICATIONS SÉCURITÉ**

### **Avant chaque build:**
```bash
# 1. Vérifier dépendances
npm audit
npx expo install --check

# 2. Vérifier configuration
cat eas.json

# 3. Vérifier sécurité
grep -r "console.log" src/ || echo "✅ Logs propres"
grep -r "password" src/ | grep -v "sanitize" || echo "✅ Pas de mots de passe"
```

---

## 🎯 **WORKFLOW COMPLET PRODUCTION**

### **🔥 SÉQUENCE DÉPLOIEMENT ULTIMATE:**

```bash
#!/bin/bash
# Claudyne Mobile - Déploiement Ultra-Sécurisé

echo "🚀 DÉPLOIEMENT CLAUDYNE MOBILE ULTRA-SÉCURISÉ"

# 1. Nettoyage
echo "🧹 Nettoyage..."
npm run clean 2>/dev/null || echo "Pas de script clean"
rm -rf node_modules/.cache

# 2. Installation propre
echo "📦 Installation propre..."
rm -rf node_modules
npm ci

# 3. Vérifications sécurité
echo "🛡️ Vérifications sécurité..."
npm audit --audit-level=moderate
npx expo install --check

# 4. Build APK Preview
echo "📱 Build APK Preview..."
npx eas build --platform android --profile preview --non-interactive

# 5. Build Bundle Production
echo "🏪 Build Bundle Production..."
npx eas build --platform android --profile production-secure --non-interactive

# 6. Build iOS (optionnel)
echo "🍎 Build iOS..."
# npx eas build --platform ios --profile production-secure --non-interactive

echo "✅ DÉPLOIEMENT TERMINÉ!"
echo "📱 APK: Prêt pour claudyne.com/download"
echo "🏪 Bundle: Prêt pour Play Store"
```

---

## 📊 **MONITORING BUILDS**

### **Status en temps réel:**
```bash
# Watch builds
watch -n 30 'npx eas build:list --limit 5'

# Notifications
npx eas build --platform android --profile production-secure && \
  echo "✅ Build terminé!" || echo "❌ Build échoué!"
```

---

## 🔗 **LIENS UTILES**

- **EAS Dashboard**: https://expo.dev/accounts/aurelgroup/projects/claudyne-platform
- **Builds History**: https://expo.dev/accounts/aurelgroup/projects/claudyne-platform/builds
- **Documentation EAS**: https://docs.expo.dev/build/introduction/

---

## 🇨🇲 **CLAUDYNE - PRÊT POUR LA RÉVOLUTION ÉDUCATIVE!**

**Sécurité**: Niveau Militaire 🛡️
**Performance**: Optimisée ⚡
**Qualité**: Production Ready ✅

**🚀 READY TO LAUNCH! 🚀**