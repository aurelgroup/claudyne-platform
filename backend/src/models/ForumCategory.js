/**
 * Modèle ForumCategory Claudyne
 * Catégories du forum
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ForumCategory = sequelize.define('ForumCategory', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    icon: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    color: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'forum_categories',
    timestamps: true
  });

  ForumCategory.associate = (models) => {
    ForumCategory.hasMany(models.ForumDiscussion, {
      foreignKey: 'categoryId',
      as: 'discussions'
    });
  };

  return ForumCategory;
};
