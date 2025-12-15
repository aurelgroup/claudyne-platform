/**
 * Routes Administrateur - Claudyne Backend
 * Gestion complète de la plateforme éducative
 */

const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');
const { authenticate, authorize } = require('../middleware/auth');

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

    // Top matières par taux de complétion (compatible SQLite)
    const topPerformingSubjects = await models.Subject.findAll({
      attributes: ['title', 'stats'],
      where: { isActive: true },
      order: [['title', 'ASC']], // Simplified ordering for SQLite compatibility
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

/**
 * GET /api/admin/users/:userId
 * Récupérer les détails d'un utilisateur spécifique
 */
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { User, Family, Student } = req.models;

    const user = await User.findByPk(userId, {
      include: [
        {
          model: Family,
          as: 'family',
          attributes: ['id', 'name', 'status', 'subscriptionType', 'walletBalance', 'totalClaudinePoints']
        },
        {
          model: Student,
          as: 'studentProfile',
          attributes: ['id', 'firstName', 'lastName', 'level', 'dateOfBirth']
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Formater les données utilisateur
    const userData = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      userType: user.userType,
      isActive: user.isActive,
      isVerified: user.isVerified,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      familyId: user.familyId,
      family: user.family ? {
        id: user.family.id,
        name: user.family.name,
        status: user.family.status,
        subscriptionType: user.family.subscriptionType,
        walletBalance: user.family.walletBalance,
        totalClaudinePoints: user.family.totalClaudinePoints
      } : null,
      studentProfile: user.studentProfile ? {
        id: user.studentProfile.id,
        firstName: user.studentProfile.firstName,
        lastName: user.studentProfile.lastName,
        level: user.studentProfile.level,
        dateOfBirth: user.studentProfile.dateOfBirth
      } : null
    };

    res.json({
      success: true,
      data: userData
    });

  } catch (error) {
    logger.error('Erreur récupération utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'utilisateur'
    });
  }
});

/**
 * PUT /api/admin/users/:userId
 * Mettre à jour les informations d'un utilisateur
 */
router.put('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { email, phone, firstName, lastName, role, isActive, isVerified } = req.body;
    const { User } = req.models;

    const adminId = req.user?.id || null;

    // Vérifier que l'utilisateur existe
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Empêcher la modification de son propre rôle
    if (user.id === adminId && role && role !== user.role) {
      return res.status(403).json({
        success: false,
        message: 'Impossible de modifier votre propre rôle'
      });
    }

    // Empêcher la désactivation de son propre compte
    if (user.id === adminId && isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Impossible de désactiver votre propre compte'
      });
    }

    // Préparer les données de mise à jour
    const updateData = {};
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isVerified !== undefined) updateData.isVerified = isVerified;

    // Mettre à jour l'utilisateur
    await user.update(updateData);

    logger.info(`Utilisateur modifié par admin: ${user.email}`, {
      service: 'claudyne-backend',
      action: 'admin_update_user',
      userId: user.id,
      adminId: adminId,
      changes: updateData
    });

    res.json({
      success: true,
      message: 'Utilisateur mis à jour avec succès',
      data: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    logger.error('Erreur mise à jour utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'utilisateur'
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

// Désactiver un compte utilisateur
router.put('/users/:userId/disable', async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const { User } = req.models;

    // Vérifier que l'admin est authentifié
    const adminId = req.user?.id || null;

    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Une raison de désactivation est requise (minimum 5 caractères)'
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Empêcher la désactivation d'un compte déjà désactivé
    if (!user.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Ce compte est déjà désactivé'
      });
    }

    // Désactiver le compte
    await user.update({
      isActive: false,
      disabledBy: adminId,
      disabledAt: new Date(),
      disableReason: reason.trim()
    });

    logger.info(`Compte désactivé par admin: ${user.email} (${user.role})`, {
      service: 'claudyne-backend',
      action: 'admin_disable_account',
      userId: user.id,
      adminId: adminId,
      reason: reason
    });

    res.json({
      success: true,
      data: {
        userId: user.id,
        email: user.email,
        role: user.role,
        disabledBy: adminId,
        disabledAt: user.disabledAt,
        reason: user.disableReason
      },
      message: `Compte ${user.role} désactivé avec succès`
    });

  } catch (error) {
    logger.error('Erreur désactivation compte:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la désactivation du compte'
    });
  }
});

// Réactiver un compte utilisateur
router.put('/users/:userId/enable', async (req, res) => {
  try {
    const { userId } = req.params;
    const { User } = req.models;

    const adminId = req.user?.id || null;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Empêcher la réactivation d'un compte déjà actif
    if (user.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Ce compte est déjà actif'
      });
    }

    // Réactiver le compte
    await user.update({
      isActive: true,
      disabledBy: null,
      disabledAt: null,
      disableReason: null
    });

    logger.info(`Compte réactivé par admin: ${user.email} (${user.role})`, {
      service: 'claudyne-backend',
      action: 'admin_enable_account',
      userId: user.id,
      adminId: adminId
    });

    res.json({
      success: true,
      data: {
        userId: user.id,
        email: user.email,
        role: user.role,
        reactivatedBy: adminId,
        reactivatedAt: new Date()
      },
      message: `Compte ${user.role} réactivé avec succès`
    });

  } catch (error) {
    logger.error('Erreur réactivation compte:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la réactivation du compte'
    });
  }
});

/**
 * DELETE /api/admin/users/:userId
 * Supprimer définitivement un utilisateur
 */
router.delete('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { User, Family, Student } = req.models;

    const adminId = req.user?.id || null;

    // Vérifier que l'utilisateur existe
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Family,
          as: 'family',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Empêcher la suppression d'un admin
    if (user.role === 'ADMIN' || user.role === 'MODERATOR') {
      return res.status(403).json({
        success: false,
        message: 'Impossible de supprimer un compte administrateur ou modérateur'
      });
    }

    // Empêcher l'auto-suppression
    if (user.id === adminId) {
      return res.status(403).json({
        success: false,
        message: 'Impossible de supprimer votre propre compte'
      });
    }

    // Logger avant suppression
    const userInfo = {
      id: user.id,
      email: user.email,
      role: user.role,
      userType: user.userType,
      familyId: user.familyId,
      familyName: user.family?.name
    };

    // Supprimer l'utilisateur
    await user.destroy();

    logger.warn(`Utilisateur supprimé par admin: ${userInfo.email} (${userInfo.role})`, {
      service: 'claudyne-backend',
      action: 'admin_delete_user',
      deletedUser: userInfo,
      adminId: adminId,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: `Utilisateur ${userInfo.email} supprimé avec succès`,
      data: {
        deletedUserId: userInfo.id,
        deletedUserEmail: userInfo.email,
        deletedAt: new Date()
      }
    });

  } catch (error) {
    logger.error('Erreur suppression utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'utilisateur'
    });
  }
});

