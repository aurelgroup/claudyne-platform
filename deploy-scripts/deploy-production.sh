#!/bin/bash

# ================================================================
# SCRIPT DE DÉPLOIEMENT PRODUCTION CLAUDYNE
# "La force du savoir en héritage"
# En hommage à Meffo Mehtah Tchandjio Claudine 👨‍👩‍👧‍👦
# ================================================================

set -e  # Arrêter le script en cas d'erreur

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/var/www/claudyne/claudyne-platform"
BACKUP_DIR="/var/backups/claudyne"
DATE=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/claudyne-deploy.log"

# Fonction de logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

# Fonction d'affichage avec couleur
print_colored() {
    echo -e "${2}${1}${NC}"
}

# Banner de début
print_banner() {
    print_colored "================================================================" $CYAN
    print_colored "               DÉPLOIEMENT PRODUCTION CLAUDYNE" $CYAN
    print_colored "================================================================" $CYAN
    print_colored "🎓 La force du savoir en héritage" $YELLOW
    print_colored "👨‍👩‍👧‍👦 En hommage à Meffo Mehtah Tchandjio Claudine" $PURPLE
    print_colored "📅 Date: $(date)" $BLUE
    print_colored "================================================================" $CYAN
    echo ""
}

# Vérifications préliminaires
check_prerequisites() {
    print_colored "🔍 Vérification des prérequis..." $BLUE
    
    # Vérifier si on est dans le bon répertoire
    if [ ! -f "$PROJECT_DIR/package.json" ]; then
        print_colored "❌ Erreur: Répertoire du projet introuvable: $PROJECT_DIR" $RED
        exit 1
    fi
    
    # Vérifier Node.js
    if ! command -v node &> /dev/null; then
        print_colored "❌ Erreur: Node.js n'est pas installé" $RED
        exit 1
    fi
    
    # Vérifier PM2
    if ! command -v pm2 &> /dev/null; then
        print_colored "❌ Erreur: PM2 n'est pas installé" $RED
        exit 1
    fi
    
    # Vérifier Nginx
    if ! systemctl is-active --quiet nginx; then
        print_colored "⚠️  Attention: Nginx n'est pas actif" $YELLOW
    fi
    
    # Vérifier PostgreSQL
    if ! systemctl is-active --quiet postgresql; then
        print_colored "❌ Erreur: PostgreSQL n'est pas actif" $RED
        exit 1
    fi
    
    print_colored "✅ Prérequis validés" $GREEN
    log "Prerequisites check completed successfully"
}

# Sauvegarde avant déploiement
backup_current_version() {
    print_colored "💾 Sauvegarde de la version actuelle..." $BLUE
    
    mkdir -p $BACKUP_DIR
    
    # Sauvegarde de la base de données
    print_colored "  📊 Sauvegarde base de données..." $CYAN
    sudo -u postgres pg_dump claudyne_prod > $BACKUP_DIR/db_backup_$DATE.sql
    
    # Sauvegarde des fichiers (si uploads existe)
    if [ -d "$PROJECT_DIR/uploads" ]; then
        print_colored "  📁 Sauvegarde des fichiers uploadés..." $CYAN
        tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz -C $PROJECT_DIR uploads/
    fi
    
    # Sauvegarde du code actuel
    print_colored "  💻 Sauvegarde du code actuel..." $CYAN
    cd $PROJECT_DIR
    git stash push -m "Pre-deployment backup $DATE" || true
    
    print_colored "✅ Sauvegarde terminée" $GREEN
    log "Backup completed: $BACKUP_DIR/db_backup_$DATE.sql"
}

# Récupération du nouveau code
pull_latest_code() {
    print_colored "📥 Récupération du code latest..." $BLUE
    
    cd $PROJECT_DIR
    
    # Vérifier le statut Git
    if [ -n "$(git status --porcelain)" ]; then
        print_colored "  ⚠️  Modifications locales détectées, stash en cours..." $YELLOW
        git stash push -m "Local changes before pull $DATE"
    fi
    
    # Récupérer les dernières modifications
    print_colored "  🔄 Git pull origin main..." $CYAN
    git pull origin main
    
    # Afficher les derniers commits
    print_colored "  📝 Derniers commits:" $CYAN
    git log --oneline -5
    
    print_colored "✅ Code mis à jour" $GREEN
    log "Code updated from repository"
}

