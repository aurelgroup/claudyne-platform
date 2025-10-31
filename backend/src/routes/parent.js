const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

// All parent routes require authentication and PARENT role
router.use(authenticate);
router.use(authorize(['PARENT']));

// GET /api/parent/dashboard - Parent dashboard with family overview
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user.userId;
    
    res.json({
      success: true,
      data: {
        parent: {
          id: userId,
          email: req.user.email
        },
        family: {
          totalChildren: 0,
          activeSubscriptions: 0
        },
        overview: {
          totalProgress: 0,
          upcomingLessons: 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching parent dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du tableau de bord'
    });
  }
});

// GET /api/parent/profile - Parent profile
router.get('/profile', async (req, res) => {
  try {
    const { User } = require('../models');
    const user = await User.findByPk(req.user.userId, {
      attributes: ['id', 'email', 'firstName', 'lastName', 'role', 'userType', 'phone', 'familyId']
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
    console.error('Error fetching parent profile:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil'
    });
  }
});

// GET /api/parent/children - Parent's children
router.get('/children', async (req, res) => {
  try {
    const { User } = require('../models');
    const parent = await User.findByPk(req.user.userId);
    
    if (!parent || !parent.familyId) {
      return res.json({
        success: true,
        count: 0,
        data: []
      });
    }
    
    const children = await User.findAll({
      where: {
        familyId: parent.familyId,
        role: 'STUDENT'
      },
      attributes: ['id', 'email', 'firstName', 'lastName', 'avatar', 'isActive']
    });
    
    res.json({
      success: true,
      count: children.length,
      data: children
    });
  } catch (error) {
    console.error('Error fetching children:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des enfants'
    });
  }
});

// GET /api/parent/family - Family information
router.get('/family', async (req, res) => {
  try {
    const { User, Family } = require('../models');
    const parent = await User.findByPk(req.user.userId);
    
    if (!parent || !parent.familyId) {
      return res.json({
        success: true,
        data: null
      });
    }
    
    const family = await Family.findByPk(parent.familyId);
    
    res.json({
      success: true,
      data: family
    });
  } catch (error) {
    console.error('Error fetching family:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la famille'
    });
  }
});

// GET /api/parent/preferences - Parent preferences
router.get('/preferences', async (req, res) => {
  try {
    const { User } = require('../models');
    const user = await User.findByPk(req.user.userId, {
      attributes: ['id', 'language', 'timezone', 'notificationPreferences']
    });
    
    res.json({
      success: true,
      data: {
        userId: user.id,
        language: user.language || 'fr',
        timezone: user.timezone || 'Africa/Douala',
        notifications: user.notificationPreferences || {}
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

// POST /api/parent/change-password - Change password
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