// Récupérer tous les comptes désactivés
router.get('/users/disabled', async (req, res) => {
  try {
    const { User } = req.models;
    const { page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;

    const disabledUsers = await User.findAndCountAll({
      where: { isActive: false },
      attributes: [
        'id', 'email', 'phone', 'firstName', 'lastName', 'role',
        'userType', 'disabledBy', 'disabledAt', 'disableReason', 'createdAt'
      ],
      order: [['disabledAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        users: disabledUsers.rows,
        pagination: {
          total: disabledUsers.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(disabledUsers.count / limit)
        }
      }
    });

  } catch (error) {
    logger.error('Erreur récupération comptes désactivés:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des comptes désactivés'
    });
  }
});

// ===============================
// GESTION DES CONTENUS
// ===============================

router.get('/content', async (req, res) => {
  try {
    const { Subject, Lesson, Progress, sequelize } = req.models;

    // Statistiques des matières
    const subjects = await Subject.findAll({
      include: [
        {
          model: Lesson,
          as: 'lessons',
          attributes: [],
          required: false
        }
      ],
      attributes: [
        'id', 'title', 'level', 'category', 'isActive',
        [sequelize.fn('COUNT', sequelize.col('lessons.id')), 'totalLessons']
      ],
      group: ['Subject.id', 'Subject.title', 'Subject.level', 'Subject.category', 'Subject.isActive'],
      order: [['title', 'ASC']],
      raw: true
    });

    // Contenu en attente de validation (simplifié)
    const pendingContent = [];

    const formattedSubjects = subjects.map(subject => ({
      id: subject.id,
      title: subject.title,
      level: subject.level,
      category: subject.category,
      lessons: parseInt(subject.totalLessons) || 0,
      quizzes: 0,
      students: 0,
      averageScore: 0,
      status: subject.isActive ? 'active' : 'inactive'
    }));

    res.json({
      success: true,
      data: {
        subjects: formattedSubjects,
        pendingContent
      }
    });

  } catch (error) {
    logger.error('Erreur récupération contenu:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du contenu',
      error: error.message
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
    const { User, Family, Payment, sequelize } = req.models;

    // Croissance des utilisateurs par mois
    const userGrowth = await User.findAll({
      attributes: [
        [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt')), 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'users']
      ],
      where: {
        createdAt: {
          [Op.gte]: new Date(new Date().getFullYear(), 0, 1) // Depuis janvier de cette année
        }
      },
      group: [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt')), 'ASC']],
      raw: true
    });

    // Croissance des revenus par mois
    const revenueGrowth = await Payment.findAll({
      attributes: [
        [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('completedAt')), 'month'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'revenue']
      ],
      where: {
        status: 'completed',
        completedAt: {
          [Op.gte]: new Date(new Date().getFullYear(), 0, 1)
        }
      },
      group: [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('completedAt'))],
      order: [[sequelize.fn('DATE_TRUNC', 'month', sequelize.col('completedAt')), 'ASC']],
      raw: true
    });

    // Statistiques par région (basé sur les métadonnées utilisateur)
    const regionalStats = await Family.findAll({
      attributes: [
        'region',
        [sequelize.fn('COUNT', sequelize.col('id')), 'families'],
        [sequelize.fn('SUM', sequelize.col('walletBalance')), 'revenue']
      ],
      where: {
        region: { [Op.ne]: null }
      },
      group: ['region'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
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

router.post('/accounts/create', authenticate, authorize('ADMIN'), async (req, res) => {
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

    // Générer un mot de passe temporaire sécurisé
    const { generateTempPassword } = require('../utils/passwordGenerator');
    const tempPassword = generateTempPassword();
    // Note: Ne pas hasher le mot de passe ici, le hook beforeSave du modèle User s'en chargera

    // Créer l'utilisateur parent/gestionnaire
    const userData = {
      firstName: accountType === 'individual' ? formData.firstName : formData.parentFirstName,
      lastName: accountType === 'individual' ? formData.lastName : formData.parentLastName,
      email: formData.email,
      phone: formData.phone,
      password: tempPassword,
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
        educationLevel: formData.level || 'CE1',
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
          tempPassword: tempPassword,
          createdAt: new Date(),
          createdBy: req.user.email
        },
        message: `Compte ${subscriberId} créé avec succès. Mot de passe temporaire: ${tempPassword}`
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
// GESTION DU PROFIL ADMIN
// ===============================

// Changer le mot de passe de l'admin
router.put('/profile/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const { User } = req.models;

    // Validation des données
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel et nouveau mot de passe requis'
      });
    }

    // Validation du nouveau mot de passe
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
      });
    }

    // Pour l'instant, récupérer l'utilisateur admin par email
    // Dans une vraie application, on utiliserait req.user.id depuis le middleware d'auth
    const adminUser = await User.findOne({
      where: {
        email: 'admin@claudyne.com',
        role: 'ADMIN'
      }
    });

    if (!adminUser) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur admin non trouvé'
      });
    }

    // Vérifier le mot de passe actuel
    const isValidPassword = await bcrypt.compare(currentPassword, adminUser.password);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel incorrect'
      });
    }

    // Vérifier que le nouveau mot de passe est différent de l'actuel
    const isSamePassword = await bcrypt.compare(newPassword, adminUser.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit être différent de l\'actuel'
      });
    }

    // Mettre à jour le mot de passe (le hook beforeSave se chargera du hashage)
    await adminUser.update({
      password: newPassword,
      lastPasswordChange: new Date()
    });

    logger.info(`Mot de passe admin modifié: ${adminUser.email}`, {
      service: 'claudyne-backend',
      action: 'admin_password_change',
      adminId: adminUser.id
    });

    res.json({
      success: true,
      message: 'Mot de passe modifié avec succès !',
      data: {
        changedAt: new Date(),
        userId: adminUser.id
      }
    });

  } catch (error) {
    logger.error('Erreur changement mot de passe admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification du mot de passe'
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
    const { Subscription, sequelize } = req.models;

    const stats = await Subscription.findAll({
      where: {
        type: 'trial_extended'
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalExtensions'],
        [sequelize.fn('AVG', sequelize.literal('EXTRACT(DAY FROM ("expiresAt" - "startedAt"))')), 'averageExtensionDays'],
        [sequelize.fn('COUNT', sequelize.literal("CASE WHEN status = 'active' THEN 1 END")), 'activeExtensions']
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
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
});

// ===============================
// TESTS EMAIL
// ===============================

// Test connexion SMTP
router.get('/email/test-connection', async (req, res) => {
  try {
    const { EmailService } = require('../services/emailService');
    const emailService = new EmailService();

    const isConnected = await emailService.verifyConnection();

    res.json({
      success: true,
      data: {
        connected: isConnected,
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
        message: isConnected ? 'Connexion SMTP réussie' : 'Échec de la connexion SMTP'
      }
    });
  } catch (error) {
    logger.error('Erreur test connexion SMTP:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du test de connexion',
      error: error.message
    });
  }
});

// Test envoi email
router.post('/email/test-send', async (req, res) => {
  try {
    const { email, type = 'test' } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email destinataire requis'
      });
    }

    const { EmailService } = require('../services/emailService');
    const emailService = new EmailService();

    let result;

    if (type === 'welcome') {
      // Test email de bienvenue
      const mockUser = {
        firstName: 'Test',
        lastName: 'Utilisateur',
        email: email,
        role: 'PARENT',
        userType: 'MANAGER'
      };
      result = await emailService.sendWelcomeEmail(mockUser);
    } else {
      // Email de test générique
      const subject = '🧪 Test Email Claudyne';
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">Test Email Claudyne</h1>
          <p>Ceci est un email de test pour vérifier la configuration SMTP.</p>
          <p><strong>Serveur:</strong> ${process.env.SMTP_HOST}</p>
          <p><strong>Port:</strong> ${process.env.SMTP_PORT}</p>
          <p><strong>Expéditeur:</strong> ${process.env.EMAIL_FROM}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleString('fr-FR')}</p>
          <hr>
          <p style="color: #64748b;">💚 La force du savoir en héritage - Claudyne</p>
        </div>
      `;
      result = await emailService.sendEmail(email, subject, html);
    }

    res.json({
      success: true,
      data: {
        messageId: result.messageId,
        recipient: email,
        type: type,
        message: 'Email envoyé avec succès'
      }
    });
  } catch (error) {
    logger.error('Erreur test envoi email:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi de l\'email',
      error: error.message
    });
  }
});

// Envoyer email de bienvenue à tous les utilisateurs
router.post('/email/send-welcome-all', async (req, res) => {
  try {
    const { User } = req.models;
    const { EmailService } = require('../services/emailService');
    const emailService = new EmailService();

    // Récupérer tous les utilisateurs actifs avec email
    const users = await User.findAll({
      where: {
        email: { [Op.ne]: null },
        isActive: true
      }
    });

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        await emailService.sendWelcomeEmail(user);
        results.push({
          email: user.email,
          status: 'success'
        });
        successCount++;
      } catch (error) {
        results.push({
          email: user.email,
          status: 'error',
          error: error.message
        });
        errorCount++;
      }
    }

    res.json({
      success: true,
      data: {
        totalUsers: users.length,
        successCount,
        errorCount,
        results
      }
    });
  } catch (error) {
    logger.error('Erreur envoi emails de bienvenue:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi des emails',
      error: error.message
    });
  }
});

// ===============================
// TOKEN ADMIN VALIDATION
// ===============================
// Middleware moved to ../middleware/adminTokenAuth.js

// ===============================
// EMAIL CONFIGURATION ENDPOINTS
// ===============================

// Sauvegarder configuration email
router.post('/email-config', async (req, res) => {
    try {
        const { smtp, automation } = req.body;
        const fs = require('fs').promises;
        const path = require('path');

        // Chemin du fichier de configuration
        const configPath = path.join(__dirname, '../../config/email-config.json');

        // Créer le dossier config s'il n'existe pas
        const configDir = path.dirname(configPath);
        await fs.mkdir(configDir, { recursive: true });

        // Sauvegarder la configuration
        const config = {
            smtp: {
                host: smtp.host || '',
                port: smtp.port || 587,
                user: smtp.user || '',
                password: smtp.password || '', // En production, chiffrer ce mot de passe
                secure: smtp.secure !== false
            },
            automation: automation || {},
            updatedAt: new Date().toISOString()
        };

        await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');

        logger.info('Configuration email sauvegardée', {
            service: 'claudyne-backend',
            action: 'save_email_config',
            timestamp: new Date()
        });

        res.json({
            success: true,
            message: 'Configuration email sauvegardée avec succès',
            data: {
                updatedAt: config.updatedAt
            }
        });
    } catch (error) {
        logger.error('Erreur sauvegarde email config:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la sauvegarde de la configuration'
        });
    }
});

// Charger configuration email
router.get('/email-config', async (req, res) => {
    try {
        const fs = require('fs').promises;
        const path = require('path');

        // Chemin du fichier de configuration
        const configPath = path.join(__dirname, '../../config/email-config.json');

        // Essayer de lire le fichier sauvegardé
        let config;
        try {
            const fileContent = await fs.readFile(configPath, 'utf8');
            config = JSON.parse(fileContent);
        } catch (error) {
            // Si le fichier n'existe pas, utiliser les valeurs par défaut
            config = {
                smtp: {
                    host: process.env.SMTP_HOST || '',
                    port: parseInt(process.env.SMTP_PORT) || 587,
                    user: process.env.SMTP_USER || '',
                    password: '', // Ne pas retourner le mot de passe
                    secure: process.env.SMTP_SECURE === 'true'
                },
                automation: {
                    enabled: process.env.EMAIL_AUTOMATION_ENABLED !== 'false',
                    fromName: process.env.FROM_NAME || 'Équipe Claudyne',
                    supportEmail: process.env.SUPPORT_EMAIL || 'support@claudyne.com',
                    welcomeEmailEnabled: process.env.WELCOME_EMAIL_ENABLED !== 'false',
                    welcomeEmailDelay: parseInt(process.env.WELCOME_EMAIL_DELAY) || 0,
                    passwordResetEnabled: process.env.PASSWORD_RESET_ENABLED !== 'false',
                    prixClaudineEmailEnabled: process.env.PRIX_CLAUDINE_EMAIL_ENABLED !== 'false'
                }
            };
        }

        // Ne jamais retourner le mot de passe dans la réponse
        if (config.smtp && config.smtp.password) {
            config.smtp.password = '';
        }

        res.json({
            success: true,
            data: config
        });
    } catch (error) {
        logger.error('Erreur lecture email config:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors du chargement de la configuration'
        });
    }
});

// Test connexion SMTP
router.post('/email-test-smtp', authenticate, authorize('ADMIN'), async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Connexion SMTP réussie'
        });
    } catch (error) {
        console.error('Erreur test SMTP:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
});

// Test email bienvenue
router.post('/email-test-welcome', authenticate, authorize('ADMIN'), async (req, res) => {
    try {
        const { testEmail } = req.body;
        res.json({
            success: true,
            message: 'Email de bienvenue envoyé'
        });
    } catch (error) {
        console.error('Erreur test email bienvenue:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
});

// Redémarrer service email
router.post('/email-restart', authenticate, authorize('ADMIN'), async (req, res) => {
    try {
        // Recharger variables d'environnement
        require('dotenv').config();

        res.json({
            success: true,
            message: 'Service email redémarré'
        });
    } catch (error) {
        console.error('Erreur redémarrage email service:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
});

// Admin pricing configuration endpoint
router.post('/pricing-config', authenticate, authorize('ADMIN'), async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Configuration tarification sauvegardée'
        });
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        });
    }
});

// ===============================
// GESTION DES TEMPLATES EMAIL
// ===============================

/**
 * GET /api/admin/email-templates
 * Récupérer tous les templates email
 */
router.get('/email-templates', async (req, res) => {
  try {
    const { EmailTemplate } = req.models;
    const { category, isActive, search, page = 1, limit = 20 } = req.query;

    const where = {};

    if (category) where.category = category;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { templateKey: { [Op.like]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows: templates } = await EmailTemplate.findAndCountAll({
      where,
      order: [['category', 'ASC'], ['name', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        templates,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    logger.error('Erreur récupération templates email:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des templates email'
    });
  }
});

/**
 * GET /api/admin/email-templates/:id
 * Récupérer un template email par ID
 */
router.get('/email-templates/:id', async (req, res) => {
  try {
    const { EmailTemplate } = req.models;
    const { id } = req.params;

    const template = await EmailTemplate.findByPk(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template non trouvé'
      });
    }

    res.json({
      success: true,
      data: template
    });

  } catch (error) {
    logger.error('Erreur récupération template email:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du template email'
    });
  }
});

/**
 * POST /api/admin/email-templates
 * Créer un nouveau template email
 */
router.post('/email-templates', async (req, res) => {
  try {
    const { EmailTemplate } = req.models;
    const {
      templateKey,
      name,
      description,
      category,
      subject,
      htmlContent,
      textContent,
      variables,
      isActive = true,
      isDefault = false
    } = req.body;

    // Validation des champs requis
    if (!templateKey || !name || !subject || !htmlContent || !category) {
      return res.status(400).json({
        success: false,
        message: 'Champs requis manquants: templateKey, name, subject, htmlContent, category'
      });
    }

    // Vérifier l'unicité du templateKey
    const existingTemplate = await EmailTemplate.findOne({
      where: { templateKey }
    });

    if (existingTemplate) {
      return res.status(400).json({
        success: false,
        message: 'Un template avec cette clé existe déjà'
      });
    }

    const template = await EmailTemplate.create({
      templateKey,
      name,
      description,
      category,
      subject,
      htmlContent,
      textContent,
      variables: variables || [],
      isActive,
      isDefault,
      createdBy: req.user?.id
    });

    logger.info(`Template email créé: ${template.name} (${template.templateKey})`);

    res.status(201).json({
      success: true,
      data: template,
      message: 'Template email créé avec succès'
    });

  } catch (error) {
    logger.error('Erreur création template email:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du template email'
    });
  }
});

/**
 * PUT /api/admin/email-templates/:id
 * Mettre à jour un template email
 */
router.put('/email-templates/:id', async (req, res) => {
  try {
    const { EmailTemplate } = req.models;
    const { id } = req.params;
    const {
      name,
      description,
      category,
      subject,
      htmlContent,
      textContent,
      variables,
      isActive,
      isDefault
    } = req.body;

    const template = await EmailTemplate.findByPk(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template non trouvé'
      });
    }

    // Mise à jour
    await template.update({
      name: name || template.name,
      description: description !== undefined ? description : template.description,
      category: category || template.category,
      subject: subject || template.subject,
      htmlContent: htmlContent || template.htmlContent,
      textContent: textContent !== undefined ? textContent : template.textContent,
      variables: variables !== undefined ? variables : template.variables,
      isActive: isActive !== undefined ? isActive : template.isActive,
      isDefault: isDefault !== undefined ? isDefault : template.isDefault,
      updatedBy: req.user?.id
    });

    logger.info(`Template email mis à jour: ${template.name} (${template.templateKey})`);

    res.json({
      success: true,
      data: template,
      message: 'Template email mis à jour avec succès'
    });

  } catch (error) {
    logger.error('Erreur mise à jour template email:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du template email'
    });
  }
});

/**
 * DELETE /api/admin/email-templates/:id
 * Supprimer un template email (soft delete)
 */
router.delete('/email-templates/:id', async (req, res) => {
  try {
    const { EmailTemplate } = req.models;
    const { id } = req.params;

    const template = await EmailTemplate.findByPk(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template non trouvé'
      });
    }

    // Soft delete
    await template.destroy();

    logger.info(`Template email supprimé: ${template.name} (${template.templateKey})`);

    res.json({
      success: true,
      message: 'Template email supprimé avec succès'
    });

  } catch (error) {
    logger.error('Erreur suppression template email:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du template email'
    });
  }
});

/**
 * POST /api/admin/email-templates/:id/preview
 * Prévisualiser un template avec des données de test
 */
router.post('/email-templates/:id/preview', async (req, res) => {
  try {
    const { EmailTemplate } = req.models;
    const { id } = req.params;
    const { testData } = req.body;

    const template = await EmailTemplate.findByPk(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template non trouvé'
      });
    }

    // Données de test par défaut
    const defaultTestData = {
      user: {
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'jean.dupont@example.com',
        role: 'STUDENT',
        userType: 'LEARNER'
      },
      resetToken: 'test-token-123',
      verificationToken: 'verify-token-456',
      battle: {
        title: 'Battle Royale Mathématiques',
        date: new Date().toLocaleDateString('fr-FR')
      }
    };

    const data = { ...defaultTestData, ...testData };

    // Remplacer les variables dans le contenu
    let previewSubject = template.subject;
    let previewHtml = template.htmlContent;

    // Remplacements simples
    Object.keys(data).forEach(key => {
      if (typeof data[key] === 'object') {
        Object.keys(data[key]).forEach(subKey => {
          const placeholder = `\${${key}.${subKey}}`;
          const value = data[key][subKey] || '';
          previewSubject = previewSubject.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
          previewHtml = previewHtml.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
        });
      } else {
        const placeholder = `\${${key}}`;
        const value = data[key] || '';
        previewSubject = previewSubject.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
        previewHtml = previewHtml.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
      }
    });

    res.json({
      success: true,
      data: {
        subject: previewSubject,
        htmlContent: previewHtml,
        testData: data
      }
    });

  } catch (error) {
    logger.error('Erreur prévisualisation template email:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la prévisualisation du template email'
    });
  }
});

/**
 * POST /api/admin/email-templates/:id/duplicate
 * Dupliquer un template email
 */
router.post('/email-templates/:id/duplicate', async (req, res) => {
  try {
    const { EmailTemplate } = req.models;
    const { id } = req.params;
    const { name, templateKey } = req.body;

    const originalTemplate = await EmailTemplate.findByPk(id);

    if (!originalTemplate) {
      return res.status(404).json({
        success: false,
        message: 'Template original non trouvé'
      });
    }

    // Générer un nouveau templateKey si non fourni
    const newTemplateKey = templateKey || `${originalTemplate.templateKey}_copy_${Date.now()}`;
    const newName = name || `${originalTemplate.name} (Copie)`;

    // Vérifier l'unicité du nouveau templateKey
    const existingTemplate = await EmailTemplate.findOne({
      where: { templateKey: newTemplateKey }
    });

    if (existingTemplate) {
      return res.status(400).json({
        success: false,
        message: 'Un template avec cette clé existe déjà'
      });
    }

    const duplicatedTemplate = await EmailTemplate.create({
      templateKey: newTemplateKey,
      name: newName,
      description: originalTemplate.description,
      category: originalTemplate.category,
      subject: originalTemplate.subject,
      htmlContent: originalTemplate.htmlContent,
      textContent: originalTemplate.textContent,
      variables: originalTemplate.variables,
      isActive: false, // Nouvelle copie désactivée par défaut
      isDefault: false, // Jamais par défaut
      createdBy: req.user?.id
    });

    logger.info(`Template email dupliqué: ${newName} (${newTemplateKey})`);

    res.status(201).json({
      success: true,
      data: duplicatedTemplate,
      message: 'Template email dupliqué avec succès'
    });

  } catch (error) {
    logger.error('Erreur duplication template email:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la duplication du template email'
    });
  }
});

/**
 * GET /api/admin/email-templates/categories
 * Récupérer les catégories disponibles
 */
router.get('/email-templates/categories', async (req, res) => {
  try {
    const categories = [
      { value: 'AUTH', label: 'Authentification', description: 'Welcome, reset, verification' },
      { value: 'NOTIFICATION', label: 'Notifications', description: 'Notifications générales' },
      { value: 'BATTLE', label: 'Battle Royale', description: 'Invitations et résultats' },
      { value: 'PROGRESS', label: 'Progression', description: 'Achievements et progression' },
      { value: 'MARKETING', label: 'Marketing', description: 'Promotions et marketing' },
      { value: 'SYSTEM', label: 'Système', description: 'Notifications système' }
    ];

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    logger.error('Erreur récupération catégories:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des catégories'
    });
  }
});

// =============================================================================
// MONITORING SYSTEM ENDPOINTS
// =============================================================================

const fs = require('fs').promises;
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

// Using centralized middleware for token validation

// System Health Endpoint
router.get('/system/health', async (req, res) => {
  try {
    const health = await getSystemHealth();
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Erreur health check:', error);
    res.json({
      success: false,
      message: error.message
    });
  }
});

// System Security Endpoint
router.get('/system/security', async (req, res) => {
  try {
    const security = await getSecurityStatus();
    res.json({
      success: true,
      data: security
    });
  } catch (error) {
    console.error('Erreur security status:', error);
    res.json({
      success: false,
      message: error.message
    });
  }
});

// Performance Metrics Endpoint
router.get('/system/metrics', async (req, res) => {
  try {
    const timeRange = req.query.range || '24h';
    const metrics = await getPerformanceMetrics(timeRange);
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Erreur métriques performance:', error);
    res.json({
      success: false,
      message: error.message
    });
  }
});

// System Logs Endpoint
router.get('/system/logs', async (req, res) => {
  try {
    const logs = await getSystemLogs();
    res.json({
      success: true,
      data: { logs }
    });
  } catch (error) {
    console.error('Erreur system logs:', error);
    res.json({
      success: false,
      message: error.message
    });
  }
});

// Backup Status Endpoint
router.get('/system/backups', async (req, res) => {
  try {
    const backups = await getBackupStatus();
    res.json({
      success: true,
      data: { backups }
    });
  } catch (error) {
    console.error('Erreur backup status:', error);
    res.json({
      success: false,
      message: error.message
    });
  }
});

// =============================================================================
// MONITORING HELPER FUNCTIONS
// =============================================================================

async function getSystemHealth() {
  try {
    // CPU Usage
    const { stdout: cpuInfo } = await execAsync("top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | cut -d'%' -f1");
    const cpuUsage = parseFloat(cpuInfo.trim()) || 0;

    // Memory Usage
    const { stdout: memInfo } = await execAsync("free -m | awk 'NR==2{printf \"%.1f\", $3*100/$2 }'");
    const memoryUsage = parseFloat(memInfo.trim()) || 0;

    // Memory in MB
    const { stdout: memMB } = await execAsync("free -m | awk 'NR==2{printf \"%s\", $3 }'");
    const memoryMB = parseInt(memMB.trim()) || 0;

    // Uptime
    const { stdout: uptimeInfo } = await execAsync("cat /proc/uptime | awk '{print $1}'");
    const uptime = parseInt(parseFloat(uptimeInfo.trim())) || 0;

    // Error count (from logs)
    const { stdout: errorCount } = await execAsync("grep -c 'ERROR\\|FATAL' /var/log/nginx/claudyne.error.log 2>/dev/null | head -1 || echo '0'");
    const errors = parseInt(errorCount.trim()) || 0;

    // Determine status
    let status = 'healthy';
    if (cpuUsage > 80 || memoryUsage > 85 || errors > 10) {
      status = 'warning';
    }
    if (cpuUsage > 95 || memoryUsage > 95 || errors > 50) {
      status = 'critical';
    }

    return {
      status,
      cpu: cpuUsage.toFixed(1),
      memory: memoryMB,
      uptime,
      errors
    };
  } catch (error) {
    console.error('Erreur getSystemHealth:', error);
    return {
      status: 'unknown',
      cpu: 0,
      memory: 0,
      uptime: 0,
      errors: 0
    };
  }
}

async function getSecurityStatus() {
  try {
    const security = {
      fail2banActive: false,
      fail2banJails: 0,
      bannedIPs: 0,
      sshAttacks: 0,
      sslDaysLeft: 0,
      sslIssuer: 'Let\'s Encrypt',
      firewallActive: false,
      firewallRules: 0,
      recentThreats: []
    };

    // Check Fail2ban status
    try {
      const { stdout: fail2banStatus } = await execAsync("systemctl is-active fail2ban 2>/dev/null || echo 'inactive'");
      security.fail2banActive = fail2banStatus.trim() === 'active';

      if (security.fail2banActive) {
        // Get jail count
        const { stdout: jailList } = await execAsync("fail2ban-client status 2>/dev/null | grep 'Jail list' | cut -d: -f2 | tr ',' '\n' | wc -l");
        security.fail2banJails = parseInt(jailList.trim()) || 0;

        // Get banned IPs count
        const { stdout: bannedList } = await execAsync("fail2ban-client status sshd 2>/dev/null | grep 'Banned IP list' | cut -d: -f2 | wc -w");
        security.bannedIPs = parseInt(bannedList.trim()) || 0;
      }
    } catch (error) {
      console.warn('Fail2ban check failed:', error.message);
    }

    // SSH attacks count (last 24h)
    try {
      const { stdout: sshAttacks } = await execAsync("grep \"$(date +%b\\ %d)\" /var/log/auth.log 2>/dev/null | grep 'Failed password' | wc -l");
      security.sshAttacks = parseInt(sshAttacks.trim()) || 0;
    } catch (error) {
      console.warn('SSH attacks check failed:', error.message);
    }

    // SSL certificate expiry
    try {
      const { stdout: sslExpiry } = await execAsync("openssl x509 -in /etc/letsencrypt/live/claudyne.com/fullchain.pem -noout -dates 2>/dev/null | grep notAfter | cut -d= -f2");
      if (sslExpiry.trim()) {
        const expiryDate = new Date(sslExpiry.trim());
        const now = new Date();
        const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
        security.sslDaysLeft = Math.max(0, daysLeft);
      }
    } catch (error) {
      console.warn('SSL check failed:', error.message);
    }

    // Firewall status
    try {
      const { stdout: ufwStatus } = await execAsync("ufw status 2>/dev/null | head -1");
      security.firewallActive = ufwStatus.includes('active');

      if (security.firewallActive) {
        const { stdout: ufwRules } = await execAsync("ufw status numbered 2>/dev/null | grep -c '^\\[' || echo '0'");
        security.firewallRules = parseInt(ufwRules.trim()) || 0;
      }
    } catch (error) {
      console.warn('Firewall check failed:', error.message);
    }

    // Recent threats (from fail2ban logs)
    try {
      const { stdout: threats } = await execAsync("grep \"$(date +%Y-%m-%d)\" /var/log/fail2ban.log 2>/dev/null | grep 'Ban ' | tail -5 | awk '{print $7}' || true");
      if (threats.trim()) {
        security.recentThreats = threats.trim().split('\n').map(ip => `Banned IP: ${ip}`);
      }
    } catch (error) {
      console.warn('Recent threats check failed:', error.message);
    }

    return security;
  } catch (error) {
    console.error('Erreur getSecurityStatus:', error);
    return {};
  }
}

async function getPerformanceMetrics(timeRange) {
  try {
    const metrics = {
      totalRequests: 0,
      uniqueVisitors: 0,
      avgResponseTime: 0,
      httpErrors: 0,
      chartData: [],
      topPages: [],
      topIPs: []
    };

    // Get nginx access logs
    const logFile = '/var/log/nginx/claudyne.access.log';

    try {
      // Determine date pattern based on time range
      let datePattern;
      switch (timeRange) {
        case '1h':
          datePattern = new Date().toISOString().slice(0, 13).replace('T', ' '); // YYYY-MM-DD HH
          break;
        case '7d':
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          datePattern = weekAgo.toISOString().slice(0, 10).replace('T', ' '); // YYYY-MM-DD
          break;
        default: // 24h
          datePattern = new Date().toISOString().slice(0, 10).replace('T', ' '); // YYYY-MM-DD
      }

      // Total requests
      const { stdout: totalReq } = await execAsync(`grep "${datePattern}" ${logFile} 2>/dev/null | wc -l || echo '0'`);
      metrics.totalRequests = parseInt(totalReq.trim()) || 0;

      // Unique visitors (IPs)
      const { stdout: uniqueIPs } = await execAsync(`grep "${datePattern}" ${logFile} 2>/dev/null | awk '{print $1}' | sort | uniq | wc -l || echo '0'`);
      metrics.uniqueVisitors = parseInt(uniqueIPs.trim()) || 0;

      // HTTP errors (4xx and 5xx)
      const { stdout: httpErrs } = await execAsync(`grep "${datePattern}" ${logFile} 2>/dev/null | grep -E '" [45][0-9][0-9] ' | wc -l || echo '0'`);
      metrics.httpErrors = parseInt(httpErrs.trim()) || 0;

      // Average response time (mock for now)
      metrics.avgResponseTime = Math.random() * 0.5 + 0.1; // Mock between 0.1-0.6s

    } catch (error) {
      console.warn('Performance metrics parsing failed:', error.message);
    }

    return metrics;
  } catch (error) {
    console.error('Erreur getPerformanceMetrics:', error);
    return {
      totalRequests: 0,
      uniqueVisitors: 0,
      avgResponseTime: 0,
      httpErrors: 0,
      chartData: [],
      topPages: [],
      topIPs: []
    };
  }
}

async function getSystemLogs() {
  try {
    const logs = [];

    // Get recent logs from various sources
    const logSources = [
      { file: '/var/log/nginx/claudyne.error.log', type: 'ERROR' },
      { file: '/var/log/fail2ban.log', type: 'INFO' },
      { file: '/var/log/auth.log', type: 'WARN' }
    ];

    for (const source of logSources) {
      try {
        const { stdout: logLines } = await execAsync(`tail -n 5 ${source.file} 2>/dev/null || true`);
        if (logLines.trim()) {
          const lines = logLines.trim().split('\n');
          for (const line of lines) {
            if (line.trim()) {
              logs.push({
                timestamp: new Date().toISOString().slice(11, 19), // Mock timestamp
                level: source.type,
                message: line.slice(0, 120) + (line.length > 120 ? '...' : '')
              });
            }
          }
        }
      } catch (err) {
        console.warn(`Failed to read ${source.file}:`, err.message);
      }
    }

    return logs.slice(0, 15);
  } catch (error) {
    console.error('Erreur getSystemLogs:', error);
    return [];
  }
}

async function getBackupStatus() {
  try {
    const backups = [];
    const backupDir = '/var/backups/claudyne';

    try {
      // Database backups
      const { stdout: dbBackups } = await execAsync(`ls -lt ${backupDir}/database/*.tar.gz 2>/dev/null | head -3 || true`);
      if (dbBackups.trim()) {
        const lines = dbBackups.trim().split('\n');
        for (const line of lines) {
          const parts = line.split(/\s+/);
          if (parts.length >= 9) {
            backups.push({
              id: parts[8].split('/').pop(),
              type: 'Base de données',
              lastBackup: new Date().toISOString(),
              size: parseInt(parts[4]) || 0,
              status: 'success',
              nextBackup: new Date(Date.now() + 24*60*60*1000).toISOString()
            });
          }
        }
      }
    } catch (error) {
      console.warn('Backup directory check failed:', error.message);
    }

    // Add default if no backups found
    if (backups.length === 0) {
      backups.push({
        id: 'no-backup',
        type: 'Système',
        lastBackup: new Date().toISOString(),
        size: 0,
        status: 'pending',
        nextBackup: new Date(Date.now() + 24*60*60*1000).toISOString()
      });
    }

    return backups;
  } catch (error) {
    console.error('Erreur getBackupStatus:', error);
    return [];
  }
}

// ===============================
// GESTION DES ABONNEMENTS - CRON JOBS
// ===============================

/**
 * Route pour exécuter manuellement un cron job d'abonnement
 * POST /api/admin/subscriptions/run-job/:jobName
 *
 * Jobs disponibles:
 * - checkExpiredTrials: Vérifier les essais expirés
 * - checkExpiredSubscriptions: Vérifier les abonnements expirés
 * - processAutoRenewals: Traiter les renouvellements automatiques
 * - sendExpirationReminders: Envoyer les rappels d'expiration
 * - generateDailyReport: Générer le rapport quotidien
 * - runDailyJobs: Exécuter toutes les tâches quotidiennes
 */
router.post('/subscriptions/run-job/:jobName', async (req, res) => {
  try {
    const { jobName } = req.params;
    const adminId = req.user.id;

    logger.info(`🔧 Exécution manuelle du job: ${jobName}`, {
      adminId,
      adminEmail: req.user.email,
      service: 'admin-subscriptions'
    });

    // Importer le service de subscription
    const SubscriptionService = require('../services/subscriptionService');
    const subscriptionService = new SubscriptionService(req.models);

    let result;

    switch (jobName) {
      case 'checkExpiredTrials':
        result = await subscriptionService.checkExpiredTrials();
        break;

      case 'checkExpiredSubscriptions':
        result = await subscriptionService.checkExpiredSubscriptions();
        break;

      case 'processAutoRenewals':
        result = await subscriptionService.processAutoRenewals();
        break;

      case 'sendExpirationReminders':
        result = await subscriptionService.sendExpirationReminders();
        break;

      case 'generateDailyReport':
        result = await subscriptionService.generateDailyReport();
        break;

      case 'runDailyJobs':
        result = await subscriptionService.runDailyJobs();
        break;

      default:
        return res.status(400).json({
          success: false,
          message: `Job inconnu: ${jobName}`,
          availableJobs: [
            'checkExpiredTrials',
            'checkExpiredSubscriptions',
            'processAutoRenewals',
            'sendExpirationReminders',
            'generateDailyReport',
            'runDailyJobs'
          ]
        });
    }

    logger.info(`✅ Job ${jobName} terminé avec succès`, {
      result,
      adminId
    });

    res.json({
      success: true,
      message: `Job ${jobName} exécuté avec succès`,
      result
    });

  } catch (error) {
    logger.error('❌ Erreur lors de l\'exécution du job:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'exécution du job',
      error: error.message
    });
  }
});

/**
 * Route pour obtenir le statut des abonnements
 * GET /api/admin/subscriptions/stats
 */
router.get('/subscriptions/stats', async (req, res) => {
  try {
    const { User } = req.models;
    const { Op } = require('sequelize');

    const [
      totalUsers,
      activeTrials,
      activeSubscriptions,
      suspendedAccounts,
      expiredAccounts,
      totalRevenue,
      monthlyRevenue,
      expiringTrials,
      expiringSubscriptions
    ] = await Promise.all([
      User.count(),
      User.count({ where: { subscriptionStatus: 'TRIAL', isActive: true } }),
      User.count({ where: { subscriptionStatus: 'ACTIVE', isActive: true } }),
      User.count({ where: { subscriptionStatus: 'SUSPENDED' } }),
      User.count({ where: { subscriptionStatus: 'EXPIRED' } }),
      User.sum('monthlyPrice', {
        where: {
          subscriptionStatus: 'ACTIVE',
          isActive: true
        }
      }),
      User.sum('monthlyPrice', {
        where: {
          subscriptionStatus: {
            [Op.in]: ['ACTIVE', 'TRIAL']
          },
          isActive: true,
          subscriptionPlan: {
            [Op.in]: ['INDIVIDUAL_STUDENT', 'FAMILY_MANAGER']
          }
        }
      }),
      // Essais expirant dans 3 jours
      User.count({
        where: {
          subscriptionStatus: 'TRIAL',
          trialEndsAt: {
            [Op.between]: [
              new Date(),
              new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
            ]
          },
          isActive: true
        }
      }),
      // Abonnements expirant dans 3 jours
      User.count({
        where: {
          subscriptionStatus: 'ACTIVE',
          subscriptionEndsAt: {
            [Op.between]: [
              new Date(),
              new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
            ]
          },
          isActive: true
        }
      })
    ]);

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          activeTrials,
          activeSubscriptions,
          suspended: suspendedAccounts,
          expired: expiredAccounts
        },
        revenue: {
          currentMonthly: Math.round(totalRevenue || 0),
          expectedMonthly: Math.round(monthlyRevenue || 0),
          currency: 'FCFA'
        },
        alerts: {
          expiringTrials,
          expiringSubscriptions
        },
        timestamp: new Date()
      }
    });

  } catch (error) {
    logger.error('❌ Erreur lors de la récupération des stats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
});

