# 🐘 Configuration des bases de données Claudyne

## Option 1: Installation manuelle (recommandée pour Windows sans Docker)

### PostgreSQL sur Windows:
1. **Télécharger PostgreSQL :**
   - Aller sur https://www.postgresql.org/download/windows/
   - Télécharger la dernière version stable
   - Installer avec les paramètres par défaut

2. **Configurer la base de données :**
   ```cmd
   # Se connecter à PostgreSQL (mot de passe demandé)
   psql -U postgres

   # Créer l'utilisateur Claudyne
   CREATE USER claudyne_user WITH PASSWORD 'claudyne_secure_password';

   # Créer la base de données
   CREATE DATABASE claudyne_dev OWNER claudyne_user;

   # Donner tous les privilèges
   GRANT ALL PRIVILEGES ON DATABASE claudyne_dev TO claudyne_user;

   # Quitter
   \q
   ```

### Redis sur Windows:
1. **Télécharger Redis :**
   - Aller sur https://github.com/microsoftarchive/redis/releases
   - Télécharger Redis-x64-3.0.504.msi
   - Installer avec les paramètres par défaut

2. **Démarrer Redis :**
   ```cmd
   redis-server
   ```

## Option 2: Docker Compose (si Docker est installé)

```bash
# Démarrer PostgreSQL et Redis uniquement
docker-compose up postgres redis -d

# Vérifier que les services fonctionnent
docker-compose ps
```

## Option 3: SQLite en développement (le plus simple)

Pour un démarrage rapide sans installation complexe, utiliser SQLite:

1. **Installer sqlite3 dans le backend :**
   ```bash
   cd backend
   npm install sqlite3
   ```

2. **Modifier la configuration dans .env :**
   ```env
   # Changer de PostgreSQL vers SQLite
   DB_DIALECT=sqlite
   DB_STORAGE=./database/claudyne.sqlite

   # Désactiver Redis temporairement
   REDIS_ENABLED=false
   ```

## Test de connexion

Une fois configuré, tester avec:
```bash
cd backend
npm start
```

Le serveur devrait afficher :
✅ Connexion à PostgreSQL établie avec succès
ou
✅ Base de données SQLite initialisée

## URLs d'administration (si PostgreSQL + Redis via Docker)

- **PgAdmin :** http://localhost:5050
  - Email: admin@claudyne.cm
  - Password: admin_claudyne_2024

- **Redis Commander :** http://localhost:8081
  - User: admin
  - Password: admin_claudyne_2024

## Prochaines étapes

1. ✅ Configurer PostgreSQL ou SQLite
2. ✅ Configurer Redis (optionnel en développement)
3. 🔄 Démarrer le backend avec vraie persistance
4. 🔄 Tester les APIs avec données réelles
5. 🔄 Connecter les interfaces frontend