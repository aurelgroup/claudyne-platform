/**
 * Middleware d'authentification et d'autorisation Claudyne
 * Gère JWT, sessions, et permissions familiales
 */

const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const logger = require('../utils/logger');

// Initialisation des modèles (sera fait après l'import)
let User, Family, Student;

// Fonction pour initialiser les modèles
function initializeModels() {
  if (!User) {
    const models = require('../config/database').initializeModels();
    User = models.User;
    Family = models.Family;
    Student = models.Student;
  }
}

/**
 * Middleware d'authentification principal
 * Vérifie le token JWT et charge l'utilisateur
 */
const authenticate = async (req, res, next) => {
  try {
    initializeModels();
    
    // Récupération du token
    let token = null;
    
    // 1. Header Authorization: Bearer <token>
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7);
    }
    // 2. Cookie (pour les requêtes web)
    else if (req.cookies && req.cookies.claudyne_token) {
      token = req.cookies.claudyne_token;
    }
    // 3. Query parameter (pour les WebSockets ou cas spéciaux)
    else if (req.query.token) {
      token = req.query.token;
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'authentification manquant',
        code: 'NO_TOKEN'
      });
    }
    
    // GESTION DES TOKENS ADMIN (format: admin-timestamp-xxx)
    if (token.startsWith('admin-')) {
      const tokenService = require('../services/tokenService');
      const validation = await tokenService.validateToken(token);

      if (!validation.valid) {
        logger.logSecurity('Invalid admin token attempt', {
          reason: validation.reason,
          ip: req.ip,
          userAgent: req.headers['user-agent']
        });

        return res.status(401).json({
          success: false,
          message: 'Token admin invalide ou expiré',
          code: 'INVALID_ADMIN_TOKEN'
        });
      }

      // Créer un utilisateur virtuel ADMIN
      req.user = {
        id: 'admin-virtual',
        email: 'admin@claudyne.com',
        role: 'ADMIN',
        userType: 'ADMIN',
        isActive: true,
        firstName: 'Admin',
        lastName: 'System',
        isVirtual: true
      };

      return next();
    }

    // Vérification du token JWT classique
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      logger.logSecurity('Invalid JWT token attempt', {
        error: jwtError.message,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });

      return res.status(401).json({
        success: false,
        message: 'Token invalide ou expiré',
        code: 'INVALID_TOKEN'
      });
    }
    
    // Récupération de l'utilisateur
    const user = await User.findByPk(decoded.userId, {
      include: [
        {
          model: Family,
          as: 'family',
          required: false
        }
      ]
    });
    
    if (!user) {
      logger.logSecurity('Token for non-existent user', {
        userId: decoded.userId,
        ip: req.ip
      });
      
      return res.status(401).json({
        success: false,
        message: 'Utilisateur introuvable',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Vérification que le compte est actif
    if (!user.isActive) {
      logger.logSecurity('Inactive user authentication attempt', {
        userId: user.id,
        email: user.email,
        ip: req.ip
      });
      
      return res.status(401).json({
        success: false,
        message: 'Compte désactivé',
        code: 'ACCOUNT_INACTIVE'
      });
    }
    
    // Vérification du verrouillage du compte
    if (user.isAccountLocked()) {
      logger.logSecurity('Locked account authentication attempt', {
        userId: user.id,
        email: user.email,
        lockedUntil: user.lockedUntil,
        ip: req.ip
      });
      
      return res.status(423).json({
        success: false,
        message: 'Compte temporairement verrouillé pour des raisons de sécurité',
        code: 'ACCOUNT_LOCKED',
        lockedUntil: user.lockedUntil
      });
    }

    // Whitelist: Routes accessibles même avec abonnement expiré
    // Ces routes sont nécessaires pour permettre le renouvellement/paiement
    const paymentWhitelist = [
      '/api/payments/',           // Tous les endpoints de paiement
      '/api/subscriptions/',      // Gestion des abonnements
      '/api/auth/me',            // Informations utilisateur (pour afficher le statut)
      '/api/auth/refresh',       // Rafraîchissement du token
      '/api/auth/logout'         // Déconnexion
    ];

    const isPaymentRoute = paymentWhitelist.some(route => req.path.startsWith(route));

    // Vérification de l'abonnement familial (sauf pour les routes de paiement)
    if (!isPaymentRoute && user.family && !isSubscriptionValid(user.family)) {
      return res.status(402).json({
        success: false,
        message: 'Abonnement familial expiré',
        code: 'SUBSCRIPTION_EXPIRED',
        family: {
          id: user.family.id,
          status: user.family.status,
          trialEndsAt: user.family.trialEndsAt,
          subscriptionEndsAt: user.family.subscriptionEndsAt
        }
      });
    }
    
    // Ajout de l'utilisateur à la requête
    req.user = user;
    req.family = user.family;

    // Create subscription object for lesson access control
    if (user.family && isSubscriptionValid(user.family)) {
      // Transform family subscription data into format expected by Lesson.canAccess()
      const now = new Date();
      const isTrialActive = user.family.trialEndsAt && user.family.trialEndsAt > now;

      req.userSubscription = {
        type: user.family.subscriptionType?.toLowerCase().includes('family') ? 'family' :
              user.family.subscriptionType?.toLowerCase().includes('premium') ? 'premium' : 'basic',
        status: 'active',  // Already validated by isSubscriptionValid
        expiresAt: user.family.subscriptionEndsAt || user.family.trialEndsAt,
        isTrial: isTrialActive
      };
    }
    
    // Mise à jour de la dernière activité (async, sans attendre)
    if (user.family) {
      user.family.updateActivity().catch(err => 
        logger.error('Erreur mise à jour activité famille:', err)
      );
    }
    
    next();
    
  } catch (error) {
    logger.error('Erreur dans le middleware d\'authentification:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Erreur interne d\'authentification',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Middleware d'autorisation par rôles
 */
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise',
        code: 'AUTH_REQUIRED'
      });
    }
    
    // Conversion en tableau si string
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    // Vérification du rôle
    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      logger.logSecurity('Unauthorized role access attempt', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        route: req.originalUrl,
        method: req.method
      });
      
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: allowedRoles,
        current: req.user.role
      });
    }
    
    next();
  };
};

