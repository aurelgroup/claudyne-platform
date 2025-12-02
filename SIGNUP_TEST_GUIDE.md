# Guide de Test d'Inscription Claudyne

## Corrections apportées

### 1. Validation du Mot de Passe
- **Avant**: Min 6 caractères
- **Après**: Min 8 caractères + au moins une minuscule, une majuscule et un chiffre
- **Fichier**: `frontend/components/auth/SignupForm.tsx`

### 2. Validation du Téléphone Camerounais
- **Format strict**: `^(\+237|237)?[26][0-9]{8}$`
- **Exemples valides**:
  - `+237600000000`
  - `+237260000000`
  - `260000000`
  - `600000000`
- **Exemples invalides**:
  - `0600000000` (commence par 0)
  - `+237800000000` (commence par 8)
  - `+2376000000` (manque 2 chiffres)

### 3. Checkbox Acceptation des Conditions
- **Champ ajouté**: `acceptTerms` (booléen, converti en string 'true'/'false')
- **Validation**: Obligatoire pour créer un compte
- **Message**: "Vous devez accepter les conditions d'utilisation"

### 4. Payload Correct Envoyé

```json
{
  "firstName": "Jean",
  "lastName": "Dupont",
  "familyName": "Dupont",
  "email": "jean@example.com",
  "phone": "",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123",
  "acceptTerms": "true",
  "accountType": "PARENT"
}
```

**Ou avec téléphone:**

```json
{
  "firstName": "Jean",
  "lastName": "Dupont",
  "familyName": "Dupont",
  "email": "",
  "phone": "+237600000000",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123",
  "acceptTerms": "true",
  "accountType": "PARENT"
}
```

## Scénarios de Test

### Test 1: Inscription valide par Email
**Données:**
- Prénom: `Jean`
- Nom: `Dupont`
- Nom de famille: `Dupont`
- Email: `jean@example.com`
- Méthode de contact: `Email`
- Mot de passe: `SecurePass123` (min 8 char, 1 maj, 1 min, 1 chiffre)
- Confirmation: `SecurePass123`
- Conditions: ✓ Coché

**Résultat attendu:**
- ✓ Validation locale réussie
- ✓ Envoi POST à `/api/auth/register`
- ✓ Compte créé avec succès
- ✓ Redirection vers `/famille`

### Test 2: Inscription valide par Téléphone
**Données:**
- Prénom: `Marie`
- Nom: `Bernard`
- Nom de famille: `Bernard`
- Téléphone: `+237600000000`
- Méthode de contact: `Téléphone`
- Mot de passe: `TestPass456` (min 8 char, 1 maj, 1 min, 1 chiffre)
- Confirmation: `TestPass456`
- Conditions: ✓ Coché

**Résultat attendu:**
- ✓ Format téléphone validé
- ✓ Compte créé avec succès

### Test 3: Mot de passe invalide (trop court)
**Données:**
- Mot de passe: `Pass1` (5 caractères)

**Résultat attendu:**
- ✗ Message d'erreur: "Mot de passe trop court (min 8 caractères)"
- ✗ Bouton désactivé

### Test 4: Mot de passe sans majuscule
**Données:**
- Mot de passe: `securepass123` (sans majuscule)

**Résultat attendu:**
- ✗ Message d'erreur: "Le mot de passe doit contenir au moins une majuscule"

### Test 5: Téléphone invalide (format camerounais)
**Données:**
- Téléphone: `0600000000` (commence par 0)

**Résultat attendu:**
- ✗ Message d'erreur: "Format camerounais invalide (ex: +237600000000 ou 260000000)"

### Test 6: Conditions non acceptées
**Données:**
- Tous les champs valides
- Conditions: ✗ Non coché

**Résultat attendu:**
- ✗ Message d'erreur: "Vous devez accepter les conditions d'utilisation"
- ✗ Bouton désactivé

### Test 7: Email déjà existant
**Données:**
- Email: `jean@example.com` (qui existe déjà)
- Autres champs: valides

**Résultat attendu:**
- ✓ Validation côté client passe
- ✗ Erreur API: "Un compte avec cet email existe déjà" (409)

## Procédure de Test Manuelle

1. **Accéder à la page d'inscription**: https://claudyne.com
2. **Cliquer sur "Créer un compte"** ou l'onglet Signup
3. **Remplir le formulaire** avec des données valides (voir Test 1)
4. **Ouvrir la console du navigateur** (F12) pour voir les logs
5. **Soumettre le formulaire**
6. **Vérifier les résultats**:
   - Pas d'erreur de validation
   - Toast de succès ou d'erreur
   - Redirection vers `/famille` si succès

## Vérification du Payload dans DevTools

1. Ouvrir DevTools (F12)
2. Aller à l'onglet **Network**
3. Soumettre le formulaire
4. Chercher la requête `register` (POST)
5. Cliquer sur la requête
6. Aller à l'onglet **Payload** ou **Request Body**
7. Vérifier que tous les champs requis sont présents avec les bonnes valeurs

## Fichiers Modifiés

- ✓ `frontend/components/auth/SignupForm.tsx` - Validation et UI
- ✓ `frontend/services/auth.ts` - Normalisation du payload
- ✓ `frontend/contexts/AuthContext.tsx` - Interface RegisterData
