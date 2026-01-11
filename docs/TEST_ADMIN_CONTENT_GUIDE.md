# Guide de test - Gestion de contenu Admin

**Date:** 2025-12-06
**Objectif:** Tester les nouvelles fonctionnalités de gestion de cours/quiz/ressources

## ✅ État du système

### Backend
- **Serveur:** claudyne-backend (instances 14 & 15) - ONLINE
- **Routes:** contentManagementRoutes intégrées et actives
- **Persistence:** `/opt/claudyne/backend/content-store.json` créé
- **Logs:** Aucune erreur au démarrage

### Tests automatiques effectués
```
✅ GET /api/admin/content → 401 Unauthorized (route existe, auth requise)
✅ GET /api/health → 200 OK
✅ lessons.html → hook data-lessons-source présent
✅ contentManagementRoutes → enregistré dans index.js
```

## 📋 Tests manuels à effectuer

### Test 1: Accéder à la section Contenu (2 min)

**Étapes:**
1. Aller sur `https://claudyne.com/admin-secure-k7m9x4n2p8w5z1c6`
2. Se connecter avec vos identifiants admin
3. Cliquer sur "📚 Contenu pédagogique" dans le menu

**Résultat attendu:**
- ❌ **AVANT:** Console error `404 Not Found - /api/admin/content/courses`
- ✅ **MAINTENANT:** Onglets Cours/Quiz/Ressources s'affichent sans erreur 404
- Les onglets sont vides (normal, pas de contenu créé)

**Vérification:**
- Ouvrir la console développeur (F12)
- Aucune erreur 404 ne doit apparaître
- Les requêtes vers `/api/admin/content/*` retournent 200 OK

---

### Test 2: Créer un cours avec exemple pré-rempli (5 min)

**Étapes:**
1. Dans "Contenu pédagogique", cliquer sur l'onglet "**Cours**"
2. Cliquer sur "**➕ Ajouter contenu**" → "**📚 Nouveau Cours**"
3. Une modale s'ouvre avec le formulaire
4. Cliquer sur le bouton "**Remplir un exemple**" (en haut à droite)

**Résultat attendu:**
- Les champs se remplissent automatiquement :
  - **Titre:** "Fractions simples : demi et quart"
  - **Matière:** Mathématiques
  - **Niveau:** 6ème
  - **Description:** "Comprendre la notion de fraction..."
  - **Contenu:** "Objectifs : - Identifier une moitié..."
  - **Durée:** 45 minutes
- La **prévisualisation** en bas de la modale se met à jour en temps réel

5. **Modifier un champ** (ex: changer le titre)
6. Vérifier que la prévisualisation se met à jour instantanément
7. Cliquer sur "**Créer le cours**"

**Résultat attendu:**
- ✅ Message de succès "Cours créé avec succès"
- ✅ La modale se ferme
- ✅ Le cours apparaît dans la liste des cours
- ✅ Les informations affichées correspondent à ce qui a été saisi

**Vérification backend:**
```bash
# SSH sur le serveur
ssh root@89.117.58.53

# Vérifier que le cours est dans content-store.json
cat /opt/claudyne/backend/content-store.json | grep -A 10 "courses"
```

Le fichier doit contenir un objet avec le cours créé.

---

### Test 3: Toggle statut d'un cours (2 min)

**Pré-requis:** Avoir créé au moins un cours (Test 2)

**Étapes:**
1. Dans la liste des cours, repérer le bouton "**⏸️ Désactiver**"
2. Cliquer dessus

**Résultat attendu:**
- Le bouton change immédiatement en "**▶️ Activer**"
- Le texte du bouton indique clairement le nouvel état

3. Cliquer à nouveau sur "**▶️ Activer**"

**Résultat attendu:**
- Le bouton redevient "**⏸️ Désactiver**"
- Le toggle fonctionne dans les deux sens

**Vérification backend:**
```bash
# Vérifier le statut dans le JSON
cat /opt/claudyne/backend/content-store.json | grep -A 2 "status"
```

Le cours doit avoir `"status": "inactive"` ou `"active"` selon l'état.

---

### Test 4: Créer un quiz (5 min)

**Étapes:**
1. Dans "Contenu pédagogique", cliquer sur l'onglet "**Quiz**"
2. Cliquer sur "**➕ Ajouter contenu**" → "**🧠 Nouveau Quiz**"
3. Remplir le formulaire :
   - **Titre:** "Quiz Mathématiques - Fractions"
   - **Matière:** Mathématiques
   - **Niveau:** 6ème
   - **Description:** "Tester vos connaissances"
   - **Durée:** 20 minutes
   - **Note de passage:** 60%

