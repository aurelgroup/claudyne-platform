require('dotenv').config({ path: __dirname + '/../../../.env' });
const database = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Configuration
const TOUS_NIVEAUX = ['CP', 'CE1', 'CE2', 'CM1', 'CM2', '6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Tle'];

// Chapitres d'Anglais par niveau selon programme MINESEC Cameroun
const CHAPITRES_ANGLAIS = {
  'CP': [
    { num: 1, titre: 'The Alphabet and Sounds', trimestre: 1, objectifs: ['Recognize letters', 'Say the alphabet', 'Basic sounds'] },
    { num: 2, titre: 'Greetings and Introductions', trimestre: 1, objectifs: ['Say hello and goodbye', 'Introduce yourself', 'Basic politeness'] },
    { num: 3, titre: 'Numbers 1-10', trimestre: 2, objectifs: ['Count to 10', 'Recognize numbers', 'Simple calculations'] },
    { num: 4, titre: 'Colors and Shapes', trimestre: 2, objectifs: ['Name basic colors', 'Identify shapes', 'Describe objects'] },
    { num: 5, titre: 'My Family and Friends', trimestre: 3, objectifs: ['Talk about family', 'Describe people', 'Simple sentences'] }
  ],
  'CE1': [
    { num: 1, titre: 'Daily Routines', trimestre: 1, objectifs: ['Tell time', 'Describe daily activities', 'Present simple tense'] },
    { num: 2, titre: 'Food and Drinks', trimestre: 1, objectifs: ['Name foods', 'Express preferences', 'Countable/uncountable nouns'] },
    { num: 3, titre: 'At School', trimestre: 2, objectifs: ['School vocabulary', 'Classroom instructions', 'Plural forms'] },
    { num: 4, titre: 'Animals and Nature', trimestre: 2, objectifs: ['Animal names', 'Habitats', 'Descriptive adjectives'] },
    { num: 5, titre: 'My Town and Places', trimestre: 3, objectifs: ['Places in town', 'Prepositions of place', 'Directions'] }
  ],
  'CE2': [
    { num: 1, titre: 'Describing People and Things', trimestre: 1, objectifs: ['Physical description', 'Personality traits', 'Comparative adjectives'] },
    { num: 2, titre: 'Sports and Hobbies', trimestre: 1, objectifs: ['Sports vocabulary', 'Talk about hobbies', 'Like/love/hate + -ing'] },
    { num: 3, titre: 'Weather and Seasons', trimestre: 2, objectifs: ['Weather vocabulary', 'Seasons', 'Present continuous'] },
    { num: 4, titre: 'Past Events and Stories', trimestre: 2, objectifs: ['Past simple tense', 'Story telling', 'Time expressions'] },
    { num: 5, titre: 'Future Plans', trimestre: 3, objectifs: ['Future with will/going to', 'Make plans', 'Express intentions'] }
  ],
  'CM1': [
    { num: 1, titre: 'Travel and Transportation', trimestre: 1, objectifs: ['Means of transport', 'Travel vocabulary', 'Modal verbs (can/must)'] },
    { num: 2, titre: 'Health and Body', trimestre: 1, objectifs: ['Body parts', 'Illnesses', 'Giving advice (should)'] },
    { num: 3, titre: 'Shopping and Money', trimestre: 2, objectifs: ['Shopping vocabulary', 'Prices', 'How much/How many'] },
    { num: 4, titre: 'Technology and Media', trimestre: 2, objectifs: ['Technology vocabulary', 'Present perfect', 'Media literacy'] },
    { num: 5, titre: 'Environment and Nature', trimestre: 3, objectifs: ['Environmental issues', 'Conditional sentences', 'Express concern'] }
  ],
  'CM2': [
    { num: 1, titre: 'Jobs and Professions', trimestre: 1, objectifs: ['Career vocabulary', 'Future careers', 'Question forms'] },
    { num: 2, titre: 'Culture and Traditions', trimestre: 1, objectifs: ['Cultural vocabulary', 'Compare cultures', 'Passive voice intro'] },
    { num: 3, titre: 'Communication Skills', trimestre: 2, objectifs: ['Telephone language', 'Formal/informal register', 'Reported speech intro'] },
    { num: 4, titre: 'Reading and Literature', trimestre: 2, objectifs: ['Reading strategies', 'Story elements', 'Book reviews'] },
    { num: 5, titre: 'Writing Skills', trimestre: 3, objectifs: ['Paragraph structure', 'Different text types', 'Editing and revising'] }
  ],
  '6ème': [
    { num: 1, titre: 'Grammar Foundations', trimestre: 1, objectifs: ['Parts of speech', 'Sentence structure', 'Subject-verb agreement'] },
    { num: 2, titre: 'Verb Tenses Review', trimestre: 1, objectifs: ['Present tenses', 'Past tenses', 'Future tenses'] },
    { num: 3, titre: 'Reading Comprehension', trimestre: 2, objectifs: ['Reading strategies', 'Main idea and details', 'Inference skills'] },
    { num: 4, titre: 'Vocabulary Building', trimestre: 2, objectifs: ['Word families', 'Prefixes and suffixes', 'Context clues'] },
    { num: 5, titre: 'Writing Paragraphs', trimestre: 3, objectifs: ['Topic sentences', 'Supporting details', 'Concluding sentences'] }
  ],
  '5ème': [
    { num: 1, titre: 'Advanced Grammar Structures', trimestre: 1, objectifs: ['Relative clauses', 'Conditionals (zero/first)', 'Modals of obligation'] },
    { num: 2, titre: 'Narrative Writing', trimestre: 1, objectifs: ['Plot structure', 'Character development', 'Dialogue writing'] },
    { num: 3, titre: 'Descriptive Writing', trimestre: 2, objectifs: ['Sensory details', 'Figurative language', 'Show don\'t tell'] },
    { num: 4, titre: 'Poetry and Literary Devices', trimestre: 2, objectifs: ['Poetic forms', 'Metaphor and simile', 'Imagery'] },
    { num: 5, titre: 'Speaking and Presentation', trimestre: 3, objectifs: ['Public speaking', 'Presentation skills', 'Debate basics'] }
  ],
  '4ème': [
    { num: 1, titre: 'Complex Sentence Structures', trimestre: 1, objectifs: ['Compound sentences', 'Complex sentences', 'Punctuation mastery'] },
    { num: 2, titre: 'Argumentative Writing', trimestre: 1, objectifs: ['Thesis statements', 'Arguments and evidence', 'Counterarguments'] },
    { num: 3, titre: 'Media Literacy', trimestre: 2, objectifs: ['Analyze media texts', 'Bias and perspective', 'Critical thinking'] },
    { num: 4, titre: 'Literature Analysis', trimestre: 2, objectifs: ['Literary elements', 'Theme and symbolism', 'Author\'s purpose'] },
    { num: 5, titre: 'Research and Documentation', trimestre: 3, objectifs: ['Research process', 'Citations', 'Bibliography'] }
  ],
  '3ème': [
    { num: 1, titre: 'Advanced Verb Forms', trimestre: 1, objectifs: ['Perfect tenses', 'Passive voice', 'Gerunds and infinitives'] },
    { num: 2, titre: 'Persuasive Writing and Speaking', trimestre: 1, objectifs: ['Rhetorical devices', 'Ethos/pathos/logos', 'Persuasive techniques'] },
    { num: 3, titre: 'World Literature', trimestre: 2, objectifs: ['Literary movements', 'Cultural context', 'Comparative analysis'] },
    { num: 4, titre: 'Academic Writing', trimestre: 2, objectifs: ['Essay structure', 'Formal register', 'Academic vocabulary'] },
    { num: 5, titre: 'Exam Preparation', trimestre: 3, objectifs: ['Test strategies', 'Time management', 'Review and practice'] }
  ],
  '2nde': [
    { num: 1, titre: 'Literary Analysis and Criticism', trimestre: 1, objectifs: ['Close reading', 'Literary criticism approaches', 'Analytical essays'] },
    { num: 2, titre: 'British and American Literature', trimestre: 1, objectifs: ['Major authors and works', 'Historical context', 'Literary periods'] },
    { num: 3, titre: 'Advanced Grammar and Style', trimestre: 2, objectifs: ['Stylistic choices', 'Sentence variety', 'Tone and voice'] },
    { num: 4, titre: 'Research and Critical Thinking', trimestre: 2, objectifs: ['Advanced research', 'Synthesis', 'Evaluation of sources'] },
    { num: 5, titre: 'Public Speaking and Debate', trimestre: 3, objectifs: ['Formal debates', 'Rhetoric', 'Persuasive speaking'] }
  ],
  '1ère': [
    { num: 1, titre: 'Anglophone Literature: Classics to Contemporary', trimestre: 1, objectifs: ['Shakespeare to modern authors', 'Genre studies', 'Thematic analysis'] },
    { num: 2, titre: 'African Anglophone Literature', trimestre: 1, objectifs: ['Chinua Achebe', 'Wole Soyinka', 'Postcolonial themes'] },
    { num: 3, titre: 'Advanced Writing: Essays and Commentary', trimestre: 2, objectifs: ['Literary commentary', 'Critical essays', 'Textual analysis'] },
    { num: 4, titre: 'Language and Linguistics', trimestre: 2, objectifs: ['Language variation', 'Sociolinguistics', 'Language change'] },
    { num: 5, titre: 'Examination Techniques', trimestre: 3, objectifs: ['Essay planning', 'Text commentary', 'Practice exams'] }
  ],
  'Tle': [
    { num: 1, titre: 'Masterpieces of Anglophone Literature', trimestre: 1, objectifs: ['Major works analysis', 'Literary canon', 'Comparative literature'] },
    { num: 2, titre: 'Cameroon Anglophone Literature', trimestre: 1, objectifs: ['Bate Besong', 'Nkemngong Nkengasong', 'Anglophone identity'] },
    { num: 3, titre: 'Advanced Critical Analysis', trimestre: 2, objectifs: ['Critical theory', 'Deconstructionism', 'Feminist criticism'] },
    { num: 4, titre: 'Language and Society', trimestre: 2, objectifs: ['Bilingualism in Cameroon', 'Language policy', 'Pidgin and Creole'] },
    { num: 5, titre: 'Baccalaureate Preparation', trimestre: 3, objectifs: ['Exam strategies', 'Sample questions', 'Final review'] }
  ]
};

