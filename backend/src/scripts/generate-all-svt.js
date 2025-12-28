/**
 * Script Automatique - Génération COMPLÈTE SVT
 * 6ème → Terminale - Programme Camerounais MINESEC
 *
 * Usage: node backend/src/scripts/generate-all-svt.js
 */

require('dotenv').config({ path: __dirname + '/../../../.env' });
const database = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// ============================================
// CONFIGURATION COMPLÈTE SVT
// ============================================

const TOUS_NIVEAUX = ['6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Tle'];

const CHAPITRES_SVT = {
  '6ème': [
    { num: 1, titre: 'L\'environnement et les êtres vivants', trimestre: 1, objectifs: ['Observer l\'environnement', 'Classification des êtres vivants', 'Relations alimentaires'] },
    { num: 2, titre: 'Le peuplement des milieux', trimestre: 1, objectifs: ['Reproduction des plantes', 'Reproduction des animaux', 'Colonisation des milieux'] },
    { num: 3, titre: 'L\'homme et la biodiversité', trimestre: 2, objectifs: ['Protection de l\'environnement', 'Espèces menacées au Cameroun', 'Développement durable'] },
    { num: 4, titre: 'Notre corps', trimestre: 2, objectifs: ['Les organes', 'Fonctionnement du corps', 'Hygiène corporelle'] },
    { num: 5, titre: 'L\'alimentation', trimestre: 3, objectifs: ['Groupes d\'aliments', 'Équilibre alimentaire', 'Digestion'] }
  ],
  '5ème': [
    { num: 1, titre: 'Respiration et occupation des milieux', trimestre: 1, objectifs: ['Respiration aquatique', 'Respiration aérienne', 'Adaptation au milieu'] },
    { num: 2, titre: 'Circulation sanguine', trimestre: 1, objectifs: ['Le cœur et les vaisseaux', 'Circulation du sang', 'Rôle du sang'] },
    { num: 3, titre: 'Géologie : la Terre', trimestre: 2, objectifs: ['Structure de la Terre', 'Roches et minéraux', 'Volcans et séismes'] },
    { num: 4, titre: 'Les microorganismes', trimestre: 2, objectifs: ['Bactéries et virus', 'Maladies infectieuses', 'Hygiène et prévention'] },
    { num: 5, titre: 'Reproduction humaine', trimestre: 3, objectifs: ['Appareil reproducteur', 'Puberté', 'Fécondation et grossesse'] }
  ],
  '4ème': [
    { num: 1, titre: 'Activité du corps et besoins énergétiques', trimestre: 1, objectifs: ['Besoins nutritionnels', 'Respiration cellulaire', 'Élimination des déchets'] },
    { num: 2, titre: 'Transmission de la vie chez l\'Homme', trimestre: 1, objectifs: ['Cycles sexuels', 'Contraception', 'IST et prévention'] },
    { num: 3, titre: 'Relations au sein de l\'organisme', trimestre: 2, objectifs: ['Système nerveux', 'Communication hormonale', 'Réflexes'] },
    { num: 4, titre: 'Géologie externe', trimestre: 2, objectifs: ['Érosion', 'Sédimentation', 'Paysages camerounais'] },
    { num: 5, titre: 'Évolution des paysages', trimestre: 3, objectifs: ['Action de l\'eau', 'Action du vent', 'Impact humain au Cameroun'] }
  ],
  '3ème': [
    { num: 1, titre: 'Génétique et hérédité', trimestre: 1, objectifs: ['ADN et gènes', 'Chromosomes', 'Transmission des caractères'] },
    { num: 2, titre: 'Évolution des espèces', trimestre: 1, objectifs: ['Théorie de l\'évolution', 'Sélection naturelle', 'Fossiles'] },
    { num: 3, titre: 'Défenses immunitaires', trimestre: 2, objectifs: ['Immunité innée', 'Immunité acquise', 'Vaccination'] },
    { num: 4, titre: 'Responsabilité humaine (santé)', trimestre: 2, objectifs: ['Maladies au Cameroun', 'Paludisme et prévention', 'VIH/SIDA'] },
    { num: 5, titre: 'Responsabilité environnementale', trimestre: 3, objectifs: ['Pollution', 'Déforestation au Cameroun', 'Gestion des ressources'] }
  ],
  '2nde': [
    { num: 1, titre: 'La cellule unité du vivant', trimestre: 1, objectifs: ['Structure cellulaire', 'Cellule animale et végétale', 'Métabolisme cellulaire'] },
    { num: 2, titre: 'L\'ADN support de l\'information génétique', trimestre: 1, objectifs: ['Structure de l\'ADN', 'Réplication', 'Expression génétique'] },
    { num: 3, titre: 'Biodiversité et classification', trimestre: 2, objectifs: ['Critères de classification', 'Arbre phylogénétique', 'Biodiversité camerounaise'] },
    { num: 4, titre: 'Géologie : histoire de la Terre', trimestre: 2, objectifs: ['Échelle des temps géologiques', 'Datation', 'Grandes crises biologiques'] },
    { num: 5, titre: 'Enjeux planétaires contemporains', trimestre: 3, objectifs: ['Ressources naturelles', 'Changement climatique', 'Développement durable'] }
  ],
  '1ère': [
    { num: 1, titre: 'Génétique et variation', trimestre: 1, objectifs: ['Mutations', 'Brassage génétique', 'Diversité génétique'], series: ['D'] },
    { num: 2, titre: 'Immunologie', trimestre: 1, objectifs: ['Réponse immunitaire', 'Antigènes et anticorps', 'Mémoire immunitaire'], series: ['D'] },
    { num: 3, titre: 'Neurophysiologie', trimestre: 2, objectifs: ['Neurone et message nerveux', 'Transmission synaptique', 'Intégration nerveuse'], series: ['D'] },
    { num: 4, titre: 'Géologie : tectonique des plaques', trimestre: 2, objectifs: ['Lithosphère', 'Dérive des continents', 'Zones de subduction'], series: ['D'] },
    { num: 5, titre: 'Photosynthèse', trimestre: 3, objectifs: ['Phase photochimique', 'Phase chimique', 'Facteurs limitants'], series: ['D'] }
  ],
  'Tle': [
    { num: 1, titre: 'Génétique et évolution', trimestre: 1, objectifs: ['Mécanismes de l\'évolution', 'Spéciation', 'Phylogénie'], series: ['D'] },
    { num: 2, titre: 'Procréation', trimestre: 1, objectifs: ['Régulation hormonale', 'Gamétogenèse', 'Maîtrise de la reproduction'], series: ['D'] },
    { num: 3, titre: 'Immunologie appliquée', trimestre: 2, objectifs: ['SIDA et autres pandémies', 'Immunothérapie', 'Greffes'], series: ['D'] },
    { num: 4, titre: 'Géologie et ressources', trimestre: 2, objectifs: ['Formation des roches', 'Ressources minières camerounaises', 'Géothermie'], series: ['D'] },
    { num: 5, titre: 'Écosystèmes et dynamique', trimestre: 3, objectifs: ['Flux d\'énergie', 'Cycles biogéochimiques', 'Écosystèmes camerounais'], series: ['D'] }
  ]
};

