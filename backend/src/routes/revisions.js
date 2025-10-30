/**
 * Routes Révisions IA - Claudyne Backend
 * Planning intelligent, fiches de révision, sessions actives
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

/**
 * GET /api/revisions/planning
 * Planning de révisions intelligent basé sur les progrès de l'étudiant
 */
router.get('/planning', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const { Progress, Lesson, Subject, Student } = req.models;

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
          weeklySchedule: [],
          efficiencyScore: 0
        }
      });
    }

    // Get recent progress to identify weak areas
    const recentProgress = await Progress.findAll({
      where: {
        studentId,
        createdAt: {
          [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      include: [{
        model: Lesson,
        as: 'lesson',
        include: [{
          model: Subject,
          as: 'subject'
        }]
      }],
      order: [['createdAt', 'DESC']],
      limit: 100
    });

    // Analyze weak areas (score < 70%)
    const weakAreas = {};
    const subjectStats = {};

    recentProgress.forEach(progress => {
      const score = progress.score || 0;
      const subjectId = progress.subjectId;
      const lessonTitle = progress.lesson?.title || 'Unknown';

      if (!subjectStats[subjectId]) {
        subjectStats[subjectId] = {
          subjectName: progress.lesson?.subject?.name || 'Unknown',
          totalScore: 0,
          count: 0,
          lessons: []
        };
      }

      subjectStats[subjectId].totalScore += score;
      subjectStats[subjectId].count++;

      if (score < 70) {
        if (!weakAreas[subjectId]) {
          weakAreas[subjectId] = {
            subject: progress.lesson?.subject?.name || 'Unknown',
            topics: []
          };
        }
        weakAreas[subjectId].topics.push({
          title: lessonTitle,
          score,
          lastStudied: progress.createdAt
        });
      }
    });

    // Generate weekly schedule (next 7 days)
    const schedule = [];
    const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    const today = new Date();

    // Prioritize weak areas in schedule
    const weakSubjects = Object.entries(weakAreas)
      .sort((a, b) => b[1].topics.length - a[1].topics.length)
      .slice(0, 5);

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const daySchedule = {
        day: daysOfWeek[date.getDay()],
        date: date.toISOString().split('T')[0],
        isToday: i === 0,
        sessions: []
      };

      // Add 2-3 revision sessions per day
      const numSessions = i === 0 ? 2 : Math.floor(Math.random() * 2) + 1;

      for (let j = 0; j < numSessions && j < weakSubjects.length; j++) {
        const subject = weakSubjects[j];
        const startHour = 14 + (j * 2);
        const duration = 60 + Math.floor(Math.random() * 30);

        daySchedule.sessions.push({
          time: `${startHour}h00 - ${startHour + Math.floor(duration / 60)}h${duration % 60}`,
          subject: subject[1].subject,
          topic: subject[1].topics[0]?.title || 'Révision générale',
          priority: subject[1].topics[0]?.score < 50 ? 'urgent' : 'normal',
          duration
        });
      }

      schedule.push(daySchedule);
    }

    // Calculate efficiency score
    const averageScore = Object.values(subjectStats)
      .reduce((sum, stat) => sum + (stat.totalScore / stat.count), 0)
      / Object.keys(subjectStats).length;
    const efficiencyScore = Math.round(averageScore || 0);

    res.json({
      success: true,
      data: {
        weeklySchedule: schedule,
        efficiencyScore,
        weakAreas: Object.entries(weakAreas).map(([id, area]) => ({
          subject: area.subject,
          topicsCount: area.topics.length,
          averageScore: Math.round(area.topics.reduce((sum, t) => sum + t.score, 0) / area.topics.length)
        }))
      }
    });

  } catch (error) {
    logger.error('Erreur récupération planning révisions:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du planning'
    });
  }
});

/**
 * GET /api/revisions/flashcards
 * Fiches de révision générées selon la méthode de répétition espacée
 */
router.get('/flashcards', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const { Progress, Lesson, Subject, Student } = req.models;
    const { category = 'all' } = req.query; // urgent, review, mastered, all

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
          urgent: [],
          review: [],
          mastered: []
        }
      });
    }

    // Get all progress for flashcard generation
    const allProgress = await Progress.findAll({
      where: { studentId },
      include: [{
        model: Lesson,
        as: 'lesson',
        include: [{
          model: Subject,
          as: 'subject'
        }]
      }],
      order: [['createdAt', 'DESC']]
    });

    // Categorize flashcards based on spaced repetition algorithm
    const urgent = []; // Score < 50% or not seen in 3+ days
    const review = []; // Score 50-80% or seen 1-3 days ago
    const mastered = []; // Score > 80% and recent

    const now = new Date();

    allProgress.forEach(progress => {
      const daysSinceStudy = Math.floor((now - new Date(progress.createdAt)) / (1000 * 60 * 60 * 24));
      const score = progress.score || 0;

      const flashcard = {
        id: progress.id,
        subject: progress.lesson?.subject?.name || 'Unknown',
        topic: progress.lesson?.title || 'Unknown',
        question: progress.lesson?.objectives?.[0] || `Réviser ${progress.lesson?.title}`,
        difficulty: progress.lesson?.difficulty || 'medium',
        lastSeen: daysSinceStudy,
        successRate: score,
        priority: 'low'
      };

      if (score < 50 || daysSinceStudy > 3) {
        flashcard.priority = daysSinceStudy > 7 ? 'high' : 'medium';
        urgent.push(flashcard);
      } else if (score >= 50 && score < 80) {
        flashcard.priority = 'medium';
        review.push(flashcard);
      } else {
        flashcard.priority = 'low';
        mastered.push(flashcard);
      }
    });

    // Sort by priority and limit
    const sortByPriority = (a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    };

    urgent.sort(sortByPriority);
    review.sort(sortByPriority);

    const responseData = {
      urgent: urgent.slice(0, 20),
      review: review.slice(0, 30),
      mastered: mastered.slice(0, 50),
      stats: {
        urgentCount: urgent.length,
        reviewCount: review.length,
        masteredCount: mastered.length,
        total: allProgress.length
      }
    };

    // Filter by category if specified
    if (category !== 'all') {
      res.json({
        success: true,
        data: {
          flashcards: responseData[category] || [],
          stats: responseData.stats
        }
      });
    } else {
      res.json({
        success: true,
        data: responseData
      });
    }

  } catch (error) {
    logger.error('Erreur récupération flashcards:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des flashcards'
    });
  }
});

/**
 * GET /api/revisions/session
 * Session de révision active (si existante)
 */
router.get('/session', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    // For now, return mock active session
    // In production, this would track actual ongoing sessions
    res.json({
      success: true,
      data: {
        isActive: false,
        session: null
      }
    });

  } catch (error) {
    logger.error('Erreur récupération session:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la session'
    });
  }
});

module.exports = router;
