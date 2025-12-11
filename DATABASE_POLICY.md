# POLITIQUE BASE DE DONNÉES CLAUDYNE

## Règle Absolue

🔴 **PRODUCTION = PostgreSQL UNIQUEMENT**
🟢 **DÉVELOPPEMENT = SQLite (machine locale uniquement)**

---

## Vue d'Ensemble

**Une base de données par environnement. Pas plus, pas moins.**

```
┌─────────────────┬──────────────────┬────────────────────┐
│ ENVIRONNEMENT   │ BASE DE DONNÉES  │ LOCALISATION       │
├─────────────────┼──────────────────┼────────────────────┤
│ PRODUCTION      │ PostgreSQL       │ localhost:5432     │
│                 │ claudyne_prod    │ (serveur)          │
├─────────────────┼──────────────────┼────────────────────┤
│ DÉVELOPPEMENT   │ SQLite           │ ./database/dev.db  │
│ (local seulement│ claudyne_dev.db  │ (machine locale)   │
└─────────────────┴──────────────────┴────────────────────┘
```

---

## Commandes INTERDITES en Production

❌ `DB_TYPE=sqlite`
❌ `DB_DIALECT=sqlite`
❌ Créer des fichiers `.sqlite` sur le serveur
❌ Utiliser plusieurs bases simultanément
❌ Modifier manuellement les données en base (utiliser l'interface admin)

---

## Commandes AUTORISÉES en Production

✅ `DB_TYPE=postgres`
✅ `DB_DIALECT=postgres`
✅ Requêtes SQL en lecture via `psql` (pour debugging)
✅ Backups PostgreSQL réguliers
✅ Modifications via interface admin web

---

## En Cas de Doute

### "Quelle base utilise la prod ?"
→ **PostgreSQL `claudyne_production` (TOUJOURS)**

### "Où sont mes données ?"
→ **PostgreSQL sur localhost:5432 (TOUJOURS)**

### "Puis-je utiliser SQLite en prod ?"
→ **NON (JAMAIS)**

### "J'ai trouvé un fichier .sqlite sur le serveur ?"
→ **C'est un LEGACY backup, il ne doit PAS être utilisé**

### "Comment modifier un cours ?"
→ **Via l'interface admin : https://www.claudyne.com/admin-interface.html**

---

## Vérification Rapide

### Vérifier la base active en production

```bash
ssh root@89.117.58.53
cd /opt/claudyne/backend
cat .env | grep -E '^(NODE_ENV|DB_TYPE|DB_DIALECT|DB_NAME)='
```

**Réponse attendue** :
```
NODE_ENV=production
DB_TYPE=postgres
DB_DIALECT=postgres
DB_NAME=claudyne_production
```

**Si vous voyez `sqlite`** → 🚨 ALERTE ! Contactez l'équipe immédiatement.

---

## Connexion à PostgreSQL

### Accès psql

```bash
# Connexion locale
sudo -u postgres psql -d claudyne_production

# Lister les tables
\dt

# Compter les utilisateurs
SELECT COUNT(*) FROM users;

# Quitter
\q
```

### Backup PostgreSQL

```bash
# Créer un backup
sudo -u postgres pg_dump claudyne_production > backup_$(date +%Y%m%d).sql

# Restaurer un backup (ATTENTION)
sudo -u postgres psql -d claudyne_production < backup_YYYYMMDD.sql
```

---

## Fichiers SQLite Existants

### `/opt/claudyne/backend/database/LEGACY_dev_backup.sqlite`

**Statut** : ARCHIVE (ne JAMAIS utiliser)
**Contenu** : Anciennes données de développement (2 users)
**Action** : Conserver pour historique uniquement

### `/opt/claudyne/backend/database/archives/YYYYMMDD/`

**Statut** : BACKUPS historiques
**Contenu** : Sauvegardes des anciennes bases SQLite (temp, clean, dev)
**Action** : Conserver pour sécurité, ne pas restaurer

---

## Logs à Surveiller

### Logs Backend

```bash
pm2 logs claudyne-backend | grep -i "database\|postgres\|sqlite"
```

**✅ Bon signe** :
- "PostgreSQL connected"
- "claudyne_production"
- "Connexion base de données établie (production - postgres)"

**❌ Mauvais signe** :
- "SQLite"
- "claudyne_dev.sqlite"
- "SQLITE_MISMATCH"
- "🚨 ERREUR FATALE : SQLite n'est PAS autorisé en production !"

---

## Protection Automatique

### 1. Vérification au Démarrage

Le fichier `backend/src/config/database.js` contient une vérification automatique :

```javascript
if (env === 'production' && process.env.DB_TYPE === 'sqlite') {
  throw new Error('🚨 ERREUR : SQLite n\'est PAS autorisé en production !');
}
```

Si quelqu'un essaie de démarrer le backend avec SQLite en production, **le serveur refusera de démarrer**.

### 2. Configuration Verrouillée

Le fichier `.env` en production est configuré pour PostgreSQL uniquement. Toute modification doit être validée par l'équipe.

---

## Que Faire en Cas d'Erreur

### Backend refuse de démarrer avec erreur SQLite

```bash
# 1. Vérifier .env
cat /opt/claudyne/backend/.env | grep DB_

# 2. Corriger si nécessaire
nano /opt/claudyne/backend/.env
# Changer DB_TYPE=sqlite en DB_TYPE=postgres
# Changer DB_DIALECT=sqlite en DB_DIALECT=postgres

# 3. Redémarrer
pm2 restart claudyne-backend --update-env
pm2 logs claudyne-backend
```

### PostgreSQL ne répond pas

```bash
# Vérifier status
sudo systemctl status postgresql

# Redémarrer PostgreSQL
sudo systemctl restart postgresql

# Vérifier connexion
sudo -u postgres psql -d claudyne_production -c 'SELECT 1;'
```

---

## Checklist Déploiement

Avant chaque déploiement, vérifier :

- [ ] `.env` contient `NODE_ENV=production`
- [ ] `.env` contient `DB_TYPE=postgres`
- [ ] `.env` contient `DB_DIALECT=postgres`
- [ ] Aucun fichier `.sqlite` actif dans `/opt/claudyne/backend/database/`
- [ ] PostgreSQL est accessible : `psql -d claudyne_production`
- [ ] Les logs backend affichent "PostgreSQL connected"

---

## Support

### En cas de problème

1. **Vérifier les logs** : `pm2 logs claudyne-backend`
2. **Vérifier PostgreSQL** : `sudo systemctl status postgresql`
3. **Vérifier la config** : `cat /opt/claudyne/backend/.env`
4. **Lire ce document** : `cat /opt/claudyne/DATABASE_POLICY.md`

### Contacts d'Urgence

- Documentation complète : `/opt/claudyne/STRATEGIE_BASE_DE_DONNEES_UNIQUE.md`
- Rapport migration : `/opt/claudyne/RAPPORT_MIGRATION_POSTGRESQL.md`
- Guide structure cours : `/opt/claudyne/STRUCTURE_COURS_ATTENDUE.md`

---

**Créé le** : 11 décembre 2025
**Dernière mise à jour** : 11 décembre 2025
**Version** : 1.0

**💚 Une base, une vérité, zéro confusion - Claudyne 💚**
