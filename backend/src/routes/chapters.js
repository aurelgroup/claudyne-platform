/**
 * Routes API pour les Chapitres - Claudyne Backend
 * Gestion de l'architecture pédagogique: Subject → Chapter → Lesson
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Middleware pour initialiser models
router.use(async (req, res, next) => {
  if (!req.models) {
    const database = require('../config/database');
    req.models = database.initializeModels();
  }
  next();
});

// ===============================
// GET /api/chapters - Liste tous les chapitres
// ===============================
router.get('/', async (req, res) => {
  try {
    const { Chapter, Subject, Lesson } = req.models;
    const { subjectId, trimester, series, includeLessons } = req.query;

    const where = { isActive: true };

    // Filtres optionnels
    if (subjectId) where.subjectId = subjectId;
    if (trimester) where.trimester = parseInt(trimester);
    if (series) {
      where.series = {
        [Chapter.sequelize.Sequelize.Op.contains]: [series]
      };
    }

    const include = [];

    // Include Subject (optionnel)
    include.push({
      model: Subject,
      as: 'subject',
      attributes: ['id', 'title', 'level', 'category', 'icon', 'color']
    });

    // Include Lessons (optionnel)
    if (includeLessons === 'true') {
      include.push({
        model: Lesson,
        as: 'lessons',
        where: { isActive: true, reviewStatus: 'approved' },
        required: false,
        attributes: ['id', 'title', 'description', 'type', 'estimatedDuration', 'order', 'hasQuiz', 'isPremium']
      });
    }

    const chapters = await Chapter.findAll({
      where,
      include,
      order: [
        ['order', 'ASC'],
        ['number', 'ASC'],
        ...(includeLessons === 'true' ? [[{ model: Lesson, as: 'lessons' }, 'order', 'ASC']] : [])
      ]
    });

    res.json({
      success: true,
      data: chapters,
      count: chapters.length
    });

  } catch (error) {
    logger.error('Erreur GET /api/chapters:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des chapitres',
      error: error.message
    });
  }
});

// ===============================
// GET /api/chapters/:id - Détail d'un chapitre
// ===============================
router.get('/:id', async (req, res) => {
  try {
    const { Chapter, Subject, Lesson } = req.models;
    const { includeLessons } = req.query;

    const include = [{
      model: Subject,
      as: 'subject',
      attributes: ['id', 'title', 'level', 'category', 'icon', 'color']
    }];

    if (includeLessons === 'true') {
      include.push({
        model: Lesson,
        as: 'lessons',
        where: { isActive: true, reviewStatus: 'approved' },
        required: false,
        order: [['order', 'ASC']]
      });
    }

    const chapter = await Chapter.findByPk(req.params.id, {
      include
    });

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapitre non trouvé'
      });
    }

    res.json({
      success: true,
      data: chapter
    });

  } catch (error) {
    logger.error(`Erreur GET /api/chapters/${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du chapitre',
      error: error.message
    });
  }
});

// ===============================
// GET /api/subjects/:subjectId/chapters - Chapitres d'une matière
// ===============================
router.get('/subject/:subjectId', async (req, res) => {
  try {
    const { Chapter, Lesson } = req.models;
    const { subjectId } = req.params;
    const { trimester, series, includeLessons } = req.query;

    const where = {
      subjectId,
      isActive: true
    };

    if (trimester) where.trimester = parseInt(trimester);
    if (series) {
      where.series = {
        [Chapter.sequelize.Sequelize.Op.contains]: [series]
      };
    }

    const include = [];

    if (includeLessons === 'true') {
      include.push({
        model: Lesson,
        as: 'lessons',
        where: { isActive: true, reviewStatus: 'approved' },
        required: false,
        attributes: ['id', 'title', 'description', 'type', 'estimatedDuration', 'order', 'hasQuiz', 'isPremium', 'content', 'objectives']
      });
    }

    const chapters = await Chapter.findAll({
      where,
      include,
      order: [
        ['order', 'ASC'],
        ['number', 'ASC'],
        ...(includeLessons === 'true' ? [[{ model: Lesson, as: 'lessons' }, 'order', 'ASC']] : [])
      ]
    });

    res.json({
      success: true,
      data: chapters,
      count: chapters.length
    });

  } catch (error) {
    logger.error(`Erreur GET /api/subjects/${req.params.subjectId}/chapters:`, error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des chapitres',
      error: error.message
    });
  }
});

// ===============================
// POST /api/admin/chapters - Créer un chapitre (ADMIN)
// ===============================
router.post('/admin/chapters', async (req, res) => {
  try {
    if (!req.user || req.user.userType !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé - Admin requis'
      });
    }

    const { Chapter } = req.models;
    const {
      subjectId,
      title,
      description,
      number,
      trimester,
      series,
      objectives,
      prerequisites,
      competencies,
      estimatedDuration,
      difficulty,
      officialReference,
      isPremium
    } = req.body;

    // Validation
    if (!subjectId || !title || !number) {
      return res.status(400).json({
        success: false,
        message: 'Champs requis manquants: subjectId, title, number'
      });
    }

    // Vérifier que le numéro n'existe pas déjà pour cette matière
    const existing = await Chapter.findOne({
      where: {
        subjectId,
        number,
        deletedAt: null
      }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Un chapitre numéro ${number} existe déjà pour cette matière`
      });
    }

    // Créer le chapitre
    const chapter = await Chapter.create({
      subjectId,
      title,
      description: description || '',
      number,
      trimester: trimester || null,
      series: series || [],
      objectives: objectives || [],
      prerequisites: prerequisites || [],
      competencies: competencies || [],
      estimatedDuration: estimatedDuration || null,
      difficulty: difficulty || 'Intermédiaire',
      officialReference: officialReference || {},
      isPremium: isPremium || false,
      isActive: true,
      createdBy: req.user.email || req.user.id
    });

    logger.info(`✅ Chapitre créé: ${chapter.title} (${chapter.id}) par ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Chapitre créé avec succès',
      data: chapter
    });

  } catch (error) {
    logger.error('Erreur POST /api/admin/chapters:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du chapitre',
      error: error.message
    });
  }
});

// ===============================
// PUT /api/admin/chapters/:id - Modifier un chapitre (ADMIN)
// ===============================
router.put('/admin/chapters/:id', async (req, res) => {
  try {
    if (!req.user || req.user.userType !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé - Admin requis'
      });
    }

    const { Chapter } = req.models;
    const chapter = await Chapter.findByPk(req.params.id);

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapitre non trouvé'
      });
    }

    // Mise à jour
    const {
      title,
      description,
      number,
      order,
      trimester,
      series,
      objectives,
      prerequisites,
      competencies,
      estimatedDuration,
      difficulty,
      officialReference,
      isPremium,
      isActive
    } = req.body;

    // Vérifier unicité du number si modifié
    if (number && number !== chapter.number) {
      const existing = await Chapter.findOne({
        where: {
          subjectId: chapter.subjectId,
          number,
          id: { [Chapter.sequelize.Sequelize.Op.ne]: chapter.id }
        }
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: `Un chapitre numéro ${number} existe déjà pour cette matière`
        });
      }
    }

    await chapter.update({
      title: title !== undefined ? title : chapter.title,
      description: description !== undefined ? description : chapter.description,
      number: number !== undefined ? number : chapter.number,
      order: order !== undefined ? order : chapter.order,
      trimester: trimester !== undefined ? trimester : chapter.trimester,
      series: series !== undefined ? series : chapter.series,
      objectives: objectives !== undefined ? objectives : chapter.objectives,
      prerequisites: prerequisites !== undefined ? prerequisites : chapter.prerequisites,
      competencies: competencies !== undefined ? competencies : chapter.competencies,
      estimatedDuration: estimatedDuration !== undefined ? estimatedDuration : chapter.estimatedDuration,
      difficulty: difficulty !== undefined ? difficulty : chapter.difficulty,
      officialReference: officialReference !== undefined ? officialReference : chapter.officialReference,
      isPremium: isPremium !== undefined ? isPremium : chapter.isPremium,
      isActive: isActive !== undefined ? isActive : chapter.isActive,
      lastUpdatedBy: req.user.email || req.user.id
    });

    logger.info(`✅ Chapitre modifié: ${chapter.title} (${chapter.id}) par ${req.user.email}`);

    res.json({
      success: true,
      message: 'Chapitre modifié avec succès',
      data: chapter
    });

  } catch (error) {
    logger.error(`Erreur PUT /api/admin/chapters/${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification du chapitre',
      error: error.message
    });
  }
});

// ===============================
// DELETE /api/admin/chapters/:id - Supprimer un chapitre (ADMIN)
// ===============================
router.delete('/admin/chapters/:id', async (req, res) => {
  try {
    if (!req.user || req.user.userType !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé - Admin requis'
      });
    }

    const { Chapter } = req.models;
    const chapter = await Chapter.findByPk(req.params.id);

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapitre non trouvé'
      });
    }

    // Soft delete (paranoid: true)
    await chapter.destroy();

    logger.info(`🗑️  Chapitre supprimé: ${chapter.title} (${chapter.id}) par ${req.user.email}`);

    res.json({
      success: true,
      message: 'Chapitre supprimé avec succès'
    });

  } catch (error) {
    logger.error(`Erreur DELETE /api/admin/chapters/${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du chapitre',
      error: error.message
    });
  }
});

// ===============================
// GET /api/chapters/:id/progress - Progression d'un chapitre pour un étudiant
// ===============================
router.get('/:id/progress', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const { Chapter, Student, Progress, Lesson } = req.models;
    const chapter = await Chapter.findByPk(req.params.id);

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapitre non trouvé'
      });
    }

    // Trouver l'étudiant
    let studentId = null;
    if (req.user.studentProfile) {
      studentId = req.user.studentProfile.id;
    } else if (req.user.userType === 'MANAGER' && req.user.familyId) {
      const student = await Student.findOne({
        where: { familyId: req.user.familyId }
      });
      if (student) studentId = student.id;
    } else {
      const student = await Student.findOne({
        where: { userId: req.user.id }
      });
      if (student) studentId = student.id;
    }

    if (!studentId) {
      return res.json({
        success: true,
        data: {
          total: 0,
          completed: 0,
          percentage: 0
        }
      });
    }

    // Calculer la progression
    const progress = await chapter.getProgress(studentId);

    res.json({
      success: true,
      data: progress
    });

  } catch (error) {
    logger.error(`Erreur GET /api/chapters/${req.params.id}/progress:`, error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la progression',
      error: error.message
    });
  }
});

// ===============================
// PUT /api/admin/chapters/:id/reorder - Réorganiser l'ordre (ADMIN)
// ===============================
router.put('/admin/chapters/:id/reorder', async (req, res) => {
  try {
    if (!req.user || req.user.userType !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé - Admin requis'
      });
    }

    const { Chapter } = req.models;
    const { newOrder } = req.body;

    if (typeof newOrder !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'newOrder doit être un nombre'
      });
    }

    const chapter = await Chapter.findByPk(req.params.id);

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapitre non trouvé'
      });
    }

    await chapter.update({
      order: newOrder,
      lastUpdatedBy: req.user.email || req.user.id
    });

    logger.info(`🔄 Ordre du chapitre modifié: ${chapter.title} → ordre ${newOrder}`);

    res.json({
      success: true,
      message: 'Ordre modifié avec succès',
      data: chapter
    });

  } catch (error) {
    logger.error(`Erreur PUT /api/admin/chapters/${req.params.id}/reorder:`, error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la réorganisation',
      error: error.message
    });
  }
});

module.exports = router;
