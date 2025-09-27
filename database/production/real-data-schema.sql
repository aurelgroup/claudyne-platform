-- ================================
-- CLAUDYNE PRODUCTION SCHEMA - DONNÉES RÉELLES
-- ================================
-- Structure pour données de production Cameroun
-- Supprime complètement les données de démonstration

-- Configuration pour production
SET timezone = 'Africa/Douala';
SET default_text_search_config = 'french';

-- Extensions requises
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ================================
-- SUPPRESSION DONNÉES DÉMO/TEST
-- ================================

-- Supprimer toutes les données de test/démo
DELETE FROM progress WHERE student_id IN (
    SELECT id FROM students WHERE first_name LIKE '%Démo%' OR first_name LIKE '%Test%'
);

DELETE FROM students WHERE first_name LIKE '%Démo%' OR first_name LIKE '%Test%';

DELETE FROM users WHERE email LIKE '%demo%' OR email LIKE '%test%';

DELETE FROM families WHERE name LIKE '%Démo%' OR name LIKE '%Test%';

-- Supprimer les données mock
DELETE FROM lessons WHERE title LIKE '%Mock%' OR title LIKE '%Test%';
DELETE FROM battles WHERE title LIKE '%Mock%' OR title LIKE '%Test%';

-- Reset des séquences
ALTER SEQUENCE IF EXISTS families_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS users_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS students_id_seq RESTART WITH 1;

-- ================================
-- STRUCTURE PRODUCTION OPTIMISÉE
-- ================================

-- Vérification de l'intégrité référentielle
ALTER TABLE students ADD CONSTRAINT fk_students_family
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE;

ALTER TABLE progress ADD CONSTRAINT fk_progress_student
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

ALTER TABLE payments ADD CONSTRAINT fk_payments_family
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE;

-- ================================
-- DONNÉES PRODUCTION INITIALES
-- ================================

-- Types d'éducation Cameroun
INSERT INTO education_levels (code, name, description, order_index) VALUES
('CP', 'Cours Préparatoire', 'Première année du primaire', 1),
('CE1', 'Cours Élémentaire 1', 'Deuxième année du primaire', 2),
('CE2', 'Cours Élémentaire 2', 'Troisième année du primaire', 3),
('CM1', 'Cours Moyen 1', 'Quatrième année du primaire', 4),
('CM2', 'Cours Moyen 2', 'Cinquième année du primaire', 5),
('6EME', 'Sixième', 'Première année du collège', 6),
('5EME', 'Cinquième', 'Deuxième année du collège', 7),
('4EME', 'Quatrième', 'Troisième année du collège', 8),
('3EME', 'Troisième', 'Dernière année du collège', 9),
('2NDE', 'Seconde', 'Première année du lycée', 10),
('1ERE', 'Première', 'Deuxième année du lycée', 11),
('TALE', 'Terminale', 'Dernière année du lycée', 12)
ON CONFLICT (code) DO NOTHING;

-- Matières du curriculum camerounais
INSERT INTO subjects (code, name, description, education_levels) VALUES
('MATH', 'Mathématiques', 'Algèbre, géométrie, statistiques', ARRAY['CP','CE1','CE2','CM1','CM2','6EME','5EME','4EME','3EME','2NDE','1ERE','TALE']),
('FRANCAIS', 'Français', 'Grammaire, orthographe, littérature', ARRAY['CP','CE1','CE2','CM1','CM2','6EME','5EME','4EME','3EME','2NDE','1ERE','TALE']),
('ANGLAIS', 'Anglais', 'Langue anglaise', ARRAY['CE1','CE2','CM1','CM2','6EME','5EME','4EME','3EME','2NDE','1ERE','TALE']),
('SVT', 'Sciences de la Vie et de la Terre', 'Biologie, géologie', ARRAY['6EME','5EME','4EME','3EME','2NDE','1ERE','TALE']),
('PHYSIQUE', 'Physique-Chimie', 'Sciences physiques', ARRAY['4EME','3EME','2NDE','1ERE','TALE']),
('HISTOIRE', 'Histoire-Géographie', 'Histoire et géographie', ARRAY['CE2','CM1','CM2','6EME','5EME','4EME','3EME','2NDE','1ERE','TALE']),
('ECM', 'Éducation Civique et Morale', 'Citoyenneté camerounaise', ARRAY['CP','CE1','CE2','CM1','CM2','6EME','5EME','4EME','3EME']),
('EPS', 'Éducation Physique et Sportive', 'Sport et santé', ARRAY['CP','CE1','CE2','CM1','CM2','6EME','5EME','4EME','3EME','2NDE','1ERE','TALE'])
ON CONFLICT (code) DO NOTHING;

