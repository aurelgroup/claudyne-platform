# 📚 GUIDE DEBUG POUR DÉBUTANT
## Trouver et résoudre l'erreur d'inscription Claudyne

---

## 🎯 OBJECTIF
Trouver pourquoi l'inscription sur https://claudyne.com échoue avec "Erreur lors de la création du compte"

---

## 📋 ÉTAPE PAR ÉTAPE (5 minutes)

### ✅ ÉTAPE 1 : Connexion au serveur
Ouvrez votre terminal (CMD, PowerShell, ou Terminal) et tapez:

```bash
ssh root@89.117.58.53
```

**💡 Explication:** Vous vous connectez à votre serveur Contabo comme administrateur

---

### ✅ ÉTAPE 2 : Aller dans le dossier Claudyne

```bash
cd /opt/claudyne
```

**💡 Explication:** On se place dans le dossier où est installé Claudyne

---

### ✅ ÉTAPE 3 : Copier le script de debug

```bash
cat > debug.sh << 'EOF'
#!/bin/bash
echo "🔍 Recherche des logs..."
find . -name "*.log" -type f 2>/dev/null
echo ""
echo "📊 Processus Node.js:"
ps aux | grep node | grep -v grep
echo ""
echo "🧪 Test d'inscription avec logs:"
pm2 logs --lines 0 &
sleep 2
curl -X POST https://claudyne.com/api/auth/register -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"Test123","firstName":"Test","lastName":"User","familyName":"Famille Test","city":"Douala","acceptTerms":"true"}' -s
sleep 5
pkill -f "pm2 logs"
echo ""
echo "✅ Terminé - Regardez les erreurs ci-dessus"
EOF

chmod +x debug.sh
```

**💡 Explication:** On crée un petit programme qui va :
- Chercher les fichiers de logs
- Voir si Node.js tourne
- Tester l'inscription et capturer l'erreur

---

### ✅ ÉTAPE 4 : Exécuter le script

```bash
./debug.sh
```

**💡 Explication:** On lance le programme de debug

---

### ✅ ÉTAPE 5 : Lire les résultats

Vous allez voir plusieurs choses s'afficher. Cherchez les lignes qui contiennent:
- ❌ `Error`
- ❌ `Exception`
- ❌ `Failed`
- ❌ `Cannot`

**💡 Explication:** Ces mots indiquent où est le problème

---

## 🔍 QUE CHERCHER ?

### Exemples d'erreurs communes:

#### ❌ Erreur 1 : Problème de base de données
```
Error: column "xyz" does not exist
```
**Solution:** Il manque une colonne dans la base de données

#### ❌ Erreur 2 : Contrainte violée
```
Error: null value in column "familyId" violates not-null constraint
```
**Solution:** Un champ obligatoire n'est pas rempli

#### ❌ Erreur 3 : Transaction échouée
```
Error: Transaction ROLLBACK
```
**Solution:** Une étape de la création a échoué

---

## 📞 APRÈS LE DEBUG

### Option A : Vous voyez l'erreur
✅ **Copiez le message d'erreur complet** et envoyez-le moi
Exemple: "Error: column familyId does not exist in table users"

### Option B : Vous ne voyez pas d'erreur
✅ **Essayez ces commandes alternatives:**

```bash
# Méthode 1: Logs PM2 complets
pm2 logs --lines 100

# Méthode 2: Logs système
journalctl -u claudyne -n 100 --no-pager

# Méthode 3: Logs fichiers
tail -100 /opt/claudyne/logs/*.log
```

---

## 🆘 AIDE RAPIDE

| Problème | Solution |
|----------|----------|
| "Permission denied" | Ajoutez `sudo` devant la commande |
| "Command not found: pm2" | Utilisez `journalctl -u claudyne -f` à la place |
| "No such file" | Le fichier n'existe pas, essayez une autre méthode |
| Rien ne s'affiche | Appuyez sur `Ctrl+C` et réessayez |

---

## 🎓 TERMES À CONNAÎTRE

- **SSH** : Connexion sécurisée au serveur
- **Logs** : Fichiers qui enregistrent ce qui se passe
- **PM2** : Gestionnaire de processus Node.js
- **Error/Exception** : Un problème dans le code
- **Transaction** : Série d'opérations en base de données
- **NULL constraint** : Un champ obligatoire est vide

---

## ✅ CHECKLIST

- [ ] Je suis connecté au serveur (ssh)
- [ ] Je suis dans /opt/claudyne
- [ ] J'ai exécuté le script debug.sh
- [ ] J'ai lu les messages d'erreur
- [ ] J'ai copié les erreurs importantes
- [ ] Je suis prêt à les partager

---

## 🚀 APRÈS CORRECTION

Une fois l'erreur corrigée, on testera:
```bash
curl -X POST https://claudyne.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"nouveau@claudyne.com","password":"Test123","firstName":"Jean","lastName":"Dupont","familyName":"Famille Dupont","city":"Douala","acceptTerms":"true"}'
```

Si ça affiche `{"success":true,...}` → ✅ **C'EST RÉPARÉ !**

---

## 💡 CONSEIL PRO

Gardez ce terminal ouvert et lancez dans un 2ème terminal:
```bash
ssh root@89.117.58.53 "pm2 logs --raw"
```

Puis testez l'inscription sur le site. Vous verrez l'erreur EN DIRECT ! 🎬

---

**Besoin d'aide ? Je suis là pour vous guider étape par étape ! 🤝**
