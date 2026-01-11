# 🎫 Guide d'Implémentation: Système de Tickets de Paiement Manuel

## ✅ Étape 1: Base de Données (TERMINÉ)

La table `payment_tickets` est créée et opérationnelle avec:
- ✅ Table complète avec tous les champs
- ✅ 8 index optimisés
- ✅ Génération automatique des références (TKT-2025-XXXXX)
- ✅ Vue statistiques pour l'admin
- ✅ Triggers pour timestamps automatiques

---

## 📋 Étape 2: Modèle Sequelize (À FAIRE)

**Fichier:** `backend/src/models/PaymentTicket.js`

```javascript
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PaymentTicket = sequelize.define('PaymentTicket', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    ticketReference: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'ticket_reference'
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id'
    },
    familyId: {
      type: DataTypes.UUID,
      field: 'family_id'
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING(10),
      defaultValue: 'FCFA'
    },
    planType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'plan_type'
    },
    durationDays: {
      type: DataTypes.INTEGER,
      defaultValue: 30,
      field: 'duration_days'
    },
    paymentMethod: {
      type: DataTypes.ENUM('MTN_MOMO', 'ORANGE_MONEY', 'EXPRESS_UNION', 'BANK_TRANSFER', 'CASH', 'OTHER'),
      allowNull: false,
      field: 'payment_method'
    },
    phoneNumber: {
      type: DataTypes.STRING(20),
      field: 'phone_number'
    },
    transactionId: {
      type: DataTypes.STRING(100),
      field: 'transaction_id'
    },
    proofImageUrl: {
      type: DataTypes.TEXT,
      field: 'proof_image_url'
    },
    proofImageSize: {
      type: DataTypes.INTEGER,
      field: 'proof_image_size'
    },
    proofImageType: {
      type: DataTypes.STRING(50),
      field: 'proof_image_type'
    },
    proofUploadedAt: {
      type: DataTypes.DATE,
      field: 'proof_uploaded_at'
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED', 'PROCESSING'),
      defaultValue: 'PENDING'
    },
    reviewedBy: {
      type: DataTypes.UUID,
      field: 'reviewed_by'
    },
    reviewedAt: {
      type: DataTypes.DATE,
      field: 'reviewed_at'
    },
    processedAt: {
      type: DataTypes.DATE,
      field: 'processed_at'
    },
    autoExtended: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'auto_extended'
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      field: 'rejection_reason'
    },
    userNotes: {
      type: DataTypes.TEXT,
      field: 'user_notes'
    },
    adminNotes: {
      type: DataTypes.TEXT,
      field: 'admin_notes'
    },
    ipAddress: {
      type: DataTypes.STRING(50),
      field: 'ip_address'
    },
    userAgent: {
      type: DataTypes.TEXT,
      field: 'user_agent'
    }
  }, {
    tableName: 'payment_tickets',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  PaymentTicket.associate = (models) => {
    PaymentTicket.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    PaymentTicket.belongsTo(models.Family, {
      foreignKey: 'familyId',
      as: 'family'
    });
    PaymentTicket.belongsTo(models.User, {
      foreignKey: 'reviewedBy',
      as: 'reviewer'
    });
  };

  return PaymentTicket;
};
```

---

## 🔌 Étape 3: Routes API (À FAIRE)

**Fichier:** `backend/src/routes/paymentTickets.js`

### Routes Utilisateur