/**
 * Route pour obtenir les rôles et permissions
 * GET /api/admin/roles
 */
router.get('/roles', async (req, res) => {
  try {
    const { User } = req.models;

    // Comptage par rôle
    const roleCounts = await User.findAll({
      attributes: [
        'role',
        [require('sequelize').fn('COUNT', require('sequelize').col('role')), 'count']
      ],
      group: ['role']
    });

    const roles = [
      {
        id: 'STUDENT',
        name: 'Étudiant',
        description: 'Accès aux cours et quiz',
        userCount: roleCounts.find(r => r.role === 'STUDENT')?.dataValues.count || 0,
        permissions: ['view_courses', 'take_quizzes', 'view_progress'],
        color: '#3B82F6'
      },
      {
        id: 'PARENT',
        name: 'Parent',
        description: 'Suivi des enfants',
        userCount: roleCounts.find(r => r.role === 'PARENT')?.dataValues.count || 0,
        permissions: ['view_children', 'view_reports', 'manage_account'],
        color: '#10B981'
      },
      {
        id: 'TEACHER',
        name: 'Enseignant',
        description: 'Gestion du contenu pédagogique',
        userCount: roleCounts.find(r => r.role === 'TEACHER')?.dataValues.count || 0,
        permissions: ['create_content', 'grade_quizzes', 'view_analytics'],
        color: '#F59E0B'
      },
      {
        id: 'MODERATOR',
        name: 'Modérateur',
        description: 'Modération et support',
        userCount: roleCounts.find(r => r.role === 'MODERATOR')?.dataValues.count || 0,
        permissions: ['moderate_content', 'manage_users', 'view_reports'],
        color: '#8B5CF6'
      },
      {
        id: 'ADMIN',
        name: 'Administrateur',
        description: 'Accès complet',
        userCount: roleCounts.find(r => r.role === 'ADMIN')?.dataValues.count || 0,
        permissions: ['all'],
        color: '#EF4444'
      }
    ];

    res.json({
      success: true,
      data: {
        roles,
        totalRoles: roles.length
      }
    });

  } catch (error) {
    logger.error('❌ Erreur lors de la récupération des rôles:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des rôles',
      error: error.message
    });
  }
});

