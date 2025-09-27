# 🔄 Guide de Migration Claudyne - Sauvegarde + Déploiement Frais

> **"La force du savoir en héritage"**  
> En hommage à **Meffo Mehtah Tchandjio Claudine** 👨‍👩‍👧‍👦

---

## 🎯 Objectif

Migrer votre installation Claudyne existante vers la nouvelle version avec :
- ✅ **Sauvegarde complète** de l'existant
- ✅ **Nettoyage propre** de l'ancien système  
- ✅ **Déploiement frais** avec les nouveaux scripts

---

## ⚠️ IMPORTANT - Prérequis

### Avant de commencer :
1. **Accès SSH** à votre VPS Contabo
2. **Droits root** sur le serveur
3. **Repository GitHub** mis à jour avec les nouveaux scripts
4. **DNS** pointant vers votre IP
5. **Email valide** pour Let's Encrypt

### ⏰ Temps d'indisponibilité estimé : **15-30 minutes**

---

## 🚀 Procédure de Migration

### ÉTAPE 1: Connexion et préparation

```bash
# 1. Connectez-vous à votre VPS
ssh root@VOTRE_IP_CONTABO

# 2. Téléchargez le script de migration
cd /tmp
wget https://raw.githubusercontent.com/VOTRE-USERNAME/claudyne-platform/main/deploy-scripts/migration-fresh.sh
chmod +x migration-fresh.sh

# 3. Vérifiez le contenu du script (optionnel)
less migration-fresh.sh
```

### ÉTAPE 2: Exécution de la migration

```bash
# Lancer la migration avec sauvegarde
./migration-fresh.sh
```

**🔒 Le script vous demandera une confirmation** - tapez `OUI` en majuscules

### ÉTAPE 3: Déploiement de la nouvelle application

```bash
# 1. Basculer vers l'utilisateur claudyne
su - claudyne

# 2. Aller dans le nouveau répertoire
cd /var/www/claudyne

# 3. Télécharger et configurer le script de déploiement
wget https://raw.githubusercontent.com/VOTRE-USERNAME/claudyne-platform/main/deploy-scripts/deploy-app.sh
chmod +x deploy-app.sh

# 4. IMPORTANT: Modifier le repository GitHub dans le script
nano deploy-app.sh
# Changez la ligne: GITHUB_REPO="https://github.com/VOTRE-USERNAME/claudyne-platform.git"

# 5. Exécuter le déploiement
./deploy-app.sh
```

### ÉTAPE 4: Configuration Nginx + SSL

```bash
# 1. Revenir en tant que root
exit

# 2. Télécharger le script Nginx
cd /var/www/claudyne/claudyne-platform/deploy-scripts
wget https://raw.githubusercontent.com/VOTRE-USERNAME/claudyne-platform/main/deploy-scripts/setup-nginx.sh
chmod +x setup-nginx.sh

# 3. IMPORTANT: Configurer votre domaine et email
nano setup-nginx.sh
# Changez: DOMAIN="claudyne.com"
# Changez: EMAIL="votre-email@domain.com"

# 4. Exécuter la configuration
./setup-nginx.sh
```

### ÉTAPE 5: Vérification finale

```bash
# 1. Télécharger le script de monitoring
wget https://raw.githubusercontent.com/VOTRE-USERNAME/claudyne-platform/main/deploy-scripts/monitor.sh
chmod +x monitor.sh

# 2. Exécuter la vérification complète
./monitor.sh

# 3. Tests manuels
curl https://claudyne.com
curl https://claudyne.com/admin
curl https://claudyne.com/student
```

---

## 📊 Ce que fait le script de migration

### 🔒 PHASE 1: Sauvegarde (automatique)
- ✅ **Base de données PostgreSQL** (dump complet)
- ✅ **Répertoire /var/www/claudyne** (archive complète)
- ✅ **Configuration Nginx** (sites-available/sites-enabled)
- ✅ **Certificats SSL** Let's Encrypt
- ✅ **Logs système** importants
- ✅ **Rapport de sauvegarde** détaillé

### 🧹 PHASE 2: Nettoyage (automatique)
- ✅ **Arrêt PM2** et suppression des processus
- ✅ **Suppression /var/www/claudyne**
- ✅ **Nettoyage configuration Nginx**
- ✅ **Arrêt processus Node.js** résiduels

### 🚀 PHASE 3: Préparation (automatique)
- ✅ **Nouveau répertoire** /var/www/claudyne
- ✅ **Permissions correctes** pour utilisateur claudyne
- ✅ **Prêt pour déploiement** frais

---

## 💾 Localisation des Sauvegardes