```javascript
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configuration multer pour upload de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/payment-proofs/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'proof-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Seuls les fichiers JPG, PNG et PDF sont autorisés'));
  }
});

// POST /api/payments/tickets - Créer un ticket
router.post('/', authenticate, upload.single('proofImage'), async (req, res) => {
  try {
    const { planType, paymentMethod, phoneNumber, transactionId, userNotes } = req.body;

    // Déterminer le montant selon le plan
    const planPrices = {
      'FAMILY_MANAGER': 15000,
      'INDIVIDUAL_STUDENT': 8000,
      'INDIVIDUAL_TEACHER': 8000
    };

    const ticket = await PaymentTicket.create({
      userId: req.user.id,
      familyId: req.user.familyId,
      amount: planPrices[planType] || 15000,
      planType,
      paymentMethod,
      phoneNumber,
      transactionId,
      userNotes,
      proofImageUrl: req.file ? `/uploads/payment-proofs/${req.file.filename}` : null,
      proofImageSize: req.file?.size,
      proofImageType: req.file?.mimetype,
      proofUploadedAt: req.file ? new Date() : null,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // TODO: Envoyer notification email/SMS à l'utilisateur
    // TODO: Notifier les admins

    res.status(201).json({
      success: true,
      message: 'Votre demande de paiement a été soumise avec succès',
      data: {
        ticketReference: ticket.ticketReference,
        status: ticket.status,
        estimatedReviewTime: '24 heures'
      }
    });
  } catch (error) {
    console.error('Erreur création ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du ticket',
      error: error.message
    });
  }
});

// GET /api/payments/tickets/my-tickets - Mes tickets
router.get('/my-tickets', authenticate, async (req, res) => {
  try {
    const tickets = await PaymentTicket.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 20
    });

    res.json({
      success: true,
      data: tickets
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des tickets'
    });
  }
});

// GET /api/payments/tickets/:id - Détails d'un ticket
router.get('/:id', authenticate, async (req, res) => {
  try {
    const ticket = await PaymentTicket.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket non trouvé'
      });
    }

    res.json({
      success: true,
      data: ticket
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du ticket'
    });
  }
});

module.exports = router;
```

### Routes Admin

**Fichier:** `backend/src/routes/adminPaymentTickets.js`

```javascript
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/admin/payments/tickets - Liste de tous les tickets
router.get('/', authenticate, authorize(['ADMIN', 'MODERATOR']), async (req, res) => {
  try {
    const { status = 'PENDING', page = 1, limit = 20 } = req.query;

    const tickets = await PaymentTicket.findAndCountAll({
      where: status ? { status } : {},
      include: [
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
        { model: Family, as: 'family', attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      data: {
        tickets: tickets.rows,
        total: tickets.count,
        page: parseInt(page),
        totalPages: Math.ceil(tickets.count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des tickets'
    });
  }
});

// POST /api/admin/payments/tickets/:id/approve - Approuver un ticket
router.post('/:id/approve', authenticate, authorize(['ADMIN']), async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { durationDays, adminNotes } = req.body;
    const ticket = await PaymentTicket.findByPk(req.params.id, { transaction });

    if (!ticket) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Ticket non trouvé'
      });
    }

    if (ticket.status !== 'PENDING') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Ce ticket a déjà été traité'
      });
    }

    // Mettre à jour le ticket
    await ticket.update({
      status: 'APPROVED',
      reviewedBy: req.user.id,
      reviewedAt: new Date(),
      processedAt: new Date(),
      adminNotes,
      durationDays: durationDays || ticket.durationDays
    }, { transaction });

    // Étendre l'abonnement de la famille
    const family = await Family.findByPk(ticket.familyId, { transaction });
    if (family) {
      const extensionDate = new Date();
      extensionDate.setDate(extensionDate.getDate() + (durationDays || ticket.durationDays));

      await family.update({
        status: 'ACTIVE',
        subscriptionStatus: 'ACTIVE',
        subscriptionEndsAt: extensionDate,
        trialEndsAt: null // Supprimer le trial si existe
      }, { transaction });
    }

    await transaction.commit();

    // TODO: Envoyer notification à l'utilisateur

    res.json({
      success: true,
      message: 'Paiement approuvé et abonnement étendu',
      data: { ticket, family }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Erreur approbation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'approbation du ticket'
    });
  }
});

// POST /api/admin/payments/tickets/:id/reject - Rejeter un ticket
router.post('/:id/reject', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const { rejectionReason, adminNotes } = req.body;
    const ticket = await PaymentTicket.findByPk(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket non trouvé'
      });
    }

    await ticket.update({
      status: 'REJECTED',
      reviewedBy: req.user.id,
      reviewedAt: new Date(),
      rejectionReason,
      adminNotes
    });

    // TODO: Envoyer notification à l'utilisateur

    res.json({
      success: true,
      message: 'Paiement rejeté',
      data: ticket
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors du rejet du ticket'
    });
  }
});

// GET /api/admin/payments/tickets/stats - Statistiques
router.get('/stats', authenticate, authorize(['ADMIN', 'MODERATOR']), async (req, res) => {
  try {
    const [stats] = await sequelize.query('SELECT * FROM payment_tickets_stats');

    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
});

module.exports = router;
```

