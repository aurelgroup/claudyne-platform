/**
 * Routes Bien-être (Wellness) - Claudyne Backend
 * Suivi bien-être, exercices de relaxation, pauses intelligentes
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { Op } = require('sequelize');

router.use(async (req, res, next) => {
  if (!req.models) {
    const database = require('../config/database');
    req.models = database.initializeModels();
  }
  next();
});

const RELAXATION_EXERCISES = [
  {
    id: 'meditation',
    name: 'Méditation Guidée',
    icon: '🧘',
    duration: '5-15 minutes',
    description: 'Méditation guidée pour réduire le stress et améliorer la concentration',
    type: 'meditation'
  },
  {
    id: 'breathing',
    name: 'Respiration 4-7-8',
    icon: '🫁',
    duration: '3 minutes',
    description: 'Technique de respiration pour calmer l\'anxiété rapidement',
    type: 'breathing'
  },
  {
    id: 'nature-sounds',
    name: 'Sons de la Nature',
    icon: '🎵',
    duration: 'Ambiance',
    description: 'Sons apaisants de la nature pour favoriser la détente',
    type: 'ambient'
  },
  {
    id: 'stretching',
    name: 'Étirements Doux',
    icon: '🤸',
    duration: '5 minutes',
    description: 'Exercices d\'étirement pour relâcher les tensions musculaires',
    type: 'physical'
  }
];

/**
 * GET /api/wellness/metrics
 * Métriques de bien-être de l'étudiant
 */
router.get('/metrics', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const { Progress, Student } = req.models;

    // Get student ID
    let studentId = null;
    if (req.user.studentProfile) {
      studentId = req.user.studentProfile.id;
    } else if (req.user.userType === 'MANAGER' && req.user.familyId) {
      const student = await Student.findOne({
        where: { familyId: req.user.familyId }
      });
      if (student) studentId = student.id;
    } else {
      // Pour les étudiants individuels, chercher par userId
      const student = await Student.findOne({
        where: { userId: req.user.id }
      });
      if (student) studentId = student.id;
    }

    // Calculate wellness metrics based on recent activity
    let stressLevel = 25; // Default low stress
    let energyLevel = 78; // Default high energy
    let focusCapacity = 67; // Default good focus
    let wellnessScore = 85; // Default good wellness

    if (studentId) {
      // Analyze recent study patterns to estimate stress
      const recentProgress = await Progress.findAll({
        where: {
          studentId,
          createdAt: {
            [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        order: [['createdAt', 'DESC']],
        limit: 50
      });

      if (recentProgress.length > 0) {
        // Calculate average score (poor scores = higher stress)
        const avgScore = recentProgress.reduce((sum, p) => sum + (p.score || 0), 0) / recentProgress.length;
        stressLevel = Math.max(10, Math.min(90, 100 - avgScore));

        // Calculate study intensity (more sessions = lower energy)
        const sessionsPerDay = recentProgress.length / 7;
        energyLevel = Math.max(20, Math.min(95, 100 - (sessionsPerDay * 8)));

        // Calculate focus (consistent scores = better focus)
        const scoreVariance = recentProgress.reduce((sum, p, i, arr) => {
          if (i === 0) return 0;
          return sum + Math.abs((p.score || 0) - (arr[i - 1].score || 0));
        }, 0) / (recentProgress.length - 1 || 1);
        focusCapacity = Math.max(30, Math.min(95, 100 - scoreVariance));

        // Overall wellness score
        wellnessScore = Math.round(
          (100 - stressLevel) * 0.4 +
          energyLevel * 0.3 +
          focusCapacity * 0.3
        );
      }
    }

    // Generate recommendations based on metrics
    const recommendations = [];
    if (stressLevel > 50) {
      recommendations.push('🧘 Prendre une pause de 10 min toutes les heures');
    }
    if (energyLevel < 50) {
      recommendations.push('💧 Boire 2 verres d\'eau dans les 2h');
      recommendations.push('☕ Éviter la caféine, privilégier l\'eau et les fruits');
    }
    if (focusCapacity < 60) {
      recommendations.push('🚶 Faire une courte marche après cette session');
      recommendations.push('📵 Réduire les distractions (notifications, téléphone)');
    }
    if (recommendations.length === 0) {
      recommendations.push('✨ Excellent équilibre ! Continuez comme ça');
      recommendations.push('🎯 Maintenir ce rythme de travail');
    }

    res.json({
      success: true,
      data: {
        wellnessScore: Math.round(wellnessScore),
        metrics: {
          stress: {
            level: Math.round(stressLevel),
            label: stressLevel < 30 ? 'Faible' : stressLevel < 60 ? 'Modéré' : 'Élevé',
            status: stressLevel < 30 ? 'low' : stressLevel < 60 ? 'medium' : 'high'
          },
          energy: {
            level: Math.round(energyLevel),
            label: energyLevel > 70 ? 'Élevé' : energyLevel > 40 ? 'Bon' : 'Faible',
            status: energyLevel > 70 ? 'high' : energyLevel > 40 ? 'medium' : 'low'
          },
          focus: {
            level: Math.round(focusCapacity),
            label: focusCapacity > 70 ? 'Excellente' : focusCapacity > 50 ? 'Bonne' : 'À améliorer',
            status: focusCapacity > 70 ? 'high' : focusCapacity > 50 ? 'medium' : 'low'
          }
        },
        recommendations
      }
    });

  } catch (error) {
    logger.error('Erreur récupération métriques bien-être:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des métriques'
    });
  }
});

