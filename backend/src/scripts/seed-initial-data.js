/**
 * Script pour peupler la base de données avec des données initiales
 * Usage: node backend/src/scripts/seed-initial-data.js
 */

// Load environment variables
require('dotenv').config({ path: __dirname + '/../../../.env' });

const database = require('../config/database');

async function seedInitialData() {
  console.log('🌱 Début du peuplement de la base de données...');

  try {
    // Initialize database connection and models
    const models = database.initializeModels();
    const {
      StudyGroup,
      ForumCategory,
      ForumDiscussion,
      WellnessExercise,
      CareerProfile,
      Career,
      Institution,
      ApplicationDeadline
    } = models;

    // ============================================
    // SEED FORUM CATEGORIES
    // ============================================
    console.log('📚 Création des catégories de forum...');
    const categories = await ForumCategory.bulkCreate([
      { name: 'Mathématiques', slug: 'mathematiques', icon: '📐', color: '#3498db', sortOrder: 1, isActive: true },
      { name: 'Physique', slug: 'physique', icon: '⚛️', color: '#9b59b6', sortOrder: 2, isActive: true },
      { name: 'Chimie', slug: 'chimie', icon: '⚗️', color: '#e74c3c', sortOrder: 3, isActive: true },
      { name: 'Français', slug: 'francais', icon: '📚', color: '#e67e22', sortOrder: 4, isActive: true },
      { name: 'Anglais', slug: 'anglais', icon: '🇬🇧', color: '#1abc9c', sortOrder: 5, isActive: true },
      { name: 'Méthodologie', slug: 'methodologie', icon: '📊', color: '#16a085', sortOrder: 6, isActive: true },
      { name: 'Motivation', slug: 'motivation', icon: '💪', color: '#27ae60', sortOrder: 7, isActive: true },
      { name: 'Général', slug: 'general', icon: '💬', color: '#95a5a6', sortOrder: 8, isActive: true }
    ]);
    console.log(`✅ ${categories.length} catégories de forum créées`);

    // ============================================
    // SEED STUDY GROUPS
    // ============================================
    console.log('👥 Création des groupes d\'étude...');
    const studyGroups = await StudyGroup.bulkCreate([
      {
        name: 'Maths Terminale S',
        description: 'Groupe d\'entraide pour les mathématiques de Terminale S',
        subjectId: 'mathematiques',
        level: 'Terminale',
        region: 'National',
        isActive: true,
        maxMembers: 50,
        currentMembersCount: 24,
        metadata: { currentTopic: 'Intégrales' }
      },
      {
        name: 'Chimie Organique',
        description: 'Étude approfondie de la chimie organique',
        subjectId: 'chimie',
        level: 'Terminale',
        region: 'National',
        isActive: true,
        maxMembers: 40,
        currentMembersCount: 18,
        metadata: { currentTopic: 'Réactions' }
      },
      {
        name: 'BAC 2025 - Entraide',
        description: 'Entraide générale pour la préparation du BAC 2025',
        subjectId: 'general',
        level: 'Multi-niveau',
        region: 'National',
        isActive: true,
        maxMembers: 200,
        currentMembersCount: 156,
        metadata: { currentTopic: 'Discussion générale' }
      },
      {
        name: 'Physique 1ère',
        description: 'Groupe de révision pour la physique de Première',
        subjectId: 'physique',
        level: '1ère',
        region: 'National',
        isActive: true,
        maxMembers: 30,
        currentMembersCount: 12,
        metadata: { currentTopic: 'Électricité' }
      },
      {
        name: 'Français Littéraire',
        description: 'Analyses littéraires et préparation de l\'oral',
        subjectId: 'francais',
        level: 'Terminale',
        region: 'National',
        isActive: true,
        maxMembers: 35,
        currentMembersCount: 27,
        metadata: { currentTopic: 'Analyse de texte' }
      }
    ]);
    console.log(`✅ ${studyGroups.length} groupes d\'étude créés`);

    // ============================================
    // SEED WELLNESS EXERCISES
    // ============================================
    console.log('🧘 Création des exercices de bien-être...');
    const wellnessExercises = await WellnessExercise.bulkCreate([
      {
        name: 'Respiration profonde 5 minutes',
        description: 'Exercice de respiration pour réduire le stress avant un examen',
        type: 'breathing',
        category: 'relaxation',
        duration: 5,
        difficulty: 'BEGINNER',
        instructions: '1. Asseyez-vous confortablement\n2. Inspirez profondément par le nez pendant 4 secondes\n3. Retenez votre respiration pendant 4 secondes\n4. Expirez lentement par la bouche pendant 6 secondes\n5. Répétez pendant 5 minutes',
        benefits: ['Réduit le stress', 'Améliore la concentration', 'Calme l\'anxiété'],
        tags: ['stress', 'concentration', 'examen'],
        isActive: true,
        sortOrder: 1
      },
      {
        name: 'Méditation guidée 10 minutes',
        description: 'Méditation guidée pour la concentration',
        type: 'meditation',
        category: 'mindfulness',
        duration: 10,
        difficulty: 'INTERMEDIATE',
        instructions: 'Fermez les yeux et concentrez-vous sur votre respiration. Laissez passer les pensées sans vous y attacher.',
        benefits: ['Améliore la concentration', 'Réduit l\'anxiété', 'Augmente la clarté mentale'],
        tags: ['méditation', 'concentration', 'mindfulness'],
        isActive: true,
        sortOrder: 2
      },
      {
        name: 'Étirements anti-fatigue',
        description: 'Série d\'étirements pour combattre la fatigue lors des révisions',
        type: 'stretching',
        category: 'energy',
        duration: 7,
        difficulty: 'BEGINNER',
        instructions: 'Étirez le cou, les épaules, le dos et les jambes. Maintenez chaque position 30 secondes.',
        benefits: ['Réduit la fatigue', 'Améliore la posture', 'Augmente l\'énergie'],
        tags: ['étirements', 'fatigue', 'énergie'],
        isActive: true,
        sortOrder: 3
      },
      {
        name: 'Pause active 5 minutes',
        description: 'Petits exercices physiques pour réactiver le corps et l\'esprit',
        type: 'physical',
        category: 'energy',
        duration: 5,
        difficulty: 'BEGINNER',
        instructions: 'Marchez sur place, faites des jumping jacks, des rotations d\'épaules et des flexions de genoux.',
        benefits: ['Réactive l\'énergie', 'Améliore la circulation', 'Booste la concentration'],
        tags: ['énergie', 'mouvement', 'concentration'],
        isActive: true,
        sortOrder: 4
      }
    ]);
    console.log(`✅ ${wellnessExercises.length} exercices de bien-être créés`);

    // ============================================
    // SEED CAREER PROFILES
    // ============================================
    console.log('💼 Création des profils de carrière...');
    const careerProfiles = await CareerProfile.bulkCreate([
      {
        name: 'Scientifique',
        description: 'Profil pour les esprits analytiques et curieux',
        characteristics: 'Vous aimez comprendre comment les choses fonctionnent, analyser des données et résoudre des problèmes complexes.',
        strengthSubjects: ['Mathématiques', 'Physique', 'Chimie', 'SVT'],
        idealActivities: ['Recherche', 'Analyse', 'Expérimentation'],
        recommendedPaths: ['Ingénierie', 'Médecine', 'Recherche scientifique'],
        icon: '🔬',
        color: '#3498db',
        isActive: true,
        sortOrder: 1
      },
      {
        name: 'Littéraire',
        description: 'Profil pour les amoureux des mots et de la communication',
        characteristics: 'Vous excellez dans l\'expression écrite et orale, aimez lire et avez un sens aigu de la langue.',
        strengthSubjects: ['Français', 'Philosophie', 'Histoire', 'Langues'],
        idealActivities: ['Écriture', 'Communication', 'Enseignement'],
        recommendedPaths: ['Journalisme', 'Enseignement', 'Édition', 'Communication'],
        icon: '📚',
        color: '#e74c3c',
        isActive: true,
        sortOrder: 2
      },
      {
        name: 'Entrepreneur',
        description: 'Profil pour les leaders et innovateurs',
        characteristics: 'Vous avez l\'esprit d\'initiative, aimez diriger et créer de nouvelles opportunités.',
        strengthSubjects: ['Économie', 'Gestion', 'Mathématiques'],
        idealActivities: ['Direction', 'Innovation', 'Gestion de projets'],
        recommendedPaths: ['Business', 'Entrepreneuriat', 'Management'],
        icon: '💼',
        color: '#2ecc71',
        isActive: true,
        sortOrder: 3
      },
      {
        name: 'Créatif',
        description: 'Profil pour les esprits artistiques et imaginatifs',
        characteristics: 'Vous avez une grande imagination, appréciez l\'esthétique et aimez créer.',
        strengthSubjects: ['Arts', 'Design', 'Littérature'],
        idealActivities: ['Création', 'Design', 'Expression artistique'],
        recommendedPaths: ['Arts visuels', 'Architecture', 'Design', 'Cinéma'],
        icon: '🎨',
        color: '#9b59b6',
        isActive: true,
        sortOrder: 4
      },
      {
        name: 'Social',
        description: 'Profil pour ceux qui aiment aider et travailler avec les autres',
        characteristics: 'Vous êtes empathique, aimez aider les autres et travailler en équipe.',
        strengthSubjects: ['Sciences sociales', 'Psychologie', 'Philosophie'],
        idealActivities: ['Aide', 'Conseil', 'Travail d\'équipe'],
        recommendedPaths: ['Travail social', 'Psychologie', 'Éducation', 'Santé'],
        icon: '🤝',
        color: '#1abc9c',
        isActive: true,
        sortOrder: 5
      }
    ]);
    console.log(`✅ ${careerProfiles.length} profils de carrière créés`);

    // ============================================
    // SEED CAREERS
    // ============================================
    console.log('💡 Création des carrières...');
    const scientificProfile = careerProfiles.find(p => p.name === 'Scientifique');
    const literaryProfile = careerProfiles.find(p => p.name === 'Littéraire');
    const entrepreneurProfile = careerProfiles.find(p => p.name === 'Entrepreneur');

    const careers = await Career.bulkCreate([
      {
        name: 'Ingénieur logiciel',
        description: 'Conception et développement de logiciels et applications',
        profileId: scientificProfile?.id,
        category: 'Technologie',
        requiredEducation: 'Bac+5 (Ingénieur ou Master)',
        requiredSkills: ['Programmation', 'Logique', 'Résolution de problèmes'],
        averageSalaryMin: 2500000,
        averageSalaryMax: 6000000,
        growthOutlook: 'Excellente',
        growthPercentage: 15.5,
        demandLevel: 'Très élevée',
        relatedSubjects: ['Mathématiques', 'Physique', 'Informatique'],
        isTrending: true,
        isActive: true
      },
      {
        name: 'Médecin',
        description: 'Diagnostic et traitement des maladies',
        profileId: scientificProfile?.id,
        category: 'Santé',
        requiredEducation: 'Bac+7 minimum',
        requiredSkills: ['Biologie', 'Empathie', 'Rigueur'],
        averageSalaryMin: 3000000,
        averageSalaryMax: 8000000,
        growthOutlook: 'Excellente',
        growthPercentage: 12.0,
        demandLevel: 'Élevée',
        relatedSubjects: ['SVT', 'Chimie', 'Physique'],
        isTrending: true,
        isActive: true
      },
      {
        name: 'Journaliste',
        description: 'Collecte, vérification et diffusion de l\'information',
        profileId: literaryProfile?.id,
        category: 'Communication',
        requiredEducation: 'Bac+3 à Bac+5',
        requiredSkills: ['Écriture', 'Investigation', 'Communication'],
        averageSalaryMin: 1500000,
        averageSalaryMax: 4000000,
        growthOutlook: 'Moyenne',
        growthPercentage: 5.0,
        demandLevel: 'Moyenne',
        relatedSubjects: ['Français', 'Histoire', 'Géographie'],
        isTrending: false,
        isActive: true
      },
      {
        name: 'Data Scientist',
        description: 'Analyse de données massives pour aider à la prise de décision',
        profileId: scientificProfile?.id,
        category: 'Technologie',
        requiredEducation: 'Bac+5 (Master ou Ingénieur)',
        requiredSkills: ['Statistiques', 'Programmation', 'Machine Learning'],
        averageSalaryMin: 3000000,
        averageSalaryMax: 7000000,
        growthOutlook: 'Excellente',
        growthPercentage: 18.0,
        demandLevel: 'Très élevée',
        relatedSubjects: ['Mathématiques', 'Informatique', 'Statistiques'],
        isTrending: true,
        isActive: true
      },
      {
        name: 'Chef d\'entreprise',
        description: 'Direction et gestion d\'une entreprise',
        profileId: entrepreneurProfile?.id,
        category: 'Business',
        requiredEducation: 'Bac+3 à Bac+5 (ou expérience équivalente)',
        requiredSkills: ['Leadership', 'Gestion', 'Prise de décision'],
        averageSalaryMin: 2000000,
        averageSalaryMax: 10000000,
        growthOutlook: 'Bonne',
        growthPercentage: 8.0,
        demandLevel: 'Élevée',
        relatedSubjects: ['Économie', 'Gestion', 'Mathématiques'],
        isTrending: true,
        isActive: true
      }
    ]);
    console.log(`✅ ${careers.length} carrières créées`);

    // ============================================
    // SEED INSTITUTIONS
    // ============================================
    console.log('🏛️ Création des institutions...');
    const institutions = await Institution.bulkCreate([
      {
        name: 'Université de Yaoundé I',
        type: 'Université publique',
        city: 'Yaoundé',
        region: 'Centre',
        country: 'Cameroun',
        description: 'Principale université du Cameroun, offrant une large gamme de programmes',
        programs: ['Sciences', 'Lettres', 'Droit', 'Économie'],
        specializations: ['Mathématiques', 'Physique', 'Chimie', 'Biologie'],
        acceptanceRate: 65.0,
        rankingNational: 1,
        isActive: true,
        isFeatured: true
      },
      {
        name: 'Université de Douala',
        type: 'Université publique',
        city: 'Douala',
        region: 'Littoral',
        country: 'Cameroun',
        description: 'Grande université située dans la capitale économique',
        programs: ['Sciences économiques', 'Ingénierie', 'Lettres', 'Sciences'],
        specializations: ['Commerce', 'Ingénierie', 'Économie'],
        acceptanceRate: 60.0,
        rankingNational: 2,
        isActive: true,
        isFeatured: true
      },
      {
        name: 'École Polytechnique de Yaoundé',
        type: 'Grande école',
        city: 'Yaoundé',
        region: 'Centre',
        country: 'Cameroun',
        description: 'École d\'ingénieurs de référence au Cameroun',
        programs: ['Génie civil', 'Génie électrique', 'Génie informatique', 'Génie mécanique'],
        specializations: ['Ingénierie'],
        acceptanceRate: 15.0,
        rankingNational: 1,
        isActive: true,
        isFeatured: true
      }
    ]);
    console.log(`✅ ${institutions.length} institutions créées`);

    // ============================================
    // SEED APPLICATION DEADLINES
    // ============================================
    console.log('📅 Création des dates limites de candidature...');
    const uy1 = institutions.find(i => i.name === 'Université de Yaoundé I');

    const deadlines = await ApplicationDeadline.bulkCreate([
      {
        institutionId: uy1?.id,
        programName: 'Licence en Mathématiques',
        academicYear: '2025-2026',
        deadlineType: 'Candidature régulière',
        deadlineDate: '2025-08-31',
        status: 'UPCOMING',
        isActive: true
      },
      {
        institutionId: uy1?.id,
        programName: 'Master en Physique',
        academicYear: '2025-2026',
        deadlineType: 'Candidature régulière',
        deadlineDate: '2025-09-15',
        status: 'UPCOMING',
        isActive: true
      }
    ]);
    console.log(`✅ ${deadlines.length} dates limites créées`);

    console.log('\n✅ Peuplement de la base de données terminé avec succès !');
    console.log('\nRésumé:');
    console.log(`- ${categories.length} catégories de forum`);
    console.log(`- ${studyGroups.length} groupes d\'étude`);
    console.log(`- ${wellnessExercises.length} exercices de bien-être`);
    console.log(`- ${careerProfiles.length} profils de carrière`);
    console.log(`- ${careers.length} carrières`);
    console.log(`- ${institutions.length} institutions`);
    console.log(`- ${deadlines.length} dates limites`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors du peuplement:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Execute seeding
seedInitialData();
