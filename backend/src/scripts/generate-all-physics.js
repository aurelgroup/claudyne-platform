/**
 * Script Automatique - Génération COMPLÈTE Physique
 * 5ème → Terminale - Programme Camerounais MINESEC
 *
 * Usage: node backend/src/scripts/generate-all-physics.js
 */

require('dotenv').config({ path: __dirname + '/../../../.env' });
const database = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// ============================================
// CONFIGURATION COMPLÈTE PHYSIQUE
// ============================================

const TOUS_NIVEAUX = ['5ème', '4ème', '3ème', '2nde', '1ère', 'Tle'];

const CHAPITRES_PHYSIQUE = {
  '5ème': [
    { num: 1, titre: 'La lumière et les couleurs', trimestre: 1, objectifs: ['Sources de lumière', 'Propagation rectiligne', 'Ombre et pénombre'] },
    { num: 2, titre: 'L\'électricité de base', trimestre: 1, objectifs: ['Circuit électrique simple', 'Conducteurs et isolants', 'Sécurité électrique'] },
    { num: 3, titre: 'Les états de la matière', trimestre: 2, objectifs: ['Solide, liquide, gaz', 'Changements d\'état', 'Température'] },
    { num: 4, titre: 'Le mouvement', trimestre: 2, objectifs: ['Trajectoire', 'Vitesse', 'Mouvements rectilignes'] },
    { num: 5, titre: 'L\'eau et l\'environnement', trimestre: 3, objectifs: ['Cycle de l\'eau', 'Mélanges et solutions', 'Qualité de l\'eau'] }
  ],
  '4ème': [
    { num: 1, titre: 'Optique géométrique', trimestre: 1, objectifs: ['Réflexion de la lumière', 'Miroirs plans', 'Réfraction'] },
    { num: 2, titre: 'Circuit électrique série et parallèle', trimestre: 1, objectifs: ['Lois des circuits', 'Intensité du courant', 'Montages électriques'] },
    { num: 3, titre: 'Masse et volume', trimestre: 2, objectifs: ['Mesure de masse', 'Mesure de volume', 'Masse volumique'] },
    { num: 4, titre: 'Forces et mouvements', trimestre: 2, objectifs: ['Notion de force', 'Poids', 'Équilibre'] },
    { num: 5, titre: 'Énergie et transformation', trimestre: 3, objectifs: ['Formes d\'énergie', 'Transformations énergétiques', 'Sources d\'énergie'] }
  ],
  '3ème': [
    { num: 1, titre: 'Électricité : Loi d\'Ohm', trimestre: 1, objectifs: ['Tension électrique', 'Résistance', 'Loi d\'Ohm U=RI'] },
    { num: 2, titre: 'Puissance et énergie électrique', trimestre: 1, objectifs: ['Puissance P=UI', 'Énergie E=Pt', 'Applications pratiques'] },
    { num: 3, titre: 'Mécanique : Vitesse et accélération', trimestre: 2, objectifs: ['Vitesse moyenne', 'Accélération', 'Mouvements variés'] },
    { num: 4, titre: 'Force et mouvement', trimestre: 2, objectifs: ['Principe d\'inertie', 'Force et accélération', 'Poids et masse'] },
    { num: 5, titre: 'Énergie mécanique', trimestre: 3, objectifs: ['Énergie cinétique', 'Énergie potentielle', 'Conservation de l\'énergie'] }
  ],
  '2nde': [
    { num: 1, titre: 'Cinématique du point matériel', trimestre: 1, objectifs: ['Repérage dans l\'espace', 'Vecteur position et vitesse', 'Mouvement rectiligne uniforme'] },
    { num: 2, titre: 'Les forces', trimestre: 1, objectifs: ['Force et vecteur force', 'Composition des forces', 'Équilibre d\'un solide'] },
    { num: 3, titre: 'Travail et puissance', trimestre: 2, objectifs: ['Travail d\'une force', 'Puissance mécanique', 'Rendement'] },
    { num: 4, titre: 'Optique géométrique avancée', trimestre: 2, objectifs: ['Lentilles minces', 'Formation des images', 'Instruments d\'optique'] },
    { num: 5, titre: 'Électricité : Lois de Kirchhoff', trimestre: 3, objectifs: ['Loi des nœuds', 'Loi des mailles', 'Résolution de circuits'] }
  ],
  '1ère': [
    { num: 1, titre: 'Dynamique : Lois de Newton', trimestre: 1, objectifs: ['Première loi de Newton', 'Deuxième loi F=ma', 'Troisième loi'], series: ['C', 'D'] },
    { num: 2, titre: 'Travail et énergie mécanique', trimestre: 1, objectifs: ['Théorème de l\'énergie cinétique', 'Énergie potentielle de pesanteur', 'Conservation de l\'énergie'], series: ['C', 'D'] },
    { num: 3, titre: 'Électrostatique', trimestre: 2, objectifs: ['Charge électrique', 'Loi de Coulomb', 'Champ électrique'], series: ['C', 'D'] },
    { num: 4, titre: 'Courant électrique continu', trimestre: 2, objectifs: ['Générateurs', 'Récepteurs', 'Loi de Pouillet'], series: ['C', 'D'] },
    { num: 5, titre: 'Ondes mécaniques', trimestre: 3, objectifs: ['Propagation d\'une onde', 'Ondes périodiques', 'Vitesse de propagation'], series: ['C', 'D'] }
  ],
  'Tle': [
    { num: 1, titre: 'Mécanique du solide', trimestre: 1, objectifs: ['Moment d\'une force', 'Équilibre d\'un solide', 'Centre de gravité'], series: ['C', 'D'] },
    { num: 2, titre: 'Oscillations mécaniques', trimestre: 1, objectifs: ['Pendule simple', 'Oscillateur harmonique', 'Amortissement'], series: ['C', 'D'] },
    { num: 3, titre: 'Électromagnétisme', trimestre: 2, objectifs: ['Champ magnétique', 'Force de Laplace', 'Induction électromagnétique'], series: ['C', 'D'] },
    { num: 4, titre: 'Circuit RLC', trimestre: 2, objectifs: ['Dipôles R, L, C', 'Oscillations électriques', 'Résonance'], series: ['C', 'D'] },
    { num: 5, titre: 'Physique moderne', trimestre: 3, objectifs: ['Dualité onde-corpuscule', 'Effet photoélectrique', 'Radioactivité'], series: ['C', 'D'] }
  ]
};

