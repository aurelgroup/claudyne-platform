# 🎯 STRATÉGIE : UNE SEULE BASE PAR ENVIRONNEMENT

## 🚨 PROBLÈME ACTUEL

**Claudyne a TROP de bases de données qui créent confusion et erreurs :**

```
📁 SQLite (3 fichiers !) :
   ├─ claudyne_dev.sqlite     (512 KB) - Dev ? Prod ?
   ├─ claudyne_temp.sqlite    (512 KB) - Temporaire ?
   └─ claudyne_clean.sqlite   (476 KB) - Backup ?

🐘 PostgreSQL (1 base) :
   └─ claudyne_production     (44 users, données réelles)

TOTAL : 4 BASES DE DONNÉES
```

**Conséquences :**
- ❌ Confusion : Quelle base est utilisée ?
- ❌ Pertes de temps : Chercher les vraies données
- ❌ Bugs : SQLite au lieu de PostgreSQL
- ❌ Duplication : Données dans plusieurs bases
- ❌ Migrations : Scripts qui ne savent pas où aller

---

## ✅ STRATÉGIE RECOMMANDÉE

### **RÈGLE D'OR : 1 ENVIRONNEMENT = 1 BASE DE DONNÉES**

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

**Plus de :**
- ❌ claudyne_temp.sqlite
- ❌ claudyne_clean.sqlite
- ❌ Multiples bases SQLite sur le serveur

---

## 📋 PLAN D'ACTION IMMÉDIAT

### Étape 1 : Identifier la Base Active (✅ FAIT)

**Résultat** :
```
✅ PRODUCTION utilise : PostgreSQL claudyne_production
   - 44 utilisateurs
   - 8 students
   - 6 subjects
   - 6 lessons

❌ SQLite sur serveur : NE SONT PLUS UTILISÉES
   - claudyne_dev.sqlite (2 users)
   - claudyne_temp.sqlite (1 user)
   - claudyne_clean.sqlite (1 user)
```

### Étape 2 : Sauvegarder Avant Nettoyage

```bash
# Sur le serveur
cd /opt/claudyne/backend
mkdir -p database/archives/$(date +%Y%m%d)

# Sauvegarder toutes les SQLite
cp database/*.sqlite database/archives/$(date +%Y%m%d)/

# Vérifier
ls -lh database/archives/$(date +%Y%m%d)/
```

### Étape 3 : Nettoyer les Bases Inutiles

```bash
# Supprimer les SQLite inutiles
rm database/claudyne_temp.sqlite
rm database/claudyne_clean.sqlite

# Renommer dev.sqlite pour clarté
mv database/claudyne_dev.sqlite database/LEGACY_dev_backup.sqlite
```

**Résultat attendu** :
```
database/
  ├─ LEGACY_dev_backup.sqlite  (archive, ne pas utiliser)
  └─ archives/
      └─ 20251211/
          ├─ claudyne_dev.sqlite
          ├─ claudyne_temp.sqlite
          └─ claudyne_clean.sqlite
```

### Étape 4 : Verrouiller la Configuration

**Fichier `/opt/claudyne/backend/.env`** :
```bash
# === BASE DE DONNÉES PRODUCTION (UNIQUE) ===
# ⚠️ NE PAS MODIFIER - PostgreSQL uniquement en production

NODE_ENV=production

# PostgreSQL Production (SEULE SOURCE DE VÉRITÉ)
DB_TYPE=postgres
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=claudyne_production
DB_USER=claudyne_user
DB_PASSWORD=Lamino12

# ❌ DÉSACTIVÉ : SQLite en production
# DB_STORAGE=./database/claudyne_dev.sqlite
```

**Créer `.env.development` (local uniquement)** :
```bash
# Développement LOCAL (machine développeur)
NODE_ENV=development

DB_TYPE=sqlite
DB_DIALECT=sqlite
DB_STORAGE=./database/dev.db

# Pas de PostgreSQL en dev local
```

### Étape 5 : Modifier `database.js` pour Clarté

**`backend/src/config/database.js`** :

