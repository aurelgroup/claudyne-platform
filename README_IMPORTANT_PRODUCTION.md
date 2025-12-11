# ⚠️ IMPORTANT - PRODUCTION CLAUDYNE

## 🚨 NE PAS RELANCER LE SCRIPT DE MIGRATION JSON → DB

**La plateforme utilise maintenant PostgreSQL en production.**

### ❌ À NE JAMAIS FAIRE

```bash
# ❌ NE PAS EXÉCUTER CECI :
node backend/scripts/migrate-courses-to-db.js
```

**Pourquoi ?**
- Les données sont **déjà dans PostgreSQL** (`claudyne_production`)
- Relancer ce script créerait des **doublons**
- Ce script était uniquement pour migrer le `content-store.json` initial

---

## ✅ COMMENT MODIFIER LES COURS

### Via l'Interface Admin (MÉTHODE RECOMMANDÉE)

1. **Connexion** : `https://www.claudyne.com/admin-interface.html`
2. **Section** : "Gestion de Contenu" → "Cours"
3. **Éditer directement** le cours existant
4. **Les modifications sont instantanées** (PostgreSQL direct)

### Structure Attendue

Consultez : `/opt/claudyne/STRUCTURE_COURS_ATTENDUE.md`

---

## 📊 ÉTAT ACTUEL PRODUCTION

```
Base de données  : PostgreSQL (claudyne_production)
Users            : 44
Students         : 8
Subjects         : 6 (3 pour TERMINALE)
Lessons          : 6
Backend          : PM2 cluster (2 instances)
Environment      : production
```

---

## 🔍 COMMANDES DE VÉRIFICATION

### Vérifier la connexion PostgreSQL

```bash
sudo -u postgres psql -d claudyne_production -c 'SELECT COUNT(*) FROM users;'
```

### Vérifier les cours disponibles

```bash
sudo -u postgres psql -d claudyne_production -c "
SELECT s.title, s.level, COUNT(l.id) as lessons
FROM subjects s
LEFT JOIN lessons l ON l.\"subjectId\" = s.id
GROUP BY s.id, s.title, s.level;
"
```

### Health Check

```bash
curl https://www.claudyne.com/api/health
```

---

## 🚀 REDÉMARRAGE BACKEND

Si vous modifiez `.env` ou le code backend :

```bash
cd /opt/claudyne
pm2 restart claudyne-backend --update-env
pm2 logs claudyne-backend --lines 50
```

---

## 📞 EN CAS DE PROBLÈME

1. **Vérifier les logs** :
   ```bash
   pm2 logs claudyne-backend
   tail -100 /var/log/claudyne/backend-error.log
   ```

2. **Vérifier PostgreSQL** :
   ```bash
   sudo systemctl status postgresql
   sudo -u postgres psql -d claudyne_production
   ```

3. **Vérifier la configuration** :
   ```bash
   cat /opt/claudyne/backend/.env | grep -E '^(NODE_ENV|DB_)'
   ```

---

## 📚 DOCUMENTATION

- **Structure Cours** : `/opt/claudyne/STRUCTURE_COURS_ATTENDUE.md`
- **Rapport Migration** : `/opt/claudyne/RAPPORT_MIGRATION_POSTGRESQL.md`
- **Deployment Guide** : `/opt/claudyne/DEPLOYMENT_GUIDE.md`

---

**💚 La force du savoir en héritage - Claudine 💚**
