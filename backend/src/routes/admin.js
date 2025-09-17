/**
 * Routes Administrateur - Claudyne Backend
 * Gestion complète de la plateforme éducative
 */

const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// Import des modèles (seront disponibles via database.initializeModels())
let models = {};

// Middleware pour initialiser les modèles
router.use(async (req, res, next) => {
  if (Object.keys(models).length === 0) {
    const database = require('../config/database');
    models = database.initializeModels();
  }
  req.models = models;
  next();
});

// ===============================
// DASHBOARD ADMIN PRINCIPAL
// ===============================

router.get('/dashboard', async (req, res) => {
  try {
    const { User, Family, Student, Payment, Battle, Progress } = req.models;

    // Statistiques globales
    const [
      totalFamilies,
      activeFamilies,
      totalStudents,
      activeStudents,
      totalRevenue,
      monthlyRevenue,
      coursesCompleted,
      quizzesTaken
    ] = await Promise.all([
      Family.count(),
      Family.count({ where: { status: 'ACTIVE' } }),
      Student.count(),
      Student.count({ where: { isActive: true } }),
      Payment.sum('amount', { where: { status: 'completed' } }) || 0,
      Payment.sum('amount', {
        where: {
          status: 'completed',
          completedAt: {
            [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }) || 0,
      Progress.count({ where: { status: 'completed' } }),
      Progress.count({ where: { attempts: { [Op.gt]: 0 } } })
    ]);

    // Activités récentes
    const recentActivity = await Promise.all([
      // Nouvelles inscriptions
      Family.findAll({
        limit: 5,
        order: [['createdAt', 'DESC']],
        include: [{
          model: User,
          as: 'members',
          where: { userType: 'MANAGER' },
          limit: 1
        }]
      }),
      // Paiements récents
      Payment.findAll({
        limit: 5,
        where: { status: 'completed' },
        order: [['completedAt', 'DESC']],
        include: [{
          model: Family,
          as: 'family',
          attributes: ['name']
        }]
      }),
      // Quiz récents
      Progress.findAll({
        limit: 5,
        where: { status: 'completed' },
        order: [['completedAt', 'DESC']],
        include: [
          {
            model: Student,
            as: 'student',
            attributes: ['firstName', 'lastName']
          },
          {
            model: models.Lesson,
            as: 'lesson',
            attributes: ['title'],
            include: [{
              model: models.Subject,
              as: 'subject',
              attributes: ['title']
            }]
          }
        ]
      })
    ]);

    const formattedActivity = [
      ...recentActivity[0].map(family => ({
        type: 'new_registration',
        message: `Nouvelle famille: ${family.name}`,
        timestamp: family.createdAt
      })),
      ...recentActivity[1].map(payment => ({
        type: 'payment_received',
        message: `Paiement reçu: ${(payment.amount / 100).toLocaleString()} FCFA (${payment.family?.name})`,
        timestamp: payment.completedAt
      })),
      ...recentActivity[2].map(progress => ({
        type: 'quiz_completed',
        message: `Quiz terminé: ${progress.lesson?.subject?.title} par ${progress.student?.firstName} ${progress.student?.lastName}`,
        timestamp: progress.completedAt
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);

    // Top matières par taux de complétion
    const topPerformingSubjects = await models.Subject.findAll({
      attributes: ['title', 'stats'],
      where: { isActive: true },
      order: [[models.sequelize.literal("(stats->>'completionRate')::int"), 'DESC']],
      limit: 5
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalFamilies,
          activeFamilies,
          totalStudents,
          activeStudents,
          totalRevenue: Math.round(totalRevenue / 100), // Convertir en FCFA
          monthlyRevenue: Math.round(monthlyRevenue / 100),
          coursesCompleted,
          quizzesTaken
        },
        recentActivity: formattedActivity,
        topPerformingSubjects: topPerformingSubjects.map(subject => ({
          name: subject.title,
          completionRate: subject.stats?.completionRate || 0,
          students: subject.stats?.enrolledStudents || 0
        }))
      }
    });

  } catch (error) {
    logger.error('Erreur dashboard admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du dashboard'
    });
  }
});

// ===============================
// GESTION DES UTILISATEURS
// ===============================

router.get('/users', async (req, res) => {
  try {
    const { User, Family, Student } = req.models;
    const { page = 1, limit = 20, search, status, subscriptionType } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (status) {
      where.isActive = status === 'active';
    }

    const users = await User.findAndCountAll({
      where,
      include: [
        {
          model: Family,
          as: 'family',
          attributes: ['id', 'name', 'status', 'subscriptionType', 'walletBalance', 'totalClaudinePoints'],
          where: subscriptionType ? { subscriptionType } : {},
          required: false
        },
        {
          model: Student,
          as: 'studentProfile',
          attributes: ['id', 'firstName', 'lastName', 'level']
        }
      ],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });

    // Formater les données pour l'interface admin
    const formattedUsers = users.rows.map(user => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      familyName: user.family?.name,
      status: user.isActive ? 'active' : 'inactive',
      subscriptionType: user.family?.subscriptionType || 'none',
      registrationDate: user.createdAt,
      lastActivity: user.lastLoginAt,
      totalClaudinePoints: user.family?.totalClaudinePoints || 0,
      children: user.role === 'PARENT' ? (user.family?.students?.length || 0) : 0,
      walletBalance: user.family?.walletBalance || 0
    }));

    res.json({
      success: true,
      data: {
        users: formattedUsers,
        pagination: {
          total: users.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(users.count / limit)
        }
      }
    });

  } catch (error) {
    logger.error('Erreur récupération utilisateurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs'
    });
  }
});

