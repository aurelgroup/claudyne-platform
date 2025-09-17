/**
 * Service Orange Money Cameroun
 * Intégration directe avec l'API Orange Money
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const logger = require('../utils/logger');

class OrangeMoneyService {
  constructor() {
    // Configuration production Orange Money Cameroun
    this.baseURL = process.env.ORANGE_MONEY_API_URL || 'https://api.orange.com/orange-money-webpay/cm/v1';
    this.environment = process.env.NODE_ENV === 'production' ? 'live' : 'sandbox';

    // Credentials Orange Money API
    this.clientId = process.env.ORANGE_MONEY_CLIENT_ID;
    this.clientSecret = process.env.ORANGE_MONEY_CLIENT_SECRET;
    this.merchantKey = process.env.ORANGE_MONEY_MERCHANT_KEY;
    this.merchantId = process.env.ORANGE_MONEY_MERCHANT_ID;

    // Configuration des endpoints
    this.endpoints = {
      // Authentification
      token: '/oauth/token',

      // Paiements
      webPayment: '/webpayment',
      paymentStatus: '/transactions/{transactionId}',
      transactionHistory: '/transactions',

      // Transferts
      transfer: '/transfers',
      transferStatus: '/transfers/{transferId}',

      // Compte
      balance: '/account/balance',
      accountInfo: '/account/info'
    };

    // Token d'accès
    this.accessToken = null;
    this.tokenExpiry = null;

    // Validation de la configuration
    if (!this.clientId || !this.clientSecret || !this.merchantKey) {
      logger.warn('Configuration Orange Money incomplète - Mode simulation activé');
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
        'Accept': 'application/json'
      }
    });

    // Intercepteur pour gestion du token
    this.client.interceptors.request.use(
      async (config) => {
        if (config.url.includes('token')) {
          return config;
        }

        if (!this.accessToken || this.isTokenExpired()) {
          await this.getAccessToken();
        }

        config.headers.Authorization = `Bearer ${this.accessToken}`;

        logger.info('Requête Orange Money:', {
          method: config.method,
          url: config.url
        });

        return config;
      },
      (error) => {
        logger.error('Erreur requête Orange Money:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        logger.info('Réponse Orange Money:', {
          status: response.status,
          transactionId: response.data?.transactionId
        });
        return response;
      },
      (error) => {
        logger.error('Erreur réponse Orange Money:', {
          status: error.response?.status,
          data: error.response?.data
        });
        return Promise.reject(error);
      }
    );
  }

  // ===============================
  // AUTHENTIFICATION
  // ===============================

  async getAccessToken() {
    try {
      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      const response = await axios.post(
        `${this.baseURL}${this.endpoints.token}`,
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${credentials}`
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);

      logger.info('Token Orange Money obtenu avec succès');
      return this.accessToken;

    } catch (error) {
      logger.error('Erreur obtention token Orange Money:', error);
      throw error;
    }
  }

  isTokenExpired() {
    return !this.tokenExpiry || Date.now() >= (this.tokenExpiry - 60000); // 1 min de marge
  }

  // ===============================
  // SIGNATURE ET SÉCURITÉ
  // ===============================

  generateSignature(data, nonce, timestamp) {
    const payload = JSON.stringify(data) + nonce + timestamp;
    return crypto
      .createHmac('sha256', this.merchantKey)
      .update(payload)
      .digest('base64');
  }

  generateNonce() {
    return crypto.randomBytes(16).toString('hex');
  }

  // ===============================
  // WEB PAYMENT - RECEVOIR PAIEMENTS
  // ===============================

  async initiateWebPayment(paymentData) {
    const { amount, phone, transactionId, description } = paymentData;

    if (this.simulationMode) {
      return this.simulateWebPayment(paymentData);
    }

    try {
      const timestamp = Date.now().toString();
      const nonce = this.generateNonce();

      const requestData = {
        merchant_key: this.merchantKey,
        currency: 'XAF',
        order_id: transactionId,
        amount: amount,
        return_url: `${process.env.FRONTEND_URL}/payment/success`,
        cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
        notif_url: `${process.env.FRONTEND_URL}/api/payments/webhook/orange`,
        lang: 'fr',
        reference: `CLAUDYNE-${transactionId}`,
        customer_name: 'Client Claudyne',
        customer_phone: this.formatOrangePhoneNumber(phone),
        description: description,
        nonce: nonce,
        timestamp: timestamp
      };

      // Générer la signature
      requestData.signature = this.generateSignature(requestData, nonce, timestamp);

      const response = await this.client.post(this.endpoints.webPayment, requestData);

      if (response.data.status === 'SUCCESS') {
        return {
          success: true,
          transactionId: response.data.transaction_id,
          externalTransactionId: transactionId,
          status: 'pending',
          message: 'Paiement Orange Money initié avec succès',
          paymentUrl: response.data.payment_url,
          paymentToken: response.data.payment_token,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
          instructions: 'Cliquez sur le lien de paiement ou composez #150*4*4# et suivez les instructions'
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Erreur lors de l\'initialisation Orange Money',
          errorCode: response.data.error_code
        };
      }

    } catch (error) {
      logger.error('Erreur initiation paiement Orange Money:', error);

      return {
        success: false,
        message: 'Erreur lors de l\'initialisation du paiement Orange Money',
        errorCode: 'PAYMENT_INIT_FAILED',
        error: error.message
      };
    }
  }

  async checkWebPaymentStatus(transactionId) {
    if (this.simulationMode) {
      return this.simulatePaymentStatus();
    }

    try {
      const url = this.endpoints.paymentStatus.replace('{transactionId}', transactionId);
      const response = await this.client.get(url);

      return {
        transactionId: transactionId,
        externalId: response.data.order_id,
        status: this.mapOrangeStatus(response.data.status),
        amount: parseFloat(response.data.amount),
        currency: response.data.currency,
        fees: parseFloat(response.data.fees || 0),
        completedAt: response.data.status === 'SUCCESS' ? new Date(response.data.completed_at) : null,
        message: this.getOrangeStatusMessage(response.data.status),
        orangeReference: response.data.orange_reference
      };

    } catch (error) {
      logger.error('Erreur vérification statut Orange Money:', error);

      if (error.response?.status === 404) {
        return {
          transactionId: transactionId,
          status: 'unknown',
          message: 'Transaction non trouvée'
        };
      }

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

  getOrangeStatusMessage(status) {
    const messages = {
      'PENDING': 'Paiement en cours de traitement',
      'SUCCESS': 'Paiement Orange Money confirmé',
      'FAILED': 'Paiement Orange Money échoué',
      'CANCELLED': 'Paiement annulé par l\'utilisateur',
      'EXPIRED': 'Délai de paiement expiré'
    };

    return messages[status] || 'Statut inconnu';
  }

  // ===============================
  // TRANSFERTS - ENVOYER ARGENT
  // ===============================

  async initiateTransfer(transferData) {
    const { amount, phone, transactionId, description } = transferData;

    if (this.simulationMode) {
      return this.simulateTransfer(transferData);
    }

    try {
      const timestamp = Date.now().toString();
      const nonce = this.generateNonce();

      const requestData = {
        merchant_key: this.merchantKey,
        currency: 'XAF',
        order_id: transactionId,
        amount: amount,
        recipient_phone: this.formatOrangePhoneNumber(phone),
        description: description,
        callback_url: `${process.env.FRONTEND_URL}/api/payments/webhook/orange-transfer`,
        nonce: nonce,
        timestamp: timestamp
      };

      // Générer la signature
      requestData.signature = this.generateSignature(requestData, nonce, timestamp);

      const response = await this.client.post(this.endpoints.transfer, requestData);

      if (response.data.status === 'SUCCESS') {
        return {
          success: true,
          transactionId: response.data.transaction_id,
          externalTransactionId: transactionId,
          status: 'pending',
          message: 'Transfert Orange Money initié avec succès',
          orangeReference: response.data.orange_reference
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Erreur lors du transfert Orange Money',
          errorCode: response.data.error_code
        };
      }

    } catch (error) {
      logger.error('Erreur transfert Orange Money:', error);
      return {
        success: false,
        message: 'Erreur lors du transfert Orange Money',
        error: error.message
      };
    }
  }

  async checkTransferStatus(transferId) {
    if (this.simulationMode) {
      return this.simulatePaymentStatus();
    }

    try {
      const url = this.endpoints.transferStatus.replace('{transferId}', transferId);
      const response = await this.client.get(url);

      return {
        transferId: transferId,
        status: this.mapOrangeStatus(response.data.status),
        amount: parseFloat(response.data.amount),
        currency: response.data.currency,
        completedAt: response.data.status === 'SUCCESS' ? new Date(response.data.completed_at) : null,
        message: this.getOrangeStatusMessage(response.data.status)
      };

    } catch (error) {
      logger.error('Erreur vérification statut transfert Orange Money:', error);
      return {
        transferId: transferId,
        status: 'unknown',
        message: 'Impossible de vérifier le statut du transfert'
      };
    }
  }

  // ===============================
  // UTILITAIRES
  // ===============================

  formatOrangePhoneNumber(phone) {
    // Orange Money accepte plusieurs formats
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

  async getAccountBalance() {
    if (this.simulationMode) {
      return { balance: 500000, currency: 'XAF', status: 'active' };
    }

    try {
      const response = await this.client.get(this.endpoints.balance);
      return {
        balance: parseFloat(response.data.balance),
        currency: response.data.currency,
        status: 'active'
      };
    } catch (error) {
      logger.error('Erreur récupération solde Orange Money:', error);
      return { balance: 0, currency: 'XAF', status: 'error' };
    }
  }

  async getTransactionHistory(options = {}) {
    if (this.simulationMode) {
      return this.simulateTransactionHistory();
    }

    try {
      const { startDate, endDate, limit = 100 } = options;

      const params = {
        limit: limit
      };

      if (startDate) params.start_date = startDate.toISOString();
      if (endDate) params.end_date = endDate.toISOString();

      const response = await this.client.get(this.endpoints.transactionHistory, { params });

      return {
        transactions: response.data.transactions.map(tx => ({
          transactionId: tx.transaction_id,
          orderId: tx.order_id,
          amount: parseFloat(tx.amount),
          currency: tx.currency,
          status: this.mapOrangeStatus(tx.status),
          createdAt: new Date(tx.created_at),
          completedAt: tx.completed_at ? new Date(tx.completed_at) : null
        })),
        total: response.data.total,
        hasMore: response.data.has_more
      };

    } catch (error) {
      logger.error('Erreur récupération historique Orange Money:', error);
      return { transactions: [], total: 0, hasMore: false };
    }
  }

  // ===============================
  // SIMULATION
  // ===============================

  simulateWebPayment(paymentData) {
    logger.info('Mode simulation Orange Money webPayment:', paymentData);

    const scenarios = ['success', 'pending', 'failed'];
    const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];

    switch (randomScenario) {
      case 'success':
        return {
          success: true,
          transactionId: `sim_orange_${Date.now()}`,
          externalTransactionId: paymentData.transactionId,
          status: 'pending',
          message: '[SIMULATION] Paiement Orange Money initié',
          paymentUrl: `https://sim.orange.cm/pay/${Date.now()}`,
          paymentToken: `TOKEN_${Date.now()}`,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
          instructions: 'Composez #150*4*4# et suivez les instructions (SIMULATION)'
        };

      case 'failed':
        return {
          success: false,
          message: '[SIMULATION] Échec - Compte Orange Money inactif ou solde insuffisant',
          errorCode: 'ACCOUNT_INACTIVE_OR_INSUFFICIENT_FUNDS'
        };

      default:
        return {
          success: true,
          transactionId: `sim_orange_${Date.now()}`,
          status: 'pending',
          message: '[SIMULATION] Paiement en cours de traitement',
          expiresAt: new Date(Date.now() + 15 * 60 * 1000)
        };
    }
  }

  simulateTransfer(transferData) {
    logger.info('Mode simulation Orange Money transfer:', transferData);

    return {
      success: true,
      transactionId: `sim_orange_transfer_${Date.now()}`,
      externalTransactionId: transferData.transactionId,
      status: 'pending',
      message: '[SIMULATION] Transfert Orange Money initié',
      orangeReference: `OR${Date.now()}`
    };
  }

  simulatePaymentStatus() {
    const scenarios = [
      { status: 'processing', probability: 0.15 },
      { status: 'completed', probability: 0.75 },
      { status: 'failed', probability: 0.1 }
    ];

    const random = Math.random();
    let cumulativeProbability = 0;

    for (const scenario of scenarios) {
      cumulativeProbability += scenario.probability;
      if (random <= cumulativeProbability) {
        return {
          status: scenario.status,
          amount: 2500,
          currency: 'XAF',
          fees: 125, // Frais Orange Money simulés
          completedAt: scenario.status === 'completed' ? new Date() : null,
          message: scenario.status === 'completed' ?
            '[SIMULATION] Paiement Orange Money confirmé' :
            scenario.status === 'failed' ?
            '[SIMULATION] Paiement Orange Money échoué' :
            '[SIMULATION] Paiement Orange Money en cours'
        };
      }
    }
  }

  simulateTransactionHistory() {
    const transactions = [];
    for (let i = 0; i < 10; i++) {
      transactions.push({
        transactionId: `sim_tx_${Date.now()}_${i}`,
        orderId: `ORDER_${i + 1}`,
        amount: Math.floor(Math.random() * 50000) + 1000,
        currency: 'XAF',
        status: 'completed',
        createdAt: new Date(Date.now() - (i * 86400000)), // i jours en arrière
        completedAt: new Date(Date.now() - (i * 86400000) + 3600000) // 1h après création
      });
    }

    return {
      transactions,
      total: 10,
      hasMore: false
    };
  }

  // ===============================
  // STATUS & TESTING
  // ===============================

  async testConnection() {
    if (this.simulationMode) {
      return {
        success: true,
        message: 'Mode simulation - Connexion Orange Money simulée',
        environment: this.environment
      };
    }

    try {
      await this.getAccessToken();
      const balance = await this.getAccountBalance();

      return {
        success: true,
        message: 'Connexion Orange Money établie avec succès',
        environment: this.environment,
        balance: balance
      };
    } catch (error) {
      return {
        success: false,
        message: 'Échec de connexion à Orange Money API',
        error: error.message
      };
    }
  }

  getStatus() {
    return {
      service: 'Orange Money Cameroon',
      mode: this.simulationMode ? 'simulation' : 'production',
      environment: this.environment,
      baseURL: this.baseURL,
      configured: !this.simulationMode,
      tokenValid: this.accessToken && !this.isTokenExpired()
    };
  }
}

module.exports = { OrangeMoneyService };