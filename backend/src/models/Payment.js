/**
 * Modèle Sequelize pour les Paiements
 * Intégration MAVIANCE Smobil Pay - Claudyne
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    transactionId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    externalTransactionId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'ID de transaction du provider (MTN, Orange, etc.)'
    },
    familyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'families',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.INTEGER, // en centimes de FCFA
      allowNull: false,
      validate: {
        min: 1
      }
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'XAF',
      validate: {
        isIn: [['XAF', 'EUR', 'USD']]
      }
    },
    paymentMethod: {
      type: DataTypes.ENUM,
      values: ['mtn_momo', 'orange_money', 'bank_transfer', 'card', 'wallet', 'claudyne_card'],
      allowNull: false
    },
    provider: {
      type: DataTypes.ENUM,
      values: ['maviance', 'mtn', 'orange', 'visa', 'mastercard', 'gimac', 'internal'],
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM,
      values: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'expired'],
      defaultValue: 'pending'
    },
    type: {
      type: DataTypes.ENUM,
      values: ['subscription', 'topup', 'course_purchase', 'battle_entry', 'certification', 'refund'],
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        is: /^\+237[0-9]{9}$/
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {
        subscriptionPlan: null,
        planDuration: null,
        coursesIncluded: [],
        battleId: null,
        originalAmount: null,
        discountApplied: null,
        promoCode: null,
        deviceInfo: null,
        ipAddress: null
      }
    },
    providerResponse: {
      type: DataTypes.JSONB,
      defaultValue: {}
      // Stocke les réponses complètes des providers pour debug
    },
    fees: {
      type: DataTypes.JSONB,
      defaultValue: {
        providerFee: 0,
        platformFee: 0,
        totalFees: 0,
        feePercentage: 0
      }
    },
    netAmount: {
      type: DataTypes.INTEGER, // Montant après déduction des frais
      allowNull: true
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    failedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    failureReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    refundReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    refundedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    refundAmount: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    callbackData: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    retryCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    lastRetryAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    webhookReceived: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    webhookData: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'payments',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        fields: ['transactionId'],
        unique: true
      },
      {
        fields: ['externalTransactionId']
      },
      {
        fields: ['familyId', 'status']
      },
      {
        fields: ['status']
      },
      {
        fields: ['paymentMethod']
      },
      {
        fields: ['type']
      },
      {
        fields: ['createdAt']
      },
      {
        fields: ['familyId', 'type', 'status']
      }
    ],
    scopes: {
      pending: {
        where: {
          status: 'pending'
        }
      },
      completed: {
        where: {
          status: 'completed'
        }
      },
      failed: {
        where: {
          status: 'failed'
        }
      },
      byFamily: (familyId) => ({
        where: {
          familyId
        },
        order: [['createdAt', 'DESC']]
      }),
      byMethod: (method) => ({
        where: {
          paymentMethod: method
        }
      }),
      recentTransactions: {
        order: [['createdAt', 'DESC']],
        limit: 50
      }
    }
  });

  // Méthodes d'instance
  Payment.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());

    // Masquer les données sensibles
    return {
      id: values.id,
      transactionId: values.transactionId,
      familyId: values.familyId,
      amount: values.amount,
      currency: values.currency,
      paymentMethod: values.paymentMethod,
      provider: values.provider,
      status: values.status,
      type: values.type,
      description: values.description,
      metadata: {
        subscriptionPlan: values.metadata?.subscriptionPlan,
        planDuration: values.metadata?.planDuration,
        discountApplied: values.metadata?.discountApplied,
        promoCode: values.metadata?.promoCode
      },
      fees: values.fees,
      netAmount: values.netAmount,
      processedAt: values.processedAt,
      completedAt: values.completedAt,
      failedAt: values.failedAt,
      expiresAt: values.expiresAt,
      failureReason: values.failureReason,
      createdAt: values.createdAt,
      updatedAt: values.updatedAt
    };
  };

  Payment.prototype.getAmountInFCFA = function() {
    return this.amount / 100; // Convertir de centimes vers FCFA
  };

  Payment.prototype.getNetAmountInFCFA = function() {
    return (this.netAmount || this.amount) / 100;
  };

  Payment.prototype.markAsPending = async function() {
    this.status = 'pending';
    this.processedAt = new Date();
    await this.save();
  };

  Payment.prototype.markAsProcessing = async function() {
    this.status = 'processing';
    this.processedAt = new Date();
    await this.save();
  };

  Payment.prototype.markAsCompleted = async function(externalId = null, providerData = {}) {
    this.status = 'completed';
    this.completedAt = new Date();
    if (externalId) {
      this.externalTransactionId = externalId;
    }
    if (providerData) {
      this.providerResponse = { ...this.providerResponse, completion: providerData };
    }
    this.webhookReceived = true;
    await this.save();

    // Traiter le paiement (créditer le compte, activer l'abonnement, etc.)
    await this.processPaymentSuccess();
  };

  Payment.prototype.markAsFailed = async function(reason, providerData = {}) {
    this.status = 'failed';
    this.failedAt = new Date();
    this.failureReason = reason;
    if (providerData) {
      this.providerResponse = { ...this.providerResponse, failure: providerData };
    }
    await this.save();
  };

  Payment.prototype.processPaymentSuccess = async function() {
    const Family = sequelize.models.Family;
    const Subscription = sequelize.models.Subscription;

    try {
      const family = await Family.findByPk(this.familyId);
      if (!family) {
        throw new Error('Famille non trouvée');
      }

      switch (this.type) {
        case 'subscription':
          await this.activateSubscription(family);
          break;

        case 'topup':
          await this.creditWallet(family);
          break;

        case 'course_purchase':
          await this.unlockCourses(family);
          break;

        case 'battle_entry':
          await this.registerForBattle(family);
          break;

        case 'certification':
          await this.issueCertification(family);
          break;
      }

      // Créer une notification
      await this.createSuccessNotification(family);

    } catch (error) {
      console.error('Erreur lors du traitement du paiement:', error);
      // Ici on pourrait créer une alerte admin ou tenter une réconciliation manuelle
    }
  };

  Payment.prototype.activateSubscription = async function(family) {
    const Subscription = sequelize.models.Subscription;
    const { subscriptionPlan, planDuration } = this.metadata;

    let subscription = await Subscription.findOne({ where: { familyId: family.id } });

    const now = new Date();
    const startDate = subscription && subscription.expiresAt > now ? subscription.expiresAt : now;

    const durationMap = {
      'monthly': 30,
      'quarterly': 90,
      'yearly': 365
    };

    const days = durationMap[planDuration] || 30;
    const expiresAt = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);

    if (subscription) {
      await subscription.update({
        type: subscriptionPlan,
        status: 'active',
        expiresAt,
        lastPaymentId: this.id,
        lastPaymentAt: new Date()
      });
    } else {
      subscription = await Subscription.create({
        familyId: family.id,
        type: subscriptionPlan,
        status: 'active',
        startedAt: startDate,
        expiresAt,
        lastPaymentId: this.id,
        lastPaymentAt: new Date()
      });
    }

    // Mettre à jour le statut de la famille
    await family.update({
      subscriptionType: subscriptionPlan,
      status: 'ACTIVE'
    });
  };

  Payment.prototype.creditWallet = async function(family) {
    const creditAmount = this.getNetAmountInFCFA();
    await family.increment('walletBalance', { by: creditAmount });
  };

  Payment.prototype.createSuccessNotification = async function(family) {
    const Notification = sequelize.models.Notification;

    if (Notification) {
      // Notifier le gestionnaire de famille
      const manager = await family.getMembers({ where: { userType: 'MANAGER' } });

      if (manager.length > 0) {
        await Notification.create({
          userId: manager[0].id,
          type: 'payment_success',
          title: 'Paiement confirmé',
          message: `Votre paiement de ${this.getAmountInFCFA()} FCFA a été traité avec succès.`,
          data: {
            paymentId: this.id,
            transactionId: this.transactionId,
            amount: this.getAmountInFCFA()
          }
        });
      }
    }
  };

  Payment.prototype.retry = async function() {
    if (this.retryCount >= 3) {
      throw new Error('Nombre maximum de tentatives atteint');
    }

    this.retryCount += 1;
    this.lastRetryAt = new Date();
    this.status = 'pending';
    await this.save();

    // Ici on pourrait relancer le processus de paiement
    return true;
  };

  Payment.prototype.refund = async function(reason, partialAmount = null) {
    if (this.status !== 'completed') {
      throw new Error('Seuls les paiements complétés peuvent être remboursés');
    }

    const refundAmount = partialAmount || this.amount;

    this.status = 'refunded';
    this.refundReason = reason;
    this.refundedAt = new Date();
    this.refundAmount = refundAmount;
    await this.save();

    // Créer une transaction de remboursement
    const refundPayment = await Payment.create({
      transactionId: `refund_${this.transactionId}_${Date.now()}`,
      familyId: this.familyId,
      amount: -refundAmount,
      currency: this.currency,
      paymentMethod: this.paymentMethod,
      provider: this.provider,
      status: 'completed',
      type: 'refund',
      description: `Remboursement - ${this.description}`,
      metadata: {
        originalPaymentId: this.id,
        refundReason: reason
      },
      completedAt: new Date()
    });

    // Traiter le remboursement (débiter le wallet, désactiver l'abonnement si nécessaire)
    await this.processRefund(refundAmount);

    return refundPayment;
  };

  Payment.prototype.processRefund = async function(refundAmount) {
    const Family = sequelize.models.Family;
    const family = await Family.findByPk(this.familyId);

    if (this.type === 'subscription') {
      // Désactiver l'abonnement ou ajuster la date d'expiration
      const Subscription = sequelize.models.Subscription;
      const subscription = await Subscription.findOne({ where: { familyId: family.id } });

      if (subscription) {
        // Calculer au prorata le remboursement
        const totalDays = (subscription.expiresAt - subscription.startedAt) / (1000 * 60 * 60 * 24);
        const refundDays = Math.floor((refundAmount / this.amount) * totalDays);
        const newExpiryDate = new Date(subscription.expiresAt.getTime() - refundDays * 24 * 60 * 60 * 1000);

        if (newExpiryDate <= new Date()) {
          await subscription.update({ status: 'cancelled', cancelledAt: new Date() });
          await family.update({ subscriptionType: 'none', status: 'INACTIVE' });
        } else {
          await subscription.update({ expiresAt: newExpiryDate });
        }
      }
    } else if (this.type === 'topup') {
      // Débiter le wallet
      const debitAmount = refundAmount / 100; // Convertir en FCFA
      if (family.walletBalance >= debitAmount) {
        await family.decrement('walletBalance', { by: debitAmount });
      }
    }
  };

  // Méthodes statiques
  Payment.generateTransactionId = function() {
    const prefix = 'CLY';
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}`.toUpperCase();
  };

  Payment.calculateFees = function(amount, paymentMethod, provider) {
    let feePercentage = 0;
    let fixedFee = 0;

    // Frais selon la méthode de paiement et le provider
    switch (paymentMethod) {
      case 'mtn_momo':
        feePercentage = 1.5; // 1.5%
        fixedFee = 50; // 50 FCFA
        break;
      case 'orange_money':
        feePercentage = 2.0; // 2.0%
        fixedFee = 75; // 75 FCFA
        break;
      case 'bank_transfer':
        feePercentage = 0.5; // 0.5%
        fixedFee = 100; // 100 FCFA
        break;
      case 'card':
        feePercentage = 2.5; // 2.5%
        fixedFee = 0;
        break;
      default:
        feePercentage = 1.0;
        fixedFee = 0;
    }

    const providerFee = Math.round((amount * feePercentage / 100) + fixedFee);
    const platformFee = Math.round(amount * 0.5 / 100); // 0.5% pour Claudyne
    const totalFees = providerFee + platformFee;
    const netAmount = amount - totalFees;

    return {
      providerFee,
      platformFee,
      totalFees,
      feePercentage: (totalFees / amount) * 100,
      netAmount
    };
  };

  Payment.createPayment = async function(paymentData) {
    const {
      familyId,
      amount,
      paymentMethod,
      type,
      description,
      phone,
      email,
      metadata = {}
    } = paymentData;

    // Générer un ID de transaction unique
    const transactionId = this.generateTransactionId();

    // Calculer les frais
    const provider = this.getProviderFromMethod(paymentMethod);
    const fees = this.calculateFees(amount, paymentMethod, provider);

    // Définir l'expiration (15 minutes pour mobile money, 24h pour virement)
    const expirationMinutes = ['mtn_momo', 'orange_money'].includes(paymentMethod) ? 15 : 1440;
    const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);

    const payment = await this.create({
      transactionId,
      familyId,
      amount,
      paymentMethod,
      provider,
      type,
      description,
      phone,
      email,
      metadata,
      fees: fees,
      netAmount: fees.netAmount,
      expiresAt
    });

    return payment;
  };

  Payment.getProviderFromMethod = function(paymentMethod) {
    const providerMap = {
      'mtn_momo': 'maviance',
      'orange_money': 'maviance',
      'bank_transfer': 'gimac',
      'card': 'visa',
      'wallet': 'internal',
      'claudyne_card': 'internal'
    };

    return providerMap[paymentMethod] || 'maviance';
  };

  Payment.getRevenueStats = async function(startDate, endDate) {
    const stats = await this.findAll({
      where: {
        status: 'completed',
        completedAt: {
          [sequelize.Sequelize.Op.between]: [startDate, endDate]
        }
      },
      attributes: [
        'paymentMethod',
        'type',
        [sequelize.Sequelize.fn('COUNT', sequelize.Sequelize.col('id')), 'count'],
        [sequelize.Sequelize.fn('SUM', sequelize.Sequelize.col('amount')), 'totalAmount'],
        [sequelize.Sequelize.fn('SUM', sequelize.Sequelize.col('netAmount')), 'totalNetAmount'],
        [sequelize.Sequelize.fn('AVG', sequelize.Sequelize.col('amount')), 'averageAmount']
      ],
      group: ['paymentMethod', 'type'],
      raw: true
    });

    return stats;
  };

  Payment.getPendingPayments = async function(olderThanMinutes = 30) {
    const cutoffTime = new Date(Date.now() - olderThanMinutes * 60 * 1000);

    return await this.findAll({
      where: {
        status: ['pending', 'processing'],
        createdAt: {
          [sequelize.Sequelize.Op.lt]: cutoffTime
        }
      },
      include: [{
        model: sequelize.models.Family,
        as: 'family',
        attributes: ['id', 'name']
      }]
    });
  };

  // Hooks
  Payment.beforeCreate(async (payment) => {
    if (!payment.transactionId) {
      payment.transactionId = Payment.generateTransactionId();
    }
  });

  Payment.afterUpdate(async (payment) => {
    // Envoyer des webhooks aux services externes si nécessaire
    if (payment.changed('status')) {
      // Ici on pourrait notifier des services externes,
      // mettre à jour des caches, etc.
    }
  });

  return Payment;
};