// Extension de période d'essai
router.put('/users/:userId/trial', async (req, res) => {
  try {
    const { userId } = req.params;
    const { trialDays, reason } = req.body;
    const { User, Family, Subscription } = req.models;

    const user = await User.findByPk(userId, {
      include: [{ model: Family, as: 'family' }]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    if (!user.family) {
      return res.status(400).json({
        success: false,
        message: 'Aucune famille associée à cet utilisateur'
      });
    }

    // Mettre à jour ou créer l'abonnement
    let subscription = await Subscription.findOne({ where: { familyId: user.family.id } });

    const newExpirationDate = new Date();
    newExpirationDate.setDate(newExpirationDate.getDate() + parseInt(trialDays));

    if (subscription) {
      await subscription.update({
        expiresAt: newExpirationDate,
        type: 'trial_extended',
        notes: reason
      });
    } else {
      subscription = await Subscription.create({
        familyId: user.family.id,
        type: 'trial_extended',
        status: 'active',
        startedAt: new Date(),
        expiresAt: newExpirationDate,
        notes: reason
      });
    }

    // Mettre à jour le statut de la famille
    await user.family.update({
      status: 'TRIAL',
      subscriptionType: 'trial_extended'
    });

    res.json({
      success: true,
      data: {
        userId: userId,
        trialDaysUpdated: trialDays,
        newExpirationDate: newExpirationDate,
        reason: reason,
        updatedBy: req.user.email,
        updatedAt: new Date()
      },
      message: `Période d'essai mise à jour: ${trialDays} jours`
    });

  } catch (error) {
    logger.error('Erreur extension période d\'essai:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la période d\'essai'
    });
  }
});

// ===============================
// GESTION DES CONTENUS
// ===============================

router.get('/content', async (req, res) => {
  try {
    const { Subject, Lesson, Progress } = req.models;

    // Statistiques des matières
    const subjects = await Subject.findAll({
      where: { isActive: true },
      include: [
        {
          model: Lesson,
          as: 'lessons',
          attributes: [],
          required: false
        }
      ],
      attributes: [
        'id', 'title', 'stats',
        [models.sequelize.fn('COUNT', models.sequelize.col('lessons.id')), 'totalLessons']
      ],
      group: ['Subject.id'],
      order: [['title', 'ASC']]
    });

    // Contenu en attente de validation
    const pendingContent = await Lesson.findAll({
      where: { reviewStatus: 'pending_review' },
      include: [
        {
          model: Subject,
          as: 'subject',
          attributes: ['title']
        }
      ],
      order: [['createdAt', 'ASC']],
      limit: 10
    });

    const formattedSubjects = subjects.map(subject => ({
      id: subject.id,
      title: subject.title,
      lessons: parseInt(subject.getDataValue('totalLessons')) || 0,
      quizzes: subject.stats?.totalQuizzes || 0,
      students: subject.stats?.enrolledStudents || 0,
      averageScore: subject.stats?.averageScore || 0,
      status: 'active'
    }));

    const formattedPendingContent = pendingContent.map(lesson => ({
      id: lesson.id,
      type: 'lesson',
      title: lesson.title,
      subject: lesson.subject?.title,
      level: lesson.level,
      author: lesson.createdBy,
      submissionDate: lesson.createdAt,
      status: lesson.reviewStatus,
      priority: lesson.difficulty === 'Avancé' ? 'high' : 'medium',
      description: lesson.description
    }));

    res.json({
      success: true,
      data: {
        subjects: formattedSubjects,
        pendingContent: formattedPendingContent
      }
    });

  } catch (error) {
    logger.error('Erreur récupération contenu:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du contenu'
    });
  }
});

