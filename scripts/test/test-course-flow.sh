#!/bin/bash

###############################################################################
# Script de diagnostic complet du flux de création de cours
###############################################################################

set -e

API_URL="https://claudyne.com/api"
ADMIN_KEY="claudyne-admin-2024"

echo "=========================================="
echo "🔍 DIAGNOSTIC COMPLET - Flux de création de cours"
echo "=========================================="
echo ""

# Étape 1: Générer un token admin
echo "📝 Étape 1: Génération du token admin..."
TOKEN_RESPONSE=$(curl -s -X POST "$API_URL/admin/generate-token" \
  -H "Content-Type: application/json" \
  -d "{\"adminKey\":\"$ADMIN_KEY\"}")

TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Échec de la génération du token"
  echo "$TOKEN_RESPONSE"
  exit 1
fi

echo "✅ Token obtenu: ${TOKEN:0:20}..."
echo ""

# Étape 2: Créer un cours de test
echo "📝 Étape 2: Création d'un cours de test..."
TIMESTAMP=$(date +%s)
COURSE_DATA=$(cat <<EOF
{
  "title": "Test Maths $TIMESTAMP",
  "subject": "mathematiques",
  "level": "6eme",
  "description": "Cours de test automatique",
  "content": "Contenu du cours de test",
  "duration": 45
}
EOF
)

echo "📤 Payload:"
echo "$COURSE_DATA" | jq .

CREATE_RESPONSE=$(curl -s -X POST "$API_URL/admin/courses" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$COURSE_DATA")

echo ""
echo "📥 Réponse POST /api/admin/courses:"
echo "$CREATE_RESPONSE" | jq .

SUCCESS=$(echo "$CREATE_RESPONSE" | jq -r '.success')
if [ "$SUCCESS" != "true" ]; then
  echo "❌ Échec de la création du cours"
  exit 1
fi

COURSE_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.course.id')
echo "✅ Cours créé avec ID: $COURSE_ID"
echo ""

# Étape 3: Vérifier GET /api/admin/content
echo "📝 Étape 3: Vérification de GET /api/admin/content..."
ADMIN_CONTENT=$(curl -s -X GET "$API_URL/admin/content" \
  -H "Authorization: Bearer $TOKEN")

echo "📥 Réponse GET /api/admin/content (stats uniquement):"
echo "$ADMIN_CONTENT" | jq '{success, stats: .data.stats}'

TOTAL_COURSES=$(echo "$ADMIN_CONTENT" | jq -r '.data.stats.totalCourses // 0')
echo "📊 Nombre total de cours: $TOTAL_COURSES"
echo ""

# Étape 4: Vérifier GET /api/admin/content/courses
echo "📝 Étape 4: Vérification de GET /api/admin/content/courses..."
ADMIN_COURSES=$(curl -s -X GET "$API_URL/admin/content/courses" \
  -H "Authorization: Bearer $TOKEN")

echo "📥 Réponse GET /api/admin/content/courses:"
echo "$ADMIN_COURSES" | jq '{success, courseCount: (.data.courses | length), courses: .data.courses}'

COURSE_COUNT=$(echo "$ADMIN_COURSES" | jq -r '.data.courses | length')
echo "📊 Nombre de cours retournés: $COURSE_COUNT"

if [ "$COURSE_COUNT" -eq 0 ]; then
  echo "⚠️  AUCUN COURS RETOURNÉ par /admin/content/courses"
fi

# Chercher notre cours spécifique
FOUND_COURSE=$(echo "$ADMIN_COURSES" | jq ".data.courses[] | select(.id == \"$COURSE_ID\")")
if [ -n "$FOUND_COURSE" ]; then
  echo "✅ Notre cours est présent dans /admin/content/courses"
  echo "$FOUND_COURSE" | jq .
else
  echo "❌ Notre cours N'EST PAS dans /admin/content/courses"
fi
echo ""

# Étape 5: Vérifier GET /api/public/content (sans token)
echo "📝 Étape 5: Vérification de GET /api/public/content (PUBLIC)..."
PUBLIC_CONTENT=$(curl -s -X GET "$API_URL/public/content")

echo "📥 Réponse GET /api/public/content:"
echo "$PUBLIC_CONTENT" | jq '{success, subjectCount: (.data.subjects | length), courseCount: (.data.courses | length), quizCount: (.data.quizzes | length), resourceCount: (.data.resources | length)}'

PUBLIC_COURSE_COUNT=$(echo "$PUBLIC_CONTENT" | jq -r '.data.courses | length')
echo "📊 Nombre de cours publics: $PUBLIC_COURSE_COUNT"

if [ "$PUBLIC_COURSE_COUNT" -eq 0 ]; then
  echo "⚠️  AUCUN COURS PUBLIC retourné"
else
  echo "📚 Exemples de cours publics (3 premiers):"
  echo "$PUBLIC_CONTENT" | jq '.data.courses[:3] | .[] | {id, title, subject, level, status}'
fi

# Chercher notre cours dans le contenu public
PUBLIC_FOUND=$(echo "$PUBLIC_CONTENT" | jq ".data.courses[] | select(.title | contains(\"Test Maths $TIMESTAMP\"))")
if [ -n "$PUBLIC_FOUND" ]; then
  echo "✅ Notre cours est présent dans /public/content"
  echo "$PUBLIC_FOUND" | jq .
else
  echo "❌ Notre cours N'EST PAS dans /public/content"
fi
echo ""

# Étape 6: Vérifier les logs backend
echo "📝 Étape 6: Vérification des logs backend..."
echo "🔍 Recherche d'INSERT dans les logs récents..."
ssh root@89.117.58.53 "tail -200 /root/.pm2/logs/claudyne-backend-out-16.log | grep -i 'INSERT\|lesson\|subject' | tail -20" || echo "Aucun log INSERT récent trouvé"
echo ""

# Résumé
echo "=========================================="
echo "📊 RÉSUMÉ DU DIAGNOSTIC"
echo "=========================================="
echo "✅ Token admin: OK"
echo "✅ POST /admin/courses: $([ "$SUCCESS" == "true" ] && echo "OK (201/200)" || echo "ÉCHEC")"
echo "📊 Cours dans /admin/content/courses: $([ -n "$FOUND_COURSE" ] && echo "TROUVÉ" || echo "INTROUVABLE")"
echo "📊 Cours dans /public/content: $([ -n "$PUBLIC_FOUND" ] && echo "TROUVÉ" || echo "INTROUVABLE")"
echo ""

if [ -z "$FOUND_COURSE" ]; then
  echo "🔴 PROBLÈME: Le cours n'est pas dans /admin/content/courses"
  echo "   → Le cours n'a pas été persisté en DB ou est filtré"
  echo "   → Vérifier: reviewStatus, isActive, Subject existence"
elif [ -z "$PUBLIC_FOUND" ]; then
  echo "🟡 PROBLÈME: Le cours est dans /admin mais pas dans /public"
  echo "   → Vérifier: reviewStatus='approved', isActive=true"
  echo "   → Ou problème de filtre dans /api/public/content"
else
  echo "🟢 SUCCÈS: Le cours est accessible partout!"
fi

echo ""
echo "=========================================="