---

## 🎨 Étape 4: Interface Utilisateur - Modal de Paiement

**Fichier:** `frontend/payment-ticket-modal.js` (à créer)

```javascript
// Modal de soumission de paiement

function showPaymentInstructions() {
  const modal = `
    <div class="payment-modal">
      <div class="modal-content">
        <h2>💳 Renouveler votre Abonnement</h2>

        <!-- Étape 1: Instructions -->
        <div class="payment-step" id="step-instructions">
          <div class="step-header">
            <span class="step-number">1</span>
            <h3>Effectuez le paiement</h3>
          </div>

          <div class="payment-info">
            <p><strong>Montant:</strong> 15,000 FCFA</p>
            <p><strong>Durée:</strong> 1 mois (30 jours)</p>
          </div>

          <div class="payment-methods">
            <div class="method">
              <img src="/images/mtn-logo.png" alt="MTN">
              <p><strong>MTN Mobile Money</strong></p>
              <code>#126*6*555555#</code>
            </div>

            <div class="method">
              <img src="/images/orange-logo.png" alt="Orange">
              <p><strong>Orange Money</strong></p>
              <code>#150*555555#</code>
            </div>
          </div>

          <p class="note">⚠️ Conservez votre SMS de confirmation</p>

          <button onclick="showProofUpload()" class="btn-next">
            Suivant: Envoyer la preuve
          </button>
        </div>

        <!-- Étape 2: Upload de preuve -->
        <div class="payment-step hidden" id="step-upload">
          <div class="step-header">
            <span class="step-number">2</span>
            <h3>Envoyez la preuve de paiement</h3>
          </div>

          <form id="proofUploadForm" enctype="multipart/form-data">
            <select name="paymentMethod" required>
              <option value="">-- Moyen de paiement --</option>
              <option value="MTN_MOMO">MTN Mobile Money</option>
              <option value="ORANGE_MONEY">Orange Money</option>
              <option value="EXPRESS_UNION">Express Union</option>
              <option value="BANK_TRANSFER">Virement Bancaire</option>
            </select>

            <input type="tel" name="phoneNumber"
                   placeholder="+237 6XX XXX XXX" required>

            <input type="text" name="transactionId"
                   placeholder="ID Transaction (optionnel)">

            <div class="file-upload">
              <label for="proofImage">
                📸 Capture d'écran de la confirmation
              </label>
              <input type="file" id="proofImage" name="proofImage"
                     accept="image/*,.pdf" required>
              <small>JPG, PNG ou PDF - Max 5MB</small>
            </div>

            <textarea name="userNotes"
                      placeholder="Notes additionnelles (optionnel)"></textarea>

            <button type="submit" class="btn-submit">
              📤 Soumettre la demande
            </button>
          </form>
        </div>

        <!-- Étape 3: Confirmation -->
        <div class="payment-step hidden" id="step-success">
          <div class="success-message">
            <span class="icon">✅</span>
            <h3>Demande soumise avec succès !</h3>
            <p>Référence: <strong id="ticketRef"></strong></p>
            <p>Notre équipe vérifiera votre paiement dans les <strong>24 heures</strong>.</p>
            <p>Vous recevrez un email dès validation.</p>
          </div>

          <button onclick="closePaymentModal()" class="btn-close">
            Fermer
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modal);

  // Gérer la soumission du formulaire
  document.getElementById('proofUploadForm').addEventListener('submit', submitPaymentTicket);
}

async function submitPaymentTicket(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  formData.append('planType', 'FAMILY_MANAGER'); // À adapter selon le compte

  try {
    const response = await fetch('/api/payments/tickets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('claudyne_token')}`
      },
      body: formData
    });

    const result = await response.json();

    if (result.success) {
      // Afficher l'étape de succès
      document.getElementById('step-upload').classList.add('hidden');
      document.getElementById('step-success').classList.remove('hidden');
      document.getElementById('ticketRef').textContent = result.data.ticketReference;
    } else {
      alert('Erreur: ' + result.message);
    }
  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur lors de la soumission. Veuillez réessayer.');
  }
}

