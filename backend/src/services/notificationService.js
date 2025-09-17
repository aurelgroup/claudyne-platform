/**
 * Service de Notifications simplifié - Claudyne Backend
 * Version temporaire pour le développement
 */

class NotificationService {
  constructor(io, dbModels = null) {
    this.io = io;
    this.models = dbModels;
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
    // Version simplifiée - log seulement
    console.log(`📧 Notification [${type}] pour utilisateur ${userId}:`, data);
    return { success: true, id: Date.now() };
  }
}

module.exports = { NotificationService };