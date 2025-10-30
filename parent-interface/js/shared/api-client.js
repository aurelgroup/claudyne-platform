/**
 * Claudyne API Client
 * Client unifié pour toutes les requêtes API
 * Gère l'authentification, le refresh automatique des tokens, et les erreurs
 */

// Configuration API selon l'environnement
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3001'
    : `https://${window.location.hostname}`;

/**
 * Client API principal
 */
class ClaudyneAPI {
    constructor() {
        this.baseURL = API_BASE;
        this.isRefreshing = false;
        this.failedQueue = [];
    }

    /**
     * Requête HTTP générique avec gestion automatique du refresh token
     */
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
                        // Réessayer la requête avec le nouveau token
                        const newToken = localStorage.getItem('claudyne_token');
                        config.headers.Authorization = `Bearer ${newToken}`;
                        const retryResponse = await fetch(`${this.baseURL}${endpoint}`, config);
                        return await retryResponse.json();
                    } else {
                        // Impossible de rafraîchir, déconnecter
                        this.logout();
                        throw new Error('Session expirée');
                    }
                }

                throw new Error(data.message || `Erreur HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    /**
     * Rafraîchir le token d'accès
     */
    async refreshToken() {
        if (this.isRefreshing) {
            // Attendre que le refresh en cours se termine
            return new Promise((resolve, reject) => {
                this.failedQueue.push({ resolve, reject });
            });
        }

        const refreshToken = localStorage.getItem('claudyne_refresh_token');

        if (!refreshToken) {
            console.log('Pas de refresh token disponible');
            return false;
        }

        this.isRefreshing = true;

        try {
            const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken })
            });

            if (response.ok) {
                const data = await response.json();

                if (data.success && data.data.accessToken) {
                    // Sauvegarder le nouveau token
                    localStorage.setItem('claudyne_token', data.data.accessToken);

                    // Résoudre toutes les requêtes en attente
                    this.failedQueue.forEach(promise => promise.resolve(true));
                    this.failedQueue = [];

                    return true;
                }
            }
        } catch (error) {
            console.error('Refresh token failed:', error);

            // Rejeter toutes les requêtes en attente
            this.failedQueue.forEach(promise => promise.reject(error));
            this.failedQueue = [];
        } finally {
            this.isRefreshing = false;
        }

        return false;
    }

    /**
     * Déconnecter l'utilisateur et nettoyer les données
     */
    logout() {
        localStorage.removeItem('claudyne_token');
        localStorage.removeItem('claudyne_refresh_token');
        localStorage.removeItem('claudyne_user');
        localStorage.removeItem('claudyne_family');

        // Rediriger vers la page d'accueil
        if (window.location.pathname !== '/') {
            window.location.href = '/';
        }
    }

    // ========================================
    // ROUTES D'AUTHENTIFICATION
    // ========================================

    /**
     * Connexion utilisateur
     */
    async login(credential, password) {
        return this.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ credential, password })
        });
    }

    /**
     * Inscription utilisateur
     */
    async register(data) {
        return this.request('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * Vérifier si le token est toujours valide
     */
    async verifyToken() {
        return this.request('/api/auth/verify');
    }

    /**
     * Récupérer les informations de l'utilisateur connecté
     */
    async getMe() {
        return this.request('/api/auth/me');
    }

    /**
     * Récupération de mot de passe
     */
    async forgotPassword(email) {
        return this.request('/api/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
    }

    /**
     * Réinitialisation de mot de passe
     */
    async resetPassword(token, password) {
        return this.request('/api/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ token, password })
        });
    }

    // ========================================
    // ROUTES FAMILLE & DASHBOARD
    // ========================================

    /**
     * Récupérer le dashboard famille
     */
    async getDashboard() {
        return this.request('/api/families/dashboard');
    }

    /**
     * Récupérer le profil de la famille
     */
    async getProfile() {
        return this.request('/api/families/profile');
    }

    /**
     * Mettre à jour le profil de la famille
     */
    async updateProfile(data) {
        return this.request('/api/families/profile', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // ========================================
    // ROUTES ÉTUDIANTS
    // ========================================

    /**
     * Récupérer la liste des étudiants de la famille
     */
    async getStudents() {
        return this.request('/api/students');
    }

    /**
     * Récupérer le progrès d'un étudiant
     */
    async getStudentProgress(studentId) {
        return this.request(`/api/students/${studentId}/progress`);
    }

    /**
     * Ajouter un étudiant à la famille
     */
    async addStudent(data) {
        return this.request('/api/students', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * Mettre à jour un étudiant
     */
    async updateStudent(studentId, data) {
        return this.request(`/api/students/${studentId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // ========================================
    // ROUTES MATIÈRES & LEÇONS
    // ========================================

    /**
     * Récupérer les matières disponibles
     */
    async getSubjects(level = null) {
        const query = level ? `?level=${level}` : '';
        return this.request(`/api/subjects${query}`);
    }

    /**
     * Récupérer les leçons d'une matière
     */
    async getLessons(subjectId, level = null) {
        const query = level ? `?level=${level}` : '';
        return this.request(`/api/subjects/${subjectId}/lessons${query}`);
    }

    /**
     * Récupérer le contenu d'une leçon
     */
    async getLessonContent(lessonId, studentId = null) {
        const query = studentId ? `?student_id=${studentId}` : '';
        return this.request(`/api/lessons/${lessonId}${query}`);
    }

    /**
     * Marquer une leçon comme complétée
     */
    async completeLesson(lessonId, data) {
        return this.request(`/api/lessons/${lessonId}/complete`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // ========================================
    // ROUTES ADMIN
    // ========================================

    /**
     * Récupérer tous les utilisateurs (admin)
     */
    async getAllUsers(page = 1, limit = 20, filters = {}) {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...filters
        });
        return this.request(`/api/admin/users?${params}`);
    }

    /**
     * Désactiver un compte utilisateur (admin)
     */
    async disableUser(userId, reason) {
        return this.request(`/api/admin/users/${userId}/disable`, {
            method: 'PUT',
            body: JSON.stringify({ reason })
        });
    }

    /**
     * Réactiver un compte utilisateur (admin)
     */
    async enableUser(userId) {
        return this.request(`/api/admin/users/${userId}/enable`, {
            method: 'PUT'
        });
    }

    /**
     * Étendre la période d'essai (admin)
     */
    async extendTrial(userId, trialDays, reason) {
        return this.request(`/api/admin/users/${userId}/trial`, {
            method: 'PUT',
            body: JSON.stringify({ trialDays, reason })
        });
    }

    /**
     * Récupérer le dashboard admin
     */
    async getAdminDashboard() {
        return this.request('/api/admin/dashboard');
    }

    // ========================================
    // ROUTES PAIEMENTS
    // ========================================

    /**
     * Initier un paiement Mobile Money
     */
    async initiateMobilePayment(data) {
        return this.request('/api/payments/mobile', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * Vérifier le statut d'un paiement
     */
    async checkPaymentStatus(paymentId) {
        return this.request(`/api/payments/${paymentId}/status`);
    }

    /**
     * Récupérer l'historique des paiements
     */
    async getPaymentHistory(familyId) {
        return this.request(`/api/payments/history?familyId=${familyId}`);
    }

    // ========================================
    // ROUTES NOTIFICATIONS
    // ========================================

    /**
     * Récupérer les notifications
     */
    async getNotifications(userId) {
        return this.request(`/api/notifications?userId=${userId}`);
    }

    /**
     * Marquer une notification comme lue
     */
    async markNotificationAsRead(notificationId) {
        return this.request(`/api/notifications/${notificationId}/read`, {
            method: 'PUT'
        });
    }
}

// Export singleton
const api = new ClaudyneAPI();
export default api;

// Export nommé pour compatibilité
export { api, ClaudyneAPI };

// Export global pour compatibilité avec scripts non-modules
if (typeof window !== 'undefined') {
    window.ClaudyneAPI = api;
}
