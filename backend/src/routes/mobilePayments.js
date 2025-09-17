/**
 * Routes spécialisées pour les paiements mobiles Cameroun
 * MTN Mobile Money et Orange Money avec fallback MAVIANCE
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Import des services de paiement mobile
const { MtnMobileMoneyService } = require('../services/mtnMobileMoney');
const { OrangeMoneyService } = require('../services/orangeMoneyService');
const mavianceService = require('../services/mavianceService');

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
// VALIDATION NUMÉROS TÉLÉPHONE
// ===============================

router.post('/validate-phone', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Numéro de téléphone requis'
      });
    }

    // Utiliser la validation MAVIANCE (plus complète)
    const validation = mavianceService.validatePhoneNumber(phone);
    const operator = mavianceService.detectOperator(phone);

    if (validation.valid) {
      const fees = mavianceService.calculateFees(2500, operator); // Exemple avec 2500 FCFA

      res.json({
        success: true,
        data: {
          phone: phone,
          formatted: validation.formatted,
          operator: operator,
          operatorName: {
            'mtn': 'MTN Cameroon',
            'orange': 'Orange Cameroun',
            'camtel': 'Camtel',
            'nexttel': 'Nexttel'
          }[operator] || 'Opérateur inconnu',
          valid: true,
          fees: fees,
          availableServices: {
            mtn: operator === 'mtn' ? ['mobile_money', 'ussd'] : [],
            orange: operator === 'orange' ? ['orange_money', 'web_payment'] : [],
            maviance: ['mtn', 'orange'].includes(operator)
          }
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: validation.message,
        data: {
          phone: phone,
          operator: 'unknown',
          valid: false
        }
      });
    }

  } catch (error) {
    logger.error('Erreur validation téléphone:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la validation du numéro'
    });
  }
});

// ===============================
// MTN MOBILE MONEY SPÉCIALISÉ
// ===============================

router.post('/mtn/request-to-pay', async (req, res) => {
  try {
    const { amount, phone, description, reference } = req.body;

    // Validation
    if (!amount || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Montant et numéro de téléphone requis'
      });
    }

    const phoneValidation = mavianceService.validatePhoneNumber(phone, 'mtn');
    if (!phoneValidation.valid) {
      return res.status(400).json({
        success: false,
        message: phoneValidation.message
      });
    }

    // Essayer l'API MTN directe d'abord
    let result = await mtnService.requestToPay({
      amount: amount,
      phone: phoneValidation.formatted,
      transactionId: reference || `mtn_${Date.now()}`,
      description: description || 'Paiement Claudyne'
    });

    // Si échec, fallback sur MAVIANCE
    if (!result.success) {
      logger.info('Fallback MTN vers MAVIANCE');
      result = await mavianceService.initiateMtnPayment({
        amount: amount,
        phone: phoneValidation.formatted,
        transactionId: reference || `mav_mtn_${Date.now()}`,
        description: description || 'Paiement Claudyne'
      });
    }

    res.json({
      success: result.success,
      data: result,
      provider: result.success && result.transactionId?.startsWith('mtn_') ? 'mtn_direct' : 'maviance'
    });

  } catch (error) {
    logger.error('Erreur MTN requestToPay:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la demande de paiement MTN'
    });
  }
});

router.get('/mtn/status/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;

    let result;

    // Déterminer le service basé sur l'ID de transaction
    if (transactionId.startsWith('mtn_')) {
      result = await mtnService.checkRequestToPayStatus(transactionId);
    } else {
      result = await mavianceService.checkMtnPaymentStatus(transactionId);
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Erreur vérification statut MTN:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du statut MTN'
    });
  }
});

router.get('/mtn/account/balance', async (req, res) => {
  try {
    const balance = await mtnService.getAccountBalance();

    res.json({
      success: true,
      data: balance
    });

  } catch (error) {
    logger.error('Erreur récupération solde MTN:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du solde MTN'
    });
  }
});

// ===============================
// ORANGE MONEY SPÉCIALISÉ
// ===============================

router.post('/orange/web-payment', async (req, res) => {
  try {
    const { amount, phone, description, reference } = req.body;

    // Validation
    if (!amount || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Montant et numéro de téléphone requis'
      });
    }

    const phoneValidation = mavianceService.validatePhoneNumber(phone, 'orange');
    if (!phoneValidation.valid) {
      return res.status(400).json({
        success: false,
        message: phoneValidation.message
      });
    }

    // Essayer l'API Orange directe d'abord
    let result = await orangeService.initiateWebPayment({
      amount: amount,
      phone: phoneValidation.formatted,
      transactionId: reference || `orange_${Date.now()}`,
      description: description || 'Paiement Claudyne'
    });

    // Si échec, fallback sur MAVIANCE
    if (!result.success) {
      logger.info('Fallback Orange vers MAVIANCE');
      result = await mavianceService.initiateOrangePayment({
        amount: amount,
        phone: phoneValidation.formatted,
        transactionId: reference || `mav_orange_${Date.now()}`,
        description: description || 'Paiement Claudyne'
      });
    }

    res.json({
      success: result.success,
      data: result,
      provider: result.success && result.transactionId?.startsWith('orange_') ? 'orange_direct' : 'maviance'
    });

  } catch (error) {
    logger.error('Erreur Orange webPayment:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la demande de paiement Orange'
    });
  }
});

router.get('/orange/status/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;

    let result;

    // Déterminer le service basé sur l'ID de transaction
    if (transactionId.startsWith('orange_')) {
      result = await orangeService.checkWebPaymentStatus(transactionId);
    } else {
      result = await mavianceService.checkOrangePaymentStatus(transactionId);
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Erreur vérification statut Orange:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du statut Orange'
    });
  }
});

router.get('/orange/account/balance', async (req, res) => {
  try {
    const balance = await orangeService.getAccountBalance();

    res.json({
      success: true,
      data: balance
    });

  } catch (error) {
    logger.error('Erreur récupération solde Orange:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du solde Orange'
    });
  }
});

// ===============================
// WEBHOOKS PAIEMENTS MOBILES
// ===============================

router.post('/webhook/mtn', async (req, res) => {
  try {
    logger.info('Webhook MTN reçu:', req.body);

    const { Payment } = req.models;
    const webhookData = req.body;

    // Valider la signature du webhook (si disponible)
    // TODO: Implémenter validation signature MTN

    const payment = await Payment.findOne({
      where: { externalTransactionId: webhookData.referenceId }
    });

    if (!payment) {
      logger.warn('Payment non trouvé pour webhook MTN:', webhookData.referenceId);
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    // Mettre à jour selon le statut MTN
    switch (webhookData.status) {
      case 'SUCCESSFUL':
        await payment.markAsCompleted(webhookData.referenceId, webhookData);
        break;
      case 'FAILED':
        await payment.markAsFailed(webhookData.reason || 'MTN payment failed', webhookData);
        break;
      case 'PENDING':
        await payment.markAsProcessing();
        break;
    }

    res.json({ success: true, message: 'Webhook MTN traité' });

  } catch (error) {
    logger.error('Erreur webhook MTN:', error);
    res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
});

router.post('/webhook/orange', async (req, res) => {
  try {
    logger.info('Webhook Orange reçu:', req.body);

    const { Payment } = req.models;
    const webhookData = req.body;

    // Valider la signature du webhook Orange
    // TODO: Implémenter validation signature Orange

    const payment = await Payment.findOne({
      where: { externalTransactionId: webhookData.order_id }
    });

    if (!payment) {
      logger.warn('Payment non trouvé pour webhook Orange:', webhookData.order_id);
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    // Mettre à jour selon le statut Orange
    switch (webhookData.status) {
      case 'SUCCESS':
        await payment.markAsCompleted(webhookData.transaction_id, webhookData);
        break;
      case 'FAILED':
      case 'CANCELLED':
        await payment.markAsFailed(webhookData.message || 'Orange payment failed', webhookData);
        break;
      case 'PENDING':
        await payment.markAsProcessing();
        break;
    }

    res.json({ success: true, message: 'Webhook Orange traité' });

  } catch (error) {
    logger.error('Erreur webhook Orange:', error);
    res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
});

// ===============================
// STATUT DES SERVICES
// ===============================

router.get('/services/status', async (req, res) => {
  try {
    const [mtnStatus, orangeStatus, mavianceStatus] = await Promise.all([
      mtnService.testConnection(),
      orangeService.testConnection(),
      mavianceService.testConnection()
    ]);

    res.json({
      success: true,
      data: {
        mtn: {
          ...mtnStatus,
          service: 'MTN Mobile Money Direct'
        },
        orange: {
          ...orangeStatus,
          service: 'Orange Money Direct'
        },
        maviance: {
          ...mavianceStatus,
          service: 'MAVIANCE Smobil Pay'
        },
        summary: {
          totalServices: 3,
          available: [mtnStatus.success, orangeStatus.success, mavianceStatus.success].filter(Boolean).length,
          recommendations: this.getServiceRecommendations(mtnStatus, orangeStatus, mavianceStatus)
        }
      }
    });

  } catch (error) {
    logger.error('Erreur vérification services:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification des services'
    });
  }
});

// ===============================
// CALCULATEUR DE FRAIS
// ===============================

router.post('/calculate-fees', async (req, res) => {
  try {
    const { amount, phone, method } = req.body;

    if (!amount) {
      return res.status(400).json({
        success: false,
        message: 'Montant requis'
      });
    }

    let operator = method;

    // Détecter l'opérateur si téléphone fourni
    if (phone && !method) {
      operator = mavianceService.detectOperator(phone);
    }

    if (!operator || !['mtn', 'orange'].includes(operator)) {
      return res.status(400).json({
        success: false,
        message: 'Opérateur non supporté ou non détecté'
      });
    }

    const fees = mavianceService.calculateFees(amount, operator);
    const netAmount = amount + fees.amount;

    res.json({
      success: true,
      data: {
        originalAmount: amount,
        fees: fees.amount,
        netAmount: netAmount,
        currency: 'XAF',
        operator: operator,
        breakdown: fees.breakdown,
        percentage: fees.percentage,
        fixedFee: fees.fixedFee
      }
    });

  } catch (error) {
    logger.error('Erreur calcul frais:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du calcul des frais'
    });
  }
});

// ===============================
// HISTORIQUE TRANSACTIONS
// ===============================

router.get('/transactions/history', async (req, res) => {
  try {
    const { startDate, endDate, operator, limit = 50 } = req.query;

    const { Payment } = req.models;

    const where = {
      paymentMethod: ['mtn_momo', 'orange_money']
    };

    if (startDate && endDate) {
      where.createdAt = {
        [req.models.sequelize.Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    if (operator) {
      where.paymentMethod = operator === 'mtn' ? 'mtn_momo' : 'orange_money';
    }

    const transactions = await Payment.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      include: [{
        model: req.models.Family,
        as: 'family',
        attributes: ['name']
      }]
    });

    const formattedTransactions = transactions.map(tx => ({
      transactionId: tx.transactionId,
      amount: tx.getAmountInFCFA(),
      currency: tx.currency,
      method: tx.paymentMethod,
      status: tx.status,
      familyName: tx.family?.name,
      createdAt: tx.createdAt,
      completedAt: tx.completedAt,
      phone: tx.phone,
      description: tx.description
    }));

    res.json({
      success: true,
      data: {
        transactions: formattedTransactions,
        total: transactions.length,
        filters: { startDate, endDate, operator, limit }
      }
    });

  } catch (error) {
    logger.error('Erreur historique transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'historique'
    });
  }
});

// Méthodes utilitaires
function getServiceRecommendations(mtnStatus, orangeStatus, mavianceStatus) {
  const recommendations = [];

  if (!mtnStatus.success && !mavianceStatus.success) {
    recommendations.push('MTN Mobile Money indisponible - Vérifiez la configuration API');
  }

  if (!orangeStatus.success && !mavianceStatus.success) {
    recommendations.push('Orange Money indisponible - Vérifiez la configuration API');
  }

  if (mavianceStatus.success) {
    recommendations.push('MAVIANCE disponible comme fallback pour MTN et Orange');
  }

  if (recommendations.length === 0) {
    recommendations.push('Tous les services de paiement mobile fonctionnent correctement');
  }

  return recommendations;
}

module.exports = router;