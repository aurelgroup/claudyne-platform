/**
 * Migration: Ajout de la table Chapters et relation avec Lessons
 * Date: 2025-12-20
 * Auteur: Claude Sonnet 4.5
 *
 * Cette migration implémente l'architecture hiérarchique:
 * Subject → Chapter → Lesson
 */

-- ========================================
-- 1. Création de la table chapters
-- ========================================

CREATE TABLE IF NOT EXISTS chapters (
  id SERIAL PRIMARY KEY,

  -- Relation avec Subject
  "subjectId" UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,

  -- Informations de base
  title VARCHAR(200) NOT NULL,
  description TEXT,

  -- Organisation
  number INTEGER NOT NULL CHECK (number >= 1),
  "order" INTEGER DEFAULT 0,

  -- Contexte pédagogique camerounais
  trimester INTEGER CHECK (trimester BETWEEN 1 AND 3),
  series JSONB DEFAULT '[]',

  -- Métadonnées pédagogiques
  objectives JSONB DEFAULT '[]',
  prerequisites JSONB DEFAULT '[]',
  competencies JSONB DEFAULT '[]',

  -- Durée et difficulté
  "estimatedDuration" INTEGER,
  difficulty VARCHAR(50) DEFAULT 'Intermédiaire' CHECK (difficulty IN ('Débutant', 'Intermédiaire', 'Avancé', 'Expert')),

  -- Programme officiel
  "officialReference" JSONB DEFAULT '{}',

  -- Statut
  "isActive" BOOLEAN DEFAULT true,
  "isPremium" BOOLEAN DEFAULT false,

  -- Statistiques
  stats JSONB DEFAULT '{"totalLessons": 0, "avgCompletionRate": 0, "avgScore": 0, "avgTimeSpent": 0, "enrolledStudents": 0}',

  -- Métadonnées supplémentaires
  metadata JSONB DEFAULT '{"tags": [], "keywords": [], "resources": [], "examFocus": false, "bacWeight": 0}',

  -- Gestion
  "createdBy" VARCHAR(255),
  "lastUpdatedBy" VARCHAR(255),

  -- Timestamps
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP WITH TIME ZONE,

  -- Contrainte d'unicité: un seul chapitre avec le même numéro par matière
  CONSTRAINT unique_chapter_number_per_subject UNIQUE ("subjectId", number)
);

-- Index pour performances
CREATE INDEX idx_chapters_subject ON chapters("subjectId");
CREATE INDEX idx_chapters_subject_order ON chapters("subjectId", "order");
CREATE INDEX idx_chapters_subject_number ON chapters("subjectId", number);
CREATE INDEX idx_chapters_active ON chapters("isActive");
CREATE INDEX idx_chapters_trimester ON chapters(trimester);
CREATE INDEX idx_chapters_series ON chapters USING GIN (series);

-- Commentaires
COMMENT ON TABLE chapters IS 'Chapitres pédagogiques organisant les leçons par matière';
COMMENT ON COLUMN chapters."subjectId" IS 'Matière parente (FK vers subjects)';
COMMENT ON COLUMN chapters.number IS 'Numéro du chapitre (1, 2, 3...)';
COMMENT ON COLUMN chapters."order" IS 'Ordre d''affichage (permet réorganisation)';
COMMENT ON COLUMN chapters.trimester IS 'Trimestre (1, 2, 3) selon calendrier camerounais';
COMMENT ON COLUMN chapters.series IS 'Séries concernées (A, C, D, TI). Vide = toutes séries';
COMMENT ON COLUMN chapters.competencies IS 'Compétences selon curriculum camerounais';

-- ========================================
-- 2. Modification de la table lessons
-- ========================================

-- Ajouter colonne chapterId (nullable pour backward compatibility)
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS "chapterId" INTEGER REFERENCES chapters(id) ON DELETE SET NULL;

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_lessons_chapter ON lessons("chapterId");
CREATE INDEX IF NOT EXISTS idx_lessons_chapter_order ON lessons("chapterId", "order");

-- Commentaire
COMMENT ON COLUMN lessons."chapterId" IS 'Chapitre parent (optionnel pour backward compatibility)';

-- ========================================
-- 3. Fonction trigger pour update timestamp
-- ========================================

CREATE OR REPLACE FUNCTION update_chapters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_chapters_updated_at
  BEFORE UPDATE ON chapters
  FOR EACH ROW
  EXECUTE FUNCTION update_chapters_updated_at();

-- ========================================
-- 4. Données de test (OPTIONNEL)
-- ========================================

-- Exemple: Ajouter des chapitres pour Physique Tle (si la matière existe)
-- Décommenter si vous voulez créer des données de test

/*
INSERT INTO chapters ("subjectId", title, description, number, "order", trimester, series, objectives, difficulty, "isActive")
SELECT
  s.id,
  'Cinématique',
  'Étude du mouvement des corps sans considération des forces',
  1,
  1,
  1,
  '["C", "D"]',
  '["Comprendre les différents types de mouvements", "Calculer vitesse et accélération", "Tracer des graphiques de mouvement"]',
  'Intermédiaire',
  true
FROM subjects s
WHERE s.title ILIKE '%physique%' AND s.level = 'Tle'
LIMIT 1;

INSERT INTO chapters ("subjectId", title, description, number, "order", trimester, series, objectives, difficulty, "isActive")
SELECT
  s.id,
  'Dynamique',
  'Étude des forces et de leurs effets sur le mouvement',
  2,
  2,
  1,
  '["C", "D"]',
  '["Identifier et caractériser les forces", "Appliquer les lois de Newton", "Résoudre des problèmes de dynamique"]',
  'Avancé',
  true
FROM subjects s
WHERE s.title ILIKE '%physique%' AND s.level = 'Tle'
LIMIT 1;
*/

-- ========================================
-- 5. Vérifications
-- ========================================

-- Vérifier que la table existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chapters') THEN
    RAISE NOTICE '✅ Table chapters créée avec succès';
  ELSE
    RAISE EXCEPTION '❌ Erreur: Table chapters non créée';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lessons' AND column_name = 'chapterId'
  ) THEN
    RAISE NOTICE '✅ Colonne chapterId ajoutée à lessons';
  ELSE
    RAISE EXCEPTION '❌ Erreur: Colonne chapterId non ajoutée à lessons';
  END IF;
END $$;

-- Afficher statistiques
SELECT
  'Migration chapters' as migration,
  COUNT(*) as total_chapters,
  COUNT(DISTINCT "subjectId") as subjects_with_chapters
FROM chapters;

-- ========================================
-- ROLLBACK (si nécessaire)
-- ========================================

/*
-- Pour annuler cette migration, exécuter:

DROP TRIGGER IF EXISTS trigger_chapters_updated_at ON chapters;
DROP FUNCTION IF EXISTS update_chapters_updated_at();
DROP INDEX IF EXISTS idx_lessons_chapter_order;
DROP INDEX IF EXISTS idx_lessons_chapter;
ALTER TABLE lessons DROP COLUMN IF EXISTS "chapterId";
DROP INDEX IF EXISTS idx_chapters_series;
DROP INDEX IF EXISTS idx_chapters_trimester;
DROP INDEX IF EXISTS idx_chapters_active;
DROP INDEX IF EXISTS idx_chapters_subject_number;
DROP INDEX IF EXISTS idx_chapters_subject_order;
DROP INDEX IF EXISTS idx_chapters_subject;
DROP TABLE IF EXISTS chapters CASCADE;
*/
