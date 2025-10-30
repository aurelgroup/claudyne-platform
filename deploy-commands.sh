#!/bin/bash

# 🚀 CLAUDYNE VPS DEPLOYMENT COMMANDS
# Commandes d'exécution pour déploiement sur Contabo VPS
# IP: 89.117.58.53 | Domain: claudyne.com

set -e

# ================================
# CONFIGURATION
# ================================
VPS_IP="89.117.58.53"
VPS_USER="root"
DOMAIN="claudyne.com"
GITHUB_REPO="https://github.com/aurelgroup/claudyne-platform"
GITHUB_TOKEN="YOUR_GITHUB_TOKEN_HERE"
DEPLOY_DIR="/tmp/claudyne-deploy"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] ✅ $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] ℹ️  $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ❌ $1${NC}"
    exit 1
}

# ================================
# COMMANDES DE DÉPLOIEMENT
# ================================

# Fonction 1: Test de connectivité
test_vps_connectivity() {
    info "Testing VPS connectivity..."

    if ssh -o ConnectTimeout=10 -o BatchMode=yes $VPS_USER@$VPS_IP "echo 'SSH OK'" 2>/dev/null; then
        log "VPS connectivity: ✅ SUCCESS"
    else
        error "Cannot connect to VPS. Please check SSH configuration."
    fi
}

# Fonction 2: Préparation du VPS
prepare_vps() {
    info "Preparing VPS for deployment..."

    ssh $VPS_USER@$VPS_IP << 'EOSSH'
        # Update system
        apt-get update -qq

        # Create deployment directory
        mkdir -p /tmp/claudyne-deploy

        # Install git if not present
        if ! command -v git &> /dev/null; then
            apt-get install -y git
        fi

        echo "VPS preparation completed"
EOSSH

    log "VPS prepared successfully"
}

# Fonction 3: Upload des fichiers de déploiement
upload_deployment_files() {
    info "Uploading deployment files to VPS..."

    # Copy deployment scripts
    scp deploy-pre-check.sh $VPS_USER@$VPS_IP:$DEPLOY_DIR/
    scp deploy-production-expert.sh $VPS_USER@$VPS_IP:$DEPLOY_DIR/

    # Copy application files (excluding node_modules)
    rsync -av --exclude='node_modules' --exclude='.git' --exclude='*.log' \
          ./ $VPS_USER@$VPS_IP:$DEPLOY_DIR/

    log "Deployment files uploaded successfully"
}

# Fonction 4: Clone depuis GitHub (alternative)
clone_from_github() {
    info "Cloning application from GitHub..."

    ssh $VPS_USER@$VPS_IP << EOSSH
        cd /tmp
        rm -rf claudyne-deploy

        # Clone with token authentication
        git clone https://$GITHUB_TOKEN@github.com/aurelgroup/claudyne-platform.git claudyne-deploy

        cd claudyne-deploy
        chmod +x deploy-pre-check.sh
        chmod +x deploy-production-expert.sh

        echo "GitHub clone completed"
EOSSH

    log "Application cloned from GitHub successfully"
}

# Fonction 5: Exécution des validations pré-déploiement
run_pre_deployment_checks() {
    info "Running pre-deployment validation..."

    ssh $VPS_USER@$VPS_IP << 'EOSSH'
        cd /tmp/claudyne-deploy

        # Make script executable
        chmod +x deploy-pre-check.sh

        # Run pre-deployment checks
        ./deploy-pre-check.sh

        echo "Pre-deployment checks completed"
EOSSH

    log "Pre-deployment validation completed"
}

# Fonction 6: Déploiement principal
run_main_deployment() {
    info "Running main deployment..."

    ssh $VPS_USER@$VPS_IP << 'EOSSH'
        cd /tmp/claudyne-deploy

        # Make script executable
        chmod +x deploy-production-expert.sh

        # Run main deployment
        ./deploy-production-expert.sh

        echo "Main deployment completed"
EOSSH

    log "Main deployment completed"
}

# Fonction 7: Vérification post-déploiement
verify_deployment() {
    info "Verifying deployment..."

    # Test health endpoints
    sleep 30  # Wait for services to start

    local endpoints=(
        "http://$VPS_IP:3001/health"
        "http://$VPS_IP:3002/mobile-api/ping"
    )

    for endpoint in "${endpoints[@]}"; do
        if curl -f -s "$endpoint" > /dev/null; then
            log "Endpoint $endpoint: ✅ OK"
        else
            warn "Endpoint $endpoint: ⚠️ NOT RESPONDING"
        fi
    done

    # Test HTTPS if SSL is configured
    if curl -f -s "https://$DOMAIN/health" > /dev/null 2>&1; then
        log "HTTPS endpoint: ✅ OK"
    else
        warn "HTTPS endpoint: ⚠️ NOT READY (SSL might still be configuring)"
    fi
}

