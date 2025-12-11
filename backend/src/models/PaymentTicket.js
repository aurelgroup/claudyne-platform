/**
 * Modèle Ticket de Paiement Manuel Claudyne
 * Gère les paiements en attente de validation admin (transition avant API telcos)
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PaymentTicket = sequelize.define('PaymentTicket', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },

    // Référence unique du ticket
    ticketReference: {
      type: DataTypes.STRING(50),
      allowNull: true, // Auto-généré par trigger PostgreSQL
      unique: true,
      comment: 'Format: TKT-2025-XXXXX (auto-généré par trigger PostgreSQL)'
    },

    // Relations
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },

    familyId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'family_id',
      references: {
        model: 'families',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },

    // Informations de paiement
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: {
          args: [0.01],
          msg: 'Le montant doit être positif'
        }
      }
    },

    currency: {
      type: DataTypes.STRING(10),
      defaultValue: 'FCFA',
      allowNull: false
    },

    planType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'plan_type',
      validate: {
        isIn: {
          args: [['FAMILY_MANAGER', 'INDIVIDUAL_STUDENT', 'INDIVIDUAL_TEACHER', 'PREMIUM', 'BASIC']],
          msg: 'Type de plan invalide'
        }
      }
    },

    durationDays: {
      type: DataTypes.INTEGER,
      defaultValue: 30,
      allowNull: false,
      field: 'duration_days',
      validate: {
        min: {
          args: 1,
          msg: 'La durée doit être d\'au moins 1 jour'
        }
      }
    },

    // Détails de la transaction
    paymentMethod: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'payment_method',
      validate: {
        isIn: {
          args: [['MTN_MOMO', 'ORANGE_MONEY', 'EXPRESS_UNION', 'BANK_TRANSFER', 'CASH', 'OTHER']],
          msg: 'Méthode de paiement invalide'
        }
      }
    },

    phoneNumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'phone_number',
      comment: 'Numéro utilisé pour le paiement mobile'
    },

    transactionId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'transaction_id',
      comment: 'ID de transaction fourni par l\'utilisateur'
    },

    // Preuve de paiement
    proofImageUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'proof_image_url',
      comment: 'Chemin vers le fichier de preuve uploadé'
    },

    proofImageSize: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'proof_image_size',
      comment: 'Taille du fichier en bytes'
    },

    proofImageType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'proof_image_type',
      comment: 'MIME type du fichier'
    },

    proofUploadedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'proof_uploaded_at'
    },

    // Statut et workflow
    status: {
      type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED', 'PROCESSING'),
      defaultValue: 'PENDING',
      allowNull: false,
      validate: {
        isIn: {
          args: [['PENDING', 'APPROVED', 'REJECTED', 'PROCESSING']],
          msg: 'Statut invalide'
        }
      }
    },

    reviewedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'reviewed_by',
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Admin qui a validé/rejeté le ticket'
    },

    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'reviewed_at'
    },

    processedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'processed_at',
      comment: 'Quand l\'extension a été appliquée après approbation'
    },

    autoExtended: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'auto_extended',
      comment: 'Si extension automatique via API telco (futur)'
    },

    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'rejection_reason'
    },

    // Notes et métadonnées
    userNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'user_notes',
      comment: 'Notes de l\'utilisateur lors de la soumission'
    },

    adminNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'admin_notes',
      comment: 'Notes internes de l\'admin'
    },

    // Sécurité et audit
    ipAddress: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'ip_address'
    },

    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'user_agent'
    }

  }, {
    tableName: 'payment_tickets',
    timestamps: true,
    underscored: true, // Utilise snake_case pour createdAt -> created_at

    indexes: [
      {
        fields: ['family_id']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['status', 'created_at'],
        where: {
          status: 'PENDING'
        }
      },
      {
        fields: ['reviewed_by'],
        where: {
          reviewed_by: { [sequelize.Sequelize.Op.not]: null }
        }
      }
    ],

    // Validation au niveau du modèle
    validate: {
      // Vérifier que le montant est cohérent avec le type de plan
      validateAmount() {
        const minAmounts = {
          FAMILY_MANAGER: 5000,
          INDIVIDUAL_STUDENT: 2000,
          INDIVIDUAL_TEACHER: 2000,
          PREMIUM: 10000,
          BASIC: 5000
        };

        const minAmount = minAmounts[this.planType] || 0;
        if (this.amount < minAmount) {
          throw new Error(`Montant minimum pour ${this.planType}: ${minAmount} ${this.currency}`);
        }
      },

      // Vérifier que les tickets approuvés ont un reviewer
      validateReviewer() {
        if ((this.status === 'APPROVED' || this.status === 'REJECTED') && !this.reviewedBy) {
          throw new Error('Un ticket approuvé ou rejeté doit avoir un reviewer');
        }
      }
    },

    // Hooks du modèle
    hooks: {
      beforeValidate: (ticket) => {
        // Normaliser le numéro de téléphone si présent
        if (ticket.phoneNumber) {
          ticket.phoneNumber = ticket.phoneNumber.trim();
        }

        // Nettoyer les espaces dans le transactionId
        if (ticket.transactionId) {
          ticket.transactionId = ticket.transactionId.trim();
        }
      },

      beforeUpdate: (ticket) => {
        // Définir reviewedAt lors du changement de statut
        if (ticket.changed('status') && (ticket.status === 'APPROVED' || ticket.status === 'REJECTED')) {
          if (!ticket.reviewedAt) {
            ticket.reviewedAt = new Date();
          }
        }

        // Définir processedAt lors du passage à APPROVED
        if (ticket.changed('status') && ticket.status === 'APPROVED') {
          if (!ticket.processedAt) {
            ticket.processedAt = new Date();
          }
        }
      }
    }
  });

  // Méthodes d'instance
  PaymentTicket.prototype.isPending = function() {
    return this.status === 'PENDING';
  };

  PaymentTicket.prototype.isApproved = function() {
    return this.status === 'APPROVED';
  };

  PaymentTicket.prototype.isRejected = function() {
    return this.status === 'REJECTED';
  };

  PaymentTicket.prototype.canBeEdited = function() {
    return this.status === 'PENDING';
  };

  PaymentTicket.prototype.approve = async function(adminId, adminNotes = null) {
    if (!this.isPending()) {
      throw new Error('Seuls les tickets PENDING peuvent être approuvés');
    }

    return this.update({
      status: 'APPROVED',
      reviewedBy: adminId,
      reviewedAt: new Date(),
      processedAt: new Date(),
      adminNotes: adminNotes || this.adminNotes
    });
  };

  PaymentTicket.prototype.reject = async function(adminId, rejectionReason, adminNotes = null) {
    if (!this.isPending()) {
      throw new Error('Seuls les tickets PENDING peuvent être rejetés');
    }

    if (!rejectionReason) {
      throw new Error('Une raison de rejet est requise');
    }

    return this.update({
      status: 'REJECTED',
      reviewedBy: adminId,
      reviewedAt: new Date(),
      rejectionReason,
      adminNotes: adminNotes || this.adminNotes
    });
  };

  PaymentTicket.prototype.getAge = function() {
    const now = new Date();
    const diff = now.getTime() - this.createdAt.getTime();
    return Math.floor(diff / (1000 * 3600)); // Age en heures
  };

  PaymentTicket.prototype.isOverdue = function(hoursThreshold = 24) {
    return this.isPending() && this.getAge() > hoursThreshold;
  };

  PaymentTicket.prototype.getPaymentMethodLabel = function() {
    const labels = {
      MTN_MOMO: 'MTN Mobile Money',
      ORANGE_MONEY: 'Orange Money',
      EXPRESS_UNION: 'Express Union',
      BANK_TRANSFER: 'Virement Bancaire',
      CASH: 'Espèces',
      OTHER: 'Autre'
    };
    return labels[this.paymentMethod] || this.paymentMethod;
  };

  PaymentTicket.prototype.getPlanTypeLabel = function() {
    const labels = {
      FAMILY_MANAGER: 'Gestionnaire Famille',
      INDIVIDUAL_STUDENT: 'Étudiant Individuel',
      INDIVIDUAL_TEACHER: 'Enseignant Individuel',
      PREMIUM: 'Premium',
      BASIC: 'Basic'
    };
    return labels[this.planType] || this.planType;
  };

  // Méthodes de classe
  PaymentTicket.getPendingTickets = function(limit = 50) {
    return this.findAll({
      where: { status: 'PENDING' },
      order: [['createdAt', 'ASC']],
      limit,
      include: [
        { association: 'user', attributes: ['id', 'email', 'firstName', 'lastName'] },
        { association: 'family', attributes: ['id', 'name'] }
      ]
    });
  };

  PaymentTicket.getOverdueTickets = function(hoursThreshold = 24) {
    const thresholdDate = new Date();
    thresholdDate.setHours(thresholdDate.getHours() - hoursThreshold);

    return this.findAll({
      where: {
        status: 'PENDING',
        createdAt: {
          [sequelize.Sequelize.Op.lt]: thresholdDate
        }
      },
      order: [['createdAt', 'ASC']],
      include: [
        { association: 'user', attributes: ['id', 'email', 'firstName', 'lastName'] },
        { association: 'family', attributes: ['id', 'name'] }
      ]
    });
  };

  PaymentTicket.getTicketsByUser = function(userId, limit = 20) {
    return this.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit
    });
  };

  PaymentTicket.getTicketsByFamily = function(familyId, limit = 20) {
    return this.findAll({
      where: { familyId },
      order: [['createdAt', 'DESC']],
      limit,
      include: [
        { association: 'user', attributes: ['id', 'email', 'firstName', 'lastName'] }
      ]
    });
  };

  PaymentTicket.getStatistics = async function() {
    const [pending, approved, rejected, last24h, overdue] = await Promise.all([
      this.count({ where: { status: 'PENDING' } }),
      this.count({ where: { status: 'APPROVED' } }),
      this.count({ where: { status: 'REJECTED' } }),
      this.count({
        where: {
          createdAt: {
            [sequelize.Sequelize.Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      }),
      this.count({
        where: {
          status: 'PENDING',
          createdAt: {
            [sequelize.Sequelize.Op.lt]: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    // Calcul du montant total approuvé
    const approvedTickets = await this.findAll({
      where: { status: 'APPROVED' },
      attributes: [[sequelize.fn('SUM', sequelize.col('amount')), 'total']]
    });

    const totalApprovedAmount = approvedTickets[0]?.get('total') || 0;

    return {
      pendingCount: pending,
      approvedCount: approved,
      rejectedCount: rejected,
      last24hCount: last24h,
      overdueCount: overdue,
      totalApprovedAmount: parseFloat(totalApprovedAmount)
    };
  };

  return PaymentTicket;
};
