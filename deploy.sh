#!/bin/bash

# ================================
# SCRIPT DE DEPLOIEMENT CLAUDYNE
# ================================
# Déploiement automatisé sur VPS Contabo
# avec SSL Let's Encrypt et optimisations Cameroun

set -e  # Arrêt en cas d'erreur

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions d'affichage
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCÈS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[ATTENTION]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERREUR]${NC} $1"
}

# ================================
# Configuration
# ================================

DOMAIN=${DOMAIN:-"claudyne.com"}
EMAIL=${CERTBOT_EMAIL:-"admin@claudyne.com"}
COMPOSE_FILE="docker-compose.production.yml"
ENV_FILE=".env.production"

log_info "🚀 Déploiement Claudyne sur VPS Contabo"
log_info "🌍 Domaine: $DOMAIN"
log_info "📧 Email Let's Encrypt: $EMAIL"
echo ""

# ================================
# Vérifications préalables
# ================================

log_info "🔍 Vérifications préalables..."

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    log_error "Docker n'est pas installé !"
    log_info "Installation de Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    log_success "Docker installé avec succès"
fi

# Vérifier Docker Compose
if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose n'est pas installé !"
    log_info "Installation de Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    log_success "Docker Compose installé avec succès"
fi

# Vérifier les fichiers de configuration
if [ ! -f "$ENV_FILE" ]; then
    log_error "Fichier $ENV_FILE manquant !"
    log_info "Copiez .env.production.template vers $ENV_FILE et configurez-le"
    exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
    log_error "Fichier $COMPOSE_FILE manquant !"
    exit 1
fi

log_success "Vérifications terminées"
echo ""

# ================================
# Préparation des répertoires
# ================================

log_info "📁 Préparation des répertoires..."

# Créer les répertoires nécessaires
sudo mkdir -p /var/www/certbot
sudo mkdir -p nginx/ssl
sudo mkdir -p database/init
sudo mkdir -p backups
sudo mkdir -p monitoring

# Permissions correctes
sudo chown -R $USER:$USER nginx/
sudo chown -R $USER:$USER database/
sudo chown -R $USER:$USER backups/

log_success "Répertoires préparés"
echo ""

# ================================
# Configuration du firewall
# ================================

log_info "🔥 Configuration du firewall..."

# UFW pour sécuriser le VPS
if command -v ufw &> /dev/null; then
    sudo ufw --force reset
    sudo ufw default deny incoming
    sudo ufw default allow outgoing

    # Ports nécessaires
    sudo ufw allow ssh
    sudo ufw allow 80/tcp   # HTTP
    sudo ufw allow 443/tcp  # HTTPS

    # Optionnel : accès direct base de données (décommentez si nécessaire)
    # sudo ufw allow from 127.0.0.1 to any port 5432  # PostgreSQL
    # sudo ufw allow from 127.0.0.1 to any port 6379  # Redis

    sudo ufw --force enable
    log_success "Firewall configuré"
else
    log_warning "UFW non disponible, configurez le firewall manuellement"
fi

echo ""

# ================================
# SSL/HTTPS avec Let's Encrypt
# ================================

log_info "🔒 Configuration SSL/HTTPS avec Let's Encrypt..."

# Étape 1: Démarrer nginx temporaire pour obtenir les certificats
log_info "Démarrage temporaire pour obtention certificats..."

# Configuration nginx temporaire pour Let's Encrypt
cat > nginx/conf.d/temp-ssl.conf << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://\$server_name\$request_uri;
    }
}
EOF

# Démarrer nginx temporaire
docker-compose -f $COMPOSE_FILE up -d nginx

# Attendre que nginx soit prêt
sleep 10

# Obtenir les certificats SSL
log_info "Obtention des certificats SSL..."

docker run --rm \
    -v "$(pwd)/nginx/ssl:/etc/letsencrypt" \
    -v "/var/www/certbot:/var/www/certbot" \
    --network="$(basename $(pwd))_claudyne-network" \
    certbot/certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN \
    -d www.$DOMAIN \
    --non-interactive

if [ $? -eq 0 ]; then
    log_success "Certificats SSL obtenus avec succès"

    # Copier les certificats au bon endroit
    sudo cp -r "$(pwd)/nginx/ssl/live/$DOMAIN/" "$(pwd)/nginx/ssl/"
    sudo cp -r "$(pwd)/nginx/ssl/archive/$DOMAIN/" "$(pwd)/nginx/ssl/"

    # Remplacer la configuration temporaire par la vraie
    rm nginx/conf.d/temp-ssl.conf

