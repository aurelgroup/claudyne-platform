/**
 * Gestionnaires d'erreurs pour l'API Claudyne
 * Centralise la gestion des erreurs et logging
 */

const logger = require('../utils/logger');
const secureLogger = require('../utils/secureLogger');

/**
 * Gestionnaire d'erreurs 404 - Route non trouvée
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route non trouvée - ${req.method} ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

/**
 * Gestionnaire principal d'erreurs
 */
const errorHandler = (error, req, res, next) => {
  let err = { ...error };
  err.message = error.message;

  // Log de l'erreur
  logger.error('Erreur API:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    user: req.user?.id || 'anonymous'
  });

  // Erreurs de validation Mongoose/Sequelize
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(error => error.message).join(', ');
    err = {
      message: `Erreur de validation: ${message}`,
      status: 400
    };
  }

  // Erreurs de duplication (unique constraint)
  if (err.code === 11000 || err.name === 'SequelizeUniqueConstraintError') {
    const message = 'Ressource déjà existante';
    err = {
      message: message,
      status: 409
    };
  }

  // Erreurs JWT avec logging sécurisé
  if (err.name === 'JsonWebTokenError') {
    // Log tentative d'accès avec token invalide
    logger.logSecurity && logger.logSecurity('Invalid JWT token attempt', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      timestamp: new Date().toISOString()
    });

    err = {
      message: 'Token invalide',
      status: 401
    };
  }

  if (err.name === 'TokenExpiredError') {
    err = {
      message: 'Token expiré',
      status: 401
    };
  }

  // Erreurs de base de données
  if (err.name === 'SequelizeConnectionError') {
    err = {
      message: 'Erreur de connexion à la base de données',
      status: 503
    };
  }

  // Erreurs de rate limiting
  if (err.status === 429) {
    err.message = 'Trop de requêtes, veuillez patienter';
  }

  // Réponse d'erreur
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erreur interne du serveur',
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      error: err
    }),
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  });
};

/**
 * Gestionnaire d'erreurs asynchrones
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Middleware de validation des erreurs métier
 */
const businessErrorHandler = (req, res, next) => {
  // Ici on pourrait ajouter des validations spécifiques à Claudyne
  // comme les limites d'âge, restrictions géographiques, etc.

  next();
};

/**
 * Gestionnaire d'erreurs de paiement
 */
const paymentErrorHandler = (error, req, res, next) => {
  if (error.type === 'PAYMENT_ERROR') {
    return res.status(402).json({
      success: false,
      message: error.message || 'Erreur de paiement',
      code: error.code || 'PAYMENT_FAILED',
      details: process.env.NODE_ENV === 'development' ? error.details : undefined
    });
  }

  next(error);
};

/**
 * Gestionnaire d'erreurs WebSocket
 */
const socketErrorHandler = (socket, error) => {
  logger.error('Erreur WebSocket:', {
    socketId: socket.id,
    userId: socket.userId,
    error: error.message,
    stack: error.stack
  });

  socket.emit('error', {
    message: 'Erreur de connexion temps réel',
    code: 'SOCKET_ERROR',
    timestamp: new Date().toISOString()
  });
};

/**
 * Gestionnaire d'arrêt gracieux
 */
const gracefulShutdown = (server) => {
  const shutdown = (signal) => {
    logger.info(`Signal ${signal} reçu, arrêt gracieux en cours...`);

    server.close((err) => {
      if (err) {
        logger.error('Erreur lors de l\'arrêt du serveur:', err);
        process.exit(1);
      }

      logger.info('Serveur arrêté proprement');
      process.exit(0);
    });

    // Force l'arrêt après 30 secondes
    setTimeout(() => {
      logger.error('Arrêt forcé après timeout');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

module.exports = {
  notFoundHandler,
  errorHandler,
  asyncHandler,
  businessErrorHandler,
  paymentErrorHandler,
  socketErrorHandler,
  gracefulShutdown
};