// ===============================
// GESTION DES PAIEMENTS
// ===============================

router.get('/payments', async (req, res) => {
  try {
    const { Payment, Family } = req.models;
    const { page = 1, limit = 20, status, method, startDate, endDate } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (status) where.status = status;
    if (method) where.paymentMethod = method;
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const payments = await Payment.findAndCountAll({
      where,
      include: [
        {
          model: Family,
          as: 'family',
          attributes: ['name']
        }
      ],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });

    // Calculer le résumé des paiements
    const summary = await Payment.findAll({
      where: { status: 'completed' },
      attributes: [
        [models.sequelize.fn('SUM', models.sequelize.col('amount')), 'totalRevenue'],
        [models.sequelize.fn('SUM', models.sequelize.literal("CASE WHEN DATE_TRUNC('month', \"completedAt\") = DATE_TRUNC('month', CURRENT_DATE) THEN amount ELSE 0 END")), 'monthlyRevenue'],
        [models.sequelize.fn('COUNT', models.sequelize.literal("CASE WHEN status = 'pending' THEN 1 END")), 'pendingPayments'],
        [models.sequelize.fn('COUNT', models.sequelize.literal("CASE WHEN status = 'completed' THEN 1 END")), 'completedPayments'],
        [models.sequelize.fn('AVG', models.sequelize.col('amount')), 'averageTransactionAmount']
      ],
      raw: true
    });

    const formattedPayments = payments.rows.map(payment => ({
      id: payment.transactionId,
      familyName: payment.family?.name,
      amount: Math.round(payment.amount / 100), // Convertir en FCFA
      currency: payment.currency,
      method: payment.paymentMethod,
      status: payment.status,
      planName: payment.metadata?.subscriptionPlan || payment.type,
      transactionDate: payment.createdAt,
      completedDate: payment.completedAt
    }));

    res.json({
      success: true,
      data: {
        transactions: formattedPayments,
        summary: {
          totalRevenue: Math.round((summary[0]?.totalRevenue || 0) / 100),
          monthlyRevenue: Math.round((summary[0]?.monthlyRevenue || 0) / 100),
          pendingPayments: parseInt(summary[0]?.pendingPayments || 0),
          completedPayments: parseInt(summary[0]?.completedPayments || 0),
          averageTransactionAmount: Math.round((summary[0]?.averageTransactionAmount || 0) / 100)
        },
        pagination: {
          total: payments.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(payments.count / limit)
        }
      }
    });

  } catch (error) {
    logger.error('Erreur récupération paiements:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des paiements'
    });
  }
});

// ===============================
// ANALYTICS AVANCÉES
// ===============================

router.get('/analytics', async (req, res) => {
  try {
    const { AnalyticsService } = require('../services/analyticsService');
    const { timeframe = '30d', region } = req.query;

    const analyticsService = new AnalyticsService(req.models);
    const dashboard = await analyticsService.getAdvancedDashboard(timeframe, region);

    res.json({
      success: true,
      data: dashboard
    });

  } catch (error) {
    logger.error('Erreur analytics avancés:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des analytics avancés'
    });
  }
});

