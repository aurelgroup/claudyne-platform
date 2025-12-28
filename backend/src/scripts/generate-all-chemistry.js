/**
 * Script Automatique - Génération COMPLÈTE Chimie
 * 4ème → Terminale - Programme Camerounais MINESEC
 *
 * Usage: node backend/src/scripts/generate-all-chemistry.js
 */

require('dotenv').config({ path: __dirname + '/../../../.env' });
const database = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// ============================================
// CONFIGURATION COMPLÈTE CHIMIE
// ============================================

const TOUS_NIVEAUX = ['4ème', '3ème', '2nde', '1ère', 'Tle'];

const CHAPITRES_CHIMIE = {
  '4ème': [
    { num: 1, titre: 'Les états de la matière', trimestre: 1, objectifs: ['Solide, liquide, gaz', 'Changements d\'état', 'Température et pression'] },
    { num: 2, titre: 'Mélanges et corps purs', trimestre: 1, objectifs: ['Mélanges homogènes et hétérogènes', 'Techniques de séparation', 'Corps purs'] },
    { num: 3, titre: 'L\'eau et les solutions', trimestre: 2, objectifs: ['Propriétés de l\'eau', 'Solutions aqueuses', 'Dissolution'] },
    { num: 4, titre: 'Introduction aux atomes', trimestre: 2, objectifs: ['Structure atomique', 'Éléments chimiques', 'Symboles chimiques'] },
    { num: 5, titre: 'Réactions chimiques simples', trimestre: 3, objectifs: ['Transformations chimiques', 'Combustion', 'Conservation de la masse'] }
  ],
  '3ème': [
    { num: 1, titre: 'Structure de l\'atome', trimestre: 1, objectifs: ['Protons, neutrons, électrons', 'Numéro atomique', 'Masse atomique'] },
    { num: 2, titre: 'Le tableau périodique', trimestre: 1, objectifs: ['Classification des éléments', 'Familles chimiques', 'Propriétés périodiques'] },
    { num: 3, titre: 'Liaisons chimiques', trimestre: 2, objectifs: ['Liaison ionique', 'Liaison covalente', 'Molécules'] },
    { num: 4, titre: 'Réactions acido-basiques', trimestre: 2, objectifs: ['Acides et bases', 'pH', 'Neutralisation'] },
    { num: 5, titre: 'Équations chimiques', trimestre: 3, objectifs: ['Écrire une équation', 'Équilibrer', 'Stœchiométrie simple'] }
  ],
  '2nde': [
    { num: 1, titre: 'La mole et quantité de matière', trimestre: 1, objectifs: ['Concept de mole', 'Masse molaire', 'Nombre d\'Avogadro'] },
    { num: 2, titre: 'Concentration des solutions', trimestre: 1, objectifs: ['Concentration molaire', 'Concentration massique', 'Dilution'] },
    { num: 3, titre: 'Réactions d\'oxydoréduction', trimestre: 2, objectifs: ['Oxydation et réduction', 'Nombre d\'oxydation', 'Couples redox'] },
    { num: 4, titre: 'Cinétique chimique', trimestre: 2, objectifs: ['Vitesse de réaction', 'Facteurs cinétiques', 'Catalyse'] },
    { num: 5, titre: 'Équilibre chimique', trimestre: 3, objectifs: ['Réactions réversibles', 'Constante d\'équilibre', 'Loi d\'action de masse'] }
  ],
  '1ère': [
    { num: 1, titre: 'Chimie organique : Hydrocarbures', trimestre: 1, objectifs: ['Alcanes', 'Alcènes', 'Nomenclature'], series: ['C', 'D'] },
    { num: 2, titre: 'Fonctions oxygénées', trimestre: 1, objectifs: ['Alcools', 'Aldéhydes et cétones', 'Acides carboxyliques'], series: ['C', 'D'] },
    { num: 3, titre: 'Isomérie', trimestre: 2, objectifs: ['Isomérie de constitution', 'Stéréoisomérie', 'Chiralité'], series: ['C', 'D'] },
    { num: 4, titre: 'Réactions en chimie organique', trimestre: 2, objectifs: ['Substitution', 'Addition', 'Élimination'], series: ['C', 'D'] },
    { num: 5, titre: 'Thermochimie', trimestre: 3, objectifs: ['Enthalpie', 'Loi de Hess', 'Énergie de liaison'], series: ['C', 'D'] }
  ],
  'Tle': [
    { num: 1, titre: 'Chimie organique avancée', trimestre: 1, objectifs: ['Mécanismes réactionnels', 'Polymères', 'Composés aromatiques'], series: ['C', 'D'] },
    { num: 2, titre: 'Équilibres chimiques avancés', trimestre: 1, objectifs: ['Déplacement d\'équilibre', 'Principe de Le Chatelier', 'Applications industrielles'], series: ['C', 'D'] },
    { num: 3, titre: 'Acides et bases (avancé)', trimestre: 2, objectifs: ['Théorie de Brönsted', 'Constantes d\'acidité', 'Titrage'], series: ['C', 'D'] },
    { num: 4, titre: 'Électrochimie', trimestre: 2, objectifs: ['Piles électrochimiques', 'Électrolyse', 'Corrosion'], series: ['C', 'D'] },
    { num: 5, titre: 'Cinétique et catalyse', trimestre: 3, objectifs: ['Ordre de réaction', 'Énergie d\'activation', 'Mécanismes catalytiques'], series: ['C', 'D'] }
  ]
};

