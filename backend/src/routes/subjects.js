/**
 * Routes pour les Matières/Subjects - Claudyne Backend
 * Gestion des matières scolaires et contenus pédagogiques
 */

const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// Import des modèles (seront disponibles via req.models)
router.use(async (req, res, next) => {
  if (!req.models) {
    const database = require('../config/database');
    req.models = database.initializeModels();
  }
  next();
});

// ===============================
// RÉCUPÉRER TOUTES LES MATIÈRES
// ===============================

router.get('/', async (req, res) => {
  try {
    const { Subject, Lesson } = req.models;
    const { level, category, isPremium, includeFree } = req.query;

    // Construire les conditions de filtrage
    const where = { isActive: true };

    if (level) where.level = level;
    if (category) where.category = category;
    if (isPremium !== undefined) where.isPremium = isPremium === 'true';

    // Si l'utilisateur n'a pas d'abonnement premium, inclure seulement les matières gratuites
    if (includeFree === 'true') {
      where.isPremium = false;
    }

    const subjects = await Subject.findAll({
      where,
      include: [
        {
          model: Lesson,
          as: 'lessons',
          where: { isActive: true, reviewStatus: 'approved' },
          required: false,
          attributes: ['id', 'title', 'type', 'difficulty', 'estimatedDuration', 'hasQuiz', 'isPremium', 'isFree']
        }
      ],
      order: [['order', 'ASC'], ['title', 'ASC']]
    });

    // Formater les données pour l'interface
    const formattedSubjects = subjects.map(subject => {
      const lessons = subject.lessons || [];
      const freeLessons = lessons.filter(lesson => lesson.isFree);
      const premiumLessons = lessons.filter(lesson => lesson.isPremium);

      return {
        id: subject.id,
        title: subject.title,
        description: subject.description,
        level: subject.level,
        category: subject.category,
        icon: subject.icon,
        color: subject.color,
        difficulty: subject.difficulty,
        estimatedDuration: subject.estimatedDuration,
        isPremium: subject.isPremium,
        lessons: lessons.length,
        freeLessons: freeLessons.length,
        premiumLessons: premiumLessons.length,
        quizzes: lessons.filter(lesson => lesson.hasQuiz).length,
        progress: 0, // À calculer selon l'utilisateur
        prerequisites: subject.prerequisites,
        stats: subject.stats
      };
    });

    res.json({
      success: true,
      data: {
        subjects: formattedSubjects
      }
    });

  } catch (error) {
    logger.error('Erreur récupération matières:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des matières'
    });
  }
});

// ===============================
// RÉCUPÉRER UNE MATIÈRE SPÉCIFIQUE
// ===============================

router.get('/:subjectId', async (req, res) => {
  try {
    const { Subject, Lesson, Progress } = req.models;
    const { subjectId } = req.params;

    const subject = await Subject.findByPk(subjectId, {
      include: [
        {
          model: Lesson,
          as: 'lessons',
          where: { isActive: true, reviewStatus: 'approved' },
          required: false,
          order: [['order', 'ASC']]
        }
      ]
    });

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Matière non trouvée'
      });
    }

    // Si l'utilisateur est authentifié, récupérer sa progression
    let userProgress = {};
    if (req.user && req.user.studentProfile) {
      const progress = await Progress.findAll({
        where: {
          studentId: req.user.studentProfile.id
        },
        include: [
          {
            model: Lesson,
            as: 'lesson',
            where: { subjectId },
            required: true
          }
        ]
      });

      userProgress = progress.reduce((acc, prog) => {
        acc[prog.lessonId] = {
          status: prog.status,
          completionPercentage: prog.completionPercentage,
          lastScore: prog.lastScore,
          timeSpent: prog.timeSpent
        };
        return acc;
      }, {});
    }

    // Formater les leçons avec la progression
    const formattedLessons = subject.lessons.map(lesson => ({
      ...lesson.toJSON(),
      progress: userProgress[lesson.id] || null,
      canAccess: lesson.canAccess(req.user, req.userSubscription)
    }));

    res.json({
      success: true,
      data: {
        subject: {
          ...subject.toJSON(),
          lessons: formattedLessons
        }
      }
    });

  } catch (error) {
    logger.error('Erreur récupération matière:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la matière'
    });
  }
});

