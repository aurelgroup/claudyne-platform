/**
 * Modèle Sequelize pour les Messages du Chat IA Mentor
 * Conversation avec l'IA Claudyne - Claudyne
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ChatMessage = sequelize.define('ChatMessage', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'students',
        key: 'id'
      }
    },
    sessionId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4
    },
    role: {
      type: DataTypes.ENUM,
      values: ['user', 'assistant', 'system'],
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    messageType: {
      type: DataTypes.ENUM,
      values: ['text', 'exercise', 'quiz', 'encouragement', 'correction', 'suggestion'],
      defaultValue: 'text'
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {
        sentiment: null,
        difficulty: null,
        subject: null,
        topics: [],
        aiModel: 'gpt-3.5-turbo',
        tokens: 0,
        confidence: null
      }
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    parentVisible: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'chat_messages',
    timestamps: true,
    indexes: [
      {
        fields: ['studentId', 'sessionId']
      },
      {
        fields: ['sessionId']
      },
      {
        fields: ['studentId', 'createdAt']
      }
    ]
  });

  return ChatMessage;
};