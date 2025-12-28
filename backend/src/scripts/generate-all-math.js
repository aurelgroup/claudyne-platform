/**
 * Script Automatique - Génération COMPLÈTE Mathématiques
 * CP → Terminale - Programme Camerounais MINESEC
 *
 * Usage: node backend/src/scripts/generate-all-math.js
 */

require('dotenv').config({ path: __dirname + '/../../../.env' });
const database = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// ============================================
// CONFIGURATION COMPLÈTE MATHÉMATIQUES
// ============================================

const TOUS_NIVEAUX = ['CP', 'CE1', 'CE2', 'CM1', 'CM2', '6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Tle'];

const CHAPITRES_MATHEMATIQUES = {
  'CP': [
    { num: 1, titre: 'Les nombres de 0 à 10', trimestre: 1, objectifs: ['Compter jusqu\'à 10', 'Reconnaître les chiffres', 'Comparer des quantités'] },
    { num: 2, titre: 'Addition simple', trimestre: 1, objectifs: ['Additionner deux nombres', 'Comprendre le signe +', 'Résoudre des problèmes simples'] },
    { num: 3, titre: 'Les formes géométriques', trimestre: 2, objectifs: ['Reconnaître cercle, carré, triangle', 'Dessiner des formes', 'Trier des objets'] },
    { num: 4, titre: 'Les nombres jusqu\'à 20', trimestre: 2, objectifs: ['Compter jusqu\'à 20', 'Décomposer les nombres', 'Ranger les nombres'] },
    { num: 5, titre: 'Soustraction simple', trimestre: 3, objectifs: ['Soustraire deux nombres', 'Comprendre le signe -', 'Résoudre des problèmes'] }
  ],
  'CE1': [
    { num: 1, titre: 'Les nombres jusqu\'à 100', trimestre: 1, objectifs: ['Lire et écrire jusqu\'à 100', 'Comparer et ranger', 'Décomposer en dizaines et unités'] },
    { num: 2, titre: 'Addition et soustraction', trimestre: 1, objectifs: ['Additionner avec retenue', 'Soustraire avec retenue', 'Problèmes à étapes'] },
    { num: 3, titre: 'Multiplication (tables 2, 3, 4, 5)', trimestre: 2, objectifs: ['Comprendre la multiplication', 'Mémoriser les tables', 'Multiplier par 10'] },
    { num: 4, titre: 'Mesures de longueur', trimestre: 2, objectifs: ['Unités: cm, m', 'Mesurer avec une règle', 'Comparer des longueurs'] },
    { num: 5, titre: 'Géométrie et symétrie', trimestre: 3, objectifs: ['Tracer à la règle', 'Identifier des axes de symétrie', 'Reproduire des figures'] }
  ],
  'CE2': [
    { num: 1, titre: 'Les nombres jusqu\'à 1000', trimestre: 1, objectifs: ['Lire et écrire les grands nombres', 'Centaines, dizaines, unités', 'Comparer et ordonner'] },
    { num: 2, titre: 'Multiplication et division', trimestre: 1, objectifs: ['Tables jusqu\'à 10', 'Division simple', 'Problèmes multiplicatifs'] },
    { num: 3, titre: 'Les fractions simples', trimestre: 2, objectifs: ['Moitié, tiers, quart', 'Représenter des fractions', 'Partager équitablement'] },
    { num: 4, titre: 'Périmètre et aire', trimestre: 2, objectifs: ['Calculer un périmètre', 'Notion d\'aire', 'Carré et rectangle'] },
    { num: 5, titre: 'Problèmes et proportionnalité', trimestre: 3, objectifs: ['Résoudre des problèmes complexes', 'Situations de proportionnalité', 'Prix et quantités'] }
  ],
  'CM1': [
    { num: 1, titre: 'Grands nombres (millions)', trimestre: 1, objectifs: ['Lire et écrire les millions', 'Classes et ordres', 'Arrondir'] },
    { num: 2, titre: 'Les quatre opérations', trimestre: 1, objectifs: ['Maîtriser l\'addition posée', 'Multiplication à 2 chiffres', 'Division euclidienne'] },
    { num: 3, titre: 'Fractions décimales', trimestre: 2, objectifs: ['Dixièmes, centièmes', 'Placer sur une droite graduée', 'Comparer des fractions'] },
    { num: 4, titre: 'Géométrie: triangles et cercles', trimestre: 2, objectifs: ['Types de triangles', 'Tracer au compas', 'Propriétés géométriques'] },
    { num: 5, titre: 'Aires et volumes', trimestre: 3, objectifs: ['Formules d\'aire', 'Volume du pavé', 'Unités de mesure'] }
  ],
  'CM2': [
    { num: 1, titre: 'Nombres décimaux', trimestre: 1, objectifs: ['Lire et écrire les décimaux', 'Partie entière et décimale', 'Ordonner les décimaux'] },
    { num: 2, titre: 'Opérations sur les décimaux', trimestre: 1, objectifs: ['Addition de décimaux', 'Multiplication par 10, 100, 1000', 'Division décimale'] },
    { num: 3, titre: 'Proportionnalité', trimestre: 2, objectifs: ['Reconnaître une proportionnalité', 'Règle de trois', 'Pourcentages simples'] },
    { num: 4, titre: 'Géométrie plane', trimestre: 2, objectifs: ['Quadrilatères', 'Cercle et disque', 'Programmes de construction'] },
    { num: 5, titre: 'Préparation 6ème', trimestre: 3, objectifs: ['Révision générale', 'Problèmes de synthèse', 'Raisonnement mathématique'] }
  ],
  '6ème': [
    { num: 1, titre: 'Nombres entiers et décimaux', trimestre: 1, objectifs: ['Lire et écrire des nombres', 'Comparer et ranger', 'Arrondir'] },
    { num: 2, titre: 'Les quatre opérations', trimestre: 1, objectifs: ['Maîtriser addition, soustraction', 'Multiplication et division', 'Priorités opératoires'] },
    { num: 3, titre: 'Fractions', trimestre: 2, objectifs: ['Comprendre les fractions', 'Simplifier', 'Comparer des fractions'] },
    { num: 4, titre: 'Géométrie plane', trimestre: 2, objectifs: ['Droites, segments, angles', 'Triangles et quadrilatères', 'Cercles'] },
    { num: 5, titre: 'Proportionnalité', trimestre: 3, objectifs: ['Reconnaître une situation de proportionnalité', 'Tableaux de proportionnalité', 'Pourcentages'] }
  ],
  '5ème': [
    { num: 1, titre: 'Nombres relatifs', trimestre: 1, objectifs: ['Découvrir les nombres négatifs', 'Repérage sur une droite', 'Addition et soustraction'] },
    { num: 2, titre: 'Calcul littéral (introduction)', trimestre: 1, objectifs: ['Utiliser des lettres', 'Développer et réduire', 'Tester une égalité'] },
    { num: 3, titre: 'Triangles et parallélogrammes', trimestre: 2, objectifs: ['Construire des triangles', 'Propriétés des parallélogrammes', 'Inégalité triangulaire'] },
    { num: 4, titre: 'Aires et périmètres', trimestre: 2, objectifs: ['Formules d\'aire', 'Aire du disque', 'Conversion d\'unités'] },
    { num: 5, titre: 'Statistiques', trimestre: 3, objectifs: ['Lire un tableau', 'Calculer une moyenne', 'Diagrammes en barres'] }
  ],
  '4ème': [
    { num: 1, titre: 'Nombres relatifs (opérations)', trimestre: 1, objectifs: ['Multiplication de relatifs', 'Division de relatifs', 'Règles des signes'] },
    { num: 2, titre: 'Calcul littéral', trimestre: 1, objectifs: ['Développer avec la distributivité', 'Factoriser', 'Résoudre des équations'] },
    { num: 3, titre: 'Théorème de Pythagore', trimestre: 2, objectifs: ['Énoncé du théorème', 'Calculer une longueur', 'Réciproque'] },
    { num: 4, titre: 'Proportionnalité avancée', trimestre: 2, objectifs: ['Vitesse moyenne', 'Échelles', 'Pourcentages d\'évolution'] },
    { num: 5, titre: 'Probabilités', trimestre: 3, objectifs: ['Vocabulaire des probabilités', 'Calculer des probabilités simples', 'Événements'] }
  ],
  '3ème': [
    { num: 1, titre: 'Calcul numérique et racines carrées', trimestre: 1, objectifs: ['Puissances', 'Racines carrées', 'Notation scientifique'] },
    { num: 2, titre: 'Équations et inéquations', trimestre: 1, objectifs: ['Résoudre des équations', 'Résoudre des inéquations', 'Systèmes d\'équations'] },
    { num: 3, titre: 'Théorème de Thalès', trimestre: 2, objectifs: ['Énoncé du théorème', 'Calculer des longueurs', 'Réciproque'] },
    { num: 4, titre: 'Fonctions linéaires et affines', trimestre: 2, objectifs: ['Définition d\'une fonction', 'Représentation graphique', 'Coefficient directeur'] },
    { num: 5, titre: 'Statistiques et probabilités', trimestre: 3, objectifs: ['Médiane et quartiles', 'Diagrammes en boîte', 'Probabilités'] }
  ],
  '2nde': [
    { num: 1, titre: 'Ensembles de nombres', trimestre: 1, objectifs: ['ℕ, ℤ, ℚ, ℝ', 'Intervalles', 'Valeur absolue'] },
    { num: 2, titre: 'Fonctions numériques', trimestre: 1, objectifs: ['Définition', 'Domaine de définition', 'Représentation graphique'] },
    { num: 3, titre: 'Vecteurs et translations', trimestre: 2, objectifs: ['Notion de vecteur', 'Égalité de vecteurs', 'Somme de vecteurs'] },
    { num: 4, titre: 'Équations et inéquations', trimestre: 2, objectifs: ['Résolution d\'équations', 'Tableaux de signes', 'Systèmes linéaires'] },
    { num: 5, titre: 'Statistiques descriptives', trimestre: 3, objectifs: ['Paramètres de position', 'Paramètres de dispersion', 'Diagrammes'] }
  ],
  '1ère': [
    { num: 1, titre: 'Second degré', trimestre: 1, objectifs: ['Forme canonique', 'Discriminant', 'Résolution d\'équations'], series: ['C', 'D'] },
    { num: 2, titre: 'Dérivation', trimestre: 1, objectifs: ['Nombre dérivé', 'Fonction dérivée', 'Tangente'], series: ['C', 'D'] },
    { num: 3, titre: 'Suites numériques', trimestre: 2, objectifs: ['Définition par récurrence', 'Suites arithmétiques', 'Suites géométriques'], series: ['C', 'D'] },
    { num: 4, titre: 'Produit scalaire', trimestre: 2, objectifs: ['Définition', 'Propriétés', 'Applications géométriques'], series: ['C', 'D'] },
    { num: 5, titre: 'Probabilités conditionnelles', trimestre: 3, objectifs: ['Probabilité conditionnelle', 'Formule des probabilités totales', 'Indépendance'], series: ['C', 'D'] }
  ],
  'Tle': [
    { num: 1, titre: 'Fonctions numériques', trimestre: 1, objectifs: ['Domaine de définition', 'Limites et continuité', 'Dérivées'], series: ['C', 'D'] },
    { num: 2, titre: 'Suites numériques', trimestre: 1, objectifs: ['Suites arithmétiques et géométriques', 'Limites de suites', 'Raisonnement par récurrence'], series: ['C', 'D'] },
    { num: 3, titre: 'Fonctions exponentielles et logarithmes', trimestre: 2, objectifs: ['Fonction exponentielle', 'Fonction logarithme népérien', 'Équations différentielles'], series: ['C', 'D'] },
    { num: 4, titre: 'Probabilités', trimestre: 2, objectifs: ['Probabilités conditionnelles', 'Lois de probabilité', 'Variables aléatoires'], series: ['C', 'D'] },
    { num: 5, titre: 'Nombres complexes', trimestre: 3, objectifs: ['Forme algébrique', 'Forme trigonométrique', 'Applications géométriques'], series: ['C', 'D'] }
  ]
};

