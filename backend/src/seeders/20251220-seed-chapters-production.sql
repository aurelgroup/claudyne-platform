/**
 * Seed: Chapitres Production - Matières Existantes
 * Date: 2025-12-20
 * Source: Programme officiel MINESEC Cameroun
 *
 * Utilise les vrais UUIDs des matières existantes en production
 */

-- ========================================
-- VÉRIFICATION DES MATIÈRES EXISTANTES
-- ========================================

DO $$
BEGIN
  -- Vérifier que les matières existent
  IF NOT EXISTS (SELECT 1 FROM subjects WHERE id = 'e8f26aca-932b-4f5c-b0c1-add81ecd09ca') THEN
    RAISE EXCEPTION 'Matière EE (Mathématiques Tle) non trouvée';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM subjects WHERE id = '39b1118e-b615-42e9-9da8-8f62acea2f2f') THEN
    RAISE EXCEPTION 'Matière PHYSIQUES TLE non trouvée';
  END IF;

  RAISE NOTICE '✅ Matières vérifiées: EE et PHYSIQUES TLE';
END $$;

-- ========================================
-- TERMINALE - MATHÉMATIQUES (Matière: EE)
-- UUID: e8f26aca-932b-4f5c-b0c1-add81ecd09ca
-- ========================================

INSERT INTO chapters ("subjectId", title, description, number, "order", trimester, series, objectives, competencies, difficulty, "estimatedDuration", "isActive", "createdAt", "updatedAt")
VALUES
-- Trimestre 1
('e8f26aca-932b-4f5c-b0c1-add81ecd09ca', 'Fonctions numériques', 'Étude approfondie des fonctions: domaine, limite, continuité, dérivabilité', 1, 1, 1, '["C", "D"]',
 '["Déterminer le domaine de définition", "Calculer les limites", "Étudier la continuité et dérivabilité"]',
 '["C1: Résoudre des problèmes", "C2: Modéliser des situations"]',
 'Avancé', 300, true, NOW(), NOW()),

('e8f26aca-932b-4f5c-b0c1-add81ecd09ca', 'Dérivées et applications', 'Calcul de dérivées, tableau de variation, optimisation', 2, 2, 1, '["C", "D"]',
 '["Calculer la dérivée de fonctions composées", "Dresser le tableau de variation", "Résoudre des problèmes d''optimisation"]',
 '["C1: Résoudre des problèmes", "C3: Raisonner logiquement"]',
 'Avancé', 280, true, NOW(), NOW()),

('e8f26aca-932b-4f5c-b0c1-add81ecd09ca', 'Primitives et intégrales', 'Calcul intégral, aire sous une courbe, intégration par parties', 3, 3, 1, '["C", "D"]',
 '["Calculer des primitives", "Calculer des intégrales définies", "Calculer des aires"]',
 '["C1: Résoudre des problèmes", "C2: Modéliser"]',
 'Avancé', 320, true, NOW(), NOW()),

-- Trimestre 2
('e8f26aca-932b-4f5c-b0c1-add81ecd09ca', 'Équations différentielles', 'Résolution d''équations différentielles linéaires du 1er et 2nd ordre', 4, 4, 2, '["C", "D"]',
 '["Résoudre des équations différentielles linéaires", "Modéliser des phénomènes physiques", "Déterminer la solution générale"]',
 '["C1: Résoudre des problèmes", "C2: Modéliser des situations complexes"]',
 'Expert', 260, true, NOW(), NOW()),

('e8f26aca-932b-4f5c-b0c1-add81ecd09ca', 'Suites numériques', 'Suites arithmétiques, géométriques, convergence, récurrence', 5, 5, 2, '["C", "D"]',
 '["Étudier la convergence", "Démontrer par récurrence", "Calculer la limite d''une suite"]',
 '["C3: Raisonner logiquement", "C1: Résoudre des problèmes"]',
 'Avancé', 240, true, NOW(), NOW()),

('e8f26aca-932b-4f5c-b0c1-add81ecd09ca', 'Probabilités', 'Variables aléatoires, loi binomiale, loi normale', 6, 6, 2, '["C", "D"]',
 '["Calculer des probabilités", "Déterminer l''espérance et la variance", "Utiliser la loi normale"]',
 '["C1: Résoudre des problèmes", "C2: Modéliser"]',
 'Intermédiaire', 220, true, NOW(), NOW()),

