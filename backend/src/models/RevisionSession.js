/**
 * Modèle RevisionSession Claudyne
 * Sessions de révision actives
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RevisionSession = sequelize.define('RevisionSession', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    studentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'students',
        key: 'id'
      }
    },
    subjectId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    sessionType: {
      type: DataTypes.STRING(50),
      defaultValue: 'STANDARD'
    },
    startTime: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    durationMinutes: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    questionsAttempted: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    questionsCorrect: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    averageScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    difficultyLevel: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    progressData: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'revision_sessions',
    timestamps: true,
    indexes: [
      { fields: ['studentId'] },
      { fields: ['subjectId'] },
      { fields: ['isActive'] },
      { fields: ['startTime'] }
    ]
  });

  RevisionSession.associate = (models) => {
    RevisionSession.belongsTo(models.Student, {
      foreignKey: 'studentId',
      as: 'student'
    });
  };

  return RevisionSession;
};
