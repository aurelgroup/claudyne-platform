-- Migration v8 : Ajout de la colonne quiz en JSONB (corrige l'erreur hasQuiz vs quiz)
-- Date: 2025-10-12

-- Ajouter colonne 'quiz' en JSONB à la table lessons
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS quiz JSONB;

COMMENT ON COLUMN lessons.quiz IS 'Données du quiz associé à la leçon (format JSON)';

-- Créer index GIN pour améliorer les performances sur les requêtes JSONB
CREATE INDEX IF NOT EXISTS idx_lessons_quiz ON lessons USING GIN (quiz);
