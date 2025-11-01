/**
 * Routes pour Battle Royale - Claudyne Backend
 * Gestion des compétitions éducatives en temps réel
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

// Récupérer toutes les battles (endpoint principal)
router.get('/', async (req, res) => {
  try {
    const { Battle, Subject } = req.models;
    const {
      status = 'all',
      region,
      level,
      type = 'all',
      page = 1,
      limit = 20
    } = req.query;

    const where = {};

    // Filtrage par statut
    if (status !== 'all') {
      where.status = status.toUpperCase();
    }

    // Filtrage par région
    if (region) {
      where.region = region;
    }

    // Filtrage par niveau éducatif
    if (level) {
      where.educationLevel = level;
    }

    // Filtrage par type
    if (type !== 'all') {
      where.type = type.toUpperCase();
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: battles } = await Battle.findAndCountAll({
      where,
      include: [
        {
          model: Subject,
          as: 'subject',
          attributes: ['id', 'name', 'title', 'icon', 'level']
        }
      ],
      order: [['scheduledAt', 'ASC'], ['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      success: true,
      data: {
        battles: battles.map(battle => battle.toJSON()),
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Erreur récupération battles:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des battles'
    });
  }
});

// Récupérer les battles à venir
router.get('/upcoming', async (req, res) => {
  try {
    const { Battle } = req.models;
    const { region, level, limit = 10 } = req.query;

    const battles = await Battle.getUpcoming(region, level, parseInt(limit));

    res.json({
      success: true,
      data: {
        battles: battles.map(battle => battle.toJSON())
      }
    });

  } catch (error) {
    logger.error('Erreur récupération battles:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des battles'
    });
  }
});

// Récupérer les battles actives
router.get('/active', async (req, res) => {
  try {
    const { Battle } = req.models;

    const battles = await Battle.getActive();

    res.json({
      success: true,
      data: {
        battles: battles.map(battle => battle.toJSON())
      }
    });

  } catch (error) {
    logger.error('Erreur récupération battles actives:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des battles actives'
    });
  }
});

module.exports = router;