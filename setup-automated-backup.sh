#!/bin/bash
# =============================================================================
# SYSTÈME DE BACKUP AUTOMATIQUE CLAUDYNE
# Sauvegarde quotidienne base de données, fichiers et configuration
# =============================================================================

echo "💾 === SYSTÈME DE BACKUP AUTOMATIQUE CLAUDYNE ==="
echo "Serveur: $(hostname -I | awk '{print $1}')"
echo "Date: $(date)"
echo

# 1. CRÉATION STRUCTURE BACKUP
echo "📋 1. CRÉATION STRUCTURE BACKUP"
echo "----------------------------------------"

# Créer répertoires de backup
BACKUP_DIR="/var/backups/claudyne"
mkdir -p $BACKUP_DIR/{database,files,config,logs}
mkdir -p $BACKUP_DIR/archive/{daily,weekly,monthly}

echo "✅ Structure backup créée: $BACKUP_DIR"

# 2. SCRIPT DE BACKUP BASE DE DONNÉES
echo
echo "📋 2. SCRIPT BACKUP BASE DE DONNÉES"
echo "----------------------------------------"

cat > /usr/local/bin/claudyne-db-backup.sh << 'EOF'
#!/bin/bash
# Script de backup base de données Claudyne

BACKUP_DIR="/var/backups/claudyne"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
APP_DIR="/var/www/claudyne"

# Créer dossier du jour
DAILY_DIR="$BACKUP_DIR/database/$TIMESTAMP"
mkdir -p "$DAILY_DIR"

echo "🗃️ === BACKUP BASE DE DONNÉES CLAUDYNE ===" | tee -a $BACKUP_DIR/logs/backup.log
echo "Date: $(date)" | tee -a $BACKUP_DIR/logs/backup.log

# Backup SQLite (base principale)
if [ -f "$APP_DIR/backend/database/claudyne_production.sqlite" ]; then
    echo "📦 Sauvegarde SQLite production..." | tee -a $BACKUP_DIR/logs/backup.log
    cp "$APP_DIR/backend/database/claudyne_production.sqlite" "$DAILY_DIR/claudyne_production_$TIMESTAMP.sqlite"

    # Vérifier intégrité
    if sqlite3 "$DAILY_DIR/claudyne_production_$TIMESTAMP.sqlite" "PRAGMA integrity_check;" | grep -q "ok"; then
        echo "✅ Backup SQLite OK - Intégrité vérifiée" | tee -a $BACKUP_DIR/logs/backup.log
    else
        echo "❌ ERREUR: Backup SQLite corrompu!" | tee -a $BACKUP_DIR/logs/backup.log
        exit 1
    fi
fi

# Backup PostgreSQL (si configuré)
if systemctl is-active --quiet postgresql; then
    echo "📦 Sauvegarde PostgreSQL..." | tee -a $BACKUP_DIR/logs/backup.log
    sudo -u postgres pg_dump claudyne_prod > "$DAILY_DIR/claudyne_postgres_$TIMESTAMP.sql" 2>/dev/null || echo "⚠️ PostgreSQL backup skipped" | tee -a $BACKUP_DIR/logs/backup.log
fi

# Compression backup
echo "🗜️ Compression backup..." | tee -a $BACKUP_DIR/logs/backup.log
cd "$BACKUP_DIR/database"
tar -czf "claudyne_db_$TIMESTAMP.tar.gz" "$TIMESTAMP/"
rm -rf "$TIMESTAMP/"

# Calculer taille
BACKUP_SIZE=$(du -h "claudyne_db_$TIMESTAMP.tar.gz" | cut -f1)
echo "✅ Backup terminé - Taille: $BACKUP_SIZE" | tee -a $BACKUP_DIR/logs/backup.log

echo "----------------------------------------" | tee -a $BACKUP_DIR/logs/backup.log
EOF

chmod +x /usr/local/bin/claudyne-db-backup.sh
echo "✅ Script backup base de données créé"

# 3. SCRIPT DE BACKUP FICHIERS
echo
echo "📋 3. SCRIPT BACKUP FICHIERS"
echo "----------------------------------------"

cat > /usr/local/bin/claudyne-files-backup.sh << 'EOF'
#!/bin/bash
# Script de backup fichiers Claudyne

BACKUP_DIR="/var/backups/claudyne"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
APP_DIR="/var/www/claudyne"

echo "📁 === BACKUP FICHIERS CLAUDYNE ===" | tee -a $BACKUP_DIR/logs/backup.log
echo "Date: $(date)" | tee -a $BACKUP_DIR/logs/backup.log

# Backup fichiers critiques
BACKUP_FILE="$BACKUP_DIR/files/claudyne_files_$TIMESTAMP.tar.gz"

echo "📦 Sauvegarde fichiers critiques..." | tee -a $BACKUP_DIR/logs/backup.log

