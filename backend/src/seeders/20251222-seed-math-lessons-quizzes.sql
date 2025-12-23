/**
 * Seed: Leçons et Quiz Mathématiques Terminale C/D
 * Date: 2025-12-22
 * Matière: EE (Mathématiques Terminale)
 * Chapitre: 1 - Fonctions numériques
 */

-- ========================================
-- VÉRIFICATIONS PRÉALABLES
-- ========================================

DO $$
BEGIN
  -- Vérifier que la matière existe
  IF NOT EXISTS (SELECT 1 FROM subjects WHERE id = 'e8f26aca-932b-4f5c-b0c1-add81ecd09ca') THEN
    RAISE EXCEPTION 'Matière EE (Mathématiques Tle) non trouvée';
  END IF;

  -- Vérifier que le chapitre existe
  IF NOT EXISTS (SELECT 1 FROM chapters WHERE id = 1) THEN
    RAISE EXCEPTION 'Chapitre 1 (Fonctions numériques) non trouvé';
  END IF;

  RAISE NOTICE '✅ Vérifications OK: Matière EE et Chapitre 1 trouvés';
END $$;

-- ========================================
-- LEÇON 1: Introduction aux Fonctions (Reading)
-- ========================================

INSERT INTO lessons (
  "subjectId",
  "chapterId",
  title,
  description,
  type,
  content,
  "estimatedDuration",
  difficulty,
  objectives,
  prerequisites,
  "hasQuiz",
  "order",
  "reviewStatus",
  "isActive",
  "isPremium",
  "createdAt",
  "updatedAt"
) VALUES (
  'e8f26aca-932b-4f5c-b0c1-add81ecd09ca',  -- Maths Tle
  1,  -- Chapitre Fonctions numériques
  'Introduction aux fonctions numériques',
  'Découvrez les concepts fondamentaux des fonctions: définition, notation et représentation graphique',
  'reading',
  '{
    "transcript": "# Introduction aux Fonctions Numériques\n\n## Définition\n\nUne fonction numérique est une relation mathématique qui associe à chaque élément x d''un ensemble de départ D (domaine de définition) un unique élément y d''un ensemble d''arrivée.\n\nOn note: f: D → ℝ\n         x ↦ f(x)\n\n## Notations importantes\n\n• f(x) se lit \"f de x\" ou \"image de x par f\"\n• x est la variable (ou antécédent)\n• f(x) est l''image de x\n• D est le domaine de définition de f\n\n## Exemples de fonctions\n\n### Fonction affine\nf(x) = 2x + 3\n• Domaine: D = ℝ (tous les réels)\n• Exemple: f(1) = 2(1) + 3 = 5\n\n### Fonction carré\nf(x) = x²\n• Domaine: D = ℝ\n• Exemple: f(-3) = (-3)² = 9\n\n### Fonction inverse\nf(x) = 1/x\n• Domaine: D = ℝ* (tous les réels sauf 0)\n• Exemple: f(2) = 1/2 = 0,5\n• ATTENTION: f(0) n''existe pas!\n\n## Représentation graphique\n\nLa courbe représentative d''une fonction f est l''ensemble des points M(x, f(x)) dans un repère orthonormé.\n\n### Propriétés de la courbe\n• Chaque verticale coupe la courbe en AU PLUS un point\n• Si la verticale ne coupe pas, x n''est pas dans D\n• Si la verticale coupe en plusieurs points, ce n''est PAS une fonction\n\n## Applications pratiques\n\nLes fonctions modélisent de nombreux phénomènes:\n• Distance = f(temps) pour un mouvement\n• Prix = f(quantité) en économie\n• Population = f(année) en démographie\n• Température = f(altitude) en météorologie\n\n## Points clés à retenir\n\n1. Une fonction associe UNE SEULE image à chaque antécédent\n2. Le domaine de définition contient tous les x pour lesquels f(x) existe\n3. La représentation graphique aide à visualiser le comportement de la fonction\n4. Certaines valeurs peuvent être interdites (division par 0, racine négative...)",
    "keyPoints": [
      "Une fonction associe à chaque x un unique f(x)",
      "Le domaine D contient toutes les valeurs de x où f(x) existe",
      "Notation: f: D → ℝ, x ↦ f(x)",
      "La courbe ne peut être coupée qu''une fois par chaque verticale",
      "Attention aux valeurs interdites (division par 0, racine négative)"
    ],
    "exercises": [
      "Déterminer si g(x) = √(x-2) est définie pour x = 1. Justifier.",
      "Pour f(x) = 3x - 5, calculer f(0), f(2) et f(-1).",
      "Tracer la courbe de h(x) = x² - 4 pour x ∈ [-3, 3].",
      "Expliquer pourquoi k(x) = 1/(x+3) n''est pas définie en x = -3."
    ],
    "resources": [
      "Vidéo: Qu''est-ce qu''une fonction? (Khan Academy)",
      "PDF: Fiche mémo Fonctions numériques",
      "Exercices interactifs sur GeoGebra"
    ],
    "videoUrl": null,
    "downloadableFiles": []
  }'::jsonb,
  45,  -- 45 minutes
  'Débutant',
  ARRAY[
    'Comprendre la définition d''une fonction',
    'Maîtriser les notations mathématiques',
    'Identifier le domaine de définition',
    'Représenter graphiquement une fonction simple'
  ],
  ARRAY[
    'Opérations sur les nombres réels',
    'Lecture de graphiques',
    'Équations du premier degré'
  ],
  true,  -- A un quiz
  1,  -- Ordre 1
  'approved',
  true,
  false,
  NOW(),
  NOW()
);

