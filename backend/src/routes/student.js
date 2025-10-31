const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

// All student routes require authentication and STUDENT role
router.use(authenticate);
router.use(authorize(['STUDENT']));

// GET /api/student/dashboard - Student dashboard with progress
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user.userId;
    
    res.json({
      success: true,
      data: {
        student: {
          id: userId,
          email: req.user.email
        },
        progress: {
          totalLessonsCompleted: 0,
          totalQuizzesCompleted: 0,
          averageScore: 0,
          currentStreak: 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching student dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du tableau de bord'
    });
  }
});

// GET /api/student/profile - Student profile
router.get('/profile', async (req, res) => {
  try {
    const { User } = require('../models');
    const user = await User.findByPk(req.user.userId, {
      attributes: ['id', 'email', 'firstName', 'lastName', 'role', 'userType', 'avatar', 'dateOfBirth']
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil'
    });
  }
});

// GET /api/student/lessons - Student's lessons
router.get('/lessons', async (req, res) => {
  try {
    res.json({
      success: true,
      count: 0,
      data: []
    });
  } catch (error) {
    console.error('Error fetching lessons:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des leçons'
    });
  }
});

// GET /api/student/progress - Student's learning progress
router.get('/progress', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        subjects: [],
        recentActivity: [],
        achievements: []
      }
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la progression'
    });
  }
});

// GET /api/student/preferences - Student preferences
router.get('/preferences', async (req, res) => {
  try {
    const { User } = require('../models');
    const user = await User.findByPk(req.user.userId, {
      attributes: ['id', 'language', 'timezone']
    });
    
    res.json({
      success: true,
      data: {
        userId: user.id,
        language: user.language || 'fr',
        timezone: user.timezone || 'Africa/Douala'
      }
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des préférences'
    });
  }
});

// POST /api/student/change-password - Change password
router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel et nouveau requis'
      });
    }
    
    const { User } = require('../models');
    const user = await User.findByPk(req.user.userId);
    
    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe actuel incorrect'
      });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.json({
      success: true,
      message: 'Mot de passe modifié'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de mot de passe'
    });
  }
});

module.exports = router;
