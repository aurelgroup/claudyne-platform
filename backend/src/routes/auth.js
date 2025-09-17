/**
 * Routes d'authentification Claudyne
 * Gestion des connexions par email/téléphone et création de comptes famille
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

const router = express.Router();
const logger = require('../utils/logger');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../middleware/auth');

// Initialisation des modèles (sera fait lors du premier appel)
let User, Family, Student;

function initializeModels() {
  if (!User) {
    const models = require('../config/database').initializeModels();
    User = models.User;
    Family = models.Family;
    Student = models.Student;
  }
}

// Rate limiting pour les routes d'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limite de 10 tentatives par IP
  message: {
    success: false,
    message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
    code: 'RATE_LIMIT_AUTH'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Personnalisation pour les familles camerounaises
  keyGenerator: (req) => {
    return req.ip + ':' + (req.body.email || req.body.phone || 'anonymous');
  }
});

// Rate limiting plus strict pour la création de compte
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: process.env.NODE_ENV === 'development' ? 50 : 3, // 50 comptes en dev, 3 en prod
  message: {
    success: false,
    message: 'Limite de création de comptes atteinte. Contactez le support si nécessaire.',
    code: 'REGISTER_LIMIT_EXCEEDED'
  }
});

// Validations communes
const emailValidation = body('email')
  .optional()
  .isEmail()
  .normalizeEmail()
  .withMessage('Format email invalide');

const phoneValidation = body('phone')
  .optional()
  .matches(/^(\+237|237)?[26][0-9]{8}$/)
  .withMessage('Format téléphone camerounais invalide (+237 6XX XXX XXX)');

const passwordValidation = body('password')
  .isLength({ min: 6, max: 100 })
  .withMessage('Le mot de passe doit contenir entre 6 et 100 caractères')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .withMessage('Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre');

/**
 * POST /api/auth/register
 * Création d'un compte famille avec gestionnaire
 */
