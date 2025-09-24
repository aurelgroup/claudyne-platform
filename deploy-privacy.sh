#!/bin/bash

# 🔒 SCRIPT DE DÉPLOIEMENT POLITIQUE DE CONFIDENTIALITÉ
# Déploiement sur VPS Contabo - Claudyne
# 🇨🇲 Honneur à Ma'a Meffo TCHANDJIO Claudine

echo "🚀 DÉPLOIEMENT POLITIQUE DE CONFIDENTIALITÉ - CLAUDYNE"
echo "======================================================"

# Variables
VPS_IP="89.117.58.53"
VPS_USER="root"
DOMAIN="claudyne.com"
LOCAL_FILE="privacy.html"

echo "📋 Configuration:"
echo "- VPS: $VPS_IP"
echo "- Domaine: $DOMAIN"
echo "- Fichier: $LOCAL_FILE"
echo ""

# Vérification fichier local
if [ ! -f "$LOCAL_FILE" ]; then
    echo "❌ Erreur: Fichier $LOCAL_FILE introuvable"
    exit 1
fi

echo "✅ Fichier local trouvé: $(ls -lh $LOCAL_FILE)"
echo ""

# Connexion et exploration du serveur
echo "🔍 Exploration de l'architecture serveur..."

ssh $VPS_USER@$VPS_IP << 'ENDSSH'
echo "📊 Informations système:"
uname -a
echo ""

echo "🌐 Services web actifs:"
systemctl status nginx 2>/dev/null || echo "Nginx: non installé"
systemctl status apache2 2>/dev/null || echo "Apache: non installé"
systemctl status httpd 2>/dev/null || echo "HttpD: non installé"
echo ""

echo "📁 Structure web existante:"
ls -la /var/www/ 2>/dev/null || echo "Pas de /var/www/"
ls -la /opt/claudyne/ 2>/dev/null || echo "Pas de /opt/claudyne/"
ls -la /home/claudyne/ 2>/dev/null || echo "Pas de /home/claudyne/"
echo ""

echo "🔍 Recherche de fichiers Claudyne:"
find / -name "*claudyne*" -type d 2>/dev/null | head -10
echo ""

echo "🌐 Processus web actifs:"
ps aux | grep -E "(nginx|apache|httpd|node)" | grep -v grep
echo ""

echo "📡 Ports ouverts:"
netstat -tlnp | grep -E ":80|:443|:3000|:8080"
ENDSSH

echo ""
echo "🤔 Quelle architecture avez-vous identifiée ?"
echo "1) Nginx"
echo "2) Apache"
echo "3) Node.js/Express"
echo "4) Autre"
echo ""

read -p "Votre choix (1-4): " choice

case $choice in
    1)
        echo "🌐 Déploiement Nginx..."

        # Upload du fichier
        echo "📤 Upload privacy.html..."
        scp $LOCAL_FILE $VPS_USER@$VPS_IP:/tmp/

        ssh $VPS_USER@$VPS_IP << 'ENDSSH'
        # Trouver le répertoire web
        WEB_ROOT=""
        if [ -d "/var/www/html" ]; then
            WEB_ROOT="/var/www/html"
        elif [ -d "/var/www/claudyne.com" ]; then
            WEB_ROOT="/var/www/claudyne.com"
        elif [ -d "/usr/share/nginx/html" ]; then
            WEB_ROOT="/usr/share/nginx/html"
        else
            echo "❌ Impossible de trouver le répertoire web"
            exit 1
        fi

        echo "📁 Répertoire web détecté: $WEB_ROOT"

        # Copier le fichier
        cp /tmp/privacy.html $WEB_ROOT/
        chmod 644 $WEB_ROOT/privacy.html
        chown www-data:www-data $WEB_ROOT/privacy.html 2>/dev/null || chown nginx:nginx $WEB_ROOT/privacy.html 2>/dev/null

        echo "✅ Fichier déployé dans $WEB_ROOT/privacy.html"

        # Vérifier la configuration Nginx
        nginx -t
        if [ $? -eq 0 ]; then
            systemctl reload nginx
            echo "✅ Nginx rechargé avec succès"
        else
            echo "⚠️ Erreur configuration Nginx"
        fi
