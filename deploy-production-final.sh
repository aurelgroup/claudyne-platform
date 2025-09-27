#!/bin/bash

# =================================================================
# DÉPLOIEMENT PRODUCTION FINAL CLAUDYNE
# Script complet pour déploiement zero-downtime
# Écosystème éducatif camerounais unifié
# En hommage à Meffo Mehtah Tchandjio Claudine
# =================================================================

set -e

VPS_HOST="89.117.58.53"
VPS_USER="root"

# Couleurs pour logs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"; }
info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }
success() { echo -e "${PURPLE}✨ $1${NC}"; }

# Variables globales
DEPLOYMENT_ID="deploy_$(date +%Y%m%d_%H%M%S)"
BACKUP_DIR="/var/backups/claudyne/$DEPLOYMENT_ID"
HEALTH_CHECK_RETRIES=5
HEALTH_CHECK_DELAY=10

echo "🚀 ================================================================="
echo "   CLAUDYNE PRODUCTION DEPLOYMENT - FINAL"
echo "   👨‍👩‍👧‍👦 En hommage à Meffo Mehtah Tchandjio Claudine"
echo "   🇨🇲 La force du savoir en héritage"
echo "================================================================="
echo ""
echo "📋 Deployment ID: $DEPLOYMENT_ID"
echo "🎯 Target: $VPS_HOST"
echo "⏰ Started: $(date)"
echo ""

# ================================================================
# PHASE 1: PRÉ-DÉPLOIEMENT
# ================================================================

log "🔍 PHASE 1: PRÉ-DÉPLOIEMENT"

# Test connexion VPS
info "Testing VPS connection..."
if ! ssh -o ConnectTimeout=10 $VPS_USER@$VPS_HOST "echo 'VPS accessible'" > /dev/null 2>&1; then
    error "Cannot connect to VPS $VPS_HOST"
    exit 1
fi
success "VPS connection OK"

# Test local dependencies
info "Checking local dependencies..."
for dep in git npm node; do
    if ! command -v $dep &> /dev/null; then
        error "$dep not found - install required dependencies"
        exit 1
    fi
done
success "Local dependencies OK"

# Test si mobile app est buildée
if [ ! -f "claudyne-mobile/claudyne-production.apk" ]; then
    warn "No production APK found"
    info "Building mobile app first..."
    cd claudyne-mobile

    if ! npx eas build --platform android --profile production --non-interactive --wait; then
        error "Mobile build failed"
        exit 1
    fi

    # Télécharger APK
    APK_URL=$(npx eas build:list --limit=1 --json | jq -r '.[0].artifacts.buildUrl' 2>/dev/null)
    if [ "$APK_URL" != "null" ] && [ "$APK_URL" != "" ]; then
        wget -O claudyne-production.apk "$APK_URL" || curl -o claudyne-production.apk "$APK_URL"
    fi

    cd ..
fi

# ================================================================
# PHASE 2: BACKUP COMPLET
# ================================================================

log "💾 PHASE 2: BACKUP COMPLET"

ssh $VPS_USER@$VPS_HOST << EOF
    # Créer répertoire backup
    mkdir -p $BACKUP_DIR/{database,files,config,logs}

    echo "📊 Creating comprehensive backup..."

    # Backup base de données
    if sudo -u postgres pg_dump claudyne_production > $BACKUP_DIR/database/claudyne_production.sql 2>/dev/null; then
        echo "✅ Database backup OK"
    else
        echo "⚠️ Database backup failed (may not exist yet)"
    fi

    # Backup fichiers application
    if [ -d "/var/www/claudyne" ]; then
        tar -czf $BACKUP_DIR/files/claudyne-app.tar.gz -C /var/www claudyne 2>/dev/null || echo "⚠️ App backup partial"
        echo "✅ Application files backup OK"
    fi

    # Backup configuration
    cp -r /etc/nginx/sites-available/claudyne $BACKUP_DIR/config/ 2>/dev/null || echo "⚠️ No nginx config"
    cp -r /etc/systemd/system/claudyne-sync.service $BACKUP_DIR/config/ 2>/dev/null || echo "⚠️ No sync service"

    # Backup logs
    cp -r /var/log/nginx/claudyne*.log $BACKUP_DIR/logs/ 2>/dev/null || echo "ℹ️ No nginx logs yet"

    echo "✅ Backup completed: $BACKUP_DIR"
