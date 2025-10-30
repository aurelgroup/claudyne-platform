/**
 * Modèle ForumDiscussion Claudyne
 * Discussions du forum communautaire
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ForumDiscussion = sequelize.define('ForumDiscussion', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'forum_categories',
        key: 'id'
      }
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
    isPinned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isLocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    viewsCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    repliesCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    likesCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    lastReplyAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lastReplyBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    tags: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'forum_discussions',
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ['categoryId'] },
      { fields: ['authorId'] },
      { fields: ['createdAt'] },
      { fields: ['isFeatured'] }
    ]
  });

  ForumDiscussion.associate = (models) => {
    ForumDiscussion.belongsTo(models.User, {
      foreignKey: 'authorId',
      as: 'author'
    });
    ForumDiscussion.belongsTo(models.User, {
      foreignKey: 'lastReplyBy',
      as: 'lastReplier'
    });
    ForumDiscussion.belongsTo(models.ForumCategory, {
      foreignKey: 'categoryId',
      as: 'category'
    });
    ForumDiscussion.hasMany(models.ForumPost, {
      foreignKey: 'discussionId',
      as: 'posts'
    });
  };

  return ForumDiscussion;
};
