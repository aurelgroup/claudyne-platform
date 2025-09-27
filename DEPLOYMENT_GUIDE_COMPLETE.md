# 🚀 GUIDE DE DÉPLOIEMENT COMPLET CLAUDYNE
## Écosystème Éducatif Camerounais Unifié
*En hommage à Meffo Mehtah Tchandjio Claudine 👨‍👩‍👧‍👦*

---

## 📊 ARCHITECTURE COMPLÈTE

```
┌─────────────────────────────────────────────────────────────┐
│                    CLAUDYNE ECOSYSTEM                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📱 MOBILE APP          🌐 WEB APP          👨‍💼 ADMIN       │
│  (React Native)        (HTML/JS/CSS)       (Interface)     │
│           │                    │                 │          │
│           └────────────────────┼─────────────────┘          │
│                               │                            │
│                    📡 NGINX REVERSE PROXY                  │
│                    (SSL + Load Balancing)                  │
│                               │                            │
│           ┌───────────────────┼───────────────────┐        │
│           │                   │                   │        │
│      🖥️ FRONTEND         🔧 BACKEND API      📱 MOBILE API │
│      server.js           minimal-server.js   mobile-server │
│      (Port 3000)         (Port 3001)        (Port 3002)   │
│           │                   │                   │        │
│           └───────────────────┼───────────────────┘        │
│                               │                            │
│                    🔄 SYNC ENGINE                          │
│                    (JSON ↔ PostgreSQL)                     │
│                               │                            │
│               ┌───────────────┼───────────────┐            │
│               │               │               │            │
│           📄 JSON         🗄️ POSTGRESQL   🔄 AUTO-SYNC    │
│           users.json      claudyne_production  Service     │
│           (Fallback)      (Production DB)    (systemd)     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 PRÉREQUIS SERVEUR

### VPS Contabo Configuration
- **IP**: 89.117.58.53
- **User**: root
- **OS**: Ubuntu 20.04+ / Debian 11+
- **RAM**: 4GB minimum
- **Storage**: 40GB minimum
- **Domaine**: claudyne.com

### Services Requis
```bash
# Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PostgreSQL 15
sudo apt install postgresql postgresql-contrib

# Nginx
sudo apt install nginx

# PM2 Global
npm install -g pm2

# Certbot pour SSL
sudo apt install certbot python3-certbot-nginx
```

---

## 🔐 CONFIGURATION BASE DE DONNÉES

### 1. PostgreSQL Setup
```bash
# Se connecter à PostgreSQL
sudo -u postgres psql

# Créer utilisateur et base
CREATE USER claudyne_user WITH ENCRYPTED PASSWORD 'aujourdhui18D@';
CREATE DATABASE claudyne_production OWNER claudyne_user;
GRANT ALL PRIVILEGES ON DATABASE claudyne_production TO claudyne_user;
\q
```

### 2. Test Connexion
```bash
# Tester connexion
sudo -u postgres psql -d claudyne_production -c "SELECT version();"
```

---

## 🌐 DÉPLOIEMENT BACKEND

### 1. Clonage et Setup
```bash
# Aller dans répertoire web
cd /var/www

# Cloner le projet
git clone https://github.com/aurelgroup/claudyne-platform.git claudyne
cd claudyne

# Installer dépendances
npm install --production
cd backend && npm install --production && cd ..
```

### 2. Configuration Environnement
```bash
# Créer .env backend
cat > backend/.env << 'EOF'
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
EOF
```

### 3. Configuration PM2
```bash
# Créer ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
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
      time: true
    },
    {
      name: 'claudyne-mobile-api',
      script: 'backend/mobile-server.js',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        MOBILE_PORT: 3002
      },
      error_file: './logs/mobile-error.log',
      out_file: './logs/mobile-out.log',
      time: true
    }
  ]
};
EOF

# Créer répertoire logs
mkdir -p logs
```

---

## 🔄 CONFIGURATION SYNCHRONISATION

### 1. Service Systemd Auto-Sync
```bash
# Créer service systemd
sudo cat > /etc/systemd/system/claudyne-sync.service << 'EOF'
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
EOF

# Activer service
sudo systemctl daemon-reload
sudo systemctl enable claudyne-sync.service
```

### 2. Commande globale claudyne-sync
```bash
# Créer commande globale
sudo cat > /usr/local/bin/claudyne-sync << 'EOF'
#!/bin/bash
BACKEND_PATH="/var/www/claudyne/backend"
cd "$BACKEND_PATH"

case "$1" in
    "status")
        node sync-database.js --status
        ;;
    "full")
        node sync-database.js --full-sync
        ;;
    "start")
        sudo systemctl start claudyne-sync.service
        sudo systemctl status claudyne-sync.service --no-pager
        ;;
    "stop")
        sudo systemctl stop claudyne-sync.service
        ;;
    "restart")
        sudo systemctl restart claudyne-sync.service
        ;;
    "logs")
        sudo journalctl -u claudyne-sync.service -f
        ;;
    *)
        echo "Usage: claudyne-sync {status|full|start|stop|restart|logs}"
        ;;
esac
EOF

