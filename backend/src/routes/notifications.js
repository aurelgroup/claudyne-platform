/**
 * Routes pour les Notifications - Claudyne Backend
 * Gestion des notifications utilisateur
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { NotificationService } = require('../services/notificationService');

router.use(async (req, res, next) => {
  if (!req.models) {
    const database = require('../config/database');
    req.models = database.initializeModels();
  }
  next();
});

// Récupérer les notifications de l'utilisateur
router.get('/', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const notificationService = new NotificationService(req.io, req.models);
    const options = {
      page: req.query.page || 1,
      limit: req.query.limit || 20,
      unreadOnly: req.query.unreadOnly === 'true',
      type: req.query.type,
      priority: req.query.priority
    };

    const result = await notificationService.getUserNotifications(req.user.id, options);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Erreur récupération notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des notifications'
    });
  }
});

// Marquer une notification comme lue
router.put('/:notificationId/read', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const notificationService = new NotificationService(req.io, req.models);
    const { notificationId } = req.params;

    await notificationService.markAsRead(notificationId, req.user.id);

    res.json({
      success: true,
      message: 'Notification marquée comme lue'
    });

  } catch (error) {
    logger.error('Erreur marquage notification:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du marquage de la notification'
    });
  }
});

// Marquer toutes les notifications comme lues
router.put('/mark-all-read', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const notificationService = new NotificationService(req.io, req.models);
    await notificationService.markAllAsRead(req.user.id);

    res.json({
      success: true,
      message: 'Toutes les notifications ont été marquées comme lues'
    });

  } catch (error) {
    logger.error('Erreur marquage toutes notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du marquage des notifications'
    });
  }
});

// Obtenir le nombre de notifications non lues
router.get('/unread-count', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const notificationService = new NotificationService(req.io, req.models);
    const count = await notificationService.getUnreadCount(req.user.id);

    res.json({
      success: true,
      data: { unreadCount: count }
    });

  } catch (error) {
    logger.error('Erreur comptage notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du comptage des notifications'
    });
  }
});

// Envoyer une notification de test (admin uniquement)
router.post('/test', async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const { userId, type, data, channels } = req.body;
    const notificationService = new NotificationService(req.io, req.models);

    const notification = await notificationService.sendNotification(
      userId || req.user.id,
      type || 'SYSTEM_MAINTENANCE',
      data || { message: 'Notification de test', time: new Date().toLocaleTimeString() },
      channels || ['IN_APP']
    );

    res.json({
      success: true,
      data: notification,
      message: 'Notification de test envoyée'
    });

  } catch (error) {
    logger.error('Erreur notification test:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi de la notification de test'
    });
  }
});

module.exports = router;