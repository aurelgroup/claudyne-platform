-- Migration v6 : Ajout des colonnes prerequisites et features
-- Date: 2025-10-12

-- 1. Ajouter colonne 'prerequisites' à la table lessons
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS prerequisites JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN lessons.prerequisites IS 'Prérequis de la leçon (array JSON d''IDs de leçons)';

-- 2. Ajouter colonne 'features' à la table subscriptions
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN subscriptions.features IS 'Fonctionnalités incluses dans l''abonnement (objet JSON)';

-- 3. Créer des index pour améliorer les performances sur les colonnes JSONB
CREATE INDEX IF NOT EXISTS idx_lessons_prerequisites ON lessons USING GIN (prerequisites);
CREATE INDEX IF NOT EXISTS idx_subscriptions_features ON subscriptions USING GIN (features);
