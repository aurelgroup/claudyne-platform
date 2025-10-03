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
    return req.ip + ':' + (req.body.credential || req.body.email || req.body.phone || 'anonymous');
  }
});

// Rate limiting plus strict pour la création de compte
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: process.env.NODE_ENV === "development" ? 50 : 10, // 50 comptes en dev, 3 en prod
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
 * Création de compte (PARENT, STUDENT ou TEACHER)
 */
router.post('/register', registerLimiter, [
  body('accountType')
    .optional()
    .isIn(['PARENT', 'STUDENT', 'TEACHER'])
    .withMessage('Type de compte invalide (PARENT, STUDENT ou TEACHER)'),
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
    .optional()
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
      // Log détaillé des erreurs de validation pour debugging
      logger.error('Erreurs validation login:', {
        errors: errors.array(),
        credential: req.body.credential,
        ip: req.ip
      });

      return res.status(400).json({
        success: false,
        message: 'Email, téléphone, prénom ou nom requis - Vérifiez le format',
        errors: errors.array(),
        debug: process.env.NODE_ENV === 'development' ? {
          receivedCredential: req.body.credential,
          expectedFormats: [
            'Email: exemple@domain.com',
            'Téléphone: +237XXXXXXXX ou 237XXXXXXXX',
            'Prénom: Jean',
            'Nom: Dupont'
          ]
        } : undefined
      });
    }
    
    const {
      accountType = 'PARENT', // Par défaut PARENT pour rétro-compatibilité
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

    // Vérification que familyName est fourni pour les comptes PARENT
    if (accountType === 'PARENT' && !familyName) {
      return res.status(400).json({
        success: false,
        message: 'Le nom de famille est requis pour la formule familiale (15000 FCFA/mois)'
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
      let family = null;
      let user = null;

      // ========================================
      // CRÉATION SELON LE TYPE DE COMPTE
      // ========================================

      const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours d'essai

      if (accountType === 'PARENT') {
        // FORMULE FAMILIALE: 15000 FCFA/mois - Jusqu'à 3 enfants
        // Essai gratuit de 7 jours
        family = await Family.create({
          name: familyName,
          displayName: `Famille ${familyName}`,
          city: city || null,
          region: region || null,
          status: 'TRIAL',
          subscriptionType: 'TRIAL',
          walletBalance: 0.00,
          currency: 'FCFA',
          totalClaudinePoints: 0,
          claudineRank: null,
          trialEndsAt: trialEndsAt,
          currentMembersCount: 1,
          termsAcceptedAt: acceptTerms ? new Date() : null,
          privacyPolicyAcceptedAt: acceptTerms ? new Date() : null,
          dataProcessingConsent: acceptTerms
        }, { transaction });

        user = await User.create({
          email,
          phone,
          password,
          firstName,
          lastName,
          role: 'PARENT',
          userType: 'MANAGER',
          familyId: family.id,
          isVerified: false,
          language: 'fr',
          timezone: 'Africa/Douala',
          // Abonnement géré via la Family
          subscriptionStatus: 'TRIAL',
          subscriptionPlan: 'FAMILY_MANAGER',
          trialEndsAt: trialEndsAt,
          monthlyPrice: 15000.00 // 15000 FCFA/mois via Family
        }, { transaction });

      } else if (accountType === 'STUDENT') {
        // FORMULE INDIVIDUELLE: 8000 FCFA/mois par élève
        // Essai gratuit de 7 jours
        user = await User.create({
          email,
          phone,
          password,
          firstName,
          lastName,
          role: 'STUDENT',
          userType: 'INDIVIDUAL',
          familyId: null, // Pas de famille
          isVerified: false,
          language: 'fr',
          timezone: 'Africa/Douala',
          // Abonnement individuel
          subscriptionStatus: 'TRIAL',
          subscriptionPlan: 'INDIVIDUAL_STUDENT',
          trialEndsAt: trialEndsAt,
          monthlyPrice: 8000.00, // 8000 FCFA/mois
          autoRenew: true
        }, { transaction });

      } else if (accountType === 'TEACHER') {
        // COMPTE ENSEIGNANT - Gratuit ou pricing spécial
        user = await User.create({
          email,
          phone,
          password,
          firstName,
          lastName,
          role: 'TEACHER',
          userType: 'INDIVIDUAL',
          familyId: null,
          isVerified: false,
          language: 'fr',
          timezone: 'Africa/Douala',
          // Abonnement enseignant (gratuit pour l'instant)
          subscriptionStatus: 'ACTIVE',
          subscriptionPlan: 'INDIVIDUAL_TEACHER',
          monthlyPrice: 0.00 // Gratuit pour les enseignants
        }, { transaction });
      }
      
      // Commit de la transaction
      await transaction.commit();
      transaction.finished = true;

      // Génération des tokens
      const accessToken = generateToken(user);
      const refreshToken = generateRefreshToken(user);

      // Log de l'événement selon le type de compte
      if (accountType === 'PARENT') {
        logger.info('Nouvelle famille créée', {
          accountType,
          familyId: family.id,
          userId: user.id,
          familyName: family.name,
          city: family.city,
          userEmail: user.email,
          userPhone: user.phone
        });
      } else {
        logger.info(`Nouveau compte ${accountType} créé`, {
          accountType,
          userId: user.id,
          userEmail: user.email,
          userPhone: user.phone,
          role: user.role
        });
      }

      // Messages personnalisés selon le type de compte
      const messages = {
        'PARENT': 'Compte famille créé avec succès ! Bienvenue dans Claudyne 🎉 (15000 FCFA/mois - jusqu\'à 3 enfants)',
        'STUDENT': 'Compte étudiant créé avec succès ! Bienvenue dans Claudyne 🎉 (8000 FCFA/mois)',
        'TEACHER': 'Compte enseignant créé avec succès ! Bienvenue dans Claudyne 🎉'
      };

      // Construction de la réponse
      const responseData = {
        user: user.toSafeJSON(),
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: process.env.JWT_EXPIRE || '7d'
        }
      };

      // Ajout des données de famille si compte PARENT
      if (accountType === 'PARENT' && family) {
        responseData.family = {
          id: family.id,
          name: family.name,
          displayName: family.displayName,
          status: family.status,
          subscriptionType: family.subscriptionType,
          trialEndsAt: family.trialEndsAt,
          walletBalance: family.walletBalance,
          totalClaudinePoints: family.totalClaudinePoints
        };
      }

      // Ajout des informations d'abonnement
      responseData.subscription = {
        status: user.subscriptionStatus,
        plan: user.subscriptionPlan,
        monthlyPrice: parseFloat(user.monthlyPrice),
        currency: 'FCFA',
        autoRenew: user.autoRenew
      };

      // Descriptions par type de plan
      if (accountType === 'PARENT') {
        responseData.subscription.description = 'Formule Familiale - Jusqu\'à 3 enfants';
      } else if (accountType === 'STUDENT') {
        responseData.subscription.description = 'Formule Individuelle Élève';
      } else if (accountType === 'TEACHER') {
        responseData.subscription.description = 'Compte Enseignant Gratuit';
      }

      // Ajout des informations d'essai si PARENT ou STUDENT
      if (accountType === 'PARENT' || accountType === 'STUDENT') {
        responseData.trial = {
          daysLeft: 7,
          endsAt: user.trialEndsAt,
          features: ['basic_subjects', 'mentor_chat', 'progress_tracking']
        };

        if (accountType === 'PARENT') {
          responseData.trial.features.push('family_dashboard');
          responseData.trial.pricing = '15000 FCFA/mois après essai';
          responseData.trial.maxChildren = 3;
        } else {
          responseData.trial.pricing = '8000 FCFA/mois après essai';
        }
      }

      // Réponse de succès
      res.status(201).json({
        success: true,
        message: messages[accountType],
        data: responseData
      });
      
    } catch (error) {
      // Rollback sécurisé
      if (transaction && !transaction.finished) {
        try {
          await transaction.rollback();
        } catch (rbErr) {
          // Ignore rollback errors
        }
      }
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
 * POST /api/auth/quick-login
 * Connexion rapide pour test et développement
 */
router.post('/quick-login', [
  body('email').isEmail().withMessage('Email valide requis'),
  body('password').notEmpty().withMessage('Mot de passe requis')
], async (req, res) => {
  try {
    initializeModels();

    const { email, password } = req.body;

    // Validation simple
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }

    // Recherche utilisateur par email uniquement (plus simple)
    const user = await User.findOne({
      where: { email: email.toLowerCase() },
      include: [{
        model: Family,
        as: 'family',
        include: ['students']
      }]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé avec cet email',
        debug: process.env.NODE_ENV === 'development' ? { searchedEmail: email } : undefined
      });
    }

    // Vérification mot de passe
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe incorrect'
      });
    }

    // Génération tokens
    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Succès
    res.json({
      success: true,
      message: `Connexion rapide réussie ! Bienvenue ${user.firstName} 👋`,
      data: {
        user: user.toSafeJSON(),
        family: user.family ? {
          id: user.family.id,
          name: user.family.name,
          status: user.family.status
        } : null,
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: process.env.JWT_EXPIRE || '7d'
        }
      }
    });

  } catch (error) {
    logger.error('Erreur quick-login:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la connexion'
    });
  }
});

