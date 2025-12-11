/**
 * Script de migration des cours du fichier JSON vers la base de données
 * Claudyne - Migration unique
 */

const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');

// Configuration SQLite directe
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database/claudyne_dev.sqlite'),
  logging: false
});

// Mapping des niveaux JSON vers DB
const LEVEL_MAPPING = {
  'cp': 'CP',
  'ce1': 'CE1',
  'ce2': 'CE2',
  'cm1': 'CM1',
  'cm2': 'CM2',
  '6eme': '6ème',
  '5eme': '5ème',
  '4eme': '4ème',
  '3eme': '3ème',
  '2nde': '2nde',
  '1ere': '1ère',
  'terminale': 'Tle'
};

// Mapping des matières JSON vers catégories DB
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

// Icônes par matière
const SUBJECT_ICONS = {
  'Mathématiques': '📐',
  'Sciences': '🔬',
  'Français': '📚',
  'Langues': '🌍',
  'Histoire-Géographie': '🗺️',
  'Informatique': '💻',
  'Sport': '⚽',
  'Arts': '🎨'
};

// Couleurs par matière
const SUBJECT_COLORS = {
  'Mathématiques': '#3B82F6',
  'Sciences': '#10B981',
  'Français': '#F59E0B',
  'Langues': '#8B5CF6',
  'Histoire-Géographie': '#EF4444',
  'Informatique': '#06B6D4',
  'Sport': '#84CC16',
  'Arts': '#EC4899'
};

async function migrateCoursesToDB() {
  console.log('🚀 Démarrage de la migration des cours...\n');

  try {
    // Tester la connexion
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données établie\n');

    // Charger les modèles depuis les fichiers
    const SubjectModel = require('../src/models/Subject');
    const LessonModel = require('../src/models/Lesson');

    const Subject = SubjectModel(sequelize);
    const Lesson = LessonModel(sequelize);

    // Synchroniser les modèles
    await sequelize.sync();
    console.log('✅ Modèles synchronisés\n');

    // Lire le fichier JSON
    const contentStorePath = path.join(__dirname, '../content-store.json');

    if (!fs.existsSync(contentStorePath)) {
      throw new Error(`Fichier content-store.json introuvable: ${contentStorePath}`);
    }

    const contentStore = JSON.parse(fs.readFileSync(contentStorePath, 'utf8'));
    const courses = contentStore.courses || [];

    console.log(`📦 ${courses.length} cours trouvés dans content-store.json\n`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const course of courses) {
      try {
        // Valider les champs requis
        if (!course.level || !course.subject || !course.title) {
          console.log(`⚠️  Cours "${course.title || course.id}" ignoré: champs manquants`);
          skippedCount++;
          continue;
        }

        // Mapper le niveau
        const dbLevel = LEVEL_MAPPING[course.level.toLowerCase()];
        if (!dbLevel) {
          console.log(`⚠️  Cours "${course.title}" ignoré: niveau "${course.level}" non reconnu`);
          skippedCount++;
          continue;
        }

        // Mapper la catégorie
        const dbCategory = SUBJECT_MAPPING[course.subject.toLowerCase()] || 'Mathématiques';

        // Générer un ID unique pour le Subject
        const subjectId = `${course.subject.toLowerCase()}-${dbLevel.toLowerCase()}-${Date.now()}`;

        // Créer ou mettre à jour le Subject
        const [subject, created] = await Subject.upsert({
          id: subjectId,
          title: course.title,
          description: course.description || '',
          level: dbLevel,
          category: dbCategory,
          icon: SUBJECT_ICONS[dbCategory] || '📚',
          color: SUBJECT_COLORS[dbCategory] || '#3B82F6',
          difficulty: 'Intermédiaire',
          estimatedDuration: parseInt(course.duration) || 45,
          isActive: course.status === 'active',
          isPremium: false,
          order: 0,
          prerequisites: [],
          cameroonCurriculum: {
            officialCode: null,
            ministerialRef: null,
            competencies: []
          }
        });

        // Créer une leçon principale pour ce cours
        // Note: id is auto-increment, so we don't specify it
        await Lesson.create({
          subjectId: subjectId,
          title: course.title,
          content: {
            videoUrl: null,
            transcript: course.content || '',
            keyPoints: [],
            exercises: [],
            resources: [],
            downloadableFiles: []
          },
          type: 'interactive',
          estimatedDuration: parseInt(course.duration) || 45,
          difficulty: 'Intermédiaire',
          order: 1,
          isActive: course.status === 'active',
          isPremium: false,
          prerequisites: [],
          reviewStatus: 'approved'
        });

        console.log(`✅ Cours migré: "${course.title}" (${dbLevel} - ${dbCategory})`);
        migratedCount++;

      } catch (error) {
        console.error(`❌ Erreur migration cours "${course.title}":`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Résumé de la migration:');
    console.log(`   ✅ Migrés: ${migratedCount}`);
    console.log(`   ⚠️  Ignorés: ${skippedCount}`);
    console.log(`   ❌ Erreurs: ${errorCount}`);
    console.log(`   📦 Total: ${courses.length}`);

    // Vérifier les données migrées
    const totalSubjects = await Subject.count();
    const totalLessons = await Lesson.count();

    console.log('\n📈 État de la base de données:');
    console.log(`   Subjects: ${totalSubjects}`);
    console.log(`   Lessons: ${totalLessons}`);

    // Afficher les Subjects par niveau
    console.log('\n📚 Subjects par niveau:');
    const subjectsByLevel = await Subject.findAll({
      attributes: ['level', 'title', 'category'],
      order: [['level', 'ASC'], ['title', 'ASC']]
    });

    let currentLevel = null;
    for (const subject of subjectsByLevel) {
      if (subject.level !== currentLevel) {
        currentLevel = subject.level;
        console.log(`\n   ${currentLevel}:`);
      }
      console.log(`      - ${subject.title} (${subject.category})`);
    }

    console.log('\n✅ Migration terminée avec succès!\n');

    await sequelize.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Erreur fatale lors de la migration:', error);
    process.exit(1);
  }
}

// Exécuter la migration
migrateCoursesToDB();
