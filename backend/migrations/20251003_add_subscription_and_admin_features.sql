-- Migration: Ajouter gestion des abonnements et fonctionnalités admin
-- Date: 2025-10-03
-- Description: Ajout de colonnes pour gérer les abonnements individuels (STUDENT 8000 FCFA, TEACHER)
--              et permettre aux admins de désactiver des comptes (PARENT, STUDENT, TEACHER, MODERATOR, ADMIN)

-- =====================================================
-- 1. MODIFIER LES ENUMS EXISTANTS
-- =====================================================

-- Ajouter 'TEACHER' au role ENUM
ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'TEACHER';

-- Ajouter 'INDIVIDUAL' au userType ENUM
ALTER TYPE "enum_users_userType" ADD VALUE IF NOT EXISTS 'INDIVIDUAL';

-- =====================================================
-- 2. CRÉER LES NOUVEAUX ENUMS
-- =====================================================

-- Créer ENUM pour subscriptionStatus
DO $$ BEGIN
    CREATE TYPE enum_users_subscriptionStatus AS ENUM ('TRIAL', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Créer ENUM pour subscriptionPlan
DO $$ BEGIN
    CREATE TYPE enum_users_subscriptionPlan AS ENUM ('INDIVIDUAL_STUDENT', 'INDIVIDUAL_TEACHER', 'FAMILY_MANAGER', 'NONE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 3. AJOUTER LES COLONNES D'ABONNEMENT
-- =====================================================

-- Statut de l'abonnement
ALTER TABLE users
ADD COLUMN IF NOT EXISTS "subscriptionStatus" enum_users_subscriptionStatus DEFAULT 'TRIAL';

-- Plan d'abonnement
ALTER TABLE users
ADD COLUMN IF NOT EXISTS "subscriptionPlan" enum_users_subscriptionPlan DEFAULT 'NONE';

-- Date de fin d'essai (7 jours)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP WITH TIME ZONE;

-- Date de début de l'abonnement payant
ALTER TABLE users
ADD COLUMN IF NOT EXISTS "subscriptionStartedAt" TIMESTAMP WITH TIME ZONE;

-- Date de fin de l'abonnement (renouvellement mensuel)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS "subscriptionEndsAt" TIMESTAMP WITH TIME ZONE;

-- Date d'annulation de l'abonnement
ALTER TABLE users
ADD COLUMN IF NOT EXISTS "subscriptionCancelledAt" TIMESTAMP WITH TIME ZONE;

-- Prix mensuel en FCFA (8000 pour STUDENT, 15000 pour Family)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS "monthlyPrice" DECIMAL(10, 2) DEFAULT 0.00;

-- Date du dernier paiement
ALTER TABLE users
ADD COLUMN IF NOT EXISTS "lastPaymentDate" TIMESTAMP WITH TIME ZONE;

-- Date du prochain paiement (renouvellement automatique)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS "nextPaymentDate" TIMESTAMP WITH TIME ZONE;

-- Renouvellement automatique
ALTER TABLE users
ADD COLUMN IF NOT EXISTS "autoRenew" BOOLEAN DEFAULT TRUE;

-- =====================================================
-- 4. AJOUTER LES COLONNES DE DÉSACTIVATION ADMIN
-- =====================================================

-- ID de l'admin qui a désactivé le compte
ALTER TABLE users
ADD COLUMN IF NOT EXISTS "disabledBy" UUID REFERENCES users(id);

-- Date de désactivation par l'admin
ALTER TABLE users
ADD COLUMN IF NOT EXISTS "disabledAt" TIMESTAMP WITH TIME ZONE;

-- Raison de la désactivation
ALTER TABLE users
ADD COLUMN IF NOT EXISTS "disableReason" TEXT;

-- =====================================================
-- 5. AJOUTER DES INDEX POUR LES PERFORMANCES
-- =====================================================

-- Index sur subscriptionStatus pour filtrer les abonnements actifs/expirés
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users("subscriptionStatus");

-- Index sur subscriptionPlan pour filtrer par type d'abonnement
CREATE INDEX IF NOT EXISTS idx_users_subscription_plan ON users("subscriptionPlan");

-- Index sur trialEndsAt pour identifier les essais qui expirent bientôt
CREATE INDEX IF NOT EXISTS idx_users_trial_ends_at ON users("trialEndsAt");

-- Index sur subscriptionEndsAt pour identifier les abonnements qui expirent bientôt
CREATE INDEX IF NOT EXISTS idx_users_subscription_ends_at ON users("subscriptionEndsAt");

-- Index sur disabledBy pour retrouver tous les comptes désactivés par un admin
CREATE INDEX IF NOT EXISTS idx_users_disabled_by ON users("disabledBy");

-- Index sur nextPaymentDate pour gérer les renouvellements automatiques
CREATE INDEX IF NOT EXISTS idx_users_next_payment_date ON users("nextPaymentDate");

-- =====================================================
-- 6. AJOUTER DES COMMENTAIRES
-- =====================================================

COMMENT ON COLUMN users."subscriptionStatus" IS 'Statut de l''abonnement individuel (pour STUDENT, TEACHER)';
COMMENT ON COLUMN users."subscriptionPlan" IS 'Type d''abonnement: INDIVIDUAL_STUDENT (8000 FCFA/mois), FAMILY_MANAGER (15000 FCFA/mois via Family)';
COMMENT ON COLUMN users."trialEndsAt" IS '7 jours d''essai gratuit pour tous les comptes';
COMMENT ON COLUMN users."subscriptionStartedAt" IS 'Date de début de l''abonnement payant';
COMMENT ON COLUMN users."subscriptionEndsAt" IS 'Date de fin de l''abonnement (renouvellement mensuel)';
COMMENT ON COLUMN users."subscriptionCancelledAt" IS 'Date d''annulation de l''abonnement';
COMMENT ON COLUMN users."monthlyPrice" IS 'Prix mensuel de l''abonnement en FCFA (8000 pour STUDENT, 15000 pour Family)';
COMMENT ON COLUMN users."lastPaymentDate" IS 'Date du dernier paiement';
COMMENT ON COLUMN users."nextPaymentDate" IS 'Date du prochain paiement (renouvellement automatique)';
COMMENT ON COLUMN users."autoRenew" IS 'Renouvellement automatique de l''abonnement';
COMMENT ON COLUMN users."disabledBy" IS 'ID de l''admin qui a désactivé ce compte';
COMMENT ON COLUMN users."disabledAt" IS 'Date de désactivation du compte par un admin';
COMMENT ON COLUMN users."disableReason" IS 'Raison de la désactivation du compte';

-- =====================================================
-- 7. MIGRATION DES DONNÉES EXISTANTES (optionnel)
-- =====================================================

-- Mettre à jour les utilisateurs PARENT existants pour utiliser FAMILY_MANAGER
UPDATE users
SET "subscriptionPlan" = 'FAMILY_MANAGER'
WHERE role = 'PARENT' AND "familyId" IS NOT NULL;

-- Mettre à jour les utilisateurs STUDENT existants (si il y en a)
UPDATE users
SET "subscriptionPlan" = 'INDIVIDUAL_STUDENT',
    "monthlyPrice" = 8000.00
WHERE role = 'STUDENT' AND "familyId" IS NULL;

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

-- Afficher un message de confirmation
DO $$ BEGIN
    RAISE NOTICE 'Migration terminée avec succès!';
    RAISE NOTICE '  - Ajout de TEACHER au rôle';
    RAISE NOTICE '  - Ajout de INDIVIDUAL au userType';
    RAISE NOTICE '  - Ajout de 10 colonnes d''abonnement';
    RAISE NOTICE '  - Ajout de 3 colonnes de désactivation admin';
    RAISE NOTICE '  - Ajout de 6 index pour les performances';
    RAISE NOTICE 'Les admins peuvent maintenant désactiver tous types de comptes!';
    RAISE NOTICE 'Les STUDENT individuels paient 8000 FCFA/mois avec 7 jours d''essai!';
END $$;