-- ========================================
-- LEÇON 2: Domaine de Définition (Video)
-- ========================================

INSERT INTO lessons (
  "subjectId",
  "chapterId",
  title,
  description,
  type,
  content,
  "estimatedDuration",
  difficulty,
  objectives,
  prerequisites,
  "hasQuiz",
  "order",
  "reviewStatus",
  "isActive",
  "isPremium",
  "createdAt",
  "updatedAt"
) VALUES (
  'e8f26aca-932b-4f5c-b0c1-add81ecd09ca',
  1,
  'Déterminer le domaine de définition',
  'Apprenez à trouver l''ensemble de définition d''une fonction en évitant les pièges classiques',
  'video',
  '{
    "videoUrl": "https://www.youtube.com/watch?v=example_domaine_definition",
    "transcript": "# Domaine de Définition - Méthode Complète\n\n## Introduction\n\nBonjour à tous! Aujourd''hui nous allons voir comment déterminer le domaine de définition d''une fonction. C''est une compétence ESSENTIELLE en Terminale.\n\n## Règles de base\n\n### Règle 1: Fraction\nPour f(x) = 1/u(x), on doit avoir u(x) ≠ 0\n\nExemple: f(x) = 1/(x-3)\n→ Domaine: D = ℝ \\ {3} (tous les réels sauf 3)\n\n### Règle 2: Racine carrée\nPour f(x) = √u(x), on doit avoir u(x) ≥ 0\n\nExemple: f(x) = √(2x + 6)\n→ 2x + 6 ≥ 0\n→ 2x ≥ -6\n→ x ≥ -3\n→ Domaine: D = [-3, +∞[\n\n### Règle 3: Logarithme\nPour f(x) = ln(u(x)), on doit avoir u(x) > 0 (strictement positif)\n\nExemple: f(x) = ln(x² - 1)\n→ x² - 1 > 0\n→ x² > 1\n→ x < -1 ou x > 1\n→ Domaine: D = ]-∞, -1[ ∪ ]1, +∞[\n\n## Méthode pas à pas\n\n1. Identifier les opérations dans f(x)\n2. Lister les conditions pour chaque opération\n3. Résoudre les inéquations\n4. Faire l''intersection des conditions\n5. Écrire D en notation d''intervalle\n\n## Exemple complet\n\nTrouvons le domaine de: f(x) = √(x+1) / (x-2)\n\nCondition 1 (racine): x + 1 ≥ 0 → x ≥ -1\nCondition 2 (fraction): x - 2 ≠ 0 → x ≠ 2\n\nIntersection: x ≥ -1 ET x ≠ 2\n\nDomaine final: D = [-1, 2[ ∪ ]2, +∞[\n\n## Pièges à éviter\n\n⚠️ Ne pas confondre ≥ et >\n⚠️ Bien faire l''intersection (ET) et non l''union (OU)\n⚠️ Vérifier les cas particuliers (0, valeurs négatives...)\n\n## Conclusion\n\nLe domaine de définition est la PREMIÈRE chose à déterminer avant d''étudier une fonction. Prenez le temps de bien poser toutes les conditions!",
    "keyPoints": [
      "Fraction: dénominateur ≠ 0",
      "Racine carrée: expression ≥ 0",
      "Logarithme: argument > 0 (strictement)",
      "Faire l''INTERSECTION de toutes les conditions",
      "Notation d''intervalle: [-1, 2[ signifie -1 ≤ x < 2"
    ],
    "exercises": [
      "Déterminer D pour f(x) = √(x-5)",
      "Déterminer D pour g(x) = 1/(x²-9)",
      "Déterminer D pour h(x) = √(4-x) / (x+2)",
      "Déterminer D pour k(x) = ln(3x-6)"
    ],
    "resources": [
      "PDF: Tableau récapitulatif des règles",
      "Exercices corrigés (20 exemples)",
      "Simulateur GeoGebra"
    ],
    "downloadableFiles": [
      "domaine_definition_regles.pdf",
      "exercices_corriges_domaine.pdf"
    ]
  }'::jsonb,
  60,  -- 60 minutes
  'Intermédiaire',
  ARRAY[
    'Identifier les contraintes d''une fonction',
    'Résoudre les inéquations de définition',
    'Écrire le domaine en notation d''intervalle',
    'Gérer les cas complexes (combinaisons de contraintes)'
  ],
  ARRAY[
    'Résolution d''inéquations',
    'Factorisation',
    'Intervalles et notation'
  ],
  true,
  2,
  'approved',
  true,
  false,
  NOW(),
  NOW()
);

