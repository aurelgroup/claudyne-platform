/**
 * Routes pour les Paiements - Claudyne Backend
 * Intégration MAVIANCE Smobil Pay pour MTN/Orange Money
 */

const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// Import des services de paiement
const mavianceService = require('../services/mavianceService');
const { MtnMobileMoneyService } = require('../services/mtnMobileMoney');
const { OrangeMoneyService } = require('../services/orangeMoneyService');

// Initialiser les services
const mtnService = new MtnMobileMoneyService();
const orangeService = new OrangeMoneyService();

// Import des modèles
router.use(async (req, res, next) => {
  if (!req.models) {
    const database = require('../config/database');
    req.models = database.initializeModels();
  }
  next();
});

// ===============================
// MÉTHODES DE PAIEMENT DISPONIBLES
router.get('/', (req, res) => { res.json({ success: true, message: 'Payments API', endpoints: { methods: '/api/payments/methods' } }); });

// ===============================

router.get('/methods', async (req, res) => {
  try {
    const { Family } = req.models;

    // Récupérer le wallet de la famille si authentifié
    let walletBalance = 0;
    if (req.user && req.user.familyId) {
      const family = await Family.findByPk(req.user.familyId);
      walletBalance = family ? family.walletBalance : 0;
    }

    const methods = [
      {
        id: 'mtn_momo',
        name: 'MTN Mobile Money',
        icon: '📱',
        color: '#FFCC02',
        description: 'Paiement via MTN MoMo',
        fees: '1.5%',
        minAmount: 100,
        maxAmount: 1000000,
        available: true,
        provider: 'maviance',
        processingTime: '1-3 minutes'
      },
      {
        id: 'orange_money',
        name: 'Orange Money',
        icon: '🧡',
        color: '#FF6600',
        description: 'Paiement via Orange Money',
        fees: '2.0%',
        minAmount: 100,
        maxAmount: 500000,
        available: true,
        provider: 'maviance',
        processingTime: '1-5 minutes'
      },
      {
        id: 'bank_transfer',
        name: 'Virement bancaire',
        icon: '🏦',
        color: '#2563EB',
        description: 'Virement bancaire direct',
        fees: '0.5%',
        minAmount: 1000,
        maxAmount: 10000000,
        available: true,
        provider: 'gimac',
        processingTime: '1-3 jours ouvrables'
      },
      {
        id: 'card',
        name: 'Carte bancaire',
        icon: '💳',
        color: '#16A34A',
        description: 'Visa, Mastercard, GIMAC',
        fees: '2.5%',
        minAmount: 500,
        maxAmount: 2000000,
        available: true,
        provider: 'visa',
        processingTime: 'Instantané'
      },
      {
        id: 'wallet',
        name: 'Portefeuille Claudyne',
        icon: '👛',
        color: '#8B5CF6',
        description: 'Utiliser le solde du portefeuille',
        fees: '0%',
        minAmount: 1,
        maxAmount: walletBalance,
        available: walletBalance > 0,
        provider: 'internal',
        processingTime: 'Instantané'
      }
    ];

    res.json({
      success: true,
      data: {
        methods: methods,
        wallet: {
          balance: walletBalance,
          currency: 'XAF',
          lastUpdate: new Date().toISOString()
        },
        fees: {
          note: 'Les frais peuvent varier selon le montant et la méthode',
          calculation: 'Frais = (montant × pourcentage) + frais fixes'
        }
      }
    });

  } catch (error) {
    logger.error('Erreur méthodes de paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des méthodes de paiement'
    });
  }
});

// ===============================
// PLANS D'ABONNEMENT
// ===============================

