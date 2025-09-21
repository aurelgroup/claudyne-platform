#!/bin/bash
# =============================================================================
# AUDIT SÉCURITÉ SERVEUR PRODUCTION CLAUDYNE
# Vérification complète de l'état de sécurité actuel
# =============================================================================

echo "🔍 === AUDIT SÉCURITÉ PRODUCTION CLAUDYNE ==="
echo "Serveur: 89.117.58.53"
echo "Date: $(date)"
echo

# 1. VÉRIFICATION SSL/HTTPS
echo "📋 1. ÉTAT SSL/HTTPS"
echo "----------------------------------------"
echo "🔍 Vérification certificats SSL..."
if [ -d "/etc/letsencrypt/live/claudyne.com" ]; then
    echo "✅ Répertoire Let's Encrypt trouvé"
    ls -la /etc/letsencrypt/live/claudyne.com/
    echo
    echo "📅 Dates d'expiration:"
    openssl x509 -in /etc/letsencrypt/live/claudyne.com/fullchain.pem -noout -dates
else
    echo "❌ Aucun certificat SSL trouvé"
fi

echo
echo "🔍 Configuration Nginx SSL..."
if [ -f "/etc/nginx/sites-available/claudyne" ] || [ -f "/etc/nginx/sites-enabled/claudyne" ]; then
    echo "✅ Configuration Nginx trouvée"
    nginx -t
else
    echo "❌ Pas de configuration Nginx spécifique"
fi

echo
echo "🌐 Test HTTPS en ligne:"
curl -I https://claudyne.com 2>/dev/null | head -5 || echo "❌ HTTPS non accessible"

echo
echo "----------------------------------------"

# 2. VÉRIFICATION FIREWALL
echo "📋 2. CONFIGURATION FIREWALL"
echo "----------------------------------------"
echo "🔍 État UFW:"
ufw status verbose

echo
echo "🔍 Ports ouverts:"
netstat -tuln | grep LISTEN

echo
echo "🔍 Connexions actives:"
ss -tuln

echo
echo "----------------------------------------"

# 3. VÉRIFICATION NGINX
echo "📋 3. ÉTAT NGINX"
echo "----------------------------------------"
echo "🔍 Statut Nginx:"
systemctl status nginx --no-pager

echo
echo "🔍 Configuration Nginx:"
nginx -T 2>/dev/null | grep -E "(server_name|listen|ssl_|proxy_pass)" | head -20

echo
echo "🔍 Logs Nginx récents (erreurs):"
tail -n 10 /var/log/nginx/error.log 2>/dev/null || echo "Pas de logs d'erreur"

echo
echo "----------------------------------------"

# 4. VÉRIFICATION PROCESSUS NODE.JS
echo "📋 4. PROCESSUS NODE.JS"
echo "----------------------------------------"
echo "🔍 Processus Node actifs:"
ps aux | grep node | grep -v grep

echo
echo "🔍 Ports Node.js:"
netstat -tuln | grep -E ":300[0-9]"

echo
echo "----------------------------------------"

# 5. VÉRIFICATION SÉCURITÉ SYSTÈME
echo "📋 5. SÉCURITÉ SYSTÈME"
echo "----------------------------------------"
echo "🔍 Utilisateurs avec accès SSH:"
grep -E "^[^:]*:[^:]*:[0-9]{4}:" /etc/passwd

echo
echo "🔍 Dernières connexions:"
last -n 10

echo
echo "🔍 Tentatives de connexion échouées:"
grep "Failed password" /var/log/auth.log 2>/dev/null | tail -5 || echo "Pas de logs d'échec récents"

echo
echo "🔍 Mises à jour système:"
apt list --upgradable 2>/dev/null | head -10

echo
echo "----------------------------------------"

# 6. VÉRIFICATION BASE DE DONNÉES
echo "📋 6. SÉCURITÉ BASE DE DONNÉES"
echo "----------------------------------------"
echo "🔍 Processus PostgreSQL/SQLite:"
ps aux | grep -E "(postgres|sqlite)" | grep -v grep

echo
echo "🔍 Fichiers de base de données:"
find /var/www/claudyne -name "*.db" -o -name "*.sqlite*" 2>/dev/null

echo
echo "----------------------------------------"

# 7. VÉRIFICATION FICHIERS SENSIBLES
echo "📋 7. FICHIERS SENSIBLES"
echo "----------------------------------------"
echo "🔍 Fichiers .env:"
find /var/www/claudyne -name ".env*" -exec ls -la {} \;

echo
echo "🔍 Permissions répertoire Claudyne:"
ls -la /var/www/claudyne/

echo
echo "🔍 Fichiers avec permissions 777:"
find /var/www/claudyne -type f -perm 777 2>/dev/null || echo "Aucun fichier avec permissions 777"

echo
echo "----------------------------------------"

# 8. VÉRIFICATION MONITORING
echo "📋 8. MONITORING ET LOGS"
echo "----------------------------------------"
echo "🔍 Espace disque:"
df -h

echo
echo "🔍 Utilisation mémoire:"
free -h

echo
echo "🔍 Charge système:"
uptime

echo
echo "🔍 Logs système récents:"
journalctl --since "1 hour ago" --no-pager | tail -10

echo
echo "============================================="
echo "🔍 AUDIT SÉCURITÉ TERMINÉ"
echo "Serveur: 89.117.58.53"
echo "Date: $(date)"
echo "============================================="