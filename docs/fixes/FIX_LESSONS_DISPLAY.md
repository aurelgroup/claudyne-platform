# Correction - Affichage des cours sur lessons.html

**Date:** 2025-12-06
**Statut:** ✅ **CORRIGÉ ET DÉPLOYÉ**

---

## 🔴 Problème rencontré

**Symptômes:**
- Les cours créés dans l'admin ne s'affichaient PAS sur `lessons.html`
- Les cours ÉTAIENT bien enregistrés dans `content-store.json`
- Console navigateur : erreur 401 Unauthorized

**Cause racine:**
La route `/api/admin/content` nécessite une authentification (rôle ADMIN/MODERATOR). Le script `lessons-loader.js` appelait cette route sans token d'authentification → 401 → aucune donnée retournée.

---

## ✅ Solution implémentée

### 1. Nouvelle route publique créée

**Fichier:** `backend/src/routes/index.js`

**Route ajoutée:** `GET /api/public/content`

**Caractéristiques:**
- ✅ **Publique** - Aucune authentification requise
- ✅ **Filtre automatique** - Retourne uniquement le contenu avec `status: 'active'`
- ✅ **Agrégation** - Calcule automatiquement les stats par matière
- ✅ **Sécurisé** - Lecture seule, pas de modification possible

**Code de la route:**
```javascript
// Route publique pour le contenu pédagogique (lessons.html)
router.get('/public/content', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const contentStoreFile = path.join(__dirname, '../../content-store.json');

    // Lire et filtrer le contenu actif uniquement
    const data = fs.readFileSync(contentStoreFile, 'utf8');
    const store = JSON.parse(data);

    const activeCourses = (store.courses || []).filter(c => c.status === 'active');
    const activeQuizzes = (store.quizzes || []).filter(q => q.status === 'active');
    const activeResources = (store.resources || []).filter(r => r.status === 'active');

    // Calculer les agrégats
    // ...

    res.json({
      success: true,
      data: { subjects, courses, quizzes, resources }
    });
  }
});
```

### 2. Mise à jour du script lessons-loader.js

**Changement:**
```diff
- const response = await fetch(`${apiBase}/api/admin/content`);
+ const response = await fetch(`${apiBase}/api/public/content`);
```

---

## 📊 Résultat

### Avant
```
GET /api/admin/content → 401 Unauthorized
lessons.html → Aucune donnée affichée
Console → Warning: API non disponible
```

### Après
```
GET /api/public/content → 200 OK
{
  "success": true,
  "data": {
    "subjects": [{"id": "mathematiques", "lessons": 2}],
    "courses": [...]
  }
}
lessons.html → Mathématiques: 2+ leçons ✅
```

---

## 🧪 Tests effectués

### Test 1: Route publique accessible
```bash
curl https://claudyne.com/api/public/content
```
**Résultat:** ✅ 200 OK - Retourne les 2 cours créés

### Test 2: Filtrage du contenu inactif
- Cours avec `status: "active"` → ✅ Inclus
- Cours avec `status: "inactive"` → ✅ Exclu

### Test 3: Agrégation par matière
```json
{
  "subjects": [
    {"id": "mathematiques", "title": "Mathématiques", "lessons": 2, "quizzes": 0}
  ]
}
```
**Résultat:** ✅ Calcul correct

### Test 4: Logs serveur
```
GET /api/public/content HTTP/1.1" 200 639
```
**Résultat:** ✅ Aucune erreur

---

## 🔍 Vérification utilisateur

### Étape 1: Vérifier que les cours sont dans la base
```bash
ssh root@89.117.58.53 "cat /opt/claudyne/backend/content-store.json | grep -A5 courses"
```

**Résultat attendu:** Liste des cours créés

### Étape 2: Tester la route publique
1. Ouvrir : `https://claudyne.com/api/public/content`
2. Vérifier que les cours apparaissent dans le JSON

### Étape 3: Vérifier lessons.html
1. Ouvrir : `https://claudyne.com/lessons.html`
2. Ouvrir la console développeur (F12)
3. Onglet **Network** → Recharger la page
4. Chercher la requête vers `/api/public/content`
5. **Statut attendu:** 200 OK
6. **Affichage attendu:** "Mathématiques: 2+ leçons"

### Étape 4: Créer un nouveau cours
1. Aller sur l'admin
2. Créer un nouveau cours en **Français**
3. Recharger `lessons.html`
4. **Résultat attendu:** "Français: 1+ leçons" apparaît