const MATIERE_MATH = {
  id: 'mathematiques',
  nom: 'Mathématiques',
  icon: '📐',
  color: '#3B82F6',
  category: 'Mathématiques'
};

// ============================================
// GÉNÉRATEUR DE CONTENU
// ============================================

function genererContenuLecon(niveau, chapitre, numLecon, typeLecon) {
  const exemplesCameroun = [
    'Prix du marché de Mokolo à Yaoundé (500 FCFA le tas de tomates)',
    'Distance Douala-Yaoundé par autoroute (250 km)',
    'Population du Cameroun (environ 27 millions d\'habitants)',
    'Température moyenne à Garoua (35°C)',
    'Hauteur du Mont Cameroun (4070 mètres)',
    'Prix d\'un transport Yaoundé-Douala (5000 FCFA)',
    'Nombre d\'élèves au lycée de Ngaoundéré (1200 élèves)',
    'Superficie du parc de Waza (170 000 hectares)'
  ];

  const exemple1 = exemplesCameroun[Math.floor(Math.random() * exemplesCameroun.length)];
  const exemple2 = exemplesCameroun[Math.floor(Math.random() * exemplesCameroun.length)];

  return {
    videoUrl: typeLecon === 'video' ? `https://www.youtube.com/watch?v=math-${niveau}-ch${chapitre.num}-l${numLecon}` : null,

    transcript: `# ${chapitre.titre} - Leçon ${numLecon}\n\n## Introduction\n\nBienvenue dans cette leçon ${numLecon} sur **${chapitre.titre.toLowerCase()}**. Cette leçon fait partie du programme de mathématiques ${niveau} selon le curriculum camerounais MINESEC.\n\n## I. Rappels et Prérequis\n\nAvant de commencer, assurez-vous de maîtriser les concepts suivants :\n${chapitre.objectifs[0] ? `- ${chapitre.objectifs[0]}` : '- Les bases du chapitre précédent'}\n\n## II. Nouveaux Concepts\n\n### Concept 1: ${chapitre.objectifs[0] || 'Concept principal'}\n\nExplication détaillée avec des exemples tirés du contexte camerounais.\n\n**Exemple concret :** ${exemple1}\n\nRésolution pas à pas de cet exemple...\n\n### Concept 2: ${chapitre.objectifs[1] || 'Application'}\n\nComment appliquer ce concept dans des situations réelles.\n\n**Exemple :** ${exemple2}\n\n## III. Méthodes et Techniques\n\n### Méthode 1: Approche standard\n\nÉtapes pour résoudre ce type de problème :\n1. Identifier les données\n2. Appliquer la formule ou méthode\n3. Vérifier le résultat\n\n### Méthode 2: Approche alternative\n\nDans certains cas, une méthode plus rapide existe...\n\n## IV. Exercices d'Application\n\nMettez en pratique ce que vous avez appris avec les exercices ci-dessous.\n\n## Conclusion\n\nPoints essentiels à retenir :\n${chapitre.objectifs.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}\n\n**Prochaine étape :** Leçon ${numLecon + 1} - Approfondissement`,

    keyPoints: chapitre.objectifs.slice(0, 3).map((obj, i) => ({
      title: `${obj}`,
      content: `Ce concept est fondamental dans le programme de ${niveau}. Il permet de comprendre et résoudre des problèmes du quotidien au Cameroun. Maîtriser ${obj.toLowerCase()} est essentiel pour progresser vers les chapitres suivants.`
    })),

    exercises: [
      {
        id: 1,
        title: 'Exercice d\'application directe',
        question: `Utiliser ${chapitre.objectifs[0] ? chapitre.objectifs[0].toLowerCase() : 'le concept vu'} dans un contexte simple.`,
        answer: 'Réponse attendue avec justification',
        explanation: `Pour résoudre cet exercice, on applique la méthode vue en cours.\n\nÉtape 1: Identifier les données\nÉtape 2: Appliquer la formule\nÉtape 3: Calculer et vérifier`,
        difficulty: 'facile'
      },
      {
        id: 2,
        title: 'Exercice intermédiaire',
        question: `Problème combinant plusieurs aspects de ${chapitre.titre.toLowerCase()}.`,
        answer: 'Solution complète',
        explanation: `Cet exercice nécessite de combiner plusieurs concepts du chapitre. Procédons méthodiquement...`,
        difficulty: 'moyen'
      },
      {
        id: 3,
        title: 'Problème contextualisé (Cameroun)',
        question: `Un commerçant du marché de Mokolo doit résoudre un problème lié à ${chapitre.titre.toLowerCase()}. Aidez-le !`,
        answer: 'Solution détaillée avec unités',
        explanation: `Dans ce problème du quotidien camerounais, il faut :\n1. Comprendre la situation\n2. Modéliser mathématiquement\n3. Résoudre et interpréter`,
        difficulty: 'difficile'
      }
    ],

    resources: [
      {
        type: 'pdf',
        title: `Formulaire - ${chapitre.titre}`,
        url: `/resources/mathematiques/${niveau}/ch${chapitre.num}/formulaire.pdf`,
        description: 'Toutes les formules essentielles à connaître'
      },
      {
        type: 'video',
        title: 'Exercices corrigés en vidéo',
        url: `https://www.youtube.com/watch?v=correction-math-${niveau}`,
        duration: '12:30'
      },
      {
        type: 'interactive',
        title: 'Simulation interactive',
        url: `https://www.geogebra.org/m/math-${niveau}-${chapitre.num}`,
        description: 'Manipuler les concepts de manière interactive'
      }
    ],

    downloadableFiles: [
      {
        name: `Fiche de révision - ${chapitre.titre}`,
        url: `/downloads/mathematiques/${niveau}/fiche-ch${chapitre.num}.pdf`,
        size: '750 KB',
        format: 'PDF'
      },
      {
        name: 'Exercices supplémentaires avec corrections',
        url: `/downloads/mathematiques/${niveau}/exercices-ch${chapitre.num}.pdf`,
        size: '1.2 MB',
        format: 'PDF'
      }
    ]
  };
}

function genererQuiz(niveau, chapitre) {
  return {
    title: `Évaluation - ${chapitre.titre}`,
    description: `Testez vos connaissances sur ${chapitre.titre} (${niveau})`,
    timeLimit: 25,
    passingScore: 12,
    totalPoints: 20,
    shuffleQuestions: true,
    showCorrectAnswers: true,
    questions: [
      {
        id: 1,
        type: 'multiple_choice',
        question: `Question de base sur ${chapitre.titre.toLowerCase()}`,
        points: 3,
        options: [
          { id: 'a', text: 'Réponse incorrecte A', isCorrect: false },
          { id: 'b', text: 'Réponse correcte', isCorrect: true },
          { id: 'c', text: 'Réponse incorrecte C', isCorrect: false },
          { id: 'd', text: 'Réponse incorrecte D', isCorrect: false }
        ],
        explanation: 'La réponse B est correcte car elle correspond à la définition vue en cours.',
        difficulty: 'facile'
      },
      {
        id: 2,
        type: 'true_false',
        question: `Affirmation sur ${chapitre.objectifs[0] ? chapitre.objectifs[0].toLowerCase() : 'le concept principal'}`,
        points: 2,
        correctAnswer: true,
        explanation: 'Cette affirmation est vraie selon le théorème/règle vu en cours.',
        difficulty: 'facile'
      },
      {
        id: 3,
        type: 'calculation',
        question: 'Calculer la réponse à l\'application numérique suivante...',
        points: 5,
        correctAnswer: '42',
        acceptedAnswers: ['42', '42.0'],
        explanation: 'En appliquant la formule vue en cours, on obtient 42.',
        difficulty: 'moyen'
      },
      {
        id: 4,
        type: 'multiple_response',
        question: 'Parmi les affirmations suivantes, lesquelles sont vraies ? (Plusieurs réponses possibles)',
        points: 5,
        options: [
          { id: 'a', text: 'Affirmation 1 (vraie)', isCorrect: true },
          { id: 'b', text: 'Affirmation 2 (fausse)', isCorrect: false },
          { id: 'c', text: 'Affirmation 3 (vraie)', isCorrect: true },
          { id: 'd', text: 'Affirmation 4 (vraie)', isCorrect: true }
        ],
        explanation: 'Les affirmations a, c et d sont correctes selon les propriétés étudiées.',
        difficulty: 'moyen',
        partialCredit: true
      },
      {
        id: 5,
        type: 'open_ended',
        question: `Résoudre le problème suivant en détaillant votre raisonnement...`,
        points: 5,
        correctAnswer: 'Solution complète',
        steps: [
          'Étape 1: Identifier les données',
          'Étape 2: Choisir la méthode',
          'Étape 3: Effectuer les calculs',
          'Étape 4: Vérifier et conclure'
        ],
        explanation: 'Solution détaillée étape par étape...',
        difficulty: 'difficile'
      }
    ]
  };
}