router.get('/subscriptions/plans', async (req, res) => {
  try {
    // Plans officiels Claudyne (correspondant à l'interface admin et #pricing)
    const plans = [
      {
        id: 'plan_discovery_trial',
        name: 'Découverte',
        description: '7 jours d\'essai gratuit',
        price: 0,
        originalPrice: null,
        currency: 'XAF',
        duration: 'trial',
        features: [
          'Accès à 3 matières',
          'Exercices de base',
          'Suivi basique des progrès',
          'Support email'
        ],
        limitations: [],
        popular: false,
        savings: null,
        target: 'Découverte gratuite'
      },
      {
        id: 'plan_student_monthly',
        name: 'Individuelle',
        description: 'Parfait pour un élève',
        price: 8000,
        originalPrice: null,
        currency: 'XAF',
        duration: 'monthly',
        features: [
          'Accès illimité toutes matières',
          '1 élève uniquement',
          'Suivi personnalisé avec IA',
          'Prix Claudine (badges)',
          'Support email'
        ],
        limitations: [],
        popular: false,
        savings: null,
        target: 'Élève individuel'
      },
      {
        id: 'plan_family_monthly',
        name: '💝 Familiale 💝',
        description: '🔥 Économisez 9,000 XAF/mois! 🔥',
        price: 15000,
        originalPrice: 24000,
        currency: 'XAF',
        duration: 'monthly',
        features: [
          'Accès illimité toutes matières',
          'Jusqu\'à 3 enfants',
          'Suivi personnalisé avec IA',
          'Tableau de bord parents',
          'Prix Claudine (badges/récompenses)',
          'Support prioritaire'
        ],
        limitations: [],
        popular: true,
        savings: 9000,
        target: 'Famille (jusqu\'à 3 enfants)'
      }
    ];

    res.json({
      success: true,
      data: {
        plans: plans,
        currency: 'XAF',
        features: {
          comparison: {
            subjects: { basic: 5, premium: 'Toutes', family: 'Toutes' },
            students: { basic: 1, premium: 3, family: 6 },
            support: { basic: 'Chat', premium: 'Prioritaire', family: 'VIP' },
            certificates: { basic: false, premium: true, family: true }
          }
        },
        trial: {
          duration: 7,
          features: ['Accès limité', 'Pas de carte requise', 'Annulation facile']
        }
      }
    });

  } catch (error) {
    logger.error('Erreur plans abonnement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des plans'
    });
  }
});

// ===============================
// INITIALISER UN PAIEMENT
// ===============================

