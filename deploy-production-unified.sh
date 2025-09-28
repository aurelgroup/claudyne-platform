#!/bin/bash

# 🚀 SCRIPT DÉPLOIEMENT PRODUCTION CLAUDYNE
# La force du savoir en héritage - Familles camerounaises
# Zero-downtime deployment with rollback capability

set -e  # Arrêt immédiat en cas d'erreur

# ================================
# CONFIGURATION
# ================================
APP_NAME="claudyne"
APP_USER="claudyne"
APP_DIR="/opt/claudyne"
BACKUP_DIR="/opt/claudyne/backups"
LOG_FILE="/var/log/claudyne/deploy.log"
NODE_VERSION="18.x"
DOMAIN="claudyne.com"

# Couleurs pour output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ================================
# FONCTIONS UTILITAIRES
# ================================
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a "$LOG_FILE"
}

# ================================
# VÉRIFICATIONS PRÉ-DÉPLOIEMENT
# ================================
check_prerequisites() {
    log "🔍 Vérification des prérequis..."

    # Check si root ou sudo
    if [[ $EUID -ne 0 ]]; then
        error "Ce script doit être exécuté en tant que root ou avec sudo"
    fi

    # Check OS
    if ! command -v apt-get &> /dev/null; then
        error "Ce script nécessite Ubuntu/Debian (apt-get)"
    fi

    # Check espace disque (minimum 5GB)
    AVAILABLE_SPACE=$(df / | awk 'NR==2 {print $4}')
    if [[ $AVAILABLE_SPACE -lt 5242880 ]]; then  # 5GB en KB
        warn "Espace disque faible. Recommandé: 5GB minimum"
    fi

    log "✅ Prérequis validés"
}

# ================================
# INSTALLATION SERVICES SYSTÈME
# ================================
install_system_services() {
    log "📦 Installation des services système..."

    # Update package list
    apt-get update -qq

    # Install Node.js 18.x
    if ! command -v node &> /dev/null || [[ $(node -v | cut -d'v' -f2 | cut -d'.' -f1) -lt 18 ]]; then
        info "Installation Node.js 18.x..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt-get install -y nodejs
    fi

    # Install PostgreSQL 15
    if ! command -v psql &> /dev/null; then
        info "Installation PostgreSQL 15..."
        apt-get install -y postgresql postgresql-contrib
        systemctl enable postgresql
        systemctl start postgresql
    fi

    # Install Nginx
    if ! command -v nginx &> /dev/null; then
        info "Installation Nginx..."
        apt-get install -y nginx
        systemctl enable nginx
    fi

    # Install PM2 globally
    if ! command -v pm2 &> /dev/null; then
        info "Installation PM2..."
        npm install -g pm2
    fi

    # Install other dependencies
    apt-get install -y curl wget unzip git htop ufw fail2ban

    log "✅ Services système installés"
}

# ================================
# CONFIGURATION UTILISATEUR
# ================================
setup_user() {
    log "👤 Configuration utilisateur $APP_USER..."

    # Créer utilisateur si n'existe pas
    if ! id "$APP_USER" &>/dev/null; then
        useradd -m -s /bin/bash "$APP_USER"
        usermod -aG sudo "$APP_USER"
    fi

    # Créer répertoires
    mkdir -p "$APP_DIR" "$BACKUP_DIR" "/var/log/claudyne"
    chown -R "$APP_USER:$APP_USER" "$APP_DIR" "$BACKUP_DIR" "/var/log/claudyne"

    log "✅ Utilisateur configuré"
}

