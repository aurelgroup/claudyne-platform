/**
 * Service de gestion des abonnements Claudyne
 * Gère les expirations, renouvellements et notifications
 */

const { Op } = require('sequelize');
const logger = require('../utils/logger');

class SubscriptionService {
  constructor(models) {
    this.models = models;
  }

  /**
   * Vérifier et expirer les essais gratuits
   * Exécuté quotidiennement à minuit
   */
  async checkExpiredTrials() {
    try {
      const { User } = this.models;
      const now = new Date();

      logger.info('🔍 Vérification des essais expirés...', {
        service: 'subscription-service',
        action: 'check_expired_trials',
        timestamp: now
      });

      // Trouver tous les comptes en TRIAL dont la date d'expiration est passée
      const expiredTrials = await User.findAll({
        where: {
          subscriptionStatus: 'TRIAL',
          trialEndsAt: {
            [Op.lte]: now
          },
          isActive: true
        }
      });

      let expiredCount = 0;
      let suspendedCount = 0;

      for (const user of expiredTrials) {
        // Si le compte a un plan payant (STUDENT ou FAMILY), le suspendre
        if (user.subscriptionPlan === 'INDIVIDUAL_STUDENT' ||
            user.subscriptionPlan === 'FAMILY_MANAGER') {

          await user.update({
            subscriptionStatus: 'SUSPENDED',
            isActive: false // Désactiver le compte jusqu'au paiement
          });

          suspendedCount++;

          logger.info(`⏸️ Essai expiré - Compte suspendu: ${user.email}`, {
            userId: user.id,
            role: user.role,
            plan: user.subscriptionPlan,
            trialEndedAt: user.trialEndsAt
          });

          // TODO: Envoyer notification de suspension

        } else {
          // Compte TEACHER ou autre - juste mettre à jour le statut
          await user.update({
            subscriptionStatus: 'EXPIRED'
          });

          expiredCount++;
        }
      }

      logger.info(`✅ Vérification essais terminée: ${expiredCount} expirés, ${suspendedCount} suspendus`, {
        total: expiredTrials.length,
        expired: expiredCount,
        suspended: suspendedCount
      });

      return {
        total: expiredTrials.length,
        expired: expiredCount,
        suspended: suspendedCount
      };

    } catch (error) {
      logger.error('❌ Erreur vérification essais expirés:', error);
      throw error;
    }
  }

  /**
   * Vérifier et expirer les abonnements payants
   * Exécuté quotidiennement à minuit
   */
  async checkExpiredSubscriptions() {
    try {
      const { User } = this.models;
      const now = new Date();

      logger.info('🔍 Vérification des abonnements expirés...', {
        service: 'subscription-service',
        action: 'check_expired_subscriptions',
        timestamp: now
      });

      // Trouver tous les abonnements ACTIVE expirés
      const expiredSubscriptions = await User.findAll({
        where: {
          subscriptionStatus: 'ACTIVE',
          subscriptionEndsAt: {
            [Op.lte]: now
          },
          isActive: true
        }
      });

      let expiredCount = 0;

      for (const user of expiredSubscriptions) {
        await user.update({
          subscriptionStatus: 'EXPIRED',
          isActive: false
        });

        expiredCount++;

        logger.info(`⏰ Abonnement expiré: ${user.email}`, {
          userId: user.id,
          role: user.role,
          plan: user.subscriptionPlan,
          monthlyPrice: user.monthlyPrice,
          endedAt: user.subscriptionEndsAt
        });

        // TODO: Envoyer notification d'expiration
      }

      logger.info(`✅ Vérification abonnements terminée: ${expiredCount} expirés`, {
        total: expiredSubscriptions.length,
        expired: expiredCount
      });

      return {
        total: expiredSubscriptions.length,
        expired: expiredCount
      };

    } catch (error) {
      logger.error('❌ Erreur vérification abonnements expirés:', error);
      throw error;
    }
  }

  /**
   * Gérer les renouvellements automatiques
   * Exécuté quotidiennement à 8h du matin
   */
  async processAutoRenewals() {
    try {
      const { User } = this.models;
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      logger.info('🔄 Traitement des renouvellements automatiques...', {
        service: 'subscription-service',
        action: 'process_auto_renewals',
        timestamp: now
      });

      // Trouver tous les comptes avec autoRenew = true et nextPaymentDate demain
      const accountsToRenew = await User.findAll({
        where: {
          autoRenew: true,
          subscriptionStatus: {
            [Op.in]: ['ACTIVE', 'TRIAL']
          },
          nextPaymentDate: {
            [Op.between]: [now, tomorrow]
          },
          isActive: true
        }
      });

      let processedCount = 0;
      let pendingCount = 0;

      for (const user of accountsToRenew) {
        // Créer une demande de paiement
        // TODO: Intégration Mobile Money (MTN/Orange)

        logger.info(`💳 Renouvellement en attente: ${user.email}`, {
          userId: user.id,
          plan: user.subscriptionPlan,
          amount: user.monthlyPrice,
          nextPaymentDate: user.nextPaymentDate
        });

        // Marquer comme en attente de paiement
        await user.update({
          subscriptionStatus: 'SUSPENDED',
          metadata: {
            ...user.metadata,
            pendingRenewal: true,
            renewalAttemptedAt: now
          }
        });

        pendingCount++;

        // TODO: Envoyer notification de paiement en attente
      }

      logger.info(`✅ Renouvellements traités: ${pendingCount} en attente de paiement`, {
        total: accountsToRenew.length,
        pending: pendingCount
      });

      return {
        total: accountsToRenew.length,
        pending: pendingCount
      };

    } catch (error) {
      logger.error('❌ Erreur traitement renouvellements:', error);
      throw error;
    }
  }

