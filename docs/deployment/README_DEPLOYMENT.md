# 🚀 Système de Déploiement Automatisé Claudyne

## 📋 Outils Créés pour Éviter les Erreurs de Déploiement

Après avoir résolu le problème de redirection vers `lessons.html` causé par un déploiement vers le mauvais répertoire, nous avons créé un système complet pour éviter ce type d'erreur à l'avenir.

## 🎯 Le Problème Résolu

**Symptôme:** Redirection vers `lessons.html` malgré des fichiers corrects en local

**Cause:** Déploiement vers `/var/www/claudyne/public/` alors que NGINX sert depuis `/opt/claudyne/`

**Solution:** Scripts automatisés qui garantissent le bon emplacement

## 🛠️ Outils Disponibles

### 1. `deploy.sh` - Script de Déploiement Automatisé

**Usage:**
```bash
./deploy.sh all       # Déploie frontend + backend
./deploy.sh frontend  # Déploie seulement le frontend
./deploy.sh backend   # Déploie seulement le backend
```

**Fonctionnalités:**
- ✅ Déploie vers le bon emplacement (`/opt/claudyne/`)
- ✅ Vérifie les versions de service worker
- ✅ Redémarre PM2 automatiquement
- ✅ Teste la santé du backend
- ✅ Génère un rapport de déploiement
- ✅ Affiche des messages clairs avec couleurs

### 2. `verify-deployment.sh` - Script de Vérification

**Usage:**
```bash
./verify-deployment.sh
```

**Vérifications effectuées:**
1. ✅ NGINX root directory est correct
2. ✅ Fichiers frontend existent
3. ✅ Versions de service worker matchent (local/remote/servi)
4. ✅ Bouton "Découvrir les matières" est correct
5. ✅ Aucune référence à `lessons.html`
6. ✅ Backend est en bonne santé
7. ✅ PM2 est en ligne
8. ✅ MD5 des fichiers matchent

**Sortie exemple:**
```
ℹ️  ==========================================
ℹ️    Claudyne Deployment Verification
ℹ️  ==========================================

ℹ️  1. Checking NGINX root directory...
✅ NGINX root is correct: /opt/claudyne

ℹ️  2. Checking frontend files...
✅ student-interface-modern.html exists (modified: 2025-12-10 01:53:22)
✅ sw.js exists (modified: 2025-12-10 01:53:22)
✅ index.html exists (modified: 2025-12-10 01:53:22)

ℹ️  3. Checking service worker version...
ℹ️    Local:  claudyne-v1.5.1
ℹ️    Remote: claudyne-v1.5.1
ℹ️    Served: claudyne-v1.5.1
✅ Service worker versions match: claudyne-v1.5.1

ℹ️  4. Checking student interface button...
✅ Button code is CORRECT: showSection('subjects')

ℹ️  5. Checking for lessons.html references...
✅ No references to lessons.html found (correct)

ℹ️  6. Checking backend health...
✅ Backend is healthy

ℹ️  7. Checking PM2 status...
✅ PM2 backend is online

ℹ️  8. Comparing file hashes...
✅ student-interface-modern.html matches (MD5: 05f4eed72dca84bf23334aa2ed21ccbe)

ℹ️  ==========================================
✅   All checks passed! ✅
✅   Deployment is correct.
ℹ️  ==========================================
```

### 3. Documentation

| Fichier | Description |
|---------|-------------|
| `DEPLOYMENT_GUIDE.md` | Guide complet avec architecture, workflows, troubleshooting |
| `QUICK_DEPLOY.md` | Aide-mémoire avec commandes rapides |
| `DEPLOYMENT_CHECKLIST.md` | Checklist détaillée (mise à jour) |
| `.claude/deploy-checklist.md` | Référence pour l'emplacement correct |
| `.vscode/tasks.json` | Intégration VSCode (Ctrl+Shift+P) |

### 4. Intégration VSCode

**Tasks disponibles** (Ctrl+Shift+P → "Tasks: Run Task"):
- Deploy Frontend
- Deploy Backend
- Deploy All
- Verify Deployment
- Check PM2 Status
- Check Backend Logs
- Test Backend Health

## 📖 Guide d'Utilisation Rapide

### Workflow Recommandé

