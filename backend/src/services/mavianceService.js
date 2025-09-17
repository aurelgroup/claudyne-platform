/**
 * Service MAVIANCE Smobil Pay
 * Intégration MTN Mobile Money et Orange Money pour le Cameroun
 */

const axios = require('axios');
const logger = require('../utils/logger');

class MavianceService {
  constructor() {
    this.baseURL = process.env.MAVIANCE_API_URL || 'https://api.smobilpay.com';
    this.apiKey = process.env.MAVIANCE_API_KEY;
    this.secretKey = process.env.MAVIANCE_SECRET_KEY;
    this.merchantId = process.env.MAVIANCE_MERCHANT_ID;

    // Configuration des endpoints
    this.endpoints = {
      mtn: {
        initiate: '/v1/payments/mtn/request',
        status: '/v1/payments/mtn/status',
        callback: '/v1/payments/mtn/callback'
      },
      orange: {
        initiate: '/v1/payments/orange/request',
        status: '/v1/payments/orange/status',
        callback: '/v1/payments/orange/callback'
      }
    };

    // Validation de la configuration
    if (!this.apiKey || !this.secretKey || !this.merchantId) {
      logger.warn('Configuration MAVIANCE incomplète - Mode simulation activé');
      this.simulationMode = true;
    } else {
      this.simulationMode = false;
      this.setupAxios();
    }
  }

