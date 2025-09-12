# 📁 Scripts de Déploiement Claudyne

> En hommage à **Meffo Mehtah Tchandjio Claudine** 👨‍👩‍👧‍👦

## 📄 Liste des Scripts

### 🔧 Configuration Serveur
- **`contabo-setup.sh`** - Configuration initiale du VPS Contabo
  - Installe Node.js, PostgreSQL, Redis, Nginx
  - Configure utilisateur et sécurité
  - ⚠️ **Exécuter en tant que root**

### 🚀 Déploiement
- **`deploy-app.sh`** - Déploiement de l'application Claudyne  
  - Clone le projet GitHub
  - Installe dépendances
  - Configure PM2
  - ⚠️ **Exécuter en tant qu'utilisateur claudyne**

### 🌐 Configuration Web
- **`setup-nginx.sh`** - Configuration Nginx + SSL
  - Configure reverse proxy
  - Obtient certificat Let's Encrypt
  - ⚠️ **Exécuter en tant que root**

### 🛠️ Maintenance
- **`monitor.sh`** - Monitoring système complet
  - Statut services, CPU, mémoire, disque
  - Logs d'erreurs récents
  - ✅ **Tout utilisateur**

- **`backup.sh`** - Sauvegarde complète
  - Base de données, code, config Nginx, SSL
  - Nettoyage automatique (7 jours)
  - ⚠️ **Exécuter en tant que root**

- **`update.sh`** - Mise à jour application  
  - Git pull, npm install, PM2 reload
  - Tests de santé automatiques
  - ⚠️ **Exécuter en tant qu'utilisateur claudyne**

## 🚀 Ordre d'exécution

```bash
# 1. Configuration serveur (root)
./contabo-setup.sh

# 2. Déploiement app (claudyne)
su - claudyne
./deploy-app.sh

# 3. Configuration web (root)
exit
./setup-nginx.sh

# 4. Vérification (tout utilisateur)
./monitor.sh
```

## ⚙️ Permissions Requises

| Script | Utilisateur | Raison |
|--------|-------------|---------|
| contabo-setup.sh | root | Installation système |
| deploy-app.sh | claudyne | Déploiement app |
| setup-nginx.sh | root | Configuration Nginx/SSL |
| monitor.sh | tout | Lecture seule |
| backup.sh | root | Accès PostgreSQL |
| update.sh | claudyne | Git et PM2 |

## 🔧 Configuration Requise

Avant utilisation, modifiez:

### Dans `deploy-app.sh`:
```bash
GITHUB_REPO="https://github.com/VOTRE-USERNAME/claudyne-platform.git"
```

### Dans `setup-nginx.sh`:
```bash
DOMAIN="claudyne.com"  # Votre domaine
EMAIL="votre-email@domain.com"  # Pour Let's Encrypt
```

## 📊 Logs et Monitoring

- **Logs application**: `/var/www/claudyne/claudyne-platform/logs/`
- **Logs Nginx**: `/var/log/nginx/claudyne.com.*`
- **Sauvegardes**: `/var/backups/claudyne/`
- **Monitoring**: `./monitor.sh`