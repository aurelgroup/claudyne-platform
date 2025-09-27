/**
 * SERVEUR API MOBILE CLAUDYNE
 * Serveur dédié pour application mobile avec intégration sync
 * En hommage à Meffo Mehtah Tchandjio Claudine
 */

const http = require('http');
const url = require('url');
const querystring = require('querystring');
const { db, syncEngine } = require('./database.js');

const PORT = process.env.MOBILE_PORT || 3002;

// Fonction utilitaire pour les headers CORS optimisés mobile
function setMobileCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Client-Type');
    res.setHeader('X-Powered-By', 'Claudyne-Mobile-API');
    res.setHeader('Cache-Control', 'private, max-age=300');
}

// Fonction pour envoyer une réponse JSON mobile
function sendMobileJSON(res, statusCode, data) {
    setMobileCorsHeaders(res);
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(data, null, 2));
}

// Fonction pour parser le body JSON
function parseBody(req, callback) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    req.on('end', () => {
        try {
            const parsed = body ? JSON.parse(body) : {};
            callback(null, parsed);
        } catch (error) {
            callback(error, null);
        }
    });
}

// Serveur HTTP principal
const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const method = req.method;

    // Identifier requêtes mobiles
    const isMobile = req.headers['x-client-type'] === 'mobile' ||
                     req.headers['user-agent']?.includes('Claudyne-Mobile');

    if (isMobile) {
        console.log(`📱 Mobile Request: ${method} ${path}`);
    }

    // Handle preflight requests
    if (method === 'OPTIONS') {
        setMobileCorsHeaders(res);
        res.writeHead(200);
        res.end();
        return;
    }

    try {
        // ========================================
        // PING ET STATUS
        // ========================================

        if (path === '/api/ping' && method === 'GET') {
            const syncStatus = await syncEngine.getStatus();

            sendMobileJSON(res, 200, {
                success: true,
                message: 'Claudyne Mobile API OK',
                timestamp: new Date().toISOString(),
                server: {
                    version: '1.0.0',
                    environment: process.env.NODE_ENV || 'development',
                    uptime: process.uptime()
                },
                database: {
                    postgres: syncStatus.postgresAvailable,
                    jsonUsers: syncStatus.jsonUsers,
                    postgresUsers: syncStatus.postgresUsers,
                    lastSync: syncStatus.lastSync
                },
                mobile: {
                    optimized: true,
                    features: {
                        battleRoyale: true,
                        aiMentor: true,
                        familyManagement: true,
                        prixClaudine: true,
                        offlineMode: true
                    }
                }
            });
            return;
        }

        // ========================================
        // AUTHENTIFICATION MOBILE
        // ========================================

        if (path === '/api/auth/login' && method === 'POST') {
            parseBody(req, async (err, body) => {
                if (err) {
                    sendMobileJSON(res, 400, {
                        success: false,
                        error: 'Body JSON invalide'
                    });
                    return;
                }

                const { email, password, clientType } = body;

                if (!email || !password) {
                    sendMobileJSON(res, 400, {
                        success: false,
                        error: 'Email et mot de passe requis'
                    });
                    return;
                }

                try {
                    const user = await db.authenticateUser(email, password);

                    if (!user) {
                        sendMobileJSON(res, 401, {
                            success: false,
                            error: 'Identifiants invalides'
                        });
                        return;
                    }

                    // Mettre à jour dernière connexion
                    await db.updateLastLogin(user.id);

                    // Token simple pour POC
                    const token = `claudyne_mobile_${user.id}_${Date.now()}`;

                    console.log(`📱 Mobile Login: ${user.email} (${user.role})`);

                    sendMobileJSON(res, 200, {
                        success: true,
                        message: 'Connexion réussie',
                        token,
                        user: {
                            id: user.id,
                            email: user.email,
                            firstName: user.firstName || user.firstname,
                            lastName: user.lastName || user.lastname,
                            role: user.role,
                            userType: user.userType || user.usertype,
                            isActive: user.isActive !== false,
                            phone: user.phone
                        },
                        mobile: {
                            clientType: clientType || 'mobile',
                            syncEnabled: true,
                            features: ['battle-royale', 'ai-mentor', 'family-management']
                        }
                    });

                } catch (error) {
                    console.error('❌ Mobile Login Error:', error);
                    sendMobileJSON(res, 500, {
                        success: false,
                        error: 'Erreur serveur lors de la connexion'
                    });
                }
            });
            return;
        }

        // ========================================
        // SYNCHRONISATION MOBILE
        // ========================================

        if (path === '/api/sync/status' && method === 'GET') {
            const status = await syncEngine.getStatus();

            sendMobileJSON(res, 200, {
                success: true,
                sync: status,
                mobile: {
                    recommendedSyncInterval: 300000,
                    offlineModeAvailable: true,
                    lastCheck: new Date().toISOString()
                }
            });
            return;
        }

        if (path === '/api/sync/force' && method === 'POST') {
            console.log('📱 Force sync requested from mobile');

            const success = await syncEngine.performFullSync();

            if (success) {
                const status = await syncEngine.getStatus();

                sendMobileJSON(res, 200, {
                    success: true,
                    message: 'Synchronisation forcée terminée',
                    sync: status
                });
            } else {
                sendMobileJSON(res, 500, {
                    success: false,
                    error: 'Échec synchronisation forcée'
                });
            }
            return;
        }

        // ========================================
        // CONTENU ÉDUCATIF MOBILE
        // ========================================

        if (path === '/api/lessons' && method === 'GET') {
            const lessons = [
                {
                    id: 1,
                    title: 'Mathématiques CM2 - Les fractions',
                    subject: 'Mathématiques',
                    level: 'CM2',
                    duration: 30,
                    status: 'available',
                    mobileOptimized: true
                },
                {
                    id: 2,
                    title: 'Français CE2 - La conjugaison',
                    subject: 'Français',
                    level: 'CE2',
                    duration: 25,
                    status: 'available',
                    mobileOptimized: true
                }
            ];

            sendMobileJSON(res, 200, {
                success: true,
                lessons,
                total: lessons.length,
                mobile: {
                    optimized: true,
                    offlineAvailable: true
                }
            });
            return;
        }

        // ========================================
        // CONFIGURATION MOBILE
        // ========================================

        if (path === '/api/config' && method === 'GET') {
            sendMobileJSON(res, 200, {
                success: true,
                config: {
                    app: {
                        version: '1.0.0',
                        name: 'Claudyne',
                        environment: process.env.NODE_ENV || 'development'
                    },
                    api: {
                        baseUrl: 'https://claudyne.com/api',
                        timeout: 15000,
                        retryAttempts: 3
                    },
                    features: {
                        battleRoyale: true,
                        aiMentor: true,
                        familyManagement: true,
                        prixClaudine: true,
                        offlineMode: true,
                        pushNotifications: true
                    },
                    sync: {
                        enabled: true,
                        interval: 300000,
                        offlineSupport: true
                    },
                    cameroon: {
                        locale: 'fr',
                        timezone: 'Africa/Douala',
                        currency: 'XAF',
                        mobilePayments: ['MTN', 'Orange']
                    }
                }
            });
            return;
        }

        // ========================================
        // ROUTE NON TROUVÉE
        // ========================================

        sendMobileJSON(res, 404, {
            success: false,
            error: 'Endpoint non trouvé',
            path: path,
            method: method,
            mobile: true
        });

    } catch (error) {
        console.error('❌ Mobile Server Error:', error);
        sendMobileJSON(res, 500, {
            success: false,
            error: 'Erreur serveur interne',
            mobile: true
        });
    }
});

