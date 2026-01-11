# Guide d'Intégration Frontend - Système de Tickets de Paiement
**Date:** 2025-12-04
**Statut:** ✅ Backend validé + Frontend déployé

---

## 📦 Ce qui a été créé

### 1. Modal Utilisateur (`payment-ticket-modal.html`)
**URL:** https://www.claudyne.com/payment-ticket-modal.html

**Fonctionnalités:**
- ✅ Wizard en 3 étapes (Plan → Détails → Preuve)
- ✅ Sélection de formule (Famille, Étudiant, Enseignant)
- ✅ Formulaire de paiement (méthode, téléphone, ID transaction)
- ✅ Upload de preuve (drag & drop, 5MB max, JPG/PNG/WEBP/PDF)
- ✅ Preview d'image avant soumission
- ✅ Appel API `POST /api/payment-tickets/submit`
- ✅ Upload automatique de la preuve `POST /api/payment-tickets/:id/upload-proof`
- ✅ Affichage du numéro de ticket (TKT-2025-XXXXX)
- ✅ Responsive (mobile-friendly)

### 2. Interface Admin (`admin-payment-tickets.html`)
**URL:** https://www.claudyne.com/admin-payment-tickets.html

**Fonctionnalités:**
- ✅ Dashboard avec statistiques en temps réel
- ✅ Liste des tickets avec filtres (statut, méthode, tri)
- ✅ Vue détaillée de chaque ticket (modal)
- ✅ Visualisation de la preuve de paiement
- ✅ Approbation/Rejet avec notes admin
- ✅ Auto-refresh toutes les 30 secondes (tickets pending)
- ✅ Indicateur de tickets en retard (>24h)
- ✅ Responsive

---

## 🔗 Intégration dans les Interfaces Existantes

### Option 1: Lien Direct (Plus Simple)

#### Dans l'Interface Parent (parent-interface.html)

**Ajouter un bouton "Payer manuellement" dans la section paiements:**

```html
<!-- Dans la section de renouvellement d'abonnement -->
<div class="payment-options">
    <button onclick="openPaymentTicketModal()">
        💳 Soumettre un paiement manuel
    </button>
</div>

<script>
function openPaymentTicketModal() {
    window.open('/payment-ticket-modal.html', 'paymentTicket', 'width=700,height=800');
}
</script>
```

#### Dans l'Interface Admin (admin-interface.html)

**Ajouter un lien dans le menu de navigation:**

```html
<nav>
    <a href="/admin-payment-tickets.html">💳 Tickets de Paiement</a>
</nav>
```

---

### Option 2: Intégration Inline (Plus Intégrée)

#### Pour l'Interface Parent

**Intégrer le modal en iframe:**

```html
<style>
.payment-ticket-iframe {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 9999;
    display: none;
}

.payment-ticket-iframe.show {
    display: block;
}

.payment-ticket-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 9998;
    display: none;
}

.payment-ticket-backdrop.show {
    display: block;
}
</style>

<!-- Bouton pour ouvrir -->
<button onclick="showPaymentTicketModal()">
    💳 Soumettre un paiement manuel
</button>

<!-- Backdrop + iframe -->
<div class="payment-ticket-backdrop" id="paymentBackdrop" onclick="hidePaymentTicketModal()"></div>
<iframe class="payment-ticket-iframe" id="paymentIframe" src="/payment-ticket-modal.html"></iframe>

<script>
function showPaymentTicketModal() {
    document.getElementById('paymentBackdrop').classList.add('show');
    document.getElementById('paymentIframe').classList.add('show');
}

function hidePaymentTicketModal() {
    document.getElementById('paymentBackdrop').classList.remove('show');
    document.getElementById('paymentIframe').classList.remove('show');
}

// Écouter les messages du modal (quand l'utilisateur ferme)
window.addEventListener('message', (event) => {
    if (event.data === 'closePaymentModal') {
        hidePaymentTicketModal();
    }
});
</script>
```

---

## 🎨 Personnalisation du Modal

### Changer les Couleurs

Dans `payment-ticket-modal.html`, modifier les variables CSS:

```css
/* Couleur principale */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
/* Changer pour vos couleurs */
background: linear-gradient(135deg, #votreCouleur1 0%, #votreCouleur2 100%);
```

### Ajouter/Modifier les Plans

Dans `payment-ticket-modal.html`, section `#step1`:

