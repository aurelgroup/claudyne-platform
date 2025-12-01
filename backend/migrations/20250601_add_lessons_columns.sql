-- Migration 002: Enhanced lessons table with contextual fields
-- Date: 2025-06-01

ALTER TABLE lessons ADD COLUMN IF NOT EXISTS "cameroonContext" JSONB DEFAULT '{}'::jsonb;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS stats JSONB DEFAULT '{}'::jsonb;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS resources JSONB DEFAULT '[]'::jsonb;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS "reviewStatus" VARCHAR(50) DEFAULT 'draft';
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS "reviewedBy" UUID REFERENCES users(id);
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS "pendingReview" BOOLEAN DEFAULT false;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS transcript TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS "videoUrl" VARCHAR(500);
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Comments for documentation
COMMENT ON COLUMN lessons."cameroonContext" IS 'Contexte camerounais spécifique (JSON)';
COMMENT ON COLUMN lessons.stats IS 'Statistiques : vues, complétions, etc.';
COMMENT ON COLUMN lessons.resources IS 'Ressources pédagogiques liées (JSON array)';
COMMENT ON COLUMN lessons."reviewStatus" IS 'Statut : draft, pending, approved, rejected';
COMMENT ON COLUMN lessons."reviewedBy" IS 'Référence du réviseur';
COMMENT ON COLUMN lessons."pendingReview" IS 'Flag révision en attente';
COMMENT ON COLUMN lessons.version IS 'Version de la leçon';

-- Indexes for JSONB queries
CREATE INDEX IF NOT EXISTS idx_lessons_cameroon_context ON lessons USING GIN ("cameroonContext");
CREATE INDEX IF NOT EXISTS idx_lessons_stats ON lessons USING GIN (stats);
CREATE INDEX IF NOT EXISTS idx_lessons_resources ON lessons USING GIN (resources);

-- B-tree indexes
CREATE INDEX IF NOT EXISTS idx_lessons_review_status ON lessons("reviewStatus");
CREATE INDEX IF NOT EXISTS idx_lessons_pending_review ON lessons("pendingReview") WHERE "pendingReview" = true;
CREATE INDEX IF NOT EXISTS idx_lessons_version ON lessons(version);