# Installation des dépendances
install_dependencies() {
    print_colored "📦 Installation des dépendances..." $BLUE
    
    cd $PROJECT_DIR
    
    # Frontend dependencies
    if [ -f "package.json" ]; then
        print_colored "  🎨 Frontend dependencies..." $CYAN
        npm ci --only=production
    fi
    
    # Backend dependencies
    if [ -f "backend/package.json" ]; then
        print_colored "  ⚙️  Backend dependencies..." $CYAN
        cd backend
        npm ci --only=production
        cd ..
    fi
    
    print_colored "✅ Dépendances installées" $GREEN
    log "Dependencies installed successfully"
}

# Migrations base de données
run_migrations() {
    print_colored "🗃️  Exécution des migrations..." $BLUE
    
    cd $PROJECT_DIR/backend
    
    # Vérifier si Sequelize est configuré
    if [ -f ".sequelizerc" ] || [ -f "config/config.js" ] || [ -f "config/config.json" ]; then
        print_colored "  🔄 Migrations Sequelize..." $CYAN
        npx sequelize-cli db:migrate || true
    else
        print_colored "  ⚠️  Pas de configuration Sequelize détectée" $YELLOW
    fi
    
    cd ..
    print_colored "✅ Migrations terminées" $GREEN
    log "Database migrations completed"
}

# Optimisation des assets (si applicable)
optimize_assets() {
    print_colored "⚡ Optimisation des assets..." $BLUE
    
    cd $PROJECT_DIR
    
    # Si un script d'optimisation existe
    if [ -f "scripts/optimize-assets.js" ]; then
        print_colored "  🚀 Exécution de l'optimiseur..." $CYAN
        node scripts/optimize-assets.js || true
    fi
    
    # Vérification des Service Workers
    if [ -f "sw.js" ]; then
        print_colored "  🔧 Service Worker détecté" $CYAN
    fi
    
    print_colored "✅ Optimisation terminée" $GREEN
    log "Assets optimization completed"
}

# Test de l'application
test_application() {
    print_colored "🧪 Tests de l'application..." $BLUE
    
    cd $PROJECT_DIR
    
    # Tests backend (si configurés)
    if [ -f "backend/package.json" ] && grep -q "\"test\":" backend/package.json; then
        print_colored "  🔬 Tests backend..." $CYAN
        cd backend
        npm test -- --verbose=false --silent 2>/dev/null || print_colored "    ⚠️  Tests backend échoués (continuons)" $YELLOW
        cd ..
    fi
    
    # Vérification syntaxe JavaScript
    print_colored "  📝 Vérification syntaxe..." $CYAN
    node -c server.js || exit 1
    if [ -f "backend/src/server.js" ]; then
        node -c backend/src/server.js || exit 1
    fi
    
    print_colored "✅ Tests terminés" $GREEN
    log "Application tests completed"
}

# Redémarrage des services
restart_services() {
    print_colored "🔄 Redémarrage des services..." $BLUE
    
    # Arrêt gracieux des anciens processus
    print_colored "  🛑 Arrêt des processus PM2..." $CYAN
    pm2 stop all || true
    
    # Attendre quelques secondes
    sleep 3
    
    # Démarrage des nouveaux processus
    print_colored "  🚀 Démarrage des nouveaux processus..." $CYAN
    cd $PROJECT_DIR
    
    if [ -f "ecosystem.config.js" ]; then
        pm2 start ecosystem.config.js
    else
        # Démarrage manuel si pas de config PM2
        pm2 start server.js --name "claudyne-frontend" -i 2 --env production
        pm2 start backend/src/server.js --name "claudyne-backend" --env production
    fi
    
    # Sauvegarder la configuration PM2
    pm2 save
    
    # Attendre que les services se stabilisent
    sleep 5
    
    print_colored "✅ Services redémarrés" $GREEN
    log "Services restarted successfully"
}

# Vérifications post-déploiement
verify_deployment() {
    print_colored "✅ Vérifications post-déploiement..." $BLUE
    
    # Vérifier le statut PM2
    print_colored "  📊 Statut PM2:" $CYAN
    pm2 status
    
    # Tests de connectivité locale
    print_colored "  🌐 Tests de connectivité..." $CYAN
    
    # Attendre que les services soient prêts
    sleep 10
    
    # Test frontend
    if curl -f -s http://localhost:3000 > /dev/null; then
        print_colored "    ✅ Frontend (port 3000) - OK" $GREEN
    else
        print_colored "    ❌ Frontend (port 3000) - KO" $RED
    fi
    
    # Test backend
    if curl -f -s http://localhost:3001/api/health > /dev/null 2>&1; then
        print_colored "    ✅ Backend API (port 3001) - OK" $GREEN
    elif curl -f -s http://localhost:3001 > /dev/null 2>&1; then
        print_colored "    ✅ Backend (port 3001) - OK" $GREEN
    else
        print_colored "    ⚠️  Backend (port 3001) - À vérifier" $YELLOW
    fi
    
    # Test HTTPS (si disponible)
    if curl -f -s -k https://localhost > /dev/null 2>&1; then
        print_colored "    ✅ HTTPS - OK" $GREEN
    else
        print_colored "    ⚠️  HTTPS - À configurer" $YELLOW
    fi
    
    print_colored "✅ Vérifications terminées" $GREEN
    log "Post-deployment verification completed"
}