-- Trimestre 3
('e8f26aca-932b-4f5c-b0c1-add81ecd09ca', 'Nombres complexes', 'Forme algébrique, trigonométrique, exponentielle, applications géométriques', 7, 7, 3, '["C"]',
 '["Effectuer des calculs avec les complexes", "Résoudre des équations", "Utiliser les similitudes"]',
 '["C1: Résoudre des problèmes", "C3: Raisonner"]',
 'Expert', 280, true, NOW(), NOW()),

('e8f26aca-932b-4f5c-b0c1-add81ecd09ca', 'Géométrie dans l''espace', 'Droites et plans, vecteurs de l''espace, sections', 8, 8, 3, '["C", "D"]',
 '["Déterminer l''équation d''un plan", "Calculer des distances", "Résoudre des problèmes de géométrie"]',
 '["C1: Résoudre des problèmes", "C4: Représenter"]',
 'Avancé', 200, true, NOW(), NOW()),

('e8f26aca-932b-4f5c-b0c1-add81ecd09ca', 'Révisions Baccalauréat', 'Synthèse générale, annales, méthodologie', 9, 9, 3, '["C", "D"]',
 '["Maîtriser toutes les notions du programme", "Gérer son temps à l''examen", "Résoudre des sujets types"]',
 '["C1: Résoudre des problèmes complexes"]',
 'Expert', 400, true, NOW(), NOW());

-- ========================================
-- TERMINALE - PHYSIQUE (Matière: PHYSIQUES TLE)
-- UUID: 39b1118e-b615-42e9-9da8-8f62acea2f2f
-- ========================================

INSERT INTO chapters ("subjectId", title, description, number, "order", trimester, series, objectives, competencies, difficulty, "estimatedDuration", "isActive", "createdAt", "updatedAt")
VALUES
-- Trimestre 1
('39b1118e-b615-42e9-9da8-8f62acea2f2f', 'Cinématique du point matériel', 'Mouvement rectiligne, circulaire, vitesse, accélération', 1, 1, 1, '["C", "D"]',
 '["Décrire un mouvement", "Calculer vitesse et accélération", "Tracer des graphiques de mouvement"]',
 '["C1: Résoudre des problèmes de mécanique", "C4: Représenter graphiquement"]',
 'Intermédiaire', 240, true, NOW(), NOW()),

('39b1118e-b615-42e9-9da8-8f62acea2f2f', 'Dynamique - Lois de Newton', 'Forces, principe fondamental, théorème de l''énergie cinétique', 2, 2, 1, '["C", "D"]',
 '["Identifier les forces", "Appliquer les lois de Newton", "Utiliser le théorème de l''énergie"]',
 '["C1: Résoudre des problèmes", "C2: Modéliser"]',
 'Avancé', 280, true, NOW(), NOW()),

('39b1118e-b615-42e9-9da8-8f62acea2f2f', 'Travail et Énergie', 'Travail d''une force, énergies cinétique et potentielle, conservation', 3, 3, 1, '["C", "D"]',
 '["Calculer le travail d''une force", "Appliquer la conservation de l''énergie", "Résoudre des problèmes d''énergie"]',
 '["C1: Résoudre des problèmes énergétiques"]',
 'Avancé', 260, true, NOW(), NOW()),

-- Trimestre 2
('39b1118e-b615-42e9-9da8-8f62acea2f2f', 'Circuits électriques en courant continu', 'Lois de Kirchhoff, résistances, générateurs', 4, 4, 2, '["C", "D", "TI"]',
 '["Analyser un circuit électrique", "Appliquer les lois de Kirchhoff", "Calculer puissance et énergie"]',
 '["C1: Résoudre des problèmes électriques", "C2: Modéliser"]',
 'Intermédiaire', 240, true, NOW(), NOW()),

('39b1118e-b615-42e9-9da8-8f62acea2f2f', 'Électromagnétisme', 'Champ magnétique, induction, loi de Lenz, flux', 5, 5, 2, '["C", "D"]',
 '["Caractériser un champ magnétique", "Appliquer la loi de Faraday", "Calculer le flux magnétique"]',
 '["C1: Résoudre des problèmes", "C3: Raisonner"]',
 'Avancé', 280, true, NOW(), NOW()),

