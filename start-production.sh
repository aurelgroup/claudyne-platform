#!/bin/bash
# ================================
# CLAUDYNE PRODUCTION STARTUP
# Démarrage complet du système
# ================================

echo "🚀 === DÉMARRAGE CLAUDYNE PRODUCTION ==="

# Variables
BACKEND_DIR="/var/www/claudyne/backend"
LOG_DIR="/var/www/claudyne/logs"

# Créer répertoires de logs
mkdir -p "$LOG_DIR"

# 1. Vérifier PostgreSQL
echo "🗄️ Vérification PostgreSQL..."
if sudo systemctl is-active --quiet postgresql; then
    echo "✅ PostgreSQL actif"
else
    echo "🔄 Démarrage PostgreSQL..."
    sudo systemctl start postgresql
fi

# 2. Vérifier base de données
echo "🔍 Vérification base claudyne_production..."
if sudo -u postgres psql -d claudyne_production -c "\q" 2>/dev/null; then
    echo "✅ Base de données accessible"
else
    echo "🔧 Configuration base de données..."
    sudo -u postgres psql -f setup-production-database.sql
fi

# 3. Démarrer synchronisation
echo "🔄 Démarrage service de synchronisation..."
sudo systemctl start claudyne-sync.service
sudo systemctl enable claudyne-sync.service

# 4. Démarrer applications PM2
echo "📱 Démarrage applications..."
cd /var/www/claudyne
pm2 start ecosystem.config.js
pm2 save

# 5. Démarrer Nginx
echo "🌐 Démarrage Nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx

# 6. Vérification santé
echo "🩺 Vérification santé système..."
sleep 5

# Test endpoints
echo "📡 Test API..."
curl -s http://localhost:3001/api/health | jq '.'

echo "📊 Test frontend..."
curl -s http://localhost:3000 -I | head -1

echo "🔗 Test domaine..."
curl -s https://claudyne.com/api/ping -I | head -1

# 7. Status final
echo ""
echo "📋 === STATUS FINAL ==="
echo "PM2:"
pm2 status

echo ""
echo "Services:"
sudo systemctl status claudyne-sync.service --no-pager -l
sudo systemctl status nginx --no-pager -l

echo ""
echo "✅ === CLAUDYNE PRODUCTION READY ==="
echo "🌐 Web: https://claudyne.com"
echo "📡 API: https://claudyne.com/api"
echo "📱 Mobile: https://claudyne.com/mobile-api"
echo "📄 APK: https://claudyne.com/download/claudyne.apk"
echo ""
echo "🏆 En hommage à Meffo Mehtah Tchandjio Claudine"