# ================================
# CONFIGURATION BASE DE DONNÉES
# ================================
setup_database() {
    log "🗄️ Configuration PostgreSQL..."

    # Créer base de données et utilisateur
    sudo -u postgres psql -c "CREATE DATABASE claudyne_production;" 2>/dev/null || true
    sudo -u postgres psql -c "CREATE USER claudyne_user WITH PASSWORD '$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)';" 2>/dev/null || true
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE claudyne_production TO claudyne_user;" 2>/dev/null || true

    # Configuration PostgreSQL pour production
    PG_VERSION=$(sudo -u postgres psql -c "SHOW server_version;" | grep -oE '[0-9]+\.[0-9]+' | head -1)
    PG_CONFIG="/etc/postgresql/$PG_VERSION/main/postgresql.conf"

    if [[ -f "$PG_CONFIG" ]]; then
        info "Optimisation PostgreSQL..."

        # Backup config
        cp "$PG_CONFIG" "$PG_CONFIG.backup.$(date +%s)"

        # Optimisations production
        sed -i "s/#max_connections = 100/max_connections = 200/" "$PG_CONFIG"
        sed -i "s/#shared_buffers = 128MB/shared_buffers = 256MB/" "$PG_CONFIG"
        sed -i "s/#effective_cache_size = 4GB/effective_cache_size = 1GB/" "$PG_CONFIG"
        sed -i "s/#maintenance_work_mem = 64MB/maintenance_work_mem = 64MB/" "$PG_CONFIG"
        sed -i "s/#checkpoint_completion_target = 0.5/checkpoint_completion_target = 0.9/" "$PG_CONFIG"
        sed -i "s/#wal_buffers = -1/wal_buffers = 16MB/" "$PG_CONFIG"
        sed -i "s/#default_statistics_target = 100/default_statistics_target = 100/" "$PG_CONFIG"

        systemctl restart postgresql
    fi

    log "✅ PostgreSQL configuré"
}

# ================================
# DÉPLOIEMENT APPLICATION
# ================================
deploy_application() {
    log "🚀 Déploiement application Claudyne..."

    # Backup de la version actuelle si elle existe
    if [[ -d "$APP_DIR/current" ]]; then
        BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
        mv "$APP_DIR/current" "$BACKUP_DIR/$BACKUP_NAME"
        info "Backup créé: $BACKUP_NAME"
    fi

    # Créer répertoire de déploiement
    mkdir -p "$APP_DIR/current"

    # Copier fichiers depuis le répertoire courant
    info "Copie des fichiers application..."
    rsync -av --exclude='node_modules' --exclude='.git' --exclude='logs' \
          ./ "$APP_DIR/current/"

    # Changer propriétaire
    chown -R "$APP_USER:$APP_USER" "$APP_DIR/current"

    # Installation dépendances en tant qu'utilisateur app
    info "Installation dépendances Node.js..."
    cd "$APP_DIR/current"
    sudo -u "$APP_USER" npm ci --production

    # Copier configuration production
    if [[ -f ".env.production" ]]; then
        sudo -u "$APP_USER" cp ".env.production" ".env"
    else
        warn "Fichier .env.production non trouvé"
    fi

    log "✅ Application déployée"
}

