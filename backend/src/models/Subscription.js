/**
 * Modèle Sequelize pour les Abonnements
 * Gestion des souscriptions familiales - Claudyne
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Subscription = sequelize.define('Subscription', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    familyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'families',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM,
      values: ['trial', 'trial_extended', 'basic_monthly', 'premium_monthly', 'family_yearly', 'lifetime'],
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM,
      values: ['active', 'expired', 'cancelled', 'suspended'],
      defaultValue: 'active'
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lastPaymentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'payments',
        key: 'id'
      }
    },
    lastPaymentAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    autoRenew: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    features: {
      type: DataTypes.JSONB,
      defaultValue: {
        maxStudents: 1,
        premiumContent: false,
        aiMentor: false,
        battles: false,
        certificates: false,
        analytics: false,
        support: 'basic'
      }
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'subscriptions',
    timestamps: true,
    indexes: [
      {
        fields: ['familyId'],
        unique: true
      },
      {
        fields: ['status']
      },
      {
        fields: ['expiresAt']
      },
      {
        fields: ['type', 'status']
      }
    ]
  });

  // Méthodes d'instance
  Subscription.prototype.isActive = function() {
    return this.status === 'active' && this.expiresAt > new Date();
  };

  Subscription.prototype.daysRemaining = function() {
    if (!this.isActive()) return 0;
    const now = new Date();
    const diff = this.expiresAt.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  Subscription.prototype.extend = async function(days, reason = null) {
    const newExpiry = new Date(this.expiresAt.getTime() + days * 24 * 60 * 60 * 1000);
    this.expiresAt = newExpiry;
    if (reason) this.notes = reason;
    if (this.status === 'expired') this.status = 'active';
    await this.save();
    return this;
  };

  return Subscription;
};