/**
 * Cron Jobs pour la gestion des abonnements Claudyne
 * Exécute les vérifications quotidiennes automatiques
 */

// ⚠️ IMPORTANT: Charger les variables d'environnement AVANT toute autre chose
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Charger .env.production en priorité (production)
const envProductionPath = path.join(__dirname, '../../../.env.production');
if (fs.existsSync(envProductionPath)) {
  dotenv.config({ path: envProductionPath });
  console.log('✅ Cron: .env.production chargé');
}

// Charger .env comme fallback (développement)
const envPath = path.join(__dirname, '../../../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: false });
  console.log('✅ Cron: .env chargé');
}

const cron = require('node-cron');
const database = require('../config/database');
const SubscriptionService = require('../services/subscriptionService');
const logger = require('../utils/logger');

class SubscriptionCronJobs {
  constructor() {
    this.subscriptionService = null;
    this.jobs = [];
  }

  /**
   * Initialiser les cron jobs
   */
  async initialize() {
    try {
      // Initialiser la base de données et le service
      const models = database.initializeModels();
      this.subscriptionService = new SubscriptionService(models);

      logger.info('🚀 Initialisation des cron jobs d\'abonnement...', {
        service: 'subscription-cron'
      });

      this.setupJobs();

      logger.info('✅ Cron jobs d\'abonnement initialisés avec succès', {
        jobCount: this.jobs.length
      });

    } catch (error) {
      logger.error('❌ Erreur initialisation cron jobs:', error);
      throw error;
    }
  }

  /**
   * Configurer tous les cron jobs
   */
  setupJobs() {
    // Job 1: Vérifier les essais expirés - Tous les jours à minuit
    this.jobs.push(
      cron.schedule('0 0 * * *', async () => {
        logger.info('⏰ Démarrage: Vérification essais expirés (00:00)');
        try {
          const result = await this.subscriptionService.checkExpiredTrials();
          logger.info('✅ Vérification essais terminée', result);
        } catch (error) {
          logger.error('❌ Erreur vérification essais:', error);
        }
      }, {
        timezone: 'Africa/Douala'
      })
    );

    // Job 2: Vérifier les abonnements expirés - Tous les jours à 00:30
    this.jobs.push(
      cron.schedule('30 0 * * *', async () => {
        logger.info('⏰ Démarrage: Vérification abonnements expirés (00:30)');
        try {
          const result = await this.subscriptionService.checkExpiredSubscriptions();
          logger.info('✅ Vérification abonnements terminée', result);
        } catch (error) {
          logger.error('❌ Erreur vérification abonnements:', error);
        }
      }, {
        timezone: 'Africa/Douala'
      })
    );

    // Job 3: Traiter les renouvellements automatiques - Tous les jours à 08:00
    this.jobs.push(
      cron.schedule('0 8 * * *', async () => {
        logger.info('⏰ Démarrage: Traitement renouvellements automatiques (08:00)');
        try {
          const result = await this.subscriptionService.processAutoRenewals();
          logger.info('✅ Renouvellements traités', result);
        } catch (error) {
          logger.error('❌ Erreur traitement renouvellements:', error);
        }
      }, {
        timezone: 'Africa/Douala'
      })
    );

    // Job 4: Envoyer rappels d'expiration - Tous les jours à 10:00
    this.jobs.push(
      cron.schedule('0 10 * * *', async () => {
        logger.info('⏰ Démarrage: Envoi rappels d\'expiration (10:00)');
        try {
          const result = await this.subscriptionService.sendExpirationReminders();
          logger.info('✅ Rappels envoyés', result);
        } catch (error) {
          logger.error('❌ Erreur envoi rappels:', error);
        }
      }, {
        timezone: 'Africa/Douala'
      })
    );

    // Job 5: Générer rapport quotidien - Tous les jours à 23:00
    this.jobs.push(
      cron.schedule('0 23 * * *', async () => {
        logger.info('⏰ Démarrage: Génération rapport quotidien (23:00)');
        try {
          const result = await this.subscriptionService.generateDailyReport();
          logger.info('✅ Rapport quotidien généré', result);
        } catch (error) {
          logger.error('❌ Erreur génération rapport:', error);
        }
      }, {
        timezone: 'Africa/Douala'
      })
    );

    // Job 6: Tâche complète de vérification - Tous les dimanches à 02:00
    this.jobs.push(
      cron.schedule('0 2 * * 0', async () => {
        logger.info('⏰ Démarrage: Vérification complète hebdomadaire (Dimanche 02:00)');
        try {
          const result = await this.subscriptionService.runDailyJobs();
          logger.info('✅ Vérification complète terminée', result);
        } catch (error) {
          logger.error('❌ Erreur vérification complète:', error);
        }
      }, {
        timezone: 'Africa/Douala'
      })
    );

    logger.info(`✅ ${this.jobs.length} cron jobs configurés`, {
      jobs: [
        '00:00 - Essais expirés',
        '00:30 - Abonnements expirés',
        '08:00 - Renouvellements auto',
        '10:00 - Rappels expiration',
        '23:00 - Rapport quotidien',
        '02:00 (Dim) - Vérification complète'
      ]
    });
  }

  /**
   * Démarrer tous les cron jobs
   */
  start() {
    logger.info('▶️ Démarrage des cron jobs d\'abonnement...');
    this.jobs.forEach(job => job.start());
    logger.info(`✅ ${this.jobs.length} cron jobs actifs`);
  }

  /**
   * Arrêter tous les cron jobs
   */
  stop() {
    logger.info('⏸️ Arrêt des cron jobs d\'abonnement...');
    this.jobs.forEach(job => job.stop());
    logger.info('✅ Cron jobs arrêtés');
  }

  /**
   * Exécuter manuellement un job spécifique (pour testing)
   */
  async runManualJob(jobName) {
    try {
      logger.info(`🔧 Exécution manuelle: ${jobName}`);

      let result;
      switch (jobName) {
        case 'checkExpiredTrials':
          result = await this.subscriptionService.checkExpiredTrials();
          break;
        case 'checkExpiredSubscriptions':
          result = await this.subscriptionService.checkExpiredSubscriptions();
          break;
        case 'processAutoRenewals':
          result = await this.subscriptionService.processAutoRenewals();
          break;
        case 'sendExpirationReminders':
          result = await this.subscriptionService.sendExpirationReminders();
          break;
        case 'generateDailyReport':
          result = await this.subscriptionService.generateDailyReport();
          break;
        case 'runDailyJobs':
          result = await this.subscriptionService.runDailyJobs();
          break;
        default:
          throw new Error(`Job inconnu: ${jobName}`);
      }

      logger.info(`✅ Job ${jobName} terminé`, result);
      return result;

    } catch (error) {
      logger.error(`❌ Erreur job ${jobName}:`, error);
      throw error;
    }
  }
}

// Instance singleton
const cronJobsInstance = new SubscriptionCronJobs();

// Initialiser et démarrer si exécuté directement
if (require.main === module) {
  cronJobsInstance.initialize()
    .then(() => {
      cronJobsInstance.start();
      logger.info('🎯 Cron jobs démarrés avec succès');

      // Garder le processus actif
      process.on('SIGINT', () => {
        logger.info('🛑 Arrêt des cron jobs...');
        cronJobsInstance.stop();
        process.exit(0);
      });
    })
    .catch(error => {
      logger.error('❌ Échec démarrage cron jobs:', error);
      process.exit(1);
    });
}

module.exports = cronJobsInstance;