function showProofUpload() {
  document.getElementById('step-instructions').classList.add('hidden');
  document.getElementById('step-upload').classList.remove('hidden');
}
```

---

## 👨‍💼 Étape 5: Interface Admin - Validation des Tickets

**Fichier:** `admin-secure/payment-tickets.html` (à intégrer)

```html
<div class="admin-section">
  <h2>📋 Paiements en Attente de Validation</h2>

  <!-- Statistiques -->
  <div class="stats-cards">
    <div class="stat-card">
      <span class="stat-number" id="pending-count">-</span>
      <span class="stat-label">En attente</span>
    </div>
    <div class="stat-card">
      <span class="stat-number" id="approved-today">-</span>
      <span class="stat-label">Approuvés aujourd'hui</span>
    </div>
    <div class="stat-card">
      <span class="stat-number" id="avg-review-time">-</span>
      <span class="stat-label">Délai moyen (h)</span>
    </div>
  </div>

  <!-- Liste des tickets -->
  <table class="tickets-table">
    <thead>
      <tr>
        <th>Référence</th>
        <th>Utilisateur</th>
        <th>Montant</th>
        <th>Moyen</th>
        <th>Preuve</th>
        <th>Date</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody id="tickets-list">
      <!-- Rempli dynamiquement -->
    </tbody>
  </table>
</div>

