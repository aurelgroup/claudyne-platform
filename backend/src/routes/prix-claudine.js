/**
 * Routes Prix Claudine
 * Gestion des récompenses et classements nationaux
 */

const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const router = express.Router();

const logger = require('../utils/logger');
const { requireFamilyMembership, requireFamilyManager, authorize } = require('../middleware/auth');

// Initialisation des modèles
let PrixClaudine, Student, Family, User;

function initializeModels() {
  if (!PrixClaudine) {
    const models = require('../config/database').initializeModels();
    PrixClaudine = models.PrixClaudine;
    Student = models.Student;
    Family = models.Family;
    User = models.User;
  }
}

router.get('/', (req, res) => { res.json({ success: true, message: 'Prix Claudine API', endpoints: { leaderboard: '/api/prix-claudine/leaderboard' } }); });

/**
 * GET /api/prix-claudine/leaderboard
 * Récupération du classement Prix Claudine
 */
router.get('/leaderboard', [
  query('season').optional().isString(),
  query('category').optional().isIn(['MATERNELLE', 'PRIMAIRE', 'COLLEGE', 'LYCEE', 'ADULTE', 'FAMILLE', 'ETABLISSEMENT']),
  query('region').optional().isIn(['Centre', 'Littoral', 'Ouest', 'Sud-Ouest', 'Nord-Ouest', 'Nord', 'Extrême-Nord', 'Est', 'Sud', 'Adamaoua', 'DIASPORA']),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
], async (req, res) => {
  try {
    initializeModels();
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Paramètres invalides',
        errors: errors.array()
      });
    }
    
    const { season, category, region, limit = 20 } = req.query;

    // Feature not yet implemented - return empty leaderboard
    const leaderboard = [];
    
    // Enrichissement des données
    const enrichedLeaderboard = leaderboard.map((prix, index) => ({
      rank: index + 1,
      id: prix.id,
      title: prix.getDisplayTitle(),
      category: prix.getCategoryLabel(),
      points: prix.points,
      region: prix.region,
      city: prix.city,
      recipient: prix.student ? {
        id: prix.student.id,
        name: prix.student.getFullName(),
        avatar: prix.student.avatar,
        educationLevel: prix.student.educationLevel
      } : prix.family ? {
        id: prix.family.id,
        name: prix.family.displayName,
        studentsCount: prix.family.studentsCount
      } : null,
      testimonial: prix.testimonial,
      announcementDate: prix.announcementDate,
      photos: prix.photos?.slice(0, 3) || [], // Limite à 3 photos
      impactMetrics: prix.impactMetrics
    }));
    
    // Statistiques globales (simplified - removed non-existent columns)
    const stats = await Promise.all([
      PrixClaudine.count({ where: { season: season || PrixClaudine.getCurrentSeason() } }),
      PrixClaudine.findOne({
        where: { season: season || PrixClaudine.getCurrentSeason() },
        attributes: [[PrixClaudine.sequelize.fn('SUM', PrixClaudine.sequelize.col('points')), 'totalPoints']]
      }),
      Promise.resolve([]) // region column doesn't exist, return empty array
      /*PrixClaudine.findAll({
        where: { season: season || PrixClaudine.getCurrentSeason() },
        attributes: [
          'category',
          [PrixClaudine.sequelize.fn('COUNT', PrixClaudine.sequelize.col('id')), 'count']
        ],
        group: ['category'],
        order: [[PrixClaudine.sequelize.fn('COUNT', PrixClaudine.sequelize.col('id')), 'DESC']],
        limit: 5
      })*/
    ]);
    
    res.json({
      success: true,
      data: {
        leaderboard: enrichedLeaderboard,
        season: season || PrixClaudine.getCurrentSeason(),
        filters: { category, region, limit },
        stats: {
          totalWinners: stats[0],
          totalPoints: stats[1]?.dataValues?.totalPoints || 0,
          topRegions: stats[2].map(r => ({
            region: r.region,
            winnersCount: parseInt(r.dataValues.count)
          }))
        }
      }
    });
    
  } catch (error) {
    logger.error('Erreur récupération leaderboard Prix Claudine:', error);
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du classement'
    });
  }
});

