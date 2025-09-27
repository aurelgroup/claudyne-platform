/**
 * 🎓 CLAUDYNE SERVEUR UNIFIÉ
 * La force du savoir en héritage
 * Production-ready server for Cameroonian families
 */

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const path = require('path');

// Configuration et services
const config = require('./backend/config/production');
const { db } = require('./backend/database');
const productionEndpoints = require('./backend/production-endpoints');

// 🔒 SECURITY: CORS sécurisé pour production
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://claudyne.com',
      'https://www.claudyne.com',
      ...(process.env.NODE_ENV !== 'production' ? [
        'http://localhost:3000',
        'http://127.0.0.1:3000'
      ] : [])
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS: Origine non autorisée'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // Cache preflight 24h
};

// 🔒 SECURITY: Rate limiting adapté Cameroun
const createRateLimit = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message: { success: false, message },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path.includes('/health')
});

// 🛡️ SECURITY: Helmet sécurité headers
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:", "https://i.ibb.co"],
      connectSrc: ["'self'", "https://claudyne.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
};

class ClaudyneServer {
  constructor() {
    this.app = express();
    this.server = null;
    this.setupApp();
  }

  setupApp() {
    console.log('🎓 === CLAUDYNE SERVEUR UNIFIÉ ===');
    console.log('🇨🇲 Optimisé pour les familles camerounaises');

    // Trust proxy (Nginx en production)
    this.app.set('trust proxy', 1);

    // 🔒 SÉCURITÉ MIDDLEWARE
    this.app.use(helmet(helmetConfig));
    this.app.use(cors(corsOptions));

    // Rate limiting global
    this.app.use(createRateLimit(15 * 60 * 1000, 100, 'Trop de requêtes, réessayez dans 15 minutes'));

    // Rate limiting API strict
    this.app.use('/api/', createRateLimit(5 * 60 * 1000, 50, 'Trop de requêtes API, réessayez dans 5 minutes'));

    // ⚡ PERFORMANCE MIDDLEWARE
    this.app.use(compression({
      level: 6,
      threshold: 1024,
      filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
      }
    }));

    // 🌍 OPTIMISATIONS CAMEROUN
    this.app.use((req, res, next) => {
      // Détection réseau lent
      const connection = req.headers['x-connection'] || 'unknown';
      if (['2g', '3g', 'slow-2g'].includes(connection.toLowerCase())) {
        res.locals.networkOptimized = true;
        res.set('X-Network-Optimized', 'true');
      }

      // Headers Cameroun
      res.set('X-Optimized-For', 'Cameroon');
      res.set('X-Currency', 'XAF');
      res.set('X-Timezone', 'Africa/Douala');

      next();
    });

