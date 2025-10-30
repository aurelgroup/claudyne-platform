/**
 * Modèle ApplicationDeadline Claudyne
 * Dates limites de candidature
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ApplicationDeadline = sequelize.define('ApplicationDeadline', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    institutionId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'institutions',
        key: 'id'
      }
    },
    programName: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    academicYear: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    deadlineType: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    deadlineDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'UPCOMING'
    },
    requirements: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    applicationUrl: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'application_deadlines',
    timestamps: true,
    indexes: [
      { fields: ['institutionId'] },
      { fields: ['deadlineDate'] },
      { fields: ['status'] }
    ]
  });

  ApplicationDeadline.associate = (models) => {
    ApplicationDeadline.belongsTo(models.Institution, {
      foreignKey: 'institutionId',
      as: 'institution'
    });
  };

  return ApplicationDeadline;
};