-- ========================================
-- LEÇON 3: Limites et Continuité (Interactive)
-- ========================================

INSERT INTO lessons (
  "subjectId",
  "chapterId",
  title,
  description,
  type,
  content,
  "estimatedDuration",
  difficulty,
  objectives,
  prerequisites,
  "hasQuiz",
  "order",
  "reviewStatus",
  "isActive",
  "isPremium",
  "createdAt",
  "updatedAt"
) VALUES (
  'e8f26aca-932b-4f5c-b0c1-add81ecd09ca',
  1,
  'Calcul de limites et continuité',
  'Exercices interactifs progressifs pour maîtriser les limites et la continuité des fonctions',
  'interactive',
  '{
    "transcript": "# Limites et Continuité - Exercices Interactifs\n\n## Partie 1: Limites simples\n\n### Exercice 1 (Débutant)\nCalculer: lim(x→2) (3x + 5)\n\nMéthode: On remplace directement x par 2\nRéponse: 3(2) + 5 = 11\n\n### Exercice 2 (Débutant)\nCalculer: lim(x→0) (x² + 2x - 1)\n\nMéthode: Remplacement direct\nRéponse: 0² + 2(0) - 1 = -1\n\n## Partie 2: Formes indéterminées\n\n### Exercice 3 (Intermédiaire)\nCalculer: lim(x→1) (x²-1)/(x-1)\n\nForme indéterminée: 0/0\nFactorisation: (x-1)(x+1)/(x-1)\nSimplification: x+1\nRéponse: 1+1 = 2\n\n### Exercice 4 (Intermédiaire)\nCalculer: lim(x→+∞) (2x³ - x)/(x³ + 5)\n\nForme: ∞/∞\nOn divise par le terme dominant x³:\n= lim(x→+∞) (2 - 1/x²)/(1 + 5/x³)\n= 2/1 = 2\n\n## Partie 3: Limites à l''infini\n\n### Exercice 5 (Avancé)\nCalculer: lim(x→+∞) √(x² + x) - x\n\nForme: ∞ - ∞\nExpression conjuguée:\n= lim(x→+∞) [(x² + x) - x²] / [√(x² + x) + x]\n= lim(x→+∞) x / [√(x² + x) + x]\n= lim(x→+∞) 1 / [√(1 + 1/x) + 1]\n= 1/(1+1) = 1/2\n\n## Partie 4: Continuité\n\n### Définition\nf est continue en a si:\n1. f(a) existe\n2. lim(x→a) f(x) existe\n3. lim(x→a) f(x) = f(a)\n\n### Exercice 6 (Avancé)\nÉtudier la continuité de:\nf(x) = { (x²-4)/(x-2)  si x ≠ 2\n       { 4             si x = 2\n\nPour x ≠ 2: f(x) = (x-2)(x+2)/(x-2) = x+2 (continue)\nEn x = 2: lim(x→2) f(x) = 2+2 = 4 = f(2)\n\nConclusion: f est continue en 2 et sur ℝ\n\n## Conseils pratiques\n\n1. Toujours vérifier si on peut remplacer directement\n2. Si forme indéterminée, factoriser ou simplifier\n3. Pour ∞-∞, utiliser l''expression conjuguée\n4. Pour ∞/∞, diviser par le terme dominant\n5. Vérifier les 3 conditions de continuité",
    "keyPoints": [
      "Limite directe: remplacer x par la valeur",
      "Forme 0/0: factoriser et simplifier",
      "Forme ∞/∞: diviser par le terme dominant",
      "Forme ∞-∞: expression conjuguée",
      "Continuité = 3 conditions à vérifier"
    ],
    "exercises": [
      "Calculer lim(x→3) (x²-9)/(x-3) - Niveau: Intermédiaire",
      "Calculer lim(x→+∞) (5x²-2x+1)/(2x²+x) - Niveau: Intermédiaire",
      "Calculer lim(x→+∞) (√(4x²+x) - 2x) - Niveau: Avancé",
      "Étudier la continuité de f(x)={x²+1 si x<0, 2x+1 si x≥0} - Niveau: Expert",
      "Déterminer a pour que f(x)={(x²-a²)/(x-a) si x≠a, 10 si x=a} soit continue - Niveau: Expert"
    ],
    "resources": [
      "Tableau des formes indéterminées",
      "Simulateur de limites interactif",
      "100 exercices corrigés progressifs",
      "Fiche méthode: Expression conjuguée"
    ],
    "videoUrl": null,
    "downloadableFiles": [
      "limites_formes_indeterminees.pdf",
      "exercices_limites_corriges.pdf"
    ]
  }'::jsonb,
  90,  -- 90 minutes
  'Avancé',
  ARRAY[
    'Calculer des limites simples et complexes',
    'Gérer les formes indéterminées',
    'Utiliser les techniques de factorisation et simplification',
    'Vérifier la continuité d''une fonction'
  ],
  ARRAY[
    'Domaine de définition',
    'Factorisation avancée',
    'Identités remarquables',
    'Opérations sur les limites'
  ],
  true,
  3,
  'approved',
  true,
  false,
  NOW(),
  NOW()
);

