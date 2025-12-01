# Système de Familles Virtuelles - Claudyne

## 📋 Vue d'ensemble

Claudyne utilise un système de **familles virtuelles** pour gérer les étudiants individuels tout en maintenant une architecture cohérente basée sur les familles.

## 🎯 Objectifs

1. ✅ Permettre aux étudiants de s'inscrire individuellement (8000 FCFA/mois)
2. ✅ Maintenir l'architecture basée sur `familyId` dans toute la base de données
3. ✅ Empêcher les abus tarifaires (pas de formule familiale pour 1 étudiant)
4. ✅ Permettre le transfert d'un étudiant individuel vers une vraie famille

---

## 📊 Types de Familles

### 1. Famille INDIVIDUAL (Virtuelle)
**Caractéristiques :**
- Créée automatiquement lors de l'inscription d'un étudiant individuel
- `subscriptionType: 'INDIVIDUAL'`
- Tarif : **8000 FCFA/mois**
- Limite : **1 seul étudiant**
- Nom : `"Famille [Prénom] [Nom]"`
- Ne peut PAS être convertie en famille réelle

**Restrictions :**
- ❌ Impossible d'ajouter d'autres étudiants
- ❌ Impossible de changer le `subscriptionType` vers autre chose
- ❌ Impossible de modifier le tarif (toujours 8000 FCFA)
- ❌ `maxMembers` forcé à 1

### 2. Famille TRIAL/ACTIVE (Réelle)
**Caractéristiques :**
- Créée lors de l'inscription d'un PARENT
- `subscriptionType: 'TRIAL'` ou autre
- Tarif : **15000 FCFA/mois**
- Limite : **Jusqu'à 6 étudiants** (2 pendant la période d'essai)
- Nom : Choisi par le parent
- Peut recevoir des étudiants par transfert

---

## 🔄 Flux d'inscription

### Étudiant Individuel (STUDENT)
```javascript
POST /api/auth/register
{
  "accountType": "STUDENT",
  "email": "etudiant@example.com",
  "password": "********",
  "firstName": "Jean",
  "lastName": "Dupont",
  "educationLevel": "3EME_ESP",
  "dateOfBirth": "2010-05-15"
}
```

**Actions automatiques :**
1. Création d'une famille virtuelle `"Famille Jean Dupont"`
   - `subscriptionType: 'INDIVIDUAL'`
   - `maxMembers: 1`
   - `monthlyPrice: 8000.00`

2. Création du User
   - `role: 'STUDENT'`
   - `userType: 'INDIVIDUAL'`
   - `familyId: [ID de la famille virtuelle]`
   - `monthlyPrice: 8000.00`

3. Création du profil Student
   - `familyId: [ID de la famille virtuelle]`
   - `userId: [ID du user]`

### Parent avec Famille (PARENT)
```javascript
POST /api/auth/register
{
  "accountType": "PARENT",
  "email": "parent@example.com",
  "password": "********",
  "firstName": "Marie",
  "lastName": "Martin",
  "familyName": "Martin",
  "city": "Douala"
}
```

**Actions :**
1. Création d'une vraie famille `"Famille Martin"`
   - `subscriptionType: 'TRIAL'`
   - `maxMembers: 6`
   - `monthlyPrice: 15000.00`

2. Création du User
   - `role: 'PARENT'`
   - `userType: 'MANAGER'`
   - `familyId: [ID de la famille]`

---

## 🔐 Protections Tarifaires

### 1. Protection dans le modèle Family
```javascript
// backend/src/models/Family.js
hooks: {
  beforeUpdate: (family) => {
    // Empêcher conversion INDIVIDUAL → autre type
    if (family.changed('subscriptionType') &&
        family._previousDataValues.subscriptionType === 'INDIVIDUAL') {
      throw new Error('Impossible de convertir une famille virtuelle');
    }

    // Empêcher modification du prix pour INDIVIDUAL
    if (family.subscriptionType === 'INDIVIDUAL' &&
        family.changed('monthlyPrice')) {
      family.set('monthlyPrice', 8000.00);
    }

    // Empêcher augmentation de membres pour INDIVIDUAL
    if (family.subscriptionType === 'INDIVIDUAL' &&
        family.currentMembersCount > 1) {
      throw new Error('Limite : 1 étudiant pour compte individuel');
    }
  }
}
```

### 2. Protection lors de l'ajout d'étudiant
```javascript
// backend/src/routes/students.js ligne 173
if (family.subscriptionType === 'INDIVIDUAL') {
  return res.status(403).json({
    message: 'Compte individuel : impossible d\'ajouter d\'autres étudiants.
              Pour la formule familiale (15000 FCFA/mois), créez un compte Parent.'
  });
}
```

---

## 🚀 Système de Transfert

### Endpoint de transfert
```
POST /api/students/:id/transfer
Authorization: Bearer [token du PARENT]
```

**Body :**
```json
{
  "studentUserId": "uuid-de-l-etudiant-a-transferer"
}
```

### Processus de transfert

