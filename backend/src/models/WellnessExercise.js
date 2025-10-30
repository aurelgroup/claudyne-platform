/**
 * Modèle WellnessExercise Claudyne
 * Exercices de relaxation et bien-être
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const WellnessExercise = sequelize.define('WellnessExercise', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    difficulty: {
      type: DataTypes.STRING(50),
      defaultValue: 'BEGINNER'
    },
    instructions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    mediaUrl: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    mediaType: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    thumbnailUrl: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    benefits: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    tags: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'wellness_exercises',
    timestamps: true,
    indexes: [
      { fields: ['type'] },
      { fields: ['category'] },
      { fields: ['isActive'] }
    ]
  });

  return WellnessExercise;
};