router.post('/initialize', async (req, res) => {
  try {
    const { Payment } = req.models;
    const {
      amount,
      paymentMethod,
      type,
      planId,
      phone,
      email,
      description,
      metadata = {}
    } = req.body;

    // Validation des données
    if (!amount || !paymentMethod || !type) {
      return res.status(400).json({
        success: false,
        message: 'Paramètres manquants: amount, paymentMethod, type requis'
      });
    }

    if (!req.user || !req.user.familyId) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    // Validation mobile money
    if (['mtn_momo', 'orange_money'].includes(paymentMethod)) {
      if (!phone) {
        return res.status(400).json({
          success: false,
          message: 'Numéro de téléphone requis pour les paiements mobile'
        });
      }

      // Validation format téléphone camerounais
      if (!/^\+237[0-9]{9}$/.test(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Format de téléphone invalide (ex: +237690123456)'
        });
      }
    }

    // Créer le paiement en base
    const payment = await Payment.createPayment({
      familyId: req.user.familyId,
      amount: amount * 100, // Convertir en centimes
      paymentMethod,
      type,
      description: description || `Paiement Claudyne - ${type}`,
      phone,
      email: email || req.user.email,
      metadata: {
        ...metadata,
        planId,
        userId: req.user.id,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    });

    let providerResponse = {};
    let nextStep = 'pending';
    let message = 'Paiement en cours d\'initialisation...';

    // Traitement selon la méthode de paiement
    switch (paymentMethod) {
      case 'mtn_momo':
        try {
          // Essayer d'abord l'API MTN directe, puis fallback sur MAVIANCE
          let mtnDirectResponse = null;

          try {
            mtnDirectResponse = await mtnService.requestToPay({
              amount: payment.getAmountInFCFA(),
              phone,
              transactionId: payment.transactionId,
              description: payment.description
            });
          } catch (mtnError) {
            logger.warn('API MTN directe échouée, utilisation MAVIANCE:', mtnError.message);
          }

          if (mtnDirectResponse && mtnDirectResponse.success) {
            providerResponse = mtnDirectResponse;
            await payment.markAsProcessing();
            message = `Demande de paiement MTN envoyée au ${phone}. Composez *126# pour confirmer.`;
            nextStep = 'confirm_mobile_payment';
          } else {
            // Fallback sur MAVIANCE
            providerResponse = await mavianceService.initiateMtnPayment({
              amount: payment.getAmountInFCFA(),
              phone,
              transactionId: payment.transactionId,
              description: payment.description
            });

            if (providerResponse.success) {
              await payment.markAsProcessing();
              message = `Code USSD envoyé au ${phone}. Composez *126# pour finaliser le paiement.`;
              nextStep = 'confirm_mobile_payment';
            } else {
              await payment.markAsFailed(providerResponse.message, providerResponse);
            }
          }
        } catch (error) {
          await payment.markAsFailed('Erreur lors de l\'initialisation MTN', { error: error.message });
        }
        break;

      case 'orange_money':
        try {
          // Essayer d'abord l'API Orange directe, puis fallback sur MAVIANCE
          let orangeDirectResponse = null;

          try {
            orangeDirectResponse = await orangeService.initiateWebPayment({
              amount: payment.getAmountInFCFA(),
              phone,
              transactionId: payment.transactionId,
              description: payment.description
            });
          } catch (orangeError) {
            logger.warn('API Orange directe échouée, utilisation MAVIANCE:', orangeError.message);
          }

          if (orangeDirectResponse && orangeDirectResponse.success) {
            providerResponse = orangeDirectResponse;
            await payment.markAsProcessing();
            message = `Lien de paiement Orange Money généré. Cliquez sur le lien ou composez #150*4*4#`;
            nextStep = 'confirm_mobile_payment';
          } else {
            // Fallback sur MAVIANCE
            providerResponse = await mavianceService.initiateOrangePayment({
              amount: payment.getAmountInFCFA(),
              phone,
              transactionId: payment.transactionId,
              description: payment.description
            });

            if (providerResponse.success) {
              await payment.markAsProcessing();
              message = `Code de confirmation envoyé au ${phone}. Suivez les instructions SMS.`;
              nextStep = 'confirm_mobile_payment';
            } else {
              await payment.markAsFailed(providerResponse.message, providerResponse);
            }
          }
        } catch (error) {
          await payment.markAsFailed('Erreur lors de l\'initialisation Orange', { error: error.message });
        }
        break;

      case 'bank_transfer':
        await payment.markAsPending();
        message = 'Instructions de virement bancaire envoyées par email.';
        nextStep = 'check_transfer';
        break;

      case 'card':
        // Ici on intégrerait avec un processeur de cartes
        await payment.markAsPending();
        message = 'Redirection vers la page de paiement sécurisée...';
        nextStep = 'redirect_to_card_processor';
        break;

      case 'wallet':
        // Paiement instantané via portefeuille
        const { Family } = req.models;
        const family = await Family.findByPk(req.user.familyId);

        if (family.walletBalance >= payment.getAmountInFCFA()) {
          await family.decrement('walletBalance', { by: payment.getAmountInFCFA() });
          await payment.markAsCompleted(null, { method: 'wallet' });
          message = 'Paiement effectué avec succès via votre portefeuille.';
          nextStep = 'completed';
        } else {
          await payment.markAsFailed('Solde insuffisant');
          return res.status(400).json({
            success: false,
            message: 'Solde insuffisant dans votre portefeuille'
          });
        }
        break;

      default:
        await payment.markAsFailed('Méthode de paiement non supportée');
        return res.status(400).json({
          success: false,
          message: 'Méthode de paiement non supportée'
        });
    }

    res.json({
      success: true,
      data: {
        transactionId: payment.transactionId,
        status: payment.status,
        amount: payment.getAmountInFCFA(),
        currency: payment.currency,
        method: payment.paymentMethod,
        planId: planId,
        phone: phone,
        message: message,
        expiresAt: payment.expiresAt,
        nextStep: nextStep,
        fees: payment.fees,
        netAmount: payment.getNetAmountInFCFA(),
        providerData: providerResponse
      }
    });

  } catch (error) {
    logger.error('Erreur initialisation paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'initialisation du paiement'
    });
  }
});