-- ========================================
-- QUIZ 1: Introduction aux Fonctions
-- ========================================

-- Récupérer l'ID de la leçon 1
DO $$
DECLARE
  lesson1_id INTEGER;
BEGIN
  SELECT id INTO lesson1_id FROM lessons
  WHERE "chapterId" = 1 AND "order" = 1
  ORDER BY "createdAt" DESC LIMIT 1;

  -- Créer le quiz
  INSERT INTO quizzes (
    "lessonId",
    title,
    description,
    difficulty,
    "timeLimit",
    "passingScore",
    "isActive",
    "createdAt",
    "updatedAt"
  ) VALUES (
    lesson1_id,
    'Quiz: Introduction aux fonctions',
    'Testez vos connaissances sur les concepts de base des fonctions numériques',
    'Débutant',
    600,  -- 10 minutes
    70,  -- 70% pour réussir
    true,
    NOW(),
    NOW()
  );

  RAISE NOTICE '✅ Quiz 1 créé pour leçon %', lesson1_id;
END $$;

-- Questions du Quiz 1
DO $$
DECLARE
  quiz1_id INTEGER;
BEGIN
  SELECT id INTO quiz1_id FROM quizzes
  WHERE title = 'Quiz: Introduction aux fonctions'
  ORDER BY "createdAt" DESC LIMIT 1;

  -- Question 1: QCM Simple
  INSERT INTO quiz_questions (
    "quizId",
    question,
    type,
    options,
    "correctAnswer",
    explanation,
    points,
    "order",
    "createdAt",
    "updatedAt"
  ) VALUES (
    quiz1_id,
    'Quelle est la définition correcte d''une fonction?',
    'multiple_choice',
    ARRAY[
      'Une relation qui associe plusieurs images à chaque antécédent',
      'Une relation qui associe une unique image à chaque antécédent',
      'Une courbe quelconque dans un repère',
      'Un ensemble de points aléatoires'
    ],
    '1',  -- Index de la bonne réponse (commence à 0)
    'Par définition, une fonction associe à chaque élément x du domaine UNE SEULE image f(x). C''est la condition d''unicité.',
    10,
    1,
    NOW(),
    NOW()
  );

  -- Question 2: QCM avec calcul
  INSERT INTO quiz_questions (
    "quizId",
    question,
    type,
    options,
    "correctAnswer",
    explanation,
    points,
    "order",
    "createdAt",
    "updatedAt"
  ) VALUES (
    quiz1_id,
    'Pour f(x) = 2x + 5, quelle est la valeur de f(3)?',
    'multiple_choice',
    ARRAY['8', '11', '9', '13'],
    '1',
    'f(3) = 2(3) + 5 = 6 + 5 = 11',
    10,
    2,
    NOW(),
    NOW()
  );

  -- Question 3: Vrai/Faux
  INSERT INTO quiz_questions (
    "quizId",
    question,
    type,
    options,
    "correctAnswer",
    explanation,
    points,
    "order",
    "createdAt",
    "updatedAt"
  ) VALUES (
    quiz1_id,
    'La fonction f(x) = 1/x est définie pour x = 0',
    'true_false',
    ARRAY['Vrai', 'Faux'],
    '1',
    'FAUX. On ne peut pas diviser par 0. Le domaine de f(x) = 1/x est D = ℝ* (tous les réels sauf 0).',
    10,
    3,
    NOW(),
    NOW()
  );

  -- Question 4: Application
  INSERT INTO quiz_questions (
    "quizId",
    question,
    type,
    options,
    "correctAnswer",
    explanation,
    points,
    "order",
    "createdAt",
    "updatedAt"
  ) VALUES (
    quiz1_id,
    'Combien de fois une droite verticale peut-elle couper la courbe représentative d''une fonction?',
    'multiple_choice',
    ARRAY['0 ou 1 fois', '1 fois exactement', '0, 1 ou plusieurs fois', 'Au moins 2 fois'],
    '0',
    'Une droite verticale coupe la courbe AU PLUS une fois. Si elle ne coupe pas, x n''est pas dans le domaine. Si elle coupe plusieurs fois, ce n''est pas une fonction.',
    10,
    4,
    NOW(),
    NOW()
  );

  -- Question 5: Domaine
  INSERT INTO quiz_questions (
    "quizId",
    question,
    type,
    options,
    "correctAnswer",
    explanation,
    points,
    "order",
    "createdAt",
    "updatedAt"
  ) VALUES (
    quiz1_id,
    'Quel est le domaine de définition de f(x) = x² + 3?',
    'multiple_choice',
    ARRAY['ℝ (tous les réels)', 'ℝ* (réels non nuls)', 'ℝ+ (réels positifs)', '[3, +∞['],
    '0',
    'La fonction f(x) = x² + 3 est un polynôme. Les polynômes sont toujours définis sur ℝ (tous les réels).',
    10,
    5,
    NOW(),
    NOW()
  );

  RAISE NOTICE '✅ 5 questions créées pour Quiz 1';
