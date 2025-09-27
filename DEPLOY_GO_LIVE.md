# 🚀 Documentation Déploiement Production - Claudyne
> *"La force du savoir en héritage"*  
> En hommage à **Meffo Mehtah Tchandjio Claudine** 👨‍👩‍👧‍👦

## 📋 Configuration VPS et Domaine

### 🖥️ Serveur VPS Contabo
- **Fournisseur**: Contabo Cloud VPS 10
- **CPU**: 3 vCPU
- **RAM**: 8GB
- **Stockage**: 75GB NVMe SSD
- **OS**: Ubuntu 24.04 LTS
- **Bande passante**: Illimitée

### 🌐 Domaine
- **Domaine**: claudyne.com
- **Hébergeur**: PlanetHoster
- **SSL**: Let's Encrypt (gratuit)

---

## ⚡ Phase 1: Préparation du Serveur VPS

### 1.1 Connexion au VPS
```bash
# Connexion SSH avec la clé fournie par Contabo
ssh root@[IP_VPS_CONTABO]

# Mise à jour du système
apt update && apt upgrade -y

# Installation des outils essentiels
apt install -y curl wget git unzip software-properties-common
```

### 1.2 Installation Node.js et NPM
```bash
# Installation Node.js 18.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Vérification des versions
node --version  # Doit afficher v18.x.x
npm --version   # Doit afficher 9.x.x

# Installation PM2 pour la gestion des processus
npm install -g pm2
```

### 1.3 Installation PostgreSQL
```bash
# Installation PostgreSQL 15
apt install -y postgresql postgresql-contrib

# Configuration de base
sudo -u postgres psql
```

```sql
-- Dans psql, créer la base de données
CREATE USER claudyne_user WITH ENCRYPTED PASSWORD 'ClAuDyNe2024!SecurePass';
CREATE DATABASE claudyne_production OWNER claudyne_user;
GRANT ALL PRIVILEGES ON DATABASE claudyne_production TO claudyne_user;
\q
```

### 1.4 Installation Redis (optionnel pour le cache)
```bash
apt install -y redis-server
systemctl enable redis-server
systemctl start redis-server
```

---

## 🔐 Phase 2: Configuration Sécurité

### 2.1 Firewall (UFW)
```bash
# Installation et configuration du firewall
ufw --force enable
ufw default deny incoming
ufw default allow outgoing

# Autoriser SSH, HTTP et HTTPS
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp

# Vérifier le statut
ufw status
```

### 2.2 Création utilisateur dédié
```bash
# Créer un utilisateur pour l'application
adduser claudyne
usermod -aG sudo claudyne

# Créer le répertoire pour les applications
mkdir -p /var/www/claudyne
chown -R claudyne:claudyne /var/www/claudyne
```

### 2.3 Installation Nginx
```bash
# Installation Nginx
apt install -y nginx

# Démarrage et activation
systemctl start nginx
systemctl enable nginx

# Test de fonctionnement
curl http://localhost
```

---

## 📁 Phase 3: Déploiement du Code

### 3.1 Clonage du projet
```bash
# Basculer vers l'utilisateur claudyne
su - claudyne

# Cloner le projet (remplacer par votre repository)
cd /var/www/claudyne
git clone https://github.com/votre-username/claudyne-platform.git
cd claudyne-platform

# Installer les dépendances
npm run install:all
```

### 3.2 Configuration des variables d'environnement
```bash
# Créer le fichier .env principal
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
API_PORT=3001

# Base de données PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=claudyne_production
DB_USER=claudyne_user
DB_PASSWORD=ClAuDyNe2024!SecurePass

# Redis (optionnel)
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT et sécurité
JWT_SECRET=ClAuDyNe_JWT_SeCreT_Key_2024_VeRy_SeCuRe_123!
JWT_EXPIRES_IN=24h

# OpenAI pour IA Mentor Claudyne (optionnel)
OPENAI_API_KEY=votre_clé_openai_ici

# Paiements mobiles Cameroun (production)
MTN_API_KEY=votre_clé_mtn_production
MTN_API_SECRET=votre_secret_mtn_production
MTN_SUBSCRIPTION_KEY=votre_subscription_key_mtn

ORANGE_API_KEY=votre_clé_orange_production
ORANGE_API_SECRET=votre_secret_orange_production

# Email (pour les notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=contact@claudyne.com
EMAIL_PASS=votre_mot_de_passe_app_gmail

# URLs de production
APP_URL=https://claudyne.com
API_URL=https://claudyne.com/api

# Monitoring
LOG_LEVEL=info
MAX_LOG_SIZE=10m
MAX_LOG_FILES=5
EOF

# Créer le fichier .env backend
cd backend
cp ../.env .env

# Sécuriser les fichiers de configuration
chmod 600 /var/www/claudyne/claudyne-platform/.env
chmod 600 /var/www/claudyne/claudyne-platform/backend/.env
```

