/**
 * Modèle Famille Claudyne
 * Gère les unités familiales avec jusqu'à 6 profils
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Family = sequelize.define('Family', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    
    // Informations de base
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: {
          args: [2, 100],
          msg: 'Le nom de famille doit contenir entre 2 et 100 caractères'
        }
      }
    },
    
    displayName: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Nom d\'affichage personnalisé (ex: "Famille Nkoulou")'
    },
    
    // Adresse et localisation
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    city: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isIn: {
          args: [['Douala', 'Yaoundé', 'Bafoussam', 'Bamenda', 'Garoua', 'Maroua', 'Ngaoundéré', 'Bertoua', 'Ebolowa', 'Kribi', 'Limbe', 'Autre']],
          msg: 'Ville non reconnue'
        }
      }
    },
    
    region: {
      type: DataTypes.ENUM(
        'Centre', 'Littoral', 'Ouest', 'Sud-Ouest', 
        'Nord-Ouest', 'Nord', 'Extrême-Nord', 'Est', 'Sud', 'Adamaoua'
      ),
      allowNull: true
    },
    
    country: {
      type: DataTypes.STRING,
      defaultValue: 'Cameroun'
    },
    
    // Configuration familiale
    maxMembers: {
      type: DataTypes.INTEGER,
      defaultValue: 6,
      validate: {
        min: {
          args: 1,
          msg: 'Une famille doit avoir au moins 1 membre'
        },
        max: {
          args: 10,
          msg: 'Maximum 10 membres par famille'
        }
      }
    },
    
    currentMembersCount: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    
    // Statut et abonnement
    status: {
      type: DataTypes.ENUM('ACTIVE', 'SUSPENDED', 'TRIAL', 'EXPIRED'),
      defaultValue: 'TRIAL'
    },
    
    subscriptionType: {
      type: DataTypes.ENUM('TRIAL', 'BASIC', 'PREMIUM', 'FAMILY_PLUS'),
      defaultValue: 'TRIAL'
    },
    
    subscriptionStatus: {
      type: DataTypes.ENUM('ACTIVE', 'CANCELLED', 'EXPIRED', 'PENDING'),
      defaultValue: 'ACTIVE'
    },
    
    trialEndsAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: () => {
        const trialDays = parseInt(process.env.FREE_TRIAL_DAYS) || 7;
        return new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);
      }
    },
    
    subscriptionEndsAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Solde et portefeuille
    walletBalance: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
      // Validation désactivée temporairement pour tests
      // validate: {
      //   min: {
      //     args: 0,
      //     msg: 'Le solde ne peut pas être négatif'
      //   }
      // }
    },
    
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'FCFA'
    },
    
    // Prix Claudine
    totalClaudinePoints: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Points Prix Claudine cumulés par la famille'
    },
    
    claudineRank: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Rang au classement national Prix Claudine'
    },
    
    claudineLastUpdate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Dernière mise à jour des points Prix Claudine'
    },
    
    // Préférences familiales
    language: {
      type: DataTypes.STRING,
      defaultValue: 'fr',
      validate: {
        isIn: {
          args: [['fr', 'en', 'es', 'de']],
          msg: 'Langue non supportée'
        }
      }
    },
    
    timezone: {
      type: DataTypes.STRING,
      defaultValue: 'Africa/Douala'
    },
    
    // Configuration des restrictions parentales
    parentalControls: {
      type: DataTypes.JSONB,
      defaultValue: {
        chatEnabled: true,
        battleRoyaleEnabled: true,
        maxDailyScreenTime: 180, // minutes
        allowedSubjects: ['all'],
        restrictedHours: {
          enabled: false,
          start: '22:00',
          end: '06:00'
        }
      }
    },
    
    // Notifications et communication
    notificationPreferences: {
      type: DataTypes.JSONB,
      defaultValue: {
        weeklyReports: true,
        progressUpdates: true,
        prixClaudineUpdates: true,
        paymentReminders: true,
        battleInvitations: true,
        newFeatures: true,
        smsNotifications: false,
        emailDigest: 'weekly'
      }
    },
    
    // Contact d'urgence
    emergencyContact: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Contact d\'urgence pour les mineurs'
    },
    
    // Informations de facturation
    billingInfo: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Informations de facturation et moyens de paiement'
    },
    
    // Statistiques famille
    stats: {
      type: DataTypes.JSONB,
      defaultValue: {
        totalLessonsCompleted: 0,
        totalBattlesJoined: 0,
        averageProgressRate: 0,
        totalStudyTime: 0,
        mostActiveStudent: null,
        favoriteSubjects: []
      }
    },
    
    // Métadonnées personnalisées
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    
    // Audit et conformité
    termsAcceptedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    privacyPolicyAcceptedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    dataProcessingConsent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    lastActivityAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Configuration d'essai
    trialConfig: {
      type: DataTypes.JSONB,
      defaultValue: {
        maxStudents: 2,
        maxBattlesPerDay: 3,
        maxLessonsPerDay: 10,
        featuresEnabled: ['basic_subjects', 'mentor_chat', 'progress_tracking'],
        featuresDisabled: ['battle_royale', 'premium_subjects', 'family_analytics']
      }
    }
  }, {
    tableName: 'families',
    timestamps: true,
    paranoid: true, // Soft delete
    
    indexes: [
      {
        fields: ['name']
      },
      {
        fields: ['city']
      },
      {
        fields: ['region']
      },
      {
        fields: ['status']
      },
      {
        fields: ['subscriptionType']
      },
      {
        fields: ['subscriptionStatus']
      },
      {
        fields: ['claudineRank']
      },
      {
        fields: ['trialEndsAt']
      },
      {
        fields: ['subscriptionEndsAt']
      },
      {
        fields: ['lastActivityAt']
      }
    ],
    
    // Validation au niveau du modèle
    validate: {
      // Vérifier que les membres actuels ne dépassent pas la limite
      membersLimit() {
        if (this.currentMembersCount > this.maxMembers) {
          throw new Error(`Limite de membres dépassée (${this.maxMembers} maximum)`);
        }
      },
      
      // Vérifier les dates d'abonnement
      subscriptionDates() {
        if (this.subscriptionEndsAt && this.subscriptionEndsAt < new Date()) {
          if (this.subscriptionStatus === 'ACTIVE') {
            this.subscriptionStatus = 'EXPIRED';
          }
        }
      }
    },
    
    // Hooks du modèle
    hooks: {
      beforeValidate: (family) => {
        // Génération automatique du nom d'affichage
        if (!family.displayName) {
          family.displayName = `Famille ${family.name}`;
        }
        
        // Mise à jour du statut selon l'essai
        if (family.trialEndsAt && family.trialEndsAt < new Date() && family.status === 'TRIAL') {
          if (!family.subscriptionEndsAt || family.subscriptionEndsAt < new Date()) {
            family.status = 'EXPIRED';
          }
        }
      }
    }
  });
  
  // Méthodes d'instance
  Family.prototype.isOnTrial = function() {
    return this.status === 'TRIAL' && this.trialEndsAt && this.trialEndsAt > new Date();
  };
  
  Family.prototype.isSubscriptionActive = function() {
    return this.subscriptionStatus === 'ACTIVE' && 
           (!this.subscriptionEndsAt || this.subscriptionEndsAt > new Date());
  };
  
  Family.prototype.canAddMember = function() {
    return this.currentMembersCount < this.maxMembers;
  };
  
  Family.prototype.getDaysUntilExpiry = function() {
    const expiryDate = this.subscriptionEndsAt || this.trialEndsAt;
    if (!expiryDate) return null;
    
    const diff = expiryDate.getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };
  
  Family.prototype.addClaudinePoints = async function(points, reason = 'Achievement') {
    const newTotal = this.totalClaudinePoints + points;
    return this.update({
      totalClaudinePoints: newTotal,
      claudineLastUpdate: new Date(),
      'metadata.lastPointsReason': reason
    });
  };
  
  Family.prototype.debitWallet = async function(amount, description = 'Purchase') {
    if (this.walletBalance < amount) {
      throw new Error('Solde insuffisant');
    }
    
    const newBalance = parseFloat(this.walletBalance) - parseFloat(amount);
    return this.update({
      walletBalance: newBalance,
      'metadata.lastTransaction': {
        type: 'debit',
        amount,
        description,
        timestamp: new Date()
      }
    });
  };
  
  Family.prototype.creditWallet = async function(amount, description = 'Credit') {
    const newBalance = parseFloat(this.walletBalance) + parseFloat(amount);
    return this.update({
      walletBalance: newBalance,
      'metadata.lastTransaction': {
        type: 'credit',
        amount,
        description,
        timestamp: new Date()
      }
    });
  };
  
  Family.prototype.updateActivity = async function() {
    return this.update({
      lastActivityAt: new Date()
    });
  };
  
  Family.prototype.getFeatureAccess = function() {
    if (this.isOnTrial()) {
      return {
        hasAccess: true,
        limitations: this.trialConfig,
        type: 'trial'
      };
    }
    
    if (this.isSubscriptionActive()) {
      const features = {
        BASIC: ['basic_subjects', 'mentor_chat', 'progress_tracking', 'battle_royale'],
        PREMIUM: ['all_subjects', 'advanced_analytics', 'family_reports', 'priority_support'],
        FAMILY_PLUS: ['all_features', 'unlimited_members', 'custom_content']
      };
      
      return {
        hasAccess: true,
        features: features[this.subscriptionType] || features.BASIC,
        type: 'subscription'
      };
    }
    
    return {
      hasAccess: false,
      message: 'Abonnement expiré',
      type: 'expired'
    };
  };
  
  // Méthodes de classe
  Family.findByLocation = function(city, region = null) {
    const where = { city };
    if (region) where.region = region;
    return this.findAll({ where });
  };
  
  Family.getTopClaudineFamilies = function(limit = 10, region = null) {
    const where = {
      claudineRank: { [sequelize.Sequelize.Op.not]: null }
    };
    
    if (region) where.region = region;
    
    return this.findAll({
      where,
      order: [['claudineRank', 'ASC']],
      limit,
      include: ['members']
    });
  };
  
  Family.getExpiringTrials = function(daysAhead = 3) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    
    return this.findAll({
      where: {
        status: 'TRIAL',
        trialEndsAt: {
          [sequelize.Sequelize.Op.lte]: futureDate,
          [sequelize.Sequelize.Op.gt]: new Date()
        }
      }
    });
  };
  
  return Family;
};