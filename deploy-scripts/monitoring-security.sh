#!/bin/bash

# ================================================================
# SCRIPT DE MONITORING ET SÉCURITÉ CLAUDYNE PRODUCTION
# "La force du savoir en héritage"
# En hommage à Meffo Mehtah Tchandjio Claudine 👨‍👩‍👧‍👦
# ================================================================

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="/var/www/claudyne/claudyne-platform"
LOG_FILE="/var/log/claudyne-monitoring.log"
ALERT_EMAIL="admin@claudyne.com"
TELEGRAM_BOT_TOKEN=""  # À configurer si souhaité
TELEGRAM_CHAT_ID=""    # À configurer si souhaité

# Seuils d'alerte
CPU_THRESHOLD=80
MEMORY_THRESHOLD=85
DISK_THRESHOLD=90
RESPONSE_TIME_THRESHOLD=5000  # en millisecondes

# Fonction de logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

# Fonction d'affichage avec couleur
print_colored() {
    echo -e "${2}${1}${NC}"
}

# Banner de monitoring
print_banner() {
    print_colored "================================================================" $CYAN
    print_colored "            MONITORING & SÉCURITÉ CLAUDYNE" $CYAN
    print_colored "================================================================" $CYAN
    print_colored "🎓 La force du savoir en héritage" $YELLOW
    print_colored "👨‍👩‍👧‍👦 En hommage à Meffo Mehtah Tchandjio Claudine" $PURPLE
    print_colored "📅 $(date)" $BLUE
    print_colored "================================================================" $CYAN
    echo ""
}

# ===== FONCTIONS DE MONITORING SYSTÈME =====

check_system_resources() {
    print_colored "🖥️  Vérification des ressources système..." $BLUE
    
    # CPU Usage
    CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
    if (( $(echo "$CPU_USAGE > $CPU_THRESHOLD" | bc -l) )); then
        print_colored "  ⚠️  CPU élevé: ${CPU_USAGE}%" $YELLOW
        log "HIGH CPU: ${CPU_USAGE}%"
        send_alert "CPU élevé: ${CPU_USAGE}%"
    else
        print_colored "  ✅ CPU: ${CPU_USAGE}%" $GREEN
    fi
    
    # Memory Usage
    MEMORY_INFO=$(free | grep Mem)
    TOTAL_MEM=$(echo $MEMORY_INFO | awk '{print $2}')
    USED_MEM=$(echo $MEMORY_INFO | awk '{print $3}')
    MEMORY_USAGE=$(( (USED_MEM * 100) / TOTAL_MEM ))
    
    if [ $MEMORY_USAGE -gt $MEMORY_THRESHOLD ]; then
        print_colored "  ⚠️  Mémoire élevée: ${MEMORY_USAGE}%" $YELLOW
        log "HIGH MEMORY: ${MEMORY_USAGE}%"
        send_alert "Mémoire élevée: ${MEMORY_USAGE}%"
    else
        print_colored "  ✅ Mémoire: ${MEMORY_USAGE}%" $GREEN
    fi
    
    # Disk Usage
    DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ $DISK_USAGE -gt $DISK_THRESHOLD ]; then
        print_colored "  ❌ Disque plein: ${DISK_USAGE}%" $RED
        log "HIGH DISK: ${DISK_USAGE}%"
        send_alert "Disque plein: ${DISK_USAGE}%"
    else
        print_colored "  ✅ Disque: ${DISK_USAGE}%" $GREEN
    fi
    
    # Load Average
    LOAD_AVG=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    print_colored "  📊 Load Average: $LOAD_AVG" $CYAN
    
    log "System check: CPU=${CPU_USAGE}%, MEM=${MEMORY_USAGE}%, DISK=${DISK_USAGE}%"
}

