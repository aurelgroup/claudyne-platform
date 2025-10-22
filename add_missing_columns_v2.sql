-- Migration v2 : Ajout des colonnes manquantes supplémentaires
-- Date: 2025-10-12

-- 1. Ajouter colonne 'awardedAt' à la table prix_claudine
ALTER TABLE prix_claudine
ADD COLUMN IF NOT EXISTS "awardedAt" TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN prix_claudine."awardedAt" IS 'Date d''attribution du Prix Claudine';

-- 2. Ajouter colonne 'type' à la table lessons
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'video';

COMMENT ON COLUMN lessons.type IS 'Type de leçon (video, quiz, text, interactive)';

-- 3. Ajouter colonne 'type' à la table subscriptions
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'standard';

COMMENT ON COLUMN subscriptions.type IS 'Type d''abonnement (trial, standard, premium)';

-- 4. Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_prix_claudine_awarded ON prix_claudine("awardedAt");
CREATE INDEX IF NOT EXISTS idx_lessons_type ON lessons(type);
CREATE INDEX IF NOT EXISTS idx_subscriptions_type ON subscriptions(type);