// ============================================
// FONCTION PRINCIPALE
// ============================================

async function genererToutesMathematiques(models) {
  const { Subject, Chapter, Lesson } = models;

  console.log('\n' + '='.repeat(70));
  console.log('  🎓 GÉNÉRATION COMPLÈTE - MATHÉMATIQUES');
  console.log('  📚 Programme Camerounais MINESEC');
  console.log('  🇨🇲 CP → Terminale (Tous niveaux)');
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
    const subjectTitle = `Mathématiques ${niveau}`;

    const [subject, created] = await Subject.findOrCreate({
      where: { title: subjectTitle },
      defaults: {
        id: uuidv4(),
        title: subjectTitle,
        description: `Programme complet de mathématiques pour la classe de ${niveau} selon le curriculum camerounais MINESEC`,
        level: niveau,
        category: MATIERE_MATH.category,
        icon: MATIERE_MATH.icon,
        color: MATIERE_MATH.color,
        difficulty: ['CP', 'CE1', 'CE2'].includes(niveau) ? 'Débutant' :
                    ['CM1', 'CM2', '6ème', '5ème'].includes(niveau) ? 'Intermédiaire' : 'Avancé',
        estimatedDuration: 120,
        isActive: true,
        isPremium: false,
        order: TOUS_NIVEAUX.indexOf(niveau) + 1,
        cameroonCurriculum: {
          officialCode: `MATH-${niveau.toUpperCase()}-2024`,
          ministerialRef: 'Programme MINESEC 2024',
          competencies: ['Chercher', 'Modéliser', 'Représenter', 'Raisonner', 'Calculer', 'Communiquer']
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
    const chapitres = CHAPITRES_MATHEMATIQUES[niveau] || [];

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
            code: `MATH-${niveau.toUpperCase()}-CH${chapData.num}`,
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
                'Marché de Mokolo, Yaoundé',
                'Distance Douala-Yaoundé',
                'Mont Cameroun (4070m)',
                'Population du Cameroun'
              ],
              culturalReferences: ['Application au contexte camerounais'],
              localLanguageTerms: {}
            },
            metadata: {
              tags: ['mathematiques', niveau.toLowerCase(), `chapitre-${chapData.num}`, 'cameroun'],
              searchKeywords: [chapData.titre.toLowerCase(), 'math', niveau.toLowerCase()],
              language: 'fr',
              version: '1.0',
              authorNotes: `Généré automatiquement - Programme MINESEC ${niveau}`
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

    await genererToutesMathematiques(models);

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