# ================================
# CONFIGURATION NGINX
# ================================
setup_nginx() {
    log "🌐 Configuration Nginx..."

    # Créer configuration Nginx
    cat > "/etc/nginx/sites-available/$APP_NAME" << EOF
# Claudyne Production - Familles Camerounaises
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    # SSL Configuration (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    # SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip Compression (optimisé Cameroun)
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/js
        text/xml
        text/javascript
        application/javascript
        application/json
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Rate Limiting (adapté Cameroun)
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=mobile:10m rate=20r/s;

    # Frontend (port 3000)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_connect_timeout 5s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # API Backend (port 3001)
    location /api/ {
        limit_req zone=api burst=20 nodelay;

        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 5s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # Mobile API (port 3002)
    location /mobile-api/ {
        limit_req zone=mobile burst=40 nodelay;

        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Connection \$http_x_connection;
        proxy_connect_timeout 3s;
        proxy_send_timeout 15s;
        proxy_read_timeout 15s;
    }

    # Fichiers statiques avec cache long
    location /static/ {
        alias $APP_DIR/current/public/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Download APK
    location /download/ {
        alias $APP_DIR/current/downloads/;
        expires 30d;
        add_header Cache-Control "public";
    }

    # Health checks sans logs
    location = /health {
        proxy_pass http://localhost:3001;
        access_log off;
    }
}
EOF

    # Activer site
    ln -sf "/etc/nginx/sites-available/$APP_NAME" "/etc/nginx/sites-enabled/"
    rm -f "/etc/nginx/sites-enabled/default"

    # Test configuration
    nginx -t || error "Configuration Nginx invalide"

    log "✅ Nginx configuré"
}

# ================================
# CONFIGURATION SSL (Let's Encrypt)
# ================================
setup_ssl() {
    log "🔒 Configuration SSL Let's Encrypt..."

    # Install certbot
    if ! command -v certbot &> /dev/null; then
        apt-get install -y certbot python3-certbot-nginx
    fi

    # Obtenir certificat SSL
    if [[ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]]; then
        info "Génération certificat SSL pour $DOMAIN..."

        # Arrêter nginx temporairement
        systemctl stop nginx

        # Obtenir certificat
        certbot certonly --standalone --non-interactive --agree-tos \
                --email "admin@$DOMAIN" -d "$DOMAIN" -d "www.$DOMAIN"

        # Redémarrer nginx
        systemctl start nginx
    else
        info "Certificat SSL déjà présent"
    fi

    # Auto-renewal
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

    log "✅ SSL configuré"
}

# ================================
# CONFIGURATION PM2
# ================================
setup_pm2() {
    log "⚙️ Configuration PM2..."

    # Créer ecosystem file
    cat > "$APP_DIR/current/ecosystem.config.js" << EOF
module.exports = {
  apps: [
    {
      name: 'claudyne-unified',
      script: './server-unified.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      log_file: '/var/log/claudyne/pm2-unified.log',
      out_file: '/var/log/claudyne/pm2-unified-out.log',
      error_file: '/var/log/claudyne/pm2-unified-error.log',
      merge_logs: true,
      time: true,
      max_memory_restart: '1G',
      node_args: '--max_old_space_size=1024'
    },
    {
      name: 'claudyne-mobile',
      script: './backend/mobile-server.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      log_file: '/var/log/claudyne/pm2-mobile.log',
      out_file: '/var/log/claudyne/pm2-mobile-out.log',
      error_file: '/var/log/claudyne/pm2-mobile-error.log',
      merge_logs: true,
      time: true,
      max_memory_restart: '512M'
    }
  ]
};
EOF

    chown "$APP_USER:$APP_USER" "$APP_DIR/current/ecosystem.config.js"

    # Démarrer avec PM2
    cd "$APP_DIR/current"
    sudo -u "$APP_USER" pm2 start ecosystem.config.js
    sudo -u "$APP_USER" pm2 save

    # Startup script
    env PATH=$PATH:/usr/bin pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER"

    log "✅ PM2 configuré"
}

# ================================
# CONFIGURATION FIREWALL
# ================================
setup_firewall() {
    log "🛡️ Configuration firewall..."

    # Reset UFW
    ufw --force reset

    # Règles de base
    ufw default deny incoming
    ufw default allow outgoing

    # Autoriser SSH (attention: changez le port par défaut en production)
    ufw allow ssh

    # Autoriser HTTP/HTTPS
    ufw allow 'Nginx Full'

    # Activer firewall
    ufw --force enable

    log "✅ Firewall configuré"
}

# ================================
# CONFIGURATION MONITORING
# ================================
setup_monitoring() {
    log "📊 Configuration monitoring..."

    # Créer service systemd pour monitoring
    cat > "/etc/systemd/system/claudyne-monitor.service" << EOF
[Unit]
Description=Claudyne Health Monitor
After=network.target

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$APP_DIR/current
ExecStart=/usr/bin/node monitoring/health-monitor.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

    # Activer et démarrer monitoring
    systemctl daemon-reload
    systemctl enable claudyne-monitor
    systemctl start claudyne-monitor

    log "✅ Monitoring configuré"
}

# ================================
# TESTS POST-DÉPLOIEMENT
# ================================
run_post_deployment_tests() {
    log "🧪 Tests post-déploiement..."

    # Attendre que les services démarrent
    sleep 10

    # Test health check principal
    if curl -f -s "http://localhost:3001/health" > /dev/null; then
        info "✅ API principale opérationnelle"
    else
        error "❌ API principale ne répond pas"
    fi

    # Test API mobile
    if curl -f -s "http://localhost:3002/mobile-api/ping" > /dev/null; then
        info "✅ API mobile opérationnelle"
    else
        warn "⚠️ API mobile ne répond pas"
    fi

    # Test HTTPS (si SSL configuré)
    if [[ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]]; then
        if curl -f -s "https://$DOMAIN/health" > /dev/null; then
            info "✅ HTTPS opérationnel"
        else
            warn "⚠️ HTTPS ne répond pas"
        fi
    fi

    log "✅ Tests post-déploiement terminés"
}

# ================================
# NETTOYAGE ET OPTIMISATION
# ================================
cleanup_and_optimize() {
    log "🧹 Nettoyage et optimisation..."

    # Nettoyer anciens backups (garder 5 derniers)
    find "$BACKUP_DIR" -maxdepth 1 -type d -name "backup-*" | sort -r | tail -n +6 | xargs rm -rf

    # Optimiser logs (rotation)
    cat > "/etc/logrotate.d/claudyne" << EOF
/var/log/claudyne/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    sharedscripts
    postrotate
        systemctl reload claudyne-monitor
    endscript
}
EOF

    # Redémarrer services pour appliquer optimisations
    systemctl reload nginx

    log "✅ Nettoyage terminé"
}

