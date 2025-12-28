require('dotenv').config({ path: __dirname + '/../../../.env' });
const database = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Configuration
const TOUS_NIVEAUX = ['CP', 'CE1', 'CE2', 'CM1', 'CM2', '6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Tle'];

// Chapitres d'Histoire-Géographie par niveau selon programme MINESEC Cameroun
const CHAPITRES_HISTOIRE_GEO = {
  'CP': [
    { num: 1, titre: 'Ma famille et moi', trimestre: 1, objectifs: ['Se situer dans sa famille', 'Arbre généalogique simple', 'Rôles dans la famille'] },
    { num: 2, titre: 'Mon école et mon quartier', trimestre: 1, objectifs: ['Localiser l\'école', 'Se repérer dans le quartier', 'Les lieux importants'] },
    { num: 3, titre: 'Le temps qui passe', trimestre: 2, objectifs: ['Jour et nuit', 'Les jours de la semaine', 'Les saisons'] },
    { num: 4, titre: 'Ma ville/mon village', trimestre: 2, objectifs: ['Décrire son lieu de vie', 'Les activités locales', 'Les métiers'] },
    { num: 5, titre: 'Le Cameroun, mon pays', trimestre: 3, objectifs: ['Reconnaître le drapeau', 'L\'hymne national', 'Symboles du Cameroun'] }
  ],
  'CE1': [
    { num: 1, titre: 'L\'histoire de ma famille', trimestre: 1, objectifs: ['Généalogie familiale', 'Traditions familiales', 'Événements marquants'] },
    { num: 2, titre: 'Se repérer dans l\'espace', trimestre: 1, objectifs: ['Plans et cartes simples', 'Points cardinaux', 'Distances'] },
    { num: 3, titre: 'Les métiers d\'hier et d\'aujourd\'hui', trimestre: 2, objectifs: ['Évolution des métiers', 'Métiers traditionnels camerounais', 'Métiers modernes'] },
    { num: 4, titre: 'Paysages du Cameroun', trimestre: 2, objectifs: ['Montagne, plaine, mer', 'Végétation', 'Relief camerounais'] },
    { num: 5, titre: 'Vivre ensemble au Cameroun', trimestre: 3, objectifs: ['Diversité culturelle', 'Langues du Cameroun', 'Fêtes nationales'] }
  ],
  'CE2': [
    { num: 1, titre: 'Le temps et les calendriers', trimestre: 1, objectifs: ['Calendrier grégorien', 'Mesure du temps', 'Chronologie'] },
    { num: 2, titre: 'Les régions du Cameroun', trimestre: 1, objectifs: ['10 régions', 'Chefs-lieux', 'Spécificités régionales'] },
    { num: 3, titre: 'Peuples et royaumes anciens du Cameroun', trimestre: 2, objectifs: ['Royaumes Bamoun, Bamiléké', 'Sultanats du Nord', 'Organisations traditionnelles'] },
    { num: 4, titre: 'Les ressources naturelles', trimestre: 2, objectifs: ['Agriculture', 'Forêts', 'Ressources minières'] },
    { num: 5, titre: 'Les grandes dates du Cameroun', trimestre: 3, objectifs: ['Indépendance 1960', 'Réunification 1961', 'Fête nationale'] }
  ],
  'CM1': [
    { num: 1, titre: 'La colonisation du Cameroun', trimestre: 1, objectifs: ['Période allemande', 'Mandat français et britannique', 'Résistances'] },
    { num: 2, titre: 'Géographie physique du Cameroun', trimestre: 1, objectifs: ['Relief et climat', 'Hydrographie', 'Zones climatiques'] },
    { num: 3, titre: 'Vers l\'indépendance', trimestre: 2, objectifs: ['Leaders nationalistes', 'Um Nyobè, Ahidjo', 'Processus d\'indépendance'] },
    { num: 4, titre: 'Population et villes du Cameroun', trimestre: 2, objectifs: ['Répartition de la population', 'Grandes villes', 'Urbanisation'] },
    { num: 5, titre: 'Le Cameroun dans l\'Afrique', trimestre: 3, objectifs: ['Afrique centrale', 'Organisations régionales', 'Relations avec les voisins'] }
  ],
  'CM2': [
    { num: 1, titre: 'Le Cameroun indépendant', trimestre: 1, objectifs: ['Construction nationale', 'Présidents successifs', 'Institutions'] },
    { num: 2, titre: 'Économie du Cameroun', trimestre: 1, objectifs: ['Secteurs économiques', 'Agriculture et industrie', 'Commerce'] },
    { num: 3, titre: 'L\'Afrique précoloniale', trimestre: 2, objectifs: ['Grands empires africains', 'Civilisations', 'Commerce transsaharien'] },
    { num: 4, titre: 'Géographie de l\'Afrique', trimestre: 2, objectifs: ['Relief africain', 'Grands fleuves', 'Climats'] },
    { num: 5, titre: 'Patrimoine et culture camerounaise', trimestre: 3, objectifs: ['Sites historiques', 'Traditions', 'Patrimoine UNESCO'] }
  ],
  '6ème': [
    { num: 1, titre: 'L\'Orient ancien', trimestre: 1, objectifs: ['Mésopotamie et Égypte', 'Premières civilisations', 'Écriture et empires'] },
    { num: 2, titre: 'La Grèce antique', trimestre: 1, objectifs: ['Cités grecques', 'Démocratie athénienne', 'Culture grecque'] },
    { num: 3, titre: 'Rome antique', trimestre: 2, objectifs: ['République romaine', 'Empire romain', 'Héritage de Rome'] },
    { num: 4, titre: 'Géographie de la Terre', trimestre: 2, objectifs: ['Continents et océans', 'Zones climatiques', 'Relief mondial'] },
    { num: 5, titre: 'L\'Afrique ancienne et médiévale', trimestre: 3, objectifs: ['Royaumes africains', 'Commerce et civilisations', 'Islam en Afrique'] }
  ],
  '5ème': [
    { num: 1, titre: 'Le Moyen Âge', trimestre: 1, objectifs: ['Féodalité', 'Église médiévale', 'Royaumes européens'] },
    { num: 2, titre: 'Les grandes découvertes', trimestre: 1, objectifs: ['Explorations', 'Christophe Colomb', 'Conséquences'] },
    { num: 3, titre: 'La traite négrière', trimestre: 2, objectifs: ['Traite atlantique', 'Impact sur l\'Afrique', 'Résistances'] },
    { num: 4, titre: 'Population mondiale', trimestre: 2, objectifs: ['Répartition', 'Croissance démographique', 'Migrations'] },
    { num: 5, titre: 'Les empires africains (Ghana, Mali, Songhaï)', trimestre: 3, objectifs: ['Organisation politique', 'Commerce de l\'or', 'Culture et éducation'] }
  ],
  '4ème': [
    { num: 1, titre: 'Les révolutions du XVIIIe siècle', trimestre: 1, objectifs: ['Lumières', 'Révolution française', 'Révolution américaine'] },
    { num: 2, titre: 'La révolution industrielle', trimestre: 1, objectifs: ['Innovations techniques', 'Urbanisation', 'Transformations sociales'] },
    { num: 3, titre: 'La colonisation de l\'Afrique', trimestre: 2, objectifs: ['Conférence de Berlin 1884-85', 'Partage de l\'Afrique', 'Résistances africaines'] },
    { num: 4, titre: 'Les espaces urbains', trimestre: 2, objectifs: ['Urbanisation mondiale', 'Villes et métropoles', 'Défis urbains'] },
    { num: 5, titre: 'Le Cameroun colonial', trimestre: 3, objectifs: ['Kamerun allemand', 'Mandat franco-britannique', 'Mouvements nationalistes'] }
  ],
  '3ème': [
    { num: 1, titre: 'La Première Guerre mondiale', trimestre: 1, objectifs: ['Causes et déroulement', 'Tirailleurs africains', 'Conséquences'] },
    { num: 2, titre: 'L\'entre-deux-guerres', trimestre: 1, objectifs: ['Crise de 1929', 'Totalitarismes', 'SDN'] },
    { num: 3, titre: 'La Seconde Guerre mondiale', trimestre: 2, objectifs: ['Conflit mondial', 'Génocides', 'Décolonisation'] },
    { num: 4, titre: 'Développement et inégalités', trimestre: 2, objectifs: ['Nord-Sud', 'IDH', 'Pauvreté et développement'] },
    { num: 5, titre: 'Les indépendances africaines', trimestre: 3, objectifs: ['Décolonisation', 'Leaders africains', 'Cameroun indépendant'] }
  ],
  '2nde': [
    { num: 1, titre: 'Les grandes civilisations méditerranéennes', trimestre: 1, objectifs: ['Grèce, Rome, civilisations orientales', 'Échanges culturels', 'Héritages'] },
    { num: 2, titre: 'Les sociétés africaines précoloniales', trimestre: 1, objectifs: ['Organisations politiques', 'Économies', 'Cultures'] },
    { num: 3, titre: 'Développement durable', trimestre: 2, objectifs: ['Enjeux environnementaux', 'Ressources', 'Changement climatique'] },
    { num: 4, titre: 'Mondialisation et territoires', trimestre: 2, objectifs: ['Flux mondiaux', 'Acteurs', 'Inégalités spatiales'] },
    { num: 5, titre: 'Géopolitique de l\'Afrique', trimestre: 3, objectifs: ['Frontières héritées', 'Conflits', 'Intégration régionale'] }
  ],
  '1ère': [
    { num: 1, titre: 'L\'Europe et le monde au XIXe siècle', trimestre: 1, objectifs: ['Impérialisme', 'Révolution industrielle', 'Nationalismes'] },
    { num: 2, titre: 'Guerre et paix au XXe siècle', trimestre: 1, objectifs: ['Guerres mondiales', 'Guerre froide', 'ONU'] },
    { num: 3, titre: 'L\'Afrique et la décolonisation', trimestre: 2, objectifs: ['Luttes d\'indépendance', 'Panafricanisme', 'Néocolonialisme'] },
    { num: 4, titre: 'Les dynamiques territoriales', trimestre: 2, objectifs: ['Aménagement du territoire', 'Régionalisation', 'Décentralisation'] },
    { num: 5, titre: 'Le Cameroun contemporain', trimestre: 3, objectifs: ['Institutions politiques', 'Défis actuels', 'Perspectives'] }
  ],
  'Tle': [
    { num: 1, titre: 'Le monde depuis 1945', trimestre: 1, objectifs: ['Bipolarisation', 'Décolonisation', 'Nouvel ordre mondial'] },
    { num: 2, titre: 'Les puissances émergentes', trimestre: 1, objectifs: ['BRICS', 'Nouvelles puissances', 'Multipolarité'] },
    { num: 3, titre: 'L\'Afrique contemporaine', trimestre: 2, objectifs: ['Défis politiques et économiques', 'Démographie', 'Renaissance africaine'] },
    { num: 4, titre: 'Mondialisation et régionalisation', trimestre: 2, objectifs: ['Flux et réseaux', 'Organisations régionales', 'Afrique dans la mondialisation'] },
    { num: 5, titre: 'Enjeux du XXIe siècle', trimestre: 3, objectifs: ['Développement durable', 'Migrations', 'Terrorisme et sécurité'] }
  ]
};

