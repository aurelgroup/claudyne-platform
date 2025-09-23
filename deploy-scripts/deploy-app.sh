#!/bin/bash

echo "🎓 ================================================"
echo "   DÉPLOIEMENT APPLICATION CLAUDYNE"
echo "🎓 ================================================"
echo "En hommage à Meffo Mehtah Tchandjio Claudine 👨‍👩‍👧‍👦"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Vérifier qu'on est l'utilisateur claudyne
if [ "$USER" != "claudyne" ]; then
    error "Ce script doit être exécuté par l'utilisateur 'claudyne'"
fi

cd /var/www/claudyne

# Variables à configurer
GITHUB_REPO="https://github.com/aurelgroup/claudyne-platform.git"
DOMAIN="claudyne.com"  # À MODIFIER si différent

log "📥 Clonage du projet depuis GitHub..."
if [ -d "claudyne-platform" ]; then
    log "Le projet existe déjà, mise à jour..."
    cd claudyne-platform
    git stash
    git pull origin main
else
    log "Premier clonage du projet..."
    git clone $GITHUB_REPO
    cd claudyne-platform
fi

log "📦 Installation des dépendances principales..."
npm install

log "📦 Installation des dépendances backend..."
cd backend && npm install && cd ..

log "🔧 Création du fichier .env principal..."
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
API_PORT=3001

# Base de données PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=claudyne_prod
DB_USER=claudyne_user
DB_PASSWORD=ClAuDyNe2024!SecurePass

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT et sécurité
JWT_SECRET=ClAuDyNe_JWT_SeCreT_Key_2024_VeRy_SeCuRe_123!
JWT_EXPIRES_IN=24h

# URLs de production (À MODIFIER selon votre domaine)
APP_URL=https://claudyne.com
API_URL=https://claudyne.com/api

# Email (OPTIONNEL - à configurer selon vos besoins)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=contact@claudyne.com
EMAIL_PASS=votre_mot_de_passe_app

# Paiements mobiles Cameroun (OPTIONNEL - pour plus tard)
# MTN_API_KEY=votre_clé_mtn
# ORANGE_API_KEY=votre_clé_orange

# Logs
LOG_LEVEL=info
MAX_LOG_SIZE=10m
MAX_LOG_FILES=5
EOF

log "🔧 Copie du .env vers le backend..."
cp .env backend/.env

log "🔒 Sécurisation des fichiers de configuration..."
chmod 600 .env backend/.env

log "📊 Configuration PM2..."
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
      time: true,
      restart_delay: 4000,
      max_memory_restart: '500M'
    },
    {
      name: 'claudyne-backend',
      script: './backend/minimal-server.js',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/backend-err.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,
      restart_delay: 4000,
      max_memory_restart: '300M'
    }
  ]
};
EOF

log "📁 Création du répertoire logs..."
mkdir -p logs

log "🚀 Démarrage des applications avec PM2..."
pm2 start ecosystem.config.js

log "💾 Sauvegarde de la configuration PM2..."
pm2 save

log "🔄 Configuration du démarrage automatique..."
pm2 startup

log "✅ Déploiement de l'application terminé!"
log "📊 Statut PM2:"
pm2 status

echo ""
log "🎯 Prochaine étape: Configuration Nginx et SSL"
log "   Exécutez le script: sudo /var/www/claudyne/claudyne-platform/deploy-scripts/setup-nginx.sh"