**Conditions préalables :**
1. ✅ Le demandeur doit être un PARENT (userType: 'MANAGER')
2. ✅ La famille source doit être INDIVIDUAL (virtuelle)
3. ✅ La famille destination ne doit PAS être INDIVIDUAL
4. ✅ La famille destination doit avoir de la place disponible

**Actions effectuées (dans une transaction) :**
1. Transfert du profil Student
   - `familyId` → famille de destination

2. Mise à jour du User étudiant
   - `familyId` → famille de destination
   - `userType: 'INDIVIDUAL'` → `'CHILD'`
   - `subscriptionPlan` → `'FAMILY_MEMBER'`
   - `monthlyPrice` → `0` (payé par la famille)

3. Mise à jour des compteurs
   - Famille destination : `currentMembersCount++`
   - Famille source : `currentMembersCount = 0`, `status = 'INACTIVE'`

**Exemple d'utilisation :**
```javascript
// Côté Parent
const response = await fetch('https://claudyne.com/api/students/123/transfer', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${parentToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    studentUserId: 'uuid-de-mon-enfant'
  })
});

// Réponse
{
  "success": true,
  "message": "Jean Dupont a été transféré avec succès vers votre famille !",
  "data": {
    "student": {...},
    "oldFamily": {
      "id": "...",
      "name": "Famille Jean Dupont",
      "status": "INACTIVE"
    },
    "newFamily": {
      "id": "...",
      "name": "Famille Martin",
      "membersCount": 2
    }
  }
}
```

---

## 📈 Scénarios d'usage

### Scénario 1 : Étudiant solo puis rejoint famille
1. Jean s'inscrit en tant que STUDENT → Famille virtuelle créée (8000 FCFA/mois)
2. Jean utilise Claudyne pendant 2 mois
3. La mère de Jean crée un compte PARENT → Vraie famille (15000 FCFA/mois)
4. La mère utilise l'endpoint `/transfer` pour rattacher Jean
5. Jean bénéficie maintenant de la formule familiale
6. La famille virtuelle de Jean devient INACTIVE

### Scénario 2 : Tentative d'abus (bloquée)
1. Utilisateur s'inscrit en STUDENT → Famille virtuelle (8000 FCFA/mois)
2. Tentative d'ajout d'un 2ème étudiant
3. ❌ **BLOQUÉ** : Erreur 403 - "Compte individuel : impossible d'ajouter d'autres étudiants"
4. Message : "Pour la formule familiale, créez un compte Parent"

### Scénario 3 : Migration de données (déjà fait)
Les 6 étudiants existants sans `familyId` ont été migrés :
```sql
-- Script exécuté : fix_student_families_v2.sql
-- Résultat : 6 familles virtuelles créées
-- Statut : ✅ Complété
```

---

## 🛡️ Sécurité et Validation

### Niveaux de protection

1. **Modèle (Database hooks)**
   - Validation avant sauvegarde
   - Impossible de bypasser via SQL direct

2. **Routes API**
   - Vérifications métier
   - Messages d'erreur clairs

3. **Frontend** (à implémenter)
   - Désactivation UI pour actions impossibles
   - Messages informatifs

---

## 📝 TODO / Améliorations futures

### Court terme
- [ ] Interface frontend pour le transfert d'étudiant
- [ ] Code de transfert sécurisé (email/SMS)
- [ ] Email de confirmation post-transfert

### Moyen terme
- [ ] Tableau de bord parent : voir les demandes de transfert
- [ ] Historique des transferts dans les logs
- [ ] Notification au parent quand un enfant demande à rejoindre

### Long terme
- [ ] Système de "famille étendue" (plusieurs parents)
- [ ] Transfert entre vraies familles (avec accord)
- [ ] Analytics sur les patterns d'inscription

---

## 🧪 Tests recommandés

### Test 1 : Inscription étudiant individuel
```bash
# Vérifier la création automatique de famille virtuelle
curl -X POST https://claudyne.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "accountType": "STUDENT",
    "email": "test@example.com",
    "password": "Test123!",
    "firstName": "Test",
    "lastName": "Student",
    "educationLevel": "6EME",
    "acceptTerms": "true"
  }'
```

### Test 2 : Tentative d'ajout étudiant (doit échouer)
```bash
# En tant que STUDENT, tenter d'ajouter un autre étudiant
curl -X POST https://claudyne.com/api/students \
  -H "Authorization: Bearer [student-token]" \
  -H "Content-Type: application/json" \
  -d '{...}'
# Attendu : 403 Forbidden
```

### Test 3 : Transfert réussi
```bash
# En tant que PARENT
curl -X POST https://claudyne.com/api/students/123/transfer \
  -H "Authorization: Bearer [parent-token]" \
  -H "Content-Type: application/json" \
  -d '{"studentUserId": "uuid-student"}'
# Attendu : 200 OK + données du transfert
```

---

## 📞 Support

En cas de problème :
1. Vérifier les logs backend : `pm2 logs claudyne-backend`
2. Vérifier la table `families` : `subscriptionType` doit être correct
3. Contacter le support technique

---

**Dernière mise à jour** : 1er novembre 2025
**Version** : 1.0
**Auteur** : Claude Code Assistant