### 3.3 Configuration de la base de données
```bash
cd /var/www/claudyne/claudyne-platform/backend

# Migration de la base de données (si Sequelize est utilisé)
npx sequelize-cli db:migrate

# Seeds optionnels (données de démo)
npx sequelize-cli db:seed:all
```

---

## 🌐 Phase 4: Configuration DNS PlanetHoster

### 4.1 Configuration DNS chez PlanetHoster
Connectez-vous à votre compte PlanetHoster et configurez les enregistrements DNS :

```dns
Type    Nom         Valeur              TTL
A       @           [IP_VPS_CONTABO]    3600
A       www         [IP_VPS_CONTABO]    3600
A       api         [IP_VPS_CONTABO]    3600
CNAME   admin       claudyne.com        3600
CNAME   student     claudyne.com        3600
```

### 4.2 Vérification de la propagation DNS
```bash
# Sur votre machine locale, tester la propagation
nslookup claudyne.com
nslookup www.claudyne.com
nslookup api.claudyne.com

# Ou utiliser des outils en ligne
# https://dnschecker.org/
```

---

## 🔧 Phase 5: Configuration Nginx

### 5.1 Configuration principale Nginx
```bash
# Créer la configuration pour Claudyne
sudo tee /etc/nginx/sites-available/claudyne.com << 'EOF'
server {
    listen 80;
    server_name claudyne.com www.claudyne.com;
    
    # Redirection temporaire vers HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name claudyne.com www.claudyne.com;
    
    # Configuration SSL (sera mise à jour par Certbot)
    ssl_certificate /etc/letsencrypt/live/claudyne.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/claudyne.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    # Racine du projet
    root /var/www/claudyne/claudyne-platform;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # Headers de sécurité
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    
    # Service Worker
    location /sw.js {
        add_header Cache-Control "public, max-age=0, must-revalidate";
        add_header Service-Worker-Allowed "/";
    }
    
    # Assets statiques avec cache long
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Proxy vers l'API Node.js (port 3001)
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Interface principale
    location / {
        try_files $uri $uri/ @nodejs;
    }
    
    # Routes spécifiques
    location /admin {
        try_files $uri /admin-interface.html;
    }
    
    location /student {
        try_files $uri /student-interface-modern.html;
    }
    
    location /offline {
        try_files $uri /offline.html;
    }
    
    # Fallback vers Node.js
    location @nodejs {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Logs spécifiques
    access_log /var/log/nginx/claudyne.com.access.log;
    error_log /var/log/nginx/claudyne.com.error.log;
}
EOF

# Activer le site
sudo ln -s /etc/nginx/sites-available/claudyne.com /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Tester la configuration
sudo nginx -t

# Recharger Nginx
sudo systemctl reload nginx
```

---

## 🔒 Phase 6: Configuration SSL avec Let's Encrypt

### 6.1 Installation Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 6.2 Obtention du certificat SSL
```bash
# Obtenir le certificat pour claudyne.com
sudo certbot --nginx -d claudyne.com -d www.claudyne.com

# Suivre les instructions interactives
# Email : votre-email@domain.com
# Accepter les conditions : Y
# Partager email avec EFF : Y/N (votre choix)

# Test de renouvellement automatique
sudo certbot renew --dry-run
```