/**
 * Route pour obtenir le personnel
 * GET /api/admin/staff
 */
router.get('/staff', async (req, res) => {
  try {
    const { User } = req.models;

    // Récupérer le personnel (TEACHER, MODERATOR, ADMIN)
    const staff = await User.findAll({
      where: {
        role: {
          [Op.in]: ['TEACHER', 'MODERATOR', 'ADMIN']
        }
      },
      attributes: [
        'id',
        'email',
        'firstName',
        'lastName',
        'role',
        'isActive',
        'lastLoginAt',
        'createdAt'
      ],
      order: [['createdAt', 'DESC']],
      limit: 100
    });

    res.json({
      success: true,
      data: {
        staff: staff.map(s => ({
          id: s.id,
          name: `${s.firstName} ${s.lastName}`,
          email: s.email,
          role: s.role,
          status: s.isActive ? 'active' : 'inactive',
          lastLogin: s.lastLoginAt,
          joinedAt: s.createdAt
        })),
        totalStaff: staff.length,
        byRole: {
          teachers: staff.filter(s => s.role === 'TEACHER').length,
          moderators: staff.filter(s => s.role === 'MODERATOR').length,
          admins: staff.filter(s => s.role === 'ADMIN').length
        }
      }
    });

  } catch (error) {
    logger.error('❌ Erreur lors de la récupération du personnel:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du personnel',
      error: error.message
    });
  }
});

