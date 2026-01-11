-- Création complète de la table families avec toutes les colonnes
CREATE TABLE IF NOT EXISTS families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    "displayName" VARCHAR(255),

    -- Adresse
    address TEXT,
    city VARCHAR(100),
    region VARCHAR(50),
    country VARCHAR(100) DEFAULT 'Cameroun',

    -- Configuration
    "maxMembers" INTEGER DEFAULT 6,
    "currentMembersCount" INTEGER DEFAULT 1,

    -- Statut et abonnement
    status VARCHAR(50) DEFAULT 'TRIAL',
    "subscriptionType" VARCHAR(50) DEFAULT 'TRIAL',
    "subscriptionStatus" VARCHAR(50) DEFAULT 'ACTIVE',
    "trialEndsAt" TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    "subscriptionEndsAt" TIMESTAMP WITH TIME ZONE,

    -- Finances
    "walletBalance" DECIMAL(10,2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'FCFA',

    -- Prix Claudine
    "totalClaudinePoints" INTEGER DEFAULT 0,
    "claudineRank" INTEGER,
    "claudineLastUpdate" TIMESTAMP WITH TIME ZONE,

    -- Préférences
    language VARCHAR(10) DEFAULT 'fr',
    timezone VARCHAR(50) DEFAULT 'Africa/Douala',

    -- JSONB
    "parentalControls" JSONB DEFAULT '{"chatEnabled":true,"battleRoyaleEnabled":true,"maxDailyScreenTime":180}'::jsonb,
    "notificationPreferences" JSONB DEFAULT '{"weeklyReports":true,"progressUpdates":true}'::jsonb,
    "emergencyContact" JSONB,
    "billingInfo" JSONB,
    stats JSONB DEFAULT '{"totalLessonsCompleted":0,"totalBattlesJoined":0}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    "trialConfig" JSONB DEFAULT '{}'::jsonb,

    -- Audit
    "termsAcceptedAt" TIMESTAMP WITH TIME ZONE,
    "privacyPolicyAcceptedAt" TIMESTAMP WITH TIME ZONE,
    "dataProcessingConsent" BOOLEAN DEFAULT false,
    "lastActivityAt" TIMESTAMP WITH TIME ZONE,
    "deletedAt" TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Recréer la table students avec foreign key
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "firstName" VARCHAR(255) NOT NULL,
    "lastName" VARCHAR(255) NOT NULL,
    "studentClass" VARCHAR(50),
    "familyId" UUID REFERENCES families(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

SELECT 'Tables families et students créées avec succès' AS result;