// ===============================
// VÉRIFIER LE STATUT D'UN PAIEMENT
// ===============================

router.get('/:transactionId/status', async (req, res) => {
  try {
    const { Payment, Subscription } = req.models;
    const { transactionId } = req.params;

    const payment = await Payment.findOne({
      where: { transactionId },
      include: [
        {
          model: req.models.Family,
          as: 'family',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Transaction non trouvée'
      });
    }

    // Vérifier si l'utilisateur a accès à cette transaction
    if (req.user.familyId !== payment.familyId) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à cette transaction'
      });
    }

    // Si le paiement est en cours, vérifier avec le provider
    if (payment.status === 'processing' && payment.paymentMethod !== 'wallet') {
      try {
        let providerStatus;

        if (payment.paymentMethod === 'mtn_momo') {
          providerStatus = await mavianceService.checkMtnPaymentStatus(payment.transactionId);
        } else if (payment.paymentMethod === 'orange_money') {
          providerStatus = await mavianceService.checkOrangePaymentStatus(payment.transactionId);
        }

        if (providerStatus && providerStatus.status === 'completed') {
          await payment.markAsCompleted(providerStatus.externalId, providerStatus);
        } else if (providerStatus && providerStatus.status === 'failed') {
          await payment.markAsFailed(providerStatus.message, providerStatus);
        }
      } catch (error) {
        logger.error('Erreur vérification statut provider:', error);
      }
    }

    // Récupérer l'abonnement si c'est un paiement de souscription
    let subscription = null;
    if (payment.status === 'completed' && payment.type === 'subscription') {
      subscription = await Subscription.findOne({
        where: { familyId: payment.familyId }
      });
    }

    let responseMessage = 'Paiement en cours de traitement...';
    if (payment.status === 'completed') {
      responseMessage = 'Paiement confirmé avec succès ! Votre abonnement est maintenant actif.';
    } else if (payment.status === 'failed') {
      responseMessage = payment.failureReason || 'Paiement échoué. Veuillez réessayer.';
    } else if (payment.status === 'expired') {
      responseMessage = 'Le paiement a expiré. Veuillez relancer le processus.';
    }

    res.json({
      success: true,
      data: {
        transactionId: payment.transactionId,
        status: payment.status,
        message: responseMessage,
        amount: payment.getAmountInFCFA(),
        currency: payment.currency,
        method: payment.paymentMethod,
        completedAt: payment.completedAt,
        failureReason: payment.failureReason,
        subscription: subscription ? {
          type: subscription.type,
          status: subscription.status,
          expiresAt: subscription.expiresAt,
          daysRemaining: subscription.daysRemaining()
        } : null,
        canRetry: payment.status === 'failed' && payment.retryCount < 3
      }
    });

  } catch (error) {
    logger.error('Erreur vérification statut paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du statut'
    });
  }
});

// ===============================
// RECHARGER LE PORTEFEUILLE
// ===============================

