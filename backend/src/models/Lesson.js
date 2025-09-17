/**
 * Modèle Sequelize pour les Leçons/Lessons
 * Système éducatif camerounais - Claudyne
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Lesson = sequelize.define('Lesson', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 200]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    subjectId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'subjects',
        key: 'id'
      }
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    type: {
      type: DataTypes.ENUM,
      values: ['video', 'interactive', 'reading', 'exercise', 'lab', 'quiz'],
      defaultValue: 'interactive'
    },
    difficulty: {
      type: DataTypes.ENUM,
      values: ['Débutant', 'Intermédiaire', 'Avancé'],
      defaultValue: 'Débutant'
    },
    estimatedDuration: {
      type: DataTypes.INTEGER, // en minutes
      defaultValue: 25
    },
    content: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        videoUrl: null,
        transcript: null,
        keyPoints: [],
        exercises: [],
        resources: [],
        downloadableFiles: []
      }
    },
    objectives: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    prerequisites: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    hasQuiz: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    quiz: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null
      // Structure: { questions: [], totalPoints: 0, passingScore: 0, timeLimit: null }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isPremium: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isFree: {
      type: DataTypes.BOOLEAN,
      defaultValue: false // Leçons spécifiquement gratuites
    },
    cameroonContext: {
      type: DataTypes.JSONB,
      defaultValue: {
        localExamples: [],
        culturalReferences: [],
        localLanguageTerms: {}
      }
    },
    stats: {
      type: DataTypes.JSONB,
      defaultValue: {
        viewCount: 0,
        completionCount: 0,
        averageScore: 0,
        averageTime: 0,
        likeCount: 0,
        difficulty_rating: 0
      }
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {
        tags: [],
        searchKeywords: [],
        language: 'fr',
        version: '1.0',
        authorNotes: null
      }
    },
    createdBy: {
      type: DataTypes.STRING,
      allowNull: true
    },
    reviewedBy: {
      type: DataTypes.STRING,
      allowNull: true
    },
    reviewStatus: {
      type: DataTypes.ENUM,
      values: ['draft', 'pending_review', 'approved', 'rejected', 'needs_revision'],
      defaultValue: 'draft'
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'lessons',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        fields: ['subjectId', 'order']
      },
      {
        fields: ['isActive']
      },
      {
        fields: ['isPremium']
      },
      {
        fields: ['isFree']
      },
      {
        fields: ['type']
      },
      {
        fields: ['reviewStatus']
      },
      {
        fields: ['subjectId', 'isActive', 'order']
      }
    ],
    scopes: {
      active: {
        where: {
          isActive: true,
          reviewStatus: 'approved'
        }
      },
      free: {
        where: {
          isFree: true,
          isActive: true,
          reviewStatus: 'approved'
        }
      },
      premium: {
        where: {
          isPremium: true,
          isActive: true,
          reviewStatus: 'approved'
        }
      },
      bySubject: (subjectId) => ({
        where: {
          subjectId,
          isActive: true,
          reviewStatus: 'approved'
        },
        order: [['order', 'ASC']]
      }),
      withQuiz: {
        where: {
          hasQuiz: true,
          isActive: true,
          reviewStatus: 'approved'
        }
      },
      pendingReview: {
        where: {
          reviewStatus: 'pending_review'
        }
      }
    }
  });

  // Méthodes d'instance
  Lesson.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());

    // Masquer le contenu complet pour les aperçus
    const publicData = {
      id: values.id,
      title: values.title,
      description: values.description,
      subjectId: values.subjectId,
      order: values.order,
      type: values.type,
      difficulty: values.difficulty,
      estimatedDuration: values.estimatedDuration,
      objectives: values.objectives,
      prerequisites: values.prerequisites,
      hasQuiz: values.hasQuiz,
      isActive: values.isActive,
      isPremium: values.isPremium,
      isFree: values.isFree,
      stats: values.stats,
      publishedAt: values.publishedAt,
      createdAt: values.createdAt,
      updatedAt: values.updatedAt
    };

    return publicData;
  };

  Lesson.prototype.getFullContent = function() {
    // Méthode pour obtenir le contenu complet (authentification requise)
    const values = Object.assign({}, this.get());
    return {
      ...this.toJSON(),
      content: values.content,
      quiz: values.quiz,
      cameroonContext: values.cameroonContext,
      metadata: values.metadata
    };
  };

  Lesson.prototype.updateStats = async function(action, value = 1) {
    const currentStats = this.stats || {};

    switch (action) {
      case 'view':
        currentStats.viewCount = (currentStats.viewCount || 0) + value;
        break;
      case 'complete':
        currentStats.completionCount = (currentStats.completionCount || 0) + value;
        break;
      case 'score':
        // Recalculer la moyenne des scores
        const totalScores = (currentStats.averageScore * currentStats.completionCount) + value;
        currentStats.averageScore = Math.round(totalScores / (currentStats.completionCount + 1));
        break;
      case 'time':
        // Recalculer le temps moyen
        const totalTime = (currentStats.averageTime * currentStats.completionCount) + value;
        currentStats.averageTime = Math.round(totalTime / (currentStats.completionCount + 1));
        break;
      case 'like':
        currentStats.likeCount = (currentStats.likeCount || 0) + value;
        break;
    }

    this.stats = currentStats;
    await this.save();
  };

  Lesson.prototype.canAccess = function(user, subscription = null) {
    // Vérifier si l'utilisateur peut accéder à cette leçon
    if (!this.isActive || this.reviewStatus !== 'approved') {
      return false;
    }

    // Leçons gratuites accessibles à tous
    if (this.isFree) {
      return true;
    }

    // Leçons premium nécessitent un abonnement
    if (this.isPremium) {
      return subscription && ['premium', 'family'].includes(subscription.type) && subscription.status === 'active';
    }

    // Leçons standard accessibles avec abonnement basique ou supérieur
    return subscription && subscription.status === 'active';
  };

  // Méthodes statiques
  Lesson.getBySubject = async function(subjectId, userAccess = null) {
    const lessons = await this.scope('bySubject', subjectId).findAll();

    if (!userAccess) {
      return lessons.filter(lesson => lesson.isFree);
    }

    return lessons.filter(lesson => lesson.canAccess(userAccess.user, userAccess.subscription));
  };

  Lesson.getFreeContent = async function(limit = 10) {
    return await this.scope('free').findAll({
      limit,
      order: [['stats.viewCount', 'DESC']]
    });
  };

  Lesson.search = async function(query, filters = {}) {
    const where = {
      isActive: true,
      reviewStatus: 'approved'
    };

    // Recherche textuelle
    if (query) {
      where[sequelize.Sequelize.Op.or] = [
        { title: { [sequelize.Sequelize.Op.iLike]: `%${query}%` } },
        { description: { [sequelize.Sequelize.Op.iLike]: `%${query}%` } },
        { 'metadata.searchKeywords': { [sequelize.Sequelize.Op.contains]: [query] } }
      ];
    }

    // Filtres additionnels
    if (filters.subjectId) where.subjectId = filters.subjectId;
    if (filters.type) where.type = filters.type;
    if (filters.difficulty) where.difficulty = filters.difficulty;
    if (filters.isPremium !== undefined) where.isPremium = filters.isPremium;
    if (filters.hasQuiz !== undefined) where.hasQuiz = filters.hasQuiz;

    return await this.findAll({
      where,
      order: [['stats.viewCount', 'DESC'], ['order', 'ASC']],
      limit: filters.limit || 20
    });
  };

  // Hooks
  Lesson.beforeCreate(async (lesson) => {
    // Définir automatiquement l'ordre si pas spécifié
    if (!lesson.order) {
      const maxOrder = await Lesson.max('order', {
        where: { subjectId: lesson.subjectId }
      });
      lesson.order = (maxOrder || 0) + 1;
    }

    // Définir publishedAt si approuvé
    if (lesson.reviewStatus === 'approved' && !lesson.publishedAt) {
      lesson.publishedAt = new Date();
    }
  });

  Lesson.afterCreate(async (lesson) => {
    // Mettre à jour les statistiques du sujet parent
    const Subject = sequelize.models.Subject;
    if (Subject) {
      const subject = await Subject.findByPk(lesson.subjectId);
      if (subject) {
        await subject.updateStats();
      }
    }
  });

  Lesson.afterUpdate(async (lesson) => {
    // Mettre à jour publishedAt si le statut change vers approuvé
    if (lesson.changed('reviewStatus') && lesson.reviewStatus === 'approved' && !lesson.publishedAt) {
      lesson.publishedAt = new Date();
      await lesson.save();
    }
  });

  Lesson.afterDestroy(async (lesson) => {
    // Mettre à jour les statistiques du sujet parent
    const Subject = sequelize.models.Subject;
    if (Subject) {
      const subject = await Subject.findByPk(lesson.subjectId);
      if (subject) {
        await subject.updateStats();
      }
    }
  });

  return Lesson;
};