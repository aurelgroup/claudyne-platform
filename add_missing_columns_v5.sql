-- Migration v5 : Ajout des colonnes objectives et lastPaymentAt
-- Date: 2025-10-12

-- 1. Ajouter colonne 'objectives' à la table lessons
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS objectives TEXT;

COMMENT ON COLUMN lessons.objectives IS 'Objectifs pédagogiques de la leçon (format JSON ou texte)';

-- 2. Ajouter colonne 'lastPaymentAt' à la table subscriptions
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS "lastPaymentAt" TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN subscriptions."lastPaymentAt" IS 'Date du dernier paiement pour cet abonnement';

-- 3. Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_subscriptions_last_payment_at ON subscriptions("lastPaymentAt");