```bash
# 1. Modifier le code
vim student-interface-modern.html

# 2. Bumper la version du service worker
vim sw.js  # Change CACHE_NAME = 'claudyne-v1.5.2'

# 3. Déployer + Vérifier
./deploy.sh all && ./verify-deployment.sh

# 4. Partager avec les utilisateurs
echo "https://www.claudyne.com/clear-cache.html"
```

### Commande Ultra-Rapide

```bash
./deploy.sh all && ./verify-deployment.sh
```

## 🗺️ Architecture de Déploiement

```
┌──────────────────────────────────────────────────┐
│  DÉVELOPPEMENT LOCAL                             │
│  C:\Users\fa_nono\Documents\CADD\Claudyne\      │
└────────────────┬─────────────────────────────────┘
                 │
                 │ ./deploy.sh all
                 ↓
┌──────────────────────────────────────────────────┐
│  SERVEUR PRODUCTION (89.117.58.53)               │
│                                                  │
│  /opt/claudyne/          ← NGINX root (static)  │
│  ├── *.html                                      │
│  ├── sw.js                                       │
│  └── backend/            ← Backend Node.js      │
│      └── src/                                    │
│                                                  │
│  NGINX (port 80/443) ───→ Backend (port 3001)   │
└──────────────────────────────────────────────────┘
                 │
                 │ ./verify-deployment.sh
                 ↓
┌──────────────────────────────────────────────────┐
│  VÉRIFICATIONS                                   │
│  ✅ Files deployed to correct location          │
│  ✅ Service worker version matches              │
│  ✅ Button code correct                         │
│  ✅ No lessons.html references                  │
│  ✅ Backend healthy                             │
│  ✅ PM2 online                                  │
└──────────────────────────────────────────────────┘
```

## ⚠️ Points Critiques à Retenir

### 1. Emplacement de Déploiement

```bash
❌ FAUX:    /var/www/claudyne/public/
✅ CORRECT: /opt/claudyne/
```

### 2. Version du Service Worker

**Toujours bumper la version après modification frontend:**

```javascript
// sw.js
const CACHE_NAME = 'claudyne-v1.5.2';  // ← Incrémenter!
```

### 3. Nettoyage du Cache Utilisateur

**Après chaque déploiement frontend, partager:**
```
https://www.claudyne.com/clear-cache.html
```

## 🔧 Troubleshooting

### Problème: Ancienne version affichée

```bash
# Vérifier
./verify-deployment.sh

# Si fichier pas au bon endroit
./deploy.sh frontend

# Si cache utilisateur
# Partager: https://www.claudyne.com/clear-cache.html
```

### Problème: Backend ne répond pas

```bash
# Check status
ssh root@89.117.58.53 "pm2 status"

# Restart
ssh root@89.117.58.53 "pm2 restart claudyne-backend"

# Logs
ssh root@89.117.58.53 "pm2 logs claudyne-backend"
```

## 📊 Rapports de Déploiement

Chaque déploiement génère un rapport automatique:

```
deployment-report-20251210-015322.txt
```

**Contenu:**
- Fichiers déployés avec timestamps
- Version du service worker
- Statut PM2
- Santé du backend

## 🎓 Bonnes Pratiques

1. ✅ **Toujours** tester localement avant de déployer
2. ✅ **Toujours** bumper la version SW si frontend modifié
3. ✅ **Toujours** utiliser `./deploy.sh` (jamais `scp` manuel)
4. ✅ **Toujours** lancer `./verify-deployment.sh` après déploiement
5. ✅ **Toujours** partager clear-cache.html après déploiement frontend

## 📞 Support

En cas de problème non résolu:

1. Lancer `./verify-deployment.sh` et copier la sortie complète
2. Vérifier les logs: `ssh root@89.117.58.53 "pm2 logs claudyne-backend --lines 100"`
3. Vérifier la console navigateur (F12)
4. Consulter `DEPLOYMENT_GUIDE.md` pour plus de détails

## 🎯 Liens Utiles

- **Guide complet:** `DEPLOYMENT_GUIDE.md`
- **Aide-mémoire rapide:** `QUICK_DEPLOY.md`
- **Checklist détaillée:** `DEPLOYMENT_CHECKLIST.md`
- **Référence emplacements:** `.claude/deploy-checklist.md`
- **Page nettoyage cache:** https://www.claudyne.com/clear-cache.html

---

**Dernière mise à jour:** 2025-12-10
**Version système:** 1.0.0
**Créé pour éviter:** Erreurs de déploiement vers mauvais répertoire
