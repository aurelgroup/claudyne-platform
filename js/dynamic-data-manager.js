/**
 * GESTIONNAIRE DE DONNÉES DYNAMIQUES CLAUDYNE
 * Remplace toutes les données statiques par des données dynamiques réinitialisables
 * En hommage à Meffo Mehtah Tchandjio Claudine
 */

class DynamicDataManager {
    constructor() {
        this.dataKeys = {
            // Templates email
            EMAIL_TEMPLATES: 'claudyne_email_templates',
            // Automations
            EMAIL_AUTOMATIONS: 'claudyne_email_automations',
            // Utilisateurs
            USERS_DATA: 'claudyne_users_data',
            // Statistiques
            DASHBOARD_STATS: 'claudyne_dashboard_stats',
            // Configuration
            APP_CONFIG: 'claudyne_app_config'
        };

        this.initializeDefaultData();
    }

    /**
     * Initialise les données par défaut si elles n'existent pas
     */
    initializeDefaultData() {
        console.log('🔄 Initialisation des données dynamiques Claudyne...');

        // Templates email par défaut
        if (!this.getData(this.dataKeys.EMAIL_TEMPLATES)) {
            this.setData(this.dataKeys.EMAIL_TEMPLATES, this.getDefaultEmailTemplates());
        }

        // Automations par défaut
        if (!this.getData(this.dataKeys.EMAIL_AUTOMATIONS)) {
            this.setData(this.dataKeys.EMAIL_AUTOMATIONS, this.getDefaultEmailAutomations());
        }

        // Stats par défaut
        if (!this.getData(this.dataKeys.DASHBOARD_STATS)) {
            this.setData(this.dataKeys.DASHBOARD_STATS, this.getDefaultDashboardStats());
        }

        // Config par défaut
        if (!this.getData(this.dataKeys.APP_CONFIG)) {
            this.setData(this.dataKeys.APP_CONFIG, this.getDefaultAppConfig());
        }

        console.log('✅ Données dynamiques initialisées');
    }

