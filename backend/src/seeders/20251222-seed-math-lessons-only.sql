/**
 * Seed: Leçons Mathématiques Terminale C/D (Sans Quiz)
 * Date: 2025-12-22
 * Matière: EE (Mathématiques Terminale)
 * Chapitre: 1 - Fonctions numériques
 */

-- ========================================
-- VÉRIFICATIONS PRÉALABLES
-- ========================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM subjects WHERE id = 'e8f26aca-932b-4f5c-b0c1-add81ecd09ca') THEN
    RAISE EXCEPTION 'Matière EE non trouvée';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM chapters WHERE id = 1) THEN
    RAISE EXCEPTION 'Chapitre 1 non trouvé';
  END IF;

  RAISE NOTICE '✅ Vérifications OK';
END $$;

-- ========================================
-- LEÇON 1: Introduction aux Fonctions
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
  "hasQuiz",
  "order",
  "reviewStatus",
  "isActive",
  "isPremium"
) VALUES (
  'e8f26aca-932b-4f5c-b0c1-add81ecd09ca',
  1,
  'Introduction aux fonctions numériques',
  'Découvrez les concepts fondamentaux des fonctions',
  'reading',
  '{"transcript": "# Introduction aux Fonctions\n\nUne fonction numérique associe à chaque x un unique f(x).\n\n## Définition\nf: D → ℝ, x ↦ f(x)\n\n## Exemples\n- f(x) = 2x + 3 (fonction affine)\n- f(x) = x² (fonction carré)\n- f(x) = 1/x (fonction inverse, D = ℝ*)\n\n## Points clés\n1. Unicité de l''image\n2. Domaine de définition D\n3. Représentation graphique", "keyPoints": ["Une fonction associe à chaque x un unique f(x)", "Le domaine D contient toutes les valeurs où f(x) existe", "La courbe est coupée au plus une fois par chaque verticale"], "exercises": ["Calculer f(2) pour f(x) = 3x - 5", "Tracer la courbe de h(x) = x² - 4", "Expliquer pourquoi k(x) = 1/(x+3) n''est pas définie en x = -3"], "resources": ["Vidéo Khan Academy: Qu''est-ce qu''une fonction?", "PDF: Fiche mémo Fonctions"], "videoUrl": null, "downloadableFiles": []}',
  45,
  'Débutant',
  ARRAY['Comprendre la définition d''une fonction', 'Maîtriser les notations', 'Identifier le domaine'],
  false,
  1,
  'approved',
  true,
  false
);

-- ========================================
-- LEÇON 2: Domaine de Définition
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
  "hasQuiz",
  "order",
  "reviewStatus",
  "isActive",
  "isPremium"
) VALUES (
  'e8f26aca-932b-4f5c-b0c1-add81ecd09ca',
  1,
  'Déterminer le domaine de définition',
  'Méthode complète pour trouver le domaine de définition',
  'video',
  '{"videoUrl": "https://www.youtube.com/watch?v=example", "transcript": "# Domaine de Définition\n\n## Règles\n\n### Règle 1: Fraction\nf(x) = 1/u(x) → u(x) ≠ 0\n\nExemple: f(x) = 1/(x-3)\nD = ℝ \\ {3}\n\n### Règle 2: Racine\nf(x) = √u(x) → u(x) ≥ 0\n\nExemple: f(x) = √(2x + 6)\n2x + 6 ≥ 0\nx ≥ -3\nD = [-3, +∞[\n\n### Règle 3: Logarithme\nf(x) = ln(u(x)) → u(x) > 0\n\n## Méthode\n1. Identifier les opérations\n2. Lister les conditions\n3. Résoudre les inéquations\n4. Faire l''intersection", "keyPoints": ["Fraction: dénominateur ≠ 0", "Racine: expression ≥ 0", "Logarithme: argument > 0", "Faire l''INTERSECTION des conditions"], "exercises": ["Déterminer D pour f(x) = √(x-5)", "Déterminer D pour g(x) = 1/(x²-9)", "Déterminer D pour h(x) = √(4-x)/(x+2)"], "resources": ["PDF: Tableau des règles", "Exercices corrigés"], "downloadableFiles": ["domaine_regles.pdf"]}',
  60,
  'Intermédiaire',
  ARRAY['Identifier les contraintes', 'Résoudre les inéquations', 'Écrire le domaine'],
  false,
  2,
  'approved',
  true,
  false
);

-- ========================================
-- LEÇON 3: Limites et Continuité
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
  "hasQuiz",
  "order",
  "reviewStatus",
  "isActive",
  "isPremium"
) VALUES (
  'e8f26aca-932b-4f5c-b0c1-add81ecd09ca',
  1,
  'Calcul de limites et continuité',
  'Exercices progressifs sur les limites',
  'interactive',
  '{"transcript": "# Limites - Exercices\n\n## Partie 1: Limites simples\n\nExercice 1: lim(x→2) (3x + 5)\nMéthode: Remplacement direct\nRéponse: 3(2) + 5 = 11\n\n## Partie 2: Formes indéterminées\n\nExercice 2: lim(x→1) (x²-1)/(x-1)\nForme 0/0\nFactorisation: (x-1)(x+1)/(x-1) = x+1\nRéponse: 2\n\nExercice 3: lim(x→+∞) (2x³)/(x³ + 5)\nForme ∞/∞\nDiviser par x³: 2/(1 + 5/x³) → 2\n\n## Partie 3: Continuité\n\nf continue en a si:\n1. f(a) existe\n2. lim(x→a) f(x) existe\n3. lim = f(a)", "keyPoints": ["Limite directe: remplacer x", "Forme 0/0: factoriser", "Forme ∞/∞: diviser par dominant", "Continuité = 3 conditions"], "exercises": ["Calculer lim(x→3) (x²-9)/(x-3)", "Calculer lim(x→+∞) (5x²)/(2x²+x)", "Étudier continuité de f(x)={x² si x<0, 2x si x≥0}"], "resources": ["Tableau formes indéterminées", "100 exercices corrigés"], "videoUrl": null, "downloadableFiles": ["limites_exercices.pdf"]}',
  90,
  'Avancé',
  ARRAY['Calculer des limites', 'Gérer les formes indéterminées', 'Vérifier la continuité'],
  false,
  3,
  'approved',
  true,
  false
);

