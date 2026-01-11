#!/bin/bash
# ============================================
# SCRIPT DE DEBUG INSCRIPTION CLAUDYNE
# Pour débutants - Guide pas à pas
# ============================================

echo "🔍 DEBUG INSCRIPTION CLAUDYNE"
echo "=============================="
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ÉTAPE 1: Vérifier où sont les logs
echo -e "${BLUE}ÉTAPE 1: Recherche des fichiers logs...${NC}"
echo ""

LOG_LOCATIONS=(
    "/opt/claudyne/logs"
    "/var/log/claudyne"
    "/var/log/pm2"
    "~/.pm2/logs"
)

for location in "${LOG_LOCATIONS[@]}"; do
    if [ -d "$location" ]; then
        echo -e "${GREEN}✅ Trouvé: $location${NC}"
        ls -lh "$location" | tail -5
        echo ""
    else
        echo -e "${YELLOW}⚠️  Non trouvé: $location${NC}"
    fi
done

# ÉTAPE 2: Vérifier les processus Node.js
echo -e "${BLUE}ÉTAPE 2: Processus Node.js actifs...${NC}"
echo ""
ps aux | grep node | grep -v grep | head -5
echo ""

# ÉTAPE 3: Vérifier PM2
echo -e "${BLUE}ÉTAPE 3: Status PM2...${NC}"
echo ""
if command -v pm2 &> /dev/null; then
    pm2 list
    echo ""
    echo "Logs PM2 disponibles:"
    pm2 logs --lines 0 2>&1 | grep "│"
else
    echo -e "${YELLOW}PM2 non installé${NC}"
fi
echo ""

# ÉTAPE 4: Tester l'API et capturer l'erreur
echo -e "${BLUE}ÉTAPE 4: Test API avec capture d'erreur...${NC}"
echo ""

# Démarrer la capture des logs en arrière-plan
echo "Démarrage capture logs..."
if command -v pm2 &> /dev/null; then
    pm2 logs --raw --lines 0 > /tmp/claudyne_test_logs.txt 2>&1 &
    LOG_PID=$!
    sleep 2
fi

# Tester l'inscription
echo "Envoi requête test..."
curl -X POST https://claudyne.com/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{
        "email":"debug_test@claudyne.com",
        "password":"Debug123",
        "firstName":"Debug",
        "lastName":"Test",
        "familyName":"Famille Debug",
        "city":"Douala",
        "acceptTerms":"true"
    }' \
    -s -w "\nHTTP Code: %{http_code}\n"

echo ""
sleep 3

# Arrêter la capture
if [ ! -z "$LOG_PID" ]; then
    kill $LOG_PID 2>/dev/null
fi

# ÉTAPE 5: Afficher les erreurs capturées
echo -e "${BLUE}ÉTAPE 5: Erreurs capturées...${NC}"
echo ""

if [ -f "/tmp/claudyne_test_logs.txt" ]; then
    echo -e "${RED}Dernières erreurs:${NC}"
    grep -i "error\|exception\|failed" /tmp/claudyne_test_logs.txt | tail -20
    echo ""

    echo -e "${YELLOW}Logs complets sauvegardés dans:${NC}"
    echo "/tmp/claudyne_test_logs.txt"
else
    echo -e "${YELLOW}Pas de logs PM2 capturés${NC}"
    echo "Essayez: journalctl -u claudyne -n 50"
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════${NC}"
echo -e "${GREEN}Debug terminé${NC}"
echo -e "${GREEN}═══════════════════════════════════${NC}"
echo ""

# ÉTAPE 6: Recommandations
echo -e "${BLUE}📋 Que faire maintenant:${NC}"
echo ""
echo "1. Si vous voyez des erreurs ci-dessus, partagez-les"
echo "2. Sinon, consultez les logs manuellement:"
echo "   - pm2 logs (si PM2 utilisé)"
echo "   - journalctl -u claudyne -f (si systemd)"
echo "   - tail -f /opt/claudyne/logs/*.log"
echo ""