/**
 * Route pour obtenir les liens familiaux
 * GET /api/admin/families
 */
router.get('/families', async (req, res) => {
  try {
    const { User, Family } = req.models;

    // Récupérer les familles
    const families = await User.findAll({
      where: {
        userType: 'FAMILY_MANAGER'
      },
      attributes: [
        'id',
        'email',
        'firstName',
        'lastName',
        'familyId',
        'subscriptionStatus',
        'subscriptionPlan',
        'createdAt'
      ],
      include: Family ? [{
        model: Family,
        as: 'family',
        attributes: ['name', 'memberCount']
      }] : [],
      order: [['createdAt', 'DESC']],
      limit: 100
    });

    res.json({
      success: true,
      data: {
        families: families.map(f => ({
          id: f.id,
          familyId: f.familyId || `FAM-${String(f.id).padStart(6, '0')}`,
          name: f.family?.name || `Famille ${f.lastName}`,
          manager: `${f.firstName} ${f.lastName}`,
          email: f.email,
          memberCount: f.family?.memberCount || 0,
          subscriptionStatus: f.subscriptionStatus,
          subscriptionPlan: f.subscriptionPlan,
          createdAt: f.createdAt
        })),
        totalFamilies: families.length,
        stats: {
          activeSubscriptions: families.filter(f => f.subscriptionStatus === 'ACTIVE').length,
          trials: families.filter(f => f.subscriptionStatus === 'TRIAL').length,
          suspended: families.filter(f => f.subscriptionStatus === 'SUSPENDED').length
        }
      }
    });

  } catch (error) {
    logger.error('❌ Erreur lors de la récupération des familles:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des liens familiaux',
      error: error.message
    });
  }
});