END $$;

-- ========================================
-- QUIZ 2: Domaine de Définition
-- ========================================

DO $$
DECLARE
  lesson2_id INTEGER;
  quiz2_id INTEGER;
BEGIN
  -- Récupérer l'ID de la leçon 2
  SELECT id INTO lesson2_id FROM lessons
  WHERE "chapterId" = 1 AND "order" = 2
  ORDER BY "createdAt" DESC LIMIT 1;

  -- Créer le quiz
  INSERT INTO quizzes (
    "lessonId",
    title,
    description,
    difficulty,
    "timeLimit",
    "passingScore",
    "isActive",
    "createdAt",
    "updatedAt"
  ) VALUES (
    lesson2_id,
    'Quiz: Domaine de définition',
    'Maîtrisez la détermination du domaine de définition pour différents types de fonctions',
    'Intermédiaire',
    900,  -- 15 minutes
    75,  -- 75% pour réussir
    true,
    NOW(),
    NOW()
  ) RETURNING id INTO quiz2_id;

  -- Question 1
  INSERT INTO quiz_questions (
    "quizId",
    question,
    type,
    options,
    "correctAnswer",
    explanation,
    points,
    "order",
    "createdAt",
    "updatedAt"
  ) VALUES (
    quiz2_id,
    'Quel est le domaine de définition de f(x) = √(x-3)?',
    'multiple_choice',
    ARRAY[']-∞, 3]', '[3, +∞[', 'ℝ', ']-∞, 3[ ∪ ]3, +∞['],
    '1',
    'Pour une racine carrée, l''expression sous la racine doit être ≥ 0. Donc x-3 ≥ 0, soit x ≥ 3, d''où D = [3, +∞[',
    15,
    1,
    NOW(),
    NOW()
  );

  -- Question 2
  INSERT INTO quiz_questions (
    "quizId",
    question,
    type,
    options,
    "correctAnswer",
    explanation,
    points,
    "order",
    "createdAt",
    "updatedAt"
  ) VALUES (
    quiz2_id,
    'Pour f(x) = 1/(x²-4), quelles valeurs sont interdites?',
    'multiple_choice',
    ARRAY['x = 4', 'x = -2 et x = 2', 'x = 2', 'Aucune valeur'],
    '1',
    'Le dénominateur ne doit pas être nul. x²-4 = 0 ⇔ (x-2)(x+2) = 0 ⇔ x = 2 ou x = -2. Donc D = ℝ \ {-2, 2}',
    15,
    2,
    NOW(),
    NOW()
  );

  -- Question 3
  INSERT INTO quiz_questions (
    "quizId",
    question,
    type,
    options,
    "correctAnswer",
    explanation,
    points,
    "order",
    "createdAt",
    "updatedAt"
  ) VALUES (
    quiz2_id,
    'Quelle condition faut-il pour que ln(u(x)) soit défini?',
    'multiple_choice',
    ARRAY['u(x) ≥ 0', 'u(x) > 0', 'u(x) ≠ 0', 'u(x) < 0'],
    '1',
    'Le logarithme népérien nécessite un argument STRICTEMENT positif: u(x) > 0 (et pas seulement ≥ 0).',
    15,
    3,
    NOW(),
    NOW()
  );

  -- Question 4
  INSERT INTO quiz_questions (
    "quizId",
    question,
    type,
    options,
    "correctAnswer",
    explanation,
    points,
    "order",
    "createdAt",
    "updatedAt"
  ) VALUES (
    quiz2_id,
    'Domaine de f(x) = √(x+1)/(x-2)?',
    'multiple_choice',
    ARRAY['[-1, +∞[', '[-1, 2[ ∪ ]2, +∞[', ']-∞, -1] ∪ ]2, +∞[', '[2, +∞['],
    '1',
    'Conditions: 1) x+1 ≥ 0 ⇒ x ≥ -1, ET 2) x-2 ≠ 0 ⇒ x ≠ 2. Intersection: D = [-1, 2[ ∪ ]2, +∞[',
    20,
    4,
    NOW(),
    NOW()
  );

  RAISE NOTICE '✅ Quiz 2 créé avec 4 questions';
