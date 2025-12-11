/**
 * Routes de gestion du contenu pédagogique (Cours/Quiz/Ressources)
 * Système de persistence JSON pour content-store.json
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const contentStoreFile = path.join(__dirname, '../../content-store.json');

const SUBJECT_LABELS = {
  mathematiques: 'Mathématiques',
  physique: 'Physique',
  chimie: 'Chimie',
  biologie: 'Biologie',
  francais: 'Français',
  anglais: 'Anglais',
  histoire: 'Histoire',
  geographie: 'Géographie',
  informatique: 'Informatique'
};

const ensureContentStore = () => {
  try {
    if (!fs.existsSync(contentStoreFile)) {
      const initial = {
        subjects: [],
        courses: [],
        quizzes: [],
        resources: [],
        pendingContent: []
      };
      fs.writeFileSync(contentStoreFile, JSON.stringify(initial, null, 2), 'utf8');
    }
  } catch (error) {
    logger.error('Impossible d\'initialiser le fichier de contenus:', error);
  }
};

const loadContentStore = () => {
  ensureContentStore();
  try {
    const data = fs.readFileSync(contentStoreFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    logger.error('Erreur lecture content-store.json:', error);
    return { subjects: [], courses: [], quizzes: [], resources: [], pendingContent: [] };
  }
};

const saveContentStore = (store) => {
  try {
    fs.writeFileSync(contentStoreFile, JSON.stringify(store, null, 2), 'utf8');
  } catch (error) {
    logger.error('Erreur sauvegarde content-store.json:', error);
  }
};

const getSubjectLabel = (subjectId) => SUBJECT_LABELS[subjectId] || subjectId || 'Matière';

const refreshSubjectAggregates = (store) => {
  const subjectIndex = {};

  store.courses.forEach((course) => {
    const id = course.subject || 'autre';
    if (!subjectIndex[id]) {
      subjectIndex[id] = {
        id,
        title: getSubjectLabel(id),
        lessons: 0,
        quizzes: 0,
        students: 0,
        averageScore: 0,
        status: 'active'
      };
    }
    subjectIndex[id].lessons++;
  });

  store.quizzes.forEach((quiz) => {
    const id = quiz.subject || 'autre';
    if (!subjectIndex[id]) {
      subjectIndex[id] = {
        id,
        title: getSubjectLabel(id),
        lessons: 0,
        quizzes: 0,
        students: 0,
        averageScore: 0,
        status: 'active'
      };
    }
    subjectIndex[id].quizzes++;
  });

  return Object.values(subjectIndex);
};

// GET /api/admin/content - Récupérer tout le contenu
router.get('/content', async (req, res) => {
  try {
    const store = loadContentStore();
    const subjects = refreshSubjectAggregates(store);

    res.json({
      success: true,
      data: {
        subjects,
        courses: store.courses,
        quizzes: store.quizzes,
        resources: store.resources,
        pendingContent: store.pendingContent || []
      }
    });
  } catch (error) {
    logger.error('Erreur récupération contenu:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du contenu',
      error: error.message
    });
  }
});

// GET /api/admin/content/:tab - Récupérer un type de contenu spécifique
router.get('/content/:tab', async (req, res) => {
  try {
    const { tab } = req.params;
    const store = loadContentStore();

    const allowed = {
      courses: store.courses,
      quizzes: store.quizzes,
      resources: store.resources
    };

    if (allowed[tab] !== undefined) {
      res.json({ success: true, data: allowed[tab] });
    } else {
      res.status(404).json({ success: false, message: 'Tab inconnu' });
    }
  } catch (error) {
    logger.error('Erreur récupération contenu:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du contenu'
    });
  }
});

// POST /api/admin/courses - Créer un nouveau cours
router.post('/courses', async (req, res) => {
  try {
    const { title, subject, level, description, content, duration, created_by } = req.body;

    // Validation
    if (!title || !subject || !level || !content) {
      return res.status(400).json({
        success: false,
        message: 'Les champs titre, matière, niveau et contenu sont obligatoires'
      });
    }

    const store = loadContentStore();
    const courseId = 'COURS-' + Date.now();
    const newCourse = {
      id: courseId,
      title,
      subject,
      level,
      description,
      content,
      duration: duration || 45,
      status: 'active',
      students: 0,
      averageScore: 0,
      created_by: created_by || req.user?.email,
      created_at: new Date().toISOString()
    };

    store.courses.push(newCourse);
    store.subjects = refreshSubjectAggregates(store);
    saveContentStore(store);

    res.json({
      success: true,
      message: 'Cours créé avec succès',
      data: newCourse
    });
  } catch (error) {
    logger.error('Erreur création cours:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du cours'
    });
  }
});

// POST /api/admin/quizzes - Créer un nouveau quiz
router.post('/quizzes', async (req, res) => {
  try {
    const { title, subject, level, description, duration, passing_score, questions, created_by } = req.body;

    // Validation
    if (!title || !subject || !level || !questions || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Les champs titre, matière, niveau et au moins une question sont obligatoires'
      });
    }

    // Valider les questions
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      if (!question.question || !question.options || !question.correct_answer) {
        return res.status(400).json({
          success: false,
          message: `Question ${i + 1} incomplète`
        });
      }
    }

    const store = loadContentStore();
    const quizId = 'QUIZ-' + Date.now();
    const newQuiz = {
      id: quizId,
      title,
      subject,
      level,
      description,
      duration: duration || 20,
      passing_score: passing_score || 60,
      questions,
      status: 'active',
      attempts: 0,
      averageScore: 0,
      created_by: created_by || req.user?.email,
      created_at: new Date().toISOString()
    };

    store.quizzes.push(newQuiz);
    store.subjects = refreshSubjectAggregates(store);
    saveContentStore(store);

    res.json({
      success: true,
      message: 'Quiz créé avec succès',
      data: newQuiz
    });
  } catch (error) {
    logger.error('Erreur création quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du quiz'
    });
  }
});

// POST /api/admin/resources - Créer une nouvelle ressource
router.post('/resources', async (req, res) => {
  try {
    const { title, type, subject, level, description, url, is_premium, created_by } = req.body;

    // Validation
    if (!title || !type || !subject || !level) {
      return res.status(400).json({
        success: false,
        message: 'Les champs titre, type, matière et niveau sont obligatoires'
      });
    }

    const store = loadContentStore();
    const resourceId = 'RES-' + Date.now();
    const newResource = {
      id: resourceId,
      title,
      type,
      subject,
      level,
      description,
      url,
      is_premium: !!is_premium,
      created_by: created_by || req.user?.email,
      created_at: new Date().toISOString()
    };

    store.resources.push(newResource);
    saveContentStore(store);

    res.json({
      success: true,
      message: 'Ressource ajoutée avec succès',
      data: newResource
    });
  } catch (error) {
    logger.error('Erreur création ressource:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la ressource'
    });
  }
});

// PUT /api/admin/courses/:courseId - Mettre à jour un cours
router.put('/courses/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, subject, level, description, content, duration } = req.body;

    // Validation
    if (!title || !subject || !level || !content) {
      return res.status(400).json({
        success: false,
        message: 'Les champs titre, matière, niveau et contenu sont obligatoires'
      });
    }

    const store = loadContentStore();
    const courseIndex = store.courses.findIndex(c => c.id === courseId);

    if (courseIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Cours non trouvé'
      });
    }

    // Mettre à jour le cours
    store.courses[courseIndex] = {
      ...store.courses[courseIndex],
      title,
      subject,
      level,
      description,
      content,
      duration: duration || store.courses[courseIndex].duration,
      updated_at: new Date().toISOString()
    };

    store.subjects = refreshSubjectAggregates(store);
    saveContentStore(store);

    res.json({
      success: true,
      message: 'Cours mis à jour avec succès',
      data: store.courses[courseIndex]
    });
  } catch (error) {
    logger.error('Erreur mise à jour cours:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du cours'
    });
  }
});

// PUT /api/admin/content/courses/:courseId/toggle - Toggle statut cours
router.put('/content/courses/:courseId/toggle', async (req, res) => {
  try {
    const { courseId } = req.params;
    const store = loadContentStore();
    const course = store.courses.find(c => c.id === courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Cours non trouvé'
      });
    }

    course.status = course.status === 'active' ? 'inactive' : 'active';
    saveContentStore(store);

    res.json({
      success: true,
      message: 'Statut du cours mis à jour',
      data: course
    });
  } catch (error) {
    logger.error('Erreur toggle cours:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut'
    });
  }
});

// PUT /api/admin/content/quizzes/:quizId/toggle - Toggle statut quiz
router.put('/content/quizzes/:quizId/toggle', async (req, res) => {
  try {
    const { quizId } = req.params;
    const store = loadContentStore();
    const quiz = store.quizzes.find(q => q.id === quizId);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz non trouvé'
      });
    }

    quiz.status = quiz.status === 'active' ? 'inactive' : 'active';
    saveContentStore(store);

    res.json({
      success: true,
      message: 'Statut du quiz mis à jour',
      data: quiz
    });
  } catch (error) {
    logger.error('Erreur toggle quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut'
    });
  }
});

module.exports = router;
