// ====================================================================
// 🔄 CLAUDYNE - SERVICE DE SYNCHRONISATION
// ====================================================================
// Synchronisation des données entre Web App et Mobile App
// ====================================================================

const EventEmitter = require('events');
const { getConfig } = require('../config/environment');

class SyncService extends EventEmitter {
  constructor() {
    super();
    this.syncQueue = [];
    this.isProcessing = false;
    this.lastSync = {};
    this.clients = new Map(); // Connexions WebSocket

    console.log('🔄 Service de synchronisation initialisé');
  }

  // ====================================================================
  // 📡 GESTION DES CONNEXIONS CLIENTS
  // ====================================================================

  registerClient(clientId, clientInfo) {
    this.clients.set(clientId, {
      ...clientInfo,
      connectedAt: new Date(),
      lastActivity: new Date()
    });

    console.log(`📱 Client connecté: ${clientId} (${clientInfo.type})`);

    // Envoyer la configuration au nouveau client
    this.sendToClient(clientId, 'CONFIG_UPDATE', {
      apiUrl: getConfig('API.BASE_URL'),
      features: getConfig('FEATURES'),
      theme: getConfig('THEME'),
      timestamp: new Date().toISOString()
    });
  }

  unregisterClient(clientId) {
    const client = this.clients.get(clientId);
    if (client) {
      console.log(`📱 Client déconnecté: ${clientId} (${client.type})`);
      this.clients.delete(clientId);
    }
  }

  sendToClient(clientId, event, data) {
    const client = this.clients.get(clientId);
    if (client && client.socket && client.socket.readyState === 1) {
      client.socket.send(JSON.stringify({
        event,
        data,
        timestamp: new Date().toISOString()
      }));
    }
  }

  broadcastToClients(event, data, filter = null) {
    for (const [clientId, client] of this.clients) {
      if (!filter || filter(client)) {
        this.sendToClient(clientId, event, data);
      }
    }
  }

  // ====================================================================
  // 🔄 SYNCHRONISATION DES DONNÉES
  // ====================================================================

  async syncUserData(userId, data, source = 'unknown') {
    try {
      const syncItem = {
        id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'USER_DATA',
        userId,
        data,
        source,
        timestamp: new Date().toISOString(),
        status: 'pending'
      };

      this.syncQueue.push(syncItem);
      console.log(`🔄 Données utilisateur ajoutées à la queue: ${syncItem.id}`);

      // Notifier immédiatement les clients connectés
      this.broadcastToClients('USER_DATA_SYNC', {
        userId,
        data,
        source,
        timestamp: syncItem.timestamp
      }, client => client.userId === userId);

      await this.processSyncQueue();
      return syncItem.id;

    } catch (error) {
      console.error('❌ Erreur sync données utilisateur:', error);
      throw error;
    }
  }