// ===============================
// RÉCUPÉRER LES LEÇONS D'UNE MATIÈRE
// ===============================

router.get('/:subjectId/lessons', async (req, res) => {
  try {
    const { Lesson, Progress } = req.models;
    const { subjectId } = req.params;
    const { type, difficulty, hasQuiz } = req.query;

    // Construire les conditions de filtrage
    const where = {
      subjectId,
      isActive: true,
      reviewStatus: 'approved'
    };

    if (type) where.type = type;
    if (difficulty) where.difficulty = difficulty;
    if (hasQuiz !== undefined) where.hasQuiz = hasQuiz === 'true';

    const lessons = await Lesson.findAll({
      where,
      order: [['order', 'ASC']]
    });

    // Récupérer la progression de l'utilisateur si authentifié
    let userProgress = {};
    if (req.user && req.user.studentProfile) {
      const progress = await Progress.findAll({
        where: {
          studentId: req.user.studentProfile.id,
          lessonId: { [Op.in]: lessons.map(l => l.id) }
        }
      });

      userProgress = progress.reduce((acc, prog) => {
        acc[prog.lessonId] = prog;
        return acc;
      }, {});
    }

    // Formater les données avec accès et progression
    const formattedLessons = lessons.map(lesson => {
      const progress = userProgress[lesson.id];

      return {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        order: lesson.order,
        type: lesson.type,
        difficulty: lesson.difficulty,
        estimatedDuration: lesson.estimatedDuration,
        objectives: lesson.objectives,
        prerequisites: lesson.prerequisites,
        hasQuiz: lesson.hasQuiz,
        isPremium: lesson.isPremium,
        isFree: lesson.isFree,
        stats: lesson.stats,
        publishedAt: lesson.publishedAt,
        progress: progress ? {
          status: progress.status,
          completionPercentage: progress.completionPercentage,
          timeSpent: progress.timeSpent,
          lastScore: progress.lastScore,
          attempts: progress.attempts
        } : null,
        canAccess: lesson.canAccess(req.user, req.userSubscription),
        isLocked: !lesson.canAccess(req.user, req.userSubscription)
      };
    });

    res.json({
      success: true,
      data: {
        lessons: formattedLessons
      }
    });

  } catch (error) {
    logger.error('Erreur récupération leçons:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des leçons'
    });
  }
});

// ===============================
// RÉCUPÉRER LE CONTENU D'UNE LEÇON
// ===============================

router.get('/:subjectId/lessons/:lessonId', async (req, res) => {
  try {
    const { Lesson, Progress } = req.models;
    const { lessonId } = req.params;

    const lesson = await Lesson.findByPk(lessonId);

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Leçon non trouvée'
      });
    }

    // Vérifier l'accès (bypass pour les admins)
    const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'super_admin');
    if (!isAdmin && !lesson.canAccess(req.user, req.userSubscription)) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à cette leçon',
        requiresSubscription: lesson.isPremium,
        subscriptionType: lesson.isPremium ? 'premium' : 'basic'
      });
    }

    // Récupérer ou créer la progression
    let progress = null;
    if (req.user && req.user.studentProfile) {
      [progress] = await Progress.findOrCreate({
        where: {
          studentId: req.user.studentProfile.id,
          lessonId: lesson.id
        },
        defaults: {
          status: 'not_started',
          completionPercentage: 0,
          timeSpent: 0,
          attempts: 0
        }
      });

      // Marquer comme "en cours" si première visite
      if (progress.status === 'not_started') {
        await progress.startLesson();
      }

      // Mettre à jour les statistiques de la leçon
      await lesson.updateStats('view');
    }

    // Retourner le contenu complet
    const fullContent = lesson.getFullContent();

    res.json({
      success: true,
      data: {
        lesson: {
          ...fullContent,
          progress: progress ? progress.toJSON() : null
        }
      }
    });

  } catch (error) {
    logger.error('Erreur récupération contenu leçon:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du contenu'
    });
  }
});

