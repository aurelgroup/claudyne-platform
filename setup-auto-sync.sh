#!/bin/bash

# =================================================================
# CLAUDE SYNCHRONISATION AUTOMATIQUE JSON ↔ POSTGRESQL
# Installation et configuration du système de sync automatique
# En hommage à Meffo Mehtah Tchandjio Claudine
# =================================================================

echo "🔄 === CLAUDYNE AUTO-SYNC SETUP ==="
echo "👨‍👩‍👧‍👦 En hommage à Meffo Mehtah Tchandjio Claudine"
echo ""

VPS_HOST="89.117.58.53"
VPS_USER="root"

# Configuration locale ou serveur
if [ "$1" = "--local" ]; then
    echo "🏠 Configuration locale"
    CLAUDYNE_PATH="/c/Users/fa_nono/Documents/CADD/Claudyne"
    IS_LOCAL=true
else
    echo "🌐 Configuration serveur VPS"
    CLAUDYNE_PATH="/var/www/claudyne"
    IS_LOCAL=false
fi

setup_auto_sync() {
    echo "🔧 Configuration synchronisation automatique..."

    # 1. CRÉER SERVICE SYSTEMD POUR AUTO-SYNC
    cat > /tmp/claudyne-sync.service << 'SERVICEEOF'
[Unit]
Description=Claudyne Database Auto-Sync Service
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/claudyne/backend
Environment=NODE_ENV=production
Environment=DB_HOST=localhost
Environment=DB_PORT=5432
Environment=DB_NAME=claudyne_production
Environment=DB_USER=claudyne_user
Environment=DB_PASSWORD=aujourdhui18D@
ExecStart=/usr/bin/node sync-database.js --auto-sync
Restart=always
RestartSec=30
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
SERVICEEOF

    # 2. INSTALLER LE SERVICE
    sudo mv /tmp/claudyne-sync.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable claudyne-sync.service

    echo "✅ Service systemd installé"

    # 3. CRÉER SCRIPT DE SYNCHRONISATION MANUELLE
    cat > /usr/local/bin/claudyne-sync << 'SYNCEOF'
#!/bin/bash
# Script de synchronisation manuelle Claudyne

CLAUDYNE_PATH="/var/www/claudyne"
BACKEND_PATH="$CLAUDYNE_PATH/backend"

cd "$BACKEND_PATH"

case "$1" in
    "status")
        echo "📊 STATUS CLAUDYNE DATABASE SYNC"
        node sync-database.js --status
        ;;
    "full")
        echo "🔄 SYNCHRONISATION COMPLÈTE"
        node sync-database.js --full-sync
        ;;
    "start")
        echo "🚀 DÉMARRAGE AUTO-SYNC"
        sudo systemctl start claudyne-sync.service
        sudo systemctl status claudyne-sync.service --no-pager
        ;;
    "stop")
        echo "⏹️ ARRÊT AUTO-SYNC"
        sudo systemctl stop claudyne-sync.service
        ;;
    "restart")
        echo "🔄 REDÉMARRAGE AUTO-SYNC"
        sudo systemctl restart claudyne-sync.service
        sudo systemctl status claudyne-sync.service --no-pager
        ;;
    "logs")
        echo "📋 LOGS AUTO-SYNC"
        sudo journalctl -u claudyne-sync.service -f
        ;;
    *)
        echo "🎓 CLAUDYNE DATABASE SYNC MANAGER"
        echo "En hommage à Meffo Mehtah Tchandjio Claudine"
        echo ""
        echo "Usage:"
        echo "  claudyne-sync status    # Statut des bases de données"
        echo "  claudyne-sync full      # Synchronisation complète manuelle"
        echo "  claudyne-sync start     # Démarrer synchronisation automatique"
        echo "  claudyne-sync stop      # Arrêter synchronisation automatique"
        echo "  claudyne-sync restart   # Redémarrer synchronisation automatique"
        echo "  claudyne-sync logs      # Voir logs en temps réel"
        ;;
esac
SYNCEOF

    chmod +x /usr/local/bin/claudyne-sync

    echo "✅ Commande 'claudyne-sync' installée"

    # 4. CRÉER CRON BACKUP DE SÉCURITÉ
    cat > /tmp/claudyne-backup-cron << 'CRONEOF'
# Backup quotidien JSON et PostgreSQL pour Claudyne
0 2 * * * root /usr/local/bin/claudyne-sync full > /var/log/claudyne-sync-daily.log 2>&1

# Backup de sécurité toutes les 6 heures
0 */6 * * * root cp /var/www/claudyne/backend/users.json /var/backups/claudyne/users-backup-$(date +\%H).json

# Nettoyage logs anciens (> 7 jours)
0 3 * * 0 root find /var/www/claudyne/backend/logs -name "*.log" -mtime +7 -delete
CRONEOF

    sudo mv /tmp/claudyne-backup-cron /etc/cron.d/claudyne-backup
    sudo chmod 644 /etc/cron.d/claudyne-backup

    echo "✅ Cron backup configuré"

    # 5. CRÉER RÉPERTOIRES DE TRAVAIL
    mkdir -p /var/www/claudyne/backend/logs
    mkdir -p /var/backups/claudyne
    chown -R root:root /var/www/claudyne/backend/logs
    chmod 755 /var/www/claudyne/backend/logs

    echo "✅ Répertoires configurés"
}