const MATIERE_PHYSIQUE = {
  id: 'physique',
  nom: 'Physique',
  icon: '⚛️',
  color: '#10B981',
  category: 'Sciences'
};

// ============================================
// GÉNÉRATEUR DE CONTENU
// ============================================

function genererContenuLecon(niveau, chapitre, numLecon, typeLecon) {
  const exemplesCameroun = [
    'Barrage hydroélectrique de Lagdo (production d\'électricité)',
    'Éclairage solaire dans les villages camerounais',
    'Réseau ENEO au Cameroun',
    'Température moyenne à Douala (28°C)',
    'Altitude de Yaoundé (750 mètres)',
    'Vitesse d\'un taxi-brousse Douala-Yaoundé (80 km/h)',
    'Puissance d\'un groupe électrogène (5 kW)',
    'Pression atmosphérique au Mont Cameroun',
    'Réfraction de la lumière dans le lac Nyos',
    'Téléphonie mobile (signal électromagnétique)'
  ];

  const exemple1 = exemplesCameroun[Math.floor(Math.random() * exemplesCameroun.length)];
  const exemple2 = exemplesCameroun[Math.floor(Math.random() * exemplesCameroun.length)];

  return {
    videoUrl: typeLecon === 'video' ? `https://www.youtube.com/watch?v=physique-${niveau}-ch${chapitre.num}-l${numLecon}` : null,

    transcript: `# ${chapitre.titre} - Leçon ${numLecon}\n\n## Introduction\n\nBienvenue dans cette leçon ${numLecon} sur **${chapitre.titre.toLowerCase()}**. Cette leçon fait partie du programme de physique ${niveau} selon le curriculum camerounais MINESEC.\n\n## I. Rappels et Prérequis\n\nAvant de commencer, rappelons les concepts suivants :\n${chapitre.objectifs[0] ? `- ${chapitre.objectifs[0]}` : '- Les bases du chapitre précédent'}\n\n## II. Phénomènes Physiques\n\n### Phénomène 1: ${chapitre.objectifs[0] || 'Observation'}\n\nExplication scientifique avec lois physiques et formules.\n\n**Exemple du Cameroun :** ${exemple1}\n\nAnalyse quantitative et qualitative...\n\n### Phénomène 2: ${chapitre.objectifs[1] || 'Application'}\n\nLien entre théorie et pratique.\n\n**Application :** ${exemple2}\n\n## III. Lois et Formules\n\n### Loi fondamentale\n\nÉnoncé de la loi principale de ce chapitre.\n\n**Formule :** [Expression mathématique]\n\n**Unités SI :**\n- Grandeur 1 : Unité (symbole)\n- Grandeur 2 : Unité (symbole)\n\n### Applications Numériques\n\nExercices d'application directe de la formule.\n\n## IV. Expériences et Manipulations\n\n### Expérience 1: Vérification expérimentale\n\n**Matériel nécessaire :**\n- Liste du matériel\n- Protocole expérimental\n- Résultats attendus\n\n### Expérience 2: Application pratique\n\nExpérience réalisable avec du matériel disponible au Cameroun.\n\n## V. Exercices d'Application\n\nMettez en pratique les lois et formules vues.\n\n## Conclusion\n\nPoints essentiels à retenir :\n${chapitre.objectifs.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}\n\n**Prochaine leçon :** Leçon ${numLecon + 1} - Approfondissement`,

    keyPoints: chapitre.objectifs.slice(0, 3).map((obj, i) => ({
      title: `${obj}`,
      content: `Ce concept est fondamental en physique ${niveau}. Il permet de comprendre les phénomènes naturels et techniques au Cameroun et dans le monde. La maîtrise de ${obj.toLowerCase()} est essentielle pour progresser dans les sciences physiques.`
    })),

    exercises: [
      {
        id: 1,
        title: 'Exercice d\'application de formule',
        question: `Calculer [grandeur physique] en utilisant ${chapitre.objectifs[0] ? chapitre.objectifs[0].toLowerCase() : 'la formule vue'}.`,
        answer: 'Résultat numérique avec unité',
        explanation: `Pour résoudre cet exercice de physique :\n\nÉtape 1: Identifier les données (avec unités SI)\nÉtape 2: Appliquer la formule\nÉtape 3: Calculer et vérifier l'unité du résultat`,
        difficulty: 'facile'
      },
      {
        id: 2,
        title: 'Problème de physique appliquée',
        question: `Un système physique au Cameroun : ${exemple1}. Déterminer les grandeurs demandées.`,
        answer: 'Solution complète avec justifications',
        explanation: `Ce problème combine plusieurs concepts du chapitre. Il faut :\n1. Analyser la situation physique\n2. Identifier les lois applicables\n3. Résoudre mathématiquement\n4. Interpréter le résultat physiquement`,
        difficulty: 'moyen'
      },
      {
        id: 3,
        title: 'Exercice de synthèse',
        question: `Problème complexe sur ${chapitre.titre.toLowerCase()} nécessitant raisonnement scientifique et calculs.`,
        answer: 'Solution détaillée étape par étape',
        explanation: `Solution complète avec :\n- Schéma ou diagramme\n- Hypothèses et approximations\n- Calculs détaillés\n- Discussion des résultats\n- Vérification dimensionnelle`,
        difficulty: 'difficile'
      }
    ],

    resources: [
      {
        type: 'pdf',
        title: `Formulaire - ${chapitre.titre}`,
        url: `/resources/physique/${niveau}/ch${chapitre.num}/formulaire.pdf`,
        description: 'Toutes les formules et constantes physiques'
      },
      {
        type: 'video',
        title: 'Expériences en vidéo',
        url: `https://www.youtube.com/watch?v=exp-physique-${niveau}`,
        duration: '15:00'
      },
      {
        type: 'interactive',
        title: 'Simulation PhET',
        url: `https://phet.colorado.edu/sims/html/physics-${chapitre.num}`,
        description: 'Manipulation virtuelle des phénomènes physiques'
      }
    ],

    downloadableFiles: [
      {
        name: `Fiche de révision - ${chapitre.titre}`,
        url: `/downloads/physique/${niveau}/fiche-ch${chapitre.num}.pdf`,
        size: '850 KB',
        format: 'PDF'
      },
      {
        name: 'Exercices corrigés avec barèmes',
        url: `/downloads/physique/${niveau}/exercices-ch${chapitre.num}.pdf`,
        size: '1.5 MB',
        format: 'PDF'
      },
      {
        name: 'Protocoles d\'expériences',
        url: `/downloads/physique/${niveau}/tp-ch${chapitre.num}.pdf`,
        size: '600 KB',
        format: 'PDF'
      }
    ]
  };
}

