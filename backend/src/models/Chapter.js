/**
 * Modèle Sequelize pour les Chapitres
 * Organisation pédagogique des leçons - Claudyne
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Chapter = sequelize.define('Chapter', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    // Relation avec Subject
    subjectId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'subjects',
        key: 'id'
      },
      comment: 'Matière parente'
    },

    // Informations de base
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 200]
      },
      comment: 'Titre du chapitre (ex: Cinématique, Fonctions)'
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Description détaillée du chapitre'
    },

    // Organisation
    number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Numéro du chapitre (1, 2, 3...)',
      validate: {
        min: 1
      }
    },

    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Ordre d\'affichage (permet réorganisation sans changer number)'
    },

    // Contexte pédagogique camerounais
    trimester: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 3
      },
      comment: 'Trimestre (1, 2, 3) selon calendrier scolaire camerounais'
    },

    series: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Séries concernées pour lycée (A, C, D, TI). Vide = toutes séries'
      // Exemple: ['C', 'D'] pour un chapitre scientifique en Terminale
    },

    // Métadonnées pédagogiques
    objectives: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Objectifs pédagogiques du chapitre'
      // Exemple: ["Comprendre la cinématique", "Calculer vitesse et accélération"]
    },

    prerequisites: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Prérequis (chapitres ou concepts)'
      // Exemple: ["Chapitre 1: Vecteurs", "Notions de base en algèbre"]
    },

    competencies: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Compétences acquises selon curriculum camerounais'
      // Exemple: ["C1: Résoudre des problèmes", "C2: Modéliser"]
    },

    // Durée et difficulté
    estimatedDuration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Durée estimée totale du chapitre en minutes'
    },

    difficulty: {
      type: DataTypes.ENUM('Débutant', 'Intermédiaire', 'Avancé', 'Expert'),
      defaultValue: 'Intermédiaire'
    },

    // Programme officiel
    officialReference: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Référence au programme officiel camerounais'
      // Exemple: { code: "PHY-TLE-C-01", ministerialRef: "Arrêté N°...", page: 12 }
    },

    // Statut
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },

    isPremium: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Chapitre premium (nécessite abonnement)'
    },

    // Statistiques
    stats: {
      type: DataTypes.JSONB,
      defaultValue: {
        totalLessons: 0,
        avgCompletionRate: 0,
        avgScore: 0,
        avgTimeSpent: 0,
        enrolledStudents: 0
      }
    },

    // Métadonnées supplémentaires
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {
        tags: [],
        keywords: [],
        resources: [],
        examFocus: false, // Si important pour examens officiels
        bacWeight: 0 // Poids dans le Bac (si applicable)
      }
    },

    // Gestion
    createdBy: {
      type: DataTypes.STRING,
      allowNull: true
    },

    lastUpdatedBy: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'chapters',
    timestamps: true,
    paranoid: true,

    indexes: [
      {
        fields: ['subjectId', 'order']
      },
      {
        fields: ['subjectId', 'number']
      },
      {
        fields: ['isActive']
      },
      {
        fields: ['trimester']
      },
      {
        unique: true,
        fields: ['subjectId', 'number'],
        name: 'unique_chapter_number_per_subject'
      }
    ],

    scopes: {
      active: {
        where: {
          isActive: true
        }
      },
      bySubject: (subjectId) => ({
        where: {
          subjectId,
          isActive: true
        },
        order: [['order', 'ASC']]
      }),
      byTrimester: (trimester) => ({
        where: {
          trimester,
          isActive: true
        }
      }),
      bySeries: (series) => ({
        where: {
          series: {
            [sequelize.Sequelize.Op.contains]: [series]
          },
          isActive: true
        }
      })
    }
  });

  // Méthodes d'instance
  Chapter.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());

    return {
      id: values.id,
      subjectId: values.subjectId,
      title: values.title,
      description: values.description,
      number: values.number,
      order: values.order,
      trimester: values.trimester,
      series: values.series,
      objectives: values.objectives,
      prerequisites: values.prerequisites,
      competencies: values.competencies,
      estimatedDuration: values.estimatedDuration,
      difficulty: values.difficulty,
      officialReference: values.officialReference,
      isActive: values.isActive,
      isPremium: values.isPremium,
      stats: values.stats,
      metadata: values.metadata,
      createdAt: values.createdAt,
      updatedAt: values.updatedAt
    };
  };

  Chapter.prototype.updateStats = async function() {
    const Lesson = sequelize.models.Lesson;
    const Progress = sequelize.models.Progress;

    if (!Lesson) return;

    // Compter les leçons dans ce chapitre
    const totalLessons = await Lesson.count({
      where: { chapterId: this.id, isActive: true }
    });

    // Calculer les stats de progression
    let avgCompletionRate = 0;
    let avgScore = 0;
    let enrolledStudents = 0;

    if (Progress) {
      const lessons = await Lesson.findAll({
        where: { chapterId: this.id },
        attributes: ['id']
      });
      const lessonIds = lessons.map(l => l.id);

      if (lessonIds.length > 0) {
        const progressData = await Progress.findAll({
          where: {
            lessonId: { [sequelize.Sequelize.Op.in]: lessonIds }
          }
        });

        if (progressData.length > 0) {
          avgCompletionRate = progressData.reduce((sum, p) => sum + (p.completionPercentage || 0), 0) / progressData.length;
          avgScore = progressData.reduce((sum, p) => sum + (p.lastScore || 0), 0) / progressData.length;
          enrolledStudents = new Set(progressData.map(p => p.studentId)).size;
        }
      }
    }

    this.stats = {
      totalLessons,
      avgCompletionRate: Math.round(avgCompletionRate),
      avgScore: Math.round(avgScore * 10) / 10,
      avgTimeSpent: this.stats.avgTimeSpent || 0,
      enrolledStudents
    };

    await this.save();

    return this.stats;
  };

  Chapter.prototype.getLessons = async function(options = {}) {
    const Lesson = sequelize.models.Lesson;

    const where = {
      chapterId: this.id,
      isActive: true
    };

    if (options.reviewStatus) {
      where.reviewStatus = options.reviewStatus;
    }

    return await Lesson.findAll({
      where,
      order: [['order', 'ASC']],
      limit: options.limit
    });
  };

  Chapter.prototype.getProgress = async function(studentId) {
    const lessons = await this.getLessons({ reviewStatus: 'approved' });
    const Progress = sequelize.models.Progress;

    if (!Progress || lessons.length === 0) {
      return {
        total: lessons.length,
        completed: 0,
        percentage: 0
      };
    }

    const lessonIds = lessons.map(l => l.id);
    const completedCount = await Progress.count({
      where: {
        studentId,
        lessonId: { [sequelize.Sequelize.Op.in]: lessonIds },
        status: 'completed'
      }
    });

    return {
      total: lessons.length,
      completed: completedCount,
      percentage: Math.round((completedCount / lessons.length) * 100)
    };
  };

  Chapter.prototype.isAccessibleForSeries = function(studentSeries) {
    // Si le chapitre ne spécifie pas de séries, il est accessible à tous
    if (!this.series || this.series.length === 0) {
      return true;
    }

    // Sinon, vérifier si la série de l'étudiant est dans la liste
    return this.series.includes(studentSeries);
  };

  // Méthodes statiques
  Chapter.getBySubject = async function(subjectId, options = {}) {
    const where = {
      subjectId,
      isActive: true
    };

    if (options.trimester) {
      where.trimester = options.trimester;
    }

    if (options.series) {
      where.series = {
        [sequelize.Sequelize.Op.contains]: [options.series]
      };
    }

    return await this.findAll({
      where,
      order: [['order', 'ASC'], ['number', 'ASC']],
      include: options.includeLessons ? [{
        model: sequelize.models.Lesson,
        as: 'lessons',
        where: { isActive: true, reviewStatus: 'approved' },
        required: false
      }] : []
    });
  };

  Chapter.getByTrimester = async function(subjectId, trimester) {
    return await this.findAll({
      where: {
        subjectId,
        trimester,
        isActive: true
      },
      order: [['order', 'ASC']]
    });
  };

  Chapter.findWithLessons = async function(chapterId) {
    return await this.findByPk(chapterId, {
      include: [{
        model: sequelize.models.Lesson,
        as: 'lessons',
        where: { isActive: true },
        required: false,
        order: [['order', 'ASC']]
      }]
    });
  };

  // Hooks
  Chapter.beforeCreate(async (chapter) => {
    // Définir automatiquement l'ordre si pas spécifié
    if (!chapter.order) {
      const maxOrder = await Chapter.max('order', {
        where: { subjectId: chapter.subjectId }
      });
      chapter.order = (maxOrder || 0) + 1;
    }
  });

  Chapter.afterCreate(async (chapter) => {
    // Mettre à jour les stats du sujet parent
    const Subject = sequelize.models.Subject;
    if (Subject) {
      const subject = await Subject.findByPk(chapter.subjectId);
      if (subject) {
        await subject.updateStats();
      }
    }
  });

  Chapter.afterUpdate(async (chapter) => {
    // Si le statut change, recalculer les stats
    if (chapter.changed('isActive')) {
      await chapter.updateStats();

      const Subject = sequelize.models.Subject;
      if (Subject) {
        const subject = await Subject.findByPk(chapter.subjectId);
        if (subject) {
          await subject.updateStats();
        }
      }
    }
  });

  Chapter.afterDestroy(async (chapter) => {
    // Mettre à jour les stats du sujet parent
    const Subject = sequelize.models.Subject;
    if (Subject) {
      const subject = await Subject.findByPk(chapter.subjectId);
      if (subject) {
        await subject.updateStats();
      }
    }
  });

  return Chapter;
};
