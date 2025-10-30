#!/bin/bash
# Script de déploiement rapide - Corrections Interface Student
# Date: 19 Octobre 2025
# Exécuter depuis: C:\Users\fa_nono\Documents\CADD\Claudyne

echo "🚀 Déploiement des corrections Interface Student"
echo "=================================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
SERVER="root@89.117.58.53"
REMOTE_PATH="/opt/claudyne"
LOCAL_PATH="C:/Users/fa_nono/Documents/CADD/Claudyne"

echo -e "${BLUE}Étape 1/5: Sauvegarde des fichiers existants sur le serveur${NC}"
ssh $SERVER "cd $REMOTE_PATH && \
    cp student-interface-modern.html student-interface-modern.html.backup.\$(date +%Y%m%d_%H%M%S) && \
    cp backend/src/routes/students.js backend/src/routes/students.js.backup.\$(date +%Y%m%d_%H%M%S)"
echo -e "${GREEN}✅ Sauvegardes créées${NC}\n"

echo -e "${BLUE}Étape 2/5: Upload des fichiers frontend${NC}"
scp "$LOCAL_PATH/student-interface-modern.html" $SERVER:$REMOTE_PATH/
scp "$LOCAL_PATH/student-payment-modal.js" $SERVER:$REMOTE_PATH/
echo -e "${GREEN}✅ Fichiers frontend uploadés${NC}\n"

echo -e "${BLUE}Étape 3/5: Upload des fichiers backend${NC}"
scp "$LOCAL_PATH/backend/src/routes/students.js" $SERVER:$REMOTE_PATH/backend/src/routes/
echo -e "${GREEN}✅ Fichiers backend uploadés${NC}\n"

echo -e "${BLUE}Étape 4/5: Redémarrage du serveur backend${NC}"
ssh $SERVER "cd $REMOTE_PATH/backend && \
    pkill -f 'node.*server.js' && \
    sleep 2 && \
    nohup node src/server.js > logs/server.log 2>&1 & \
    sleep 3 && \
    ps aux | grep 'node.*server.js' | grep -v grep"
echo -e "${GREEN}✅ Serveur backend redémarré${NC}\n"

echo -e "${BLUE}Étape 5/5: Vérification des logs${NC}"
ssh $SERVER "tail -n 20 $REMOTE_PATH/backend/logs/combined.log"
echo -e "${GREEN}✅ Logs vérifiés${NC}\n"

echo ""
echo "=================================================="
echo -e "${GREEN}✅ DÉPLOIEMENT TERMINÉ${NC}"
echo "=================================================="
echo ""
echo "🔍 Prochaines étapes:"
echo "  1. Ouvrir https://claudyne.com/student-interface-modern.html"
echo "  2. Se connecter avec un compte test"
echo "  3. Vérifier que les données sont réelles"
echo "  4. Tester le bouton 'Renouveler mon abonnement'"
echo "  5. Vérifier la console (F12) pour les erreurs"
echo ""
echo "📚 Documentation complète: DEPLOIEMENT_CORRECTIONS_FINAL.md"
echo ""

# Note importante
echo -e "${RED}⚠️  IMPORTANT:${NC}"
echo "  Le HTML du modal de paiement doit être inséré manuellement"
echo "  dans student-interface-modern.html après le modal de mot de passe"
echo ""
echo "  Commande:"
echo "  ssh $SERVER"
echo "  nano $REMOTE_PATH/student-interface-modern.html"
echo "  # Chercher la ligne ~4091 (fin du modal de mot de passe)"
echo "  # Insérer le contenu de payment-modal.html"
echo ""
