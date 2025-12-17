/**
 * Modèle Sequelize pour les Ressources pédagogiques
 * Liens vers PDFs, vidéos, documents complémentaires
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Resource = sequelize.define('Resource', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 200]
      }
    },
    type: {
      type: DataTypes.ENUM,
      values: ['pdf', 'video', 'link', 'document', 'image', 'audio'],
      defaultValue: 'link'
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Catégorie: mathematiques, physique, francais, etc.'
    },
    level: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Niveau scolaire: cp, ce1, 6eme, etc.'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    is_premium: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    created_by: {
      type: DataTypes.STRING,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Métadonnées additionnelles (taille, durée, auteur, etc.)'
    }
  }, {
    tableName: 'resources',
    timestamps: true,
    underscored: true
  });

  return Resource;
};