const MATIERE_SVT = {
  id: 'svt',
  nom: 'Sciences de la Vie et de la Terre',
  icon: '🌿',
  color: '#10B981',
  category: 'Sciences'
};

// ============================================
// GÉNÉRATEUR DE CONTENU
// ============================================

function genererContenuLecon(niveau, chapitre, numLecon, typeLecon) {
  const exemplesCameroun = [
    'Forêt tropicale du bassin du Congo',
    'Parc national de Waza (faune)',
    'Réserve de biosphère de Dja',
    'Mont Cameroun et biodiversité',
    'Mangroves de Kribi',
    'Lac Nyos (géologie volcanique)',
    'Faune endémique du Cameroun (gorilles, éléphants)',
    'Agriculture vivrière camerounaise',
    'Paludisme au Cameroun (prévention)',
    'Flore médicinale traditionnelle',
    'Érosion côtière à Limbé',
    'Déforestation dans la région de l\'Est',
    'Ressources halieutiques (pêche)',
    'Volcans actifs camerounais',
    'Écosystèmes de savane (Nord Cameroun)'
  ];

  const exemple1 = exemplesCameroun[Math.floor(Math.random() * exemplesCameroun.length)];
  const exemple2 = exemplesCameroun[Math.floor(Math.random() * exemplesCameroun.length)];

  return {
    videoUrl: typeLecon === 'video' ? `https://www.youtube.com/watch?v=svt-${niveau}-ch${chapitre.num}-l${numLecon}` : null,

    transcript: `# ${chapitre.titre} - Leçon ${numLecon}\n\n## Introduction\n\nBienvenue dans cette leçon ${numLecon} sur **${chapitre.titre.toLowerCase()}**. Cette leçon fait partie du programme de SVT ${niveau} selon le curriculum camerounais MINESEC.\n\n## I. Rappels et Prérequis en SVT\n\nAvant de commencer, révisons les concepts biologiques et géologiques suivants :\n${chapitre.objectifs[0] ? `- ${chapitre.objectifs[0]}` : '- Les bases du chapitre précédent'}\n\n## II. Observations et Découvertes Scientifiques\n\n### Observation 1: ${chapitre.objectifs[0] || 'Phénomène naturel'}\n\nExplication scientifique basée sur l'observation et l'expérimentation.\n\n**Exemple au Cameroun :** ${exemple1}\n\nAnalyse détaillée du phénomène dans le contexte camerounais : conditions écologiques, adaptation des espèces, facteurs environnementaux...\n\n### Observation 2: ${chapitre.objectifs[1] || 'Application pratique'}\n\nLien entre sciences de la vie et sciences de la Terre.\n\n**Cas d'étude :** ${exemple2}\n\n## III. Concepts Scientifiques Fondamentaux\n\n### Concept biologique principal\n\nExplication avec schémas et illustrations.\n\n**Définition :** Explication claire et précise du concept.\n\n**Fonctionnement :**\n1. Mécanisme 1\n2. Mécanisme 2\n3. Régulation et adaptation\n\n### Applications et implications\n\nComment ce concept s'applique dans la nature et pour l'Homme.\n\n## IV. Travaux Pratiques et Observations\n\n### TP 1: Observation microscopique\n\n**Matériel nécessaire :**\n- Microscope\n- Lames et lamelles\n- Échantillons biologiques\n- Colorants (si nécessaire)\n\n**Protocole :**\n1. Préparation de l'échantillon\n2. Observation au microscope\n3. Réalisation de schémas annotés\n4. Interprétation des observations\n\n### TP 2: Étude de terrain (contexte camerounais)\n\nÉtude écologique ou géologique adaptée à l'environnement local.\n\n**Objectifs :**\n- Observer la biodiversité locale\n- Identifier les espèces\n- Analyser les relations écologiques\n- Mesurer des paramètres environnementaux\n\n## V. Enjeux et Applications\n\n### Santé humaine\n\nImplications pour la santé publique au Cameroun.\n\n### Environnement\n\nConservation de la biodiversité et gestion durable des ressources.\n\n### Développement durable\n\nComment concilier développement et préservation de l'environnement.\n\n## Conclusion\n\nPoints essentiels à retenir :\n${chapitre.objectifs.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}\n\n**Prochaine leçon :** Leçon ${numLecon + 1} - Approfondissement\n\n**🌍 Le saviez-vous ?**\nLe Cameroun est surnommé "l'Afrique en miniature" car il concentre tous les écosystèmes africains : forêt tropicale, savane, montagne, mangrove, désert...`,

    keyPoints: chapitre.objectifs.slice(0, 3).map((obj, i) => ({
      title: `${obj}`,
      content: `Ce concept est essentiel en SVT ${niveau}. Il permet de comprendre le fonctionnement du vivant et les processus géologiques. La maîtrise de ${obj.toLowerCase()} est fondamentale pour appréhender la biodiversité camerounaise et les enjeux environnementaux.`
    })),

    exercises: [
      {
        id: 1,
        title: 'Exercice d\'observation et d\'analyse',
        question: `Observer le document fourni et identifier ${chapitre.objectifs[0] ? chapitre.objectifs[0].toLowerCase() : 'les structures principales'}.`,
        answer: 'Schéma légendé avec explications',
        explanation: `Pour réaliser cet exercice de SVT :\n\nÉtape 1: Observer attentivement le document\nÉtape 2: Identifier les structures ou éléments clés\nÉtape 3: Annoter et légender\nÉtape 4: Expliquer le fonctionnement ou les relations`,
        difficulty: 'facile'
      },
      {
        id: 2,
        title: 'Problème appliqué au contexte camerounais',
        question: `Dans un écosystème camerounais : ${exemple1}. Analyser les relations et interactions.`,
        answer: 'Analyse écologique complète',
        explanation: `Ce problème nécessite :\n1. Identifier les composantes de l'écosystème\n2. Analyser les chaînes alimentaires\n3. Comprendre les cycles (eau, carbone...)\n4. Évaluer l'impact des activités humaines`,
        difficulty: 'moyen'
      },
      {
        id: 3,
        title: 'Exercice de synthèse',
        question: `Problème complexe sur ${chapitre.titre.toLowerCase()} intégrant plusieurs concepts de SVT.`,
        answer: 'Solution détaillée avec schémas',
        explanation: `Solution complète incluant :\n- Schémas biologiques annotés\n- Graphiques et données\n- Explications scientifiques\n- Liens avec l'environnement camerounais\n- Propositions de conservation ou gestion`,
        difficulty: 'difficile'
      }
    ],

    resources: [
      {
        type: 'pdf',
        title: `Fiches espèces - ${chapitre.titre}`,
        url: `/resources/svt/${niveau}/ch${chapitre.num}/fiches-especes.pdf`,
        description: 'Fiches descriptives des espèces étudiées'
      },
      {
        type: 'video',
        title: 'Documentaire nature Cameroun',
        url: `https://www.youtube.com/watch?v=doc-svt-${niveau}`,
        duration: '20:00'
      },
      {
        type: 'interactive',
        title: 'Atlas interactif biodiversité',
        url: `https://biodiversity-cameroon.org/atlas`,
        description: 'Carte interactive de la biodiversité camerounaise'
      }
    ],

    downloadableFiles: [
      {
        name: `Fiche de révision - ${chapitre.titre}`,
        url: `/downloads/svt/${niveau}/fiche-ch${chapitre.num}.pdf`,
        size: '1.1 MB',
        format: 'PDF'
      },
      {
        name: 'Protocoles de TP',
        url: `/downloads/svt/${niveau}/tp-ch${chapitre.num}.pdf`,
        size: '800 KB',
        format: 'PDF'
      },
      {
        name: 'Atlas de biodiversité camerounaise',
        url: `/downloads/svt/atlas-biodiversite-cameroun.pdf`,
        size: '3.5 MB',
        format: 'PDF'
      },
      {
        name: 'Guide d\'identification espèces',
        url: `/downloads/svt/${niveau}/guide-identification.pdf`,
        size: '2.2 MB',
        format: 'PDF'
      }
    ]
  };
}