```html
<label class="plan-card" onclick="selectPlan(this, 'VOTRE_PLAN', 20000, 60)">
    <input type="radio" name="plan" value="VOTRE_PLAN_60">
    <div class="plan-name">🎓 Votre Plan</div>
    <div class="plan-price">20 000 FCFA</div>
    <div class="plan-duration">60 jours • Description</div>
</label>
```

---

## 📊 Afficher les Tickets Utilisateur

### Ajouter une Section "Mes Tickets" dans le Dashboard Parent

```html
<div class="my-tickets-section">
    <h2>📋 Mes Demandes de Paiement</h2>
    <div id="ticketsList"></div>
</div>

<script>
async function loadMyTickets() {
    const token = localStorage.getItem('claudyne_token');

    try {
        const response = await fetch('https://www.claudyne.com/api/payment-tickets/my-tickets', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();
        const tickets = result.data.tickets;

        const listHtml = tickets.map(ticket => `
            <div class="ticket-card">
                <div class="ticket-ref">${ticket.ticketReference}</div>
                <div class="ticket-amount">${ticket.amount} ${ticket.currency}</div>
                <div class="ticket-status status-${ticket.status.toLowerCase()}">
                    ${ticket.status === 'PENDING' ? '⏳ En attente' :
                      ticket.status === 'APPROVED' ? '✅ Approuvé' :
                      ticket.status === 'REJECTED' ? '❌ Rejeté' : ticket.status}
                </div>
                <div class="ticket-date">${new Date(ticket.createdAt).toLocaleDateString('fr-FR')}</div>
                ${ticket.rejectionReason ? `
                    <div class="rejection-reason">
                        <strong>Raison du rejet:</strong> ${ticket.rejectionReason}
                    </div>
                ` : ''}
            </div>
        `).join('');

        document.getElementById('ticketsList').innerHTML = listHtml || '<p>Aucun ticket</p>';

    } catch (error) {
        console.error('Erreur:', error);
    }
}

// Charger au démarrage
loadMyTickets();

// Rafraîchir toutes les minutes
setInterval(loadMyTickets, 60000);
</script>

<style>
.ticket-card {
    background: white;
    padding: 15px;
    border-radius: 8px;
    margin-bottom: 10px;
    border-left: 4px solid #e5e7eb;
}

.ticket-ref {
    font-weight: bold;
    font-family: monospace;
    color: #667eea;
}

.ticket-status {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.9rem;
    margin-top: 5px;
}

.status-pending {
    background: #fef3c7;
    color: #92400e;
}

.status-approved {
    background: #d1fae5;
    color: #065f46;
}

.status-rejected {
    background: #fee2e2;
    color: #991b1b;
}

.rejection-reason {
    margin-top: 10px;
    padding: 10px;
    background: #fee2e2;
    border-radius: 6px;
    font-size: 0.9rem;
    color: #991b1b;
}
</style>
```

---

## 🔔 UX pour Abonnements Expirés

### Afficher le Modal au Lieu de Bloquer

Dans votre middleware frontend qui détecte les abonnements expirés:

```javascript
// Au lieu de bloquer l'utilisateur
if (subscriptionExpired) {
    // Afficher un message avec option de paiement manuel
    showExpiredSubscriptionDialog();
}

function showExpiredSubscriptionDialog() {
    const dialog = `
        <div class="expired-dialog">
            <h2>⚠️ Abonnement Expiré</h2>
            <p>Votre abonnement a expiré le ${expiryDate}.</p>
            <p>Vous pouvez le renouveler dès maintenant :</p>

            <div class="renewal-options">
                <button onclick="openPaymentTicketModal()">
                    💳 Paiement Manuel
                    <small>Validation sous 24h</small>
                </button>

                <button onclick="openMobilePayment()">
                    📱 MTN/Orange Money
                    <small>Activation immédiate</small>
                </button>
            </div>

            <div class="info-box">
                <p>💡 <strong>Paiement manuel :</strong></p>
                <p>• Payez via MTN, Orange, ou virement</p>
                <p>• Envoyez une capture d'écran du reçu</p>
                <p>• Notre équipe valide en moins de 24h</p>
            </div>
        </div>
    `;

    // Afficher le dialog
    document.body.insertAdjacentHTML('beforeend', dialog);
}
```

---

## 📱 Notifications (À Implémenter)

### Backend Email Service (Exemple)