const MATIERE_CHIMIE = {
  id: 'chimie',
  nom: 'Chimie',
  icon: '⚗️',
  color: '#EC4899',
  category: 'Sciences'
};

// ============================================
// GÉNÉRATEUR DE CONTENU
// ============================================

function genererContenuLecon(niveau, chapitre, numLecon, typeLecon) {
  const exemplesCameroun = [
    'Traitement de l\'eau potable à la CAMWATER',
    'Fabrication du savon artisanal au Cameroun',
    'Extraction de l\'huile de palme',
    'Production de biocarburant à partir du Jatropha',
    'Qualité de l\'eau des sources de Yaoundé',
    'Raffinage du pétrole à la SONARA (Limbé)',
    'Fabrication de la bière au Cameroun (SABC)',
    'Corrosion des structures métalliques en milieu tropical',
    'Synthèse de médicaments à l\'IMPM',
    'Pollution chimique dans le Wouri (Douala)',
    'Production d\'engrais pour agriculture camerounaise',
    'Extraction minière au Cameroun (or, cobalt)'
  ];

  const exemple1 = exemplesCameroun[Math.floor(Math.random() * exemplesCameroun.length)];
  const exemple2 = exemplesCameroun[Math.floor(Math.random() * exemplesCameroun.length)];

  return {
    videoUrl: typeLecon === 'video' ? `https://www.youtube.com/watch?v=chimie-${niveau}-ch${chapitre.num}-l${numLecon}` : null,

    transcript: `# ${chapitre.titre} - Leçon ${numLecon}\n\n## Introduction\n\nBienvenue dans cette leçon ${numLecon} sur **${chapitre.titre.toLowerCase()}**. Cette leçon fait partie du programme de chimie ${niveau} selon le curriculum camerounais MINESEC.\n\n## I. Rappels et Prérequis Chimiques\n\nAvant de commencer, révisons les concepts chimiques suivants :\n${chapitre.objectifs[0] ? `- ${chapitre.objectifs[0]}` : '- Les bases du chapitre précédent'}\n\n## II. Concepts Chimiques Fondamentaux\n\n### Concept 1: ${chapitre.objectifs[0] || 'Observation chimique'}\n\nExplication scientifique avec équations chimiques et formules.\n\n**Exemple du Cameroun :** ${exemple1}\n\nAnalyse chimique détaillée : réactifs, produits, conditions opératoires...\n\n### Concept 2: ${chapitre.objectifs[1] || 'Application industrielle'}\n\nLien entre chimie fondamentale et applications pratiques.\n\n**Application industrielle :** ${exemple2}\n\n## III. Équations et Formules Chimiques\n\n### Réaction chimique principale\n\nÉquation chimique équilibrée de la réaction étudiée.\n\n**Équation :** A + B → C + D\n\n**Conditions :**\n- Température\n- Pression\n- Catalyseur (si applicable)\n\n### Calculs stœchiométriques\n\nMéthode de calcul des quantités de matière.\n\n**Étapes :**\n1. Écrire l'équation équilibrée\n2. Identifier les quantités connues\n3. Utiliser les rapports stœchiométriques\n4. Calculer les quantités demandées\n\n## IV. Expériences de Chimie\n\n### Expérience 1: Manipulation de laboratoire\n\n**Matériel nécessaire :**\n- Liste du matériel de labo\n- Réactifs chimiques\n- Équipement de sécurité\n\n**Protocole expérimental :**\n1. Préparation des solutions\n2. Mélange des réactifs\n3. Observations\n4. Mesures et calculs\n\n**⚠️ Sécurité :**\n- Port de la blouse\n- Lunettes de protection\n- Manipulation sous hotte si nécessaire\n\n### Expérience 2: Application camerounaise\n\nExpérience adaptée au contexte local avec matériel disponible.\n\n## V. Exercices de Chimie\n\nApplications numériques et calculs chimiques.\n\n## Conclusion\n\nPoints essentiels à retenir :\n${chapitre.objectifs.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}\n\n**Prochaine leçon :** Leçon ${numLecon + 1} - Approfondissement\n\n**💡 Le saviez-vous ?**\nLa chimie est omniprésente dans l'industrie camerounaise : raffinage pétrolier, production de savon, traitement de l'eau, fabrication de médicaments...`,

    keyPoints: chapitre.objectifs.slice(0, 3).map((obj, i) => ({
      title: `${obj}`,
      content: `Ce concept chimique est fondamental en ${niveau}. Il permet de comprendre les transformations de la matière et les processus industriels au Cameroun. La maîtrise de ${obj.toLowerCase()} est essentielle pour les applications pratiques et la poursuite d'études scientifiques.`
    })),

    exercises: [
      {
        id: 1,
        title: 'Exercice d\'application d\'équation chimique',
        question: `Équilibrer l'équation chimique suivante et calculer les quantités en utilisant ${chapitre.objectifs[0] ? chapitre.objectifs[0].toLowerCase() : 'les concepts vus'}.`,
        answer: 'Équation équilibrée avec coefficients stœchiométriques',
        explanation: `Pour résoudre cet exercice de chimie :\n\nÉtape 1: Identifier les réactifs et produits\nÉtape 2: Équilibrer l'équation (conservation des atomes)\nÉtape 3: Vérifier l'équilibrage (même nombre d'atomes de chaque élément)\nÉtape 4: Calculer les quantités demandées`,
        difficulty: 'facile'
      },
      {
        id: 2,
        title: 'Problème de chimie appliquée au Cameroun',
        question: `Dans une industrie camerounaise : ${exemple1}. Calculer les quantités de réactifs et produits.`,
        answer: 'Solution complète avec calculs stœchiométriques',
        explanation: `Ce problème industriel nécessite :\n1. Analyser le processus chimique\n2. Écrire les équations des réactions\n3. Effectuer les calculs de quantités\n4. Interpréter les résultats (rendement, pureté...)`,
        difficulty: 'moyen'
      },
      {
        id: 3,
        title: 'Exercice de synthèse',
        question: `Problème complexe sur ${chapitre.titre.toLowerCase()} combinant plusieurs concepts chimiques.`,
        answer: 'Solution détaillée avec mécanisme réactionnel',
        explanation: `Solution complète incluant :\n- Équations chimiques équilibrées\n- Schémas réactionnels\n- Calculs numériques\n- Interprétation des résultats\n- Considérations de sécurité`,
        difficulty: 'difficile'
      }
    ],

    resources: [
      {
        type: 'pdf',
        title: `Formulaire chimique - ${chapitre.titre}`,
        url: `/resources/chimie/${niveau}/ch${chapitre.num}/formulaire.pdf`,
        description: 'Équations, formules et constantes chimiques'
      },
      {
        type: 'video',
        title: 'Expériences de chimie en vidéo',
        url: `https://www.youtube.com/watch?v=exp-chimie-${niveau}`,
        duration: '18:00'
      },
      {
        type: 'interactive',
        title: 'Simulation moléculaire 3D',
        url: `https://phet.colorado.edu/sims/html/chemistry-${chapitre.num}`,
        description: 'Visualisation 3D des molécules et réactions'
      }
    ],

    downloadableFiles: [
      {
        name: `Fiche de révision - ${chapitre.titre}`,
        url: `/downloads/chimie/${niveau}/fiche-ch${chapitre.num}.pdf`,
        size: '900 KB',
        format: 'PDF'
      },
      {
        name: 'Exercices corrigés type Bac',
        url: `/downloads/chimie/${niveau}/exercices-ch${chapitre.num}.pdf`,
        size: '1.8 MB',
        format: 'PDF'
      },
      {
        name: 'Protocoles expérimentaux sécurisés',
        url: `/downloads/chimie/${niveau}/tp-securite-ch${chapitre.num}.pdf`,
        size: '700 KB',
        format: 'PDF'
      },
      {
        name: 'Tableau périodique des éléments',
        url: `/downloads/chimie/tableau-periodique.pdf`,
        size: '500 KB',
        format: 'PDF'
      }
    ]
  };
}

