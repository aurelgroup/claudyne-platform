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
    // Empêcher la mise en cache (évite de servir des données périmées dans l'admin)
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const { Subject, Lesson, Resource } = req.models;

    // Compter les Subjects actifs
    const totalSubjects = await Subject.count({ where: { isActive: true } });

    // Compter les Lessons actives
    const totalLessons = await Lesson.count({ where: { isActive: true } });

    // Compter les Resources actives
    const totalResources = await Resource.count({ where: { isActive: true } }).catch(() => 0);

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

    // Récupérer les resources actives
    const resources = await Resource.findAll({
      where: { isActive: true },
      order: [['createdAt', 'DESC']],
      limit: 100
    }).catch(() => []);

    const formattedResources = resources.map(r => ({
      id: r.id,
      title: r.title,
      type: r.type,
      subject: r.subject,
      level: r.level,
      url: r.url,
      is_premium: r.is_premium,
      status: r.isActive ? 'active' : 'inactive',
      created_at: r.createdAt
    }));

    res.json({
      success: true,
      data: {
        subjects,
        courses: [], // Deprecated, utiliser /content/courses
        quizzes: [], // TODO
        resources: formattedResources,
        pendingContent: [],
        stats: {
          totalSubjects,
          totalCourses: totalLessons,
          totalQuizzes: 0,
          totalResources
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
// GET /content/subjects - Liste complète des matières
// ===============================
router.get('/content/subjects', async (req, res) => {
  try {
    // Empêcher la mise en cache
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const { Subject, Lesson } = req.models;

    // Récupérer TOUS les sujets avec leurs leçons et chapitres
    const allSubjects = await Subject.findAll({
      where: { isActive: true },
      include: [{
        model: Lesson,
        as: 'lessons',
        where: { isActive: true },
        required: false,
        attributes: ['id', 'title', 'chapterId']
      }],
      order: [
        ['category', 'ASC'],
        ['level', 'ASC'],
        ['title', 'ASC']
      ]
    });

    // Formater pour l'interface admin avec filtres
    const subjects = allSubjects.map(subject => {
      // Compter les chapitres uniques
      const uniqueChapters = new Set(
        subject.lessons
          .map(l => l.chapterId)
          .filter(ch => ch != null)
      );

      return {
        id: subject.id,
        title: subject.title,
        level: subject.level,
        category: subject.category,
        chapters: uniqueChapters.size || 0,
        lessons: subject.lessons.length || 0,
        description: subject.description || '',
        icon: subject.icon || ICONS[subject.category] || '📚',
        color: subject.color || COLORS[subject.category] || '#3B82F6',
        status: subject.isActive ? 'active' : 'inactive',
        createdAt: subject.createdAt,
        updatedAt: subject.updatedAt
      };
    });

    res.json({
      success: true,
      data: subjects,
      total: subjects.length
    });

  } catch (error) {
    logger.error('❌ Erreur GET /content/subjects:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des matières',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ===============================
// PUT /content/subjects/:subjectId - Modifier une matière
// ===============================
router.put('/content/subjects/:subjectId', async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { title, level, category, description, icon, color } = req.body;
    const { Subject } = req.models;

    // Trouver la matière
    const subject = await Subject.findByPk(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Matière introuvable'
      });
    }

    // Préparer les données de mise à jour
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (level !== undefined) updateData.level = level;
    if (category !== undefined) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (icon !== undefined) updateData.icon = icon;
    if (color !== undefined) updateData.color = color;

    // Mettre à jour
    await subject.update(updateData);

    logger.info(`✅ Matière modifiée: ${subject.title} (${subjectId})`);

    res.json({
      success: true,
      message: 'Matière modifiée avec succès',
      data: {
        id: subject.id,
        title: subject.title,
        level: subject.level,
        category: subject.category,
        description: subject.description,
        icon: subject.icon,
        color: subject.color
      }
    });

  } catch (error) {
    logger.error('❌ Erreur PUT /content/subjects/:subjectId:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification de la matière',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ===============================
// DELETE /content/subjects/:subjectId - Supprimer une matière
// ===============================
router.delete('/content/subjects/:subjectId', async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { Subject, Lesson, Progress } = req.models;

    // Trouver la matière
    const subject = await Subject.findByPk(subjectId, {
      include: [{
        model: Lesson,
        as: 'lessons'
      }]
    });

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Matière introuvable'
      });
    }

    // Vérifier s'il y a des leçons associées
    const lessonsCount = subject.lessons?.length || 0;

    if (lessonsCount > 0) {
      // Vérifier s'il y a des progrès d'étudiants
      const lessonIds = subject.lessons.map(l => l.id);
      const progressCount = await Progress.count({
        where: {
          lessonId: lessonIds
        }
      });

      if (progressCount > 0) {
        // Soft delete - désactiver au lieu de supprimer
        await subject.update({ isActive: false });
        logger.info(`⚠️ Matière désactivée (${progressCount} progrès étudiants): ${subject.title}`);

        return res.json({
          success: true,
          message: `Matière désactivée car ${progressCount} étudiant(s) l'ont commencée`,
          data: {
            action: 'deactivated',
            progressCount,
            lessonsCount
          }
        });
      }

      // Il y a des leçons mais pas de progrès - demander confirmation
      return res.status(400).json({
        success: false,
        message: `Cette matière contient ${lessonsCount} leçon(s). Êtes-vous sûr de vouloir la supprimer?`,
        data: {
          lessonsCount,
          requiresConfirmation: true
        }
      });
    }

    // Aucune leçon - suppression complète possible
    await subject.destroy();
    logger.info(`✅ Matière supprimée: ${subject.title} (${subjectId})`);

    res.json({
      success: true,
      message: 'Matière supprimée avec succès',
      data: {
        action: 'deleted',
        subjectId
      }
    });

  } catch (error) {
    logger.error('❌ Erreur DELETE /content/subjects/:subjectId:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la matière',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ===============================
// PUT /content/subjects/:subjectId/toggle - Activer/Désactiver une matière
// ===============================
router.put('/content/subjects/:subjectId/toggle', async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { Subject } = req.models;

    const subject = await Subject.findByPk(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Matière introuvable'
      });
    }

    // Inverser le statut
    const newStatus = !subject.isActive;
    await subject.update({ isActive: newStatus });

    logger.info(`✅ Matière ${newStatus ? 'activée' : 'désactivée'}: ${subject.title}`);

    res.json({
      success: true,
      message: `Matière ${newStatus ? 'activée' : 'désactivée'} avec succès`,
      data: {
        id: subject.id,
        title: subject.title,
        isActive: newStatus
      }
    });

  } catch (error) {
    logger.error('❌ Erreur PUT /content/subjects/:subjectId/toggle:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification du statut',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ===============================
// GET /content/:tab - Par onglet
// ===============================
router.get('/content/:tab', async (req, res) => {
  try {
    // Empêcher la mise en cache (évite de servir des données périmées dans l'admin)
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

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
        data: courses // ← Retourne directement le tableau
      });
    }

    if (tab === 'quizzes') {
      // Récupérer toutes les Lessons qui ont hasQuiz=true
      const quizLessons = await Lesson.findAll({
        where: { hasQuiz: true, isActive: true },
        include: [{
          model: Subject,
          as: 'subject',
          attributes: ['id', 'title', 'category', 'level']
        }],
        order: [['createdAt', 'DESC']]
      });

      // Formater pour compatibilité admin
      const quizzes = quizLessons.map(lesson => ({
        id: `QUIZ-${lesson.id}`,
        title: lesson.title,
        subject: lesson.subject?.category || 'mathematiques',
        level: LEVEL_MAPPING[lesson.subject?.level] || 'cp',
        description: lesson.description || '',
        duration: lesson.estimatedDuration || 20,
        passing_score: lesson.quiz?.passingScore || 60,
        questions: lesson.quiz?.questions || [],
        status: lesson.isActive ? 'active' : 'inactive',
        attempts: 0,
        averageScore: 0,
        created_at: lesson.createdAt,
        _lessonId: lesson.id
      }));

      return res.json({
        success: true,
        data: quizzes // ← Retourne directement le tableau
      });
    }

    if (tab === 'resources') {
      // Récupérer toutes les Resources
      const { Resource } = req.models;

      // S'assurer que la table existe
      try {
        await Resource.sync({ alter: false });
      } catch (syncError) {
        logger.warn('Table resources might not exist, creating it...', syncError.message);
        await Resource.sync({ force: false });
      }

      const resources = await Resource.findAll({
        where: { isActive: true },
        order: [['createdAt', 'DESC']]
      });

      // Formater pour compatibilité admin
      const formattedResources = resources.map(resource => ({
        id: resource.id,
        title: resource.title,
        type: resource.type,
        subject: resource.subject,
        level: resource.level,
        description: resource.description,
        url: resource.url,
        is_premium: resource.is_premium,
        created_by: resource.created_by,
        created_at: resource.createdAt,
        status: resource.isActive ? 'active' : 'inactive'
      }));

      return res.json({
        success: true,
        data: formattedResources // ← Retourne directement le tableau
      });
    }

    res.status(404).json({
      success: false,
      message: `Onglet ${tab} inconnu`
    });

  } catch (error) {
    logger.error(`Erreur GET /content/${req.params.tab}:`, error);

    // Si c'est resources qui pose problème, renvoyer un tableau vide plutôt qu'une erreur
    if (req.params.tab === 'resources') {
      return res.json({
        success: true,
        data: [], // ← Retourne directement un tableau vide
        warning: 'Table resources en cours de création'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors du chargement',
      error: error.message
    });
  }
});

// ===============================
// HELPER FUNCTIONS
// ===============================

// Helper to get next order number
async function getNextOrder(subjectId, Lesson) {
  const maxOrder = await Lesson.max('order', { where: { subjectId } });
  return (maxOrder || 0) + 1;
}

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

    // Parse content structure
    let lessonContent = {
      transcript: null,
      keyPoints: [],
      exercises: [],
      resources: [],
      downloadableFiles: [],
      videoUrl: null
    };

    // Backward compatibility: string → transcript
    if (typeof content === 'string') {
      lessonContent.transcript = content;
    } else if (content && typeof content === 'object') {
      lessonContent = {
        transcript: content.transcript || null,
        keyPoints: content.keyPoints || [],
        exercises: content.exercises || [],
        resources: content.resources || [],
        downloadableFiles: content.downloadableFiles || [],
        videoUrl: content.videoUrl || null
      };
    }

    const objectives = req.body.objectives || [];
    const prerequisites = req.body.prerequisites || [];

    // Créer la Lesson avec contenu structuré
    const lesson = await Lesson.create({
      id: uuidv4(),
      subjectId: subjectRecord.id,
      title,
      description: description || '',
      content: lessonContent, // ✅ JSONB structuré
      type: req.body.type || 'reading',
      estimatedDuration: parseInt(duration) || 45,
      difficulty: req.body.difficulty || 'Débutant',
      objectives: objectives,
      prerequisites: prerequisites,
      hasQuiz: false,
      order: await getNextOrder(subjectRecord.id, Lesson),
      reviewStatus: 'approved', // ✅ Approuvé automatiquement pour apparaître côté student
      isActive: true,
      isPremium: false
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
    const { title, transcript, estimatedDuration } = req.body;
    const { Lesson } = req.models;

    // Extraire lessonId du courseId (format: COURS-uuid)
    const lessonId = courseId.replace('COURS-', '');

    const lesson = await Lesson.findByPk(lessonId);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Leçon introuvable'
      });
    }

    // Préparer les données à mettre à jour
    const updateData = {};

    if (title) {
      updateData.title = title;
    }

    if (estimatedDuration !== undefined) {
      updateData.estimatedDuration = parseInt(estimatedDuration);
    }

    // Mettre à jour le contenu JSONB si transcript est fourni
    if (transcript !== undefined) {
      updateData.content = {
        ...lesson.content,
        transcript: transcript
      };
    }

    // Mettre à jour la leçon
    await lesson.update(updateData);

    res.json({
      success: true,
      message: 'Leçon modifiée avec succès',
      data: {
        lesson: {
          id: lesson.id,
          title: lesson.title,
          content: lesson.content,
          estimatedDuration: lesson.estimatedDuration
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
// POST /quizzes - Créer un quiz
// ===============================
router.post('/quizzes', async (req, res) => {
  try {
    const { title, subject, level, description, duration, passing_score, questions } = req.body;
    const { Subject, Lesson } = req.models;

    // Validation
    if (!title || !subject || !level || !questions || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Champs requis: title, subject, level, questions (minimum 1)'
      });


// ===============================
// GET /content/quizzes - Liste des quizzes
// ===============================
router.get('/content/quizzes', async (req, res) => {
  try {
    const { Subject, Lesson } = req.models;

    // Récupérer toutes les leçons avec quiz
    const quizzesData = await Lesson.findAll({
      where: {
        hasQuiz: true,
        isActive: true
      },
      include: [{
        model: Subject,
        as: 'subject',
        attributes: ['id', 'title', 'level', 'category']
      }],
      order: [['createdAt', 'DESC']]
    });

    // Formater les quizzes pour l'interface admin
    const quizzes = quizzesData.map(lesson => ({
      id: lesson.id,
      title: lesson.title,
      subject: lesson.subject?.category || 'Inconnu',
      level: lesson.subject?.level || '-',
      questions: lesson.quiz?.questions?.length || 0,
      attempts: 0, // À implémenter avec les stats
      averageScore: 0, // À implémenter avec les stats
      status: lesson.isActive ? 'active' : 'inactive',
      passingScore: lesson.quiz?.passingScore || 60,
      duration: lesson.estimatedDuration || 20,
      createdAt: lesson.createdAt
    }));

    res.json({
      success: true,
      data: quizzes,
      total: quizzes.length
    });

  } catch (error) {
    console.error('❌ Erreur GET /content/quizzes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des quizzes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

    }

    // Valider les questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question || !q.options || !q.correct_answer) {
        return res.status(400).json({
          success: false,
          message: `Question ${i + 1} incomplète (question, options, correct_answer requis)`
        });
      }
    }

    // Mapper niveau et catégorie
    const dbLevel = LEVEL_MAPPING[level.toLowerCase()] || level;
    const dbCategory = SUBJECT_MAPPING[subject.toLowerCase()] || 'Mathématiques';

    // Trouver ou créer le Subject
    let subjectRecord = await Subject.findOne({
      where: { level: dbLevel, category: dbCategory }
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
        estimatedDuration: parseInt(duration) || 20,
        isActive: true,
        isPremium: false,
        order: 0,
        prerequisites: [],
        cameroonCurriculum: { officialCode: null, ministerialRef: null, competencies: [] }
      });
    }

    // Calculer totalPoints
    const totalPoints = questions.reduce((sum, q) => sum + (q.points || 10), 0);

    // Créer la Lesson avec Quiz
    const lesson = await Lesson.create({
      subjectId: subjectRecord.id,
      title,
      description: description || '',
      type: 'quiz',
      duration: parseInt(duration) || 20,
      difficulty: 'Intermédiaire',
      order: 1,
      hasQuiz: true,
      quiz: {
        title,
        questions: questions.map((q, idx) => ({
          id: idx + 1,
          question: q.question,
          type: q.type || 'multiple_choice',
          options: q.options,
          correctAnswer: q.correct_answer,
          points: q.points || 10,
          explanation: q.explanation || ''
        })),
        totalPoints,
        passingScore: parseInt(passing_score) || 60,
        timeLimit: parseInt(duration) || 20,
        maxAttempts: null
      },
      isActive: true,
      isPremium: false,
      content: { keyPoints: [], exercises: [], resources: [] },
      objectives: [],
      prerequisites: []
    });

    res.json({
      success: true,
      message: 'Quiz créé avec succès',
      data: {
        quiz: {
          id: `QUIZ-${lesson.id}`,
          title: lesson.title,
          subject: subject.toLowerCase(),
          level: level.toLowerCase(),
          description: lesson.description,
          duration: lesson.duration,
          passing_score: lesson.quiz.passingScore,
          questions: lesson.quiz.questions,
          status: 'active',
          created_at: lesson.createdAt
        }
      }
    });

  } catch (error) {
    logger.error('Erreur POST /quizzes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du quiz',
      error: error.message
    });
  }
});

// ===============================
// PUT /content/quizzes/:quizId/toggle - Toggle status quiz
// ===============================
router.put('/content/quizzes/:quizId/toggle', async (req, res) => {
  try {
    const { quizId } = req.params;
    const { Lesson } = req.models;

    const lessonId = quizId.replace('QUIZ-', '');
    const lesson = await Lesson.findByPk(lessonId);

    if (!lesson || !lesson.hasQuiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz introuvable'
      });
    }

    await lesson.update({
      isActive: !lesson.isActive
    });

    res.json({
      success: true,
      message: 'Statut du quiz modifié',
      data: {
        quiz: {
          id: quizId,
          status: lesson.isActive ? 'active' : 'inactive'
        }
      }
    });

  } catch (error) {
    logger.error('Erreur PUT /content/quizzes/:quizId/toggle:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de statut',
      error: error.message
    });
  }
});

// ===============================
// POST /resources - Créer une ressource
// ===============================
router.post('/resources', async (req, res) => {
  try {
    const { title, type, subject, level, description, url, is_premium, created_by } = req.body;
    const { Resource } = req.models;

    // Validation
    if (!title || !type || !subject || !level || !url) {
      return res.status(400).json({
        success: false,
        message: 'Champs requis: title, type, subject, level, url'
      });
    }

    // Créer la resource
    const resource = await Resource.create({
      title,
      type,
      subject: subject.toLowerCase(),
      level: level.toLowerCase(),
      description: description || '',
      url,
      is_premium: !!is_premium,
      created_by: created_by || req.user?.email,
      isActive: true,
      metadata: {}
    });

    res.json({
      success: true,
      message: 'Ressource ajoutée avec succès',
      data: {
        resource: {
          id: resource.id,
          title: resource.title,
          type: resource.type,
          subject: resource.subject,
          level: resource.level,
          description: resource.description,
          url: resource.url,
          is_premium: resource.is_premium,
          created_at: resource.createdAt
        }
      }
    });

  } catch (error) {
    logger.error('Erreur POST /resources:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la ressource',
      error: error.message
    });
  }
});

// ===============================
// PUT /resources/:id - Modifier une ressource
// ===============================
router.put('/resources/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, type, subject, level, description, url, is_premium } = req.body;
    const { Resource } = req.models;

    // Validation
    if (!title || !type || !subject || !level || !url) {
      return res.status(400).json({
        success: false,
        message: 'Champs requis: title, type, subject, level, url'
      });
    }

    // Trouver la ressource
    const resource = await Resource.findByPk(id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Ressource non trouvée'
      });
    }

    // Mettre à jour
    await resource.update({
      title,
      type,
      subject: subject.toLowerCase(),
      level: level.toLowerCase(),
      description: description || '',
      url,
      is_premium: !!is_premium
    });

    res.json({
      success: true,
      message: 'Ressource modifiée avec succès',
      data: {
        resource: {
          id: resource.id,
          title: resource.title,
          type: resource.type,
          subject: resource.subject,
          level: resource.level,
          description: resource.description,
          url: resource.url,
          is_premium: resource.is_premium,
          updated_at: resource.updatedAt
        }
      }
    });

  } catch (error) {
    logger.error('Erreur PUT /resources/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification de la ressource',
      error: error.message
    });
  }
});

