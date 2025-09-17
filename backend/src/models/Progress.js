/**
 * Modèle Sequelize pour la Progression des Étudiants
 * Suivi détaillé de l'apprentissage - Claudyne
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Progress = sequelize.define('Progress', {
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
    lessonId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'lessons',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM,
      values: ['not_started', 'in_progress', 'completed', 'mastered', 'needs_review'],
      defaultValue: 'not_started'
    },
    completionPercentage: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100
      }
    },
    timeSpent: {
      type: DataTypes.INTEGER, // en minutes
      defaultValue: 0
    },
    attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    lastScore: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: 0,
        max: 100
      }
    },
    bestScore: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: 0,
        max: 100
      }
    },
    averageScore: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: 0,
        max: 100
      }
    },
    claudinePointsEarned: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    quizAttempts: {
      type: DataTypes.JSONB,
      defaultValue: []
      // Structure: [{ attemptNumber, score, answers, timestamp, timeSpent }]
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    bookmarks: {
      type: DataTypes.JSONB,
      defaultValue: []
      // Structure: [{ timestamp, position, note }]
    },
    difficulties: {
      type: DataTypes.JSONB,
      defaultValue: []
      // Concepts ou sections qui posent problème
    },
    strengths: {
      type: DataTypes.JSONB,
      defaultValue: []
      // Concepts bien maîtrisés
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {
        device: null,
        browser: null,
        studyPattern: null, // 'morning', 'afternoon', 'evening', 'consistent', 'irregular'
        focusLevel: null, // 'high', 'medium', 'low' basé sur le temps passé vs progression
        preferredLearningStyle: null // 'visual', 'auditory', 'kinesthetic', 'mixed'
      }
    },
    aiInsights: {
      type: DataTypes.JSONB,
      defaultValue: {
        suggestedNextSteps: [],
        learningPattern: null,
        recommendedStudyTime: null,
        strengthAreas: [],
        improvementAreas: [],
        motivationLevel: null,
        lastAnalysis: null
      }
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lastActivityAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'progress',
    timestamps: true,
    indexes: [
      {
        fields: ['studentId', 'lessonId'],
        unique: true
      },
      {
        fields: ['studentId', 'status']
      },
      {
        fields: ['lessonId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['studentId', 'completedAt']
      },
      {
        fields: ['studentId', 'lastActivityAt']
      }
    ],
    scopes: {
      completed: {
        where: {
          status: 'completed'
        }
      },
      inProgress: {
        where: {
          status: 'in_progress'
        }
      },
      byStudent: (studentId) => ({
        where: {
          studentId
        }
      }),
      byLesson: (lessonId) => ({
        where: {
          lessonId
        }
      }),
      recentActivity: {
        order: [['lastActivityAt', 'DESC']]
      }
    }
  });

  // Méthodes d'instance
  Progress.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());

    return {
      id: values.id,
      studentId: values.studentId,
      lessonId: values.lessonId,
      status: values.status,
      completionPercentage: values.completionPercentage,
      timeSpent: values.timeSpent,
      attempts: values.attempts,
      lastScore: values.lastScore,
      bestScore: values.bestScore,
      averageScore: values.averageScore,
      claudinePointsEarned: values.claudinePointsEarned,
      notes: values.notes,
      bookmarks: values.bookmarks,
      difficulties: values.difficulties,
      strengths: values.strengths,
      aiInsights: values.aiInsights,
      startedAt: values.startedAt,
      completedAt: values.completedAt,
      lastActivityAt: values.lastActivityAt,
      createdAt: values.createdAt,
      updatedAt: values.updatedAt
    };
  };

  Progress.prototype.startLesson = async function() {
    if (this.status === 'not_started') {
      this.status = 'in_progress';
      this.startedAt = new Date();
      this.lastActivityAt = new Date();
      await this.save();
    }
  };

  Progress.prototype.updateProgress = async function(progressData) {
    const {
      completionPercentage,
      timeSpent,
      notes,
      bookmarks,
      difficulties,
      strengths
    } = progressData;

    // Mise à jour des données de base
    if (completionPercentage !== undefined) {
      this.completionPercentage = Math.max(this.completionPercentage, completionPercentage);
    }

    if (timeSpent !== undefined) {
      this.timeSpent += timeSpent;
    }

    if (notes) this.notes = notes;
    if (bookmarks) this.bookmarks = [...(this.bookmarks || []), ...bookmarks];
    if (difficulties) this.difficulties = [...new Set([...(this.difficulties || []), ...difficulties])];
    if (strengths) this.strengths = [...new Set([...(this.strengths || []), ...strengths])];

    // Marquer comme terminé si 100%
    if (this.completionPercentage >= 100 && this.status !== 'completed') {
      this.status = 'completed';
      this.completedAt = new Date();

      // Calculer les points Claudine gagnés
      const basePoints = 10;
      const timeBonus = this.timeSpent < 30 ? 5 : 0; // Bonus si fait rapidement
      const scoreBonus = this.bestScore >= 90 ? 10 : this.bestScore >= 75 ? 5 : 0;

      this.claudinePointsEarned = basePoints + timeBonus + scoreBonus;
    }

    this.lastActivityAt = new Date();
    await this.save();

    // Mettre à jour les statistiques du student parent
    await this.updateStudentStats();
  };

  Progress.prototype.recordQuizAttempt = async function(quizResult) {
    const {
      score,
      answers,
      timeSpent: quizTimeSpent,
      feedback
    } = quizResult;

    this.attempts += 1;
    this.lastScore = score;
    this.bestScore = Math.max(this.bestScore || 0, score);

    // Calculer la moyenne des scores
    const allScores = [...(this.quizAttempts || []), { score }];
    this.averageScore = allScores.reduce((sum, attempt) => sum + attempt.score, 0) / allScores.length;

    // Enregistrer la tentative
    const attempt = {
      attemptNumber: this.attempts,
      score,
      answers,
      timestamp: new Date(),
      timeSpent: quizTimeSpent,
      feedback
    };

    this.quizAttempts = [...(this.quizAttempts || []), attempt];

    // Analyser les difficultés basées sur les réponses incorrectes
    if (answers && feedback) {
      const newDifficulties = feedback
        .filter(item => !item.correct)
        .map(item => item.concept || item.topic)
        .filter(Boolean);

      this.difficulties = [...new Set([...(this.difficulties || []), ...newDifficulties])];
    }

    await this.updateProgress({
      timeSpent: quizTimeSpent,
      completionPercentage: score >= 75 ? 100 : Math.max(this.completionPercentage, 80)
    });
  };

  Progress.prototype.updateStudentStats = async function() {
    const Student = sequelize.models.Student;
    if (!Student) return;

    const student = await Student.findByPk(this.studentId);
    if (!student) return;

    // Calculer les nouvelles statistiques globales
    const allProgress = await Progress.findAll({
      where: { studentId: this.studentId }
    });

    const totalLessons = allProgress.length;
    const completedLessons = allProgress.filter(p => p.status === 'completed').length;
    const totalTimeSpent = allProgress.reduce((sum, p) => sum + p.timeSpent, 0);
    const totalClaudinePoints = allProgress.reduce((sum, p) => sum + p.claudinePointsEarned, 0);
    const averageScore = allProgress
      .filter(p => p.averageScore !== null)
      .reduce((sum, p, _, arr) => sum + p.averageScore / arr.length, 0);

    // Mettre à jour les stats du student
    await student.update({
      'stats.totalLessonsStarted': totalLessons,
      'stats.totalLessonsCompleted': completedLessons,
      'stats.totalTimeSpent': totalTimeSpent,
      'stats.totalClaudinePoints': totalClaudinePoints,
      'stats.averageScore': Math.round(averageScore),
      'stats.completionRate': Math.round((completedLessons / totalLessons) * 100) || 0
    });
  };

  Progress.prototype.generateAIInsights = async function() {
    // Cette méthode sera connectée au service IA pour générer des insights personnalisés
    const insights = {
      suggestedNextSteps: [],
      learningPattern: null,
      recommendedStudyTime: null,
      strengthAreas: this.strengths || [],
      improvementAreas: this.difficulties || [],
      motivationLevel: null,
      lastAnalysis: new Date()
    };

    // Analyser le pattern d'apprentissage
    if (this.timeSpent > 0 && this.completionPercentage > 0) {
      const efficiency = this.completionPercentage / this.timeSpent;
      insights.learningPattern = efficiency > 3 ? 'fast_learner' :
                                efficiency > 1.5 ? 'steady_learner' : 'needs_support';
    }

    // Suggestions basées sur les performances
    if (this.averageScore < 60) {
      insights.suggestedNextSteps.push('Revoir les concepts fondamentaux');
      insights.suggestedNextSteps.push('Pratiquer plus d\'exercices');
    } else if (this.averageScore > 85) {
      insights.suggestedNextSteps.push('Passer aux leçons avancées');
      insights.suggestedNextSteps.push('Aider d\'autres étudiants');
    }

    this.aiInsights = insights;
    await this.save();

    return insights;
  };

  // Méthodes statiques
  Progress.getStudentOverview = async function(studentId) {
    const progress = await this.findAll({
      where: { studentId },
      include: [
        {
          model: sequelize.models.Lesson,
          as: 'lesson',
          include: [{
            model: sequelize.models.Subject,
            as: 'subject'
          }]
        }
      ],
      order: [['lastActivityAt', 'DESC']]
    });

    // Grouper par matière
    const bySubject = {};
    progress.forEach(p => {
      const subjectId = p.lesson?.subject?.id;
      if (!bySubject[subjectId]) {
        bySubject[subjectId] = {
          subject: p.lesson?.subject,
          lessons: [],
          stats: {
            total: 0,
            completed: 0,
            inProgress: 0,
            averageScore: 0,
            totalTime: 0
          }
        };
      }

      bySubject[subjectId].lessons.push(p);
      bySubject[subjectId].stats.total += 1;
      if (p.status === 'completed') bySubject[subjectId].stats.completed += 1;
      if (p.status === 'in_progress') bySubject[subjectId].stats.inProgress += 1;
      bySubject[subjectId].stats.totalTime += p.timeSpent;
    });

    // Calculer les moyennes
    Object.keys(bySubject).forEach(subjectId => {
      const subject = bySubject[subjectId];
      const scoresWithValues = subject.lessons.filter(l => l.averageScore !== null);
      if (scoresWithValues.length > 0) {
        subject.stats.averageScore = scoresWithValues.reduce((sum, l) => sum + l.averageScore, 0) / scoresWithValues.length;
      }
    });

    return bySubject;
  };

  Progress.getClassStatistics = async function(lessonId) {
    const allProgress = await this.findAll({
      where: { lessonId },
      include: [{
        model: sequelize.models.Student,
        as: 'student'
      }]
    });

    const stats = {
      totalStudents: allProgress.length,
      completed: allProgress.filter(p => p.status === 'completed').length,
      inProgress: allProgress.filter(p => p.status === 'in_progress').length,
      averageScore: 0,
      averageTime: 0,
      commonDifficulties: [],
      topPerformers: []
    };

    if (stats.totalStudents > 0) {
      const scoresWithValues = allProgress.filter(p => p.averageScore !== null);
      if (scoresWithValues.length > 0) {
        stats.averageScore = scoresWithValues.reduce((sum, p) => sum + p.averageScore, 0) / scoresWithValues.length;
      }

      stats.averageTime = allProgress.reduce((sum, p) => sum + p.timeSpent, 0) / stats.totalStudents;

      // Analyser les difficultés communes
      const allDifficulties = allProgress.flatMap(p => p.difficulties || []);
      const difficultyCount = {};
      allDifficulties.forEach(d => {
        difficultyCount[d] = (difficultyCount[d] || 0) + 1;
      });

      stats.commonDifficulties = Object.entries(difficultyCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([difficulty, count]) => ({ difficulty, count }));

      // Top performers
      stats.topPerformers = allProgress
        .filter(p => p.bestScore !== null)
        .sort((a, b) => b.bestScore - a.bestScore)
        .slice(0, 5)
        .map(p => ({
          studentId: p.studentId,
          studentName: p.student?.firstName + ' ' + p.student?.lastName,
          score: p.bestScore,
          timeSpent: p.timeSpent
        }));
    }

    return stats;
  };

  // Hooks
  Progress.beforeUpdate(async (progress) => {
    if (progress.changed('status') || progress.changed('completionPercentage')) {
      progress.lastActivityAt = new Date();
    }
  });

  Progress.afterCreate(async (progress) => {
    // Mettre à jour les statistiques de la leçon
    const Lesson = sequelize.models.Lesson;
    if (Lesson) {
      const lesson = await Lesson.findByPk(progress.lessonId);
      if (lesson) {
        await lesson.updateStats('view');
      }
    }
  });

  Progress.afterUpdate(async (progress) => {
    if (progress.changed('status') && progress.status === 'completed') {
      // Mettre à jour les statistiques de la leçon
      const Lesson = sequelize.models.Lesson;
      if (Lesson) {
        const lesson = await Lesson.findByPk(progress.lessonId);
        if (lesson) {
          await lesson.updateStats('complete');
          if (progress.lastScore) {
            await lesson.updateStats('score', progress.lastScore);
          }
        }
      }
    }
  });

  return Progress;
};