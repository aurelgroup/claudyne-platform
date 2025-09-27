/**
 * CLAUDYNE PRODUCTION SERVER
 * Serveur expert optimisé pour production Cameroun
 * En hommage à Meffo Mehtah Tchandjio Claudine
 */

const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');

// Configuration et middleware
const config = require('./backend/config/production');
const ProductionMiddleware = require('./backend/middleware/production');
const productionEndpoints = require('./backend/production-endpoints');
const { db } = require('./backend/database');

class ClaudyneProductionServer {
    constructor() {
        this.app = express();
        this.server = null;
        this.config = config;
        this.middleware = new ProductionMiddleware(config);

        this.setupApp();
    }

    // ================================
    // CONFIGURATION APPLICATION
    // ================================
    setupApp() {
        console.log('🚀 === CLAUDYNE PRODUCTION SERVER ===');
        console.log(`🎓 Version: ${this.config.app.version}`);
        console.log(`🇨🇲 Optimisé pour: ${this.config.cameroon.defaultRegion}, Cameroun`);

        // Trust proxy (Nginx)
        this.app.set('trust proxy', 1);

        // Parse JSON avec limite adaptée mobile
        this.app.use(express.json({
            limit: '10mb',
            verify: (req, res, buf) => {
                req.rawBody = buf;
            }
        }));

        this.app.use(express.urlencoded({
            extended: true,
            limit: '10mb'
        }));

        // Appliquer middlewares production
        this.middleware.apply(this.app);

        // Routes API
        this.setupRoutes();

        // Gestion erreurs (doit être en dernier)
        this.middleware.applyErrorHandling(this.app);
    }

    // ================================
    // CONFIGURATION ROUTES
    // ================================
    setupRoutes() {
        console.log('📡 Configuration des routes production...');

        // Health checks optimisés
        this.setupHealthRoutes();

        // API de base
        this.setupBaseRoutes();

        // Endpoints de production
        this.setupProductionEndpoints();

        // Routes statiques optimisées
        this.setupStaticRoutes();

        console.log('✅ Routes production configurées');
    }

    setupHealthRoutes() {
        // Health check principal
        this.app.get('/health', async (req, res) => {
            const health = await this.getSystemHealth();
            res.status(health.status === 'healthy' ? 200 : 503).json(health);
        });

        // Ping simple
        this.app.get('/ping', (req, res) => {
            res.json({
                pong: true,
                timestamp: new Date().toISOString(),
                server: 'claudyne-production'
            });
        });

        // Health détaillé
        this.app.get('/health/detailed', async (req, res) => {
            const detailed = await this.getDetailedHealth();
            res.json(detailed);
        });
    }

    setupBaseRoutes() {
        // Route racine
        this.app.get('/', (req, res) => {
            res.json({
                message: 'Claudyne Production API 🎓',
                version: this.config.app.version,
                tribute: 'En hommage à Meffo Mehtah Tchandjio Claudine',
                mission: 'La force du savoir en héritage',
                country: 'Cameroun 🇨🇲',
                environment: 'production',
                timestamp: new Date().toISOString(),
                endpoints: {
                    health: '/health',
                    api: '/api',
                    mobile: '/mobile-api',
                    docs: '/api-docs'
                }
            });
        });

        // Base API
        this.app.get('/api', (req, res) => {
            res.json({
                api: 'Claudyne Production API',
                version: this.config.app.version,
                environment: 'production',
                database: (db.isConnected && db.isConnected()) ? 'PostgreSQL' : 'JSON Fallback',
                features: [
                    'Authentification JWT',
                    'Rate Limiting',
                    'Compression',
                    'Mobile Optimized',
                    'Cameroon Localized'
                ],
                endpoints: this.config.claudyne?.production?.endpoints || []
            });
        });
    }

    setupProductionEndpoints() {
        console.log('🔧 Configuration endpoints production...');

        // Authentification
        this.app.post('/api/auth/login', this.handleAuth.bind(this));
        this.app.post('/api/auth/register', this.handleRegister.bind(this));

        // Familles
        this.app.get('/api/families/profile', this.handleFamilyProfile.bind(this));
        this.app.get('/api/families/dashboard', this.handleFamilyDashboard.bind(this));

        // Étudiants
        this.app.get('/api/students', this.handleStudents.bind(this));
        this.app.get('/api/students/:id/progress', this.handleStudentProgress.bind(this));

        // Matières et leçons
        this.app.get('/api/subjects', this.handleSubjects.bind(this));
        this.app.get('/api/subjects/:id/lessons', this.handleLessons.bind(this));
        this.app.get('/api/lessons/:id', this.handleLessonContent.bind(this));
        this.app.post('/api/lessons/:id/complete', this.handleLessonComplete.bind(this));

        // Mobile API
        this.app.get('/mobile-api/ping', (req, res) => {
            res.json({
                mobile_api: 'active',
                optimized_for: ['2G', '3G', 'Mobile'],
                compression: true,
                timestamp: new Date().toISOString()
            });
        });
    }

