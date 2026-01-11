#!/bin/bash
# Script pour désactiver les anciens cours de Terminale

TOKEN=$(curl -s http://127.0.0.1:3001/api/admin/generate-token -H "Content-Type: application/json" -d '{"adminKey":"claudyne-admin-2024"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

echo "Token: $TOKEN"
echo ""
echo "=== Désactivation des cours de Terminale ==="

# Liste des IDs à désactiver (format COURS-xxx)
COURSE_IDS=(
  "COURS-4ffb63aa-99e2-492f-8a86-bca774f0b9a4"  # EE - Leçon 1
  "COURS-a4d6fddf-b097-4603-b0f4-41a51ee139e8"  # PHYSIQUES TLE
  "COURS-5faaf1ac-7a3d-48de-9706-d8729109fc90"  # TEST 3
)

for COURSE_ID in "${COURSE_IDS[@]}"; do
  echo "Désactivation de $COURSE_ID..."
  curl -s -X PUT "http://127.0.0.1:3001/api/admin/content/courses/$COURSE_ID/toggle" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json"
  echo ""
done

echo "=== Terminé ==="
