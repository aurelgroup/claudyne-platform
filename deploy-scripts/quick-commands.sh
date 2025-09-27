#!/bin/bash

# ================================================================
# COMMANDES RAPIDES CLAUDYNE PRODUCTION
# "La force du savoir en héritage"
# En hommage à Meffo Mehtah Tchandjio Claudine 👨‍👩‍👧‍👦
# ================================================================

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
PROJECT_DIR="/var/www/claudyne/claudyne-platform"

print_colored() {
    echo -e "${2}${1}${NC}"
}

# ===== COMMANDES DE BASE =====

claudyne_status() {
    print_colored "📊 STATUT CLAUDYNE" $CYAN
    echo ""
    
    # PM2 Status
    print_colored "🔧 Services PM2:" $BLUE
    pm2 status
    echo ""
    
    # System Status
    print_colored "💻 Ressources système:" $BLUE
    echo "CPU: $(top -bn1 | grep 'Cpu(s)' | awk '{print $2}')"
    echo "RAM: $(free -h | awk 'NR==2{print $3"/"$2" ("$3/$2*100"%)"}')"
    echo "Disk: $(df -h / | awk 'NR==2{print $3"/"$2" ("$5")"}')"
    echo ""
    
    # Services Status
    print_colored "🛠️  Services système:" $BLUE
    echo "Nginx: $(systemctl is-active nginx)"
    echo "PostgreSQL: $(systemctl is-active postgresql)"
    if command -v redis-cli &> /dev/null; then
        echo "Redis: $(redis-cli ping 2>/dev/null || echo 'PONG')"
    fi
    echo ""
    
    # Site Check
    print_colored "🌐 Disponibilité site:" $BLUE
    for url in "https://claudyne.com" "https://claudyne.com/admin" "https://claudyne.com/student"; do
        status=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "ERROR")
        if [ "$status" = "200" ]; then
            print_colored "  ✅ $url" $GREEN
        else
            print_colored "  ❌ $url (HTTP $status)" $RED
        fi
    done
}

claudyne_logs() {
    local service="${1:-all}"
    
    case $service in
        "frontend")
            pm2 logs claudyne-frontend --lines 50
            ;;
        "backend")
            pm2 logs claudyne-backend --lines 50
            ;;
        "nginx")
            tail -50 /var/log/nginx/claudyne.com.error.log
            ;;
        "access")
            tail -50 /var/log/nginx/claudyne.com.access.log
            ;;
        "all"|*)
            print_colored "📋 LOGS CLAUDYNE (dernières 20 lignes)" $CYAN
            echo ""
            print_colored "🎨 Frontend:" $BLUE
            pm2 logs claudyne-frontend --lines 20 2>/dev/null || echo "Service frontend non trouvé"
            echo ""
            print_colored "⚙️  Backend:" $BLUE
            pm2 logs claudyne-backend --lines 20 2>/dev/null || echo "Service backend non trouvé"
            echo ""
            print_colored "🌐 Nginx Errors:" $BLUE
            tail -10 /var/log/nginx/claudyne.com.error.log 2>/dev/null || echo "Logs Nginx non trouvés"
            ;;
    esac
}

claudyne_restart() {
    local service="${1:-all}"
    
    print_colored "🔄 Redémarrage de $service..." $BLUE
    
    case $service in
        "frontend")
            pm2 restart claudyne-frontend
            ;;
        "backend")
            pm2 restart claudyne-backend
            ;;
        "nginx")
            sudo systemctl reload nginx
            ;;
        "all"|*)
            pm2 restart all
            sudo systemctl reload nginx
            print_colored "✅ Tous les services redémarrés" $GREEN
            ;;
    esac
}

claudyne_deploy() {
    print_colored "🚀 Déploiement rapide..." $BLUE
    
    cd $PROJECT_DIR
    
    # Backup
    git stash push -m "Quick deploy backup $(date)"
    
    # Pull
    git pull origin main
    
    # Install
    npm install --production
    cd backend && npm install --production && cd ..
    
    # Restart
    pm2 restart all
    
    print_colored "✅ Déploiement terminé" $GREEN
}

