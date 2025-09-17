/**
 * Modèle Sequelize pour les Matières/Subjects
 * Système éducatif camerounais - Claudyne
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Subject = sequelize.define('Subject', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    level: {
      type: DataTypes.ENUM,
      values: ['CP', 'CE1', 'CE2', 'CM1', 'CM2', '6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Tle'],
      allowNull: false
    },
    category: {
      type: DataTypes.ENUM,
      values: ['Mathématiques', 'Français', 'Sciences', 'Histoire-Géographie', 'Langues', 'Arts', 'Sport', 'Informatique'],
      allowNull: false
    },
    icon: {
      type: DataTypes.STRING,
      defaultValue: '📚'
    },
    color: {
      type: DataTypes.STRING,
      defaultValue: '#3B82F6',
      validate: {
        is: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
      }
    },
    difficulty: {
      type: DataTypes.ENUM,
      values: ['Débutant', 'Intermédiaire', 'Avancé', 'Expert'],
      defaultValue: 'Débutant'
    },
    estimatedDuration: {
      type: DataTypes.INTEGER, // en minutes
      defaultValue: 45
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isPremium: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    prerequisites: {
      type: DataTypes.JSONB, // Array of subject IDs
      defaultValue: []
    },
    cameroonCurriculum: {
      type: DataTypes.JSONB,
      defaultValue: {
        officialCode: null,
        ministerialRef: null,
        competencies: []
      }
    },
    stats: {
      type: DataTypes.JSONB,
      defaultValue: {
        totalLessons: 0,
        totalQuizzes: 0,
        enrolledStudents: 0,
        averageScore: 0,
        completionRate: 0
      }
    },
    createdBy: {
      type: DataTypes.STRING,
      allowNull: true
    },
    lastUpdatedBy: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'subjects',
    timestamps: true,
    paranoid: true, // Pour soft delete
    indexes: [
      {
        fields: ['level', 'category']
      },
      {
        fields: ['isActive']
      },
      {
        fields: ['isPremium']
      },
      {
        fields: ['level', 'isActive', 'isPremium']
      }
    ],
    scopes: {
      active: {
        where: {
          isActive: true
        }
      },
      free: {
        where: {
          isPremium: false,
          isActive: true
        }
      },
      premium: {
        where: {
          isPremium: true,
          isActive: true
        }
      },
      byLevel: (level) => ({
        where: {
          level,
          isActive: true
        }
      }),
      byCategory: (category) => ({
        where: {
          category,
          isActive: true
        }
      })
    }
  });

  // Méthodes d'instance
  Subject.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());

    return {
      id: values.id,
      title: values.title,
      description: values.description,
      level: values.level,
      category: values.category,
      icon: values.icon,
      color: values.color,
      difficulty: values.difficulty,
      estimatedDuration: values.estimatedDuration,
      isActive: values.isActive,
      isPremium: values.isPremium,
      order: values.order,
      prerequisites: values.prerequisites,
      stats: values.stats,
      createdAt: values.createdAt,
      updatedAt: values.updatedAt
    };
  };

  Subject.prototype.updateStats = async function() {
    // Cette méthode sera appelée pour mettre à jour les statistiques
    // après ajout/suppression de leçons, quiz, etc.
    const Lesson = sequelize.models.Lesson;
    const Progress = sequelize.models.Progress;

    if (Lesson) {
      const lessons = await Lesson.count({ where: { subjectId: this.id } });
      const quizzes = await Lesson.count({
        where: {
          subjectId: this.id,
          hasQuiz: true
        }
      });

      this.stats = {
        ...this.stats,
        totalLessons: lessons,
        totalQuizzes: quizzes
      };

      await this.save();
    }
  };

  // Méthodes statiques
  Subject.getByLevel = async function(level, includeInactive = false) {
    const where = { level };
    if (!includeInactive) {
      where.isActive = true;
    }

    return await this.findAll({
      where,
      order: [['order', 'ASC'], ['title', 'ASC']]
    });
  };

  Subject.getFreeSubjects = async function(level = null) {
    const where = {
      isPremium: false,
      isActive: true
    };

    if (level) {
      where.level = level;
    }

    return await this.findAll({
      where,
      order: [['order', 'ASC'], ['title', 'ASC']]
    });
  };

  Subject.getCameroonCurriculum = async function() {
    return await this.findAll({
      where: {
        isActive: true,
        'cameroonCurriculum.officialCode': {
          [sequelize.Sequelize.Op.ne]: null
        }
      },
      order: [['level', 'ASC'], ['order', 'ASC']]
    });
  };

  // Hooks
  Subject.beforeCreate(async (subject) => {
    // Générer un ID basé sur le titre et niveau si pas fourni
    if (!subject.id) {
      const slug = subject.title.toLowerCase()
        .replace(/[éèêë]/g, 'e')
        .replace(/[àâä]/g, 'a')
        .replace(/[îï]/g, 'i')
        .replace(/[ôö]/g, 'o')
        .replace(/[ûüù]/g, 'u')
        .replace(/[ç]/g, 'c')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      subject.id = `${slug}-${subject.level.toLowerCase()}`;
    }
  });

  Subject.afterUpdate(async (subject) => {
    // Recalculer les stats si nécessaire
    if (subject.changed('isActive')) {
      await subject.updateStats();
    }
  });

  return Subject;
};