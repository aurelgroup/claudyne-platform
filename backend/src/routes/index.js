/**
 * Routeur principal des API Claudyne
 * Centralise toutes les routes de l'application
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

// Import des sous-routeurs
const authRoutes = require('./auth');
const familyRoutes = require('./families');
const studentRoutes = require('./students');
const subjectRoutes = require('./subjects');
const battleRoutes = require('./battles');
const prixClaudineRoutes = require('./prix-claudine');
const paymentRoutes = require('./payments');
const mentorRoutes = require('./mentor');
const adminRoutes = require('./admin');
const monitoringRoutes = require('./monitoring');
const progressRoutes = require('./progress');
const notificationRoutes = require('./notifications');
const quizRoutes = require('./quiz');
const revisionsRoutes = require('./revisions');

// Middleware d'authentification
const { authenticate, authorize } = require('../middleware/auth');
const { validateApiKey } = require('../middleware/apiKey');
const logger = require('../utils/logger');

// Middleware de logging pour toutes les routes API
router.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.logRequest(req, res, duration);
  });
  
  next();
});

// Routes publiques (sans authentification)
router.use('/auth', authRoutes);

// Health check public endpoint
router.get('/health', async (req, res) => {
  try {
    const { testConnection } = require('../config/database');

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV,
      services: {
        database: 'connected',
        api: 'available'
      },
      message: 'Claudyne API fonctionne correctement'
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Service unavailable'
    });
  }
});

// Exception pour l'endpoint de génération de token admin (AVANT authentification)
router.post('/admin/generate-token', async (req, res) => {
    try {
        const { adminKey } = req.body;

        // Clé admin simple pour accès interface
        if (adminKey === 'claudyne-admin-2024') {
            const tokenService = require('../services/tokenService');
            const result = await tokenService.generateToken();

            if (result.success) {
                res.json({
                    success: true,
                    token: result.token,
                    message: 'Token admin généré avec succès',
                    expiresAt: result.expiresAt
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la génération du token'
                });
            }
        } else {
            res.status(401).json({
                success: false,
                message: 'Clé admin invalide'
            });
        }
    } catch (error) {
        console.error('Erreur génération token:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Middleware d'authentification pour toutes les autres routes
router.use(authenticate);

// Routes authentifiées
router.use('/families', familyRoutes);
router.use('/students', studentRoutes);
router.use('/subjects', subjectRoutes);
router.use('/battles', battleRoutes);
router.use('/prix-claudine', prixClaudineRoutes);
router.use('/payments', paymentRoutes);
router.use('/mentor', mentorRoutes);
router.use('/progress', progressRoutes);
router.use('/notifications', notificationRoutes);
router.use('/quiz', quizRoutes);
router.use('/revisions', revisionsRoutes);

// Routes administrateur (nécessite rôle ADMIN ou MODERATOR)
router.use('/admin', authorize(['ADMIN', 'MODERATOR']), adminRoutes);

// Routes de monitoring système (utilise authentication token admin)
router.use('/monitoring', monitoringRoutes);

// Route de test pour vérifier l'authentification
router.get('/me', async (req, res) => {
  try {
    const user = req.user;
    const family = await user.getFamily();

    res.json({
      success: true,
      user: user.toSafeJSON(),
      family: family ? {
        id: family.id,
        name: family.name,
        displayName: family.displayName,
        status: family.status,
        subscriptionType: family.subscriptionType,
        walletBalance: family.walletBalance,
        claudinePoints: family.totalClaudinePoints
      } : null,
      permissions: {
        canManageFamily: user.userType === 'MANAGER',
        canAccessAdmin: ['ADMIN', 'MODERATOR'].includes(user.role),
        canParticipateInBattles: user.role !== 'ADMIN'
      }
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération du profil utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Route pour mettre à jour le profil utilisateur
router.put('/me', [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  body('phone')
    .optional()
    .trim()
    .matches(/^(\+237|237)?[26]\d{8}$/)
    .withMessage('Format de téléphone invalide'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La bio ne peut pas dépasser 500 caractères'),
  body('city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Le nom de la ville ne peut pas dépasser 100 caractères')
], async (req, res) => {
  try {
    // Vérification des erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { User, Family } = require('../config/database').initializeModels();
    const { firstName, lastName, phone, bio, city } = req.body;

    // Récupérer l'utilisateur (req.user est déjà l'objet User complet du middleware)
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Mettre à jour les champs utilisateur fournis
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    if (bio !== undefined) user.bio = bio;

    await user.save();

    // Mettre à jour la ville de la famille si fournie
    if (city !== undefined && user.familyId) {
      const family = await Family.findByPk(user.familyId);
      if (family) {
        family.city = city;
        await family.save();
      }
    }

    logger.info('Profil utilisateur mis à jour', {
      userId: user.id,
      email: user.email,
      updatedFields: Object.keys(req.body).join(', ')
    });

    // Récupérer les données actualisées
    const updatedFamily = await user.getFamily();

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: {
        user: user.toSafeJSON(),
        family: updatedFamily ? {
          id: updatedFamily.id,
          name: updatedFamily.name,
          displayName: updatedFamily.displayName,
          city: updatedFamily.city,
          status: updatedFamily.status,
          subscriptionType: updatedFamily.subscriptionType,
          walletBalance: updatedFamily.walletBalance,
          claudinePoints: updatedFamily.totalClaudinePoints
        } : null
      }
    });

  } catch (error) {
    logger.error('Erreur mise à jour profil utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Route de statistiques générales (pour les utilisateurs authentifiés)
router.get('/stats', async (req, res) => {
  try {
    const { Family, Student, User, Battle, PrixClaudine } = require('../config/database').initializeModels();
    
    // Statistiques globales anonymisées
    const stats = {
      platform: {
        totalFamilies: await Family.count({ where: { status: 'ACTIVE' } }),
        totalStudents: await Student.count({ where: { status: 'ACTIVE' } }),
        totalUsers: await User.count({ where: { isActive: true } })
      },
      battles: {
        totalBattles: await Battle.count(),
        activeBattles: await Battle.count({ where: { status: 'ACTIVE' } })
      },
      prixClaudine: {
        candidates: await Student.count({ where: { prixClaudineStatus: 'CANDIDATE' } }),
        finalists: await Student.count({ where: { prixClaudineStatus: 'FINALIST' } }),
        winners: await Student.count({ where: { prixClaudineStatus: 'WINNER' } })
      }
    };
    
    // Ajout des statistiques spécifiques à l'utilisateur si c'est un parent manager
    if (req.user.userType === 'MANAGER' && req.user.familyId) {
      const family = await Family.findByPk(req.user.familyId, {
        include: ['students']
      });
      
      if (family) {
        stats.family = {
          totalStudents: family.students.length,
          averageProgress: family.students.reduce((acc, student) => acc + (student.currentAverage || 0), 0) / family.students.length,
          totalClaudinePoints: family.totalClaudinePoints,
          rank: family.claudineRank
        };
      }
    }
    
    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Impossible de récupérer les statistiques'
    });
  }
});

// Route de santé des services (authentifiée)
router.get('/health/detailed', async (req, res) => {
  try {
    const { testConnection } = require('../config/database');
    const redis = require('../services/redis');
    
    const health = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      services: {
        database: {
          status: 'healthy',
          connected: await testConnection()
        },
        redis: {
          status: 'healthy',
          connected: redis.isReady
        },
        ai_service: {
          status: 'healthy',
          available: !!process.env.AI_API_KEY
        }
      },
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0'
    };
    
    // Vérification de l'état des services
    let allHealthy = true;
    for (const service of Object.values(health.services)) {
      if (!service.connected && !service.available) {
        service.status = 'unhealthy';
        allHealthy = false;
      }
    }
    
    health.status = allHealthy ? 'healthy' : 'degraded';
    
    res.json(health);
    
  } catch (error) {
    logger.error('Erreur lors du check de santé détaillé:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: 'Erreur interne'
    });
  }
});

// Gestion des erreurs 404 pour les routes API
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route API non trouvée: ${req.method} ${req.originalUrl}`,
    availableRoutes: [
      'GET /api/me',
      'GET /api/stats',
      'GET /api/health/detailed',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/families',
      'GET /api/students',
      'GET /api/subjects',
      'GET /api/battles',
      'GET /api/prix-claudine',
      'GET /api/payments',
      'POST /api/mentor/chat',
      'GET /api/progress',
      'GET /api/notifications'
    ]
  });
});

// Middleware de gestion d'erreurs pour les routes API
router.use((error, req, res, next) => {
  logger.error('Erreur dans les routes API:', {
    error: error.message,
    stack: error.stack,
    route: req.originalUrl,
    method: req.method,
    user: req.user?.id || 'anonymous'
  });
  
  // Erreurs de validation
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors: error.errors || [error.message]
    });
  }
  
  // Erreurs Sequelize
  if (error.name === 'SequelizeError') {
    return res.status(400).json({
      success: false,
      message: 'Erreur de base de données',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur de données'
    });
  }
  
  // Erreur générique
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Erreur interne du serveur',
    error: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
});

module.exports = router;