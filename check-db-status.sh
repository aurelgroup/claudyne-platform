#!/bin/bash

# =================================================
# VÉRIFICATION ÉTAT BASE DE DONNÉES PRODUCTION
# Audit complet avant toute modification
# =================================================

echo "🔍 Vérification état base de données Claudyne"
echo "👨‍👩‍👧‍👦 En hommage à Meffo Mehtah Tchandjio Claudine"
echo ""

VPS_IP="89.117.58.53"
VPS_USER="root"

ssh $VPS_USER@$VPS_IP << 'EOF'
    echo "📊 AUDIT COMPLET BASE DE DONNÉES"
    echo "================================"

    # 1. VÉRIFIER POSTGRESQL
    echo "🗄️ PostgreSQL Status:"
    systemctl status postgresql --no-pager -l | head -3
    echo ""

    # 2. LISTER LES BASES EXISTANTES
    echo "📋 Bases de données disponibles:"
    sudo -u postgres psql -c "\l" | grep -E "(claudyne|Name|template)"
    echo ""

    # 3. CONFIGURATION BACKEND ACTUELLE
    echo "⚙️ Configuration backend (.env):"
    if [ -f /var/www/claudyne/backend/.env ]; then
        grep -E "DB_|NODE_ENV|PORT" /var/www/claudyne/backend/.env
    else
        echo "❌ Fichier .env non trouvé"
    fi
    echo ""

    # 4. TEST CONNEXION BACKEND → DATABASE
    echo "🔗 Test connexion backend:"
    cd /var/www/claudyne/backend
    timeout 10s node -e "
        require('dotenv').config();
        const { Sequelize } = require('sequelize');
        const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
            host: process.env.DB_HOST,
            dialect: 'postgres',
            logging: false
        });
        sequelize.authenticate()
            .then(() => console.log('✅ Connexion backend → PostgreSQL réussie'))
            .catch(err => console.log('❌ Erreur connexion:', err.message));
    " 2>/dev/null || echo "❌ Test connexion échoué"
    echo ""

    # 5. VÉRIFIER STRUCTURE DES TABLES
    echo "📊 Tables existantes dans claudyne_production:"
    sudo -u postgres psql -d claudyne_production -c "\dt" 2>/dev/null | head -20 || echo "❌ Base claudyne_production inaccessible ou vide"
    echo ""

    # 6. COMPTER LES DONNÉES EXISTANTES
    echo "📈 Données actuelles:"

    tables=("users" "families" "students" "email_templates" "subjects" "lessons")

    for table in "${tables[@]}"; do
        count=$(sudo -u postgres psql -d claudyne_production -t -c "SELECT COUNT(*) FROM $table;" 2>/dev/null | xargs)
        if [ -n "$count" ] && [ "$count" != "" ]; then
            echo "  📋 $table: $count enregistrement(s)"
        else
            echo "  ❌ $table: table inexistante ou inaccessible"
        fi
    done
    echo ""

    # 7. VÉRIFIER LOGS BACKEND RÉCENTS
    echo "📝 Logs backend récents (erreurs DB):"
    pm2 logs claudyne-backend --lines 5 --nostream 2>/dev/null | grep -i -E "(error|database|connection|sequelize)" | tail -3 || echo "  Pas d'erreurs DB récentes"
    echo ""

    # 8. ESPACE DISQUE ET PERFORMANCES
    echo "💾 Espace disque base de données:"
    sudo -u postgres psql -c "SELECT pg_database.datname, pg_size_pretty(pg_database_size(pg_database.datname)) AS size FROM pg_database WHERE datname LIKE 'claudyne%';" 2>/dev/null
    echo ""

    # 9. VÉRIFIER SI MIGRATION NÉCESSAIRE
    echo "🔄 État migrations Sequelize:"
    if [ -d /var/www/claudyne/backend/src/migrations ]; then
        ls /var/www/claudyne/backend/src/migrations/*.js | wc -l | xargs echo "  Fichiers migration disponibles:"

        # Vérifier table SequelizeMeta
        meta_count=$(sudo -u postgres psql -d claudyne_production -t -c "SELECT COUNT(*) FROM \"SequelizeMeta\";" 2>/dev/null | xargs)
        if [ -n "$meta_count" ]; then
            echo "  Migrations appliquées: $meta_count"
        else
            echo "  ❌ Table SequelizeMeta non trouvée - migrations jamais exécutées"
        fi
    else
        echo "  ⚠️ Dossier migrations non trouvé"
    fi
    echo ""

    # 10. RECOMMANDATIONS
    echo "💡 RECOMMANDATIONS:"
    echo "=================="

    # Check si données existent
    user_count=$(sudo -u postgres psql -d claudyne_production -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | xargs)

    if [ "$user_count" = "0" ] || [ -z "$user_count" ]; then
        echo "  🟡 Base vide - Seed data nécessaire"
    else
        echo "  🟢 Base contient des données - Pas de seed nécessaire"
    fi

    # Check migrations
    if [ -z "$meta_count" ]; then
        echo "  🔄 Migrations Sequelize à exécuter"
    else
        echo "  ✅ Migrations déjà appliquées"
    fi

EOF

echo ""
echo "✅ Audit terminé - Prêt pour décisions éclairées !"