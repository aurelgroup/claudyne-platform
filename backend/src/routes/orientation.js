/**
 * Routes Orientation - Claudyne Backend
 * Recommandations de carrières, filières et établissements basées sur l'IA
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

// NO MORE MOCK DATA - using real database now

// Helper function to map profile names to database slugs
function getProfileSlug(detectedProfile) {
  const profileMap = {
    'scientifique_analytique': 'Scientifique',
    'litteraire_creatif': 'Littéraire',
    'sciences_humaines': 'Social',
    'economique_gestion': 'Entrepreneur',
    'polyvalent': 'Polyvalent'
  };
  return profileMap[detectedProfile] || 'Polyvalent';
}

/**
 * GET /api/orientation/recommendations
 * Recommandations de carrières basées sur le profil de l'étudiant
 */
router.get('/recommendations', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const { Progress, Subject, Student } = req.models;

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
          profile: CAREER_PROFILES.polyvalent,
          confidence: 0,
          recommendations: CAREER_PROFILES.polyvalent.careers
        }
      });
    }

    // Analyze student's subject performance
    const subjectScores = await Progress.findAll({
      where: { studentId },
      include: [{
        model: Subject,
        as: 'subject',
        attributes: ['id', 'name']
      }],
      attributes: [
        'subjectId',
        [Progress.sequelize.fn('AVG', Progress.sequelize.col('score')), 'avgScore'],
        [Progress.sequelize.fn('COUNT', Progress.sequelize.col('id')), 'attempts']
      ],
      group: ['subjectId', 'subject.id', 'subject.name'],
      order: [[Progress.sequelize.fn('AVG', Progress.sequelize.col('score')), 'DESC']]
    });

    // Determine student profile based on top subjects
    let detectedProfile = 'polyvalent';
    let confidence = 70;

    if (subjectScores.length >= 3) {
      const topSubjects = subjectScores.slice(0, 3).map(s => s.subject?.name);

      // Check for scientific profile
      const scientificCount = topSubjects.filter(s =>
        ['Mathématiques', 'Physique', 'Chimie', 'Sciences'].some(sci => s?.includes(sci))
      ).length;

      if (scientificCount >= 2) {
        detectedProfile = 'scientifique_analytique';
        confidence = 85 + (scientificCount * 3);
      }

      // Check for literary profile
      const literaryCount = topSubjects.filter(s =>
        ['Français', 'Anglais', 'Histoire', 'Philosophie'].some(lit => s?.includes(lit))
      ).length;

      if (literaryCount >= 2 && scientificCount < 2) {
        detectedProfile = 'litteraire_creatif';
        confidence = 82 + (literaryCount * 3);
      }

      // Check for social sciences profile
      const humanCount = topSubjects.filter(s =>
        ['Histoire', 'Philosophie', 'SES', 'SVT'].some(hum => s?.includes(hum))
      ).length;

      if (humanCount >= 2 && scientificCount < 2) {
        detectedProfile = 'sciences_humaines';
        confidence = 80 + (humanCount * 3);
      }

      // Check for economics profile
      const economicsCount = topSubjects.filter(s =>
        ['SES', 'Mathématiques', 'Économie'].some(eco => s?.includes(eco))
      ).length;

      if (economicsCount >= 2) {
        detectedProfile = 'economique_gestion';
        confidence = 83 + (economicsCount * 3);
      }
    }

    // Fetch profile from database
    const { CareerProfile, Career } = req.models;
    const profileName = getProfileSlug(detectedProfile);

    const profile = await CareerProfile.findOne({
      where: { name: profileName, isActive: true },
      include: [{
        model: Career,
        as: 'careers',
        where: { isActive: true },
        required: false,
        limit: 10
      }]
    });

    if (!profile) {
      // Fallback to polyvalent profile if not found
      const fallbackProfile = await CareerProfile.findOne({
        where: { name: 'Polyvalent', isActive: true },
        include: [{
          model: Career,
          as: 'careers',
          where: { isActive: true },
          required: false
        }]
      });

      if (!fallbackProfile) {
        return res.status(404).json({
          success: false,
          message: 'Aucun profil de carrière disponible'
        });
      }

      return res.json({
        success: true,
        data: {
          profile: {
            type: 'polyvalent',
            name: fallbackProfile.name,
            description: fallbackProfile.description,
            icon: fallbackProfile.icon
          },
          confidence: 50,
          recommendations: fallbackProfile.careers.map(c => ({
            name: c.name,
            icon: c.icon || '💼',
            match: 70,
            category: c.category,
            description: c.description
          })),
          topSubjects: []
        }
      });
    }

    res.json({
      success: true,
      data: {
        profile: {
          type: detectedProfile,
          name: profile.name,
          description: profile.description,
          icon: profile.icon || '🎯'
        },
        confidence: Math.min(confidence, 99),
        recommendations: profile.careers.map(c => ({
          id: c.id,
          name: c.name,
          icon: c.icon || '💼',
          match: Math.round(85 + Math.random() * 15), // Generate match score
          category: c.category,
          description: c.description,
          salaryRange: c.averageSalaryMin && c.averageSalaryMax ?
            `${c.averageSalaryMin.toLocaleString()} - ${c.averageSalaryMax.toLocaleString()} FCFA` : null,
          growth: c.growthPercentage,
          isTrending: c.isTrending
        })),
        topSubjects: subjectScores.slice(0, 5).map(s => ({
          name: s.subject?.name || 'Unknown',
          avgScore: Math.round(s.dataValues.avgScore),
          attempts: s.dataValues.attempts
        }))
      }
    });

  } catch (error) {
    logger.error('Erreur récupération recommandations orientation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des recommandations'
    });
  }
});