<script>
async function loadPendingTickets() {
  const response = await fetch('/api/admin/payments/tickets?status=PENDING', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('claudyne_token')}`
    }
  });

  const result = await response.json();

  if (result.success) {
    displayTickets(result.data.tickets);
  }
}

function displayTickets(tickets) {
  const tbody = document.getElementById('tickets-list');
  tbody.innerHTML = tickets.map(ticket => `
    <tr>
      <td><strong>${ticket.ticketReference}</strong></td>
      <td>
        ${ticket.user.firstName} ${ticket.user.lastName}<br>
        <small>${ticket.user.email}</small><br>
        <small>${ticket.phoneNumber}</small>
      </td>
      <td>${ticket.amount.toLocaleString()} FCFA</td>
      <td><span class="badge badge-${ticket.paymentMethod.toLowerCase()}">${ticket.paymentMethod}</span></td>
      <td>
        <img src="${ticket.proofImageUrl}" class="proof-thumbnail"
             onclick="viewFullImage('${ticket.proofImageUrl}')">
      </td>
      <td>${new Date(ticket.createdAt).toLocaleString()}</td>
      <td>
        <button class="btn-approve" onclick="approveTicket('${ticket.id}')">
          ✅ Approuver
        </button>
        <button class="btn-reject" onclick="showRejectModal('${ticket.id}')">
          ❌ Rejeter
        </button>
      </td>
    </tr>
  `).join('');
}

async function approveTicket(ticketId) {
  if (!confirm('Approuver ce paiement et activer l\'abonnement ?')) return;

  const response = await fetch(`/api/admin/payments/tickets/${ticketId}/approve`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('claudyne_token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      durationDays: 30,
      adminNotes: ''
    })
  });

  const result = await response.json();

  if (result.success) {
    alert('✅ Paiement approuvé et abonnement activé !');
    loadPendingTickets(); // Recharger la liste
  } else {
    alert('Erreur: ' + result.message);
  }
}
</script>
```

---

## 📧 Étape 6: Notifications (À CONFIGURER)

### Configuration Email

**Fichier:** `backend/src/services/emailService.js`

```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
  service: 'gmail', // ou votre service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

async function sendTicketCreatedEmail(user, ticket) {
  await transporter.sendMail({
    from: '"Claudyne" <noreply@claudyne.com>',
    to: user.email,
    subject: `✅ Demande de paiement reçue - ${ticket.ticketReference}`,
    html: `
      <h2>Demande de paiement reçue</h2>
      <p>Bonjour ${user.firstName},</p>
      <p>Votre demande de paiement a bien été enregistrée.</p>
      <p><strong>Référence:</strong> ${ticket.ticketReference}</p>
      <p><strong>Montant:</strong> ${ticket.amount} FCFA</p>
      <p><strong>Statut:</strong> En attente de validation</p>
      <p>Notre équipe vérifiera votre paiement dans les <strong>24 heures</strong>.</p>
      <p>Vous recevrez un email dès validation.</p>
      <p>Merci de votre confiance !<br>- Équipe Claudyne</p>
    `
  });
}

async function sendTicketApprovedEmail(user, ticket) {
  await transporter.sendMail({
    from: '"Claudyne" <noreply@claudyne.com>',
    to: user.email,
    subject: `🎉 Paiement validé - Abonnement activé !`,
    html: `
      <h2>Paiement validé !</h2>
      <p>Bonjour ${user.firstName},</p>
      <p>Votre paiement a été validé avec succès.</p>
      <p><strong>Référence:</strong> ${ticket.ticketReference}</p>
      <p>Votre abonnement est maintenant <strong>ACTIF</strong> pour <strong>${ticket.durationDays} jours</strong>.</p>
      <p>Vous pouvez dès maintenant profiter de tous les avantages Claudyne !</p>
      <p><a href="https://www.claudyne.com">Accéder à mon compte</a></p>
      <p>Merci de votre confiance !<br>- Équipe Claudyne</p>
    `
  });
}

module.exports = {
  sendTicketCreatedEmail,
  sendTicketApprovedEmail
};
```

---

## 🚀 Prochaines Étapes

### Immédiat (Essentiel)
1. ✅ Créer le modèle Sequelize `PaymentTicket.js`
2. ✅ Créer les routes utilisateur `/api/payments/tickets`
3. ✅ Créer les routes admin `/api/admin/payments/tickets`
4. ✅ Créer le dossier `uploads/payment-proofs/` avec permissions
5. ✅ Intégrer le modal frontend dans l'interface utilisateur
6. ✅ Intégrer l'interface admin dans `/admin-secure-k7m9x4n2p8w5z1c6`

### Court Terme (Important)
7. ⚙️ Configurer les notifications email
8. 📱 Ajouter les notifications SMS (Twilio/Nexmo)
9. 🎨 Styliser les interfaces (CSS)
10. 🧪 Tester le workflow complet

### Moyen Terme (Amélioration)
11. 📊 Ajouter page de statistiques admin détaillées
12. 🔔 Notifier les admins en temps réel (WebSocket)
13. 📅 Ajouter historique des paiements utilisateur
14. 💾 Backup automatique des preuves de paiement

### Long Terme (Préparation API)
15. 🔌 Préparer l'intégration API MTN/Orange
16. 🤖 Automatiser l'approbation si API retourne succès
17. 📈 Analytics avancées (taux de conversion, moyens préférés)

---

## 📝 Notes Importantes

### Sécurité
- ✅ Limiter taille fichiers (5MB max)
- ✅ Valider types de fichiers (JPG/PNG/PDF only)
- ✅ Stocker preuves hors de public/ (ou URLs signées)
- ⚠️ Ajouter rate limiting sur création de tickets
- ⚠️ Logger toutes les actions admin (audit trail)

### Performance
- ✅ Index déjà créés sur les colonnes importantes
- ⚠️ Ajouter pagination sur liste admin
- ⚠️ Compresser les images uploadées
- ⚠️ Mettre en place cache pour les stats

### UX
- ⚠️ Afficher délai estimé de validation
- ⚠️ Permettre de voir le statut en temps réel
- ⚠️ Envoyer rappel si ticket > 24h sans traitement
- ⚠️ Bouton "Contacter support" si rejeté

---

## ✅ Checklist de Déploiement

```bash
# 1. Créer le dossier uploads
mkdir -p /opt/claudyne/uploads/payment-proofs
chmod 755 /opt/claudyne/uploads/payment-proofs

# 2. Ajouter les variables d'environnement
echo "EMAIL_USER=your-email@gmail.com" >> /opt/claudyne/.env.production
echo "EMAIL_PASSWORD=your-app-password" >> /opt/claudyne/.env.production

# 3. Installer dépendances
cd /opt/claudyne/backend
npm install multer nodemailer

# 4. Redémarrer backend
pm2 restart claudyne-backend

# 5. Tester l'API
curl -X GET http://localhost:3001/api/payments/tickets/my-tickets \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

**🎉 La base est posée ! Commencez par implémenter les fichiers dans l'ordre numéroté ci-dessus.**