ENDSSH
        ;;

    2)
        echo "🌐 Déploiement Apache..."

        # Upload du fichier
        echo "📤 Upload privacy.html..."
        scp $LOCAL_FILE $VPS_USER@$VPS_IP:/tmp/

        ssh $VPS_USER@$VPS_IP << 'ENDSSH'
        # Trouver le répertoire web
        WEB_ROOT=""
        if [ -d "/var/www/html" ]; then
            WEB_ROOT="/var/www/html"
        elif [ -d "/var/www/claudyne.com" ]; then
            WEB_ROOT="/var/www/claudyne.com"
        else
            echo "❌ Impossible de trouver le répertoire web"
            exit 1
        fi

        echo "📁 Répertoire web détecté: $WEB_ROOT"

        # Copier le fichier
        cp /tmp/privacy.html $WEB_ROOT/
        chmod 644 $WEB_ROOT/privacy.html
        chown www-data:www-data $WEB_ROOT/privacy.html

        echo "✅ Fichier déployé dans $WEB_ROOT/privacy.html"

        # Recharger Apache
        systemctl reload apache2
        echo "✅ Apache rechargé avec succès"
ENDSSH
        ;;

    3)
        echo "🟢 Déploiement Node.js..."

        # Upload du fichier
        echo "📤 Upload privacy.html..."
        scp $LOCAL_FILE $VPS_USER@$VPS_IP:/tmp/

        ssh $VPS_USER@$VPS_IP << 'ENDSSH'
        # Trouver l'application Node.js
        NODE_APP=""
        if [ -d "/opt/claudyne" ]; then
            NODE_APP="/opt/claudyne"
        elif [ -d "/home/claudyne" ]; then
            NODE_APP="/home/claudyne"
        elif [ -d "/var/www/claudyne" ]; then
            NODE_APP="/var/www/claudyne"
        else
            echo "❌ Impossible de trouver l'application Node.js"
            exit 1
        fi

        echo "📁 Application Node.js détectée: $NODE_APP"

        # Copier le fichier
        cp /tmp/privacy.html $NODE_APP/public/ 2>/dev/null || cp /tmp/privacy.html $NODE_APP/

        echo "✅ Fichier déployé dans $NODE_APP"

        # Redémarrer l'application
        pm2 restart claudyne 2>/dev/null || systemctl restart claudyne 2>/dev/null || echo "⚠️ Redémarrage manuel requis"
        echo "✅ Application redémarrée"
ENDSSH
        ;;

    *)
        echo "❌ Choix invalide"
        exit 1
        ;;
esac

echo ""
echo "🧪 Test d'accessibilité..."

# Test de connectivité
echo "📡 Test connexion serveur..."
ping -c 2 $VPS_IP

echo ""
echo "🌐 Test HTTPS..."
curl -I https://$DOMAIN/privacy 2>/dev/null || echo "❌ HTTPS non accessible"

echo ""
echo "🌐 Test HTTP..."
curl -I http://$DOMAIN/privacy 2>/dev/null || echo "❌ HTTP non accessible"

echo ""
echo "✅ DÉPLOIEMENT TERMINÉ !"
echo ""
echo "📋 VÉRIFICATIONS À EFFECTUER :"
echo "1. Tester: https://claudyne.com/privacy"
echo "2. Valider: Le contenu s'affiche correctement"
echo "3. Vérifier: Les liens de navigation fonctionnent"
echo "4. Contrôler: Le design responsive sur mobile"
echo ""
echo "🎯 PROCHAINES ÉTAPES :"
echo "1. Mettre à jour app.json de l'app mobile"
echo "2. Valider dans Google Play Console"
echo "3. Publier l'application mobile"
echo ""
echo "🇨🇲 Honneur à Ma'a Meffo TCHANDJIO Claudine !"