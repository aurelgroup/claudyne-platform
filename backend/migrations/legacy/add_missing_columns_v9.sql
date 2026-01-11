-- Migration v9 : Ajout de isActive et autres colonnes essentielles pour lessons
-- Date: 2025-10-12

-- Colonnes essentielles manquantes dans lessons
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;

ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS "isPremium" BOOLEAN DEFAULT false;

ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP WITH TIME ZONE;

ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS "createdBy" UUID;

COMMENT ON COLUMN lessons."isActive" IS 'Indique si la leçon est active/visible';
COMMENT ON COLUMN lessons."isPremium" IS 'Indique si la leçon nécessite un abonnement premium';
COMMENT ON COLUMN lessons.metadata IS 'Métadonnées additionnelles de la leçon';
COMMENT ON COLUMN lessons."publishedAt" IS 'Date de publication de la leçon';
COMMENT ON COLUMN lessons."createdBy" IS 'ID de l''utilisateur créateur';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lessons_is_active ON lessons("isActive");
CREATE INDEX IF NOT EXISTS idx_lessons_is_premium ON lessons("isPremium");
CREATE INDEX IF NOT EXISTS idx_lessons_metadata ON lessons USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_lessons_published_at ON lessons("publishedAt");
