#!/bin/bash

# =================================================
# VÉRIFICATION ÉTAT PRODUCTION CLAUDYNE
# Évite le double emploi et vérifie ce qui fonctionne
# =================================================

echo "🔍 Vérification état production Claudyne"
echo "👨‍👩‍👧‍👦 En hommage à Meffo Mehtah Tchandjio Claudine"
echo ""

VPS_IP="89.117.58.53"
VPS_USER="root"

echo "📡 Vérification état des services..."

ssh $VPS_USER@$VPS_IP << 'EOF'
    echo "🔍 ÉTAT ACTUEL DU SERVEUR CLAUDYNE"
    echo "=================================="

    # 1. Services PM2
    echo "📊 Services PM2:"
    pm2 status
    echo ""

    # 2. Ports en écoute
    echo "🔗 Ports actifs:"
    netstat -tulpn | grep -E ":(80|443|3000|3001)" | head -10
    echo ""

    # 3. Test accessibilité interne
    echo "🌐 Tests accessibilité interne:"
    echo "  Frontend (3000):"
    curl -s -o /dev/null -w "  Status: %{http_code} | Time: %{time_total}s\n" http://localhost:3000/ || echo "  ❌ Frontend inaccessible"

    echo "  Backend (3001):"
    curl -s -o /dev/null -w "  Status: %{http_code} | Time: %{time_total}s\n" http://localhost:3001/ || echo "  ❌ Backend inaccessible"
    echo ""

    # 4. Configuration Nginx
    echo "🌍 Configuration Nginx:"
    if [ -f /etc/nginx/sites-enabled/claudyne ]; then
        echo "  ✅ Site Claudyne activé"
        nginx -t && echo "  ✅ Configuration Nginx valide" || echo "  ❌ Erreur configuration Nginx"
    else
        echo "  ⚠️ Site Claudyne non activé"
    fi
    echo ""

    # 5. SSL/HTTPS Status
    echo "🔒 État SSL:"
    if [ -f /etc/letsencrypt/live/claudyne.com/fullchain.pem ]; then
        echo "  ✅ Certificat SSL détecté"
        openssl x509 -in /etc/letsencrypt/live/claudyne.com/fullchain.pem -noout -dates | head -2
    else
        echo "  ⚠️ Pas de certificat SSL configuré"
    fi
    echo ""

    # 6. Base de données
    echo "💾 État base de données:"
    if command -v psql &> /dev/null; then
        echo "  📊 PostgreSQL installé"
        sudo -u postgres psql -c "\l" | grep claudyne && echo "  ✅ Base claudyne détectée" || echo "  ⚠️ Base claudyne non trouvée"
    else
        echo "  ⚠️ PostgreSQL non installé"
    fi

    if [ -f /var/www/claudyne/backend/database/claudyne.sqlite ]; then
        echo "  📁 SQLite backup disponible"
    fi
    echo ""

    # 7. Logs récents
    echo "📝 Logs récents (dernières erreurs):"
    echo "  Frontend:"
    pm2 logs claudyne-frontend --lines 3 --nostream 2>/dev/null | tail -3 || echo "  Pas de logs frontend"
    echo "  Backend:"
    pm2 logs claudyne-backend --lines 3 --nostream 2>/dev/null | tail -3 || echo "  Pas de logs backend"
    echo ""

    # 8. Ressources système
    echo "💻 Ressources système:"
    echo "  CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)% utilisé"
    echo "  RAM: $(free -h | grep Mem | awk '{printf "%.1f%% utilisé (%s/%s)", $3/$2*100, $3, $2}')"
    echo "  Disque: $(df -h / | tail -1 | awk '{printf "%s utilisé (%s disponible)", $5, $4}')"

EOF

echo ""
echo "✅ Vérification terminée !"