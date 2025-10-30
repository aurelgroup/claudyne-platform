/**
 * Modèle BattleParticipation Claudyne
 * Participations aux batailles royales
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const BattleParticipation = sequelize.define('BattleParticipation', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    battleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'battles',
        key: 'id'
      }
    },
    studentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'students',
        key: 'id'
      }
    },
    score: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    rank: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    questionsAnswered: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    questionsCorrect: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    timeTaken: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    powerUpsUsed: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    answers: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'REGISTERED'
    },
    joinedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    finishedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    rewards: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'battle_participations',
    timestamps: true,
    indexes: [
      { fields: ['battleId'] },
      { fields: ['studentId'] },
      { fields: ['status'] },
      { fields: ['score'] },
      { unique: true, fields: ['battleId', 'studentId'] }
    ]
  });

  BattleParticipation.associate = (models) => {
    BattleParticipation.belongsTo(models.Battle, {
      foreignKey: 'battleId',
      as: 'battle'
    });
    BattleParticipation.belongsTo(models.Student, {
      foreignKey: 'studentId',
      as: 'student'
    });
  };

  return BattleParticipation;
};