# Exclure node_modules et fichiers temporaires
tar -czf "$BACKUP_FILE" \
    --exclude="node_modules" \
    --exclude="*.log" \
    --exclude="*.tmp" \
    --exclude=".git" \
    -C "$APP_DIR" \
    backend/src \
    backend/.env \
    backend/package.json \
    admin-interface-fresh.html \
    nginx-claudyne-secure.conf \
    package.json \
    2>/dev/null

if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "✅ Backup fichiers OK - Taille: $BACKUP_SIZE" | tee -a $BACKUP_DIR/logs/backup.log
else
    echo "❌ ERREUR: Backup fichiers échoué!" | tee -a $BACKUP_DIR/logs/backup.log
    exit 1
fi

echo "----------------------------------------" | tee -a $BACKUP_DIR/logs/backup.log
EOF

chmod +x /usr/local/bin/claudyne-files-backup.sh
echo "✅ Script backup fichiers créé"

# 4. SCRIPT DE BACKUP CONFIGURATION
echo
echo "📋 4. SCRIPT BACKUP CONFIGURATION"
echo "----------------------------------------"

cat > /usr/local/bin/claudyne-config-backup.sh << 'EOF'
#!/bin/bash
# Script de backup configuration système

BACKUP_DIR="/var/backups/claudyne"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "⚙️ === BACKUP CONFIGURATION SYSTÈME ===" | tee -a $BACKUP_DIR/logs/backup.log
echo "Date: $(date)" | tee -a $BACKUP_DIR/logs/backup.log

BACKUP_FILE="$BACKUP_DIR/config/claudyne_config_$TIMESTAMP.tar.gz"

echo "📦 Sauvegarde configurations..." | tee -a $BACKUP_DIR/logs/backup.log

# Backup configurations système
tar -czf "$BACKUP_FILE" \
    /etc/nginx/sites-available/claudyne \
    /etc/fail2ban/jail.d/ \
    /etc/ssl/certs/ \
    /etc/letsencrypt/live/claudyne.com/ \
    2>/dev/null

if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "✅ Backup config OK - Taille: $BACKUP_SIZE" | tee -a $BACKUP_DIR/logs/backup.log
else
    echo "❌ ERREUR: Backup config échoué!" | tee -a $BACKUP_DIR/logs/backup.log
    exit 1
fi

echo "----------------------------------------" | tee -a $BACKUP_DIR/logs/backup.log
EOF

chmod +x /usr/local/bin/claudyne-config-backup.sh
echo "✅ Script backup configuration créé"

# 5. SCRIPT DE NETTOYAGE BACKUP
echo
echo "📋 5. SCRIPT NETTOYAGE BACKUP"
echo "----------------------------------------"

cat > /usr/local/bin/claudyne-backup-cleanup.sh << 'EOF'
#!/bin/bash
# Script de nettoyage des anciens backups

BACKUP_DIR="/var/backups/claudyne"

echo "🧹 === NETTOYAGE BACKUPS ANCIENS ===" | tee -a $BACKUP_DIR/logs/backup.log
echo "Date: $(date)" | tee -a $BACKUP_DIR/logs/backup.log

# Supprimer backups > 7 jours (garder 1 semaine)
find "$BACKUP_DIR/database" -name "*.tar.gz" -mtime +7 -delete
find "$BACKUP_DIR/files" -name "*.tar.gz" -mtime +7 -delete
find "$BACKUP_DIR/config" -name "*.tar.gz" -mtime +7 -delete