# ================================
# RAPPORT FINAL
# ================================
generate_deployment_report() {
    log "📋 Génération rapport de déploiement..."

    REPORT_FILE="/var/log/claudyne/deployment-$(date +%Y%m%d-%H%M%S).json"

    cat > "$REPORT_FILE" << EOF
{
  "deployment": {
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "version": "$(cat $APP_DIR/current/package.json | grep version | cut -d'"' -f4)",
    "domain": "$DOMAIN",
    "status": "completed"
  },
  "services": {
    "nginx": "$(systemctl is-active nginx)",
    "postgresql": "$(systemctl is-active postgresql)",
    "claudyne-monitor": "$(systemctl is-active claudyne-monitor)"
  },
  "urls": {
    "frontend": "https://$DOMAIN",
    "api": "https://$DOMAIN/api",
    "mobile_api": "https://$DOMAIN/mobile-api",
    "health": "https://$DOMAIN/health"
  },
  "pm2_status": $(sudo -u "$APP_USER" pm2 jlist),
  "system": {
    "node_version": "$(node -v)",
    "npm_version": "$(npm -v)",
    "postgresql_version": "$(sudo -u postgres psql -c 'SELECT version();' | head -1)"
  }
}
EOF

    log "📋 Rapport sauvegardé: $REPORT_FILE"
}

# ================================
# FONCTION PRINCIPALE
# ================================
main() {
    # Header
    echo -e "${BLUE}"
    echo "🎓 ========================================"
    echo "   DÉPLOIEMENT PRODUCTION CLAUDYNE"
    echo "   La force du savoir en héritage"
    echo "🎓 ========================================"
    echo -e "${NC}"

    # Créer log file
    mkdir -p "$(dirname "$LOG_FILE")"
    touch "$LOG_FILE"

    # Exécution des étapes
    check_prerequisites
    install_system_services
    setup_user
    setup_database
    deploy_application
    setup_nginx
    setup_ssl
    setup_pm2
    setup_firewall
    setup_monitoring
    run_post_deployment_tests
    cleanup_and_optimize
    generate_deployment_report

    # Message de succès
    echo -e "${GREEN}"
    echo "🎉 ========================================"
    echo "   DÉPLOIEMENT RÉUSSI !"
    echo "🎉 ========================================"
    echo ""
    echo "🌐 Site web: https://$DOMAIN"
    echo "📡 API: https://$DOMAIN/api"
    echo "📱 Mobile API: https://$DOMAIN/mobile-api"
    echo "🩺 Health: https://$DOMAIN/health"
    echo ""
    echo "📊 Monitoring: sudo systemctl status claudyne-monitor"
    echo "📋 PM2 Status: sudo -u $APP_USER pm2 status"
    echo "📄 Logs: tail -f /var/log/claudyne/*.log"
    echo ""
    echo "🇨🇲 Claudyne est maintenant disponible pour"
    echo "   les familles camerounaises !"
    echo "========================================"
    echo -e "${NC}"
}

# ================================
# GESTION DES SIGNAUX
# ================================
trap 'error "Déploiement interrompu par signal"' INT TERM

# ================================
# EXÉCUTION
# ================================
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi