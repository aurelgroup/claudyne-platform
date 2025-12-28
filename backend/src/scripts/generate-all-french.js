require('dotenv').config({ path: __dirname + '/../../../.env' });
const database = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Configuration
const TOUS_NIVEAUX = ['CP', 'CE1', 'CE2', 'CM1', 'CM2', '6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Tle'];

// Chapitres de Français par niveau selon programme MINESEC Cameroun
const CHAPITRES_FRANCAIS = {
  'CP': [
    { num: 1, titre: 'L\'alphabet et les sons', trimestre: 1, objectifs: ['Reconnaître les lettres', 'Associer sons et lettres', 'Écrire les lettres'] },
    { num: 2, titre: 'Les syllabes simples', trimestre: 1, objectifs: ['Former des syllabes', 'Lire des syllabes', 'Écrire des syllabes'] },
    { num: 3, titre: 'Les premiers mots', trimestre: 2, objectifs: ['Lire des mots simples', 'Comprendre le sens', 'Écrire des mots'] },
    { num: 4, titre: 'Les phrases simples', trimestre: 2, objectifs: ['Construire une phrase', 'Lire une phrase', 'Ponctuation de base'] },
    { num: 5, titre: 'Lecture et compréhension', trimestre: 3, objectifs: ['Lire un texte court', 'Comprendre l\'histoire', 'Répondre aux questions'] }
  ],
  'CE1': [
    { num: 1, titre: 'Grammaire : Le nom et l\'article', trimestre: 1, objectifs: ['Identifier le nom', 'Utiliser les articles', 'Genre et nombre'] },
    { num: 2, titre: 'Conjugaison : Le présent', trimestre: 1, objectifs: ['Verbes du 1er groupe', 'Être et avoir', 'Conjuguer au présent'] },
    { num: 3, titre: 'Orthographe et vocabulaire', trimestre: 2, objectifs: ['Les sons complexes', 'Enrichir le vocabulaire', 'Orthographe courante'] },
    { num: 4, titre: 'La phrase et la ponctuation', trimestre: 2, objectifs: ['Types de phrases', 'Ponctuation correcte', 'Majuscules'] },
    { num: 5, titre: 'Lecture et expression écrite', trimestre: 3, objectifs: ['Lire avec fluidité', 'Raconter une histoire', 'Écrire un texte court'] }
  ],
  'CE2': [
    { num: 1, titre: 'L\'adjectif qualificatif', trimestre: 1, objectifs: ['Reconnaître l\'adjectif', 'Accords en genre et nombre', 'Enrichir les descriptions'] },
    { num: 2, titre: 'Le verbe et ses temps', trimestre: 1, objectifs: ['Passé, présent, futur', 'Conjugaison simple', 'L\'infinitif'] },
    { num: 3, titre: 'Le sujet et le verbe', trimestre: 2, objectifs: ['Identifier le sujet', 'Accords sujet-verbe', 'Groupes de la phrase'] },
    { num: 4, titre: 'Vocabulaire et orthographe', trimestre: 2, objectifs: ['Familles de mots', 'Homophones', 'Dictées préparées'] },
    { num: 5, titre: 'Production d\'écrits', trimestre: 3, objectifs: ['Décrire une image', 'Écrire un récit', 'Respecter la structure'] }
  ],
  'CM1': [
    { num: 1, titre: 'Les compléments du verbe', trimestre: 1, objectifs: ['COD et COI', 'Compléments circonstanciels', 'Analyse de phrase'] },
    { num: 2, titre: 'L\'imparfait et le passé composé', trimestre: 1, objectifs: ['Formation de l\'imparfait', 'Le passé composé', 'Choix du temps'] },
    { num: 3, titre: 'Les pronoms personnels', trimestre: 2, objectifs: ['Pronoms sujets', 'Pronoms compléments', 'Utilisation correcte'] },
    { num: 4, titre: 'Vocabulaire et expression', trimestre: 2, objectifs: ['Synonymes et antonymes', 'Sens propre et figuré', 'Expression orale'] },
    { num: 5, titre: 'Textes et rédaction', trimestre: 3, objectifs: ['Lire différents types de textes', 'Rédiger un texte structuré', 'Réviser son texte'] }
  ],
  'CM2': [
    { num: 1, titre: 'L\'analyse grammaticale complète', trimestre: 1, objectifs: ['Nature des mots', 'Fonction dans la phrase', 'Analyse approfondie'] },
    { num: 2, titre: 'Tous les temps de l\'indicatif', trimestre: 1, objectifs: ['Futur simple', 'Plus-que-parfait', 'Concordance des temps'] },
    { num: 3, titre: 'Les propositions', trimestre: 2, objectifs: ['Proposition principale', 'Proposition subordonnée', 'Phrases complexes'] },
    { num: 4, titre: 'Orthographe grammaticale', trimestre: 2, objectifs: ['Accords complexes', 'Participe passé', 'Homophones grammaticaux'] },
    { num: 5, titre: 'Littérature et rédaction', trimestre: 3, objectifs: ['Étude de textes littéraires', 'Rédaction élaborée', 'Argumentation simple'] }
  ],
  '6ème': [
    { num: 1, titre: 'Grammaire : Classes et fonctions', trimestre: 1, objectifs: ['Révisions des classes grammaticales', 'Fonctions essentielles', 'Analyse de phrases'] },
    { num: 2, titre: 'Conjugaison : Modes et temps', trimestre: 1, objectifs: ['L\'indicatif', 'L\'impératif', 'Le conditionnel présent'] },
    { num: 3, titre: 'Vocabulaire et étymologie', trimestre: 2, objectifs: ['Formation des mots', 'Racines latines et grecques', 'Champs lexicaux'] },
    { num: 4, titre: 'La littérature : Contes et récits', trimestre: 2, objectifs: ['Étude de contes', 'Structure narrative', 'Personnages et schéma narratif'] },
    { num: 5, titre: 'Expression écrite et orale', trimestre: 3, objectifs: ['Rédiger un récit', 'Décrire et raconter', 'Présenter à l\'oral'] }
  ],
  '5ème': [
    { num: 1, titre: 'Les types et formes de phrases', trimestre: 1, objectifs: ['Phrases déclarative, interrogative, injonctive', 'Formes affirmative et négative', 'Phrase emphatique'] },
    { num: 2, titre: 'Le subjonctif présent', trimestre: 1, objectifs: ['Formation du subjonctif', 'Emplois du subjonctif', 'Concordance indicatif/subjonctif'] },
    { num: 3, titre: 'Figures de style', trimestre: 2, objectifs: ['Métaphore et comparaison', 'Personnification', 'Anaphore et autres figures'] },
    { num: 4, titre: 'Le récit d\'aventure', trimestre: 2, objectifs: ['Caractéristiques du récit d\'aventure', 'Le héros et ses épreuves', 'Temps du récit'] },
    { num: 5, titre: 'Argumentation et description', trimestre: 3, objectifs: ['Arguments et exemples', 'Description objective et subjective', 'Textes variés'] }
  ],
  '4ème': [
    { num: 1, titre: 'Les propositions subordonnées', trimestre: 1, objectifs: ['Subordonnée relative', 'Subordonnée conjonctive', 'Analyse de phrases complexes'] },
    { num: 2, titre: 'Voix active et voix passive', trimestre: 1, objectifs: ['Transformation active/passive', 'Complément d\'agent', 'Emplois de la voix passive'] },
    { num: 3, titre: 'Le discours rapporté', trimestre: 2, objectifs: ['Discours direct', 'Discours indirect', 'Concordance des temps'] },
    { num: 4, titre: 'La nouvelle réaliste', trimestre: 2, objectifs: ['Caractéristiques de la nouvelle', 'Chute et suspense', 'Auteurs réalistes'] },
    { num: 5, titre: 'Correspondance et lettre', trimestre: 3, objectifs: ['Lettre personnelle', 'Lettre formelle', 'Structure et formules'] }
  ],
  '3ème': [
    { num: 1, titre: 'L\'expression de la cause et de la conséquence', trimestre: 1, objectifs: ['Connecteurs logiques', 'Propositions causales et consécutives', 'Raisonnement logique'] },
    { num: 2, titre: 'Les paroles rapportées', trimestre: 1, objectifs: ['Style direct et indirect', 'Verbes de parole', 'Transformations nécessaires'] },
    { num: 3, titre: 'Poésie et versification', trimestre: 2, objectifs: ['Vers et strophes', 'Rimes et rythme', 'Figures poétiques'] },
    { num: 4, titre: 'L\'autobiographie', trimestre: 2, objectifs: ['Pacte autobiographique', 'Récit de vie', 'Auteurs camerounais'] },
    { num: 5, titre: 'Argumentation et débat', trimestre: 3, objectifs: ['Thèse et arguments', 'Réfuter et concéder', 'Débat argumenté'] }
  ],
  '2nde': [
    { num: 1, titre: 'Le récit : genres et registres', trimestre: 1, objectifs: ['Romans et nouvelles', 'Registres littéraires', 'Analyse narratologique'] },
    { num: 2, titre: 'La poésie du Moyen Âge au XVIIIe siècle', trimestre: 1, objectifs: ['Évolution poétique', 'Formes fixes', 'Grands poètes'] },
    { num: 3, titre: 'Le théâtre : texte et représentation', trimestre: 2, objectifs: ['Texte théâtral', 'Mise en scène', 'Comédie et tragédie'] },
    { num: 4, titre: 'L\'argumentation : convaincre et persuader', trimestre: 2, objectifs: ['Stratégies argumentatives', 'Logos, pathos, ethos', 'Essai et pamphlet'] },
    { num: 5, titre: 'Méthodologie : commentaire composé', trimestre: 3, objectifs: ['Analyse du texte', 'Plan du commentaire', 'Rédaction organisée'] }
  ],
  '1ère': [
    { num: 1, titre: 'Le roman et le récit du XVIIIe au XXIe siècle', trimestre: 1, objectifs: ['Évolution du roman', 'Romans camerounais et francophones', 'Narratologie approfondie'] },
    { num: 2, titre: 'La poésie du XIXe au XXIe siècle', trimestre: 1, objectifs: ['Romantisme et symbolisme', 'Modernité poétique', 'Poésie africaine francophone'] },
    { num: 3, titre: 'Le théâtre du XVIIe au XXIe siècle', trimestre: 2, objectifs: ['Classicisme', 'Théâtre moderne et contemporain', 'Théâtre africain'] },
    { num: 4, titre: 'La littérature d\'idées', trimestre: 2, objectifs: ['Essais philosophiques', 'Littérature engagée', 'Écrivains de la négritude'] },
    { num: 5, titre: 'Méthodologie : dissertation littéraire', trimestre: 3, objectifs: ['Analyse du sujet', 'Construction du plan', 'Argumentation littéraire'] }
  ],
  'Tle': [
    { num: 1, titre: 'Littérature francophone africaine', trimestre: 1, objectifs: ['Auteurs camerounais majeurs', 'Thèmes de la littérature africaine', 'Mongo Beti, Calixthe Beyala, Ferdinand Oyono'] },
    { num: 2, titre: 'Le théâtre : texte et représentation', trimestre: 1, objectifs: ['Dramaturgie', 'Mise en scène contemporaine', 'Guillaume Oyônô Mbia'] },
    { num: 3, titre: 'Poésie et quête du sens', trimestre: 2, objectifs: ['Poésie engagée', 'Symbolisme et herméneutique', 'Léopold Sédar Senghor, David Diop'] },
    { num: 4, titre: 'Argumentation et essai', trimestre: 2, objectifs: ['Essais philosophiques et politiques', 'Rhétorique avancée', 'Ahmadou Kourouma, Chinua Achebe'] },
    { num: 5, titre: 'Préparation au baccalauréat', trimestre: 3, objectifs: ['Méthodologie complète', 'Sujets types', 'Révisions générales'] }
  ]
};

