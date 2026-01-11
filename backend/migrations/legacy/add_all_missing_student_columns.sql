-- Migration: Ajout de TOUTES les colonnes manquantes à la table students
-- Date: 23 Octobre 2025
-- Description: Ajoute toutes les colonnes définies dans le modèle Student.js

-- 1. Colonnes de moyennes et performances scolaires
ALTER TABLE students ADD COLUMN IF NOT EXISTS "currentAverage" DECIMAL(5,2) DEFAULT 0.00;
ALTER TABLE students ADD COLUMN IF NOT EXISTS "lastTermAverage" DECIMAL(5,2) DEFAULT 0.00;
ALTER TABLE students ADD COLUMN IF NOT EXISTS "classRank" INTEGER;
ALTER TABLE students ADD COLUMN IF NOT EXISTS "totalStudents" INTEGER;

-- 2. Colonnes de progression et activité
ALTER TABLE students ADD COLUMN IF NOT EXISTS "totalLessonsCompleted" INTEGER DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS "totalStudyTimeMinutes" INTEGER DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS "currentStreak" INTEGER DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS "longestStreak" INTEGER DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS "lastActivityAt" TIMESTAMP WITH TIME ZONE;

-- 3. Colonnes de gamification
ALTER TABLE students ADD COLUMN IF NOT EXISTS "experiencePoints" INTEGER DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS "battleStats" JSONB DEFAULT '{}'::jsonb;

-- 4. Colonnes Prix Claudine
ALTER TABLE students ADD COLUMN IF NOT EXISTS "prixClaudineStatus" VARCHAR(50) DEFAULT 'INACTIVE';
ALTER TABLE students ADD COLUMN IF NOT EXISTS "prixClaudineRank" INTEGER;
ALTER TABLE students ADD COLUMN IF NOT EXISTS "claudineAchievements" JSONB DEFAULT '[]'::jsonb;

-- 5. Colonnes de préférences et paramètres
ALTER TABLE students ADD COLUMN IF NOT EXISTS "learningStyle" VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS "preferredLanguage" VARCHAR(10) DEFAULT 'fr';
ALTER TABLE students ADD COLUMN IF NOT EXISTS "difficultySetting" VARCHAR(20) DEFAULT 'MEDIUM';

-- 6. Colonnes de matières (arrays JSONB)
ALTER TABLE students ADD COLUMN IF NOT EXISTS "strongSubjects" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE students ADD COLUMN IF NOT EXISTS "weakSubjects" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE students ADD COLUMN IF NOT EXISTS "subjectPreferences" JSONB DEFAULT '{}'::jsonb;

-- 7. Colonnes de restrictions et besoins spéciaux
ALTER TABLE students ADD COLUMN IF NOT EXISTS "parentalRestrictions" JSONB DEFAULT '{}'::jsonb;
ALTER TABLE students ADD COLUMN IF NOT EXISTS "specialNeeds" TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS "medicalInfo" TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS "emergencyContact" JSONB DEFAULT '{}'::jsonb;

-- 8. Colonnes de statistiques et métadonnées
ALTER TABLE students ADD COLUMN IF NOT EXISTS "detailedStats" JSONB DEFAULT '{}'::jsonb;
ALTER TABLE students ADD COLUMN IF NOT EXISTS "metadata" JSONB DEFAULT '{}'::jsonb;

-- 9. Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_students_currentAverage ON students("currentAverage");
CREATE INDEX IF NOT EXISTS idx_students_currentStreak ON students("currentStreak");
CREATE INDEX IF NOT EXISTS idx_students_lastActivityAt ON students("lastActivityAt");
CREATE INDEX IF NOT EXISTS idx_students_prixClaudineStatus ON students("prixClaudineStatus");
CREATE INDEX IF NOT EXISTS idx_students_prixClaudineRank ON students("prixClaudineRank");

-- 10. Afficher les colonnes ajoutées
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'students'
AND column_name IN (
    'currentAverage', 'lastTermAverage', 'classRank', 'totalStudents',
    'totalLessonsCompleted', 'totalStudyTimeMinutes', 'currentStreak', 'longestStreak', 'lastActivityAt',
    'experiencePoints', 'battleStats',
    'prixClaudineStatus', 'prixClaudineRank', 'claudineAchievements',
    'learningStyle', 'preferredLanguage', 'difficultySetting',
    'strongSubjects', 'weakSubjects', 'subjectPreferences',
    'parentalRestrictions', 'specialNeeds', 'medicalInfo', 'emergencyContact',
    'detailedStats', 'metadata'
)
ORDER BY column_name;

-- Compter le total de colonnes
SELECT COUNT(*) as total_columns FROM information_schema.columns WHERE table_name = 'students';