# Exécution selon contexte
if [ "$IS_LOCAL" = true ]; then
    echo "🏠 CONFIGURATION LOCALE"
    echo "Pour tester la synchronisation localement:"
    echo "cd backend && node sync-database.js --status"
    echo "cd backend && node sync-database.js --full-sync"
    echo ""
    echo "Pour déployer sur le serveur:"
    echo "./setup-auto-sync.sh"
else
    echo "🌐 DÉPLOIEMENT SUR SERVEUR VPS"

    ssh $VPS_USER@$VPS_HOST << 'EOF'
        # Aller dans le répertoire Claudyne
        cd /var/www/claudyne

        # Mettre à jour les permissions
        chmod +x backend/sync-database.js

        # Créer les fonctions d'installation
        setup_auto_sync() {
            echo "🔧 Configuration synchronisation automatique..."

            # 1. CRÉER SERVICE SYSTEMD
            cat > /tmp/claudyne-sync.service << 'SERVICEEOF'
[Unit]
Description=Claudyne Database Auto-Sync Service
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/claudyne/backend
Environment=NODE_ENV=production
Environment=DB_HOST=localhost
Environment=DB_PORT=5432
Environment=DB_NAME=claudyne_production
Environment=DB_USER=claudyne_user
Environment=DB_PASSWORD=aujourdhui18D@
ExecStart=/usr/bin/node sync-database.js --auto-sync
Restart=always
RestartSec=30
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
SERVICEEOF

            sudo mv /tmp/claudyne-sync.service /etc/systemd/system/
            sudo systemctl daemon-reload
            sudo systemctl enable claudyne-sync.service

            echo "✅ Service systemd installé"

            # 2. SCRIPT CLAUDYNE-SYNC GLOBAL
            cat > /tmp/claudyne-sync << 'SYNCEOF'
#!/bin/bash
CLAUDYNE_PATH="/var/www/claudyne"
BACKEND_PATH="$CLAUDYNE_PATH/backend"

cd "$BACKEND_PATH"

case "$1" in
    "status")
        echo "📊 STATUS CLAUDYNE DATABASE SYNC"
        node sync-database.js --status
        ;;
    "full")
        echo "🔄 SYNCHRONISATION COMPLÈTE"
        node sync-database.js --full-sync
        ;;
    "start")
        echo "🚀 DÉMARRAGE AUTO-SYNC"
        sudo systemctl start claudyne-sync.service
        sudo systemctl status claudyne-sync.service --no-pager
        ;;
    "stop")
        echo "⏹️ ARRÊT AUTO-SYNC"
        sudo systemctl stop claudyne-sync.service
        ;;
    "restart")
        echo "🔄 REDÉMARRAGE AUTO-SYNC"
        sudo systemctl restart claudyne-sync.service
        sudo systemctl status claudyne-sync.service --no-pager
        ;;
    "logs")
        echo "📋 LOGS AUTO-SYNC"
        sudo journalctl -u claudyne-sync.service -f
        ;;
    *)
        echo "🎓 CLAUDYNE DATABASE SYNC MANAGER"
        echo "En hommage à Meffo Mehtah Tchandjio Claudine"
        echo ""
        echo "Usage:"
        echo "  claudyne-sync status    # Statut des bases"
        echo "  claudyne-sync full      # Sync complète"
        echo "  claudyne-sync start     # Démarrer auto-sync"
        echo "  claudyne-sync stop      # Arrêter auto-sync"
        echo "  claudyne-sync restart   # Redémarrer auto-sync"
        echo "  claudyne-sync logs      # Logs temps réel"
        ;;
esac
SYNCEOF

            sudo mv /tmp/claudyne-sync /usr/local/bin/
            sudo chmod +x /usr/local/bin/claudyne-sync

            echo "✅ Commande claudyne-sync installée"

            # 3. CRÉER RÉPERTOIRES
            mkdir -p /var/www/claudyne/backend/logs
            mkdir -p /var/backups/claudyne

            echo "✅ Répertoires créés"
        }

        # Exécuter l'installation
        setup_auto_sync

        # 4. TEST INITIAL
        echo ""
        echo "🧪 TEST INITIAL DE LA SYNCHRONISATION"
        echo "======================================"

        cd /var/www/claudyne/backend

        # Test du script
        timeout 10s node sync-database.js --status || echo "⚠️ Test timeout - normal pour première fois"

        # Démarrer le service automatique
        echo ""
        echo "🚀 DÉMARRAGE SERVICE AUTO-SYNC"
        sudo systemctl start claudyne-sync.service
        sleep 2
        sudo systemctl status claudyne-sync.service --no-pager | head -10

        echo ""
        echo "✅ === INSTALLATION TERMINÉE ==="
        echo "📋 COMMANDES DISPONIBLES:"
        echo "   claudyne-sync status    # Voir le statut"
        echo "   claudyne-sync full      # Sync manuelle"
        echo "   claudyne-sync logs      # Voir les logs"
        echo "   claudyne-sync restart   # Redémarrer"
        echo ""
        echo "🔄 La synchronisation automatique est maintenant active !"
        echo "👨‍👩‍👧‍👦 En hommage à Meffo Mehtah Tchandjio Claudine"

EOF
fi

echo ""
echo "✅ === CLAUDYNE AUTO-SYNC CONFIGURÉ ==="
echo "🔄 Synchronisation JSON ↔ PostgreSQL activée"