-- Migration v4 : Ajout des dernières colonnes manquantes
-- Date: 2025-10-12

-- 1. Ajouter colonne 'estimatedDuration' à la table lessons
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS "estimatedDuration" INTEGER DEFAULT 30;

COMMENT ON COLUMN lessons."estimatedDuration" IS 'Durée estimée de la leçon en minutes';

-- 2. Ajouter colonne 'lastPaymentId' à la table subscriptions
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS "lastPaymentId" UUID;

COMMENT ON COLUMN subscriptions."lastPaymentId" IS 'ID du dernier paiement associé à cet abonnement';

-- 3. Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_lessons_estimated_duration ON lessons("estimatedDuration");
CREATE INDEX IF NOT EXISTS idx_subscriptions_last_payment ON subscriptions("lastPaymentId");
