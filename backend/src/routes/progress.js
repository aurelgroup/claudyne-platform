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
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const { Progress, Student } = req.models;

    // Get student ID with fallback logic
    let studentId = null;
    if (req.user.studentProfile) {
      studentId = req.user.studentProfile.id;
    } else if (req.user.userType === 'MANAGER' && req.user.familyId) {
      const student = await Student.findOne({
        where: { familyId: req.user.familyId }
      });
      if (student) studentId = student.id;
    } else {
      // For individual students, search by userId
      const student = await Student.findOne({
        where: { userId: req.user.id }
      });
      if (student) studentId = student.id;
    }

    if (!studentId) {
      // Return empty progress data instead of 404
      return res.json({
        success: true,
        data: {
          totalLessons: 0,
          completedLessons: 0,
          progressPercentage: 0,
          subjects: [],
          recentActivity: [],
          stats: {
            totalXP: 0,
            streak: 0,
            level: 1
          }
        }
      });
    }

    const overview = await Progress.getStudentOverview(studentId);

    res.json({
      success: true,
      data: overview || {
        totalLessons: 0,
        completedLessons: 0,
        progressPercentage: 0,
        subjects: [],
        recentActivity: [],
        stats: {
          totalXP: 0,
          streak: 0,
          level: 1
        }
      }
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