// Exemples camerounais pour l'Anglais
const exemplesCameroun = [
  'Anglophone regions (Northwest and Southwest)',
  'Cameroon Pidgin English',
  'Bilingualism in Cameroon',
  'Anglophone Cameroonian authors (Bate Besong, Nkemngong Nkengasong)',
  'Buea and Bamenda (major Anglophone cities)',
  'Mount Cameroon and Limbe',
  'Anglophone cultural events',
  'English in Cameroon education system',
  'Commonwealth heritage in Cameroon',
  'Anglophone festivals and traditions'
];

// Auteurs anglophones (mondiaux et africains)
const auteursAnglophones = [
  'William Shakespeare',
  'Charles Dickens',
  'Chinua Achebe (Things Fall Apart)',
  'Wole Soyinka (Nobel Prize)',
  'Ngũgĩ wa Thiong\'o',
  'Bate Besong (Cameroon)',
  'Nkemngong Nkengasong (Cameroon)',
  'Maya Angelou',
  'Chimamanda Ngozi Adichie',
  'Buchi Emecheta'
];

async function genererContenuAnglais(models) {
  const { Subject, Chapter, Lesson } = models;

  try {
    console.log('🔗 Connexion à PostgreSQL...');
    await database.sequelize.authenticate();
    console.log('✅ Connexion établie\n');

    console.log('======================================================================');
    console.log('  🇬🇧 GÉNÉRATION COMPLÈTE - ANGLAIS (ENGLISH)');
    console.log('  📖 Programme Camerounais MINESEC');
    console.log('  🇨🇲 CP → Terminale (Tous niveaux)');
    console.log('======================================================================\n');

    for (const niveau of TOUS_NIVEAUX) {
      console.log(`\n📊 NIVEAU: ${niveau}`);
      console.log('----------------------------------------------------------------------');

      const chapitres = CHAPITRES_ANGLAIS[niveau];
      if (!chapitres) {
        console.log(`⚠️  Pas de chapitres définis pour ${niveau}`);
        continue;
      }

      // Créer le subject
      const subjectTitle = `Anglais ${niveau}`;
      const [subject, created] = await Subject.findOrCreate({
        where: { title: subjectTitle },
        defaults: {
          id: uuidv4(),
          title: subjectTitle,
          description: `Complete English program for ${niveau} grade according to Cameroon MINESEC curriculum`,
          level: niveau,
          category: 'Langues',
          icon: '🇬🇧',
          color: '#EF4444',
          difficulty: niveau.includes('Tle') || niveau.includes('1ère') ? 'Avancé' :
                      niveau.includes('2nde') || niveau.includes('ème') ? 'Intermédiaire' : 'Débutant',
          estimatedDuration: 120,
          isActive: true,
          isPremium: false,
          order: 2,
          prerequisites: [],
          cameroonCurriculum: {
            officialCode: `ENG-${niveau.toUpperCase()}-2024`,
            ministerialRef: 'Programme MINESEC 2024',
            competencies: ['Reading', 'Writing', 'Speaking', 'Listening', 'Grammar', 'Vocabulary']
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
            description: `Chapter ${chapitre.num}: ${chapitre.titre} - ${niveau}`,
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
              code: `ENG-${niveau.toUpperCase()}-CH${chapitre.num}`,
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
          const auteur = auteursAnglophones[Math.floor(Math.random() * auteursAnglophones.length)];

          const lessonTitle = `${chapitre.titre} - Part ${numeroLecon}`;

          const lessonContent = {
            videoUrl: typeLecon === 'video' ? `https://www.youtube.com/watch?v=english-${niveau}-ch${chapitre.num}-l${numeroLecon}` : null,
            transcript: `# ${chapitre.titre} - Lesson ${numeroLecon}

## Introduction

Welcome to Lesson ${numeroLecon} on **${chapitre.titre.toLowerCase()}**. This lesson is part of the English ${niveau} program according to the Cameroon MINESEC curriculum.

## I. Review and Prerequisites

Before we start, let's review the following concepts:
${chapitre.objectifs.slice(0, 2).map(obj => `- ${obj}`).join('\n')}

## II. Learning and Discovery

### Language Point 1: ${chapitre.objectifs[0]}

Detailed explanation with examples from Anglophone literature and Cameroon context.

**Example from Cameroon:** ${exempleLocal}

Practical application in Cameroon context: usage in daily life, education, media, and cultural events in the Anglophone regions...

### Language Point 2: ${chapitre.objectifs[1] || chapitre.objectifs[0]}

In-depth analysis with practice exercises.

**Literary Reference:** ${auteur}

## III. Grammar and Language Rules

### Main Rule

Clear and precise explanation of the grammar rule or language concept.

**Formula:**
The rule stated in a simple and memorable way.

**Application:**
1. Step 1: Identify
2. Step 2: Apply
3. Step 3: Practice

### Exceptions and Special Cases

Important exceptions to know and remember.

## IV. Practice and Exercises

### Exercise 1: Grammar Application

**Instructions:** Apply ${chapitre.objectifs[0].toLowerCase()}.

**Task:** Sentence or text to analyze/transform.

**Detailed Correction:**
Step-by-step explanation of the solution.

### Exercise 2: Cameroon Context Analysis

Study of an excerpt from Anglophone Cameroon literature or context.

**Extract:**
"[Quote from Anglophone author or Cameroon context...]"

**Analysis Questions:**
1. Identify grammatical elements
2. Analyze the style
3. Comment on the meaning
4. Interpret in cultural context

## V. Production and Expression

### Written Expression

Guided writing using learned concepts.

**Topic:** Text type related to Cameroon Anglophone students' universe.

**Success Criteria:**
- Follow instructions
- Apply learned rules
- Rich vocabulary
- Coherence and structure

### Oral Expression

Presentation or discussion on chapter topic.

**Topics for Discussion:**
- Bilingualism in Cameroon
- Anglophone culture and identity
- Commonwealth heritage
- Language and society

## Conclusion

Key points to remember:
${chapitre.objectifs.map((obj, idx) => `${idx + 1}. ${obj}`).join('\n')}

**Next Lesson:** ${numeroLecon < 3 ? `Lesson ${numeroLecon + 1} - Advanced Practice` : 'New Chapter'}

**📖 Literary Quote:**
"${auteur === 'William Shakespeare' ? 'All the world\'s a stage...' : 'The beauty of language lies in its diversity and richness.'}"

**🇨🇲 Cameroon Connection:**
In Cameroon's bilingual context, English plays a crucial role in education, administration, and cultural expression, particularly in the Northwest and Southwest regions.
`,
            keyPoints: chapitre.objectifs.map(obj => ({
              title: obj,
              content: `This concept is essential in English ${niveau}. It helps master English language in both written and oral forms. Understanding ${obj.toLowerCase()} is fundamental to progress in English and Anglophone literature, especially in Cameroon's bilingual context.`
            })),
            exercises: [
              {
                id: 1,
                title: 'Grammar Exercise',
                question: `Apply the rule on ${chapitre.objectifs[0].toLowerCase()}.`,
                answer: 'Detailed correction with explanations',
                explanation: `To complete this English exercise:

Step 1: Identify the elements concerned
Step 2: Apply the rule learned in class
Step 3: Check agreements and coherence
Step 4: Review and correct`,
                difficulty: 'facile'
              },
              {
                id: 2,
                title: 'Cameroon Anglophone Text Analysis',
                question: `Analyze an excerpt from Anglophone author: ${exempleLocal}. Study the style, language features, and meaning.`,
                answer: 'Complete literary analysis',
                explanation: `This exercise requires:
1. Careful reading of the text
2. Identification of language features
3. Analysis of literal and figurative meaning
4. Interpretation in Cameroon Anglophone cultural context`,
                difficulty: 'moyen'
              },
              {
                id: 3,
                title: 'Written Production',
                question: `Write a text about ${chapitre.titre.toLowerCase()} applying all concepts from the chapter.`,
                answer: 'Written production following instructions',
                explanation: `Complete production including:
- Introduction and context
- Structured development
- Application of grammar and vocabulary rules
- Rich and varied vocabulary
- Relevant conclusion
- Proofreading and correction`,
                difficulty: 'difficile'
              }
            ],
            resources: [
              {
                type: 'pdf',
                title: `Study Guide - ${chapitre.titre}`,
                url: `/resources/english/${niveau}/ch${chapitre.num}/study-guide.pdf`,
                description: 'Summary of rules and examples'
              },
              {
                type: 'video',
                title: 'English Video Lesson',
                url: `https://www.youtube.com/watch?v=english-${niveau}`,
                duration: '20:00'
              },
              {
                type: 'interactive',
                title: 'Interactive Exercises',
                url: `https://english-exercises.org/${niveau}`,
                description: 'Online exercise platform'
              }
            ],
            downloadableFiles: [
              {
                name: `Study Sheet - ${chapitre.titre}`,
                url: `/downloads/english/${niveau}/sheet-ch${chapitre.num}.pdf`,
                size: '1.2 MB',
                format: 'PDF'
              },
              {
                name: 'Practice Exercises',
                url: `/downloads/english/${niveau}/exercises-ch${chapitre.num}.pdf`,
                size: '900 KB',
                format: 'PDF'
              },
              {
                name: 'Anglophone Authors Anthology',
                url: '/downloads/english/anglophone-anthology.pdf',
                size: '4.8 MB',
                format: 'PDF'
              },
              {
                name: 'Grammar Reference Guide',
                url: `/downloads/english/${niveau}/grammar-guide.pdf`,
                size: '3.2 MB',
                format: 'PDF'
              }
            ]
          };

          // Quiz pour la leçon 3
          const quiz = hasQuiz ? {
            title: `Assessment - ${chapitre.titre}`,
            description: `Knowledge test on ${chapitre.titre.toLowerCase()}`,
            timeLimit: 25,
            passingScore: 12,
            totalPoints: 20,
            questions: [
              {
                id: 1,
                type: 'multiple_choice',
                question: `What is the main rule concerning ${chapitre.objectifs[0].toLowerCase()}?`,
                points: 4,
                options: [
                  { id: 'a', text: 'Correct detailed answer', isCorrect: true },
                  { id: 'b', text: 'Incorrect answer 1', isCorrect: false },
                  { id: 'c', text: 'Incorrect answer 2', isCorrect: false },
                  { id: 'd', text: 'Incorrect answer 3', isCorrect: false }
                ],
                explanation: `Explanation of the rule with examples from Anglophone literature.`,
                difficulty: 'medium',
                order: 1
              },
              {
                id: 2,
                type: 'true_false',
                question: `In Cameroon's Anglophone regions, ${exempleLocal} is a relevant example for ${chapitre.titre.toLowerCase()}.`,
                points: 3,
                correctAnswer: true,
                explanation: 'Justification with reference to Cameroon bilingual context.',
                difficulty: 'easy',
                order: 2
              },
              {
                id: 3,
                type: 'fill_blank',
                question: `Complete: ${chapitre.objectifs[1] || chapitre.objectifs[0]} requires to ________.`,
                correctAnswer: 'follow the rules',
                acceptableAnswers: ['apply the rule', 'use correct grammar'],
                caseSensitive: false,
                explanation: 'Explanation of the methodology to follow.',
                difficulty: 'medium',
                order: 3
              },
              {
                id: 4,
                type: 'multiple_choice',
                question: `Which Anglophone African author won the Nobel Prize for Literature?`,
                points: 3,
                options: [
                  { id: 'a', text: 'Wole Soyinka', isCorrect: true },
                  { id: 'b', text: 'Chinua Achebe', isCorrect: false },
                  { id: 'c', text: 'Bate Besong', isCorrect: false },
                  { id: 'd', text: 'Ngũgĩ wa Thiong\'o', isCorrect: false }
                ],
                explanation: 'Wole Soyinka (Nigeria) won the Nobel Prize for Literature in 1986, the first African to receive this honor.',
                difficulty: 'easy',
                order: 4
              },
              {
                id: 5,
                type: 'short_answer',
                question: `Give an example of how ${chapitre.objectifs[0].toLowerCase()} is used in Cameroon's bilingual context.`,
                points: 6,
                sampleAnswer: `Example of application in Cameroon bilingual context, with reference to Anglophone regions, education system, or daily communication.`,
                gradingCriteria: [
                  'Relevance of example (2 pts)',
                  'Link to Cameroon context (2 pts)',
                  'Correct application of rule (2 pts)'
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
              description: `Lesson ${numeroLecon} of chapter ${chapitre.num}: ${chapitre.titre}`,
              subjectId: subject.id,
              chapterId: chapter.id,
              order: (chapitre.num - 1) * 3 + numeroLecon,
              type: typeLecon,
              difficulty: difficultes[i],
              estimatedDuration: 45,
              content: lessonContent,
              objectives: chapitre.objectifs.slice(0, 2),
              prerequisites: numeroLecon > 1 ? [`Lesson ${numeroLecon - 1}`] : [],
              hasQuiz: hasQuiz,
              quiz: quiz,
              isActive: true,
              isPremium: false,
              isFree: isFree,
              cameroonContext: {
                localExamples: exemplesCameroun.slice(0, 6),
                culturalReferences: ['Anglophone Cameroon literature', 'Bilingualism in Cameroon', 'Commonwealth heritage'],
                localLanguageTerms: { 'Pidgin': 'Cameroon Pidgin English' }
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
                tags: ['english', 'anglais', niveau.toLowerCase(), `chapter-${chapitre.num}`, 'cameroon', 'languages', 'grammar'],
                searchKeywords: [chapitre.titre.toLowerCase(), 'english', 'grammar', 'literature', niveau.toLowerCase()],
                language: 'en',
                version: '1.0',
                authorNotes: `Auto-generated - MINESEC English Program ${niveau}`
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
    const countSubjects = await Subject.count({ where: { title: { [database.sequelize.Sequelize.Op.like]: 'Anglais%' } } });
    const countChapters = await database.sequelize.query(
      `SELECT COUNT(*) as count FROM chapters WHERE "subjectId" IN (SELECT id FROM subjects WHERE title LIKE 'Anglais%')`,
      { type: database.sequelize.QueryTypes.SELECT }
    );
    const countLessons = await Lesson.count({
      where: {
        subjectId: {
          [database.sequelize.Sequelize.Op.in]: database.sequelize.literal(`(SELECT id FROM subjects WHERE title LIKE 'Anglais%')`)
        }
      }
    });
    const countQuizzes = await Lesson.count({
      where: {
        hasQuiz: true,
        subjectId: {
          [database.sequelize.Sequelize.Op.in]: database.sequelize.literal(`(SELECT id FROM subjects WHERE title LIKE 'Anglais%')`)
        }
      }
    });
    const countFree = await Lesson.count({
      where: {
        isFree: true,
        subjectId: {
          [database.sequelize.Sequelize.Op.in]: database.sequelize.literal(`(SELECT id FROM subjects WHERE title LIKE 'Anglais%')`)
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

    await genererContenuAnglais(models);

    console.log('\n✅ Script terminé avec succès');
    await database.sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    await database.sequelize.close();
    process.exit(1);
  }
})();
