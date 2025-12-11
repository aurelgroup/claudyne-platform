/**
 * Script de migration des cours JSON vers PostgreSQL (base de production)
 * Utilise la configuration existante du backend
 */

const fs = require('fs');
const path = require('path');

// Forcer NODE_ENV=production pour utiliser la config Postgres
process.env.NODE_ENV = 'production';

const database = require('../src/config/database');

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

// Mapping des matières
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

// Icônes et couleurs
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

async function migrateToPostgres() {
  console.log('🚀 Migration vers PostgreSQL - PRODUCTION\n');

  try {
    // Tester la connexion
    const connected = await database.testConnection();
    if (!connected) {
      throw new Error('Impossible de se connecter à PostgreSQL');
    }

    console.log('✅ Connexion PostgreSQL établie\n');

    // Charger les modèles
    const models = database.initializeModels();
    const { Subject, Lesson } = models;

    // Synchroniser les modèles (créer les tables si elles n'existent pas)
    await database.sequelize.sync();
    console.log('✅ Modèles synchronisés\n');

    // Lire le fichier JSON
    const contentStorePath = path.join(__dirname, '../content-store.json');
    if (!fs.existsSync(contentStorePath)) {
      throw new Error(`Fichier introuvable: ${contentStorePath}`);
    }

    const contentStore = JSON.parse(fs.readFileSync(contentStorePath, 'utf8'));
    const courses = contentStore.courses || [];

    console.log(`📦 ${courses.length} cours trouvés\n`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const course of courses) {
      try {
        // Valider les champs
        if (!course.level || !course.subject || !course.title) {
          console.log(`⚠️  "${course.title || course.id}" ignoré: champs manquants`);
          skippedCount++;
          continue;
        }

        // Mapper le niveau
        const dbLevel = LEVEL_MAPPING[course.level.toLowerCase()];
        if (!dbLevel) {
          console.log(`⚠️  "${course.title}" ignoré: niveau "${course.level}" non reconnu`);
          skippedCount++;
          continue;
        }

        // Mapper la catégorie
        const dbCategory = SUBJECT_MAPPING[course.subject.toLowerCase()] || 'Mathématiques';

        // Générer un ID unique
        const subjectId = `${course.subject.toLowerCase()}-${dbLevel.toLowerCase()}-${Date.now()}`;

        // Créer le Subject
        await Subject.upsert({
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

        console.log(`✅ Migré: "${course.title}" (${dbLevel} - ${dbCategory})`);
        migratedCount++;

      } catch (error) {
        console.error(`❌ Erreur "${course.title}":`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Résumé:');
    console.log(`   ✅ Migrés: ${migratedCount}`);
    console.log(`   ⚠️  Ignorés: ${skippedCount}`);
    console.log(`   ❌ Erreurs: ${errorCount}`);

    // Vérifier les données
    const totalSubjects = await Subject.count();
    console.log(`\n📈 Total Subjects dans PostgreSQL: ${totalSubjects}`);

    // Afficher par niveau
    const subjectsByLevel = await Subject.findAll({
      attributes: ['level', 'title', 'category'],
      order: [['level', 'ASC'], ['title', 'ASC']]
    });

    console.log('\n📚 Subjects par niveau:');
    let currentLevel = null;
    for (const subject of subjectsByLevel) {
      if (subject.level !== currentLevel) {
        currentLevel = subject.level;
        console.log(`\n   ${currentLevel}:`);
      }
      console.log(`      - ${subject.title} (${subject.category})`);
    }

    console.log('\n✅ Migration PostgreSQL terminée!\n');

    await database.sequelize.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Erreur fatale:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Exécuter
migrateToPostgres();