```javascript
// backend/src/services/emailService.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

async function sendTicketCreatedEmail(user, ticket) {
    await transporter.sendMail({
        from: 'Claudyne <noreply@claudyne.com>',
        to: user.email,
        subject: `✅ Ticket ${ticket.ticketReference} créé`,
        html: `
            <h2>Votre demande de paiement a été enregistrée</h2>
            <p>Bonjour ${user.firstName},</p>
            <p>Nous avons bien reçu votre demande de paiement.</p>

            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <strong>Référence:</strong> ${ticket.ticketReference}<br>
                <strong>Montant:</strong> ${ticket.amount} FCFA<br>
                <strong>Formule:</strong> ${ticket.planType}
            </div>

            <p><strong>Prochaines étapes:</strong></p>
            <ul>
                <li>Notre équipe va vérifier votre paiement</li>
                <li>Vous recevrez une notification sous 24h</li>
                <li>Votre abonnement sera activé dès validation</li>
            </ul>

            <p>Vous pouvez suivre l'état de votre demande sur votre tableau de bord.</p>
        `
    });
}

async function sendTicketApprovedEmail(user, ticket, family) {
    await transporter.sendMail({
        from: 'Claudyne <noreply@claudyne.com>',
        to: user.email,
        subject: `🎉 Ticket ${ticket.ticketReference} approuvé !`,
        html: `
            <h2>Votre paiement a été validé !</h2>
            <p>Bonjour ${user.firstName},</p>
            <p>Excellente nouvelle ! Votre paiement a été vérifié et approuvé.</p>

            <div style="background: #d1fae5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <strong>Référence:</strong> ${ticket.ticketReference}<br>
                <strong>Montant:</strong> ${ticket.amount} FCFA<br>
                <strong>Abonnement actif jusqu'au:</strong> ${new Date(family.subscriptionEndsAt).toLocaleDateString('fr-FR')}
            </div>

            <p>🎓 Vous pouvez maintenant profiter de toutes les fonctionnalités Claudyne !</p>

            <a href="https://www.claudyne.com" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 15px;">
                Accéder à mon espace
            </a>
        `
    });
}

async function sendTicketRejectedEmail(user, ticket) {
    await transporter.sendMail({
        from: 'Claudyne <noreply@claudyne.com>',
        to: user.email,
        subject: `⚠️ Ticket ${ticket.ticketReference} - Action requise`,
        html: `
            <h2>Votre demande nécessite une action</h2>
            <p>Bonjour ${user.firstName},</p>
            <p>Malheureusement, nous n'avons pas pu valider votre paiement.</p>

            <div style="background: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <strong>Référence:</strong> ${ticket.ticketReference}<br>
                <strong>Raison:</strong> ${ticket.rejectionReason}
            </div>

            <p><strong>Que faire maintenant ?</strong></p>
            <ul>
                <li>Vérifiez que le paiement a bien été effectué</li>
                <li>Soumettez une nouvelle demande avec une preuve claire</li>
                <li>Contactez notre support si nécessaire: support@claudyne.com</li>
            </ul>

            <a href="https://www.claudyne.com/payment-ticket-modal.html" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 15px;">
                Soumettre une nouvelle demande
            </a>
        `
    });
}

module.exports = {
    sendTicketCreatedEmail,
    sendTicketApprovedEmail,
    sendTicketRejectedEmail
};
```

### Intégrer les Notifications dans les Routes

```javascript
// Dans paymentTickets.js après la création
const emailService = require('../services/emailService');

// Après création du ticket
await emailService.sendTicketCreatedEmail(req.user, ticket);

// Dans adminPaymentTickets.js après approbation
await emailService.sendTicketApprovedEmail(ticket.user, ticket, family);

// Après rejet
await emailService.sendTicketRejectedEmail(ticket.user, ticket);
```

---

## 🔍 Statistiques & Monitoring

### Tableau de Bord Admin - Métriques Supplémentaires

**Ajouter dans admin-payment-tickets.html:**

```javascript
async function loadDetailedStats() {
    const response = await fetch(`${API_URL}/api/admin/payment-tickets/stats/global`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
    });

    const result = await response.json();
    const stats = result.data;

    // Métriques avancées
    const approvalRate = (stats.overview.approvedCount /
        (stats.overview.approvedCount + stats.overview.rejectedCount) * 100).toFixed(1);

    const avgAmount = stats.overview.totalApprovedAmount / stats.overview.approvedCount;

    // Afficher
    document.getElementById('approval-rate').textContent = `${approvalRate}%`;
    document.getElementById('avg-amount').textContent = `${avgAmount.toFixed(0)} FCFA`;

    // Graphique par méthode de paiement
    renderPaymentMethodChart(stats.byPaymentMethod);
}

function renderPaymentMethodChart(methods) {
    const chartHtml = methods.map(m => `
        <div class="method-bar">
            <div class="method-label">${m.method}</div>
            <div class="method-bar-bg">
                <div class="method-bar-fill" style="width: ${m.count * 10}%"></div>
            </div>
            <div class="method-count">${m.count} tickets (${m.totalAmount} FCFA)</div>
        </div>
    `).join('');

    document.getElementById('method-chart').innerHTML = chartHtml;
}
```

