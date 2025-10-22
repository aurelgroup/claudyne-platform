/**
 * Modèle Sequelize pour les Prédictions BAC
 * Prédictions de notes au Baccalauréat basées sur l'IA - Claudyne
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const BacPrediction = sequelize.define('BacPrediction', {
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
    examType: {
      type: DataTypes.ENUM,
      values: ['BAC', 'BEPC', 'PROBATOIRE', 'CEP', 'MOCK_EXAM'],
      allowNull: false,
      defaultValue: 'BAC'
    },
    examYear: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: () => new Date().getFullYear()
    },
    examSeries: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'A, C, D, TI, etc.'
    },
    overallPrediction: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Note globale prédite sur 20',
      validate: {
        min: 0,
        max: 20
      }
    },
    mention: {
      type: DataTypes.ENUM,
      values: ['NONE', 'PASSABLE', 'ASSEZ_BIEN', 'BIEN', 'TRES_BIEN', 'EXCELLENT'],
      allowNull: true
    },
    confidence: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      comment: 'Niveau de confiance de la prédiction (0-100%)',
      validate: {
        min: 0,
        max: 100
      }
    },
    subjectPredictions: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Prédictions par matière'
      // Structure: [{ subjectId, subjectName, predictedScore, coefficient, confidence, strengths: [], weaknesses: [] }]
    },
    strengths: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Matières fortes de l\'étudiant'
    },
    weaknesses: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Matières à améliorer'
    },
    recommendations: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Recommandations personnalisées'
      // Structure: [{ priority: 'high|medium|low', subject, action, reason, estimatedImpact }]
    },
    studyPlan: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Plan de révision recommandé'
      // Structure: { hoursPerWeek, focusAreas: [], schedule: {} }
    },
    historicalData: {
      type: DataTypes.JSONB,
      defaultValue: {
        previousPredictions: [],
        accuracy: null,
        trend: null
      }
    },
    factors: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Facteurs pris en compte dans la prédiction'
      // Structure: { attendance, consistency, performanceTrend, studyTime, quizScores, etc. }
    },
    lastCalculatedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    nextRecalculationAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'bac_predictions',
    timestamps: true,
    indexes: [
      {
        fields: ['studentId', 'examType']
      },
      {
        fields: ['examYear']
      },
      {
        fields: ['isActive']
      },
      {
        fields: ['lastCalculatedAt']
      }
    ]
  });

  // Méthodes d'instance
  BacPrediction.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());

    return {
      id: values.id,
      studentId: values.studentId,
      examType: values.examType,
      examYear: values.examYear,
      examSeries: values.examSeries,
      overallPrediction: values.overallPrediction,
      mention: values.mention,
      confidence: values.confidence,
      subjectPredictions: values.subjectPredictions,
      strengths: values.strengths,
      weaknesses: values.weaknesses,
      recommendations: values.recommendations,
      studyPlan: values.studyPlan,
      lastCalculatedAt: values.lastCalculatedAt,
      nextRecalculationAt: values.nextRecalculationAt,
      createdAt: values.createdAt,
      updatedAt: values.updatedAt
    };
  };

  BacPrediction.prototype.getMentionFromScore = function(score) {
    if (score >= 18) return 'EXCELLENT';
    if (score >= 16) return 'TRES_BIEN';
    if (score >= 14) return 'BIEN';
    if (score >= 12) return 'ASSEZ_BIEN';
    if (score >= 10) return 'PASSABLE';
    return 'NONE';
  };

  BacPrediction.prototype.calculate = async function() {
    const Student = sequelize.models.Student;
    const Progress = sequelize.models.Progress;
    const Subject = sequelize.models.Subject;

    const student = await Student.findByPk(this.studentId);
    if (!student) throw new Error('Étudiant non trouvé');

    // Récupérer toutes les progressions de l'étudiant
    const allProgress = await Progress.findAll({
      where: { studentId: this.studentId },
      include: [{
        model: sequelize.models.Lesson,
        as: 'lesson',
        include: [{
          model: Subject,
          as: 'subject'
        }]
      }]
    });

    // Calculer les prédictions par matière
    const subjectPredictions = [];
    const subjectGroups = {};

    allProgress.forEach(progress => {
      const subjectId = progress.lesson?.subject?.id;
      const subjectName = progress.lesson?.subject?.name;

      if (!subjectId) return;

      if (!subjectGroups[subjectId]) {
        subjectGroups[subjectId] = {
          subjectId,
          subjectName,
          scores: [],
          completionRates: [],
          timeSpent: 0,
          coefficient: progress.lesson?.subject?.coefficient || 1
        };
      }

      if (progress.averageScore !== null) {
        subjectGroups[subjectId].scores.push(progress.averageScore);
      }
      subjectGroups[subjectId].completionRates.push(progress.completionPercentage);
      subjectGroups[subjectId].timeSpent += progress.timeSpent;
    });

    let totalWeightedScore = 0;
    let totalCoefficients = 0;
    const strengths = [];
    const weaknesses = [];

    Object.values(subjectGroups).forEach(subject => {
      if (subject.scores.length === 0) return;

      // Calculer la moyenne pour la matière
      const avgScore = subject.scores.reduce((sum, s) => sum + s, 0) / subject.scores.length;
      const avgCompletion = subject.completionRates.reduce((sum, c) => sum + c, 0) / subject.completionRates.length;

      // Ajuster selon la complétion
      const completionFactor = avgCompletion / 100;
      let predictedScore = avgScore * (0.7 + 0.3 * completionFactor);

      // Normaliser sur 20
      predictedScore = Math.min(20, Math.max(0, predictedScore / 5));

      // Calculer la confiance basée sur le nombre de données
      const dataPoints = subject.scores.length;
      const confidence = Math.min(100, (dataPoints / 10) * 100);

      const prediction = {
        subjectId: subject.subjectId,
        subjectName: subject.subjectName,
        predictedScore: Math.round(predictedScore * 10) / 10,
        coefficient: subject.coefficient,
        confidence: Math.round(confidence),
        dataPoints,
        strengths: [],
        weaknesses: []
      };

      // Identifier forces et faiblesses
      if (predictedScore >= 14) {
        strengths.push(subject.subjectName);
        prediction.strengths.push('Excellente maîtrise');
      } else if (predictedScore < 10) {
        weaknesses.push(subject.subjectName);
        prediction.weaknesses.push('Nécessite plus de travail');
      }

      subjectPredictions.push(prediction);

      totalWeightedScore += predictedScore * subject.coefficient;
      totalCoefficients += subject.coefficient;
    });

    // Calculer la prédiction globale
    const overallPrediction = totalCoefficients > 0
      ? Math.round((totalWeightedScore / totalCoefficients) * 10) / 10
      : 0;

    const mention = this.getMentionFromScore(overallPrediction);

    // Calculer la confiance globale
    const overallConfidence = subjectPredictions.length > 0
      ? Math.round(subjectPredictions.reduce((sum, p) => sum + p.confidence, 0) / subjectPredictions.length)
      : 0;

    // Générer des recommandations
    const recommendations = this.generateRecommendations(subjectPredictions, weaknesses);

    // Générer un plan d'étude
    const studyPlan = this.generateStudyPlan(subjectPredictions, weaknesses);

    // Mettre à jour le modèle
    this.overallPrediction = overallPrediction;
    this.mention = mention;
    this.confidence = overallConfidence;
    this.subjectPredictions = subjectPredictions;
    this.strengths = strengths;
    this.weaknesses = weaknesses;
    this.recommendations = recommendations;
    this.studyPlan = studyPlan;
    this.lastCalculatedAt = new Date();
    this.nextRecalculationAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // +7 jours

    // Archiver dans l'historique
    const history = this.historicalData || { previousPredictions: [], accuracy: null, trend: null };
    history.previousPredictions.push({
      date: new Date(),
      score: overallPrediction,
      confidence: overallConfidence
    });

    // Garder seulement les 10 dernières prédictions
    if (history.previousPredictions.length > 10) {
      history.previousPredictions = history.previousPredictions.slice(-10);
    }

    // Calculer la tendance
    if (history.previousPredictions.length >= 2) {
      const recent = history.previousPredictions.slice(-3);
      const trend = recent[recent.length - 1].score - recent[0].score;
      history.trend = trend > 0.5 ? 'improving' : trend < -0.5 ? 'declining' : 'stable';
    }

    this.historicalData = history;

    await this.save();

    return this;
  };

  BacPrediction.prototype.generateRecommendations = function(subjectPredictions, weaknesses) {
    const recommendations = [];

    // Recommandations pour les matières faibles
    subjectPredictions
      .filter(p => p.predictedScore < 10)
      .sort((a, b) => a.predictedScore - b.predictedScore)
      .forEach(subject => {
        recommendations.push({
          priority: 'high',
          subject: subject.subjectName,
          action: `Concentrez-vous sur ${subject.subjectName}`,
          reason: `Note prédite : ${subject.predictedScore}/20`,
          estimatedImpact: '+2 à 3 points possible avec travail régulier'
        });
      });

    // Recommandations pour les matières moyennes avec fort coefficient
    subjectPredictions
      .filter(p => p.predictedScore >= 10 && p.predictedScore < 14 && p.coefficient >= 3)
      .forEach(subject => {
        recommendations.push({
          priority: 'medium',
          subject: subject.subjectName,
          action: `Renforcez vos acquis en ${subject.subjectName}`,
          reason: `Fort coefficient (${subject.coefficient}) et marge de progression`,
          estimatedImpact: '+1 à 2 points possible'
        });
      });

    // Recommandation générale
    if (weaknesses.length > 3) {
      recommendations.push({
        priority: 'high',
        subject: 'Organisation',
        action: 'Établissez un planning de révision structuré',
        reason: 'Plusieurs matières nécessitent attention',
        estimatedImpact: 'Meilleure gestion du temps de révision'
      });
    }

    return recommendations;
  };

  BacPrediction.prototype.generateStudyPlan = function(subjectPredictions, weaknesses) {
    const totalHoursPerWeek = 20; // Recommandation de base
    const focusAreas = [];

    // Répartir les heures selon les besoins
    const subjectHours = {};
    let totalPriority = 0;

    subjectPredictions.forEach(subject => {
      // Plus la note est faible, plus la priorité est élevée
      const priority = 20 - subject.predictedScore;
      subjectHours[subject.subjectName] = priority;
      totalPriority += priority;
    });

    // Calculer les heures par matière
    Object.keys(subjectHours).forEach(subject => {
      const hours = Math.round((subjectHours[subject] / totalPriority) * totalHoursPerWeek);
      if (hours > 0) {
        focusAreas.push({
          subject,
          hoursPerWeek: hours,
          priority: subjectHours[subject] > 10 ? 'high' : 'medium'
        });
      }
    });

    return {
      totalHoursPerWeek,
      focusAreas,
      schedule: {
        weekdays: '2-3h de révisions',
        weekend: '5-6h de révisions intensives',
        breakRecommendation: '10min toutes les heures'
      }
    };
  };

  // Méthodes statiques
  BacPrediction.getOrCreate = async function(studentId, examType = 'BAC') {
    let prediction = await this.findOne({
      where: { studentId, examType, isActive: true }
    });

    if (!prediction) {
      prediction = await this.create({
        studentId,
        examType,
        examYear: new Date().getFullYear()
      });
    }

    return prediction;
  };

  BacPrediction.calculateForStudent = async function(studentId) {
    const prediction = await this.getOrCreate(studentId);
    return await prediction.calculate();
  };

  return BacPrediction;
};