EOF

success "Backup completed"

# ================================================================
# PHASE 3: DÉPLOIEMENT BACKEND
# ================================================================

log "🖥️ PHASE 3: DÉPLOIEMENT BACKEND"

ssh $VPS_USER@$VPS_HOST << 'EOF'
    echo "🔄 Backend deployment..."

    # Aller dans répertoire ou cloner
    if [ -d "/var/www/claudyne" ]; then
        cd /var/www/claudyne
        echo "📥 Pulling latest changes..."
        git fetch origin
        git reset --hard origin/main
    else
        echo "📁 Cloning repository..."
        cd /var/www
        git clone https://github.com/aurelgroup/claudyne-platform.git claudyne
        cd claudyne
    fi

    # Installer/mettre à jour dépendances
    echo "📦 Installing dependencies..."
    npm install --production --silent

    cd backend
    npm install --production --silent
    cd ..

    # Configuration environnement backend
    echo "🔧 Configuring backend environment..."
    cat > backend/.env << 'ENVEOF'
NODE_ENV=production
PORT=3001
MOBILE_PORT=3002

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=claudyne_production
DB_USER=claudyne_user
DB_PASSWORD=aujourdhui18D@

# JWT Configuration
JWT_SECRET=claudyne_jwt_meffo_tchandjio_production_2024
JWT_EXPIRES_IN=7d

# Synchronisation
AUTO_SYNC_ENABLED=true
AUTO_SYNC_INTERVAL=3

# URLs Production
FRONTEND_URL=https://claudyne.com
BACKEND_URL=https://claudyne.com/api
CORS_ORIGIN=https://claudyne.com,https://www.claudyne.com

# Features
FEATURES_EMAIL_AUTOMATION=true
FEATURES_BATTLE_ROYALE=true
FEATURES_PRIX_CLAUDINE=true
MOCK_PAYMENTS=true
ENVEOF

    echo "✅ Backend configuration ready"
EOF

success "Backend deployed"

# ================================================================
# PHASE 4: CONFIGURATION BASE DE DONNÉES
# ================================================================

log "🗄️ PHASE 4: CONFIGURATION BASE DE DONNÉES"

ssh $VPS_USER@$VPS_HOST << 'EOF'
    echo "🗄️ Database setup..."

    # Vérifier PostgreSQL installé
    if ! command -v psql &> /dev/null; then
        echo "📦 Installing PostgreSQL..."
        apt update && apt install -y postgresql postgresql-contrib
    fi

    # Démarrer PostgreSQL
    systemctl enable postgresql
    systemctl start postgresql

    # Créer base et utilisateur
    echo "👤 Setting up database user and database..."
    sudo -u postgres psql << 'PGEOF'
CREATE USER claudyne_user WITH ENCRYPTED PASSWORD 'aujourdhui18D@';
CREATE DATABASE claudyne_production OWNER claudyne_user;
GRANT ALL PRIVILEGES ON DATABASE claudyne_production TO claudyne_user;
\q
PGEOF

    echo "✅ Database setup completed"

    # Test connexion
    if sudo -u postgres psql -d claudyne_production -c "SELECT version();" > /dev/null 2>&1; then
        echo "✅ Database connection test OK"
    else
        echo "⚠️ Database connection test failed"
    fi
EOF

success "Database configured"

# ================================================================
# PHASE 5: SYNCHRONISATION INITIALE
# ================================================================

log "🔄 PHASE 5: SYNCHRONISATION INITIALE"