else
    log_error "Échec de l'obtention des certificats SSL"
    log_warning "Vérifiez que le domaine $DOMAIN pointe vers ce serveur"
    log_info "Vous pouvez continuer sans SSL pour les tests locaux"

    read -p "Continuer sans SSL ? (y/N): " continue_without_ssl
    if [[ ! $continue_without_ssl =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""

# ================================
# Optimisations système pour Cameroun
# ================================

log_info "⚡ Optimisations système pour réseaux 2G/3G..."

# Optimisations kernel pour réseaux lents
cat << EOF | sudo tee -a /etc/sysctl.conf > /dev/null

# Optimisations Claudyne pour réseaux Cameroun
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
net.ipv4.tcp_window_scaling = 1
net.ipv4.tcp_congestion_control = bbr
net.core.default_qdisc = fq
net.ipv4.tcp_slow_start_after_idle = 0
EOF

sudo sysctl -p

# Optimisations Docker pour VPS
cat << EOF | sudo tee /etc/docker/daemon.json > /dev/null
{
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "3"
    },
    "dns": ["8.8.8.8", "1.1.1.1"],
    "storage-driver": "overlay2"
}
EOF

sudo systemctl restart docker

log_success "Optimisations système appliquées"
echo ""

# ================================
# Déploiement des services
# ================================

log_info "🐳 Déploiement des services Docker..."

# Charger les variables d'environnement
source $ENV_FILE

# Arrêter les services existants
docker-compose -f $COMPOSE_FILE down --remove-orphans

# Construire les images
log_info "Construction de l'image backend..."
docker-compose -f $COMPOSE_FILE build --no-cache backend

# Démarrer la base de données en premier
log_info "Démarrage de PostgreSQL..."
docker-compose -f $COMPOSE_FILE up -d postgres redis

# Attendre que la DB soit prête
log_info "Attente de la base de données..."
sleep 30

# Vérifier la connexion à la DB
until docker-compose -f $COMPOSE_FILE exec -T postgres pg_isready -U claudyne_user -d claudyne_production; do
    log_info "Attente de PostgreSQL..."
    sleep 5
done

log_success "PostgreSQL prêt"

# Démarrer le backend
log_info "Démarrage du backend..."
docker-compose -f $COMPOSE_FILE up -d backend

# Attendre que le backend soit prêt
log_info "Attente du backend..."
sleep 20

until curl -f http://localhost:3001/health &> /dev/null; do
    log_info "Attente du backend..."
    sleep 5
done

log_success "Backend prêt"

# Démarrer nginx et frontend
log_info "Démarrage nginx et frontend..."
docker-compose -f $COMPOSE_FILE up -d nginx frontend

log_success "Tous les services sont démarrés"
echo ""

# ================================
# Configuration automatique SSL Renewal
# ================================

log_info "🔄 Configuration du renouvellement automatique SSL..."

# Script de renouvellement
cat << 'EOF' > renew-ssl.sh
#!/bin/bash
docker run --rm \
    -v "$(pwd)/nginx/ssl:/etc/letsencrypt" \
    -v "/var/www/certbot:/var/www/certbot" \
    --network="$(basename $(pwd))_claudyne-network" \
    certbot/certbot renew --quiet

if [ $? -eq 0 ]; then
    docker-compose -f docker-compose.production.yml exec nginx nginx -s reload
fi
EOF

chmod +x renew-ssl.sh

# Ajouter au crontab pour renouvellement automatique
(crontab -l 2>/dev/null; echo "0 3 * * 0 $(pwd)/renew-ssl.sh") | crontab -

log_success "Renouvellement SSL automatique configuré"
echo ""

# ================================
# Tests de santé
# ================================

log_info "🩺 Tests de santé des services..."

# Test backend
if curl -f http://localhost:3001/health &> /dev/null; then
    log_success "✅ Backend OK"
else
    log_error "❌ Backend KO"
fi

# Test frontend
if curl -f http://localhost/ &> /dev/null; then
    log_success "✅ Frontend OK"
else
    log_error "❌ Frontend KO"
fi

# Test HTTPS (si SSL configuré)
if curl -f -k https://localhost/ &> /dev/null; then
    log_success "✅ HTTPS OK"
else
    log_warning "⚠️  HTTPS non configuré ou en cours"
fi

echo ""

# ================================
# Informations finales
# ================================

log_success "🎉 DÉPLOIEMENT CLAUDYNE TERMINÉ !"
echo ""
log_info "📋 INFORMATIONS IMPORTANTES :"
echo ""
log_info "🌐 Site web : https://$DOMAIN"
log_info "🔧 API Backend : https://$DOMAIN/api"
log_info "🩺 Health Check : https://$DOMAIN/health"
echo ""
log_info "👨‍💼 Interface Admin : https://$DOMAIN/admin-interface.html"
log_info "👨‍👩‍👧‍👦 Interface Parent : https://$DOMAIN/parent-interface/"
log_info "👨‍🏫 Interface Enseignant : https://$DOMAIN/teacher-interface.html"
echo ""
log_info "📊 Commandes utiles :"
echo "  docker-compose -f $COMPOSE_FILE logs -f      # Voir les logs"
echo "  docker-compose -f $COMPOSE_FILE ps           # État des services"
echo "  docker-compose -f $COMPOSE_FILE restart      # Redémarrer"
echo "  ./renew-ssl.sh                               # Renouveler SSL"
echo ""
log_warning "⚠️  N'oubliez pas de :"
echo "  1. Configurer vos clés MAVIANCE dans $ENV_FILE"
echo "  2. Modifier les mots de passe par défaut"
echo "  3. Configurer les sauvegardes automatiques"
echo "  4. Surveiller les logs de performance"
echo ""
log_success "💚 'La force du savoir en héritage' - Claudine"
echo ""

# Afficher les logs en temps réel
log_info "📜 Affichage des logs (Ctrl+C pour quitter) :"
docker-compose -f $COMPOSE_FILE logs -f