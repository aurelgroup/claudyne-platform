#!/bin/bash

# =================================================================
# DÉPLOIEMENT CLAUDYNE AVEC SYNCHRONISATION AUTOMATIQUE
# Déploiement complet + Configuration auto-sync JSON ↔ PostgreSQL
# En hommage à Meffo Mehtah Tchandjio Claudine
# =================================================================

echo "🚀 === DÉPLOIEMENT CLAUDYNE + AUTO-SYNC ==="
echo "👨‍👩‍👧‍👦 En hommage à Meffo Mehtah Tchandjio Claudine"
echo ""

VPS_HOST="89.117.58.53"
VPS_USER="root"

ssh $VPS_USER@$VPS_HOST << 'EOF'
    echo "🔄 DÉPLOIEMENT CLAUDYNE AVEC SYNCHRONISATION"
    echo "============================================="

    # 1. MISE À JOUR CODE SOURCE
    cd /var/www/claudyne || {
        echo "📁 Clonage initial..."
        cd /var/www
        git clone https://github.com/aurelgroup/claudyne-platform.git claudyne
        cd claudyne
    }

    echo "⬇️ Pull dernières modifications..."
    git fetch origin
    git reset --hard origin/main

    # 2. INSTALLATION DÉPENDANCES
    echo "📦 Installation dépendances..."
    npm install --production

    cd backend
    npm install --production
    cd ..

    # 3. CONFIGURATION ENVIRONNEMENT BACKEND
    echo "🔧 Configuration backend production..."
    cat > backend/.env << 'ENVEOF'
NODE_ENV=production
PORT=3001

# Database Configuration PostgreSQL PRODUCTION
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=claudyne_production
DB_USER=claudyne_user
DB_PASSWORD=aujourdhui18D@
DB_SSL=false

# JWT Configuration
JWT_SECRET=claudyne_jwt_meffo_tchandjio_production_2024
JWT_EXPIRES_IN=7d

# Synchronisation automatique
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

    echo "✅ Configuration backend créée"

    # 4. VÉRIFICATION POSTGRESQL
    echo "🗄️ Vérification PostgreSQL..."

    # Test connexion
    if sudo -u postgres psql -d claudyne_production -c "SELECT 1;" > /dev/null 2>&1; then
        echo "✅ PostgreSQL claudyne_production accessible"
    else
        echo "❌ PostgreSQL claudyne_production inaccessible"
        echo "🔧 Création base de données..."

        sudo -u postgres psql << 'PGEOF'
CREATE USER claudyne_user WITH ENCRYPTED PASSWORD 'aujourdhui18D@';
CREATE DATABASE claudyne_production OWNER claudyne_user;
GRANT ALL PRIVILEGES ON DATABASE claudyne_production TO claudyne_user;
\q
PGEOF

        echo "✅ Base de données créée"
    fi

    # 5. INSTALLATION SYSTÈME AUTO-SYNC
    echo "🔄 Installation système auto-sync..."

    # Service systemd pour auto-sync
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

    sudo mv /tmp/claudyne-sync.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable claudyne-sync.service

    # Commande globale claudyne-sync
    cat > /tmp/claudyne-sync << 'SYNCEOF'
#!/bin/bash
BACKEND_PATH="/var/www/claudyne/backend"
cd "$BACKEND_PATH"

case "$1" in
    "status")
        echo "📊 STATUS CLAUDYNE DATABASE SYNC"
        node sync-database.js --status
        ;;
    "full")
        echo "🔄 SYNCHRONISATION COMPLÈTE"
        node sync-database.js --full-sync
        ;;
    "start")
        echo "🚀 DÉMARRAGE AUTO-SYNC"
        sudo systemctl start claudyne-sync.service
        sudo systemctl status claudyne-sync.service --no-pager
        ;;
    "stop")
        echo "⏹️ ARRÊT AUTO-SYNC"
        sudo systemctl stop claudyne-sync.service
        ;;
    "restart")
        echo "🔄 REDÉMARRAGE AUTO-SYNC"
        sudo systemctl restart claudyne-sync.service
        ;;
    "logs")
        echo "📋 LOGS AUTO-SYNC"
        sudo journalctl -u claudyne-sync.service -f
        ;;
    *)
        echo "🎓 CLAUDYNE DATABASE SYNC MANAGER"
        echo "Usage:"
        echo "  claudyne-sync status    # Statut des bases"
        echo "  claudyne-sync full      # Sync complète"
        echo "  claudyne-sync start     # Démarrer auto-sync"
        echo "  claudyne-sync stop      # Arrêter auto-sync"
        echo "  claudyne-sync logs      # Logs temps réel"
        ;;
esac
SYNCEOF

    sudo mv /tmp/claudyne-sync /usr/local/bin/
    sudo chmod +x /usr/local/bin/claudyne-sync

    # 6. CRÉATION RÉPERTOIRES
    mkdir -p /var/www/claudyne/backend/logs
    mkdir -p /var/backups/claudyne
    chown -R root:root /var/www/claudyne/backend/logs

    echo "✅ Système auto-sync installé"

    # 7. ARRÊT SERVICES EXISTANTS
    echo "⏹️ Arrêt services existants..."
    pm2 stop claudyne-frontend 2>/dev/null || true
    pm2 stop claudyne-backend 2>/dev/null || true
    pm2 delete claudyne-frontend 2>/dev/null || true
    pm2 delete claudyne-backend 2>/dev/null || true

    # 8. CONFIGURATION PM2
    echo "🔧 Configuration PM2..."
    cat > ecosystem.config.js << 'PMEOF'
module.exports = {
  apps: [
    {
      name: 'claudyne-frontend',
      script: 'server.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true
    },
    {
      name: 'claudyne-backend',
      script: 'backend/minimal-server.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true
    }
  ]
};
PMEOF

    # 9. PREMIÈRE SYNCHRONISATION
    echo "🔄 Première synchronisation JSON → PostgreSQL..."
    cd backend
    timeout 15s node sync-database.js --full-sync || echo "⚠️ Sync timeout (normal pour première fois)"
    cd ..

    # 10. DÉMARRAGE SERVICES
    echo "🚀 Démarrage services..."

    # Démarrer auto-sync
    sudo systemctl start claudyne-sync.service
    sleep 2

    # Démarrer applications
    pm2 start ecosystem.config.js
    pm2 save

    # 11. STATUT FINAL
    echo ""
    echo "✅ === DÉPLOIEMENT TERMINÉ ==="
    echo "=============================="

    echo "📊 Services PM2:"
    pm2 status

    echo ""
    echo "🔄 Service Auto-Sync:"
    sudo systemctl status claudyne-sync.service --no-pager | head -8

    echo ""
    echo "📊 Statut Bases de Données:"
    claudyne-sync status

    echo ""
    echo "🌐 URLs:"
    echo "   Frontend: https://claudyne.com"
    echo "   Backend: https://claudyne.com/api"
    echo "   Logs: claudyne-sync logs"

    echo ""
    echo "🎓 CLAUDYNE DÉPLOYÉ AVEC AUTO-SYNC !"
    echo "👨‍👩‍👧‍👦 En hommage à Meffo Mehtah Tchandjio Claudine"

EOF

echo ""
echo "✅ === DÉPLOIEMENT COMPLET TERMINÉ ==="
echo "🔄 Synchronisation JSON ↔ PostgreSQL automatique active"
echo "🎓 Claudyne prêt pour production !"