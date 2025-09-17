# 🚀 Guide de Déploiement Claudyne Production

## VPS Contabo - Configuration Complète

### 📋 Prérequis

#### VPS Recommandé
- **CPU**: 4 vCores minimum
- **RAM**: 8 GB minimum
- **Stockage**: 200 GB SSD
- **Bande passante**: Illimitée
- **OS**: Ubuntu 22.04 LTS

#### Domaine
- Domaine acheté et configuré (ex: claudyne.com)
- DNS pointant vers l'IP du VPS
- Sous-domaine www configuré

---

## 🔧 Installation Rapide

### 1. Connexion au VPS

```bash
# Connexion SSH à votre VPS Contabo
ssh root@VOTRE_IP_VPS

# Mise à jour du système
apt update && apt upgrade -y

# Installation des dépendances de base
apt install -y curl git ufw fail2ban htop
```

### 2. Configuration Utilisateur

```bash
# Créer un utilisateur pour Claudyne (plus sécurisé que root)
adduser claudyne
usermod -aG sudo claudyne

# Basculer vers l'utilisateur claudyne
su - claudyne

# Générer une clé SSH (optionnel)
ssh-keygen -t rsa -b 4096 -C "admin@claudyne.com"
```

### 3. Cloner le Projet

```bash
# Cloner Claudyne depuis votre repository
git clone https://github.com/votre-compte/claudyne.git
cd claudyne

# Ou télécharger l'archive si pas de Git
# wget https://claudyne.com/releases/claudyne-production.tar.gz
# tar -xzf claudyne-production.tar.gz && cd claudyne
```

### 4. Configuration Environnement

```bash
# Copier le fichier d'environnement
cp .env.production .env

# IMPORTANT: Éditer le fichier avec vos vraies valeurs
nano .env
```

#### Variables Critiques à Modifier

```bash
# Sécurité (CHANGEZ OBLIGATOIREMENT)
JWT_SECRET=VOTRE_CLE_JWT_TRES_SECRETE_PRODUCTION_2024
POSTGRES_PASSWORD=VOTRE_MOT_DE_PASSE_POSTGRES_SECURISE
REDIS_PASSWORD=VOTRE_MOT_DE_PASSE_REDIS_SECURISE

# Domaine
DOMAIN=claudyne.com
CERTBOT_EMAIL=admin@claudyne.com

# MAVIANCE (Production)
MAVIANCE_API_KEY=VOTRE_VRAIE_CLE_MAVIANCE
MAVIANCE_SECRET_KEY=VOTRE_VRAIE_CLE_SECRETE_MAVIANCE
MAVIANCE_MERCHANT_ID=VOTRE_VRAI_ID_MARCHAND

# Monitoring (optionnel)
SENTRY_DSN=VOTRE_CLE_SENTRY_POUR_MONITORING_ERREURS
```

### 5. Déploiement Automatique

```bash
# Lancer le script de déploiement automatique
./deploy.sh
```

Le script va automatiquement :
- ✅ Installer Docker et Docker Compose
- ✅ Configurer le firewall UFW
- ✅ Obtenir les certificats SSL Let's Encrypt
- ✅ Optimiser le système pour les réseaux Cameroun
- ✅ Démarrer tous les services
- ✅ Configurer les sauvegardes automatiques

### 6. Optimisations Cameroun

```bash
# Appliquer les optimisations spécifiques réseaux 2G/3G
./optimize-cameroon.sh
```

---

## 🔒 Sécurisation Production

### Firewall UFW

```bash
# Le script configure déjà UFW, mais voici les règles :
sudo ufw status

# Règles actives :
# 22/tcp (SSH)
# 80/tcp (HTTP)
# 443/tcp (HTTPS)
```

### Fail2Ban

```bash
# Configuration anti-brute force
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Vérifier le statut
sudo fail2ban-client status
```

### Mots de Passe Forts

```bash
# Générer des mots de passe sécurisés
openssl rand -base64 32  # Pour JWT_SECRET
openssl rand -base64 24  # Pour passwords DB
```

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
docker-compose exec postgres pg_dump -U claudyne_user claudyne_prod > backup-$(date +%Y%m%d).sql

# Sauvegarder les uploads
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz uploads/

# Sauvegarder la configuration
tar -czf config-backup-$(date +%Y%m%d).tar.gz .env nginx/ docker-compose.production.yml
```

### Restauration

```bash
# Restaurer la base de données
docker-compose exec -T postgres psql -U claudyne_user claudyne_prod < backup-20241216.sql

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
docker-compose exec postgres psql -U claudyne_user claudyne_prod

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