# 🚀 CLAUDYNE PRODUCTION DEPLOYMENT GUIDE

## Expert DevOps Deployment pour VPS Contabo

**Version:** 2.0.0
**Date:** 2025-09-27
**Target:** Production Zero-Downtime
**Platform:** Ubuntu/Debian VPS

---

## 📋 INFORMATIONS DE DÉPLOIEMENT

### 🖥️ Infrastructure
- **VPS IP:** 89.117.58.53
- **Provider:** Contabo VPS
- **Domain:** claudyne.com
- **OS:** Ubuntu/Debian
- **Access:** SSH Root

### 🔑 Authentification
- **SSH:** Key-based authentication
- **GitHub:** Token access
- **Repository:** https://github.com/aurelgroup/claudyne-platform
- **Token:** YOUR_GITHUB_TOKEN_HERE

### 🎯 URLs Finales
- **Frontend:** https://claudyne.com
- **API:** https://claudyne.com/api
- **Mobile API:** https://claudyne.com/mobile-api
- **Health Check:** https://claudyne.com/health
- **Admin Panel:** https://claudyne.com/admin-secure-k7m9x4n2p8w5z1c6

---

## 🚀 DÉPLOIEMENT RAPIDE (RECOMMANDÉ)

### Option 1: Déploiement Automatique Complet

```bash
# 1. Rendre les scripts exécutables
chmod +x deploy-commands.sh

# 2. Exécuter le déploiement automatique
./deploy-commands.sh auto
```

### Option 2: Déploiement Interactif

```bash
# Lancer le menu interactif
./deploy-commands.sh

# Sélectionner l'option 9 pour déploiement complet
```

---

## 📚 DÉPLOIEMENT ÉTAPE PAR ÉTAPE

### Étape 1: Préparation Locale

```bash
# Vérifier les fichiers requis
ls -la deploy-*.sh
ls -la package.json server.js

# Tester la connectivité VPS
./deploy-commands.sh test
```

### Étape 2: Validation Pré-déploiement

```bash
# Exécuter les validations
./deploy-commands.sh
# Sélectionner option 5: Run Pre-deployment Checks
```

### Étape 3: Déploiement Principal

```bash
# Déploiement expert avec rollback
./deploy-commands.sh
# Sélectionner option 6: Run Main Deployment
```

### Étape 4: Vérification

```bash
# Vérifier le déploiement
./deploy-commands.sh health

# Statut des services
./deploy-commands.sh status
```

---

## 🔧 ARCHITECTURE DÉPLOYÉE

### Services Principaux
- **Nginx:** Reverse proxy + SSL/TLS
- **Node.js 18.x:** Application runtime
- **PostgreSQL 15:** Base de données production
- **PM2:** Process manager en cluster
- **Let's Encrypt:** Certificats SSL automatiques

### Ports Utilisés
- **80:** HTTP (redirect vers HTTPS)
- **443:** HTTPS (Nginx)
- **3001:** API Backend (PM2)
- **3002:** Mobile API (PM2)
- **5432:** PostgreSQL

### Structure Déployée
```
/opt/claudyne/
├── current/          # Application active
├── backups/          # Sauvegardes automatiques
├── rollback/         # Points de rollback
└── monitoring/       # Scripts de monitoring

/var/log/claudyne/    # Logs centralisés
├── deploy.log
├── pm2-main.log
├── pm2-mobile.log
└── health-*.json
```

---

## 🛡️ SÉCURITÉ IMPLÉMENTÉE

### Protection Nginx
- **Rate Limiting:** API (10 req/s), Mobile (20 req/s)
- **Headers sécurisés:** HSTS, CSP, X-Frame-Options
- **SSL Grade A+:** TLS 1.2/1.3, OCSP Stapling
- **DDoS Protection:** Fail2ban intégré

### Base de Données
- **Utilisateur dédié:** claudyne_user
- **Mot de passe sécurisé:** Généré automatiquement
- **Connexions limitées:** Pool de connexions optimisé
- **Sauvegarde automatique:** Incluse dans rollback

### Système
- **Firewall UFW:** Ports essentiels seulement
- **SSH Protection:** Fail2ban + rate limiting
- **Process isolation:** Utilisateur claudyne dédié
- **Monitoring:** Health checks en temps réel

---

## 📊 Monitoring et Maintenance

### Commandes Utiles

```bash
# Voir l'état des services
docker-compose -f docker-compose.production.yml ps

# Voir les logs en temps réel
docker-compose -f docker-compose.production.yml logs -f

# Redémarrer un service
docker-compose -f docker-compose.production.yml restart backend

# Voir l'utilisation des ressources
docker stats

# Monitoring système
htop
df -h
free -h
```

### Health Checks

```bash
# Vérifier que tout fonctionne
curl https://claudyne.com/health

# Test des interfaces
curl -I https://claudyne.com
curl -I https://claudyne.com/admin-interface.html
curl -I https://claudyne.com/parent-interface/

# Test API
curl https://claudyne.com/api/payments/subscriptions/plans
```

### Logs Important

