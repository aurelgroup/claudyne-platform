-- Migration v10 FINALE : Ajout de TOUTES les colonnes restantes essentielles pour lessons
-- Date: 2025-10-12

-- Colonnes contextuelles et pédagogiques
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS "cameroonContext" JSONB DEFAULT '{}'::jsonb;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS stats JSONB DEFAULT '{}'::jsonb;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS resources JSONB DEFAULT '[]'::jsonb;

-- Colonnes de workflow
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS "reviewStatus" VARCHAR(50) DEFAULT 'draft';
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS "reviewedBy" UUID;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS "pendingReview" BOOLEAN DEFAULT false;

-- Colonnes optionnelles
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS transcript TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS "videoUrl" VARCHAR(500);
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Comments
COMMENT ON COLUMN lessons."cameroonContext" IS 'Contexte camerounais de la leçon (JSON)';
COMMENT ON COLUMN lessons.stats IS 'Statistiques de la leçon (vues, complétion, etc.)';
COMMENT ON COLUMN lessons.resources IS 'Ressources pédagogiques associées (JSON array)';
COMMENT ON COLUMN lessons."reviewStatus" IS 'Statut de révision (draft, pending, approved, rejected)';
COMMENT ON COLUMN lessons."reviewedBy" IS 'ID du réviseur';
COMMENT ON COLUMN lessons."pendingReview" IS 'Indique si la leçon est en attente de révision';
COMMENT ON COLUMN lessons.transcript IS 'Transcription de la vidéo';
COMMENT ON COLUMN lessons.version IS 'Version de la leçon';

-- Indexes GIN pour JSONB
CREATE INDEX IF NOT EXISTS idx_lessons_cameroon_context ON lessons USING GIN ("cameroonContext");
CREATE INDEX IF NOT EXISTS idx_lessons_stats ON lessons USING GIN (stats);
CREATE INDEX IF NOT EXISTS idx_lessons_resources ON lessons USING GIN (resources);

-- Indexes B-tree
CREATE INDEX IF NOT EXISTS idx_lessons_review_status ON lessons("reviewStatus");
CREATE INDEX IF NOT EXISTS idx_lessons_version ON lessons(version);
