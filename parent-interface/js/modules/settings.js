/**
 * Claudyne Parent Interface - Settings Module
 * Configuration et paramètres de l'application
 */

export default class Settings {
    constructor() {
        this.container = null;
        this.currentTab = 'profile';
        this.settings = {};
    }

    async render() {
        console.log('[Settings] Rendering settings module...');

        this.container = document.getElementById('settings');
        if (!this.container) return;

        // Load settings data
        await this.loadSettings();

        // Render interface
        this.container.innerHTML = this.getHTML();

        // Setup interactions
        this.setupEventListeners();

        console.log('[Settings] Settings module ready');
    }

    async loadSettings() {
        this.settings = this.getDefaultSettings();
    }

    getHTML() {
        return `
            <div class="settings-container">
                <div class="settings-header">
                    <h2>⚙️ Paramètres</h2>
                    <p>Configurez votre expérience Claudyne</p>
                </div>

                <div class="settings-tabs">
                    <button class="tab-btn active" data-tab="profile" onclick="settings.switchTab('profile')">
                        Profil
                    </button>
                    <button class="tab-btn" data-tab="notifications" onclick="settings.switchTab('notifications')">
                        Notifications
                    </button>
                    <button class="tab-btn" data-tab="privacy" onclick="settings.switchTab('privacy')">
                        Confidentialité
                    </button>
                    <button class="tab-btn" data-tab="account" onclick="settings.switchTab('account')">
                        Compte
                    </button>
                </div>

                <div class="tab-content active" id="profile-tab">
                    ${this.renderProfile()}
                </div>

                <div class="tab-content" id="notifications-tab">
                    ${this.renderNotifications()}
                </div>

                <div class="tab-content" id="privacy-tab">
                    ${this.renderPrivacy()}
                </div>

                <div class="tab-content" id="account-tab">
                    ${this.renderAccount()}
                </div>
            </div>
        `;
    }

