/**
 * Modèle Utilisateur Claudyne
 * Gère les comptes familiaux et individuels
 */

const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    
    // Informations de base
    email: {
      type: DataTypes.STRING,
      allowNull: true, // Peut être null si connexion par téléphone
      unique: true,
      validate: {
        isEmail: {
          msg: 'Format email invalide'
        }
      }
    },
    
    phone: {
      type: DataTypes.STRING,
      allowNull: true, // Peut être null si connexion par email
      unique: true,
      validate: {
        is: {
          args: /^(\+237|237)?[26][0-9]{8}$/,
          msg: 'Format téléphone camerounais invalide'
        },
        isValidOrEmpty(value) {
          // Permette les valeurs vides (null ou string vide)
          if (!value || value.trim() === '') {
            return;
          }
          // Valider le format uniquement si la valeur n'est pas vide
          if (!/^(\+237|237)?[26][0-9]{8}$/.test(value.trim())) {
            throw new Error('Format téléphone camerounais invalide');
          }
        }
      }
    },
    
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: {
          args: [6, 100],
          msg: 'Le mot de passe doit contenir au moins 6 caractères'
        }
      }
    },
    
    // Profil utilisateur
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: {
          args: [2, 50],
          msg: 'Le prénom doit contenir entre 2 et 50 caractères'
        }
      }
    },
    
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: {
          args: [2, 50],
          msg: 'Le nom doit contenir entre 2 et 50 caractères'
        }
      }
    },
    
    avatar: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null // URL vers l'avatar
    },
    
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    
    gender: {
      type: DataTypes.ENUM('M', 'F', 'OTHER'),
      allowNull: true
    },
    
    // Rôle et permissions
    role: {
      type: DataTypes.ENUM('PARENT', 'STUDENT', 'TEACHER', 'ADMIN', 'MODERATOR'),
      allowNull: false,
      defaultValue: 'PARENT'
    },

    userType: {
      type: DataTypes.ENUM('MANAGER', 'LEARNER', 'STUDENT', 'INDIVIDUAL'),
      allowNull: false,
      defaultValue: 'MANAGER', // MANAGER: gestionnaire famille, LEARNER: parent apprenant, STUDENT: enfant, INDIVIDUAL: compte individuel
      comment: 'Type d\'utilisateur pour l\'interface'
    },

    // Statut du compte
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },

    // Désactivation admin (nouvelle fonctionnalité)
    disabledBy: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'ID de l\'admin qui a désactivé ce compte'
    },

    disabledAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date de désactivation du compte par un admin'
    },

    disableReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Raison de la désactivation du compte'
    },
    
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    emailVerifiedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    phoneVerifiedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Sécurité
    twoFactorEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    twoFactorSecret: {
      type: DataTypes.STRING,
      allowNull: true
    },
    
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    lastLoginIp: {
      type: DataTypes.INET,
      allowNull: true
    },
    
    failedLoginAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    
    lockedUntil: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Tokens pour récupération et vérification
    resetPasswordToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    
    resetPasswordExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    emailVerificationToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    
    phoneVerificationCode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    
    phoneVerificationExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Préférences
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
    
    notificationPreferences: {
      type: DataTypes.JSONB,
      defaultValue: {
        email: true,
        sms: false,
        push: true,
        prixClaudine: true,
        battles: true,
        progress: true,
        payments: true
      }
    },
    
    // Métadonnées
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },

    // Gestion des abonnements (nouvelle fonctionnalité)
    subscriptionStatus: {
      type: DataTypes.ENUM('TRIAL', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED'),
      defaultValue: 'TRIAL',
      comment: 'Statut de l\'abonnement individuel (pour STUDENT, TEACHER)'
    },

    subscriptionPlan: {
      type: DataTypes.ENUM('INDIVIDUAL_STUDENT', 'INDIVIDUAL_TEACHER', 'FAMILY_MANAGER', 'NONE'),
      defaultValue: 'NONE',
      comment: 'Type d\'abonnement: INDIVIDUAL_STUDENT (8000 FCFA/mois), FAMILY_MANAGER (15000 FCFA/mois via Family)'
    },

    trialEndsAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '7 jours d\'essai gratuit pour tous les comptes'
    },

    subscriptionStartedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date de début de l\'abonnement payant'
    },

    subscriptionEndsAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date de fin de l\'abonnement (renouvellement mensuel)'
    },

    subscriptionCancelledAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date d\'annulation de l\'abonnement'
    },

    monthlyPrice: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
      comment: 'Prix mensuel de l\'abonnement en FCFA (8000 pour STUDENT, 15000 pour Family)'
    },

    lastPaymentDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date du dernier paiement'
    },

    nextPaymentDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date du prochain paiement (renouvellement automatique)'
    },

    autoRenew: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Renouvellement automatique de l\'abonnement'
    },

    // Relation avec la famille
    familyId: {
      type: DataTypes.UUID,
      allowNull: true, // Null pour les admins système et comptes individuels
      references: {
        model: 'Families',
        key: 'id'
      }
    }
  }, {
    tableName: 'users',
    timestamps: true,
    paranoid: true, // Soft delete
    
    indexes: [
      {
        unique: true,
        fields: ['email'],
        where: {
          deletedAt: null
        }
      },
      {
        unique: true,
        fields: ['phone'],
        where: {
          deletedAt: null
        }
      },
      {
        fields: ['familyId']
      },
      {
        fields: ['role']
      },
      {
        fields: ['isActive']
      },
      {
        fields: ['lastLoginAt']
      }
    ],
    
    // Validation au niveau du modèle
    validate: {
      // Doit avoir soit un email, soit un téléphone
      async emailOrPhone() {
        if (!this.email && !this.phone) {
          throw new Error('Un email ou un numéro de téléphone est requis');
        }
      },
      
      // Un seul gestionnaire par famille
      async uniqueFamilyManager() {
        if (this.userType === 'MANAGER' && this.familyId) {
          const existingManager = await User.findOne({
            where: {
              familyId: this.familyId,
              userType: 'MANAGER',
              id: { [sequelize.Sequelize.Op.ne]: this.id || 'new' }
            }
          });
          
          if (existingManager) {
            throw new Error('Une famille ne peut avoir qu\'un seul gestionnaire');
          }
        }
      }
    },
    
    // Hooks du modèle
    hooks: {
      // Hachage du mot de passe avant sauvegarde
      beforeSave: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      
      // Normalisation des données
      beforeValidate: (user) => {
        // Normalisation de l'email
        if (user.email) {
          user.email = user.email.toLowerCase().trim();
        }
        
        // Normalisation du téléphone
        if (user.phone) {
          user.phone = user.phone.replace(/\s+/g, '');
          // Ajouter +237 si pas présent
          if (!user.phone.startsWith('+') && !user.phone.startsWith('237')) {
            user.phone = '+237' + user.phone;
          }
        }
        
        // Normalisation des noms
        if (user.firstName) {
          user.firstName = user.firstName.trim().toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        }
        
        if (user.lastName) {
          user.lastName = user.lastName.trim().toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        }
      }
    }
  });
  
  // Méthodes d'instance
  User.prototype.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  };
  
  User.prototype.getFullName = function() {
    return `${this.firstName} ${this.lastName}`.trim();
  };
  
  User.prototype.isAccountLocked = function() {
    return !!(this.lockedUntil && this.lockedUntil > Date.now());
  };
  
  User.prototype.incrementLoginAttempts = async function() {
    if (this.lockedUntil && this.lockedUntil < Date.now()) {
      return this.update({
        failedLoginAttempts: 1,
        lockedUntil: null
      });
    }
    
    const updates = { 
      $inc: { failedLoginAttempts: 1 } 
    };
    
    if (this.failedLoginAttempts + 1 >= 5 && !this.isAccountLocked()) {
      updates.lockedUntil = Date.now() + 2 * 60 * 60 * 1000; // 2 heures
    }
    
    return this.update(updates);
  };
  
  User.prototype.resetLoginAttempts = async function() {
    return this.update({
      failedLoginAttempts: 0,
      lockedUntil: null
    });
  };
  
  User.prototype.updateLastLogin = async function(ip) {
    return this.update({
      lastLoginAt: new Date(),
      lastLoginIp: ip
    });
  };
  
  User.prototype.toSafeJSON = function() {
    const userObject = this.toJSON();
    delete userObject.password;
    delete userObject.twoFactorSecret;
    delete userObject.resetPasswordToken;
    delete userObject.emailVerificationToken;
    delete userObject.phoneVerificationCode;
    return userObject;
  };
  
  // Méthodes de classe
  User.findByEmailOrPhone = function(emailOrPhone) {
    const isEmail = emailOrPhone.includes('@');
    const whereClause = isEmail
      ? { email: emailOrPhone.toLowerCase() }
      : { phone: emailOrPhone };

    return this.findOne({ where: whereClause });
  };

  User.findByEmailPhoneOrUsername = function(credential) {
    const { Op } = sequelize.Sequelize;

    // Check if it's an email (contains @)
    if (credential.includes('@')) {
      return this.findOne({
        where: { email: credential.toLowerCase() }
      });
    }

    // Check if it's a phone number (starts with + or contains only numbers)
    if (/^(\+237|237)?[26][0-9]{8}$/.test(credential)) {
      return this.findOne({
        where: { phone: credential }
      });
    }

        // Otherwise treat as username - search by email, firstName, or lastName
    const lowercaseCredential = credential.toLowerCase();

    return this.findOne({
      where: {
        [Op.or]: [
          // Match by email (case-insensitive) - PRIMARY METHOD
          sequelize.where(
            sequelize.fn("LOWER", sequelize.col("email")),
            lowercaseCredential
          ),
          // Match by firstName (case-insensitive)
          sequelize.where(
            sequelize.fn("LOWER", sequelize.col("\"firstName\"")),
            lowercaseCredential
          ),
          // Match by lastName (case-insensitive)
          sequelize.where(
            sequelize.fn("LOWER", sequelize.col("\"lastName\"")),
            lowercaseCredential
          )
        ]
      }
    });
  };
  
  User.createFamilyManager = async function(userData, familyId) {
    return this.create({
      ...userData,
      role: 'PARENT',
      userType: 'MANAGER',
      familyId
    });
  };
  
  return User;
};