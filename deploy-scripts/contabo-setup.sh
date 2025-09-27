#!/bin/bash

echo "🚀 ================================================"
echo "   CONFIGURATION SERVEUR CONTABO VPS - CLAUDYNE"
echo "🚀 ================================================"
echo "En hommage à Meffo Mehtah Tchandjio Claudine 👨‍👩‍👧‍👦"
echo ""

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction de log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Vérifier si on est root
if [ "$EUID" -ne 0 ]; then
    error "Ce script doit être exécuté en tant que root (sudo)"
    exit 1
fi

log "🔄 Mise à jour du système Ubuntu..."
apt update && apt upgrade -y

log "📦 Installation des outils essentiels..."
apt install -y curl wget git unzip software-properties-common build-essential

log "🟢 Installation Node.js 18.x LTS..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Vérification versions
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
log "Node.js installé: $NODE_VERSION"
log "NPM installé: $NPM_VERSION"

log "⚡ Installation PM2 pour la gestion des processus..."
npm install -g pm2

log "🐘 Installation PostgreSQL 15..."
apt install -y postgresql postgresql-contrib

log "🔧 Configuration PostgreSQL..."
sudo -u postgres psql << EOF
CREATE USER claudyne_user WITH ENCRYPTED PASSWORD 'ClAuDyNe2024!SecurePass';
CREATE DATABASE claudyne_production OWNER claudyne_user;
GRANT ALL PRIVILEGES ON DATABASE claudyne_production TO claudyne_user;
ALTER USER claudyne_user CREATEDB;
\q
EOF

log "🔥 Installation Redis..."
apt install -y redis-server
systemctl enable redis-server
systemctl start redis-server

log "🛡️ Configuration du firewall UFW..."
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp

log "👤 Création de l'utilisateur claudyne..."
id -u claudyne &>/dev/null || useradd -m -s /bin/bash claudyne
usermod -aG sudo claudyne

log "📁 Création des répertoires..."
mkdir -p /var/www/claudyne
chown -R claudyne:claudyne /var/www/claudyne

log "🌐 Installation Nginx..."
apt install -y nginx
systemctl start nginx
systemctl enable nginx

log "🔒 Installation Certbot pour SSL..."
apt install -y certbot python3-certbot-nginx

log "📊 Installation htop pour monitoring..."
apt install -y htop

log "✅ Configuration serveur terminée!"
log "📋 Résumé de l'installation:"
echo "   - Node.js: $NODE_VERSION"
echo "   - NPM: $NPM_VERSION"
echo "   - PostgreSQL: Installé avec base 'claudyne_production'"
echo "   - Redis: Actif"
echo "   - Nginx: Actif"
echo "   - Utilisateur: claudyne créé"
echo "   - Répertoire: /var/www/claudyne"
echo ""
log "🎯 Prochaine étape: Connectez-vous avec 'su - claudyne' et clonez le projet"