-- Plans d'abonnement Cameroun
INSERT INTO subscription_plans (code, name, description, price_xaf, price_eur, duration_days, features) VALUES
('BASIC', 'Claudyne Basic', 'Accès de base pour 1 enfant', 5000, 8, 30, ARRAY['1_enfant', 'lecons_basiques', 'support_email']),
('FAMILY', 'Claudyne Famille', 'Accès famille pour 3 enfants max', 12000, 18, 30, ARRAY['3_enfants', 'lecons_avancees', 'rapports_parentaux', 'support_prioritaire']),
('PREMIUM', 'Claudyne Premium', 'Accès illimité avec IA', 25000, 38, 30, ARRAY['enfants_illimites', 'ia_personnalisee', 'rapports_detailles', 'support_vip', 'offline_mode']),
('ANNUAL_FAMILY', 'Famille Annuelle', 'Plan famille pour un an', 120000, 180, 365, ARRAY['3_enfants', 'lecons_avancees', 'rapports_parentaux', 'support_prioritaire', 'reduction_annuelle']),
('ANNUAL_PREMIUM', 'Premium Annuelle', 'Plan premium pour un an', 250000, 380, 365, ARRAY['enfants_illimites', 'ia_personnalisee', 'rapports_detailles', 'support_vip', 'offline_mode', 'reduction_annuelle'])
ON CONFLICT (code) DO NOTHING;

-- Méthodes de paiement Cameroun
INSERT INTO payment_methods (code, name, provider, is_active, countries) VALUES
('MTN_MOMO', 'MTN Mobile Money', 'MTN Cameroon', true, ARRAY['CM']),
('ORANGE_MONEY', 'Orange Money', 'Orange Cameroon', true, ARRAY['CM']),
('EXPRESS_UNION', 'Express Union', 'Express Union', true, ARRAY['CM']),
('VISA_CARD', 'Carte Visa', 'Visa', true, ARRAY['CM','FR','US']),
('MASTERCARD', 'Carte MasterCard', 'MasterCard', true, ARRAY['CM','FR','US']),
('BANK_TRANSFER', 'Virement Bancaire', 'Banques Cameroun', true, ARRAY['CM'])
ON CONFLICT (code) DO NOTHING;

-- ================================
-- VUES PRODUCTION OPTIMISÉES
-- ================================

-- Vue complète des familles actives
CREATE OR REPLACE VIEW active_families_full AS
SELECT
    f.id,
    f.name,
    f.display_name,
    f.subscription_type,
    f.subscription_status,
    f.subscription_expires_at,
    f.current_average,
    f.total_points,
    COUNT(DISTINCT s.id) as total_children,
    COUNT(DISTINCT CASE WHEN s.status = 'ACTIVE' THEN s.id END) as active_children,
    COALESCE(SUM(s.total_study_time_minutes), 0) as total_study_time,
    MAX(s.last_activity_at) as last_activity,
    CASE
        WHEN f.subscription_expires_at < NOW() THEN 'EXPIRED'
        WHEN f.subscription_expires_at < NOW() + INTERVAL '7 days' THEN 'EXPIRING_SOON'
        ELSE 'ACTIVE'
    END as subscription_health
FROM families f
LEFT JOIN students s ON s.family_id = f.id
WHERE f.status = 'ACTIVE'
GROUP BY f.id, f.name, f.display_name, f.subscription_type,
         f.subscription_status, f.subscription_expires_at,
         f.current_average, f.total_points;

-- Vue des performances par matière
CREATE OR REPLACE VIEW subject_performance AS
SELECT
    s.id as student_id,
    s.first_name,
    s.last_name,
    s.education_level,
    sub.name as subject_name,
    COUNT(p.id) as total_lessons,
    COUNT(CASE WHEN p.status = 'COMPLETED' THEN 1 END) as completed_lessons,
    COALESCE(AVG(CASE WHEN p.status = 'COMPLETED' THEN p.score END), 0) as average_score,
    MAX(p.last_activity_at) as last_activity,
    SUM(p.study_time_minutes) as total_study_time