### 6.3 Configuration du renouvellement automatique
```bash
# Vérifier que le cron est configuré
sudo systemctl status certbot.timer

# Si non configuré, l'ajouter manuellement
sudo crontab -e

# Ajouter cette ligne (renouvellement tous les mois)
0 2 1 * * /usr/bin/certbot renew --quiet && systemctl reload nginx
```

---

## 🚀 Phase 7: Démarrage des Services

### 7.1 Configuration PM2
```bash
# Créer le fichier de configuration PM2
cd /var/www/claudyne/claudyne-platform

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
      error_file: './logs/frontend-err.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true
    },
    {
      name: 'claudyne-backend',
      script: './backend/src/server.js',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/backend-err.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true
    }
  ]
};
EOF

# Créer le répertoire pour les logs
mkdir -p logs

# Démarrer les applications avec PM2
pm2 start ecosystem.config.js

# Sauvegarder la configuration PM2
pm2 save

# Configurer le démarrage automatique
pm2 startup
# Exécuter la commande affichée par PM2 (commence par sudo env PATH=...)
```

### 7.2 Vérification des services
```bash
# Vérifier le statut PM2
pm2 status
pm2 logs

# Vérifier Nginx
sudo systemctl status nginx

# Vérifier PostgreSQL
sudo systemctl status postgresql

# Test des endpoints
curl https://claudyne.com
curl https://claudyne.com/admin
curl https://claudyne.com/student
curl https://claudyne.com/api/health
```

---

## 📊 Phase 8: Monitoring et Logs

### 8.1 Configuration des logs système
```bash
# Configuration logrotate pour les logs de l'app
sudo tee /etc/logrotate.d/claudyne << 'EOF'
/var/www/claudyne/claudyne-platform/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0644 claudyne claudyne
    postrotate
        pm2 reload all
    endscript
}
EOF
```

### 8.2 Monitoring basique
```bash
# Installation htop pour monitoring
sudo apt install -y htop

# Script de monitoring simple
cat > /var/www/claudyne/monitor.sh << 'EOF'
#!/bin/bash
echo "=== Claudyne System Monitor ==="
echo "Date: $(date)"
echo "Uptime: $(uptime)"
echo ""
echo "=== Disk Usage ==="
df -h /
echo ""
echo "=== Memory Usage ==="
free -h
echo ""
echo "=== PM2 Status ==="
pm2 status
echo ""
echo "=== Nginx Status ==="
systemctl is-active nginx
echo ""
echo "=== PostgreSQL Status ==="
systemctl is-active postgresql
echo ""
echo "=== SSL Certificate ==="
sudo certbot certificates
EOF

chmod +x /var/www/claudyne/monitor.sh

# Créer un cron pour le monitoring (optionnel)
echo "0 */6 * * * /var/www/claudyne/monitor.sh >> /var/log/claudyne-monitor.log 2>&1" | crontab -
```

---

## 🎯 Phase 9: Tests de Production

### 9.1 Checklist de vérification

#### ✅ Tests de connectivité
```bash
# Test depuis le serveur
curl -I https://claudyne.com
curl -I https://claudyne.com/admin
curl -I https://claudyne.com/student
curl -I https://claudyne.com/api/health
```

#### ✅ Tests de performance
- **Lighthouse**: Score > 90/100
- **GTmetrix**: Grade A
- **PageSpeed Insights**: Score > 90

#### ✅ Tests de sécurité
```bash
# Test headers de sécurité
curl -I https://claudyne.com | grep -E "(X-Frame|X-Content|Strict-Transport)"

# Test SSL
openssl s_client -connect claudyne.com:443 -servername claudyne.com
```

#### ✅ Tests PWA
- [ ] Service Worker actif
- [ ] Installable sur mobile
- [ ] Mode offline fonctionnel
- [ ] Push notifications (si activées)

### 9.2 Tests fonctionnels
- [ ] Inscription utilisateur
- [ ] Connexion/déconnexion
- [ ] Interface admin complète
- [ ] Interface étudiant
- [ ] Liaison famille-étudiant
- [ ] Prix Claudine
- [ ] Optimisation réseau 2G/3G

---

## 🔧 Phase 10: Maintenance et Mise à Jour