// Analytics basiques (compatibilité)
router.get('/analytics/basic', async (req, res) => {
  try {
    const { User, Family, Payment } = req.models;

    // Croissance des utilisateurs par mois
    const userGrowth = await User.findAll({
      attributes: [
        [models.sequelize.fn('DATE_TRUNC', 'month', models.sequelize.col('createdAt')), 'month'],
        [models.sequelize.fn('COUNT', models.sequelize.col('id')), 'users']
      ],
      where: {
        createdAt: {
          [Op.gte]: new Date(new Date().getFullYear(), 0, 1) // Depuis janvier de cette année
        }
      },
      group: [models.sequelize.fn('DATE_TRUNC', 'month', models.sequelize.col('createdAt'))],
      order: [[models.sequelize.fn('DATE_TRUNC', 'month', models.sequelize.col('createdAt')), 'ASC']],
      raw: true
    });

    // Croissance des revenus par mois
    const revenueGrowth = await Payment.findAll({
      attributes: [
        [models.sequelize.fn('DATE_TRUNC', 'month', models.sequelize.col('completedAt')), 'month'],
        [models.sequelize.fn('SUM', models.sequelize.col('amount')), 'revenue']
      ],
      where: {
        status: 'completed',
        completedAt: {
          [Op.gte]: new Date(new Date().getFullYear(), 0, 1)
        }
      },
      group: [models.sequelize.fn('DATE_TRUNC', 'month', models.sequelize.col('completedAt'))],
      order: [[models.sequelize.fn('DATE_TRUNC', 'month', models.sequelize.col('completedAt')), 'ASC']],
      raw: true
    });

    // Statistiques par région (basé sur les métadonnées utilisateur)
    const regionalStats = await Family.findAll({
      attributes: [
        'region',
        [models.sequelize.fn('COUNT', models.sequelize.col('id')), 'families'],
        [models.sequelize.fn('SUM', models.sequelize.col('walletBalance')), 'revenue']
      ],
      where: {
        region: { [Op.ne]: null }
      },
      group: ['region'],
      order: [[models.sequelize.fn('COUNT', models.sequelize.col('id')), 'DESC']],
      raw: true
    });

    // Formater les données pour les graphiques
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                   'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

    const formattedUserGrowth = months.map((month, index) => {
      const data = userGrowth.find(item => new Date(item.month).getMonth() === index);
      return {
        month,
        users: data ? parseInt(data.users) : 0
      };
    });

    const formattedRevenueGrowth = months.map((month, index) => {
      const data = revenueGrowth.find(item => new Date(item.month).getMonth() === index);
      return {
        month,
        revenue: data ? Math.round(parseInt(data.revenue) / 100) : 0
      };
    });

    const formattedRegionalStats = regionalStats.map(stat => ({
      region: stat.region,
      families: parseInt(stat.families),
      revenue: Math.round(parseInt(stat.revenue || 0))
    }));

    res.json({
      success: true,
      data: {
        userGrowth: formattedUserGrowth,
        revenueGrowth: formattedRevenueGrowth,
        regionalStats: formattedRegionalStats
      }
    });

  } catch (error) {
    logger.error('Erreur analytics basiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des analytics basiques'
    });
  }
});

// Export des données analytics
router.get('/analytics/export', async (req, res) => {
  try {
    const { AnalyticsService } = require('../services/analyticsService');
    const { timeframe = '30d', region, format = 'json' } = req.query;

    const analyticsService = new AnalyticsService(req.models);
    const dashboard = await analyticsService.getAdvancedDashboard(timeframe, region);

    if (format === 'csv') {
      // Conversion en CSV pour export Excel
      const csvData = this.convertToCsv(dashboard);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=claudyne-analytics-${timeframe}.csv`);
      res.send(csvData);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=claudyne-analytics-${timeframe}.json`);
      res.json(dashboard);
    }

  } catch (error) {
    logger.error('Erreur export analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'export des analytics'
    });
  }
});

// ===============================
// GESTION DES PARAMÈTRES
// ===============================

router.get('/settings', async (req, res) => {
  try {
    // Pour l'instant, retourner des paramètres par défaut
    // Plus tard, ces données viendront d'une table AdminSettings
    res.json({
      success: true,
      data: {
        platform: {
          siteName: 'Claudyne',
          tagline: 'La force du savoir en héritage',
          supportEmail: 'support@claudyne.com',
          supportPhone: '+237690000000'
        },
        pricing: {
          basicMonthly: 2500,
          premiumMonthly: 4500,
          familyYearly: 45000
        },
        features: {
          maxChildrenPerFamily: 5,
          trialDurationDays: 7,
          claudinePointsEnabled: true,
          achievementsEnabled: true
        },
        notifications: {
          emailNotificationsEnabled: true,
          smsNotificationsEnabled: true,
          pushNotificationsEnabled: false
        }
      }
    });
  } catch (error) {
    logger.error('Erreur paramètres:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des paramètres'
    });
  }
});

// ===============================
// CRÉATION DE COMPTES ADMIN
// ===============================

