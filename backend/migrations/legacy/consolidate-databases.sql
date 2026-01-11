-- =====================================================
-- SCRIPT DE CONSOLIDATION DES BASES CLAUDYNE
-- =====================================================
-- Objectif: Migrer claudyne_production → claudyne_prod
-- Puis supprimer claudyne_production
-- =====================================================

-- ÉTAPE 1: Analyser le contenu des deux bases
-- =====================================================

\echo '=== ANALYSE claudyne_prod ==='
\c claudyne_prod
SELECT 'claudyne_prod - Nombre utilisateurs:' as info, COUNT(*) as count FROM users;
SELECT 'claudyne_prod - Derniers utilisateurs:' as info;
SELECT id, email, "firstName", "lastName", role, "createdAt"
FROM users
ORDER BY "createdAt" DESC
LIMIT 5;

\echo ''
\echo '=== ANALYSE claudyne_production ==='
\c claudyne_production
SELECT 'claudyne_production - Nombre utilisateurs:' as info, COUNT(*) as count FROM users;
SELECT 'claudyne_production - Derniers utilisateurs:' as info;
SELECT id, email, "firstName", "lastName", role, "createdAt"
FROM users
ORDER BY "createdAt" DESC
LIMIT 5;

\echo ''
\echo '=== VÉRIFICATION: Y a-t-il des utilisateurs uniques dans claudyne_production? ==='
\c claudyne_production
SELECT 'Utilisateurs dans claudyne_production mais PAS dans claudyne_prod:' as info;
SELECT id, email, "firstName", "lastName", role, "createdAt"
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM dblink('dbname=claudyne_prod user=claudyne_user password=aujourdhui18D@',
    'SELECT id FROM users WHERE email = ''' || u.email || '''') AS t(id INT)
)
LIMIT 10;

\echo ''
\echo '✅ ANALYSE TERMINÉE'
\echo 'Examinez les résultats ci-dessus avant de continuer.'
\echo ''
\echo 'Pour continuer la migration, exécutez: consolidate-databases-part2.sql'
