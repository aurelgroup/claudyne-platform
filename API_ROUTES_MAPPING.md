# API Routes Mapping - Claudyne

Ce document liste toutes les routes backend existantes et leur correspondance avec le service API frontend.

## Routes Backend Existantes

### 🔐 Auth (`/api/auth`)
- `POST /login` - Connexion utilisateur
- `POST /register` - Inscription utilisateur
- `POST /logout` - Déconnexion
- `POST /refresh` - Rafraîchir le token
- `POST /forgot-password` - Demande de réinitialisation MDP
- `POST /reset-password` - Réinitialisation MDP
- `GET /verify-email/:token` - Vérification email
- `POST /resend-verification` - Renvoyer email de vérification
- `POST /change-password` - Changer le MDP
- `POST /2fa/enable` - Activer 2FA
- `POST /2fa/verify` - Vérifier code 2FA
- `POST /2fa/disable` - Désactiver 2FA

### 👨‍🎓 Students (`/api/students`)
- `GET /profile` - Profil étudiant connecté
- `GET /` - Liste des étudiants de la famille
- `POST /` - Créer un nouvel étudiant
- `GET /:id` - Détails d'un étudiant
- `GET /:id/progress` - Progression d'un étudiant
- `GET /:id/analytics` - Analytics d'un étudiant
- `GET /dashboard` - Dashboard de l'étudiant connecté
- `GET /subjects` - Matières de l'étudiant
- `GET /achievements` - Récompenses/badges
- `GET /settings` - Paramètres de l'étudiant
- `PUT /settings` - Mettre à jour les paramètres
- `POST /change-password` - Changer le mot de passe

### 📚 Subjects (`/api/subjects`)
- `GET /` - Liste des matières
- `GET /:subjectId` - Détails d'une matière
- `GET /:subjectId/lessons` - Leçons d'une matière
- `GET /:subjectId/lessons/:lessonId` - Contenu d'une leçon
- `GET /:subjectId/lessons/:lessonId/quiz` - Quiz d'une leçon
- `POST /:subjectId/lessons/:lessonId/quiz` - Soumettre un quiz
- `POST /:subjectId/lessons/:lessonId/complete` - Marquer une leçon comme terminée
- `GET /search` - Recherche dans les matières

### 💳 Payments (`/api/payments`)
- `GET /methods` - Méthodes de paiement disponibles
- `GET /subscriptions/plans` - Plans d'abonnement
- `POST /initialize` - Initialiser un paiement
- `GET /:transactionId/status` - Statut d'un paiement
- `POST /wallet/topup` - Recharger le portefeuille
- `GET /history` - Historique des paiements
- `POST /webhook/maviance` - Webhook pour les paiements

### 📝 Quiz (`/api/quiz`)
- `GET /available` - Quiz disponibles
- `GET /challenges` - Défis hebdomadaires/quotidiens
- `GET /stats` - Statistiques quiz de l'étudiant
- `GET /:id` - Récupérer un quiz spécifique

### 📊 Progress (`/api/progress`)
- `GET /` - Progression globale de l'étudiant

### 🏆 Prix Claudine (`/api/prix-claudine`)
- `GET /` - Informations Prix Claudine
- `GET /ranking` - Classement Prix Claudine
- `POST /register` - S'inscrire au Prix Claudine

### ⚔️ Battles (`/api/battles`)
- `GET /` - Liste des battles
- `POST /:id/join` - Rejoindre une battle

### 🏫 Revisions (`/api/revisions`)
- `GET /` - Liste des révisions
- `POST /generate` - Générer un plan de révision
- `GET /sheets/:id` - Fiche de révision

### 🎯 Orientation (`/api/orientation`)
- `GET /recommendations` - Recommandations d'orientation
- `GET /careers` - Parcours de carrière
- `GET /institutions` - Établissements

### 💪 Wellness (`/api/wellness`)
- `GET /stats` - Statistiques bien-être
- `POST /study-session` - Enregistrer une session d'étude
- `GET /smart-break` - Suggestion de pause intelligente

### 👥 Community (`/api/community`)
- `GET /study-groups` - Groupes d'étude
- `POST /study-groups/:id/join` - Rejoindre un groupe
- `GET /leaderboard` - Classement général
- `GET /forum` - Posts du forum
- `POST /forum` - Créer un post

### 🤖 Mentor (`/api/mentor`)
- `POST /chat` - Envoyer un message au mentor IA
- `GET /history` - Historique des conversations

### 👨‍👩‍👧 Families (`/api/families`)
- `GET /me` - Informations de la famille
- `PUT /me` - Mettre à jour la famille

### 🔔 Notifications (`/api/notifications`)
- `GET /` - Liste des notifications
- `PUT /:id/read` - Marquer comme lue
- `PUT /read-all` - Tout marquer comme lu

### 🏥 Health Check
- `GET /api/health` - État de santé de l'API
- `GET /api/health/detailed` - État détaillé

### 👤 User Profile
- `GET /api/me` - Profil utilisateur
- `PUT /api/me` - Mettre à jour le profil
- `GET /api/stats` - Statistiques générales

## Routes Manquantes à Créer

### Lessons (endpoint séparé si nécessaire)
- `GET /api/lessons/:id` - Détails d'une leçon (actuellement dans subjects)
- `POST /api/lessons/:id/complete` - Compléter une leçon (actuellement dans subjects)

### Achievements (endpoint séparé)
Actuellement dans `/api/students/achievements`, pourrait être séparé en :
- `GET /api/achievements` - Tous les achievements disponibles
- `GET /api/achievements/unlocked` - Achievements débloqués

## Notes Importantes

### Différences par rapport au service api.ts initial

1. **Quiz** : Les quiz sont accessibles via deux chemins :
   - `/api/subjects/:subjectId/lessons/:lessonId/quiz` (endpoint principal)
   - `/api/quiz/:id` ou `/api/quiz/available` (endpoints auxiliaires)

2. **Progress** : Endpoint simple `/api/progress` (pas de sous-routes)

3. **Achievements** : Dans `/api/students/achievements` (pas `/api/achievements`)

4. **Subscriptions** : Les plans sont dans `/api/payments/subscriptions/plans` (pas `/api/subscriptions/plans`)

5. **Dashboard** : Dans `/api/students/dashboard` (pas de route séparée)

6. **Settings** : Dans `/api/students/settings` (pas de route séparée)

### Structure des Réponses

Toutes les réponses suivent le format :
```json
{
  "success": true|false,
  "message": "Message descriptif",
  "data": { ... },
  "error": "Message d'erreur si échec"
}
```

### Authentification

- Toutes les routes sauf `/api/auth/*` et `/api/health` requièrent un token JWT
- Token envoyé via header : `Authorization: Bearer <token>`
- Tokens stockés dans localStorage : `claudyne_token` et `claudyne_refresh_token`
