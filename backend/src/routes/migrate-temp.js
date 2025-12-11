/**
 * Route temporaire pour migrer les cours JSON vers la BDD
 * À SUPPRIMER après migration
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Middleware pour initialiser les modèles
router.use(async (req, res, next) => {
  if (!req.models) {
    const database = require('../config/database');
    req.models = database.initializeModels();
  }
  next();
});

// Mappings
const LEVEL_MAPPING = {
  'cp': 'CP', 'ce1': 'CE1', 'ce2': 'CE2', 'cm1': 'CM1', 'cm2': 'CM2',
  '6eme': '6ème', '5eme': '5ème', '4eme': '4ème', '3eme': '3ème',
  '2nde': '2nde', '1ere': '1ère', 'terminale': 'Tle'
};

const SUBJECT_MAPPING = {
  'mathematiques': 'Mathématiques', 'physique': 'Sciences', 'chimie': 'Sciences',
  'svt': 'Sciences', 'francais': 'Français', 'anglais': 'Langues',
  'informatique': 'Informatique', 'eps': 'Sport', 'arts': 'Arts'
};

const ICONS = {
  'Mathématiques': '📐', 'Sciences': '🔬', 'Français': '📚',
  'Langues': '🌍', 'Informatique': '💻', 'Sport': '⚽', 'Arts': '🎨'
};

const COLORS = {
  'Mathématiques': '#3B82F6', 'Sciences': '#10B981', 'Français': '#F59E0B',
  'Langues': '#8B5CF6', 'Informatique': '#06B6D4', 'Sport': '#84CC16', 'Arts': '#EC4899'
};

router.post('/migrate-courses', async (req, res) => {
  try {
    const { Subject } = req.models;

    // Lire content-store.json
    const contentPath = path.join(__dirname, '../../content-store.json');
    const contentStore = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
    const courses = contentStore.courses || [];

    const results = {
      migrated: [],
      skipped: [],
      errors: []
    };

    for (const course of courses) {
      try {
        if (!course.level || !course.subject || !course.title) {
          results.skipped.push({ title: course.title, reason: 'Champs manquants' });
          continue;
        }

        const dbLevel = LEVEL_MAPPING[course.level.toLowerCase()];
        if (!dbLevel) {
          results.skipped.push({ title: course.title, reason: `Niveau inconnu: ${course.level}` });
          continue;
        }

        const dbCategory = SUBJECT_MAPPING[course.subject.toLowerCase()] || 'Mathématiques';
        const subjectId = uuidv4(); // Générer un vrai UUID

        await Subject.upsert({
          id: subjectId,
          title: course.title,
          description: course.description || '',
          level: dbLevel,
          category: dbCategory,
          icon: ICONS[dbCategory] || '📚',
          color: COLORS[dbCategory] || '#3B82F6',
          difficulty: 'Intermédiaire',
          estimatedDuration: parseInt(course.duration) || 45,
          isActive: course.status === 'active',
          isPremium: false,
          order: 0,
          prerequisites: [],
          cameroonCurriculum: { officialCode: null, ministerialRef: null, competencies: [] }
        });

        results.migrated.push({ title: course.title, level: dbLevel, category: dbCategory });

      } catch (error) {
        results.errors.push({ title: course.title, error: error.message });
      }
    }

    // Compter les Subjects
    const total = await Subject.count();

    res.json({
      success: true,
      message: 'Migration terminée',
      results,
      totalSubjectsInDB: total
    });

  } catch (error) {
    console.error('Erreur migration:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la migration',
      error: error.message
    });
  }
});

// Route pour lister les Subjects
router.get('/list-subjects', async (req, res) => {
  try {
    const { Subject } = req.models;

    const subjects = await Subject.findAll({
      attributes: ['id', 'title', 'level', 'category', 'isActive'],
      order: [['level', 'ASC'], ['title', 'ASC']]
    });

    res.json({
      success: true,
      count: subjects.length,
      subjects
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Route pour vérifier les Lessons
router.get('/list-lessons', async (req, res) => {
  try {
    const { Lesson } = req.models;

    const lessons = await Lesson.findAll({
      attributes: ['id', 'subjectId', 'title', 'type', 'isActive'],
      order: [['subjectId', 'ASC'], ['order', 'ASC']]
    });

    res.json({
      success: true,
      count: lessons.length,
      lessons
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Route pour créer des Lessons pour tous les Subjects qui n'en ont pas
router.post('/create-missing-lessons', async (req, res) => {
  try {
    const { Subject, Lesson } = req.models;

    // Récupérer tous les Subjects actifs
    const subjects = await Subject.findAll({
      where: { isActive: true }
    });

    const results = {
      created: [],
      skipped: [],
      errors: []
    };

    for (const subject of subjects) {
      try {
        // Vérifier si ce Subject a déjà des Lessons
        const existingLessons = await Lesson.count({
          where: { subjectId: subject.id }
        });

        if (existingLessons > 0) {
          results.skipped.push({
            subjectId: subject.id,
            title: subject.title,
            reason: `${existingLessons} Lesson(s) existent déjà`
          });
          continue;
        }

        // Créer une Lesson par défaut pour ce Subject
        const lesson = await Lesson.create({
          id: uuidv4(),
          subjectId: subject.id,
          title: `${subject.title} - Leçon 1`,
          content: subject.description || `Cours de ${subject.title}`,
          type: 'theory',
          duration: subject.estimatedDuration || 45,
          difficulty: subject.difficulty || 'Intermédiaire',
          order: 1,
          isActive: true,
          isPremium: subject.isPremium || false,
          prerequisites: [],
          resources: []
        });

        results.created.push({
          lessonId: lesson.id,
          subjectId: subject.id,
          title: subject.title
        });

      } catch (error) {
        results.errors.push({
          subjectId: subject.id,
          title: subject.title,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: 'Création des Lessons terminée',
      results,
      summary: {
        created: results.created.length,
        skipped: results.skipped.length,
        errors: results.errors.length
      }
    });

  } catch (error) {
    console.error('Erreur create-missing-lessons:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création des Lessons',
      error: error.message
    });
  }
});

// Route pour vérifier/créer un profil Student
router.post('/ensure-student-profile', async (req, res) => {
  try {
    const { Student, User, Family } = req.models;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email requis'
      });
    }

    // Trouver l'utilisateur
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `Utilisateur ${email} introuvable`
      });
    }

    // Vérifier si un profil Student existe déjà
    let student = await Student.findOne({ where: { userId: user.id } });

    if (student) {
      return res.json({
        success: true,
        message: 'Profil Student existe déjà',
        student: {
          id: student.id,
          userId: student.userId,
          firstName: student.firstName,
          lastName: student.lastName,
          educationLevel: student.educationLevel,
          isActive: student.isActive
        }
      });
    }

    // Créer une Family si nécessaire
    let family = await Family.findOne({ where: { primaryEmail: email } });

    if (!family) {
      family = await Family.create({
        id: uuidv4(),
        familyName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Famille',
        primaryEmail: email,
        phone: user.phone || null,
        address: {},
        country: 'CM',
        region: 'Centre',
        subscriptionType: 'FREE',
        status: 'ACTIVE'
      });
    }

    // Créer le profil Student
    student = await Student.create({
      id: uuidv4(),
      userId: user.id,
      familyId: family.id,
      firstName: user.firstName || 'Étudiant',
      lastName: user.lastName || user.email.split('@')[0],
      dateOfBirth: '2000-01-01', // Date par défaut
      educationLevel: 'TERMINALE', // Par défaut Terminale
      studentType: 'CHILD',
      isActive: true,
      status: 'ACTIVE'
    });

    res.json({
      success: true,
      message: 'Profil Student créé',
      student: {
        id: student.id,
        userId: student.userId,
        familyId: student.familyId,
        firstName: student.firstName,
        lastName: student.lastName,
        educationLevel: student.educationLevel,
        isActive: student.isActive
      }
    });

  } catch (error) {
    console.error('Erreur ensure-student-profile:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du profil',
      error: error.message
    });
  }
});

// Route de diagnostic : analyser TOUTES les tables PostgreSQL
router.get('/analyze-database', async (req, res) => {
  try {
    const database = require('../config/database');
    const models = database.initializeModels();

    const analysis = {
      tables: {},
      summary: {
        totalTables: 0,
        emptyTables: [],
        populatedTables: []
      }
    };

    // Liste de tous les modèles à analyser
    const modelNames = [
      'User', 'Student', 'Family', 'Subject', 'Lesson', 'Progress',
      'Quiz', 'QuizAttempt', 'Achievement', 'Battle', 'BattleParticipant',
      'Resource', 'Notification', 'PaymentTicket'
    ];

    for (const modelName of modelNames) {
      try {
        if (models[modelName]) {
          const count = await models[modelName].count();
          const sample = count > 0 ? await models[modelName].findOne({
            attributes: { exclude: ['password'] },
            limit: 1
          }) : null;

          analysis.tables[modelName] = {
            count,
            isEmpty: count === 0,
            sampleRecord: sample ? {
              id: sample.id,
              ...Object.keys(sample.dataValues).slice(0, 5).reduce((obj, key) => {
                obj[key] = sample[key];
                return obj;
              }, {})
            } : null
          };

          if (count === 0) {
            analysis.summary.emptyTables.push(modelName);
          } else {
            analysis.summary.populatedTables.push(modelName);
          }
          analysis.summary.totalTables++;
        }
      } catch (error) {
        analysis.tables[modelName] = {
          error: error.message
        };
      }
    }

    res.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('Erreur analyze-database:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Route de diagnostic : tester le filtrage par niveau
router.get('/test-level-matching', async (req, res) => {
  try {
    const { Student, Subject, User } = req.models;

    // Trouver le Student de laure.nono@bicec.com
    const user = await User.findOne({ where: { email: 'laure.nono@bicec.com' } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const student = await Student.findOne({ where: { userId: user.id } });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Récupérer tous les Subjects actifs
    const allSubjects = await Subject.findAll({
      where: { isActive: true },
      attributes: ['id', 'title', 'level', 'category']
    });

    // Mapping niveau Student -> niveau Subject
    const LEVEL_MAPPING = {
      'MATERNELLE_PETITE': 'Maternelle',
      'MATERNELLE_MOYENNE': 'Maternelle',
      'MATERNELLE_GRANDE': 'Maternelle',
      'SIL': 'SIL',
      'CP': 'CP',
      'CE1': 'CE1',
      'CE2': 'CE2',
      'CM1': 'CM1',
      'CM2': 'CM2',
      '6EME': '6ème',
      '5EME': '5ème',
      '4EME': '4ème',
      '3EME': '3ème',
      'SECONDE': '2nde',
      'PREMIERE': '1ère',
      'TERMINALE': 'Tle'
    };

    const expectedSubjectLevel = LEVEL_MAPPING[student.educationLevel];

    // Filtrer les Subjects qui correspondent au niveau
    const matchingSubjects = allSubjects.filter(s => s.level === expectedSubjectLevel);

    res.json({
      success: true,
      student: {
        id: student.id,
        educationLevel: student.educationLevel,
        expectedSubjectLevel
      },
      allSubjects,
      matchingSubjects,
      summary: {
        totalSubjects: allSubjects.length,
        matchingCount: matchingSubjects.length
      }
    });

  } catch (error) {
    console.error('Erreur test-level-matching:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Route de test : récupérer /api/admin/content sans auth
router.get('/test-admin-content', async (req, res) => {
  try {
    const { Subject, Lesson } = req.models;

    // Compter les Subjects actifs
    const totalSubjects = await Subject.count({ where: { isActive: true } });

    // Compter les Lessons actives
    const totalLessons = await Lesson.count({ where: { isActive: true } });

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

    const LEVEL_MAPPING = {
      'CP': 'cp', 'CE1': 'ce1', 'CE2': 'ce2', 'CM1': 'cm1', 'CM2': 'cm2',
      '6ème': '6eme', '5ème': '5eme', '4ème': '4eme', '3ème': '3eme',
      '2nde': '2nde', '1ère': '1ere', 'Tle': 'terminale'
    };

    // Formater pour compatibilité avec l'interface admin
    const courses = subjects.flatMap(subject =>
      subject.lessons.map(lesson => ({
        id: `COURS-${lesson.id}`,
        title: lesson.title,
        subject: subject.category.toLowerCase(),
        level: LEVEL_MAPPING[subject.level] || subject.level.toLowerCase(),
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

    res.json({
      success: true,
      database: 'PostgreSQL',
      stats: {
        totalSubjects,
        totalLessons,
        totalCourses: courses.length
      },
      courses
    });

  } catch (error) {
    console.error('Erreur test-admin-content:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