function genererQuiz(niveau, chapitre) {
  return {
    title: `Évaluation - ${chapitre.titre}`,
    description: `Testez vos connaissances en chimie sur ${chapitre.titre} (${niveau})`,
    timeLimit: 30,
    passingScore: 12,
    totalPoints: 20,
    shuffleQuestions: true,
    showCorrectAnswers: true,
    questions: [
      {
        id: 1,
        type: 'multiple_choice',
        question: `Quelle est la formule chimique correcte pour ${chapitre.objectifs[0] ? chapitre.objectifs[0].toLowerCase() : 'ce composé'} ?`,
        points: 2,
        options: [
          { id: 'a', text: 'Formule incorrecte A', isCorrect: false },
          { id: 'b', text: 'Formule correcte (symbole)', isCorrect: true },
          { id: 'c', text: 'Formule incorrecte C', isCorrect: false },
          { id: 'd', text: 'Formule incorrecte D', isCorrect: false }
        ],
        explanation: 'La formule chimique correcte respecte les règles de nomenclature et les valences des éléments.',
        difficulty: 'facile'
      },
      {
        id: 2,
        type: 'true_false',
        question: `Affirmation chimique sur ${chapitre.titre.toLowerCase()}: [énoncé de loi chimique]`,
        points: 2,
        correctAnswer: true,
        explanation: 'Cette affirmation est vraie selon les lois de la chimie et les propriétés des éléments.',
        difficulty: 'facile'
      },
      {
        id: 3,
        type: 'calculation',
        question: 'Équilibrer l\'équation chimique suivante et calculer la masse de produit formé : [équation non équilibrée]',
        points: 6,
        correctAnswer: '42 g',
        acceptedAnswers: ['42', '42 g', '42g', '0.042 kg'],
        explanation: 'En équilibrant l\'équation et utilisant la stœchiométrie : [calcul détaillé avec masses molaires]',
        difficulty: 'moyen'
      },
      {
        id: 4,
        type: 'multiple_response',
        question: 'Parmi les affirmations suivantes sur les réactions chimiques, lesquelles sont vraies ? (Plusieurs réponses)',
        points: 5,
        options: [
          { id: 'a', text: 'Loi de conservation de la masse (vraie)', isCorrect: true },
          { id: 'b', text: 'Les atomes se créent dans une réaction (faux)', isCorrect: false },
          { id: 'c', text: 'Une réaction peut être équilibrée (vraie)', isCorrect: true },
          { id: 'd', text: 'Les liaisons chimiques se rompent et se forment (vrai)', isCorrect: true }
        ],
        explanation: 'Les affirmations a, c et d sont correctes selon les principes fondamentaux de la chimie.',
        difficulty: 'moyen',
        partialCredit: true
      },
      {
        id: 5,
        type: 'open_ended',
        question: `Décrire le mécanisme réactionnel complet et calculer le rendement : [situation problème industrielle]`,
        points: 5,
        correctAnswer: 'Mécanisme détaillé avec rendement calculé',
        steps: [
          'Étape 1: Écrire l\'équation équilibrée',
          'Étape 2: Identifier le réactif limitant',
          'Étape 3: Calculer la quantité théorique de produit',
          'Étape 4: Déterminer le rendement réel',
          'Étape 5: Calculer le rendement en pourcentage'
        ],
        explanation: 'Solution complète avec mécanisme réactionnel et calculs stœchiométriques...',
        difficulty: 'difficile'
      }
    ]
  };
}