# Archiver backups hebdomadaires (dimanche)
if [ $(date +%u) -eq 7 ]; then
    echo "📅 Archivage hebdomadaire..." | tee -a $BACKUP_DIR/logs/backup.log
    WEEK=$(date +%Y_W%U)

    # Copier dernier backup de la semaine
    LATEST_DB=$(ls -t $BACKUP_DIR/database/*.tar.gz 2>/dev/null | head -1)
    LATEST_FILES=$(ls -t $BACKUP_DIR/files/*.tar.gz 2>/dev/null | head -1)

    if [ ! -z "$LATEST_DB" ]; then
        cp "$LATEST_DB" "$BACKUP_DIR/archive/weekly/claudyne_db_$WEEK.tar.gz"
    fi

    if [ ! -z "$LATEST_FILES" ]; then
        cp "$LATEST_FILES" "$BACKUP_DIR/archive/weekly/claudyne_files_$WEEK.tar.gz"
    fi
fi

# Archiver backups mensuels (1er du mois)
if [ $(date +%d) -eq 01 ]; then
    echo "📅 Archivage mensuel..." | tee -a $BACKUP_DIR/logs/backup.log
    MONTH=$(date +%Y_%m)

    LATEST_DB=$(ls -t $BACKUP_DIR/database/*.tar.gz 2>/dev/null | head -1)
    LATEST_FILES=$(ls -t $BACKUP_DIR/files/*.tar.gz 2>/dev/null | head -1)

    if [ ! -z "$LATEST_DB" ]; then
        cp "$LATEST_DB" "$BACKUP_DIR/archive/monthly/claudyne_db_$MONTH.tar.gz"
    fi

    if [ ! -z "$LATEST_FILES" ]; then
        cp "$LATEST_FILES" "$BACKUP_DIR/archive/monthly/claudyne_files_$MONTH.tar.gz"
    fi
fi

# Supprimer archives > 6 mois
find "$BACKUP_DIR/archive/weekly" -name "*.tar.gz" -mtime +180 -delete
find "$BACKUP_DIR/archive/monthly" -name "*.tar.gz" -mtime +365 -delete

echo "✅ Nettoyage terminé" | tee -a $BACKUP_DIR/logs/backup.log
echo "----------------------------------------" | tee -a $BACKUP_DIR/logs/backup.log
EOF

chmod +x /usr/local/bin/claudyne-backup-cleanup.sh
echo "✅ Script nettoyage créé"

# 6. SCRIPT PRINCIPAL DE BACKUP
echo
echo "📋 6. SCRIPT PRINCIPAL DE BACKUP"
echo "----------------------------------------"

cat > /usr/local/bin/claudyne-backup-all.sh << 'EOF'
#!/bin/bash
# Script principal de backup Claudyne

BACKUP_DIR="/var/backups/claudyne"

# Créer log du jour
mkdir -p $BACKUP_DIR/logs
LOG_FILE="$BACKUP_DIR/logs/backup_$(date +%Y%m%d).log"

echo "🔄 === DÉBUT BACKUP COMPLET CLAUDYNE ===" | tee $LOG_FILE
echo "Date: $(date)" | tee -a $LOG_FILE

# Exécuter tous les backups
/usr/local/bin/claudyne-db-backup.sh
/usr/local/bin/claudyne-files-backup.sh
/usr/local/bin/claudyne-config-backup.sh
/usr/local/bin/claudyne-backup-cleanup.sh

echo "✅ === BACKUP COMPLET TERMINÉ ===" | tee -a $LOG_FILE
echo "Date: $(date)" | tee -a $LOG_FILE

# Afficher statistiques
echo "📊 STATISTIQUES BACKUP:" | tee -a $LOG_FILE
echo "Base de données: $(ls -lh $BACKUP_DIR/database/*.tar.gz 2>/dev/null | wc -l) fichiers" | tee -a $LOG_FILE
echo "Fichiers: $(ls -lh $BACKUP_DIR/files/*.tar.gz 2>/dev/null | wc -l) fichiers" | tee -a $LOG_FILE
echo "Config: $(ls -lh $BACKUP_DIR/config/*.tar.gz 2>/dev/null | wc -l) fichiers" | tee -a $LOG_FILE
echo "Espace utilisé: $(du -sh $BACKUP_DIR 2>/dev/null | cut -f1)" | tee -a $LOG_FILE
echo "================================================================" | tee -a $LOG_FILE
EOF

chmod +x /usr/local/bin/claudyne-backup-all.sh
echo "✅ Script principal de backup créé"

# 7. CONFIGURATION CRONTAB
echo
echo "📋 7. CONFIGURATION CRONTAB"
echo "----------------------------------------"

# Backup quotidien à 2h du matin
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/claudyne-backup-all.sh") | crontab -

echo "✅ Crontab configuré - Backup quotidien à 2h"

# 8. TEST INITIAL
echo
echo "📋 8. TEST INITIAL BACKUP"
echo "----------------------------------------"

echo "🧪 Exécution test backup..."
/usr/local/bin/claudyne-backup-all.sh

echo
echo "📊 RÉSULTATS TEST:"
echo "Backup directory: $BACKUP_DIR"
ls -la $BACKUP_DIR/
echo
echo "Database backups:"
ls -lh $BACKUP_DIR/database/ 2>/dev/null
echo
echo "Files backups:"
ls -lh $BACKUP_DIR/files/ 2>/dev/null
echo
echo "Config backups:"
ls -lh $BACKUP_DIR/config/ 2>/dev/null

echo
echo "============================================="
echo "💾 SYSTÈME BACKUP AUTOMATIQUE CONFIGURÉ"
echo "Serveur: $(hostname -I | awk '{print $1}')"
echo "Date: $(date)"
echo
echo "✅ Configuration:"
echo "   - Backup quotidien: 2h du matin"
echo "   - Rétention: 7 jours"
echo "   - Archives: hebdo (6 mois), mensuel (1 an)"
echo "   - Répertoire: $BACKUP_DIR"
echo "============================================="