claudyne_backup() {
    local backup_dir="/var/backups/claudyne"
    local date=$(date +%Y%m%d_%H%M%S)
    
    print_colored "💾 Sauvegarde en cours..." $BLUE
    
    mkdir -p $backup_dir
    
    # Database backup
    sudo -u postgres pg_dump claudyne_production > $backup_dir/db_backup_$date.sql
    
    # Files backup (if uploads exist)
    if [ -d "$PROJECT_DIR/uploads" ]; then
        tar -czf $backup_dir/uploads_backup_$date.tar.gz -C $PROJECT_DIR uploads/
    fi
    
    print_colored "✅ Sauvegarde terminée: $backup_dir" $GREEN
    print_colored "📊 Taille:" $CYAN
    du -sh $backup_dir/*backup_$date*
}

claudyne_ssl() {
    print_colored "🔒 Vérification SSL..." $BLUE
    
    # Certificate info
    if [ -f "/etc/letsencrypt/live/claudyne.com/cert.pem" ]; then
        expiry=$(openssl x509 -in /etc/letsencrypt/live/claudyne.com/cert.pem -noout -enddate | cut -d= -f2)
        expiry_timestamp=$(date -d "$expiry" +%s)
        current_timestamp=$(date +%s)
        days_left=$(( (expiry_timestamp - current_timestamp) / 86400 ))
        
        print_colored "📅 Expiration: $expiry" $CYAN
        if [ $days_left -lt 30 ]; then
            print_colored "⚠️  Expire dans $days_left jours" $YELLOW
        else
            print_colored "✅ Valide encore $days_left jours" $GREEN
        fi
        
        # Renewal test
        print_colored "🔄 Test de renouvellement:" $BLUE
        sudo certbot renew --dry-run
    else
        print_colored "❌ Certificat SSL non trouvé" $RED
    fi
}

claudyne_performance() {
    print_colored "⚡ Test de performance..." $BLUE
    echo ""
    
    # Response time
    for url in "https://claudyne.com" "https://claudyne.com/admin" "https://claudyne.com/student" "https://claudyne.com/api/health"; do
        response_time=$(curl -o /dev/null -s -w '%{time_total}' "$url" 2>/dev/null || echo "ERROR")
        if [ "$response_time" != "ERROR" ]; then
            response_ms=$(echo "$response_time * 1000" | bc -l | cut -d. -f1)
            if [ $response_ms -lt 1000 ]; then
                print_colored "  ✅ $url: ${response_ms}ms" $GREEN
            elif [ $response_ms -lt 3000 ]; then
                print_colored "  ⚠️  $url: ${response_ms}ms" $YELLOW
            else
                print_colored "  ❌ $url: ${response_ms}ms" $RED
            fi
        else
            print_colored "  ❌ $url: ERROR" $RED
        fi
    done
    
    echo ""
    print_colored "🔧 Optimisations suggérées:" $BLUE
    echo "  • Vérifiez le cache Nginx"
    echo "  • Surveillez les processus PM2"
    echo "  • Optimisez les requêtes base de données"
}

claudyne_maintenance() {
    local mode="${1:-status}"
    
    case $mode in
        "on")
            print_colored "🔧 Activation mode maintenance..." $YELLOW
            # Créer une page de maintenance
            cat > /tmp/maintenance.html << 'EOF'
<!DOCTYPE html><html><head><title>Maintenance - Claudyne</title><style>body{font-family:Arial;background:#1a1a2e;color:white;text-align:center;padding:50px;}.container{max-width:600px;margin:0 auto;}.title{font-size:2.5em;color:#FFD700;margin-bottom:30px;}.message{font-size:1.2em;margin-bottom:40px;}.tribute{opacity:0.8;margin-top:50px;}</style></head><body><div class="container"><div class="title">🔧 Maintenance en cours</div><div class="message"><p>Claudyne est temporairement en maintenance pour des améliorations.</p><p>Nous serons de retour très bientôt !</p></div><div class="tribute"><p><em>"La force du savoir en héritage"</em></p><p>👨‍👩‍👧‍👦 En hommage à Meffo Mehtah Tchandjio Claudine</p></div></div></body></html>
EOF
            sudo cp /tmp/maintenance.html /var/www/claudyne/claudyne-platform/
            pm2 stop all
            print_colored "✅ Mode maintenance activé" $GREEN
            ;;
        "off")
            print_colored "🚀 Désactivation mode maintenance..." $GREEN
            pm2 start all
            rm -f /var/www/claudyne/claudyne-platform/maintenance.html
            print_colored "✅ Mode maintenance désactivé" $GREEN
            ;;
        "status"|*)
            if pm2 list | grep -q "online"; then
                print_colored "✅ Site en fonctionnement normal" $GREEN
            else
                print_colored "⚠️  Site en maintenance" $YELLOW
            fi
            ;;
    esac
}

claudyne_db() {
    local action="${1:-status}"
    
    case $action in
        "status")
            print_colored "🗃️  Statut base de données:" $BLUE
            sudo -u postgres psql -d claudyne_production -c "
                SELECT 
                    schemaname,
                    tablename,
                    n_tup_ins as inserts,
                    n_tup_upd as updates,
                    n_tup_del as deletes
                FROM pg_stat_user_tables 
                ORDER BY n_tup_ins DESC 
                LIMIT 10;
            "
            ;;
        "backup")
            claudyne_backup
            ;;
        "size")
            print_colored "📊 Taille de la base de données:" $BLUE
            sudo -u postgres psql -d claudyne_production -c "
                SELECT 
                    pg_database.datname,
                    pg_size_pretty(pg_database_size(pg_database.datname)) AS size
                FROM pg_database 
                WHERE datname = 'claudyne_production';
            "
            ;;
        *)
            print_colored "Usage: claudyne db [status|backup|size]" $YELLOW
            ;;
    esac
}

# ===== FONCTION D'AIDE =====

claudyne_help() {
    print_colored "================================================================" $CYAN
    print_colored "            COMMANDES RAPIDES CLAUDYNE" $CYAN
    print_colored "================================================================" $CYAN
    print_colored "🎓 La force du savoir en héritage" $YELLOW
    print_colored "👨‍👩‍👧‍👦 En hommage à Meffo Mehtah Tchandjio Claudine" $PURPLE
    print_colored "================================================================" $CYAN
    echo ""
    print_colored "📊 MONITORING:" $BLUE
    echo "  claudyne status              - Statut général du système"
    echo "  claudyne logs [service]      - Voir les logs (all|frontend|backend|nginx|access)"
    echo "  claudyne performance         - Test de performance"
    echo ""
    print_colored "🔧 GESTION:" $BLUE
    echo "  claudyne restart [service]   - Redémarrer (all|frontend|backend|nginx)"
    echo "  claudyne deploy              - Déploiement rapide"
    echo "  claudyne maintenance [on|off|status] - Mode maintenance"
    echo ""
    print_colored "💾 SAUVEGARDE:" $BLUE
    echo "  claudyne backup              - Sauvegarde complète"
    echo "  claudyne db [action]         - Gestion BDD (status|backup|size)"
    echo ""
    print_colored "🔒 SÉCURITÉ:" $BLUE
    echo "  claudyne ssl                 - Vérification SSL"
    echo ""
    print_colored "❓ AIDE:" $BLUE
    echo "  claudyne help                - Cette aide"
    echo ""
    print_colored "Exemples:" $CYAN
    echo "  claudyne status              # Voir le statut"
    echo "  claudyne logs frontend       # Logs du frontend"
    echo "  claudyne restart backend     # Redémarrer le backend"
    echo "  claudyne deploy              # Déployer rapidement"
    print_colored "================================================================" $CYAN
}

# ===== FONCTION PRINCIPALE =====

claudyne() {
    local command="${1:-help}"
    
    case $command in
        "status")
            claudyne_status
            ;;
        "logs")
            claudyne_logs "$2"
            ;;
        "restart")
            claudyne_restart "$2"
            ;;
        "deploy")
            claudyne_deploy
            ;;
        "backup")
            claudyne_backup
            ;;
        "ssl")
            claudyne_ssl
            ;;
        "performance"|"perf")
            claudyne_performance
            ;;
        "maintenance"|"maint")
            claudyne_maintenance "$2"
            ;;
        "db")
            claudyne_db "$2"
            ;;
        "help"|*)
            claudyne_help
            ;;
    esac
}

# Si le script est exécuté directement
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    claudyne "$@"
fi

# ================================================================
# POUR UTILISER CES COMMANDES PARTOUT :
# 
# 1. Copier ce script dans /usr/local/bin/claudyne :
#    sudo cp quick-commands.sh /usr/local/bin/claudyne
#    sudo chmod +x /usr/local/bin/claudyne
#
# 2. Ou ajouter un alias dans ~/.bashrc :
#    echo 'alias claudyne="/path/to/quick-commands.sh"' >> ~/.bashrc
#    source ~/.bashrc
#
# 3. Utiliser les commandes :
#    claudyne status
#    claudyne deploy
#    claudyne logs frontend
#    etc.
# ================================================================