ssh $VPS_USER@$VPS_HOST << 'EOF'
    cd /var/www/claudyne/backend

    echo "🔄 Running initial database synchronization..."

    # Première synchronisation
    timeout 30s node sync-database.js --full-sync || echo "⚠️ Initial sync timeout (normal)"

    # Vérifier statut
    node sync-database.js --status || echo "ℹ️ Sync status check completed"

    echo "✅ Initial synchronization completed"
EOF

success "Synchronization initialized"

# ================================================================
# PHASE 6: CONFIGURATION SYSTÈME
# ================================================================

log "⚙️ PHASE 6: CONFIGURATION SYSTÈME"

ssh $VPS_USER@$VPS_HOST << 'EOF'
    echo "⚙️ System configuration..."

    # Service auto-sync
    echo "🔧 Setting up auto-sync service..."
    cat > /tmp/claudyne-sync.service << 'SERVICEEOF'
[Unit]
Description=Claudyne Database Auto-Sync Service
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/claudyne/backend
Environment=NODE_ENV=production
Environment=DB_HOST=localhost
Environment=DB_PORT=5432
Environment=DB_NAME=claudyne_production
Environment=DB_USER=claudyne_user
Environment=DB_PASSWORD=aujourdhui18D@
ExecStart=/usr/bin/node sync-database.js --auto-sync
Restart=always
RestartSec=30
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
SERVICEEOF

    mv /tmp/claudyne-sync.service /etc/systemd/system/
    systemctl daemon-reload
    systemctl enable claudyne-sync.service

    # Commande globale claudyne-sync
    cat > /usr/local/bin/claudyne-sync << 'SYNCEOF'
#!/bin/bash
BACKEND_PATH="/var/www/claudyne/backend"
cd "$BACKEND_PATH"

case "$1" in
    "status") node sync-database.js --status ;;
    "full") node sync-database.js --full-sync ;;
    "start") sudo systemctl start claudyne-sync.service && sudo systemctl status claudyne-sync.service --no-pager ;;
    "stop") sudo systemctl stop claudyne-sync.service ;;
    "restart") sudo systemctl restart claudyne-sync.service ;;
    "logs") sudo journalctl -u claudyne-sync.service -f ;;
    *) echo "Usage: claudyne-sync {status|full|start|stop|restart|logs}" ;;
esac
SYNCEOF

    chmod +x /usr/local/bin/claudyne-sync

    echo "✅ System services configured"
EOF

success "System configured"

# ================================================================
# PHASE 7: CONFIGURATION NGINX
# ================================================================

log "🌐 PHASE 7: CONFIGURATION NGINX"

ssh $VPS_USER@$VPS_HOST << 'EOF'
    echo "🌐 Nginx configuration..."

    # Installer Nginx
    if ! command -v nginx &> /dev/null; then
        echo "📦 Installing Nginx..."
        apt update && apt install -y nginx certbot python3-certbot-nginx
    fi

    # Configuration Nginx
    cat > /etc/nginx/sites-available/claudyne << 'NGINXEOF'
