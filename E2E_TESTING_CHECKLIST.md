# Checklist de Test End-to-End - Inscription Claudyne

## 🎯 Objectif
Vérifier que le flux complet d'inscription fonctionne correctement après les corrections apportées.

---

## ✅ Préparation

- [ ] Cloner/Mettre à jour le code depuis Git
- [ ] Frontend: `npm install && npm run dev`
- [ ] Backend: Vérifier que le serveur fonctionne (`http://localhost:3001`)
- [ ] Ouvrir un navigateur incognito/privé (pas de cache)
- [ ] Ouvrir DevTools (F12) → Onglet **Console** et **Network**

---

## 🧪 Test 1: Inscription Valide par Email

### Données à Utiliser:
```
Prénom:           Jean
Nom:              Dupont
Nom de famille:   Dupont
Email:            jean.dupont.test@gmail.com
Téléphone:        [Laisser vide]
Mot de passe:     SecurePass123
Confirmation:     SecurePass123
Conditions:       ✓ Coché
```

### Étapes:
1. [ ] Accéder à https://localhost:3000 (ou claudyne.com)
2. [ ] Cliquer sur "Créer un compte" ou onglet **Signup**
3. [ ] Remplir les champs avec les données ci-dessus
4. [ ] Sélectionner **Email** comme méthode de contact
5. [ ] Vérifier que la validation côté client passe (pas de messages d'erreur)
6. [ ] Cliquer sur "Créer mon compte famille"

### Vérifications Expected:
- [ ] **Console DevTools**: Pas d'erreurs JavaScript
- [ ] **Network Tab**: Requête POST `/api/auth/register` avec statut **201**
- [ ] **Network Tab Payload**: Contient tous les champs requis
  ```json
  {
    "firstName": "Jean",
    "lastName": "Dupont",
    "familyName": "Dupont",
    "email": "jean.dupont.test@gmail.com",
    "phone": "",
    "password": "SecurePass123",
    "acceptTerms": "true",
    "accountType": "PARENT"
  }
  ```
- [ ] **Toast**: Message de succès "Compte créé avec succès ! 🎉"
- [ ] **URL**: Redirection vers `/famille` après succès
- [ ] **Local Storage**:
  - `claudyne_token` présent et non vide
  - `claudyne_refresh_token` présent et non vide

**Résultat**: ✅ **PASS** / ❌ **FAIL**

---

## 🧪 Test 2: Inscription Valide par Téléphone Camerounais

### Données à Utiliser:
```
Prénom:           Marie
Nom:              Bernard
Nom de famille:   Bernard
Email:            [Laisser vide]
Téléphone:        +237600000000
Mot de passe:     TestPass456
Confirmation:     TestPass456
Conditions:       ✓ Coché
```

### Étapes:
1. [ ] Actualiser la page (Ctrl+F5)
2. [ ] Cliquer sur "Créer un compte"
3. [ ] Remplir les champs avec les données ci-dessus
4. [ ] Sélectionner **Téléphone** comme méthode de contact
5. [ ] Vérifier la validation du format téléphone
6. [ ] Cliquer sur "Créer mon compte famille"

### Vérifications Expected:
- [ ] **Validation frontend**: Pas d'erreur sur le téléphone
- [ ] **Network Tab**: POST `/api/auth/register` avec statut **201**
- [ ] **Payload**: Phone normalisé à `+237600000000`
- [ ] **Succès**: Redirection vers `/famille`, tokens créés

**Résultat**: ✅ **PASS** / ❌ **FAIL**

---

## 🧪 Test 3: Validation du Mot de Passe (Trop Court)

### Données:
```
Mot de passe: Pass1 (5 caractères)
```

### Étapes:
1. [ ] Actualiser la page
2. [ ] Remplir le formulaire
3. [ ] Entrer "Pass1" dans le champ mot de passe
4. [ ] Vérifier le message d'erreur

### Vérifications Expected:
- [ ] **Message d'erreur**: "Mot de passe trop court (min 8 caractères)"
- [ ] **Bouton**: Désactivé (grisé)
- [ ] **Pas de requête API**: La validation côté client bloque avant l'envoi

**Résultat**: ✅ **PASS** / ❌ **FAIL**

---

## 🧪 Test 4: Validation du Mot de Passe (Sans Majuscule)

### Données:
```
Mot de passe: securepass123 (sans majuscule)
```

### Étapes:
1. [ ] Actualiser la page
2. [ ] Remplir le formulaire
3. [ ] Entrer "securepass123"
4. [ ] Vérifier le message d'erreur

### Vérifications Expected:
- [ ] **Message d'erreur**: "Le mot de passe doit contenir au moins une majuscule"
- [ ] **Bouton**: Désactivé
- [ ] **Pas de requête API**

**Résultat**: ✅ **PASS** / ❌ **FAIL**

---

## 🧪 Test 5: Validation du Téléphone (Format Invalide)

### Données:
```
Téléphone: 0600000000 (commence par 0)
```

### Étapes:
1. [ ] Actualiser la page
2. [ ] Sélectionner **Téléphone**
3. [ ] Entrer "0600000000"
4. [ ] Vérifier le message d'erreur

### Vérifications Expected:
- [ ] **Message d'erreur**: "Format camerounais invalide (ex: +237600000000 ou 260000000)"
- [ ] **Bouton**: Désactivé
- [ ] **Pas de requête API**

**Résultat**: ✅ **PASS** / ❌ **FAIL**

---

## 🧪 Test 6: Conditions Non Acceptées

### Étapes:
1. [ ] Actualiser la page
2. [ ] Remplir TOUS les champs avec des données valides
3. [ ] **NE PAS COCHER** la checkbox "J'accepte les conditions"
4. [ ] Cliquer sur "Créer mon compte famille"

### Vérifications Expected:
- [ ] **Message d'erreur**: "Vous devez accepter les conditions d'utilisation"
- [ ] **Pas de soumission**: La validation locale bloque avant l'envoi
- [ ] **Pas de requête API**

**Résultat**: ✅ **PASS** / ❌ **FAIL**

---

## 🧪 Test 7: Email Déjà Existant

### Données:
```
Email: jean.dupont.test@gmail.com (créé dans Test 1)
```

### Étapes:
1. [ ] Actualiser la page
2. [ ] Remplir le formulaire avec le même email que Test 1
3. [ ] Tous les autres champs: valides
4. [ ] Cocher les conditions
5. [ ] Cliquer sur "Créer mon compte famille"

### Vérifications Expected:
- [ ] **Validation locale**: Passe (pas d'erreur côté client)
- [ ] **Network Tab**: POST `/api/auth/register` envoyé
- [ ] **Réponse API**: Status **409 Conflict**
- [ ] **Message d'erreur**: "Un compte avec cet email existe déjà"
- [ ] **Pas de redirection**: L'utilisateur reste sur la page d'inscription
- [ ] **Toast d'erreur**: Affichage du message d'erreur

**Résultat**: ✅ **PASS** / ❌ **FAIL**

---

## 🧪 Test 8: Connexion Après Inscription

### Étapes:
1. [ ] Créer un compte valide (Test 1)
2. [ ] Une fois redirigé vers `/famille`, cliquer sur déconnexion
3. [ ] Allez à la page de connexion
4. [ ] Entrez les identifiants créés
5. [ ] Vérifier la reconnexion

### Vérifications Expected:
- [ ] **Connexion réussie**: Accès au dashboard famille
- [ ] **Données correctes**: Prénom, nom, nom de famille affichés
- [ ] **Essai gratuit**: 7 jours affichés
- [ ] **Statut du compte**: PARENT / TRIAL

**Résultat**: ✅ **PASS** / ❌ **FAIL**

---

## 🧪 Test 9: Différents Formats de Téléphone

### Données à Tester:
```
✓ +237600000000
✓ +237260000000
✓ 237600000000
✓ 260000000
✓ 600000000
✗ 0600000000
✗ +237800000000
✗ +2376000000
```

### Étapes:
1. [ ] Pour chaque format, sélectionner **Téléphone**
2. [ ] Entrer le numéro
3. [ ] Vérifier la validation

### Vérifications Expected:
- [ ] Les formats ✓ passent la validation
- [ ] Les formats ✗ sont rejetés avec message d'erreur

**Résultat**: ✅ **PASS** / ❌ **FAIL**

---

## 🧪 Test 10: Différents Formats de Mot de Passe

### Données à Tester:
```
✓ SecurePass123
✓ TestPass456
✓ Claudyne2024
✓ MyPassword999
✗ Pass1 (trop court)
✗ PASSWORD123 (pas de minuscule)
✗ password123 (pas de majuscule)
✗ PassWord (pas de chiffre)
```

### Étapes:
1. [ ] Pour chaque mot de passe, l'entrer dans le champ
2. [ ] Vérifier les messages d'erreur en temps réel

### Vérifications Expected:
- [ ] Les mots de passe ✓ passent la validation
- [ ] Les mots de passe ✗ affichent le message d'erreur approprié

**Résultat**: ✅ **PASS** / ❌ **FAIL**

---

## 📊 Résumé des Résultats

| Test # | Nom | Status | Notes |
|--------|-----|--------|-------|
| 1 | Email valide | ✅/❌ | |
| 2 | Téléphone valide | ✅/❌ | |
| 3 | Mot de passe court | ✅/❌ | |
| 4 | Mot de passe sans maj | ✅/❌ | |
| 5 | Téléphone invalide | ✅/❌ | |
| 6 | Conditions non acceptées | ✅/❌ | |
| 7 | Email existant | ✅/❌ | |
| 8 | Connexion après inscription | ✅/❌ | |
| 9 | Formats de téléphone | ✅/❌ | |
| 10 | Formats de mot de passe | ✅/❌ | |

---

## 🐛 Dépannage

Si un test échoue, vérifiez:

1. **Erreur JavaScript**: Vérifier la console (F12 → Console)
2. **Erreur API**: Vérifier Network tab (F12 → Network) et voir la réponse du serveur
3. **Erreur de validation**: Comparer le payload avec les exemples fournis
4. **Cache**: Vider le cache du navigateur ou utiliser mode incognito
5. **Base de données**: Vérifier que les données de test ne sont pas déjà en base

---

## ✨ Validation Finale

Tous les tests doivent retourner ✅ **PASS** pour confirmer que:

- ✅ La validation côté client est correcte
- ✅ Le payload envoyé est correct
- ✅ Le backend accepte et traite les données correctement
- ✅ Les utilisateurs peuvent créer des comptes
- ✅ Les gestion des erreurs fonctionne correctement

**Date du test:** ___________
**Testeur:** ___________
**Navigateur:** ___________
**Résultat global:** ✅ **PASS** / ⚠️ **PASS AVEC NOTES** / ❌ **FAIL**