// Exemples camerounais pour l'Histoire-Géographie
const exemplesCameroun = [
  'Indépendance du Cameroun (1er janvier 1960)',
  'Réunification (1er octobre 1961)',
  'Mont Cameroun (4095m, volcan actif)',
  'Ahmadou Ahidjo (premier président)',
  'Ruben Um Nyobè (leader nationaliste)',
  'Royaume Bamoun (Foumban)',
  'Palais des Rois Bamoun',
  'Lac Nyos (tragédie 1986)',
  'Waza National Park',
  'Douala (capitale économique)',
  'Yaoundé (capitale politique)',
  'Fleuve Sanaga',
  'Parc national de la Bénoué',
  'Sites UNESCO au Cameroun',
  'Réserve de faune du Dja'
];

// Personnages historiques camerounais et africains
const personnagesHistoriques = [
  'Ahmadou Ahidjo',
  'Ruben Um Nyobè',
  'Paul Biya',
  'Roi Njoya (Bamoun)',
  'Sultan Njimoluh Sanda (Mandara)',
  'Kwame Nkrumah (Ghana)',
  'Patrice Lumumba (Congo)',
  'Nelson Mandela (Afrique du Sud)',
  'Léopold Sédar Senghor (Sénégal)',
  'Jomo Kenyatta (Kenya)'
];

