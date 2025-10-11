# 🔍 AUDIT COMPLET CLAUDYNE - 10 Octobre 2025

## 📋 RÉSUMÉ EXÉCUTIF

Après 1 mois de développement, voici les problèmes identifiés et leurs solutions pour mettre en production un système fonctionnel avec :
- ✅ Création de comptes utilisateurs réels
- ✅ Interfaces adaptées par rôle
- ✅ Connexion/reconnexion fiable
- ✅ Interface admin synchronisée
- ✅ Liste complète des comptes

---

## 🚨 PROBLÈMES CRITIQUES IDENTIFIÉS

### 1. **MOCK DATA DANS L'INTERFACE PARENT** ⚠️⚠️⚠️
**Fichier**: `parent-interface/js/shared/mock-data.js` (474 lignes)

**Problème**:
- L'interface parent utilise des données de test (Richy, Blandine, etc.)
- Les utilisateurs réels voient des données fictives au lieu de leurs vraies données
- Données mockées: dashboard, enfants, planning, messages, psychologie, rapports, finance, communauté

**Impact**: 🔴 **CRITIQUE**
- Les parents ne voient PAS les données de leurs propres enfants
- Impossible de suivre les vrais progrès
- Expérience utilisateur complètement cassée

**Solution**:
```javascript
// Au lieu d'utiliser mockData directement
import { mockData } from './mock-data.js';

// Utiliser un système qui préfère les données API
async function getData(endpoint, fallbackMockPath = null) {
    try {
        const token = localStorage.getItem('claudyne_token');
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.error('API error, using fallback:', error);
    }

    // Fallback vers mock data uniquement si API échoue
    if (fallbackMockPath && process.env.NODE_ENV === 'development') {
        return getMockData(fallbackMockPath);
    }

    return null;
}
```

---

### 2. **SYSTÈME DE RECONNEXION DÉFAILLANT** ⚠️⚠️

**Fichiers affectés**: `index.html` (lignes 2768-2883)

**Problème**:
- La reconnexion dépend uniquement du localStorage
- Pas de vérification de la validité du token
- Pas de refresh automatique du token expiré
- Données utilisateur peuvent être corrompues ou périmées

**Impact**: 🔴 **CRITIQUE**
- Les utilisateurs doivent se reconnecter constamment
- Perte de session aléatoire
- Frustration utilisateur

**Solution**:
```javascript
// Système de reconnexion automatique robuste
async function autoReconnect() {
    const token = localStorage.getItem('claudyne_token');
    const refreshToken = localStorage.getItem('claudyne_refresh_token');

    if (!token) {
        return false; // Pas de token = pas connecté
    }

    // 1. Vérifier si le token est encore valide
    try {
        const response = await fetch(`${API_BASE}/api/auth/verify`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            // Token valide, récupérer les données utilisateur fraîches
            return await refreshUserData();
        }
    } catch (error) {
        console.log('Token invalide, tentative de refresh...');
    }

    // 2. Token invalide, essayer de le rafraîchir
    if (refreshToken) {
        try {
            const response = await fetch(`${API_BASE}/api/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken })
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('claudyne_token', data.data.accessToken);
                return await refreshUserData();
            }
        } catch (error) {
            console.error('Refresh token failed:', error);
        }
    }

    // 3. Impossible de se reconnecter, nettoyer le localStorage
    clearAuth();
    return false;
}

async function refreshUserData() {
    const token = localStorage.getItem('claudyne_token');

    // Récupérer les données utilisateur fraîches
    const userResponse = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (userResponse.ok) {
        const userData = await userResponse.json();
        localStorage.setItem('claudyne_user', JSON.stringify(userData.data.user));

        if (userData.data.family) {
            localStorage.setItem('claudyne_family', JSON.stringify(userData.data.family));
        }

        return true;
    }

    return false;
}

function clearAuth() {
    localStorage.removeItem('claudyne_token');
    localStorage.removeItem('claudyne_refresh_token');
    localStorage.removeItem('claudyne_user');
    localStorage.removeItem('claudyne_family');
}

