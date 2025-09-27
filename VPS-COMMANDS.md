# 🚀 COMMANDES VPS CONTABO - DÉPLOIEMENT CLAUDYNE

## Commandes Exactes à Exécuter

**VPS IP:** 89.117.58.53
**Domain:** claudyne.com
**User:** root

---

## 🔥 DÉPLOIEMENT EN 4 ÉTAPES

### Étape 1: Connexion et Préparation VPS

```bash
# 1. Se connecter au VPS
ssh root@89.117.58.53

# 2. Mettre à jour le système
apt update -qq && apt upgrade -y

# 3. Installer git si nécessaire
apt install -y git curl wget

# 4. Créer répertoire de déploiement
mkdir -p /tmp/claudyne-deploy
cd /tmp/claudyne-deploy
```

### Étape 2: Cloner le Projet

```bash
# Clone avec token GitHub
git clone https://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@github.com/aurelgroup/claudyne-platform.git .

# Ou copier depuis votre machine locale (alternative)
# scp -r * root@89.117.58.53:/tmp/claudyne-deploy/
```

### Étape 3: Rendre Exécutables et Valider

```bash
# Rendre les scripts exécutables
chmod +x *.sh

# Exécuter la validation pré-déploiement
./deploy-pre-check.sh
```

### Étape 4: Déploiement Production

```bash
# Option A: Déploiement automatique complet (RECOMMANDÉ)
./deploy-commands.sh auto

# Option B: Déploiement expert manuel
./deploy-production-expert.sh

# Option C: Menu interactif
./deploy-commands.sh
```

---

## 🎯 COMMANDES DE VÉRIFICATION

### Après Déploiement - Vérifier que Tout Fonctionne

```bash
# 1. Status des services
systemctl status nginx
systemctl status postgresql
systemctl status claudyne-monitor

# 2. Processus PM2
sudo -u claudyne pm2 status
sudo -u claudyne pm2 monit

# 3. Test des endpoints
curl -s http://localhost:3001/health | jq
curl -s http://localhost:3002/mobile-api/ping | jq

# 4. Test HTTPS (si SSL configuré)
curl -s https://claudyne.com/health | jq

# 5. Vérifier les logs
tail -f /var/log/claudyne/*.log
```

---

## 🔧 COMMANDES DE MAINTENANCE

### Redémarrage des Services

```bash
# Nginx
systemctl restart nginx
systemctl reload nginx

# PostgreSQL
systemctl restart postgresql

# Application PM2
sudo -u claudyne pm2 restart all
sudo -u claudyne pm2 reload all

# Monitoring
systemctl restart claudyne-monitor
```

### Vérification des Ressources

```bash
# Utilisation CPU/RAM
htop
top

# Espace disque
df -h

# Mémoire
free -h

# Processus réseau
ss -tulpn | grep -E ':(80|443|3001|3002|5432)'
```

### Logs et Monitoring

```bash
# Logs application
tail -f /var/log/claudyne/deploy.log
tail -f /var/log/claudyne/pm2-main.log
tail -f /var/log/claudyne/pm2-mobile.log

# Logs système
journalctl -f -u nginx
journalctl -f -u postgresql
journalctl -f -u claudyne-monitor

# Logs sécurité
tail -f /var/log/auth.log
tail -f /var/log/fail2ban.log
```

---

## 🚨 DÉPANNAGE RAPIDE

### Problème: Services ne démarrent pas

```bash
# Vérifier la configuration
nginx -t
sudo -u postgres psql -d claudyne_production -c "SELECT 1;"

# Redémarrer tout
systemctl restart nginx postgresql
sudo -u claudyne pm2 restart all
```

### Problème: SSL/HTTPS ne fonctionne pas

```bash
# Vérifier les certificats
certbot certificates
ls -la /etc/letsencrypt/live/claudyne.com/

# Renouveler si nécessaire
certbot renew --force-renewal
systemctl reload nginx
```

### Problème: Base de données inaccessible

```bash
# Vérifier PostgreSQL
systemctl status postgresql
sudo -u postgres psql -c "SELECT version();"

# Vérifier la connexion application
cat /opt/claudyne/current/.env | grep DB_
```

### Problème: Performance dégradée

