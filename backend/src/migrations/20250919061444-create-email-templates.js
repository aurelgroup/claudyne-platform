'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('email_templates', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      templateKey: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: 'Clé unique du template (ex: WELCOME, PASSWORD_RESET)'
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Nom affiché du template'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Description de l\'usage du template'
      },
      category: {
        type: Sequelize.ENUM(
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
      subject: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Sujet de l\'email avec variables possibles'
      },
      htmlContent: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Contenu HTML du template avec variables'
      },
      textContent: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Version texte du template'
      },
      variables: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: [],
        comment: 'Liste des variables disponibles dans ce template'
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: 'Template actif ou désactivé'
      },
      isDefault: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Template par défaut pour sa catégorie'
      },
      version: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        comment: 'Version du template pour le versioning'
      },
      createdBy: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'ID de l\'utilisateur créateur'
      },
      updatedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'ID de l\'utilisateur qui a modifié'
      },
      usageCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Nombre d\'utilisations du template'
      },
      lastUsedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Date de dernière utilisation'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Create indexes
    await queryInterface.addIndex('email_templates', ['templateKey'], {
      unique: true,
      name: 'email_templates_template_key_unique'
    });

    await queryInterface.addIndex('email_templates', ['category'], {
      name: 'email_templates_category_index'
    });

    await queryInterface.addIndex('email_templates', ['isActive'], {
      name: 'email_templates_is_active_index'
    });

    await queryInterface.addIndex('email_templates', ['isDefault', 'category'], {
      name: 'email_templates_is_default_category_index'
    });

    await queryInterface.addIndex('email_templates', ['createdBy'], {
      name: 'email_templates_created_by_index'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('email_templates');
  }
};