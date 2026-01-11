#!/bin/bash

# Test direct de l'API étudiante
SERVER="root@89.117.58.53"

echo "=========================================="
echo "DIAGNOSTIC COMPLET STUDENT API"
echo "=========================================="
echo ""

echo "1️⃣ VÉRIFICATION BASE DE DONNÉES"
echo "----------------------------------------"
ssh $SERVER "PGPASSWORD='aujourdhui18D@' psql -h localhost -U claudyne_user -d claudyne_production" << 'EOSQL'
-- Subjects actifs avec leur level
SELECT id, title, level, category, "isActive" FROM subjects WHERE "isActive"=true ORDER BY level, title;

-- Lessons approved avec leur subject
SELECT l.id, l.title, s.title as subject_title, s.level, l."reviewStatus", l."isActive"
FROM lessons l
LEFT JOIN subjects s ON l."subjectId" = s.id
WHERE l."reviewStatus"='approved'
ORDER BY s.level, s.title;

-- Students avec leur niveau
SELECT id, "firstName", "lastName", "educationLevel" FROM students LIMIT 5;
EOSQL

echo ""
echo "2️⃣ TEST API AVEC UTILISATEUR RÉEL"
echo "----------------------------------------"

# Récupérer un token d'utilisateur (vous devrez fournir les credentials)
echo "Tentative de login avec un compte test..."
TOKEN=$(ssh $SERVER 'curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"laure.nono@example.com\",\"password\":\"Test123456\"}" \
  | jq -r ".data.token // empty"')

if [ -z "$TOKEN" ]; then
  echo "❌ Échec login - Essai avec autre compte..."
  TOKEN=$(ssh $SERVER 'curl -s -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"test@test.com\",\"password\":\"test123\"}" \
    | jq -r ".data.token // empty"')
fi

if [ -z "$TOKEN" ]; then
  echo "❌ Impossible de se connecter avec les comptes test"
  echo "Vérification sans auth..."
else
  echo "✅ Token obtenu: ${TOKEN:0:20}..."

  echo ""
  echo "Appel /api/students/subjects..."
  ssh $SERVER "curl -s http://localhost:3001/api/students/subjects \
    -H 'Authorization: Bearer $TOKEN' \
    -H 'Content-Type: application/json' \
    | jq ."
fi

echo ""
echo "3️⃣ VÉRIFICATION ROUTES BACKEND"
echo "----------------------------------------"
ssh $SERVER "grep -n 'reviewStatus.*approved' /opt/claudyne/backend/src/routes/students.js | head -5"

echo ""
echo "4️⃣ LOGS PM2 RÉCENTS"
echo "----------------------------------------"
ssh $SERVER "pm2 logs claudyne-backend --lines 20 --nostream | grep -E '(📚|Student|subjects|error)' | tail -10"

echo ""
echo "=========================================="
echo "FIN DU DIAGNOSTIC"
echo "=========================================="
