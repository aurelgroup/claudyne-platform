#!/bin/bash

# =================================================
# SCRIPT DE DÉPLOIEMENT CLAUDYNE → CONTABO VPS
# En hommage à Meffo Mehtah Tchandjio Claudine
# =================================================

echo "🚀 Déploiement Claudyne vers Contabo VPS"
echo "👨‍👩‍👧‍👦 En hommage à Meffo Mehtah Tchandjio Claudine"
echo ""

# Configuration VPS
VPS_IP="89.117.58.53"
VPS_USER="root"
VPS_PATH="/var/www/claudyne"
REPO_URL="https://github.com/aurelgroup/claudyne-platform.git"

echo "📡 Connexion au VPS Contabo..."

# Commandes à exécuter sur le VPS
ssh $VPS_USER@$VPS_IP << 'EOF'
    echo "🔄 Mise à jour du code depuis GitHub..."

    # Aller dans le répertoire Claudyne
    cd /var/www/claudyne || {
        echo "📁 Clonage initial du repository..."
        cd /var/www
        git clone https://github.com/aurelgroup/claudyne-platform.git claudyne
        cd claudyne
    }

    # Arrêter les services existants
    echo "⏹️ Arrêt des services en cours..."
    pm2 stop claudyne-frontend 2>/dev/null || true
    pm2 stop claudyne-backend 2>/dev/null || true

    # Mise à jour du code
    echo "⬇️ Pull des dernières modifications..."
    git fetch origin
    git reset --hard origin/main

    # Installation des dépendances
    echo "📦 Installation dépendances frontend..."
    npm install --production

    echo "📦 Installation dépendances backend..."
    cd backend
    npm install --production
    cd ..

    # Création du fichier .env backend si inexistant
    if [ ! -f backend/.env ]; then
        echo "🔧 Création configuration backend..."
        cat > backend/.env << 'ENVEOF'
NODE_ENV=production
PORT=3001

# Database Configuration
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=claudyne_prod
DB_USER=claudyne_user
DB_PASSWORD=claudyne_secure_2024

# JWT Configuration
JWT_SECRET=claudyne_jwt_secret_production_2024_meffo_tchandjio
JWT_EXPIRES_IN=7d

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@claudyne.com
SMTP_PASS=your_email_password

# Payment Configuration
MTN_MOMO_API_KEY=your_mtn_api_key
ORANGE_MONEY_API_KEY=your_orange_api_key

# Cache Configuration
REDIS_URL=redis://localhost:6379

# App Configuration
FRONTEND_URL=https://claudyne.com
BACKEND_URL=https://claudyne.com/api
ENVEOF
    fi

    # Configuration PM2
    echo "🔧 Configuration PM2..."

    # Fichier de configuration PM2
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
      error_file: '/var/log/claudyne/frontend-error.log',
      out_file: '/var/log/claudyne/frontend-out.log',
      log_file: '/var/log/claudyne/frontend-combined.log',
      time: true
    },
    {
      name: 'claudyne-backend',
      script: 'backend/src/server.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/var/log/claudyne/backend-error.log',
      out_file: '/var/log/claudyne/backend-out.log',
      log_file: '/var/log/claudyne/backend-combined.log',
      time: true
    }
  ]
};
PMEOF

    # Créer les répertoires de logs
    mkdir -p /var/log/claudyne

    # Démarrer les services avec PM2
    echo "🚀 Démarrage des services..."
    pm2 start ecosystem.config.js
    pm2 save

    # Mise à jour Nginx si nécessaire
    echo "🌐 Vérification configuration Nginx..."
    if [ -f /etc/nginx/sites-available/claudyne ]; then
        # Backup de la config actuelle
        cp /etc/nginx/sites-available/claudyne /etc/nginx/sites-available/claudyne.backup.$(date +%Y%m%d_%H%M%S)

        # Mise à jour pour inclure le backend
        cat > /etc/nginx/sites-available/claudyne << 'NGINXEOF'
server {
    listen 80;
    listen 443 ssl http2;
    server_name claudyne.com www.claudyne.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/claudyne.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/claudyne.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;

    # API Backend (Nouveau)
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

    # WebSocket pour Battle Royale
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend (Interface utilisateur)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Cache normal pour les performances
        proxy_cache_valid 200 302 10m;
        proxy_cache_valid 404 1m;
    }

    # ANTI-CACHE pour interface admin
    location ~ ^/admin {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # DÉSACTIVER CACHE pour interface admin
        proxy_no_cache 1;
        proxy_cache_bypass 1;
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
        add_header Pragma "no-cache";
        add_header Expires "0";
        expires off;
    }

    # Assets statiques
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_cache_valid 200 1h;
        add_header Cache-Control "public, max-age=3600";
    }

    # Logs
    access_log /var/log/nginx/claudyne.access.log;
    error_log /var/log/nginx/claudyne.error.log;

    # Sécurité
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Optimisations
    client_max_body_size 10M;
    proxy_connect_timeout 30s;
    proxy_send_timeout 30s;
    proxy_read_timeout 30s;
}

# Redirection HTTP vers HTTPS
server {
    listen 80;
    server_name claudyne.com www.claudyne.com;
    return 301 https://$server_name$request_uri;
}
NGINXEOF

        echo "🔄 Rechargement Nginx..."
        nginx -t && systemctl reload nginx
    fi

    echo "✅ Déploiement terminé !"
    echo "🌐 Frontend: https://claudyne.com (Port 3000)"
    echo "🔗 Backend API: https://claudyne.com/api (Port 3001)"
    echo "⚡ WebSocket: https://claudyne.com/socket.io"
    echo ""
    echo "📊 Statut des services:"
    pm2 status

EOF

echo ""
echo "🎉 DÉPLOIEMENT CLAUDYNE TERMINÉ !"
echo "👨‍👩‍👧‍👦 En hommage à Meffo Mehtah Tchandjio Claudine"
echo "💚 \"La force du savoir en héritage\""