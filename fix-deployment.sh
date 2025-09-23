#!/bin/bash

# =================================================
# CORRECTION DÉPLOIEMENT CLAUDYNE - Contabo VPS
# Résolution des problèmes PM2 et Git
# =================================================

echo "🔧 Correction déploiement Claudyne"

VPS_IP="89.117.58.53"
VPS_USER="root"

ssh $VPS_USER@$VPS_IP << 'EOF'
    echo "🔧 Correction des problèmes détectés..."

    cd /var/www/claudyne

    # 1. MISE À JOUR GIT FORCÉE
    echo "📥 Mise à jour forcée du code..."
    git fetch origin
    git reset --hard origin/main
    git clean -fd

    # 2. DÉMARRAGE PM2 AVEC SYNTAXE CORRECTE
    echo "🚀 Démarrage services avec PM2..."

    # Arrêter tout processus existant
    pm2 delete all 2>/dev/null || true

    # Démarrer frontend (syntaxe PM2 v5+)
    pm2 start server.js --name "claudyne-frontend" -i 2 --env production --log /var/log/claudyne/frontend.log

    # Démarrer backend
    pm2 start backend/src/server.js --name "claudyne-backend" -i 2 --env production --log /var/log/claudyne/backend.log

    # Sauvegarder la configuration
    pm2 save

    # 3. VÉRIFICATION NGINX ET CONFIGURATION MINIMALE
    echo "🌐 Configuration Nginx basique..."

    if [ ! -f /etc/nginx/sites-available/claudyne ]; then
        echo "📝 Création configuration Nginx..."
        cat > /etc/nginx/sites-available/claudyne << 'NGINXEOF'
server {
    listen 80;
    server_name claudyne.com www.claudyne.com;

    # API Backend
    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # Frontend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINXEOF

        # Activer le site
        ln -sf /etc/nginx/sites-available/claudyne /etc/nginx/sites-enabled/
        rm -f /etc/nginx/sites-enabled/default

        # Test et rechargement
        nginx -t && systemctl reload nginx
    fi

    # 4. STATUT FINAL
    echo ""
    echo "✅ CORRECTION TERMINÉE !"
    echo "========================"
    echo "📊 Services PM2:"
    pm2 status
    echo ""
    echo "🌐 Nginx status:"
    systemctl status nginx --no-pager -l
    echo ""
    echo "🔗 Test des ports:"
    netstat -tulpn | grep -E ":(3000|3001|80)"

EOF

echo "✅ Correction terminée !"