// ===============================
// RÉCUPÉRER LE QUIZ D'UNE LEÇON
// ===============================

router.get('/:subjectId/lessons/:lessonId/quiz', async (req, res) => {
  try {
    const { Lesson, Progress } = req.models;
    const { lessonId } = req.params;

    const lesson = await Lesson.findByPk(lessonId);

    if (!lesson || !lesson.hasQuiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz non trouvé pour cette leçon'
      });
    }

    // Vérifier l'accès
    if (!lesson.canAccess(req.user, req.userSubscription)) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à ce quiz'
      });
    }

    // Récupérer la progression pour voir les tentatives précédentes
    let progress = null;
    if (req.user && req.user.studentProfile) {
      progress = await Progress.findOne({
        where: {
          studentId: req.user.studentProfile.id,
          lessonId: lesson.id
        }
      });
    }

    // Préparer le quiz (masquer les bonnes réponses)
    const quiz = { ...lesson.quiz };
    if (quiz.questions) {
      quiz.questions = quiz.questions.map(q => ({
        id: q.id,
        type: q.type,
        question: q.question,
        options: q.options,
        points: q.points,
        explanation: null // Masqué jusqu'à la soumission
      }));
    }

    res.json({
      success: true,
      data: {
        quiz: {
          id: lesson.id,
          lessonId: lesson.id,
          title: quiz.title || `Quiz: ${lesson.title}`,
          questions: quiz.questions,
          totalPoints: quiz.totalPoints,
          passingScore: quiz.passingScore,
          timeLimit: quiz.timeLimit,
          attempts: progress ? progress.attempts : 0,
          maxAttempts: quiz.maxAttempts || null,
          bestScore: progress ? progress.bestScore : null
        }
      }
    });

  } catch (error) {
    logger.error('Erreur récupération quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du quiz'
    });
  }
});

// ===============================
// SOUMETTRE LES RÉPONSES D'UN QUIZ
// ===============================

router.post('/:subjectId/lessons/:lessonId/quiz', async (req, res) => {
  try {
    const { Lesson, Progress } = req.models;
    const { lessonId } = req.params;
    const { answers, timeSpent = 0 } = req.body;

    if (!req.user || !req.user.studentProfile) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const lesson = await Lesson.findByPk(lessonId);

    if (!lesson || !lesson.hasQuiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz non trouvé'
      });
    }

    // Vérifier l'accès
    if (!lesson.canAccess(req.user, req.userSubscription)) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Récupérer la progression
    let progress = await Progress.findOne({
      where: {
        studentId: req.user.studentProfile.id,
        lessonId: lesson.id
      }
    });

    if (!progress) {
      progress = await Progress.create({
        studentId: req.user.studentProfile.id,
        lessonId: lesson.id,
        status: 'in_progress'
      });
    }

    // Corriger le quiz
    const quiz = lesson.quiz;
    let totalScore = 0;
    let totalPossible = 0;
    const corrections = [];

    quiz.questions.forEach(question => {
      const userAnswer = answers[question.id];
      const isCorrect = userAnswer === question.correctAnswer ||
                       (Array.isArray(question.correctAnswer) &&
                        question.correctAnswer.includes(userAnswer));

      if (isCorrect) {
        totalScore += question.points;
      }
      totalPossible += question.points;

      corrections.push({
        questionId: question.id,
        correct: isCorrect,
        userAnswer,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation || '',
        points: isCorrect ? question.points : 0,
        maxPoints: question.points
      });
    });

    const percentage = Math.round((totalScore / totalPossible) * 100);
    const passed = percentage >= (quiz.passingScore || 60);

    // Calculer les points Claudine
    const basePoints = Math.floor(totalScore * 0.5);
    const speedBonus = timeSpent < lesson.estimatedDuration ? 5 : 0;
    const perfectionBonus = percentage === 100 ? 10 : 0;
    const claudinePoints = basePoints + speedBonus + perfectionBonus;

    // Enregistrer la tentative
    await progress.recordQuizAttempt({
      score: percentage,
      answers,
      timeSpent,
      feedback: corrections
    });

    res.json({
      success: true,
      data: {
        score: totalScore,
        totalScore: totalPossible,
        percentage: percentage,
        passed: passed,
        claudinePointsEarned: claudinePoints,
        feedback: passed ?
          'Félicitations ! Vous maîtrisez bien cette leçon ! 🎉' :
          'Continuez vos efforts, vous progressez ! 💪',
        corrections: corrections,
        attempts: progress.attempts,
        bestScore: progress.bestScore,
        recommendations: passed ?
          ['Passer à la leçon suivante', 'Aider d\'autres étudiants'] :
          ['Revoir les concepts difficiles', 'Refaire les exercices']
      }
    });

  } catch (error) {
    logger.error('Erreur soumission quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la soumission du quiz'
    });
  }
});

