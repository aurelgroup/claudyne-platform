# 🧪 Guide de Test Utilisateur - Fonctionnalités Payment Tickets

**Date**: 5 décembre 2025
**Version**: 1.0

---

## 🎯 Objectif

Ce guide vous permet de tester toutes les nouvelles fonctionnalités liées aux tickets de paiement manuel.

---

## 📋 Préparation

### Étape 1: Vider le Cache du Navigateur

**TRÈS IMPORTANT**: Avant de commencer les tests, videz complètement le cache du navigateur.

**Méthode 1 - Hard Reload (Recommandé)**:
1. Appuyez sur `F12` pour ouvrir les DevTools
2. Faites un clic droit sur le bouton de rafraîchissement
3. Sélectionnez "Vider le cache et effectuer une actualisation forcée"

**Méthode 2 - Désinstaller le Service Worker**:
1. Appuyez sur `F12` → Onglet "Application"
2. Dans le menu de gauche: "Service Workers"
3. Cliquez sur "Unregister" pour chaque service worker
4. Onglet "Storage" → "Clear site data"
5. Fermez et rouvrez le navigateur

### Étape 2: Se Connecter

Connectez-vous avec un compte:
- **Étudiant**: Pour tester l'interface étudiant
- **Parent**: Pour tester l'interface parent
- **Admin**: Pour valider/rejeter les tickets

URL: https://claudyne.com

---

## 🧑‍🎓 Tests Interface Étudiant

### Test 1: Vérifier l'Affichage de l'Expiration d'Abonnement

**Objectif**: Vérifier que l'expiration d'abonnement s'affiche sous le profil

**Étapes**:
1. Connectez-vous comme étudiant
2. Sur la page d'accueil, regardez sous votre nom/profil
3. Vous devriez voir un bloc avec:
   - "Abonnement - X jours restants" (si actif)
   - "⚠️ Expire dans X jours" (si < 7 jours)
   - "⚠️ Abonnement expiré" (si expiré)

**Résultat attendu**: ✅ L'expiration est affichée avec la bonne couleur
- Vert: Plus de 7 jours restants
- Orange: Moins de 7 jours
- Rouge: Expiré

---

### Test 2: Accéder à la Section "Mes Tickets"

**Objectif**: Vérifier que le nouveau menu "Mes Tickets" est visible

**Étapes**:
1. Dans le menu de gauche, section "Abonnement"
2. Vous devriez voir deux options:
   - "Renouveler Abonnement" (bouton violet)
   - **"Mes Tickets"** (nouveau bouton)
3. Cliquez sur "Mes Tickets"

**Résultat attendu**: ✅ Une nouvelle page s'affiche avec:
- Un titre "🎫 Mes Tickets de Paiement"
- Trois cartes de statistiques (En attente, Approuvés, Rejetés)
- Un tableau vide ou avec vos tickets existants

---

### Test 3: Créer un Nouveau Ticket de Paiement

**Objectif**: Créer un ticket et vérifier qu'il apparaît dans la liste

**Étapes**:
1. Sur la page "Mes Tickets", cliquez sur "+ Nouveau ticket" (ou "Renouveler Abonnement")
2. Remplissez le formulaire:
   - Sélectionnez un plan (ex: Familiale 15000 XAF)
   - Méthode de paiement (ex: Orange Money)
   - Numéro de téléphone: 237698765432
   - ID Transaction: TEST123456
   - Téléchargez une capture d'écran comme justificatif
   - Notes (optionnel): "Test de déploiement"
3. Cliquez sur "Soumettre le ticket"

**Résultat attendu**: ✅
- Message de succès
- Le modal se ferme
- Le nouveau ticket apparaît dans la liste avec:
  - Une référence (ex: PAY-20251205-XXXXX)
  - Statut "En attente" (badge jaune)
  - Les informations saisies
- Les statistiques sont mises à jour (+1 en attente)

---

### Test 4: Voir les Détails d'un Ticket

**Objectif**: Vérifier que le modal de détails fonctionne

**Étapes**:
1. Dans la liste des tickets, cliquez sur le bouton "👁 Voir"
2. Un modal s'ouvre avec tous les détails

