#!/bin/bash

# Configuration
BACKUP_DIR="/var/backups/claudyne/sqlite"
SOURCE_DB="/var/www/claudyne/backend/database/claudyne.sqlite"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/claudyne_backup_$DATE.sqlite"

echo "🔄 Backup SQLite: $DATE"

# Vérifier si DB source existe
if [ ! -f "$SOURCE_DB" ]; then
    # Chercher le vrai fichier SQLite
    SOURCE_DB=$(find /var/www/claudyne/backend -name "*.sqlite" -type f | head -1)
    if [ -z "$SOURCE_DB" ]; then
        echo "❌ Aucune base SQLite trouvée"
        exit 1
    fi
    echo "📍 Base trouvée: $SOURCE_DB"
fi

# Backup avec sqlite3 (garantit cohérence)
if command -v sqlite3 &> /dev/null; then
    sqlite3 "$SOURCE_DB" ".backup '$BACKUP_FILE'"
    echo "✅ Backup SQLite créé: $BACKUP_FILE"
else
    # Fallback: copie simple
    cp "$SOURCE_DB" "$BACKUP_FILE"
    echo "✅ Backup simple créé: $BACKUP_FILE"
fi

# Compression pour économiser espace
gzip "$BACKUP_FILE"
echo "🗜️ Backup compressé: $BACKUP_FILE.gz"

# Nettoyer anciens backups (garder 7 jours)
find "$BACKUP_DIR" -name "*.gz" -mtime +7 -delete
echo "🧹 Anciens backups nettoyés"

# Sync vers PostgreSQL si configuré
if [ -f /var/www/claudyne/scripts/sync-to-postgresql.sh ]; then
    bash /var/www/claudyne/scripts/sync-to-postgresql.sh
fi