4. Dans la section "Questions", remplir :
   - **Question 1:** "Quelle fraction représente la moitié ?"
   - **Option A:** 1/2
   - **Option B:** 1/3
   - **Option C:** 1/4
   - **Option D:** 2/3
   - **Réponse correcte:** Option A

5. (Optionnel) Cliquer sur "**Ajouter une question**" pour ajouter plus de questions
6. Cliquer sur "**Créer le quiz**"

**Résultat attendu:**
- ✅ Message de succès
- ✅ Le quiz apparaît dans la liste
- ✅ Le nombre de questions s'affiche correctement

---

### Test 5: Créer une ressource (3 min)

**Étapes:**
1. Dans "Contenu pédagogique", cliquer sur l'onglet "**Ressources**"
2. Cliquer sur "**➕ Ajouter contenu**" → "**📖 Nouvelle Ressource**"
3. Remplir le formulaire :
   - **Titre:** "Fiche mémo - Fractions"
   - **Type:** PDF / Vidéo / Lien externe (au choix)
   - **Matière:** Mathématiques
   - **Niveau:** 6ème
   - **Description:** "Aide-mémoire sur les fractions"
   - **URL:** https://example.com/fractions.pdf
   - **Premium:** Cocher ou non

4. Cliquer sur "**Créer la ressource**"

**Résultat attendu:**
- ✅ Message de succès
- ✅ La ressource apparaît dans la liste

---

### Test 6: Vérifier l'affichage public dynamique (3 min)

**Pré-requis:** Avoir créé quelques cours et quiz (au moins 3-4 au total)

**Étapes:**
1. Ouvrir un **nouvel onglet** (ou mode navigation privée)
2. Aller sur `https://claudyne.com/lessons.html`
3. Attendre 2-3 secondes le chargement

**Résultat attendu:**
- Les compteurs de leçons se mettent à jour automatiquement
- Exemple :
  - "**Mathématiques: 3+ leçons**" (si vous avez créé 2 cours + 1 quiz en maths)
  - "**Français: 1+ leçons**" (si vous avez créé 1 cours en français)

**Vérification:**
- Ouvrir la console développeur (F12)
- Aller dans l'onglet **Network**
- Actualiser la page
- Chercher la requête vers `/api/admin/content`
- Vérifier que le statut est **200 OK**
- Regarder la réponse JSON : elle doit contenir vos cours et quiz

---

## 🔧 Dépannage

### Problème: Erreur 404 sur /api/admin/content

**Solution:**
```bash
# Vérifier que le fichier existe
ssh root@89.117.58.53 "ls -lh /opt/claudyne/backend/src/routes/contentManagement.js"

# Vérifier que le serveur a bien redémarré
ssh root@89.117.58.53 "pm2 status"

# Redémarrer si nécessaire
ssh root@89.117.58.53 "pm2 restart claudyne-backend"
```

### Problème: Les cours ne s'affichent pas après création

**Solution:**
1. Vérifier la console navigateur pour les erreurs
2. Vérifier que `content-store.json` contient bien le cours :
```bash
ssh root@89.117.58.53 "cat /opt/claudyne/backend/content-store.json"
```
3. Actualiser la page admin

### Problème: lessons.html ne se met pas à jour

**Causes possibles:**
- Le script `lessons-loader.js` n'est pas chargé
- CORS bloque la requête
- Les cours créés ont le statut "inactive"

**Vérification:**
```bash
# Vérifier que lessons-loader.js existe
curl -s https://claudyne.com/lessons-loader.js | head -5

# Vérifier les logs
ssh root@89.117.58.53 "pm2 logs claudyne-backend --lines 20"
```

---

## 📊 Rapport de test à remplir

Après avoir effectué les tests, cochez les cases :

- [ ] **Test 1:** Accès à la section Contenu sans erreur 404
- [ ] **Test 2:** Création d'un cours avec exemple pré-rempli
- [ ] **Test 3:** Toggle statut cours (actif ↔ inactif)
- [ ] **Test 4:** Création d'un quiz avec questions
- [ ] **Test 5:** Création d'une ressource
- [ ] **Test 6:** Affichage dynamique sur lessons.html

**Problèmes rencontrés:**
```
(Notez ici tout problème ou comportement inattendu)
```

**Captures d'écran:**
- Screenshot de la liste des cours créés
- Screenshot de lessons.html avec les compteurs mis à jour

---

## 🎯 Objectif final

**À la fin de ces tests, vous devriez avoir :**
- ✅ Au moins 2-3 cours créés
- ✅ Au moins 1 quiz créé
- ✅ Au moins 1 ressource créée
- ✅ Les compteurs sur `lessons.html` qui reflètent le contenu créé
- ✅ Aucune erreur 404 dans la console

**Temps total estimé:** 20-25 minutes

---

**La force du savoir en héritage - Claudine 💚**
