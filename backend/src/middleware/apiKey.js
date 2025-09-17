/**
 * Middleware de validation des clés API
 * Sécurise l'accès aux API publiques
 */

const logger = require('../utils/logger');

/**
 * Middleware de validation de clé API
 */
const validateApiKey = (req, res, next) => {
  try {
    // En mode développement, on peut bypasser la validation
    if (process.env.NODE_ENV === 'development' && !process.env.ENFORCE_API_KEY) {
      return next();
    }

    const apiKey = req.headers['x-api-key'] || req.query.api_key;

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'Clé API requise',
        code: 'API_KEY_REQUIRED'
      });
    }

    // Vérifier la clé API
    const validApiKey = process.env.API_KEY;

    if (!validApiKey) {
      logger.warn('Clé API non configurée dans l\'environnement');
      return res.status(500).json({
        success: false,
        message: 'Configuration API manquante',
        code: 'API_CONFIG_ERROR'
      });
    }

    if (apiKey !== validApiKey) {
      logger.warn('Tentative d\'accès avec clé API invalide', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        providedKey: apiKey.substring(0, 8) + '...'
      });

      return res.status(401).json({
        success: false,
        message: 'Clé API invalide',
        code: 'INVALID_API_KEY'
      });
    }

    // Clé API valide
    req.apiKey = apiKey;
    next();

  } catch (error) {
    logger.error('Erreur dans la validation de clé API:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur de validation API',
      code: 'API_VALIDATION_ERROR'
    });
  }
};

/**
 * Middleware de validation pour les webhooks
 */
const validateWebhookSignature = (req, res, next) => {
  try {
    const signature = req.headers['x-webhook-signature'];
    const webhookSecret = process.env.WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      return res.status(401).json({
        success: false,
        message: 'Signature webhook manquante',
        code: 'WEBHOOK_SIGNATURE_REQUIRED'
      });
    }

    // Ici on pourrait implémenter une validation HMAC
    // Pour l'instant, validation simple
    if (signature !== webhookSecret) {
      return res.status(401).json({
        success: false,
        message: 'Signature webhook invalide',
        code: 'INVALID_WEBHOOK_SIGNATURE'
      });
    }

    next();

  } catch (error) {
    logger.error('Erreur dans la validation webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur de validation webhook',
      code: 'WEBHOOK_VALIDATION_ERROR'
    });
  }
};

module.exports = {
  validateApiKey,
  validateWebhookSignature
};