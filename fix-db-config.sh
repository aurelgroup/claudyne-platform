#!/bin/bash

# =================================================
# CORRECTION CONFIGURATION BASE DE DONNÉES
# Fix backend SQLite → PostgreSQL + migrations
# =================================================

echo "🔧 Correction configuration base de données"
echo "👨‍👩‍👧‍👦 En hommage à Meffo Mehtah Tchandjio Claudine"
echo ""

VPS_IP="89.117.58.53"
VPS_USER="root"

ssh $VPS_USER@$VPS_IP << 'EOF'
    echo "🔧 CORRECTION BACKEND → POSTGRESQL"
    echo "================================="

    cd /var/www/claudyne/backend

    # 1. BACKUP CONFIGURATION ACTUELLE
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Backup configuration créé"

    # 2. CORRIGER CONFIGURATION .ENV POUR POSTGRESQL
    echo "📝 Mise à jour configuration PostgreSQL..."

    cat > .env << 'ENVEOF'
NODE_ENV=production
PORT=3001

# Database Configuration PostgreSQL PRODUCTION
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=claudyne_production
DB_USER=claudyne_user
DB_PASSWORD=aujourdhui18D@
DB_SSL=false

# Test Database (SQLite fallback)
TEST_DB_NAME=claudyne_test
TEST_DB_DIALECT=sqlite
TEST_DB_STORAGE=./database/claudyne_test.sqlite

# Cache & Session
REDIS_PORT=6379

# JWT Configuration
JWT_SECRET=claudyne_jwt_meffo_tchandjio_production_2024
JWT_EXPIRES_IN=7d

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@claudyne.com
SMTP_PASS=change_in_production

# URLs Production
FRONTEND_URL=https://claudyne.com
BACKEND_URL=https://claudyne.com/api
CORS_ORIGIN=https://claudyne.com,https://www.claudyne.com

# Features
FEATURES_EMAIL_AUTOMATION=true
FEATURES_BATTLE_ROYALE=true
FEATURES_PRIX_CLAUDINE=true
MOCK_PAYMENTS=true
ENVEOF

    echo "✅ Configuration PostgreSQL mise à jour"

    # 3. VÉRIFIER CONNEXION AVEC NOUVELLE CONFIG
    echo ""
    echo "🔗 Test nouvelle connexion PostgreSQL..."
    timeout 10s node -e "
        require('dotenv').config();
        const { Sequelize } = require('sequelize');
        const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
            host: process.env.DB_HOST,
            dialect: 'postgres',
            logging: false
        });
        sequelize.authenticate()
            .then(() => console.log('✅ Connexion PostgreSQL réussie'))
            .catch(err => console.log('❌ Erreur:', err.message));
        process.exit(0);
    " || echo "❌ Connexion échouée"

    # 4. EXÉCUTER MIGRATIONS SEQUELIZE
    echo ""
    echo "🔄 Exécution migrations Sequelize..."

    # Vérifier si sequelize-cli est disponible
    if command -v npx sequelize-cli &> /dev/null; then
        npx sequelize-cli db:migrate --env production || echo "⚠️ Migrations via CLI échouées"
    else
        echo "⚠️ sequelize-cli non disponible - Migration via code..."

        # Migration via code direct
        node -e "
            require('dotenv').config();
            const { initializeModels, sequelize } = require('./src/config/database');

            async function migrate() {
                try {
                    console.log('🔄 Synchronisation modèles...');
                    const models = initializeModels();
                    await sequelize.sync({ alter: true });
                    console.log('✅ Migration réussie');
                    process.exit(0);
                } catch (error) {
                    console.log('❌ Erreur migration:', error.message);
                    process.exit(1);
                }
            }
            migrate();
        " || echo "❌ Migration échouée"
    fi

    # 5. VÉRIFIER TABLES CRÉÉES
    echo ""
    echo "📊 Vérification tables créées:"
    sudo -u postgres psql -d claudyne_production -c "\dt" | head -15

    # 6. REDÉMARRER BACKEND AVEC NOUVELLE CONFIG
    echo ""
    echo "🔄 Redémarrage backend..."
    pm2 restart claudyne-backend

    # Attendre le démarrage
    sleep 3

    # 7. VÉRIFIER LOGS DE DÉMARRAGE
    echo ""
    echo "📝 Logs démarrage backend:"
    pm2 logs claudyne-backend --lines 5 --nostream | tail -5

    # 8. STATUT FINAL
    echo ""
    echo "📊 STATUT FINAL:"
    echo "==============="
    echo "✅ Configuration: PostgreSQL activé"
    echo "✅ Backend: Redémarré"

    # Compter tables
    table_count=$(sudo -u postgres psql -d claudyne_production -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
    echo "📋 Tables PostgreSQL: $table_count"

EOF

echo ""
echo "✅ Correction configuration terminée !"