/**
 * Routes admin pour la gestion des tickets de paiement manuel
 * Permet aux admins de valider/rejeter les tickets et gérer les extensions
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');
const { authenticate, authorize } = require('../middleware/auth');
const { notifyTicketApproved, notifyTicketRejected } = require('../utils/paymentTicketNotifications');

// Middleware pour initialiser les modèles
router.use(async (req, res, next) => {
  if (!req.models) {
    const database = require('../config/database');
    req.models = database.initializeModels();
  }
  next();
});

// Tous les endpoints nécessitent authentification + rôle ADMIN
router.use(authenticate);
router.use(authorize(['ADMIN']));

// ===============================
// RÉCUPÉRER TOUS LES TICKETS (avec filtres)
// ===============================

router.get('/tickets', async (req, res) => {
  try {
    const { PaymentTicket, User, Family } = req.models;
    const {
      status,
      paymentMethod,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const where = {};

    // Filtres
    if (status) {
      where.status = status.toUpperCase();
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod.toUpperCase();
    }

    if (startDate && endDate) {
      where.createdAt = {
        [req.models.sequelize.Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      where.createdAt = {
        [req.models.sequelize.Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      where.createdAt = {
        [req.models.sequelize.Op.lte]: new Date(endDate)
      };
    }

    // Récupération des tickets
    const tickets = await PaymentTicket.findAll({
      where,
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: false
        },
        {
          model: Family,
          as: 'family',
          attributes: ['id', 'name', 'subscriptionEndsAt', 'trialEndsAt', 'status'],
          required: false
        }
      ]
    });

    // Compter le total pour pagination
    const totalCount = await PaymentTicket.count({ where });

    const formattedTickets = tickets.map(ticket => ({
      id: ticket.id,
      ticketReference: ticket.ticketReference,
      amount: ticket.amount,
      currency: ticket.currency,
      planType: ticket.planType,
      planTypeLabel: ticket.getPlanTypeLabel(),
      durationDays: ticket.durationDays,
      paymentMethod: ticket.paymentMethod,
      paymentMethodLabel: ticket.getPaymentMethodLabel(),
      phoneNumber: ticket.phoneNumber,
      transactionId: ticket.transactionId,
      status: ticket.status,
      hasProof: !!ticket.proofImageUrl,
      proofImageType: ticket.proofImageType,
      userNotes: ticket.userNotes,
      adminNotes: ticket.adminNotes,
      rejectionReason: ticket.rejectionReason,
      user: ticket.user ? {
        id: ticket.user.id,
        name: `${ticket.user.firstName} ${ticket.user.lastName}`,
        email: ticket.user.email,
        phone: ticket.user.phone
      } : null,
      family: ticket.family ? {
        id: ticket.family.id,
        name: ticket.family.name,
        subscriptionEndsAt: ticket.family.subscriptionEndsAt,
        trialEndsAt: ticket.family.trialEndsAt,
        status: ticket.family.status
      } : null,
      reviewer: ticket.reviewer ? {
        name: `${ticket.reviewer.firstName} ${ticket.reviewer.lastName}`,
        email: ticket.reviewer.email
      } : null,
      createdAt: ticket.createdAt,
      reviewedAt: ticket.reviewedAt,
      processedAt: ticket.processedAt,
      ageInHours: ticket.getAge(),
      isOverdue: ticket.isOverdue()
    }));

    res.json({
      success: true,
      data: {
        tickets: formattedTickets,
        pagination: {
          total: totalCount,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + tickets.length < totalCount
        },
        filters: {
          status,
          paymentMethod,
          startDate,
          endDate,
          sortBy,
          sortOrder
        }
      }
    });

  } catch (error) {
    logger.error('Erreur récupération tickets admin:', error);

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des tickets'
    });
  }
});

// ===============================
// RÉCUPÉRER LES TICKETS EN ATTENTE
// ===============================

router.get('/tickets/pending', async (req, res) => {
  try {
    const { PaymentTicket } = req.models;
    const { limit = 50 } = req.query;

    const tickets = await PaymentTicket.getPendingTickets(parseInt(limit));

    res.json({
      success: true,
      data: {
        tickets: tickets.map(ticket => ({
          id: ticket.id,
          ticketReference: ticket.ticketReference,
          amount: ticket.amount,
          currency: ticket.currency,
          planType: ticket.planType,
          planTypeLabel: ticket.getPlanTypeLabel(),
          paymentMethod: ticket.paymentMethod,
          paymentMethodLabel: ticket.getPaymentMethodLabel(),
          hasProof: !!ticket.proofImageUrl,
          user: ticket.user ? {
            name: `${ticket.user.firstName} ${ticket.user.lastName}`,
            email: ticket.user.email
          } : null,
          family: ticket.family ? {
            name: ticket.family.name
          } : null,
          createdAt: ticket.createdAt,
          ageInHours: ticket.getAge(),
          isOverdue: ticket.isOverdue()
        })),
        total: tickets.length
      }
    });

  } catch (error) {
    logger.error('Erreur récupération tickets pending:', error);

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des tickets en attente'
    });
  }
});

// ===============================
// RÉCUPÉRER LES TICKETS EN RETARD
// ===============================

router.get('/tickets/overdue', async (req, res) => {
  try {
    const { PaymentTicket } = req.models;
    const { hoursThreshold = 24 } = req.query;

    const tickets = await PaymentTicket.getOverdueTickets(parseInt(hoursThreshold));

    res.json({
      success: true,
      data: {
        tickets: tickets.map(ticket => ({
          id: ticket.id,
          ticketReference: ticket.ticketReference,
          amount: ticket.amount,
          currency: ticket.currency,
          user: ticket.user ? {
            name: `${ticket.user.firstName} ${ticket.user.lastName}`,
            email: ticket.user.email
          } : null,
          family: ticket.family ? {
            name: ticket.family.name
          } : null,
          createdAt: ticket.createdAt,
          ageInHours: ticket.getAge()
        })),
        total: tickets.length,
        threshold: parseInt(hoursThreshold)
      }
    });

  } catch (error) {
    logger.error('Erreur récupération tickets overdue:', error);

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des tickets en retard'
    });
  }
});

// ===============================
// APPROUVER UN TICKET
// ===============================

router.post('/tickets/:ticketId/approve', async (req, res) => {
  const transaction = await req.models.sequelize.transaction();

  try {
    const { PaymentTicket, Family, User } = req.models;
    const { ticketId } = req.params;
    const { adminNotes } = req.body;

    // Récupérer le ticket avec la famille et l'utilisateur
    const ticket = await PaymentTicket.findByPk(ticketId, {
      include: [
        {
          model: Family,
          as: 'family',
          required: true
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
          required: true
        }
      ],
      transaction
    });

    if (!ticket) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Ticket introuvable'
      });
    }

    if (!ticket.isPending()) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Le ticket est déjà ${ticket.status}`
      });
    }

    // Approuver le ticket
    await ticket.approve(req.user.id, adminNotes, { transaction });

    // Étendre l'abonnement de la famille
    const family = ticket.family;
    const currentExpiration = family.subscriptionEndsAt || family.trialEndsAt || new Date();
    const baseDate = currentExpiration > new Date() ? currentExpiration : new Date();
    const newExpiration = new Date(baseDate.getTime() + ticket.durationDays * 24 * 60 * 60 * 1000);

    await family.update({
      subscriptionEndsAt: newExpiration,
      subscriptionStatus: 'ACTIVE',
      status: 'ACTIVE'
    }, { transaction });

    await transaction.commit();

    logger.logSecurity('Payment ticket approved', {
      ticketId: ticket.id,
      ticketReference: ticket.ticketReference,
      familyId: family.id,
      adminId: req.user.id,
      amount: ticket.amount,
      durationDays: ticket.durationDays,
      newExpiration: newExpiration
    });

    // Envoyer la notification d'approbation
    try {
      await notifyTicketApproved(ticket, ticket.user, family, newExpiration);
    } catch (notifError) {
      logger.error('Erreur envoi notification approbation:', notifError);
      // Ne pas bloquer l'approbation si la notification échoue
    }

    res.json({
      success: true,
      message: 'Ticket approuvé et abonnement étendu',
      data: {
        ticketReference: ticket.ticketReference,
        status: 'APPROVED',
        family: {
          id: family.id,
          name: family.name,
          newSubscriptionEndsAt: newExpiration,
          extendedBy: ticket.durationDays
        },
        reviewedBy: {
          id: req.user.id,
          name: `${req.user.firstName} ${req.user.lastName}`
        },
        reviewedAt: ticket.reviewedAt
      }
    });

  } catch (error) {
    await transaction.rollback();
    logger.error('Erreur approbation ticket:', error);

    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'approbation du ticket',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ===============================
// REJETER UN TICKET
// ===============================

router.post('/tickets/:ticketId/reject', async (req, res) => {
  try {
    const { PaymentTicket, User } = req.models;
    const { ticketId } = req.params;
    const { rejectionReason, adminNotes } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Une raison de rejet est requise'
      });
    }

    const ticket = await PaymentTicket.findByPk(ticketId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
          required: true
        }
      ]
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket introuvable'
      });
    }

    if (!ticket.isPending()) {
      return res.status(400).json({
        success: false,
        message: `Le ticket est déjà ${ticket.status}`
      });
    }

    // Rejeter le ticket
    await ticket.reject(req.user.id, rejectionReason, adminNotes);

    logger.logSecurity('Payment ticket rejected', {
      ticketId: ticket.id,
      ticketReference: ticket.ticketReference,
      adminId: req.user.id,
      rejectionReason: rejectionReason
    });

    // Envoyer la notification de rejet
    try {
      await notifyTicketRejected(ticket, ticket.user, rejectionReason);
    } catch (notifError) {
      logger.error('Erreur envoi notification rejet:', notifError);
      // Ne pas bloquer le rejet si la notification échoue
    }

    res.json({
      success: true,
      message: 'Ticket rejeté',
      data: {
        ticketReference: ticket.ticketReference,
        status: 'REJECTED',
        rejectionReason: rejectionReason,
        reviewedBy: {
          id: req.user.id,
          name: `${req.user.firstName} ${req.user.lastName}`
        },
        reviewedAt: ticket.reviewedAt
      }
    });

  } catch (error) {
    logger.error('Erreur rejet ticket:', error);

    res.status(500).json({
      success: false,
      message: 'Erreur lors du rejet du ticket',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ===============================
// AJOUTER DES NOTES ADMIN
// ===============================

router.patch('/tickets/:ticketId/notes', async (req, res) => {
  try {
    const { PaymentTicket } = req.models;
    const { ticketId } = req.params;
    const { adminNotes } = req.body;

    if (!adminNotes) {
      return res.status(400).json({
        success: false,
        message: 'adminNotes requis'
      });
    }

    const ticket = await PaymentTicket.findByPk(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket introuvable'
      });
    }

    await ticket.update({ adminNotes });

    res.json({
      success: true,
      message: 'Notes admin mises à jour',
      data: {
        ticketReference: ticket.ticketReference,
        adminNotes: ticket.adminNotes
      }
    });

  } catch (error) {
    logger.error('Erreur mise à jour notes:', error);

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour des notes'
    });
  }
});

// ===============================
// TÉLÉCHARGER LA PREUVE DE PAIEMENT
// ===============================

router.get('/tickets/:ticketId/proof', async (req, res) => {
  try {
    const { PaymentTicket } = req.models;
    const { ticketId } = req.params;

    const ticket = await PaymentTicket.findByPk(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket introuvable'
      });
    }

    if (!ticket.proofImageUrl) {
      return res.status(404).json({
        success: false,
        message: 'Aucune preuve de paiement disponible'
      });
    }

    const proofPath = ticket.proofImageUrl;

    if (!fs.existsSync(proofPath)) {
      logger.error('Proof file not found', { ticketId, proofPath });
      return res.status(404).json({
        success: false,
        message: 'Fichier de preuve introuvable sur le serveur'
      });
    }

    // Déterminer le type de contenu
    const ext = path.extname(proofPath).toLowerCase();
    const contentTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf'
    };

    const contentType = contentTypes[ext] || 'application/octet-stream';

    // Headers pour affichage cross-origin (CORS fix)
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${ticket.ticketReference}${ext}"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    res.setHeader('Cache-Control', 'private, max-age=3600');

    const fileStream = fs.createReadStream(proofPath);
    fileStream.pipe(res);

  } catch (error) {
    logger.error('Erreur téléchargement preuve:', error);

    res.status(500).json({
      success: false,
      message: 'Erreur lors du téléchargement de la preuve'
    });
  }
});

// ===============================
// STATISTIQUES GLOBALES
// ===============================

router.get('/stats/global', async (req, res) => {
  try {
    const { PaymentTicket } = req.models;

    const stats = await PaymentTicket.getStatistics();

    // Statistiques par méthode de paiement
    const methodStats = await PaymentTicket.findAll({
      attributes: [
        'paymentMethod',
        [req.models.sequelize.fn('COUNT', req.models.sequelize.col('id')), 'count'],
        [req.models.sequelize.fn('SUM', req.models.sequelize.col('amount')), 'totalAmount']
      ],
      where: { status: 'APPROVED' },
      group: ['paymentMethod'],
      raw: true
    });

    // Statistiques par type de plan
    const planStats = await PaymentTicket.findAll({
      attributes: [
        'planType',
        [req.models.sequelize.fn('COUNT', req.models.sequelize.col('id')), 'count'],
        [req.models.sequelize.fn('SUM', req.models.sequelize.col('amount')), 'totalAmount']
      ],
      where: { status: 'APPROVED' },
      group: ['planType'],
      raw: true
    });

    res.json({
      success: true,
      data: {
        overview: stats,
        byPaymentMethod: methodStats.map(stat => ({
          method: stat.paymentMethod,
          count: parseInt(stat.count),
          totalAmount: parseFloat(stat.totalAmount || 0)
        })),
        byPlanType: planStats.map(stat => ({
          planType: stat.planType,
          count: parseInt(stat.count),
          totalAmount: parseFloat(stat.totalAmount || 0)
        }))
      }
    });

  } catch (error) {
    logger.error('Erreur statistiques globales:', error);

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
});

// ===============================
// STATISTIQUES PAR ADMIN
// ===============================

router.get('/stats/by-admin', async (req, res) => {
  try {
    const { PaymentTicket, User } = req.models;

    const adminStats = await PaymentTicket.findAll({
      attributes: [
        'reviewedBy',
        [req.models.sequelize.fn('COUNT', req.models.sequelize.col('PaymentTicket.id')), 'reviewedCount'],
        [req.models.sequelize.fn('COUNT', req.models.sequelize.literal("CASE WHEN status = 'APPROVED' THEN 1 END")), 'approvedCount'],
        [req.models.sequelize.fn('COUNT', req.models.sequelize.literal("CASE WHEN status = 'REJECTED' THEN 1 END")), 'rejectedCount']
      ],
      where: {
        reviewedBy: { [req.models.sequelize.Op.not]: null }
      },
      include: [
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      group: ['reviewedBy', 'reviewer.id', 'reviewer.firstName', 'reviewer.lastName', 'reviewer.email'],
      raw: false
    });

    res.json({
      success: true,
      data: {
        admins: adminStats.map(stat => ({
          admin: {
            id: stat.reviewer.id,
            name: `${stat.reviewer.firstName} ${stat.reviewer.lastName}`,
            email: stat.reviewer.email
          },
          reviewedCount: parseInt(stat.get('reviewedCount')),
          approvedCount: parseInt(stat.get('approvedCount')),
          rejectedCount: parseInt(stat.get('rejectedCount')),
          approvalRate: parseFloat(
            (parseInt(stat.get('approvedCount')) / parseInt(stat.get('reviewedCount')) * 100).toFixed(2)
          )
        }))
      }
    });

  } catch (error) {
    logger.error('Erreur statistiques par admin:', error);

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques admin'
    });
  }
});

module.exports = router;