function genererQuiz(niveau, chapitre) {
  return {
    title: `Évaluation - ${chapitre.titre}`,
    description: `Testez vos connaissances en SVT sur ${chapitre.titre} (${niveau})`,
    timeLimit: 25,
    passingScore: 12,
    totalPoints: 20,
    shuffleQuestions: true,
    showCorrectAnswers: true,
    questions: [
      {
        id: 1,
        type: 'multiple_choice',
        question: `Concernant ${chapitre.objectifs[0] ? chapitre.objectifs[0].toLowerCase() : 'ce concept'}, quelle affirmation est correcte ?`,
        points: 3,
        options: [
          { id: 'a', text: 'Affirmation incorrecte A', isCorrect: false },
          { id: 'b', text: 'Affirmation correcte', isCorrect: true },
          { id: 'c', text: 'Affirmation incorrecte C', isCorrect: false },
          { id: 'd', text: 'Affirmation incorrecte D', isCorrect: false }
        ],
        explanation: 'Cette affirmation est correcte selon les observations scientifiques et les connaissances actuelles en biologie.',
        difficulty: 'facile'
      },
      {
        id: 2,
        type: 'true_false',
        question: `Au Cameroun, on observe que [affirmation sur la biodiversité ou géologie locale]`,
        points: 2,
        correctAnswer: true,
        explanation: 'Cette observation est vraie et caractéristique des écosystèmes camerounais.',
        difficulty: 'facile'
      },
      {
        id: 3,
        type: 'multiple_response',
        question: 'Parmi les caractéristiques suivantes, lesquelles sont correctes ? (Plusieurs réponses)',
        points: 5,
        options: [
          { id: 'a', text: 'Caractéristique 1 (vraie)', isCorrect: true },
          { id: 'b', text: 'Caractéristique 2 (fausse)', isCorrect: false },
          { id: 'c', text: 'Caractéristique 3 (vraie)', isCorrect: true },
          { id: 'd', text: 'Caractéristique 4 (vraie)', isCorrect: true }
        ],
        explanation: 'Les caractéristiques a, c et d sont correctes selon les principes de la biologie et de la géologie.',
        difficulty: 'moyen',
        partialCredit: true
      },
      {
        id: 4,
        type: 'open_ended',
        question: `Analyser le schéma fourni et expliquer [processus biologique ou géologique].`,
        points: 5,
        correctAnswer: 'Explication complète avec schéma annoté',
        steps: [
          'Étape 1: Identifier les structures ou éléments',
          'Étape 2: Décrire le fonctionnement',
          'Étape 3: Expliquer les relations',
          'Étape 4: Conclure sur l\'importance écologique'
        ],
        explanation: 'Solution détaillée avec schémas biologiques annotés et explications scientifiques...',
        difficulty: 'moyen'
      },
      {
        id: 5,
        type: 'open_ended',
        question: `Proposer des mesures de conservation pour un écosystème camerounais menacé.`,
        points: 5,
        correctAnswer: 'Plan de conservation détaillé',
        steps: [
          'Étape 1: Identifier les menaces',
          'Étape 2: Analyser les causes',
          'Étape 3: Proposer des solutions',
          'Étape 4: Prévoir le suivi et l\'évaluation'
        ],
        explanation: 'Un plan de conservation efficace doit combiner protection de l\'environnement et développement durable pour les populations locales...',
        difficulty: 'difficile'
      }
    ]
  };
}