    setupStaticRoutes() {
        // Servir fichiers statiques avec cache optimisé
        const staticOptions = {
            maxAge: '1y',
            etag: true,
            lastModified: true,
            setHeaders: (res, path) => {
                if (path.includes('mobile')) {
                    res.set('X-Mobile-Optimized', 'true');
                }
            }
        };

        this.app.use('/static', express.static(path.join(__dirname, 'public'), staticOptions));
        this.app.use('/download', express.static(path.join(__dirname, 'downloads'), staticOptions));
    }

    // ================================
    // HANDLERS PRODUCTION
    // ================================
    async handleAuth(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email et mot de passe requis'
                });
            }

            const user = await db.authenticateUser(email, password);

            if (user) {
                await db.updateLastLogin(user.id);

                res.json({
                    success: true,
                    message: `Bienvenue ${user.firstname} ! 🎉`,
                    data: {
                        user: {
                            id: user.id,
                            firstName: user.firstname,
                            lastName: user.lastname,
                            email: user.email,
                            role: user.role
                        },
                        token: this.generateJWT(user),
                        expiresIn: this.config.security.jwt.expiresIn
                    }
                });
            } else {
                res.status(401).json({
                    success: false,
                    message: 'Identifiants incorrects'
                });
            }
        } catch (error) {
            console.error('Erreur authentification:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur serveur'
            });
        }
    }

    async handleRegister(req, res) {
        try {
            const { firstName, lastName, email, password } = req.body;

            const newUser = await db.createUser({
                firstname: firstName,
                lastname: lastName,
                email,
                password,
                role: 'PARENT'
            });

            res.status(201).json({
                success: true,
                message: `Compte créé avec succès ! Bienvenue ${firstName} ! 🎉`,
                data: {
                    user: {
                        id: newUser.id,
                        firstName: newUser.firstname,
                        lastName: newUser.lastname,
                        email: newUser.email
                    }
                }
            });
        } catch (error) {
            console.error('Erreur inscription:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la création du compte'
            });
        }
    }

    async handleFamilyProfile(req, res) {
        try {
            const familyId = req.query.family_id || 'default';
            const profile = await productionEndpoints.getFamilyProfile(familyId);

            res.json({
                success: true,
                data: profile
            });
        } catch (error) {
            console.error('Erreur profil famille:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération du profil'
            });
        }
    }

    async handleFamilyDashboard(req, res) {
        try {
            const familyId = req.query.family_id || 'default';
            const dashboard = await productionEndpoints.getFamilyDashboard(familyId);

            res.json({
                success: true,
                data: dashboard
            });
        } catch (error) {
            console.error('Erreur dashboard famille:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération du dashboard'
            });
        }
    }

    async handleStudents(req, res) {
        try {
            const familyId = req.query.family_id || 'default';
            const students = await productionEndpoints.getStudentsByFamily(familyId);

            res.json({
                success: true,
                data: { students }
            });
        } catch (error) {
            console.error('Erreur étudiants:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des étudiants'
            });
        }
    }

    async handleStudentProgress(req, res) {
        try {
            const studentId = req.params.id;
            const progress = await productionEndpoints.getStudentProgress(studentId);

            res.json({
                success: true,
                data: progress
            });
        } catch (error) {
            console.error('Erreur progrès étudiant:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération du progrès'
            });
        }
    }

    async handleSubjects(req, res) {
        try {
            const level = req.query.level || '6EME';
            const subjects = await productionEndpoints.getSubjectsByLevel(level);

            res.json({
                success: true,
                data: { subjects }
            });
        } catch (error) {
            console.error('Erreur matières:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des matières'
            });
        }
    }

    async handleLessons(req, res) {
        try {
            const subjectCode = req.params.id;
            const level = req.query.level || '6EME';
            const lessons = await productionEndpoints.getLessonsBySubject(subjectCode, level);

            res.json({
                success: true,
                data: { lessons }
            });
        } catch (error) {
            console.error('Erreur leçons:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des leçons'
            });
        }
    }

    async handleLessonContent(req, res) {
        try {
            const lessonId = req.params.id;
            const studentId = req.query.student_id;
            const content = await productionEndpoints.getLessonContent(lessonId, studentId);

            res.json({
                success: true,
                data: content
            });
        } catch (error) {
            console.error('Erreur contenu leçon:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération du contenu'
            });
        }
    }

    async handleLessonComplete(req, res) {
        try {
            const lessonId = req.params.id;
            const { studentId, score, studyTimeMinutes, answers } = req.body;

            const progressData = {
                score: score || 0,
                status: 'COMPLETED',
                studyTimeMinutes: studyTimeMinutes || 0,
                answers: answers || []
            };

            const progressId = await productionEndpoints.updateLessonProgress(studentId, lessonId, progressData);

            res.json({
                success: true,
                data: {
                    progressId,
                    message: 'Leçon terminée avec succès ! 🎉',
                    pointsEarned: score || 0
                }
            });
        } catch (error) {
            console.error('Erreur complétion leçon:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la complétion de la leçon'
            });
        }
    }

    // ================================
    // UTILITIES
    // ================================
    generateJWT(user) {
        const jwt = require('jsonwebtoken');
        return jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role
            },
            this.config.security.jwt.secret,
            {
                expiresIn: this.config.security.jwt.expiresIn,
                algorithm: this.config.security.jwt.algorithm
            }
        );
    }

    async getSystemHealth() {
        const startTime = Date.now();

        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: 'production',
            version: this.config.app.version,
            services: {
                api: 'operational',
                database: (db.isConnected && db.isConnected()) ? 'operational' : 'fallback',
                memory: {
                    used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                    total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
                }
            },
            responseTime: Date.now() - startTime
        };

        // Déterminer status global
        if (!(db.isConnected && db.isConnected())) {
            health.status = 'degraded';
        }

        return health;
    }

    async getDetailedHealth() {
        const health = await this.getSystemHealth();

        return {
            ...health,
            config: {
                timezone: this.config.app.timezone,
                locale: this.config.app.locale,
                compression: true,
                rateLimit: true,
                security: true
            },
            cameroon: {
                currency: this.config.cameroon.currency,
                region: this.config.cameroon.defaultRegion,
                educationLevels: this.config.cameroon.educationLevels.length,
                subjects: this.config.cameroon.subjects.length
            }
        };
    }

    // ================================
    // DÉMARRAGE SERVEUR
    // ================================
    start() {
        const port = this.config.app.port;

        this.server = http.createServer(this.app);

        this.server.listen(port, '0.0.0.0', () => {
            console.log('');
            console.log('🎓 ============================================');
            console.log('   CLAUDYNE PRODUCTION SERVER STARTED');
            console.log('🎓 ============================================');
            console.log('');
            console.log(`✅ Serveur production démarré sur le port ${port}`);
            console.log(`🌐 URL: http://localhost:${port}`);
            console.log(`🩺 Health: http://localhost:${port}/health`);
            console.log(`📡 API: http://localhost:${port}/api`);
            console.log(`📱 Mobile: http://localhost:${port}/mobile-api`);
            console.log('');
            console.log(`🇨🇲 Optimisé pour: ${this.config.cameroon.defaultRegion}, Cameroun`);
            console.log(`🗄️ Base de données: ${db.isConnected ? db.isConnected() ? 'PostgreSQL' : 'JSON Fallback' : 'JSON Fallback'}`);
            console.log(`🔒 Sécurité: JWT + Rate Limiting + Helmet`);
            console.log(`⚡ Performance: Compression + Cache + Mobile Optimized`);
            console.log('');
            console.log('🏆 En hommage à Meffo Mehtah Tchandjio Claudine');
            console.log('💚 La force du savoir en héritage');
            console.log('');
        });

        // Gestion gracieuse arrêt
        process.on('SIGTERM', this.shutdown.bind(this));
        process.on('SIGINT', this.shutdown.bind(this));

        return this.server;
    }

    shutdown() {
        console.log('\n👋 Arrêt gracieux de Claudyne Production...');

        if (this.server) {
            this.server.close(() => {
                console.log('✅ Serveur fermé');
                process.exit(0);
            });
        }
    }
}

// Démarrage si appelé directement
if (require.main === module) {
    const server = new ClaudyneProductionServer();
    server.start();
}

module.exports = ClaudyneProductionServer;