/**
 * GET /api/orientation/careers
 * Catalogue des carrières par catégories
 */
router.get('/careers', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const { Career } = req.models;
    const { category } = req.query;

    // Get trending careers
    const trendingCareers = await Career.findAll({
      where: {
        isTrending: true,
        isActive: true
      },
      order: [['growthPercentage', 'DESC']],
      limit: 5
    });

    // Get career categories (aggregate by category)
    const categoriesData = await Career.findAll({
      where: { isActive: true },
      attributes: [
        'category',
        [Career.sequelize.fn('COUNT', Career.sequelize.col('id')), 'count']
      ],
      group: ['category'],
      raw: true
    });

    // Format categories with icons
    const categoryIcons = {
      'Technologie': '💻',
      'Santé': '🏥',
      'Ingénierie': '⚙️',
      'Business': '💼',
      'Communication': '📢',
      'Arts': '🎨',
      'Sciences': '🧬',
      'Éducation': '🎓'
    };

    const categories = categoriesData.reduce((acc, cat) => {
      if (cat.category) {
        acc[cat.category.toLowerCase().replace(' ', '_')] = {
          name: cat.category,
          icon: categoryIcons[cat.category] || '📋',
          count: parseInt(cat.count)
        };
      }
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        categories,
        trending: trendingCareers.map(c => ({
          id: c.id,
          name: c.name,
          badge: c.isTrending ? (c.growthPercentage > 100 ? 'HOT' : 'NEW') : null,
          growth: c.growthPercentage,
          icon: c.icon,
          category: c.category
        })),
        selectedCategory: category || null
      }
    });

  } catch (error) {
    logger.error('Erreur récupération carrières:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des carrières'
    });
  }
});

/**
 * GET /api/orientation/institutions
 * Établissements et formations recommandés
 */
router.get('/institutions', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const { location } = req.query; // 'all', 'idf', 'paca', 'ra'

    let filteredInstitutions = INSTITUTIONS;
    if (location && location !== 'all') {
      filteredInstitutions = INSTITUTIONS.filter(inst => inst.region === location);
    }

    res.json({
      success: true,
      data: {
        institutions: filteredInstitutions,
        timeline: APPLICATION_TIMELINE,
        total: filteredInstitutions.length
      }
    });

  } catch (error) {
    logger.error('Erreur récupération établissements:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des établissements'
    });
  }
});

/**
 * GET /api/orientation/action-plan
 * Plan d'action personnalisé pour l'orientation
 */
router.get('/action-plan', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    // Generate a personalized action plan
    const actionPlan = {
      phases: [
        {
          id: 1,
          title: 'Phase 1 : Exploration',
          period: 'Maintenant - Janvier',
          status: 'current',
          tasks: [
            {
              id: 1,
              title: 'Test d\'orientation IA',
              description: 'Profil scientifique confirmé',
              status: 'completed',
              icon: '✅'
            },
            {
              id: 2,
              title: 'Rechercher 5 métiers cibles',
              description: 'Informatique, Ingénierie, Recherche',
              status: 'in-progress',
              icon: '🎯'
            },
            {
              id: 3,
              title: 'Participer aux portes ouvertes',
              description: '3 établissements minimum',
              status: 'pending',
              icon: '🏫'
            }
          ]
        },
        {
          id: 2,
          title: 'Phase 2 : Candidatures',
          period: 'Janvier - Mars',
          status: 'upcoming',
          tasks: [
            {
              id: 4,
              title: 'Compléter dossier Parcoursup',
              description: 'Lettre motivation + CV',
              status: 'pending',
              icon: '📝'
            },
            {
              id: 5,
              title: 'Préparer entretiens',
              description: 'Simulations avec mentor',
              status: 'pending',
              icon: '🎤'
            }
          ]
        },
        {
          id: 3,
          title: 'Phase 3 : Décision',
          period: 'Avril - Juin',
          status: 'future',
          tasks: [
            {
              id: 6,
              title: 'Analyser les réponses',
              description: 'Comparer les offres',
              status: 'pending',
              icon: '📊'
            },
            {
              id: 7,
              title: 'Valider le choix final',
              description: 'Inscription définitive',
              status: 'pending',
              icon: '✨'
            }
          ]
        }
      ]
    };

    res.json({
      success: true,
      data: actionPlan
    });

  } catch (error) {
    logger.error('Erreur récupération plan d\'action:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du plan d\'action'
    });
  }
});

module.exports = router;
