# 🔗 Guide d'Intégration Claudyne - Web & Mobile

## 🏗️ Vue d'ensemble de l'intégration

Ce guide explique l'intégration complète entre votre application web Claudyne et l'application mobile, créant un écosystème unifié et synchronisé.

## 📁 Structure du projet intégré

```
C:\Users\fa_nono\Documents\CADD\Claudyne\
├── 🌐 [WEB APP] - Application web principale
│   ├── index.html                     # Page d'accueil
│   ├── admin-interface.html           # Interface admin
│   ├── student-interface-modern.html  # Interface étudiants
│   ├── parent-interface/              # Interface parents
│   ├── backend/                       # Backend existant
│   ├── server.js                      # Serveur principal
│   └── database/                      # Base de données
│
├── 📱 [MOBILE APP] claudyne-mobile/
│   ├── App.tsx                        # App React Native principale
│   ├── src/                           # Code source mobile
│   ├── app.json                       # Configuration Expo
│   ├── eas.json                       # Configuration EAS Build
│   └── deploy-apk.sh                  # Script déploiement APK
│
├── 🔗 [INTÉGRATION] shared/
│   ├── config/
│   │   └── environment.js             # Configuration unifiée
│   ├── api/
│   │   └── unified-api.js             # API unifiée Web + Mobile
│   └── services/
│       └── sync-service.js            # Service de synchronisation
│
├── ⚙️ [CONFIGURATION]
│   ├── .env.shared                    # Variables d'environnement
│   ├── deploy-unified.sh              # Script déploiement unifié
│   └── INTEGRATION_GUIDE.md           # Cette documentation
│
└── 📊 [DOCUMENTATION]
    ├── MONOREPO_STRUCTURE.md          # Structure du monorepo
    └── DEPLOYMENT_GUIDE.md            # Guide de déploiement
```

## 🚀 Fonctionnalités d'intégration créées

### 1. 🔧 Configuration unifiée
- **`shared/config/environment.js`** - Configuration centralisée pour web et mobile
- **`.env.shared`** - Variables d'environnement partagées
- Support automatique dev/production

### 2. 🌐 API unifiée
- **`shared/api/unified-api.js`** - Serveur API unique pour web et mobile
- Routes optimisées pour chaque type de client
- Authentification JWT commune
- CORS configuré pour autoriser mobile et web

### 3. 🔄 Synchronisation des données
- **`shared/services/sync-service.js`** - Service de synchronisation temps réel
- Sync des données utilisateur entre web et mobile
- Notifications push unifiées
- Queue de synchronisation avec retry automatique

### 4. 🚀 Déploiement unifié
- **`deploy-unified.sh`** - Script de déploiement complet web + mobile
- Déploiement web et APK en une seule commande
- Sauvegardes automatiques
- Tests post-déploiement

## 🔌 Intégration technique

### API Endpoints créés

#### 🔐 Authentification
```bash
POST /api/auth/login          # Connexion web/mobile
GET  /api/user/profile        # Profil utilisateur
```

#### 📚 Données partagées
```bash
GET  /api/courses             # Liste des cours
GET  /api/user/stats          # Statistiques utilisateur
```

#### 📱 Spécifique mobile
```bash
GET  /api/mobile/config       # Configuration mobile
GET  /api/mobile/version-check # Vérification version APK
POST /api/notifications/register # Enregistrement push notifications
```

#### 💳 Paiements (Mobile Money)
```bash
POST /api/payments/momo       # Paiement MTN/Orange Money
```

### Synchronisation automatique

#### Données synchronisées :
- ✅ **Profils utilisateur** - Modifications sync entre web/mobile
- ✅ **Progrès des cours** - Avancement sync en temps réel
- ✅ **Notifications** - Push notifications unifiées
- ✅ **Paramètres** - Préférences utilisateur sync

#### Mécanisme de sync :
```javascript
// Exemple d'utilisation du service de sync
const syncService = require('./shared/services/sync-service');

// Synchroniser des données utilisateur
await syncService.syncUserData(userId, userData, 'mobile');

// Synchroniser progrès d'un cours
await syncService.syncCourseProgress(userId, courseId, 85, 'web');
```

## ⚙️ Configuration initiale

### 1. Installation des dépendances

```bash
# Dépendances partagées
npm install express cors helmet morgan compression jsonwebtoken bcrypt

# Pour la synchronisation
npm install ws socket.io

# Pour les notifications push
npm install expo-server-sdk
```

### 2. Configuration des variables d'environnement

```bash
# Copier le template
cp .env.shared .env.local

# Éditer avec vos valeurs
nano .env.local
```

### 3. Démarrage des services

```bash
# Démarrer l'API unifiée
node shared/api/unified-api.js

# Ou intégrer au serveur existant
# Modifier server.js pour inclure l'API unifiée
```

## 🚀 Utilisation du déploiement unifié

### Déploiement complet (web + mobile)
```bash
./deploy-unified.sh --all
```

### Déploiement web uniquement
```bash
./deploy-unified.sh --web
```

### Déploiement mobile uniquement
```bash
./deploy-unified.sh --mobile
```

### Test sans déploiement
```bash
./deploy-unified.sh --all --dry-run
```

