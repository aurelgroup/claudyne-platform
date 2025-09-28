-- ================================
-- CLAUDYNE PRODUCTION DATABASE SETUP
-- Configuration complète PostgreSQL
-- ================================

-- 1. CRÉATION BASE ET UTILISATEUR
CREATE DATABASE claudyne_production
    WITH ENCODING 'UTF8'
    LC_COLLATE = 'fr_FR.UTF-8'
    LC_CTYPE = 'fr_FR.UTF-8'
    TEMPLATE template0;

CREATE USER claudyne_user WITH ENCRYPTED PASSWORD 'aujourdhui18D@';
GRANT ALL PRIVILEGES ON DATABASE claudyne_production TO claudyne_user;

-- Se connecter à la base
\c claudyne_production;

-- 2. ACCORDER TOUS LES PRIVILÈGES
GRANT ALL ON SCHEMA public TO claudyne_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO claudyne_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO claudyne_user;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO claudyne_user;

-- 3. DÉFINIR LES PRIVILÈGES PAR DÉFAUT
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO claudyne_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO claudyne_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO claudyne_user;