check_services_status() {
    print_colored "🔧 Vérification des services..." $BLUE
    
    # PM2 Processes
    if ! command -v pm2 &> /dev/null; then
        print_colored "  ❌ PM2 non installé" $RED
        return 1
    fi
    
    PM2_STATUS=$(pm2 jlist 2>/dev/null || echo "[]")
    if [ "$PM2_STATUS" = "[]" ]; then
        print_colored "  ❌ Aucun processus PM2 actif" $RED
        log "ERROR: No PM2 processes running"
        send_alert "Aucun processus PM2 actif"
    else
        # Analyser le statut de chaque app
        echo "$PM2_STATUS" | jq -r '.[] | "\(.name): \(.pm2_env.status)"' | while IFS=': ' read -r name status; do
            if [ "$status" = "online" ]; then
                print_colored "  ✅ $name: $status" $GREEN
            else
                print_colored "  ❌ $name: $status" $RED
                log "ERROR: $name is $status"
                send_alert "Service $name est $status"
            fi
        done
    fi
    
    # Nginx Status
    if systemctl is-active --quiet nginx; then
        print_colored "  ✅ Nginx: actif" $GREEN
    else
        print_colored "  ❌ Nginx: inactif" $RED
        log "ERROR: Nginx is not running"
        send_alert "Nginx est inactif"
    fi
    
    # PostgreSQL Status
    if systemctl is-active --quiet postgresql; then
        print_colored "  ✅ PostgreSQL: actif" $GREEN
    else
        print_colored "  ❌ PostgreSQL: inactif" $RED
        log "ERROR: PostgreSQL is not running"
        send_alert "PostgreSQL est inactif"
    fi
    
    # Redis Status (si installé)
    if command -v redis-cli &> /dev/null; then
        if redis-cli ping >/dev/null 2>&1; then
            print_colored "  ✅ Redis: actif" $GREEN
        else
            print_colored "  ❌ Redis: inactif" $RED
            log "ERROR: Redis is not responding"
            send_alert "Redis ne répond pas"
        fi
    fi
}

