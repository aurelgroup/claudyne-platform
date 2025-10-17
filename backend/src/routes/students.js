/**
 * Routes pour les Étudiants - Claudyne Backend
 * Gestion des profils étudiants et progression
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

// Endpoint pour récupérer le profil de l'étudiant connecté
router.get('/profile', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise',
        code: 'AUTH_REQUIRED'
      });
    }

    const { User, Student } = req.models;

    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'email', 'firstName', 'lastName', 'role', 'userType']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    let studentProfile = null;
    if (req.user.familyId) {
      studentProfile = await Student.findOne({
        where: {
          familyId: req.user.familyId
        },
        attributes: [
          'id', 'firstName', 'lastName', 'currentLevel', 'totalPoints',
          'claudinePoints', 'currentStreak', 'overallProgress', 'currentAverage'
        ]
      });
    }

    const profileData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      userType: user.userType,
      xp: studentProfile?.totalPoints || 0,
      level: studentProfile?.currentLevel || 1,
      dailyStreak: studentProfile?.currentStreak || 0,
      overallProgress: studentProfile?.overallProgress || 0,
      currentAverage: studentProfile?.currentAverage || 0,
      claudinePoints: studentProfile?.claudinePoints || 0
    };

    res.json({
      success: true,
      data: profileData
    });

  } catch (error) {
    logger.error('Erreur récupération profil étudiant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil'
    });
  }
});


// Récupérer tous les étudiants de la famille
router.get('/', async (req, res) => {
  try {
    if (!req.user || !req.user.familyId) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const { Student, Progress } = req.models;

    const students = await Student.findAll({
      where: { familyId: req.user.familyId, isActive: true },
      include: [
        {
          model: Progress,
          as: 'progress',
          attributes: ['lessonId', 'status', 'completionPercentage', 'lastScore'],
          required: false
        }
      ]
    });

    res.json({
      success: true,
      data: {
        students: students.map(student => student.toJSON())
      }
    });

  } catch (error) {
    logger.error('Erreur récupération étudiants:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des étudiants'
    });
  }
});

// Créer un nouvel étudiant
router.post('/', async (req, res) => {
  try {
    if (!req.user || !req.user.familyId) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    // Vérifier que l'utilisateur est le manager de la famille
    if (req.user.userType !== 'MANAGER') {
      return res.status(403).json({
        success: false,
        message: 'Seul le gestionnaire familial peut ajouter des étudiants'
      });
    }

    const { Student, Family } = req.models;
    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      educationLevel,
      school,
      className,
      studentType = 'CHILD'
    } = req.body;

    // Validation des champs requis
    if (!firstName || !lastName || !dateOfBirth || !educationLevel) {
      return res.status(400).json({
        success: false,
        message: 'Les champs prénom, nom, date de naissance et niveau scolaire sont obligatoires'
      });
    }

    // Vérifier les limites de la famille (essai gratuit = 2 max)
    const family = await Family.findByPk(req.user.familyId);
    if (!family) {
      return res.status(404).json({
        success: false,
        message: 'Famille non trouvée'
      });
    }

    const existingStudents = await Student.count({
      where: { familyId: req.user.familyId, isActive: true }
    });

    const maxStudents = family.subscriptionType === 'TRIAL' ? 2 : 6;
    if (existingStudents >= maxStudents) {
      return res.status(400).json({
        success: false,
        message: `Limite atteinte : ${maxStudents} étudiants maximum pour votre abonnement`
      });
    }

    // Créer l'étudiant
    const student = await Student.create({
      familyId: req.user.familyId,
      firstName,
      lastName,
      dateOfBirth: new Date(dateOfBirth),
      gender: gender || null,
      educationLevel,
      school: school || null,
      className: className || null,
      studentType,
      status: 'ACTIVE',
      currentLevel: 1,
      totalPoints: 0,
      claudinePoints: 0,
      currentAverage: 0.0,
      lastActivityAt: new Date()
    });

    // Mettre à jour le compteur de la famille
    await family.update({
      currentMembersCount: existingStudents + 1,
      lastActivityAt: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Étudiant créé avec succès',
      data: {
        student: student.toJSON()
      }
    });

  } catch (error) {
    logger.error('Erreur création étudiant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'étudiant'
    });
  }
});

// Récupérer un étudiant spécifique
router.get('/:id', async (req, res) => {
  try {
    if (!req.user || !req.user.familyId) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const { Student } = req.models;
    const student = await Student.findOne({
      where: {
        id: req.params.id,
        familyId: req.user.familyId,
        isActive: true
      }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Étudiant non trouvé'
      });
    }

    res.json({
      success: true,
      data: {
        student: student.toJSON()
      }
    });

  } catch (error) {
    logger.error('Erreur récupération étudiant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'étudiant'
    });
  }
});

// Récupérer la progression d'un étudiant
router.get('/:id/progress', async (req, res) => {
  try {
    if (!req.user || !req.user.familyId) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const { Student, Progress, Lesson, Subject } = req.models;
    const student = await Student.findOne({
      where: {
        id: req.params.id,
        familyId: req.user.familyId,
        isActive: true
      }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Étudiant non trouvé'
      });
    }

    // Récupérer toutes les progressions de l'étudiant avec les leçons et matières
    const progressData = await Progress.findAll({
      where: { studentId: student.id },
      include: [
        {
          model: Lesson,
          as: 'lesson',
          attributes: ['id', 'title', 'type', 'difficulty', 'estimatedDuration', 'subjectId'],
          include: [{
            model: Subject,
            as: 'subject',
            attributes: ['id', 'title', 'category', 'icon', 'color']
          }]
        }
      ],
      order: [['lastActivityAt', 'DESC']]
    });

    // Calculer le temps d'étude hebdomadaire (7 derniers jours)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weeklyProgress = progressData.filter(p =>
      p.lastActivityAt && new Date(p.lastActivityAt) >= weekAgo
    );

    const weeklyStudyTime = weeklyProgress.reduce((sum, p) => sum + (p.timeSpent || 0), 0);
    const weeklyExercises = weeklyProgress.filter(p => p.status === 'completed').length;

    // Grouper par matière
    const subjectMap = {};
    progressData.forEach(progress => {
      const lesson = progress.lesson;
      if (!lesson || !lesson.subject) return;

      const subjectId = lesson.subject.id;
      if (!subjectMap[subjectId]) {
        subjectMap[subjectId] = {
          id: subjectId,
          title: lesson.subject.title,
          category: lesson.subject.category,
          icon: lesson.subject.icon,
          color: lesson.subject.color,
          totalLessons: 0,
          completedLessons: 0,
          inProgressLessons: 0,
          averageScore: 0,
          totalTime: 0,
          scores: []
        };
      }

      const subject = subjectMap[subjectId];
      subject.totalLessons++;
      subject.totalTime += progress.timeSpent || 0;

      if (progress.status === 'completed') subject.completedLessons++;
      if (progress.status === 'in_progress') subject.inProgressLessons++;
      if (progress.averageScore !== null && progress.averageScore > 0) {
        subject.scores.push(progress.averageScore);
      }
    });

    // Calculer la moyenne par matière
    const subjects = Object.values(subjectMap).map(subject => {
      if (subject.scores.length > 0) {
        subject.averageScore = Math.round(
          subject.scores.reduce((sum, score) => sum + score, 0) / subject.scores.length
        );
      }
      subject.completionRate = subject.totalLessons > 0
        ? Math.round((subject.completedLessons / subject.totalLessons) * 100)
        : 0;

      delete subject.scores; // Nettoyer les données temporaires
      return subject;
    });

    // Récupérer les activités récentes (10 dernières)
    const recentActivities = progressData.slice(0, 10).map(progress => ({
      id: progress.id,
      lessonId: progress.lessonId,
      lessonTitle: progress.lesson?.title || 'Leçon inconnue',
      subjectTitle: progress.lesson?.subject?.title || 'Matière inconnue',
      status: progress.status,
      completionPercentage: progress.completionPercentage,
      lastScore: progress.lastScore,
      timeSpent: progress.timeSpent,
      lastActivityAt: progress.lastActivityAt
    }));

    res.json({
      success: true,
      data: {
        studentId: student.id,
        overallProgress: student.overallProgress || 0,
        currentAverage: student.currentAverage || 0,
        currentStreak: student.currentStreak || 0,
        totalPoints: student.totalPoints || 0,
        claudinePoints: student.claudinePoints || 0,
        weeklyStudyTime: Math.round(weeklyStudyTime),
        weeklyExercises,
        recentActivities,
        subjects
      }
    });

  } catch (error) {
    logger.error('Erreur récupération progression étudiant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la progression'
    });
  }
});

// Récupérer les analytics d'un étudiant
router.get('/:id/analytics', async (req, res) => {
  try {
    if (!req.user || !req.user.familyId) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const { Student, Progress, Lesson, Subject } = req.models;
    const { Sequelize } = require('sequelize');
    const { Op } = Sequelize;

    const student = await Student.findOne({
      where: {
        id: req.params.id,
        familyId: req.user.familyId,
        isActive: true
      }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Étudiant non trouvé'
      });
    }

    // Récupérer toutes les progressions avec leçons et matières
    const allProgress = await Progress.findAll({
      where: { studentId: student.id },
      include: [
        {
          model: Lesson,
          as: 'lesson',
          attributes: ['id', 'title', 'subjectId'],
          include: [{
            model: Subject,
            as: 'subject',
            attributes: ['id', 'title', 'category']
          }]
        }
      ]
    });

    // Calculer le temps d'étude par jour (14 derniers jours pour la tendance)
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const recentProgress = allProgress.filter(p =>
      p.lastActivityAt && new Date(p.lastActivityAt) >= twoWeeksAgo
    );

    // Grouper le temps par jour
    const studyTimeByDay = {};
    recentProgress.forEach(p => {
      if (!p.lastActivityAt) return;
      const date = new Date(p.lastActivityAt).toISOString().split('T')[0];
      if (!studyTimeByDay[date]) {
        studyTimeByDay[date] = 0;
      }
      studyTimeByDay[date] += p.timeSpent || 0;
    });

    // Transformer en tableau pour le graphique
    const studyTimeArray = Object.entries(studyTimeByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, minutes]) => ({
        date,
        minutes,
        hours: (minutes / 60).toFixed(1)
      }));

    // Calculer la progression hebdomadaire
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const twoWeekAgo = new Date();
    twoWeekAgo.setDate(twoWeekAgo.getDate() - 14);

    const thisWeekProgress = allProgress.filter(p =>
      p.completedAt && new Date(p.completedAt) >= weekAgo
    ).length;

    const lastWeekProgress = allProgress.filter(p =>
      p.completedAt &&
      new Date(p.completedAt) >= twoWeekAgo &&
      new Date(p.completedAt) < weekAgo
    ).length;

    const weeklyProgressChange = lastWeekProgress > 0
      ? Math.round(((thisWeekProgress - lastWeekProgress) / lastWeekProgress) * 100)
      : 0;

    // Calculer temps d'étude cette semaine
    const weeklyStudyTime = recentProgress
      .filter(p => p.lastActivityAt && new Date(p.lastActivityAt) >= weekAgo)
      .reduce((sum, p) => sum + (p.timeSpent || 0), 0);

    const weeklyStudyHours = Math.floor(weeklyStudyTime / 60);
    const weeklyStudyMinutes = weeklyStudyTime % 60;

    // Grouper par matière et calculer les scores
    const subjectScoresMap = {};
    allProgress.forEach(progress => {
      const lesson = progress.lesson;
      if (!lesson || !lesson.subject || progress.averageScore === null) return;

      const subjectId = lesson.subject.id;
      if (!subjectScoresMap[subjectId]) {
        subjectScoresMap[subjectId] = {
          subject: lesson.subject.title,
          category: lesson.subject.category,
          scores: [],
          completed: 0,
          total: 0
        };
      }

      const subject = subjectScoresMap[subjectId];
      subject.total++;
      if (progress.status === 'completed') {
        subject.completed++;
        if (progress.averageScore > 0) {
          subject.scores.push(progress.averageScore);
        }
      }
    });

    // Calculer les scores moyens par matière
    const subjectScores = Object.values(subjectScoresMap).map(subject => ({
      subject: subject.subject,
      category: subject.category,
      averageScore: subject.scores.length > 0
        ? Math.round(subject.scores.reduce((sum, s) => sum + s, 0) / subject.scores.length)
        : 0,
      completedLessons: subject.completed,
      totalLessons: subject.total
    })).filter(s => s.averageScore > 0);

    // Trouver les matières fortes et faibles
    const sortedByScore = [...subjectScores].sort((a, b) => b.averageScore - a.averageScore);
    const strongSubject = sortedByScore.length > 0
      ? `${sortedByScore[0].subject} (${sortedByScore[0].averageScore}%)`
      : 'À déterminer';
    const weakSubject = sortedByScore.length > 1
      ? `${sortedByScore[sortedByScore.length - 1].subject} (${sortedByScore[sortedByScore.length - 1].averageScore}%)`
      : 'À déterminer';

    // Tendance de performance (30 derniers jours groupés par semaine)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentCompletedProgress = allProgress.filter(p =>
      p.completedAt &&
      new Date(p.completedAt) >= thirtyDaysAgo &&
      p.lastScore !== null
    ).sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));

    // Grouper par semaine
    const performanceTrend = [];
    let currentWeek = [];
    let currentWeekStart = null;

    recentCompletedProgress.forEach(progress => {
      const completedDate = new Date(progress.completedAt);
      const weekNumber = Math.floor((completedDate - thirtyDaysAgo) / (7 * 24 * 60 * 60 * 1000));

      if (currentWeekStart === null || currentWeekStart !== weekNumber) {
        if (currentWeek.length > 0) {
          const avgScore = currentWeek.reduce((sum, s) => sum + s, 0) / currentWeek.length;
          performanceTrend.push({
            week: `Semaine ${performanceTrend.length + 1}`,
            averageScore: Math.round(avgScore),
            exercisesCompleted: currentWeek.length
          });
        }
        currentWeek = [];
        currentWeekStart = weekNumber;
      }

      if (progress.lastScore) {
        currentWeek.push(progress.lastScore);
      }
    });

    // Ajouter la dernière semaine
    if (currentWeek.length > 0) {
      const avgScore = currentWeek.reduce((sum, s) => sum + s, 0) / currentWeek.length;
      performanceTrend.push({
        week: `Semaine ${performanceTrend.length + 1}`,
        averageScore: Math.round(avgScore),
        exercisesCompleted: currentWeek.length
      });
    }

    res.json({
      success: true,
      data: {
        studentId: student.id,
        overallProgress: student.overallProgress || 0,
        currentScore: student.currentAverage || 0,
        weeklyProgress: weeklyProgressChange,
        weeklyStudyTime: `${weeklyStudyHours}h${weeklyStudyMinutes > 0 ? weeklyStudyMinutes + 'm' : ''}`,
        weeklyExercises: thisWeekProgress,
        streakDays: student.currentStreak || 0,
        strongSubject,
        weakSubject,
        subjectScores,
        performanceTrend,
        studyTimeByDay: studyTimeArray
      }
    });

  } catch (error) {
    logger.error('Erreur récupération analytics étudiant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des analytics'
    });
  }
});

// Dashboard de l'étudiant connecté
router.get('/dashboard', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const { Student, Progress, Lesson } = req.models;

    // Récupérer le profil étudiant
    const student = await Student.findOne({
      where: { familyId: req.user.familyId }
    });

    if (!student) {
      return res.json({
        success: true,
        data: {
          lessonsCompleted: 0,
          quizzesPassed: 0,
          battlesWon: 0,
          studyStreak: 0,
          weeklyStudyTime: 0,
          recentActivities: []
        }
      });
    }

    // Compter les leçons complétées
    const lessonsCompleted = await Progress.count({
      where: {
        studentId: student.id,
        status: 'completed'
      }
    });

    // Compter les quiz passés (score >= 75%)
    const quizzesPassed = await Progress.count({
      where: {
        studentId: student.id,
        status: 'completed',
        lastScore: { [require('sequelize').Op.gte]: 75 }
      }
    });

    // Battles won (peut être implémenté plus tard)
    const battlesWon = 0;

    // Temps d'étude hebdomadaire
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weeklyProgress = await Progress.findAll({
      where: {
        studentId: student.id,
        lastActivityAt: { [require('sequelize').Op.gte]: weekAgo }
      }
    });

    const weeklyStudyTime = weeklyProgress.reduce((sum, p) => sum + (p.timeSpent || 0), 0);

    // Activités récentes
    const recentActivities = await Progress.findAll({
      where: { studentId: student.id },
      include: [{
        model: Lesson,
        as: 'lesson',
        attributes: ['id', 'title', 'type']
      }],
      order: [['lastActivityAt', 'DESC']],
      limit: 10
    });

    res.json({
      success: true,
      data: {
        lessonsCompleted,
        quizzesPassed,
        battlesWon,
        studyStreak: student.currentStreak || 0,
        weeklyStudyTime: Math.round(weeklyStudyTime),
        recentActivities: recentActivities.map(p => ({
          id: p.id,
          lessonTitle: p.lesson?.title || 'Leçon',
          lessonType: p.lesson?.type || 'lesson',
          status: p.status,
          score: p.lastScore,
          date: p.lastActivityAt
        }))
      }
    });

  } catch (error) {
    logger.error('Erreur récupération dashboard étudiant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du dashboard'
    });
  }
});

// Sujets/Matières de l'étudiant
router.get('/subjects', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const { Student, Subject, Progress, Lesson } = req.models;

    const student = await Student.findOne({
      where: { familyId: req.user.familyId }
    });

    if (!student) {
      return res.json({
        success: true,
        data: { subjects: [] }
      });
    }

    // Récupérer tous les sujets actifs
    const allSubjects = await Subject.findAll({
      where: { isActive: true },
      order: [['order', 'ASC']]
    });

    // Pour chaque sujet, calculer la progression
    const subjectsWithProgress = await Promise.all(
      allSubjects.map(async (subject) => {
        // Trouver toutes les leçons de ce sujet
        const lessons = await Lesson.findAll({
          where: { subjectId: subject.id, isActive: true }
        });

        const lessonIds = lessons.map(l => l.id);

        // Trouver la progression pour ces leçons
        const progress = await Progress.findAll({
          where: {
            studentId: student.id,
            lessonId: lessonIds
          }
        });

        const totalLessons = lessons.length;
        const completedLessons = progress.filter(p => p.status === 'completed').length;
        const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

        // Calculer le score moyen
        const scores = progress.filter(p => p.averageScore !== null && p.averageScore > 0).map(p => p.averageScore);
        const averageScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

        return {
          id: subject.id,
          title: subject.title,
          category: subject.category,
          icon: subject.icon,
          color: subject.color,
          progress: progressPercent,
          score: averageScore,
          totalLessons,
          completedLessons
        };
      })
    );

    res.json({
      success: true,
      data: {
        subjects: subjectsWithProgress
      }
    });

  } catch (error) {
    logger.error('Erreur récupération sujets:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des sujets'
    });
  }
});

// Achievements/Badges de l'étudiant
router.get('/achievements', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const { Student, Progress } = req.models;

    const student = await Student.findOne({
      where: { familyId: req.user.familyId }
    });

    if (!student) {
      return res.json({
        success: true,
        data: { achievements: [] }
      });
    }

    // Récupérer toutes les progressions pour calculer les badges
    const allProgress = await Progress.findAll({
      where: { studentId: student.id }
    });

    const achievements = [];

    // Badge: Première Leçon
    if (allProgress.some(p => p.status === 'completed')) {
      achievements.push({
        id: 'first-lesson',
        name: 'Première Leçon',
        description: 'Compléter votre première leçon',
        icon: '📚',
        unlocked: true,
        unlockedAt: allProgress.find(p => p.status === 'completed')?.completedAt
      });
    }

    // Badge: 10 Leçons
    const completedCount = allProgress.filter(p => p.status === 'completed').length;
    if (completedCount >= 10) {
      achievements.push({
        id: 'ten-lessons',
        name: 'Étudiant Assidu',
        description: 'Compléter 10 leçons',
        icon: '🎯',
        unlocked: true
      });
    }

    // Badge: Série de 7 jours
    if (student.currentStreak >= 7) {
      achievements.push({
        id: 'week-streak',
        name: 'Série d\'une semaine',
        description: 'Étudier 7 jours consécutifs',
        icon: '🔥',
        unlocked: true
      });
    }

    // Badge: Score parfait
    if (allProgress.some(p => p.bestScore === 100)) {
      achievements.push({
        id: 'perfect-score',
        name: 'Perfection',
        description: 'Obtenir un score de 100%',
        icon: '⭐',
        unlocked: true
      });
    }

    // Badge: Prix Claudine candidat
    if (student.claudinePoints > 0) {
      achievements.push({
        id: 'claudine-candidate',
        name: 'Candidat Prix Claudine',
        description: 'Participer au Prix Claudine',
        icon: '👑',
        unlocked: true
      });
    }

    res.json({
      success: true,
      data: {
        achievements,
        totalUnlocked: achievements.filter(a => a.unlocked).length,
        totalAvailable: achievements.length + 10  // Badges futurs
      }
    });

  } catch (error) {
    logger.error('Erreur récupération achievements:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des achievements'
    });
  }
});

// Récupérer les paramètres de l'étudiant
router.get('/settings', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const { Student, User, Family } = req.models;

    // Récupérer l'utilisateur avec son profil étudiant
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'email', 'phone', 'address', 'city', 'country']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const student = await Student.findOne({
      where: { familyId: req.user.familyId }
    });

    const family = await Family.findByPk(req.user.familyId);

    // Structure des paramètres
    const settings = {
      // Profil
      profile: {
        firstName: student?.firstName || user.firstName || '',
        lastName: student?.lastName || user.lastName || '',
        nickname: student?.nickname || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        country: user.country || '',
        dateOfBirth: student?.dateOfBirth || null,
        gender: student?.gender || null,
        avatar: student?.avatar || null
      },

      // Informations scolaires
      education: {
        educationLevel: student?.educationLevel || '',
        schoolName: student?.schoolName || '',
        schoolType: student?.schoolType || '',
        academicYear: student?.academicYear || '',
        className: student?.className || '',
        currentAverage: student?.currentAverage || 0,
        targetGrade: student?.targetGrade || 'Mention Bien'
      },

      // Préférences d'apprentissage
      learning: {
        learningStyle: student?.learningStyle || 'ADAPTIVE',
        preferredLanguage: student?.preferredLanguage || 'fr',
        difficultySetting: student?.difficultySetting || 'ADAPTIVE',
        adaptiveDifficulty: student?.difficultySetting === 'ADAPTIVE',
        detailedExplanations: true,
        spacedRepetition: true,
        difficultyLevel: student?.difficultySetting === 'EASY' ? 1 : student?.difficultySetting === 'MEDIUM' ? 3 : student?.difficultySetting === 'HARD' ? 5 : 3
      },

      // Notifications
      notifications: {
        studyReminders: true,
        newChallenges: true,
        smartBreaks: true,
        community: false,
        email: true,
        push: true
      },

      // Interface
      interface: {
        theme: 'gradient',
        particles: true,
        animations: true,
        language: student?.preferredLanguage || 'fr'
      },

      // Sécurité et données
      security: {
        autoSave: true,
        twoFactorEnabled: false,
        sessionTimeout: 30
      },

      // Statistiques
      stats: {
        totalPoints: student?.totalPoints || 0,
        claudinePoints: student?.claudinePoints || 0,
        currentLevel: student?.currentLevel || 1,
        currentStreak: student?.currentStreak || 0,
        totalLessonsCompleted: student?.totalLessonsCompleted || 0,
        totalStudyTimeMinutes: student?.totalStudyTimeMinutes || 0
      }
    };

    res.json({
      success: true,
      data: settings
    });

  } catch (error) {
    logger.error('Erreur récupération settings:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des paramètres'
    });
  }
});

// Mettre à jour les paramètres de l'étudiant
router.put('/settings', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const { Student, User } = req.models;
    const {
      profile,
      education,
      learning,
      notifications,
      interface: interfaceSettings
    } = req.body;

    // Mettre à jour l'utilisateur
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Mettre à jour le profil étudiant
    const student = await Student.findOne({
      where: { familyId: req.user.familyId }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Profil étudiant non trouvé'
      });
    }

    // Updates pour User
    const userUpdates = {};
    if (profile) {
      if (profile.email) userUpdates.email = profile.email;
      if (profile.phone) userUpdates.phone = profile.phone;
      if (profile.address) userUpdates.address = profile.address;
      if (profile.city) userUpdates.city = profile.city;
      if (profile.country) userUpdates.country = profile.country;
    }

    if (Object.keys(userUpdates).length > 0) {
      await user.update(userUpdates);
    }

    // Updates pour Student
    const studentUpdates = {};

    if (profile) {
      if (profile.firstName) studentUpdates.firstName = profile.firstName;
      if (profile.lastName) studentUpdates.lastName = profile.lastName;
      if (profile.nickname) studentUpdates.nickname = profile.nickname;
      if (profile.dateOfBirth) studentUpdates.dateOfBirth = profile.dateOfBirth;
      if (profile.gender) studentUpdates.gender = profile.gender;
      if (profile.avatar) studentUpdates.avatar = profile.avatar;
    }

    if (education) {
      if (education.educationLevel) studentUpdates.educationLevel = education.educationLevel;
      if (education.schoolName) studentUpdates.schoolName = education.schoolName;
      if (education.schoolType) studentUpdates.schoolType = education.schoolType;
      if (education.className) studentUpdates.className = education.className;
      if (education.targetGrade) studentUpdates.targetGrade = education.targetGrade;
    }

    if (learning) {
      if (learning.learningStyle) studentUpdates.learningStyle = learning.learningStyle;
      if (learning.preferredLanguage) studentUpdates.preferredLanguage = learning.preferredLanguage;
      if (learning.difficultySetting) studentUpdates.difficultySetting = learning.difficultySetting;

      // Mapper le niveau de difficulté numérique vers les enum
      if (learning.difficultyLevel !== undefined) {
        const difficultyMap = {
          1: 'EASY',
          2: 'EASY',
          3: 'MEDIUM',
          4: 'HARD',
          5: 'HARD'
        };
        studentUpdates.difficultySetting = difficultyMap[learning.difficultyLevel] || 'MEDIUM';
      }
    }

    if (Object.keys(studentUpdates).length > 0) {
      await student.update(studentUpdates);
    }

    // Sauvegarder les préférences dans metadata
    const metadata = student.metadata || {};
    if (notifications) metadata.notifications = notifications;
    if (interfaceSettings) metadata.interface = interfaceSettings;

    if (notifications || interfaceSettings) {
      await student.update({ metadata });
    }

    res.json({
      success: true,
      message: 'Paramètres mis à jour avec succès',
      data: {
        profile: {
          firstName: student.firstName,
          lastName: student.lastName,
          nickname: student.nickname,
          email: user.email
        }
      }
    });

  } catch (error) {
    logger.error('Erreur mise à jour settings:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour des paramètres',
      error: error.message
    });
  }
});

// Changer le mot de passe
router.post('/change-password', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const { User } = req.models;
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel et nouveau mot de passe requis'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit contenir au moins 8 caractères'
      });
    }

    // Récupérer l'utilisateur avec le mot de passe
    const user = await User.scope('withPassword').findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier le mot de passe actuel
    const bcrypt = require('bcrypt');
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe actuel incorrect'
      });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe
    await user.update({
      password: hashedPassword,
      passwordChangedAt: new Date()
    });

    logger.info(`Mot de passe changé pour l'utilisateur ${user.id}`);

    res.json({
      success: true,
      message: 'Mot de passe modifié avec succès'
    });

  } catch (error) {
    logger.error('Erreur changement mot de passe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de mot de passe',
      error: error.message
    });
  }
});

module.exports = router;