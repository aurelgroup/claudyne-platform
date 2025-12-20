/**
 * Seed: Chapitres selon Curriculum Camerounais
 * Date: 2025-12-20
 * Source: Programme officiel MINESEC Cameroun
 *
 * Structure par série:
 * - Série C: Mathématiques/Physique (Scientifique)
 * - Série D: Sciences de la Vie (Biologie)
 * - Série A: Littéraire
 */

-- ========================================
-- TERMINALE C - MATHÉMATIQUES
-- ========================================

-- Note: Remplacer les subjectId par les vrais IDs de votre BDD
-- SELECT id FROM subjects WHERE title ILIKE '%mathématiques%' AND level = 'Tle';

INSERT INTO chapters ("subjectId", title, description, number, "order", trimester, series, objectives, competencies, difficulty, "estimatedDuration", "isActive", "createdAt", "updatedAt")
VALUES
-- Trimestre 1
('math-tle-c', 'Fonctions numériques', 'Étude approfondie des fonctions: domaine, limite, continuité, dérivabilité', 1, 1, 1, '["C", "D"]',
 '["Déterminer le domaine de définition", "Calculer les limites", "Étudier la continuité et dérivabilité"]',
 '["C1: Résoudre des problèmes", "C2: Modéliser des situations"]',
 'Avancé', 300, true, NOW(), NOW()),

('math-tle-c', 'Dérivées et applications', 'Calcul de dérivées, tableau de variation, optimisation', 2, 2, 1, '["C", "D"]',
 '["Calculer la dérivée de fonctions composées", "Dresser le tableau de variation", "Résoudre des problèmes d''optimisation"]',
 '["C1: Résoudre des problèmes", "C3: Raisonner logiquement"]',
 'Avancé', 280, true, NOW(), NOW()),

('math-tle-c', 'Primitives et intégrales', 'Calcul intégral, aire sous une courbe, intégration par parties', 3, 3, 1, '["C", "D"]',
 '["Calculer des primitives", "Calculer des intégrales définies", "Calculer des aires"]',
 '["C1: Résoudre des problèmes", "C2: Modéliser"]',
 'Avancé', 320, true, NOW(), NOW()),

-- Trimestre 2
('math-tle-c', 'Équations différentielles', 'Résolution d''équations différentielles linéaires du 1er et 2nd ordre', 4, 4, 2, '["C", "D"]',
 '["Résoudre des équations différentielles linéaires", "Modéliser des phénomènes physiques", "Déterminer la solution générale"]',
 '["C1: Résoudre des problèmes", "C2: Modéliser des situations complexes"]',
 'Expert', 260, true, NOW(), NOW()),

('math-tle-c', 'Suites numériques', 'Suites arithmétiques, géométriques, convergence, récurrence', 5, 5, 2, '["C", "D"]',
 '["Étudier la convergence", "Démontrer par récurrence", "Calculer la limite d''une suite"]',
 '["C3: Raisonner logiquement", "C1: Résoudre des problèmes"]',
 'Avancé', 240, true, NOW(), NOW()),

('math-tle-c', 'Probabilités', 'Variables aléatoires, loi binomiale, loi normale', 6, 6, 2, '["C", "D"]',
 '["Calculer des probabilités", "Déterminer l''espérance et la variance", "Utiliser la loi normale"]',
 '["C1: Résoudre des problèmes", "C2: Modéliser"]',
 'Intermédiaire', 220, true, NOW(), NOW()),

-- Trimestre 3
('math-tle-c', 'Nombres complexes', 'Forme algébrique, trigonométrique, exponentielle, applications géométriques', 7, 7, 3, '["C"]',
 '["Effectuer des calculs avec les complexes", "Résoudre des équations", "Utiliser les similitudes"]',
 '["C1: Résoudre des problèmes", "C3: Raisonner"]',
 'Expert', 280, true, NOW(), NOW()),

('math-tle-c', 'Géométrie dans l''espace', 'Droites et plans, vecteurs de l''espace, sections', 8, 8, 3, '["C", "D"]',
 '["Déterminer l''équation d''un plan", "Calculer des distances", "Résoudre des problèmes de géométrie"]',
 '["C1: Résoudre des problèmes", "C4: Représenter"]',
 'Avancé', 200, true, NOW(), NOW()),

