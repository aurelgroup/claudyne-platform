#!/bin/bash
# =============================================================================
# INSTALLATION ET CONFIGURATION FAIL2BAN
# Protection avancée contre les attaques SSH et web
# =============================================================================

echo "🛡️ === INSTALLATION FAIL2BAN POUR CLAUDYNE ==="
echo "Serveur: $(hostname -I | awk '{print $1}')"
echo "Date: $(date)"
echo

# 1. INSTALLATION FAIL2BAN
echo "📋 1. INSTALLATION FAIL2BAN"
echo "----------------------------------------"

# Vérifier si déjà installé
if systemctl is-active --quiet fail2ban; then
    echo "✅ Fail2ban déjà installé et actif"
else
    echo "📦 Installation de Fail2ban..."
    apt update
    apt install -y fail2ban
    systemctl enable fail2ban
    echo "✅ Fail2ban installé avec succès"
fi

# 2. CONFIGURATION SSH PROTECTION
echo
echo "📋 2. CONFIGURATION PROTECTION SSH"
echo "----------------------------------------"

# Créer configuration SSH jail
cat > /etc/fail2ban/jail.d/sshd.local << 'EOF'
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
findtime = 600
ignoreip = 127.0.0.1/8 ::1
EOF

echo "✅ Configuration SSH jail créée"

# 3. CONFIGURATION NGINX PROTECTION
echo
echo "📋 3. CONFIGURATION PROTECTION NGINX"
echo "----------------------------------------"

# Créer filtre pour attaques Nginx
cat > /etc/fail2ban/filter.d/nginx-claudyne.conf << 'EOF'
[Definition]
failregex = ^<HOST> -.*GET.*(\.php|wp-admin|wp-login|phpmyadmin|admin\.php|\.env|\.git).*HTTP.*$
            ^<HOST> -.*POST.*(\.php|wp-admin|wp-login|phpmyadmin|admin\.php).*HTTP.*$
            ^<HOST> -.*"(GET|POST).*HTTP.*" (4|5)\d{2}
ignoreregex =
EOF

# Créer jail pour Nginx
cat > /etc/fail2ban/jail.d/nginx-claudyne.local << 'EOF'
[nginx-claudyne]
enabled = true
port = http,https
filter = nginx-claudyne
logpath = /var/log/nginx/claudyne.access.log
maxretry = 5
bantime = 7200
findtime = 300
ignoreip = 127.0.0.1/8 ::1

[nginx-dos]
enabled = true
port = http,https
filter = nginx-http-auth
logpath = /var/log/nginx/claudyne.access.log
maxretry = 50
bantime = 600
findtime = 60
ignoreip = 127.0.0.1/8 ::1
EOF

echo "✅ Configuration Nginx jail créée"

# 4. CONFIGURATION PROTECTION ADMIN
echo
echo "📋 4. CONFIGURATION PROTECTION ADMIN"
echo "----------------------------------------"

# Créer filtre spécial pour interface admin
cat > /etc/fail2ban/filter.d/claudyne-admin.conf << 'EOF'
[Definition]
failregex = ^<HOST> -.*GET.*/admin.*HTTP.*" (401|403|404)
            ^<HOST> -.*POST.*/admin.*HTTP.*" (401|403|404)
            ^<HOST> -.*GET.*/api/admin.*HTTP.*" (401|403|404)
            ^<HOST> -.*POST.*/api/admin.*HTTP.*" (401|403|404)
ignoreregex =
EOF

# Créer jail pour admin
cat > /etc/fail2ban/jail.d/claudyne-admin.local << 'EOF'
[claudyne-admin]
enabled = true
port = http,https
filter = claudyne-admin
logpath = /var/log/nginx/claudyne.access.log
maxretry = 3
bantime = 86400
findtime = 300
ignoreip = 127.0.0.1/8 ::1
EOF

echo "✅ Configuration admin protection créée"

# 5. CONFIGURATION GÉNÉRALE
echo
echo "📋 5. CONFIGURATION GÉNÉRALE FAIL2BAN"
echo "----------------------------------------"

# Configuration principale
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
# Temps de bannissement par défaut (1 heure)
bantime = 3600

# Temps de recherche des échecs (10 minutes)
findtime = 600

# Nombre d'échecs autorisés
maxretry = 5

# Action par défaut
banaction = iptables-multiport
banaction_allports = iptables-allports

# Email notifications (à configurer selon besoins)
# destemail = admin@claudyne.com
# sendername = Fail2Ban-Claudyne
# mta = sendmail

# Ignorer les IPs locales
ignoreip = 127.0.0.1/8 ::1

[recidive]
enabled = true
logpath = /var/log/fail2ban.log
filter = recidive
banaction = iptables-allports
bantime = 604800
findtime = 86400
maxretry = 3
EOF

echo "✅ Configuration générale créée"

# 6. DÉMARRAGE ET VÉRIFICATION
echo
echo "📋 6. DÉMARRAGE ET VÉRIFICATION"
echo "----------------------------------------"

# Redémarrer fail2ban
systemctl restart fail2ban
sleep 3

# Vérifier le statut
echo "📊 Statut Fail2ban:"
systemctl status fail2ban --no-pager | head -10

echo
echo "📊 Jails actives:"
fail2ban-client status

echo
echo "📊 Configuration SSH jail:"
fail2ban-client status sshd

# 7. TESTS DE SÉCURITÉ
echo
echo "📋 7. TESTS ET MONITORING"
echo "----------------------------------------"

echo "📊 IPs actuellement bannies:"
fail2ban-client status | grep "Jail list" | cut -d: -f2 | tr ',' '\n' | while read jail; do
    if [ ! -z "$jail" ]; then
        echo "--- Jail: $jail ---"
        fail2ban-client status $jail | grep "Banned IP list"
    fi
done

echo
echo "📊 Dernières tentatives d'attaque SSH (5 dernières):"
grep "Failed password" /var/log/auth.log | tail -5 || echo "Aucune tentative récente"

echo
echo "📊 Logs Fail2ban récents:"
tail -n 10 /var/log/fail2ban.log

# 8. COMMANDES UTILES
echo
echo "📋 8. COMMANDES UTILES FAIL2BAN"
echo "----------------------------------------"
cat << 'EOF'
🔧 COMMANDES FAIL2BAN UTILES:

# Voir toutes les jails
fail2ban-client status

# Voir détails d'une jail
fail2ban-client status sshd

# Débannir une IP
fail2ban-client unban <IP>

# Bannir manuellement une IP
fail2ban-client ban <IP>

# Recharger configuration
fail2ban-client reload

# Voir logs en temps réel
tail -f /var/log/fail2ban.log

# Vérifier règles iptables
iptables -L -n | grep fail2ban
EOF

echo
echo "============================================="
echo "🛡️ FAIL2BAN INSTALLÉ ET CONFIGURÉ"
echo "Serveur: $(hostname -I | awk '{print $1}')"
echo "Date: $(date)"
echo
echo "✅ Protections activées:"
echo "   - SSH: 3 échecs = ban 1h"
echo "   - Nginx: 5 échecs = ban 2h"
echo "   - Admin: 3 échecs = ban 24h"
echo "   - Récidive: ban 7 jours"
echo "============================================="