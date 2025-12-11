/**
 * Routes utilisateur pour les tickets de paiement manuel
 * Permet aux utilisateurs de soumettre des preuves de paiement
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');
const { authenticate, requireFamilyMembership } = require('../middleware/auth');
const { notifyTicketCreated } = require('../utils/paymentTicketNotifications');

// Configuration du stockage multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/payment-proofs');

    // Créer le répertoire s'il n'existe pas
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Format: user_<userId>_<timestamp>_<originalname>
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, `user_${req.user.id}_${uniqueSuffix}_${sanitizedName}`);
  }
});

// Filtres de fichiers
const fileFilter = (req, file, cb) => {
  // Types MIME autorisés
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé. Formats acceptés: JPG, PNG, WEBP, PDF'), false);
  }
};

// Configuration multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB maximum
    files: 1 // Un seul fichier
  }
});

// Middleware pour initialiser les modèles
router.use(async (req, res, next) => {
  if (!req.models) {
    const database = require('../config/database');
    req.models = database.initializeModels();
  }
  next();
});

// ===============================
// PLANS DISPONIBLES (PUBLIC - NO AUTH)
// ===============================

router.get('/available-plans', async (req, res) => {
  try {
    // Plans officiels Claudyne (alignés avec /api/payments/subscriptions/plans)
    // Cette route est publique pour permettre l'affichage dans le modal
    const plans = [
      {
        planType: 'DISCOVERY_TRIAL',
        name: 'Découverte',
        price: 0,
        currency: 'XAF',
        durationDays: 7,
        description: '7 jours d\'essai gratuit'
      },
      {
        planType: 'INDIVIDUAL_STUDENT',
        name: 'Individuelle',
        price: 8000,
        currency: 'XAF',
        durationDays: 30,
        description: 'Parfait pour un élève'
      },
      {
        planType: 'FAMILY',
        name: '💝 Familiale 💝',
        price: 15000,
        currency: 'XAF',
        durationDays: 30,
        description: 'Jusqu\'à 3 enfants'
      }
    ];

    res.json({
      success: true,
      data: plans
    });

  } catch (error) {
    logger.error('Erreur récupération plans:', error);

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des plans disponibles'
    });
  }
});

// ===============================
// CRÉER UN NOUVEAU TICKET
// ===============================

router.post('/submit', authenticate, requireFamilyMembership, upload.single('proof'), async (req, res) => {
  try {
    const { PaymentTicket } = req.models;
    const {
      amount,
      planType,
      durationDays,
      paymentMethod,
      phoneNumber,
      transactionId,
      userNotes
    } = req.body;

    // Validation des champs requis
    if (!amount || !planType || !paymentMethod) {
      // Supprimer le fichier uploadé si validation échoue
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }

      return res.status(400).json({
        success: false,
        message: 'Champs requis: amount, planType, paymentMethod'
      });
    }

    // Valider le montant
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }

      return res.status(400).json({
        success: false,
        message: 'Montant invalide'
      });
    }

    // Données du ticket
    const ticketData = {
      userId: req.user.id,
      familyId: req.user.familyId,
      amount: parsedAmount,
      currency: 'FCFA',
      planType: planType,
      durationDays: parseInt(durationDays) || 30,
      paymentMethod: paymentMethod,
      phoneNumber: phoneNumber || null,
      transactionId: transactionId || null,
      userNotes: userNotes || null,
      status: 'PENDING',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    };

    // Ajouter les infos du fichier si uploadé
    if (req.file) {
      ticketData.proofImageUrl = req.file.path;
      ticketData.proofImageSize = req.file.size;
      ticketData.proofImageType = req.file.mimetype;
      ticketData.proofUploadedAt = new Date();
    }

    // Créer le ticket
    const ticket = await PaymentTicket.create(ticketData);

    logger.logSecurity('Payment ticket created', {
      ticketId: ticket.id,
      ticketReference: ticket.ticketReference,
      userId: req.user.id,
      familyId: req.user.familyId,
      amount: parsedAmount,
      planType: planType,
      paymentMethod: paymentMethod
    });

    // Envoyer les notifications
    try {
      await notifyTicketCreated(ticket, req.user);
    } catch (notifError) {
      logger.error('Erreur envoi notification création ticket:', notifError);
      // Ne pas bloquer la création du ticket si la notification échoue
    }

    res.status(201).json({
      success: true,
      message: 'Ticket de paiement créé avec succès',
      data: {
        id: ticket.id,
        ticketReference: ticket.ticketReference,
        amount: ticket.amount,
        currency: ticket.currency,
        planType: ticket.planType,
        paymentMethod: ticket.paymentMethod,
        status: ticket.status,
        createdAt: ticket.createdAt,
        hasProof: !!ticket.proofImageUrl
      }
    });

  } catch (error) {
    // Supprimer le fichier en cas d'erreur
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    logger.error('Erreur création ticket paiement:', error);

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du ticket',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ===============================
// AJOUTER UNE PREUVE À UN TICKET EXISTANT
// ===============================

router.post('/:ticketId/upload-proof', authenticate, upload.single('proof'), async (req, res) => {
  try {
    const { PaymentTicket } = req.models;
    const { ticketId } = req.params;

    // Vérifier que le fichier a été uploadé
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier de preuve fourni'
      });
    }

    // Trouver le ticket
    const ticket = await PaymentTicket.findByPk(ticketId);

    if (!ticket) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Ticket introuvable'
      });
    }

    // Vérifier que le ticket appartient à l'utilisateur
    if (ticket.userId !== req.user.id) {
      fs.unlinkSync(req.file.path);
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à ce ticket'
      });
    }

    // Vérifier que le ticket est encore éditable
    if (!ticket.canBeEdited()) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Ce ticket ne peut plus être modifié (statut: ' + ticket.status + ')'
      });
    }

    // Supprimer l'ancienne preuve si elle existe
    if (ticket.proofImageUrl && fs.existsSync(ticket.proofImageUrl)) {
      fs.unlinkSync(ticket.proofImageUrl);
    }

    // Mettre à jour avec la nouvelle preuve
    await ticket.update({
      proofImageUrl: req.file.path,
      proofImageSize: req.file.size,
      proofImageType: req.file.mimetype,
      proofUploadedAt: new Date()
    });

    logger.info('Proof uploaded for payment ticket', {
      ticketId: ticket.id,
      ticketReference: ticket.ticketReference,
      userId: req.user.id,
      fileSize: req.file.size,
      fileType: req.file.mimetype
    });

    res.json({
      success: true,
      message: 'Preuve de paiement uploadée avec succès',
      data: {
        ticketReference: ticket.ticketReference,
        proofUploaded: true,
        proofSize: req.file.size,
        proofType: req.file.mimetype
      }
    });

  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    logger.error('Erreur upload preuve:', error);

    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload de la preuve'
    });
  }
});

// ===============================
// RÉCUPÉRER MES TICKETS
// ===============================

router.get('/my-tickets', authenticate, async (req, res) => {
  try {
    const { PaymentTicket, User } = req.models;
    const { status, limit = 20, offset = 0 } = req.query;

    const where = { userId: req.user.id };

    if (status) {
      where.status = status.toUpperCase();
    }

    const tickets = await PaymentTicket.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: false
        }
      ]
    });

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
      userNotes: ticket.userNotes,
      rejectionReason: ticket.rejectionReason,
      reviewedAt: ticket.reviewedAt,
      reviewer: ticket.reviewer ? {
        name: `${ticket.reviewer.firstName} ${ticket.reviewer.lastName}`,
        email: ticket.reviewer.email
      } : null,
      createdAt: ticket.createdAt,
      ageInHours: ticket.getAge(),
      isOverdue: ticket.isOverdue()
    }));

    res.json({
      success: true,
      data: {
        tickets: formattedTickets,
        total: tickets.length,
        filters: { status, limit, offset }
      }
    });

  } catch (error) {
    logger.error('Erreur récupération tickets:', error);

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des tickets'
    });
  }
});

// ===============================
// RÉCUPÉRER UN TICKET SPÉCIFIQUE
// ===============================

router.get('/:ticketId', authenticate, async (req, res) => {
  try {
    const { PaymentTicket, User, Family } = req.models;
    const { ticketId } = req.params;

    const ticket = await PaymentTicket.findByPk(ticketId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email']
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
          attributes: ['id', 'name'],
          required: false
        }
      ]
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket introuvable'
      });
    }

    // Vérifier l'accès (utilisateur propriétaire ou admin)
    if (ticket.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à ce ticket'
      });
    }

    res.json({
      success: true,
      data: {
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
          name: `${ticket.user.firstName} ${ticket.user.lastName}`,
          email: ticket.user.email
        } : null,
        family: ticket.family ? {
          id: ticket.family.id,
          name: ticket.family.name
        } : null,
        reviewer: ticket.reviewer ? {
          name: `${ticket.reviewer.firstName} ${ticket.reviewer.lastName}`,
          email: ticket.reviewer.email
        } : null,
        createdAt: ticket.createdAt,
        reviewedAt: ticket.reviewedAt,
        processedAt: ticket.processedAt,
        ageInHours: ticket.getAge(),
        isOverdue: ticket.isOverdue(),
        canBeEdited: ticket.canBeEdited()
      }
    });

  } catch (error) {
    logger.error('Erreur récupération ticket:', error);

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du ticket'
    });
  }
});

// ===============================
// RÉCUPÉRER LES TICKETS DE MA FAMILLE
// ===============================

router.get('/family/tickets', authenticate, requireFamilyMembership, async (req, res) => {
  try {
    const { PaymentTicket, User } = req.models;
    const { status, limit = 20, offset = 0 } = req.query;

    const where = { familyId: req.user.familyId };

    if (status) {
      where.status = status.toUpperCase();
    }

    const tickets = await PaymentTicket.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName']
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'firstName', 'lastName'],
          required: false
        }
      ]
    });

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
      status: ticket.status,
      submittedBy: ticket.user ? `${ticket.user.firstName} ${ticket.user.lastName}` : 'Inconnu',
      reviewedBy: ticket.reviewer ? `${ticket.reviewer.firstName} ${ticket.reviewer.lastName}` : null,
      createdAt: ticket.createdAt,
      reviewedAt: ticket.reviewedAt,
      ageInHours: ticket.getAge()
    }));

    res.json({
      success: true,
      data: {
        tickets: formattedTickets,
        total: tickets.length,
        filters: { status, limit, offset }
      }
    });

  } catch (error) {
    logger.error('Erreur récupération tickets famille:', error);

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des tickets famille'
    });
  }
});

// ===============================
// STATISTIQUES UTILISATEUR
// ===============================

router.get('/stats/summary', authenticate, async (req, res) => {
  try {
    const { PaymentTicket } = req.models;

    const [pending, approved, rejected, totalSpent] = await Promise.all([
      PaymentTicket.count({ where: { userId: req.user.id, status: 'PENDING' } }),
      PaymentTicket.count({ where: { userId: req.user.id, status: 'APPROVED' } }),
      PaymentTicket.count({ where: { userId: req.user.id, status: 'REJECTED' } }),
      PaymentTicket.findAll({
        where: { userId: req.user.id, status: 'APPROVED' },
        attributes: [[req.models.sequelize.fn('SUM', req.models.sequelize.col('amount')), 'total']]
      })
    ]);

    const totalAmount = totalSpent[0]?.get('total') || 0;

    res.json({
      success: true,
      data: {
        pendingCount: pending,
        approvedCount: approved,
        rejectedCount: rejected,
        totalSpent: parseFloat(totalAmount),
        currency: 'FCFA'
      }
    });

  } catch (error) {
    logger.error('Erreur statistiques tickets:', error);

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
});

// ===============================
// TÉLÉCHARGER LA PREUVE DE PAIEMENT (UTILISATEUR)
// ===============================

router.get('/:ticketId/proof', authenticate, async (req, res) => {
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

    // Vérifier l'accès (utilisateur propriétaire ou admin)
    if (ticket.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à cette preuve de paiement'
      });
    }

    if (!ticket.proofImageUrl) {
      return res.status(404).json({
        success: false,
        message: 'Aucune preuve de paiement disponible pour ce ticket'
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
    logger.error('Erreur téléchargement preuve utilisateur:', error);

    res.status(500).json({
      success: false,
      message: 'Erreur lors du téléchargement de la preuve'
    });
  }
});

// Gestion des erreurs multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Fichier trop volumineux (maximum 5MB)'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Un seul fichier autorisé'
      });
    }
    return res.status(400).json({
      success: false,
      message: 'Erreur upload: ' + error.message
    });
  }

  if (error.message.includes('Type de fichier')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  next(error);
});

module.exports = router;
