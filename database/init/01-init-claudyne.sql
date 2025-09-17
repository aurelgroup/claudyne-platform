-- ================================
-- INITIALISATION BASE DE DONNÉES CLAUDYNE
-- ================================
-- Optimisée pour performance et réseaux 2G/3G Cameroun

-- Configuration initiale
SET timezone = 'Africa/Douala';
SET default_text_search_config = 'french';

-- Extensions utiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- Pour recherche fulltext

-- ================================
-- OPTIMISATIONS PERFORMANCE
-- ================================

-- Index pour recherche rapide des familles
CREATE INDEX IF NOT EXISTS idx_families_active
ON families (status, subscription_status)
WHERE status = 'ACTIVE';

-- Index pour les étudiants actifs
CREATE INDEX IF NOT EXISTS idx_students_active
ON students (status, family_id)
WHERE status = 'ACTIVE';

-- Index pour les progrès récents
CREATE INDEX IF NOT EXISTS idx_progress_recent
ON progress (student_id, last_activity_at DESC)
WHERE last_activity_at > NOW() - INTERVAL '30 days';

-- Index pour les paiements
CREATE INDEX IF NOT EXISTS idx_payments_status_date
ON payments (status, created_at DESC, family_id);

-- Index pour les notifications non lues
CREATE INDEX IF NOT EXISTS idx_notifications_unread
ON notifications (user_id, is_read, created_at DESC)
WHERE is_read = false;

-- Index fulltext pour recherche de contenu
CREATE INDEX IF NOT EXISTS idx_lessons_search
ON lessons USING gin(to_tsvector('french', title || ' ' || description));

-- ================================
-- VUES OPTIMISÉES POUR DASHBOARD
-- ================================

-- Vue des statistiques famille
CREATE OR REPLACE VIEW family_statistics AS
SELECT
    f.id as family_id,
    f.name,
    f.subscription_status,
    COUNT(DISTINCT s.id) as total_students,
    COUNT(DISTINCT CASE WHEN s.status = 'ACTIVE' THEN s.id END) as active_students,
    COALESCE(SUM(s.total_points), 0) as total_family_points,
    COALESCE(AVG(s.current_average), 0) as average_family_score,
    COALESCE(SUM(s.total_study_time_minutes), 0) as total_study_time,
    MAX(s.last_activity_at) as last_family_activity
FROM families f
LEFT JOIN students s ON s.family_id = f.id
WHERE f.status = 'ACTIVE'
GROUP BY f.id, f.name, f.subscription_status;

-- Vue des performances étudiants
CREATE OR REPLACE VIEW student_performance AS
SELECT
    s.id as student_id,
    s.first_name,
    s.last_name,
    s.education_level,
    s.current_average,
    s.total_points,
    s.claudine_points,
    s.current_streak,
    s.longest_streak,
    COUNT(DISTINCT p.lesson_id) as lessons_completed,
    COUNT(DISTINCT CASE WHEN p.status = 'COMPLETED' AND p.completed_at > NOW() - INTERVAL '7 days' THEN p.lesson_id END) as lessons_this_week,
    COALESCE(AVG(CASE WHEN p.status = 'COMPLETED' THEN p.score END), 0) as average_score,
    MAX(p.last_activity_at) as last_activity
FROM students s
LEFT JOIN progress p ON p.student_id = s.id
WHERE s.status = 'ACTIVE'
GROUP BY s.id, s.first_name, s.last_name, s.education_level,
         s.current_average, s.total_points, s.claudine_points,
         s.current_streak, s.longest_streak;

-- ================================
-- FONCTIONS UTILITAIRES
-- ================================

-- Fonction pour calculer le niveau d'un étudiant
CREATE OR REPLACE FUNCTION calculate_student_level(student_points INTEGER)
RETURNS INTEGER AS $$
BEGIN
    -- Système de niveaux basé sur les points
    CASE
        WHEN student_points < 100 THEN RETURN 1;
        WHEN student_points < 500 THEN RETURN 2;
        WHEN student_points < 1000 THEN RETURN 3;
        WHEN student_points < 2500 THEN RETURN 4;
        WHEN student_points < 5000 THEN RETURN 5;
        WHEN student_points < 10000 THEN RETURN 6;
        WHEN student_points < 20000 THEN RETURN 7;
        WHEN student_points < 35000 THEN RETURN 8;
        WHEN student_points < 50000 THEN RETURN 9;
        ELSE RETURN 10;
    END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fonction pour mettre à jour la moyenne famille
