# 🚀 **COMMANDES DE DÉPLOIEMENT MANUEL - VPS CONTABO**

## 📋 **INFORMATIONS CONNEXION**

```bash
# Connexion SSH
ssh root@89.117.58.53

# Répertoire GitHub
# https://github.com/aurelgroup/claudyne-platform
```

## 🔍 **ÉTAPE 1 : EXPLORATION SERVEUR**

```bash
# Se connecter au serveur
ssh root@89.117.58.53

# Identifier l'architecture web
ps aux | grep -E "(nginx|apache|node)" | grep -v grep
systemctl status nginx
systemctl status apache2
netstat -tlnp | grep -E ":80|:443"

# Trouver les répertoires web
ls -la /var/www/
ls -la /opt/claudyne/
find / -name "*claudyne*" -type d 2>/dev/null
```

## 📤 **ÉTAPE 2 : UPLOAD FICHIER**

### **Depuis votre machine locale :**

```bash
# Naviguer vers le dossier Claudyne
cd "C:\Users\fa_nono\Documents\CADD\Claudyne"

# Upload privacy.html vers le serveur
scp privacy.html root@89.117.58.53:/tmp/
```

## 🌐 **ÉTAPE 3 : DÉPLOIEMENT SELON ARCHITECTURE**

### **Option A : Nginx/Apache (Web classique)**

```bash
# Sur le serveur
ssh root@89.117.58.53

# Identifier le répertoire web
ls -la /var/www/html/
ls -la /var/www/claudyne.com/

# Copier le fichier (adapter le chemin)
cp /tmp/privacy.html /var/www/html/
# OU
cp /tmp/privacy.html /var/www/claudyne.com/

# Définir les permissions
chmod 644 /var/www/html/privacy.html
chown www-data:www-data /var/www/html/privacy.html

# Recharger le serveur web
systemctl reload nginx
# OU
systemctl reload apache2
```

### **Option B : Application Node.js**

```bash
# Sur le serveur
ssh root@89.117.58.53

# Trouver l'application
ls -la /opt/claudyne/
ls -la /home/claudyne/

# Copier vers le dossier public
cp /tmp/privacy.html /opt/claudyne/public/
# OU directement dans l'app
cp /tmp/privacy.html /opt/claudyne/

# Redémarrer l'application
pm2 restart claudyne
# OU
systemctl restart claudyne
```

### **Option C : GitHub Auto-Deploy**

```bash
# Sur le serveur
ssh root@89.117.58.53

# Aller dans le repo
cd /path/to/claudyne-platform/

# Ajouter le fichier
cp /tmp/privacy.html ./
git add privacy.html
git commit -m "Add privacy policy for Google Play compliance"
git push origin main

# Si auto-deploy configuré, sinon :
git pull origin main
# Redémarrer l'application si nécessaire
```

## 🧪 **ÉTAPE 4 : TESTS DE VALIDATION**

```bash
# Test local depuis le serveur
curl -I http://localhost/privacy
curl -I http://localhost:3000/privacy

# Test externe
curl -I https://claudyne.com/privacy
curl -I http://claudyne.com/privacy

# Vérifier le contenu
curl https://claudyne.com/privacy | head -20
```

## 🔧 **CONFIGURATION NGINX (si nécessaire)**

```nginx
# Ajouter dans /etc/nginx/sites-available/claudyne.com
server {
    listen 80;
    listen 443 ssl;
    server_name claudyne.com www.claudyne.com;

    root /var/www/html;  # ou /var/www/claudyne.com
    index index.html index.php;

    # Page de confidentialité
    location /privacy {
        try_files /privacy.html =404;
        add_header Cache-Control "public, max-age=3600";
    }

    # SSL configuration (si nécessaire)
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
}
```

```bash
# Tester et recharger Nginx
nginx -t
systemctl reload nginx
```

## 🔧 **CONFIGURATION APACHE (si nécessaire)**

```apache
# Ajouter dans /etc/apache2/sites-available/claudyne.com.conf
<VirtualHost *:80>
    ServerName claudyne.com
    ServerAlias www.claudyne.com
    DocumentRoot /var/www/html

    # Page de confidentialité
    Alias /privacy /var/www/html/privacy.html

    <Location /privacy>
        Header set Cache-Control "public, max-age=3600"
    </Location>
</VirtualHost>
```

```bash
# Activer et recharger Apache
a2ensite claudyne.com
systemctl reload apache2
```

## ✅ **VALIDATION FINALE**

### **Tests obligatoires :**

```bash
# 1. Accessibilité HTTPS
curl -I https://claudyne.com/privacy

# 2. Contenu correct
curl https://claudyne.com/privacy | grep "Politique de Confidentialité"

# 3. Responsive mobile
curl -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)" https://claudyne.com/privacy

# 4. Performance
time curl https://claudyne.com/privacy > /dev/null
```

### **Résultats attendus :**
- ✅ **Status HTTP 200**
- ✅ **Content-Type: text/html**
- ✅ **Taille: ~31KB**
- ✅ **Titre: "Politique de Confidentialité - Claudyne"**

## 🎯 **APRÈS DÉPLOIEMENT**

1. ✅ **Tester sur navigateur** : https://claudyne.com/privacy
2. ✅ **Valider mobile** : Responsive design
3. ✅ **Mettre à jour app.json** de l'app mobile
4. ✅ **Valider Google Play** Console
5. ✅ **Publier l'application** mobile

---

**🇨🇲 Honneur à Ma'a Meffo TCHANDJIO Claudine - La force du savoir en héritage !**