('math-tle-c', 'Révisions Baccalauréat', 'Synthèse générale, annales, méthodologie', 9, 9, 3, '["C", "D"]',
 '["Maîtriser toutes les notions du programme", "Gérer son temps à l''examen", "Résoudre des sujets types"]',
 '["C1: Résoudre des problèmes complexes"]',
 'Expert', 400, true, NOW(), NOW());

-- ========================================
-- TERMINALE C/D - PHYSIQUE
-- ========================================

INSERT INTO chapters ("subjectId", title, description, number, "order", trimester, series, objectives, competencies, difficulty, "estimatedDuration", "isActive", "createdAt", "updatedAt")
VALUES
-- Trimestre 1
('physique-tle', 'Cinématique du point matériel', 'Mouvement rectiligne, circulaire, vitesse, accélération', 1, 1, 1, '["C", "D"]',
 '["Décrire un mouvement", "Calculer vitesse et accélération", "Tracer des graphiques de mouvement"]',
 '["C1: Résoudre des problèmes de mécanique", "C4: Représenter graphiquement"]',
 'Intermédiaire', 240, true, NOW(), NOW()),

('physique-tle', 'Dynamique - Lois de Newton', 'Forces, principe fondamental, théorème de l''énergie cinétique', 2, 2, 1, '["C", "D"]',
 '["Identifier les forces", "Appliquer les lois de Newton", "Utiliser le théorème de l''énergie"]',
 '["C1: Résoudre des problèmes", "C2: Modéliser"]',
 'Avancé', 280, true, NOW(), NOW()),

('physique-tle', 'Travail et Énergie', 'Travail d''une force, énergies cinétique et potentielle, conservation', 3, 3, 1, '["C", "D"]',
 '["Calculer le travail d''une force", "Appliquer la conservation de l''énergie", "Résoudre des problèmes d''énergie"]',
 '["C1: Résoudre des problèmes énergétiques"]',
 'Avancé', 260, true, NOW(), NOW()),

-- Trimestre 2
('physique-tle', 'Circuits électriques en courant continu', 'Lois de Kirchhoff, résistances, générateurs', 4, 4, 2, '["C", "D", "TI"]',
 '["Analyser un circuit électrique", "Appliquer les lois de Kirchhoff", "Calculer puissance et énergie"]',
 '["C1: Résoudre des problèmes électriques", "C2: Modéliser"]',
 'Intermédiaire', 240, true, NOW(), NOW()),

('physique-tle', 'Électromagnétisme', 'Champ magnétique, induction, loi de Lenz, flux', 5, 5, 2, '["C", "D"]',
 '["Caractériser un champ magnétique", "Appliquer la loi de Faraday", "Calculer le flux magnétique"]',
 '["C1: Résoudre des problèmes", "C3: Raisonner"]',
 'Avancé', 280, true, NOW(), NOW()),

('physique-tle', 'Circuits RLC - Oscillations', 'Oscillations libres et forcées, résonance', 6, 6, 2, '["C"]',
 '["Étudier les oscillations d''un circuit RLC", "Déterminer la fréquence de résonance", "Analyser un régime transitoire"]',
 '["C1: Résoudre des problèmes complexes", "C2: Modéliser"]',
 'Expert', 260, true, NOW(), NOW()),

-- Trimestre 3
('physique-tle', 'Ondes mécaniques', 'Propagation d''ondes, vitesse, longueur d''onde, interférences', 7, 7, 3, '["C", "D"]',
 '["Caractériser une onde", "Calculer vitesse et longueur d''onde", "Expliquer les interférences"]',
 '["C1: Résoudre des problèmes", "C4: Représenter"]',
 'Intermédiaire', 220, true, NOW(), NOW()),

('physique-tle', 'Optique géométrique', 'Lois de la réfraction, lentilles, miroirs, instruments optiques', 8, 8, 3, '["C", "D"]',
 '["Appliquer les lois de Descartes", "Construire des images", "Calculer la distance focale"]',
 '["C1: Résoudre des problèmes optiques", "C4: Construire des schémas"]',
 'Intermédiaire', 240, true, NOW(), NOW()),

('physique-tle', 'Physique nucléaire', 'Radioactivité, réactions nucléaires, énergie nucléaire', 9, 9, 3, '["C", "D"]',
 '["Comprendre la radioactivité", "Calculer l''énergie libérée", "Appliquer la loi de décroissance"]',
 '["C1: Résoudre des problèmes", "C5: Comprendre les enjeux"]',
 'Avancé', 200, true, NOW(), NOW()),

