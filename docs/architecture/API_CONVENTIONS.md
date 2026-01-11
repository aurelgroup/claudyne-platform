# Conventions API Claudyne

**Version**: 1.0
**Date**: 17 Décembre 2024
**Status**: ✅ APPLIQUÉ EN PRODUCTION

---

## 📋 Table des Matières

1. [Structure des Réponses](#structure-des-réponses)
2. [Endpoints Collections vs Single](#endpoints-collections-vs-single)
3. [Codes de Statut HTTP](#codes-de-statut-http)
4. [Gestion des Erreurs](#gestion-des-erreurs)
5. [Authentication](#authentication)
6. [Pagination](#pagination)
7. [Exemples Complets](#exemples-complets)
8. [Tests de Contrat](#tests-de-contrat)

---

## Structure des Réponses

### Règle #1: Toujours retourner `{ success: boolean }`

**TOUS** les endpoints doivent retourner un objet JSON avec au minimum:

```javascript
{
  "success": true | false
}
```

### Règle #2: En cas de succès, inclure `data`

```javascript
{
  "success": true,
  "data": <contenu>
}
```

### Règle #3: En cas d'erreur, inclure `message`

```javascript
{
  "success": false,
  "message": "Description de l'erreur",
  "code": "ERROR_CODE" // optionnel
}
```

---

## Endpoints Collections vs Single

### GET Collection → Retourne un TABLEAU

**Pattern**: `GET /api/resource` ou `GET /api/resource/:category`

**Format**:
```javascript
{
  "success": true,
  "data": [...]  // ← TOUJOURS un tableau, même vide
}
```

**Exemples**:
- `GET /api/admin/content/courses` → `{ success: true, data: [...] }`
- `GET /api/admin/content/quizzes` → `{ success: true, data: [] }`
- `GET /api/students/subjects` → `{ success: true, data: [...] }`

**❌ INTERDIT**:
```javascript
// NE PAS FAIRE:
{ success: true, data: { courses: [...] } }  // ← data est un objet!
```

### GET Single Item → Retourne un OBJET

**Pattern**: `GET /api/resource/:id`

**Format**:
```javascript
{
  "success": true,
  "data": {...}  // ← TOUJOURS un objet
}
```

**Exemples**:
- `GET /api/students/profile` → `{ success: true, data: {...} }`
- `GET /api/subjects/123` → `{ success: true, data: {...} }`

### GET Aggregated Data → Retourne un OBJET avec plusieurs propriétés

**Pattern**: `GET /api/resource` (vue globale/dashboard)

**Format**:
```javascript
{
  "success": true,
  "data": {
    "property1": [...],
    "property2": [...],
    "stats": {...}
  }
}
```

**Exemples**:
- `GET /api/admin/content` →
  ```json
  {
    "success": true,
    "data": {
      "subjects": [...],
      "courses": [],
      "quizzes": [],
      "stats": {...}
    }
  }
  ```
- `GET /api/public/content` →
  ```json
  {
    "success": true,
    "data": {
      "courses": [...],
      "quizzes": [...],
      "resources": [...]
    }
  }
  ```

---

## Codes de Statut HTTP

### Succès (2xx)

| Code | Utilisation | Exemple |
|------|-------------|---------|
| 200 | OK - Succès standard | GET, PUT, DELETE réussis |
| 201 | Created - Ressource créée | POST /auth/register |
| 204 | No Content - Succès sans contenu | DELETE réussi sans body |

### Erreurs Client (4xx)

| Code | Utilisation | Exemple |
|------|-------------|---------|
| 400 | Bad Request - Données invalides | Validation échouée |
| 401 | Unauthorized - Token manquant/invalide | Pas de token ou expiré |
| 403 | Forbidden - Permissions insuffisantes | User essaie d'accéder à admin |
| 404 | Not Found - Ressource introuvable | GET /resource/999999 |
| 409 | Conflict - Conflit de données | Email déjà utilisé |
| 422 | Unprocessable Entity - Validation | Données structurées mais invalides |
| 423 | Locked - Compte verrouillé | Trop de tentatives de login |

### Erreurs Serveur (5xx)

| Code | Utilisation | Exemple |
|------|-------------|---------|
| 500 | Internal Server Error | Erreur non gérée |
| 501 | Not Implemented | Feature pas encore implémentée |
| 503 | Service Unavailable | DB déconnectée |

---

## Gestion des Erreurs

### Format Standard

```javascript
{
  "success": false,
  "message": "Message d'erreur lisible par l'utilisateur",
  "code": "ERROR_CODE",           // optionnel, pour le frontend
  "error": "Détails techniques",   // optionnel, en dev uniquement
  "errors": [                      // optionnel, pour validation
    {
      "field": "email",
      "message": "Email invalide"
    }
  ]
}
```

### Exemples par Cas

#### 1. Validation échouée (400)
```javascript
{
  "success": false,
  "message": "Données de formulaire invalides",
  "code": "VALIDATION_ERROR",
  "errors": [
    { "field": "email", "message": "Email requis" },
    { "field": "password", "message": "Mot de passe trop court" }
  ]
}
```

#### 2. Token invalide (401)
```javascript
{
  "success": false,
  "message": "Token invalide ou expiré",
  "code": "INVALID_TOKEN"
}
```

#### 3. Permissions insuffisantes (403)
```javascript
{
  "success": false,
  "message": "Accès non autorisé",
  "code": "INSUFFICIENT_PERMISSIONS",
  "required": ["ADMIN"],
  "current": "STUDENT"
}
```

#### 4. Ressource introuvable (404)
```javascript
{
  "success": false,
  "message": "Cours non trouvé",
  "code": "RESOURCE_NOT_FOUND"
}
```

#### 5. Erreur serveur (500)
```javascript
{
  "success": false,
  "message": "Erreur interne du serveur",
  "code": "INTERNAL_ERROR",
  "error": "TypeError: Cannot read property 'map' of undefined"  // dev only
}
```

---

## Authentication

### Types de Tokens

#### 1. JWT Token (Utilisateurs)
**Format**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

**Header**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Génération**: POST `/api/auth/login` ou `/api/auth/register`

**Durée**: 7 jours (configurable)

#### 2. Admin Token (Temporaire)
**Format**: `admin-{timestamp}-{random}`

**Exemple**: `admin-1766003574166-n3e4a7aux`

**Header**:
```
Authorization: Bearer admin-1766003574166-n3e4a7aux
```

**Génération**: POST `/api/admin/generate-token`

**Durée**: 1 heure

### Endpoints Publics (sans auth)

- `GET /api/health`
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/public/content`
- `GET /api/payments/plans`

### Endpoints Authentifiés

**Tous les autres endpoints** nécessitent un token valide.

**Réponse si token manquant/invalide**:
```javascript
// 401 Unauthorized
{
  "success": false,
  "message": "Token d'authentification manquant",
  "code": "NO_TOKEN"
}
```

---

## Pagination

### Paramètres de Query

```
GET /api/resource?page=1&limit=20&sortBy=createdAt&order=desc
```

| Paramètre | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Numéro de page (commence à 1) |
| limit | number | 20 | Nombre d'items par page |
| sortBy | string | 'createdAt' | Champ de tri |
| order | 'asc' \| 'desc' | 'desc' | Ordre de tri |

### Format de Réponse

```javascript
{
  "success": true,
  "data": [...],  // Items de la page actuelle
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**Note**: Actuellement, la pagination n'est pas implémentée partout. À ajouter progressivement.

---

## Exemples Complets

### 1. Créer un Cours (Admin)

**Requête**:
```http
POST /api/admin/courses
Authorization: Bearer admin-xxx
Content-Type: application/json

{
  "title": "Algèbre 6ème",
  "subject": "mathematiques",
  "level": "6eme",
  "description": "Introduction à l'algèbre",
  "content": "Contenu du cours...",
  "duration": 45
}
```

**Réponse Success (201)**:
```json
{
  "success": true,
  "message": "Cours créé avec succès",
  "data": {
    "course": {
      "id": "COURS-f66b500d-...",
      "title": "Algèbre 6ème",
      "subject": "mathematiques",
      "level": "6eme",
      "created_at": "2025-12-17T20:00:00.000Z"
    }
  }
}
```

**Réponse Erreur (400)**:
```json
{
  "success": false,
  "message": "Données invalides",
  "code": "VALIDATION_ERROR",
  "errors": [
    { "field": "title", "message": "Le titre est requis" }
  ]
}
```

### 2. Récupérer les Subjects d'un Étudiant

**Requête**:
```http
GET /api/students/subjects
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Réponse (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "355cf8cf-da06-429d-81f1-bd8ab1ecd8ba",
      "title": "Mathématiques",
      "category": "Mathématiques",
      "icon": "📐",
      "color": "#3498db",
      "progress": 45,
      "score": 78,
      "totalLessons": 12,
      "completedLessons": 5
    }
  ]
}
```

**Note**: Le tableau est filtré automatiquement selon le `educationLevel` de l'étudiant.

### 3. Login

**Requête**:
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "MyPassword123!"
}
```

**Réponse Success (200)**:
```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "user": {
      "id": "...",
      "email": "student@example.com",
      "role": "STUDENT",
      "firstName": "John",
      "lastName": "Doe"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": "7d"
    }
  }
}
```

**Réponse Erreur (401)**:
```json
{
  "success": false,
  "message": "Email ou mot de passe incorrect",
  "code": "INVALID_CREDENTIALS"
}
```

---

## Tests de Contrat

### Script de Test Automatisé

Un script `test-api-contracts.sh` vérifie automatiquement que tous les endpoints respectent ces conventions.

**Utilisation**:
```bash
# Tester tous les contrats
bash test-api-contracts.sh

# Ou l'intégrer dans le déploiement
bash deploy.sh backend && bash test-api-contracts.sh
```

**Le script vérifie**:
- ✅ Tous les endpoints retournent `{ success: boolean }`
- ✅ GET collection → `data: []`
- ✅ GET single → `data: {}`
- ✅ Status HTTP corrects
- ✅ Authentication fonctionne
- ✅ Erreurs formatées correctement

### Tests Manuels Rapides

```bash
# Health check
curl https://claudyne.com/api/health

# Endpoint collection (doit retourner un tableau)
curl https://claudyne.com/api/public/content | grep '"courses":\['

# Endpoint avec auth (doit retourner 401)
curl https://claudyne.com/api/students/profile
```

---

## Checklist pour Nouveaux Endpoints

Avant de déployer un nouvel endpoint, vérifier:

- [ ] Retourne `{ success: boolean }` dans tous les cas
- [ ] GET collection retourne `data: []` (tableau)
- [ ] GET single retourne `data: {}` (objet)
- [ ] Codes HTTP appropriés (200, 201, 400, 401, etc.)
- [ ] Erreurs formatées avec `message` et `code`
- [ ] Documentation ajoutée dans ce fichier
- [ ] Test ajouté dans `test-api-contracts.sh`
- [ ] Testé manuellement
- [ ] Testé avec le script de contrat

---

## Migration d'Endpoints Existants

Si vous trouvez un endpoint qui ne respecte pas ces conventions:

### Étape 1: Identifier le problème
```bash
# Exemple: endpoint retourne { data: { courses: [...] } }
curl https://claudyne.com/api/admin/content/courses
```

### Étape 2: Corriger le backend
```javascript
// AVANT
return res.json({
  success: true,
  data: { courses }  // ❌ Objet
});

// APRÈS
return res.json({
  success: true,
  data: courses  // ✅ Tableau direct
});
```

### Étape 3: Vérifier le frontend
```javascript
// Frontend doit maintenant utiliser:
const courses = response.data;  // au lieu de response.data.courses
```

### Étape 4: Tester
```bash
bash test-api-contracts.sh
```

### Étape 5: Déployer
```bash
bash deploy.sh backend
```

---

## Aide-Mémoire Rapide

```
✅ Toujours:
  { success: true/false }

✅ Collection:
  GET /items → { success: true, data: [] }

✅ Single:
  GET /item/:id → { success: true, data: {} }

✅ Agrégé:
  GET /dashboard → { success: true, data: { prop1: [], prop2: [] } }

✅ Erreur:
  { success: false, message: "...", code: "..." }

✅ HTTP Status:
  200: OK
  201: Created
  400: Bad Request
  401: Unauthorized
  403: Forbidden
  404: Not Found
  500: Server Error
```

---

**Dernière mise à jour**: 17 Décembre 2024
**Maintenu par**: Équipe Claudyne
**Contact**: Pour questions, voir le code ou demander à Claude
