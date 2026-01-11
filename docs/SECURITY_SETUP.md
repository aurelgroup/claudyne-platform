# 🔒 Configuration des Secrets de Production

## ⚠️ IMPORTANT
Les secrets ne doivent **JAMAIS** être hardcodés dans le code source ou les fichiers de configuration commités dans Git.

## Variables d'Environnement Requises

### Sur le Serveur de Production

Configurez ces variables d'environnement sur votre serveur :

```bash
# Connexion Base de Données
export DB_HOST="localhost"
export DB_PORT="5432"
export DB_NAME="claudyne_production"
export DB_USER="claudyne_user"
export DB_PASSWORD="VOTRE_MOT_DE_PASSE_DB"

# Secrets JWT (générez des secrets uniques!)
export JWT_SECRET="$(openssl rand -hex 64)"
export JWT_REFRESH_SECRET="$(openssl rand -hex 64)"
export JWT_EXPIRES_IN="7d"
export JWT_REFRESH_EXPIRE="30d"

# Configuration Application
export FRONTEND_URL="https://claudyne.com"
export CORS_ORIGIN="https://claudyne.com"
```

### Persistance des Variables

Pour que les variables persistent après redémarrage, ajoutez-les à `/etc/environment` ou créez un fichier :

```bash
# Créer le fichier de secrets
sudo nano /etc/claudyne/.env.secrets

# Ajouter les variables
DB_PASSWORD=votre_mot_de_passe
JWT_SECRET=votre_secret_jwt
JWT_REFRESH_SECRET=votre_refresh_secret

# Protéger le fichier
sudo chmod 600 /etc/claudyne/.env.secrets
sudo chown root:root /etc/claudyne/.env.secrets

# Charger au démarrage de PM2
# Ajouter dans ~/.bashrc ou ~/.profile :
source /etc/claudyne/.env.secrets
```

### Génération de Secrets Sécurisés

```bash
# JWT Secret (128 caractères hex)
openssl rand -hex 64

# Password DB (32 caractères alphanumériques + symboles)
openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
```

## Vérification des Secrets

```bash
# Vérifier que les secrets sont bien chargés
pm2 restart ecosystem.config.js
pm2 logs claudyne-backend --lines 20
```

## 🚨 Secrets Compromis Précédemment

Les secrets suivants ont été exposés dans Git et doivent être **changés immédiatement** :

- ✅ JWT_SECRET: `ef81f74a27...` → À CHANGER
- ✅ JWT_REFRESH_SECRET: `a7b3c8d2e9...` → À CHANGER
- ✅ DB_PASSWORD: `aujourdhui18D@` → À CHANGER
- ✅ Admin password: `admin123` → Déjà changé en `AdminClaudyne2024`

## Checklist de Sécurité

- [ ] Générer de nouveaux secrets JWT
- [ ] Changer le mot de passe de la base de données
- [ ] Configurer les variables d'environnement sur le serveur
- [ ] Redémarrer PM2 avec les nouveaux secrets
- [ ] Vérifier que l'application fonctionne
- [ ] Supprimer les anciens secrets des logs
- [ ] Révoquer tous les tokens JWT existants

## Contact

En cas de problème de sécurité, contactez immédiatement l'équipe technique.