// Démarrage serveur
server.listen(PORT, () => {
    console.log('📱 ============================================');
    console.log('   SERVEUR API MOBILE CLAUDYNE');
    console.log('📱 ============================================');
    console.log('');
    console.log(`✅ API Mobile disponible sur port ${PORT}`);
    console.log(`🌐 Endpoints mobiles:`);
    console.log(`   GET  http://localhost:${PORT}/api/ping`);
    console.log(`   POST http://localhost:${PORT}/api/auth/login`);
    console.log(`   GET  http://localhost:${PORT}/api/sync/status`);
    console.log(`   POST http://localhost:${PORT}/api/sync/force`);
    console.log(`   GET  http://localhost:${PORT}/api/lessons`);
    console.log(`   GET  http://localhost:${PORT}/api/config`);
    console.log('');
    console.log('🔄 Synchronisation JSON ↔ PostgreSQL active');
    console.log('📱 Optimisé pour applications mobiles');
    console.log('👨‍👩‍👧‍👦 En hommage à Meffo Mehtah Tchandjio Claudine');
    console.log('');
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`❌ Le port ${PORT} est déjà utilisé.`);
        console.log('💡 Solutions:');
        console.log(`   • Arrêtez le processus existant: netstat -ano | findstr :${PORT}`);
        console.log('   • Ou changez MOBILE_PORT dans .env');
    } else {
        console.log('❌ Erreur serveur mobile:', err.message);
    }
});

// Gestion gracieuse de l'arrêt
process.on('SIGINT', () => {
    console.log('\n🛑 Arrêt du serveur mobile Claudyne...');
    server.close(() => {
        console.log('✅ Serveur mobile arrêté proprement.');
        process.exit(0);
    });
});

module.exports = server;