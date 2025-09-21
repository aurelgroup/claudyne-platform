#!/bin/bash

# =================================================
# VÉRIFICATION STATUT APRÈS CORRECTION DB
# Check si la correction a fonctionné malgré timeout
# =================================================

echo "🔍 Vérification statut correction base de données"

VPS_IP="89.117.58.53"
VPS_USER="root"

ssh $VPS_USER@$VPS_IP << 'EOF'
    echo "📊 VÉRIFICATION POST-CORRECTION"
    echo "==============================="

    cd /var/www/claudyne/backend

    # 1. VÉRIFIER CONFIGURATION ACTUELLE
    echo "⚙️ Configuration .env actuelle:"
    grep -E "DB_DIALECT|NODE_ENV|DB_NAME" .env 2>/dev/null || echo "❌ Fichier .env non trouvé"
    echo ""

    # 2. VÉRIFIER STATUT SERVICES PM2
    echo "🚀 Statut services PM2:"
    pm2 status | grep claudyne
    echo ""

    # 3. TESTER CONNEXION BACKEND
    echo "🔗 Test connexion PostgreSQL:"
    timeout 10s node -e "
        require('dotenv').config();
        const { testConnection } = require('./src/config/database');
        testConnection().then(success => {
            console.log(success ? '✅ Connexion PostgreSQL OK' : '❌ Connexion PostgreSQL échouée');
            process.exit(0);
        });
    " 2>/dev/null || echo "❌ Test échoué"
    echo ""

    # 4. COMPTER TABLES POSTGRESQL
    echo "📊 Tables PostgreSQL actuelles:"
    sudo -u postgres psql -d claudyne_prod -c "\dt" | wc -l | xargs echo "Nombre de tables:"
    sudo -u postgres psql -d claudyne_prod -c "\dt" | head -10
    echo ""

    # 5. VÉRIFIER LOGS BACKEND RÉCENTS
    echo "📝 Logs backend récents:"
    pm2 logs claudyne-backend --lines 3 --nostream | tail -3 2>/dev/null || echo "Pas de logs"

EOF

echo ""
echo "✅ Vérification terminée"