function genererQuiz(niveau, chapitre) {
  return {
    title: `Évaluation - ${chapitre.titre}`,
    description: `Testez vos connaissances en physique sur ${chapitre.titre} (${niveau})`,
    timeLimit: 30,
    passingScore: 12,
    totalPoints: 20,
    shuffleQuestions: true,
    showCorrectAnswers: true,
    questions: [
      {
        id: 1,
        type: 'multiple_choice',
        question: `Quelle est l'unité SI de ${chapitre.objectifs[0] ? chapitre.objectifs[0].toLowerCase() : 'la grandeur physique'} ?`,
        points: 2,
        options: [
          { id: 'a', text: 'Unité incorrecte A', isCorrect: false },
          { id: 'b', text: 'Unité correcte (symbole)', isCorrect: true },
          { id: 'c', text: 'Unité incorrecte C', isCorrect: false },
          { id: 'd', text: 'Unité incorrecte D', isCorrect: false }
        ],
        explanation: 'L\'unité SI est définie par le Système International d\'Unités.',
        difficulty: 'facile'
      },
      {
        id: 2,
        type: 'true_false',
        question: `Affirmation concernant ${chapitre.titre.toLowerCase()}: [énoncé physique]`,
        points: 2,
        correctAnswer: true,
        explanation: 'Cette affirmation est vraie selon la loi physique vue en cours.',
        difficulty: 'facile'
      },
      {
        id: 3,
        type: 'calculation',
        question: 'Calculer la grandeur physique suivante avec les données fournies : [données numériques]',
        points: 6,
        correctAnswer: '42',
        acceptedAnswers: ['42', '42.0', '4.2×10¹'],
        explanation: 'En appliquant la formule vue en cours avec les données : [calcul détaillé]',
        difficulty: 'moyen'
      },
      {
        id: 4,
        type: 'multiple_response',
        question: 'Parmi les affirmations suivantes sur les lois de la physique, lesquelles sont vraies ? (Plusieurs réponses)',
        points: 5,
        options: [
          { id: 'a', text: 'Loi physique 1 (vraie)', isCorrect: true },
          { id: 'b', text: 'Affirmation fausse 2', isCorrect: false },
          { id: 'c', text: 'Loi physique 3 (vraie)', isCorrect: true },
          { id: 'd', text: 'Principe physique 4 (vrai)', isCorrect: true }
        ],
        explanation: 'Les affirmations a, c et d sont des lois physiques validées expérimentalement.',
        difficulty: 'moyen',
        partialCredit: true
      },
      {
        id: 5,
        type: 'open_ended',
        question: `Expliquer le phénomène physique suivant et calculer les grandeurs demandées : [situation problème]`,
        points: 5,
        correctAnswer: 'Explication complète avec calculs',
        steps: [
          'Étape 1: Analyser le phénomène physique',
          'Étape 2: Identifier les lois applicables',
          'Étape 3: Poser les équations',
          'Étape 4: Résoudre numériquement',
          'Étape 5: Vérifier la cohérence physique'
        ],
        explanation: 'Solution détaillée avec analyse physique complète...',
        difficulty: 'difficile'
      }
    ]
  };
}

