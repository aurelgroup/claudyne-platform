# Fix Application Android - Erreur 404 Authentification

## 🔍 Problème identifié

L'application Android renvoyait une erreur **404** lors de la connexion à cause d'un **double `/api/`** dans l'URL :

- **Configuration** : `BASE_URL = 'https://claudyne.com/api'`
- **Endpoint** : `/api/auth/login`
- **Résultat** : `https://claudyne.com/api/api/auth/login` ❌ (404)

## ✅ Corrections appliquées

### 1. Fichier `src/constants/config.ts`

**Avant** :
```typescript
BASE_URL: __DEV__
  ? 'https://claudyne.com/api'
  : 'https://claudyne.com/api',
```

**Après** :
```typescript
BASE_URL: __DEV__
  ? 'https://claudyne.com'        // ✅ Sans /api
  : 'https://claudyne.com',       // ✅ Sans /api
```

### 2. Fichier `eas.json`

**Avant** :
```json
"env": {
  "API_URL": "https://claudyne.com/api"
}
```

**Après** :
```json
"env": {
  "API_URL": "https://claudyne.com"
}
```

## 📱 Reconstruction de l'APK

Pour que les utilisateurs bénéficient de cette correction, il faut reconstruire l'application Android :

### Option 1 : Build avec EAS (Recommandé)

```bash
# Se connecter au serveur
ssh root@89.117.58.53

# Aller dans le dossier mobile
cd /opt/claudyne/claudyne-mobile

# Installer EAS CLI si nécessaire
npm install -g eas-cli

# Se connecter à Expo (si première fois)
eas login

# Builder l'APK
eas build --platform android --profile preview

# L'APK sera téléchargeable via un lien fourni par EAS
```

### Option 2 : Build local (Si Android SDK installé)

```bash
cd /opt/claudyne/claudyne-mobile

# Générer le bundle
npx expo export:android

# Builder l'APK avec Gradle
cd android
./gradlew assembleRelease

# L'APK sera dans: android/app/build/outputs/apk/release/app-release.apk
```

### Option 3 : Build avec Expo Go (Développement uniquement)

```bash
cd /opt/claudyne/claudyne-mobile
npx expo start
# Scanner le QR code avec Expo Go sur Android
```

## 🚀 Déploiement de la nouvelle version

Une fois l'APK reconstruit :

1. **Télécharger le nouvel APK** depuis EAS ou depuis le serveur
2. **Remplacer** l'ancien fichier :
   ```bash
   mv claudyne-nouvelle-version.apk /opt/claudyne/claudyne-mobile/claudyne-latest.apk
   ```
3. **Mettre à jour** la page de téléchargement si nécessaire
4. **Notifier les utilisateurs** de mettre à jour l'application

## 🔗 URLs correctes maintenant utilisées

- **Login** : `https://claudyne.com/api/auth/login` ✅
- **Register** : `https://claudyne.com/api/auth/register` ✅
- **Refresh Token** : `https://claudyne.com/api/auth/refresh` ✅
- **Dashboard** : `https://claudyne.com/api/dashboard` ✅

## ⚠️ Note importante

Les utilisateurs qui ont **déjà installé l'ancienne version** de l'application devront :
- Soit **désinstaller** et **réinstaller** la nouvelle version
- Soit attendre une **mise à jour automatique** (si configurée)

En attendant, ils peuvent utiliser :
- **Version web** : https://claudyne.com
- **Interface parent** : https://claudyne.com/parent
- **Interface étudiant** : https://claudyne.com/student

## 📊 Status des corrections

- ✅ Configuration API corrigée
- ✅ Fichier EAS.json mis à jour
- ⏳ Reconstruction APK nécessaire
- ⏳ Déploiement nouvel APK

## 🧪 Test après reconstruction

Pour tester que tout fonctionne :

1. Installer le nouvel APK sur un appareil Android
2. Ouvrir l'application
3. Essayer de se connecter avec des identifiants valides
4. Vérifier dans les logs serveur que l'URL est correcte :
   ```bash
   ssh root@89.117.58.53 "pm2 logs claudyne-api --lines 20"
   ```
5. Chercher : `POST /api/auth/login` (et non `/api/api/auth/login`)

## 📝 Fichiers modifiés

- `/opt/claudyne/claudyne-mobile/src/constants/config.ts`
- `/opt/claudyne/claudyne-mobile/eas.json`

Backups créés avec timestamp pour rollback si nécessaire.
