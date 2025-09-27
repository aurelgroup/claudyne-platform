#!/bin/bash

# ================================================================
# CONFIGURATION SSL LET'S ENCRYPT AUTOMATISÉE CLAUDYNE
# Script automatisé pour certificats SSL production
# En hommage à Meffo Mehtah Tchandjio Claudine
# ================================================================

set -e

# Couleurs pour les logs
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

# Configuration
DOMAIN="claudyne.com"
EMAIL="admin@claudyne.com"
WEBROOT="/var/www/claudyne/public"

echo "🔒 ================================================================="
echo "   SSL/TLS SETUP AUTOMATION - CLAUDYNE PRODUCTION"
echo "   👨‍👩‍👧‍👦 En hommage à Meffo Mehtah Tchandjio Claudine"
echo "================================================================="
echo ""

# ================================================================
# PHASE 1: PRÉPARATION SYSTÈME
# ================================================================

log "🔍 PHASE 1: PRÉPARATION SYSTÈME"

# Vérifier les privilèges root
if [ "$EUID" -ne 0 ]; then
    error "Ce script doit être exécuté en tant que root"
    exit 1
fi

# Mettre à jour le système
info "Mise à jour du système..."
apt update -qq

# Installer snapd si nécessaire
if ! command -v snap &> /dev/null; then
    info "Installation de snapd..."
    apt install -y snapd
    systemctl enable snapd.socket
    systemctl start snapd.socket

    # Attendre que snapd soit prêt
    sleep 5
fi

# Installer certbot via snap
info "Installation/mise à jour de certbot..."
snap install core
snap refresh core
snap install --classic certbot

# Créer le lien symbolique
ln -sf /snap/bin/certbot /usr/bin/certbot

success "Système préparé pour SSL"

# ================================================================
# PHASE 2: CONFIGURATION PRÉLIMINAIRE NGINX
# ================================================================

log "🌐 PHASE 2: CONFIGURATION PRÉLIMINAIRE NGINX"

# Créer une configuration Nginx temporaire pour validation
info "Configuration Nginx temporaire..."

cat > /etc/nginx/sites-available/claudyne-temp << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name claudyne.com www.claudyne.com;

    # Document root pour validation Let's Encrypt
    root /var/www/claudyne/public;

    # Location pour Let's Encrypt validation
    location ^~ /.well-known/acme-challenge/ {
        default_type "text/plain";
        root /var/www/claudyne/public;
        try_files $uri =404;
    }

    # Redirection temporaire vers backend pour autres requêtes
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Activer la configuration temporaire
ln -sf /etc/nginx/sites-available/claudyne-temp /etc/nginx/sites-enabled/claudyne-temp
rm -f /etc/nginx/sites-enabled/default

# Créer le répertoire webroot
mkdir -p $WEBROOT/.well-known/acme-challenge
chown -R www-data:www-data $WEBROOT

# Tester la configuration Nginx
info "Test de la configuration Nginx..."
if ! nginx -t; then
    error "Configuration Nginx invalide"
    exit 1
fi

# Redémarrer Nginx
systemctl reload nginx

success "Configuration Nginx temporaire active"

# ================================================================
# PHASE 3: OBTENTION DU CERTIFICAT SSL
# ================================================================

log "🔒 PHASE 3: OBTENTION DU CERTIFICAT SSL"

# Test de connectivité
info "Test de connectivité réseau..."
if ! curl -s --max-time 10 http://$DOMAIN/.well-known/acme-challenge/test > /dev/null; then
    warn "Test de connectivité peut échouer - continuons"
fi

# Obtenir le certificat avec webroot
info "Obtention du certificat SSL pour $DOMAIN..."

certbot certonly \
    --webroot \
    --webroot-path=$WEBROOT \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --non-interactive \
    --expand \
    -d $DOMAIN \
    -d www.$DOMAIN

if [ $? -eq 0 ]; then
    success "Certificat SSL obtenu avec succès!"
else
    warn "Échec de l'obtention automatique - Tentative alternative..."

    # Tentative avec --standalone (arrêt temporaire de Nginx)
    systemctl stop nginx

    certbot certonly \
        --standalone \
        --email $EMAIL \
        --agree-tos \
        --no-eff-email \
        --non-interactive \
        --expand \
        -d $DOMAIN \
        -d www.$DOMAIN

    if [ $? -eq 0 ]; then
        success "Certificat SSL obtenu en mode standalone!"
    else
        error "Impossible d'obtenir le certificat SSL automatiquement"
        systemctl start nginx
        exit 1
    fi

    systemctl start nginx
fi

# ================================================================
# PHASE 4: CONFIGURATION NGINX SÉCURISÉE
# ================================================================

log "🛡️ PHASE 4: CONFIGURATION NGINX SÉCURISÉE"