    /**
     * Récupère des données du localStorage
     */
    getData(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`Erreur lecture données ${key}:`, error);
            return null;
        }
    }

    /**
     * Sauvegarde des données dans localStorage
     */
    setData(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            console.log(`💾 Données sauvées: ${key}`);
            return true;
        } catch (error) {
            console.error(`Erreur sauvegarde ${key}:`, error);
            return false;
        }
    }

    /**
     * 🔄 FONCTION DE RESET COMPLET
     */
    resetAllData() {
        console.log('🔄 RESET COMPLET DES DONNÉES EN COURS...');

        // Supprimer toutes les données Claudyne
        Object.values(this.dataKeys).forEach(key => {
            localStorage.removeItem(key);
            console.log(`🗑️ Supprimé: ${key}`);
        });

        // Réinitialiser avec les valeurs par défaut
        this.initializeDefaultData();

        console.log('✅ RESET TERMINÉ - Toutes les données sont revenues aux valeurs par défaut');

        // Notification utilisateur
        this.showResetNotification();
    }

    /**
     * Reset sélectif par catégorie
     */
    resetCategory(category) {
        const key = this.dataKeys[category];
        if (!key) {
            console.error('Catégorie inconnue:', category);
            return false;
        }

        localStorage.removeItem(key);

        // Réinitialiser la catégorie
        switch(category) {
            case 'EMAIL_TEMPLATES':
                this.setData(key, this.getDefaultEmailTemplates());
                break;
            case 'EMAIL_AUTOMATIONS':
                this.setData(key, this.getDefaultEmailAutomations());
                break;
            case 'DASHBOARD_STATS':
                this.setData(key, this.getDefaultDashboardStats());
                break;
            case 'APP_CONFIG':
                this.setData(key, this.getDefaultAppConfig());
                break;
        }

        console.log(`🔄 Catégorie ${category} réinitialisée`);
        return true;
    }

    /**
     * Templates email par défaut
     */
    getDefaultEmailTemplates() {
        return [
            {
                id: 'welcome',
                name: 'Email de bienvenue',
                subject: 'Bienvenue sur Claudyne - Votre parcours éducatif commence !',
                htmlContent: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e, #16213e); color: white; border-radius: 10px; overflow: hidden;">
                        <div style="padding: 30px; text-align: center;">
                            <h1 style="color: #FFD700; margin-bottom: 20px;">🎓 Bienvenue sur Claudyne !</h1>
                            <p style="font-size: 18px; line-height: 1.6;">Nous sommes ravis de vous accueillir dans notre communauté éducative.</p>
                            <div style="background: rgba(255, 215, 0, 0.1); padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <p style="margin: 0; font-style: italic;">"La force du savoir en héritage"</p>
                                <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.8;">En hommage à Meffo Mehtah Tchandjio Claudine</p>
                            </div>
                        </div>
                    </div>
                `,
                category: 'system',
                active: true,
                lastModified: new Date().toISOString()
            }
        ];
    }

    /**
     * Automations par défaut
     */
    getDefaultEmailAutomations() {
        return [
            {
                id: 'welcome',
                name: 'Email de bienvenue',
                description: 'Envoyé automatiquement lors de l\'inscription',
                trigger: 'user_registration',
                delay: 0,
                template: 'welcome',
                active: true,
                stats: { sent: 0, opened: 0, clicked: 0 }
            }
        ];
    }

    /**
     * Stats par défaut
     */
    getDefaultDashboardStats() {
        return {
            users: { total: 0, active: 0, new: 0 },
            emails: { sent: 0, opened: 0, clicked: 0 },
            courses: { total: 0, active: 0, completed: 0 },
            lastUpdate: new Date().toISOString()
        };
    }

    /**
     * Configuration par défaut
     */
    getDefaultAppConfig() {
        return {
            siteName: 'Claudyne',
            version: '1.3.0',
            theme: 'glassmorphism',
            language: 'fr',
            features: {
                emailAutomation: true,
                analytics: true,
                notifications: true
            },
            lastUpdate: new Date().toISOString()
        };
    }

    /**
     * Notification de reset
     */
    showResetNotification() {
        const notification = document.createElement('div');
        notification.className = 'reset-notification';
        notification.innerHTML = `
            <div style="position: fixed; top: 20px; right: 20px; background: #10B981; color: white; padding: 15px 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 10000;">
                <strong>✅ Reset terminé</strong><br>
                Toutes les données ont été réinitialisées
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    /**
     * Export des données (sauvegarde)
     */
    exportData() {
        const allData = {};
        Object.entries(this.dataKeys).forEach(([category, key]) => {
            allData[category] = this.getData(key);
        });

        const blob = new Blob([JSON.stringify(allData, null, 2)],
            { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `claudyne-data-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();

        URL.revokeObjectURL(url);
        console.log('📥 Données exportées');
    }

    /**
     * Import des données (restauration)
     */
    importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);

                    Object.entries(data).forEach(([category, categoryData]) => {
                        const key = this.dataKeys[category];
                        if (key && categoryData) {
                            this.setData(key, categoryData);
                        }
                    });

                    console.log('📤 Données importées avec succès');
                    resolve(true);
                } catch (error) {
                    console.error('Erreur import:', error);
                    reject(error);
                }
            };
            reader.readAsText(file);
        });
    }
}

// 🌟 API GLOBALE POUR L'INTERFACE ADMIN
class ClaudyneDataAPI {
    constructor() {
        this.manager = new DynamicDataManager();
    }

    // Templates
    getEmailTemplates() { return this.manager.getData(this.manager.dataKeys.EMAIL_TEMPLATES) || []; }
    saveEmailTemplate(template) {
        const templates = this.getEmailTemplates();
        const index = templates.findIndex(t => t.id === template.id);
        if (index >= 0) {
            templates[index] = { ...template, lastModified: new Date().toISOString() };
        } else {
            templates.push({ ...template, id: Date.now().toString(), lastModified: new Date().toISOString() });
        }
        return this.manager.setData(this.manager.dataKeys.EMAIL_TEMPLATES, templates);
    }

    // Automations
    getEmailAutomations() { return this.manager.getData(this.manager.dataKeys.EMAIL_AUTOMATIONS) || []; }
    saveEmailAutomation(automation) {
        const automations = this.getEmailAutomations();
        const index = automations.findIndex(a => a.id === automation.id);
        if (index >= 0) {
            automations[index] = automation;
        } else {
            automations.push({ ...automation, id: Date.now().toString() });
        }
        return this.manager.setData(this.manager.dataKeys.EMAIL_AUTOMATIONS, automations);
    }

    // Stats
    getDashboardStats() { return this.manager.getData(this.manager.dataKeys.DASHBOARD_STATS); }
    updateStats(newStats) {
        const currentStats = this.getDashboardStats();
        const updatedStats = { ...currentStats, ...newStats, lastUpdate: new Date().toISOString() };
        return this.manager.setData(this.manager.dataKeys.DASHBOARD_STATS, updatedStats);
    }

    // Reset functions
    resetAll() { return this.manager.resetAllData(); }
    resetCategory(category) { return this.manager.resetCategory(category); }

    // Backup functions
    exportData() { return this.manager.exportData(); }
    importData(file) { return this.manager.importData(file); }
}

// Instance globale
window.claudyneData = new ClaudyneDataAPI();

console.log('🚀 Claudyne Dynamic Data Manager initialisé');
console.log('💡 Utilisez claudyneData.resetAll() pour tout réinitialiser');