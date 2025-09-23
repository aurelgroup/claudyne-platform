#!/bin/bash

# =================================================
# DÉPLOIEMENT INTELLIGENT CLAUDYNE → CONTABO VPS
# Évite les doublons et gère les services existants
# En hommage à Meffo Mehtah Tchandjio Claudine
# =================================================

echo "🚀 Déploiement Intelligent Claudyne vers Contabo VPS"
echo "👨‍👩‍👧‍👦 En hommage à Meffo Mehtah Tchandjio Claudine"
echo ""

# Configuration VPS
VPS_IP="89.117.58.53"
VPS_USER="root"
VPS_PATH="/var/www/claudyne"

echo "📡 Connexion au VPS Contabo..."

# Script optimisé pour éviter les doublons
ssh $VPS_USER@$VPS_IP << 'EOF'
    echo "🔍 Vérification état actuel du serveur..."

    # 1. VÉRIFICATION SERVICES EXISTANTS
    echo "📊 Services PM2 actuels:"
    pm2 list 2>/dev/null || echo "PM2 non configuré"

    # 2. ARRÊT INTELLIGENT DES SERVICES (sans erreur si inexistants)
    echo "⏹️ Arrêt sécurisé des services..."
    pm2 stop claudyne-frontend 2>/dev/null && echo "✅ Frontend arrêté" || echo "ℹ️ Frontend non actif"
    pm2 stop claudyne-backend 2>/dev/null && echo "✅ Backend arrêté" || echo "ℹ️ Backend non actif"
    pm2 delete claudyne-frontend 2>/dev/null || true
    pm2 delete claudyne-backend 2>/dev/null || true

    # 3. GESTION INTELLIGENTE DU CODE
    if [ -d "$VPS_PATH" ]; then
        echo "📁 Répertoire existant détecté - Mise à jour..."
        cd $VPS_PATH

        # Vérifier si c'est un repo git
        if [ -d ".git" ]; then
            echo "🔄 Pull des modifications GitHub..."
            git fetch origin
            git reset --hard origin/main
        else
            echo "⚠️ Pas de repo Git - Reclonage..."
            cd /var/www
            rm -rf claudyne
            git clone https://github.com/aurelgroup/claudyne-platform.git claudyne
            cd claudyne
        fi
    else
        echo "📁 Première installation - Clonage..."
        cd /var/www
        git clone https://github.com/aurelgroup/claudyne-platform.git claudyne
        cd claudyne
    fi

    echo "✅ Code source à jour"

    # 4. INSTALLATION DÉPENDANCES (si nécessaire)
    echo "📦 Vérification dépendances..."

    if [ ! -d "node_modules" ]; then
        echo "📥 Installation dépendances frontend..."
        npm install --production
    else
        echo "✅ Dépendances frontend OK"
    fi

    if [ ! -d "backend/node_modules" ]; then
        echo "📥 Installation dépendances backend..."
        cd backend
        npm install --production
        cd ..
    else
        echo "✅ Dépendances backend OK"
    fi

    # 5. CONFIGURATION ENVIRONNEMENT BACKEND
    if [ ! -f "backend/.env" ]; then
        echo "🔧 Création configuration backend production..."
        cat > backend/.env << 'ENVEOF'
NODE_ENV=production
PORT=3001

# Database Configuration
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=claudyne_prod
DB_USER=claudyne_user
DB_PASSWORD=claudyne_secure_prod_2024

# JWT Configuration
JWT_SECRET=claudyne_jwt_meffo_tchandjio_production_2024
JWT_EXPIRES_IN=7d

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@claudyne.com
SMTP_PASS=change_in_production

# URLs
FRONTEND_URL=https://claudyne.com
BACKEND_URL=https://claudyne.com/api
CORS_ORIGIN=https://claudyne.com,https://www.claudyne.com

# Features
FEATURES_EMAIL_AUTOMATION=true
FEATURES_BATTLE_ROYALE=true
FEATURES_PRIX_CLAUDINE=true
ENVEOF
    else
        echo "✅ Configuration backend existante conservée"
    fi

    # 6. GESTION LOGS
    mkdir -p /var/log/claudyne

    # 7. DÉMARRAGE SERVICES AVEC PM2
    echo "🚀 Démarrage des services PM2..."

    # Démarrer frontend
    pm2 start server.js --name "claudyne-frontend" --instances 2 --exec-mode cluster --env production

    # Démarrer backend
    pm2 start backend/src/server.js --name "claudyne-backend" --instances 2 --exec-mode cluster --env production

    # Sauvegarder la configuration PM2
    pm2 save

    # Assurer le démarrage automatique
    pm2 startup 2>/dev/null || true

    # 8. VÉRIFICATION NGINX (SANS DOUBLE EMPLOI)
    if [ -f /etc/nginx/sites-available/claudyne ]; then
        echo "🌐 Configuration Nginx existante détectée"

        # Vérifier si le proxy backend est configuré
        if grep -q "proxy_pass.*3001" /etc/nginx/sites-available/claudyne; then
            echo "✅ Proxy backend déjà configuré"
        else
            echo "🔧 Ajout du proxy backend à Nginx..."
            # Backup
            cp /etc/nginx/sites-available/claudyne /etc/nginx/sites-available/claudyne.backup.$(date +%Y%m%d_%H%M%S)

            # Ajouter la configuration API avant la config principale
            sed -i '/location \/ {/i\
    # API Backend\
    location /api {\
        proxy_pass http://127.0.0.1:3001;\
        proxy_http_version 1.1;\
        proxy_set_header Upgrade $http_upgrade;\
        proxy_set_header Connection '\''upgrade'\'';\
        proxy_set_header Host $host;\
        proxy_set_header X-Real-IP $remote_addr;\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\
        proxy_set_header X-Forwarded-Proto $scheme;\
        proxy_cache_bypass $http_upgrade;\
    }\
\
    # WebSocket pour Battle Royale\
    location /socket.io/ {\
        proxy_pass http://127.0.0.1:3001;\
        proxy_http_version 1.1;\
        proxy_set_header Upgrade $http_upgrade;\
        proxy_set_header Connection "upgrade";\
        proxy_set_header Host $host;\
        proxy_set_header X-Real-IP $remote_addr;\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\
        proxy_set_header X-Forwarded-Proto $scheme;\
    }\
' /etc/nginx/sites-available/claudyne

            echo "🔄 Test et rechargement Nginx..."
            nginx -t && systemctl reload nginx
        fi
    else
        echo "⚠️ Configuration Nginx non trouvée - À configurer manuellement"
    fi

    # 9. STATUT FINAL
    echo ""
    echo "🎉 DÉPLOIEMENT TERMINÉ !"
    echo "================================"
    echo "📊 Statut des services:"
    pm2 status
    echo ""
    echo "🌐 URLs disponibles:"
    echo "   Frontend: https://claudyne.com (Port 3000)"
    echo "   Backend API: https://claudyne.com/api (Port 3001)"
    echo "   WebSocket: https://claudyne.com/socket.io"
    echo ""
    echo "📝 Logs en temps réel:"
    echo "   pm2 logs claudyne-frontend"
    echo "   pm2 logs claudyne-backend"
    echo ""

EOF

echo ""
echo "✅ DÉPLOIEMENT INTELLIGENT TERMINÉ !"
echo "👨‍👩‍👧‍👦 En hommage à Meffo Mehtah Tchandjio Claudine"
echo "💚 \"La force du savoir en héritage\""