check_website_availability() {
    print_colored "🌐 Vérification de la disponibilité..." $BLUE
    
    # Test HTTPS principal
    RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' -m 10 https://claudyne.com || echo "0")
    RESPONSE_TIME_MS=$(echo "$RESPONSE_TIME * 1000" | bc -l | cut -d. -f1)
    HTTP_CODE=$(curl -o /dev/null -s -w '%{http_code}' -m 10 https://claudyne.com || echo "000")
    
    if [ "$HTTP_CODE" = "200" ]; then
        if [ $RESPONSE_TIME_MS -gt $RESPONSE_TIME_THRESHOLD ]; then
            print_colored "  ⚠️  Site accessible mais lent: ${RESPONSE_TIME_MS}ms" $YELLOW
            log "SLOW RESPONSE: ${RESPONSE_TIME_MS}ms"
        else
            print_colored "  ✅ Site principal: ${RESPONSE_TIME_MS}ms" $GREEN
        fi
    else
        print_colored "  ❌ Site inaccessible (HTTP $HTTP_CODE)" $RED
        log "ERROR: Website unreachable - HTTP $HTTP_CODE"
        send_alert "Site inaccessible - HTTP $HTTP_CODE"
    fi
    
    # Test des interfaces spécifiques
    for endpoint in "/admin" "/student" "/api/health"; do
        HTTP_CODE=$(curl -o /dev/null -s -w '%{http_code}' -m 5 "https://claudyne.com$endpoint" || echo "000")
        if [ "$HTTP_CODE" = "200" ]; then
            print_colored "  ✅ $endpoint: OK" $GREEN
        else
            print_colored "  ⚠️  $endpoint: HTTP $HTTP_CODE" $YELLOW
            log "WARNING: $endpoint returned HTTP $HTTP_CODE"
        fi
    done
}

# ===== FONCTIONS DE SÉCURITÉ =====

check_security_logs() {
    print_colored "🔒 Vérification des logs de sécurité..." $BLUE
    
    # Tentatives de connexion SSH suspectes
    FAILED_SSH=$(grep "Failed password" /var/log/auth.log | tail -10 | wc -l)
    if [ $FAILED_SSH -gt 5 ]; then
        print_colored "  ⚠️  $FAILED_SSH tentatives SSH échouées récentes" $YELLOW
        log "WARNING: $FAILED_SSH failed SSH attempts"
    else
        print_colored "  ✅ SSH: $FAILED_SSH tentatives échouées" $GREEN
    fi
    
    # Vérification des erreurs Nginx
    NGINX_ERRORS=$(grep -c "error" /var/log/nginx/claudyne.com.error.log | tail -1 || echo "0")
    if [ $NGINX_ERRORS -gt 10 ]; then
        print_colored "  ⚠️  $NGINX_ERRORS erreurs Nginx récentes" $YELLOW
        log "WARNING: $NGINX_ERRORS Nginx errors"
    else
        print_colored "  ✅ Nginx: $NGINX_ERRORS erreurs" $GREEN
    fi
    
    # Vérification des certificats SSL
    CERT_EXPIRY=$(openssl x509 -in /etc/letsencrypt/live/claudyne.com/cert.pem -noout -enddate 2>/dev/null | cut -d= -f2 || echo "Unable to check")
    if [ "$CERT_EXPIRY" != "Unable to check" ]; then
        EXPIRY_TIMESTAMP=$(date -d "$CERT_EXPIRY" +%s)
        CURRENT_TIMESTAMP=$(date +%s)
        DAYS_LEFT=$(( (EXPIRY_TIMESTAMP - CURRENT_TIMESTAMP) / 86400 ))
        
        if [ $DAYS_LEFT -lt 7 ]; then
            print_colored "  ❌ Certificat SSL expire dans $DAYS_LEFT jours!" $RED
            log "CRITICAL: SSL certificate expires in $DAYS_LEFT days"
            send_alert "Certificat SSL expire dans $DAYS_LEFT jours"
        elif [ $DAYS_LEFT -lt 30 ]; then
            print_colored "  ⚠️  Certificat SSL expire dans $DAYS_LEFT jours" $YELLOW
            log "WARNING: SSL certificate expires in $DAYS_LEFT days"
        else
            print_colored "  ✅ Certificat SSL valide ($DAYS_LEFT jours)" $GREEN
        fi
    else
        print_colored "  ⚠️  Impossible de vérifier le certificat SSL" $YELLOW
    fi
}

check_firewall_status() {
    print_colored "🛡️  Vérification du firewall..." $BLUE
    
    if command -v ufw &> /dev/null; then
        UFW_STATUS=$(ufw status | head -1)
        if echo "$UFW_STATUS" | grep -q "active"; then
            print_colored "  ✅ UFW: actif" $GREEN
        else
            print_colored "  ❌ UFW: inactif" $RED
            log "ERROR: UFW firewall is not active"
            send_alert "Firewall UFW inactif"
        fi
    else
        print_colored "  ⚠️  UFW non installé" $YELLOW
    fi
    
    # Vérification des ports ouverts
    OPEN_PORTS=$(ss -tuln | grep LISTEN | awk '{print $5}' | cut -d: -f2 | sort -n | uniq | tr '\n' ' ')
    print_colored "  📊 Ports ouverts: $OPEN_PORTS" $CYAN
}

# ===== FONCTIONS D'ALERTE =====

send_alert() {
    local MESSAGE="$1"
    local TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Email alert (si configuré)
    if [ -n "$ALERT_EMAIL" ] && command -v mail &> /dev/null; then
        echo "ALERTE CLAUDYNE - $TIMESTAMP: $MESSAGE" | mail -s "🚨 Alerte Claudyne Production" $ALERT_EMAIL
    fi
    
    # Telegram alert (si configuré)
    if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
        curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
             -d chat_id="$TELEGRAM_CHAT_ID" \
             -d text="🚨 ALERTE CLAUDYNE - $TIMESTAMP: $MESSAGE" >/dev/null 2>&1
    fi
    
    log "ALERT SENT: $MESSAGE"
}

# ===== FONCTIONS DE MAINTENANCE =====

cleanup_logs() {
    print_colored "🧹 Nettoyage des logs..." $BLUE
    
    # Rotation des logs Claudyne
    if [ -f "$LOG_FILE" ]; then
        LOG_SIZE=$(stat -c%s "$LOG_FILE")
        if [ $LOG_SIZE -gt 10485760 ]; then  # 10MB
            mv "$LOG_FILE" "${LOG_FILE}.old"
            touch "$LOG_FILE"
            print_colored "  🔄 Log principal archivé" $CYAN
        fi
    fi
    
    # Nettoyage des anciens logs PM2
    find "$PROJECT_DIR/logs" -name "*.log" -mtime +7 -delete 2>/dev/null || true
    
    # Nettoyage des anciens backups
    find /var/backups/claudyne -name "*.sql" -mtime +30 -delete 2>/dev/null || true
    find /var/backups/claudyne -name "*.tar.gz" -mtime +30 -delete 2>/dev/null || true
    
    print_colored "  ✅ Nettoyage terminé" $GREEN
}

update_system_packages() {
    print_colored "📦 Vérification des mises à jour..." $BLUE
    
    # Mise à jour de la liste des packages
    apt update -qq
    
    # Vérifier s'il y a des mises à jour de sécurité
    SECURITY_UPDATES=$(apt list --upgradable 2>/dev/null | grep -c security || echo "0")
    if [ $SECURITY_UPDATES -gt 0 ]; then
        print_colored "  ⚠️  $SECURITY_UPDATES mises à jour de sécurité disponibles" $YELLOW
        log "WARNING: $SECURITY_UPDATES security updates available"
    else
        print_colored "  ✅ Système à jour" $GREEN
    fi
    
    # Auto-clean des packages
    apt autoremove -y >/dev/null 2>&1
    apt autoclean >/dev/null 2>&1
}

# ===== FONCTIONS DE RAPPORT =====

generate_report() {
    local REPORT_FILE="/tmp/claudyne-health-report-$(date +%Y%m%d_%H%M%S).txt"
    
    print_colored "📊 Génération du rapport..." $BLUE
    
    cat > $REPORT_FILE << EOF
================================================================
RAPPORT DE SANTÉ CLAUDYNE - $(date)
================================================================

🎓 La force du savoir en héritage
👨‍👩‍👧‍👦 En hommage à Meffo Mehtah Tchandjio Claudine

=== RESSOURCES SYSTÈME ===
$(check_system_resources 2>&1 | sed 's/\x1b\[[0-9;]*m//g')

=== SERVICES ===
$(check_services_status 2>&1 | sed 's/\x1b\[[0-9;]*m//g')

=== DISPONIBILITÉ SITE ===
$(check_website_availability 2>&1 | sed 's/\x1b\[[0-9;]*m//g')

=== SÉCURITÉ ===
$(check_security_logs 2>&1 | sed 's/\x1b\[[0-9;]*m//g')
$(check_firewall_status 2>&1 | sed 's/\x1b\[[0-9;]*m//g')

=== PROCESSUS PM2 ===
$(pm2 status 2>/dev/null || echo "PM2 non disponible")

=== DISQUES ET INODES ===
$(df -h)

=== MÉMOIRE ===
$(free -h)

=== LOAD AVERAGE ===
$(uptime)

=== DERNIERS LOGS D'ERREUR ===
$(tail -20 /var/log/nginx/claudyne.com.error.log 2>/dev/null || echo "Logs Nginx non disponibles")

================================================================
Rapport généré le $(date)
================================================================
EOF
    
    print_colored "  📄 Rapport sauvegardé: $REPORT_FILE" $CYAN
    
    # Envoyer le rapport par email si configuré
    if [ -n "$ALERT_EMAIL" ] && command -v mail &> /dev/null; then
        mail -s "📊 Rapport Claudyne $(date +%Y-%m-%d)" -A $REPORT_FILE $ALERT_EMAIL < /dev/null
        print_colored "  ✉️  Rapport envoyé par email" $CYAN
    fi
    
    log "Health report generated: $REPORT_FILE"
}

# ===== FONCTION PRINCIPALE =====

run_monitoring() {
    print_banner
    
    check_system_resources
    echo ""
    
    check_services_status
    echo ""
    
    check_website_availability
    echo ""
    
    check_security_logs
    echo ""
    
    check_firewall_status
    echo ""
    
    cleanup_logs
    echo ""
    
    update_system_packages
    echo ""
    
    print_colored "================================================================" $CYAN
    print_colored "                MONITORING TERMINÉ" $CYAN
    print_colored "================================================================" $CYAN
    print_colored "✅ Vérifications de santé terminées" $GREEN
    print_colored "📊 Logs disponibles dans: $LOG_FILE" $BLUE
    print_colored "🔗 Surveillance: pm2 monit" $PURPLE
    print_colored "" $NC
    print_colored "👨‍👩‍👧‍👦 En hommage à Meffo Mehtah Tchandjio Claudine" $PURPLE
    print_colored "================================================================" $CYAN
    
    log "Monitoring cycle completed successfully"
}

# ===== GESTION DES ARGUMENTS =====

case "${1:-monitor}" in
    "monitor"|"check")
        run_monitoring
        ;;
    "report")
        generate_report
        ;;
    "security")
        print_banner
        check_security_logs
        check_firewall_status
        ;;
    "resources")
        print_banner
        check_system_resources
        ;;
    "services")
        print_banner
        check_services_status
        ;;
    "cleanup")
        print_banner
        cleanup_logs
        ;;
    "alert-test")
        send_alert "Test d'alerte - Système opérationnel"
        print_colored "✅ Test d'alerte envoyé" $GREEN
        ;;
    "install")
        # Installation des dépendances de monitoring
        print_colored "🔧 Installation des outils de monitoring..." $BLUE
        apt update
        apt install -y htop iotop nethogs jq bc mailutils curl
        
        # Configuration du cron pour monitoring automatique
        CRON_LINE="*/5 * * * * $0 monitor >/dev/null 2>&1"
        (crontab -l 2>/dev/null; echo "$CRON_LINE") | crontab -
        
        print_colored "✅ Installation terminée" $GREEN
        print_colored "📅 Monitoring automatique configuré (toutes les 5 minutes)" $CYAN
        ;;
    "help")
        echo "Usage: $0 [monitor|report|security|resources|services|cleanup|alert-test|install|help]"
        echo ""
        echo "Commandes disponibles:"
        echo "  monitor     - Monitoring complet (par défaut)"
        echo "  report      - Générer un rapport détaillé"
        echo "  security    - Vérifications de sécurité uniquement"
        echo "  resources   - Vérification des ressources système"
        echo "  services    - Vérification des services"
        echo "  cleanup     - Nettoyage des logs"
        echo "  alert-test  - Test d'envoi d'alerte"
        echo "  install     - Installer les outils de monitoring"
        echo "  help        - Afficher cette aide"
        echo ""
        echo "Configuration des alertes:"
        echo "  ALERT_EMAIL=\"admin@claudyne.com\""
        echo "  TELEGRAM_BOT_TOKEN=\"your_bot_token\""
        echo "  TELEGRAM_CHAT_ID=\"your_chat_id\""
        ;;
    *)
        print_colored "❌ Commande inconnue: $1" $RED
        echo "Utilisez '$0 help' pour voir les commandes disponibles"
        exit 1
        ;;
esac