# 🚀 Guide de Déploiement Claudyne sur Contabo VPS

> **"La force du savoir en héritage"**  
> En hommage à **Meffo Mehtah Tchandjio Claudine** 👨‍👩‍👧‍👦

---

## 📋 Prérequis

### 🖥️ Serveur Contabo VPS 10
- **CPU**: 3 vCPU  
- **RAM**: 8GB  
- **Stockage**: 75GB NVMe SSD  
- **OS**: Ubuntu 24.04 LTS  
- **IP**: Votre IP publique Contabo  

### 🌐 Domaine
- **Domaine**: claudyne.com (ou votre domaine)  
- **DNS**: Configuré pour pointer vers l'IP Contabo  
- **Email**: Adresse email valide pour Let's Encrypt  

---

## 🎯 Déploiement en 4 étapes

### ÉTAPE 1: Configuration initiale du serveur

```bash
# 1. Connectez-vous à votre VPS Contabo
ssh root@VOTRE_IP_CONTABO

# 2. Uploadez et exécutez le script de configuration
wget https://raw.githubusercontent.com/votre-username/claudyne-platform/main/deploy-scripts/contabo-setup.sh
chmod +x contabo-setup.sh
./contabo-setup.sh
```

**✅ Ce script installe automatiquement:**
- Node.js 18.x + NPM
- PostgreSQL 15 avec base `claudyne_production`  
- Redis Server
- Nginx + Certbot
- Firewall UFW configuré
- Utilisateur `claudyne`

---

### ÉTAPE 2: Déploiement de l'application

```bash
# 1. Basculer vers l'utilisateur claudyne
su - claudyne

# 2. Déployer l'application
cd /var/www/claudyne
wget https://raw.githubusercontent.com/votre-username/claudyne-platform/main/deploy-scripts/deploy-app.sh
chmod +x deploy-app.sh

# 3. IMPORTANT: Éditez le script pour configurer votre repository GitHub
nano deploy-app.sh
# Changez: GITHUB_REPO="https://github.com/VOTRE-USERNAME/claudyne-platform.git"

# 4. Exécuter le déploiement
./deploy-app.sh
```

**✅ Ce script:**
- Clone le projet depuis GitHub
- Installe toutes les dépendances  
- Configure les variables d'environnement
- Lance PM2 avec 2 instances frontend + 1 backend
- Configure le démarrage automatique

---

### ÉTAPE 3: Configuration Nginx + SSL

```bash
# 1. Revenir en tant que root
exit

# 2. Configurer Nginx et SSL
cd /var/www/claudyne/claudyne-platform/deploy-scripts
chmod +x setup-nginx.sh

# 3. IMPORTANT: Éditez le script pour votre domaine et email
nano setup-nginx.sh
# Changez: DOMAIN="claudyne.com"
# Changez: EMAIL="votre-email@domain.com"

# 4. Exécuter la configuration
./setup-nginx.sh
```

**✅ Ce script:**
- Configure Nginx comme reverse proxy
- Obtient le certificat SSL Let's Encrypt
- Configure le renouvellement automatique
- Active HTTPS avec redirection

---

### ÉTAPE 4: Vérification et tests

```bash
# 1. Vérifier tous les services
cd /var/www/claudyne/claudyne-platform/deploy-scripts
chmod +x monitor.sh
./monitor.sh

# 2. Tester l'accès
curl https://claudyne.com
curl https://claudyne.com/admin
curl https://claudyne.com/api/health
```

---

## 🔧 Configuration DNS (PlanetHoster)

Dans votre panneau PlanetHoster, configurez:

```dns
Type    Nom         Valeur              TTL
A       @           VOTRE_IP_CONTABO    3600
A       www         VOTRE_IP_CONTABO    3600
A       api         VOTRE_IP_CONTABO    3600
CNAME   admin       claudyne.com        3600
CNAME   student     claudyne.com        3600
```

**Vérification DNS:**
```bash
nslookup claudyne.com
nslookup www.claudyne.com
```

---

## 📊 Interfaces Accessibles

| Interface | URL | Description |
|-----------|-----|-------------|
| 🏠 **Principale** | https://claudyne.com | Page d'accueil |
| 👨‍💼 **Admin** | https://claudyne.com/admin | Interface d'administration |
| 🎓 **Étudiant** | https://claudyne.com/student | Interface étudiante |
| 🔗 **API** | https://claudyne.com/api | Backend API |
| 📴 **Offline** | https://claudyne.com/offline | Page hors ligne |

---