async function genererContenuHistoireGeographie(models) {
  const { Subject, Chapter, Lesson } = models;

  try {
    console.log('🔗 Connexion à PostgreSQL...');
    await database.sequelize.authenticate();
    console.log('✅ Connexion établie\n');

    console.log('======================================================================');
    console.log('  🌍 GÉNÉRATION COMPLÈTE - HISTOIRE-GÉOGRAPHIE');
    console.log('  📖 Programme Camerounais MINESEC');
    console.log('  🇨🇲 CP → Terminale (Tous niveaux)');
    console.log('======================================================================\n');

    for (const niveau of TOUS_NIVEAUX) {
      console.log(`\n📊 NIVEAU: ${niveau}`);
      console.log('----------------------------------------------------------------------');

      const chapitres = CHAPITRES_HISTOIRE_GEO[niveau];
      if (!chapitres) {
        console.log(`⚠️  Pas de chapitres définis pour ${niveau}`);
        continue;
      }

      // Créer le subject
      const subjectTitle = `Histoire-Géographie ${niveau}`;
      const [subject, created] = await Subject.findOrCreate({
        where: { title: subjectTitle },
        defaults: {
          id: uuidv4(),
          title: subjectTitle,
          description: `Programme complet d'Histoire-Géographie pour la classe de ${niveau} selon le curriculum camerounais MINESEC`,
          level: niveau,
          category: 'Sciences Humaines',
          icon: '🌍',
          color: '#F59E0B',
          difficulty: niveau.includes('Tle') || niveau.includes('1ère') ? 'Avancé' :
                      niveau.includes('2nde') || niveau.includes('ème') ? 'Intermédiaire' : 'Débutant',
          estimatedDuration: 120,
          isActive: true,
          isPremium: false,
          order: 3,
          prerequisites: [],
          cameroonCurriculum: {
            officialCode: `HISTGEO-${niveau.toUpperCase()}-2024`,
            ministerialRef: 'Programme MINESEC 2024',
            competencies: ['Analyser', 'Situer dans le temps', 'Situer dans l\'espace', 'Comprendre', 'Argumenter', 'Cartographier']
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
              code: `HISTGEO-${niveau.toUpperCase()}-CH${chapitre.num}`,
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
          const personnage = personnagesHistoriques[Math.floor(Math.random() * personnagesHistoriques.length)];

          const lessonTitle = `${chapitre.titre} - Partie ${numeroLecon}`;

          const lessonContent = {
            videoUrl: typeLecon === 'video' ? `https://www.youtube.com/watch?v=histgeo-${niveau}-ch${chapitre.num}-l${numeroLecon}` : null,
            transcript: `# ${chapitre.titre} - Leçon ${numeroLecon}

## Introduction

Bienvenue dans cette leçon ${numeroLecon} sur **${chapitre.titre.toLowerCase()}**. Cette leçon fait partie du programme d'Histoire-Géographie ${niveau} selon le curriculum camerounais MINESEC.

## I. Rappels et Contexte

Avant de commencer, situons-nous dans le temps et l'espace :
${chapitre.objectifs.slice(0, 2).map(obj => `- ${obj}`).join('\n')}

## II. Développement Historique et Géographique

### Point 1: ${chapitre.objectifs[0]}

Analyse détaillée avec documents historiques et cartes géographiques.

**Exemple du Cameroun:** ${exempleLocal}

Application au contexte camerounais : événements locaux, lieux spécifiques, acteurs camerounais de l'histoire...

### Point 2: ${chapitre.objectifs[1] || chapitre.objectifs[0]}

Étude approfondie avec sources et témoignages.

**Personnage historique:** ${personnage}

## III. Analyse et Méthodologie

### Méthode historique

Explication de la démarche de l'historien/géographe.

**Sources:**
- Documents d'archives
- Témoignages
- Cartes et statistiques
- Iconographie

**Analyse critique:**
1. Contextualisation
2. Identification de l'auteur et de la date
3. Analyse du contenu
4. Mise en perspective

### Cartographie

Lecture et réalisation de croquis/cartes.

**Légende:**
- Symboles et figurés
- Échelle
- Orientation

## IV. Documents et Exercices

### Document 1: Texte historique/géographique

**Source:** [Document d'époque ou étude contemporaine]

**Questions:**
1. Présenter le document
2. Dégager les idées principales
3. Porter un regard critique
4. Mettre en relation avec le cours

### Document 2: Carte/Croquis (contexte camerounais)

Étude cartographique liée au Cameroun ou à l'Afrique.

**Analyse cartographique:**
- Localisation
- Description
- Explication
- Limites et portée

## V. Problématiques et Enjeux

### Enjeux historiques

Comprendre les conséquences des événements étudiés.

**Héritage:**
- Institutions
- Frontières
- Cultures
- Mémoires

### Enjeux géographiques

Comprendre l'organisation de l'espace et les dynamiques territoriales.

**Défis actuels:**
- Aménagement du territoire
- Développement durable
- Gestion des ressources
- Relations internationales

## Conclusion

Points essentiels à retenir :
${chapitre.objectifs.map((obj, idx) => `${idx + 1}. ${obj}`).join('\n')}

**Prochaine leçon :** ${numeroLecon < 3 ? `Leçon ${numeroLecon + 1} - Approfondissement` : 'Nouveau chapitre'}

**🌍 Le saviez-vous ?**
Le Cameroun, souvent appelé "Afrique en miniature", possède une histoire riche et une diversité géographique exceptionnelle qui en fait un cas d'étude unique en Afrique.

**🇨🇲 Lien avec le Cameroun:**
Cette leçon s'inscrit dans la compréhension de l'histoire et de la géographie camerounaises, africaines et mondiales, permettant aux élèves de situer leur pays dans un contexte plus large.
`,
            keyPoints: chapitre.objectifs.map(obj => ({
              title: obj,
              content: `Ce concept est essentiel en Histoire-Géographie ${niveau}. Il permet de comprendre les dynamiques historiques et spatiales. La maîtrise de ${obj.toLowerCase()} est fondamentale pour appréhender l'histoire du Cameroun et sa géographie dans un contexte africain et mondial.`
            })),
            exercises: [
              {
                id: 1,
                title: 'Analyse de document',
                question: `Analyser un document sur ${chapitre.objectifs[0].toLowerCase()}.`,
                answer: 'Analyse structurée avec présentation, analyse et critique',
                explanation: `Pour analyser un document en Histoire-Géographie :

Étape 1: Présenter le document (nature, auteur, date, contexte)
Étape 2: Analyser le contenu (idées principales, arguments)
Étape 3: Critiquer (fiabilité, limites, portée)
Étape 4: Conclure (apport du document)`,
                difficulty: 'facile'
              },
              {
                id: 2,
                title: 'Étude de cas camerounais',
                question: `Étudier ${exempleLocal} dans le cadre de ${chapitre.titre.toLowerCase()}.`,
                answer: 'Étude complète avec contextualisation',
                explanation: `Cette étude nécessite :
1. Situer dans le temps et l'espace (Cameroun/Afrique)
2. Décrire les faits/phénomènes
3. Expliquer les causes et conséquences
4. Analyser les enjeux actuels`,
                difficulty: 'moyen'
              },
              {
                id: 3,
                title: 'Composition/Croquis',
                question: `Réaliser une composition ou un croquis sur ${chapitre.titre.toLowerCase()} en intégrant les concepts du chapitre.`,
                answer: 'Production complète structurée',
                explanation: `Production incluant :
- Introduction (problématique, définitions, annonce du plan)
- Développement structuré (2-3 parties avec exemples)
- Conclusion (bilan, ouverture)
- Pour un croquis : titre, légende organisée, nomenclature
- Références au Cameroun et à l'Afrique`,
                difficulty: 'difficile'
              }
            ],
            resources: [
              {
                type: 'pdf',
                title: `Fiches de cours - ${chapitre.titre}`,
                url: `/resources/histoire-geo/${niveau}/ch${chapitre.num}/fiches.pdf`,
                description: 'Synthèses et repères chronologiques/spatiaux'
              },
              {
                type: 'video',
                title: 'Documentaire Histoire-Géographie',
                url: `https://www.youtube.com/watch?v=histgeo-${niveau}`,
                duration: '20:00'
              },
              {
                type: 'interactive',
                title: 'Cartes interactives',
                url: `https://cartes-histoire-geo.org/${niveau}`,
                description: 'Atlas historique et géographique interactif'
              }
            ],
            downloadableFiles: [
              {
                name: `Fiche de révision - ${chapitre.titre}`,
                url: `/downloads/histoire-geo/${niveau}/fiche-ch${chapitre.num}.pdf`,
                size: '1.5 MB',
                format: 'PDF'
              },
              {
                name: 'Cartes et croquis',
                url: `/downloads/histoire-geo/${niveau}/cartes-ch${chapitre.num}.pdf`,
                size: '2.1 MB',
                format: 'PDF'
              },
              {
                name: 'Atlas du Cameroun',
                url: '/downloads/histoire-geo/atlas-cameroun.pdf',
                size: '5.2 MB',
                format: 'PDF'
              },
              {
                name: 'Chronologie historique',
                url: `/downloads/histoire-geo/${niveau}/chronologie.pdf`,
                size: '1.8 MB',
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
                question: `Concernant ${chapitre.objectifs[0].toLowerCase()}, quelle affirmation est correcte ?`,
                points: 4,
                options: [
                  { id: 'a', text: 'Réponse correcte détaillée', isCorrect: true },
                  { id: 'b', text: 'Réponse incorrecte 1', isCorrect: false },
                  { id: 'c', text: 'Réponse incorrecte 2', isCorrect: false },
                  { id: 'd', text: 'Réponse incorrecte 3', isCorrect: false }
                ],
                explanation: `Explication avec contexte historique/géographique et références au Cameroun.`,
                difficulty: 'medium',
                order: 1
              },
              {
                id: 2,
                type: 'true_false',
                question: `${exempleLocal} est un élément important pour comprendre ${chapitre.titre.toLowerCase()}.`,
                points: 3,
                correctAnswer: true,
                explanation: 'Justification avec références historiques/géographiques camerounaises.',
                difficulty: 'easy',
                order: 2
              },
              {
                id: 3,
                type: 'fill_blank',
                question: `${personnage} a joué un rôle important dans ________.`,
                correctAnswer: 'l\'histoire du Cameroun',
                acceptableAnswers: ['l\'indépendance', 'la construction nationale', 'l\'histoire africaine'],
                caseSensitive: false,
                explanation: 'Explication du rôle historique du personnage.',
                difficulty: 'medium',
                order: 3
              },
              {
                id: 4,
                type: 'multiple_choice',
                question: `Quelle date correspond à l'indépendance du Cameroun ?`,
                points: 3,
                options: [
                  { id: 'a', text: '1er janvier 1960', isCorrect: true },
                  { id: 'b', text: '1er octobre 1961', isCorrect: false },
                  { id: 'c', text: '20 mai 1972', isCorrect: false },
                  { id: 'd', text: '11 février 1982', isCorrect: false }
                ],
                explanation: 'Le Cameroun français devient indépendant le 1er janvier 1960. Le 1er octobre 1961 marque la réunification avec le Cameroun britannique.',
                difficulty: 'easy',
                order: 4
              },
              {
                id: 5,
                type: 'short_answer',
                question: `Expliquez comment ${chapitre.objectifs[0].toLowerCase()} s'applique au contexte camerounais.`,
                points: 6,
                sampleAnswer: `Exemple d'application au Cameroun avec références historiques ou géographiques précises, analyse des enjeux locaux et mise en perspective africaine/mondiale.`,
                gradingCriteria: [
                  'Pertinence de l\'exemple camerounais (2 pts)',
                  'Analyse historique/géographique (2 pts)',
                  'Mise en perspective (2 pts)'
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
                culturalReferences: ['Histoire du Cameroun', 'Géographie camerounaise', 'Patrimoine national'],
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
                tags: ['histoire', 'géographie', niveau.toLowerCase(), `chapitre-${chapitre.num}`, 'cameroun', 'sciences-humaines'],
                searchKeywords: [chapitre.titre.toLowerCase(), 'histoire', 'géographie', niveau.toLowerCase()],
                language: 'fr',
                version: '1.0',
                authorNotes: `Généré automatiquement - Programme MINESEC Histoire-Géographie ${niveau}`
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
    const countSubjects = await Subject.count({ where: { title: { [database.sequelize.Sequelize.Op.like]: 'Histoire-Géographie%' } } });
    const countChapters = await database.sequelize.query(
      `SELECT COUNT(*) as count FROM chapters WHERE "subjectId" IN (SELECT id FROM subjects WHERE title LIKE 'Histoire-Géographie%')`,
      { type: database.sequelize.QueryTypes.SELECT }
    );
    const countLessons = await Lesson.count({
      where: {
        subjectId: {
          [database.sequelize.Sequelize.Op.in]: database.sequelize.literal(`(SELECT id FROM subjects WHERE title LIKE 'Histoire-Géographie%')`)
        }
      }
    });
    const countQuizzes = await Lesson.count({
      where: {
        hasQuiz: true,
        subjectId: {
          [database.sequelize.Sequelize.Op.in]: database.sequelize.literal(`(SELECT id FROM subjects WHERE title LIKE 'Histoire-Géographie%')`)
        }
      }
    });
    const countFree = await Lesson.count({
      where: {
        isFree: true,
        subjectId: {
          [database.sequelize.Sequelize.Op.in]: database.sequelize.literal(`(SELECT id FROM subjects WHERE title LIKE 'Histoire-Géographie%')`)
        }
      }
    });

    console.log('📊 STATISTIQUES FINALES\n');
    console.log(`   Subjects créés: ${countSubjects}`);
    console.log(`   Chapitres créés: ${countChapters[0].count}`);
    console.log(`   Leçons créées: ${countLessons}`);
    console.log(`   Quiz créés: ${countQuizzes}`);
    console.log(`   Leçons gratuites: ${countFree}\n`);

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

    await genererContenuHistoireGeographie(models);

    console.log('\n✅ Script terminé avec succès');
    await database.sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    await database.sequelize.close();
    process.exit(1);
  }
})();
