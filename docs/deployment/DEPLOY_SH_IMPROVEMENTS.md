# Améliorations du Script deploy.sh

## 📅 Date: 2025-12-20

## ✅ Améliorations Apportées

### 1. Nouvelle Fonction: deploy_nextjs()
**Localisation:** Lignes 164-224

**Fonctionnalités:**
- ✅ Vérifie que le dossier `frontend/` existe
- ✅ Sync avec rsync (exclut node_modules, .next, .env.local)
- ✅ Build Next.js directement sur le serveur
- ✅ Gère PM2 (restart si existe, start sinon)
- ✅ Health check sur port 3000
- ✅ Logs en cas d'échec

**Code ajouté:**
```bash
deploy_nextjs() {
    # Sync frontend files
    rsync -az --delete --exclude 'node_modules' --exclude '.next' frontend/ ...

    # Build on server
    ssh $SERVER "cd /opt/claudyne/frontend && npm run build"

    # Manage PM2 (restart or start)
    # Verify health
}
```

### 2. Health Checks Next.js Améliorés
**Localisation:** Lignes 302-310 dans verify_deployment()

**Ajout:**
- Test public de la route `/famille`
- Vérification présence `id="__next"`
- Warning si Next.js non détecté (fallback HTML statique)

**Code ajouté:**
```bash
NEXTJS_PUBLIC=$(curl -sk https://www.claudyne.com/famille | grep -o 'id="__next"')
if [ -n "$NEXTJS_PUBLIC" ]; then
    log_success "Next.js routes are publicly accessible"
fi
```

### 3. Nouvelle Option: nextjs
**Localisation:** Lignes 383-385

**Usage:**
```bash
./deploy.sh nextjs    # Déploie seulement Next.js
```

### 4. Option 'all' Améliorée
**Localisation:** Lignes 386-390

**Modification:**
```bash
all)
    deploy_frontend    # HTML statiques
    deploy_backend     # API backend
    deploy_nextjs      # Application Next.js (NOUVEAU!)
    ;;
```

### 5. Documentation Améliorée
**Localisation:** Lignes 3-18 (header) et 393-400 (help)

**Ajout:**
- Description claire de chaque option
- Exemples d'utilisation
- Différence frontend (HTML) vs nextjs (React app)

## 📊 Comparaison Avant/Après

| Fonctionnalité | Avant | Après |
|----------------|-------|-------|
| Déployer HTML statiques | ✅ | ✅ |
| Déployer Backend | ✅ | ✅ |
| Déployer Next.js | ❌ | ✅ |
| Health check Next.js | ❌ | ✅ |
| PM2 frontend management | ❌ | ✅ |
| Build Next.js sur serveur | ❌ | ✅ |
| Rollback automatique | ❌ | ❌ (à ajouter) |

## 🎯 Utilisation

### Scénarios d'Usage

#### 1. Déploiement Complet (Recommandé pour releases)
```bash
./deploy.sh all --bump-sw
```
- Déploie HTML statiques
- Déploie backend
- Déploie et build Next.js
- Bump service worker

#### 2. Modification Backend Uniquement
```bash
./deploy.sh backend
```
- Déploie routes, models, middleware, utils
- Restart backend PM2
- Health check backend

#### 3. Modification Next.js Uniquement
```bash
./deploy.sh nextjs
```
- Sync fichiers frontend/
- Build Next.js sur serveur
- Restart/Start PM2 frontend
- Health check Next.js

#### 4. Modification HTML Statiques Uniquement
```bash
./deploy.sh frontend --bump-sw
```
- Déploie index.html, admin-interface.html, etc.
- Bump service worker (optionnel)

## 🔍 Processus de Déploiement Next.js

### Étapes Détaillées

1. **Vérification locale**
   ```bash
   [ ! -d "frontend" ] && exit 1
   ```

2. **Sync vers serveur**
   ```bash
   rsync -az --delete \
       --exclude 'node_modules' \
       --exclude '.next' \
       --exclude '.env.local' \
       frontend/ root@89.117.58.53:/opt/claudyne/frontend/
   ```