router.post('/wallet/topup', async (req, res) => {
  try {
    const { amount, paymentMethod, phone } = req.body;

    if (!amount || amount < 500) {
      return res.status(400).json({
        success: false,
        message: 'Montant minimum de recharge: 500 FCFA'
      });
    }

    if (!req.user || !req.user.familyId) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    // Créer un paiement de type topup
    const payment = await req.models.Payment.createPayment({
      familyId: req.user.familyId,
      amount: amount * 100, // Convertir en centimes
      paymentMethod: paymentMethod || 'mtn_momo',
      type: 'topup',
      description: `Recharge portefeuille Claudyne - ${amount} FCFA`,
      phone,
      email: req.user.email,
      metadata: {
        userId: req.user.id,
        originalAmount: amount
      }
    });

    // Le traitement du paiement sera identique à /initialize
    let message = `Recharge de ${amount} FCFA en cours...`;
    let estimatedCompletion = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

    if (paymentMethod === 'mtn_momo') {
      message = `Code USSD envoyé au ${phone}. Composez *126# pour confirmer la recharge.`;
    } else if (paymentMethod === 'orange_money') {
      message = `Code de confirmation envoyé au ${phone}. Vérifiez vos SMS.`;
    }

    const newBalance = req.user.family ? req.user.family.walletBalance + amount : amount;

    res.json({
      success: true,
      data: {
        transactionId: payment.transactionId,
        status: 'pending',
        amount: amount,
        currency: 'XAF',
        method: paymentMethod,
        newBalance: newBalance,
        message: message,
        estimatedCompletion: estimatedCompletion,
        fees: payment.fees
      }
    });

  } catch (error) {
    logger.error('Erreur recharge portefeuille:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recharge'
    });
  }
});

// ===============================
// HISTORIQUE DES PAIEMENTS
// ===============================

router.get('/history', async (req, res) => {
  try {
    const { Payment } = req.models;
    const { page = 1, limit = 10, status, type, startDate, endDate } = req.query;

    if (!req.user || !req.user.familyId) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const offset = (page - 1) * limit;
    const where = { familyId: req.user.familyId };

    if (status) where.status = status;
    if (type) where.type = type;
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const payments = await Payment.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    const formattedPayments = payments.rows.map(payment => ({
      id: payment.transactionId,
      amount: payment.getAmountInFCFA(),
      currency: payment.currency,
      method: payment.paymentMethod,
      status: payment.status,
      type: payment.type,
      description: payment.description,
      createdAt: payment.createdAt,
      completedAt: payment.completedAt,
      failureReason: payment.failureReason,
      canRefund: payment.status === 'completed' &&
                 payment.type === 'subscription' &&
                 payment.completedAt > new Date(Date.now() - 48 * 60 * 60 * 1000), // 48h
      fees: payment.fees
    }));

    res.json({
      success: true,
      data: {
        payments: formattedPayments,
        pagination: {
          total: payments.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(payments.count / limit)
        }
      }
    });

  } catch (error) {
    logger.error('Erreur historique paiements:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'historique'
    });
  }
});

// ===============================
// WEBHOOK MAVIANCE (MTN/Orange)
// ===============================

router.post('/webhook/maviance', async (req, res) => {
  try {
    const { Payment } = req.models;
    logger.info('Webhook Maviance reçu:', req.body);

    const {
      transactionId,
      status,
      externalTransactionId,
      amount,
      phone,
      paymentMethod,
      message
    } = req.body;

    const payment = await Payment.findOne({
      where: { transactionId }
    });

    if (!payment) {
      logger.error('Transaction non trouvée pour webhook:', transactionId);
      return res.status(404).json({ success: false, message: 'Transaction non trouvée' });
    }

    // Mettre à jour le statut selon la réponse
    if (status === 'success' || status === 'completed') {
      await payment.markAsCompleted(externalTransactionId, {
        webhookData: req.body,
        provider: 'maviance'
      });
      logger.info(`Paiement ${transactionId} confirmé via webhook`);
    } else if (status === 'failed' || status === 'error') {
      await payment.markAsFailed(message || 'Paiement échoué via webhook', {
        webhookData: req.body,
        provider: 'maviance'
      });
      logger.info(`Paiement ${transactionId} échoué via webhook`);
    }

    res.json({ success: true, message: 'Webhook traité' });

  } catch (error) {
    logger.error('Erreur traitement webhook Maviance:', error);
    res.status(500).json({ success: false, message: 'Erreur traitement webhook' });
  }
});

module.exports = router;
