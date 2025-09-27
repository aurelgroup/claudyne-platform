#!/bin/bash

# Sync SQLite → PostgreSQL (sans interruption service)
echo "🔄 Sync SQLite → PostgreSQL"

# Configuration
PG_DB="claudyne_production"
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