sudo chmod +x /usr/local/bin/claudyne-sync
```

---

## 🌐 CONFIGURATION NGINX

### 1. Configuration Nginx
```bash
# Créer configuration Nginx
sudo cat > /etc/nginx/sites-available/claudyne << 'EOF'
server {
    listen 80;
    listen 443 ssl http2;
    server_name claudyne.com www.claudyne.com;

    # SSL Configuration
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

    # API Mobile (optionnel - route directe)
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
EOF

# Activer site
sudo ln -sf /etc/nginx/sites-available/claudyne /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 2. SSL avec Let's Encrypt
```bash
# Générer certificats SSL
sudo certbot --nginx -d claudyne.com -d www.claudyne.com --non-interactive --agree-tos --email support@claudyne.com

# Test renouvellement automatique
sudo certbot renew --dry-run
```

---

## 📱 DÉPLOIEMENT MOBILE

### 1. Configuration Mobile
```bash
cd claudyne-mobile

# Installer dépendances
npm install

# Configuration production
cat > .env.production << 'EOF'
API_URL=https://claudyne.com/api
NODE_ENV=production
VERSION=1.0.0
AUTO_SYNC_ENABLED=true
OFFLINE_MODE_ENABLED=true
EOF
```

### 2. Build Production APK
```bash
# Se connecter à Expo
npx eas login

# Build production
npx eas build --platform android --profile production --non-interactive

# Télécharger APK (après build)
# URL fournie par EAS Build
```

### 3. Déploiement APK
```bash
# Créer répertoire téléchargement
sudo mkdir -p /var/www/html/download

# Copier APK (remplacer par vraie URL)
sudo cp claudyne-production.apk /var/www/html/download/claudyne.apk
sudo chmod 644 /var/www/html/download/claudyne.apk
sudo chown www-data:www-data /var/www/html/download/claudyne.apk
```

---

## 🚀 DÉMARRAGE COMPLET

### 1. Première Synchronisation
```bash
cd /var/www/claudyne/backend

# Synchronisation initiale
node sync-database.js --full-sync

# Vérifier statut
node sync-database.js --status
```

### 2. Démarrage Services
```bash
# Démarrer auto-sync
sudo systemctl start claudyne-sync.service

# Démarrer applications
cd /var/www/claudyne
pm2 start ecosystem.config.js
pm2 save

# Démarrer au boot
pm2 startup
```

### 3. Vérification Santé
```bash
# Status services
pm2 status
sudo systemctl status claudyne-sync.service
sudo systemctl status nginx

# Test endpoints
curl https://claudyne.com/api/ping
curl https://claudyne.com/mobile-api/ping

# Test synchronisation
claudyne-sync status
```

---

## 📊 MONITORING ET MAINTENANCE

### 1. Logs Système
```bash
# Logs PM2
pm2 logs

# Logs synchronisation
claudyne-sync logs

# Logs Nginx
sudo tail -f /var/log/nginx/claudyne.access.log
sudo tail -f /var/log/nginx/claudyne.error.log
```

### 2. Commandes Maintenance
```bash
# Redémarrage complet
pm2 restart all
sudo systemctl restart claudyne-sync.service

# Mise à jour code
cd /var/www/claudyne
git pull origin main
npm install --production
pm2 restart all

# Force synchronisation
claudyne-sync full

# Backup base de données
sudo -u postgres pg_dump claudyne_production > backup-$(date +%Y%m%d).sql
```

### 3. Surveillance Automatique
```bash
# Cron backup quotidien
echo "0 2 * * * root /usr/local/bin/claudyne-sync full > /var/log/claudyne-daily-sync.log 2>&1" | sudo tee /etc/cron.d/claudyne-backup

# Monitoring espace disque
echo "0 */6 * * * root df -h | grep -E '(Filesystem|/dev/)' | mail -s 'Disk Usage Report' admin@claudyne.com" | sudo tee /etc/cron.d/claudyne-monitoring
```

---

## 🎯 URLS FINALES

### Production
- **Web App**: https://claudyne.com
- **API Backend**: https://claudyne.com/api
- **API Mobile**: https://claudyne.com/mobile-api
- **APK Download**: https://claudyne.com/download/claudyne.apk
- **Admin Interface**: https://claudyne.com/admin

### Commandes Système
```bash
# Status complet
claudyne-sync status
pm2 status
sudo systemctl status nginx

# Tests santé
curl https://claudyne.com/api/ping
curl https://claudyne.com/mobile-api/ping

# Synchronisation manuelle
claudyne-sync full
```

---

## ✅ CHECKLIST DÉPLOIEMENT

- [ ] ✅ VPS configuré (Node.js, PostgreSQL, Nginx, PM2)
- [ ] ✅ Base de données `claudyne_production` créée avec user `claudyne_user`
- [ ] ✅ Code cloné et dépendances installées
- [ ] ✅ Configuration `.env` backend avec bon mot de passe
- [ ] ✅ PM2 ecosystem configuré avec 3 apps
- [ ] ✅ Service systemd `claudyne-sync` activé
- [ ] ✅ Commande globale `claudyne-sync` installée
- [ ] ✅ Nginx configuré avec SSL Let's Encrypt
- [ ] ✅ Synchronisation JSON ↔ PostgreSQL testée
- [ ] ✅ APK mobile buildé et déployé
- [ ] ✅ Tous les endpoints testés et fonctionnels
- [ ] ✅ Monitoring et backups configurés

---

## 🎓 CONCLUSION

**Claudyne est maintenant déployé avec une architecture complète :**
- ✅ **Frontend Web** responsive et optimisé
- ✅ **Backend API** robuste avec synchronisation automatique
- ✅ **App Mobile** native avec offline support
- ✅ **Base de données** hybride JSON ↔ PostgreSQL
- ✅ **Infrastructure** production avec SSL, monitoring, backups

**Prêt à servir les familles camerounaises ! 🇨🇲**

*En hommage à Meffo Mehtah Tchandjio Claudine 👨‍👩‍👧‍👦*
*"La force du savoir en héritage"*