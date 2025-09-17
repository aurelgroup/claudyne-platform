const { PrixClaudine } = require('../models/PrixClaudine');
const { Student } = require('../models/Student');
const { Progress } = require('../models/Progress');
const { Battle } = require('../models/Battle');
const { Lesson } = require('../models/Lesson');

class PrixClaudineService {
  constructor() {
    this.categories = {
      EXCELLENCE_ACADEMIQUE: {
        name: 'Excellence Académique',
        description: 'Récompense l\'excellence dans les matières scolaires',
        badges: ['Génie Mathématiques', 'Maître Français', 'Scientifique Émérite', 'Historien Brillant'],
        criteria: {
          minScore: 90,
          minLessonsCompleted: 50,
          consistency: 0.85
        }
      },
      PERSEVERANCE: {
        name: 'Persévérance',
        description: 'Honore la détermination et l\'effort continu',
        badges: ['Guerrier du Savoir', 'Esprit Indomptable', 'Force Tranquille', 'Champion de l\'Effort'],
        criteria: {
          streakDays: 30,
          lessonsPerWeek: 15,
          comebackFromFailure: true
        }
      },
      LEADERSHIP: {
        name: 'Leadership',
        description: 'Récompense les qualités de leadership et d\'entraide',
        badges: ['Mentor Junior', 'Guide des Pairs', 'Ambassadeur', 'Leader Né'],
        criteria: {
          battleWins: 20,
          helpedStudents: 10,
          communityContribution: 5
        }
      },
      INNOVATION: {
        name: 'Innovation',
        description: 'Célèbre la créativité et la pensée originale',
        badges: ['Esprit Innovant', 'Créateur de Solutions', 'Penseur Original', 'Génie Créatif'],
        criteria: {
          uniqueAnswers: 50,
          problemSolvingScore: 85,
          originalityIndex: 0.8
        }
      },
      ENGAGEMENT_COMMUNAUTAIRE: {
        name: 'Engagement Communautaire',
        description: 'Valorise l\'implication dans la communauté éducative',
        badges: ['Citoyen Modèle', 'Bâtisseur de Communauté', 'Esprit Solidaire', 'Héros Local'],
        criteria: {
          forumParticipation: 100,
          sharedResources: 25,
          mentoringSessions: 10
        }
      },
      HERITAGE_CLAUDINE: {
        name: 'Héritage Claudine',
        description: 'Prix spécial en mémoire de Meffo Mehtah Tchandjio Claudine',
        badges: ['Gardien de l\'Héritage', 'Flamme du Savoir', 'Ambassadeur Claudine', 'Légende Vivante'],
        criteria: {
          overallExcellence: 95,
          inspirationalImpact: true,
          culturalContribution: true
        }
      }
    };

    this.levels = {
      BRONZE: { points: 100, multiplier: 1 },
      ARGENT: { points: 250, multiplier: 1.5 },
      OR: { points: 500, multiplier: 2 },
      PLATINE: { points: 1000, multiplier: 3 },
      DIAMANT: { points: 2000, multiplier: 5 }
    };

    this.monthlyThemes = {
      1: 'Nouveau Départ - Résolutions Éducatives',
      2: 'Amour de l\'Apprentissage',
      3: 'Renaissance du Savoir',
      4: 'Éveil Printanier des Talents',
      5: 'Mois de Maman Claudine - Héritage Maternel',
      6: 'Fête des Papas Éducateurs',
      7: 'Vacances Productives',
      8: 'Préparation de la Rentrée',
      9: 'Mois de l\'Excellence',
      10: 'Récolte des Efforts',
      11: 'Gratitude et Partage',
      12: 'Bilan et Perspectives'
    };
  }

  async evaluateAllStudents() {
    try {
      const students = await Student.findAll({
        include: [
          { model: Progress, as: 'progress' },
          { model: Battle, as: 'battles' }
        ]
      });

      const evaluationResults = [];

      for (const student of students) {
        const evaluation = await this.evaluateStudent(student.id);
        evaluationResults.push(evaluation);
      }

      return evaluationResults;
    } catch (error) {
      console.error('Erreur lors de l\'évaluation des étudiants:', error);
      throw error;
    }
  }

