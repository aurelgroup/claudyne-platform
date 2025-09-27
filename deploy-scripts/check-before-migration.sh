#!/bin/bash

echo "🔍 ================================================"
echo "   VÉRIFICATION PRÉ-MIGRATION CLAUDYNE"
echo "🔍 ================================================"
echo "En hommage à Meffo Mehtah Tchandjio Claudine 👨‍👩‍👧‍👦"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}✅${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

error() {
    echo -e "${RED}❌${NC} $1"
}

info() {
    echo -e "${BLUE}ℹ️${NC} $1"
}

ISSUES=0

echo "📋 Vérification de l'état actuel du système avant migration..."
echo ""

# ================================================================
# VÉRIFICATION SYSTÈME
# ================================================================

echo -e "${BLUE}=== SYSTÈME ===${NC}"

# Vérifier l'utilisateur
if [ "$EUID" -ne 0 ]; then
    error "Ce script doit être exécuté en tant que root"
    ISSUES=$((ISSUES+1))
else
    log "Exécuté en tant que root"
fi

# Vérifier l'espace disque
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    warning "Utilisation disque élevée: ${DISK_USAGE}% (>80%)"
    ISSUES=$((ISSUES+1))
else
    log "Espace disque OK: ${DISK_USAGE}%"
fi

# Vérifier la mémoire
MEM_USAGE=$(free | awk '/^Mem:/{printf "%.1f", $3/$2 * 100}')
if (( $(echo "$MEM_USAGE > 90" | bc -l) )); then
    warning "Utilisation mémoire élevée: ${MEM_USAGE}%"
else
    log "Utilisation mémoire OK: ${MEM_USAGE}%"
fi

echo ""

# ================================================================
# VÉRIFICATION SERVICES
# ================================================================

echo -e "${BLUE}=== SERVICES SYSTÈME ===${NC}"

# PostgreSQL
if systemctl is-active --quiet postgresql; then
    log "PostgreSQL actif"
    
    # Vérifier la base claudyne_production
    if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw claudyne_production; then
        log "Base de données 'claudyne_production' trouvée"
        
        # Compter les tables
        TABLE_COUNT=$(sudo -u postgres psql -d claudyne_production -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
        if [ "$TABLE_COUNT" -gt 0 ]; then
            log "Base contient $TABLE_COUNT tables"
        else
            warning "Base de données vide"
        fi
    else
        warning "Base de données 'claudyne_production' non trouvée"
    fi
else
    warning "PostgreSQL inactif"
fi

# Redis
if systemctl is-active --quiet redis-server; then
    log "Redis actif"
else
    warning "Redis inactif"
fi

# Nginx
if systemctl is-active --quiet nginx; then
    log "Nginx actif"
else
    warning "Nginx inactif"
fi

echo ""

# ================================================================
# VÉRIFICATION CLAUDYNE EXISTANT
# ================================================================

echo -e "${BLUE}=== INSTALLATION CLAUDYNE ACTUELLE ===${NC}"

# Vérifier le répertoire
if [ -d "/var/www/claudyne" ]; then
    log "Répertoire /var/www/claudyne existe"
    
    CLAUDYNE_SIZE=$(du -sh /var/www/claudyne 2>/dev/null | cut -f1)
    info "Taille actuelle: $CLAUDYNE_SIZE"
    
    # Vérifier le projet
    if [ -d "/var/www/claudyne/claudyne-platform" ]; then
        log "Projet claudyne-platform trouvé"
        
        # Vérifier Git
        if [ -d "/var/www/claudyne/claudyne-platform/.git" ]; then
            log "Repository Git présent"
            cd /var/www/claudyne/claudyne-platform
            CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "inconnu")
            LAST_COMMIT=$(git log -1 --format="%h - %s" 2>/dev/null || echo "inconnu")
            info "Branche actuelle: $CURRENT_BRANCH"
            info "Dernier commit: $LAST_COMMIT"
        else
            warning "Pas de repository Git trouvé"
        fi
    else
        warning "Projet claudyne-platform non trouvé dans /var/www/claudyne"
    fi
else
    warning "Répertoire /var/www/claudyne n'existe pas"
fi

# Vérifier l'utilisateur claudyne
if id "claudyne" &>/dev/null; then
    log "Utilisateur 'claudyne' existe"
else
    warning "Utilisateur 'claudyne' n'existe pas"
fi

echo ""

# ================================================================
# VÉRIFICATION PM2
# ================================================================

echo -e "${BLUE}=== PROCESSUS PM2 ===${NC}"

if command -v pm2 >/dev/null 2>&1; then
    log "PM2 installé"
    
    # Vérifier les processus PM2 actifs
    if sudo -u claudyne pm2 status 2>/dev/null | grep -q "online"; then
        log "Processus PM2 actifs détectés:"
        sudo -u claudyne pm2 status --no-color 2>/dev/null | grep -E "(App name|online|stopped|errored)"
    else
        warning "Aucun processus PM2 actif"
    fi
else
    warning "PM2 non installé"
fi

echo ""

# ================================================================
# VÉRIFICATION RÉSEAU
# ================================================================

echo -e "${BLUE}=== RÉSEAU ===${NC}"

# Vérifier les ports utilisés
PORTS_IN_USE=$(netstat -tulpn 2>/dev/null | grep -E ':80|:443|:3000|:3001|:5432|:6379' | wc -l)
if [ "$PORTS_IN_USE" -gt 0 ]; then
    log "$PORTS_IN_USE ports standard en écoute"
    netstat -tulpn 2>/dev/null | grep -E ':80|:443|:3000|:3001|:5432|:6379' | while read line; do
        PORT=$(echo $line | awk '{print $4}' | cut -d: -f2)
        PROCESS=$(echo $line | awk '{print $7}')
        info "Port $PORT utilisé par $PROCESS"
    done
else
    warning "Aucun port standard en écoute"
fi

echo ""

# ================================================================
# VÉRIFICATION NGINX
# ================================================================

echo -e "${BLUE}=== CONFIGURATION NGINX ===${NC}"

# Vérifier les sites Claudyne
CLAUDYNE_SITES=$(ls /etc/nginx/sites-available/claudyne* 2>/dev/null | wc -l)
if [ "$CLAUDYNE_SITES" -gt 0 ]; then
    log "$CLAUDYNE_SITES site(s) Claudyne configuré(s)"
    ls /etc/nginx/sites-available/claudyne* 2>/dev/null | while read site; do
        SITE_NAME=$(basename $site)
        if [ -L "/etc/nginx/sites-enabled/$SITE_NAME" ]; then
            log "Site $SITE_NAME activé"
        else
            warning "Site $SITE_NAME désactivé"
        fi
    done
else
    warning "Aucun site Claudyne configuré dans Nginx"
fi

echo ""

# ================================================================
# VÉRIFICATION SSL
# ================================================================

echo -e "${BLUE}=== CERTIFICATS SSL ===${NC}"

if command -v certbot >/dev/null 2>&1; then
    log "Certbot installé"
    
    # Vérifier les certificats existants
    CERT_COUNT=$(certbot certificates 2>/dev/null | grep "Certificate Name:" | wc -l)
    if [ "$CERT_COUNT" -gt 0 ]; then
        log "$CERT_COUNT certificat(s) SSL trouvé(s)"
        certbot certificates 2>/dev/null | grep -E "(Certificate Name|Domains|Expiry Date)" | head -10
    else
        warning "Aucun certificat SSL trouvé"
    fi
else
    warning "Certbot non installé"
fi

echo ""

# ================================================================
# RÉSUMÉ ET RECOMMANDATIONS
# ================================================================

echo -e "${BLUE}=== RÉSUMÉ ===${NC}"

if [ "$ISSUES" -eq 0 ]; then
    log "✅ Système prêt pour la migration!"
    echo ""
    info "🚀 Vous pouvez procéder à la migration avec:"
    echo "   ./migration-fresh.sh"
else
    warning "⚠️ $ISSUES problème(s) détecté(s)"
    echo ""
    error "🛑 Recommandations avant migration:"
    if [ "$DISK_USAGE" -gt 80 ]; then
        echo "   • Libérer de l'espace disque (actuellement ${DISK_USAGE}%)"
    fi
    echo "   • Vérifier les services inactifs"
    echo "   • S'assurer que tous les services nécessaires sont installés"
fi

echo ""
echo -e "${BLUE}ℹ️ INFORMATIONS IMPORTANTES:${NC}"
echo "• La migration va créer une sauvegarde complète avant toute modification"
echo "• Temps d'indisponibilité estimé: 15-30 minutes"  
echo "• Rollback possible en cas de problème"
echo "• Tous les certificats SSL seront préservés"

echo ""
info "📋 Localisation de cette vérification:"
echo "   $(pwd)/$(basename $0)"

echo ""
echo "🎓 Prêt pour révolutionner l'éducation camerounaise!"