**Résultat attendu**: ✅ Le modal affiche:
- Référence du ticket
- Statut avec badge coloré
- Plan sélectionné
- Montant et devise
- Méthode de paiement
- Numéro de téléphone
- ID Transaction
- Date de création
- Bouton "Voir le justificatif" (si justificatif uploadé)

---

### Test 5: Vérifier le Rafraîchissement Automatique

**Objectif**: Vérifier que la liste se met à jour automatiquement

**Étapes**:
1. Restez sur la page "Mes Tickets"
2. Depuis un autre navigateur ou onglet (connecté en admin):
   - Approuvez ou rejetez un de vos tickets
3. Attendez 30 secondes maximum (sans rafraîchir la page)

**Résultat attendu**: ✅
- Le statut du ticket change automatiquement
- Les statistiques se mettent à jour
- L'expiration d'abonnement se met à jour (si ticket approuvé)

---

### Test 6: Ticket Rejeté - Affichage du Motif

**Objectif**: Vérifier que le motif de rejet s'affiche

**Prérequis**: Avoir un ticket rejeté par un admin

**Étapes**:
1. Allez sur "Mes Tickets"
2. Trouvez un ticket avec statut "Rejeté" (badge rouge)
3. Regardez juste en dessous du ticket dans la liste

**Résultat attendu**: ✅
- Une ligne supplémentaire apparaît sous le ticket
- Fond jaune avec le texte: "❌ Motif du rejet: [raison]"
- Le motif est également visible dans le modal de détails

---

## 👨‍👩‍👧 Tests Interface Parent

### Test 7: Section Tickets dans Finance

**Objectif**: Vérifier l'affichage dans l'interface parent

**Étapes**:
1. Connectez-vous comme parent
2. Allez sur la page "Finance" (menu de gauche)
3. Descendez jusqu'à la section "Mes Tickets de Paiement"

**Résultat attendu**: ✅
- Carte "Mes Tickets de Paiement" visible
- Trois statistiques (En attente, Approuvés, Rejetés)
- Liste des tickets avec tableau
- Bouton "+ Nouveau ticket"

---

### Test 8: Fonctionnalités Parent

**Objectif**: Vérifier que toutes les fonctionnalités fonctionnent

