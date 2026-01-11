-- Migration v3 : Ajout des colonnes manquantes suite aux tests utilisateur
-- Date: 2025-10-12

-- 1. Ajouter colonne 'level' à la table prix_claudine
ALTER TABLE prix_claudine
ADD COLUMN IF NOT EXISTS level VARCHAR(50);

COMMENT ON COLUMN prix_claudine.level IS 'Niveau éducatif du lauréat (PRIMAIRE, COLLEGE, LYCEE)';

-- 2. Ajouter colonne 'category' à la table prix_claudine
ALTER TABLE prix_claudine
ADD COLUMN IF NOT EXISTS category VARCHAR(100);

COMMENT ON COLUMN prix_claudine.category IS 'Catégorie du prix (Excellence, Effort, Progrès, etc.)';

-- 3. Ajouter colonne 'name' à la table subjects (alias de title pour compatibilité Sequelize)
ALTER TABLE subjects
ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- Copier les valeurs de title vers name pour les enregistrements existants
UPDATE subjects SET name = title WHERE name IS NULL;

COMMENT ON COLUMN subjects.name IS 'Nom du sujet (alias de title pour compatibilité Sequelize)';

-- 4. Ajouter colonne 'difficulty' à la table lessons
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS difficulty VARCHAR(50) DEFAULT 'MOYEN';

COMMENT ON COLUMN lessons.difficulty IS 'Niveau de difficulté de la leçon (FACILE, MOYEN, DIFFICILE)';

-- 5. Ajouter colonne 'cancelledAt' à la table subscriptions
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN subscriptions."cancelledAt" IS 'Date d''annulation de l''abonnement';

-- 6. Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_prix_claudine_level ON prix_claudine(level);
CREATE INDEX IF NOT EXISTS idx_prix_claudine_category ON prix_claudine(category);
CREATE INDEX IF NOT EXISTS idx_subjects_name ON subjects(name);
CREATE INDEX IF NOT EXISTS idx_lessons_difficulty ON lessons(difficulty);
CREATE INDEX IF NOT EXISTS idx_subscriptions_cancelled ON subscriptions("cancelledAt");
