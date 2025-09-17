/**
 * Routes pour la Progression - Claudyne Backend
 * Suivi des performances et progression étudiante
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

// Récupérer la progression globale de l'étudiant
router.get('/', async (req, res) => {
  try {
    if (!req.user || !req.user.studentProfile) {
      return res.status(401).json({
        success: false,
        message: 'Profil étudiant requis'
      });
    }

    const { Progress } = req.models;

    const overview = await Progress.getStudentOverview(req.user.studentProfile.id);

    res.json({
      success: true,
      data: overview
    });

  } catch (error) {
    logger.error('Erreur récupération progression:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la progression'
    });
  }
});

module.exports = router;