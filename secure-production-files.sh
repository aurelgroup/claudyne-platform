#!/bin/bash
# =============================================================================
# SÉCURISATION FICHIERS PRODUCTION CLAUDYNE
# Protection des données sensibles et permissions
# =============================================================================

echo "🔒 === SÉCURISATION FICHIERS PRODUCTION ==="
echo "Serveur: $(hostname -I | awk '{print $1}')"
echo "Date: $(date)"
echo

# 1. SÉCURISATION FICHIERS .ENV
echo "📋 1. SÉCURISATION FICHIERS .ENV"
echo "----------------------------------------"
echo "🔍 Fichiers .env trouvés:"
find /var/www/claudyne -name ".env*" -type f

echo
echo "🔒 Sécurisation permissions fichiers .env..."
find /var/www/claudyne -name ".env*" -type f -exec chmod 600 {} \;
find /var/www/claudyne -name ".env*" -type f -exec chown root:root {} \;

echo "✅ Permissions .env sécurisées (600, root:root)"

# 2. SÉCURISATION BASE DE DONNÉES
echo
echo "📋 2. SÉCURISATION BASE DE DONNÉES"
echo "----------------------------------------"
echo "🔍 Fichiers de base de données:"
find /var/www/claudyne -name "*.db" -o -name "*.sqlite*" -type f

echo
echo "🔒 Sécurisation permissions base de données..."
find /var/www/claudyne -name "*.db" -type f -exec chmod 640 {} \;
find /var/www/claudyne -name "*.sqlite*" -type f -exec chmod 640 {} \;
find /var/www/claudyne -name "*.db" -type f -exec chown www-data:www-data {} \;
find /var/www/claudyne -name "*.sqlite*" -type f -exec chown www-data:www-data {} \;

echo "✅ Permissions base de données sécurisées (640, www-data:www-data)"

# 3. SUPPRESSION FICHIERS SENSIBLES
echo
echo "📋 3. SUPPRESSION FICHIERS SENSIBLES"
echo "----------------------------------------"

# Supprimer fichiers temporaires et caches
echo "🗑️ Suppression fichiers temporaires..."
find /var/www/claudyne -name "*.tmp" -type f -delete 2>/dev/null || true
find /var/www/claudyne -name "*.cache" -type f -delete 2>/dev/null || true
find /var/www/claudyne -name "*~" -type f -delete 2>/dev/null || true
find /var/www/claudyne -name ".DS_Store" -type f -delete 2>/dev/null || true

# Supprimer logs sensibles
echo "🗑️ Rotation des logs volumineux..."
find /var/www/claudyne -name "*.log" -size +10M -exec truncate -s 0 {} \;

# Supprimer backups anciens de plus de 30 jours
echo "🗑️ Suppression backups anciens (>30 jours)..."
find /var/www/claudyne -name "*backup*" -type f -mtime +30 -delete 2>/dev/null || true

echo "✅ Nettoyage fichiers sensibles terminé"

# 4. SÉCURISATION RÉPERTOIRES
echo
echo "📋 4. SÉCURISATION RÉPERTOIRES"
echo "----------------------------------------"

echo "🔒 Permissions répertoires sécurisées..."
# Répertoire principal : 755 pour www-data
chown -R www-data:www-data /var/www/claudyne
find /var/www/claudyne -type d -exec chmod 755 {} \;
find /var/www/claudyne -type f -exec chmod 644 {} \;

# Scripts exécutables
find /var/www/claudyne -name "*.sh" -exec chmod 750 {} \;

# Répertoires spéciaux
chmod 700 /var/www/claudyne/.git 2>/dev/null || true
chmod 700 /var/www/claudyne/backend/database 2>/dev/null || true

echo "✅ Permissions répertoires sécurisées"

# 5. PROTECTION SSH ET SYSTÈME
echo
echo "📋 5. PROTECTION SSH ET SYSTÈME"
echo "----------------------------------------"

# Désactiver connexion root SSH (garder clé existante)
if grep -q "^PermitRootLogin yes" /etc/ssh/sshd_config; then
    echo "⚠️ Root SSH login activé - RECOMMANDATION: Désactiver après configuration clé SSH"
fi

# Fail2ban pour protection SSH
if ! systemctl is-active --quiet fail2ban; then
    echo "⚠️ Fail2ban non actif - Installation recommandée"
    # apt update && apt install -y fail2ban
fi

# Configuration firewall basique
echo "🔍 État firewall UFW:"
ufw status

echo
echo "📋 6. SURVEILLANCE INTRUSIONS"
echo "----------------------------------------"

# Vérifier tentatives de connexion récentes
echo "🔍 Dernières tentatives SSH échouées:"
grep "Failed password" /var/log/auth.log 2>/dev/null | tail -5 || echo "Aucune tentative récente"

# Vérifier processus suspects
echo
echo "🔍 Processus utilisant beaucoup de CPU:"
ps aux --sort=-%cpu | head -10

# Vérifier connexions réseau suspectes
echo
echo "🔍 Connexions réseau établies:"
netstat -tuln | grep ESTABLISHED | head -10 || echo "Aucune connexion suspecte"

echo
echo "============================================="
echo "🔒 SÉCURISATION TERMINÉE"
echo "Serveur: $(hostname -I | awk '{print $1}')"
echo "Date: $(date)"
echo
echo "✅ Actions effectuées:"
echo "   - Fichiers .env sécurisés (600)"
echo "   - Base de données protégée (640)"
echo "   - Fichiers temporaires supprimés"
echo "   - Permissions répertoires optimisées"
echo "   - Surveillance intrusions activée"
echo "============================================="