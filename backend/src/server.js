/**
 * Serveur principal Claudyne Backend API
 * La force du savoir en héritage
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const http = require('http');
const socketIo = require('socket.io');

// Import des modules internes
const logger = require('./utils/logger');
const database = require('./config/database');
const routes = require('./routes');
const { initializeWebSocket } = require('./websockets/socketHandler');
const { errorHandler, notFound } = require('./middleware/errorHandlers');
const { authenticate } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);

// Configuration Socket.IO pour Battle Royale
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Configuration CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Has-More']
};

// Middleware de sécurité
app.use(helmet({
  contentSecurityPolicy: false, // Désactivé pour permettre les WebSockets
  crossOriginEmbedderPolicy: false
}));

app.use(compression());
app.use(cors(corsOptions));

// Logging des requêtes
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) }
}));

// Limitation du taux de requêtes (rate limiting)
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: {
    error: 'Trop de requêtes depuis cette adresse IP. Réessayez dans quelques minutes.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Ralentissement progressif
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Commence le ralentissement après 50 requêtes
  delayMs: 500, // Ajoute 500ms de délai par requête excessive
  maxDelayMs: 20000 // Délai maximum de 20 secondes
});

app.use('/api', limiter);
app.use('/api', speedLimiter);

// Parsers pour les requêtes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Fichiers statiques
app.use('/uploads', express.static('public/uploads'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV,
    services: {
      database: 'connected', // À améliorer avec vérification réelle
      redis: 'connected',
      ai_service: 'available'
    },
    message: 'Claudyne API fonctionne correctement - La force du savoir en héritage'
  });
});

// Route de bienvenue
app.get('/', (req, res) => {
  res.json({
    message: 'Bienvenue sur l\\'API Claudyne 🎓',
    subtitle: 'La force du savoir en héritage',
    documentation: '/api/docs',
    health: '/health',
    version: '1.0.0',
    tribute: 'En mémoire de Meffo Mehtah Tchandjio Claudine',
    contact: 'contact@claudyne.com'
  });
});

// Routes principales de l'API
app.use('/api', routes);

// Documentation API (à implémenter avec Swagger)
app.get('/api/docs', (req, res) => {
  res.json({
    message: 'Documentation API Claudyne',
    endpoints: {
      auth: '/api/auth',
      families: '/api/families',
      students: '/api/students',
      subjects: '/api/subjects',
      battles: '/api/battles',
      prix_claudine: '/api/prix-claudine',
      payments: '/api/payments',
      mentor: '/api/mentor',
      admin: '/api/admin'
    },
    websockets: {
      battle_royale: '/socket.io',
      real_time_updates: '/socket.io'
    }
  });
});

// Middleware de gestion des erreurs
app.use(notFound);
app.use(errorHandler);

// Initialisation de Socket.IO pour les fonctionnalités temps réel
initializeWebSocket(io);

// Fonction de démarrage du serveur
async function startServer() {
  try {
    // Test de connexion à la base de données
    await database.authenticate();
    logger.info('✅ Connexion à PostgreSQL établie avec succès');

    // Synchronisation des modèles (uniquement en développement)
    if (process.env.NODE_ENV === 'development') {
      await database.sync({ force: false });
      logger.info('✅ Modèles de base de données synchronisés');
    }

    const PORT = process.env.PORT || 3001;
    
    server.listen(PORT, () => {
      logger.info(`🚀 Serveur Claudyne démarré sur le port ${PORT}`);
      logger.info(`🌍 Environnement: ${process.env.NODE_ENV}`);
      logger.info(`📚 Mode développement: ${process.env.NODE_ENV === 'development'}`);
      logger.info(`🏆 Saison Prix Claudine: ${process.env.PRIX_CLAUDINE_SEASON}`);
      logger.info('💚 La force du savoir en héritage - Claudine 💚');
      
      if (process.env.NODE_ENV === 'development') {
        logger.info(`📖 Documentation: http://localhost:${PORT}/api/docs`);
        logger.info(`🩺 Santé: http://localhost:${PORT}/health`);
      }
    });

  } catch (error) {
    logger.error('❌ Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
}

// Gestion gracieuse de l'arrêt du serveur
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown(signal) {
  logger.info(`🛑 Signal ${signal} reçu. Arrêt gracieux en cours...`);
  
  server.close(async (err) => {
    if (err) {
      logger.error('Erreur lors de l\\'arrêt du serveur HTTP:', err);
      process.exit(1);
    }
    
    try {
      await database.close();
      logger.info('✅ Connexion à la base de données fermée');
      logger.info('👋 Serveur Claudyne arrêté proprement');
      process.exit(0);
    } catch (error) {
      logger.error('Erreur lors de la fermeture de la BDD:', error);
      process.exit(1);
    }
  });
}

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  logger.error('Exception non capturée:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Promesse rejetée non gérée:', reason);
  process.exit(1);
});

// Démarrage du serveur
if (require.main === module) {
  startServer();
}

module.exports = { app, server, io };