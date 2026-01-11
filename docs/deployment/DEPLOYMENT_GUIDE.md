# 📚 Guide de Déploiement Claudyne

## 🎯 Résumé Rapide

**Le problème qu'on a eu:** Déploiement vers `/var/www/claudyne/public/` alors que NGINX sert depuis `/opt/claudyne/`

**La solution:** Toujours utiliser le script automatisé `deploy.sh`

## 🚀 Déploiement en 3 Étapes

### 1. Préparation (LOCAL)

```bash
# A. Bumper la version du Service Worker (si frontend modifié)
# Éditer sw.js et changer:
const CACHE_NAME = 'claudyne-v1.5.1';  // Incrémenter le numéro

# B. Tester localement
# Ouvrir index.html ou student-interface-modern.html dans le navigateur
# Vérifier qu'il n'y a pas d'erreurs dans la console
```

### 2. Déploiement (AUTOMATISÉ)

```bash
# Option 1: Déployer tout (frontend + backend)
./deploy.sh all

# Option 2: Déployer seulement le frontend
./deploy.sh frontend

# Option 3: Déployer seulement le backend
./deploy.sh backend
```

### 3. Vérification (AUTOMATISÉE)

```bash
# Vérifier que tout est correct
./verify-deployment.sh
```

## 📋 Checklist Pré-Déploiement

- [ ] J'ai testé localement
- [ ] J'ai bumpé la version du service worker (si frontend modifié)
- [ ] J'ai vérifié qu'il n'y a pas d'erreurs dans la console
- [ ] J'ai commit mes changements dans Git
- [ ] Je suis prêt à partager le lien de nettoyage de cache avec les utilisateurs

## 🔧 Scripts Disponibles

### `deploy.sh`
Script de déploiement automatisé qui:
- ✅ Copie les fichiers vers `/opt/claudyne/` (bon emplacement)
- ✅ Vérifie que les versions matchent
- ✅ Redémarre PM2 si nécessaire
- ✅ Teste la santé du backend
- ✅ Génère un rapport de déploiement

### `verify-deployment.sh`
Script de vérification qui:
- ✅ Vérifie que NGINX sert depuis `/opt/claudyne/`
- ✅ Compare les versions de service worker (local/remote/servi)
- ✅ Vérifie que le bouton est correct
- ✅ Cherche des références à `lessons.html`
- ✅ Teste la santé du backend
- ✅ Compare les MD5 des fichiers

## 🗺️ Architecture des Serveurs

```
┌─────────────────────────────────────────┐
│          NGINX (Port 80/443)            │
│   root: /opt/claudyne/                  │
│                                         │
│   Sert les fichiers HTML/CSS/JS        │
└─────────────┬───────────────────────────┘
              │
              ├─ /api/* ──────> Backend Node.js (Port 3001)
              │                 /opt/claudyne/backend/
              │
              └─ /*.html ────> /opt/claudyne/*.html
                               (NOT /var/www/claudyne/public/)
```

## 📁 Structure des Fichiers de Déploiement

```
/opt/claudyne/                    ← NGINX root (fichiers statiques)
├── index.html
├── student-interface-modern.html
├── admin-interface.html
├── parent-interface.html
├── lessons.html
├── sw.js
├── clear-cache.html
└── backend/                      ← Backend Node.js
    └── src/
        ├── routes/
        ├── models/
        └── utils/
```

## ⚠️ Erreurs Communes à Éviter

### ❌ Erreur #1: Déployer vers le mauvais emplacement
```bash
# MAUVAIS
scp file.html root@89.117.58.53:/var/www/claudyne/public/

# BON
scp file.html root@89.117.58.53:/opt/claudyne/
```

### ❌ Erreur #2: Oublier de bumper la version du service worker
```javascript
// Si vous modifiez student-interface-modern.html,
// il FAUT bumper la version dans sw.js
const CACHE_NAME = 'claudyne-v1.5.2';  // ← Incrémenter!
```

### ❌ Erreur #3: Ne pas partager le lien de clear cache
Après chaque déploiement frontend, partager:
```
https://www.claudyne.com/clear-cache.html
```

### ❌ Erreur #4: Ne pas vérifier après déploiement
Toujours lancer `./verify-deployment.sh` après un déploiement!

## 🆘 Résolution de Problèmes

### Problème: Le site affiche l'ancienne version

**Diagnostic:**
```bash
./verify-deployment.sh
```

**Solution 1:** Vérifier que le fichier a été déployé au bon endroit
```bash
ssh root@89.117.58.53 "ls -lh /opt/claudyne/student-interface-modern.html"
# Vérifier la date/heure
```

**Solution 2:** Vérifier que NGINX sert le bon fichier
```bash
curl -I https://www.claudyne.com/student-interface-modern.html | grep "Last-Modified"
```

**Solution 3:** Forcer les utilisateurs à vider le cache
```
https://www.claudyne.com/clear-cache.html
```

### Problème: Backend ne répond pas

**Diagnostic:**
```bash
ssh root@89.117.58.53 "pm2 status"
ssh root@89.117.58.53 "pm2 logs claudyne-backend --lines 50"
```

**Solution:**
```bash
ssh root@89.117.58.53 "pm2 restart claudyne-backend"
```

### Problème: Version du service worker ne match pas

**Diagnostic:**
```bash
# Version locale
grep "CACHE_NAME" sw.js

# Version servie
curl -s https://www.claudyne.com/sw.js | grep "CACHE_NAME"
```

**Solution:** Redéployer avec `./deploy.sh frontend`

## 📞 Contact & Support

Si vous rencontrez un problème non documenté ici:

1. Lancer `./verify-deployment.sh` et copier la sortie
2. Vérifier les logs: `ssh root@89.117.58.53 "pm2 logs claudyne-backend"`
3. Prendre une capture d'écran de l'erreur dans le navigateur (F12 → Console)

## 🎓 Bonnes Pratiques

1. **Toujours tester localement avant de déployer**
2. **Utiliser Git pour versionner les changements**
3. **Bumper la version du service worker à chaque modification frontend**
4. **Vérifier le déploiement avec `verify-deployment.sh`**
5. **Garder une trace des déploiements** (les rapports sont générés automatiquement)
6. **Communiquer avec les utilisateurs** après un déploiement frontend

## 🔄 Workflow Recommandé

```
1. Développement Local
   ↓
2. Test Local
   ↓
3. Commit Git
   ↓
4. ./deploy.sh all
   ↓
5. ./verify-deployment.sh
   ↓
6. Partager clear-cache.html avec utilisateurs
   ↓
7. Monitoring (PM2, logs)
```

## 📊 Monitoring

### Vérifier la santé en temps réel
```bash
# Backend health
curl -s https://www.claudyne.com/api/health | jq .

# PM2 status
ssh root@89.117.58.53 "pm2 status"

# Logs en temps réel
ssh root@89.117.58.53 "pm2 logs claudyne-backend"
```

## 🎯 VSCode Integration

Utilisez les tasks VSCode (Ctrl+Shift+P → "Tasks: Run Task"):

- **Deploy Frontend** - Déploie seulement le frontend
- **Deploy Backend** - Déploie seulement le backend
- **Deploy All** - Déploie tout
- **Verify Deployment** - Vérifie le déploiement
- **Check PM2 Status** - Vérifie le statut PM2
- **Check Backend Logs** - Affiche les logs
- **Test Backend Health** - Test de santé du backend

---

**Dernière mise à jour:** 2025-12-10
**Version:** 1.0.0