router.post('/register', registerLimiter, [
  emailValidation,
  phoneValidation,
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  body('familyName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom de famille doit contenir entre 2 et 100 caractères'),
  passwordValidation,
  body('city')
    .optional()
    .isIn(['Douala', 'Yaoundé', 'Bafoussam', 'Bamenda', 'Garoua', 'Maroua', 'Ngaoundéré', 'Bertoua', 'Ebolowa', 'Kribi', 'Limbe', 'Autre'])
    .withMessage('Ville non reconnue'),
  body('acceptTerms')
    .equals('true')
    .withMessage('Vous devez accepter les conditions d\'utilisation')
], async (req, res) => {
  try {
    initializeModels();
    
    // Vérification des erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }
    
    const {
      email,
      phone,
      password,
      firstName,
      lastName,
      familyName,
      city,
      region,
      acceptTerms
    } = req.body;
    
    // Vérification qu'au moins email ou téléphone est fourni
    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Email ou numéro de téléphone requis'
      });
    }
    
    // Vérification que l'utilisateur n'existe pas déjà
    const existingUser = await User.findOne({
      where: {
        [User.sequelize.Sequelize.Op.or]: [
          email ? { email } : null,
          phone ? { phone } : null
        ].filter(Boolean)
      }
    });
    
    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'téléphone';
      logger.logSecurity('Duplicate registration attempt', {
        email,
        phone,
        existingUserId: existingUser.id,
        ip: req.ip
      });
      
      return res.status(409).json({
        success: false,
        message: `Un compte avec cet ${field} existe déjà`,
        code: 'USER_EXISTS'
      });
    }
    
    // Démarrage de transaction
    const transaction = await User.sequelize.transaction();
    
    try {
      // Création de la famille
      const family = await Family.create({
        name: familyName,
        displayName: `Famille ${familyName}`,
        city: city || null,
        region: region || null,
        status: 'TRIAL',
        subscriptionType: 'TRIAL',
        // Configuration financière par défaut
        walletBalance: 0.00,
        currency: 'FCFA',
        totalClaudinePoints: 0,
        claudineRank: null,
        // Configuration d'essai par défaut
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
        currentMembersCount: 1,
        termsAcceptedAt: acceptTerms ? new Date() : null,
        privacyPolicyAcceptedAt: acceptTerms ? new Date() : null,
        dataProcessingConsent: acceptTerms
      }, { transaction });
      
      // Création de l'utilisateur gestionnaire
      const user = await User.create({
        email,
        phone,
        password, // Sera hashé automatiquement par le hook
        firstName,
        lastName,
        role: 'PARENT',
        userType: 'MANAGER',
        familyId: family.id,
        isVerified: false, // Sera vérifié plus tard
        language: 'fr',
        timezone: 'Africa/Douala'
      }, { transaction });
      
      // Commit de la transaction
      await transaction.commit();
      
      // Génération des tokens
      const accessToken = generateToken(user);
      const refreshToken = generateRefreshToken(user);
      
      // Log de l'événement
      logger.info('Nouvelle famille créée', {
        familyId: family.id,
        userId: user.id,
        familyName: family.name,
        city: family.city,
        userEmail: user.email,
        userPhone: user.phone
      });
      
      // Réponse de succès (sans données sensibles)
      res.status(201).json({
        success: true,
        message: 'Compte famille créé avec succès ! Bienvenue dans Claudyne 🎉',
        data: {
          user: user.toSafeJSON(),
          family: {
            id: family.id,
            name: family.name,
            displayName: family.displayName,
            status: family.status,
            subscriptionType: family.subscriptionType,
            trialEndsAt: family.trialEndsAt,
            walletBalance: family.walletBalance,
            totalClaudinePoints: family.totalClaudinePoints
          },
          tokens: {
            accessToken,
            refreshToken,
            expiresIn: process.env.JWT_EXPIRE || '7d'
          },
          trial: {
            daysLeft: 7,
            features: ['basic_subjects', 'mentor_chat', 'progress_tracking', 'family_dashboard']
          }
        }
      });
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
    
  } catch (error) {
    logger.error('Erreur création compte famille:', {
      error: error.message,
      stack: error.stack,
      ip: req.ip,
      userData: {
        email: req.body.email,
        phone: req.body.phone,
        familyName: req.body.familyName
      }
    });
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du compte',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/auth/login
 * Connexion utilisateur (email ou téléphone)
 */
router.post('/login', authLimiter, [
  body('credential')
    .notEmpty()
    .withMessage('Email ou téléphone requis'),
  body('password')
    .notEmpty()
    .withMessage('Mot de passe requis')
], async (req, res) => {
  try {
    initializeModels();
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }
    
    const { credential, password } = req.body;
    
    // Recherche de l'utilisateur par email ou téléphone
    const user = await User.findByEmailOrPhone(credential);
    
    if (!user) {
      logger.logSecurity('Login attempt with non-existent credential', {
        credential,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
      
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    // Vérification du verrouillage du compte
    if (user.isAccountLocked()) {
      logger.logSecurity('Login attempt on locked account', {
        userId: user.id,
        lockedUntil: user.lockedUntil,
        ip: req.ip
      });
      
      return res.status(423).json({
        success: false,
        message: 'Compte temporairement verrouillé pour sécurité',
        code: 'ACCOUNT_LOCKED',
        lockedUntil: user.lockedUntil
      });
    }
    
    // Vérification du mot de passe
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      // Incrémenter les tentatives échouées
      await user.incrementLoginAttempts();
      
      logger.logSecurity('Invalid password attempt', {
        userId: user.id,
        failedAttempts: user.failedLoginAttempts + 1,
        ip: req.ip
      });
      
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    // Vérification que le compte est actif
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Compte désactivé. Contactez le support.',
        code: 'ACCOUNT_INACTIVE'
      });
    }
    
    // Récupération de la famille avec étudiants
    const family = await Family.findByPk(user.familyId, {
      include: [{
        model: Student,
        as: 'students',
        where: { status: 'ACTIVE' },
        required: false
      }]
    });
    
    // Vérification de l'abonnement familial
    let subscriptionWarning = null;
    if (family) {
      const daysLeft = family.getDaysUntilExpiry();
      if (daysLeft !== null && daysLeft <= 3) {
        subscriptionWarning = daysLeft <= 0 
          ? 'Votre abonnement a expiré. Renouvelez pour continuer.'
          : `Votre abonnement expire dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`;
      }
    }
    
    // Réinitialisation des tentatives échouées et mise à jour de la dernière connexion
    await user.resetLoginAttempts();
    await user.updateLastLogin(req.ip);
    
    // Génération des tokens
    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // Log de connexion réussie
    logger.info('Connexion réussie', {
      userId: user.id,
      familyId: user.familyId,
      userType: user.userType,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    // Réponse de succès
    res.json({
      success: true,
      message: `Bonjour ${user.firstName} ! Bienvenue dans Claudyne 👋`,
      data: {
        user: user.toSafeJSON(),
        family: family ? {
          id: family.id,
          name: family.name,
          displayName: family.displayName,
          status: family.status,
          subscriptionType: family.subscriptionType,
          trialEndsAt: family.trialEndsAt,
          subscriptionEndsAt: family.subscriptionEndsAt,
          walletBalance: family.walletBalance,
          totalClaudinePoints: family.totalClaudinePoints,
          claudineRank: family.claudineRank,
          studentsCount: family.students?.length || 0
        } : null,
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: process.env.JWT_EXPIRE || '7d'
        },
        warnings: subscriptionWarning ? [subscriptionWarning] : []
      }
    });
    
  } catch (error) {
    logger.error('Erreur lors de la connexion:', {
      error: error.message,
      stack: error.stack,
      ip: req.ip,
      credential: req.body.credential
    });
    
    res.status(500).json({
      success: false,
      message: 'Erreur interne lors de la connexion'
    });
  }
});

/**
 * POST /api/auth/refresh
 * Renouvellement du token d'accès
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token manquant',
        code: 'NO_REFRESH_TOKEN'
      });
    }
    
    // Vérification du refresh token
    const user = await verifyRefreshToken(refreshToken);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token invalide',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }
    
    // Génération d'un nouveau token d'accès
    const newAccessToken = generateToken(user);
    
    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        expiresIn: process.env.JWT_EXPIRE || '7d'
      }
    });
    
  } catch (error) {
    logger.error('Erreur renouvellement token:', error);
    
    res.status(401).json({
      success: false,
      message: 'Impossible de renouveler le token',
      code: 'REFRESH_FAILED'
    });
  }
});

/**
 * POST /api/auth/logout
 * Déconnexion utilisateur
 */
router.post('/logout', async (req, res) => {
  try {
    // Pour le moment, on fait juste un logout côté client
    // Dans une version future, on pourrait maintenir une blacklist des tokens
    
    logger.info('Déconnexion utilisateur', {
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.json({
      success: true,
      message: 'Déconnexion réussie. À bientôt sur Claudyne ! 👋'
    });
    
  } catch (error) {
    logger.error('Erreur lors de la déconnexion:', error);
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la déconnexion'
    });
  }
});

/**
 * POST /api/auth/forgot-password
 * Demande de réinitialisation de mot de passe
 */
router.post('/forgot-password', authLimiter, [
  body('credential')
    .notEmpty()
    .withMessage('Email ou téléphone requis')
], async (req, res) => {
  try {
    initializeModels();
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }
    
    const { credential } = req.body;
    
    const user = await User.findByEmailOrPhone(credential);
    
    // On renvoie toujours un succès pour éviter l'énumération d'utilisateurs
    const successMessage = 'Si ce compte existe, vous recevrez les instructions de réinitialisation.';
    
    if (!user) {
      logger.logSecurity('Password reset attempt for non-existent user', {
        credential,
        ip: req.ip
      });
      
      return res.json({
        success: true,
        message: successMessage
      });
    }
    
    // Génération d'un token de réinitialisation
    const resetToken = require('crypto').randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 heure
    
    await user.update({
      resetPasswordToken: resetToken,
      resetPasswordExpires: resetExpires
    });
    
    // TODO: Envoyer l'email ou SMS avec le token
    logger.info('Token de réinitialisation généré', {
      userId: user.id,
      email: user.email,
      phone: user.phone
    });
    
    res.json({
      success: true,
      message: successMessage,
      // En développement, on peut renvoyer le token pour les tests
      ...(process.env.NODE_ENV === 'development' && { resetToken })
    });
    
  } catch (error) {
    logger.error('Erreur demande réinitialisation:', error);
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la demande de réinitialisation'
    });
  }
});

/**
 * GET /api/auth/verify-email/:token
 * Vérification d'email
 */
router.get('/verify-email/:token', async (req, res) => {
  try {
    initializeModels();
    
    const { token } = req.params;
    
    const user = await User.findOne({
      where: { emailVerificationToken: token }
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token de vérification invalide ou expiré',
        code: 'INVALID_VERIFICATION_TOKEN'
      });
    }
    
    await user.update({
      isVerified: true,
      emailVerifiedAt: new Date(),
      emailVerificationToken: null
    });
    
    logger.info('Email vérifié', {
      userId: user.id,
      email: user.email
    });
    
    res.json({
      success: true,
      message: 'Email vérifié avec succès ! 🎉'
    });
    
  } catch (error) {
    logger.error('Erreur vérification email:', error);
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification'
    });
  }
});

module.exports = router;