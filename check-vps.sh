#!/bin/bash

echo "🔍 Examen de l'état du VPS Contabo 89.117.58.53"
echo "=============================================="
echo ""

echo "📁 Contenu de /var/www/claudyne :"
ls -la /var/www/claudyne/ 2>/dev/null || echo "❌ /var/www/claudyne n'existe pas"

echo ""
echo "📊 Espace disque :"
df -h /

echo ""
echo "💾 Utilisation mémoire :"
free -h

echo ""
echo "🔄 Services en cours :"
systemctl status nginx --no-pager 2>/dev/null || echo "Nginx non installé/actif"
systemctl status postgresql --no-pager 2>/dev/null || echo "PostgreSQL non installé/actif"
systemctl status redis-server --no-pager 2>/dev/null || echo "Redis non installé/actif"

echo ""
echo "🌐 Ports en écoute :"
netstat -tulpn | grep -E ':80|:443|:3000|:3001|:5432|:6379' || echo "Aucun port standard en écoute"

echo ""
echo "👤 Utilisateur claudyne :"
id claudyne 2>/dev/null || echo "Utilisateur claudyne n'existe pas"

echo ""
echo "⚙️ PM2 installé :"
which pm2 2>/dev/null || echo "PM2 non installé"

echo ""
echo "🟢 Node.js :"
node --version 2>/dev/null || echo "Node.js non installé"

echo ""
echo "📦 NPM :"
npm --version 2>/dev/null || echo "NPM non installé"

echo ""
echo "🔒 Certificats SSL :"
ls -la /etc/letsencrypt/live/ 2>/dev/null || echo "Aucun certificat SSL trouvé"