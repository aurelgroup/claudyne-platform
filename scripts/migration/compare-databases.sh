#!/bin/bash
# Script de comparaison des bases claudyne_prod vs claudyne_production

echo "🔍 COMPARAISON DES BASES DE DONNÉES CLAUDYNE"
echo "=============================================="
echo ""

# Fonction pour compter les utilisateurs
count_users() {
    local db=$1
    sudo -u postgres psql $db -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null
}

# Fonction pour lister les tables
list_tables() {
    local db=$1
    echo "📋 Tables dans $db:"
    sudo -u postgres psql $db -c "\dt" 2>/dev/null
}

# Fonction pour afficher les derniers utilisateurs
show_recent_users() {
    local db=$1
    echo "👥 5 derniers utilisateurs dans $db:"
    sudo -u postgres psql $db -c "SELECT id, email, \"firstName\", \"lastName\", role, \"createdAt\" FROM users ORDER BY \"createdAt\" DESC LIMIT 5;" 2>/dev/null
}

echo "=== CLAUDYNE_PROD ==="
echo ""
count_prod=$(count_users "claudyne_prod")
echo "Nombre d'utilisateurs: $count_prod"
echo ""
list_tables "claudyne_prod"
echo ""
show_recent_users "claudyne_prod"
echo ""
echo ""

echo "=== CLAUDYNE_PRODUCTION ==="
echo ""
count_production=$(count_users "claudyne_production")
echo "Nombre d'utilisateurs: $count_production"
echo ""
list_tables "claudyne_production"
echo ""
show_recent_users "claudyne_production"
echo ""
echo ""

echo "=== RÉSUMÉ ==="
echo "claudyne_prod:        $count_prod utilisateurs"
echo "claudyne_production:  $count_production utilisateurs"
echo ""

# Vérifier quelle base est utilisée dans .env
echo "=== CONFIGURATION ACTUELLE ==="
grep "DB_NAME" /opt/claudyne/.env
echo ""

# Recommandation
if [ "$count_prod" -gt "$count_production" ]; then
    echo "⚠️  claudyne_prod contient PLUS de données"
    echo "💡 Recommandation: Utiliser claudyne_prod comme base principale"
elif [ "$count_production" -gt "$count_prod" ]; then
    echo "⚠️  claudyne_production contient PLUS de données"
    echo "💡 Recommandation: Utiliser claudyne_production comme base principale"
else
    echo "ℹ️  Les deux bases contiennent le même nombre d'utilisateurs"
    echo "💡 Recommandation: Vérifier le contenu et consolider en une seule base"
fi
