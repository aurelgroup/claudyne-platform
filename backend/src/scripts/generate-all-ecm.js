require('dotenv').config({ path: __dirname + '/../../../.env' });
const database = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Configuration
const TOUS_NIVEAUX = ['CP', 'CE1', 'CE2', 'CM1', 'CM2', '6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Tle'];

// Chapitres d'ECM par niveau selon programme MINESEC Cameroun
const CHAPITRES_ECM = {
  'CP': [
    { num: 1, titre: 'Vivre ensemble à l\'école', trimestre: 1, objectifs: ['Respecter les autres', 'Partager', 'Obéir aux règles de classe'] },
    { num: 2, titre: 'L\'hygiène et la santé', trimestre: 1, objectifs: ['Se laver les mains', 'Brosser les dents', 'Être propre'] },
    { num: 3, titre: 'La politesse', trimestre: 2, objectifs: ['Dire bonjour et merci', 'Demander pardon', 'Être courtois'] },
    { num: 4, titre: 'Les symboles du Cameroun', trimestre: 2, objectifs: ['Le drapeau', 'L\'hymne national', 'Les armoiries'] },
    { num: 5, titre: 'Protéger l\'environnement', trimestre: 3, objectifs: ['Ne pas jeter les déchets', 'Économiser l\'eau', 'Respecter la nature'] }
  ],
  'CE1': [
    { num: 1, titre: 'Les règles de vie à l\'école', trimestre: 1, objectifs: ['Discipline', 'Ponctualité', 'Respect du matériel'] },
    { num: 2, titre: 'La famille et les valeurs', trimestre: 1, objectifs: ['Respect des parents', 'Solidarité familiale', 'Entraide'] },
    { num: 3, titre: 'La santé et l\'alimentation', trimestre: 2, objectifs: ['Bien manger', 'Hygiène corporelle', 'Prévention des maladies'] },
    { num: 4, titre: 'Être citoyen camerounais', trimestre: 2, objectifs: ['Fierté nationale', 'Symboles nationaux', 'Unité nationale'] },
    { num: 5, titre: 'Respecter l\'environnement', trimestre: 3, objectifs: ['Propreté', 'Protection des arbres', 'Économie d\'énergie'] }
  ],
  'CE2': [
    { num: 1, titre: 'Droits et devoirs à l\'école', trimestre: 1, objectifs: ['Droit à l\'éducation', 'Devoir d\'apprendre', 'Discipline scolaire'] },
    { num: 2, titre: 'Les valeurs morales', trimestre: 1, objectifs: ['Honnêteté', 'Courage', 'Générosité'] },
    { num: 3, titre: 'La sécurité routière', trimestre: 2, objectifs: ['Traverser la route', 'Panneaux de signalisation', 'Comportement en voiture'] },
    { num: 4, titre: 'Le civisme au Cameroun', trimestre: 2, objectifs: ['Respect des lois', 'Institutions', 'Devoirs civiques'] },
    { num: 5, titre: 'Protection de l\'environnement', trimestre: 3, objectifs: ['Tri des déchets', 'Lutte contre la pollution', 'Biodiversité'] }
  ],
  'CM1': [
    { num: 1, titre: 'Droits et devoirs du citoyen', trimestre: 1, objectifs: ['Droits fondamentaux', 'Devoirs civiques', 'Responsabilités'] },
    { num: 2, titre: 'Les institutions camerounaises', trimestre: 1, objectifs: ['Président de la République', 'Gouvernement', 'Assemblée Nationale'] },
    { num: 3, titre: 'Les valeurs démocratiques', trimestre: 2, objectifs: ['Liberté', 'Égalité', 'Justice'] },
    { num: 4, titre: 'La diversité culturelle du Cameroun', trimestre: 2, objectifs: ['Ethnies', 'Langues', 'Traditions'] },
    { num: 5, titre: 'Développement durable', trimestre: 3, objectifs: ['Préserver les ressources', 'Lutte contre le réchauffement', 'Énergies renouvelables'] }
  ],
  'CM2': [
    { num: 1, titre: 'La Constitution du Cameroun', trimestre: 1, objectifs: ['Loi fondamentale', 'Séparation des pouvoirs', 'Révision constitutionnelle'] },
    { num: 2, titre: 'Les droits de l\'enfant', trimestre: 1, objectifs: ['Convention internationale', 'Protection', 'Éducation'] },
    { num: 3, titre: 'Démocratie et élections', trimestre: 2, objectifs: ['Vote', 'Partis politiques', 'Scrutin'] },
    { num: 4, titre: 'Unité et intégration nationale', trimestre: 2, objectifs: ['Bilinguisme', 'Vivre ensemble', 'Paix sociale'] },
    { num: 5, titre: 'Éducation environnementale', trimestre: 3, objectifs: ['Gestion des déchets', 'Préservation de la faune', 'Actions citoyennes'] }
  ],
  '6ème': [
    { num: 1, titre: 'Citoyenneté et civisme', trimestre: 1, objectifs: ['Être citoyen', 'Civisme au quotidien', 'Respect des lois'] },
    { num: 2, titre: 'Les institutions de la République', trimestre: 1, objectifs: ['Pouvoir exécutif', 'Pouvoir législatif', 'Pouvoir judiciaire'] },
    { num: 3, titre: 'Les valeurs républicaines', trimestre: 2, objectifs: ['Laïcité', 'Fraternité', 'Solidarité'] },
    { num: 4, titre: 'Droits de l\'Homme', trimestre: 2, objectifs: ['Déclaration universelle', 'Dignité humaine', 'Non-discrimination'] },
    { num: 5, titre: 'Écocitoyenneté', trimestre: 3, objectifs: ['Responsabilité environnementale', 'Gestes écologiques', 'Développement durable'] }
  ],
  '5ème': [
    { num: 1, titre: 'L\'organisation de l\'État camerounais', trimestre: 1, objectifs: ['Administration centrale', 'Décentralisation', 'Collectivités territoriales'] },
    { num: 2, titre: 'Justice et équité', trimestre: 1, objectifs: ['Système judiciaire', 'Droits et recours', 'Procès équitable'] },
    { num: 3, titre: 'Égalité et lutte contre les discriminations', trimestre: 2, objectifs: ['Égalité homme-femme', 'Lutte contre le racisme', 'Inclusion'] },
    { num: 4, titre: 'Médias et information', trimestre: 2, objectifs: ['Liberté de la presse', 'Esprit critique', 'Fake news'] },
    { num: 5, titre: 'Engagement citoyen', trimestre: 3, objectifs: ['Bénévolat', 'Associations', 'Action collective'] }
  ],
  '4ème': [
    { num: 1, titre: 'Démocratie et participation politique', trimestre: 1, objectifs: ['Élections', 'Référendum', 'Représentation'] },
    { num: 2, titre: 'Droits et libertés fondamentales', trimestre: 1, objectifs: ['Liberté d\'expression', 'Liberté de conscience', 'Droit de propriété'] },
    { num: 3, titre: 'Responsabilité sociale', trimestre: 2, objectifs: ['Solidarité', 'Lutte contre la pauvreté', 'Cohésion sociale'] },
    { num: 4, titre: 'Patrimoine et culture nationale', trimestre: 2, objectifs: ['Protection du patrimoine', 'Diversité culturelle', 'Identité nationale'] },
    { num: 5, titre: 'Développement durable et citoyenneté', trimestre: 3, objectifs: ['Objectifs de développement durable', 'Consommation responsable', 'Économie verte'] }
  ],
  '3ème': [
    { num: 1, titre: 'Les institutions internationales', trimestre: 1, objectifs: ['ONU', 'Union Africaine', 'Organisations régionales'] },
    { num: 2, titre: 'Droits de l\'Homme et justice internationale', trimestre: 1, objectifs: ['Cour pénale internationale', 'Génocides', 'Crimes contre l\'humanité'] },
    { num: 3, titre: 'Mondialisation et citoyenneté', trimestre: 2, objectifs: ['Interdépendance', 'Migrations', 'Citoyenneté mondiale'] },
    { num: 4, titre: 'Paix et résolution des conflits', trimestre: 2, objectifs: ['Médiation', 'Dialogue', 'Culture de la paix'] },
    { num: 5, titre: 'Enjeux environnementaux globaux', trimestre: 3, objectifs: ['Changement climatique', 'Biodiversité', 'Accord de Paris'] }
  ],
  '2nde': [
    { num: 1, titre: 'Principes et valeurs de la République', trimestre: 1, objectifs: ['Souveraineté populaire', 'État de droit', 'Séparation des pouvoirs'] },
    { num: 2, titre: 'Participation démocratique', trimestre: 1, objectifs: ['Suffrage universel', 'Partis politiques', 'Société civile'] },
    { num: 3, titre: 'Justice sociale et inégalités', trimestre: 2, objectifs: ['Redistribution', 'Politiques sociales', 'Lutte contre les inégalités'] },
    { num: 4, titre: 'Laïcité et diversité religieuse', trimestre: 2, objectifs: ['Principe de laïcité', 'Liberté religieuse', 'Vivre ensemble'] },
    { num: 5, titre: 'Défis environnementaux du XXIe siècle', trimestre: 3, objectifs: ['Transition écologique', 'Énergies renouvelables', 'Économie circulaire'] }
  ],
  '1ère': [
    { num: 1, titre: 'Constitution et vie politique au Cameroun', trimestre: 1, objectifs: ['Régime politique', 'Institutions camerounaises', 'Vie politique'] },
    { num: 2, titre: 'Droits fondamentaux et libertés publiques', trimestre: 1, objectifs: ['Catalogue des droits', 'Limitations', 'Protection juridictionnelle'] },
    { num: 3, titre: 'Intégration régionale africaine', trimestre: 2, objectifs: ['CEMAC', 'CEEAC', 'Union Africaine'] },
    { num: 4, titre: 'Éthique et responsabilité', trimestre: 2, objectifs: ['Déontologie', 'Corruption', 'Bonne gouvernance'] },
    { num: 5, titre: 'Développement durable au Cameroun', trimestre: 3, objectifs: ['Vision 2035', 'Croissance inclusive', 'Préservation environnementale'] }
  ],
  'Tle': [
    { num: 1, titre: 'Démocratie et État de droit', trimestre: 1, objectifs: ['Théories démocratiques', 'Constitutionnalisme', 'Garanties juridictionnelles'] },
    { num: 2, titre: 'Droits de l\'Homme et humanisme', trimestre: 1, objectifs: ['Évolution historique', 'Universalisme', 'Défis contemporains'] },
    { num: 3, titre: 'Gouvernance et citoyenneté active', trimestre: 2, objectifs: ['Participation citoyenne', 'Transparence', 'Reddition des comptes'] },
    { num: 4, titre: 'Mondialisation et enjeux éthiques', trimestre: 2, objectifs: ['Éthique globale', 'Responsabilité sociale des entreprises', 'Commerce équitable'] },
    { num: 5, titre: 'Avenir de la planète et responsabilité', trimestre: 3, objectifs: ['Objectifs de développement durable', 'Transition énergétique', 'Solidarité internationale'] }
  ]
};