FROM students s
CROSS JOIN subjects sub
LEFT JOIN lessons l ON l.subject_code = sub.code
    AND sub.education_levels @> ARRAY[s.education_level]
LEFT JOIN progress p ON p.student_id = s.id AND p.lesson_id = l.id
WHERE s.status = 'ACTIVE'
GROUP BY s.id, s.first_name, s.last_name, s.education_level, sub.name, sub.code
ORDER BY s.last_name, s.first_name, sub.name;

-- ================================
-- FONCTIONS ANALYTICS PRODUCTION
-- ================================

-- Fonction pour calculer les métriques famille
CREATE OR REPLACE FUNCTION get_family_metrics(family_uuid UUID)
RETURNS TABLE (
    total_students INTEGER,
    active_students INTEGER,
    total_points BIGINT,
    average_score NUMERIC,
    total_study_hours NUMERIC,
    lessons_completed INTEGER,
    current_streak INTEGER,
    subscription_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(s.id)::INTEGER,
        COUNT(CASE WHEN s.status = 'ACTIVE' THEN 1 END)::INTEGER,
        COALESCE(SUM(s.total_points), 0),
        COALESCE(AVG(s.current_average), 0),
        COALESCE(SUM(s.total_study_time_minutes), 0) / 60.0,
        COUNT(DISTINCT p.lesson_id)::INTEGER,
        MAX(s.current_streak)::INTEGER,
        f.subscription_status
    FROM families f
    LEFT JOIN students s ON s.family_id = f.id
    LEFT JOIN progress p ON p.student_id = s.id AND p.status = 'COMPLETED'
    WHERE f.id = family_uuid
    GROUP BY f.subscription_status;
END;
$$ LANGUAGE plpgsql;

-- Fonction de nettoyage production
CREATE OR REPLACE FUNCTION cleanup_production_data()
RETURNS void AS $$
BEGIN
    -- Supprimer sessions expirées
    DELETE FROM user_sessions WHERE expires_at < NOW();

    -- Archiver notifications anciennes
    UPDATE notifications
    SET archived = true
    WHERE created_at < NOW() - INTERVAL '90 days' AND archived = false;

    -- Supprimer tokens expirés
    DELETE FROM password_reset_tokens WHERE expires_at < NOW();

    -- Optimiser les statistiques
    ANALYZE;

    RAISE NOTICE 'Nettoyage production terminé à %', NOW();
END;
$$ LANGUAGE plpgsql;

-- ================================
-- SÉCURITÉ PRODUCTION
-- ================================

-- Politique de sécurité stricte
ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL;
ALTER TABLE families ALTER COLUMN status SET DEFAULT 'ACTIVE';
ALTER TABLE students ALTER COLUMN status SET DEFAULT 'ACTIVE';

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_families_subscription_active
ON families (subscription_status, status)
WHERE status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_students_family_active
ON students (family_id, status, last_activity_at DESC)
WHERE status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_progress_student_recent
ON progress (student_id, last_activity_at DESC, status)
WHERE last_activity_at > NOW() - INTERVAL '30 days';

-- ================================
-- CONFIGURATION FINALE PRODUCTION
-- ================================

-- Logs optimisés pour production
ALTER SYSTEM SET log_statement = 'ddl';
ALTER SYSTEM SET log_min_duration_statement = '2000';
ALTER SYSTEM SET log_connections = off;
ALTER SYSTEM SET log_disconnections = off;

-- Performance production
ALTER SYSTEM SET shared_buffers = '512MB';
ALTER SYSTEM SET effective_cache_size = '2GB';
ALTER SYSTEM SET work_mem = '8MB';
ALTER SYSTEM SET maintenance_work_mem = '128MB';

-- Recharger configuration
SELECT pg_reload_conf();

-- Statistiques finales
ANALYZE;

RAISE NOTICE '✅ Schema production Claudyne configuré';
RAISE NOTICE '✅ Données de démonstration supprimées';
RAISE NOTICE '✅ Structure optimisée pour le Cameroun';
RAISE NOTICE '✅ Prêt pour données réelles de production';