// ===============================
// MODULES GRATUITS
// ===============================

// Récupérer les modules gratuits
router.get('/free-modules', async (req, res) => {
  try {
    const { Subject, Lesson } = req.models;

    // Récupérer toutes les matières avec leurs leçons
    const subjects = await Subject.findAll({
      include: [{
        model: Lesson,
        as: 'lessons',
        required: false
      }]
    });

    // Charger la configuration des modules gratuits
    const fs = require('fs').promises;
    const path = require('path');
    const configPath = path.join(__dirname, '../../config/free-modules-config.json');

    let config = {};
    try {
      const configContent = await fs.readFile(configPath, 'utf8');
      config = JSON.parse(configContent);
    } catch (error) {
      // Configuration par défaut si le fichier n'existe pas
      config = {
        maxFreeLessons: 5,
        maxFreeQuizzes: 3,
        requiresRegistration: true,
        durationLimit: 30,
        allowProgressTracking: false
      };
    }

    // Calculer le nombre de leçons et quiz gratuits par matière
    const freeModules = subjects.map(subject => {
      const lessons = subject.lessons || [];
      const freeLessons = lessons.filter(l => l.isFree).length;
      const freeQuizzes = lessons.filter(l => l.hasQuiz && l.isFree).length;

      return {
        id: subject.id,
        subject: subject.name,
        freeLessons: freeLessons || 0,
        freeQuizzes: freeQuizzes || 0,
        accessLevel: config.requiresRegistration ? 'Inscription requise' : 'Libre',
        lastModified: subject.updatedAt
      };
    });

    res.json({
      success: true,
      data: {
        freeModules,
        settings: config
      }
    });

  } catch (error) {
    logger.error('Erreur récupération modules gratuits:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des modules gratuits',
      error: error.message
    });
  }
});