// ============================================
// FONCTION PRINCIPALE
// ============================================

async function genererTouteSVT(models) {
  const { Subject, Chapter, Lesson } = models;

  console.log('\n' + '='.repeat(70));
  console.log('  🌿 GÉNÉRATION COMPLÈTE - SVT');
  console.log('  📚 Programme Camerounais MINESEC');
  console.log('  🇨🇲 6ème → Terminale (Tous niveaux)');
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
    const subjectTitle = `SVT ${niveau}`;

    const [subject, created] = await Subject.findOrCreate({
      where: { title: subjectTitle },
      defaults: {
        id: uuidv4(),
        title: subjectTitle,
        description: `Programme complet de Sciences de la Vie et de la Terre pour la classe de ${niveau} selon le curriculum camerounais MINESEC`,
        level: niveau,
        category: MATIERE_SVT.category,
        icon: MATIERE_SVT.icon,
        color: MATIERE_SVT.color,
        difficulty: ['6ème', '5ème'].includes(niveau) ? 'Débutant' :
                    ['4ème', '3ème', '2nde'].includes(niveau) ? 'Intermédiaire' : 'Avancé',
        estimatedDuration: 120,
        isActive: true,
        isPremium: false,
        order: TOUS_NIVEAUX.indexOf(niveau) + 1,
        cameroonCurriculum: {
          officialCode: `SVT-${niveau.toUpperCase()}-2024`,
          ministerialRef: 'Programme MINESEC 2024',
          competencies: ['Observer', 'Expérimenter', 'Raisonner', 'Communiquer', 'Agir de manière responsable']
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
    const chapitres = CHAPITRES_SVT[niveau] || [];

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
            code: `SVT-${niveau.toUpperCase()}-CH${chapData.num}`,
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
                'Forêt du bassin du Congo',
                'Parc national de Waza',
                'Réserve de Dja',
                'Mont Cameroun',
                'Mangroves de Kribi',
                'Lac Nyos'
              ],
              culturalReferences: ['Biodiversité camerounaise (Afrique en miniature)'],
              localLanguageTerms: {}
            },
            metadata: {
              tags: ['svt', niveau.toLowerCase(), `chapitre-${chapData.num}`, 'cameroun', 'sciences', 'biodiversite', 'ecologie'],
              searchKeywords: [chapData.titre.toLowerCase(), 'svt', 'biologie', 'geologie', niveau.toLowerCase()],
              language: 'fr',
              version: '1.0',
              authorNotes: `Généré automatiquement - Programme MINESEC SVT ${niveau}`
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

    await genererTouteSVT(models);

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