**Étapes**:
1. Créez un nouveau ticket (même processus que l'étudiant)
2. Vérifiez qu'il apparaît dans la liste
3. Cliquez sur "👁 Voir" pour voir les détails
4. Vérifiez le rafraîchissement automatique

**Résultat attendu**: ✅ Toutes les fonctionnalités identiques à l'interface étudiant

---

## 🔧 Tests Interface Admin

### Test 9: Affichage du Justificatif (Fix CORS)

**Objectif**: Vérifier que le justificatif s'affiche sans erreur

**Étapes**:
1. Connectez-vous comme admin
2. Allez sur https://claudyne.com/admin-payment-tickets.html
3. Sélectionnez un ticket avec justificatif
4. Cliquez sur "Voir le justificatif"

**Résultat attendu**: ✅
- Le justificatif s'affiche dans un nouvel onglet
- **PAS d'erreur "ERR_BLOCKED_BY_RESPONSE.NotSameOrigin"**
- L'image ou PDF s'affiche correctement

---

### Test 10: Validation Motif de Rejet Obligatoire

**Objectif**: Vérifier que le motif de rejet est obligatoire

**Étapes**:
1. Sélectionnez un ticket en attente
2. Cliquez sur "❌ Rejeter"
3. N'entrez PAS de motif de rejet
4. Cliquez sur "Confirmer le rejet"

**Résultat attendu**: ✅
- Message d'erreur: "Une raison de rejet est requise"
- Le ticket n'est PAS rejeté

**Étapes (suite)**:
5. Entrez un motif: "Justificatif illisible, veuillez soumettre une meilleure qualité"
6. Cliquez sur "Confirmer le rejet"

**Résultat attendu**: ✅
- Le ticket est rejeté
- Le statut passe à "REJECTED"
- Notification dans les logs

---

### Test 11: Approbation et Extension d'Abonnement

**Objectif**: Vérifier que l'approbation étend l'abonnement

**Prérequis**: Notez la date d'expiration actuelle de la famille

**Étapes**:
1. Sélectionnez un ticket en attente (ex: Plan Familial 30 jours)
2. Notez la durée du plan (durationDays)
3. Cliquez sur "✅ Approuver"
4. Confirmez l'approbation

**Résultat attendu**: ✅
- Le ticket passe à "APPROVED"
- La date d'expiration de la famille est étendue de X jours
- Notification envoyée (visible dans les logs)
- Côté utilisateur: l'expiration se met à jour automatiquement

---

### Test 12: Notifications dans les Logs

**Objectif**: Vérifier que les notifications sont loguées

**Étapes**:
1. SSH vers le serveur: `ssh root@89.117.58.53`
2. Commande: `pm2 logs claudyne-backend --lines 50`
3. Créez un ticket, approuvez-le ou rejetez-le
4. Regardez les logs

**Résultat attendu**: ✅ Vous devriez voir:

**À la création**:
```
info: Notification ticket créé envoyée à l'utilisateur
info: Notification nouveau ticket envoyée aux admins
```

**À l'approbation**:
```
info: Notification ticket approuvé envoyée
```

**Au rejet**:
```
info: Notification ticket rejeté envoyée
```

---

## 📊 Checklist Complète

Cochez chaque test après l'avoir réalisé:

### Interface Étudiant
- [ ] ✅ Expiration d'abonnement affichée
- [ ] ✅ Menu "Mes Tickets" visible
- [ ] ✅ Section "Mes Tickets" fonctionne
- [ ] ✅ Création de ticket
- [ ] ✅ Modal de détails
- [ ] ✅ Rafraîchissement automatique
- [ ] ✅ Motif de rejet affiché

### Interface Parent
- [ ] ✅ Section tickets dans Finance
- [ ] ✅ Toutes les fonctionnalités identiques

### Interface Admin
- [ ] ✅ Justificatif visible (pas d'erreur CORS)
- [ ] ✅ Motif de rejet obligatoire
- [ ] ✅ Approbation et extension d'abonnement
- [ ] ✅ Notifications dans les logs

---

## 🐛 Problèmes Connus et Solutions

### Problème: "Les modifications ne s'affichent pas"

**Solution**:
1. Vider le cache du navigateur (Ctrl+Shift+R)
2. Désinstaller le service worker (DevTools > Application > Service Workers > Unregister)
3. Fermer et rouvrir le navigateur

### Problème: "Erreur 401 Unauthorized"

**Solution**:
1. Se déconnecter
2. Se reconnecter
3. Vérifier que le token est valide dans localStorage

### Problème: "Les statistiques affichent 0"

**Solution**:
1. Créez au moins un ticket
2. Attendez 30 secondes ou rafraîchissez la page
3. Vérifiez que vous êtes bien connecté

### Problème: "Le justificatif ne s'affiche pas"

**Solution**:
1. Vérifiez que le fichier existe sur le serveur
2. Vérifiez les logs backend pour les erreurs
3. Essayez d'ouvrir l'URL directement dans le navigateur

---

## 📞 Support

En cas de problème:

1. **Vérifier les logs backend**:
   ```bash
   ssh root@89.117.58.53 "pm2 logs claudyne-backend"
   ```

2. **Vérifier la console du navigateur**:
   - F12 > Console
   - Recherchez les erreurs en rouge

3. **Tester les endpoints API**:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        https://claudyne.com/api/payment-tickets/my-tickets
   ```

---

## ✅ Validation Finale

Une fois tous les tests passés:

- ✅ Toutes les fonctionnalités fonctionnent
- ✅ Pas d'erreurs dans les logs
- ✅ Pas d'erreurs dans la console navigateur
- ✅ Les utilisateurs peuvent voir et gérer leurs tickets
- ✅ Les admins peuvent valider/rejeter avec motif
- ✅ Les notifications sont loguées

**🎉 Déploiement validé et prêt pour la production !**

---

**Document créé le 5 décembre 2025**
**Par Claude Code - Assistant de développement Anthropic**
