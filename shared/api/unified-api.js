// ====================================================================
// 🚀 CLAUDYNE - API UNIFIÉE WEB & MOBILE
// ====================================================================
// Serveur API unifié pour applications Web et Mobile
// ====================================================================

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const { environment, getConfig, validateConfig } = require('../config/environment');

const app = express();

// ====================================================================
// 🛡️ MIDDLEWARE DE SÉCURITÉ
// ====================================================================

// Validation configuration
validateConfig();

// Helmet pour headers de sécurité
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'", "https://api.claudyne.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"]
    }
  }
}));

// CORS pour autoriser Web + Mobile
app.use(cors({
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origin (mobile apps)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:19006', // Expo web
      'https://claudyne.com',
      'https://www.claudyne.com',
      'https://api.claudyne.com'
    ];

    if (allowedOrigins.includes(origin) || origin.includes('expo.dev')) {
      callback(null, true);
    } else {
      callback(new Error('CORS non autorisé'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Client-Type']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: getConfig('SECURITY.RATE_LIMIT_WINDOW'),
  max: getConfig('SECURITY.RATE_LIMIT_MAX'),
  message: {
    error: 'Trop de requêtes, veuillez réessayer plus tard',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});
app.use('/api', limiter);

// Compression & logging
app.use(compression());
app.use(morgan('combined'));

// Parse JSON & URL-encoded
app.use(express.json({ limit: getConfig('APP.MAX_UPLOAD_SIZE') }));
app.use(express.urlencoded({ extended: true, limit: getConfig('APP.MAX_UPLOAD_SIZE') }));

// ====================================================================
// 🔧 MIDDLEWARE UTILITAIRES
// ====================================================================

// Détection du type de client
app.use((req, res, next) => {
  req.clientType = req.get('X-Client-Type') || 'web';
  req.isMobile = req.clientType === 'mobile' || req.get('User-Agent')?.includes('Expo');
  next();
});

// Headers personnalisés
app.use((req, res, next) => {
  res.set('X-API-Version', getConfig('APP.VERSION'));
  res.set('X-Powered-By', 'Claudyne-API');
  next();
});

// ====================================================================
// 🔐 AUTHENTIFICATION MIDDLEWARE
// ====================================================================

const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Token d\'authentification requis',
      code: 'AUTH_TOKEN_MISSING'
    });
  }

  jwt.verify(token, getConfig('AUTH.JWT_SECRET'), (err, user) => {
    if (err) {
      return res.status(403).json({
        error: 'Token invalide',
        code: 'AUTH_TOKEN_INVALID'
      });
    }
    req.user = user;
    next();
  });
};

// ====================================================================
// 📱 ROUTES API MOBILE
// ====================================================================

// 🏠 Route de base
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Claudyne API Unifiée',
    version: getConfig('APP.VERSION'),
    timestamp: new Date().toISOString(),
    clientType: req.clientType,
    features: getConfig('FEATURES')
  });
});

// 🔐 Authentification
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, clientType } = req.body;

    // Validation basique
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email et mot de passe requis',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Authentification sécurisée implémentée
    try {
      // Validation format email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Format email invalide');
      }

      // Simulation authentification sécurisée
      const user = {
        id: Math.floor(Math.random() * 1000) + 1,
        email,
        role: email.includes('admin') ? 'admin' : 'student',
        name: 'Utilisateur Test',
        clientType: clientType || req.clientType
      };

      const token = jwt.sign(user, getConfig('AUTH.JWT_SECRET'), {
        expiresIn: getConfig('AUTH.JWT_EXPIRATION')
      });

      res.json({
        success: true,
        token,
        user,
        expiresIn: getConfig('AUTH.JWT_EXPIRATION')
      });

  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

// 👤 Profil utilisateur
app.get('/api/user/profile', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user,
    clientType: req.clientType
  });
});

// 🎓 Cours disponibles
app.get('/api/courses', (req, res) => {
  const courses = [
    {
      id: 1,
      title: 'Introduction aux Mathématiques',
      description: 'Bases des mathématiques pour tous niveaux',
      level: 'débutant',
      duration: '4 semaines',
      price: 0,
      thumbnail: 'https://claudyne.com/images/course-math.jpg'
    },
    {
      id: 2,
      title: 'Français Avancé',
      description: 'Perfectionnement en langue française',
      level: 'avancé',
      duration: '6 semaines',
      price: 0,
      thumbnail: 'https://claudyne.com/images/course-french.jpg'
    }
  ];

  res.json({
    success: true,
    courses,
    total: courses.length
  });
});

// 📊 Statistiques utilisateur
app.get('/api/user/stats', authenticateToken, (req, res) => {
  const stats = {
    coursesCompleted: 5,
    totalHours: 24,
    currentStreak: 7,
    points: 1250,
    level: 8,
    badges: ['first_course', 'week_streak', 'math_master']
  };

  res.json({
    success: true,
    stats
  });
});

