#!/bin/bash

echo "📊 ================================================"
echo "   MONITORING CLAUDYNE - CONTABO VPS"
echo "📊 ================================================"
echo "En hommage à Meffo Mehtah Tchandjio Claudine 👨‍👩‍👧‍👦"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== INFORMATIONS SYSTÈME ===${NC}"
echo "Date: $(date)"
echo "Uptime: $(uptime)"
echo ""

echo -e "${BLUE}=== UTILISATION DISQUE ===${NC}"
df -h /

echo ""
echo -e "${BLUE}=== UTILISATION MÉMOIRE ===${NC}"
free -h

echo ""
echo -e "${BLUE}=== UTILISATION CPU ===${NC}"
top -bn1 | grep "Cpu(s)" | awk '{print $1 $2 $3 $4}'

echo ""
echo -e "${BLUE}=== STATUT PM2 ===${NC}"
sudo -u claudyne pm2 status

echo ""
echo -e "${BLUE}=== STATUT SERVICES ===${NC}"
echo -n "Nginx: "
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Actif${NC}"
else
    echo -e "${RED}❌ Inactif${NC}"
fi

echo -n "PostgreSQL: "
if systemctl is-active --quiet postgresql; then
    echo -e "${GREEN}✅ Actif${NC}"
else
    echo -e "${RED}❌ Inactif${NC}"
fi

echo -n "Redis: "
if systemctl is-active --quiet redis-server; then
    echo -e "${GREEN}✅ Actif${NC}"
else
    echo -e "${RED}❌ Inactif${NC}"
fi

echo ""
echo -e "${BLUE}=== PORTS EN ÉCOUTE ===${NC}"
netstat -tulpn | grep -E ':80|:443|:3000|:3001|:5432|:6379'

echo ""
echo -e "${BLUE}=== CERTIFICAT SSL ===${NC}"
if command -v certbot >/dev/null; then
    certbot certificates 2>/dev/null || echo "Aucun certificat trouvé"
else
    echo "Certbot non installé"
fi

echo ""
echo -e "${BLUE}=== LOGS D'ERREURS RÉCENTS ===${NC}"
echo "Dernières erreurs Nginx:"
sudo tail -5 /var/log/nginx/error.log 2>/dev/null || echo "Pas de logs d'erreur Nginx"

echo ""
echo "Dernières erreurs Claudyne:"
sudo -u claudyne tail -5 /var/www/claudyne/claudyne-platform/logs/frontend-err.log 2>/dev/null || echo "Pas de logs d'erreur Frontend"

echo ""
echo -e "${BLUE}=== TEST DE CONNECTIVITÉ ===${NC}"
echo -n "Test local port 3000: "
if curl -s http://localhost:3000 >/dev/null; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ Échec${NC}"
fi

echo -n "Test local port 3001: "
if curl -s http://localhost:3001 >/dev/null; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ Échec${NC}"
fi

echo ""
echo -e "${GREEN}Monitoring terminé!${NC}"