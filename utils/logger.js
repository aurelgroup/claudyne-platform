/**
 * 📋 SYSTÈME DE LOGGING SÉCURISÉ CLAUDYNE
 * Winston logger avec masquage des données sensibles
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Créer le répertoire logs
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// 🔒 FONCTION DE MASQUAGE DES DONNÉES SENSIBLES
function sanitizeLog(info) {
  let message = info.message;
  let meta = { ...info };

  // Patterns sensibles à masquer
  const sensitivePatterns = [
    { pattern: /password['":][\s]*['"][^'"]*['"]/gi, replacement: 'password: "***HIDDEN***"' },
    { pattern: /jwt['":][\s]*['"][^'"]*['"]/gi, replacement: 'jwt: "***HIDDEN***"' },
    { pattern: /token['":][\s]*['"][^'"]*['"]/gi, replacement: 'token: "***HIDDEN***"' },
    { pattern: /secret['":][\s]*['"][^'"]*['"]/gi, replacement: 'secret: "***HIDDEN***"' },
    { pattern: /key['":][\s]*['"][^'"]*['"]/gi, replacement: 'key: "***HIDDEN***"' },
    { pattern: /Bearer [A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g, replacement: 'Bearer ***HIDDEN***' },
    { pattern: /email['":][\s]*['"][^'"]*@[^'"]*['"]/gi, replacement: 'email: "***@***.***"' }
  ];

  // Masquer dans le message
  sensitivePatterns.forEach(({ pattern, replacement }) => {
    message = message.replace(pattern, replacement);
  });

  // Masquer dans les métadonnées
  if (meta.body) {
    delete meta.body.password;
    if (meta.body.email) meta.body.email = '***@***.***';
  }

  if (meta.headers) {
    delete meta.headers.authorization;
    delete meta.headers.cookie;
  }

  return { ...meta, message };
}

// 📊 FORMAT PERSONNALISÉ POUR CLAUDYNE
const claudyneFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf((info) => {
    const sanitized = sanitizeLog(info);
    const { timestamp, level, message, ...meta } = sanitized;

    let logEntry = `[${timestamp}] ${level.toUpperCase()}: ${message}`;

    // Ajouter métadonnées si présentes
    if (Object.keys(meta).length > 0) {
      logEntry += `\nMeta: ${JSON.stringify(meta, null, 2)}`;
    }

    return logEntry;
  })
);

// 🎯 CONFIGURATION WINSTON AVANCÉE
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: claudyneFormat,
  defaultMeta: {
    service: 'claudyne-api',
    environment: process.env.NODE_ENV || 'development',
    country: 'Cameroun'
  },
  transports: [
    // Fichiers de logs
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
      tailable: true
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'access.log'),
      level: 'info',
      maxsize: 20 * 1024 * 1024, // 20MB
      maxFiles: 7,
      tailable: true
    })
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log')
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log')
    })
  ]
});

// Console en développement uniquement
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// 🎓 MÉTHODES SPÉCIALISÉES CLAUDYNE
logger.family = (message, familyId, meta = {}) => {
  logger.info(message, { ...meta, familyId, category: 'family' });
};

logger.student = (message, studentId, meta = {}) => {
  logger.info(message, { ...meta, studentId, category: 'student' });
};

logger.payment = (message, transactionId, meta = {}) => {
  logger.info(message, { ...meta, transactionId, category: 'payment' });
};

logger.security = (message, userId, meta = {}) => {
  logger.warn(message, { ...meta, userId, category: 'security' });
};

logger.performance = (message, responseTime, meta = {}) => {
  logger.info(message, { ...meta, responseTime, category: 'performance' });
};

logger.mobile = (message, deviceType, meta = {}) => {
  logger.info(message, { ...meta, deviceType, category: 'mobile' });
};

logger.cameroon = (message, region, meta = {}) => {
  logger.info(message, { ...meta, region, category: 'cameroon' });
};

// 🔍 MIDDLEWARE EXPRESS POUR LOGGING AUTOMATIQUE
logger.expressMiddleware = () => {
  return (req, res, next) => {
    const startTime = Date.now();

    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      const { method, url, ip } = req;
      const { statusCode } = res;

      const logData = {
        method,
        url,
        statusCode,
        responseTime,
        ip,
        userAgent: req.get('User-Agent'),
        category: 'http'
      };

      if (statusCode >= 400) {
        logger.warn(`${method} ${url} - ${statusCode} - ${responseTime}ms`, logData);
      } else {
        logger.info(`${method} ${url} - ${statusCode} - ${responseTime}ms`, logData);
      }

      // Log performance lente
      if (responseTime > 1000) {
        logger.performance(`Requête lente détectée`, responseTime, logData);
      }
    });

    next();
  };
};

// 📈 MONITORING DES MÉTRIQUES
logger.metrics = {
  errors: 0,
  requests: 0,
  slowRequests: 0,

  incrementError() {
    this.errors++;
    if (this.errors % 10 === 0) {
      logger.warn(`${this.errors} erreurs détectées`, { category: 'metrics' });
    }
  },

  incrementRequest() {
    this.requests++;
  },

  incrementSlowRequest() {
    this.slowRequests++;
    if (this.slowRequests % 5 === 0) {
      logger.warn(`${this.slowRequests} requêtes lentes détectées`, { category: 'metrics' });
    }
  },

  getStats() {
    return {
      errors: this.errors,
      requests: this.requests,
      slowRequests: this.slowRequests,
      timestamp: new Date().toISOString()
    };
  }
};

// 🚨 ALERTES AUTOMATIQUES
logger.alert = (level, message, meta = {}) => {
  const alertData = {
    ...meta,
    category: 'alert',
    severity: level,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  };

  switch (level) {
    case 'critical':
      logger.error(`🚨 ALERTE CRITIQUE: ${message}`, alertData);
      break;
    case 'warning':
      logger.warn(`⚠️ ALERTE WARNING: ${message}`, alertData);
      break;
    case 'info':
      logger.info(`ℹ️ ALERTE INFO: ${message}`, alertData);
      break;
    default:
      logger.info(`📢 ALERTE: ${message}`, alertData);
  }
};

// 🎯 EXEMPLES D'UTILISATION
logger.startup = () => {
  logger.info('🎓 Claudyne API démarrée', {
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV,
    category: 'startup'
  });
};

logger.shutdown = () => {
  logger.info('👋 Claudyne API arrêtée proprement', {
    category: 'shutdown'
  });
};

module.exports = logger;