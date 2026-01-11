#!/bin/bash
# Script simple de consolidation des bases Claudyne

echo "🔍 CONSOLIDATION DES BASES CLAUDYNE"
echo "===================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour exécuter une requête SQL
run_sql() {
    local db=$1
    local query=$2
    sudo -u postgres psql -d "$db" -t -c "$query" 2>/dev/null
}

# ÉTAPE 1: Compter les utilisateurs dans chaque base
echo "📊 Comptage des utilisateurs..."
count_prod=$(run_sql "claudyne_prod" "SELECT COUNT(*) FROM users;")
count_production=$(run_sql "claudyne_production" "SELECT COUNT(*) FROM users;")

echo "claudyne_prod:        $count_prod utilisateurs"
echo "claudyne_production:  $count_production utilisateurs"
echo ""

# ÉTAPE 2: Afficher les derniers utilisateurs de chaque base
echo "👥 5 derniers utilisateurs dans claudyne_prod:"
sudo -u postgres psql -d claudyne_prod -c "SELECT id, email, \"firstName\", \"lastName\", role, to_char(\"createdAt\", 'YYYY-MM-DD HH24:MI:SS') as created FROM users ORDER BY \"createdAt\" DESC LIMIT 5;"
echo ""

echo "👥 5 derniers utilisateurs dans claudyne_production:"
sudo -u postgres psql -d claudyne_production -c "SELECT id, email, \"firstName\", \"lastName\", role, to_char(\"createdAt\", 'YYYY-MM-DD HH24:MI:SS') as created FROM users ORDER BY \"createdAt\" DESC LIMIT 5;"
echo ""

# ÉTAPE 3: Déterminer quelle base garder
echo "🎯 DÉCISION DE CONSOLIDATION"
echo "=============================="

if [ "$count_prod" -gt 0 ] && [ "$count_production" -eq 0 ]; then
    echo -e "${GREEN}✅ claudyne_prod contient des données${NC}"
    echo -e "${RED}❌ claudyne_production est VIDE${NC}"
    echo ""
    echo "💡 ACTION: Supprimer claudyne_production (vide)"

    read -p "Voulez-vous supprimer claudyne_production maintenant? (yes/no): " confirm
    if [ "$confirm" = "yes" ]; then
        echo "🗑️  Suppression de claudyne_production..."
        sudo -u postgres psql -c "DROP DATABASE IF EXISTS claudyne_production;"
        echo -e "${GREEN}✅ Base claudyne_production supprimée${NC}"
    else
        echo "⏸️  Suppression annulée"
    fi

elif [ "$count_production" -gt 0 ] && [ "$count_prod" -eq 0 ]; then
    echo -e "${RED}❌ claudyne_prod est VIDE${NC}"
    echo -e "${GREEN}✅ claudyne_production contient des données${NC}"
    echo ""
    echo "💡 ACTION: Migrer claudyne_production → claudyne_prod, puis supprimer claudyne_production"

    read -p "Voulez-vous effectuer la migration? (yes/no): " confirm
    if [ "$confirm" = "yes" ]; then
        echo "📦 Dump de claudyne_production..."
        sudo -u postgres pg_dump claudyne_production > /tmp/claudyne_production_backup.sql

        echo "🔄 Import dans claudyne_prod..."
        sudo -u postgres psql claudyne_prod < /tmp/claudyne_production_backup.sql

        echo "✅ Migration terminée"
        echo ""
        echo "🗑️  Suppression de claudyne_production..."
        sudo -u postgres psql -c "DROP DATABASE claudyne_production;"
        echo -e "${GREEN}✅ Consolidation terminée${NC}"
    else
        echo "⏸️  Migration annulée"
    fi

elif [ "$count_prod" -gt 0 ] && [ "$count_production" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  LES DEUX BASES CONTIENNENT DES DONNÉES${NC}"
    echo ""
    echo "📊 Analyse des différences requise..."

    # Créer un backup de sécurité
    echo "💾 Création de backups de sécurité..."
    sudo -u postgres pg_dump claudyne_prod > /tmp/claudyne_prod_backup_$(date +%Y%m%d_%H%M%S).sql
    sudo -u postgres pg_dump claudyne_production > /tmp/claudyne_production_backup_$(date +%Y%m%d_%H%M%S).sql
    echo -e "${GREEN}✅ Backups créés dans /tmp/${NC}"

    echo ""
    echo "⚠️  ATTENTION: Fusion manuelle requise"
    echo "Les deux bases contiennent des utilisateurs."
    echo "Vérifiez manuellement les données avant de continuer."

else
    echo -e "${RED}❌ Les deux bases sont VIDES${NC}"
    echo "Rien à migrer."
fi

echo ""
echo "=== CONFIGURATION ACTUELLE ==="
cat /opt/claudyne/.env | grep DB_NAME
echo ""
echo "✅ Script terminé"