CREATE OR REPLACE FUNCTION update_family_average()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE families
    SET current_average = (
        SELECT COALESCE(AVG(current_average), 0)
        FROM students
        WHERE family_id = NEW.family_id AND status = 'ACTIVE'
    ),
    total_points = (
        SELECT COALESCE(SUM(total_points), 0)
        FROM students
        WHERE family_id = NEW.family_id AND status = 'ACTIVE'
    ),
    last_activity_at = NOW()
    WHERE id = NEW.family_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mise à jour automatique
DROP TRIGGER IF EXISTS trigger_update_family_stats ON students;
CREATE TRIGGER trigger_update_family_stats
    AFTER UPDATE OF current_average, total_points ON students
    FOR EACH ROW
    EXECUTE FUNCTION update_family_average();

-- ================================
-- POLITIQUE DE NETTOYAGE AUTOMATIQUE
-- ================================

-- Fonction de nettoyage des données anciennes
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- Supprimer les sessions expirées (+ de 30 jours)
    DELETE FROM user_sessions
    WHERE created_at < NOW() - INTERVAL '30 days';

    -- Archiver les notifications anciennes (+ de 90 jours)
    UPDATE notifications
    SET archived = true
    WHERE created_at < NOW() - INTERVAL '90 days'
    AND archived = false;

    -- Supprimer les logs anciens (+ de 6 mois)
    DELETE FROM audit_logs
    WHERE created_at < NOW() - INTERVAL '6 months';

    -- Nettoyer les tokens expirés
    DELETE FROM password_reset_tokens
    WHERE expires_at < NOW();

    RAISE NOTICE 'Nettoyage automatique terminé à %', NOW();
END;
$$ LANGUAGE plpgsql;

-- ================================
-- DONNÉES DE DÉMONSTRATION (OPTIONNEL)
-- ================================

-- Fonction pour créer des données de test
CREATE OR REPLACE FUNCTION create_demo_data()
RETURNS void AS $$
DECLARE
    demo_family_id UUID;
    demo_user_id UUID;
    demo_student_id UUID;
BEGIN
    -- Vérifier si les données de démo existent déjà
    IF EXISTS (SELECT 1 FROM families WHERE name = 'Famille Démo Claudyne') THEN
        RAISE NOTICE 'Données de démonstration déjà présentes';
        RETURN;
    END IF;

    RAISE NOTICE 'Création des données de démonstration...';

    -- Créer famille de démonstration
    INSERT INTO families (id, name, display_name, subscription_type, subscription_status, status)
    VALUES (
        uuid_generate_v4(),
        'Famille Démo Claudyne',
        'Famille Démo',
        'PREMIUM',
        'ACTIVE',
        'ACTIVE'
    ) RETURNING id INTO demo_family_id;

    -- Créer utilisateur de démonstration
    INSERT INTO users (id, email, password_hash, first_name, last_name, role, family_id, interface_type, is_active)
    VALUES (
        uuid_generate_v4(),
        'demo@claudyne.com',
        '$2b$10$dummy.hash.for.demo.user.only',  -- Mot de passe: demo123
        'Parent',
        'Démo',
        'MANAGER',
        demo_family_id,
        'MANAGER',
        true
    ) RETURNING id INTO demo_user_id;

    -- Créer étudiant de démonstration
    INSERT INTO students (id, family_id, user_id, first_name, last_name, education_level, student_type, status, current_average, total_points)
    VALUES (
        uuid_generate_v4(),
        demo_family_id,
        demo_user_id,
        'Élève',
        'Démo',
        'COLLEGE',
        'REGULAR',
        'ACTIVE',
        85.5,
        1250
    ) RETURNING id INTO demo_student_id;

    RAISE NOTICE 'Données de démonstration créées avec succès';
    RAISE NOTICE 'Email: demo@claudyne.com';
    RAISE NOTICE 'Mot de passe: demo123';
END;
$$ LANGUAGE plpgsql;

-- ================================
-- CONFIGURATION FINALE
-- ================================

-- Optimisations spécifiques PostgreSQL
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET max_connections = '100';

-- Configuration pour réseaux lents
ALTER SYSTEM SET tcp_keepalives_idle = '600';
ALTER SYSTEM SET tcp_keepalives_interval = '30';
ALTER SYSTEM SET tcp_keepalives_count = '3';

-- Logs optimisés
ALTER SYSTEM SET log_statement = 'mod';
ALTER SYSTEM SET log_min_duration_statement = '1000';  -- Log requêtes > 1s
ALTER SYSTEM SET log_connections = on;
ALTER SYSTEM SET log_disconnections = on;

-- Recharger la configuration
SELECT pg_reload_conf();

RAISE NOTICE 'Initialisation Claudyne terminée avec succès !';
RAISE NOTICE 'Base de données optimisée pour le Cameroun';
RAISE NOTICE 'Timezone: Africa/Douala';
RAISE NOTICE 'Encodage: UTF-8 Français';