// Exemples camerounais pour l'ECM
const exemplesCameroun = [
  'Constitution du Cameroun (1996, révisée 2008)',
  'Paul Biya (Président de la République)',
  'Assemblée Nationale du Cameroun',
  'Bilinguisme officiel (français-anglais)',
  'Fête nationale (20 mai)',
  'Hymne national "Ô Cameroun, berceau de nos ancêtres"',
  'Devise: "Paix - Travail - Patrie"',
  'Décentralisation au Cameroun',
  'Élections ELECAM',
  'Commission Nationale des Droits de l\'Homme',
  'Lutte contre la corruption (CONAC)',
  'Vision 2035 du Cameroun',
  'CEMAC (Communauté Économique et Monétaire)',
  'Union Africaine (siège à Addis-Abeba)',
  'Diversité ethnique camerounaise (250+ ethnies)'
];

// Valeurs et thèmes ECM
const valeursECM = [
  'Respect',
  'Honnêteté',
  'Solidarité',
  'Tolérance',
  'Justice',
  'Responsabilité',
  'Intégrité',
  'Dignité humaine',
  'Égalité',
  'Liberté'
];

async function genererContenuECM(models) {
  const { Subject, Chapter, Lesson } = models;

  try {
    console.log('🔗 Connexion à PostgreSQL...');
    await database.sequelize.authenticate();
    console.log('✅ Connexion établie\n');

    console.log('======================================================================');
    console.log('  🇨🇲 GÉNÉRATION COMPLÈTE - ECM');
    console.log('  📖 Éducation à la Citoyenneté et à la Morale');
    console.log('  🇨🇲 CP → Terminale (Tous niveaux)');
    console.log('======================================================================\n');

    for (const niveau of TOUS_NIVEAUX) {
      console.log(`\n📊 NIVEAU: ${niveau}`);
      console.log('----------------------------------------------------------------------');

      const chapitres = CHAPITRES_ECM[niveau];
      if (!chapitres) {
        console.log(`⚠️  Pas de chapitres définis pour ${niveau}`);
        continue;
      }

      // Créer le subject
      const subjectTitle = `ECM ${niveau}`;
      const [subject, created] = await Subject.findOrCreate({
        where: { title: subjectTitle },
        defaults: {
          id: uuidv4(),
          title: subjectTitle,
          description: `Programme complet d'Éducation à la Citoyenneté et à la Morale pour la classe de ${niveau} selon le curriculum camerounais MINESEC`,
          level: niveau,
          category: 'Sciences Humaines',
          icon: '🇨🇲',
          color: '#10B981',
          difficulty: niveau.includes('Tle') || niveau.includes('1ère') ? 'Avancé' :
                      niveau.includes('2nde') || niveau.includes('ème') ? 'Intermédiaire' : 'Débutant',
          estimatedDuration: 90,
          isActive: true,
          isPremium: false,
          order: 4,
          prerequisites: [],
          cameroonCurriculum: {
            officialCode: `ECM-${niveau.toUpperCase()}-2024`,
            ministerialRef: 'Programme MINESEC 2024',
            competencies: ['Respecter', 'Participer', 'Analyser', 'Argumenter', 'S\'engager', 'Agir en citoyen']
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
            estimatedDuration: 135,
            difficulty: niveau.includes('Tle') || niveau.includes('1ère') ? 'Avancé' :
                        niveau.includes('2nde') || niveau.includes('ème') ? 'Intermédiaire' : 'Débutant',
            officialReference: {
              code: `ECM-${niveau.toUpperCase()}-CH${chapitre.num}`,
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
          const valeur = valeursECM[Math.floor(Math.random() * valeursECM.length)];

          const lessonTitle = `${chapitre.titre} - Partie ${numeroLecon}`;

          const lessonContent = {
            videoUrl: typeLecon === 'video' ? `https://www.youtube.com/watch?v=ecm-${niveau}-ch${chapitre.num}-l${numeroLecon}` : null,
            transcript: `# ${chapitre.titre} - Leçon ${numeroLecon}

## Introduction

Bienvenue dans cette leçon ${numeroLecon} sur **${chapitre.titre.toLowerCase()}**. Cette leçon fait partie du programme d'Éducation à la Citoyenneté et à la Morale ${niveau} selon le curriculum camerounais MINESEC.

## I. Rappels et Valeurs

Avant de commencer, rappelons les valeurs fondamentales :
${chapitre.objectifs.slice(0, 2).map(obj => `- ${obj}`).join('\n')}

**Valeur centrale :** ${valeur}

## II. Développement du Thème

### Point 1: ${chapitre.objectifs[0]}

Explication détaillée avec exemples concrets de la vie quotidienne.

**Exemple au Cameroun :** ${exempleLocal}

Application pratique : comment mettre en œuvre cette notion dans la vie quotidienne au Cameroun, à l'école, en famille, dans la société...

### Point 2: ${chapitre.objectifs[1] || chapitre.objectifs[0]}

Analyse approfondie avec situations réelles.

**Valeur associée :** ${valeur}

Étude de cas concrets montrant l'importance de cette valeur dans la construction d'une société harmonieuse.

## III. Cadre Juridique et Institutionnel

### Textes de référence

Les textes juridiques qui encadrent ce thème :

**Au Cameroun :**
- Constitution du Cameroun
- Lois et règlements
- Conventions internationales ratifiées

**Au niveau international :**
- Déclaration Universelle des Droits de l'Homme
- Conventions de l'ONU
- Charte Africaine

### Institutions concernées

Les institutions camerounaises et internationales qui veillent à l'application :
- Ministères compétents
- Commissions nationales
- Organisations de la société civile
- Instances internationales

## IV. Situations et Études de Cas

### Cas pratique 1: Situation scolaire

**Contexte :** Situation concrète dans un établissement scolaire camerounais.

**Questions :**
1. Quelle est la problématique ?
2. Quelles valeurs sont en jeu ?
3. Comment agir en citoyen responsable ?
4. Quelles sont les conséquences de nos actes ?

### Cas pratique 2: Vie en société

**Contexte :** Situation dans la communauté ou la société camerounaise.

**Analyse :**
- Identifier les enjeux civiques et moraux
- Proposer des solutions responsables
- Argumenter en s'appuyant sur les valeurs
- Envisager les impacts collectifs

## V. Action Citoyenne et Engagement

### Agir au quotidien

Comment mettre en pratique les valeurs apprises :

**À l'école :**
- Respecter le règlement intérieur
- Participer activement à la vie scolaire
- Être solidaire avec ses camarades

**En famille :**
- Respecter les membres de sa famille
- Participer aux tâches domestiques
- Transmettre les valeurs

**Dans la société :**
- Respecter les lois et règlements
- Participer à la vie de la communauté
- S'engager pour le bien commun

### Projet citoyen

Proposition d'actions concrètes à mener :
- Campagnes de sensibilisation
- Actions de solidarité
- Protection de l'environnement
- Promotion des valeurs républicaines

## Conclusion

Points essentiels à retenir :
${chapitre.objectifs.map((obj, idx) => `${idx + 1}. ${obj}`).join('\n')}

**Prochaine leçon :** ${numeroLecon < 3 ? `Leçon ${numeroLecon + 1} - Approfondissement` : 'Nouveau chapitre'}

**🇨🇲 Devise du Cameroun :**
"Paix - Travail - Patrie"

**💚 Message citoyen :**
En tant que citoyen camerounais, chacun a le devoir de contribuer à la construction d'une société juste, solidaire et prospère. Les valeurs de ${valeur.toLowerCase()} et de civisme sont essentielles pour vivre ensemble dans l'harmonie et le respect mutuel.
`,
            keyPoints: chapitre.objectifs.map(obj => ({
              title: obj,
              content: `Ce concept est essentiel en ECM ${niveau}. Il permet de former des citoyens responsables et engagés. La maîtrise de ${obj.toLowerCase()} est fondamentale pour vivre en société, respecter les lois et contribuer au développement du Cameroun.`
            })),
            exercises: [
              {
                id: 1,
                title: 'Analyse de situation',
                question: `Analyser une situation concrète liée à ${chapitre.objectifs[0].toLowerCase()}.`,
                answer: 'Analyse structurée avec identification du problème, des valeurs en jeu et des solutions',
                explanation: `Pour analyser une situation en ECM :

Étape 1: Identifier la situation et les acteurs
Étape 2: Repérer les valeurs et principes en jeu
Étape 3: Analyser les enjeux civiques et moraux
Étape 4: Proposer des solutions responsables`,
                difficulty: 'facile'
              },
              {
                id: 2,
                title: 'Étude de cas camerounais',
                question: `Étudier ${exempleLocal} dans le cadre de ${chapitre.titre.toLowerCase()}.`,
                answer: 'Étude complète avec contextualisation camerounaise',
                explanation: `Cette étude nécessite :
1. Contextualiser la situation au Cameroun
2. Identifier les textes juridiques applicables
3. Analyser les responsabilités citoyennes
4. Proposer des actions concrètes`,
                difficulty: 'moyen'
              },
              {
                id: 3,
                title: 'Projet citoyen',
                question: `Proposer un projet d'action citoyenne sur ${chapitre.titre.toLowerCase()} dans votre école ou communauté.`,
                answer: 'Projet structuré et réalisable',
                explanation: `Projet incluant :
- Objectifs clairs et réalisables
- Plan d'action détaillé
- Mobilisation des acteurs (élèves, enseignants, parents, autorités)
- Respect des valeurs et des lois
- Impact attendu sur la communauté
- Évaluation des résultats`,
                difficulty: 'difficile'
              }
            ],
            resources: [
              {
                type: 'pdf',
                title: `Fiches ECM - ${chapitre.titre}`,
                url: `/resources/ecm/${niveau}/ch${chapitre.num}/fiches.pdf`,
                description: 'Synthèses des valeurs et principes'
              },
              {
                type: 'video',
                title: 'Vidéo pédagogique ECM',
                url: `https://www.youtube.com/watch?v=ecm-${niveau}`,
                duration: '15:00'
              },
              {
                type: 'interactive',
                title: 'Quiz interactif ECM',
                url: `https://ecm-quiz.org/${niveau}`,
                description: 'Exercices interactifs de citoyenneté'
              }
            ],
            downloadableFiles: [
              {
                name: `Fiche de révision - ${chapitre.titre}`,
                url: `/downloads/ecm/${niveau}/fiche-ch${chapitre.num}.pdf`,
                size: '1.1 MB',
                format: 'PDF'
              },
              {
                name: 'Constitution du Cameroun',
                url: '/downloads/ecm/constitution-cameroun.pdf',
                size: '2.5 MB',
                format: 'PDF'
              },
              {
                name: 'Déclaration Universelle des Droits de l\'Homme',
                url: '/downloads/ecm/dudh.pdf',
                size: '800 KB',
                format: 'PDF'
              },
              {
                name: 'Guide du citoyen camerounais',
                url: `/downloads/ecm/${niveau}/guide-citoyen.pdf`,
                size: '1.9 MB',
                format: 'PDF'
              }
            ]
          };

          // Quiz pour la leçon 3
          const quiz = hasQuiz ? {
            title: `Évaluation - ${chapitre.titre}`,
            description: `Test de connaissances sur ${chapitre.titre.toLowerCase()}`,
            timeLimit: 20,
            passingScore: 12,
            totalPoints: 20,
            questions: [
              {
                id: 1,
                type: 'multiple_choice',
                question: `Quelle valeur est particulièrement importante pour ${chapitre.objectifs[0].toLowerCase()} ?`,
                points: 4,
                options: [
                  { id: 'a', text: valeur, isCorrect: true },
                  { id: 'b', text: 'Indifférence', isCorrect: false },
                  { id: 'c', text: 'Égoïsme', isCorrect: false },
                  { id: 'd', text: 'Irresponsabilité', isCorrect: false }
                ],
                explanation: `${valeur} est une valeur fondamentale en ECM qui permet de construire une société harmonieuse et respectueuse.`,
                difficulty: 'medium',
                order: 1
              },
              {
                id: 2,
                type: 'true_false',
                question: `Au Cameroun, ${exempleLocal} est un exemple pertinent pour illustrer ${chapitre.titre.toLowerCase()}.`,
                points: 3,
                correctAnswer: true,
                explanation: 'Justification avec référence au contexte camerounais et aux valeurs citoyennes.',
                difficulty: 'easy',
                order: 2
              },
              {
                id: 3,
                type: 'fill_blank',
                question: `La devise du Cameroun est "Paix - ________ - Patrie".`,
                correctAnswer: 'Travail',
                acceptableAnswers: ['travail', 'TRAVAIL'],
                caseSensitive: false,
                explanation: 'La devise nationale du Cameroun est "Paix - Travail - Patrie", inscrite dans les armoiries et symbolisant les valeurs fondamentales de la nation.',
                difficulty: 'easy',
                order: 3
              },
              {
                id: 4,
                type: 'multiple_choice',
                question: `Quelle date correspond à la fête nationale du Cameroun ?`,
                points: 3,
                options: [
                  { id: 'a', text: '20 mai', isCorrect: true },
                  { id: 'b', text: '1er janvier', isCorrect: false },
                  { id: 'c', text: '1er octobre', isCorrect: false },
                  { id: 'd', text: '14 juillet', isCorrect: false }
                ],
                explanation: 'Le 20 mai est la fête nationale du Cameroun, commémorant le référendum de 1972 qui a instauré l\'État unitaire.',
                difficulty: 'easy',
                order: 4
              },
              {
                id: 5,
                type: 'short_answer',
                question: `Comment pouvez-vous, en tant que citoyen camerounais, contribuer à ${chapitre.objectifs[0].toLowerCase()} dans votre école ou communauté ?`,
                points: 6,
                sampleAnswer: `En tant que citoyen responsable, je peux contribuer par des actions concrètes : respecter les règles, participer à la vie collective, sensibiliser mes camarades, m'engager dans des projets citoyens, et promouvoir les valeurs de ${valeur.toLowerCase()} au quotidien.`,
                gradingCriteria: [
                  'Pertinence des actions proposées (2 pts)',
                  'Lien avec les valeurs citoyennes (2 pts)',
                  'Faisabilité et engagement personnel (2 pts)'
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
                culturalReferences: ['Citoyenneté camerounaise', 'Valeurs républicaines', 'Unité nationale'],
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
                tags: ['ecm', 'citoyenneté', 'morale', niveau.toLowerCase(), `chapitre-${chapitre.num}`, 'cameroun', 'civisme'],
                searchKeywords: [chapitre.titre.toLowerCase(), 'ecm', 'citoyenneté', 'morale', niveau.toLowerCase()],
                language: 'fr',
                version: '1.0',
                authorNotes: `Généré automatiquement - Programme MINESEC ECM ${niveau}`
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
    const countSubjects = await Subject.count({ where: { title: { [database.sequelize.Sequelize.Op.like]: 'ECM%' } } });
    const countChapters = await database.sequelize.query(
      `SELECT COUNT(*) as count FROM chapters WHERE "subjectId" IN (SELECT id FROM subjects WHERE title LIKE 'ECM%')`,
      { type: database.sequelize.QueryTypes.SELECT }
    );
    const countLessons = await Lesson.count({
      where: {
        subjectId: {
          [database.sequelize.Sequelize.Op.in]: database.sequelize.literal(`(SELECT id FROM subjects WHERE title LIKE 'ECM%')`)
        }
      }
    });
    const countQuizzes = await Lesson.count({
      where: {
        hasQuiz: true,
        subjectId: {
          [database.sequelize.Sequelize.Op.in]: database.sequelize.literal(`(SELECT id FROM subjects WHERE title LIKE 'ECM%')`)
        }
      }
    });
    const countFree = await Lesson.count({
      where: {
        isFree: true,
        subjectId: {
          [database.sequelize.Sequelize.Op.in]: database.sequelize.literal(`(SELECT id FROM subjects WHERE title LIKE 'ECM%')`)
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

    await genererContenuECM(models);

    console.log('\n✅ Script terminé avec succès');
    await database.sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    await database.sequelize.close();
    process.exit(1);
  }
})();