## 📱 Intégration côté mobile

### Configuration API dans React Native

```javascript
// Dans votre app mobile
import { getConfig } from '../shared/config/environment';

const apiConfig = {
  baseURL: getConfig('API.BASE_URL'),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Type': 'mobile'
  }
};
```

### Authentification mobile

```javascript
// Login depuis l'app mobile
const loginUser = async (email, password) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Client-Type': 'mobile'
    },
    body: JSON.stringify({ email, password, clientType: 'mobile' })
  });

  const data = await response.json();

  if (data.success) {
    // Stocker le token
    await AsyncStorage.setItem('authToken', data.token);
    return data.user;
  }

  throw new Error(data.error);
};
```

## 🌐 Intégration côté web

### Utilisation de l'API unifiée

```javascript
// Dans vos interfaces web existantes
const apiCall = async (endpoint, options = {}) => {
  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Client-Type': 'web',
      'Authorization': `Bearer ${getAuthToken()}`,
      ...options.headers
    }
  });

  return response.json();
};

// Exemple d'utilisation
const userStats = await apiCall('/user/stats');
const courses = await apiCall('/courses');
```

## 🔔 Notifications push unifiées

### Configuration côté serveur

```javascript
const { Expo } = require('expo-server-sdk');
const expo = new Expo();

const sendNotification = async (userId, title, body) => {
  await syncService.syncNotifications(userId, {
    title,
    body,
    data: { timestamp: new Date().toISOString() }
  }, 'system');
};
```

### Réception côté mobile

```javascript
import * as Notifications from 'expo-notifications';

// Configurer les notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Enregistrer le token
const registerForPushNotifications = async () => {
  const token = await Notifications.getExpoPushTokenAsync();

  await apiCall('/notifications/register', {
    method: 'POST',
    body: JSON.stringify({
      expoPushToken: token.data,
      deviceInfo: Device.osName
    })
  });
};
```

## 💳 Paiements Mobile Money

### Configuration MTN/Orange Money

```javascript
// Dans .env.local
MTN_MOMO_API_USER=your_mtn_api_user
MTN_MOMO_API_KEY=your_mtn_api_key
ORANGE_MONEY_MERCHANT_KEY=your_orange_merchant_key
```

### Utilisation côté mobile

```javascript
const processPayment = async (amount, phone, operator) => {
  const response = await apiCall('/payments/momo', {
    method: 'POST',
    body: JSON.stringify({ amount, phone, operator })
  });

  if (response.success) {
    return response.transactionId;
  }

  throw new Error('Paiement échoué');
};
```

## 📊 Monitoring et debug

### Statistiques de synchronisation

```bash
# Endpoint debug (si DEBUG_MODE=true)
curl http://localhost:3001/api/debug/info
```

### Logs unifiés

```bash
# Voir les logs de déploiement
tail -f unified-deployment.log

# Logs API en temps réel
pm2 logs claudyne
```

## 🔒 Sécurité

### Headers sécurisés automatiques
- ✅ Helmet.js configuré
- ✅ CORS restreint aux domaines autorisés
- ✅ Rate limiting activé
- ✅ JWT avec expiration

### Validation des requêtes
```javascript
// Middleware automatique de validation
app.use((req, res, next) => {
  // Détection du type de client
  req.clientType = req.get('X-Client-Type') || 'web';
  req.isMobile = req.clientType === 'mobile';
  next();
});
```

## 🎯 Avantages de l'intégration

### ✅ Pour les développeurs
- **Code DRY** - Configuration et API partagées
- **Déploiement simplifié** - Un seul script pour tout
- **Debug facilité** - Logs centralisés
- **Maintenance réduite** - Moins de duplication

### ✅ Pour les utilisateurs
- **Expérience cohérente** - Même données web/mobile
- **Synchronisation transparente** - Aucune perte de données
- **Notifications unifiées** - Informés partout
- **Paiements intégrés** - Mobile Money dans l'app

### ✅ Pour l'entreprise
- **Évolutivité** - Architecture modulaire
- **Monitoring unifié** - Vue globale du système
- **Sécurité renforcée** - Standards unifiés
- **ROI optimisé** - Développement accéléré

## 🔄 Workflow de développement recommandé

### 1. Développement
```bash
# Démarrer l'API unifiée en mode dev
npm run dev:api

# Développer web et mobile simultanément
npm run dev:web
npm start # Dans claudyne-mobile/
```

### 2. Test
```bash
# Test simulation complète
./deploy-unified.sh --all --dry-run
```

### 3. Déploiement
```bash
# Déploiement en production
./deploy-unified.sh --all
```

## 🆘 Résolution de problèmes

### Erreur de sync
```bash
# Vérifier le service de sync
curl http://localhost:3001/api/debug/info
```

### Problème d'authentification
```bash
# Vérifier la configuration JWT
echo $JWT_SECRET
```

### APK non accessible
```bash
# Vérifier le déploiement mobile
curl -I https://claudyne.com/download/claudyne.apk
```

---

**🎉 Avec cette intégration, vos applications web et mobile Claudyne sont maintenant parfaitement synchronisées et unifiées !**

L'écosystème Claudyne offre une expérience utilisateur cohérente et une architecture technique robuste pour l'avenir.