## 🛠️ Commandes de maintenance

### Scripts automatisés fournis:

```bash
cd /var/www/claudyne/claudyne-platform/deploy-scripts

# 📊 Monitoring système
./monitor.sh

# 🔄 Mise à jour de l'application  
su - claudyne
./update.sh

# 💾 Sauvegarde complète
sudo ./backup.sh
```

### Commandes PM2 essentielles:

```bash
# En tant qu'utilisateur claudyne
pm2 status              # Statut des processus
pm2 logs                # Logs en temps réel
pm2 monit              # Monitoring interactif
pm2 restart all        # Redémarrer tous les services
pm2 reload all         # Rechargement à chaud
pm2 stop all           # Arrêter tous les services
pm2 save               # Sauvegarder la config
```

### Gestion des services système:

```bash
# Services système (en tant que root)
systemctl status nginx postgresql redis-server
systemctl restart nginx
systemctl reload nginx

# Logs système
tail -f /var/log/nginx/claudyne.com.access.log
tail -f /var/log/nginx/claudyne.com.error.log
```

---

## 🔒 Sécurité

### Firewall UFW configuré:
```bash
ufw status  # Vérifier le statut
# Ports ouverts: 22 (SSH), 80 (HTTP), 443 (HTTPS)
```

### SSL Let's Encrypt:
```bash
certbot certificates     # Voir les certificats
certbot renew --dry-run  # Tester le renouvellement
```

### Variables d'environnement sécurisées:
- Fichiers `.env` avec permissions 600
- Mots de passe forts générés automatiquement
- JWT secrets aléatoires

---

## 💾 Sauvegardes automatiques

### Configuration automatique:
```bash
# Sauvegarde quotidienne à 2h du matin
crontab -l  # Voir les tâches programmées
```

### Sauvegardes incluses:
- 🗄️ Base de données PostgreSQL
- 📦 Code source (sans node_modules)
- 🌐 Configuration Nginx
- 🔒 Certificats SSL
- ⚙️ Configuration PM2

### Localisation: `/var/backups/claudyne/`

---

## 🚨 Dépannage

### Problèmes courants:

**1. Site inaccessible:**
```bash
# Vérifier les services
systemctl status nginx
pm2 status
./monitor.sh
```

**2. Erreur SSL:**
```bash
# Vérifier le certificat
certbot certificates
# Renouveler si nécessaire
certbot renew
```

**3. Application ne démarre pas:**
```bash
# Voir les logs d'erreur
pm2 logs
tail -f /var/www/claudyne/claudyne-platform/logs/frontend-err.log
```

**4. Base de données inaccessible:**
```bash
sudo -u postgres psql -l
sudo systemctl status postgresql
```

### Redémarrage complet:
```bash
# Redémarrage de tous les services
sudo systemctl restart postgresql redis-server nginx
su - claudyne -c "pm2 restart all"
```

---

## 🔄 Mises à jour

### Mise à jour automatique de l'application:
```bash
su - claudyne
cd /var/www/claudyne/claudyne-platform
./deploy-scripts/update.sh
```

### Mise à jour du système:
```bash
apt update && apt upgrade -y
```

---

## 📞 Support

### Logs importants:
- **Application**: `/var/www/claudyne/claudyne-platform/logs/`
- **Nginx**: `/var/log/nginx/claudyne.com.*`
- **Système**: `/var/log/syslog`

### Monitoring en temps réel:
```bash
# Monitoring système
htop

# Monitoring application
pm2 monit

# Monitoring réseau
netstat -tulpn | grep -E ':80|:443|:3000|:3001'
```

---

## ✅ Checklist Post-Déploiement

- [ ] ✅ Serveur configuré avec tous les services
- [ ] ✅ Application déployée et fonctionnelle  
- [ ] ✅ DNS configuré et propagé
- [ ] ✅ SSL actif avec certificat valide
- [ ] ✅ Toutes les interfaces accessibles
- [ ] ✅ PM2 configuré avec démarrage automatique
- [ ] ✅ Sauvegardes automatiques programmées
- [ ] ✅ Monitoring fonctionnel
- [ ] ✅ Scripts de maintenance prêts

---

<div align="center">

## 🎉 Félicitations !

**Claudyne est maintenant en production sur votre VPS Contabo!** 🎓

### La force du savoir en héritage ✨

*En hommage à Meffo Mehtah Tchandjio Claudine* 👨‍👩‍👧‍👦

---

**Claudyne est prêt à révolutionner l'éducation camerounaise!**

</div>