/**
 * Routes Achievements - Claudyne Backend
 * Gestion des achievements et badges des étudiants
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

const ACHIEVEMENT_CATEGORIES = {
  academic: {
    name: 'Académiques',
    icon: '🎓',
    achievements: [
      {
        id: 'first-quiz',
        name: 'Premier Quiz',
        icon: '📝',
        description: 'Complétez votre premier quiz',
        points: 10,
        rarity: 'common'
      },
      {
        id: 'perfect-score',
        name: 'Score Parfait',
        icon: '⭐',
        description: 'Obtenez 100% à un quiz',
        points: 50,
        rarity: 'rare'
      },
      {
        id: 'lesson-master',
        name: 'Maître de Leçon',
        icon: '📚',
        description: 'Complétez 10 leçons',
        points: 30,
        rarity: 'uncommon'
      }
    ]
  },
  engagement: {
    name: 'Engagement',
    icon: '🔥',
    achievements: [
      {
        id: 'daily-streak',
        name: 'Semaine Dorée',
        icon: '🌟',
        description: 'Étudiez 7 jours consécutifs',
        points: 100,
        rarity: 'epic'
      },
      {
        id: 'community-helper',
        name: 'Aide Communauté',
        icon: '🤝',
        description: 'Aidez 5 camarades',
        points: 25,
        rarity: 'uncommon'
      },
      {
        id: 'battle-warrior',
        name: 'Guerrier Battaille',
        icon: '⚔️',
        description: 'Gagnez 5 batailles intellectuelles',
        points: 40,
        rarity: 'uncommon'
      }
    ]
  },
  wellness: {
    name: 'Bien-être',
    icon: '🧘',
    achievements: [
      {
        id: 'relaxation-explorer',
        name: 'Explorateur Relaxation',
        icon: '🧘',
        description: 'Essayez tous les exercices de relaxation',
        points: 20,
        rarity: 'uncommon'
      },
      {
        id: 'mindful-week',
        name: 'Semaine Consciente',
        icon: '🍃',
        description: 'Pratiquez la méditation 5 fois',
        points: 35,
        rarity: 'uncommon'
      }
    ]
  },
  social: {
    name: 'Social',
    icon: '👥',
    achievements: [
      {
        id: 'first-friend',
        name: 'Premier Ami',
        icon: '👋',
        description: 'Ajoutez votre premier ami',
        points: 5,
        rarity: 'common'
      },
      {
        id: 'popular',
        name: 'Populaire',
        icon: '⭐',
        description: 'Ayez 20 amis',
        points: 75,
        rarity: 'epic'
      }
    ]
  }
};

/**
 * GET /api/achievements
 * Récupérer tous les achievements disponibles
 */
router.get('/', async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'Achievements chargés',
      data: ACHIEVEMENT_CATEGORIES
    });
  } catch (error) {
    logger.error('Error fetching achievements:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du chargement des achievements'
    });
  }
});

/**
 * GET /api/achievements/user
 * Récupérer les achievements de l'utilisateur actuel
 */
router.get('/user', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const { Student } = req.models;
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
      return res.status(404).json({
        success: false,
        message: 'Étudiant non trouvé'
      });
    }

    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Profil étudiant non trouvé'
      });
    }

    // Get achievements from student profile
    const achievements = student.claudineAchievements || [];
    const totalPoints = achievements.reduce((sum, ach) => sum + (ach.points || 0), 0);

    return res.status(200).json({
      success: true,
      message: 'Achievements récupérés',
      data: {
        achievements: achievements,
        totalPoints: totalPoints,
        unlockedCount: achievements.length,
        availableCount: Object.values(ACHIEVEMENT_CATEGORIES).reduce(
          (sum, cat) => sum + cat.achievements.length, 0
        )
      }
    });
  } catch (error) {
    logger.error('Error fetching user achievements:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du chargement de vos achievements'
    });
  }
});

/**
 * GET /api/achievements/:category
 * Récupérer les achievements d'une catégorie spécifique
 */
router.get('/:category', async (req, res) => {
  try {
    const { category } = req.params;

    if (!ACHIEVEMENT_CATEGORIES[category]) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie non trouvée'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Catégorie chargée',
      data: ACHIEVEMENT_CATEGORIES[category]
    });
  } catch (error) {
    logger.error('Error fetching achievement category:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du chargement de la catégorie'
    });
  }
});

/**
 * POST /api/achievements/unlock
 * Déverrouiller un achievement (admin/system only)
 */
router.post('/unlock', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const { achievementId } = req.body;

    if (!achievementId) {
      return res.status(400).json({
        success: false,
        message: 'Achievement ID requis'
      });
    }

    const { Student } = req.models;
    let student = null;

    if (req.user.studentProfile) {
      student = await Student.findByPk(req.user.studentProfile.id);
    } else if (req.user.userType === 'MANAGER' && req.user.familyId) {
      student = await Student.findOne({
        where: { familyId: req.user.familyId }
      });
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Étudiant non trouvé'
      });
    }

    // Check if achievement already unlocked
    const achievements = student.claudineAchievements || [];
    if (achievements.some(a => a.id === achievementId)) {
      return res.status(400).json({
        success: false,
        message: 'Achievement déjà déverrouillé'
      });
    }

    // Find achievement details
    let achievement = null;
    for (const category of Object.values(ACHIEVEMENT_CATEGORIES)) {
      const found = category.achievements.find(a => a.id === achievementId);
      if (found) {
        achievement = found;
        break;
      }
    }

    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Achievement non trouvé'
      });
    }

    // Add to student achievements
    achievements.push({
      id: achievement.id,
      name: achievement.name,
      icon: achievement.icon,
      points: achievement.points,
      unlockedAt: new Date()
    });

    await student.update({
      claudineAchievements: achievements
    });

    return res.status(200).json({
      success: true,
      message: 'Achievement déverrouillé',
      data: {
        achievement: achievement,
        totalAchievements: achievements.length
      }
    });
  } catch (error) {
    logger.error('Error unlocking achievement:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du déverrouillage de l\'achievement'
    });
  }
});

module.exports = router;
