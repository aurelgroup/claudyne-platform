# Checklist Déploiement Production - Claudyne

## 🎯 Objectif

Ce document décrit les vérifications à effectuer après chaque déploiement pour garantir la stabilité de la production.

---

## ✅ Script Automatique (Recommandé)

### Utilisation

```bash
# Vérification complète automatique
bash check-production.sh
```

Le script vérifie automatiquement:
1. ✅ Health API endpoint
2. ✅ Public content endpoint
3. ✅ PM2 process status
4. ✅ Backend logs (erreurs récentes)
5. ✅ Cron logs (erreurs DB)
6. ✅ Cron jobs actifs
7. ✅ Configuration DB
8. ✅ Fichiers d'environnement
9. ✅ Historique PM2 restarts
10. ✅ Tests contrats API

### Codes de Sortie

- `0` : Production saine (tous les checks passent)
- `1` : Problèmes mineurs (1-2 checks échouent)
- `2` : Problèmes critiques (3+ checks échouent)

### Intégration avec deploy.sh

Le script est **automatiquement appelé** par `deploy.sh` après un déploiement backend:

```bash
bash deploy.sh backend
# → Déploie + Lance check-production.sh automatiquement
```

---

## 📋 Checklist Manuelle (Si Besoin)

Si `check-production.sh` n'est pas disponible, voici les commandes manuelles:

### 1. Vérifier Health API
```bash
curl -sS https://claudyne.com/api/health
```
**Attendu**: `{"status":"healthy",...}`

### 2. Vérifier Contenu Public
```bash
curl -sS https://claudyne.com/api/public/content | head -c 300
```
**Attendu**: `{"success":true,"data":{...}}`

### 3. Statut PM2
```bash
ssh root@89.117.58.53 "pm2 status"
```
**Attendu**:
- `claudyne-backend` → online
- `claudyne-cron` → online

### 4. Redémarrer Backend (Si Déployé)
```bash
ssh root@89.117.58.53 "pm2 restart claudyne-backend --update-env"
```

### 5. Redémarrer Cron (Si Déployé)
```bash
ssh root@89.117.58.53 "pm2 restart claudyne-cron --update-env"
```

### 6. Logs Backend (Erreurs)
```bash
ssh root@89.117.58.53 "pm2 logs claudyne-backend --lines 50 --nostream | tail -50"
```
**Chercher**: `error`, `fatal`, `exception`

### 7. Logs Cron (Erreurs DB)
```bash
ssh root@89.117.58.53 "pm2 logs claudyne-cron --lines 200 --nostream | grep -iE 'password must be a string|SequelizeConnectionError|SCRAM' | tail -20"
```
**Attendu**: Aucune sortie (pas d'erreurs)

### 8. Variables DB
```bash
ssh root@89.117.58.53 "cd /opt/claudyne/backend && grep -E '^DB_' .env.production"
```
**Vérifier**:
- `DB_HOST=localhost`
- `DB_NAME=claudyne_production`
- `DB_USER=claudyne_user`
- `DB_PASSWORD=...` (défini)

### 9. Vérifier Cron Jobs Actifs
```bash
ssh root@89.117.58.53 "pm2 logs claudyne-cron --lines 50 --nostream | grep -E '✅.*cron jobs actifs|🎯'"
```
**Attendu**: `✅ 6 cron jobs actifs`

### 10. Tests Contrats API
```bash
bash test-api-contracts.sh
```
**Attendu**: `✅ TOUS LES TESTS RÉUSSIS!`

---

## 🔧 Actions en Cas de Problème

### Health Check Échoue
```bash
# Vérifier les logs
ssh root@89.117.58.53 "pm2 logs claudyne-backend --lines 100"

# Redémarrer si nécessaire
ssh root@89.117.58.53 "pm2 restart claudyne-backend --update-env"
```

### Erreurs DB dans Cron
```bash
# Vérifier que .env.production est chargé
ssh root@89.117.58.53 "cd /opt/claudyne/backend && cat .env.production | grep DB_PASSWORD"

# Redémarrer cron avec --update-env
ssh root@89.117.58.53 "pm2 restart claudyne-cron --update-env"
```

### PM2 Status "Stopped"
```bash
# Démarrer le processus
ssh root@89.117.58.53 "pm2 start ecosystem.config.js --only claudyne-backend"
ssh root@89.117.58.53 "pm2 start ecosystem.config.js --only claudyne-cron"
```

### Restarts > 30
```bash
# Vérifier logs d'erreur
ssh root@89.117.58.53 "pm2 describe claudyne-backend | grep -A5 error"

# Si unstable restarts > 0 → PROBLÈME CRITIQUE
ssh root@89.117.58.53 "pm2 describe claudyne-backend | grep 'unstable restarts'"
```

---

## 📊 Indicateurs Clés

### ✅ Production Saine
- Health: `"status":"healthy"`
- PM2: `online` (backend + cron)
- DB errors: `0`
- Unstable restarts: `0`
- API contracts: `PASS`

### ⚠️ Attention Requise
- Logs backend contiennent "error" (vérifier gravité)
- Anciennes erreurs DB dans logs (avant dernier fix)
- Restarts > 20 (déploiements fréquents)

### 🚨 Critique
- Health: `unhealthy` ou timeout
- PM2: `stopped` ou `errored`
- DB errors: Récentes (< 1h)
- Unstable restarts: > 0
- API contracts: `FAIL`

---

## 🕐 Fréquence Recommandée

| Action | Quand | Outil |
|--------|-------|-------|
| **Check complet** | Après chaque déploiement backend | `check-production.sh` |
| **Health check** | Quotidien (monitoring) | `curl /health` |
| **Logs cron** | Après exécution job (08:00, 23:00) | `pm2 logs claudyne-cron` |
| **PM2 status** | En cas de doute | `pm2 status` |

---

## 📝 Historique Problèmes Résolus

### 18 Décembre 2024 - Erreur DB Cron
**Problème**: `SequelizeConnectionError: client password must be a string`
**Cause**: Cron job ne chargeait pas dotenv → `DB_PASSWORD` undefined
**Solution**: Ajout chargement dotenv dans `subscriptionCron.js`
**Commit**: [hash]

### 17 Décembre 2024 - Routes Doublons
**Problème**: Routes mortes dans admin.js (195 lignes)
**Cause**: Doublons GET /content, POST /courses
**Solution**: Suppression code mort + commentaires explicatifs
**Commit**: [hash]

---

## 🔗 Liens Utiles

- **API Conventions**: `API_CONVENTIONS.md`
- **Guide Prévention**: `PREVENTION_PROBLEMES_FUTURS.md`
- **Script Deploy**: `deploy.sh`
- **Script Check**: `check-production.sh`
- **Tests Contrats**: `test-api-contracts.sh`

---

**Dernière mise à jour**: 18 Décembre 2024
**Créé par**: Claude Code
**Status**: ✅ Actif
