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

    // Pour l'instant, retourner des données basiques
    // TODO: Implémenter le vrai système de progression
    res.json({
      success: true,
      data: {
        studentId: student.id,
        overallProgress: student.overallProgress || 0,
        currentAverage: student.currentAverage || 0,
        currentStreak: student.currentStreak || 0,
        totalPoints: student.totalPoints || 0,
        claudinePoints: student.claudinePoints || 0,
        weeklyStudyTime: 0,
        weeklyExercises: 0,
        recentActivities: [],
        subjects: []
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

    // Pour l'instant, retourner des analytics basiques
    // TODO: Implémenter le vrai système d'analytics
    res.json({
      success: true,
      data: {
        studentId: student.id,
        overallProgress: student.overallProgress || 0,
        currentScore: student.currentAverage || 0,
        weeklyProgress: 0,
        weeklyStudyTime: '0h',
        weeklyExercises: 0,
        streakDays: student.currentStreak || 0,
        strongSubject: 'À déterminer',
        weakSubject: 'À déterminer',
        subjectScores: [],
        performanceTrend: [],
        studyTimeByDay: []
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

module.exports = router;