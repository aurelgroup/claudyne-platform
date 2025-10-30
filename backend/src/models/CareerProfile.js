/**
 * Modèle CareerProfile Claudyne
 * Profils de carrière pour l'orientation professionnelle
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CareerProfile = sequelize.define('CareerProfile', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    characteristics: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    strengthSubjects: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    idealActivities: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    recommendedPaths: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    icon: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    color: {
      type: DataTypes.STRING(50),
      allowNull: true
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
    tableName: 'career_profiles',
    timestamps: true
  });

  CareerProfile.associate = (models) => {
    CareerProfile.hasMany(models.Career, {
      foreignKey: 'profileId',
      as: 'careers'
    });
  };

  return CareerProfile;
};
