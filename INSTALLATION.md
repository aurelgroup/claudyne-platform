# Guide d'Installation Claudyne

**Plateforme éducative inspirée par Meffo Mehtah Tchandjio Claudine**  
*La force du savoir en héritage*

## 🎯 Vue d'ensemble

Claudyne est une plateforme éducative complète conçue spécifiquement pour les familles camerounaises. Elle combine apprentissage interactif, système de récompenses (Prix Claudine), et outils familiaux dans une architecture moderne optimisée pour les connexions 2G/3G.

## 📋 Prérequis Système

### Environnement de Développement
- **Node.js** 18+ (LTS recommandé)
- **NPM** 9+ ou **Yarn** 1.22+
- **PostgreSQL** 15+
- **Redis** 7+
- **Git** 2.30+

### Environnement de Production
- **VPS/Serveur** : 4GB RAM minimum, 100GB SSD
- **PostgreSQL** 15+ (peut être hébergé séparément)
- **Redis** 7+ pour le cache
- **Nginx** pour le reverse proxy
- **SSL Certificate** (Let's Encrypt recommandé)
- **Domaine** configuré pointant vers le serveur

### Services Externes (Optionnels)
- **MTN Mobile Money** API (sandbox puis production)
- **Orange Money** API pour les paiements
- **Cloudinary** pour l'optimisation d'images
- **Service Email** (SMTP ou SendGrid)

## 🚀 Installation Rapide (Docker)

### 1. Cloner le Repository
```bash
git clone https://github.com/claudyne.com/claudyne-platform.git
cd claudyne-platform
```

### 2. Configuration Environment
```bash
# Copier les fichiers d'environnement
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

# Modifier les configurations
nano backend/.env
nano frontend/.env.local
```

### 3. Démarrage avec Docker Compose
```bash
# Démarrage complet (développement)
docker-compose up -d

# Vérifier les services
docker-compose ps

# Voir les logs
docker-compose logs -f backend
```

### 4. Initialisation de la Base de Données
```bash
# Accès au conteneur backend
docker-compose exec backend bash

# Migrations et seeds
npm run migrate
npm run seed

# Créer un utilisateur admin (optionnel)
npm run create-admin
```

### 5. Accès à l'Application
- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:3001/api
- **Documentation** : http://localhost:3001/api/docs
- **MailHog** (emails dev) : http://localhost:8025
- **Adminer** (BDD) : http://localhost:8080

## 🛠️ Installation Manuelle

### 1. Installation Backend

```bash
cd backend

# Installation des dépendances
npm install

# Configuration
cp .env.example .env
# Modifier .env avec vos paramètres

# Base de données
npm run migrate
npm run seed

# Tests
npm test

# Démarrage
npm run dev
```

#### Configuration Backend (.env)
```bash
NODE_ENV=development
PORT=3001

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=claudyne_dev
DB_USER=claudyne_user
DB_PASSWORD=your_secure_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your_very_secure_jwt_secret_key
JWT_EXPIRE=7d

# Prix Claudine
PRIX_CLAUDINE_SEASON=2025-september

# Paiements (sandbox)
MTN_API_BASE_URL=https://sandbox.momodeveloper.mtn.com
ORANGE_API_BASE_URL=https://api.orange.com

# Frontend URL
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
```

### 2. Installation Frontend

```bash
cd frontend

# Installation des dépendances
npm install

# Configuration
cp .env.local.example .env.local
# Modifier .env.local

# Build (optionnel)
npm run build

# Démarrage
npm run dev
```

#### Configuration Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_SOCKET_URL=ws://localhost:3001

# Analytics (optionnel)
NEXT_PUBLIC_GTAG_ID=
NEXT_PUBLIC_SENTRY_DSN=

# Optimisation pour l'Afrique
CLAUDYNE_REGION=africa
```

### 3. Configuration Base de Données

#### PostgreSQL
```sql
-- Créer la base de données
CREATE DATABASE claudyne_dev;
CREATE USER claudyne_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE claudyne_dev TO claudyne_user;

-- Support des extensions (si nécessaire)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- Pour la géolocalisation
```

#### Redis
```bash
# Configuration Redis (redis.conf)
requirepass your_redis_password
appendonly yes
maxmemory 512mb
maxmemory-policy allkeys-lru
```

## 🌍 Configuration pour le Cameroun

### 1. Localisation
```javascript
// backend/.env
DEFAULT_LOCALE=fr
TIMEZONE=Africa/Douala
CURRENCY=FCFA

// frontend/.env.local
NEXT_PUBLIC_DEFAULT_REGION=Cameroun
NEXT_PUBLIC_TIMEZONE=Africa/Douala
```

### 2. Optimisations Réseau
```javascript
// next.config.js
module.exports = {
  // Optimisation pour 2G/3G
  images: {
    quality: 60,
    formats: ['image/webp']
  },
  
  // Compression
  compress: true,
  
  // PWA pour usage offline
  pwa: {
    dest: 'public',
    disable: process.env.NODE_ENV === 'development'
  }
}
```

### 3. Services de Paiement

#### MTN Mobile Money
```bash
# 1. Inscription sur https://momodeveloper.mtn.com/
# 2. Obtenir les clés API
# 3. Configuration

MTN_SUBSCRIPTION_KEY=your_mtn_subscription_key
MTN_API_USER_ID=your_mtn_api_user_id
MTN_API_KEY=your_mtn_api_key
```

#### Orange Money
```bash
# Configuration Orange Money
ORANGE_CLIENT_ID=your_orange_client_id
ORANGE_CLIENT_SECRET=your_orange_client_secret
ORANGE_MERCHANT_KEY=your_orange_merchant_key
```

## 📱 Configuration PWA

### 1. Service Worker
Le service worker est automatiquement configuré pour :
- Cache des ressources critiques
- Fonctionnement offline
- Synchronisation en arrière-plan
- Notifications push

### 2. Manifest
```json
{
  "name": "Claudyne - La force du savoir en héritage",
  "short_name": "Claudyne",
  "description": "Plateforme éducative pour familles camerounaises",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#D4AF37",
  "background_color": "#F8F9FA",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

## 🔒 Sécurité

### 1. Authentification
- JWT avec rotation des tokens
- 2FA optionnel
- Rate limiting
- Protection contre les attaques par force brute

### 2. HTTPS et Certificates
```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    server_name claudyne.com www.claudyne.com;
    
    ssl_certificate /etc/letsencrypt/live/claudyne.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/claudyne.com/privkey.pem;
    
    # Configuration SSL moderne
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Sécurité headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
}
```

## 📊 Monitoring et Logs

### 1. Logs Structurés
```javascript
// Configuration Winston
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/claudyne.log' }),
    new winston.transports.Console()
  ]
});
```

### 2. Health Checks
```bash
# Vérification des services
curl -f http://localhost:3001/health
curl -f http://localhost:3000/api/health
```

### 3. Métriques (Optionnel)
- **Prometheus** pour les métriques
- **Grafana** pour les dashboards
- **Alerts** pour les incidents

## 🚀 Déploiement Production

### 1. Serveur Ubuntu/Debian
```bash
# Mise à jour système
apt update && apt upgrade -y

# Installation Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Installation PostgreSQL 15
apt install postgresql-15 postgresql-client-15

# Installation Redis
apt install redis-server

# Installation Nginx
apt install nginx

# Installation Certbot pour SSL
apt install certbot python3-certbot-nginx
```

### 2. Configuration Production
```bash
# Variables d'environnement
export NODE_ENV=production
export PORT=3001

# Process Manager (PM2)
npm install -g pm2

# Démarrage des services
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 3. Nginx Configuration
```nginx
# /etc/nginx/sites-available/claudyne.com
server {
    listen 80;
    server_name claudyne.com www.claudyne.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name claudyne.com www.claudyne.com;
    
    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
    }
    
    # WebSocket pour Battle Royale
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## 🧪 Tests et Validation

### 1. Tests Automatisés
```bash
# Backend
cd backend
npm test
npm run test:coverage

# Frontend
cd frontend
npm test
npm run test:e2e
```

### 2. Tests de Performance
```bash
# Test de charge avec Artillery
npm install -g artillery
artillery run tests/load/api-load-test.yml

# Audit Lighthouse (PWA)
lighthouse http://localhost:3000 --view
```

### 3. Validation Camerounaise
- [ ] Test avec connexion 2G simulée
- [ ] Validation des formats de téléphone camerounais
- [ ] Test des paiements MTN/Orange Money sandbox
- [ ] Vérification de la localisation française
- [ ] Test du système Prix Claudine

## 🛠️ Maintenance

### 1. Sauvegardes
```bash
# Sauvegarde automatique PostgreSQL
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump claudyne_prod > /backups/claudyne_$DATE.sql
aws s3 cp /backups/claudyne_$DATE.sql s3://claudyne-backups/
```

### 2. Mise à jour
```bash
# Mise à jour du code
git pull origin main
npm install
npm run build

# Migration BDD si nécessaire
npm run migrate

# Redémarrage des services
pm2 restart all
```

### 3. Monitoring
```bash
# Surveiller les logs
tail -f logs/claudyne.log

# Surveiller les performances
pm2 monit

# Vérifier l'espace disque
df -h
```

## 🤝 Support et Contribution

### Documentation
- **API** : http://localhost:3001/api/docs
- **Storybook** : http://localhost:6006
- **Code** : Commentaires JSDoc intégrés

### Contact
- **Email** : support@claudyne.com
- **GitHub** : https://github.com/claudyne.com/claudyne-platform
- **Discord** : [Communauté Claudyne]

### Contribution
1. Fork le repository
2. Créer une branche feature
3. Développer avec tests
4. Soumettre une Pull Request

---

## 🎓 En mémoire de Claudine

*"Le savoir est la plus belle force qu'on puisse léguer"*

Cette plateforme honore la mémoire de **Meffo Mehtah Tchandjio Claudine** en perpétuant ses valeurs d'éducation, de partage et d'excellence au service des familles camerounaises.

**🇨🇲 Made with ❤️ in Cameroon 🇨🇲**