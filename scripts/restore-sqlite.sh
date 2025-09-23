#!/bin/bash

# Script restauration backup SQLite
echo "🔄 Restauration backup SQLite"

BACKUP_DIR="/var/backups/claudyne/sqlite"

echo "📋 Backups disponibles:"
ls -lt "$BACKUP_DIR"/*.gz 2>/dev/null | head -5

echo ""
echo "Pour restaurer un backup:"
echo "1. Arrêter backend: pm2 stop claudyne-backend"
echo "2. Décompresser: gunzip /var/backups/claudyne/sqlite/claudyne_backup_XXXXXX.sqlite.gz"
echo "3. Copier: cp /var/backups/claudyne/sqlite/claudyne_backup_XXXXXX.sqlite /var/www/claudyne/backend/database/claudyne.sqlite"
echo "4. Redémarrer: pm2 start claudyne-backend"
