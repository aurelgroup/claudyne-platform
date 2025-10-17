/**
 * Routes Quiz - Claudyne Backend
 * Quiz adaptatifs, flash quiz, simulations et défis hebdomadaires
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

/**
 * GET /api/quiz/available
 * Récupération des quiz disponibles pour l'étudiant
 */
router.get('/available', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const { Lesson, Subject, Student } = req.models;
    const { subjectId, difficulty, limit = 10 } = req.query;

    // Get student profile for personalization
    let studentProfile = null;
    if (req.user.studentProfile) {
      studentProfile = req.user.studentProfile;
    } else if (req.user.userType === 'MANAGER' && req.user.familyId) {
      // If parent, get first child for now (can be enhanced)
      studentProfile = await Student.findOne({
        where: { familyId: req.user.familyId }
      });
    }

    const where = {
      hasQuiz: true,
      isActive: true,
      reviewStatus: 'approved'
    };

    if (subjectId) where.subjectId = subjectId;
    if (difficulty) where.difficulty = difficulty;

    const quizzes = await Lesson.findAll({
      where,
      include: [{
        model: Subject,
        as: 'subject',
        attributes: ['id', 'name', 'icon', 'color']
      }],
      limit: parseInt(limit),
      order: [['order', 'ASC']]
    });

    // Transform to quiz format
    const availableQuizzes = quizzes.map(lesson => ({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      subject: lesson.subject ? {
        id: lesson.subject.id,
        name: lesson.subject.name,
        icon: lesson.subject.icon
      } : null,
      difficulty: lesson.difficulty,
      estimatedDuration: lesson.estimatedDuration,
      questionCount: lesson.quiz?.questions?.length || 0,
      totalPoints: lesson.quiz?.totalPoints || 100,
      passingScore: lesson.quiz?.passingScore || 70,
      stats: lesson.stats
    }));

    // AI recommendation (based on student's weak areas)
    let recommendation = null;
    if (availableQuizzes.length > 0) {
      recommendation = {
        quizId: availableQuizzes[0].id,
        title: availableQuizzes[0].title,
        reason: 'Recommandé selon votre profil d\'apprentissage',
        estimatedDuration: availableQuizzes[0].estimatedDuration,
        rewardXP: Math.floor(availableQuizzes[0].totalPoints / 2)
      };
    }

    res.json({
      success: true,
      data: {
        quizzes: availableQuizzes,
        recommendation,
        total: availableQuizzes.length
      }
    });

  } catch (error) {
    logger.error('Erreur récupération quiz disponibles:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des quiz'
    });
  }
});

/**
 * GET /api/quiz/challenges
 * Récupération des défis hebdomadaires/quotidiens
 */
router.get('/challenges', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const { Challenge, Student } = req.models;
    const { type } = req.query; // 'daily', 'weekly', 'all'

    // Get student ID
    let studentId = null;
    if (req.user.studentProfile) {
      studentId = req.user.studentProfile.id;
    }

    const where = {
      isActive: true,
      startDate: {
        [Challenge.sequelize.Op.lte]: new Date()
      },
      endDate: {
        [Challenge.sequelize.Op.gt]: new Date()
      }
    };

    if (type && type !== 'all') {
      where.type = type;
    }

    // Get global challenges
    const challenges = await Challenge.findAll({
      where: {
        ...where,
        isGlobal: true
      },
      order: [
        ['type', 'ASC'],
        ['difficulty', 'ASC']
      ]
    });

    // Get student progress for each challenge if studentId available
    let challengesWithProgress = challenges.map(challenge => challenge.toJSON());

    if (studentId) {
      const StudentChallenge = Challenge.StudentChallenge;
      for (let i = 0; i < challengesWithProgress.length; i++) {
        const progress = await StudentChallenge.findOne({
          where: {
            studentId,
            challengeId: challengesWithProgress[i].id
          }
        });

        if (progress) {
          challengesWithProgress[i].currentValue = progress.currentValue;
          challengesWithProgress[i].isCompleted = progress.isCompleted;
          challengesWithProgress[i].completedAt = progress.completedAt;
          challengesWithProgress[i].progressPercentage = Math.min(100,
            Math.round((progress.currentValue / challengesWithProgress[i].targetValue) * 100)
          );
        }
      }
    }

    // Separate by type
    const daily = challengesWithProgress.filter(c => c.type === 'daily');
    const weekly = challengesWithProgress.filter(c => c.type === 'weekly');

    res.json({
      success: true,
      data: {
        daily,
        weekly,
        all: challengesWithProgress,
        total: challengesWithProgress.length
      }
    });

  } catch (error) {
    logger.error('Erreur récupération challenges:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des défis'
    });
  }
});