---

## 🎯 Tests Recommandés

### Test Utilisateur
1. ✅ Ouvrir le modal
2. ✅ Sélectionner un plan
3. ✅ Remplir le formulaire
4. ✅ Uploader une image
5. ✅ Soumettre
6. ✅ Vérifier le numéro de ticket reçu
7. ✅ Vérifier dans "Mes tickets" que le statut est PENDING

### Test Admin
1. ✅ Voir le ticket en attente dans la liste
2. ✅ Ouvrir les détails du ticket
3. ✅ Voir la preuve de paiement
4. ✅ Approuver le ticket
5. ✅ Vérifier que l'abonnement a été étendu
6. ✅ Vérifier que le statut est APPROVED

---

## 📖 URLs de Production

| Interface | URL | Accès |
|-----------|-----|-------|
| Modal Paiement | https://www.claudyne.com/payment-ticket-modal.html | Utilisateurs connectés |
| Admin Tickets | https://www.claudyne.com/admin-payment-tickets.html | Administrateurs |
| API User | https://www.claudyne.com/api/payment-tickets/* | Token utilisateur |
| API Admin | https://www.claudyne.com/api/admin/payment-tickets/* | Token admin |

---

## 🚀 Prochaines Étapes

### Court Terme (Recommandé)
1. ✅ Intégrer le bouton dans l'interface parent
2. ✅ Ajouter le lien dans le menu admin
3. ✅ Tester le workflow complet
4. ⏳ Configurer le service d'emails (SMTP)
5. ⏳ Envoyer les notifications aux utilisateurs

### Moyen Terme (Améliorations)
1. ⏳ Ajouter SMS notifications (Twilio/Nexmo)
2. ⏳ Dashboard analytics détaillé
3. ⏳ Export Excel des tickets
4. ⏳ Historique des paiements par famille

### Long Terme (Automatisation)
1. ⏳ Intégration API MTN/Orange (quand disponible)
2. ⏳ Approbation automatique si API confirme
3. ⏳ Détection de doublons de transactions
4. ⏳ Machine learning pour détecter les fraudes

---

## 💡 Conseils d'Utilisation

### Pour les Utilisateurs
- **Délai de validation:** < 24 heures
- **Preuve recommandée:** Capture d'écran du SMS de confirmation
- **Formats acceptés:** JPG, PNG, WEBP, PDF
- **Taille max:** 5 MB

### Pour les Admins
- **Vérifier:** Montant, nom, numéro correspondent
- **SLA:** Répondre dans les 24h
- **Notes:** Toujours documenter la décision
- **En cas de doute:** Demander plus d'infos avant de rejeter

---

## 🐛 Problèmes Courants

### "Vous devez être connecté"
**Solution:** Vérifier que le token est dans localStorage
```javascript
console.log(localStorage.getItem('claudyne_token'));
```

### Upload ne fonctionne pas
**Solution:** Vérifier les permissions du dossier
```bash
ssh root@89.117.58.53 "chmod -R 755 /opt/claudyne/backend/uploads"
```

### Admin ne voit pas la preuve
**Solution:** Vérifier que le chemin est correct
```bash
ssh root@89.117.58.53 "ls -la /opt/claudyne/backend/uploads/payment-proofs/"
```

---

## 📞 Support

**Questions/Problèmes:**
- Backend API: Vérifier PM2 logs
- Frontend: Vérifier console navigateur
- Base de données: Vérifier table payment_tickets

**Documentation Complète:**
- `PAYMENT_TICKETS_IMPLEMENTATION_GUIDE.md` - Guide backend
- `PAYMENT_TICKETS_VALIDATION_REPORT.md` - Tests de validation
- `PAYMENT_TICKETS_DEPLOYMENT_SUMMARY.md` - Documentation API

---

**Déploiement Frontend Complet:** 2025-12-04 à 21:18 UTC
**Status:** ✅ **Prêt pour intégration**