/**
 * GET /api/wellness/exercises
 * Exercices de relaxation disponibles
 */
router.get('/exercises', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    res.json({
      success: true,
      data: {
        exercises: RELAXATION_EXERCISES
      }
    });

  } catch (error) {
    logger.error('Erreur récupération exercices:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des exercices'
    });
  }
});

/**
 * GET /api/wellness/breaks
 * Planning des pauses intelligentes
 */
router.get('/breaks', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    // Generate smart break schedule for the day
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const breaks = [];

    // Morning hydration break
    if (currentHour < 10 || (currentHour === 10 && currentMinute < 30)) {
      breaks.push({
        time: '09:30',
        type: 'Pause hydratation',
        status: currentHour >= 9 && currentHour < 10 ? 'completed' : 'pending',
        statusLabel: currentHour >= 9 && currentHour < 10 ? '✅ Effectuée' : '⏰ Planifiée'
      });
    }

    // Mid-morning stretching break
    breaks.push({
      time: '11:15',
      type: 'Pause étirements',
      status: currentHour === 11 && currentMinute >= 15 ? 'current' :
              currentHour > 11 ? 'completed' : 'pending',
      statusLabel: currentHour === 11 && currentMinute >= 15 ? '🔔 Prochaine' :
                   currentHour > 11 ? '✅ Effectuée' : '⏰ Planifiée'
    });

    // Lunch break
    breaks.push({
      time: '13:00',
      type: 'Pause déjeuner',
      status: currentHour >= 13 && currentHour < 14 ? 'current' :
              currentHour >= 14 ? 'completed' : 'pending',
      statusLabel: currentHour >= 13 && currentHour < 14 ? '🔔 Prochaine' :
                   currentHour >= 14 ? '✅ Effectuée' : '⏰ Planifiée'
    });

    // Afternoon relaxation break
    if (currentHour < 16) {
      breaks.push({
        time: '15:30',
        type: 'Pause relaxation',
        status: currentHour === 15 && currentMinute >= 30 ? 'current' :
                currentHour > 15 ? 'completed' : 'pending',
        statusLabel: currentHour === 15 && currentMinute >= 30 ? '🔔 Prochaine' :
                     currentHour > 15 ? '✅ Effectuée' : '⏰ Planifiée'
      });
    }

    // Find next break
    let nextBreakMinutes = null;
    const currentBreak = breaks.find(b => b.status === 'current');
    if (!currentBreak) {
      const nextBreak = breaks.find(b => b.status === 'pending');
      if (nextBreak) {
        const [hour, minute] = nextBreak.time.split(':').map(Number);
        const breakTime = new Date();
        breakTime.setHours(hour, minute, 0, 0);
        nextBreakMinutes = Math.round((breakTime - now) / (1000 * 60));
      }
    }

    res.json({
      success: true,
      data: {
        breaks,
        nextBreak: nextBreakMinutes !== null ? `${nextBreakMinutes} min` : 'Aucune pause programmée'
      }
    });

  } catch (error) {
    logger.error('Erreur récupération pauses:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des pauses'
    });
  }
});

/**
 * POST /api/wellness/break/take
 * Démarrer une pause maintenant
 */
router.post('/break/take', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    // Log the break (could store in database for analytics)
    logger.info('Break taken', {
      userId: req.user.id,
      timestamp: new Date()
    });

    res.json({
      success: true,
      data: {
        message: 'Pause démarrée avec succès',
        duration: 5, // 5 minutes
        tips: [
          'Éloignez-vous de l\'écran',
          'Faites quelques étirements',
          'Respirez profondément'
        ]
      }
    });

  } catch (error) {
    logger.error('Erreur démarrage pause:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du démarrage de la pause'
    });
  }
});

module.exports = router;