### 10.1 Script de déploiement automatique
```bash
# Créer le script de déploiement
cat > /var/www/claudyne/deploy.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Déploiement Claudyne - $(date)"

# Aller dans le répertoire du projet
cd /var/www/claudyne/claudyne-platform

# Sauvegarder l'état actuel
git stash

# Récupérer les dernières modifications
git pull origin main

# Installer/Mettre à jour les dépendances
npm install
cd backend && npm install && cd ..

# Migrations de base de données (si nécessaire)
cd backend && npx sequelize-cli db:migrate && cd ..

# Redémarrer les services
pm2 reload all

# Vérifier le statut
sleep 5
pm2 status

# Test de santé
curl -f https://claudyne.com || exit 1
curl -f https://claudyne.com/api/health || exit 1

echo "✅ Déploiement terminé avec succès!"
echo "🔗 Site accessible sur: https://claudyne.com"
echo "👨‍👩‍👧‍👦 En hommage à Meffo Mehtah Tchandjio Claudine"
EOF

chmod +x /var/www/claudyne/deploy.sh
```

### 10.2 Backup automatique
```bash
# Script de sauvegarde
cat > /var/www/claudyne/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/claudyne"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Sauvegarde de la base de données
sudo -u postgres pg_dump claudyne_production > $BACKUP_DIR/db_$DATE.sql

# Sauvegarde des fichiers uploadés (si applicable)
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /var/www/claudyne/claudyne-platform/uploads/ 2>/dev/null || true

# Nettoyer les anciennes sauvegardes (garder 7 jours)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /var/www/claudyne/backup.sh

# Programmer la sauvegarde quotidienne
echo "0 2 * * * /var/www/claudyne/backup.sh >> /var/log/claudyne-backup.log 2>&1" | sudo crontab -
```

---

## 🎯 Résumé Final - Go Live

### 🚀 Commandes de mise en production

```bash
# 1. Sur votre machine locale - Push final
git add .
git commit -m "🚀 Production ready - Go Live Claudyne v1.2.0"
git push origin main

# 2. Sur le serveur VPS - Déploiement
cd /var/www/claudyne/claudyne-platform
./deploy.sh

# 3. Vérification finale
pm2 status
curl https://claudyne.com
```

### 📊 URLs de Production

| Interface | URL | Description |
|-----------|-----|-------------|
| 🏠 **Principale** | https://claudyne.com | Page d'accueil et inscription |
| 👨‍💼 **Admin** | https://claudyne.com/admin | Interface d'administration |
| 🎓 **Étudiant** | https://claudyne.com/student | Interface étudiante moderne |
| 🔗 **API** | https://claudyne.com/api | Backend REST API |
| 📴 **Offline** | https://claudyne.com/offline | Page hors ligne |

### 🔍 Vérification Santé Système

```bash
# Monitoring en temps réel
pm2 monit

# Logs en direct
pm2 logs

# Statut des services
sudo systemctl status nginx postgresql redis-server

# Monitoring système
htop
```

### 📞 Support et Maintenance

- **Logs d'erreur**: `/var/www/claudyne/claudyne-platform/logs/`
- **Monitoring**: `pm2 monit` ou `/var/www/claudyne/monitor.sh`
- **Déploiements**: `/var/www/claudyne/deploy.sh`
- **Backups**: `/var/backups/claudyne/`

### 🎉 Félicitations !

**Claudyne est maintenant en production sur claudyne.com** 🎓

- ✅ **Serveur**: Contabo VPS (3 vCPU, 8GB RAM)
- ✅ **Domaine**: claudyne.com via PlanetHoster
- ✅ **SSL**: Let's Encrypt (HTTPS)
- ✅ **PWA**: Installable sur mobile
- ✅ **Optimisation**: 2G/3G Cameroun
- ✅ **Sécurité**: Headers, Firewall, SSL
- ✅ **Monitoring**: PM2, Logs, Backups

---

<div align="center">

### 🌟 Claudyne est prêt à changer l'éducation camerounaise !

**La force du savoir en héritage** ✨

*En hommage à Meffo Mehtah Tchandjio Claudine* 👨‍👩‍👧‍👦

</div>