// ============================================
// FONCTION PRINCIPALE
// ============================================

async function genererTouteChimie(models) {
  const { Subject, Chapter, Lesson } = models;

  console.log('\n' + '='.repeat(70));
  console.log('  ⚗️  GÉNÉRATION COMPLÈTE - CHIMIE');
  console.log('  📚 Programme Camerounais MINESEC');
  console.log('  🇨🇲 4ème → Terminale (Tous niveaux)');
  console.log('='.repeat(70) + '\n');

  let statsSubjects = 0;
  let statsChapters = 0;
  let statsLessons = 0;
  let statsQuiz = 0;

  const startTime = Date.now();

  for (const niveau of TOUS_NIVEAUX) {
    console.log(`\n📊 NIVEAU: ${niveau}`);
    console.log('-'.repeat(70));

    // Créer le Subject avec UUID
    const subjectTitle = `Chimie ${niveau}`;

    const [subject, created] = await Subject.findOrCreate({
      where: { title: subjectTitle },
      defaults: {
        id: uuidv4(),
        title: subjectTitle,
        description: `Programme complet de chimie pour la classe de ${niveau} selon le curriculum camerounais MINESEC`,
        level: niveau,
        category: MATIERE_CHIMIE.category,
        icon: MATIERE_CHIMIE.icon,
        color: MATIERE_CHIMIE.color,
        difficulty: ['4ème'].includes(niveau) ? 'Débutant' :
                    ['3ème', '2nde'].includes(niveau) ? 'Intermédiaire' : 'Avancé',
        estimatedDuration: 120,
        isActive: true,
        isPremium: false,
        order: TOUS_NIVEAUX.indexOf(niveau) + 1,
        cameroonCurriculum: {
          officialCode: `CHIM-${niveau.toUpperCase()}-2024`,
          ministerialRef: 'Programme MINESEC 2024',
          competencies: ['Observer', 'Expérimenter', 'Modéliser', 'Calculer', 'Analyser des transformations chimiques']
        }
      }
    });

    if (created) {
      statsSubjects++;
      console.log(`✅ Subject créé: ${subject.title}`);
    } else {
      console.log(`ℹ️  Subject existant: ${subject.title}`);
    }

    // Récupérer les chapitres
    const chapitres = CHAPITRES_CHIMIE[niveau] || [];

    for (const chapData of chapitres) {
      const [chapter, chapCreated] = await Chapter.findOrCreate({
        where: {
          subjectId: subject.id,
          number: chapData.num
        },
        defaults: {
          subjectId: subject.id,
          title: chapData.titre,
          description: `Chapitre ${chapData.num}: ${chapData.titre} - ${niveau}`,
          number: chapData.num,
          order: chapData.num,
          trimester: chapData.trimestre,
          series: chapData.series || [],
          objectives: chapData.objectifs,
          prerequisites: chapData.num > 1 ? [`Chapitre ${chapData.num - 1}`] : [],
          estimatedDuration: 180,
          difficulty: chapData.num <= 2 ? 'Débutant' : chapData.num <= 4 ? 'Intermédiaire' : 'Avancé',
          isActive: true,
          isPremium: false,
          officialReference: {
            code: `CHIM-${niveau.toUpperCase()}-CH${chapData.num}`,
            ministerialRef: 'Programme MINESEC 2024',
            trimestre: chapData.trimestre
          }
        }
      });

      if (chapCreated) {
        statsChapters++;
      }

      console.log(`   📂 Ch${chapData.num}: ${chapData.titre} (T${chapData.trimestre})`);

      // Créer 3 leçons par chapitre
      const typesLecons = ['reading', 'video', 'interactive'];
      const nbLecons = 3;

      for (let i = 0; i < nbLecons; i++) {
        const typeLecon = typesLecons[i % typesLecons.length];
        const numLecon = i + 1;
        const lessonTitle = `${chapData.titre} - Partie ${numLecon}`;

        const [lesson, lessonCreated] = await Lesson.findOrCreate({
          where: {
            subjectId: subject.id,
            title: lessonTitle
          },
          defaults: {
            title: lessonTitle,
            description: `Leçon ${numLecon} du chapitre ${chapData.num}: ${chapData.titre}`,
            subjectId: subject.id,
            chapterId: chapter.id,
            order: (chapData.num - 1) * nbLecons + numLecon,
            type: typeLecon,
            difficulty: i === 0 ? 'Débutant' : i === nbLecons - 1 ? 'Avancé' : 'Intermédiaire',
            estimatedDuration: 45,
            content: genererContenuLecon(niveau, chapData, numLecon, typeLecon),
            objectives: chapData.objectifs.slice(0, 2),
            prerequisites: numLecon > 1 ? [`Leçon ${numLecon - 1}`] : [],
            hasQuiz: i === nbLecons - 1,
            quiz: i === nbLecons - 1 ? genererQuiz(niveau, chapData) : null,
            isActive: true,
            isPremium: false,
            isFree: i === 0,
            reviewStatus: 'approved',
            publishedAt: new Date(),
            cameroonContext: {
              localExamples: [
                'SONARA Limbé (raffinage pétrole)',
                'CAMWATER (traitement eau)',
                'SABC (brasserie)',
                'Production savon artisanal',
                'IMPM (médicaments)'
              ],
              culturalReferences: ['Applications chimiques industrielles au Cameroun'],
              localLanguageTerms: {}
            },
            metadata: {
              tags: ['chimie', niveau.toLowerCase(), `chapitre-${chapData.num}`, 'cameroun', 'sciences', 'reactions-chimiques'],
              searchKeywords: [chapData.titre.toLowerCase(), 'chimie', niveau.toLowerCase(), 'equations', 'molecules'],
              language: 'fr',
              version: '1.0',
              authorNotes: `Généré automatiquement - Programme MINESEC Chimie ${niveau}`
            }
          }
        });

        if (lessonCreated) {
          statsLessons++;
          if (lesson.hasQuiz) statsQuiz++;
          const icons = [];
          if (lesson.isFree) icons.push('🆓');
          if (lesson.hasQuiz) icons.push('📝');
          console.log(`      ${icons.join(' ')} L${numLecon}: ${typeLecon}`);
        }
      }

      // Mettre à jour stats du chapitre
      await chapter.updateStats();
    }

    // Mettre à jour stats du subject
    await subject.updateStats();

    console.log(`   ✅ ${niveau} terminé: ${chapitres.length} chapitres, ${chapitres.length * 3} leçons`);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n' + '='.repeat(70));
  console.log('  ✅ GÉNÉRATION TERMINÉE AVEC SUCCÈS !');
  console.log('='.repeat(70));
  console.log(`\n📊 STATISTIQUES FINALES:`);
  console.log(`   🎯 Subjects créés: ${statsSubjects}/${TOUS_NIVEAUX.length}`);
  console.log(`   📂 Chapitres créés: ${statsChapters}`);
  console.log(`   📚 Leçons créées: ${statsLessons}`);
  console.log(`   📝 Quiz créés: ${statsQuiz}`);
  console.log(`   ⏱️  Durée: ${duration} secondes`);
  console.log(`\n💾 Base de données: PostgreSQL`);
  console.log(`🌐 API: http://89.117.58.53:3001/api/students/subjects`);
  console.log(`🖥️  Interface Admin: https://www.claudyne.com/admin-interface.html`);
  console.log(`\n💚 La force du savoir en héritage - Claudine 💚\n`);
}

// ============================================
// POINT D'ENTRÉE
// ============================================

async function main() {
  try {
    console.log('🔗 Connexion à PostgreSQL...');
    const models = database.initializeModels();
    console.log('✅ Connexion établie\n');

    await genererTouteChimie(models);

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
