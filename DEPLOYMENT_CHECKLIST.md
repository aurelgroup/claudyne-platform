# 🚀 Checklist de Déploiement Sécurisé - Claudyne

## 📋 Pré-déploiement (Critique)

### 🔒 Sécurité
- [ ] **Variables d'environnement** : Mettre à jour `.env.production` avec vrais secrets
- [ ] **Secrets JWT** : Générer de nouveaux secrets pour production (`openssl rand -hex 32`)
- [ ] **Mots de passe BDD** : Changer les mots de passe PostgreSQL/Redis par défaut
- [ ] **Certificats SSL** : Vérifier validité et renouvellement auto Let's Encrypt
- [ ] **Firewall** : Configurer règles iptables/ufw (ports 80, 443, 22 uniquement)

### 🗄️ Base de données
- [ ] **Backup** : Créer sauvegarde complète avant déploiement
- [ ] **Migrations** : Vérifier les scripts de migration Sequelize
- [ ] **Connexions** : Tester connectivité PostgreSQL avec nouveaux credentials
- [ ] **Permissions** : Vérifier droits utilisateur database (pas de superuser)

### 🛠️ Infrastructure
- [ ] **Monitoring** : Configurer Prometheus/Grafana pour surveillance
- [ ] **Alertes email** : Tester notifications administrateur
- [ ] **Logs** : Vérifier rotation et rétention des logs (/var/log/claudyne/)
- [ ] **Espace disque** : Minimum 20GB libres sur partition système

## 🚀 Déploiement

### 1️⃣ Préparation serveur
```bash
# 1. Connexion serveur
ssh root@89.117.58.53

# 2. Mise à jour système
apt update && apt upgrade -y

# 3. Installation dépendances
apt install -y docker.io docker-compose nginx certbot python3-certbot-nginx

# 4. Vérification services
systemctl status docker nginx
```

### 2️⃣ Configuration environnement
```bash
# 1. Créer variables production sécurisées
export POSTGRES_PASSWORD=$(openssl rand -hex 16)
export REDIS_PASSWORD=$(openssl rand -hex 16)
export JWT_SECRET=$(openssl rand -hex 32)
export JWT_REFRESH_SECRET=$(openssl rand -hex 32)
export ENCRYPTION_KEY=$(openssl rand -hex 32)

# 2. Sauvegarder dans fichier sécurisé
echo "# Variables production Claudyne - $(date)" > /root/.claudyne-secrets
echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD" >> /root/.claudyne-secrets
echo "REDIS_PASSWORD=$REDIS_PASSWORD" >> /root/.claudyne-secrets
echo "JWT_SECRET=$JWT_SECRET" >> /root/.claudyne-secrets
echo "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET" >> /root/.claudyne-secrets
echo "ENCRYPTION_KEY=$ENCRYPTION_KEY" >> /root/.claudyne-secrets
chmod 600 /root/.claudyne-secrets
```

### 3️⃣ Déploiement application
```bash
# 1. Clone/pull du code
cd /opt
git clone https://github.com/aurelgroup/claudyne-platform.git claudyne
cd claudyne
git checkout security-improvements-20250927

# 2. Configuration environnement
source /root/.claudyne-secrets
cp .env.production .env
# Éditer .env avec les vraies valeurs

# 3. Build et lancement
docker-compose -f docker-compose.production.yml up -d --build

# 4. Vérification services
docker-compose ps
docker-compose logs -f backend
```

### 4️⃣ Configuration Nginx
```bash
# 1. Copier configuration optimisée
cp nginx-claudyne-config.txt /etc/nginx/sites-available/claudyne
ln -sf /etc/nginx/sites-available/claudyne /etc/nginx/sites-enabled/

# 2. Tester configuration
nginx -t

# 3. Certificat SSL
certbot --nginx -d claudyne.com -d www.claudyne.com

# 4. Recharger Nginx
systemctl reload nginx
```

## ✅ Post-déploiement (Validation)

### 🔍 Tests fonctionnels
- [ ] **Page d'accueil** : https://claudyne.com → 200 OK
- [ ] **API Health** : https://claudyne.com/api/health → JSON response
- [ ] **Admin interface** : https://claudyne.com/admin → Login form
- [ ] **Mobile download** : https://claudyne.com/download/claudyne.apk → APK file

### 🛡️ Tests sécurité
- [ ] **SSL Grade** : Test https://ssllabs.com/ → Grade A/A+
- [ ] **Headers sécurité** : Vérifier HSTS, CSP, X-Frame-Options
- [ ] **Scan ports** : `nmap claudyne.com` → Seuls 80,443 ouverts
- [ ] **Authentification** : Test login admin avec nouveau mot de passe

### 📊 Monitoring
- [ ] **Métriques** : Accès Grafana dashboards
- [ ] **Logs** : Vérifier `/var/log/claudyne/` et rotation
- [ ] **Alertes** : Test notification email/webhook
- [ ] **Performance** : Temps de réponse < 2s pages principales

## 🚨 Actions post-déploiement obligatoires

### 🔐 Sécurité immédiate
1. **Changer mot de passe root** serveur
2. **Créer utilisateur non-root** pour déploiements futurs
3. **Configurer fail2ban** contre bruteforce SSH
4. **Activer 2FA admin** interface Claudyne

### 📋 Documentation
1. **Sauvegarder secrets** dans gestionnaire mot de passe équipe
2. **Documenter procédures** backup/restore
3. **Créer runbook** incidents de sécurité
4. **Former équipe** nouveaux outils monitoring

## 🆘 Rollback d'urgence

En cas de problème critique :

```bash
# 1. Arrêter nouveaux services
docker-compose down

# 2. Restaurer backup BDD
psql -U claudyne_user claudyne_prod < backup_pre_deployment.sql

# 3. Revenir version précédente
git checkout main
docker-compose up -d

# 4. Vérifier fonctionnement
curl -I https://claudyne.com
```

## 📞 Contacts d'urgence

- **Lead technique** : [À définir]
- **Infra/DevOps** : [À définir]
- **Support hébergeur** : [Support VPS]
- **Registrar domaine** : [Support domaine]

---

🤖 **Généré avec Claude Code**
*La force du savoir en héritage* 👨‍👩‍👧‍👦