/**
 * Middleware pour vérifier l'appartenance à une famille
 */
const requireFamilyMembership = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise'
    });
  }
  
  if (!req.user.familyId) {
    return res.status(403).json({
      success: false,
      message: 'Accès limité aux membres de famille',
      code: 'NO_FAMILY_MEMBERSHIP'
    });
  }
  
  next();
};

/**
 * Middleware pour vérifier que l'utilisateur est gestionnaire de famille
 */
const requireFamilyManager = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise'
    });
  }
  
  if (req.user.userType !== 'MANAGER') {
    return res.status(403).json({
      success: false,
      message: 'Accès réservé aux gestionnaires de famille',
      code: 'NOT_FAMILY_MANAGER'
    });
  }
  
  next();
};

/**
 * Middleware pour vérifier l'accès à un étudiant spécifique
 */
const requireStudentAccess = async (req, res, next) => {
  try {
    initializeModels();
    
    const studentId = req.params.studentId || req.body.studentId;
    
    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'ID étudiant requis'
      });
    }
    
    const student = await Student.findByPk(studentId);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Étudiant non trouvé'
      });
    }
    
    // Vérifier l'appartenance à la famille
    if (req.user.familyId !== student.familyId) {
      logger.logSecurity('Unauthorized student access attempt', {
        userId: req.user.id,
        userFamilyId: req.user.familyId,
        targetStudentId: studentId,
        targetFamilyId: student.familyId
      });
      
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à cet étudiant',
        code: 'UNAUTHORIZED_STUDENT_ACCESS'
      });
    }
    
    req.student = student;
    next();
    
  } catch (error) {
    logger.error('Erreur vérification accès étudiant:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur de vérification d\'accès'
    });
  }
};

/**
 * Middleware pour les routes en mode développement uniquement
 */
const developmentOnly = (req, res, next) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({
      success: false,
      message: 'Route non disponible en production'
    });
  }
  next();
};

/**
 * Middleware pour vérifier la 2FA si activée
 */
const requireTwoFactor = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise'
    });
  }
  
  // Si la 2FA est activée et pas encore vérifiée dans cette session
  if (req.user.twoFactorEnabled && !req.session?.twoFactorVerified) {
    return res.status(403).json({
      success: false,
      message: 'Vérification à deux facteurs requise',
      code: 'TWO_FACTOR_REQUIRED'
    });
  }
  
  next();
};

/**
 * Fonction utilitaire pour vérifier la validité de l'abonnement
 */
function isSubscriptionValid(family) {
  if (!family) return false;

  const now = new Date();

  // Vérifier d'abord si la période d'essai est valide (peu importe le status)
  // Car une famille peut avoir status='ACTIVE' mais être encore en trial
  if (family.trialEndsAt && family.trialEndsAt > now) {
    return true;
  }

  // En période d'essai (legacy check pour compatibilité)
  if (family.status === 'TRIAL') {
    return family.trialEndsAt && family.trialEndsAt > now;
  }

  // Abonnement payant actif
  if (family.subscriptionStatus === 'ACTIVE' || family.status === 'ACTIVE') {
    // Si subscriptionEndsAt n'existe pas ou est dans le futur, c'est valide
    return !family.subscriptionEndsAt || family.subscriptionEndsAt > now;
  }

  return false;
}

/**
 * Fonction pour générer un token JWT
 */
const generateToken = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    userType: user.userType,
    familyId: user.familyId,
    iat: Math.floor(Date.now() / 1000)
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
    issuer: 'claudyne-api',
    audience: 'claudyne-users'
  });
};

/**
 * Fonction pour générer un refresh token
 */
const generateRefreshToken = (user) => {
  const payload = {
    userId: user.id,
    type: 'refresh',
    iat: Math.floor(Date.now() / 1000)
  };
  
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d',
    issuer: 'claudyne-api',
    audience: 'claudyne-refresh'
  });
};

/**
 * Fonction pour vérifier un refresh token
 */
const verifyRefreshToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    
    if (decoded.type !== 'refresh') {
      throw new Error('Type de token invalide');
    }
    
    initializeModels();
    const user = await User.findByPk(decoded.userId);
    
    return user;
  } catch (error) {
    throw new Error('Refresh token invalide');
  }
};

module.exports = {
  authenticate,
  authorize,
  requireFamilyMembership,
  requireFamilyManager,
  requireStudentAccess,
  requireTwoFactor,
  developmentOnly,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  isSubscriptionValid
};