('physique-tle', 'Révisions Baccalauréat', 'Synthèse du programme, annales, méthodologie', 10, 10, 3, '["C", "D"]',
 '["Maîtriser tout le programme", "Résoudre des sujets types Bac", "Optimiser la gestion du temps"]',
 '["C1: Résoudre des problèmes complexes"]',
 'Expert', 360, true, NOW(), NOW());

-- ========================================
-- TERMINALE C/D - CHIMIE
-- ========================================

INSERT INTO chapters ("subjectId", title, description, number, "order", trimester, series, objectives, competencies, difficulty, "estimatedDuration", "isActive", "createdAt", "updatedAt")
VALUES
-- Trimestre 1
('chimie-tle', 'Chimie organique: Alcanes et Alcènes', 'Nomenclature, propriétés, réactions caractéristiques', 1, 1, 1, '["C", "D"]',
 '["Nommer des hydrocarbures", "Écrire des formules développées", "Identifier les réactions"]',
 '["C1: Résoudre des problèmes de chimie organique"]',
 'Intermédiaire', 200, true, NOW(), NOW()),

('chimie-tle', 'Alcools et dérivés', 'Classes d''alcools, oxydation, estérification', 2, 2, 1, '["C", "D"]',
 '["Classer les alcools", "Écrire les équations d''oxydation", "Réaliser une estérification"]',
 '["C1: Résoudre des problèmes", "C2: Expérimenter"]',
 'Intermédiaire', 220, true, NOW(), NOW()),

-- Trimestre 2
('chimie-tle', 'Acides et bases', 'pH, constante d''acidité, titrages acido-basiques', 3, 3, 2, '["C", "D"]',
 '["Calculer le pH", "Réaliser un titrage", "Tracer une courbe de titrage"]',
 '["C1: Résoudre des problèmes", "C2: Expérimenter"]',
 'Avancé', 240, true, NOW(), NOW()),

('chimie-tle', 'Oxydoréduction', 'Couples redox, piles électrochimiques, électrolyse', 4, 4, 2, '["C", "D", "TI"]',
 '["Identifier les couples redox", "Calculer la fem d''une pile", "Comprendre l''électrolyse"]',
 '["C1: Résoudre des problèmes", "C2: Expérimenter"]',
 'Avancé', 260, true, NOW(), NOW()),

-- Trimestre 3
('chimie-tle', 'Cinétique chimique', 'Vitesse de réaction, facteurs cinétiques, catalyse', 5, 5, 3, '["C"]',
 '["Mesurer une vitesse de réaction", "Identifier les facteurs cinétiques", "Comprendre la catalyse"]',
 '["C1: Résoudre des problèmes", "C3: Expérimenter"]',
 'Avancé', 200, true, NOW(), NOW()),

('chimie-tle', 'Révisions Baccalauréat', 'Synthèse, annales, travaux pratiques', 6, 6, 3, '["C", "D"]',
 '["Maîtriser le programme de chimie", "Résoudre des exercices types"]',
 '["C1: Résoudre des problèmes complexes"]',
 'Expert', 280, true, NOW(), NOW());

-- ========================================
-- TERMINALE D - SVT/SVTEEHB
-- ========================================

INSERT INTO chapters ("subjectId", title, description, number, "order", trimester, series, objectives, competencies, difficulty, "estimatedDuration", "isActive", "createdAt", "updatedAt")
VALUES
-- Trimestre 1
('svt-tle', 'Reproduction humaine', 'Appareil reproducteur, cycle menstruel, fécondation, grossesse', 1, 1, 1, '["D"]',
 '["Décrire l''appareil reproducteur", "Expliquer le cycle menstruel", "Comprendre la fécondation"]',
 '["C1: Comprendre le vivant", "C5: Santé et reproduction"]',
 'Intermédiaire', 240, true, NOW(), NOW()),

('svt-tle', 'Génétique et hérédité', 'Lois de Mendel, chromosomes, mutations, maladies génétiques', 2, 2, 1, '["D"]',
 '["Appliquer les lois de Mendel", "Comprendre les mutations", "Identifier les maladies génétiques"]',
 '["C1: Résoudre des problèmes génétiques", "C3: Raisonner"]',
 'Avancé', 280, true, NOW(), NOW()),

