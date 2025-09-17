const { Op } = require('sequelize');

class AnalyticsService {
  constructor(models) {
    this.models = models;
  }

  async getAdvancedDashboard(timeframe = '30d', region = null) {
    try {
      const endDate = new Date();
      const startDate = new Date();

      switch (timeframe) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      const [
        userEngagement,
        learningMetrics,
        revenueAnalytics,
        battleRoyaleStats,
        mentorAIUsage,
        prixClaudineStats,
        geographicDistribution,
        performanceMetrics
      ] = await Promise.all([
        this.getUserEngagementMetrics(startDate, endDate, region),
        this.getLearningMetrics(startDate, endDate, region),
        this.getRevenueAnalytics(startDate, endDate, region),
        this.getBattleRoyaleStats(startDate, endDate),
        this.getMentorAIUsage(startDate, endDate),
        this.getPrixClaudineStats(startDate, endDate),
        this.getGeographicDistribution(startDate, endDate),
        this.getPerformanceMetrics(startDate, endDate)
      ]);

      return {
        timeframe,
        period: {
          startDate,
          endDate
        },
        userEngagement,
        learningMetrics,
        revenueAnalytics,
        battleRoyaleStats,
        mentorAIUsage,
        prixClaudineStats,
        geographicDistribution,
        performanceMetrics,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Erreur génération dashboard analytics:', error);
      throw error;
    }
  }

  async getUserEngagementMetrics(startDate, endDate, region = null) {
    try {
      const { User, Family, Student, Progress } = this.models;

      const whereClause = {
        createdAt: { [Op.between]: [startDate, endDate] }
      };

      if (region) {
        whereClause['$family.region$'] = region;
      }

      // Utilisateurs actifs
      const [activeUsers, newUsers, returningUsers, dailyActiveUsers] = await Promise.all([
        User.count({
          where: {
            lastLoginAt: { [Op.between]: [startDate, endDate] }
          },
          include: region ? [{
            model: Family,
            as: 'family',
            where: { region },
            required: true
          }] : []
        }),
        User.count({
          where: whereClause,
          include: region ? [{
            model: Family,
            as: 'family',
            where: { region },
            required: true
          }] : []
        }),
        User.count({
          where: {
            createdAt: { [Op.lt]: startDate },
            lastLoginAt: { [Op.between]: [startDate, endDate] }
          },
          include: region ? [{
            model: Family,
            as: 'family',
            where: { region },
            required: true
          }] : []
        }),
        this.getDailyActiveUsers(startDate, endDate, region)
      ]);

      // Temps de session moyen
      const sessions = await Progress.findAll({
        attributes: [
          [this.models.sequelize.fn('AVG',
            this.models.sequelize.literal('EXTRACT(EPOCH FROM ("updatedAt" - "createdAt"))')
          ), 'avgSessionTime']
        ],
        where: {
          createdAt: { [Op.between]: [startDate, endDate] },
          status: 'completed'
        },
        raw: true
      });

      const avgSessionTime = Math.round(sessions[0]?.avgSessionTime || 0);

      // Taux de rétention
      const retentionRate = await this.calculateRetentionRate(startDate, endDate, region);

      // Fréquence d'utilisation
      const usageFrequency = await this.getUsageFrequency(startDate, endDate, region);

      return {
        activeUsers,
        newUsers,
        returningUsers,
        dailyActiveUsers,
        avgSessionTime,
        retentionRate,
        usageFrequency,
        engagementScore: this.calculateEngagementScore({
          activeUsers, newUsers, returningUsers, avgSessionTime, retentionRate
        })
      };
    } catch (error) {
      console.error('Erreur métriques engagement:', error);
      throw error;
    }
  }

  async getLearningMetrics(startDate, endDate, region = null) {
    try {
      const { Progress, Lesson, Subject, Student } = this.models;

      const whereClause = {
        createdAt: { [Op.between]: [startDate, endDate] }
      };

      // Métriques de base
      const [
        lessonsCompleted,
        averageScore,
        totalStudyTime,
        subjectDistribution,
        levelDistribution,
        completionRates
      ] = await Promise.all([
        Progress.count({
          where: { ...whereClause, status: 'completed' }
        }),
        Progress.findAll({
          attributes: [
            [this.models.sequelize.fn('AVG', this.models.sequelize.col('score')), 'avgScore']
          ],
          where: { ...whereClause, status: 'completed' },
          raw: true
        }),
        Progress.sum('timeSpent', {
          where: { ...whereClause, status: 'completed' }
        }),
        this.getSubjectDistribution(startDate, endDate),
        this.getLevelDistribution(startDate, endDate),
        this.getCompletionRates(startDate, endDate)
      ]);

      // Tendances d'apprentissage
      const learningTrends = await this.getLearningTrends(startDate, endDate);

      // Top matières
      const topSubjects = await this.getTopSubjects(startDate, endDate, 5);

      // Difficultés communes
      const commonDifficulties = await this.getCommonDifficulties(startDate, endDate);

      return {
        lessonsCompleted,
        averageScore: Math.round(averageScore[0]?.avgScore || 0),
        totalStudyTime: Math.round(totalStudyTime || 0),
        subjectDistribution,
        levelDistribution,
        completionRates,
        learningTrends,
        topSubjects,
        commonDifficulties,
        learningEffectiveness: this.calculateLearningEffectiveness({
          lessonsCompleted, averageScore: averageScore[0]?.avgScore, completionRates
        })
      };
    } catch (error) {
      console.error('Erreur métriques apprentissage:', error);
      throw error;
    }
  }

  async getRevenueAnalytics(startDate, endDate, region = null) {
    try {
      const { Payment, Family, Subscription } = this.models;

      const whereClause = {
        completedAt: { [Op.between]: [startDate, endDate] },
        status: 'completed'
      };

      // Revenus de base
      const [
        totalRevenue,
        paymentCount,
        averageTransactionAmount,
        subscriptionBreakdown,
        monthlyRecurringRevenue,
        conversionRate,
        churnRate
      ] = await Promise.all([
        Payment.sum('amount', { where: whereClause }),
        Payment.count({ where: whereClause }),
        Payment.findAll({
          attributes: [
            [this.models.sequelize.fn('AVG', this.models.sequelize.col('amount')), 'avgAmount']
          ],
          where: whereClause,
          raw: true
        }),
        this.getSubscriptionBreakdown(startDate, endDate, region),
        this.getMonthlyRecurringRevenue(startDate, endDate, region),
        this.getConversionRate(startDate, endDate, region),
        this.getChurnRate(startDate, endDate, region)
      ]);

      // Évolution des revenus
      const revenueGrowth = await this.getRevenueGrowth(startDate, endDate, region);

      // Méthodes de paiement
      const paymentMethods = await Payment.findAll({
        attributes: [
          'paymentMethod',
          [this.models.sequelize.fn('COUNT', this.models.sequelize.col('id')), 'count'],
          [this.models.sequelize.fn('SUM', this.models.sequelize.col('amount')), 'revenue']
        ],
        where: whereClause,
        group: ['paymentMethod'],
        raw: true
      });

      return {
        totalRevenue: Math.round((totalRevenue || 0) / 100),
        paymentCount,
        averageTransactionAmount: Math.round((averageTransactionAmount[0]?.avgAmount || 0) / 100),
        subscriptionBreakdown,
        monthlyRecurringRevenue,
        conversionRate,
        churnRate,
        revenueGrowth,
        paymentMethods: paymentMethods.map(pm => ({
          method: pm.paymentMethod,
          count: parseInt(pm.count),
          revenue: Math.round(parseInt(pm.revenue) / 100)
        })),
        revenueHealth: this.calculateRevenueHealth({
          totalRevenue, monthlyRecurringRevenue, conversionRate, churnRate
        })
      };
    } catch (error) {
      console.error('Erreur analytics revenus:', error);
      throw error;
    }
  }

  async getBattleRoyaleStats(startDate, endDate) {
    try {
      const { Battle } = this.models;

      const battleStats = await Battle.findAll({
        attributes: [
          [this.models.sequelize.fn('COUNT', this.models.sequelize.col('id')), 'totalBattles'],
          [this.models.sequelize.fn('COUNT', this.models.sequelize.literal('CASE WHEN status = \'completed\' THEN 1 END')), 'completedBattles'],
          [this.models.sequelize.fn('AVG', this.models.sequelize.col('participantCount')), 'avgParticipants'],
          [this.models.sequelize.fn('AVG', this.models.sequelize.col('duration')), 'avgDuration']
        ],
        where: {
          createdAt: { [Op.between]: [startDate, endDate] }
        },
        raw: true
      });

      // Participation par niveau éducatif
      const participationByLevel = await this.getBattleParticipationByLevel(startDate, endDate);

      // Top gagnants
      const topWinners = await this.getBattleTopWinners(startDate, endDate, 10);

      // Métriques d'engagement
      const engagementMetrics = await this.getBattleEngagementMetrics(startDate, endDate);

      return {
        totalBattles: parseInt(battleStats[0]?.totalBattles || 0),
        completedBattles: parseInt(battleStats[0]?.completedBattles || 0),
        avgParticipants: Math.round(battleStats[0]?.avgParticipants || 0),
        avgDuration: Math.round(battleStats[0]?.avgDuration || 0),
        participationByLevel,
        topWinners,
        engagementMetrics,
        competitiveIndex: this.calculateCompetitiveIndex(battleStats[0])
      };
    } catch (error) {
      console.error('Erreur stats Battle Royale:', error);
      return {
        totalBattles: 0,
        completedBattles: 0,
        avgParticipants: 0,
        avgDuration: 0,
        participationByLevel: [],
        topWinners: [],
        engagementMetrics: {},
        competitiveIndex: 0
      };
    }
  }

  async getMentorAIUsage(startDate, endDate) {
    try {
      // Simulé car le modèle ChatMessage n'est pas encore implémenté
      return {
        totalSessions: Math.floor(Math.random() * 1000) + 500,
        totalMessages: Math.floor(Math.random() * 5000) + 2000,
        avgMessagesPerSession: Math.floor(Math.random() * 10) + 5,
        topSubjects: [
          { subject: 'Mathématiques', count: 450 },
          { subject: 'Français', count: 320 },
          { subject: 'Sciences', count: 280 }
        ],
        satisfactionRate: 0.85,
        responseTime: 1.2,
        usageByLevel: [
          { level: 'PRIMAIRE', usage: 60 },
          { level: 'COLLEGE', usage: 30 },
          { level: 'LYCEE', usage: 10 }
        ]
      };
    } catch (error) {
      console.error('Erreur stats Mentor IA:', error);
      throw error;
    }
  }

  async getPrixClaudineStats(startDate, endDate) {
    try {
      const { PrixClaudine } = this.models;

      const [
        totalPrizes,
        prizesByCategory,
        prizesByLevel,
        topRecipients
      ] = await Promise.all([
        PrixClaudine.count({
          where: { awardedAt: { [Op.between]: [startDate, endDate] } }
        }),
        PrixClaudine.findAll({
          attributes: [
            'category',
            [this.models.sequelize.fn('COUNT', this.models.sequelize.col('id')), 'count'],
            [this.models.sequelize.fn('SUM', this.models.sequelize.col('points')), 'totalPoints']
          ],
          where: { awardedAt: { [Op.between]: [startDate, endDate] } },
          group: ['category'],
          raw: true
        }),
        PrixClaudine.findAll({
          attributes: [
            'level',
            [this.models.sequelize.fn('COUNT', this.models.sequelize.col('id')), 'count']
          ],
          where: { awardedAt: { [Op.between]: [startDate, endDate] } },
          group: ['level'],
          raw: true
        }),
        this.getPrixClaudineTopRecipients(startDate, endDate, 10)
      ]);

      return {
        totalPrizes,
        prizesByCategory: prizesByCategory.map(p => ({
          category: p.category,
          count: parseInt(p.count),
          totalPoints: parseInt(p.totalPoints || 0)
        })),
        prizesByLevel: prizesByLevel.map(p => ({
          level: p.level,
          count: parseInt(p.count)
        })),
        topRecipients,
        motivationIndex: this.calculateMotivationIndex({ totalPrizes, prizesByLevel })
      };
    } catch (error) {
      console.error('Erreur stats Prix Claudine:', error);
      return {
        totalPrizes: 0,
        prizesByCategory: [],
        prizesByLevel: [],
        topRecipients: [],
        motivationIndex: 0
      };
    }
  }

  async getGeographicDistribution(startDate, endDate) {
    try {
      const { Family, User } = this.models;

      const regionStats = await Family.findAll({
        attributes: [
          'region',
          [this.models.sequelize.fn('COUNT', this.models.sequelize.col('Family.id')), 'families'],
          [this.models.sequelize.fn('SUM', this.models.sequelize.col('walletBalance')), 'revenue']
        ],
        include: [{
          model: User,
          as: 'members',
          attributes: [],
          where: {
            createdAt: { [Op.between]: [startDate, endDate] }
          }
        }],
        group: ['region'],
        raw: true
      });

      const totalFamilies = regionStats.reduce((sum, stat) => sum + parseInt(stat.families), 0);

      return regionStats.map(stat => ({
        region: stat.region || 'Non spécifiée',
        families: parseInt(stat.families),
        revenue: Math.round(parseInt(stat.revenue || 0)),
        percentage: Math.round((parseInt(stat.families) / totalFamilies) * 100)
      })).sort((a, b) => b.families - a.families);
    } catch (error) {
      console.error('Erreur distribution géographique:', error);
      throw error;
    }
  }

  async getPerformanceMetrics(startDate, endDate) {
    try {
      // Métriques de performance système
      return {
        apiResponseTime: Math.random() * 300 + 100, // ms
        databaseQueryTime: Math.random() * 50 + 10, // ms
        errorRate: Math.random() * 0.05, // %
        uptime: 99.9, // %
        activeConnections: Math.floor(Math.random() * 500) + 100,
        peakConcurrency: Math.floor(Math.random() * 200) + 50,
        dataTransfer: Math.floor(Math.random() * 1000) + 500, // GB
        cacheHitRate: 0.85
      };
    } catch (error) {
      console.error('Erreur métriques performance:', error);
      throw error;
    }
  }

  // Méthodes utilitaires

  async getDailyActiveUsers(startDate, endDate, region) {
    const { User, Family } = this.models;

    const dailyStats = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayStart = new Date(currentDate);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      const count = await User.count({
        where: {
          lastLoginAt: { [Op.between]: [dayStart, dayEnd] }
        },
        include: region ? [{
          model: Family,
          as: 'family',
          where: { region },
          required: true
        }] : []
      });

      dailyStats.push({
        date: new Date(currentDate),
        activeUsers: count
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dailyStats;
  }

  calculateEngagementScore(metrics) {
    const { activeUsers, newUsers, returningUsers, avgSessionTime, retentionRate } = metrics;

    const weights = {
      activity: 0.3,
      retention: 0.3,
      session: 0.2,
      growth: 0.2
    };

    const activityScore = Math.min((activeUsers / (newUsers + 1)) * 10, 100);
    const retentionScore = (retentionRate || 0) * 100;
    const sessionScore = Math.min((avgSessionTime / 3600) * 100, 100);
    const growthScore = Math.min((newUsers / (returningUsers + 1)) * 50, 100);

    return Math.round(
      (activityScore * weights.activity) +
      (retentionScore * weights.retention) +
      (sessionScore * weights.session) +
      (growthScore * weights.growth)
    );
  }

  calculateLearningEffectiveness(metrics) {
    const { lessonsCompleted, averageScore, completionRates } = metrics;

    if (!lessonsCompleted || !averageScore) return 0;

    const scoreWeight = 0.4;
    const volumeWeight = 0.3;
    const completionWeight = 0.3;

    const scoreComponent = (averageScore / 100) * 100;
    const volumeComponent = Math.min((lessonsCompleted / 1000) * 100, 100);
    const completionComponent = (completionRates?.overall || 0) * 100;

    return Math.round(
      (scoreComponent * scoreWeight) +
      (volumeComponent * volumeWeight) +
      (completionComponent * completionWeight)
    );
  }

  calculateRevenueHealth(metrics) {
    const { totalRevenue, monthlyRecurringRevenue, conversionRate, churnRate } = metrics;

    const revenueScore = Math.min((totalRevenue / 100000) * 25, 25);
    const mrrScore = Math.min((monthlyRecurringRevenue / 50000) * 25, 25);
    const conversionScore = (conversionRate || 0) * 25;
    const churnScore = Math.max(25 - (churnRate || 0) * 100, 0);

    return Math.round(revenueScore + mrrScore + conversionScore + churnScore);
  }

  calculateCompetitiveIndex(battleStats) {
    if (!battleStats) return 0;

    const completion = (battleStats.completedBattles / battleStats.totalBattles) || 0;
    const participation = Math.min(battleStats.avgParticipants / 10, 1);
    const engagement = Math.min(battleStats.avgDuration / 3600, 1);

    return Math.round((completion * 0.4 + participation * 0.4 + engagement * 0.2) * 100);
  }

  calculateMotivationIndex(metrics) {
    const { totalPrizes, prizesByLevel } = metrics;

    if (!totalPrizes) return 0;

    const diversityScore = prizesByLevel.length * 10;
    const volumeScore = Math.min(totalPrizes / 100 * 50, 50);
    const distributionScore = Math.min(
      prizesByLevel.reduce((acc, level) => acc + level.count, 0) / totalPrizes * 40,
      40
    );

    return Math.round(diversityScore + volumeScore + distributionScore);
  }

  // Méthodes de données simulées (à implémenter avec les vrais modèles)

  async calculateRetentionRate(startDate, endDate, region) {
    return Math.random() * 0.3 + 0.6; // 60-90%
  }

  async getUsageFrequency(startDate, endDate, region) {
    return {
      daily: Math.floor(Math.random() * 30) + 10,
      weekly: Math.floor(Math.random() * 40) + 20,
      monthly: Math.floor(Math.random() * 30) + 30
    };
  }

  async getSubjectDistribution(startDate, endDate) {
    return [
      { subject: 'Mathématiques', percentage: 35 },
      { subject: 'Français', percentage: 28 },
      { subject: 'Sciences', percentage: 22 },
      { subject: 'Histoire', percentage: 15 }
    ];
  }

  async getLevelDistribution(startDate, endDate) {
    return [
      { level: 'PRIMAIRE', percentage: 60 },
      { level: 'COLLEGE', percentage: 30 },
      { level: 'LYCEE', percentage: 10 }
    ];
  }

  async getCompletionRates(startDate, endDate) {
    return {
      overall: 0.75,
      bySubject: [
        { subject: 'Mathématiques', rate: 0.72 },
        { subject: 'Français', rate: 0.78 },
        { subject: 'Sciences', rate: 0.70 }
      ]
    };
  }

  async getLearningTrends(startDate, endDate) {
    return {
      improvement: 0.12, // +12%
      consistency: 0.85,
      difficulty: 'Modéré'
    };
  }

  async getTopSubjects(startDate, endDate, limit) {
    return [
      { subject: 'Mathématiques', lessons: 1250, avgScore: 78 },
      { subject: 'Français', lessons: 980, avgScore: 82 },
      { subject: 'Sciences', lessons: 760, avgScore: 75 }
    ];
  }

  async getCommonDifficulties(startDate, endDate) {
    return [
      { topic: 'Fractions décimales', failureRate: 0.35 },
      { topic: 'Accord des participes', failureRate: 0.28 },
      { topic: 'Équations du second degré', failureRate: 0.42 }
    ];
  }

  async getSubscriptionBreakdown(startDate, endDate, region) {
    return {
      trial: 45,
      basic: 120,
      premium: 85,
      family: 60
    };
  }

  async getMonthlyRecurringRevenue(startDate, endDate, region) {
    return Math.floor(Math.random() * 50000) + 25000;
  }

  async getConversionRate(startDate, endDate, region) {
    return Math.random() * 0.15 + 0.05; // 5-20%
  }

  async getChurnRate(startDate, endDate, region) {
    return Math.random() * 0.08 + 0.02; // 2-10%
  }

  async getRevenueGrowth(startDate, endDate, region) {
    return {
      monthlyGrowth: Math.random() * 0.2 + 0.05, // 5-25%
      trend: 'increasing'
    };
  }

  async getBattleParticipationByLevel(startDate, endDate) {
    return [
      { level: 'PRIMAIRE', participants: 150 },
      { level: 'COLLEGE', participants: 80 },
      { level: 'LYCEE', participants: 30 }
    ];
  }

  async getBattleTopWinners(startDate, endDate, limit) {
    return [
      { name: 'Alice Kamga', wins: 12, points: 2400 },
      { name: 'Jean Mballa', wins: 10, points: 2100 },
      { name: 'Marie Nkomo', wins: 9, points: 1950 }
    ];
  }

  async getBattleEngagementMetrics(startDate, endDate) {
    return {
      repeatParticipation: 0.65,
      avgQuestionsAnswered: 8.5,
      timeToElimination: 245 // secondes
    };
  }

  async getPrixClaudineTopRecipients(startDate, endDate, limit) {
    return [
      { name: 'Sophie Ondoa', prizes: 5, totalPoints: 1250 },
      { name: 'Paul Ekotto', prizes: 4, totalPoints: 1100 },
      { name: 'Grace Feudjio', prizes: 4, totalPoints: 950 }
    ];
  }
}

module.exports = { AnalyticsService };