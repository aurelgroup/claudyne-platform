# ⚡ Déploiement Rapide - Aide-Mémoire

## 🎯 Commande Unique pour Tout Déployer

```bash
./deploy.sh all && ./verify-deployment.sh
```

## 📍 RAPPEL CRITIQUE

```
❌ JAMAIS: /var/www/claudyne/public/
✅ TOUJOURS: /opt/claudyne/
```

## 🔄 Workflows Courants

### Modifier le Frontend
```bash
# 1. Éditer sw.js - bumper version
vim sw.js  # Change v1.5.1 → v1.5.2

# 2. Éditer student-interface-modern.html
vim student-interface-modern.html

# 3. Déployer
./deploy.sh frontend

# 4. Vérifier
./verify-deployment.sh

# 5. Partager avec utilisateurs
echo "https://www.claudyne.com/clear-cache.html"
```

### Modifier le Backend
```bash
# 1. Éditer le code backend
vim backend/src/routes/students.js

# 2. Déployer
./deploy.sh backend

# 3. Vérifier
curl -s https://www.claudyne.com/api/health | jq .
```

### Fix Urgent en Production
```bash
# 1. Fix le code
vim student-interface-modern.html

# 2. Bumper SW version
sed -i "s/v1.5.1/v1.5.2/" sw.js

# 3. Deploy + Verify en une commande
./deploy.sh all && ./verify-deployment.sh && echo "✅ DONE"
```

## 🆘 Troubleshooting Rapide

| Symptôme | Commande Diagnostic | Fix |
|----------|-------------------|-----|
| Ancienne version affichée | `curl -I https://www.claudyne.com/sw.js` | `./deploy.sh frontend` |
| Backend down | `ssh root@89.117.58.53 "pm2 status"` | `ssh root@89.117.58.53 "pm2 restart claudyne-backend"` |
| Erreurs 500 | `ssh root@89.117.58.53 "pm2 logs claudyne-backend --lines 50"` | Voir logs pour debug |
| Redirection vers lessons.html | `./verify-deployment.sh` | `./deploy.sh frontend` |

## 📞 One-Liners Utiles

```bash
# Deploy tout + verify
./deploy.sh all && ./verify-deployment.sh

# Check PM2
ssh root@89.117.58.53 "pm2 status"

# Logs temps réel
ssh root@89.117.58.53 "pm2 logs claudyne-backend"

# Test santé
curl https://www.claudyne.com/api/health

# Check SW version en prod
curl -s https://www.claudyne.com/sw.js | grep CACHE_NAME

# Restart backend
ssh root@89.117.58.53 "pm2 restart claudyne-backend"

# Voir derniers déploiements
ls -lt deployment-report-*.txt | head -5
```

## 🎯 Checklist Ultra-Rapide

```
[ ] Code modifié
[ ] SW version bumpée (si frontend)
[ ] ./deploy.sh all
[ ] ./verify-deployment.sh
[ ] Partager clear-cache.html si besoin
```

## 💡 Tips Pro

1. **Alias Bash** - Ajoutez à votre `.bashrc`:
```bash
alias cdeploy="./deploy.sh all && ./verify-deployment.sh"
alias cstatus="ssh root@89.117.58.53 'pm2 status'"
alias clogs="ssh root@89.117.58.53 'pm2 logs claudyne-backend'"
```

2. **Pre-commit Hook** - Auto-vérif avant commit:
```bash
# .git/hooks/pre-commit
#!/bin/bash
if git diff --cached --name-only | grep -q "sw.js"; then
    echo "⚠️  RAPPEL: Avez-vous bumpé CACHE_NAME dans sw.js ?"
    grep "CACHE_NAME" sw.js
fi
```

3. **VS Code Snippets**:
```json
{
  "Deploy All": {
    "prefix": "deploy",
    "body": "./deploy.sh all && ./verify-deployment.sh"
  }
}
```

---

**Gardez ce fichier ouvert pendant vos déploiements!**
