#!/bin/bash

echo "💾 ================================================"
echo "   SAUVEGARDE CLAUDYNE - CONTABO VPS"
echo "💾 ================================================"
echo "En hommage à Meffo Mehtah Tchandjio Claudine 👨‍👩‍👧‍👦"
echo ""

# Configuration
BACKUP_DIR="/var/backups/claudyne"
APP_DIR="/var/www/claudyne/claudyne-platform"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

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
}

# Vérifier si on est root pour les permissions
if [ "$EUID" -ne 0 ]; then
    error "Ce script doit être exécuté en tant que root (sudo)"
    exit 1
fi

log "📁 Création du répertoire de sauvegarde..."
mkdir -p $BACKUP_DIR

log "🗄️ Sauvegarde de la base de données PostgreSQL..."
sudo -u postgres pg_dump claudyne_prod > $BACKUP_DIR/db_$DATE.sql
if [ $? -eq 0 ]; then
    log "✅ Base de données sauvegardée: db_$DATE.sql"
else
    error "❌ Erreur lors de la sauvegarde de la base de données"
fi

log "📦 Sauvegarde des fichiers de l'application..."
tar -czf $BACKUP_DIR/app_$DATE.tar.gz -C /var/www/claudyne claudyne-platform --exclude=node_modules --exclude=backend/node_modules --exclude=logs
if [ $? -eq 0 ]; then
    log "✅ Application sauvegardée: app_$DATE.tar.gz"
else
    error "❌ Erreur lors de la sauvegarde de l'application"
fi

log "📋 Sauvegarde de la configuration Nginx..."
tar -czf $BACKUP_DIR/nginx_$DATE.tar.gz /etc/nginx/sites-available /etc/nginx/sites-enabled 2>/dev/null
if [ $? -eq 0 ]; then
    log "✅ Configuration Nginx sauvegardée: nginx_$DATE.tar.gz"
else
    error "❌ Erreur lors de la sauvegarde Nginx"
fi

log "🔒 Sauvegarde des certificats SSL..."
if [ -d "/etc/letsencrypt" ]; then
    tar -czf $BACKUP_DIR/ssl_$DATE.tar.gz /etc/letsencrypt 2>/dev/null
    log "✅ Certificats SSL sauvegardés: ssl_$DATE.tar.gz"
else
    log "⚠️ Pas de certificats SSL trouvés"
fi

log "⚙️ Sauvegarde de la configuration PM2..."
sudo -u claudyne pm2 save
cp /home/claudyne/.pm2/dump.pm2 $BACKUP_DIR/pm2_$DATE.json 2>/dev/null
if [ $? -eq 0 ]; then
    log "✅ Configuration PM2 sauvegardée: pm2_$DATE.json"
fi

log "🧹 Nettoyage des anciennes sauvegardes (>${RETENTION_DAYS} jours)..."
find $BACKUP_DIR -name "*.sql" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "*.json" -mtime +$RETENTION_DAYS -delete

log "📊 Résumé des sauvegardes:"
ls -lah $BACKUP_DIR | grep $DATE

log "💾 Sauvegarde terminée avec succès!"
log "📍 Emplacement: $BACKUP_DIR"

# Optionnel: Envoyer un rapport par email (à configurer)
# echo "Sauvegarde Claudyne du $(date)" | mail -s "Backup Claudyne" admin@claudyne.com