// Exemples camerounais pour le Français
const exemplesCameroun = [
  'Auteurs camerounais (Mongo Beti, Ferdinand Oyono, Calixthe Beyala)',
  'Poètes de la négritude (Léopold Sédar Senghor, David Diop)',
  'Dramaturge Guillaume Oyônô Mbia',
  'Contes et traditions orales du Cameroun',
  'Langues nationales (Ewondo, Duala, Fulfuldé, Bamiléké)',
  'Littérature orale africaine',
  'Proverbes camerounais',
  'Expressions idiomatiques locales',
  'Francophonie au Cameroun',
  'Médias camerounais (journaux, radio, télévision)'
];

// Types de textes pour le Français
const typesTextes = [
  'Texte narratif',
  'Texte descriptif',
  'Texte explicatif',
  'Texte argumentatif',
  'Texte poétique',
  'Texte théâtral',
  'Lettre',
  'Article de presse'
];

async function genererContenuFrancais(models) {
  const { Subject, Chapter, Lesson } = models;

  try {
    console.log('🔗 Connexion à PostgreSQL...');
    await database.sequelize.authenticate();
    console.log('✅ Connexion établie\n');

    console.log('======================================================================');
    console.log('  📚 GÉNÉRATION COMPLÈTE - FRANÇAIS');
    console.log('  📖 Programme Camerounais MINESEC');
    console.log('  🇨🇲 CP → Terminale (Tous niveaux)');
    console.log('======================================================================\n');

    for (const niveau of TOUS_NIVEAUX) {
      console.log(`\n📊 NIVEAU: ${niveau}`);
      console.log('----------------------------------------------------------------------');

      const chapitres = CHAPITRES_FRANCAIS[niveau];
      if (!chapitres) {
        console.log(`⚠️  Pas de chapitres définis pour ${niveau}`);
        continue;
      }

      // Créer le subject
      const subjectTitle = `Français ${niveau}`;
      const [subject, created] = await Subject.findOrCreate({
        where: { title: subjectTitle },
        defaults: {
          id: uuidv4(),
          title: subjectTitle,
          description: `Programme complet de Français pour la classe de ${niveau} selon le curriculum camerounais MINESEC`,
          level: niveau,
          category: 'Langues',
          icon: '📚',
          color: '#8B5CF6',
          difficulty: niveau.includes('Tle') || niveau.includes('1ère') ? 'Avancé' :
                      niveau.includes('2nde') || niveau.includes('ème') ? 'Intermédiaire' : 'Débutant',
          estimatedDuration: 120,
          isActive: true,
          isPremium: false,
          order: 1,
          prerequisites: [],
          cameroonCurriculum: {
            officialCode: `FRA-${niveau.toUpperCase()}-2024`,
            ministerialRef: 'Programme MINESEC 2024',
            competencies: ['Lire', 'Écrire', 'Comprendre', 'Analyser', 'S\'exprimer', 'Argumenter']
          },
          stats: {
            totalLessons: 0,
            totalQuizzes: 0,
            enrolledStudents: 0,
            averageScore: 0,
            completionRate: 0
          }
        }
      });

      if (created) {
        console.log(`✅ Subject créé: ${subjectTitle}`);
      } else {
        console.log(`ℹ️  Subject existe déjà: ${subjectTitle}`);
      }

      // Créer les chapitres et leçons
      for (const chapitre of chapitres) {
        const [chapter, chapterCreated] = await Chapter.findOrCreate({
          where: {
            subjectId: subject.id,
            number: chapitre.num
          },
          defaults: {
            subjectId: subject.id,
            title: chapitre.titre,
            description: `Chapitre ${chapitre.num}: ${chapitre.titre} - ${niveau}`,
            number: chapitre.num,
            order: chapitre.num,
            trimester: chapitre.trimestre,
            series: [],
            objectives: chapitre.objectifs,
            prerequisites: [],
            competencies: [],
            estimatedDuration: 180,
            difficulty: niveau.includes('Tle') || niveau.includes('1ère') ? 'Avancé' :
                        niveau.includes('2nde') || niveau.includes('ème') ? 'Intermédiaire' : 'Débutant',
            officialReference: {
              code: `FRA-${niveau.toUpperCase()}-CH${chapitre.num}`,
              ministerialRef: 'Programme MINESEC 2024',
              trimestre: chapitre.trimestre
            },
            isActive: true,
            isPremium: false,
            stats: {
              totalLessons: 0,
              avgCompletionRate: 0,
              avgScore: 0,
              avgTimeSpent: 0,
              enrolledStudents: 0
            },
            metadata: {
              tags: [],
              keywords: [],
              resources: [],
              examFocus: false,
              bacWeight: 0
            }
          }
        });

        console.log(`   📂 Ch${chapitre.num}: ${chapitre.titre} (T${chapitre.trimestre})`);

        // Créer 3 leçons par chapitre
        const typesLecons = ['reading', 'video', 'interactive'];
        const difficultes = ['Débutant', 'Intermédiaire', 'Avancé'];

        for (let i = 0; i < 3; i++) {
          const numeroLecon = i + 1;
          const typeLecon = typesLecons[i];
          const isFree = i === 0; // Première leçon gratuite
          const hasQuiz = i === 2; // Quiz sur la dernière leçon
          const exempleLocal = exemplesCameroun[Math.floor(Math.random() * exemplesCameroun.length)];
          const typeTexte = typesTextes[Math.floor(Math.random() * typesTextes.length)];

          const lessonTitle = `${chapitre.titre} - Partie ${numeroLecon}`;

          const lessonContent = {
            videoUrl: typeLecon === 'video' ? `https://www.youtube.com/watch?v=francais-${niveau}-ch${chapitre.num}-l${numeroLecon}` : null,
            transcript: `# ${chapitre.titre} - Leçon ${numeroLecon}

## Introduction

Bienvenue dans cette leçon ${numeroLecon} sur **${chapitre.titre.toLowerCase()}**. Cette leçon fait partie du programme de Français ${niveau} selon le curriculum camerounais MINESEC.

## I. Rappels et Prérequis

Avant de commencer, révisons les concepts suivants :
${chapitre.objectifs.slice(0, 2).map(obj => `- ${obj}`).join('\n')}

## II. Apprentissage et Découverte

### Point de langue 1: ${chapitre.objectifs[0]}

Explication détaillée avec exemples tirés de la littérature francophone.

**Exemple au Cameroun :** ${exempleLocal}

Application pratique dans le contexte camerounais : utilisation dans les médias, la littérature locale, la communication quotidienne...

### Point de langue 2: ${chapitre.objectifs[1] || chapitre.objectifs[0]}

Analyse approfondie avec exercices d'application.

**Type de texte étudié :** ${typeTexte}

## III. Règles et Méthodologie

### Règle principale

Explication claire et précise de la règle de grammaire, conjugaison, ou méthodologie littéraire.

**Formulation :**
La règle énoncée de manière simple et mémorisable.

**Application :**
1. Étape 1
2. Étape 2
3. Étape 3

### Exceptions et cas particuliers

Précisions sur les exceptions importantes à connaître.

## IV. Pratique et Exercices

### Exercice 1: Application de la règle

**Consigne :** Appliquer ${chapitre.objectifs[0].toLowerCase()}.

**Support :** Texte ou phrase à analyser/transformer.

**Correction détaillée :**
Explication pas à pas de la résolution.

### Exercice 2: Analyse de texte (contexte camerounais)

Étude d'un extrait d'auteur camerounais ou francophone africain.

**Extrait :**
"[Citation d'auteur francophone...]"

**Questions d'analyse :**
1. Identifier les éléments grammaticaux
2. Analyser le style
3. Commenter le sens
4. Interpréter dans le contexte culturel

## V. Production et Expression

### Expression écrite

Rédaction guidée utilisant les notions apprises.

**Sujet :** ${typeTexte} sur un thème proche de l'univers des élèves camerounais.

**Critères de réussite :**
- Respect de la consigne
- Application des règles vues
- Richesse du vocabulaire
- Cohérence et structure

### Expression orale

Présentation ou discussion sur le thème du chapitre.

## Conclusion

Points essentiels à retenir :
${chapitre.objectifs.map((obj, idx) => `${idx + 1}. ${obj}`).join('\n')}

**Prochaine leçon :** ${numeroLecon < 3 ? `Leçon ${numeroLecon + 1} - Approfondissement` : 'Nouveau chapitre'}

**📖 Citation littéraire :**
"La langue française est une femme. Et cette femme est si belle, si fière, si modeste, si hardie, si touchante..." - Anatole France
`,
            keyPoints: chapitre.objectifs.map(obj => ({
              title: obj,
              content: `Ce concept est essentiel en Français ${niveau}. Il permet de maîtriser la langue française à l'écrit comme à l'oral. La compréhension de ${obj.toLowerCase()} est fondamentale pour progresser dans l'étude du français et de la littérature francophone.`
            })),
            exercises: [
              {
                id: 1,
                title: 'Exercice de grammaire',
                question: `Appliquer la règle sur ${chapitre.objectifs[0].toLowerCase()}.`,
                answer: 'Correction détaillée avec explications',
                explanation: `Pour réaliser cet exercice de Français :

Étape 1: Identifier les éléments concernés
Étape 2: Appliquer la règle vue en cours
Étape 3: Vérifier les accords et la cohérence
Étape 4: Relire et corriger`,
                difficulty: 'facile'
              },
              {
                id: 2,
                title: 'Analyse de texte camerounais',
                question: `Analyser un extrait d'auteur francophone : ${exempleLocal}. Étudier le style, les figures et le sens.`,
                answer: 'Analyse littéraire complète',
                explanation: `Ce problème nécessite :
1. Lecture attentive du texte
2. Identification des procédés d'écriture
3. Analyse du sens littéral et figuré
4. Interprétation dans le contexte culturel camerounais`,
                difficulty: 'moyen'
              },
              {
                id: 3,
                title: 'Production d\'écrit',
                question: `Rédiger un ${typeTexte} sur ${chapitre.titre.toLowerCase()} en appliquant toutes les notions du chapitre.`,
                answer: 'Production rédigée avec respect des consignes',
                explanation: `Production complète incluant :
- Introduction et contexte
- Développement structuré
- Application des règles de grammaire et conjugaison
- Richesse du vocabulaire
- Conclusion pertinente
- Relecture et correction`,
                difficulty: 'difficile'
              }
            ],
            resources: [
              {
                type: 'pdf',
                title: `Fiches de révision - ${chapitre.titre}`,
                url: `/resources/francais/${niveau}/ch${chapitre.num}/fiches-revision.pdf`,
                description: 'Résumés des règles et exemples'
              },
              {
                type: 'video',
                title: 'Cours vidéo Français',
                url: `https://www.youtube.com/watch?v=francais-${niveau}`,
                duration: '20:00'
              },
              {
                type: 'interactive',
                title: 'Exercices interactifs',
                url: `https://exercices-francais.org/${niveau}`,
                description: 'Plateforme d\'exercices en ligne'
              }
            ],
            downloadableFiles: [
              {
                name: `Fiche de révision - ${chapitre.titre}`,
                url: `/downloads/francais/${niveau}/fiche-ch${chapitre.num}.pdf`,
                size: '1.2 MB',
                format: 'PDF'
              },
              {
                name: 'Exercices d\'application',
                url: `/downloads/francais/${niveau}/exercices-ch${chapitre.num}.pdf`,
                size: '900 KB',
                format: 'PDF'
              },
              {
                name: 'Textes d\'auteurs francophones',
                url: '/downloads/francais/anthologie-francophone.pdf',
                size: '4.5 MB',
                format: 'PDF'
              },
              {
                name: 'Guide méthodologique',
                url: `/downloads/francais/${niveau}/methodologie.pdf`,
                size: '2.8 MB',
                format: 'PDF'
              }
            ]
          };

          // Quiz pour la leçon 3
          const quiz = hasQuiz ? {
            title: `Évaluation - ${chapitre.titre}`,
            description: `Test de connaissances sur ${chapitre.titre.toLowerCase()}`,
            timeLimit: 25,
            passingScore: 12,
            totalPoints: 20,
            questions: [
              {
                id: 1,
                type: 'multiple_choice',
                question: `Quelle est la règle principale concernant ${chapitre.objectifs[0].toLowerCase()} ?`,
                points: 4,
                options: [
                  { id: 'a', text: 'Réponse correcte détaillée', isCorrect: true },
                  { id: 'b', text: 'Réponse incorrecte 1', isCorrect: false },
                  { id: 'c', text: 'Réponse incorrecte 2', isCorrect: false },
                  { id: 'd', text: 'Réponse incorrecte 3', isCorrect: false }
                ],
                explanation: `Explication de la règle avec exemples tirés de la littérature francophone.`,
                difficulty: 'medium',
                order: 1
              },
              {
                id: 2,
                type: 'true_false',
                question: `Dans la littérature camerounaise, ${exempleLocal} est un exemple pertinent pour ${chapitre.titre.toLowerCase()}.`,
                points: 3,
                correctAnswer: true,
                explanation: 'Justification avec référence aux auteurs camerounais.',
                difficulty: 'easy',
                order: 2
              },
              {
                id: 3,
                type: 'fill_blank',
                question: `Compléter : ${chapitre.objectifs[1] || chapitre.objectifs[0]} nécessite de ________.`,
                points: 4,
                correctAnswer: 'respecter les règles',
                acceptableAnswers: ['appliquer la règle', 'suivre la méthode'],
                caseSensitive: false,
                explanation: 'Explication de la méthodologie à suivre.',
                difficulty: 'medium',
                order: 3
              },
              {
                id: 4,
                type: 'multiple_choice',
                question: `Quel auteur camerounais est particulièrement reconnu en littérature francophone ?`,
                points: 3,
                options: [
                  { id: 'a', text: 'Mongo Beti', isCorrect: true },
                  { id: 'b', text: 'Victor Hugo', isCorrect: false },
                  { id: 'c', text: 'Molière', isCorrect: false },
                  { id: 'd', text: 'Balzac', isCorrect: false }
                ],
                explanation: 'Mongo Beti (1932-2001) est l\'un des plus grands écrivains camerounais, auteur de "Ville cruelle" et "Le Pauvre Christ de Bomba".',
                difficulty: 'easy',
                order: 4
              },
              {
                id: 5,
                type: 'short_answer',
                question: `Donnez un exemple d'application de ${chapitre.objectifs[0].toLowerCase()} dans un contexte camerounais.`,
                points: 6,
                sampleAnswer: `Exemple d'application dans la littérature ou la communication camerounaise, avec référence aux auteurs locaux ou aux situations quotidiennes.`,
                gradingCriteria: [
                  'Pertinence de l\'exemple (2 pts)',
                  'Lien avec le contexte camerounais (2 pts)',
                  'Application correcte de la règle (2 pts)'
                ],
                difficulty: 'hard',
                order: 5
              }
            ]
          } : null;

          const [lesson, lessonCreated] = await Lesson.findOrCreate({
            where: {
              subjectId: subject.id,
              title: lessonTitle
            },
            defaults: {
              title: lessonTitle,
              description: `Leçon ${numeroLecon} du chapitre ${chapitre.num}: ${chapitre.titre}`,
              subjectId: subject.id,
              chapterId: chapter.id,
              order: (chapitre.num - 1) * 3 + numeroLecon,
              type: typeLecon,
              difficulty: difficultes[i],
              estimatedDuration: 45,
              content: lessonContent,
              objectives: chapitre.objectifs.slice(0, 2),
              prerequisites: numeroLecon > 1 ? [`Leçon ${numeroLecon - 1}`] : [],
              hasQuiz: hasQuiz,
              quiz: quiz,
              isActive: true,
              isPremium: false,
              isFree: isFree,
              cameroonContext: {
                localExamples: exemplesCameroun.slice(0, 6),
                culturalReferences: ['Littérature francophone africaine', 'Auteurs camerounais'],
                localLanguageTerms: {}
              },
              stats: {
                viewCount: 0,
                completionCount: 0,
                averageScore: 0,
                averageTime: 0,
                likeCount: 0,
                difficulty_rating: 0
              },
              metadata: {
                tags: ['français', niveau.toLowerCase(), `chapitre-${chapitre.num}`, 'cameroun', 'langues', 'littérature', 'grammaire'],
                searchKeywords: [chapitre.titre.toLowerCase(), 'français', 'grammaire', 'littérature', niveau.toLowerCase()],
                language: 'fr',
                version: '1.0',
                authorNotes: `Généré automatiquement - Programme MINESEC Français ${niveau}`
              },
              reviewStatus: 'approved',
              publishedAt: new Date()
            }
          });

          if (lessonCreated) {
            console.log(`      ${isFree ? '🆓' : '  '} L${numeroLecon}: ${typeLecon}${hasQuiz ? ' + quiz' : ''}`);
          }
        }
      }

      console.log(`✅ ${niveau} terminé`);
    }

    console.log('\n======================================================================');
    console.log('  ✅ GÉNÉRATION TERMINÉE AVEC SUCCÈS');
    console.log('======================================================================\n');

    // Statistiques finales
    const countSubjects = await Subject.count({ where: { title: { [database.sequelize.Sequelize.Op.like]: 'Français%' } } });
    const countChapters = await Chapter.count({
      include: [{
        model: Subject,
        where: { title: { [database.sequelize.Sequelize.Op.like]: 'Français%' } }
      }]
    });
    const countLessons = await Lesson.count({
      include: [{
        model: Subject,
        where: { title: { [database.sequelize.Sequelize.Op.like]: 'Français%' } }
      }]
    });
    const countQuizzes = await Lesson.count({
      where: { hasQuiz: true },
      include: [{
        model: Subject,
        where: { title: { [database.sequelize.Sequelize.Op.like]: 'Français%' } }
      }]
    });

    console.log('📊 STATISTIQUES FINALES\n');
    console.log(`   Subjects créés: ${countSubjects}`);
    console.log(`   Chapitres créés: ${countChapters}`);
    console.log(`   Leçons créées: ${countLessons}`);
    console.log(`   Quiz créés: ${countQuizzes}`);
    console.log(`   Leçons gratuites: ${countChapters} (1 par chapitre)\n`);

    console.log('💚 La force du savoir en héritage - Claudine 💚\n');

  } catch (error) {
    console.error('❌ Erreur lors de la génération:', error);
    throw error;
  }
}

// Exécution
(async () => {
  try {
    const models = database.initializeModels();
    console.log('');

    await genererContenuFrancais(models);

    console.log('\n✅ Script terminé avec succès');
    await database.sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    await database.sequelize.close();
    process.exit(1);
  }
})();
