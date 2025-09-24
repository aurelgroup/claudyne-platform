# 🚀 Guide de Déploiement Automatique - Claudyne APK

## 📋 Vue d'ensemble

Ce guide vous explique comment utiliser le système de déploiement automatique pour publier les mises à jour de l'APK Claudyne.

## 📁 Fichiers créés

- `deploy-apk.sh` - Script de déploiement pour Linux/macOS
- `deploy-apk.bat` - Script de déploiement pour Windows
- `DEPLOYMENT_GUIDE.md` - Cette documentation

## 🛠️ Prérequis

### Installation des dépendances
```bash
# EAS CLI
npm install -g @expo/eas-cli

# Vérifier l'installation
eas --version
```

### Configuration SSH
Assurez-vous que vous pouvez vous connecter au serveur sans mot de passe :
```bash
ssh-copy-id root@89.117.58.53
```

## 🚀 Utilisation

### Sur Linux/macOS
```bash
# Déploiement standard (profil preview)
./deploy-apk.sh

# Déploiement avec profil spécifique
./deploy-apk.sh --profile production

# Déploiement avec version personnalisée
./deploy-apk.sh --version 2.0.0 --profile preview

# Mode test (simulation sans actions réelles)
./deploy-apk.sh --dry-run

# Aide
./deploy-apk.sh --help
```

### Sur Windows
```batch
REM Déploiement standard
deploy-apk.bat

REM Avec profil spécifique
deploy-apk.bat production

REM Mode test
deploy-apk.bat preview dry-run
```

## 🔄 Processus de déploiement

### Étapes automatiques :

1. **🔍 Vérifications**
   - Présence d'EAS CLI
   - Connectivité SSH/SCP
   - Répertoires de travail

2. **📝 Versioning**
   - Lecture de la version dans `app.json` ou `package.json`
   - Génération d'un numéro de build unique
   - Création du nom d'APK avec timestamp

3. **🔨 Build EAS**
   - Lancement du build sur les serveurs Expo
   - Attente de la fin du build
   - Récupération de l'URL de téléchargement

4. **📥 Téléchargement**
   - Download de l'APK depuis Expo
   - Stockage local dans `./builds/`

5. **💾 Sauvegarde**
   - Téléchargement de l'APK actuel du serveur
   - Stockage dans `./backups/` avec timestamp

6. **🚀 Déploiement**
   - Upload de la nouvelle version
   - Remplacement de `claudyne.apk` sur le serveur
   - Vérification du déploiement

7. **🧪 Test**
   - Vérification HTTP de l'URL de téléchargement
   - Confirmation de la disponibilité

8. **🧹 Nettoyage**
   - Conservation des 5 derniers APK locaux
   - Conservation des 10 dernières sauvegardes

## 📁 Structure des répertoires

```
claudyne-mobile/
├── deploy-apk.sh              # Script Linux/macOS
├── deploy-apk.bat             # Script Windows
├── builds/                    # APK téléchargés
│   ├── claudyne-v1.0.0-20250924091541.apk
│   └── claudyne-v1.0.1-20250924143022.apk
├── backups/                   # Sauvegardes
│   ├── claudyne-backup-20250924_091540.apk
│   └── claudyne-backup-20250924_143021.apk
└── deployment.log            # Log des déploiements
```

## 📊 Exemple de sortie

