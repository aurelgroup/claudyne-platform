# 📚 Migration des Cours vers la Base de Données - Statut

**Date:** 2025-12-10 03:20
**Objectif:** Migrer les cours du fichier JSON vers la base de données SQLite pour qu'ils s'affichent dans l'interface étudiante

---

## ✅ Tâches Complétées

### 1. Analyse de la Structure
- ✅ Identifié que les cours sont stockés dans `content-store.json`
- ✅ Identifié que l'interface étudiante charge depuis la table `subjects` de la BDD
- ✅ Mappé les champs JSON vers les champs BDD:
  - `level: "terminale"` → `level: "Tle"`
  - `subject: "mathematiques"` → `category: "Mathématiques"`

### 2. Script de Migration
- ✅ Créé `backend/scripts/migrate-courses-to-db.js`
- ✅ Gère le mapping automatique des niveaux et matières
- ✅ Utilise SQLite directement (DB actuelle du système)
- ✅ Créé avec gestion d'erreurs et logs détaillés

### 3. Exécution de la Migration
- ✅ **6 Subjects créés dans la base de données**:
  - **3 cours Terminale (Tle)**:
    1. EE (Mathématiques)
    2. PHYSIQUES TLE (Sciences)
    3. TEST 3 (Sciences)
  - **3 cours 6ème**:
    1. TEST (Mathématiques)
    2. test (Mathématiques)
    3. TEST 6 (Mathématiques)

- ✅ Tous les Subjects sont actifs (`isActive=1`)
- ✅ Backend redémarré pour charger les nouvelles données

### 4. Données Migrées

```sql
-- Subjects dans la BDD
SELECT id, title, level, category, isActive FROM subjects;

mathematiques-tle-1765353425564    | EE             | Tle  | Mathématiques | 1
physique-tle-1765353425606         | PHYSIQUES TLE  | Tle  | Sciences      | 1
mathematiques-6ème-1765353425618   | TEST           | 6ème | Mathématiques | 1
mathematiques-6ème-1765353425628   | test           | 6ème | Mathématiques | 1
physique-tle-1765353425638         | TEST 3         | Tle  | Sciences      | 1
mathematiques-6ème-1765353425648   | TEST 6         | 6ème | Mathématiques | 1
```

---

## ⚠️ Problèmes Identifiés

### 1. Aucune Lesson Créée
- ❌ 0 Lessons dans la base (erreur "SQLITE_MISMATCH: datatype mismatch")
- 💡 **Impact:** Les cours s'affichent mais avec `totalLessons=0`
- 💡 **Cause probable:** Champ JSONB non compatible avec SQLite

### 2. Interface Admin Utilise Toujours le JSON
- ⚠️ L'admin crée/modifie des cours dans `content-store.json`
- ⚠️ Pas de synchronisation entre JSON et BDD
- 💡 **Requis:** Modifier l'admin pour utiliser la BDD

---

## 🎯 Prochaines Étapes

### Étape 1: Tester l'Affichage dans l'Interface Étudiante
**Action:** Vous devez tester si les cours s'affichent maintenant sur https://www.claudyne.com

**Comment tester:**
1. Vider le cache navigateur (CTRL+MAJ+R)
2. Se connecter avec un compte étudiant de niveau Terminale
3. Aller dans la section "Matières"
4. Vérifier si les 3 cours Terminale s'affichent:
   - EE (Mathématiques)
   - PHYSIQUES TLE (Sciences)
   - TEST 3 (Sciences)

### Étape 2: Corriger le Problème des Lessons (si nécessaire)
Si les cours ne s'affichent pas à cause de `totalLessons=0`, options:

**Option A - Créer des Lessons manuellement:**
```sql
INSERT INTO lessons (id, subjectId, title, content, type, duration, difficulty, order, isActive, isPremium)
VALUES
  ('lesson-tle-math-1', 'mathematiques-tle-1765353425564', 'EE - Leçon 1', 'Contenu du cours EE', 'theory', 45, 'Intermédiaire', 1, 1, 0),
  ('lesson-tle-phys-1', 'physique-tle-1765353425606', 'Physique TLE - Leçon 1', 'Contenu du cours physique', 'theory', 45, 'Intermédiaire', 1, 1, 0),
  ('lesson-tle-phys-2', 'physique-tle-1765353425638', 'TEST 3 - Leçon 1', 'Contenu du TEST 3', 'theory', 45, 'Intermédiaire', 1, 1, 0);
```

