/**
 * Service de Notifications Claudyne Backend
 * Gestion des notifications in-app, email et push
 */

const { EmailService } = require('./emailService');
const logger = require('../utils/logger');

class NotificationService {
  constructor(io, dbModels = null) {
    this.io = io;
    this.models = dbModels;
    this.emailService = new EmailService();
  }

  async getUserNotifications(userId, options = {}) {
    try {
      // Version simplifiée - retourne une liste vide pour l'instant
      return {
        notifications: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0
        }
      };
    } catch (error) {
      console.error('Erreur récupération notifications:', error);
      throw error;
    }
  }

  async markAsRead(notificationId, userId) {
    // Version simplifiée - ne fait rien pour l'instant
    return { success: true };
  }

  async markAllAsRead(userId) {
    // Version simplifiée - ne fait rien pour l'instant
    return { success: true };
  }

  async getUnreadCount(userId) {
    // Version simplifiée - retourne toujours 0
    return 0;
  }

  async sendNotification(userId, type, data = {}, channels = ['IN_APP']) {
    try {
      const results = {
        success: true,
        id: Date.now(),
        channels: {}
      };

      // Récupérer les informations utilisateur pour les notifications email
      let user = null;
      if (channels.includes('EMAIL') && this.models && this.models.User) {
        user = await this.models.User.findByPk(userId);
        if (!user) {
          logger.warn(`Utilisateur ${userId} non trouvé pour notification email`);
          results.channels.email = { success: false, error: 'User not found' };
        }
      }

      // Notification in-app (WebSocket)
      if (channels.includes('IN_APP')) {
        try {
          if (this.io) {
            this.io.to(`user:${userId}`).emit('notification', {
              id: results.id,
              type,
              data,
              timestamp: new Date().toISOString()
            });
            results.channels.inApp = { success: true };
            logger.info(`📱 Notification in-app envoyée à l'utilisateur ${userId}`);
          }
        } catch (error) {
          logger.error('Erreur notification in-app:', error);
          results.channels.inApp = { success: false, error: error.message };
        }
      }

      // Notification email
      if (channels.includes('EMAIL') && user) {
        try {
          await this.sendEmailNotification(user, type, data);
          results.channels.email = { success: true };
          logger.info(`📧 Notification email envoyée à ${user.email}`);
        } catch (error) {
          logger.error(`Erreur notification email pour ${user.email}:`, error);
          results.channels.email = { success: false, error: error.message };
        }
      }

      return results;
    } catch (error) {
      logger.error('Erreur lors de l\'envoi de notification:', error);
      throw error;
    }
  }

  /**
   * Envoie une notification email selon le type
   */
  async sendEmailNotification(user, type, data) {
    switch (type) {
      case 'WELCOME':
        return this.emailService.sendWelcomeEmail(user);

      case 'PASSWORD_RESET':
        return this.emailService.sendPasswordResetEmail(user, data.resetToken);

      case 'EMAIL_VERIFICATION':
        return this.emailService.sendEmailVerification(user, data.verificationToken);

      case 'BATTLE_INVITATION':
        return this.emailService.sendBattleNotification(user, {
          type: 'invitation',
          ...data
        });

      case 'BATTLE_RESULTS':
        return this.emailService.sendBattleNotification(user, {
          type: 'results',
          ...data
        });

      default:
        logger.warn(`Type de notification email non supporté: ${type}`);
        return { success: false, error: 'Unsupported email type' };
    }
  }

  /**
   * Vérifie la configuration email
   */
  async verifyEmailConfiguration() {
    try {
      return await this.emailService.verifyConnection();
    } catch (error) {
      logger.error('Erreur vérification email:', error);
      return false;
    }
  }
}

module.exports = { NotificationService };