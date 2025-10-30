/**
 * Modèle StudyGroupMember Claudyne
 * Membres des groupes d'étude
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const StudyGroupMember = sequelize.define('StudyGroupMember', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    groupId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'study_groups',
        key: 'id'
      }
    },
    studentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Students',
        key: 'id'
      }
    },
    role: {
      type: DataTypes.STRING(50),
      defaultValue: 'MEMBER'
    },
    joinedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    lastActiveAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'study_group_members',
    timestamps: false,
    indexes: [
      { fields: ['groupId'] },
      { fields: ['studentId'] },
      { unique: true, fields: ['groupId', 'studentId'] }
    ]
  });

  StudyGroupMember.associate = (models) => {
    StudyGroupMember.belongsTo(models.StudyGroup, {
      foreignKey: 'groupId',
      as: 'group'
    });
    StudyGroupMember.belongsTo(models.Student, {
      foreignKey: 'studentId',
      as: 'student'
    });
  };

  return StudyGroupMember;
};