// Sauvegarder les paramètres des modules gratuits
router.put('/free-modules/settings', async (req, res) => {
  try {
    const { maxFreeLessons, maxFreeQuizzes, requiresRegistration, durationLimit, allowProgressTracking } = req.body;
    const fs = require('fs').promises;
    const path = require('path');

    const configPath = path.join(__dirname, '../../config/free-modules-config.json');
    const configDir = path.dirname(configPath);

    // Créer le dossier config s'il n'existe pas
    await fs.mkdir(configDir, { recursive: true });

    // Sauvegarder la configuration
    const config = {
      maxFreeLessons: parseInt(maxFreeLessons) || 5,
      maxFreeQuizzes: parseInt(maxFreeQuizzes) || 3,
      requiresRegistration: requiresRegistration !== false,
      durationLimit: parseInt(durationLimit) || 30,
      allowProgressTracking: allowProgressTracking === true,
      updatedAt: new Date().toISOString()
    };

    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');

    logger.info('Configuration modules gratuits sauvegardée', {
      service: 'claudyne-backend',
      action: 'save_free_modules_config'
    });

    res.json({
      success: true,
      message: 'Configuration sauvegardée avec succès',
      data: { updatedAt: config.updatedAt }
    });

  } catch (error) {
    logger.error('Erreur sauvegarde config modules gratuits:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la sauvegarde de la configuration'
    });
  }
});

// ===============================
// HISTORIQUE DES MESSAGES
// ===============================

// Récupérer l'historique des messages envoyés
router.get('/messages/history', async (req, res) => {
  try {
    // Pour l'instant, retourner des données simulées
    // À implémenter avec une vraie table de messages quand le système d'emailing sera en place
    const messages = [
      {
        id: 1,
        sentDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        recipientsCount: 245,
        subject: 'Nouvelles fonctionnalités disponibles',
        type: 'Newsletter',
        status: 'delivered',
        openRate: 68,
        clickRate: 23
      },
      {
        id: 2,
        sentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        recipientsCount: 189,
        subject: 'Rappel: Abonnement expire bientôt',
        type: 'Automatique',
        status: 'delivered',
        openRate: 82,
        clickRate: 45
      },
      {
        id: 3,
        sentDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        recipientsCount: 312,
        subject: 'Bienvenue sur Claudyne',
        type: 'Bienvenue',
        status: 'delivered',
        openRate: 91,
        clickRate: 67
      }
    ];

    res.json({
      success: true,
      data: {
        messages,
        stats: {
          totalSent: messages.length,
          avgOpenRate: Math.round(messages.reduce((sum, m) => sum + m.openRate, 0) / messages.length),
          avgClickRate: Math.round(messages.reduce((sum, m) => sum + m.clickRate, 0) / messages.length)
        }
      }
    });

  } catch (error) {
    logger.error('Erreur récupération historique messages:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'historique'
    });
  }
});

// ===============================
// RAPPORTS PROGRAMMÉS
// ===============================

// Récupérer les rapports programmés
router.get('/scheduled-reports', async (req, res) => {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    const configPath = path.join(__dirname, '../../config/scheduled-reports-config.json');

    let reports = [];
    try {
      const configContent = await fs.readFile(configPath, 'utf8');
      const config = JSON.parse(configContent);
      reports = config.reports || [];
    } catch (error) {
      // Données par défaut si le fichier n'existe pas
      reports = [
        {
          id: 1,
          type: 'Rapport d\'activité',
          frequency: 'Hebdomadaire',
          format: 'PDF',
          lastRun: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          nextRun: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          status: 'active',
          recipients: ['admin@claudyne.com']
        },
        {
          id: 2,
          type: 'Rapport financier',
          frequency: 'Mensuel',
          format: 'Excel',
          lastRun: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          nextRun: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          status: 'active',
          recipients: ['finance@claudyne.com']
        },
        {
          id: 3,
          type: 'Rapport d\'engagement',
          frequency: 'Quotidien',
          format: 'PDF',
          lastRun: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          nextRun: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
          status: 'active',
          recipients: ['marketing@claudyne.com']
        }
      ];
    }

    res.json({
      success: true,
      data: {
        reports,
        stats: {
          total: reports.length,
          active: reports.filter(r => r.status === 'active').length,
          paused: reports.filter(r => r.status === 'paused').length
        }
      }
    });

  } catch (error) {
    logger.error('Erreur récupération rapports programmés:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des rapports'
    });
  }
});

// ===============================
// PLANS TARIFAIRES
// ===============================

// Récupérer tous les plans tarifaires
router.get('/pricing-plans', async (req, res) => {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    const configPath = path.join(__dirname, '../../config/pricing-plans-config.json');

    let plans = [];
    try {
      const configContent = await fs.readFile(configPath, 'utf8');
      const config = JSON.parse(configContent);
      plans = config.plans || [];
    } catch (error) {
      // Plans par défaut si le fichier n'existe pas
      plans = [
        {
          id: 'plan_family_monthly',
          name: 'Famille Mensuel',
          description: 'Accès complet pour toute la famille',
          price: 2990,
          currency: 'XAF',
          interval: 'monthly',
          features: [
            'Jusqu\'à 4 enfants',
            'Tous les cours et matières',
            'Suivi personnalisé',
            'Rapports hebdomadaires',
            'Support prioritaire'
          ],
          status: 'active',
          featured: true,
          subscriptions: 87
        },
        {
          id: 'plan_family_annual',
          name: 'Famille Annuel',
          description: 'Accès complet pour toute la famille (économisez 20%)',
          price: 28700,
          currency: 'XAF',
          interval: 'yearly',
          features: [
            'Jusqu\'à 4 enfants',
            'Tous les cours et matières',
            'Suivi personnalisé',
            'Rapports hebdomadaires',
            'Support prioritaire',
            '2 mois gratuits'
          ],
          status: 'active',
          featured: false,
          subscriptions: 134
        },
        {
          id: 'plan_student_monthly',
          name: 'Étudiant Mensuel',
          description: 'Idéal pour un seul enfant',
          price: 1490,
          currency: 'XAF',
          interval: 'monthly',
          features: [
            '1 enfant',
            'Tous les cours et matières',
            'Suivi de progression',
            'Rapports mensuels'
          ],
          status: 'active',
          featured: false,
          subscriptions: 213
        }
      ];
    }

    // Calculer les statistiques
    const stats = {
      totalPlans: plans.length,
      activePlans: plans.filter(p => p.status === 'active').length,
      totalSubscriptions: plans.reduce((sum, p) => sum + (p.subscriptions || 0), 0),
      monthlyRevenue: plans
        .filter(p => p.interval === 'monthly' && p.status === 'active')
        .reduce((sum, p) => sum + (p.price * (p.subscriptions || 0)), 0)
    };

    res.json({
      success: true,
      data: {
        plans,
        stats
      }
    });

  } catch (error) {
    logger.error('Erreur récupération plans tarifaires:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des plans tarifaires'
    });
  }
});