// ============================================
// FONCTION PRINCIPALE
// ============================================

async function genererToutePhysique(models) {
  const { Subject, Chapter, Lesson } = models;

  console.log('\n' + '='.repeat(70));
  console.log('  ⚛️  GÉNÉRATION COMPLÈTE - PHYSIQUE');
  console.log('  📚 Programme Camerounais MINESEC');
  console.log('  🇨🇲 5ème → Terminale (Tous niveaux)');
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
    const subjectTitle = `Physique ${niveau}`;

    const [subject, created] = await Subject.findOrCreate({
      where: { title: subjectTitle },
      defaults: {
        id: uuidv4(),
        title: subjectTitle,
        description: `Programme complet de physique pour la classe de ${niveau} selon le curriculum camerounais MINESEC`,
        level: niveau,
        category: MATIERE_PHYSIQUE.category,
        icon: MATIERE_PHYSIQUE.icon,
        color: MATIERE_PHYSIQUE.color,
        difficulty: ['5ème', '4ème'].includes(niveau) ? 'Débutant' :
                    ['3ème', '2nde'].includes(niveau) ? 'Intermédiaire' : 'Avancé',
        estimatedDuration: 120,
        isActive: true,
        isPremium: false,
        order: TOUS_NIVEAUX.indexOf(niveau) + 1,
        cameroonCurriculum: {
          officialCode: `PHYS-${niveau.toUpperCase()}-2024`,
          ministerialRef: 'Programme MINESEC 2024',
          competencies: ['Observer', 'Expérimenter', 'Modéliser', 'Calculer', 'Raisonner scientifiquement']
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
    const chapitres = CHAPITRES_PHYSIQUE[niveau] || [];

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
            code: `PHYS-${niveau.toUpperCase()}-CH${chapData.num}`,
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
                'Barrage de Lagdo (hydroélectricité)',
                'Réseau ENEO Cameroun',
                'Éclairage solaire rural',
                'Mont Cameroun (pression atmosphérique)'
              ],
              culturalReferences: ['Applications technologiques au Cameroun'],
              localLanguageTerms: {}
            },
            metadata: {
              tags: ['physique', niveau.toLowerCase(), `chapitre-${chapData.num}`, 'cameroun', 'sciences'],
              searchKeywords: [chapData.titre.toLowerCase(), 'physique', niveau.toLowerCase()],
              language: 'fr',
              version: '1.0',
              authorNotes: `Généré automatiquement - Programme MINESEC Physique ${niveau}`
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

    await genererToutePhysique(models);

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