# Fonction 8: Affichage du statut des services
show_services_status() {
    info "Checking services status..."

    ssh $VPS_USER@$VPS_IP << 'EOSSH'
        echo "=== SERVICES STATUS ==="
        echo "Nginx: $(systemctl is-active nginx)"
        echo "PostgreSQL: $(systemctl is-active postgresql)"
        echo "PM2: $(systemctl is-active pm2-claudyne 2>/dev/null || echo 'checking...')"
        echo "Monitoring: $(systemctl is-active claudyne-monitor 2>/dev/null || echo 'checking...')"
        echo ""

        echo "=== PM2 PROCESSES ==="
        sudo -u claudyne pm2 list 2>/dev/null || echo "PM2 not yet configured"
        echo ""

        echo "=== PORTS IN USE ==="
        ss -tulpn | grep -E ':(80|443|3001|3002|5432)\s' || echo "Checking ports..."
        echo ""

        echo "=== DISK USAGE ==="
        df -h /
        echo ""

        echo "=== MEMORY USAGE ==="
        free -h
EOSSH
}

# ================================
# MENU INTERACTIF
# ================================
show_menu() {
    echo -e "${BLUE}"
    echo "🚀 =========================================="
    echo "   CLAUDYNE VPS DEPLOYMENT COMMANDS"
    echo "   VPS: $VPS_IP | Domain: $DOMAIN"
    echo "🚀 =========================================="
    echo -e "${NC}"
    echo ""
    echo "1. Test VPS Connectivity"
    echo "2. Prepare VPS"
    echo "3. Upload Deployment Files"
    echo "4. Clone from GitHub (Alternative)"
    echo "5. Run Pre-deployment Checks"
    echo "6. Run Main Deployment"
    echo "7. Verify Deployment"
    echo "8. Show Services Status"
    echo "9. Complete Deployment (Steps 1-8)"
    echo "0. Exit"
    echo ""
}

# Fonction de déploiement complet
complete_deployment() {
    log "Starting complete deployment process..."

    test_vps_connectivity
    prepare_vps
    clone_from_github  # Using GitHub clone as primary method
    run_pre_deployment_checks
    run_main_deployment
    verify_deployment
    show_services_status

    echo -e "${GREEN}"
    echo "🎉 =========================================="
    echo "   DEPLOYMENT PROCESS COMPLETED"
    echo "🎉 =========================================="
    echo ""
    echo "🌐 Website: https://$DOMAIN"
    echo "📡 API: https://$DOMAIN/api"
    echo "📱 Mobile API: https://$DOMAIN/mobile-api"
    echo "🩺 Health: https://$DOMAIN/health"
    echo "🔒 Admin: https://$DOMAIN/admin-secure-k7m9x4n2p8w5z1c6"
    echo ""
    echo "📊 Monitor: ssh $VPS_USER@$VPS_IP 'systemctl status claudyne-monitor'"
    echo "📋 PM2: ssh $VPS_USER@$VPS_IP 'sudo -u claudyne pm2 monit'"
    echo "📄 Logs: ssh $VPS_USER@$VPS_IP 'tail -f /var/log/claudyne/*.log'"
    echo ""
    echo "🇨🇲 Claudyne is now live for Cameroonian families!"
    echo "=========================================="
    echo -e "${NC}"
}

# ================================
# COMMANDES RAPIDES
# ================================

# Commande rapide: Déploiement complet automatique
if [[ "$1" == "auto" ]]; then
    complete_deployment
    exit 0
fi

# Commande rapide: Test de connectivité uniquement
if [[ "$1" == "test" ]]; then
    test_vps_connectivity
    exit 0
fi

# Commande rapide: Statut des services
if [[ "$1" == "status" ]]; then
    show_services_status
    exit 0
fi

# Commande rapide: Vérification de la santé
if [[ "$1" == "health" ]]; then
    verify_deployment
    exit 0
fi

# ================================
# MENU PRINCIPAL
# ================================
main() {
    while true; do
        show_menu
        read -p "Select an option (0-9): " choice

        case $choice in
            1)
                test_vps_connectivity
                ;;
            2)
                prepare_vps
                ;;
            3)
                upload_deployment_files
                ;;
            4)
                clone_from_github
                ;;
            5)
                run_pre_deployment_checks
                ;;
            6)
                run_main_deployment
                ;;
            7)
                verify_deployment
                ;;
            8)
                show_services_status
                ;;
            9)
                complete_deployment
                break
                ;;
            0)
                log "Exiting deployment commands"
                break
                ;;
            *)
                warn "Invalid option. Please select 0-9."
                ;;
        esac

        echo ""
        read -p "Press Enter to continue..."
        echo ""
    done
}

# ================================
# AIDE ET UTILISATION
# ================================
if [[ "$1" == "help" ]] || [[ "$1" == "--help" ]] || [[ "$1" == "-h" ]]; then
    echo "CLAUDYNE VPS DEPLOYMENT COMMANDS"
    echo ""
    echo "Usage:"
    echo "  ./deploy-commands.sh           # Interactive menu"
    echo "  ./deploy-commands.sh auto      # Complete automatic deployment"
    echo "  ./deploy-commands.sh test      # Test VPS connectivity only"
    echo "  ./deploy-commands.sh status    # Show services status"
    echo "  ./deploy-commands.sh health    # Check deployment health"
    echo "  ./deploy-commands.sh help      # Show this help"
    echo ""
    echo "VPS Configuration:"
    echo "  IP: $VPS_IP"
    echo "  User: $VPS_USER"
    echo "  Domain: $DOMAIN"
    echo ""
    echo "Prerequisites:"
    echo "  - SSH key access to VPS configured"
    echo "  - DNS pointing $DOMAIN to $VPS_IP"
    echo "  - GitHub access token valid"
    echo ""
    exit 0
fi

# ================================
# EXÉCUTION PRINCIPALE
# ================================
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi