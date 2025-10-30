/**
 * Modèle StudyGroup Claudyne
 * Groupes d'étude pour la collaboration entre étudiants
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const StudyGroup = sequelize.define('StudyGroup', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [3, 255]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    subjectId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    level: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    region: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    maxMembers: {
      type: DataTypes.INTEGER,
      defaultValue: 50
    },
    currentMembersCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    moderatorId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    settings: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'study_groups',
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ['subjectId'] },
      { fields: ['level'] },
      { fields: ['region'] },
      { fields: ['isActive'] }
    ]
  });

  StudyGroup.associate = (models) => {
    StudyGroup.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
    StudyGroup.belongsTo(models.User, {
      foreignKey: 'moderatorId',
      as: 'moderator'
    });
    StudyGroup.hasMany(models.StudyGroupMember, {
      foreignKey: 'groupId',
      as: 'members'
    });
  };

  return StudyGroup;
};