END $$;

-- ========================================
-- QUIZ 3: Limites (Niveau Avancé)
-- ========================================

DO $$
DECLARE
  lesson3_id INTEGER;
  quiz3_id INTEGER;
BEGIN
  SELECT id INTO lesson3_id FROM lessons
  WHERE "chapterId" = 1 AND "order" = 3
  ORDER BY "createdAt" DESC LIMIT 1;

  INSERT INTO quizzes (
    "lessonId",
    title,
    description,
    difficulty,
    "timeLimit",
    "passingScore",
    "isActive",
    "createdAt",
    "updatedAt"
  ) VALUES (
    lesson3_id,
    'Quiz: Calcul de limites',
    'Exercices sur les limites et formes indéterminées - Niveau Avancé',
    'Avancé',
    1200,  -- 20 minutes
    80,  -- 80% pour réussir
    true,
    NOW(),
    NOW()
  ) RETURNING id INTO quiz3_id;

  -- Question 1: Limite simple
  INSERT INTO quiz_questions (
    "quizId",
    question,
    type,
    options,
    "correctAnswer",
    explanation,
    points,
    "order",
    "createdAt",
    "updatedAt"
  ) VALUES (
    quiz3_id,
    'Calculer: lim(x→2) (x² + 3x - 1)',
    'multiple_choice',
    ARRAY['9', '8', '7', '10'],
    '0',
    'Remplacement direct: 2² + 3(2) - 1 = 4 + 6 - 1 = 9',
    10,
    1,
    NOW(),
    NOW()
  );

  -- Question 2: Forme indéterminée 0/0
  INSERT INTO quiz_questions (
    "quizId",
    question,
    type,
    options,
    "correctAnswer",
    explanation,
    points,
    "order",
    "createdAt",
    "updatedAt"
  ) VALUES (
    quiz3_id,
    'Calculer: lim(x→3) (x²-9)/(x-3)',
    'multiple_choice',
    ARRAY['0', '3', '6', 'Limite infinie'],
    '2',
    'Forme 0/0. Factorisation: (x-3)(x+3)/(x-3) = x+3. Donc lim = 3+3 = 6',
    20,
    2,
    NOW(),
    NOW()
  );

  -- Question 3: Limite à l'infini
  INSERT INTO quiz_questions (
    "quizId",
    question,
    type,
    options,
    "correctAnswer",
    explanation,
    points,
    "order",
    "createdAt",
    "updatedAt"
  ) VALUES (
    quiz3_id,
    'Calculer: lim(x→+∞) (3x² - 5x)/(x² + 1)',
    'multiple_choice',
    ARRAY['0', '1', '3', '+∞'],
    '2',
    'Forme ∞/∞. On divise par x²: (3 - 5/x)/(1 + 1/x²) → 3/1 = 3',
    20,
    3,
    NOW(),
    NOW()
  );

  -- Question 4: Continuité
  INSERT INTO quiz_questions (
    "quizId",
    question,
    type,
    options,
    "correctAnswer",
    explanation,
    points,
    "order",
    "createdAt",
    "updatedAt"
  ) VALUES (
    quiz3_id,
    'Une fonction f est continue en a si:',
    'multiple_choice',
    ARRAY[
      'f(a) existe seulement',
      'lim(x→a) f(x) existe seulement',
      'f(a) existe, lim(x→a) f(x) existe et lim(x→a) f(x) = f(a)',
      'f est dérivable en a'
    ],
    '2',
    'Les 3 conditions sont nécessaires: existence de f(a), existence de la limite, et égalité limite = f(a).',
    15,
    4,
    NOW(),
    NOW()
  );

  -- Question 5: Application avancée
  INSERT INTO quiz_questions (
    "quizId",
    question,
    type,
    options,
    "correctAnswer",
    explanation,
    points,
    "order",
    "createdAt",
    "updatedAt"
  ) VALUES (
    quiz3_id,
    'Pour quelle valeur de a la fonction f(x) = {(x²-a²)/(x-a) si x≠a, 10 si x=a} est continue en a?',
    'multiple_choice',
    ARRAY['a = 0', 'a = 5', 'a = 10', 'Impossible'],
    '1',
    'lim(x→a) f(x) = lim(x→a) (x-a)(x+a)/(x-a) = 2a. Pour continuité: 2a = f(a) = 10, donc a = 5.',
    25,
    5,
    NOW(),
    NOW()
  );

  RAISE NOTICE '✅ Quiz 3 créé avec 5 questions';
