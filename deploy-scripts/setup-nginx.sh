#!/bin/bash

echo "🌐 ================================================"
echo "   CONFIGURATION NGINX + SSL - CLAUDYNE"
echo "🌐 ================================================"
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

# Vérifier si on est root
if [ "$EUID" -ne 0 ]; then
    error "Ce script doit être exécuté en tant que root (sudo)"
fi

# Variables - À MODIFIER selon vos besoins
DOMAIN="claudyne.com"
EMAIL="votre-email@domain.com"  # IMPORTANT: Changez ceci pour Let's Encrypt

log "🔧 Configuration Nginx pour $DOMAIN..."

# Créer la configuration Nginx
cat > /etc/nginx/sites-available/$DOMAIN << EOF
# Configuration temporaire HTTP (avant SSL)
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Racine du projet
    root /var/www/claudyne/claudyne-platform;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # Headers de sécurité basiques
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    
    # Service Worker
    location /sw.js {
        add_header Cache-Control "public, max-age=0, must-revalidate";
        add_header Service-Worker-Allowed "/";
    }
    
    # Assets statiques avec cache
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # Proxy vers l'API backend (port 3001)
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
    
    # Routes spécifiques
    location /admin {
        try_files \$uri /admin-interface.html;
    }
    
    location /student {
        try_files \$uri /student-interface-modern.html;
    }
    
    location /offline {
        try_files \$uri /offline.html;
    }
    
    # Interface principale
    location / {
        try_files \$uri \$uri/ @nodejs;
    }
    
    # Fallback vers Node.js (frontend)
    location @nodejs {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
    
    # Logs spécifiques
    access_log /var/log/nginx/$DOMAIN.access.log;
    error_log /var/log/nginx/$DOMAIN.error.log;
}
EOF

log "🔗 Activation du site..."
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

log "✅ Test de la configuration Nginx..."
nginx -t
if [ $? -ne 0 ]; then
    error "Erreur dans la configuration Nginx!"
fi

log "🔄 Rechargement de Nginx..."
systemctl reload nginx

log "🔒 Configuration SSL avec Let's Encrypt..."
echo "IMPORTANT: Assurez-vous que:"
echo "  1. Votre domaine $DOMAIN pointe vers cette IP"
echo "  2. Vous avez changé l'email dans le script"
echo ""
read -p "Appuyez sur Entrée pour continuer avec le SSL ou Ctrl+C pour annuler..."

certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email $EMAIL

if [ $? -eq 0 ]; then
    log "✅ SSL configuré avec succès!"
else
    error "Erreur lors de la configuration SSL. Vérifiez:"
    echo "  - Que le domaine pointe vers cette IP"
    echo "  - Que les ports 80 et 443 sont ouverts"
    echo "  - Que l'email est valide"
fi

log "⏰ Configuration du renouvellement automatique SSL..."
(crontab -l 2>/dev/null; echo "0 2 1 * * /usr/bin/certbot renew --quiet && systemctl reload nginx") | crontab -

log "🎯 Test final des services..."
systemctl status nginx --no-pager
systemctl status postgresql --no-pager
systemctl status redis-server --no-pager

log "✅ Configuration Nginx + SSL terminée!"
echo ""
log "🌐 Votre site devrait être accessible sur:"
echo "   https://$DOMAIN"
echo "   https://www.$DOMAIN"
echo ""
log "🔍 Pour tester:"
echo "   curl https://$DOMAIN"
echo "   curl https://$DOMAIN/admin"
echo "   curl https://$DOMAIN/api/health"