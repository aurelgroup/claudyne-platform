/**
 * Modèle ForumPost Claudyne
 * Réponses aux discussions du forum
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ForumPost = sequelize.define('ForumPost', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    discussionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'forum_discussions',
        key: 'id'
      }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    authorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    authorType: {
      type: DataTypes.STRING(50),
      defaultValue: 'STUDENT'
    },
    parentPostId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'forum_posts',
        key: 'id'
      }
    },
    isSolution: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    likesCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'forum_posts',
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ['discussionId'] },
      { fields: ['authorId'] },
      { fields: ['createdAt'] }
    ]
  });

  ForumPost.associate = (models) => {
    ForumPost.belongsTo(models.ForumDiscussion, {
      foreignKey: 'discussionId',
      as: 'discussion'
    });
    ForumPost.belongsTo(models.User, {
      foreignKey: 'authorId',
      as: 'author'
    });
    ForumPost.belongsTo(models.ForumPost, {
      foreignKey: 'parentPostId',
      as: 'parentPost'
    });
    ForumPost.hasMany(models.ForumPost, {
      foreignKey: 'parentPostId',
      as: 'replies'
    });
  };

  return ForumPost;
};
