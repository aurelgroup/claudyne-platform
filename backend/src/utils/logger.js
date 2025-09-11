/**
 * Configuration du système de logs pour Claudyne
 * Utilise Winston pour un logging professionnel
 */

const winston = require('winston');
const path = require('path');

// Configuration des niveaux de log
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Configuration des couleurs
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'cyan'
};

winston.addColors(logColors);

// Format personnalisé pour Claudyne
const claudyneFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    
    let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    // Ajout des métadonnées si présentes
    if (Object.keys(meta).length > 0) {
      logMessage += ` | ${JSON.stringify(meta)}`;
    }
    
    return logMessage;
  })
);

// Format pour la console en développement
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    
    let logMessage = `🕒 ${timestamp} ${level}: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta, null, 2)}`;
    }
    
    return logMessage;
  })
);

// Configuration des transports
const transports = [];

// Transport console (toujours actif)
transports.push(
  new winston.transports.Console({
    format: consoleFormat,
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
  })
);

// Transport fichier (production et développement si spécifié)
if (process.env.NODE_ENV === 'production' || process.env.WINSTON_LOG_FILE) {
  const logDir = path.dirname(process.env.WINSTON_LOG_FILE || './logs/claudyne.log');
  
  // Assurer que le dossier logs existe
  const fs = require('fs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  // Fichier pour tous les logs
  transports.push(
    new winston.transports.File({
      filename: process.env.WINSTON_LOG_FILE || './logs/claudyne.log',
      format: claudyneFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 10,
      level: 'debug'
    })
  );
  
  // Fichier séparé pour les erreurs
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      format: claudyneFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      level: 'error'
    })
  );
}

// Création du logger principal
const logger = winston.createLogger({
  levels: logLevels,
  level: process.env.LOG_LEVEL || 'info',
  format: claudyneFormat,
  defaultMeta: {
    service: 'claudyne-backend',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  },
  transports,
  exitOnError: false
});

// Gestion des erreurs du logger lui-même
logger.on('error', (error) => {
  console.error('Erreur dans le système de logging:', error);
});

// Fonction utilitaire pour logger les requêtes HTTP
logger.logRequest = (req, res, responseTime) => {
  const { method, url, ip, headers } = req;
  const { statusCode } = res;
  
  logger.http('Requête HTTP', {
    method,
    url,
    statusCode,
    responseTime: `${responseTime}ms`,
    ip,
    userAgent: headers['user-agent'],
    family: req.user?.familyId || 'anonymous',
    userId: req.user?.id || 'anonymous'
  });
};

// Fonction pour logger les événements Prix Claudine
logger.logPrixClaudine = (event, studentId, familyId, points, details = {}) => {
  logger.info('Prix Claudine Event', {
    event,
    studentId,
    familyId,
    points,
    details,
    category: 'prix-claudine'
  });
};

// Fonction pour logger les paiements
logger.logPayment = (paymentData) => {
  const { id, familyId, amount, method, status, transactionId } = paymentData;
  
  logger.info('Transaction financière', {
    paymentId: id,
    familyId,
    amount: `${amount} FCFA`,
    method,
    status,
    transactionId,
    category: 'payment'
  });
};

// Fonction pour logger les batailles
logger.logBattle = (battleId, event, studentId, details = {}) => {
  logger.info('Battle Royale Event', {
    battleId,
    event,
    studentId,
    details,
    category: 'battle-royale'
  });
};

// Fonction pour logger les erreurs de sécurité
logger.logSecurity = (event, details, level = 'warn') => {
  logger[level]('Événement sécurité', {
    securityEvent: event,
    details,
    category: 'security',
    timestamp: new Date().toISOString()
  });
};

// Fonction pour logger les performances
logger.logPerformance = (operation, duration, metadata = {}) => {
  logger.debug('Performance', {
    operation,
    duration: `${duration}ms`,
    metadata,
    category: 'performance'
  });
};

// En développement, ajout de fonctions de debug spéciales
if (process.env.NODE_ENV === 'development') {
  logger.claudine = (message) => {
    logger.info(`👩🏾‍🏫 CLAUDINE: ${message}`);
  };
  
  logger.famille = (familyId, message) => {
    logger.debug(`👨‍👩‍👧‍👦 FAMILLE ${familyId}: ${message}`);
  };
  
  logger.etudiant = (studentId, message) => {
    logger.debug(`🎓 ÉTUDIANT ${studentId}: ${message}`);
  };
}

module.exports = logger;