router.post('/accounts/create', async (req, res) => {
  try {
    const { subscriberId, accountType, formData } = req.body;
    const { User, Family, Student } = req.models;

    // Validation des données
    if (!subscriberId || !accountType || !formData) {
      return res.status(400).json({
        success: false,
        message: 'Données de création de compte manquantes'
      });
    }

    // Validation des champs requis
    const requiredFields = ['email', 'phone', 'subscription'];
    if (accountType === 'individual') {
      requiredFields.push('firstName', 'lastName');
    } else {
      requiredFields.push('familyName', 'parentFirstName', 'parentLastName', 'numChildren');
    }

    const missingFields = requiredFields.filter(field => !formData[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Champs manquants: ${missingFields.join(', ')}`
      });
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return res.status(400).json({
        success: false,
        message: 'Format email invalide'
      });
    }

    // Vérifier si l'email existe déjà
    const existingUser = await User.findOne({ where: { email: formData.email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Un compte avec cet email existe déjà'
      });
    }

    // Créer la famille d'abord
    const familyData = {
      name: accountType === 'individual' ?
        `${formData.firstName} ${formData.lastName}` :
        formData.familyName,
      displayName: accountType === 'individual' ?
        `${formData.firstName} ${formData.lastName}` :
        `Famille ${formData.familyName}`,
      status: formData.subscription === 'trial' ? 'TRIAL' : 'ACTIVE',
      subscriptionType: formData.subscription,
      maxChildren: accountType === 'family' ? parseInt(formData.numChildren) : 1,
      region: formData.region || 'Centre',
      createdBy: req.user.email
    };

    const family = await Family.create(familyData);

    // Créer l'utilisateur parent/gestionnaire
    const userData = {
      firstName: accountType === 'individual' ? formData.firstName : formData.parentFirstName,
      lastName: accountType === 'individual' ? formData.lastName : formData.parentLastName,
      email: formData.email,
      phone: formData.phone,
      role: 'PARENT',
      userType: 'MANAGER',
      familyId: family.id,
      isActive: true,
      registrationSource: 'admin_created',
      createdBy: req.user.email
    };

    const user = await User.create(userData);

    // Si c'est un compte individuel, créer aussi le profil étudiant
    if (accountType === 'individual' && formData.dateOfBirth) {
      await Student.create({
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        level: formData.level || 'CE1',
        familyId: family.id,
        userId: user.id,
        isActive: true,
        registrationSource: 'admin_created'
      });
    }

    res.status(201).json({
      success: true,
      data: {
        account: {
          id: user.id,
          subscriberId: subscriberId,
          accountType: accountType,
          status: familyData.status,
          subscription: formData.subscription,
          email: formData.email,
          phone: formData.phone,
          familyName: family.name,
          createdAt: new Date(),
          createdBy: req.user.email
        },
        message: `Compte ${subscriberId} créé avec succès`
      }
    });

  } catch (error) {
    logger.error('Erreur création compte admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du compte'
    });
  }
});

// ===============================
// PRIX CLAUDINE - GESTION
// ===============================

router.get('/prix-claudine', async (req, res) => {
  try {
    const { PrixClaudineService } = require('../services/prixClaudineService');
    const { PrixClaudine, Student } = req.models;
    const { category, timeframe = 'month', page = 1, limit = 20 } = req.query;

    const prixService = new PrixClaudineService();

    // Récupérer le classement
    const leaderboard = await prixService.getLeaderboard(category, timeframe);

    // Statistiques globales des prix
    const stats = await PrixClaudine.findAll({
      attributes: [
        'category',
        'level',
        [models.sequelize.fn('COUNT', models.sequelize.col('id')), 'count'],
        [models.sequelize.fn('SUM', models.sequelize.col('points')), 'totalPoints']
      ],
      where: timeframe === 'month' ? {
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
      } : { year: new Date().getFullYear() },
      group: ['category', 'level'],
      raw: true
    });

    // Thème du mois actuel
    const currentTheme = prixService.monthlyThemes[new Date().getMonth() + 1];

    // Prix récemment attribués
    const recentPrizes = await PrixClaudine.findAll({
      limit: 10,
      order: [['awardedAt', 'DESC']],
      include: [{
        model: Student,
        as: 'student',
        attributes: ['firstName', 'lastName', 'educationLevel']
      }]
    });

    res.json({
      success: true,
      data: {
        leaderboard: leaderboard.slice(0, parseInt(limit)),
        stats: stats.reduce((acc, stat) => {
          if (!acc[stat.category]) acc[stat.category] = {};
          acc[stat.category][stat.level] = {
            count: parseInt(stat.count),
            totalPoints: parseInt(stat.totalPoints || 0)
          };
          return acc;
        }, {}),
        currentTheme,
        recentPrizes: recentPrizes.map(prize => ({
          id: prize.id,
          student: `${prize.student?.firstName} ${prize.student?.lastName}`,
          category: prize.category,
          badge: prize.badge,
          level: prize.level,
          points: prize.points,
          awardedAt: prize.awardedAt
        })),
        categories: Object.keys(prixService.categories)
      }
    });

  } catch (error) {
    logger.error('Erreur récupération Prix Claudine:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des Prix Claudine'
    });
  }
});

// Lancer l'évaluation mensuelle
router.post('/prix-claudine/evaluate', async (req, res) => {
  try {
    const { PrixClaudineService } = require('../services/prixClaudineService');
    const prixService = new PrixClaudineService();

    // Lancer l'évaluation mensuelle
    const results = await prixService.runMonthlyEvaluation();

    res.json({
      success: true,
      data: results,
      message: `Évaluation terminée: ${results.totalPrizesAwarded} prix attribués`
    });

  } catch (error) {
    logger.error('Erreur évaluation Prix Claudine:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'évaluation des Prix Claudine'
    });
  }
});

// Évaluer un étudiant spécifique
router.post('/prix-claudine/student/:studentId/evaluate', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { PrixClaudineService } = require('../services/prixClaudineService');
    const prixService = new PrixClaudineService();

    const evaluation = await prixService.evaluateStudent(studentId);

    // Attribuer automatiquement les prix éligibles
    const awardedPrizes = [];
    for (const prize of evaluation.eligiblePrizes) {
      const result = await prixService.awardPrize(studentId, prize);
      awardedPrizes.push(result);
    }

    res.json({
      success: true,
      data: {
        evaluation,
        awardedPrizes,
        message: `${awardedPrizes.length} prix attribués à ${evaluation.student.name}`
      }
    });

  } catch (error) {
    logger.error('Erreur évaluation étudiant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'évaluation de l\'étudiant'
    });
  }
});

// ===============================
// AUTRES ROUTES ADMIN
// ===============================

// Historique des extensions d'essai
router.get('/trial-history', async (req, res) => {
  try {
    const { Subscription, Family } = req.models;

    const extensions = await Subscription.findAll({
      where: {
        type: 'trial_extended'
      },
      include: [
        {
          model: Family,
          as: 'family',
          attributes: ['name']
        }
      ],
      order: [['updatedAt', 'DESC']],
      limit: 50
    });

    const formattedExtensions = extensions.map(sub => ({
      id: sub.id,
      familyName: sub.family?.name,
      originalTrialDays: 7, // Valeur par défaut
      extendedTrialDays: Math.ceil((sub.expiresAt - sub.startedAt) / (1000 * 60 * 60 * 24)),
      reason: sub.notes,
      extendedBy: 'admin@claudyne.com', // À améliorer avec le vrai utilisateur
      extendedAt: sub.updatedAt,
      status: sub.status
    }));

    const statistics = {
      totalExtensions: extensions.length,
      averageExtensionDays: formattedExtensions.reduce((sum, ext) => sum + ext.extendedTrialDays, 0) / extensions.length || 0,
      activeExtensions: extensions.filter(ext => ext.status === 'active').length
    };

    res.json({
      success: true,
      data: {
        extensions: formattedExtensions,
        statistics
      }
    });

  } catch (error) {
    logger.error('Erreur historique essais:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'historique'
    });
  }
});

// Statistiques des extensions d'essai
router.get('/trial-stats', async (req, res) => {
  try {
    const { Subscription } = req.models;

    const stats = await Subscription.findAll({
      where: {
        type: 'trial_extended'
      },
      attributes: [
        [models.sequelize.fn('COUNT', models.sequelize.col('id')), 'totalExtensions'],
        [models.sequelize.fn('AVG', models.sequelize.literal('EXTRACT(DAY FROM ("expiresAt" - "startedAt"))')), 'averageExtensionDays'],
        [models.sequelize.fn('COUNT', models.sequelize.literal("CASE WHEN status = 'active' THEN 1 END")), 'activeExtensions']
      ],
      raw: true
    });

    res.json({
      success: true,
      data: {
        totalExtensions: parseInt(stats[0]?.totalExtensions || 0),
        averageExtensionDays: Math.round(parseFloat(stats[0]?.averageExtensionDays || 0)),
        activeExtensions: parseInt(stats[0]?.activeExtensions || 0)
      }
    });

  } catch (error) {
    logger.error('Erreur stats essais:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
});

module.exports = router;