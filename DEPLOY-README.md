# 🚀 Scripts de Déploiement Claudyne

> **En hommage à Meffo Mehtah Tchandjio Claudine** 👨‍👩‍👧‍👦
> *"La force du savoir en héritage"*

## 📋 Configuration Serveur

**Serveur SSH:** `root@89.117.58.53`
**Repository:** https://github.com/aurelgroup/claudyne-platform
**Site Production:** https://claudyne.com

---

## 🔧 Scripts Disponibles

### 1. **Connexion SSH** - Test manuel
```bash
ssh root@89.117.58.53
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


---

## 🚀 Processus de Déploiement

### **Méthode Recommandée:**

1. **Tester la connexion SSH:**
   ```bash
   ssh root@89.117.58.53
   ```

2. **Déployer rapidement (Windows):**
   ```bash
   deploy-rapide.bat
   ```

3. **Ou déployer avec PowerShell (recommandé):**
   ```powershell
   PowerShell -ExecutionPolicy Bypass -File deploy-github-prod.ps1
   ```

### **Que fait le déploiement:**

#### 📤 **Côté Local (Windows):**
- Ajoute tous les fichiers modifiés
- Crée un commit avec votre message
- Push vers GitHub (`origin main`)

#### 🖥️ **Côté Serveur (89.117.58.53):**
- `git pull origin main` - Récupère les modifications depuis GitHub
- `systemctl reload nginx` - Recharge la configuration nginx
- Fichiers statiques servis directement depuis `/var/www/html`
- Route `/student` → interface étudiante moderne automatique

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
- ✅ Site principal accessible (https://claudyne.com)
- ✅ Interface étudiante accessible (https://claudyne.com/student)
- ✅ SSL/HTTPS fonctionnel
- ✅ Nginx actif et configuré

### **Commandes de Monitoring SSH:**
```bash
# Se connecter au serveur
ssh root@89.117.58.53

# Vérifier Nginx
systemctl status nginx

# Vérifier le repository
cd /var/www/html && git status

# Tester les endpoints
curl https://claudyne.com
curl https://claudyne.com/student
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

*En hommage à Meffo TCHANDJIO Claudine (Mètah) * 👨‍👩‍👧‍👦

</div>