// Au chargement de la page
document.addEventListener('DOMContentLoaded', async () => {
    const reconnected = await autoReconnect();

    if (reconnected) {
        // Rediriger vers l'interface appropriée
        redirectToInterface();
    } else {
        // Afficher le formulaire de connexion
        showLoginModal();
    }
});
```

---

### 3. **MULTIPLES SERVEURS EN PRODUCTION** ⚠️⚠️

**État actuel sur le serveur**:
```bash
root      647499  node /opt/claudyne/backend/src/jobs/subscriptionCron.js
root      647908  node /opt/claudyne/backend/src/server.js
root      647916  node /opt/claudyne/backend/src/server.js
root      647928  node /opt/claudyne/server.js
root      647940  node /opt/claudyne/server.js
```

**Problème**:
- 4 processus Node.js tournent en parallèle
- 2x `backend/src/server.js` (port 3001)
- 2x `server.js` (root)
- Potentiel conflit de ports et confusion sur quel serveur répond

**Impact**: 🟡 **MAJEUR**
- Réponses incohérentes selon le serveur qui répond
- Gaspillage de ressources
- Difficulté à déboguer

**Solution**:
```bash
# 1. Arrêter tous les processus
pm2 stop all
pm2 delete all

# 2. Ne garder QUE le serveur principal backend
pm2 start /opt/claudyne/backend/src/server.js --name claudyne-api --instances 1

# 3. Garder le cron job séparément
pm2 start /opt/claudyne/backend/src/jobs/subscriptionCron.js --name claudyne-cron --instances 1

# 4. Sauvegarder la configuration
pm2 save

# 5. Vérifier
pm2 list
```

---

### 4. **INTERFACE ADMIN DÉSYNCHRONISÉE** ⚠️

**Fichier**: `admin-interface.html`
- **Local**: 580 KB (3356 lignes)
- **Serveur**: 569 KB (11698 lignes)

**Problème**:
- L'interface admin déployée n'est PAS la même que celle locale
- Différence de ~11 KB et ~8000 lignes

**Impact**: 🟡 **MAJEUR**
- Fonctionnalités admin manquantes ou différentes en production
- Impossibilité de gérer correctement les comptes

**Solution**:
```bash
# Copier la version locale sur le serveur
scp admin-interface.html root@89.117.58.53:/opt/claudyne/

# Vérifier
ssh root@89.117.58.53 "ls -lh /opt/claudyne/admin-interface.html"
```

---

### 5. **LISTE DES COMPTES INCOMPLÈTE DANS L'ADMIN** ⚠️

**Fichier**: `backend/src/routes/admin.js` (lignes 172-250)

**Analyse**:
✅ Le backend a la route `/api/admin/users` qui liste TOUS les comptes
✅ Inclut: email, rôle, date création, dernier login, famille, abonnement

**Problème potentiel**:
- La route est correcte MAIS peut ne pas être appelée correctement par l'interface
- Besoin de vérifier si l'interface admin appelle cette route avec le bon token

**Solution à implémenter**:
```javascript
// Dans admin-interface.html
async function loadAllUsers() {
    const adminToken = localStorage.getItem('claudyne_admin_token');

    if (!adminToken) {
        alert('Session admin expirée');
        window.location.href = '/';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/admin/users?limit=100`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
            displayUsers(data.data.users);
            displayPagination(data.data.pagination);
        } else {
            console.error('API error:', data.message);
        }

    } catch (error) {
        console.error('Failed to load users:', error);
        alert('Erreur lors du chargement des utilisateurs');
    }
}

function displayUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';

    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.email || user.phone || 'N/A'}</td>
            <td>${user.firstName} ${user.lastName}</td>
            <td><span class="badge badge-${user.status}">${user.status}</span></td>
            <td>${user.familyName || 'Individuel'}</td>
            <td>${new Date(user.registrationDate).toLocaleDateString('fr-FR')}</td>
            <td>${user.lastActivity ? new Date(user.lastActivity).toLocaleDateString('fr-FR') : 'Jamais'}</td>
            <td>
                <button onclick="viewUser('${user.id}')" class="btn btn-sm btn-info">
                    <i class="fas fa-eye"></i>
                </button>
                <button onclick="editUser('${user.id}')" class="btn btn-sm btn-warning">
                    <i class="fas fa-edit"></i>
                </button>
                ${user.status === 'active' ?
                    `<button onclick="disableUser('${user.id}')" class="btn btn-sm btn-danger">
                        <i class="fas fa-ban"></i>
                    </button>` :
                    `<button onclick="enableUser('${user.id}')" class="btn btn-sm btn-success">
                        <i class="fas fa-check"></i>
                    </button>`
                }
            </td>
        `;
        tbody.appendChild(row);
    });
}
```

---

### 6. **PAS DE ROUTE `/api/auth/me` POUR VÉRIFIER LE TOKEN** ⚠️

**Problème**:
- Le système de reconnexion a besoin d'une route pour vérifier si le token est encore valide
- Actuellement, cette route n'existe pas dans `backend/src/routes/auth.js`

**Solution à ajouter**:
```javascript
// Dans backend/src/routes/auth.js