  setupAxios() {
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        'X-Merchant-ID': this.merchantId
      }
    });

    // Intercepteur pour logging
    this.client.interceptors.request.use(
      (config) => {
        logger.info('Requête MAVIANCE:', {
          method: config.method,
          url: config.url,
          data: this.sanitizeLogData(config.data)
        });
        return config;
      },
      (error) => {
        logger.error('Erreur requête MAVIANCE:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        logger.info('Réponse MAVIANCE:', {
          status: response.status,
          data: this.sanitizeLogData(response.data)
        });
        return response;
      },
      (error) => {
        logger.error('Erreur réponse MAVIANCE:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  sanitizeLogData(data) {
    if (!data) return data;

    const sanitized = { ...data };
    // Masquer les données sensibles dans les logs
    if (sanitized.phone) {
      sanitized.phone = sanitized.phone.substring(0, 4) + '****' + sanitized.phone.substring(8);
    }
    if (sanitized.apiKey) delete sanitized.apiKey;
    if (sanitized.secretKey) delete sanitized.secretKey;

    return sanitized;
  }

  generateSignature(data, timestamp) {
    const crypto = require('crypto');
    const payload = JSON.stringify(data) + timestamp + this.secretKey;
    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  // ===============================
  // MTN MOBILE MONEY
  // ===============================

  async initiateMtnPayment(paymentData) {
    const { amount, phone, transactionId, description } = paymentData;

    if (this.simulationMode) {
      return this.simulateMtnPayment(paymentData);
    }

    try {
      const timestamp = Date.now().toString();
      const requestData = {
        merchantTransactionId: transactionId,
        amount: amount,
        currency: 'XAF',
        customerPhoneNumber: phone,
        customerMessage: description,
        merchantMessage: `Paiement Claudyne - ${description}`,
        callbackUrl: `${process.env.FRONTEND_URL}/api/payments/webhook/maviance`,
        timestamp: timestamp
      };

      requestData.signature = this.generateSignature(requestData, timestamp);

      const response = await this.client.post(this.endpoints.mtn.initiate, requestData);

      if (response.data.success) {
        return {
          success: true,
          transactionId: response.data.transactionId,
          externalTransactionId: response.data.providerTransactionId,
          status: 'pending',
          message: 'Paiement MTN initié avec succès',
          instructions: response.data.instructions,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Erreur lors de l\'initialisation MTN',
          errorCode: response.data.errorCode
        };
      }

    } catch (error) {
      logger.error('Erreur initiation paiement MTN:', error);
      return {
        success: false,
        message: 'Erreur de communication avec MTN Mobile Money',
        error: error.message
      };
    }
  }

  async checkMtnPaymentStatus(transactionId) {
    if (this.simulationMode) {
      return this.simulatePaymentStatus();
    }

    try {
      const response = await this.client.get(
        `${this.endpoints.mtn.status}/${transactionId}`
      );

      return {
        transactionId: transactionId,
        externalId: response.data.providerTransactionId,
        status: this.mapMtnStatus(response.data.status),
        amount: response.data.amount,
        currency: response.data.currency,
        completedAt: response.data.completedAt,
        message: response.data.message
      };

    } catch (error) {
      logger.error('Erreur vérification statut MTN:', error);
      return {
        transactionId: transactionId,
        status: 'unknown',
        message: 'Impossible de vérifier le statut'
      };
    }
  }

  mapMtnStatus(mtnStatus) {
    const statusMap = {
      'PENDING': 'processing',
      'SUCCESSFUL': 'completed',
      'FAILED': 'failed',
      'CANCELLED': 'cancelled',
      'EXPIRED': 'expired'
    };

    return statusMap[mtnStatus] || 'unknown';
  }

  // ===============================
  // ORANGE MONEY
  // ===============================

  async initiateOrangePayment(paymentData) {
    const { amount, phone, transactionId, description } = paymentData;

    if (this.simulationMode) {
      return this.simulateOrangePayment(paymentData);
    }

    try {
      const timestamp = Date.now().toString();
      const requestData = {
        merchantTransactionId: transactionId,
        amount: amount,
        currency: 'XAF',
        customerPhoneNumber: phone,
        description: description,
        notificationUrl: `${process.env.FRONTEND_URL}/api/payments/webhook/maviance`,
        returnUrl: `${process.env.FRONTEND_URL}/payment/success`,
        timestamp: timestamp
      };

      requestData.signature = this.generateSignature(requestData, timestamp);

      const response = await this.client.post(this.endpoints.orange.initiate, requestData);

      if (response.data.success) {
        return {
          success: true,
          transactionId: response.data.transactionId,
          externalTransactionId: response.data.orangeTransactionId,
          status: 'pending',
          message: 'Paiement Orange Money initié avec succès',
          paymentUrl: response.data.paymentUrl,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000)
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Erreur lors de l\'initialisation Orange Money',
          errorCode: response.data.errorCode
        };
      }

    } catch (error) {
      logger.error('Erreur initiation paiement Orange:', error);
      return {
        success: false,
        message: 'Erreur de communication avec Orange Money',
        error: error.message
      };
    }
  }

  async checkOrangePaymentStatus(transactionId) {
    if (this.simulationMode) {
      return this.simulatePaymentStatus();
    }

    try {
      const response = await this.client.get(
        `${this.endpoints.orange.status}/${transactionId}`
      );

      return {
        transactionId: transactionId,
        externalId: response.data.orangeTransactionId,
        status: this.mapOrangeStatus(response.data.status),
        amount: response.data.amount,
        currency: response.data.currency,
        completedAt: response.data.completedAt,
        message: response.data.message
      };

    } catch (error) {
      logger.error('Erreur vérification statut Orange:', error);
      return {
        transactionId: transactionId,
        status: 'unknown',
        message: 'Impossible de vérifier le statut'
      };
    }
  }

  mapOrangeStatus(orangeStatus) {
    const statusMap = {
      'PENDING': 'processing',
      'SUCCESS': 'completed',
      'FAILED': 'failed',
      'CANCELLED': 'cancelled',
      'EXPIRED': 'expired'
    };

    return statusMap[orangeStatus] || 'unknown';
  }

  // ===============================
  // SIMULATION POUR LE DÉVELOPPEMENT
  // ===============================

  simulateMtnPayment(paymentData) {
    logger.info('Mode simulation MTN activé:', paymentData);

    // Simuler différents scénarios
    const scenarios = ['success', 'pending', 'failed'];
    const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];

    switch (randomScenario) {
      case 'success':
        return {
          success: true,
          transactionId: `sim_mtn_${Date.now()}`,
          externalTransactionId: `MTN${Math.random().toString(36).substring(2, 15)}`,
          status: 'pending',
          message: '[SIMULATION] Paiement MTN initié - Composez *126# pour confirmer',
          instructions: 'Code USSD: *126*1*1234# puis suivez les instructions',
          expiresAt: new Date(Date.now() + 15 * 60 * 1000)
        };

      case 'failed':
        return {
          success: false,
          message: '[SIMULATION] Échec initiation MTN - Solde insuffisant',
          errorCode: 'INSUFFICIENT_FUNDS'
        };

      default:
        return {
          success: true,
          transactionId: `sim_mtn_${Date.now()}`,
          status: 'pending',
          message: '[SIMULATION] Paiement en cours de traitement',
          expiresAt: new Date(Date.now() + 15 * 60 * 1000)
        };
    }
  }

  simulateOrangePayment(paymentData) {
    logger.info('Mode simulation Orange activé:', paymentData);

    return {
      success: true,
      transactionId: `sim_orange_${Date.now()}`,
      externalTransactionId: `OM${Math.random().toString(36).substring(2, 15)}`,
      status: 'pending',
      message: '[SIMULATION] Paiement Orange Money initié - Vérifiez vos SMS',
      paymentUrl: `https://sim.orange.cm/pay/${Date.now()}`,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000)
    };
  }

  simulatePaymentStatus() {
    // Simuler l'évolution du statut dans le temps
    const now = Date.now();
    const scenarios = [
      { status: 'processing', probability: 0.3 },
      { status: 'completed', probability: 0.6 },
      { status: 'failed', probability: 0.1 }
    ];

    const random = Math.random();
    let cumulativeProbability = 0;

    for (const scenario of scenarios) {
      cumulativeProbability += scenario.probability;
      if (random <= cumulativeProbability) {
        return {
          status: scenario.status,
          externalId: `SIM${now}`,
          amount: 2500,
          currency: 'XAF',
          completedAt: scenario.status === 'completed' ? new Date() : null,
          message: scenario.status === 'completed' ?
            'Paiement simulé confirmé' :
            scenario.status === 'failed' ?
            'Paiement simulé échoué' :
            'Paiement en cours'
        };
      }
    }
  }

  // ===============================
  // MÉTHODES UTILITAIRES
  // ===============================

  formatPhoneNumber(phone) {
    // Normaliser le format du numéro de téléphone
    let normalized = phone.replace(/\s+/g, '');

    if (normalized.startsWith('0')) {
      normalized = '+237' + normalized.substring(1);
    } else if (normalized.startsWith('237')) {
      normalized = '+' + normalized;
    } else if (!normalized.startsWith('+237')) {
      normalized = '+237' + normalized;
    }

    return normalized;
  }

  validatePhoneNumber(phone, operator = null) {
    const normalizedPhone = this.formatPhoneNumber(phone);

    // Validation format camerounais
    if (!/^\+237[0-9]{9}$/.test(normalizedPhone)) {
      return {
        valid: false,
        message: 'Format de numéro invalide pour le Cameroun'
      };
    }

    // Validation opérateur selon les préfixes officiels Cameroun 2024
    const number = normalizedPhone.substring(4); // Enlever +237

    if (operator === 'mtn') {
      // MTN Cameroon: 670-677XXXXXX, 650XXXXXX-654XXXXXX, 680XXXXXX-684XXXXXX (2024 officiel)
      if (!/^(67[0-7][0-9]{6}|65[0-4][0-9]{6}|68[0-4][0-9]{6})$/.test(number)) {
        return {
          valid: false,
          message: 'Ce numéro ne correspond pas aux préfixes MTN Cameroun'
        };
      }
    } else if (operator === 'orange') {
      // Orange Cameroon: 690-695XXXXXX, 655XXXXXX-659XXXXXX, 685XXXXXX-689XXXXXX, 640XXXXXX (2024 officiel)
      if (!/^(69[0-5][0-9]{6}|65[5-9][0-9]{6}|68[5-9][0-9]{6}|640[0-9]{6})$/.test(number)) {
        return {
          valid: false,
          message: 'Ce numéro ne correspond pas aux préfixes Orange Cameroun'
        };
      }
    }

    return {
      valid: true,
      formatted: normalizedPhone,
      operator: this.detectOperator(normalizedPhone)
    };
  }

  detectOperator(phone) {
    const normalizedPhone = this.formatPhoneNumber(phone);
    const number = normalizedPhone.substring(4);

    // MTN Cameroon - Préfixes officiels: 670-677XXXXXX, 650-654XXXXXX, 680-684XXXXXX (2024)
    if (/^(67[0-7][0-9]{6}|65[0-4][0-9]{6}|68[0-4][0-9]{6})$/.test(number)) {
      return 'mtn';
    }
    // Orange Cameroon - Préfixes officiels: 690-695XXXXXX, 655-659XXXXXX, 685-689XXXXXX, 640XXXXXX (2024)
    else if (/^(69[0-5][0-9]{6}|65[5-9][0-9]{6}|68[5-9][0-9]{6}|640[0-9]{6})$/.test(number)) {
      return 'orange';
    }
    // CAMTEL - Préfixes officiels: 242XXXXXX, 243XXXXXX, 620XXXXXX, 621XXXXXX (2024)
    else if (/^(242[0-9]{6}|243[0-9]{6}|620[0-9]{6}|621[0-9]{6})$/.test(number)) {
      return 'camtel';
    }
    else {
      return 'unknown';
    }
  }

  calculateFees(amount, operator) {
    // Frais MAVIANCE selon l'opérateur
    const feeStructures = {
      mtn: {
        percentage: 1.5,
        fixedFee: 50,
        minFee: 50,
        maxFee: 5000
      },
      orange: {
        percentage: 2.0,
        fixedFee: 75,
        minFee: 75,
        maxFee: 7500
      }
    };

    const structure = feeStructures[operator] || feeStructures.mtn;
    const calculatedFee = (amount * structure.percentage / 100) + structure.fixedFee;

    return {
      amount: Math.max(structure.minFee, Math.min(calculatedFee, structure.maxFee)),
      percentage: structure.percentage,
      fixedFee: structure.fixedFee,
      breakdown: `${structure.percentage}% + ${structure.fixedFee} FCFA`
    };
  }

  // ===============================
  // MÉTHODES DE TEST
  // ===============================

  async testConnection() {
    if (this.simulationMode) {
      return {
        success: true,
        message: 'Mode simulation - Connexion simulée réussie',
        endpoints: this.endpoints
      };
    }

    try {
      const response = await this.client.get('/health');
      return {
        success: true,
        message: 'Connexion MAVIANCE établie',
        status: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: 'Échec de connexion à MAVIANCE',
        error: error.message
      };
    }
  }

  getStatus() {
    return {
      service: 'MAVIANCE Smobil Pay',
      mode: this.simulationMode ? 'simulation' : 'production',
      baseURL: this.baseURL,
      configured: !this.simulationMode,
      endpoints: this.endpoints
    };
  }
}

// Export singleton
const mavianceService = new MavianceService();
module.exports = mavianceService;