```
🚀======================================================================
   CLAUDYNE APK AUTOMATED DEPLOYMENT
======================================================================🚀

ℹ️  Vérification des dépendances...
✅ Toutes les dépendances sont présentes
✅ Répertoires créés
ℹ️  Version: 1.0.0
ℹ️  Build: 20250924091541
ℹ️  APK: claudyne-v1.0.0-20250924091541.apk

🔨 Lancement du build EAS (profil: preview)...
✅ Build terminé avec succès

🔍 Récupération du lien de téléchargement...
✅ URL récupérée: https://expo.dev/artifacts/eas/...

📥 Téléchargement de l'APK...
✅ APK téléchargé (93MB): ./builds/claudyne-v1.0.0-20250924091541.apk

💾 Sauvegarde de l'APK actuel...
✅ APK actuel sauvegardé: ./backups/claudyne-backup-20250924_091540.apk

🚀 Déploiement sur le serveur...
✅ APK déployé sur le serveur
✅ Vérification réussie - Taille sur serveur: 93M

🧪 Test de l'URL de téléchargement...
✅ URL de téléchargement fonctionnelle (HTTP 200)

🧹 Nettoyage des anciens fichiers...
✅ Nettoyage terminé

======================================================================
🎉 DÉPLOIEMENT TERMINÉ AVEC SUCCÈS!
======================================================================
Version: 1.0.0
Build: 20250924091541
APK: claudyne-v1.0.0-20250924091541.apk
URL: https://claudyne.com/download/claudyne.apk
Page: https://claudyne.com/download/
Log: ./deployment.log
======================================================================
```

## 🔧 Configuration

### Variables d'environnement (dans le script)
```bash
VPS_HOST="89.117.58.53"
VPS_USER="root"
VPS_PATH="/var/www/claudyne/download"
LOCAL_APK_DIR="./builds"
BACKUP_DIR="./backups"
```

### Profils EAS supportés
- `preview` (par défaut) - Pour les tests
- `production` - Pour les versions finales
- `development` - Pour le développement

## 🚨 Résolution de problèmes

### Erreur : "EAS CLI non trouvé"
```bash
npm install -g @expo/eas-cli
```

### Erreur : "Échec SSH/SCP"
```bash
# Tester la connexion
ssh root@89.117.58.53

# Configurer les clés SSH
ssh-keygen -t rsa
ssh-copy-id root@89.117.58.53
```

### Erreur : "Build EAS échoué"
- Vérifier les erreurs dans le dashboard Expo
- S'assurer que le projet est correctement configuré
- Vérifier `eas.json`

### Erreur : "URL de téléchargement non trouvée"
- Attendre que le build soit complètement terminé
- Vérifier les permissions Expo
- Relancer le script

## 🔄 Workflow recommandé

### Déploiement standard
1. **Développement** → Test local
2. **Commit** → Push sur Git
3. **Run script** → `./deploy-apk.sh`
4. **Vérification** → Tester l'URL
5. **Communication** → Informer les utilisateurs

### Déploiement critique
1. **Test approfondi** → `./deploy-apk.sh --dry-run`
2. **Sauvegarde manuelle** → Copie de sécurité
3. **Déploiement** → `./deploy-apk.sh --profile production`
4. **Rollback préparé** → En cas de problème

## 📱 Communication aux utilisateurs

### Template de notification
```
🚀 Nouvelle version de Claudyne disponible !

Version: X.X.X
Nouveautés: [Liste des features]

📥 Téléchargement: https://claudyne.com/download/
📖 Guide d'installation disponible sur la page

#ClaudyneApp #MiseÀJour
```

## 📈 Monitoring

### Logs disponibles
- `deployment.log` - Historique des déploiements
- Logs EAS - Dashboard Expo
- Logs serveur - `/var/log/nginx/claudyne.access.log`

### Métriques à surveiller
- Taille des APK (éviter la régression)
- Temps de déploiement
- Taux de succès des téléchargements
- Feedback utilisateurs

## 🔒 Sécurité

### Bonnes pratiques
- Utiliser des clés SSH sans mot de passe
- Garder les sauvegardes locales
- Tester avant le déploiement en production
- Monitoring des logs d'accès
- Validation des APK avant publication

## 🆘 Support

En cas de problème :
1. Consulter les logs (`deployment.log`)
2. Vérifier la connectivité réseau
3. Tester en mode `--dry-run`
4. Contacter l'équipe technique

---

**🎉 Avec ce système, les mises à jour d'APK sont désormais automatisées et sécurisées !**