// ===============================
// GET /content/all-lessons - Récupérer toutes les leçons pour l'admin
// ===============================
router.get('/content/all-lessons', async (req, res) => {
  try {
    const { Subject, Lesson } = req.models;

    // Récupérer toutes les leçons avec leur subject
    const lessons = await Lesson.findAll({
      include: [{
        model: Subject,
        as: 'subject',
        attributes: ['id', 'title', 'level', 'category', 'icon', 'color']
      }],
      order: [['createdAt', 'DESC']]
    });

    // Formater les données pour l'admin
    const formattedLessons = lessons.map(lesson => ({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      content: lesson.content,
      estimatedDuration: lesson.estimatedDuration,
      isActive: lesson.isActive,
      isPremium: lesson.isPremium,
      hasQuiz: lesson.hasQuiz,
      type: lesson.type,
      order: lesson.order,
      difficulty: lesson.difficulty,
      subjectId: lesson.subjectId,
      subjectTitle: lesson.subject?.title || 'N/A',
      level: lesson.subject?.level || 'N/A',
      category: lesson.subject?.category || 'N/A',
      icon: lesson.subject?.icon || '📚',
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt
    }));

    res.json({
      success: true,
      count: formattedLessons.length,
      lessons: formattedLessons
    });

  } catch (error) {
    logger.error('Erreur GET /content/all-lessons:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des leçons',
      error: error.message
    });
  }
});

