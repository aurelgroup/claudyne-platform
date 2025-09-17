/**
 * Modèle Sequelize pour Battle Royale Éducatif
 * Compétitions en temps réel - Claudyne
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Battle = sequelize.define('Battle', {
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
        len: [5, 100]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM,
      values: ['quiz_battle', 'speed_challenge', 'team_battle', 'daily_challenge', 'prix_claudine_qualifier'],
      allowNull: false
    },
    region: {
      type: DataTypes.ENUM,
      values: ['Centre', 'Littoral', 'Ouest', 'Nord-Ouest', 'Sud-Ouest', 'Nord', 'Adamaoua', 'Est', 'Sud', 'Extrême-Nord', 'National'],
      defaultValue: 'National'
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true
    },
    subjectId: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'subjects',
        key: 'id'
      }
    },
    level: {
      type: DataTypes.ENUM,
      values: ['CP', 'CE1', 'CE2', 'CM1', 'CM2', '6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Tle', 'Multi-niveau'],
      allowNull: false
    },
    difficulty: {
      type: DataTypes.ENUM,
      values: ['Débutant', 'Intermédiaire', 'Avancé', 'Expert'],
      defaultValue: 'Intermédiaire'
    },
    status: {
      type: DataTypes.ENUM,
      values: ['scheduled', 'open', 'active', 'completed', 'cancelled'],
      defaultValue: 'scheduled'
    },
    maxParticipants: {
      type: DataTypes.INTEGER,
      defaultValue: 100,
      validate: {
        min: 2,
        max: 500
      }
    },
    currentParticipants: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    entryFee: {
      type: DataTypes.INTEGER, // en FCFA
      defaultValue: 0
    },
    prizePool: {
      type: DataTypes.INTEGER, // en FCFA
      defaultValue: 0
    },
    questions: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
      // Structure: [{ id, question, options, correctAnswer, points, timeLimit }]
    },
    rules: {
      type: DataTypes.JSONB,
      defaultValue: {
        timePerQuestion: 30, // secondes
        totalTimeLimit: 900, // 15 minutes
        eliminationRate: 0.2, // 20% éliminés à chaque round
        powerUpsEnabled: true,
        teamSize: 1,
        allowRetakes: false
      }
    },
    powerUps: {
      type: DataTypes.JSONB,
      defaultValue: {
        available: ['time_freeze', 'double_points', 'hint', 'skip_question', 'steal_points'],
        limits: {
          time_freeze: 2,
          double_points: 1,
          hint: 3,
          skip_question: 1,
          steal_points: 1
        }
      }
    },
    rewards: {
      type: DataTypes.JSONB,
      defaultValue: {
        winner: {
          claudinePoints: 100,
          badge: 'Battle Champion',
          certificate: true,
          cashPrize: 0
        },
        top3: {
          claudinePoints: 50,
          badge: 'Battle Finalist',
          certificate: false,
          cashPrize: 0
        },
        participation: {
          claudinePoints: 10,
          badge: null,
          certificate: false,
          cashPrize: 0
        }
      }
    },
    scheduledAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    endedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    registrationDeadline: {
      type: DataTypes.DATE,
      allowNull: true
    },
    results: {
      type: DataTypes.JSONB,
      defaultValue: null
      // Structure: { rankings: [], stats: {}, winners: [] }
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {
        sponsorName: null,
        sponsorLogo: null,
        livestreamUrl: null,
        recordingUrl: null,
        socialHashtag: null,
        featuredOnHomepage: false
      }
    },
    createdBy: {
      type: DataTypes.STRING,
      allowNull: true
    },
    moderatedBy: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'battles',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        fields: ['status']
      },
      {
        fields: ['region', 'level']
      },
      {
        fields: ['scheduledAt']
      },
      {
        fields: ['subjectId']
      },
      {
        fields: ['type', 'status']
      },
      {
        fields: ['status', 'scheduledAt']
      }
    ],
    scopes: {
      active: {
        where: {
          status: 'active'
        }
      },
      upcoming: {
        where: {
          status: ['scheduled', 'open'],
          scheduledAt: {
            [sequelize.Sequelize.Op.gt]: new Date()
          }
        },
        order: [['scheduledAt', 'ASC']]
      },
      completed: {
        where: {
          status: 'completed'
        },
        order: [['endedAt', 'DESC']]
      },
      byRegion: (region) => ({
        where: {
          region,
          status: ['scheduled', 'open', 'active']
        }
      }),
      byLevel: (level) => ({
        where: {
          level,
          status: ['scheduled', 'open', 'active']
        }
      }),
      featured: {
        where: {
          'metadata.featuredOnHomepage': true,
          status: ['scheduled', 'open', 'active']
        }
      }
    }
  });

  // Méthodes d'instance
  Battle.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());

    return {
      id: values.id,
      title: values.title,
      description: values.description,
      type: values.type,
      region: values.region,
      city: values.city,
      subjectId: values.subjectId,
      level: values.level,
      difficulty: values.difficulty,
      status: values.status,
      maxParticipants: values.maxParticipants,
      currentParticipants: values.currentParticipants,
      entryFee: values.entryFee,
      prizePool: values.prizePool,
      rules: values.rules,
      powerUps: values.powerUps,
      rewards: values.rewards,
      scheduledAt: values.scheduledAt,
      startedAt: values.startedAt,
      endedAt: values.endedAt,
      registrationDeadline: values.registrationDeadline,
      results: values.results,
      metadata: values.metadata,
      createdAt: values.createdAt,
      updatedAt: values.updatedAt
    };
  };

  Battle.prototype.canRegister = function() {
    const now = new Date();
    return this.status === 'open' &&
           this.currentParticipants < this.maxParticipants &&
           (!this.registrationDeadline || now < this.registrationDeadline) &&
           now < this.scheduledAt;
  };

  Battle.prototype.register = async function(studentId) {
    if (!this.canRegister()) {
      throw new Error('La bataille n\'accepte plus d\'inscriptions');
    }

    // Vérifier si l'étudiant n'est pas déjà inscrit
    const BattleParticipant = sequelize.models.BattleParticipant;
    const existingRegistration = await BattleParticipant.findOne({
      where: {
        battleId: this.id,
        studentId: studentId
      }
    });

    if (existingRegistration) {
      throw new Error('Étudiant déjà inscrit à cette bataille');
    }

    // Créer l'inscription
    await BattleParticipant.create({
      battleId: this.id,
      studentId: studentId,
      registeredAt: new Date()
    });

    // Mettre à jour le nombre de participants
    this.currentParticipants += 1;
    await this.save();

    return true;
  };

  Battle.prototype.start = async function() {
    if (this.status !== 'open') {
      throw new Error('La bataille ne peut pas être démarrée');
    }

    this.status = 'active';
    this.startedAt = new Date();
    await this.save();

    // Ici, on pourrait déclencher les événements WebSocket
    // pour notifier tous les participants
    return true;
  };

  Battle.prototype.end = async function(finalResults) {
    if (this.status !== 'active') {
      throw new Error('La bataille n\'est pas active');
    }

    this.status = 'completed';
    this.endedAt = new Date();
    this.results = finalResults;
    await this.save();

    // Distribuer les récompenses
    await this.distributeRewards();

    return true;
  };

  Battle.prototype.distributeRewards = async function() {
    if (!this.results || !this.results.rankings) {
      return;
    }

    const Student = sequelize.models.Student;
    const Family = sequelize.models.Family;

    for (let i = 0; i < this.results.rankings.length; i++) {
      const participant = this.results.rankings[i];
      const rank = i + 1;

      let reward;
      if (rank === 1) {
        reward = this.rewards.winner;
      } else if (rank <= 3) {
        reward = this.rewards.top3;
      } else {
        reward = this.rewards.participation;
      }

      // Attribuer les points Claudine
      if (reward.claudinePoints > 0) {
        const student = await Student.findByPk(participant.studentId);
        if (student) {
          await student.increment('totalClaudinePoints', { by: reward.claudinePoints });

          // Mettre à jour les points de la famille aussi
          const family = await Family.findByPk(student.familyId);
          if (family) {
            await family.increment('totalClaudinePoints', { by: reward.claudinePoints });
          }
        }
      }

      // Ici on pourrait également créer des notifications,
      // envoyer des emails, générer des certificats, etc.
    }
  };

  Battle.prototype.getLeaderboard = async function() {
    const BattleParticipant = sequelize.models.BattleParticipant;

    const participants = await BattleParticipant.findAll({
      where: { battleId: this.id },
      include: [{
        model: sequelize.models.Student,
        as: 'student',
        attributes: ['id', 'firstName', 'lastName', 'level', 'totalClaudinePoints']
      }],
      order: [
        ['currentScore', 'DESC'],
        ['timeElapsed', 'ASC']
      ]
    });

    return participants.map((p, index) => ({
      rank: index + 1,
      studentId: p.studentId,
      studentName: `${p.student.firstName} ${p.student.lastName}`,
      level: p.student.level,
      score: p.currentScore,
      timeElapsed: p.timeElapsed,
      questionsAnswered: p.questionsAnswered,
      status: p.status
    }));
  };

  // Méthodes statiques
  Battle.getUpcoming = async function(region = null, level = null, limit = 10) {
    const where = {
      status: ['scheduled', 'open'],
      scheduledAt: {
        [sequelize.Sequelize.Op.gt]: new Date()
      }
    };

    if (region && region !== 'National') {
      where.region = [region, 'National'];
    }

    if (level) {
      where.level = [level, 'Multi-niveau'];
    }

    return await this.findAll({
      where,
      order: [['scheduledAt', 'ASC']],
      limit,
      include: [{
        model: sequelize.models.Subject,
        as: 'subject',
        attributes: ['id', 'title', 'icon', 'color']
      }]
    });
  };

  Battle.getActive = async function() {
    return await this.findAll({
      where: { status: 'active' },
      include: [{
        model: sequelize.models.Subject,
        as: 'subject',
        attributes: ['id', 'title', 'icon', 'color']
      }]
    });
  };

  Battle.getHistory = async function(studentId, limit = 20) {
    const BattleParticipant = sequelize.models.BattleParticipant;

    return await this.findAll({
      where: { status: 'completed' },
      include: [{
        model: BattleParticipant,
        where: { studentId },
        attributes: ['finalScore', 'finalRank', 'rewardsEarned']
      }],
      order: [['endedAt', 'DESC']],
      limit
    });
  };

  Battle.createDailyChallenge = async function(subjectId, level, region = 'National') {
    const Subject = sequelize.models.Subject;
    const Lesson = sequelize.models.Lesson;

    const subject = await Subject.findByPk(subjectId);
    if (!subject) {
      throw new Error('Matière non trouvée');
    }

    // Sélectionner des questions aléatoires de la matière
    const lessons = await Lesson.findAll({
      where: {
        subjectId,
        hasQuiz: true,
        isActive: true
      },
      limit: 5
    });

    const questions = [];
    lessons.forEach(lesson => {
      if (lesson.quiz && lesson.quiz.questions) {
        questions.push(...lesson.quiz.questions.slice(0, 2));
      }
    });

    // Mélanger les questions
    const shuffledQuestions = questions.sort(() => Math.random() - 0.5).slice(0, 10);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(18, 0, 0, 0); // 18h00

    const battle = await this.create({
      title: `Défi Quotidien ${subject.title} - ${level}`,
      description: `Défi quotidien de ${subject.title} pour le niveau ${level}`,
      type: 'daily_challenge',
      region,
      subjectId,
      level,
      difficulty: 'Intermédiaire',
      status: 'scheduled',
      maxParticipants: 200,
      entryFee: 0,
      questions: shuffledQuestions,
      scheduledAt: tomorrow,
      registrationDeadline: tomorrow,
      rules: {
        timePerQuestion: 45,
        totalTimeLimit: 600,
        eliminationRate: 0,
        powerUpsEnabled: false,
        teamSize: 1,
        allowRetakes: false
      },
      rewards: {
        winner: {
          claudinePoints: 50,
          badge: 'Daily Champion',
          certificate: false,
          cashPrize: 0
        },
        top3: {
          claudinePoints: 25,
          badge: 'Daily Finalist',
          certificate: false,
          cashPrize: 0
        },
        participation: {
          claudinePoints: 5,
          badge: null,
          certificate: false,
          cashPrize: 0
        }
      },
      createdBy: 'system'
    });

    return battle;
  };

  // Hooks
  Battle.beforeCreate(async (battle) => {
    // Définir automatiquement la deadline d'inscription si pas spécifiée
    if (!battle.registrationDeadline) {
      battle.registrationDeadline = new Date(battle.scheduledAt.getTime() - 30 * 60 * 1000); // 30 min avant
    }

    // Calculer le prize pool basé sur les frais d'entrée
    if (battle.entryFee > 0) {
      battle.prizePool = battle.entryFee * battle.maxParticipants * 0.8; // 80% des frais vont au prize pool
    }
  });

  Battle.afterUpdate(async (battle) => {
    // Ouvrir les inscriptions automatiquement
    if (battle.changed('status') && battle.status === 'open') {
      // Notifier tous les étudiants éligibles
      // Ici on pourrait envoyer des notifications push, emails, etc.
    }
  });

  return Battle;
};