END $$;

-- ========================================
-- STATISTIQUES FINALES
-- ========================================

SELECT
  '=== RÉCAPITULATIF ===' as info;

SELECT
  'Leçons créées' as type,
  COUNT(*) as total,
  COUNT(CASE WHEN type = 'reading' THEN 1 END) as reading,
  COUNT(CASE WHEN type = 'video' THEN 1 END) as video,
  COUNT(CASE WHEN type = 'interactive' THEN 1 END) as interactive
FROM lessons
WHERE "chapterId" = 1;

SELECT
  'Quiz créés' as type,
  COUNT(*) as total,
  SUM((SELECT COUNT(*) FROM quiz_questions WHERE "quizId" = quizzes.id)) as total_questions
FROM quizzes
WHERE "lessonId" IN (SELECT id FROM lessons WHERE "chapterId" = 1);

SELECT
  l.title as leçon,
  l.type,
  l.difficulty as difficulté,
  l."estimatedDuration" as durée_min,
  COUNT(qq.id) as nb_questions_quiz
FROM lessons l
LEFT JOIN quizzes q ON q."lessonId" = l.id
LEFT JOIN quiz_questions qq ON qq."quizId" = q.id
WHERE l."chapterId" = 1
GROUP BY l.id, l.title, l.type, l.difficulty, l."estimatedDuration"
ORDER BY l."order";

-- ========================================
-- FIN DU SEED
-- ========================================

/**
 * ✅ Ce seed a créé:
 * - 3 leçons pour le chapitre "Fonctions numériques"
 * - 3 quiz correspondants
 * - 14 questions au total
 * - Contenu riche: transcript, keyPoints, exercises, resources
 * - Niveaux variés: Débutant, Intermédiaire, Avancé
 * - Types variés: reading, video, interactive
 */