    // Parse JSON avec limite mobile
    this.app.use(express.json({
      limit: res => res.locals.networkOptimized ? '500kb' : '10mb'
    }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // 📡 ROUTES SETUP
    this.setupRoutes();

    // 🚨 ERROR HANDLING
    this.setupErrorHandling();
  }

  setupRoutes() {
    console.log('📡 Configuration routes unifiées...');

    // 🩺 HEALTH CHECKS
    this.app.get('/health', this.healthCheck.bind(this));
    this.app.get('/api/health', this.healthCheck.bind(this));
    this.app.get('/ping', (req, res) => res.json({ pong: true, timestamp: new Date().toISOString() }));

    // 🏠 ROUTE RACINE
    this.app.get('/', (req, res) => {
      res.json({
        message: 'Claudyne Production API 🎓',
        version: config.app.version,
        tribute: 'En hommage à Meffo Mehtah Tchandjio Claudine',
        mission: 'La force du savoir en héritage',
        country: 'Cameroun 🇨🇲',
        endpoints: {
          health: '/health',
          api: '/api',
          mobile: '/mobile-api',
          frontend: 'https://claudyne.com'
        }
      });
    });

    // 🔐 AUTHENTIFICATION
    this.app.post('/api/auth/login', this.authenticateUser.bind(this));
    this.app.post('/api/auth/register', this.registerUser.bind(this));

    // 👨‍👩‍👧‍👦 FAMILLES
    this.app.get('/api/families/profile', this.authenticateToken, this.getFamilyProfile.bind(this));
    this.app.get('/api/families/dashboard', this.authenticateToken, this.getFamilyDashboard.bind(this));

    // 🎓 ÉTUDIANTS
    this.app.get('/api/students', this.authenticateToken, this.getStudents.bind(this));
    this.app.get('/api/students/:id/progress', this.authenticateToken, this.getStudentProgress.bind(this));

    // 📚 CONTENU ÉDUCATIF
    this.app.get('/api/subjects', this.getSubjects.bind(this));
    this.app.get('/api/subjects/:id/lessons', this.getLessons.bind(this));
    this.app.get('/api/lessons/:id', this.getLessonContent.bind(this));
    this.app.post('/api/lessons/:id/complete', this.authenticateToken, this.completLesson.bind(this));

    // 📱 MOBILE API OPTIMISÉE
    this.app.use('/mobile-api', this.mobileOptimization);
    this.app.get('/mobile-api/ping', (req, res) => {
      res.json({
        mobile_api: 'active',
        optimized_for: ['2G', '3G', 'Mobile Cameroun'],
        compression: true,
        timestamp: new Date().toISOString()
      });
    });

    // 🗂️ FICHIERS STATIQUES optimisés
    this.app.use('/static', express.static(path.join(__dirname, 'public'), {
      maxAge: '1y',
      etag: true,
      lastModified: true,
      setHeaders: (res, path) => {
        if (path.includes('mobile')) {
          res.set('X-Mobile-Optimized', 'true');
        }
      }
    }));

    // 🔐 ROUTE ADMIN SÉCURISÉE (URL obfusquée contre attaques)
    this.app.get('/admin-secure-k7m9x4n2p8w5z1c6', (req, res) => {
      res.sendFile(path.join(__dirname, 'admin-interface.html'));
    });

    // Redirect admin classique vers route sécurisée
    this.app.get('/admin', (req, res) => {
      res.redirect('/admin-secure-k7m9x4n2p8w5z1c6');
    });

    console.log('✅ Routes unifiées configurées');
  }

  // 🔐 MIDDLEWARE AUTHENTIFICATION JWT
  authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'authentification requis'
      });
    }

    jwt.verify(token, config.security.jwt.secret, (err, user) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: 'Token invalide ou expiré'
        });
      }
      req.user = user;
      next();
    });
  }

  // 📱 MIDDLEWARE OPTIMISATION MOBILE
  mobileOptimization(req, res, next) {
    // Headers mobiles optimisés
    res.set('X-Mobile-Optimized', 'true');
    res.set('Vary', 'User-Agent');

    // Cache plus long pour mobile (réseau lent)
    res.set('Cache-Control', 'public, max-age=7200');

    // Compression agressive mobile
    if (req.headers['x-connection'] === '2g') {
      res.set('Content-Encoding', 'gzip');
    }

    next();
  }

  // 🩺 HEALTH CHECK INTELLIGENT
  async healthCheck(req, res) {
    const startTime = Date.now();

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: config.app.version,
      services: {
        api: 'operational',
        database: 'checking...',
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
        }
      },
      responseTime: 0
    };

    // Test database
    try {
      if (db.isConnected && db.isConnected()) {
        health.services.database = 'operational';
      } else {
        health.services.database = 'fallback';
        health.status = 'degraded';
      }
    } catch (error) {
      health.services.database = 'offline';
      health.status = 'degraded';
    }

    health.responseTime = Date.now() - startTime;

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  }

  // 🔐 AUTHENTIFICATION UTILISATEUR
  async authenticateUser(req, res) {
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
        const token = jwt.sign(
          { userId: user.id, email: user.email, role: user.role },
          config.security.jwt.secret,
          { expiresIn: config.security.jwt.expiresIn }
        );

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
            token,
            expiresIn: config.security.jwt.expiresIn
          }
        });
      } else {
        res.status(401).json({
          success: false,
          message: 'Identifiants incorrects'
        });
      }
    } catch (error) {
      console.error('❌ Erreur authentification:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  }

  // 👤 INSCRIPTION UTILISATEUR
  async registerUser(req, res) {
    try {
      const { firstName, lastName, email, password } = req.body;

      if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Tous les champs sont requis'
        });
      }

      // Vérifier email existant
      const existingUser = await db.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Un compte avec cet email existe déjà'
        });
      }

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
      console.error('❌ Erreur inscription:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création du compte'
      });
    }
  }

  // 👨‍👩‍👧‍👦 PROFIL FAMILLE
  async getFamilyProfile(req, res) {
    try {
      const profile = await productionEndpoints.getFamilyProfileByUserId(req.user.userId);
      res.json({ success: true, data: profile });
    } catch (error) {
      console.error('❌ Erreur profil famille:', error);
      res.status(500).json({ success: false, message: 'Erreur lors de la récupération du profil' });
    }
  }

  // 📊 DASHBOARD FAMILLE
  async getFamilyDashboard(req, res) {
    try {
      const familyId = req.query.family_id || req.user.familyId || 'default';
      const dashboard = await productionEndpoints.getFamilyDashboard(familyId);
      res.json({ success: true, data: dashboard });
    } catch (error) {
      console.error('❌ Erreur dashboard famille:', error);
      res.status(500).json({ success: false, message: 'Erreur lors de la récupération du dashboard' });
    }
  }

  // 🎓 ÉTUDIANTS
  async getStudents(req, res) {
    try {
      const familyId = req.query.family_id || req.user.familyId || 'default';
      const students = await productionEndpoints.getStudentsByFamily(familyId);
      res.json({ success: true, data: { students } });
    } catch (error) {
      console.error('❌ Erreur étudiants:', error);
      res.status(500).json({ success: false, message: 'Erreur lors de la récupération des étudiants' });
    }
  }

  // 📈 PROGRÈS ÉTUDIANT
  async getStudentProgress(req, res) {
    try {
      const studentId = req.params.id;
      const progress = await productionEndpoints.getStudentProgress(studentId);
      res.json({ success: true, data: progress });
    } catch (error) {
      console.error('❌ Erreur progrès étudiant:', error);
      res.status(500).json({ success: false, message: 'Erreur lors de la récupération du progrès' });
    }
  }

  // 📚 MATIÈRES
  async getSubjects(req, res) {
    try {
      const level = req.query.level || '6EME';
      const subjects = await productionEndpoints.getSubjectsByLevel(level);
      res.json({ success: true, data: { subjects } });
    } catch (error) {
      console.error('❌ Erreur matières:', error);
      res.status(500).json({ success: false, message: 'Erreur lors de la récupération des matières' });
    }
  }

  // 📖 LEÇONS
  async getLessons(req, res) {
    try {
      const subjectCode = req.params.id;
      const level = req.query.level || '6EME';
      const lessons = await productionEndpoints.getLessonsBySubject(subjectCode, level);
      res.json({ success: true, data: { lessons } });
    } catch (error) {
      console.error('❌ Erreur leçons:', error);
      res.status(500).json({ success: false, message: 'Erreur lors de la récupération des leçons' });
    }
  }

  // 📄 CONTENU LEÇON
  async getLessonContent(req, res) {
    try {
      const lessonId = req.params.id;
      const studentId = req.query.student_id;
      const content = await productionEndpoints.getLessonContent(lessonId, studentId);
      res.json({ success: true, data: content });
    } catch (error) {
      console.error('❌ Erreur contenu leçon:', error);
      res.status(500).json({ success: false, message: 'Erreur lors de la récupération du contenu' });
    }
  }

  // ✅ COMPLÉTER LEÇON
  async completLesson(req, res) {
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
      console.error('❌ Erreur complétion leçon:', error);
      res.status(500).json({ success: false, message: 'Erreur lors de la complétion de la leçon' });
    }
  }

  // 🚨 GESTION D'ERREURS GLOBALE
  setupErrorHandling() {
    // 404 Handler
    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        message: `Route non trouvée: ${req.method} ${req.path}`,
        timestamp: new Date().toISOString()
      });
    });

    // Global Error Handler
    this.app.use((err, req, res, next) => {
      console.error('❌ Erreur serveur:', err);

      // CORS Error
      if (err.message.includes('CORS')) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé - CORS'
        });
      }

      const isDev = process.env.NODE_ENV !== 'production';
      res.status(err.status || 500).json({
        success: false,
        message: isDev ? err.message : 'Erreur serveur interne',
        timestamp: new Date().toISOString(),
        ...(isDev && { stack: err.stack })
      });
    });
  }

  // 🚀 DÉMARRAGE SERVEUR
  start() {
    const port = config.app.port || process.env.PORT || 3001;

    this.server = this.app.listen(port, '0.0.0.0', () => {
      console.log('');
      console.log('🎓 ============================================');
      console.log('   CLAUDYNE SERVEUR UNIFIÉ DÉMARRÉ');
      console.log('🎓 ============================================');
      console.log('');
      console.log(`✅ Serveur production sur le port ${port}`);
      console.log(`🌐 URL: http://localhost:${port}`);
      console.log(`🩺 Health: http://localhost:${port}/health`);
      console.log(`📡 API: http://localhost:${port}/api`);
      console.log(`📱 Mobile: http://localhost:${port}/mobile-api`);
      console.log('');
      console.log(`🇨🇲 Optimisé pour: Familles camerounaises`);
      console.log(`🗄️ Base de données: ${db.isConnected && db.isConnected() ? 'PostgreSQL' : 'JSON Fallback'}`);
      console.log(`🔒 Sécurité: JWT + Rate Limiting + Helmet + CORS`);
      console.log(`⚡ Performance: Compression + Cache + Mobile Optimized`);
      console.log('');
      console.log('🏆 En hommage à Meffo Mehtah Tchandjio Claudine');
      console.log('💚 La force du savoir en héritage');
      console.log('');
    });

    // Graceful shutdown
    process.on('SIGTERM', this.shutdown.bind(this));
    process.on('SIGINT', this.shutdown.bind(this));

    return this.server;
  }

  shutdown() {
    console.log('\n👋 Arrêt gracieux de Claudyne...');
    if (this.server) {
      this.server.close(() => {
        console.log('✅ Serveur fermé proprement');
        process.exit(0);
      });
    }
  }
}

// Démarrage si appelé directement
if (require.main === module) {
  const server = new ClaudyneServer();
  server.start();
}

module.exports = ClaudyneServer;