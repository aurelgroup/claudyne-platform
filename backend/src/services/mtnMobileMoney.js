/**
 * Service MTN Mobile Money Cameroun
 * Intégration directe avec l'API MTN MoMo
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class MtnMobileMoneyService {
  constructor() {
    // Configuration production MTN Cameroon
    this.baseURL = process.env.MTN_MOMO_API_URL || 'https://sandbox.momodeveloper.mtn.com';
    this.environment = process.env.NODE_ENV === 'production' ? 'mtncameroon' : 'sandbox';

    // Credentials MTN MoMo API
    this.subscriptionKey = process.env.MTN_MOMO_SUBSCRIPTION_KEY;
    this.apiUserId = process.env.MTN_MOMO_API_USER_ID;
    this.apiKey = process.env.MTN_MOMO_API_KEY;
    this.targetEnvironment = this.environment;

    // Configuration des endpoints
    this.endpoints = {
      // Collection API (Recevoir des paiements)
      requestToPay: '/collection/v1_0/requesttopay',
      requestToPayStatus: '/collection/v1_0/requesttopay/{referenceId}',
      getBalance: '/collection/v1_0/account/balance',
      getAccountStatus: '/collection/v1_0/accountholder/msisdn/{msisdn}/active',

      // Disbursement API (Envoyer de l'argent)
      transfer: '/disbursement/v1_0/transfer',
      transferStatus: '/disbursement/v1_0/transfer/{referenceId}',
      disbursementBalance: '/disbursement/v1_0/account/balance',

      // Remittance API (Transferts internationaux)
      remittanceTransfer: '/remittance/v1_0/transfer',
      remittanceStatus: '/remittance/v1_0/transfer/{referenceId}'
    };

    // Token d'accès
    this.accessToken = null;
    this.tokenExpiry = null;

    // Validation de la configuration
    if (!this.subscriptionKey || !this.apiUserId || !this.apiKey) {
      logger.warn('Configuration MTN MoMo incomplète - Mode simulation activé');
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
        'X-Target-Environment': this.targetEnvironment,
        'Ocp-Apim-Subscription-Key': this.subscriptionKey
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
        config.headers['X-Reference-Id'] = uuidv4();

        logger.info('Requête MTN MoMo:', {
          method: config.method,
          url: config.url,
          referenceId: config.headers['X-Reference-Id']
        });

        return config;
      },
      (error) => {
        logger.error('Erreur requête MTN MoMo:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        logger.info('Réponse MTN MoMo:', {
          status: response.status,
          referenceId: response.headers['x-reference-id']
        });
        return response;
      },
      (error) => {
        logger.error('Erreur réponse MTN MoMo:', {
          status: error.response?.status,
          data: error.response?.data,
          referenceId: error.config?.headers['X-Reference-Id']
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
      const response = await axios.post(
        `${this.baseURL}/collection/token/`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': this.subscriptionKey,
            'Authorization': `Basic ${Buffer.from(`${this.apiUserId}:${this.apiKey}`).toString('base64')}`
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);

      logger.info('Token MTN MoMo obtenu avec succès');
      return this.accessToken;

    } catch (error) {
      logger.error('Erreur obtention token MTN MoMo:', error);
      throw error;
    }
  }

  isTokenExpired() {
    return !this.tokenExpiry || Date.now() >= (this.tokenExpiry - 60000); // 1 min de marge
  }

  // ===============================
  // COLLECTION - RECEVOIR PAIEMENTS
  // ===============================

  async requestToPay(paymentData) {
    const { amount, phone, transactionId, description } = paymentData;

    if (this.simulationMode) {
      return this.simulateRequestToPay(paymentData);
    }

    try {
      const referenceId = uuidv4();

      const requestData = {
        amount: amount.toString(),
        currency: 'EUR', // MTN MoMo utilise EUR dans sandbox, XAF en production
        externalId: transactionId,
        payer: {
          partyIdType: 'MSISDN',
          partyId: this.formatMtnPhoneNumber(phone)
        },
        payerMessage: description,
        payeeNote: `Paiement Claudyne - ${description}`
      };

      const response = await this.client.post(
        this.endpoints.requestToPay,
        requestData,
        {
          headers: {
            'X-Reference-Id': referenceId,
            'X-Callback-Url': `${process.env.FRONTEND_URL}/api/payments/webhook/mtn`
          }
        }
      );

      if (response.status === 202) {
        return {
          success: true,
          transactionId: referenceId,
          externalTransactionId: transactionId,
          status: 'pending',
          message: 'Demande de paiement MTN envoyée avec succès',
          instructions: `Composez *126# puis suivez les instructions ou attendez le message SMS`,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
          mtnReferenceId: referenceId
        };
      }

    } catch (error) {
      logger.error('Erreur requestToPay MTN:', error);

      if (error.response?.status === 409) {
        return {
          success: false,
          message: 'Transaction déjà en cours avec ce numéro',
          errorCode: 'DUPLICATE_TRANSACTION'
        };
      }

      return {
        success: false,
        message: 'Erreur lors de l\'initialisation du paiement MTN',
        errorCode: 'PAYMENT_INIT_FAILED',
        error: error.message
      };
    }
  }

  async checkRequestToPayStatus(referenceId) {
    if (this.simulationMode) {
      return this.simulatePaymentStatus();
    }

    try {
      const url = this.endpoints.requestToPayStatus.replace('{referenceId}', referenceId);
      const response = await this.client.get(url);

      return {
        transactionId: referenceId,
        externalId: response.data.externalId,
        status: this.mapMtnStatus(response.data.status),
        amount: parseFloat(response.data.amount),
        currency: response.data.currency,
        reason: response.data.reason,
        completedAt: response.data.status === 'SUCCESSFUL' ? new Date() : null,
        message: this.getMtnStatusMessage(response.data.status, response.data.reason)
      };

    } catch (error) {
      logger.error('Erreur vérification statut MTN:', error);

      if (error.response?.status === 404) {
        return {
          transactionId: referenceId,
          status: 'unknown',
          message: 'Transaction non trouvée'
        };
      }

      return {
        transactionId: referenceId,
        status: 'unknown',
        message: 'Impossible de vérifier le statut'
      };
    }
  }

  mapMtnStatus(mtnStatus) {
    const statusMap = {
      'PENDING': 'processing',
      'SUCCESSFUL': 'completed',
      'FAILED': 'failed'
    };

    return statusMap[mtnStatus] || 'unknown';
  }

  getMtnStatusMessage(status, reason) {
    const messages = {
      'PENDING': 'Paiement en cours de traitement',
      'SUCCESSFUL': 'Paiement MTN Mobile Money confirmé',
      'FAILED': reason || 'Paiement échoué'
    };

    return messages[status] || 'Statut inconnu';
  }

  // ===============================
  // DISBURSEMENT - ENVOYER ARGENT
  // ===============================

  async transfer(transferData) {
    const { amount, phone, transactionId, description } = transferData;

    if (this.simulationMode) {
      return this.simulateTransfer(transferData);
    }

    try {
      const referenceId = uuidv4();

      const requestData = {
        amount: amount.toString(),
        currency: 'EUR',
        externalId: transactionId,
        payee: {
          partyIdType: 'MSISDN',
          partyId: this.formatMtnPhoneNumber(phone)
        },
        payerMessage: description,
        payeeNote: `Transfert Claudyne - ${description}`
      };

      const response = await this.client.post(
        this.endpoints.transfer,
        requestData,
        {
          headers: {
            'X-Reference-Id': referenceId,
            'X-Callback-Url': `${process.env.FRONTEND_URL}/api/payments/webhook/mtn-disbursement`
          }
        }
      );

      if (response.status === 202) {
        return {
          success: true,
          transactionId: referenceId,
          externalTransactionId: transactionId,
          status: 'pending',
          message: 'Transfert MTN initié avec succès',
          mtnReferenceId: referenceId
        };
      }

    } catch (error) {
      logger.error('Erreur transfer MTN:', error);
      return {
        success: false,
        message: 'Erreur lors du transfert MTN',
        error: error.message
      };
    }
  }

  // ===============================
  // UTILITAIRES
  // ===============================

  formatMtnPhoneNumber(phone) {
    // MTN accepte le format international sans +
    const normalized = phone.replace(/\s+/g, '').replace('+', '');

    if (normalized.startsWith('237')) {
      return normalized;
    } else if (normalized.startsWith('0')) {
      return '237' + normalized.substring(1);
    } else {
      return '237' + normalized;
    }
  }

  async getAccountBalance() {
    if (this.simulationMode) {
      return { balance: 1000000, currency: 'XAF', status: 'active' };
    }

    try {
      const response = await this.client.get(this.endpoints.getBalance);
      return {
        balance: parseFloat(response.data.availableBalance),
        currency: response.data.currency,
        status: 'active'
      };
    } catch (error) {
      logger.error('Erreur récupération solde MTN:', error);
      return { balance: 0, currency: 'XAF', status: 'error' };
    }
  }

  async checkAccountStatus(phone) {
    if (this.simulationMode) {
      return { active: true, message: 'Compte MTN actif (simulation)' };
    }

    try {
      const formattedPhone = this.formatMtnPhoneNumber(phone);
      const url = this.endpoints.getAccountStatus.replace('{msisdn}', formattedPhone);

      const response = await this.client.get(url);

      return {
        active: response.data.result,
        message: response.data.result ? 'Compte MTN actif' : 'Compte MTN inactif'
      };
    } catch (error) {
      logger.error('Erreur vérification compte MTN:', error);
      return {
        active: false,
        message: 'Impossible de vérifier le statut du compte'
      };
    }
  }

  // ===============================
  // SIMULATION
  // ===============================

  simulateRequestToPay(paymentData) {
    logger.info('Mode simulation MTN requestToPay:', paymentData);

    const scenarios = ['success', 'pending', 'failed'];
    const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];

    switch (randomScenario) {
      case 'success':
        return {
          success: true,
          transactionId: `sim_mtn_${Date.now()}`,
          externalTransactionId: paymentData.transactionId,
          status: 'pending',
          message: '[SIMULATION] Demande de paiement MTN envoyée',
          instructions: 'Composez *126# puis suivez les instructions (SIMULATION)',
          expiresAt: new Date(Date.now() + 5 * 60 * 1000)
        };

      case 'failed':
        return {
          success: false,
          message: '[SIMULATION] Échec - Solde insuffisant ou numéro invalide',
          errorCode: 'INSUFFICIENT_FUNDS_OR_INVALID_MSISDN'
        };

      default:
        return {
          success: true,
          transactionId: `sim_mtn_${Date.now()}`,
          status: 'pending',
          message: '[SIMULATION] Paiement en cours de traitement',
          expiresAt: new Date(Date.now() + 5 * 60 * 1000)
        };
    }
  }

  simulateTransfer(transferData) {
    logger.info('Mode simulation MTN transfer:', transferData);

    return {
      success: true,
      transactionId: `sim_mtn_transfer_${Date.now()}`,
      externalTransactionId: transferData.transactionId,
      status: 'pending',
      message: '[SIMULATION] Transfert MTN initié'
    };
  }

  simulatePaymentStatus() {
    const scenarios = [
      { status: 'processing', probability: 0.2 },
      { status: 'completed', probability: 0.7 },
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
          completedAt: scenario.status === 'completed' ? new Date() : null,
          message: scenario.status === 'completed' ?
            '[SIMULATION] Paiement MTN confirmé' :
            scenario.status === 'failed' ?
            '[SIMULATION] Paiement MTN échoué' :
            '[SIMULATION] Paiement MTN en cours'
        };
      }
    }
  }

  // ===============================
  // STATUS & TESTING
  // ===============================

  async testConnection() {
    if (this.simulationMode) {
      return {
        success: true,
        message: 'Mode simulation - Connexion MTN MoMo simulée',
        environment: this.targetEnvironment
      };
    }

    try {
      await this.getAccessToken();
      const balance = await this.getAccountBalance();

      return {
        success: true,
        message: 'Connexion MTN MoMo établie avec succès',
        environment: this.targetEnvironment,
        balance: balance
      };
    } catch (error) {
      return {
        success: false,
        message: 'Échec de connexion à MTN MoMo API',
        error: error.message
      };
    }
  }

  getStatus() {
    return {
      service: 'MTN Mobile Money Cameroon',
      mode: this.simulationMode ? 'simulation' : 'production',
      environment: this.targetEnvironment,
      baseURL: this.baseURL,
      configured: !this.simulationMode,
      tokenValid: this.accessToken && !this.isTokenExpired()
    };
  }
}

module.exports = { MtnMobileMoneyService };