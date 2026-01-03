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

    // Get student info for education level
    const { Subject, Lesson } = req.models;
    const student = await Student.findByPk(studentId);

    // Mapping niveau Student -> niveau Subject
    const LEVEL_MAPPING = {
      'MATERNELLE_PETITE': 'Maternelle',
      'MATERNELLE_MOYENNE': 'Maternelle',
      'MATERNELLE_GRANDE': 'Maternelle',
      'SIL': 'SIL',
      'CP': 'CP',
      'CE1': 'CE1',
      'CE2': 'CE2',
      'CM1': 'CM1',
      'CM2': 'CM2',
      '6EME': '6ème',
      '5EME': '5ème',
      '4EME': '4ème',
      '3EME': '3ème',
      'SECONDE': '2nde',
      '2NDE': '2nde',
      '1ERE': '1ère',
      'TLE': 'Tle',
      'PREMIERE': '1ère',
      'TERMINALE': 'Tle'
    };

    const subjectLevel = LEVEL_MAPPING[student?.educationLevel] || student?.educationLevel || 'Tle';

    // Get all subjects with lessons for student's education level
    const subjects = await Subject.findAll({
      where: {
        isActive: true,
        level: subjectLevel
      },
      include: [{
        model: Lesson,
        as: 'lessons',
        where: {
          isActive: true,
          reviewStatus: 'approved'
        },
        required: false,
        attributes: ['id', 'title', 'description', 'type', 'estimatedDuration', 'hasQuiz', 'isPremium', 'order', 'content', 'objectives']
      }],
      order: [['order', 'ASC'], ['title', 'ASC']]
    });

    // Get student's progress
    const progressData = await Progress.findAll({
      where: { studentId }
    });

    // Map progress to lessons
    const progressMap = {};
    progressData.forEach(p => {
      progressMap[p.lessonId] = {
        status: p.status,
        completionPercentage: p.completionPercentage,
        lastScore: p.lastScore,
        timeSpent: p.timeSpent
      };
    });

    // Format response with subjects and their lessons
    const formattedSubjects = subjects.map(subject => {
      const lessons = subject.lessons || [];
      const completedLessons = lessons.filter(l => progressMap[l.id]?.status === 'completed').length;

      return {
        id: subject.id,
        title: subject.title,
        description: subject.description,
        icon: subject.icon,
        color: subject.color,
        level: subject.level,
        category: subject.category,
        lessons: lessons.map(lesson => ({
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          type: lesson.type,
          estimatedDuration: lesson.estimatedDuration,
          hasQuiz: lesson.hasQuiz,
          isPremium: lesson.isPremium,
          content: lesson.content,
          objectives: lesson.objectives,
          progress: progressMap[lesson.id] || {
            status: 'not_started',
            completionPercentage: 0,
            lastScore: null,
            timeSpent: 0
          }
        })),
        progress: {
          total: lessons.length,
          completed: completedLessons,
          percentage: lessons.length > 0 ? Math.round((completedLessons / lessons.length) * 100) : 0
        }
      };
    });

    res.json({
      success: true,
      data: {
        subjects: formattedSubjects,
        totalLessons: formattedSubjects.reduce((sum, s) => sum + s.lessons.length, 0),
        completedLessons: formattedSubjects.reduce((sum, s) => sum + s.progress.completed, 0),
        stats: {
          totalXP: progressData.reduce((sum, p) => sum + (p.claudinePointsEarned || 0), 0),
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