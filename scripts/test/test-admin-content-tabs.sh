#!/bin/bash
# Test des endpoints /admin/content/:tab

API_URL="https://claudyne.com/api"
ADMIN_KEY="claudyne-admin-2024"

echo "🔍 Test des endpoints admin content tabs"
echo "========================================"
echo ""

# 1. Générer token
echo "1. Génération du token admin..."
TOKEN=$(curl -s "${API_URL}/admin/generate-token" \
  -H "Content-Type: application/json" \
  -d "{\"adminKey\":\"${ADMIN_KEY}\"}" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Échec génération token"
  exit 1
fi

echo "✅ Token obtenu: ${TOKEN:0:30}..."
echo ""

# 2. Test GET /admin/content/courses
echo "2. Test GET /admin/content/courses"
echo "-----------------------------------"
RESPONSE=$(curl -s "${API_URL}/admin/content/courses" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json")

echo "$RESPONSE" | head -c 500
echo ""

# Vérifier que c'est un tableau
if echo "$RESPONSE" | grep -q '"data":\['; then
  echo "✅ data est un tableau (commence par [)"
else
  echo "❌ data n'est PAS un tableau"
  echo "Structure complète:"
  echo "$RESPONSE"
fi
echo ""

# 3. Test GET /admin/content/quizzes
echo "3. Test GET /admin/content/quizzes"
echo "-----------------------------------"
RESPONSE=$(curl -s "${API_URL}/admin/content/quizzes" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json")

echo "$RESPONSE" | head -c 500
echo ""

if echo "$RESPONSE" | grep -q '"data":\['; then
  echo "✅ data est un tableau"
else
  echo "❌ data n'est PAS un tableau"
fi
echo ""

# 4. Test GET /admin/content/resources
echo "4. Test GET /admin/content/resources"
echo "-----------------------------------"
RESPONSE=$(curl -s "${API_URL}/admin/content/resources" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json")

echo "$RESPONSE" | head -c 500
echo ""

if echo "$RESPONSE" | grep -q '"data":\['; then
  echo "✅ data est un tableau"
else
  echo "❌ data n'est PAS un tableau"
fi
echo ""

echo "========================================"
echo "✅ Tests terminés"