// ===============================
// DELETE /content/courses/:courseId - Supprimer une leçon
// ===============================
router.delete('/content/courses/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { Lesson, Progress } = req.models;

    // Extraire lessonId du courseId (format: COURS-uuid)
    const lessonId = courseId.replace('COURS-', '');

    const lesson = await Lesson.findByPk(lessonId);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Leçon introuvable'
      });
    }

    // Vérifier s'il y a des progrès étudiants liés à cette leçon
    const progressCount = await Progress.count({
      where: { lessonId: lessonId }
    });

    if (progressCount > 0) {
      // Si des étudiants ont commencé cette leçon, on la désactive au lieu de la supprimer
      await lesson.update({ isActive: false });

      return res.json({
        success: true,
        message: `Leçon désactivée (${progressCount} étudiants l'ont commencée). Pour supprimer définitivement, supprimez d'abord les progrès étudiants.`,
        data: {
          action: 'deactivated',
          progressCount
        }
      });
    }

    // Si aucun progrès, on peut supprimer en toute sécurité
    await lesson.destroy();

    logger.info(`Leçon ${lessonId} supprimée`, {
      title: lesson.title,
      admin: req.user?.email || 'unknown'
    });

    res.json({
      success: true,
      message: 'Leçon supprimée avec succès',
      data: {
        action: 'deleted',
        lessonId
      }
    });

  } catch (error) {
    logger.error('Erreur DELETE /content/courses/:courseId:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression',
      error: error.message
    });
  }
});

module.exports = router;