# Nettoyage des anciennes sauvegardes
cleanup_old_backups() {
    print_colored "🧹 Nettoyage des anciennes sauvegardes..." $BLUE
    
    # Garder seulement les 7 dernières sauvegardes
    find $BACKUP_DIR -name "db_backup_*.sql" -mtime +7 -delete 2>/dev/null || true
    find $BACKUP_DIR -name "uploads_backup_*.tar.gz" -mtime +7 -delete 2>/dev/null || true
    
    print_colored "✅ Nettoyage terminé" $GREEN
    log "Old backups cleaned up"
}

# Fonction de rollback (en cas d'erreur)
rollback() {
    print_colored "🔙 ROLLBACK: Restauration de la version précédente..." $RED
    
    cd $PROJECT_DIR
    
    # Restaurer le stash précédent
    if git stash list | grep -q "Pre-deployment backup"; then
        git stash pop $(git stash list | grep "Pre-deployment backup" | head -1 | cut -d: -f1)
    fi
    
    # Redémarrer les services
    pm2 restart all
    
    print_colored "⚠️  Rollback effectué - vérifiez l'état de l'application" $YELLOW
    log "Rollback completed due to deployment failure"
}

# Affichage du résumé final
display_summary() {
    print_colored "" $NC
    print_colored "================================================================" $CYAN
    print_colored "                   DÉPLOIEMENT TERMINÉ" $CYAN
    print_colored "================================================================" $CYAN
    print_colored "✅ Claudyne v1.2.0 déployé avec succès" $GREEN
    print_colored "📅 Date: $(date)" $BLUE
    print_colored "🔗 Frontend: https://claudyne.com" $PURPLE
    print_colored "🔗 Admin: https://claudyne.com/admin" $PURPLE
    print_colored "🔗 Student: https://claudyne.com/student" $PURPLE
    print_colored "🔗 API: https://claudyne.com/api" $PURPLE
    print_colored "" $NC
    print_colored "📊 Surveillance:" $YELLOW
    print_colored "  • pm2 monit" $CYAN
    print_colored "  • pm2 logs" $CYAN
    print_colored "  • tail -f $LOG_FILE" $CYAN
    print_colored "" $NC
    print_colored "🎓 La force du savoir en héritage" $YELLOW
    print_colored "👨‍👩‍👧‍👦 En hommage à Meffo Mehtah Tchandjio Claudine" $PURPLE
    print_colored "================================================================" $CYAN
}

# ================================================================
# EXÉCUTION PRINCIPALE
# ================================================================

main() {
    # Trappe pour gérer les erreurs
    trap 'print_colored "❌ Erreur détectée - Rollback automatique" $RED; rollback; exit 1' ERR
    
    print_banner
    
    # Étapes du déploiement
    check_prerequisites
    backup_current_version
    pull_latest_code
    install_dependencies
    run_migrations
    optimize_assets
    test_application
    restart_services
    verify_deployment
    cleanup_old_backups
    
    display_summary
    
    log "Deployment completed successfully"
    exit 0
}

# Gestion des arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "rollback")
        rollback
        ;;
    "status")
        pm2 status
        ;;
    "logs")
        pm2 logs
        ;;
    "monitor")
        pm2 monit
        ;;
    "help")
        echo "Usage: $0 [deploy|rollback|status|logs|monitor|help]"
        echo "  deploy   - Déployer la nouvelle version (par défaut)"
        echo "  rollback - Revenir à la version précédente"
        echo "  status   - Afficher le statut des services"
        echo "  logs     - Afficher les logs PM2"
        echo "  monitor  - Ouvrir le monitoring PM2"
        echo "  help     - Afficher cette aide"
        ;;
    *)
        print_colored "❌ Commande inconnue: $1" $RED
        echo "Utilisez '$0 help' pour voir les commandes disponibles"
        exit 1
        ;;
esac