```bash
# Logs application
tail -f /var/log/claudyne-cameroon.log

# Logs nginx
docker-compose logs -f nginx

# Logs base de données
docker-compose logs -f postgres

# Logs système
sudo journalctl -f
```

---

## 🔄 Mises à Jour

### Mise à Jour du Code

```bash
# Sauvegarder avant mise à jour
./backup.sh

# Mettre à jour le code
git pull origin main

# Redémarrer les services
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d --build
```

### Mise à Jour des Certificats SSL

```bash
# Manuel (ou automatique via cron)
./renew-ssl.sh

# Vérifier l'expiration
openssl x509 -in nginx/ssl/claudyne.com/fullchain.pem -text -noout | grep "Not After"
```

---

## 💾 Sauvegardes

### Sauvegarde Manuelle

```bash
# Sauvegarder la base de données
docker-compose exec postgres pg_dump -U claudyne_user claudyne_production > backup-$(date +%Y%m%d).sql

# Sauvegarder les uploads
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz uploads/

# Sauvegarder la configuration
tar -czf config-backup-$(date +%Y%m%d).tar.gz .env nginx/ docker-compose.production.yml
```

### Restauration

```bash
# Restaurer la base de données
docker-compose exec -T postgres psql -U claudyne_user claudyne_production < backup-20241216.sql

# Restaurer les uploads
tar -xzf uploads-backup-20241216.tar.gz
```

---

## 🔧 Dépannage

### Problèmes Courants

#### 1. Certificats SSL non obtenus

```bash
# Vérifier que le domaine pointe vers le serveur
dig claudyne.com

# Vérifier que le port 80 est ouvert
sudo ufw status
telnet claudyne.com 80

# Relancer l'obtention des certificats
docker run --rm -v "$(pwd)/nginx/ssl:/etc/letsencrypt" certbot/certbot certonly --manual -d claudyne.com
```

#### 2. Base de données non accessible

```bash
# Vérifier le statut PostgreSQL
docker-compose logs postgres

# Se connecter manuellement
docker-compose exec postgres psql -U claudyne_user claudyne_production

# Vérifier l'espace disque
df -h
```

#### 3. Performance dégradée

```bash
# Vérifier l'utilisation des ressources
docker stats

# Optimisations supplémentaires
./optimize-cameroon.sh

# Redémarrer avec nettoyage
docker system prune -f
docker-compose down && docker-compose up -d
```

#### 4. Paiements MAVIANCE non fonctionnels

```bash
# Vérifier la configuration
grep MAVIANCE .env

# Tester les APIs MAVIANCE
curl -X POST https://api.smobilpay.com/health

# Voir les logs de paiement
docker-compose logs backend | grep MAVIANCE
```

---

## 📱 Tests Mobile Cameroun

### Test MTN Mobile Money

```bash
# Interface de test (remplacez par un vrai numéro MTN)
curl -X POST https://claudyne.com/api/payments/initialize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "amount": 2500,
    "paymentMethod": "mtn_momo",
    "phone": "+237670123456",
    "type": "subscription",
    "planId": "premium_monthly"
  }'
```

### Test Orange Money

```bash
# Interface de test (remplacez par un vrai numéro Orange)
curl -X POST https://claudyne.com/api/payments/initialize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "amount": 2500,
    "paymentMethod": "orange_money",
    "phone": "+237690123456",
    "type": "subscription",
    "planId": "premium_monthly"
  }'
```

---

## 🎯 Performance Attendue

### Métriques Cibles Cameroun

- **Time to First Byte**: < 2s sur 2G
- **Page Load Time**: < 5s sur 3G
- **API Response Time**: < 1s
- **Uptime**: > 99.5%

### Surveillance Continue

```bash
# Monitoring automatique déjà configuré
tail -f /var/log/claudyne-cameroon.log

# Vérification manuelle performance
curl -w "@curl-format.txt" -o /dev/null -s https://claudyne.com
```

---

## 🆘 Support

### Contacts
- **Email**: admin@claudyne.com
- **Documentation**: https://claudyne.com/docs
- **Monitoring**: https://claudyne.com/status

### Logs pour Support

```bash
# Collecter les logs pour diagnostic
tar -czf claudyne-logs-$(date +%Y%m%d).tar.gz \
  /var/log/claudyne-cameroon.log \
  nginx/logs/ \
  docker-compose.production.yml \
  .env
```

---

## 🎉 Félicitations !

Si vous voyez ceci, **Claudyne est maintenant déployé en production** !

🇨🇲 **Optimisé pour le Cameroun** avec support complet MTN/Orange Money

💚 *"La force du savoir en héritage"* - En hommage à Meffo Mehtah Tchandjio Claudine

---

### Prochaines Étapes Recommandées

1. **Tester toutes les interfaces** sur mobile 2G/3G
2. **Configurer les vraies clés MAVIANCE** pour les paiements
3. **Former les utilisateurs** sur les nouvelles fonctionnalités
4. **Mettre en place la surveillance** continue
5. **Planifier les sauvegardes** régulières

**Claudyne est maintenant prêt à transformer l'éducation au Cameroun ! 🚀**