/**
 * GET /api/auth/me
 * Récupération des informations de l'utilisateur connecté
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    initializeModels();

    const { User, Family, Student } = req.models;

    // req.user est défini par le middleware authenticate
    const user = await User.findByPk(req.user.userId, {
      include: [
        {
          model: Family,
          as: 'family',
          include: [{
            model: Student,
            as: 'students',
            where: { isActive: true },
            required: false
          }]
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Réponse avec les données utilisateur
    res.json({
      success: true,
      data: {
        user: user.toSafeJSON(),
        family: user.family ? {
          id: user.family.id,
          name: user.family.name,
          displayName: user.family.displayName,
          status: user.family.status,
          subscriptionType: user.family.subscriptionType,
          walletBalance: user.family.walletBalance,
          totalClaudinePoints: user.family.totalClaudinePoints,
          students: user.family.students
        } : null
      }
    });

  } catch (error) {
    logger.error('Erreur récupération profil utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * GET /api/auth/verify
 * Vérification de la validité du token
 */
router.get('/verify', authenticate, async (req, res) => {
  res.json({
    success: true,
    message: 'Token valide',
    data: {
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role
    }
  });
});
```

---

## ✅ POINTS POSITIFS (Ce qui fonctionne déjà)

1. **Système d'authentification backend** ✅
   - Routes `/api/auth/register` et `/api/auth/login` fonctionnelles
   - Création de comptes PARENT, STUDENT, TEACHER
   - Hash des mots de passe avec bcrypt
   - Tokens JWT (accessToken + refreshToken)

2. **Modèle User complet** ✅
   - Rôles: PARENT, STUDENT, TEACHER, ADMIN, MODERATOR
   - UserType: MANAGER, LEARNER, STUDENT, INDIVIDUAL
   - Gestion des abonnements (TRIAL, ACTIVE, EXPIRED)
   - Désactivation par admin

3. **Routes admin complètes** ✅
   - GET `/api/admin/users` - Liste tous les comptes
   - GET `/api/admin/dashboard` - Stats globales
   - PUT `/api/admin/users/:userId/disable` - Désactiver un compte
   - PUT `/api/admin/users/:userId/enable` - Réactiver un compte
   - PUT `/api/admin/users/:userId/trial` - Étendre la période d'essai

4. **Base de données PostgreSQL** ✅
   - Modèles Sequelize bien définis
   - Relations entre User, Family, Student
   - Migrations et seeders

---

## 📋 PLAN D'ACTION COMPLET

### Phase 1: Corrections Backend (2h)

**1.1. Ajouter les routes manquantes**
```bash
# Éditer backend/src/routes/auth.js
# Ajouter les routes /me et /verify (voir solution ci-dessus)
```

**1.2. Tester les routes**
```bash
# Test de création de compte
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "accountType": "PARENT",
    "email": "test@example.com",
    "password": "Test123!",
    "firstName": "Jean",
    "lastName": "Dupont",
    "familyName": "Famille Dupont",
    "acceptTerms": "true"
  }'