```bash
# Vérifier les ressources
htop
iotop
nethogs

# Optimiser PM2
sudo -u claudyne pm2 restart all
sudo -u claudyne pm2 flush  # Nettoyer les logs
```

---

## 📊 COMMANDES DE MONITORING

### Health Checks Manuels

```bash
# API principale
curl -s https://claudyne.com/health | jq '.'

# API mobile
curl -s https://claudyne.com/mobile-api/ping | jq '.'

# Test complet des endpoints
curl -s https://claudyne.com/api | jq '.'
curl -s https://claudyne.com/api/subjects | jq '.data.subjects[0]'
```

### Métriques Système

```bash
# PM2 monitoring
sudo -u claudyne pm2 monit

# Utilisation ressources Docker (si utilisé)
docker stats

# Connexions réseau
ss -tuln | grep -E ':(80|443|3001|3002)'

# Processus par CPU
ps aux --sort=-%cpu | head -10

# Processus par mémoire
ps aux --sort=-%mem | head -10
```

---

## 🔄 ROLLBACK D'URGENCE

### En cas de problème critique

```bash
# 1. Aller au répertoire de rollback
cd /opt/claudyne/rollback

# 2. Voir les sauvegardes disponibles
ls -la

# 3. Restaurer la dernière version stable
BACKUP_ID=$(cat latest_rollback_id)
mv /opt/claudyne/current /opt/claudyne/current-failed
cp -r ${BACKUP_ID}-app /opt/claudyne/current
chown -R claudyne:claudyne /opt/claudyne/current

# 4. Redémarrer les services
sudo -u claudyne pm2 restart all
systemctl reload nginx

# 5. Vérifier que tout remarche
curl -s https://claudyne.com/health
```

---

## ✅ CHECKLIST POST-DÉPLOIEMENT

### Validation Immédiate (à faire dans l'ordre)

```bash
# 1. Services système
systemctl is-active nginx postgresql claudyne-monitor

# 2. Processus application
sudo -u claudyne pm2 list

# 3. Ports réseau
ss -tulpn | grep -E ':(80|443|3001|3002|5432)'

# 4. Endpoints HTTP
curl -I http://localhost:3001/health
curl -I http://localhost:3002/mobile-api/ping

# 5. HTTPS (après configuration SSL)
curl -I https://claudyne.com/health

# 6. Base de données
sudo -u postgres psql -d claudyne_production -c "SELECT count(*) FROM pg_tables;"
```

### Tests Fonctionnels

```bash
# Test API complète
curl -s https://claudyne.com/api/subjects | jq '.success'

# Test authentification (avec token valide)
curl -H "Authorization: Bearer YOUR_TOKEN" https://claudyne.com/api/families/profile

# Test interface admin
curl -I https://claudyne.com/admin-secure-k7m9x4n2p8w5z1c6
```

---

## 🎯 COMMANDES DE SUCCESS

### Si tout fonctionne correctement, ces commandes doivent réussir :

```bash
# 1. Santé globale
curl -s https://claudyne.com/health | jq '.status' # doit retourner "healthy"

# 2. API opérationnelle
curl -s https://claudyne.com/api | jq '.message' # doit retourner le message de bienvenue

# 3. Mobile API active
curl -s https://claudyne.com/mobile-api/ping | jq '.mobile_api' # doit retourner "active"

# 4. SSL Grade A+
echo | openssl s_client -servername claudyne.com -connect claudyne.com:443 2>/dev/null | openssl x509 -noout -subject

# 5. Tous les services up
systemctl is-active nginx postgresql claudyne-monitor pm2-claudyne
```

---

## 🚀 RÉSUMÉ DÉPLOIEMENT RÉUSSI

### Si vous voyez ces résultats, le déploiement est RÉUSSI :

```bash
✅ nginx: active
✅ postgresql: active
✅ claudyne-monitor: active
✅ PM2: 2+ processes online
✅ curl https://claudyne.com/health returns status: "healthy"
✅ SSL certificate valid
✅ All ports responding (80, 443, 3001, 3002)
```

### 🎉 FÉLICITATIONS !

**Claudyne est maintenant déployé avec succès sur votre VPS Contabo !**

🇨🇲 **La force du savoir en héritage est accessible aux familles camerounaises !**

---

*En hommage à Meffo Mehtah Tchandjio Claudine*
*Expert DevOps Deployment - Zero Error Approach*