/**
 * GET /api/prix-claudine/family-ranking
 * Classement spécifique aux familles
 */
router.get('/family-ranking', [
  query('season').optional().isString(),
  query('region').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt()
], async (req, res) => {
  try {
    initializeModels();
    
    const { season, region, limit = 10 } = req.query;
    
    const topFamilies = await PrixClaudine.getTopFamilies(season, limit);
    
    const familyRanking = topFamilies.map((prix, index) => ({
      rank: index + 1,
      family: {
        id: prix.family.id,
        name: prix.family.displayName,
        region: prix.family.region,
        city: prix.family.city,
        studentsCount: prix.family.students?.length || 0,
        totalClaudinePoints: prix.family.totalClaudinePoints
      },
      award: {
        id: prix.id,
        title: prix.getDisplayTitle(),
        points: prix.points,
        description: prix.description,
        testimonial: prix.testimonial,
        announcementDate: prix.announcementDate
      }
    }));
    
    res.json({
      success: true,
      data: {
        ranking: familyRanking,
        season: season || PrixClaudine.getCurrentSeason(),
        total: familyRanking.length
      }
    });
    
  } catch (error) {
    logger.error('Erreur récupération classement familles:', error);
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du classement des familles'
    });
  }
});

/**
 * GET /api/prix-claudine/my-awards
 * Prix Claudine de l'utilisateur/famille connectée
 */
router.get('/my-awards', requireFamilyMembership, async (req, res) => {
  try {
    initializeModels();
    
    const { familyId, userType } = req.user;
    
    // Récupération des prix de la famille (only fetch columns that actually exist)
    const familyAwards = await PrixClaudine.findAll({
      where: { familyId },
      attributes: ['id', 'studentId', 'familyId', 'season', 'rank', 'points', 'category', 'level', 'createdAt', 'awardedAt'],
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Student,
          as: 'student',
          required: false
        }
      ]
    });
    
    // Séparation entre prix individuels et familiaux
    const individualAwards = familyAwards.filter(award => award.studentId);
    const familyAwards_ = familyAwards.filter(award => !award.studentId);
    
    // Calcul des statistiques
    const totalPoints = familyAwards.reduce((sum, award) => sum + award.points, 0);
    const winnersCount = familyAwards.filter(award => award.status === 'WINNER').length;
    const currentSeasonAwards = familyAwards.filter(award => 
      award.season === PrixClaudine.getCurrentSeason()
    );
    
    res.json({
      success: true,
      data: {
        awards: {
          individual: individualAwards.map(award => ({
            id: award.id,
            title: award.getDisplayTitle(),
            category: award.getCategoryLabel(),
            status: award.status,
            points: award.points,
            rank: award.rank,
            student: award.student ? {
              id: award.student.id,
              name: award.student.getFullName(),
              avatar: award.student.avatar
            } : null,
            season: award.season,
            announcementDate: award.announcementDate,
            testimonial: award.testimonial
          })),
          family: familyAwards_.map(award => ({
            id: award.id,
            title: award.getDisplayTitle(),
            category: award.getCategoryLabel(),
            status: award.status,
            points: award.points,
            rank: award.rank,
            season: award.season,
            announcementDate: award.announcementDate,
            description: award.description,
            testimonial: award.testimonial
          }))
        },
        stats: {
          totalAwards: familyAwards.length,
          totalPoints,
          winnersCount,
          currentSeasonCount: currentSeasonAwards.length,
          bestRank: familyAwards.length > 0 ? Math.min(...familyAwards.filter(a => a.rank).map(a => a.rank)) : null
        }
      }
    });
    
  } catch (error) {
    logger.error('Erreur récupération prix utilisateur:', error);
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de vos prix'
    });
  }
});

/**
 * GET /api/prix-claudine/regional-stats
 * Statistiques régionales Prix Claudine
 */
