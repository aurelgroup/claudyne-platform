#!/bin/bash

# =================================================
# TEST DES URLS LIVE CLAUDYNE EN PRODUCTION
# Test automatique de toutes les interfaces
# =================================================

echo "🌐 Test des URLs live Claudyne"
echo "👨‍👩‍👧‍👦 En hommage à Meffo Mehtah Tchandjio Claudine"
echo ""

# URLs à tester
declare -A URLS=(
    ["Accueil"]="https://claudyne.com"
    ["Admin Sécurisé"]="https://claudyne.com/admin-secure-k7m9x4n2p8w5z1c6"
    ["Interface Étudiant"]="https://claudyne.com/student"
    ["Interface Parent"]="https://claudyne.com/parent"
    ["Interface Enseignant"]="https://claudyne.com/teacher"
    ["Interface Modérateur"]="https://claudyne.com/moderator"
    ["API Backend"]="https://claudyne.com/api"
    ["Page Offline"]="https://claudyne.com/offline"
)

echo "📊 Test d'accessibilité des interfaces:"
echo "========================================"

# Test chaque URL
for name in "${!URLS[@]}"; do
    url="${URLS[$name]}"
    echo -n "🔗 $name: "

    # Test HTTP status
    status=$(curl -s -o /dev/null -w "%{http_code}" -L "$url" --max-time 10)
    time=$(curl -s -o /dev/null -w "%{time_total}" -L "$url" --max-time 10)

    if [ "$status" = "200" ]; then
        echo "✅ OK (${status}) - ${time}s"
    elif [ "$status" = "000" ]; then
        echo "❌ TIMEOUT/ERROR"
    else
        echo "⚠️ Status: $status - ${time}s"
    fi
done

echo ""
echo "🔍 Test spécifique interface admin sécurisée:"
echo "============================================="

# Test plus détaillé de l'admin
admin_url="https://claudyne.com/admin-secure-k7m9x4n2p8w5z1c6"
echo "📡 Test: $admin_url"

# Vérifier la réponse complète
response=$(curl -s -L "$admin_url" --max-time 15)

if echo "$response" | grep -q "Claudyne" && echo "$response" | grep -q "admin"; then
    echo "✅ Interface admin détectée - Contenu Claudyne présent"
elif echo "$response" | grep -q "404\|Not Found"; then
    echo "❌ Erreur 404 - Interface admin non trouvée"
elif echo "$response" | grep -q "500\|Error"; then
    echo "❌ Erreur serveur - Problème application"
else
    echo "⚠️ Réponse inattendue - Vérification manuelle nécessaire"
fi

# Test des headers de sécurité
echo ""
echo "🛡️ Headers de sécurité:"
curl -s -I "$admin_url" | grep -E "(Cache-Control|X-Frame|Content-Type)" | head -3

echo ""
echo "✅ Tests terminés !"