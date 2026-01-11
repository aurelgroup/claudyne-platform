# 🔧 HARMONISATION DES ENDPOINTS API - CLAUDYNE

## 📊 État Actuel

### ✅ Serveur Principal ACTIF
- **shared/api/simple-api.js** (156 lignes) - Port 3001
- Serveur compact et fonctionnel avec tous les endpoints essentiels
- Géré par PM2 sous le nom: `claudyne-api-new`

### 📚 Endpoints Disponibles
- `GET /api` - Information API de base
- `POST /api/auth/login` - Authentification utilisateur
- `GET /api/user/profile` - Profil utilisateur
- `GET /api/admin/pricing-plans` - ✅ **Récupérer plans tarifaires**
- `POST /api/admin/pricing-plans/create` - ✅ **Créer nouveau plan**
- `PUT /api/admin/pricing-plans/:id` - ✅ **Modifier plan existant**
- `DELETE /api/admin/pricing-plans/:id` - ✅ **Supprimer plan**

### 🗂️ Serveurs Redondants (À Archiver)
1. **shared/api/unified-api.js** (418 lignes) - Plus complexe mais non utilisé
2. **backend/minimal-server.js** (2698 lignes) - Très volumineux, non utilisé
3. **backend/server-simple.js** (249 lignes) - Version alternative

## ✅ Tests Réalisés

### Endpoints Admin - Tous Fonctionnels ✅
- `GET https://claudyne.com/api/admin/pricing-plans` ✅
- `POST https://claudyne.com/api/admin/pricing-plans/create` ✅
- `PUT https://claudyne.com/api/admin/pricing-plans/1` ✅
- `DELETE https://claudyne.com/api/admin/pricing-plans/1` ✅

### Interface Admin Accessible ✅
- URL: https://claudyne.com/admin-secure-k7m9x4n2p8w5z1c6
- Les endpoints sont maintenant compatibles avec l'interface admin

## 🎯 Recommandations

1. **Conserver simple-api.js** comme serveur unique
2. **Déplacer** les autres serveurs vers un dossier `backup/`
3. **Mettre à jour PM2** pour pointer uniquement vers simple-api.js
4. **Documenter** l'architecture finale dans le README

## 🔧 Maintenance

- Serveur principal: `shared/api/simple-api.js`
- PM2 Process: `claudyne-api-new`
- Port: 3001
- Proxy Nginx: `/api/` → `http://localhost:3001`

## 🚀 Formules Tarifaires Configurées

### Plan Découverte (DISCOVERY)
- Prix: 0 FCFA (7 jours gratuits)
- 1 élève maximum
- Fonctionnalités: Accès à 3 matières, exercices de base

### Plan Individuelle (INDIVIDUAL)
- Prix: 8,000 FCFA/mois
- 1 élève
- Fonctionnalités: Accès illimité, IA personnalisée

### Plan Familiale (FAMILY) ⭐ POPULAIRE
- Prix: 15,000 FCFA/mois (au lieu de 24,000 FCFA)
- Jusqu'à 3 enfants
- Fonctionnalités: Accès illimité, IA + Dashboard parents

Date de l'harmonisation: 29 septembre 2025