  async evaluateStudent(studentId) {
    try {
      const student = await Student.findByPk(studentId, {
        include: [
          { model: Progress, as: 'progress' },
          { model: Battle, as: 'battles' }
        ]
      });

      if (!student) {
        throw new Error('Étudiant non trouvé');
      }

      const metrics = await this.calculateStudentMetrics(student);
      const eligiblePrizes = this.determineEligiblePrizes(metrics);
      const recommendations = this.generateRecommendations(metrics, eligiblePrizes);

      return {
        studentId,
        student: {
          name: student.name,
          educationLevel: student.educationLevel,
          school: student.school
        },
        metrics,
        eligiblePrizes,
        recommendations,
        evaluatedAt: new Date()
      };
    } catch (error) {
      console.error(`Erreur lors de l'évaluation de l'étudiant ${studentId}:`, error);
      throw error;
    }
  }

  async calculateStudentMetrics(student) {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const lastThreeMonths = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());

    const lessons = await Lesson.findAll({
      where: { studentId: student.id }
    });

    const battles = await Battle.findAll({
      where: { winnerId: student.id }
    });

    const progress = student.progress || [];

    return {
      academic: {
        averageScore: this.calculateAverageScore(progress),
        lessonsCompleted: lessons.length,
        consistency: this.calculateConsistency(progress),
        subjectMastery: this.calculateSubjectMastery(progress),
        improvementRate: this.calculateImprovementRate(progress)
      },
      engagement: {
        streakDays: this.calculateStreak(progress),
        weeklyActivity: this.calculateWeeklyActivity(progress),
        battleParticipation: student.battles?.length || 0,
        battleWins: battles.length,
        winRate: battles.length / (student.battles?.length || 1)
      },
      social: {
        helpedStudents: await this.countHelpedStudents(student.id),
        forumParticipation: await this.countForumParticipation(student.id),
        sharedResources: await this.countSharedResources(student.id),
        mentoringSessions: await this.countMentoringSessions(student.id)
      },
      innovation: {
        uniqueAnswers: await this.countUniqueAnswers(student.id),
        problemSolvingScore: this.calculateProblemSolvingScore(progress),
        originalityIndex: await this.calculateOriginalityIndex(student.id)
      },
      leadership: {
        communityContribution: await this.calculateCommunityContribution(student.id),
        inspirationalImpact: await this.calculateInspirationalImpact(student.id),
        leadershipScore: await this.calculateLeadershipScore(student.id)
      }
    };
  }

  determineEligiblePrizes(metrics) {
    const eligible = [];

    Object.entries(this.categories).forEach(([categoryKey, category]) => {
      const eligibilityScore = this.calculateEligibilityScore(metrics, category.criteria);

      if (eligibilityScore >= 0.7) {
        const level = this.determinePrizeLevel(eligibilityScore);
        eligible.push({
          category: categoryKey,
          name: category.name,
          description: category.description,
          level,
          score: eligibilityScore,
          badge: this.selectBadge(category.badges, level),
          points: this.calculatePoints(level, eligibilityScore)
        });
      }
    });

    return eligible.sort((a, b) => b.score - a.score);
  }

  calculateEligibilityScore(metrics, criteria) {
    let score = 0;
    let maxScore = 0;

    if (criteria.minScore !== undefined) {
      score += Math.min(metrics.academic.averageScore / criteria.minScore, 1) * 20;
      maxScore += 20;
    }

    if (criteria.minLessonsCompleted !== undefined) {
      score += Math.min(metrics.academic.lessonsCompleted / criteria.minLessonsCompleted, 1) * 15;
      maxScore += 15;
    }

    if (criteria.consistency !== undefined) {
      score += Math.min(metrics.academic.consistency / criteria.consistency, 1) * 15;
      maxScore += 15;
    }

    if (criteria.streakDays !== undefined) {
      score += Math.min(metrics.engagement.streakDays / criteria.streakDays, 1) * 20;
      maxScore += 20;
    }

    if (criteria.battleWins !== undefined) {
      score += Math.min(metrics.engagement.battleWins / criteria.battleWins, 1) * 15;
      maxScore += 15;
    }

    if (criteria.helpedStudents !== undefined) {
      score += Math.min(metrics.social.helpedStudents / criteria.helpedStudents, 1) * 15;
      maxScore += 15;
    }

    if (criteria.uniqueAnswers !== undefined) {
      score += Math.min(metrics.innovation.uniqueAnswers / criteria.uniqueAnswers, 1) * 10;
      maxScore += 10;
    }

    if (criteria.overallExcellence !== undefined) {
      const overallScore = (
        metrics.academic.averageScore * 0.4 +
        metrics.engagement.streakDays * 0.2 +
        metrics.social.helpedStudents * 0.2 +
        metrics.innovation.originalityIndex * 100 * 0.2
      );
      score += Math.min(overallScore / criteria.overallExcellence, 1) * 25;
      maxScore += 25;
    }

    return maxScore > 0 ? score / maxScore : 0;
  }

  determinePrizeLevel(score) {
    if (score >= 0.95) return 'DIAMANT';
    if (score >= 0.90) return 'PLATINE';
    if (score >= 0.80) return 'OR';
    if (score >= 0.70) return 'ARGENT';
    return 'BRONZE';
  }

  selectBadge(badges, level) {
    const levelIndex = {
      'BRONZE': 0,
      'ARGENT': 1,
      'OR': 2,
      'PLATINE': 3,
      'DIAMANT': 3
    };

    return badges[levelIndex[level]] || badges[0];
  }

  calculatePoints(level, score) {
    const basePoints = this.levels[level].points;
    const multiplier = this.levels[level].multiplier;
    return Math.floor(basePoints * multiplier * score);
  }

  async awardPrize(studentId, prizeData) {
    try {
      const existingPrize = await PrixClaudine.findOne({
        where: {
          studentId,
          category: prizeData.category,
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1
        }
      });

      if (existingPrize) {
        if (prizeData.level > existingPrize.level) {
          await existingPrize.update({
            level: prizeData.level,
            badge: prizeData.badge,
            points: prizeData.points,
            score: prizeData.score,
            upgradedAt: new Date()
          });
          return { type: 'upgraded', prize: existingPrize };
        } else {
          return { type: 'existing', prize: existingPrize };
        }
      }

      const newPrize = await PrixClaudine.create({
        studentId,
        category: prizeData.category,
        name: prizeData.name,
        description: prizeData.description,
        level: prizeData.level,
        badge: prizeData.badge,
        points: prizeData.points,
        score: prizeData.score,
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        theme: this.monthlyThemes[new Date().getMonth() + 1],
        awardedAt: new Date()
      });

      await this.updateStudentPoints(studentId, prizeData.points);

      return { type: 'new', prize: newPrize };
    } catch (error) {
      console.error('Erreur lors de l\'attribution du prix:', error);
      throw error;
    }
  }

  async updateStudentPoints(studentId, points) {
    const student = await Student.findByPk(studentId);
    if (student) {
      const newTotalPoints = (student.totalPoints || 0) + points;
      await student.update({ totalPoints: newTotalPoints });
    }
  }

  generateRecommendations(metrics, eligiblePrizes) {
    const recommendations = [];

    if (metrics.academic.averageScore < 70) {
      recommendations.push({
        type: 'academic',
        priority: 'high',
        message: 'Concentrez-vous sur l\'amélioration de vos notes. Révisez régulièrement et demandez de l\'aide si nécessaire.',
        action: 'Planifier 30 minutes de révision quotidienne'
      });
    }

    if (metrics.engagement.streakDays < 7) {
      recommendations.push({
        type: 'engagement',
        priority: 'medium',
        message: 'Essayez d\'étudier tous les jours pour développer une habitude d\'apprentissage.',
        action: 'Définir un horaire d\'étude quotidien'
      });
    }

    if (metrics.social.helpedStudents < 5) {
      recommendations.push({
        type: 'social',
        priority: 'medium',
        message: 'Aidez vos camarades pour développer vos compétences de leadership.',
        action: 'Participer au forum d\'entraide'
      });
    }

    if (metrics.engagement.battleWins < 10) {
      recommendations.push({
        type: 'competition',
        priority: 'low',
        message: 'Participez aux Battle Royales pour tester vos connaissances.',
        action: 'Rejoindre 3 battles cette semaine'
      });
    }

    if (eligiblePrizes.length === 0) {
      recommendations.push({
        type: 'motivation',
        priority: 'high',
        message: 'Vous êtes sur la bonne voie ! Continuez vos efforts pour débloquer votre premier prix.',
        action: 'Fixer un objectif d\'apprentissage hebdomadaire'
      });
    }

    return recommendations;
  }

  async getLeaderboard(category = null, timeframe = 'month') {
    try {
      const whereClause = {};

      if (category) {
        whereClause.category = category;
      }

      if (timeframe === 'month') {
        whereClause.month = new Date().getMonth() + 1;
        whereClause.year = new Date().getFullYear();
      } else if (timeframe === 'year') {
        whereClause.year = new Date().getFullYear();
      }

      const prizes = await PrixClaudine.findAll({
        where: whereClause,
        include: [
          {
            model: Student,
            as: 'student',
            attributes: ['id', 'name', 'educationLevel', 'school']
          }
        ],
        order: [['points', 'DESC'], ['score', 'DESC']]
      });

      const leaderboard = prizes.map((prize, index) => ({
        rank: index + 1,
        student: prize.student,
        prize: {
          category: prize.category,
          name: prize.name,
          level: prize.level,
          badge: prize.badge,
          points: prize.points,
          score: prize.score
        },
        awardedAt: prize.awardedAt
      }));

      return leaderboard;
    } catch (error) {
      console.error('Erreur lors de la récupération du classement:', error);
      throw error;
    }
  }

  async calculateAverageScore(progress) {
    if (!progress || progress.length === 0) return 0;
    const totalScore = progress.reduce((sum, p) => sum + (p.score || 0), 0);
    return totalScore / progress.length;
  }

  calculateConsistency(progress) {
    if (!progress || progress.length < 7) return 0;

    const last7Days = progress.slice(-7);
    const studyDays = last7Days.filter(p => p.completed).length;
    return studyDays / 7;
  }

  calculateStreak(progress) {
    if (!progress || progress.length === 0) return 0;

    let streak = 0;
    for (let i = progress.length - 1; i >= 0; i--) {
      if (progress[i].completed) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  calculateWeeklyActivity(progress) {
    if (!progress || progress.length === 0) return 0;

    const lastWeek = progress.filter(p => {
      const progressDate = new Date(p.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return progressDate >= weekAgo;
    });

    return lastWeek.length;
  }

  calculateSubjectMastery(progress) {
    const subjects = {};
    progress.forEach(p => {
      if (!subjects[p.subject]) {
        subjects[p.subject] = [];
      }
      subjects[p.subject].push(p.score || 0);
    });

    const mastery = {};
    Object.keys(subjects).forEach(subject => {
      const scores = subjects[subject];
      mastery[subject] = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    });

    return mastery;
  }

  calculateImprovementRate(progress) {
    if (!progress || progress.length < 10) return 0;

    const first5 = progress.slice(0, 5);
    const last5 = progress.slice(-5);

    const firstAvg = first5.reduce((sum, p) => sum + (p.score || 0), 0) / 5;
    const lastAvg = last5.reduce((sum, p) => sum + (p.score || 0), 0) / 5;

    return lastAvg - firstAvg;
  }

  async countHelpedStudents(studentId) {
    return 0;
  }

  async countForumParticipation(studentId) {
    return 0;
  }

  async countSharedResources(studentId) {
    return 0;
  }

  async countMentoringSessions(studentId) {
    return 0;
  }

  async countUniqueAnswers(studentId) {
    return 0;
  }

  calculateProblemSolvingScore(progress) {
    if (!progress || progress.length === 0) return 0;

    const problemSolvingLessons = progress.filter(p =>
      p.type === 'problem_solving' || p.subject === 'mathématiques'
    );

    if (problemSolvingLessons.length === 0) return 0;

    return problemSolvingLessons.reduce((sum, p) => sum + (p.score || 0), 0) / problemSolvingLessons.length;
  }

  async calculateOriginalityIndex(studentId) {
    return Math.random() * 0.3 + 0.7;
  }

  async calculateCommunityContribution(studentId) {
    return 0;
  }

  async calculateInspirationalImpact(studentId) {
    return false;
  }

  async calculateLeadershipScore(studentId) {
    return 0;
  }

  async runMonthlyEvaluation() {
    try {
      console.log('🏆 Démarrage de l\'évaluation mensuelle Prix Claudine...');

      const evaluationResults = await this.evaluateAllStudents();
      const awardedPrizes = [];

      for (const result of evaluationResults) {
        for (const eligiblePrize of result.eligiblePrizes) {
          const awardResult = await this.awardPrize(result.studentId, eligiblePrize);
          awardedPrizes.push({
            student: result.student,
            award: awardResult
          });
        }
      }

      console.log(`✅ Évaluation terminée. ${awardedPrizes.length} prix attribués.`);

      return {
        totalEvaluated: evaluationResults.length,
        totalPrizesAwarded: awardedPrizes.length,
        results: awardedPrizes,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        theme: this.monthlyThemes[new Date().getMonth() + 1]
      };
    } catch (error) {
      console.error('❌ Erreur lors de l\'évaluation mensuelle:', error);
      throw error;
    }
  }
}

module.exports = { PrixClaudineService };