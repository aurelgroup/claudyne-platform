# 🚀 Scripts de Déploiement Claudyne

> **En hommage à Meffo Mehtah Tchandjio Claudine** 👨‍👩‍👧‍👦
> *"La force du savoir en héritage"*

## 📋 Configuration Serveur

**Serveur SSH:** `root@89.117.58.53`
**Repository:** https://github.com/aurelgroup/claudyne-platform
**Site Production:** https://claudyne.com

---

## 🔧 Scripts Disponibles

### 1. **test-ssh.bat** - Test de Connexion
```bash
test-ssh.bat
```
**Utilisation:** Vérifier que la connexion SSH fonctionne avant le déploiement

### 2. **deploy-rapide.bat** - Déploiement Rapide
```bash
deploy-rapide.bat
```
**Utilisation:** Script Windows simple pour GitHub + Production
**Actions:**
- ✅ `git add .`
- ✅ `git commit` (message personnalisé)
- ✅ `git push origin main`
- ✅ Copie `quick-update.sh` vers serveur
- ✅ Exécution du déploiement distant

### 3. **deploy-github-prod.ps1** - Déploiement PowerShell
```powershell
PowerShell -ExecutionPolicy Bypass -File deploy-github-prod.ps1
```
**Utilisation:** Version PowerShell avancée avec couleurs et meilleure gestion d'erreurs

### 4. **deploy-local.bat** - Déploiement Complet (Original)
```bash
deploy-local.bat
```
**Utilisation:** Script original avec interaction manuelle

---

## 🚀 Processus de Déploiement

### **Méthode Recommandée:**

1. **Tester la connexion:**
   ```bash
   test-ssh.bat
   ```

2. **Déployer rapidement:**
   ```bash
   deploy-rapide.bat
   ```

### **Que fait le déploiement:**

#### 📤 **Côté Local (Windows):**
- Ajoute tous les fichiers modifiés
- Crée un commit avec votre message
- Push vers GitHub (`origin main`)

#### 🖥️ **Côté Serveur (89.117.58.53):**
- `git pull origin main` - Récupère les modifications
- `npm install --production` - Met à jour les dépendances
- `pm2 reload all` - Redémarre les services
- Tests de santé automatiques

---

## 🌐 URLs de Production

Après déploiement, votre site sera accessible sur :

| Interface | URL | Description |
|-----------|-----|-------------|
| 🏠 **Principal** | https://claudyne.com | Page d'accueil |
| 👨‍💼 **Admin** | https://claudyne.com/admin | Interface administration |
| 🎓 **Étudiant** | https://claudyne.com/student | Interface étudiante moderne |
| 🔗 **API** | https://claudyne.com/api | Backend REST API |

---

## 🔍 Vérifications Post-Déploiement

### **Tests Automatiques:**
- ✅ Frontend accessible (port 3000)
- ✅ Backend accessible (port 3001)
- ✅ SSL/HTTPS fonctionnel
- ✅ Services PM2 actifs

### **Commandes de Monitoring SSH:**
```bash
# Se connecter au serveur
ssh root@89.117.58.53

# Vérifier les services
pm2 status
pm2 logs

# Vérifier Nginx
systemctl status nginx

# Tester les endpoints
curl https://claudyne.com
curl https://claudyne.com/api/health
```

---

## ⚠️ Dépannage

### **Erreur SSH:**
- Vérifier que votre clé SSH est configurée
- Tester avec `test-ssh.bat`

### **Erreur Git:**
- Vérifier `git status`
- Résoudre les conflits si nécessaire

### **Erreur Déploiement:**
- Se connecter au serveur et vérifier les logs
- Redémarrer manuellement: `pm2 restart all`

---

## 📞 Support

**Logs d'erreur serveur:** `/var/www/claudyne/claudyne-platform/logs/`
**Monitoring:** `pm2 monit` sur le serveur
**Repository:** https://github.com/aurelgroup/claudyne-platform

---

<div align="center">

### 🎉 Claudyne - Plateforme Éducative Camerounaise

**La force du savoir en héritage** ✨

*En hommage à Meffo Mehtah Tchandjio Claudine* 👨‍👩‍👧‍👦

</div>