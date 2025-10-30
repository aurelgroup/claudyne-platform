-- Migration: Ajout des colonnes manquantes à la table students
-- Date: 22 Octobre 2025
-- Description: Ajoute schoolType, claudinePoints et studentType

-- 1. Créer le type ENUM pour schoolType (si pas déjà existant)
DO $$ BEGIN
    CREATE TYPE school_type_enum AS ENUM ('PUBLIC', 'PRIVE_LAIQUE', 'PRIVE_CONFESSIONNEL', 'INTERNATIONAL', 'DOMICILE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Créer le type ENUM pour studentType (si pas déjà existant)
DO $$ BEGIN
    CREATE TYPE student_type_enum AS ENUM ('CHILD', 'ADULT_LEARNER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Ajouter la colonne schoolType si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='students' AND column_name='schoolType') THEN
        ALTER TABLE students ADD COLUMN "schoolType" school_type_enum;
        RAISE NOTICE 'Colonne schoolType ajoutée';
    ELSE
        RAISE NOTICE 'Colonne schoolType existe déjà';
    END IF;
END $$;

-- 4. Ajouter la colonne studentType si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='students' AND column_name='studentType') THEN
        ALTER TABLE students ADD COLUMN "studentType" student_type_enum NOT NULL DEFAULT 'CHILD';
        RAISE NOTICE 'Colonne studentType ajoutée';
    ELSE
        RAISE NOTICE 'Colonne studentType existe déjà';
    END IF;
END $$;

-- 5. Ajouter la colonne claudinePoints si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='students' AND column_name='claudinePoints') THEN
        ALTER TABLE students ADD COLUMN "claudinePoints" INTEGER NOT NULL DEFAULT 0;
        RAISE NOTICE 'Colonne claudinePoints ajoutée';
    ELSE
        RAISE NOTICE 'Colonne claudinePoints existe déjà';
    END IF;
END $$;

-- 6. Créer des index pour améliorer les performances
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_students_schoolType') THEN
        CREATE INDEX idx_students_schoolType ON students("schoolType");
        RAISE NOTICE 'Index idx_students_schoolType créé';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_students_studentType') THEN
        CREATE INDEX idx_students_studentType ON students("studentType");
        RAISE NOTICE 'Index idx_students_studentType créé';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_students_claudinePoints') THEN
        CREATE INDEX idx_students_claudinePoints ON students("claudinePoints");
        RAISE NOTICE 'Index idx_students_claudinePoints créé';
    END IF;
END $$;

-- 7. Vérification finale
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'students'
AND column_name IN ('schoolType', 'studentType', 'claudinePoints')
ORDER BY column_name;

-- Afficher le nombre de lignes dans la table
SELECT COUNT(*) as total_students FROM students;