```javascript
const env = process.env.NODE_ENV || 'development';

// ⚠️ RÈGLE : Production = PostgreSQL UNIQUEMENT
if (env === 'production' && process.env.DB_TYPE === 'sqlite') {
  throw new Error('🚨 ERREUR : SQLite n\'est PAS autorisé en production !');
}

const config = {
  production: {
    dialect: 'postgres',  // Forcé, pas de fallback SQLite
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    // Plus de support SQLite en production
  },

  development: {
    dialect: process.env.DB_DIALECT || 'sqlite',
    storage: process.env.DB_STORAGE || './database/dev.db',
    // PostgreSQL optionnel en dev
  }
};
```

### Étape 6 : Documentation Claire

**Créer `DATABASE_POLICY.md`** :

```markdown
# POLITIQUE BASE DE DONNÉES CLAUDYNE

## Règle Absolue

🔴 PRODUCTION = PostgreSQL UNIQUEMENT
🟢 DÉVELOPPEMENT = SQLite (local machine)

## Commandes Interdites en Production

❌ DB_TYPE=sqlite
❌ Créer des fichiers .sqlite sur le serveur
❌ Utiliser plusieurs bases simultanément

## En Cas de Doute

"Quelle base utilise la prod ?"
→ PostgreSQL claudyne_production (TOUJOURS)

"Où sont mes données ?"
→ PostgreSQL sur localhost:5432 (TOUJOURS)

"Puis-je utiliser SQLite en prod ?"
→ NON (JAMAIS)
```

---

## 🎯 RÉSULTAT ATTENDU

### Avant (État Actuel - CONFUS)
```
Serveur Production :
  ❌ 3 fichiers SQLite (512 KB chacun)
  ✅ 1 PostgreSQL production
  ❓ Confusion totale

Total : 4 bases, personne ne sait laquelle est active
```

### Après (État Cible - CLAIR)
```
Serveur Production :
  ✅ 1 seule base : PostgreSQL claudyne_production
  📁 Archives SQLite (backup uniquement)
  🔒 Configuration verrouillée

Total : 1 base active, zéro confusion
```

---

## 🛡️ PRÉVENTION FUTURES CONFUSIONS

### 1. Vérification Automatique au Démarrage

**`backend/src/server.js`** :

```javascript
// Vérification environnement au démarrage
if (process.env.NODE_ENV === 'production') {
  if (process.env.DB_TYPE !== 'postgres' && process.env.DB_DIALECT !== 'postgres') {
    logger.error('🚨 ERREUR FATALE : Production DOIT utiliser PostgreSQL !');
    logger.error(`   DB_TYPE actuel : ${process.env.DB_TYPE}`);
    logger.error(`   DB_DIALECT actuel : ${process.env.DB_DIALECT}`);
    process.exit(1);
  }

  logger.info('✅ Vérification : PostgreSQL en production');
}
```

### 2. Script de Vérification Santé

**`backend/scripts/check-db-config.js`** :

```javascript
#!/usr/bin/env node
const dotenv = require('dotenv');
dotenv.config();

const ENV = process.env.NODE_ENV;
const DB_TYPE = process.env.DB_TYPE || process.env.DB_DIALECT;

console.log('🔍 Vérification Configuration Base de Données\n');
console.log(`Environnement : ${ENV}`);
console.log(`Type DB       : ${DB_TYPE}`);

if (ENV === 'production') {
  if (DB_TYPE !== 'postgres') {
    console.error('\n❌ ERREUR : Production doit utiliser PostgreSQL !');
    process.exit(1);
  }
  console.log('\n✅ Configuration correcte : PostgreSQL en production');
} else {
  console.log('\n✅ Configuration développement OK');
}
```

**Usage** :
```bash
cd /opt/claudyne/backend
node scripts/check-db-config.js
```

### 3. Hook Pre-Deploy

**`.git/hooks/pre-push`** (optionnel) :

```bash
#!/bin/bash
echo "🔍 Vérification configuration DB avant push..."

if grep -q "DB_TYPE=sqlite" backend/.env; then
  echo "❌ ERREUR : .env contient DB_TYPE=sqlite"
  echo "   Production doit utiliser PostgreSQL !"
  exit 1
fi

echo "✅ Configuration DB valide"
```

---

## 📊 MONITORING CONTINU

### Commande de Vérification Rapide

```bash
# Sur le serveur, vérifier quelle DB est active
cat /opt/claudyne/backend/.env | grep -E '^(NODE_ENV|DB_TYPE|DB_DIALECT|DB_NAME)='

# Devrait afficher :
# NODE_ENV=production
# DB_TYPE=postgres
# DB_DIALECT=postgres
# DB_NAME=claudyne_production
```

