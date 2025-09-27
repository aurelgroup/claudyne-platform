#!/bin/bash

echo "🔄 ================================================"
echo "   MIGRATION CLAUDYNE - SAUVEGARDE + DÉPLOIEMENT FRAIS"
echo "🔄 ================================================"
echo "En hommage à Meffo Mehtah Tchandjio Claudine 👨‍👩‍👧‍👦"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Vérifier si on est root
if [ "$EUID" -ne 0 ]; then
    error "Ce script doit être exécuté en tant que root (sudo)"
fi

BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/claudyne-migration-$BACKUP_DATE"

echo ""
warning "⚠️  ATTENTION: Cette opération va:"
echo "   1. Sauvegarder complètement l'installation actuelle"
echo "   2. Arrêter tous les services Claudyne"
echo "   3. Supprimer l'ancien répertoire /var/www/claudyne"
echo "   4. Faire un déploiement complètement frais"
echo ""
read -p "Êtes-vous sûr de vouloir continuer? (tapez 'OUI' en majuscules): " confirm

if [ "$confirm" != "OUI" ]; then
    echo "Opération annulée."
    exit 0
fi

log "🚀 Début de la migration avec sauvegarde complète..."

# ================================================================
# PHASE 1: SAUVEGARDE COMPLÈTE
# ================================================================

log "💾 PHASE 1: Sauvegarde complète de l'existant..."

mkdir -p $BACKUP_DIR
log "📁 Répertoire de sauvegarde: $BACKUP_DIR"

# Arrêter PM2 si il existe
log "⏹️ Arrêt des services PM2 existants..."
if command -v pm2 >/dev/null 2>&1; then
    sudo -u claudyne pm2 stop all 2>/dev/null || true
    sudo -u claudyne pm2 save 2>/dev/null || true
fi

# Arrêter tous les processus Node.js
log "🔄 Arrêt de tous les processus Node.js..."
pkill -f node || true
sleep 2

# Sauvegarde de la base de données PostgreSQL
if systemctl is-active --quiet postgresql; then
    log "🗄️ Sauvegarde de la base de données PostgreSQL..."
    sudo -u postgres pg_dumpall > $BACKUP_DIR/postgresql-full-backup.sql
    sudo -u postgres pg_dump claudyne_production > $BACKUP_DIR/claudyne_production-backup.sql 2>/dev/null || true
    log "✅ Base de données sauvegardée"
else
    warning "PostgreSQL n'est pas actif, pas de sauvegarde DB"
fi

# Sauvegarde du répertoire /var/www/claudyne
if [ -d "/var/www/claudyne" ]; then
    log "📦 Sauvegarde du répertoire application..."
    tar -czf $BACKUP_DIR/claudyne-app-backup.tar.gz -C /var/www claudyne
    log "✅ Application sauvegardée"
else
    info "Aucun répertoire /var/www/claudyne trouvé"
fi

# Sauvegarde configuration Nginx
if [ -d "/etc/nginx" ]; then
    log "🌐 Sauvegarde configuration Nginx..."
    tar -czf $BACKUP_DIR/nginx-config-backup.tar.gz /etc/nginx/sites-available /etc/nginx/sites-enabled /etc/nginx/nginx.conf 2>/dev/null
    log "✅ Configuration Nginx sauvegardée"
fi

# Sauvegarde certificats SSL
if [ -d "/etc/letsencrypt" ]; then
    log "🔒 Sauvegarde certificats SSL..."
    tar -czf $BACKUP_DIR/ssl-certificates-backup.tar.gz /etc/letsencrypt 2>/dev/null
    log "✅ Certificats SSL sauvegardés"
fi

# Sauvegarde logs système
log "📝 Sauvegarde des logs importants..."
mkdir -p $BACKUP_DIR/logs
cp /var/log/nginx/*.log $BACKUP_DIR/logs/ 2>/dev/null || true
cp -r /var/log/claudyne* $BACKUP_DIR/logs/ 2>/dev/null || true

# Créer un rapport de sauvegarde
log "📋 Création du rapport de sauvegarde..."
cat > $BACKUP_DIR/RAPPORT_SAUVEGARDE.md << EOF
# Rapport de Sauvegarde Claudyne
**Date**: $(date)
**Utilisateur**: $(whoami)

## Contenu sauvegardé:
- ✅ Base de données PostgreSQL (complète + claudyne_production)
- ✅ Application /var/www/claudyne
- ✅ Configuration Nginx
- ✅ Certificats SSL Let's Encrypt
- ✅ Logs système

## Localisation:
\`$BACKUP_DIR/\`

## Restauration d'urgence:
\`\`\`bash
# Restaurer la base de données
sudo -u postgres psql < $BACKUP_DIR/postgresql-full-backup.sql

# Restaurer l'application
cd /var/www && tar -xzf $BACKUP_DIR/claudyne-app-backup.tar.gz

# Restaurer Nginx
tar -xzf $BACKUP_DIR/nginx-config-backup.tar.gz -C /

# Restaurer SSL
tar -xzf $BACKUP_DIR/ssl-certificates-backup.tar.gz -C /
\`\`\`
EOF

log "✅ PHASE 1 TERMINÉE: Sauvegarde complète créée dans $BACKUP_DIR"

# ================================================================
# PHASE 2: NETTOYAGE COMPLET
# ================================================================

log "🧹 PHASE 2: Nettoyage de l'installation existante..."

# Arrêter et supprimer les services PM2
if command -v pm2 >/dev/null 2>&1; then
    log "🔄 Nettoyage PM2..."
    sudo -u claudyne pm2 stop all 2>/dev/null || true
    sudo -u claudyne pm2 delete all 2>/dev/null || true
    sudo -u claudyne pm2 kill 2>/dev/null || true
fi

# Supprimer le répertoire /var/www/claudyne
if [ -d "/var/www/claudyne" ]; then
    log "🗑️ Suppression de /var/www/claudyne..."
    rm -rf /var/www/claudyne
    log "✅ Ancien répertoire supprimé"
fi

# Nettoyer les configurations Nginx Claudyne
log "🌐 Nettoyage configuration Nginx..."
rm -f /etc/nginx/sites-enabled/claudyne* 2>/dev/null || true
rm -f /etc/nginx/sites-available/claudyne* 2>/dev/null || true

# Reload Nginx
if systemctl is-active --quiet nginx; then
    systemctl reload nginx
fi

log "✅ PHASE 2 TERMINÉE: Nettoyage complet effectué"

# ================================================================
# PHASE 3: DÉPLOIEMENT FRAIS
# ================================================================

log "🚀 PHASE 3: Déploiement frais avec les nouveaux scripts..."

# Recréer le répertoire
mkdir -p /var/www/claudyne
chown -R claudyne:claudyne /var/www/claudyne

log "✅ MIGRATION TERMINÉE AVEC SUCCÈS!"
echo ""
log "📊 Résumé:"
echo "   🔒 Sauvegarde complète: $BACKUP_DIR"
echo "   🧹 Ancien système nettoyé"
echo "   📁 Nouveau répertoire créé: /var/www/claudyne"
echo ""
log "🎯 PROCHAINES ÉTAPES:"
echo "   1. Exécutez: su - claudyne"
echo "   2. Puis: cd /var/www/claudyne"
echo "   3. Enfin: ./deploy-app.sh"
echo ""
warning "💡 IMPORTANT: La sauvegarde complète est dans $BACKUP_DIR"
warning "   En cas de problème, vous pouvez tout restaurer avec les commandes du rapport."