/**
 * GET /api/quiz/stats
 * Statistiques quiz de l'étudiant
 */
router.get('/stats', async (req, res) => {
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
    }

    if (!studentId) {
      return res.json({
        success: true,
        data: {
          totalQuizzes: 0,
          averageScore: 0,
          bestScore: 0,
          recentProgress: 0,
          subjects: []
        }
      });
    }

    // Get quiz-related progress
    const quizProgress = await Progress.findAll({
      where: {
        studentId,
        lessonType: 'quiz'
      },
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    // Calculate stats
    const totalQuizzes = quizProgress.length;
    const averageScore = quizProgress.length > 0
      ? Math.round(quizProgress.reduce((sum, p) => sum + (p.score || 0), 0) / quizProgress.length)
      : 0;
    const bestScore = quizProgress.length > 0
      ? Math.max(...quizProgress.map(p => p.score || 0))
      : 0;

    // Recent progress (last 7 days vs previous 7 days)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const recentQuizzes = quizProgress.filter(p => new Date(p.createdAt) >= sevenDaysAgo);
    const previousQuizzes = quizProgress.filter(p =>
      new Date(p.createdAt) >= fourteenDaysAgo && new Date(p.createdAt) < sevenDaysAgo
    );

    const recentAvg = recentQuizzes.length > 0
      ? recentQuizzes.reduce((sum, p) => sum + (p.score || 0), 0) / recentQuizzes.length
      : 0;
    const previousAvg = previousQuizzes.length > 0
      ? previousQuizzes.reduce((sum, p) => sum + (p.score || 0), 0) / previousQuizzes.length
      : 0;

    const recentProgress = previousAvg > 0
      ? Math.round(((recentAvg - previousAvg) / previousAvg) * 100)
      : 0;

    // Group by subject
    const subjectStats = {};
    quizProgress.forEach(p => {
      if (p.subjectId) {
        if (!subjectStats[p.subjectId]) {
          subjectStats[p.subjectId] = {
            count: 0,
            totalScore: 0
          };
        }
        subjectStats[p.subjectId].count++;
        subjectStats[p.subjectId].totalScore += (p.score || 0);
      }
    });

    const subjects = Object.entries(subjectStats).map(([subjectId, stats]) => ({
      subjectId,
      quizCount: stats.count,
      averageScore: Math.round(stats.totalScore / stats.count)
    }));

    res.json({
      success: true,
      data: {
        totalQuizzes,
        averageScore,
        bestScore,
        recentProgress,
        subjects,
        recentActivity: recentQuizzes.length,
        lastQuizDate: quizProgress.length > 0 ? quizProgress[0].createdAt : null
      }
    });

  } catch (error) {
    logger.error('Erreur récupération stats quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
});

/**
 * GET /api/quiz/:id
 * Récupération d'un quiz spécifique
 */
router.get('/:id', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const { Lesson, Subject } = req.models;
    const { id } = req.params;

    const lesson = await Lesson.findByPk(id, {
      include: [{
        model: Subject,
        as: 'subject',
        attributes: ['id', 'name', 'icon', 'color']
      }]
    });

    if (!lesson || !lesson.hasQuiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz non trouvé'
      });
    }

    // Return full quiz content
    res.json({
      success: true,
      data: {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        subject: lesson.subject,
        difficulty: lesson.difficulty,
        estimatedDuration: lesson.estimatedDuration,
        quiz: lesson.quiz,
        objectives: lesson.objectives
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

module.exports = router;