**Option B - Modifier la route pour accepter totalLessons=0:**
- Afficher les Subjects même sans Lessons
- Permettre aux étudiants de les voir comme "Bientôt disponible"

### Étape 3: Migrer l'Interface Admin vers la BDD
**Fichiers à modifier:**
1. `admin-interface.html` - Section Gestion de Contenu
2. `backend/src/routes/contentManagement.js` - API admin

**Changements requis:**
- Remplacer lecture/écriture JSON par requêtes SQL
- Créer Subject ET Lesson lors de la création d'un cours
- Synchroniser avec la structure actuelle

---

## 📊 État Actuel du Système

### Base de Données (SQLite)
```
📂 /opt/claudyne/backend/database/claudyne_dev.sqlite
  📋 Table: subjects (6 entrées)
  📋 Table: lessons (0 entrées)
```

### Fichier JSON (obsolète pour lecture, encore utilisé par admin)
```
📂 /opt/claudyne/backend/content-store.json
  {
    "subjects": [2 entrées],
    "courses": [6 entrées],
    "quizzes": [0 entrées]
  }
```

### API Backend
- ✅ `/api/students/subjects` - Lit depuis la BDD ✅
- ⚠️ `/api/admin/content` - Lit/écrit dans le JSON ⚠️

### Interfaces
- ✅ **Interface Étudiante:** Utilise la BDD (via `/api/students/subjects`)
- ⚠️ **Interface Admin:** Utilise le JSON (via `/api/admin/content`)

---

## 🔧 Commandes Utiles

### Vérifier les Subjects dans la BDD
```bash
ssh root@89.117.58.53 "cd /opt/claudyne/backend && sqlite3 database/claudyne_dev.sqlite 'SELECT id, title, level, category, isActive FROM subjects;'"
```

### Vérifier les Lessons dans la BDD
```bash
ssh root@89.117.58.53 "cd /opt/claudyne/backend && sqlite3 database/claudyne_dev.sqlite 'SELECT id, subjectId, title FROM lessons;'"
```

### Relancer la Migration
```bash
ssh root@89.117.58.53 "cd /opt/claudyne/backend && node scripts/migrate-courses-to-db.js"
```

### Redémarrer le Backend
```bash
ssh root@89.117.58.53 "pm2 restart claudyne-backend"
```

---

## 📝 Notes Techniques

### Mapping Niveaux
| JSON (`level`)    | BDD (`level`) |
|-------------------|---------------|
| `"terminale"`     | `"Tle"`       |
| `"6eme"`          | `"6ème"`      |
| `"5eme"`          | `"5ème"`      |
| `"4eme"`          | `"4ème"`      |
| `"3eme"`          | `"3ème"`      |
| `"2nde"`          | `"2nde"`      |
| `"1ere"`          | `"1ère"`      |

### Mapping Matières
| JSON (`subject`)  | BDD (`category`)      |
|-------------------|-----------------------|
| `"mathematiques"` | `"Mathématiques"`     |
| `"physique"`      | `"Sciences"`          |
| `"chimie"`        | `"Sciences"`          |
| `"francais"`      | `"Français"`          |
| `"anglais"`       | `"Langues"`           |

---

## ✅ Solution Définitive Recommandée

Pour éviter tout conflit futur entre JSON et BDD:

1. ✅ **Migration complète vers BDD** (fait partiellement)
2. ⚠️ **Modifier l'interface admin** (à faire)
3. 🗑️ **Deprecate content-store.json** (après migration admin)
4. 📝 **Documentation pour création de cours** (après migration admin)

---

**Prochaine action:** Testez l'affichage dans l'interface étudiante et rapportez le résultat !