### Logs à Surveiller

```bash
pm2 logs claudyne-backend | grep -i "database\|postgres\|sqlite"
```

**Bon signe** :
- "PostgreSQL connected"
- "claudyne_production"

**Mauvais signe** :
- "SQLite"
- "claudyne_dev.sqlite"

---

## 🚀 DÉPLOIEMENT DE LA STRATÉGIE

### Timeline Recommandé

**Phase 1 : Sauvegarde (5 min)**
```bash
cd /opt/claudyne/backend
mkdir -p database/archives/$(date +%Y%m%d)
cp database/*.sqlite database/archives/$(date +%Y%m%d)/
```

**Phase 2 : Nettoyage (5 min)**
```bash
rm database/claudyne_temp.sqlite
rm database/claudyne_clean.sqlite
mv database/claudyne_dev.sqlite database/LEGACY_dev_backup.sqlite
```

**Phase 3 : Verrouillage Config (10 min)**
- Modifier `database.js` (ajout vérification)
- Créer `.env.development` (local)
- Ajouter vérification démarrage `server.js`

**Phase 4 : Validation (5 min)**
```bash
node scripts/check-db-config.js
pm2 restart claudyne-backend
pm2 logs claudyne-backend --lines 50
```

**Phase 5 : Documentation (5 min)**
- Créer `DATABASE_POLICY.md`
- Mettre à jour README principal

**TOTAL : ~30 minutes pour simplifier et sécuriser**

---

## ✅ CHECKLIST POST-NETTOYAGE

- [ ] 1 seule base active (PostgreSQL production)
- [ ] Fichiers SQLite archivés
- [ ] Configuration `.env` verrouillée
- [ ] Vérification auto au démarrage
- [ ] Script `check-db-config.js` créé
- [ ] Documentation `DATABASE_POLICY.md` créée
- [ ] Équipe informée du changement
- [ ] Tests "Mes cours" validés

---

## 🎓 FORMATION ÉQUIPE

### Message à communiquer

```
⚠️ CHANGEMENT IMPORTANT : STRATÉGIE BASE DE DONNÉES

À partir d'aujourd'hui :
✅ PRODUCTION = PostgreSQL claudyne_production (UNIQUEMENT)
❌ Plus de fichiers SQLite sur le serveur
📁 Anciennes bases archivées pour historique

Pourquoi ?
- Éliminer confusion
- Accélérer développement
- Réduire erreurs

Questions ?
→ Lire /opt/claudyne/DATABASE_POLICY.md
```

---

## 💡 BONUS : SCRIPT ONE-CLICK

**`backend/scripts/cleanup-databases.sh`** :

```bash
#!/bin/bash
set -e

echo "🗑️  Nettoyage bases de données Claudyne"
echo "========================================"
echo ""

# 1. Sauvegarde
BACKUP_DIR="database/archives/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "📦 Sauvegarde dans $BACKUP_DIR..."
cp database/*.sqlite "$BACKUP_DIR/" 2>/dev/null || true

# 2. Nettoyage
echo "🗑️  Suppression bases inutiles..."
rm -f database/claudyne_temp.sqlite
rm -f database/claudyne_clean.sqlite
mv database/claudyne_dev.sqlite database/LEGACY_dev_backup.sqlite 2>/dev/null || true

# 3. Vérification
echo "✅ Nettoyage terminé !"
echo ""
echo "Bases restantes :"
ls -lh database/*.sqlite 2>/dev/null || echo "  (Aucune base SQLite active - OK !)"
echo ""
echo "Archives :"
ls -lh "$BACKUP_DIR/"
```

**Usage** :
```bash
cd /opt/claudyne/backend
chmod +x scripts/cleanup-databases.sh
./scripts/cleanup-databases.sh
```

---

## 📞 SUPPORT

En cas de problème après nettoyage :

1. **Restaurer backup** :
   ```bash
   cp database/archives/YYYYMMDD/claudyne_dev.sqlite database/
   ```

2. **Vérifier PostgreSQL** :
   ```bash
   sudo -u postgres psql -d claudyne_production -c 'SELECT COUNT(*) FROM users;'
   ```

3. **Logs** :
   ```bash
   pm2 logs claudyne-backend
   ```

---

**💚 Une base, une vérité, zéro confusion - Claudine 💚**