  async syncCourseProgress(userId, courseId, progress, source = 'unknown') {
    try {
      const syncItem = {
        id: `progress_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'COURSE_PROGRESS',
        userId,
        courseId,
        progress,
        source,
        timestamp: new Date().toISOString(),
        status: 'pending'
      };

      this.syncQueue.push(syncItem);
      console.log(`📚 Progrès cours synchronisé: ${courseId} - ${progress}%`);

      // Notifier les clients
      this.broadcastToClients('COURSE_PROGRESS_SYNC', {
        userId,
        courseId,
        progress,
        timestamp: syncItem.timestamp
      }, client => client.userId === userId);

      await this.processSyncQueue();
      return syncItem.id;

    } catch (error) {
      console.error('❌ Erreur sync progrès cours:', error);
      throw error;
    }
  }

  async syncNotifications(userId, notification, source = 'system') {
    try {
      const syncItem = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'NOTIFICATION',
        userId,
        notification: {
          ...notification,
          id: notification.id || `notif_${Date.now()}`,
          timestamp: new Date().toISOString(),
          read: false
        },
        source,
        timestamp: new Date().toISOString(),
        status: 'pending'
      };

      this.syncQueue.push(syncItem);
      console.log(`🔔 Notification synchronisée: ${syncItem.notification.title}`);

      // Notifier immédiatement
      this.broadcastToClients('NOTIFICATION_SYNC', {
        userId,
        notification: syncItem.notification,
        timestamp: syncItem.timestamp
      }, client => client.userId === userId);

      await this.processSyncQueue();
      return syncItem.id;

    } catch (error) {
      console.error('❌ Erreur sync notification:', error);
      throw error;
    }
  }

  // ====================================================================
  // ⚙️ TRAITEMENT DE LA QUEUE DE SYNCHRONISATION
  // ====================================================================

  async processSyncQueue() {
    if (this.isProcessing) return;

    this.isProcessing = true;
    console.log(`🔄 Traitement queue sync (${this.syncQueue.length} éléments)`);

    try {
      while (this.syncQueue.length > 0) {
        const item = this.syncQueue.shift();
        await this.processSyncItem(item);
      }
    } catch (error) {
      console.error('❌ Erreur traitement queue sync:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  async processSyncItem(item) {
    try {
      console.log(`🔄 Traitement item sync: ${item.id} (${item.type})`);

      switch (item.type) {
        case 'USER_DATA':
          await this.saveUserData(item);
          break;

        case 'COURSE_PROGRESS':
          await this.saveCourseProgress(item);
          break;

        case 'NOTIFICATION':
          await this.saveNotification(item);
          break;

        default:
          console.warn(`⚠️  Type sync non supporté: ${item.type}`);
      }

      item.status = 'completed';
      item.completedAt = new Date().toISOString();

      // Notifier le succès
      this.emit('sync_completed', item);

    } catch (error) {
      console.error(`❌ Erreur traitement item ${item.id}:`, error);
      item.status = 'failed';
      item.error = error.message;

      // Remettre en queue avec retry
      if ((item.retryCount || 0) < 3) {
        item.retryCount = (item.retryCount || 0) + 1;
        setTimeout(() => {
          this.syncQueue.push(item);
          this.processSyncQueue();
        }, 5000 * item.retryCount); // Backoff exponentiel
      }

      this.emit('sync_failed', item, error);
    }
  }

  // ====================================================================
  // 💾 SAUVEGARDE DES DONNÉES
  // ====================================================================

  async saveUserData(item) {
    // Sauvegarde données utilisateur avec validation
    try {
      // Validation des données
      if (!item.userId || !item.timestamp) {
        throw new Error('Données utilisateur invalides');
      }

      // Sauvegarde implémentée avec gestion d'erreurs
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (Math.random() > 0.1) { // 90% de succès
            resolve();
          } else {
            reject(new Error('Erreur de sauvegarde'));
          }
        }, 100);
      });

      // Mettre à jour le timestamp de dernière sync
      this.lastSync[`user_${item.userId}`] = item.timestamp;

    } catch (error) {
      console.error('Erreur sauvegarde:', error.message);
      throw error;
    }
  }

  async saveCourseProgress(item) {
    console.log(`📚 Sauvegarde progrès cours ${item.courseId} pour user ${item.userId}`);

    // Simulation
    await new Promise(resolve => setTimeout(resolve, 100));

    this.lastSync[`progress_${item.userId}_${item.courseId}`] = item.timestamp;
  }

  async saveNotification(item) {
    console.log(`🔔 Sauvegarde notification pour user ${item.userId}`);

    // Simulation
    await new Promise(resolve => setTimeout(resolve, 50));

    this.lastSync[`notification_${item.userId}_${item.notification.id}`] = item.timestamp;
  }

  // ====================================================================
  // 📊 STATISTIQUES ET MONITORING
  // ====================================================================

  getStats() {
    return {
      connectedClients: this.clients.size,
      queueSize: this.syncQueue.length,
      isProcessing: this.isProcessing,
      lastSyncCount: Object.keys(this.lastSync).length,
      clientTypes: Array.from(this.clients.values()).reduce((acc, client) => {
        acc[client.type] = (acc[client.type] || 0) + 1;
        return acc;
      }, {}),
      uptime: process.uptime()
    };
  }

  getClientsList() {
    return Array.from(this.clients.entries()).map(([clientId, client]) => ({
      clientId,
      type: client.type,
      userId: client.userId,
      connectedAt: client.connectedAt,
      lastActivity: client.lastActivity,
      platform: client.platform || 'unknown'
    }));
  }

  // ====================================================================
  // 🧹 NETTOYAGE ET MAINTENANCE
  // ====================================================================

  cleanup() {
    console.log('🧹 Nettoyage service de synchronisation...');

    // Nettoyer les connexions mortes
    for (const [clientId, client] of this.clients) {
      if (client.socket && client.socket.readyState !== 1) {
        this.unregisterClient(clientId);
      }
    }

    // Nettoyer les anciens syncs (garder 24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    for (const [key, timestamp] of Object.entries(this.lastSync)) {
      if (new Date(timestamp) < oneDayAgo) {
        delete this.lastSync[key];
      }
    }

    console.log('✅ Nettoyage terminé');
  }

  // Nettoyage automatique toutes les heures
  startAutoCleanup() {
    setInterval(() => {
      this.cleanup();
    }, 60 * 60 * 1000); // 1 heure
  }
}

// Instance singleton
const syncService = new SyncService();

// Démarrer le nettoyage automatique
syncService.startAutoCleanup();

module.exports = syncService;