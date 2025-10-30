-- ================================
-- CLAUDYNE PRODUCTION SCHEMA
-- Curriculum Camerounais Officiel
-- ================================

SET timezone = 'Africa/Douala';
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des niveaux éducatifs
CREATE TABLE education_levels (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER,
    cycle VARCHAR(50)
);

-- Table des matières
CREATE TABLE subjects (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    education_level_code VARCHAR(20),
    is_active BOOLEAN DEFAULT true
);

-- Table des familles
CREATE TABLE families (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    region VARCHAR(100) DEFAULT 'Centre',
    subscription_status VARCHAR(20) DEFAULT 'ACTIVE',
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des utilisateurs
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    family_id INTEGER REFERENCES families(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'PARENT',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table des étudiants
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    family_id INTEGER REFERENCES families(id),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    education_level_code VARCHAR(20),
    current_average DECIMAL(5,2) DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    claudine_points INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table des leçons
CREATE TABLE lessons (
    id SERIAL PRIMARY KEY,
    subject_id INTEGER REFERENCES subjects(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT,
    education_level_code VARCHAR(20),
    difficulty_level INTEGER DEFAULT 1,
    points_reward INTEGER DEFAULT 10,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table des progrès
CREATE TABLE progress (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    lesson_id INTEGER REFERENCES lessons(id),
    status VARCHAR(20) DEFAULT 'NOT_STARTED',
    score DECIMAL(5,2),
    completed_at TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT NOW()
);

-- DONNÉES CURRICULUM CAMEROUNAIS
-- Niveaux éducatifs
INSERT INTO education_levels (code, name, description, order_index, cycle) VALUES
('SIL', 'Section d''Initiation au Langage', 'Enseignement Maternel', 1, 'Maternel'),
('CP', 'Cours Préparatoire', 'Enseignement Primaire', 2, 'Primaire'),
('CE1', 'Cours Élémentaire 1', 'Enseignement Primaire', 3, 'Primaire'),
('CE2', 'Cours Élémentaire 2', 'Enseignement Primaire', 4, 'Primaire'),
('CM1', 'Cours Moyen 1', 'Enseignement Primaire', 5, 'Primaire'),
('CM2', 'Cours Moyen 2', 'Enseignement Primaire', 6, 'Primaire'),
('6EME', '6ème', 'Premier Cycle Secondaire', 7, 'Secondaire 1'),
('5EME', '5ème', 'Premier Cycle Secondaire', 8, 'Secondaire 1'),
('4EME', '4ème', 'Premier Cycle Secondaire', 9, 'Secondaire 1'),
('3EME', '3ème - BEPC', 'Premier Cycle Secondaire', 10, 'Secondaire 1'),
('2NDE', '2nde', 'Second Cycle Secondaire', 11, 'Secondaire 2'),
('1ERE', '1ère', 'Second Cycle Secondaire', 12, 'Secondaire 2'),
('TERM', 'Terminale - BAC', 'Second Cycle Secondaire', 13, 'Secondaire 2');

-- Matières par niveau
INSERT INTO subjects (code, name, description, education_level_code) VALUES
-- Maternel
('FR_SIL', 'Français SIL', 'Initiation au français', 'SIL'),
('MATH_SIL', 'Mathématiques SIL', 'Initiation aux mathématiques', 'SIL'),
-- Primaire
('FR_CP', 'Français CP', 'Français niveau CP', 'CP'),
('MATH_CP', 'Mathématiques CP', 'Mathématiques niveau CP', 'CP'),
('FR_CE1', 'Français CE1', 'Français niveau CE1', 'CE1'),
('MATH_CE1', 'Mathématiques CE1', 'Mathématiques niveau CE1', 'CE1'),
('FR_CE2', 'Français CE2', 'Français niveau CE2', 'CE2'),
('MATH_CE2', 'Mathématiques CE2', 'Mathématiques niveau CE2', 'CE2'),
('FR_CM1', 'Français CM1', 'Français niveau CM1', 'CM1'),
('MATH_CM1', 'Mathématiques CM1', 'Mathématiques niveau CM1', 'CM1'),
('FR_CM2', 'Français CM2', 'Français niveau CM2', 'CM2'),
('MATH_CM2', 'Mathématiques CM2', 'Mathématiques niveau CM2', 'CM2'),
-- Secondaire - Matières communes
('FR_SEC', 'Français', 'Français secondaire', '6EME'),
('MATH_SEC', 'Mathématiques', 'Mathématiques secondaire', '6EME'),
('ANG_SEC', 'Anglais', 'Anglais secondaire', '6EME'),
('HIST_SEC', 'Histoire-Géographie', 'Histoire-Géographie', '6EME'),
('SCI_PHY', 'Sciences Physiques', 'Physique-Chimie', '6EME'),
('SCI_NAT', 'Sciences Naturelles', 'SVT', '6EME'),
('EDU_CIV', 'Éducation Civique', 'Formation civique', '6EME'),
('INFO', 'Informatique', 'Technologies numériques', '6EME'),
('ARTS', 'Arts et Culture', 'Éducation artistique', '6EME'),
('EPS', 'Éducation Physique', 'Sport et santé', '6EME'),
('PHILO', 'Philosophie', 'Philosophie Terminale', 'TERM'),
('LANG_NAT', 'Langues Nationales', 'Langues camerounaises', '6EME');

-- Index pour performance
CREATE INDEX idx_students_family ON students(family_id);
CREATE INDEX idx_progress_student ON progress(student_id);
CREATE INDEX idx_lessons_level ON lessons(education_level_code);

COMMIT;