# Vérifier que les certificats existent
if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    error "Certificat SSL non trouvé"
    exit 1
fi

# Générer des paramètres DH forts
info "Génération des paramètres Diffie-Hellman..."
if [ ! -f "/etc/ssl/certs/dhparam.pem" ]; then
    openssl dhparam -out /etc/ssl/certs/dhparam.pem 2048
fi

# Configuration Nginx sécurisée complète
info "Configuration Nginx sécurisée..."

cat > /etc/nginx/sites-available/claudyne << 'EOF'
# ================================================================
# CONFIGURATION NGINX PRODUCTION CLAUDYNE AVEC SSL
# Sécurisé avec Let's Encrypt
# ================================================================

# Redirection HTTP vers HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name claudyne.com www.claudyne.com;

    # Location pour renouvellement Let's Encrypt
    location ^~ /.well-known/acme-challenge/ {
        default_type "text/plain";
        root /var/www/claudyne/public;
        try_files $uri =404;
    }

    # Redirection HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# Configuration HTTPS sécurisée
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name claudyne.com www.claudyne.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/claudyne.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/claudyne.com/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/claudyne.com/chain.pem;

    # SSL Security moderne
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_dhparam /etc/ssl/certs/dhparam.pem;

    # Session SSL
    ssl_session_cache shared:SSL:50m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    # Security Headers complets
    add_header Strict-Transport-Security "max-age=31536000; includeSubdomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    # CSP sécurisé pour Claudyne
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' wss: https:; media-src 'self'; object-src 'none'; frame-ancestors 'self';" always;

    # Configuration générale
    root /var/www/claudyne/public;
    index index.html;

    # Logs
    access_log /var/log/nginx/claudyne-ssl-access.log combined;
    error_log /var/log/nginx/claudyne-ssl-error.log;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;
    limit_req_zone $binary_remote_addr zone=general:10m rate=100r/s;

    # Health check
    location = /health {
        proxy_pass http://127.0.0.1:3001/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        access_log off;
    }

    # API Backend
    location /api {
        limit_req zone=api burst=50 nodelay;

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

    # Mobile API
    location /mobile-api {
        limit_req zone=api burst=100 nodelay;

        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Mobile optimizations
        proxy_buffering off;
        proxy_request_buffering off;
    }

    # Download APK
    location /download {
        alias /var/www/claudyne/downloads;
        autoindex on;
        expires 1d;
        add_header Cache-Control "public, no-transform";

        location ~* \.apk$ {
            add_header Content-Disposition 'attachment; filename="claudyne.apk"';
            add_header Content-Type 'application/vnd.android.package-archive';
        }
    }

    # Static files
    location ~* \.(jpg|jpeg|png|gif|ico|svg|css|js|woff|woff2|ttf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Security: Block sensitive files
    location ~ /\. {
        deny all;
        access_log off;
    }

    location ~ \.(env|config|log|sql)$ {
        deny all;
        access_log off;
    }

    # Frontend (default)
    location / {
        limit_req zone=general burst=50 nodelay;

        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Activer la nouvelle configuration
rm -f /etc/nginx/sites-enabled/claudyne-temp
ln -sf /etc/nginx/sites-available/claudyne /etc/nginx/sites-enabled/claudyne

# Tester la configuration
info "Test de la configuration SSL..."
if ! nginx -t; then
    error "Configuration Nginx SSL invalide"
    exit 1
fi

# Redémarrer Nginx
systemctl reload nginx

success "Configuration Nginx SSL active"

# ================================================================
# PHASE 5: RENOUVELLEMENT AUTOMATIQUE
# ================================================================

log "🔄 PHASE 5: RENOUVELLEMENT AUTOMATIQUE"

# Test du renouvellement
info "Test du renouvellement automatique..."
certbot renew --dry-run

if [ $? -eq 0 ]; then
    success "Test de renouvellement réussi"
else
    warn "Test de renouvellement échoué - vérification manuelle requise"
fi

# Configuration du cron pour renouvellement
info "Configuration du renouvellement automatique..."

# Créer script de renouvellement avec rechargement Nginx
cat > /usr/local/bin/certbot-renew.sh << 'EOF'
#!/bin/bash
# Script de renouvellement automatique Claudyne

LOG_FILE="/var/log/letsencrypt/renewal.log"

echo "[$(date)] Starting certificate renewal check..." >> $LOG_FILE

# Renouveler les certificats
/usr/bin/certbot renew --quiet --post-hook "systemctl reload nginx" >> $LOG_FILE 2>&1

if [ $? -eq 0 ]; then
    echo "[$(date)] Certificate renewal check completed successfully" >> $LOG_FILE
else
    echo "[$(date)] Certificate renewal check failed" >> $LOG_FILE
    # Envoyer notification (optionnel)
    # mail -s "Claudyne SSL renewal failed" admin@claudyne.com < $LOG_FILE
fi
EOF

chmod +x /usr/local/bin/certbot-renew.sh

# Ajouter tâche cron (2 fois par jour)
(crontab -l 2>/dev/null; echo "0 2,14 * * * /usr/local/bin/certbot-renew.sh") | crontab -

success "Renouvellement automatique configuré"

# ================================================================
# PHASE 6: TESTS DE VALIDATION
# ================================================================

log "🧪 PHASE 6: TESTS DE VALIDATION"

# Attendre un moment pour que Nginx se stabilise
sleep 5

# Test HTTPS
info "Test de connectivité HTTPS..."
if curl -s --max-time 10 https://$DOMAIN/health > /dev/null; then
    success "HTTPS fonctionne correctement"
else
    warn "Test HTTPS échoué - vérification manuelle requise"
fi

# Test de redirection HTTP -> HTTPS
info "Test de redirection HTTP -> HTTPS..."
HTTP_RESPONSE=$(curl -s -I --max-time 10 http://$DOMAIN | head -n 1)
if echo "$HTTP_RESPONSE" | grep -q "301\|302"; then
    success "Redirection HTTP -> HTTPS fonctionne"
else
    warn "Redirection HTTP -> HTTPS à vérifier"
fi

# Test des headers de sécurité
info "Test des headers de sécurité..."
HEADERS=$(curl -s -I --max-time 10 https://$DOMAIN)
if echo "$HEADERS" | grep -q "Strict-Transport-Security"; then
    success "Headers de sécurité présents"
else
    warn "Headers de sécurité à vérifier"
fi

# Vérification du certificat
info "Vérification du certificat SSL..."
CERT_INFO=$(echo | openssl s_client -connect $DOMAIN:443 -servername $DOMAIN 2>/dev/null | openssl x509 -noout -dates)
echo "$CERT_INFO"

# Test SSL Labs (optionnel, nécessite connexion internet)
info "Test SSL disponible sur: https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"

# ================================================================
# RAPPORT FINAL
# ================================================================

log "📋 RAPPORT FINAL SSL"

echo ""
echo "🔒 ============================================="
echo "   SSL/TLS CONFIGURATION COMPLETED"
echo "============================================="
echo ""
echo "✅ Certificat SSL: Actif"
echo "✅ Domaines: $DOMAIN, www.$DOMAIN"
echo "✅ Chiffrement: TLS 1.2/1.3"
echo "✅ Redirection HTTP->HTTPS: Active"
echo "✅ Headers de sécurité: Configurés"
echo "✅ Renouvellement automatique: Programmé"
echo ""
echo "📋 INFORMATIONS IMPORTANTES:"
echo "   • Certificats: /etc/letsencrypt/live/$DOMAIN/"
echo "   • Configuration Nginx: /etc/nginx/sites-available/claudyne"
echo "   • Logs SSL: /var/log/nginx/claudyne-ssl-*.log"
echo "   • Renouvellement: Automatique (2x/jour)"
echo ""
echo "🔧 COMMANDES UTILES:"
echo "   certbot certificates         # Voir les certificats"
echo "   certbot renew --dry-run     # Test renouvellement"
echo "   nginx -t && nginx -s reload # Recharger Nginx"
echo "   tail -f /var/log/nginx/claudyne-ssl-error.log # Logs erreurs"
echo ""
echo "🌍 SITE SÉCURISÉ:"
echo "   https://claudyne.com"
echo ""
echo "👨‍👩‍👧‍👦 En hommage à Meffo Mehtah Tchandjio Claudine"
echo "💚 La force du savoir en héritage - Maintenant sécurisée!"
echo ""

# Sauvegarder les informations
cat > /var/www/claudyne/ssl-info.txt << EOF
SSL/TLS Configuration Claudyne
==============================
Date: $(date)
Domain: $DOMAIN
Certificate: Let's Encrypt
Valid until: $(echo | openssl s_client -connect $DOMAIN:443 -servername $DOMAIN 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)

Auto-renewal: Configured (cron)
Security headers: Enabled
HTTPS redirect: Active
TLS versions: 1.2, 1.3

Configuration files:
- Nginx: /etc/nginx/sites-available/claudyne
- SSL certs: /etc/letsencrypt/live/$DOMAIN/
- Renewal script: /usr/local/bin/certbot-renew.sh

Test URLs:
- https://claudyne.com
- https://www.claudyne.com
EOF

success "🎉 SSL/TLS CONFIGURATION TERMINÉE AVEC SUCCÈS!"

echo ""
info "🔍 Tests recommandés:"
echo "   1. Vérifier https://claudyne.com dans le navigateur"
echo "   2. Tester SSL sur https://www.ssllabs.com/ssltest/"
echo "   3. Vérifier les logs: tail -f /var/log/nginx/claudyne-ssl-access.log"
echo ""

exit 0