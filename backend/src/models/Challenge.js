/**
 * Modèle Sequelize pour les Défis Étudiants
 * Défis quotidiens et hebdomadaires - Claudyne
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Challenge = sequelize.define('Challenge', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    type: {
      type: DataTypes.ENUM,
      values: ['daily', 'weekly', 'monthly', 'special'],
      allowNull: false,
      defaultValue: 'daily'
    },
    category: {
      type: DataTypes.ENUM,
      values: ['quiz', 'study_time', 'streak', 'battles', 'lessons', 'accuracy', 'speed', 'mixed'],
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    icon: {
      type: DataTypes.STRING,
      defaultValue: '🎯'
    },
    difficulty: {
      type: DataTypes.ENUM,
      values: ['easy', 'medium', 'hard', 'expert'],
      defaultValue: 'medium'
    },
    targetValue: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Valeur cible à atteindre'
    },
    currentValue: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Progression actuelle'
    },
    unit: {
      type: DataTypes.STRING,
      defaultValue: 'points',
      comment: 'Unité de mesure (quiz, heures, jours, etc.)'
    },
    reward: {
      type: DataTypes.JSONB,
      defaultValue: {
        xp: 0,
        claudinePoints: 0,
        badge: null,
        title: null
      }
    },
    conditions: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Conditions spécifiques du défi (niveau min, matière, etc.)'
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isGlobal: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Si false, défi assigné à un étudiant spécifique'
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID admin qui a créé le défi (si manuel)'
    }
  }, {
    tableName: 'challenges',
    timestamps: true,
    indexes: [
      {
        fields: ['type', 'isActive']
      },
      {
        fields: ['category']
      },
      {
        fields: ['startDate', 'endDate']
      },
      {
        fields: ['isGlobal']
      }
    ],
    scopes: {
      active: {
        where: {
          isActive: true,
          endDate: {
            [sequelize.Sequelize.Op.gt]: new Date()
          }
        }
      },
      global: {
        where: {
          isGlobal: true
        }
      },
      daily: {
        where: {
          type: 'daily'
        }
      },
      weekly: {
        where: {
          type: 'weekly'
        }
      }
    }
  });

  // Méthodes d'instance
  Challenge.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());

    return {
      id: values.id,
      type: values.type,
      category: values.category,
      title: values.title,
      description: values.description,
      icon: values.icon,
      difficulty: values.difficulty,
      targetValue: values.targetValue,
      currentValue: values.currentValue,
      unit: values.unit,
      reward: values.reward,
      conditions: values.conditions,
      startDate: values.startDate,
      endDate: values.endDate,
      isActive: values.isActive,
      progressPercentage: Math.min(100, Math.round((values.currentValue / values.targetValue) * 100)),
      timeRemaining: this.getTimeRemaining(),
      createdAt: values.createdAt,
      updatedAt: values.updatedAt
    };
  };

  Challenge.prototype.getTimeRemaining = function() {
    const now = new Date();
    const end = new Date(this.endDate);
    const diff = end - now;

    if (diff <= 0) return 'Expiré';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}j ${hours}h restant${days > 1 ? 's' : ''}`;
    return `${hours}h restantes`;
  };

  Challenge.prototype.isCompleted = function() {
    return this.currentValue >= this.targetValue;
  };

  Challenge.prototype.isExpired = function() {
    return new Date() > new Date(this.endDate);
  };

  // Méthodes statiques
  Challenge.getActiveChallenges = async function(studentId = null) {
    const where = {
      isActive: true,
      startDate: {
        [sequelize.Sequelize.Op.lte]: new Date()
      },
      endDate: {
        [sequelize.Sequelize.Op.gt]: new Date()
      }
    };

    if (studentId) {
      // Inclure les défis globaux ET les défis spécifiques à l'étudiant
      where[sequelize.Sequelize.Op.or] = [
        { isGlobal: true },
        { isGlobal: false, studentId }
      ];
    } else {
      where.isGlobal = true;
    }

    return await this.findAll({
      where,
      order: [
        ['type', 'ASC'],
        ['difficulty', 'ASC'],
        ['endDate', 'ASC']
      ]
    });
  };

  Challenge.generateDailyChallenges = async function() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dailyChallenges = [
      {
        type: 'daily',
        category: 'quiz',
        title: 'Quiz Master',
        description: 'Réussir 5 quiz avec un score de 90%+',
        icon: '🎯',
        difficulty: 'medium',
        targetValue: 5,
        unit: 'quiz',
        reward: {
          xp: 50,
          claudinePoints: 25,
          badge: null
        },
        startDate: today,
        endDate: tomorrow,
        isGlobal: true
      },
      {
        type: 'daily',
        category: 'speed',
        title: 'Speed Runner',
        description: 'Terminer 10 quiz en moins de 2 min chacun',
        icon: '⚡',
        difficulty: 'hard',
        targetValue: 10,
        unit: 'quiz',
        reward: {
          xp: 75,
          claudinePoints: 40,
          badge: null
        },
        startDate: today,
        endDate: tomorrow,
        isGlobal: true
      },
      {
        type: 'daily',
        category: 'study_time',
        title: 'Studieux du Jour',
        description: 'Étudier pendant au moins 1 heure',
        icon: '📚',
        difficulty: 'easy',
        targetValue: 60,
        unit: 'minutes',
        reward: {
          xp: 30,
          claudinePoints: 15,
          badge: null
        },
        startDate: today,
        endDate: tomorrow,
        isGlobal: true
      }
    ];

    // Créer les défis du jour
    const created = await Promise.all(
      dailyChallenges.map(challenge => this.create(challenge))
    );

    return created;
  };

  Challenge.generateWeeklyChallenges = async function() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const weeklyChallenges = [
      {
        type: 'weekly',
        category: 'streak',
        title: 'Série Parfaite',
        description: 'Maintenir 90%+ de réussite pendant 7 jours',
        icon: '🔥',
        difficulty: 'hard',
        targetValue: 7,
        unit: 'jours',
        reward: {
          xp: 200,
          claudinePoints: 100,
          badge: 'streak_master'
        },
        startDate: today,
        endDate: nextWeek,
        isGlobal: true
      },
      {
        type: 'weekly',
        category: 'study_time',
        title: 'Marathon Hebdo',
        description: '50 heures d\'étude ce mois',
        icon: '🏃',
        difficulty: 'expert',
        targetValue: 50,
        unit: 'heures',
        reward: {
          xp: 300,
          claudinePoints: 150,
          badge: 'study_marathon'
        },
        startDate: today,
        endDate: nextWeek,
        isGlobal: true
      }
    ];

    const created = await Promise.all(
      weeklyChallenges.map(challenge => this.create(challenge))
    );

    return created;
  };

  // Table de liaison Challenge-Student pour suivre les progrès individuels
  const StudentChallenge = sequelize.define('StudentChallenge', {
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
    challengeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'challenges',
        key: 'id'
      }
    },
    currentValue: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    isCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    rewardClaimed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'student_challenges',
    timestamps: true,
    indexes: [
      {
        fields: ['studentId', 'challengeId'],
        unique: true
      },
      {
        fields: ['studentId', 'isCompleted']
      }
    ]
  });

  Challenge.StudentChallenge = StudentChallenge;

  return Challenge;
};
