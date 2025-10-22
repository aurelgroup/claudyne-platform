-- Migration v7 : Ajout des dernières colonnes manquantes (identifiées dans le code backend)
-- Date: 2025-10-12

-- 1. Ajouter colonnes pour /api/admin/free-modules
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS "isFree" BOOLEAN DEFAULT false;

ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS "hasQuiz" BOOLEAN DEFAULT false;

COMMENT ON COLUMN lessons."isFree" IS 'Indique si la leçon est gratuite';
COMMENT ON COLUMN lessons."hasQuiz" IS 'Indique si la leçon a un quiz associé';

-- 2. Ajouter colonne pour /api/admin/trial-history
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN subscriptions.notes IS 'Notes administratives sur l''abonnement (raison extension, etc.)';

-- 3. Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_lessons_is_free ON lessons("isFree");
CREATE INDEX IF NOT EXISTS idx_lessons_has_quiz ON lessons("hasQuiz");