// ===============================
// MARQUER UNE LEÇON COMME TERMINÉE
// ===============================

router.post('/:subjectId/lessons/:lessonId/complete', async (req, res) => {
  try {
    const { Progress } = req.models;
    const { lessonId } = req.params;
    const { timeSpent = 0, notes = null } = req.body;

    if (!req.user || !req.user.studentProfile) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const progress = await Progress.findOne({
      where: {
        studentId: req.user.studentProfile.id,
        lessonId: parseInt(lessonId)
      }
    });

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Progression non trouvée'
      });
    }

    // Mettre à jour la progression
    await progress.updateProgress({
      completionPercentage: 100,
      timeSpent,
      notes: notes ? [notes] : []
    });

    // Récupérer la leçon suivante
    const nextLesson = await req.models.Lesson.findOne({
      where: {
        subjectId: progress.lesson?.subjectId,
        order: { [Op.gt]: progress.lesson?.order || 0 },
        isActive: true,
        reviewStatus: 'approved'
      },
      order: [['order', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        lessonCompleted: true,
        claudinePointsEarned: progress.claudinePointsEarned,
        totalClaudinePoints: progress.claudinePointsEarned, // À récupérer du profil étudiant
        progressUpdated: true,
        nextLesson: nextLesson ? {
          id: nextLesson.id,
          title: nextLesson.title,
          type: nextLesson.type,
          estimatedDuration: nextLesson.estimatedDuration
        } : null
      }
    });

  } catch (error) {
    logger.error('Erreur complétion leçon:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la complétion de la leçon'
    });
  }
});

// ===============================
// RECHERCHE DANS LES MATIÈRES
// ===============================

router.get('/search', async (req, res) => {
  try {
    const { Subject, Lesson } = req.models;
    const { q: query, level, category, type, limit = 20 } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'La recherche doit contenir au moins 2 caractères'
      });
    }

    // Recherche dans les matières
    const subjects = await Subject.search(query, {
      level,
      category,
      limit: Math.floor(limit / 2)
    });

    // Recherche dans les leçons
    const lessons = await Lesson.search(query, {
      level,
      type,
      difficulty: category,
      limit: Math.floor(limit / 2)
    });

    res.json({
      success: true,
      data: {
        subjects: subjects.map(s => ({
          type: 'subject',
          ...s.toJSON()
        })),
        lessons: lessons.map(l => ({
          type: 'lesson',
          ...l.toJSON()
        })),
        total: subjects.length + lessons.length
      }
    });

  } catch (error) {
    logger.error('Erreur recherche:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche'
    });
  }
});

module.exports = router;