  /**
   * Envoyer des rappels pour les abonnements qui expirent bientôt
   * Exécuté quotidiennement à 10h du matin
   */
  async sendExpirationReminders() {
    try {
      const { User } = this.models;
      const now = new Date();
      const threeDaysFromNow = new Date(now);
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      logger.info('📧 Envoi des rappels d\'expiration...', {
        service: 'subscription-service',
        action: 'send_expiration_reminders',
        timestamp: now
      });

      // Abonnements expirant dans 3 jours
      const expiringTrials = await User.findAll({
        where: {
          subscriptionStatus: 'TRIAL',
          trialEndsAt: {
            [Op.between]: [now, threeDaysFromNow]
          },
          isActive: true
        }
      });

      const expiringSubscriptions = await User.findAll({
        where: {
          subscriptionStatus: 'ACTIVE',
          subscriptionEndsAt: {
            [Op.between]: [now, threeDaysFromNow]
          },
          isActive: true
        }
      });

      let remindersSent = 0;

      // Rappels pour essais
      for (const user of expiringTrials) {
        const daysLeft = Math.ceil((user.trialEndsAt - now) / (1000 * 60 * 60 * 24));

        logger.info(`📨 Rappel essai expirant: ${user.email} (${daysLeft} jours restants)`, {
          userId: user.id,
          plan: user.subscriptionPlan,
          daysLeft
        });

        // TODO: Envoyer email/SMS de rappel
        remindersSent++;
      }

      // Rappels pour abonnements
      for (const user of expiringSubscriptions) {
        const daysLeft = Math.ceil((user.subscriptionEndsAt - now) / (1000 * 60 * 60 * 24));

        logger.info(`📨 Rappel abonnement expirant: ${user.email} (${daysLeft} jours restants)`, {
          userId: user.id,
          plan: user.subscriptionPlan,
          daysLeft
        });

        // TODO: Envoyer email/SMS de rappel
        remindersSent++;
      }

      logger.info(`✅ Rappels envoyés: ${remindersSent}`, {
        trials: expiringTrials.length,
        subscriptions: expiringSubscriptions.length,
        total: remindersSent
      });

      return {
        trialReminders: expiringTrials.length,
        subscriptionReminders: expiringSubscriptions.length,
        total: remindersSent
      };

    } catch (error) {
      logger.error('❌ Erreur envoi rappels:', error);
      throw error;
    }
  }

  /**
   * Générer rapport quotidien des abonnements
   * Exécuté tous les jours à 23h
   */
  async generateDailyReport() {
    try {
      const { User } = this.models;

      logger.info('📊 Génération du rapport quotidien...', {
        service: 'subscription-service',
        action: 'generate_daily_report'
      });

      const [
        totalUsers,
        activeTrials,
        activeSubscriptions,
        suspendedAccounts,
        expiredAccounts,
        totalRevenue,
        monthlyRevenue
      ] = await Promise.all([
        User.count(),
        User.count({ where: { subscriptionStatus: 'TRIAL', isActive: true } }),
        User.count({ where: { subscriptionStatus: 'ACTIVE', isActive: true } }),
        User.count({ where: { subscriptionStatus: 'SUSPENDED' } }),
        User.count({ where: { subscriptionStatus: 'EXPIRED' } }),
        // Calculer revenus total (basé sur abonnements actifs)
        User.sum('monthlyPrice', {
          where: {
            subscriptionStatus: 'ACTIVE',
            isActive: true
          }
        }),
        // Revenus mensuels attendus
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
        })
      ]);

      const report = {
        date: new Date().toISOString().split('T')[0],
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
        timestamp: new Date()
      };

      logger.info('✅ Rapport quotidien généré', report);

      return report;

    } catch (error) {
      logger.error('❌ Erreur génération rapport:', error);
      throw error;
    }
  }

  /**
   * Exécuter toutes les tâches quotidiennes
   * Appelé par le cron job principal
   */
  async runDailyJobs() {
    logger.info('🚀 Démarrage des tâches quotidiennes d\'abonnement', {
      timestamp: new Date()
    });

    try {
      const results = {
        expiredTrials: await this.checkExpiredTrials(),
        expiredSubscriptions: await this.checkExpiredSubscriptions(),
        autoRenewals: await this.processAutoRenewals(),
        reminders: await this.sendExpirationReminders(),
        dailyReport: await this.generateDailyReport()
      };

      logger.info('✅ Tâches quotidiennes terminées avec succès', results);

      return results;
    } catch (error) {
      logger.error('❌ Erreur lors des tâches quotidiennes:', error);
      throw error;
    }
  }
}

module.exports = SubscriptionService;