router.get('/regional-stats', [
  query('season').optional().isString()
], async (req, res) => {
  try {
    initializeModels();
    
    const { season } = req.query;
    
    const regionalStats = await PrixClaudine.getRegionalStats(season);
    
    res.json({
      success: true,
      data: {
        regions: regionalStats.map(stat => ({
          region: stat.region,
          totalWinners: parseInt(stat.dataValues.totalWinners),
          totalPoints: parseInt(stat.dataValues.totalPoints),
          averagePoints: parseFloat(stat.dataValues.averagePoints).toFixed(1)
        })),
        season: season || PrixClaudine.getCurrentSeason()
      }
    });
    
  } catch (error) {
    logger.error('Erreur récupération statistiques régionales:', error);
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques régionales'
    });
  }
});

/**
 * POST /api/prix-claudine/nominate
 * Nomination pour un Prix Claudine
 */
router.post('/nominate', requireFamilyManager, [
  body('studentId').optional().isUUID(),
  body('awardType').isIn(['INDIVIDUAL_EXCELLENCE', 'FAMILY_ACHIEVEMENT', 'COMMUNITY_IMPACT', 'PERSEVERANCE', 'SOLIDARITY', 'CREATIVITY', 'LEADERSHIP', 'SPECIAL_MENTION']),
  body('category').isIn(['MATERNELLE', 'PRIMAIRE', 'COLLEGE', 'LYCEE', 'ADULTE', 'FAMILLE', 'ETABLISSEMENT']),
  body('title').trim().isLength({ min: 10, max: 200 }),
  body('description').trim().isLength({ min: 50, max: 2000 }),
  body('testimonial').optional().trim().isLength({ max: 1000 })
], async (req, res) => {
  try {
    initializeModels();
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }
    
    const { studentId, awardType, category, title, description, testimonial } = req.body;
    const { familyId } = req.user;
    
    // Vérification que l'étudiant appartient à la famille (si spécifié)
    if (studentId) {
      const student = await Student.findOne({
        where: { id: studentId, familyId }
      });
      
      if (!student) {
        return res.status(403).json({
          success: false,
          message: 'Étudiant non autorisé pour cette famille'
        });
      }
    }
    
    // Récupération des informations de la famille pour la région/ville
    const family = await Family.findByPk(familyId);
    
    // Création de la nomination
    const nomination = await PrixClaudine.createAward({
      studentId: studentId || null,
      familyId: awardType === 'FAMILY_ACHIEVEMENT' ? familyId : null,
      awardType,
      category,
      title,
      description,
      region: family.region,
      city: family.city
    });
    
    // Ajout du témoignage si fourni
    if (testimonial) {
      await nomination.update({ testimonial });
    }
    
    logger.logPrixClaudine('nomination_created', studentId, familyId, 0, {
      nominationId: nomination.id,
      awardType,
      category
    });
    
    res.status(201).json({
      success: true,
      message: 'Nomination pour le Prix Claudine soumise avec succès ! 🏆',
      data: {
        nomination: {
          id: nomination.id,
          title: nomination.getDisplayTitle(),
          category: nomination.getCategoryLabel(),
          status: nomination.status,
          season: nomination.season,
          nominationDate: nomination.nominationDate
        }
      }
    });
    
  } catch (error) {
    logger.error('Erreur nomination Prix Claudine:', error);
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la soumission de la nomination'
    });
  }
});

/**
 * GET /api/prix-claudine/certificate/:awardId
 * Génération de certificat Prix Claudine
 */
router.get('/certificate/:awardId', [
  param('awardId').isUUID()
], async (req, res) => {
  try {
    initializeModels();
    
    const { awardId } = req.params;
    
    const award = await PrixClaudine.findByPk(awardId, {
      include: [
        {
          model: Student,
          as: 'student',
          required: false
        },
        {
          model: Family,
          as: 'family',
          required: false
        }
      ]
    });
    
    if (!award) {
      return res.status(404).json({
        success: false,
        message: 'Prix Claudine non trouvé'
      });
    }
    
    // Vérification des permissions
    if (req.user.familyId !== award.familyId && !['ADMIN', 'MODERATOR'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à ce certificat'
      });
    }
    
    // Seuls les gagnants ont droit au certificat
    if (!award.isWinner()) {
      return res.status(400).json({
        success: false,
        message: 'Certificat disponible uniquement pour les gagnants'
      });
    }
    
    const certificateData = award.generateCertificateData();
    
    // TODO: Générer le PDF du certificat
    // Pour le moment, on retourne les données JSON
    
    res.json({
      success: true,
      data: {
        certificate: certificateData,
        downloadUrl: `/api/prix-claudine/certificate/${awardId}/pdf`,
        shareUrl: `/prix-claudine/certificate/${awardId}/share`
      }
    });
    
  } catch (error) {
    logger.error('Erreur génération certificat:', error);
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du certificat'
    });
  }
});