    renderProfile() {
        return `
            <div class="profile-settings">
                <h3>Informations personnelles</h3>

                <div class="settings-form">
                    <div class="form-group">
                        <label for="fullName">Nom complet</label>
                        <input type="text" id="fullName" value="${this.settings.profile.name}" placeholder="Votre nom complet">
                    </div>

                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" value="${this.settings.profile.email}" placeholder="votre@email.com">
                    </div>

                    <div class="form-group">
                        <label for="phone">Téléphone</label>
                        <input type="tel" id="phone" value="${this.settings.profile.phone}" placeholder="+237 xxx xxx xxx">
                    </div>

                    <div class="form-group">
                        <label for="address">Adresse</label>
                        <textarea id="address" rows="3" placeholder="Votre adresse">${this.settings.profile.address}</textarea>
                    </div>

                    <div class="form-actions">
                        <button class="btn-primary" onclick="settings.saveProfile()">
                            Sauvegarder
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderNotifications() {
        return `
            <div class="notification-settings">
                <h3>Préférences de notification</h3>

                <div class="settings-group">
                    <h4>Notifications par email</h4>

                    <div class="setting-item">
                        <label class="switch">
                            <input type="checkbox" ${this.settings.notifications.emailProgress ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                        <div class="setting-info">
                            <div class="setting-title">Rapports de progression</div>
                            <div class="setting-desc">Recevez des rapports hebdomadaires sur les progrès de vos enfants</div>
                        </div>
                    </div>

                    <div class="setting-item">
                        <label class="switch">
                            <input type="checkbox" ${this.settings.notifications.emailAlerts ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                        <div class="setting-info">
                            <div class="setting-title">Alertes importantes</div>
                            <div class="setting-desc">Notifications pour les événements importants</div>
                        </div>
                    </div>
                </div>

                <div class="settings-group">
                    <h4>Notifications push</h4>

                    <div class="setting-item">
                        <label class="switch">
                            <input type="checkbox" ${this.settings.notifications.pushMessages ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                        <div class="setting-info">
                            <div class="setting-title">Messages instantanés</div>
                            <div class="setting-desc">Notifications pour nouveaux messages</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderPrivacy() {
        return `
            <div class="privacy-settings">
                <h3>Paramètres de confidentialité</h3>

                <div class="settings-group">
                    <div class="setting-item">
                        <label class="switch">
                            <input type="checkbox" ${this.settings.privacy.shareProgress ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                        <div class="setting-info">
                            <div class="setting-title">Partage des progrès</div>
                            <div class="setting-desc">Permettre le partage anonyme des données de progression pour améliorer l'IA</div>
                        </div>
                    </div>

                    <div class="setting-item">
                        <label class="switch">
                            <input type="checkbox" ${this.settings.privacy.analytics ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                        <div class="setting-info">
                            <div class="setting-title">Analyses d'usage</div>
                            <div class="setting-desc">Autoriser la collecte de données d'usage pour améliorer l'expérience</div>
                        </div>
                    </div>
                </div>

                <div class="privacy-actions">
                    <button class="btn-secondary" onclick="settings.exportData()">
                        <i class="fas fa-download"></i>
                        Télécharger mes données
                    </button>
                    <button class="btn-danger" onclick="settings.deleteAccount()">
                        <i class="fas fa-trash"></i>
                        Supprimer mon compte
                    </button>
                </div>
            </div>
        `;
    }

    renderAccount() {
        return `
            <div class="account-settings">
                <h3>Paramètres du compte</h3>

                <div class="settings-form">
                    <div class="form-group">
                        <label>Changer le mot de passe</label>
                        <input type="password" placeholder="Mot de passe actuel" class="form-input">
                        <input type="password" placeholder="Nouveau mot de passe" class="form-input">
                        <input type="password" placeholder="Confirmer le nouveau mot de passe" class="form-input">
                        <button class="btn-secondary">Changer le mot de passe</button>
                    </div>

                    <div class="form-group">
                        <label>Authentification à deux facteurs</label>
                        <div class="setting-item">
                            <label class="switch">
                                <input type="checkbox" ${this.settings.account.twoFactor ? 'checked' : ''}>
                                <span class="slider"></span>
                            </label>
                            <div class="setting-info">
                                <div class="setting-title">Activer 2FA</div>
                                <div class="setting-desc">Sécurité renforcée pour votre compte</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="account-info">
                    <h4>Informations du compte</h4>
                    <div class="info-item">
                        <span class="info-label">Membre depuis:</span>
                        <span class="info-value">Septembre 2025</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Dernière connexion:</span>
                        <span class="info-value">Aujourd'hui à 14:32</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Type de compte:</span>
                        <span class="info-value">Parent Premium</span>
                    </div>
                </div>
            </div>
        `;
    }

    getDefaultSettings() {
        return {
            profile: {
                name: 'Parent Utilisateur',
                email: 'parent@example.com',
                phone: '+237 xxx xxx xxx',
                address: 'Yaoundé, Cameroun'
            },
            notifications: {
                emailProgress: true,
                emailAlerts: true,
                pushMessages: false
            },
            privacy: {
                shareProgress: false,
                analytics: true
            },
            account: {
                twoFactor: false
            }
        };
    }

    setupEventListeners() {
        // Tab switching handled by global click handler
    }

    switchTab(tabName) {
        this.currentTab = tabName;

        document.querySelectorAll('#settings .tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        document.querySelectorAll('#settings .tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });
    }

    saveProfile() {
        console.log('[Settings] Saving profile...');
        // Implementation would save to backend
        if (window.parentApp) {
            window.parentApp.showNotification('Profil sauvegardé', 'success');
        }
    }

    exportData() {
        console.log('[Settings] Exporting user data...');
        if (window.parentApp) {
            window.parentApp.showNotification('Export des données en cours...', 'info');
        }
    }

    deleteAccount() {
        if (confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) {
            console.log('[Settings] Deleting account...');
            if (window.parentApp) {
                window.parentApp.showNotification('Suppression du compte en cours...', 'warning');
            }
        }
    }
}

// Export global pour les interactions HTML
if (typeof window !== 'undefined') {
    window.settings = new Settings();
}

export default Settings;