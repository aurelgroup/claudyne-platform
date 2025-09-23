#!/bin/bash

# =================================================
# SYSTÈME DE BACKUP AUTOMATIQUE CLAUDYNE
# SQLite + PostgreSQL sync sans interruption service
# =================================================

echo "🛡️ Configuration système backup Claudyne"
echo "👨‍👩‍👧‍👦 En hommage à Meffo Mehtah Tchandjio Claudine"
echo ""

VPS_IP="89.117.58.53"
VPS_USER="root"

ssh $VPS_USER@$VPS_IP << 'EOF'
    echo "🛡️ CONFIGURATION BACKUP SYSTÈME"
    echo "==============================="

    # 1. CRÉER STRUCTURE BACKUP
    echo "📁 Création structure backup..."
    mkdir -p /var/backups/claudyne/{sqlite,postgresql,daily,weekly}
    mkdir -p /var/www/claudyne/scripts

    # 2. VÉRIFIER DONNÉES SQLITE ACTUELLES
    echo ""
    echo "📊 Données SQLite actuelles:"
    cd /var/www/claudyne/backend

    if [ -f database/claudyne.sqlite ]; then
        echo "✅ SQLite principal trouvé"
        ls -lh database/claudyne.sqlite
    else
        echo "⚠️ SQLite principal non trouvé - vérification..."
        find . -name "*.sqlite" -type f
    fi

    # 3. SCRIPT BACKUP SQLITE AUTOMATIQUE
    echo ""
    echo "📝 Création script backup SQLite..."

    cat > /var/www/claudyne/scripts/backup-sqlite.sh << 'BACKUPEOF'
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
BACKUPEOF

    chmod +x /var/www/claudyne/scripts/backup-sqlite.sh

    # 4. TESTER BACKUP IMMÉDIAT
    echo ""
    echo "🧪 Test backup immédiat..."
    bash /var/www/claudyne/scripts/backup-sqlite.sh

    # 5. CRONTAB AUTOMATIQUE
    echo ""
    echo "⏰ Configuration crontab backup..."

    # Ajouter crontab pour backup quotidien à 2h du matin
    (crontab -l 2>/dev/null; echo "0 2 * * * /var/www/claudyne/scripts/backup-sqlite.sh >> /var/log/claudyne-backup.log 2>&1") | crontab -

    echo "✅ Backup automatique configuré (2h00 quotidien)"

    # 6. SCRIPT SYNC POSTGRESQL (OPTIONNEL)
    echo ""
    echo "📝 Création script sync PostgreSQL..."

    cat > /var/www/claudyne/scripts/sync-to-postgresql.sh << 'SYNCEOF'
#!/bin/bash

# Sync SQLite → PostgreSQL (sans interruption service)
echo "🔄 Sync SQLite → PostgreSQL"

# Configuration
PG_DB="claudyne_prod"
PG_USER="claudyne_user"
SQLITE_DB=$(find /var/www/claudyne/backend -name "*.sqlite" -type f | head -1)

if [ -z "$SQLITE_DB" ]; then
    echo "❌ SQLite non trouvé"
    exit 1
fi

# Exporter données SQLite vers CSV temporaire
TEMP_DIR="/tmp/claudyne_sync_$(date +%s)"
mkdir -p "$TEMP_DIR"

echo "📤 Export SQLite vers CSV..."

# Export tables principales via sqlite3
sqlite3 "$SQLITE_DB" << SQLEOF
.headers on
.mode csv
.output $TEMP_DIR/users.csv
SELECT * FROM users;
.output $TEMP_DIR/families.csv
SELECT * FROM families;
SQLEOF

# Import dans PostgreSQL (si tables existent)
echo "📥 Import dans PostgreSQL..."

for csv_file in "$TEMP_DIR"/*.csv; do
    if [ -f "$csv_file" ]; then
        table_name=$(basename "$csv_file" .csv)
        echo "  → Table: $table_name"

        # Import via PostgreSQL COPY (plus rapide)
        sudo -u postgres psql -d "$PG_DB" -c "\COPY $table_name FROM '$csv_file' CSV HEADER;" 2>/dev/null || echo "    ⚠️ Import $table_name échoué"
    fi
done

# Nettoyage
rm -rf "$TEMP_DIR"
echo "✅ Sync terminé"
SYNCEOF

    chmod +x /var/www/claudyne/scripts/sync-to-postgresql.sh

    # 7. LISTE BACKUPS CRÉÉS
    echo ""
    echo "📋 Backups disponibles:"
    ls -lh /var/backups/claudyne/sqlite/ 2>/dev/null || echo "Aucun backup encore"

    # 8. SCRIPT RESTAURATION
    echo ""
    echo "📝 Création script restauration..."

    cat > /var/www/claudyne/scripts/restore-sqlite.sh << 'RESTOREEOF'
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
RESTOREEOF

    chmod +x /var/www/claudyne/scripts/restore-sqlite.sh

    # 9. STATUT FINAL
    echo ""
    echo "📊 SYSTÈME BACKUP CONFIGURÉ:"
    echo "============================"
    echo "✅ Backup quotidien: 2h00 automatique"
    echo "✅ Scripts disponibles:"
    echo "   📄 /var/www/claudyne/scripts/backup-sqlite.sh"
    echo "   📄 /var/www/claudyne/scripts/sync-to-postgresql.sh"
    echo "   📄 /var/www/claudyne/scripts/restore-sqlite.sh"
    echo "✅ Stockage: /var/backups/claudyne/"
    echo "✅ Logs: /var/log/claudyne-backup.log"

    # 10. VÉRIFIER CRONTAB
    echo ""
    echo "⏰ Crontab configuré:"
    crontab -l | grep claudyne

EOF

echo ""
echo "✅ Système backup configuré sans interruption !"