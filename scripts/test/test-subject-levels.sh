#!/bin/bash
# Script pour vérifier les niveaux des subjects via l'API

API_URL="https://claudyne.com/api"
ADMIN_KEY="claudyne-admin-2024"

echo "🔍 Génération du token admin..."
TOKEN=$(curl -s "${API_URL}/admin/generate-token" -H "Content-Type: application/json" -d "{\"adminKey\":\"${ADMIN_KEY}\"}" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Échec génération token"
  exit 1
fi

echo "✅ Token obtenu"
echo ""
echo "📚 Récupération des subjects..."
echo ""

# Get admin content
curl -s "${API_URL}/admin/content" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" | jq -r '
  .data.subjects[] |
  "[\(.level)] \(.title) (\(.category)) - Active: \(.isActive)"
' | sort

echo ""
echo "🔄 Mapping attendu:"
echo "  6EME → 6ème"
echo "  TERMINALE → Tle"
echo ""
echo "📊 Vérifiez que les niveaux des subjects correspondent au mapping du code"
