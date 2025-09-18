/**
 * Système d'authentification unifié - Claudyne
 * Gère la connexion/déconnexion pour toutes les interfaces
 */

class ClaudeAuth {
    constructor() {
        this.apiBase = 'http://localhost:3001';
        this.currentUser = null;
        this.token = null;
        this.refreshToken = null;

        // Initialiser depuis le localStorage
        this.loadFromStorage();
    }

    // Charger les données d'authentification depuis le localStorage
    loadFromStorage() {
        this.token = localStorage.getItem('claudyne_token');
        this.refreshToken = localStorage.getItem('claudyne_refresh_token');

        const userData = localStorage.getItem('claudyne_user');
        if (userData) {
            try {
                this.currentUser = JSON.parse(userData);
            } catch (e) {
                console.error('Erreur parsing user data:', e);
                this.clearAuth();
            }
        }
    }

    // Sauvegarder dans le localStorage
    saveToStorage() {
        if (this.token) localStorage.setItem('claudyne_token', this.token);
        if (this.refreshToken) localStorage.setItem('claudyne_refresh_token', this.refreshToken);
        if (this.currentUser) localStorage.setItem('claudyne_user', JSON.stringify(this.currentUser));
    }

    // Nettoyer l'authentification
    clearAuth() {
        this.currentUser = null;
        this.token = null;
        this.refreshToken = null;

        localStorage.removeItem('claudyne_token');
        localStorage.removeItem('claudyne_refresh_token');
        localStorage.removeItem('claudyne_user');
        localStorage.removeItem('claudyne_family');
    }

    // Vérifier si l'utilisateur est connecté
    isAuthenticated() {
        return !!(this.token && this.currentUser);
    }

    // Vérifier si l'utilisateur a un rôle spécifique
    hasRole(role) {
        return this.currentUser && this.currentUser.role === role;
    }