```bash
# Les sauvegardes sont dans :
/var/backups/claudyne-migration-YYYYMMDD_HHMMSS/

# Contenu :
├── postgresql-full-backup.sql      # Base complète PostgreSQL
├── claudyne_production-backup.sql        # Base claudyne_production seule
├── claudyne-app-backup.tar.gz      # Application complète
├── nginx-config-backup.tar.gz      # Configuration Nginx
├── ssl-certificates-backup.tar.gz  # Certificats SSL
├── logs/                           # Logs système
└── RAPPORT_SAUVEGARDE.md           # Guide de restauration
```

---

## 🚨 Restauration d'Urgence

Si quelque chose se passe mal, vous pouvez tout restaurer :

```bash
# 1. Aller dans le répertoire de sauvegarde
cd /var/backups/claudyne-migration-YYYYMMDD_HHMMSS/

# 2. Restaurer la base de données
sudo -u postgres psql < postgresql-full-backup.sql

# 3. Restaurer l'application
cd /var/www && tar -xzf /var/backups/claudyne-migration-*/claudyne-app-backup.tar.gz

# 4. Restaurer Nginx
tar -xzf nginx-config-backup.tar.gz -C /
systemctl reload nginx

# 5. Restaurer SSL
tar -xzf ssl-certificates-backup.tar.gz -C /

# 6. Redémarrer les services
systemctl restart nginx
su - claudyne -c "cd /var/www/claudyne/claudyne-platform && pm2 start ecosystem.config.js"
```

---

## ✅ Checklist Post-Migration

### Vérifications obligatoires :

- [ ] ✅ **Site accessible** : https://claudyne.com
- [ ] ✅ **Interface admin** : https://claudyne.com/admin  
- [ ] ✅ **Interface étudiant** : https://claudyne.com/student
- [ ] ✅ **API backend** : https://claudyne.com/api (si applicable)
- [ ] ✅ **SSL valide** : Certificat Let's Encrypt actif
- [ ] ✅ **PM2 fonctionnel** : `pm2 status` affiche les processus
- [ ] ✅ **Services système** : Nginx, PostgreSQL, Redis actifs
- [ ] ✅ **Logs sans erreurs** : `pm2 logs` propre
- [ ] ✅ **Monitoring OK** : `./monitor.sh` tout vert

### Tests fonctionnels :

- [ ] ✅ **Pages se chargent** rapidement
- [ ] ✅ **Service Worker** actif (PWA)
- [ ] ✅ **Mode offline** fonctionnel
- [ ] ✅ **Responsive design** sur mobile
- [ ] ✅ **Base de données** accessible (si applicable)

---

## 🔧 Maintenance Post-Migration

### Scripts de maintenance disponibles :

```bash
cd /var/www/claudyne/claudyne-platform/deploy-scripts

# Monitoring système
./monitor.sh

# Mise à jour future
su - claudyne -c "./update.sh"

# Sauvegarde régulière  
./backup.sh

# Tous les scripts sont maintenant disponibles !
```

### Configuration des sauvegardes automatiques :

```bash
# Programmer une sauvegarde quotidienne
echo "0 2 * * * /var/www/claudyne/claudyne-platform/deploy-scripts/backup.sh" | crontab -
```

---

## ⚡ Avantages de cette Migration

### ✅ **Sécurité Maximum**
- Sauvegarde complète avant toute modification
- Possibilité de rollback instantané
- Aucune perte de données

### ✅ **Déploiement Propre**  
- Installation fraîche et optimisée
- Scripts de déploiement standardisés
- Configuration cohérente

### ✅ **Maintenance Simplifiée**
- Scripts de monitoring automatiques
- Mise à jour centralisées  
- Sauvegardes programmables

---

## 📞 Support

### En cas de problème :

1. **Consultez les logs** : `./monitor.sh`
2. **Vérifiez la sauvegarde** : `/var/backups/claudyne-migration-*/RAPPORT_SAUVEGARDE.md`  
3. **Restauration possible** : Suivez les instructions du rapport
4. **Logs détaillés** : `pm2 logs`, `/var/log/nginx/`

### Commandes de diagnostic :

```bash
# Statut complet du système
./monitor.sh

# Logs en temps réel
pm2 logs

# Services système
systemctl status nginx postgresql redis-server
```

---

<div align="center">

## 🎉 Migration Réussie !

**Claudyne nouvelle génération est maintenant déployé !** 🎓

### La force du savoir en héritage ✨

*En hommage à Meffo Mehtah Tchandjio Claudine* 👨‍👩‍👧‍👦

---

**Votre plateforme éducative est prête à changer l'éducation camerounaise !**

</div>