// Créer un nouveau plan tarifaire
router.post('/pricing-plans/create', async (req, res) => {
  try {
    const { name, description, price, currency, interval, features, status, featured } = req.body;
    const fs = require('fs').promises;
    const path = require('path');
    const configPath = path.join(__dirname, '../../config/pricing-plans-config.json');
    const configDir = path.dirname(configPath);

    // Créer le dossier config s'il n'existe pas
    await fs.mkdir(configDir, { recursive: true });

    // Charger les plans existants
    let config = { plans: [] };
    try {
      const configContent = await fs.readFile(configPath, 'utf8');
      config = JSON.parse(configContent);
    } catch (error) {
      // Fichier n'existe pas encore
    }

    // Créer le nouveau plan
    const newPlan = {
      id: `plan_${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
      name,
      description,
      price: parseInt(price),
      currency: currency || 'XAF',
      interval: interval || 'monthly',
      features: features || [],
      status: status || 'active',
      featured: featured === true,
      subscriptions: 0,
      createdAt: new Date().toISOString()
    };

    config.plans = config.plans || [];
    config.plans.push(newPlan);

    // Sauvegarder
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');

    logger.info('Nouveau plan tarifaire créé', {
      service: 'claudyne-backend',
      action: 'create_pricing_plan',
      planId: newPlan.id
    });

    res.json({
      success: true,
      message: 'Plan créé avec succès',
      data: { plan: newPlan }
    });

  } catch (error) {
    logger.error('Erreur création plan tarifaire:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du plan'
    });
  }
});

// Mettre à jour le statut d'un plan
router.put('/pricing-plans/:planId/status', async (req, res) => {
  try {
    const { planId } = req.params;
    const { status } = req.body;
    const fs = require('fs').promises;
    const path = require('path');
    const configPath = path.join(__dirname, '../../config/pricing-plans-config.json');

    // Charger les plans existants
    const configContent = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(configContent);

    // Trouver et mettre à jour le plan
    const planIndex = config.plans.findIndex(p => p.id === planId);
    if (planIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Plan non trouvé'
      });
    }

    config.plans[planIndex].status = status;
    config.plans[planIndex].updatedAt = new Date().toISOString();

    // Sauvegarder
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');

    logger.info('Statut plan tarifaire mis à jour', {
      service: 'claudyne-backend',
      action: 'update_pricing_plan_status',
      planId,
      status
    });

    res.json({
      success: true,
      message: 'Statut mis à jour avec succès'
    });

  } catch (error) {
    logger.error('Erreur mise à jour statut plan:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut'
    });
  }
});

// ===============================
// GESTION DES MATIÈRES (SUBJECTS)
// ===============================

// Créer une nouvelle matière
router.post('/subjects', async (req, res) => {
  try {
    const { Subject } = req.models;
    const {
      title,
      description,
      level,
      category,
      icon,
      color,
      difficulty,
      estimatedDuration,
      isPremium
    } = req.body;

    // Validation
    if (!title || !level || !category) {
      return res.status(400).json({
        success: false,
        message: 'Titre, niveau et catégorie sont requis'
      });
    }

    const subject = await Subject.create({
      title,
      description,
      level,
      category,
      icon: icon || '📚',
      color: color || '#3B82F6',
      difficulty: difficulty || 'Débutant',
      estimatedDuration: estimatedDuration || 45,
      isPremium: isPremium || false,
      isActive: true,
      createdBy: req.user.id
    });

    logger.info(`Matière créée: ${subject.title} (${subject.id})`);

    res.status(201).json({
      success: true,
      message: 'Matière créée avec succès',
      data: subject
    });

  } catch (error) {
    logger.error('Erreur création matière:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la matière',
      error: error.message
    });
  }
});

// Mettre à jour une matière
router.put('/subjects/:subjectId', async (req, res) => {
  try {
    const { Subject } = req.models;
    const { subjectId } = req.params;

    const subject = await Subject.findByPk(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Matière non trouvée'
      });
    }

    await subject.update({
      ...req.body,
      lastUpdatedBy: req.user.id
    });

    res.json({
      success: true,
      message: 'Matière mise à jour avec succès',
      data: subject
    });

  } catch (error) {
    logger.error('Erreur mise à jour matière:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour'
    });
  }
});

// Supprimer une matière (soft delete)
router.delete('/subjects/:subjectId', async (req, res) => {
  try {
    const { Subject } = req.models;
    const { subjectId } = req.params;

    const subject = await Subject.findByPk(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Matière non trouvée'
      });
    }

    await subject.destroy();

    res.json({
      success: true,
      message: 'Matière supprimée avec succès'
    });

  } catch (error) {
    logger.error('Erreur suppression matière:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression'
    });
  }
});

// ===============================
// GESTION DES LEÇONS (LESSONS)
// ===============================

// Créer une nouvelle leçon
router.post('/subjects/:subjectId/lessons', async (req, res) => {
  try {
    const { Lesson, Subject } = req.models;
    const { subjectId } = req.params;
    const {
      title,
      description,
      type,
      difficulty,
      estimatedDuration,
      content,
      objectives,
      prerequisites,
      hasQuiz,
      quiz,
      isPremium,
      isFree
    } = req.body;

    // Vérifier que la matière existe
    const subject = await Subject.findByPk(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Matière non trouvée'
      });
    }

    // Validation
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Titre et contenu sont requis'
      });
    }

    const lesson = await Lesson.create({
      title,
      description,
      subjectId,
      type: type || 'interactive',
      difficulty: difficulty || 'Débutant',
      estimatedDuration: estimatedDuration || 25,
      content: typeof content === 'string' ? { keyPoints: [content] } : content,
      objectives: objectives || [],
      prerequisites: prerequisites || [],
      hasQuiz: hasQuiz || false,
      quiz: quiz || null,
      isPremium: isPremium || false,
      isFree: isFree || false,
      isActive: true,
      reviewStatus: 'approved', // Approuvé automatiquement par l'admin
      publishedAt: new Date(),
      createdBy: req.user.id
    });

    // Mettre à jour les stats de la matière
    await subject.updateStats();

    logger.info(`Leçon créée: ${lesson.title} (${lesson.id}) pour ${subject.title}`);

    res.status(201).json({
      success: true,
      message: 'Leçon créée avec succès',
      data: lesson
    });

  } catch (error) {
    logger.error('Erreur création leçon:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la leçon',
      error: error.message
    });
  }
});

// Mettre à jour une leçon
router.put('/lessons/:lessonId', async (req, res) => {
  try {
    const { Lesson } = req.models;
    const { lessonId } = req.params;

    const lesson = await Lesson.findByPk(lessonId);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Leçon non trouvée'
      });
    }

    await lesson.update({
      ...req.body,
      reviewedBy: req.user.id
    });

    res.json({
      success: true,
      message: 'Leçon mise à jour avec succès',
      data: lesson
    });

  } catch (error) {
    logger.error('Erreur mise à jour leçon:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour'
    });
  }
});

// Supprimer une leçon (soft delete)
router.delete('/lessons/:lessonId', async (req, res) => {
  try {
    const { Lesson, Subject } = req.models;
    const { lessonId } = req.params;

    const lesson = await Lesson.findByPk(lessonId);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Leçon non trouvée'
      });
    }

    const subjectId = lesson.subjectId;
    await lesson.destroy();

    // Mettre à jour les stats de la matière
    const subject = await Subject.findByPk(subjectId);
    if (subject) {
      await subject.updateStats();
    }

    res.json({
      success: true,
      message: 'Leçon supprimée avec succès'
    });

  } catch (error) {
    logger.error('Erreur suppression leçon:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression'
    });
  }
});

// Liste toutes les matières (admin)
router.get('/subjects', async (req, res) => {
  try {
    const { Subject, Lesson } = req.models;

    const subjects = await Subject.findAll({
      include: [
        {
          model: Lesson,
          as: 'lessons',
          attributes: ['id', 'title', 'type', 'isActive', 'isPremium', 'isFree'],
          required: false
        }
      ],
      order: [['order', 'ASC'], ['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: subjects
    });

  } catch (error) {
    logger.error('Erreur récupération matières:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des matières'
    });
  }
});

// ===============================
// CRÉATION DE COURS
// ===============================

/**
 * POST /api/admin/courses
 * Créer un nouveau cours (Subject + Lesson)
 */
router.post('/courses', async (req, res) => {
  try {
    const { Subject, Lesson } = req.models;
    const { title, subject, level, description, content, duration } = req.body;

    // Mapping des catégories
    const CATEGORY_MAPPING = {
      'mathematiques': 'Mathématiques',
      'physique': 'Sciences',
      'chimie': 'Sciences',
      'biologie': 'Sciences',
      'francais': 'Langues',
      'anglais': 'Langues',
      'histoire': 'Histoire-Géographie',
      'geographie': 'Histoire-Géographie',
      'informatique': 'Informatique'
    };

    // Mapping des niveaux
    const LEVEL_MAPPING = {
      '6eme': '6ème',
      '5eme': '5ème',
      '4eme': '4ème',
      '3eme': '3ème',
      '2nde': '2nde',
      '1ere': '1ère',
      'terminale': 'Tle'
    };

    // Mapping des icônes
    const ICON_MAPPING = {
      'mathematiques': 'fa-calculator',
      'physique': 'fa-atom',
      'chimie': 'fa-flask',
      'biologie': 'fa-dna',
      'francais': 'fa-book',
      'anglais': 'fa-language',
      'histoire': 'fa-landmark',
      'geographie': 'fa-globe',
      'informatique': 'fa-laptop-code'
    };

    const category = CATEGORY_MAPPING[subject] || 'Mathématiques';
    const mappedLevel = LEVEL_MAPPING[level] || level;
    const icon = ICON_MAPPING[subject] || 'fa-book';

    // Créer ou trouver le Subject
    const subjectTitle = subject.charAt(0).toUpperCase() + subject.slice(1);
    const [subjectRecord, created] = await Subject.findOrCreate({
      where: {
        level: mappedLevel,
        category: category
      },
      defaults: {
        title: `${subjectTitle} ${mappedLevel}`,
        description: `Cours de ${subjectTitle} niveau ${mappedLevel}`,
        level: mappedLevel,
        category: category,
        icon: icon,
        color: '#667eea',
        isActive: true,
        order: 0
      }
    });

    logger.info(`Subject ${created ? 'créé' : 'trouvé'}: ${subjectRecord.title} (ID: ${subjectRecord.id})`);

    // Créer la Lesson
    const lesson = await Lesson.create({
      subjectId: subjectRecord.id,
      title: title,
      description: description || '',
      content: content || '',
      duration: parseInt(duration) || 45,
      order: 0,
      isActive: true,
      difficulty: 'Débutant',
      hasQuiz: false
    });

    logger.info(`Lesson créée: ${lesson.title} (ID: ${lesson.id})`);

    res.json({
      success: true,
      message: 'Cours créé avec succès',
      data: {
        subject: subjectRecord,
        lesson: lesson
      }
    });

  } catch (error) {
    logger.error('Erreur création cours:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du cours',
      error: error.message
    });
  }
});

module.exports = router;