3. **Build sur serveur**
   ```bash
   ssh root@89.117.58.53 "cd /opt/claudyne/frontend && npm run build"
   ```
   - Prend ~15-30 secondes
   - Génère `.next/` avec pages optimisées
   - Échoue si erreurs TypeScript/ESLint

4. **Gestion PM2**
   ```bash
   # Si existe: restart
   pm2 restart claudyne-frontend

   # Si n'existe pas: start
   pm2 start npm --name claudyne-frontend -- start

   # Sauvegarde config
   pm2 save
   ```

5. **Health Check**
   ```bash
   curl -s http://localhost:3000 | grep 'id="__next"'
   ```
   - Vérifie que Next.js répond
   - Timeout: 5 secondes
   - Fail: affiche logs PM2

## ⚠️ Points d'Attention

### Prérequis
- ✅ `rsync` installé localement (pour sync efficace)
- ✅ `npm` installé sur le serveur
- ✅ Dependencies installées: `cd frontend && npm install`

### Durée du Déploiement
- **Frontend (HTML):** ~5 secondes
- **Backend:** ~10 secondes (restart PM2)
- **Next.js:** ~30 secondes (sync + build + restart)
- **All:** ~45 secondes total

### En Cas d'Échec

**Build Next.js échoue:**
```bash
# Logs affichés automatiquement
# Vérifier erreurs TypeScript/ESLint localement:
cd frontend
npm run build
```

**PM2 frontend ne démarre pas:**
```bash
# Le script affiche les logs
# Vérifier manuellement:
ssh root@89.117.58.53 "pm2 logs claudyne-frontend"
```

**Health check échoue:**
```bash
# Vérifier que Next.js écoute sur port 3000:
ssh root@89.117.58.53 "lsof -i :3000"
```

## 🚀 Prochaines Améliorations Possibles

### Court Terme
- [ ] Rollback automatique si échec
- [ ] Backup avant déploiement
- [ ] Deploy logs dans fichier horodaté

### Moyen Terme
- [ ] Option `--dry-run` pour tester sans déployer
- [ ] Option `--quick` pour sync incrémental
- [ ] Notifications Slack/Email en cas d'échec

### Long Terme
- [ ] CI/CD avec GitHub Actions
- [ ] Blue-green deployment
- [ ] Canary releases

## 📝 Exemple de Workflow

### Modification d'une Page Next.js

```bash
# 1. Développement local
cd frontend
npm run dev
# Tester les changements sur localhost:3000

# 2. Commit
git add frontend/pages/apprentissage/[subjectId].tsx
git commit -m "feat: improve lesson display"
git push

# 3. Déploiement
./deploy.sh nextjs

# 4. Vérification
# - Script affiche success/failure
# - Tester https://www.claudyne.com/famille
```

### Modification Backend + Next.js

```bash
# 1. Modifications
git add backend/src/routes/subjects.js frontend/pages/famille.tsx
git commit -m "feat: new feature"
git push

# 2. Déploiement (éviter 'all' si pas besoin HTML statiques)
./deploy.sh backend
./deploy.sh nextjs

# OU en une commande (mais pas optimal):
# ./deploy.sh all
```

## ✅ Validation du Script

### Tests Recommandés

Avant d'utiliser en production:

```bash
# 1. Test dry-run (vérifier syntaxe)
bash -n deploy.sh

# 2. Test Next.js seulement
./deploy.sh nextjs

# 3. Vérifier logs
ssh root@89.117.58.53 "pm2 logs claudyne-frontend --lines 50"

# 4. Test public
curl -sk https://www.claudyne.com/famille | grep '__next'
```

## 📚 Documentation Supplémentaire

- Rapport de déploiement: `deployment-report-20251220-*.md`
- Analyse complète: `DEPLOY_ANALYSIS.md`
- Ce document: `DEPLOY_SH_IMPROVEMENTS.md`

---

**Auteur:** Claude Sonnet 4.5
**Date:** 2025-12-20
**Version Script:** 2.0 (avec support Next.js)
