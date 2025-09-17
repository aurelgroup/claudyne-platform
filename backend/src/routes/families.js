/**
 * Routes pour les Familles - Claudyne Backend
 * Gestion des comptes familiaux
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

router.use(async (req, res, next) => {
  if (!req.models) {
    const database = require('../config/database');
    req.models = database.initializeModels();
  }
  next();
});

// Récupérer les informations de la famille
router.get('/', async (req, res) => {
  try {
    if (!req.user || !req.user.familyId) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const { Family, User, Student, Subscription } = req.models;

    const family = await Family.findByPk(req.user.familyId, {
      include: [
        {
          model: User,
          as: 'members',
          attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'userType', 'isActive']
        },
        {
          model: Student,
          as: 'students',
          attributes: ['id', 'firstName', 'lastName', 'currentLevel', 'dateOfBirth', 'isActive']
        },
        {
          model: Subscription,
          as: 'subscription',
          attributes: ['type', 'status', 'startedAt', 'expiresAt', 'autoRenew']
        }
      ]
    });

    if (!family) {
      return res.status(404).json({
        success: false,
        message: 'Famille non trouvée'
      });
    }

    res.json({
      success: true,
      data: {
        family: family.toJSON()
      }
    });

  } catch (error) {
    logger.error('Erreur récupération famille:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des informations familiales'
    });
  }
});

module.exports = router;