/**
 * POST /api/auth/login
 * Connexion utilisateur (email, téléphone, prénom ou nom)
 */
router.post('/login', authLimiter, [
  body('credential')
    .notEmpty()
    .withMessage('Email, téléphone, prénom ou nom requis'),
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
    
    // Recherche de l'utilisateur par email, téléphone ou nom d'utilisateur
    const user = await User.findByEmailPhoneOrUsername(credential);
    
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
        attributes: ['id', 'firstName', 'lastName', 'isActive', 'createdAt', 'updatedAt'],
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

// Route pour la récupération de mot de passe
router.post('/forgot-password', [
  authLimiter,
  body('email').isEmail().withMessage('Email invalide')
], async (req, res) => {
  try {
    initializeModels();

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Email invalide',
        errors: errors.array()
      });
    }

    const { email } = req.body;

    // Chercher l'utilisateur par email
    const user = await User.findOne({
      where: { email: email.toLowerCase() }
    });

    // Toujours retourner succès pour éviter l'énumération d'emails
    if (!user) {
      logger.info(`Tentative de récupération pour email inexistant: ${email}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      return res.json({
        success: true,
        message: 'Si cet email existe, un lien de réinitialisation a été envoyé.'
      });
    }

    // Générer un token de réinitialisation
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 heure

    // Sauvegarder le token dans la base
    await user.update({
      resetPasswordToken: resetToken,
      resetPasswordExpires: resetExpires
    });

    // En mode développement, log le token (JAMAIS en production)
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔑 Token de réinitialisation pour ${email}: ${resetToken}`);
      console.log(`🔗 Lien: http://localhost:3000/reset-password?token=${resetToken}`);
    }

    // TODO: Intégrer avec un service d'email (Mailgun, SendGrid, etc.)
    // Pour le moment, on simule l'envoi
    logger.info(`Token de réinitialisation généré pour: ${email}`, {
      userId: user.id,
      tokenExpires: resetExpires
    });

    res.json({
      success: true,
      message: 'Si cet email existe, un lien de réinitialisation a été envoyé.',
      // En développement seulement, inclure le token pour tester
      ...(process.env.NODE_ENV === 'development' && {
        resetToken,
        resetLink: `http://localhost:3000/reset-password?token=${resetToken}`
      })
    });

  } catch (error) {
    logger.error('Erreur récupération mot de passe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi de l\'email de récupération'
    });
  }
});

// Route pour réinitialiser le mot de passe
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Token requis'),
  body('password').isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères')
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

    const { token, password } = req.body;

    // Chercher l'utilisateur avec ce token
    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          [require('sequelize').Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token invalide ou expiré'
      });
    }

    // Mettre à jour le mot de passe et supprimer le token
    // Le hachage sera fait automatiquement par le hook beforeSave du modèle User
    await user.update({
      password: password,
      resetPasswordToken: null,
      resetPasswordExpires: null,
      failedLoginAttempts: 0, // Reset les tentatives échouées
      lockedUntil: null // Débloquer le compte si verrouillé
    });

    logger.info(`Mot de passe réinitialisé pour: ${user.email}`, {
      userId: user.id,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès ! Vous pouvez maintenant vous connecter.'
    });

  } catch (error) {
    logger.error('Erreur réinitialisation mot de passe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la réinitialisation du mot de passe'
    });
  }
});

module.exports = router;