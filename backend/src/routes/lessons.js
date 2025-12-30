/**
 * Routes Lessons - Routes simplifiées sans subjectId
 * Permet d'accéder aux leçons directement par ID
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Middleware pour initialiser les modèles
router.use(async (req, res, next) => {
  if (!req.models) {
    const database = require('../config/database');
    req.models = database.initializeModels();
  }
  next();
});

/**
 * GET /api/lessons/:lessonId/quiz
 * Récupérer le quiz d'une leçon (sans besoin du subjectId)
 */
router.get('/:lessonId/quiz', async (req, res) => {
  try {
    const { Lesson, Subject, Progress } = req.models;
    const { lessonId } = req.params;

    // Récupérer la leçon avec son subject
    const lesson = await Lesson.findByPk(lessonId, {
      include: [{
        model: Subject,
        as: 'subject',
        attributes: ['id', 'code', 'title', 'icon']
      }]
    });

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Leçon non trouvée'
      });
    }

    if (!lesson.hasQuiz) {
      return res.status(404).json({
        success: false,
        message: 'Cette leçon n\'a pas de quiz'
      });
    }

    // Récupérer le progrès de l'étudiant si authentifié
    let progress = null;
    if (req.user && req.user.studentProfile) {
      progress = await Progress.findOne({
        where: {
          studentId: req.user.studentProfile.id,
          lessonId: lessonId
        }
      });
    }

    res.json({
      success: true,
      data: {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        subject: lesson.subject,
        quiz: lesson.quiz,
        progress: progress ? {
          status: progress.status,
          score: progress.score,
          completedAt: progress.completedAt
        } : null
      }
    });

  } catch (error) {
    logger.error('Erreur récupération quiz leçon:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du quiz'
    });
  }
});

/**
 * POST /api/lessons/:lessonId/complete
 * Marquer une leçon comme terminée (sans besoin du subjectId)
 */
router.post('/:lessonId/complete', async (req, res) => {
  try {
    const { Progress, Lesson } = req.models;
    const { lessonId } = req.params;
    const { timeSpent = 0, notes = null } = req.body;

    if (!req.user || !req.user.studentProfile) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    // Vérifier que la leçon existe
    const lesson = await Lesson.findByPk(lessonId);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Leçon non trouvée'
      });
    }

    const studentId = req.user.studentProfile.id;

    // Chercher ou créer le progrès
    let [progress, created] = await Progress.findOrCreate({
      where: {
        studentId: studentId,
        lessonId: lessonId
      },
      defaults: {
        status: 'completed',
        score: 100,
        timeSpent: timeSpent,
        notes: notes,
        completedAt: new Date()
      }
    });

    // Si le progrès existe déjà, le mettre à jour
    if (!created) {
      progress.status = 'completed';
      progress.completedAt = new Date();
      progress.timeSpent = (progress.timeSpent || 0) + timeSpent;
      if (notes) progress.notes = notes;
      await progress.save();
    }

    logger.info(`Leçon ${lessonId} marquée comme terminée`, {
      studentId,
      lessonId,
      timeSpent
    });

    res.json({
      success: true,
      message: 'Leçon marquée comme terminée',
      data: {
        progress: {
          id: progress.id,
          status: progress.status,
          score: progress.score,
          completedAt: progress.completedAt,
          timeSpent: progress.timeSpent
        }
      }
    });

  } catch (error) {
    logger.error('Erreur marquage leçon terminée:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du marquage de la leçon'
    });
  }
});

module.exports = router;
