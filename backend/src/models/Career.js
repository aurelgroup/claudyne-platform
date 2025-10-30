/**
 * Modèle Career Claudyne
 * Métiers et carrières disponibles
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Career = sequelize.define('Career', {
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
    profileId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'career_profiles',
        key: 'id'
      }
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    requiredEducation: {
      type: DataTypes.STRING,
      allowNull: true
    },
    requiredSkills: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    averageSalaryMin: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    averageSalaryMax: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    growthOutlook: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    growthPercentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    demandLevel: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    workEnvironment: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    relatedSubjects: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    certifications: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    isTrending: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    icon: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    imageUrl: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'careers',
    timestamps: true,
    indexes: [
      { fields: ['profileId'] },
      { fields: ['category'] },
      { fields: ['isTrending'] }
    ]
  });

  Career.associate = (models) => {
    Career.belongsTo(models.CareerProfile, {
      foreignKey: 'profileId',
      as: 'profile'
    });
  };

  return Career;
};