    // Connexion
    async login(email, password) {
        try {
            const response = await fetch(`${this.apiBase}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success && data.data) {
                this.token = data.data.token;
                this.refreshToken = data.data.refreshToken;
                this.currentUser = data.data.user;

                this.saveToStorage();

                return {
                    success: true,
                    user: this.currentUser
                };
            } else {
                return {
                    success: false,
                    message: data.message || 'Identifiants incorrects'
                };
            }
        } catch (error) {
            console.error('Erreur de connexion:', error);
            return {
                success: false,
                message: 'Erreur de connexion au serveur'
            };
        }
    }

    // Déconnexion
    async logout() {
        try {
            // Appel API de déconnexion si token disponible
            if (this.token) {
                await fetch(`${this.apiBase}/api/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
        } finally {
            this.clearAuth();
        }
    }

    // Rafraîchir le token
    async refreshAuthToken() {
        if (!this.refreshToken) return false;

        try {
            const response = await fetch(`${this.apiBase}/api/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    refreshToken: this.refreshToken
                })
            });

            const data = await response.json();

            if (data.success && data.data) {
                this.token = data.data.token;
                this.saveToStorage();
                return true;
            } else {
                this.clearAuth();
                return false;
            }
        } catch (error) {
            console.error('Erreur rafraîchissement token:', error);
            this.clearAuth();
            return false;
        }
    }

    // Faire une requête authentifiée
    async apiCall(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(`${this.apiBase}${endpoint}`, {
                ...options,
                headers
            });

            // Si token expiré, essayer de le rafraîchir
            if (response.status === 401 && this.refreshToken) {
                const refreshed = await this.refreshAuthToken();
                if (refreshed) {
                    // Refaire la requête avec le nouveau token
                    headers['Authorization'] = `Bearer ${this.token}`;
                    return fetch(`${this.apiBase}${endpoint}`, {
                        ...options,
                        headers
                    });
                }
            }

            return response;
        } catch (error) {
            console.error('Erreur API:', error);
            throw error;
        }
    }

    // Créer le formulaire de connexion
    createLoginForm(targetRole = null) {
        const formHtml = `
            <div id="claudyne-auth-overlay" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(10px);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            ">
                <div style="
                    background: white;
                    border-radius: 20px;
                    padding: 2rem;
                    max-width: 400px;
                    width: 90%;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                    animation: slideUp 0.3s ease-out;
                ">
                    <div style="text-align: center; margin-bottom: 2rem;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">
                            ${targetRole === 'ADMIN' ? '👨‍💼' : targetRole === 'PARENT' ? '👨‍👩‍👧‍👦' : '🎓'}
                        </div>
                        <h2 style="color: #1F2937; margin: 0; font-size: 1.5rem;">
                            Connexion ${targetRole === 'ADMIN' ? 'Administrateur' : targetRole === 'PARENT' ? 'Parent' : 'Étudiant'}
                        </h2>
                        <p style="color: #6B7280; margin: 0.5rem 0 0 0; font-size: 0.9rem;">
                            Accès sécurisé à l'interface Claudyne
                        </p>
                    </div>

                    <form id="claudyne-auth-form">
                        <div style="margin-bottom: 1.5rem;">
                            <label style="display: block; color: #374151; font-weight: 600; margin-bottom: 0.5rem; font-size: 0.9rem;">
                                Email
                            </label>
                            <input type="email" id="claudyne-email" required style="
                                width: 100%;
                                padding: 0.875rem 1rem;
                                border: 2px solid #E5E7EB;
                                border-radius: 10px;
                                font-size: 1rem;
                                transition: all 0.2s;
                                box-sizing: border-box;
                            " placeholder="votre@email.com">
                        </div>

                        <div style="margin-bottom: 1.5rem;">
                            <label style="display: block; color: #374151; font-weight: 600; margin-bottom: 0.5rem; font-size: 0.9rem;">
                                Mot de passe
                            </label>
                            <input type="password" id="claudyne-password" required style="
                                width: 100%;
                                padding: 0.875rem 1rem;
                                border: 2px solid #E5E7EB;
                                border-radius: 10px;
                                font-size: 1rem;
                                transition: all 0.2s;
                                box-sizing: border-box;
                            " placeholder="••••••••">
                        </div>

                        <button type="submit" id="claudyne-login-btn" style="
                            width: 100%;
                            background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
                            color: white;
                            border: none;
                            padding: 0.875rem 1rem;
                            border-radius: 10px;
                            font-size: 1rem;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.2s;
                            margin-top: 1rem;
                        ">
                            Se connecter
                        </button>

                        <div id="claudyne-auth-error" style="
                            background: #FEF2F2;
                            border: 1px solid #FECACA;
                            color: #DC2626;
                            padding: 0.875rem;
                            border-radius: 10px;
                            margin-top: 1rem;
                            font-size: 0.9rem;
                            display: none;
                        "></div>
                    </form>

                    <div style="text-align: center; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #E5E7EB;">
                        <p style="color: #6B7280; font-size: 0.8rem; margin: 0;">
                            Accès sécurisé - Claudyne Education Platform
                        </p>
                    </div>
                </div>
            </div>

            <style>
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                #claudyne-auth-overlay input:focus {
                    outline: none;
                    border-color: #3B82F6 !important;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }
                #claudyne-login-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
                }
            </style>
        `;

        // Injecter le formulaire dans la page
        document.body.insertAdjacentHTML('beforeend', formHtml);

        // Ajouter les événements
        this.setupLoginFormEvents(targetRole);
    }

    // Configuration des événements du formulaire
    setupLoginFormEvents(targetRole) {
        const form = document.getElementById('claudyne-auth-form');
        const emailInput = document.getElementById('claudyne-email');
        const passwordInput = document.getElementById('claudyne-password');
        const loginBtn = document.getElementById('claudyne-login-btn');
        const errorDiv = document.getElementById('claudyne-auth-error');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = emailInput.value.trim();
            const password = passwordInput.value;

            if (!email || !password) {
                this.showError('Veuillez remplir tous les champs');
                return;
            }

            // Loading state
            loginBtn.disabled = true;
            loginBtn.textContent = '🔐 Connexion...';
            this.hideError();

            try {
                const result = await this.login(email, password);

                if (result.success) {
                    // Vérifier le rôle si spécifié
                    if (targetRole && result.user.role !== targetRole) {
                        this.showError(`Accès refusé : cette interface est réservée aux ${targetRole.toLowerCase()}s`);
                        this.clearAuth();
                    } else {
                        // Succès - fermer le formulaire
                        this.hideLoginForm();

                        // Déclencher l'événement de connexion réussie
                        window.dispatchEvent(new CustomEvent('claudyne:authenticated', {
                            detail: { user: result.user }
                        }));
                    }
                } else {
                    this.showError(result.message);
                }
            } catch (error) {
                this.showError('Erreur de connexion au serveur');
            }

            // Restaurer le bouton
            loginBtn.disabled = false;
            loginBtn.textContent = 'Se connecter';
        });
    }

    // Afficher une erreur
    showError(message) {
        const errorDiv = document.getElementById('claudyne-auth-error');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    }

    // Masquer l'erreur
    hideError() {
        const errorDiv = document.getElementById('claudyne-auth-error');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }

    // Masquer le formulaire de connexion
    hideLoginForm() {
        const overlay = document.getElementById('claudyne-auth-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    // Créer un bouton de déconnexion
    createLogoutButton(containerSelector) {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        const logoutBtn = document.createElement('button');
        logoutBtn.innerHTML = `
            <span style="margin-right: 0.5rem;">🚪</span>
            Se déconnecter
        `;
        logoutBtn.style.cssText = `
            background: #F87171;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.9rem;
            font-weight: 500;
            transition: all 0.2s;
        `;

        logoutBtn.addEventListener('click', async () => {
            if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
                await this.logout();
                window.location.reload();
            }
        });

        logoutBtn.addEventListener('mouseenter', () => {
            logoutBtn.style.background = '#EF4444';
            logoutBtn.style.transform = 'translateY(-1px)';
        });

        logoutBtn.addEventListener('mouseleave', () => {
            logoutBtn.style.background = '#F87171';
            logoutBtn.style.transform = 'translateY(0)';
        });

        container.appendChild(logoutBtn);
    }

    // Protéger une interface
    protectInterface(requiredRole = null) {
        // Vérifier si déjà authentifié
        if (this.isAuthenticated()) {
            if (!requiredRole || this.hasRole(requiredRole)) {
                return true; // Accès autorisé
            } else {
                this.clearAuth(); // Rôle incorrect
            }
        }

        // Afficher le formulaire de connexion
        this.createLoginForm(requiredRole);
        return false;
    }
}

// Instance globale
window.claudeAuth = new ClaudeAuth();

// Export pour modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ClaudeAuth;
}