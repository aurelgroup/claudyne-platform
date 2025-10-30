/**
 * Modèle Institution Claudyne
 * Établissements d'enseignement
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Institution = sequelize.define('Institution', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    type: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true
    },
    region: {
      type: DataTypes.STRING,
      allowNull: true
    },
    country: {
      type: DataTypes.STRING(100),
      defaultValue: 'Cameroun'
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    programs: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    specializations: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    admissionRequirements: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    acceptanceRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    tuitionFees: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    rankingNational: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    rankingInternational: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    accreditations: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    facilities: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    contactInfo: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    website: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    logoUrl: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'institutions',
    timestamps: true,
    indexes: [
      { fields: ['type'] },
      { fields: ['city'] },
      { fields: ['region'] },
      { fields: ['isFeatured'] }
    ]
  });

  Institution.associate = (models) => {
    Institution.hasMany(models.ApplicationDeadline, {
      foreignKey: 'institutionId',
      as: 'deadlines'
    });
  };

  return Institution;
};
