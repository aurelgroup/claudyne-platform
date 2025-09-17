/**
 * Modèle Sequelize pour les Notifications
 * Système de notifications push/email - Claudyne
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM,
      values: [
        'payment_success', 'payment_failed', 'subscription_expiring', 'subscription_expired',
        'lesson_completed', 'quiz_passed', 'achievement_unlocked', 'battle_invitation',
        'prix_claudine_nomination', 'system_maintenance', 'content_updated', 'message_received'
      ],
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    data: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    priority: {
      type: DataTypes.ENUM,
      values: ['low', 'normal', 'high', 'urgent'],
      defaultValue: 'normal'
    },
    channels: {
      type: DataTypes.JSONB,
      defaultValue: {
        inApp: true,
        email: false,
        sms: false,
        push: false
      }
    },
    emailSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    smsSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    pushSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'notifications',
    timestamps: true,
    indexes: [
      {
        fields: ['userId', 'isRead']
      },
      {
        fields: ['type']
      },
      {
        fields: ['createdAt']
      }
    ]
  });

  // Méthodes d'instance
  Notification.prototype.markAsRead = async function() {
    this.isRead = true;
    this.readAt = new Date();
    await this.save();
  };

  return Notification;
};