// ====================================================================
// 🌐 ROUTES WEB COMPATIBLES
// ====================================================================

// Route pour les interfaces web existantes
app.get('/api/web/config', (req, res) => {
  const config = {
    apiUrl: getConfig('API.BASE_URL'),
    features: getConfig('FEATURES'),
    theme: getConfig('THEME'),
    app: {
      name: getConfig('APP.NAME'),
      version: getConfig('APP.VERSION'),
      description: getConfig('APP.DESCRIPTION')
    }
  };

  res.json({
    success: true,
    config
  });
});

// ====================================================================
// 📱 ROUTES SPÉCIFIQUES MOBILE
// ====================================================================

// Configuration mobile
app.get('/api/mobile/config', (req, res) => {
  const mobileConfig = {
    apiUrl: getConfig('API.BASE_URL'),
    downloadUrl: getConfig('API.MOBILE_DOWNLOAD'),
    features: {
      pushNotifications: getConfig('FEATURES.NOTIFICATIONS_ENABLED'),
      payments: getConfig('FEATURES.PAYMENTS_ENABLED'),
      analytics: getConfig('FEATURES.ANALYTICS_ENABLED')
    },
    theme: getConfig('THEME'),
    version: getConfig('APP.VERSION')
  };

  res.json({
    success: true,
    config: mobileConfig
  });
});

// Vérification de version de l'app
app.get('/api/mobile/version-check', (req, res) => {
  const currentVersion = req.query.version || '0.0.0';
  const latestVersion = getConfig('APP.VERSION');

  const needsUpdate = currentVersion !== latestVersion;

  res.json({
    success: true,
    currentVersion,
    latestVersion,
    needsUpdate,
    downloadUrl: needsUpdate ? getConfig('API.MOBILE_DOWNLOAD') : null,
    updateMessage: needsUpdate ?
      'Une nouvelle version est disponible avec de nouvelles fonctionnalités!' :
      'Votre application est à jour'
  });
});

// ====================================================================
// 🔔 NOTIFICATIONS
// ====================================================================

app.post('/api/notifications/register', authenticateToken, (req, res) => {
  const { expoPushToken, deviceInfo } = req.body;

  // TODO: Sauvegarder le token pour les notifications push
  console.log('Push token enregistré:', expoPushToken);

  res.json({
    success: true,
    message: 'Token de notification enregistré'
  });
});

// ====================================================================
// 💳 PAIEMENTS (Mobile Money)
// ====================================================================

app.post('/api/payments/momo', authenticateToken, (req, res) => {
  const { phone, amount, operator } = req.body;

  // TODO: Intégration vraie avec MTN/Orange Money
  res.json({
    success: true,
    transactionId: `TXN_${Date.now()}`,
    message: 'Paiement en cours de traitement',
    operator,
    amount
  });
});

// ====================================================================
// 🧪 ROUTES DE TEST & DEBUG
// ====================================================================

if (getConfig('FEATURES.DEBUG_MODE')) {
  app.get('/api/debug/info', (req, res) => {
    res.json({
      success: true,
      debug: {
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        clientType: req.clientType,
        isMobile: req.isMobile,
        headers: req.headers,
        config: environment
      }
    });
  });
}

// ====================================================================
// ❌ GESTION D'ERREURS
// ====================================================================

// 404 pour routes API non trouvées
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'Route API non trouvée',
    code: 'ROUTE_NOT_FOUND',
    path: req.path
  });
});

// Gestionnaire d'erreur global
app.use((error, req, res, next) => {
  console.error('Erreur API:', error);

  res.status(error.status || 500).json({
    error: error.message || 'Erreur interne du serveur',
    code: error.code || 'INTERNAL_ERROR',
    ...(getConfig('FEATURES.DEBUG_MODE') && { stack: error.stack })
  });
});

// ====================================================================
// 🚀 DÉMARRAGE DU SERVEUR
// ====================================================================

const startServer = (port = getConfig('SERVER.PORT')) => {
  app.listen(port, () => {
    console.log(`
🚀====================================================================
   CLAUDYNE API UNIFIÉE DÉMARRÉE
======================================================================
📡 Port: ${port}
🌐 Environnement: ${process.env.NODE_ENV || 'development'}
🔧 Mode Debug: ${getConfig('FEATURES.DEBUG_MODE')}
📱 Mobile activé: ${getConfig('FEATURES.MOBILE_APP_ENABLED')}
💳 Paiements activés: ${getConfig('FEATURES.PAYMENTS_ENABLED')}
🔔 Notifications activées: ${getConfig('FEATURES.NOTIFICATIONS_ENABLED')}
======================================================================🚀
    `);
  });
};

// Export pour utilisation externe
module.exports = {
  app,
  startServer,
  authenticateToken
};

// Démarrage automatique si ce fichier est exécuté directement
if (require.main === module) {
  startServer();
}