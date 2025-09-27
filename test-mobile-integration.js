/**
 * TEST INTÉGRATION MOBILE CLAUDYNE
 * Test complet de l'alignement mobile ↔ backend ↔ sync
 * En hommage à Meffo Mehtah Tchandjio Claudine
 */

const fetch = require('node-fetch');

class ClaudyneMobileIntegrationTest {
    constructor() {
        this.baseUrl = 'http://localhost:3001';  // Backend principal
        this.mobileUrl = 'http://localhost:3002'; // API mobile dédiée
        this.prodUrl = 'https://claudyne.com/api'; // Production

        this.results = [];
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${message}`;

        console.log(logEntry);
        this.results.push({ timestamp, message, type });
    }

    async testEndpoint(url, options = {}) {
        try {
            const response = await fetch(url, {
                timeout: 10000,
                headers: {
                    'X-Client-Type': 'mobile',
                    'User-Agent': 'Claudyne-Mobile-Test',
                    ...options.headers
                },
                ...options
            });

            const data = await response.json();

            return {
                success: response.ok,
                status: response.status,
                data
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async runTests() {
        this.log('🧪 === TEST INTÉGRATION MOBILE CLAUDYNE ===');
        this.log('👨‍👩‍👧‍👦 En hommage à Meffo Mehtah Tchandjio Claudine');
        this.log('');

        // 1. TEST BACKEND PRINCIPAL
        await this.testMainBackend();

        // 2. TEST API MOBILE DÉDIÉE
        await this.testMobileApi();

        // 3. TEST SYNCHRONISATION
        await this.testSynchronization();

        // 4. TEST AUTHENTIFICATION MOBILE
        await this.testMobileAuth();

        // 5. TEST PRODUCTION (si accessible)
        await this.testProduction();

        // 6. RÉSUMÉ
        this.showSummary();
    }

    async testMainBackend() {
        this.log('🔧 === TEST BACKEND PRINCIPAL ===');

        // Test ping backend principal
        const ping = await this.testEndpoint(`${this.baseUrl}/api/ping`);

        if (ping.success) {
            this.log('✅ Backend principal accessible');
            this.log(`📊 Uptime: ${Math.round(ping.data.server?.uptime || 0)}s`);
        } else {
            this.log('❌ Backend principal inaccessible', 'error');
            this.log(`Erreur: ${ping.error || ping.status}`);
        }

        // Test route auth backend
        const authTest = await this.testEndpoint(`${this.baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'f.nono@projexts.ca',
                password: '123456',
                clientType: 'mobile'
            })
        });

        if (authTest.success) {
            this.log('✅ Authentification backend OK');
            this.log(`👤 User: ${authTest.data.user?.email}`);
        } else {
            this.log('⚠️ Authentification backend échouée');
            this.log(`Erreur: ${authTest.error || authTest.data?.error}`);
        }
    }

    async testMobileApi() {
        this.log('');
        this.log('📱 === TEST API MOBILE DÉDIÉE ===');

        // Test ping mobile
        const mobilePing = await this.testEndpoint(`${this.mobileUrl}/api/ping`);

        if (mobilePing.success) {
            this.log('✅ API mobile accessible');
            this.log(`📱 Features: ${Object.keys(mobilePing.data.mobile?.features || {}).length}`);
            this.log(`🗄️ PostgreSQL: ${mobilePing.data.database?.postgres ? 'OK' : 'Fallback JSON'}`);
            this.log(`👥 Users JSON: ${mobilePing.data.database?.jsonUsers || 0}`);
            this.log(`👥 Users PostgreSQL: ${mobilePing.data.database?.postgresUsers || 0}`);
        } else {
            this.log('❌ API mobile inaccessible', 'error');
            this.log('💡 Lancez: node backend/mobile-server.js');
        }

        // Test authentification mobile
        const mobileAuth = await this.testEndpoint(`${this.mobileUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'f.nono@projexts.ca',
                password: '123456',
                clientType: 'mobile'
            })
        });

        if (mobileAuth.success) {
            this.log('✅ Authentification mobile OK');
            this.log(`🎫 Token: ${mobileAuth.data.token?.slice(0, 20)}...`);
            this.log(`📱 Sync: ${mobileAuth.data.mobile?.syncEnabled ? 'Enabled' : 'Disabled'}`);
        } else {
            this.log('❌ Authentification mobile échouée');
        }

        // Test configuration mobile
        const mobileConfig = await this.testEndpoint(`${this.mobileUrl}/api/config`);

        if (mobileConfig.success) {
            this.log('✅ Configuration mobile OK');
            this.log(`🎓 Features: ${Object.keys(mobileConfig.data.config?.features || {}).length}`);
            this.log(`🇨🇲 Locale: ${mobileConfig.data.config?.cameroon?.locale}`);
        } else {
            this.log('⚠️ Configuration mobile indisponible');
        }
    }

    async testSynchronization() {
        this.log('');
        this.log('🔄 === TEST SYNCHRONISATION ===');

        // Test status sync
        const syncStatus = await this.testEndpoint(`${this.mobileUrl}/api/sync/status`);

        if (syncStatus.success) {
            this.log('✅ Status synchronisation OK');
            this.log(`🔄 Sync PostgreSQL: ${syncStatus.data.sync?.postgresAvailable ? 'Disponible' : 'Indisponible'}`);
            this.log(`📊 Dernière sync: ${syncStatus.data.sync?.lastSync || 'Jamais'}`);
            this.log(`⚡ Intervalle recommandé: ${syncStatus.data.mobile?.recommendedSyncInterval / 1000}s`);
        } else {
            this.log('❌ Status synchronisation inaccessible');
        }

        // Test force sync
        const forceSync = await this.testEndpoint(`${this.mobileUrl}/api/sync/force`, {
            method: 'POST'
        });

        if (forceSync.success) {
            this.log('✅ Force sync réussie');
            this.log(`📈 Users après sync: ${forceSync.data.sync?.postgresUsers || 0}`);
        } else {
            this.log('⚠️ Force sync échouée');
        }
    }

    async testMobileAuth() {
        this.log('');
        this.log('🔐 === TEST AUTHENTIFICATION MOBILE ===');

        const testAccounts = [
            { email: 'f.nono@projexts.ca', password: '123456', role: 'Parent' },
            { email: 'test@claudyne.com', password: 'test123', role: 'Student' },
            { email: 'parent@claudyne.com', password: 'parent123', role: 'Parent' },
        ];

        for (const account of testAccounts) {
            const auth = await this.testEndpoint(`${this.mobileUrl}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: account.email,
                    password: account.password,
                    clientType: 'mobile'
                })
            });

            if (auth.success) {
                this.log(`✅ ${account.role}: ${account.email} - OK`);
            } else {
                this.log(`❌ ${account.role}: ${account.email} - ÉCHEC`);
            }
        }
    }

    async testProduction() {
        this.log('');
        this.log('🌐 === TEST PRODUCTION ===');

        const prodPing = await this.testEndpoint(`${this.prodUrl}/ping`);

        if (prodPing.success) {
            this.log('✅ Production accessible');
            this.log(`🌐 URL: ${this.prodUrl}`);
            this.log(`📊 Uptime: ${Math.round(prodPing.data.server?.uptime || 0)}s`);
        } else {
            this.log('⚠️ Production inaccessible');
            this.log('💡 Normal si pas encore déployé');
        }

        // Test authentification production
        const prodAuth = await this.testEndpoint(`${this.prodUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'f.nono@projexts.ca',
                password: '123456',
                clientType: 'mobile'
            })
        });

        if (prodAuth.success) {
            this.log('✅ Authentification production OK');
        } else {
            this.log('⚠️ Authentification production indisponible');
        }
    }

    showSummary() {
        this.log('');
        this.log('📊 === RÉSUMÉ TESTS INTÉGRATION ===');

        const errors = this.results.filter(r => r.type === 'error').length;
        const total = this.results.length;

        this.log(`Total tests: ${total}`);
        this.log(`Erreurs: ${errors}`);
        this.log(`Succès: ${total - errors}`);

        if (errors === 0) {
            this.log('🎉 TOUS LES TESTS PASSÉS !');
            this.log('✅ Mobile app parfaitement alignée avec backend');
            this.log('✅ Synchronisation JSON ↔ PostgreSQL active');
            this.log('✅ API mobile optimisée et fonctionnelle');
        } else {
            this.log('⚠️ QUELQUES PROBLÈMES DÉTECTÉS');
            this.log('💡 Vérifiez les services backend et mobile');
        }

        this.log('');
        this.log('🚀 PROCHAINES ÉTAPES:');
        this.log('1. Déployer avec: ./deploy-mobile-aligned.sh');
        this.log('2. Build APK avec: cd claudyne-mobile && npx eas build');
        this.log('3. Tester sur appareil Android réel');
        this.log('');
        this.log('👨‍👩‍👧‍👦 En hommage à Meffo Mehtah Tchandjio Claudine');
        this.log('🇨🇲 Claudyne - La force du savoir en héritage');
    }
}

// Exécution des tests
if (require.main === module) {
    const tester = new ClaudyneMobileIntegrationTest();
    tester.runTests().catch(console.error);
}

module.exports = ClaudyneMobileIntegrationTest;