-- ========================================
-- LEÇON 4: Dérivées - Définition
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
  "hasQuiz",
  "order",
  "reviewStatus",
  "isActive",
  "isPremium"
) VALUES (
  'e8f26aca-932b-4f5c-b0c1-add81ecd09ca',
  2,
  'Introduction aux dérivées',
  'Comprendre le concept de taux de variation et nombre dérivé',
  'reading',
  '{"transcript": "# Les Dérivées\n\n## Définition\n\nLe nombre dérivé de f en a est:\nf''(a) = lim(h→0) [f(a+h) - f(a)]/h\n\n## Interprétation\n\n### Géométrique\nf''(a) = pente de la tangente en a\n\n### Physique\nVitesse instantanée\n\n## Formules de base\n\n(x^n)'' = nx^(n-1)\n(1/x)'' = -1/x²\n(√x)'' = 1/(2√x)\n(e^x)'' = e^x\n(ln x)'' = 1/x\n\n## Règles de calcul\n\n(u+v)'' = u'' + v''\n(ku)'' = ku''\n(uv)'' = u''v + uv''\n(u/v)'' = (u''v - uv'')/v²", "keyPoints": ["Dérivée = pente de la tangente", "f''(a) = limite du taux d''accroissement", "Formules de base à connaître", "Règles: somme, produit, quotient"], "exercises": ["Calculer f''(x) pour f(x) = x³ + 2x", "Trouver f''(2) pour f(x) = 1/x", "Dériver g(x) = x²·e^x"], "resources": ["Tableau des dérivées", "Vidéo: Applications physiques"], "videoUrl": null, "downloadableFiles": []}',
  50,
  'Intermédiaire',
  ARRAY['Comprendre le concept de dérivée', 'Calculer des dérivées simples', 'Appliquer les formules'],
  false,
  1,
  'approved',
  true,
  false
);

-- ========================================
-- LEÇON 5: Primitives
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
  "hasQuiz",
  "order",
  "reviewStatus",
  "isActive",
  "isPremium"
) VALUES (
  'e8f26aca-932b-4f5c-b0c1-add81ecd09ca',
  3,
  'Calcul de primitives',
  'Maîtriser les techniques de primitivation',
  'interactive',
  '{"transcript": "# Primitives\n\n## Définition\n\nF est une primitive de f si F'' = f\n\n## Primitives usuelles\n\nx^n → x^(n+1)/(n+1) + C\n1/x → ln|x| + C\ne^x → e^x + C\n\n## Techniques\n\n### Linéarité\n∫(u+v) = ∫u + ∫v\n∫ku = k∫u\n\n### Par parties\n∫u''v = uv - ∫uv''\n\n### Changement de variable\n∫f(u(x))u''(x)dx = F(u(x)) + C", "keyPoints": ["Primitive = fonction dont la dérivée est f", "Constante d''intégration C", "Linéarité de l''intégrale", "Techniques: parties, changement var"], "exercises": ["Calculer ∫(3x²+2x)dx", "Calculer ∫x·e^x dx", "Calculer ∫1/(2x+1) dx"], "resources": ["Tableau primitives", "Exercices par parties"], "videoUrl": null, "downloadableFiles": []}',
  75,
  'Avancé',
  ARRAY['Calculer des primitives', 'Utiliser les techniques', 'Résoudre des intégrales'],
  false,
  1,
  'approved',
  true,
  false
);

-- ========================================
-- STATISTIQUES
-- ========================================

SELECT
  '=== LEÇONS CRÉÉES ===' as info;

SELECT
  c.title as chapitre,
  COUNT(l.id) as nb_lecons,
  COUNT(CASE WHEN l.type = 'reading' THEN 1 END) as reading,
  COUNT(CASE WHEN l.type = 'video' THEN 1 END) as video,
  COUNT(CASE WHEN l.type = 'interactive' THEN 1 END) as interactive
FROM chapters c
LEFT JOIN lessons l ON l."chapterId" = c.id
WHERE c.id IN (1, 2, 3)
GROUP BY c.id, c.title
ORDER BY c.id;

SELECT
  l.title,
  l.type,
  l.difficulty,
  l."estimatedDuration" as duree_min,
  l."order",
  c.title as chapitre
FROM lessons l
JOIN chapters c ON c.id = l."chapterId"
WHERE l."subjectId" = 'e8f26aca-932b-4f5c-b0c1-add81ecd09ca'
ORDER BY l."chapterId", l."order";

/**
 * ✅ 5 leçons créées:
 * - Chapitre 1 (Fonctions numériques): 3 leçons
 * - Chapitre 2 (Dérivées): 1 leçon
 * - Chapitre 3 (Primitives): 1 leçon
 *
 * Types: reading, video, interactive
 * Niveaux: Débutant, Intermédiaire, Avancé
 */