('39b1118e-b615-42e9-9da8-8f62acea2f2f', 'Circuits RLC - Oscillations', 'Oscillations libres et forcées, résonance', 6, 6, 2, '["C"]',
 '["Étudier les oscillations d''un circuit RLC", "Déterminer la fréquence de résonance", "Analyser un régime transitoire"]',
 '["C1: Résoudre des problèmes complexes", "C2: Modéliser"]',
 'Expert', 260, true, NOW(), NOW()),

-- Trimestre 3
('39b1118e-b615-42e9-9da8-8f62acea2f2f', 'Ondes mécaniques', 'Propagation d''ondes, vitesse, longueur d''onde, interférences', 7, 7, 3, '["C", "D"]',
 '["Caractériser une onde", "Calculer vitesse et longueur d''onde", "Expliquer les interférences"]',
 '["C1: Résoudre des problèmes", "C4: Représenter"]',
 'Intermédiaire', 220, true, NOW(), NOW()),

('39b1118e-b615-42e9-9da8-8f62acea2f2f', 'Optique géométrique', 'Lois de la réfraction, lentilles, miroirs, instruments optiques', 8, 8, 3, '["C", "D"]',
 '["Appliquer les lois de Descartes", "Construire des images", "Calculer la distance focale"]',
 '["C1: Résoudre des problèmes optiques", "C4: Construire des schémas"]',
 'Intermédiaire', 240, true, NOW(), NOW()),

('39b1118e-b615-42e9-9da8-8f62acea2f2f', 'Physique nucléaire', 'Radioactivité, réactions nucléaires, énergie nucléaire', 9, 9, 3, '["C", "D"]',
 '["Comprendre la radioactivité", "Calculer l''énergie libérée", "Appliquer la loi de décroissance"]',
 '["C1: Résoudre des problèmes", "C5: Comprendre les enjeux"]',
 'Avancé', 200, true, NOW(), NOW()),

('39b1118e-b615-42e9-9da8-8f62acea2f2f', 'Révisions Baccalauréat', 'Synthèse du programme, annales, méthodologie', 10, 10, 3, '["C", "D"]',
 '["Maîtriser tout le programme", "Résoudre des sujets types Bac", "Optimiser la gestion du temps"]',
 '["C1: Résoudre des problèmes complexes"]',
 'Expert', 360, true, NOW(), NOW());

-- ========================================
-- VÉRIFICATIONS ET STATISTIQUES
-- ========================================

-- Afficher le résultat
SELECT
  s.title as matiere,
  COUNT(c.id) as nb_chapitres,
  COUNT(CASE WHEN c.trimester = 1 THEN 1 END) as trimestre_1,
  COUNT(CASE WHEN c.trimester = 2 THEN 1 END) as trimestre_2,
  COUNT(CASE WHEN c.trimester = 3 THEN 1 END) as trimestre_3
FROM subjects s
LEFT JOIN chapters c ON s.id = c."subjectId"
WHERE s.id IN ('e8f26aca-932b-4f5c-b0c1-add81ecd09ca', '39b1118e-b615-42e9-9da8-8f62acea2f2f')
GROUP BY s.id, s.title
ORDER BY s.title;

-- Afficher tous les chapitres créés
SELECT
  s.title as matiere,
  c.number as numero,
  c.title as chapitre,
  c.trimester,
  c.difficulty,
  c."estimatedDuration" as duree_min
FROM chapters c
JOIN subjects s ON c."subjectId" = s.id
WHERE c."subjectId" IN ('e8f26aca-932b-4f5c-b0c1-add81ecd09ca', '39b1118e-b615-42e9-9da8-8f62acea2f2f')
ORDER BY s.title, c.number;

-- ========================================
-- NOTES
-- ========================================

/**
 * ✅ Ce seed crée:
 * - 9 chapitres pour Mathématiques (EE)
 * - 10 chapitres pour Physique (PHYSIQUES TLE)
 *
 * Total: 19 chapitres basés sur le curriculum officiel MINESEC
 *
 * Pour ajouter Chimie ou SVT:
 * 1. Créer les matières dans l'admin interface
 * 2. Récupérer leurs UUIDs
 * 3. Créer un nouveau seed avec ces UUIDs
 */