/**
 * GET /api/prix-claudine/inspiration-stories
 * Histoires inspirantes des lauréats
 */
router.get('/inspiration-stories', [
  query('limit').optional().isInt({ min: 1, max: 20 }).toInt(),
  query('region').optional().isString()
], async (req, res) => {
  try {
    initializeModels();
    
    const { limit = 10, region } = req.query;
    
    const where = {
      status: 'WINNER',
      inspirationStory: {
        [PrixClaudine.sequelize.Op.not]: null
      }
    };
    
    if (region) {
      where.region = region;
    }
    
    const stories = await PrixClaudine.findAll({
      where,
      order: [['announcementDate', 'DESC']],
      limit,
      include: [
        {
          model: Student,
          as: 'student',
          required: false,
          attributes: ['id', 'firstName', 'lastName', 'avatar', 'educationLevel']
        },
        {
          model: Family,
          as: 'family',
          required: false,
          attributes: ['id', 'displayName', 'region', 'city']
        }
      ]
    });
    
    const inspirationStories = stories.map(story => ({
      id: story.id,
      title: story.getDisplayTitle(),
      category: story.getCategoryLabel(),
      story: story.inspirationStory,
      testimonial: story.testimonial,
      photos: story.photos?.slice(0, 2) || [],
      region: story.region,
      city: story.city,
      points: story.points,
      recipient: story.student ? {
        name: story.student.getFullName(),
        avatar: story.student.avatar,
        level: story.student.educationLevel
      } : {
        name: story.family.displayName,
        region: story.family.region
      },
      announcementDate: story.announcementDate,
      impactMetrics: story.impactMetrics
    }));
    
    res.json({
      success: true,
      data: {
        stories: inspirationStories,
        total: inspirationStories.length
      }
    });
    
  } catch (error) {
    logger.error('Erreur récupération histoires inspirantes:', error);
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des histoires inspirantes'
    });
  }
});

// Routes administrateur
/**
 * POST /api/prix-claudine/admin/validate-winner
 * Validation d'un gagnant (admin seulement)
 */
router.post('/admin/validate-winner', authorize(['ADMIN', 'MODERATOR']), [
  body('awardId').isUUID(),
  body('rank').isInt({ min: 1 }),
  body('comments').optional().trim().isLength({ max: 1000 })
], async (req, res) => {
  try {
    initializeModels();
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }
    
    const { awardId, rank, comments } = req.body;
    const validatorName = req.user.getFullName();
    
    const award = await PrixClaudine.findByPk(awardId);
    
    if (!award) {
      return res.status(404).json({
        success: false,
        message: 'Prix non trouvé'
      });
    }
    
    // Mise à jour du rang et validation
    await award.update({ rank });
    const validatedAward = await PrixClaudine.validateWinner(awardId, validatorName, comments);
    
    logger.logPrixClaudine('winner_validated', award.studentId, award.familyId, validatedAward.points, {
      awardId,
      rank,
      validatorName
    });
    
    res.json({
      success: true,
      message: 'Gagnant validé avec succès ! 🎉',
      data: {
        award: {
          id: validatedAward.id,
          title: validatedAward.getDisplayTitle(),
          status: validatedAward.status,
          rank: validatedAward.getRankSuffix(),
          points: validatedAward.points,
          validatedBy: validatedAward.validatedBy,
          validatedAt: validatedAward.validatedAt
        }
      }
    });
    
  } catch (error) {
    logger.error('Erreur validation gagnant Prix Claudine:', error);
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la validation du gagnant'
    });
  }
});

module.exports = router;
