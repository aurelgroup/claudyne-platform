/**
 * Routes de gestion du contenu pédagogique (Cours/Quiz/Ressources)
 * VERSION POSTGRESQL - Migration depuis JSON
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

// Middleware pour initialiser les modèles
router.use(async (req, res, next) => {
  if (!req.models) {
    const database = require('../config/database');
    req.models = database.initializeModels();
  }
  next();
});

// Mapping niveaux JSON -> PostgreSQL
const LEVEL_MAPPING = {
  'cp': 'CP', 'ce1': 'CE1', 'ce2': 'CE2', 'cm1': 'CM1', 'cm2': 'CM2',
  '6eme': '6ème', '5eme': '5ème', '4eme': '4ème', '3eme': '3ème',
  '2nde': '2nde', '1ere': '1ère', 'terminale': 'Tle'
};

// Mapping matières JSON -> catégories PostgreSQL
const SUBJECT_MAPPING = {
  'mathematiques': 'Mathématiques',
  'physique': 'Sciences',
  'chimie': 'Sciences',
  'svt': 'Sciences',
  'francais': 'Français',
  'anglais': 'Langues',
  'espagnol': 'Langues',
  'allemand': 'Langues',
  'histoire': 'Histoire-Géographie',
  'geographie': 'Histoire-Géographie',
  'philosophie': 'Français',
  'informatique': 'Informatique',
  'eps': 'Sport',
  'arts': 'Arts'
};

// Icônes par catégorie
const ICONS = {
  'Mathématiques': '📐',
  'Sciences': '🔬',
  'Français': '📚',
  'Langues': '🌍',
  'Histoire-Géographie': '🗺️',
  'Informatique': '💻',
  'Sport': '⚽',
  'Arts': '🎨'
};

// Couleurs par catégorie
const COLORS = {
  'Mathématiques': '#3B82F6',
  'Sciences': '#10B981',
  'Français': '#F59E0B',
  'Langues': '#8B5CF6',
  'Histoire-Géographie': '#EF4444',
  'Informatique': '#06B6D4',
  'Sport': '#84CC16',
  'Arts': '#EC4899'
};

// ===============================
// GET /content - Vue d'ensemble
// ===============================
router.get('/content', async (req, res) => {
  try {
    const { Subject, Lesson } = req.models;

    // Compter les Subjects actifs
    const totalSubjects = await Subject.count({ where: { isActive: true } });

    // Compter les Lessons actives
    const totalLessons = await Lesson.count({ where: { isActive: true } });

    // Agréger les "subjects" pour compatibilité admin
    const subjectGroups = await Subject.findAll({
      attributes: [
        'category',
        [Subject.sequelize.fn('COUNT', Subject.sequelize.col('id')), 'lessons']
      ],
      where: { isActive: true },
      group: ['category'],
      raw: true
    });

    const subjects = subjectGroups.map(sg => ({
      id: sg.category.toLowerCase(),
      title: sg.category,
      lessons: parseInt(sg.lessons) || 0,
      quizzes: 0, // TODO: implémenter Quiz
      students: 0,
      averageScore: 0,
      status: 'active'
    }));

    res.json({
      success: true,
      data: {
        subjects,
        courses: [], // Deprecated, utiliser /content/courses
        quizzes: [], // TODO
        resources: [], // TODO
        pendingContent: [],
        stats: {
          totalSubjects,
          totalCourses: totalLessons,
          totalQuizzes: 0,
          totalResources: 0
        }
      }
    });

  } catch (error) {
    logger.error('Erreur GET /content:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du chargement du contenu',
      error: error.message
    });
  }
});

// ===============================
// GET /content/:tab - Par onglet
// ===============================
router.get('/content/:tab', async (req, res) => {
  try {
    const { tab } = req.params;
    const { Subject, Lesson } = req.models;

    if (tab === 'courses') {
      // Récupérer tous les Subjects avec leurs Lessons
      const subjects = await Subject.findAll({
        where: { isActive: true },
        include: [{
          model: Lesson,
          as: 'lessons',
          where: { isActive: true },
          required: false
        }],
        order: [['level', 'ASC'], ['title', 'ASC']]
      });

      // Formater pour compatibilité avec l'interface admin
      const courses = subjects.flatMap(subject =>
        subject.lessons.map(lesson => ({
          id: `COURS-${lesson.id}`,
          title: lesson.title,
          subject: subject.category.toLowerCase(),
          level: Object.keys(LEVEL_MAPPING).find(k => LEVEL_MAPPING[k] === subject.level) || subject.level,
          description: lesson.content || subject.description || '',
          content: lesson.content || '',
          duration: lesson.duration || 45,
          status: lesson.isActive ? 'active' : 'inactive',
          students: 0,
          averageScore: 0,
          created_by: 'admin',
          created_at: lesson.createdAt,
          updated_at: lesson.updatedAt,
          _subjectId: subject.id,
          _lessonId: lesson.id
        }))
      );

      return res.json({
        success: true,
        data: { courses }
      });
    }

    if (tab === 'quizzes') {
      // TODO: Implémenter Quiz
      return res.json({
        success: true,
        data: { quizzes: [] }
      });
    }

    if (tab === 'resources') {
      // TODO: Implémenter Resources
      return res.json({
        success: true,
        data: { resources: [] }
      });
    }

    res.status(404).json({
      success: false,
      message: `Onglet ${tab} inconnu`
    });

  } catch (error) {
    logger.error(`Erreur GET /content/${req.params.tab}:`, error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du chargement',
      error: error.message
    });
  }
});

// ===============================
// POST /courses - Créer un cours
// ===============================
router.post('/courses', async (req, res) => {
  try {
    const { title, subject, level, description, content, duration } = req.body;
    const { Subject, Lesson } = req.models;

    // Validation
    if (!title || !subject || !level) {
      return res.status(400).json({
        success: false,
        message: 'Champs requis: title, subject, level'
      });
    }

    // Mapper niveau et catégorie
    const dbLevel = LEVEL_MAPPING[level.toLowerCase()] || level;
    const dbCategory = SUBJECT_MAPPING[subject.toLowerCase()] || 'Mathématiques';

    // Trouver ou créer le Subject
    let subjectRecord = await Subject.findOne({
      where: {
        level: dbLevel,
        category: dbCategory
      }
    });

    if (!subjectRecord) {
      subjectRecord = await Subject.create({
        id: uuidv4(),
        title: `${dbCategory} ${dbLevel}`,
        description: '',
        level: dbLevel,
        category: dbCategory,
        icon: ICONS[dbCategory] || '📚',
        color: COLORS[dbCategory] || '#3B82F6',
        difficulty: 'Intermédiaire',
        estimatedDuration: parseInt(duration) || 45,
        isActive: true,
        isPremium: false,
        order: 0,
        prerequisites: [],
        cameroonCurriculum: {
          officialCode: null,
          ministerialRef: null,
          competencies: []
        }
      });
    }

    // Créer la Lesson
    const lesson = await Lesson.create({
      id: uuidv4(),
      subjectId: subjectRecord.id,
      title,
      content: content || description || '',
      type: 'theory',
      duration: parseInt(duration) || 45,
      difficulty: 'Intermédiaire',
      order: 1,
      isActive: true,
      isPremium: false,
      prerequisites: [],
      resources: []
    });

    res.json({
      success: true,
      message: 'Cours créé avec succès',
      data: {
        course: {
          id: `COURS-${lesson.id}`,
          title: lesson.title,
          subject: subject.toLowerCase(),
          level: level.toLowerCase(),
          description: lesson.content,
          content: lesson.content,
          duration: lesson.duration,
          status: 'active',
          created_at: lesson.createdAt
        }
      }
    });

  } catch (error) {
    logger.error('Erreur POST /courses:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du cours',
      error: error.message
    });
  }
});

// ===============================
// PUT /courses/:courseId - Modifier un cours
// ===============================
router.put('/courses/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, content, duration, level, subject } = req.body;
    const { Lesson, Subject } = req.models;

    // Extraire lessonId du courseId (format: COURS-uuid)
    const lessonId = courseId.replace('COURS-', '');

    const lesson = await Lesson.findByPk(lessonId);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Cours introuvable'
      });
    }

    // Mettre à jour la Lesson
    await lesson.update({
      title: title || lesson.title,
      content: content || description || lesson.content,
      duration: duration ? parseInt(duration) : lesson.duration
    });

    res.json({
      success: true,
      message: 'Cours modifié avec succès',
      data: {
        course: {
          id: courseId,
          title: lesson.title,
          description: lesson.content,
          content: lesson.content,
          duration: lesson.duration
        }
      }
    });

  } catch (error) {
    logger.error('Erreur PUT /courses/:courseId:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification',
      error: error.message
    });
  }
});

// ===============================
// PUT /content/courses/:courseId/toggle - Toggle status
// ===============================
router.put('/content/courses/:courseId/toggle', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { Lesson } = req.models;

    const lessonId = courseId.replace('COURS-', '');
    const lesson = await Lesson.findByPk(lessonId);

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Cours introuvable'
      });
    }

    await lesson.update({
      isActive: !lesson.isActive
    });

    res.json({
      success: true,
      message: 'Statut modifié',
      data: {
        newStatus: lesson.isActive ? 'active' : 'inactive'
      }
    });

  } catch (error) {
    logger.error('Erreur PUT /content/courses/:courseId/toggle:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de statut',
      error: error.message
    });
  }
});

// ===============================
// POST /quizzes - Créer un quiz (TODO)
// ===============================
router.post('/quizzes', async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Fonction Quiz non encore implémentée en PostgreSQL'
  });
});

// ===============================
// PUT /content/quizzes/:quizId/toggle (TODO)
// ===============================
router.put('/content/quizzes/:quizId/toggle', async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Fonction Quiz non encore implémentée en PostgreSQL'
  });
});

// ===============================
// POST /resources - Créer une ressource (TODO)
// ===============================
router.post('/resources', async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Fonction Resources non encore implémentée en PostgreSQL'
  });
});

module.exports = router;