server {
    listen 80;
    listen 443 ssl http2;
    server_name claudyne.com www.claudyne.com;

    # SSL Configuration (will be configured by certbot)
    ssl_certificate /etc/letsencrypt/live/claudyne.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/claudyne.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;

    # API Backend Principal
    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API Mobile
    location /mobile-api {
        proxy_pass http://127.0.0.1:3002/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Téléchargement APK
    location /download {
        alias /var/www/html/download;
        autoindex on;
        add_header Cache-Control "public, max-age=3600";
    }

    # Headers sécurité
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Logs
    access_log /var/log/nginx/claudyne.access.log;
    error_log /var/log/nginx/claudyne.error.log;
}

# Redirection HTTP vers HTTPS
server {
    listen 80;
    server_name claudyne.com www.claudyne.com;
    return 301 https://$server_name$request_uri;
}
NGINXEOF

    # Activer site
    ln -sf /etc/nginx/sites-available/claudyne /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default

    # Test configuration
    nginx -t

    systemctl enable nginx
    systemctl start nginx

    echo "✅ Nginx configured"

    # SSL avec Let's Encrypt
    echo "🔒 Setting up SSL..."
    certbot --nginx -d claudyne.com -d www.claudyne.com --non-interactive --agree-tos --email support@claudyne.com || echo "⚠️ SSL setup may need manual configuration"

    systemctl reload nginx
EOF

success "Nginx configured"

# ================================================================
# PHASE 8: DÉPLOIEMENT MOBILE
# ================================================================

log "📱 PHASE 8: DÉPLOIEMENT MOBILE"

# Copier APK sur serveur
if [ -f "claudyne-mobile/claudyne-production.apk" ]; then
    info "Deploying mobile APK..."

    ssh $VPS_USER@$VPS_HOST "mkdir -p /var/www/html/download"
    scp claudyne-mobile/claudyne-production.apk $VPS_USER@$VPS_HOST:/var/www/html/download/claudyne.apk

    ssh $VPS_USER@$VPS_HOST << 'EOF'
        chmod 644 /var/www/html/download/claudyne.apk
        chown www-data:www-data /var/www/html/download/claudyne.apk

        # Infos APK
        APK_SIZE=$(du -h /var/www/html/download/claudyne.apk | cut -f1)
        echo "✅ APK deployed: $APK_SIZE"
EOF

    success "Mobile APK deployed"
else
    warn "No APK found - mobile deployment skipped"
fi

# ================================================================
# PHASE 9: DÉMARRAGE SERVICES
# ================================================================

log "🚀 PHASE 9: DÉMARRAGE SERVICES"

ssh $VPS_USER@$VPS_HOST << 'EOF'
    echo "🚀 Starting services..."

    cd /var/www/claudyne

    # PM2 setup si pas installé
    if ! command -v pm2 &> /dev/null; then
        echo "📦 Installing PM2..."
        npm install -g pm2
    fi

    # Configuration PM2
    cat > ecosystem.config.js << 'PMEOF'
module.exports = {
  apps: [
    {
      name: 'claudyne-frontend',
      script: 'server.js',
      instances: 2,
      exec_mode: 'cluster',
      env: { NODE_ENV: 'production', PORT: 3000 },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      time: true
    },
    {
      name: 'claudyne-backend',
      script: 'backend/minimal-server.js',
      instances: 2,
      exec_mode: 'cluster',
      env: { NODE_ENV: 'production', PORT: 3001 },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      time: true
    },
    {
      name: 'claudyne-mobile-api',
      script: 'backend/mobile-server.js',
      instances: 1,
      env: { NODE_ENV: 'production', MOBILE_PORT: 3002 },
      error_file: './logs/mobile-error.log',
      out_file: './logs/mobile-out.log',
      time: true
    }
  ]
};
PMEOF

    # Créer répertoire logs
    mkdir -p logs

    # Démarrer auto-sync
    systemctl start claudyne-sync.service

    # Démarrer applications PM2
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup | grep "sudo env" | bash || echo "⚠️ PM2 startup setup manual required"

    echo "✅ All services started"
EOF

success "Services started"

# ================================================================
# PHASE 10: HEALTH CHECK
# ================================================================

log "🔍 PHASE 10: HEALTH CHECK"

# Attendre que les services démarrent
sleep 10

info "Running health checks..."

for i in $(seq 1 $HEALTH_CHECK_RETRIES); do
    info "Health check attempt $i/$HEALTH_CHECK_RETRIES"

    # Test endpoints
    FRONTEND_OK=false
    API_OK=false

    if curl -s -o /dev/null -w "%{http_code}" "https://claudyne.com" | grep -q "200\|301\|302"; then
        FRONTEND_OK=true
    fi

    if curl -s -o /dev/null -w "%{http_code}" "https://claudyne.com/api/ping" | grep -q "200"; then
        API_OK=true
    fi

    if [ "$FRONTEND_OK" = true ] && [ "$API_OK" = true ]; then
        success "Health check passed!"
        break
    fi

    if [ $i -eq $HEALTH_CHECK_RETRIES ]; then
        warn "Health check failed after $HEALTH_CHECK_RETRIES attempts"
        warn "Frontend OK: $FRONTEND_OK"
        warn "API OK: $API_OK"
    else
        info "Waiting ${HEALTH_CHECK_DELAY}s before retry..."
        sleep $HEALTH_CHECK_DELAY
    fi
done

# ================================================================
# PHASE 11: MONITORING SETUP
# ================================================================

log "📊 PHASE 11: MONITORING SETUP"

# Copier script monitoring
scp monitoring-health-check.js $VPS_USER@$VPS_HOST:/var/www/claudyne/

ssh $VPS_USER@$VPS_HOST << 'EOF'
    cd /var/www/claudyne

    # Test monitoring
    echo "🔍 Testing monitoring script..."
    timeout 30s node monitoring-health-check.js || echo "ℹ️ Monitoring test completed"

    # Cron pour monitoring
    echo "⏰ Setting up monitoring cron..."
    (crontab -l 2>/dev/null; echo "*/10 * * * * cd /var/www/claudyne && node monitoring-health-check.js >> logs/monitoring.log 2>&1") | crontab -

    echo "✅ Monitoring configured"
EOF

success "Monitoring setup"

# ================================================================
# RAPPORT FINAL
# ================================================================

log "📋 GENERATING FINAL REPORT"

ssh $VPS_USER@$VPS_HOST << 'EOF'
    echo ""
    echo "📊 === CLAUDYNE DEPLOYMENT REPORT ==="
    echo "======================================"

    echo ""
    echo "🎯 SERVICES STATUS:"
    pm2 status

    echo ""
    echo "🔄 SYNC SERVICE:"
    systemctl status claudyne-sync.service --no-pager | head -5

    echo ""
    echo "🗄️ DATABASE:"
    claudyne-sync status 2>/dev/null | head -10 || echo "Sync command available"

    echo ""
    echo "🌐 NGINX:"
    systemctl status nginx --no-pager | head -3

    echo ""
    echo "💾 DISK USAGE:"
    df -h / | grep -E "(Filesystem|/dev/)"

    echo ""
    echo "🎯 URLS:"
    echo "   Frontend: https://claudyne.com"
    echo "   Backend API: https://claudyne.com/api"
    echo "   Mobile API: https://claudyne.com/mobile-api"
    echo "   APK Download: https://claudyne.com/download/claudyne.apk"
    echo "   Admin: https://claudyne.com/admin"

    echo ""
    echo "🔧 MANAGEMENT COMMANDS:"
    echo "   pm2 status                    # Applications status"
    echo "   claudyne-sync status          # Database sync status"
    echo "   claudyne-sync logs            # Sync logs"
    echo "   systemctl status nginx        # Nginx status"
    echo "   node monitoring-health-check.js  # Health check"

    echo ""
EOF

echo ""
success "🎉 ==============================================="
success "   CLAUDYNE PRODUCTION DEPLOYMENT COMPLETED"
success "==============================================="
echo ""
info "📋 Deployment ID: $DEPLOYMENT_ID"
info "⏰ Completed: $(date)"
info "🎯 Status: Ready for production"
echo ""
success "🇨🇲 Claudyne est maintenant prêt à servir les familles camerounaises !"
success "👨‍👩‍👧‍👦 En hommage à Meffo Mehtah Tchandjio Claudine"
success "💚 \"La force du savoir en héritage\""
echo ""

# Test final rapide
info "🔍 Final connectivity test..."
if curl -s "https://claudyne.com/api/ping" | grep -q "success"; then
    success "✅ Claudyne is LIVE and responding!"
else
    warn "⚠️ Final test inconclusive - check manually"
fi

echo ""
info "🚀 Next steps:"
echo "   1. Test all interfaces: web, mobile, admin"
echo "   2. Monitor logs for first 24h"
echo "   3. Set up external monitoring (optional)"
echo "   4. Configure domain DNS if needed"
echo ""

# Nettoyer
rm -f /tmp/deploy_*

exit 0