# Test de login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type": "application/json" \
  -d '{
    "credential": "test@example.com",
    "password": "Test123!"
  }'

# Test de vérification token
curl -X GET http://localhost:3001/api/auth/verify \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test de récupération profil
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Phase 2: Corrections Frontend (4h)

**2.1. Remplacer mock data par vraies données API**

Créer: `parent-interface/js/shared/api-client.js`
```javascript
// Configuration API
const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:3001'
    : 'https://claudyne.com';

// Client API unifié
class ClaudyneAPI {
    constructor() {
        this.baseURL = API_BASE;
    }

    async request(endpoint, options = {}) {
        const token = localStorage.getItem('claudyne_token');

        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...options.headers
            }
        };

        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, config);
            const data = await response.json();

            if (!response.ok) {
                // Token expiré ?
                if (response.status === 401 || response.status === 403) {
                    // Tenter le refresh
                    const refreshed = await this.refreshToken();
                    if (refreshed) {
                        // Réessayer la requête
                        return this.request(endpoint, options);
                    } else {
                        // Redirect to login
                        this.logout();
                        throw new Error('Session expirée');
                    }
                }

                throw new Error(data.message || 'Erreur API');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    async refreshToken() {
        const refreshToken = localStorage.getItem('claudyne_refresh_token');

        if (!refreshToken) return false;

        try {
            const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken })
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('claudyne_token', data.data.accessToken);
                return true;
            }
        } catch (error) {
            console.error('Refresh failed:', error);
        }

        return false;
    }

    logout() {
        localStorage.removeItem('claudyne_token');
        localStorage.removeItem('claudyne_refresh_token');
        localStorage.removeItem('claudyne_user');
        localStorage.removeItem('claudyne_family');
        window.location.href = '/';
    }

    // Auth
    async login(credential, password) {
        return this.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ credential, password })
        });
    }

    async register(data) {
        return this.request('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async getMe() {
        return this.request('/api/auth/me');
    }

    async verifyToken() {
        return this.request('/api/auth/verify');
    }

    // Family & Dashboard
    async getDashboard() {
        return this.request('/api/families/dashboard');
    }

    async getProfile() {
        return this.request('/api/families/profile');
    }

    // Students
    async getStudents() {
        return this.request('/api/students');
    }

    async getStudentProgress(studentId) {
        return this.request(`/api/students/${studentId}/progress`);
    }

    // Admin
    async getAllUsers(page = 1, limit = 20) {
        return this.request(`/api/admin/users?page=${page}&limit=${limit}`);
    }

    async disableUser(userId, reason) {
        return this.request(`/api/admin/users/${userId}/disable`, {
            method: 'PUT',
            body: JSON.stringify({ reason })
        });
    }

    async enableUser(userId) {
        return this.request(`/api/admin/users/${userId}/enable`, {
            method: 'PUT'
        });
    }
}

// Export singleton
export const api = new ClaudyneAPI();
```

**2.2. Modifier parent-interface pour utiliser l'API**

Mettre à jour: `parent-interface/js/modules/dashboard.js`
```javascript
import { api } from '../shared/api-client.js';
// NE PLUS IMPORTER mockData !!!

async function loadDashboard() {
    try {
        showLoading();

        // Récupérer les vraies données depuis l'API
        const dashboardData = await api.getDashboard();

        if (dashboardData.success) {
            displayMetrics(dashboardData.data.metrics);
            displayRecentActivity(dashboardData.data.recentActivity);
            displaySubjectPerformance(dashboardData.data.subjectPerformance);
        } else {
            showError('Impossible de charger le dashboard');
        }

    } catch (error) {
        console.error('Dashboard load error:', error);
        showError('Erreur lors du chargement du dashboard');
    } finally {
        hideLoading();
    }
}
```

**2.3. Mettre à jour index.html pour la reconnexion**

```javascript
// Dans index.html, remplacer la logique de reconnexion
import { api } from './parent-interface/js/shared/api-client.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Tenter la reconnexion automatique
    const token = localStorage.getItem('claudyne_token');

    if (token) {
        try {
            // Vérifier si le token est encore valide
            const verifyResult = await api.verifyToken();

            if (verifyResult.success) {
                // Token valide, récupérer les données utilisateur fraîches
                const userData = await api.getMe();

                if (userData.success) {
                    // Mettre à jour le localStorage
                    localStorage.setItem('claudyne_user', JSON.stringify(userData.data.user));

                    if (userData.data.family) {
                        localStorage.setItem('claudyne_family', JSON.stringify(userData.data.family));
                    }

                    // Rediriger vers l'interface appropriée
                    redirectToInterface(userData.data.user);
                    return;
                }
            }
        } catch (error) {
            console.log('Auto-reconnect failed:', error);
            // Token invalide ou expiré, continuer vers le login
        }
    }

    // Pas de token valide, afficher le formulaire de login
    showLoginModal();
});

function redirectToInterface(user) {
    const role = user.role;
    const userType = user.userType;

    if (role === 'ADMIN') {
        window.location.href = '/admin-secure-k7m9x4n2p8w5z1c6';
    } else if (role === 'PARENT' && userType === 'MANAGER') {
        window.location.href = '/parent-interface';
    } else if (role === 'STUDENT' || userType === 'STUDENT') {
        window.location.href = '/student';
    } else if (role === 'TEACHER') {
        window.location.href = '/teacher';
    } else {
        window.location.href = '/';
    }
}
```

---

### Phase 3: Déploiement sur le serveur (1h)

**3.1. Synchroniser les fichiers**
```bash
# Depuis votre machine locale
rsync -avz --exclude 'node_modules' --exclude '.git' \
    ./ root@89.117.58.53:/opt/claudyne/

# Vérifier
ssh root@89.117.58.53 "ls -lh /opt/claudyne/admin-interface.html"
```

**3.2. Nettoyer les processus**
```bash
ssh root@89.117.58.53 << 'EOF'
cd /opt/claudyne

# Arrêter tous les processus
pm2 stop all
pm2 delete all

# Redémarrer uniquement le serveur principal
pm2 start backend/src/server.js --name claudyne-api --instances 1

# Redémarrer le cron job
pm2 start backend/src/jobs/subscriptionCron.js --name claudyne-cron --instances 1

# Sauvegarder
pm2 save

# Vérifier
pm2 list
pm2 logs claudyne-api --lines 50
EOF
```

**3.3. Tester en production**
```bash
# Test health check
curl https://claudyne.com/health

# Test login
curl -X POST https://claudyne.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "credential": "votre_email@example.com",
    "password": "votre_mot_de_passe"
  }'
```

---

### Phase 4: Validation finale (1h)

**4.1. Tests utilisateur complets**

- [ ] Créer un nouveau compte PARENT
- [ ] Se connecter avec ce compte
- [ ] Vérifier que le dashboard affiche des données réelles (pas Richy/Blandine)
- [ ] Se déconnecter puis se reconnecter (vérifier la persistance)
- [ ] Fermer le navigateur et rouvrir (vérifier la reconnexion auto)
- [ ] Rafraîchir la page (vérifier que la session est maintenue)

**4.2. Tests admin**

- [ ] Se connecter en tant qu'admin
- [ ] Vérifier que la liste des utilisateurs s'affiche
- [ ] Vérifier que TOUS les comptes créés sont listés
- [ ] Tester la désactivation d'un compte
- [ ] Tester la réactivation d'un compte
- [ ] Vérifier les informations: email, rôle, date création, dernier login

**4.3. Tests de reconnexion**

- [ ] Se connecter
- [ ] Attendre 10 minutes (token devrait encore être valide)
- [ ] Rafraîchir la page → devrait rester connecté
- [ ] Fermer le navigateur
- [ ] Rouvrir le navigateur et aller sur claudyne.com → devrait être auto-connecté
- [ ] Supprimer le token du localStorage
- [ ] Rafraîchir → devrait afficher le formulaire de login

---

## 🎯 RÉSULTATS ATTENDUS

Après ces corrections, vous aurez :

✅ **Création de comptes réels**
- Formulaire d'inscription fonctionnel
- Création de comptes PARENT, STUDENT, TEACHER dans PostgreSQL
- Envoi d'email de confirmation (si service d'email configuré)

✅ **Interfaces adaptées par rôle**
- ADMIN → `/admin-secure-k7m9x4n2p8w5z1c6`
- PARENT (MANAGER) → `/parent-interface`
- STUDENT → `/student`
- TEACHER → `/teacher`

✅ **Connexion/reconnexion fiable**
- Login par email, téléphone, prénom ou nom
- Reconnexion automatique au retour sur le site
- Refresh automatique du token expiré
- Session persistante entre les visites

✅ **Interface admin complète**
- Liste de TOUS les comptes créés
- Informations: email, rôle, date création, dernier login, famille
- Actions: désactiver, réactiver, voir détails
- Dashboard avec statistiques globales

✅ **Plus de mock data**
- Dashboard affiche les vraies données de l'utilisateur
- Liste d'enfants réels de la famille
- Progrès réels des élèves
- Données synchronisées avec la base de données

---

## 📊 MÉTRIQUES DE SUCCÈS

Après 48h de mise en production:
- [ ] 0 utilisateur ne voit de données mock (Richy, Blandine)
- [ ] Taux de reconnexion automatique > 95%
- [ ] 0 processus en double sur le serveur
- [ ] Interface admin liste 100% des comptes créés
- [ ] Temps de réponse API < 500ms

---

## ⚠️ RISQUES ET MITIGATION

| Risque | Impact | Probabilité | Mitigation |
|--------|---------|-------------|-----------|
| Perte de données lors de la migration | Élevé | Faible | Backup de la base avant toute modification |
| Incompatibilité API frontend/backend | Moyen | Moyen | Tests complets en local avant déploiement |
| Downtime pendant le déploiement | Faible | Élevé | Déploiement à 2h du matin (faible trafic) |
| Processus zombie après restart | Faible | Faible | Script de nettoyage automatique |

---

## 📝 CHECKLIST PRE-DÉPLOIEMENT

- [ ] Backup de la base de données PostgreSQL
- [ ] Backup des fichiers actuels sur le serveur
- [ ] Tests complets en environnement local
- [ ] Vérification de toutes les routes API
- [ ] Test de charge (100 requêtes/s)
- [ ] Notification aux utilisateurs existants (si nécessaire)
- [ ] Plan de rollback préparé

---

## 🔧 COMMANDES UTILES

```bash
# Backup de la base de données
ssh root@89.117.58.53 "pg_dump claudyne_production > /root/backup_$(date +%Y%m%d_%H%M%S).sql"

# Backup des fichiers
ssh root@89.117.58.53 "tar -czf /root/claudyne_backup_$(date +%Y%m%d_%H%M%S).tar.gz /opt/claudyne"

# Voir les logs en temps réel
ssh root@89.117.58.53 "pm2 logs claudyne-api --lines 100 --raw"

# Monitoring
ssh root@89.117.58.53 "pm2 monit"

# Restart rapide
ssh root@89.117.58.53 "pm2 restart claudyne-api"
```

---

## 📞 CONTACT ET SUPPORT

En cas de problème:
1. Vérifier les logs: `pm2 logs claudyne-api`
2. Vérifier la base de données: connexion PostgreSQL
3. Vérifier nginx: `nginx -t && systemctl status nginx`
4. Rollback si nécessaire: restaurer le backup

---

**Généré le**: 10 octobre 2025
**Par**: Claude Code Agent
**Version**: 1.0
**Status**: 🔴 Action requise
