/**
 * Modèle EmailTemplate - Gestion des templates d'emails Claudyne
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const EmailTemplate = sequelize.define('EmailTemplate', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },

    // Identifiant unique du template
    templateKey: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Clé unique du template (ex: WELCOME, PASSWORD_RESET)'
    },

    // Nom affiché du template
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Nom affiché du template'
    },

    // Description du template
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Description de l\'usage du template'
    },

    // Catégorie du template
    category: {
      type: DataTypes.ENUM(
        'AUTH',        // Authentification (welcome, reset, verification)
        'NOTIFICATION', // Notifications générales
        'BATTLE',      // Battle Royale
        'PROGRESS',    // Progression et achievements
        'MARKETING',   // Marketing et promotions
        'SYSTEM'       // Notifications système
      ),
      allowNull: false,
      defaultValue: 'NOTIFICATION'
    },

    // Sujet de l'email
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Sujet de l\'email avec variables possibles'
    },

    // Contenu HTML de l'email
    htmlContent: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Contenu HTML du template avec variables'
    },

    // Contenu texte alternatif
    textContent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Version texte du template'
    },

    // Variables disponibles
    variables: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      comment: 'Liste des variables disponibles dans ce template'
    },

    // Template actif ou non
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Template actif ou désactivé'
    },

    // Template par défaut pour cette catégorie
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Template par défaut pour sa catégorie'
    },

    // Version du template
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: 'Version du template pour le versioning'
    },

    // ID de l'utilisateur qui a créé le template
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'ID de l\'utilisateur créateur'
    },

    // ID de l'utilisateur qui a modifié le template
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'ID de l\'utilisateur qui a modifié'
    },

    // Statistiques d'usage
    usageCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Nombre d\'utilisations du template'
    },

    // Dernière utilisation
    lastUsedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date de dernière utilisation'
    }

  }, {
    tableName: 'email_templates',
    timestamps: true,
    paranoid: true, // Soft delete

    indexes: [
      {
        fields: ['templateKey'],
        unique: true
      },
      {
        fields: ['category']
      },
      {
        fields: ['isActive']
      },
      {
        fields: ['isDefault', 'category']
      },
      {
        fields: ['createdBy']
      }
    ],

    // Hooks pour validation
    hooks: {
      beforeCreate: async (template) => {
        // Si c'est un template par défaut, désactiver les autres pour cette catégorie
        if (template.isDefault) {
          await EmailTemplate.update(
            { isDefault: false },
            {
              where: {
                category: template.category,
                isDefault: true
              }
            }
          );
        }
      },

      beforeUpdate: async (template) => {
        // Si on met ce template comme défaut, désactiver les autres
        if (template.changed('isDefault') && template.isDefault) {
          await EmailTemplate.update(
            { isDefault: false },
            {
              where: {
                category: template.category,
                isDefault: true,
                id: { [sequelize.Sequelize.Op.ne]: template.id }
              }
            }
          );
        }

        // Incrémenter la version si le contenu change
        if (template.changed('htmlContent') || template.changed('subject')) {
          template.version += 1;
        }
      }
    }
  });

  // Méthodes statiques
  EmailTemplate.getByKey = async function(templateKey) {
    return await this.findOne({
      where: {
        templateKey: templateKey,
        isActive: true
      }
    });
  };

  EmailTemplate.getDefault = async function(category) {
    return await this.findOne({
      where: {
        category: category,
        isDefault: true,
        isActive: true
      }
    });
  };

  EmailTemplate.incrementUsage = async function(templateId) {
    await this.update(
      {
        usageCount: sequelize.literal('usageCount + 1'),
        lastUsedAt: new Date()
      },
      { where: { id: templateId } }
    );
  };

  return EmailTemplate;
};