-- ========================================
-- CRÉATION DES TABLES MANQUANTES CLAUDYNE
-- ========================================

\c claudyne_production

-- Table Families (si n'existe pas)
CREATE TABLE IF NOT EXISTS families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    "displayName" VARCHAR(255),
    "subscriptionType" VARCHAR(50) DEFAULT 'TRIAL',
    status VARCHAR(50) DEFAULT 'TRIAL',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table Students (si n'existe pas)
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "firstName" VARCHAR(255) NOT NULL,
    "lastName" VARCHAR(255) NOT NULL,
    "studentClass" VARCHAR(50),
    "familyId" UUID REFERENCES families(id) ON DELETE CASCADE,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ajouter les colonnes manquantes à users (si nécessaire)
DO $$
BEGIN
    -- familyId
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='users' AND column_name='familyId') THEN
        ALTER TABLE users ADD COLUMN "familyId" UUID REFERENCES families(id);
    END IF;

    -- lastLogin
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='users' AND column_name='lastLogin') THEN
        ALTER TABLE users ADD COLUMN "lastLogin" TIMESTAMP WITH TIME ZONE;
    END IF;

    -- isVerified
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='users' AND column_name='isVerified') THEN
        ALTER TABLE users ADD COLUMN "isVerified" BOOLEAN DEFAULT false;
    END IF;

    -- updatedAt
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='users' AND column_name='updatedAt') THEN
        ALTER TABLE users ADD COLUMN "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
END$$;

-- Afficher le résultat
SELECT 'Tables créées/mises à jour:' as message;
\dt

SELECT 'Colonnes table users:' as message;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

SELECT 'MIGRATION TERMINÉE ✅' as status;
