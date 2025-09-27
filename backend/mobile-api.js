/**
 * API MOBILE CLAUDYNE - Endpoints optimisés mobile
 * Intégration complète avec système de synchronisation
 * En hommage à Meffo Mehtah Tchandjio Claudine
 */

const express = require('express');
const { db, syncEngine } = require('./database');

const router = express.Router();

// ========================================
// MIDDLEWARE MOBILE
// ========================================

const mobileMiddleware = (req, res, next) => {
    // Identifier les requêtes mobiles
    req.isMobile = req.headers['x-client-type'] === 'mobile' ||
                   req.headers['user-agent']?.includes('Claudyne-Mobile');

    // Headers optimisés mobile
    res.setHeader('X-Powered-By', 'Claudyne-Mobile-API');
    res.setHeader('Cache-Control', 'private, max-age=300');

    if (req.isMobile) {
        console.log(`📱 Mobile Request: ${req.method} ${req.path}`);
    }

    next();
};

router.use(mobileMiddleware);

// ========================================
// PING ET STATUS
// ========================================

router.get('/ping', async (req, res) => {
    try {
        const syncStatus = await syncEngine.getStatus();

        res.json({
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
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Status check failed',
            message: error.message
        });
    }
});

// ========================================
// AUTHENTIFICATION MOBILE
// ========================================

router.post('/auth/login', async (req, res) => {
    try {
        const { email, password, clientType } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email et mot de passe requis'
            });
        }

        // Authentification via système hybride
        const user = await db.authenticateUser(email, password);

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Identifiants invalides'
            });
        }

        // Mettre à jour dernière connexion
        await db.updateLastLogin(user.id);

        // Générer token JWT (simulation pour ce POC)
        const token = `claudyne_mobile_${user.id}_${Date.now()}`;

        // Log connexion mobile
        console.log(`📱 Mobile Login: ${user.email} (${user.role})`);

        res.json({
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
        res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la connexion'
        });
    }
});

router.post('/auth/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName, phone, role, userType } = req.body;

        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({
                success: false,
                error: 'Champs requis manquants'
            });
        }

        // Vérifier si utilisateur existe
        const existingUser = await db.findUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'Un compte existe déjà avec cet email'
            });
        }

        // Créer nouvel utilisateur
        const userData = {
            email,
            password, // En production, hasher avec bcrypt
            firstname: firstName,
            lastname: lastName,
            phone,
            role: role || 'PARENT',
            usertype: userType || 'MANAGER'
        };

        const newUser = await db.createUser(userData);

        if (!newUser) {
            throw new Error('Échec création utilisateur');
        }

        console.log(`📱 Mobile Register: ${email} (${role || 'PARENT'})`);

        res.status(201).json({
            success: true,
            message: 'Compte créé avec succès',
            user: {
                id: newUser.id,
                email: newUser.email,
                firstName: newUser.firstname,
                lastName: newUser.lastname,
                role: newUser.role,
                userType: newUser.usertype
            }
        });

    } catch (error) {
        console.error('❌ Mobile Register Error:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de l\'inscription'
        });
    }
});

// ========================================
// SYNCHRONISATION MOBILE
// ========================================

router.get('/sync/status', async (req, res) => {
    try {
        const status = await syncEngine.getStatus();

        res.json({
            success: true,
            sync: status,
            mobile: {
                recommendedSyncInterval: 300000, // 5 minutes
                offlineModeAvailable: true,
                lastCheck: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Erreur status synchronisation'
        });
    }
});

router.post('/sync/force', async (req, res) => {
    try {
        console.log('📱 Force sync requested from mobile');

        const success = await syncEngine.performFullSync();

        if (success) {
            const status = await syncEngine.getStatus();

            res.json({
                success: true,
                message: 'Synchronisation forcée terminée',
                sync: status
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Échec synchronisation forcée'
            });
        }
    } catch (error) {
        console.error('❌ Force sync error:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur synchronisation forcée'
        });
    }
});

// ========================================
// DONNÉES UTILISATEUR MOBILE
// ========================================

router.get('/users/profile', async (req, res) => {
    try {
        // Simulation auth token (en production, vérifier JWT)
        const userId = req.headers.authorization?.split('_')[2];

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Token requis'
            });
        }

        // Récupérer profil depuis système hybride
        // Pour ce POC, retourner données mocké
        res.json({
            success: true,
            user: {
                id: parseInt(userId),
                email: 'f.nono@projexts.ca',
                firstName: 'François',
                lastName: 'Nono',
                phone: '+237695123456',
                role: 'PARENT',
                userType: 'MANAGER',
                isActive: true,
                createdAt: '2025-09-26T12:57:16.006Z',
                lastLogin: new Date().toISOString()
            },
            family: {
                members: 1,
                students: 0,
                subscription: 'free'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Erreur récupération profil'
        });
    }
});

// ========================================
// CONTENU ÉDUCATIF MOBILE
// ========================================

router.get('/lessons', async (req, res) => {
    try {
        // Contenu optimisé mobile
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

        res.json({
            success: true,
            lessons,
            total: lessons.length,
            mobile: {
                optimized: true,
                offlineAvailable: true
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Erreur récupération leçons'
        });
    }
});

// ========================================
// BATTLE ROYALE MOBILE
// ========================================

router.get('/battles', async (req, res) => {
    try {
        const battles = [
            {
                id: 1,
                title: 'Battle Maths CM2',
                subject: 'Mathématiques',
                level: 'CM2',
                participants: 12,
                maxParticipants: 20,
                status: 'open',
                startTime: new Date(Date.now() + 3600000).toISOString(),
                duration: 1800000, // 30 minutes
                mobileCompatible: true
            }
        ];

        res.json({
            success: true,
            battles,
            mobile: {
                realTimeSupported: true,
                notificationsEnabled: true
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Erreur récupération battles'
        });
    }
});

// ========================================
// CONFIGURATION MOBILE
// ========================================

router.get('/config', async (req, res) => {
    try {
        res.json({
            success: true,
            config: {
                app: {
                    version: '1.0.0',
                    name: 'Claudyne',
                    environment: process.env.NODE_ENV || 'development'
                },
                api: {
                    baseUrl: req.isMobile ? 'https://claudyne.com/api' : 'http://localhost:3001/api',
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
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Erreur récupération configuration'
        });
    }
});

// ========================================
// EXPORT
// ========================================

module.exports = router;