('svt-tle', 'Biologie moléculaire', 'ADN, ARN, synthèse des protéines, code génétique', 3, 3, 1, '["D"]',
 '["Comprendre la structure de l''ADN", "Expliquer la transcription et traduction", "Utiliser le code génétique"]',
 '["C1: Comprendre les mécanismes moléculaires"]',
 'Avancé', 260, true, NOW(), NOW()),

-- Trimestre 2
('svt-tle', 'Immunologie', 'Système immunitaire, réponse immunitaire, vaccins, SIDA', 4, 4, 2, '["D"]',
 '["Décrire le système immunitaire", "Expliquer la réponse immunitaire", "Comprendre les vaccins"]',
 '["C1: Comprendre le vivant", "C5: Santé publique"]',
 'Avancé', 300, true, NOW(), NOW()),

('svt-tle', 'Système nerveux', 'Neurones, synapse, réflexe, système nerveux central et périphérique', 5, 5, 2, '["D"]',
 '["Décrire un neurone", "Expliquer la transmission synaptique", "Analyser un arc réflexe"]',
 '["C1: Comprendre le fonctionnement nerveux"]',
 'Avancé', 260, true, NOW(), NOW()),

('svt-tle', 'Régulation hormonale', 'Hormones, glandes endocrines, diabète, stress', 6, 6, 2, '["D"]',
 '["Identifier les principales hormones", "Comprendre la régulation hormonale", "Expliquer le diabète"]',
 '["C1: Comprendre la régulation", "C5: Santé"]',
 'Intermédiaire', 220, true, NOW(), NOW()),

-- Trimestre 3
('svt-tle', 'Écologie et environnement', 'Écosystèmes, chaînes alimentaires, cycles biogéochimiques', 7, 7, 3, '["D"]',
 '["Analyser un écosystème", "Construire des chaînes alimentaires", "Comprendre les cycles"]',
 '["C1: Comprendre l''écologie", "C6: Responsabilité environnementale"]',
 'Intermédiaire', 240, true, NOW(), NOW()),

('svt-tle', 'Biotechnologies', 'OGM, clonage, génie génétique, enjeux éthiques', 8, 8, 3, '["D"]',
 '["Comprendre les biotechnologies", "Analyser les enjeux", "Débattre des aspects éthiques"]',
 '["C1: Comprendre les biotechnologies", "C7: Éthique"]',
 'Avancé', 200, true, NOW(), NOW()),

('svt-tle', 'Révisions Baccalauréat', 'Synthèse du programme, annales, méthodologie', 9, 9, 3, '["D"]',
 '["Maîtriser tout le programme", "Résoudre des QCM et questions ouvertes"]',
 '["C1: Maîtrise globale du programme"]',
 'Expert', 360, true, NOW(), NOW());

-- ========================================
-- VÉRIFICATIONS
-- ========================================

-- Afficher le nombre de chapitres créés par matière
SELECT
  "subjectId",
  COUNT(*) as nb_chapitres,
  COUNT(CASE WHEN trimester = 1 THEN 1 END) as trimestre_1,
  COUNT(CASE WHEN trimester = 2 THEN 1 END) as trimestre_2,
  COUNT(CASE WHEN trimester = 3 THEN 1 END) as trimestre_3
FROM chapters
WHERE "createdAt" >= NOW() - INTERVAL '1 minute'
GROUP BY "subjectId";

-- ========================================
-- NOTES IMPORTANTES
-- ========================================

/**
 * ⚠️ AVANT D'EXÉCUTER CE SEED:
 *
 * 1. Remplacer les subjectId fictifs par les vrais IDs de votre BDD
 *    Exemple:
 *    SELECT id FROM subjects WHERE title ILIKE '%mathématiques%' AND level = 'Tle';
 *
 * 2. Adapter selon les matières disponibles dans votre système
 *
 * 3. Ce seed couvre:
 *    - Terminale C: Mathématiques (9 chapitres), Physique (10 chapitres), Chimie (6 chapitres)
 *    - Terminale D: SVT (9 chapitres)
 *
 * 4. Basé sur le curriculum officiel MINESEC Cameroun
 *
 * 5. Chaque chapitre inclut:
 *    - Trimestre (1, 2, 3)
 *    - Séries concernées (C, D, TI, A)
 *    - Objectifs pédagogiques
 *    - Compétences du curriculum
 *    - Difficulté
 *    - Durée estimée
 */