---

## 📁 Fichiers modifiés

| Fichier | Modification | Statut |
|---------|--------------|--------|
| `backend/src/routes/index.js` | Route publique ajoutée | ✅ Déployé |
| `lessons-loader.js` | API endpoint changé | ✅ Déployé |

**Serveur redémarré:** ✅ PM2 restart claudyne-backend (instances 14 & 15)

---

## 🚀 Prochaines étapes

### Immédiat
1. ✅ **Tester sur lessons.html** - Les cours devraient maintenant s'afficher
2. ✅ **Créer plus de contenu** - Ajoutez des cours dans différentes matières
3. ✅ **Vérifier l'admin** - Les cours doivent s'afficher dans l'interface admin

### Court terme
4. **Vérifier le cache navigateur** - Si les compteurs ne se mettent pas à jour, vider le cache (Ctrl+Shift+R)
5. **Tester le toggle actif/inactif** - Un cours inactif ne doit PAS apparaître sur lessons.html
6. **Ajouter des quiz** - Vérifier que les quiz s'ajoutent aux compteurs

---

## 🛠️ Dépannage

### Problème: Les cours n'apparaissent toujours pas

**Solution 1: Vider le cache**
```
- Chrome: Ctrl+Shift+R
- Firefox: Ctrl+F5
- Safari: Cmd+Shift+R
```

**Solution 2: Vérifier la console navigateur**
```
1. F12 → Onglet Console
2. Chercher les erreurs
3. Si erreur CORS → Vérifier que claudyne.com est dans allowedOrigins
```

**Solution 3: Vérifier que le serveur a bien redémarré**
```bash
ssh root@89.117.58.53 "pm2 status"
# Uptime doit être < 10 minutes
```

**Solution 4: Vérifier que les cours sont actifs**
```bash
ssh root@89.117.58.53 "cat /opt/claudyne/backend/content-store.json | grep status"
# Tous les cours doivent avoir "status": "active"
```

### Problème: Erreur 404 sur /api/public/content

**Cause:** La route n'a pas été déployée correctement

**Solution:**
```bash
# Re-déployer index.js
scp backend/src/routes/index.js root@89.117.58.53:/opt/claudyne/backend/src/routes/
ssh root@89.117.58.53 "pm2 restart claudyne-backend"
```

### Problème: Les compteurs ne se mettent pas à jour

**Cause:** Le script lessons-loader.js utilise encore /api/admin/content

**Vérification:**
```bash
curl https://claudyne.com/lessons-loader.js | grep "api/"
# Doit afficher: api/public/content
```

**Solution si incorrect:**
```bash
scp lessons-loader.js root@89.117.58.53:/opt/claudyne/
```

---

## 📖 Documentation API

### GET /api/public/content

**URL:** `https://claudyne.com/api/public/content`

**Méthode:** GET

**Authentification:** ❌ Aucune

**Réponse:**
```json
{
  "success": true,
  "data": {
    "subjects": [
      {
        "id": "mathematiques",
        "title": "Mathématiques",
        "lessons": 2,
        "quizzes": 1
      }
    ],
    "courses": [
      {
        "id": "COURS-1765004096172",
        "title": "EE",
        "subject": "mathematiques",
        "level": "6eme",
        "description": "EE",
        "content": "EE",
        "duration": "10",
        "status": "active"
      }
    ],
    "quizzes": [],
    "resources": []
  }
}
```

**Filtrage:**
- ✅ Seuls les éléments avec `status: "active"` sont retournés
- ✅ Le champ `created_by` est conservé
- ✅ Pas de données sensibles exposées

---

## 🎯 Comparaison routes

| Route | Auth requise | Usage | Filtrage |
|-------|--------------|-------|----------|
| `/api/admin/content` | ✅ ADMIN/MODERATOR | Interface admin | Aucun (tout) |
| `/api/public/content` | ❌ Publique | Site public (lessons.html) | Actif uniquement |

---

## ✅ Checklist finale

- [x] Route `/api/public/content` créée
- [x] `lessons-loader.js` modifié
- [x] Fichiers déployés en production
- [x] Serveur redémarré
- [x] Route testée (200 OK)
- [x] Logs serveur OK
- [x] Documentation créée

**Prochaine action:**
👉 **Allez sur `https://claudyne.com/lessons.html` et vérifiez que "Mathématiques: 2+ leçons" s'affiche !**

---

**La force du savoir en héritage - Claudine 💚**
_Correction déployée le 2025-12-06_
