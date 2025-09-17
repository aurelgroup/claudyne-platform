/**
 * Service Battle Royale Éducatif Claudyne
 * Système de compétition éducative temps réel pour le Cameroun
 */

const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class BattleRoyaleService {
  constructor() {
    this.activeBattles = new Map();
    this.waitingQueue = new Map(); // File d'attente par niveau/matière
    this.battleHistory = new Map();

    // Configuration des battles
    this.config = {
      maxParticipants: parseInt(process.env.BATTLE_ROYALE_MAX_PLAYERS) || 100,
      minParticipants: 2,
      questionTime: 30000, // 30 secondes par question
      battleDuration: 300000, // 5 minutes max
      questionsPerBattle: 10,
      eliminationThreshold: 3, // 3 mauvaises réponses = élimination
      rapidityBonus: 50 // Points bonus max pour rapidité
    };

    // Questions par matière et niveau
    this.questionBank = this.initializeQuestionBank();

    logger.info('🏆 Battle Royale Service initialized');
  }

  /**
   * Initialiser la banque de questions
   */
  initializeQuestionBank() {
    return {
      PRIMAIRE: {
        mathématiques: [
          {
            id: 'math_p_001',
            question: 'Combien font 15 + 27 ?',
            options: ['40', '42', '45', '38'],
            correct: 1,
            difficulty: 'facile',
            explanation: '15 + 27 = 42. On peut décomposer : 15 + 20 + 7 = 35 + 7 = 42'
          },
          {
            id: 'math_p_002',
            question: 'Au marché de Douala, maman achète 3 ananas à 500 FCFA chacun. Combien paie-t-elle en tout ?',
            options: ['1000 FCFA', '1500 FCFA', '2000 FCFA', '1200 FCFA'],
            correct: 1,
            difficulty: 'facile',
            explanation: '3 × 500 = 1500 FCFA. Trois fois cinq cents francs.'
          }
        ],
        français: [
          {
            id: 'fr_p_001',
            question: 'Comment écrit-on le pluriel de "cheval" ?',
            options: ['chevals', 'chevaux', 'chevau', 'chevauxs'],
            correct: 1,
            difficulty: 'moyen',
            explanation: 'Le pluriel de "cheval" est "chevaux". C\'est une exception française.'
          }
        ]
      },

      COLLEGE: {
        mathématiques: [
          {
            id: 'math_c_001',
            question: 'Résoudre : 2x + 5 = 13',
            options: ['x = 3', 'x = 4', 'x = 5', 'x = 6'],
            correct: 1,
            difficulty: 'moyen',
            explanation: '2x + 5 = 13 → 2x = 13 - 5 → 2x = 8 → x = 4'
          },
          {
            id: 'math_c_002',
            question: 'La distance Yaoundé-Douala est de 240 km. Si un taxi roule à 80 km/h, combien de temps met-il ?',
            options: ['2h30', '3h', '3h30', '4h'],
            correct: 1,
            difficulty: 'moyen',
            explanation: 'Temps = Distance ÷ Vitesse = 240 ÷ 80 = 3 heures'
          }
        ],
        sciences: [
          {
            id: 'sci_c_001',
            question: 'Quelle est la formule chimique de l\'eau ?',
            options: ['HO', 'H2O', 'H3O', 'HO2'],
            correct: 1,
            difficulty: 'facile',
            explanation: 'L\'eau a pour formule H2O : 2 atomes d\'hydrogène et 1 atome d\'oxygène'
          }
        ]
      },

      LYCEE: {
        mathématiques: [
          {
            id: 'math_l_001',
            question: 'Dérivée de f(x) = x² + 3x - 2',
            options: ['2x + 3', 'x + 3', '2x + 2', 'x² + 3'],
            correct: 0,
            difficulty: 'difficile',
            explanation: 'f\'(x) = 2x + 3. La dérivée de x² est 2x, de 3x est 3, et de -2 est 0.'
          }
        ],
        physique: [
          {
            id: 'phy_l_001',
            question: 'Unité de la force dans le système international',
            options: ['Joule', 'Newton', 'Watt', 'Pascal'],
            correct: 1,
            difficulty: 'moyen',
            explanation: 'Le Newton (N) est l\'unité de force. 1N = 1 kg⋅m⋅s⁻²'
          }
        ]
      }
    };
  }

  /**
   * Créer une nouvelle battle
   */
  async createBattle(initiator) {
    try {
      const battleId = uuidv4();
      const now = new Date();

      const battle = {
        id: battleId,
        status: 'WAITING', // WAITING, IN_PROGRESS, FINISHED
        createdBy: initiator.studentId,
        createdAt: now,
        startedAt: null,
        endedAt: null,

        // Configuration
        subject: initiator.subject,
        educationLevel: initiator.educationLevel,
        region: initiator.region || 'CENTRE', // Région du Cameroun
        maxParticipants: this.config.maxParticipants,

        // Participants
        participants: new Map(),
        eliminated: new Map(),
        spectators: new Map(),

        // Questions et état
        questions: [],
        currentQuestionIndex: 0,
        questionStartTime: null,

        // Scores et classement
        leaderboard: [],

        // Métadonnées
        metadata: {
          totalQuestions: this.config.questionsPerBattle,
          questionTime: this.config.questionTime,
          eliminationThreshold: this.config.eliminationThreshold
        }
      };

      // Ajouter le créateur comme premier participant
      battle.participants.set(initiator.studentId, {
        studentId: initiator.studentId,
        studentName: `${initiator.firstName} ${initiator.lastName}`,
        educationLevel: initiator.educationLevel,
        joinedAt: now,
        score: 0,
        lives: 3, // 3 vies (erreurs autorisées)
        answers: [],
        isReady: false,
        lastActivity: now
      });

      // Générer les questions pour cette battle
      battle.questions = this.generateBattleQuestions(
        initiator.subject,
        initiator.educationLevel,
        this.config.questionsPerBattle
      );

      this.activeBattles.set(battleId, battle);

      logger.info(`Battle créée: ${battleId} par étudiant ${initiator.studentId}`, {
        subject: initiator.subject,
        level: initiator.educationLevel
      });

      return {
        success: true,
        battleId: battleId,
        battle: this.formatBattleForClient(battle)
      };

    } catch (error) {
      logger.error('Erreur création battle:', error);
      return {
        success: false,
        message: 'Erreur lors de la création de la battle'
      };
    }
  }

  /**
   * Rejoindre une battle existante
   */
  async joinBattle(battleId, participant) {
    try {
      const battle = this.activeBattles.get(battleId);

      if (!battle) {
        return { success: false, message: 'Battle non trouvée' };
      }

      if (battle.status !== 'WAITING') {
        return { success: false, message: 'Battle déjà commencée ou terminée' };
      }

      if (battle.participants.size >= battle.maxParticipants) {
        return { success: false, message: 'Battle complète' };
      }

      // Vérifier la compatibilité niveau/matière
      if (battle.subject !== participant.subject ||
          battle.educationLevel !== participant.educationLevel) {
        return {
          success: false,
          message: 'Niveau ou matière incompatible'
        };
      }

      // Ajouter le participant
      battle.participants.set(participant.studentId, {
        studentId: participant.studentId,
        studentName: `${participant.firstName} ${participant.lastName}`,
        educationLevel: participant.educationLevel,
        joinedAt: new Date(),
        score: 0,
        lives: 3,
        answers: [],
        isReady: false,
        lastActivity: new Date()
      });

      logger.info(`Étudiant ${participant.studentId} a rejoint la battle ${battleId}`);

      // Démarrer automatiquement si assez de participants
      if (battle.participants.size >= this.config.minParticipants) {
        setTimeout(() => {
          this.startBattleIfReady(battleId);
        }, 10000); // 10 secondes pour que tous se préparent
      }

      return {
        success: true,
        battle: this.formatBattleForClient(battle),
        participantCount: battle.participants.size
      };

    } catch (error) {
      logger.error('Erreur rejoindre battle:', error);
      return { success: false, message: 'Erreur lors de la connexion à la battle' };
    }
  }

  /**
   * Marquer un participant comme prêt
   */
  async markParticipantReady(battleId, studentId) {
    const battle = this.activeBattles.get(battleId);
    if (!battle || !battle.participants.has(studentId)) {
      return { success: false, message: 'Battle ou participant non trouvé' };
    }

    const participant = battle.participants.get(studentId);
    participant.isReady = true;
    participant.lastActivity = new Date();

    // Vérifier si tous sont prêts
    const allReady = Array.from(battle.participants.values()).every(p => p.isReady);
    if (allReady && battle.participants.size >= this.config.minParticipants) {
      this.startBattle(battleId);
    }

    return { success: true };
  }

  /**
   * Démarrer une battle
   */
  async startBattle(battleId) {
    try {
      const battle = this.activeBattles.get(battleId);
      if (!battle || battle.status !== 'WAITING') {
        return;
      }

      battle.status = 'IN_PROGRESS';
      battle.startedAt = new Date();
      battle.currentQuestionIndex = 0;

      // Démarrer la première question
      this.startQuestion(battleId);

      logger.info(`Battle ${battleId} démarrée avec ${battle.participants.size} participants`);

      return { success: true };

    } catch (error) {
      logger.error('Erreur démarrage battle:', error);
    }
  }

  /**
   * Démarrer une question
   */
  startQuestion(battleId) {
    const battle = this.activeBattles.get(battleId);
    if (!battle || battle.status !== 'IN_PROGRESS') return;

    const question = battle.questions[battle.currentQuestionIndex];
    if (!question) {
      this.endBattle(battleId);
      return;
    }

    battle.questionStartTime = new Date();

    // Programmer la fin automatique de la question
    setTimeout(() => {
      this.endQuestion(battleId);
    }, this.config.questionTime);

    logger.info(`Question ${battle.currentQuestionIndex + 1} démarrée pour battle ${battleId}`);
  }

  /**
   * Soumettre une réponse
   */
  async submitAnswer(battleId, studentId, answerData) {
    try {
      const battle = this.activeBattles.get(battleId);
      if (!battle || battle.status !== 'IN_PROGRESS') {
        return { success: false, message: 'Battle non active' };
      }

      const participant = battle.participants.get(studentId);
      if (!participant) {
        return { success: false, message: 'Participant non trouvé' };
      }

      const question = battle.questions[battle.currentQuestionIndex];
      const responseTime = Date.now() - battle.questionStartTime.getTime();

      // Vérifier si déjà répondu à cette question
      const alreadyAnswered = participant.answers.some(a =>
        a.questionIndex === battle.currentQuestionIndex
      );

      if (alreadyAnswered) {
        return { success: false, message: 'Déjà répondu à cette question' };
      }

      // Calculer le score
      const isCorrect = answerData.selectedOption === question.correct;
      let questionScore = 0;

      if (isCorrect) {
        questionScore = 100;
        // Bonus de rapidité
        const rapidityBonus = Math.max(0,
          this.config.rapidityBonus - Math.floor(responseTime / 1000)
        );
        questionScore += rapidityBonus;
      } else {
        // Perdre une vie
        participant.lives--;
      }

      // Enregistrer la réponse
      const answer = {
        questionIndex: battle.currentQuestionIndex,
        questionId: question.id,
        selectedOption: answerData.selectedOption,
        isCorrect: isCorrect,
        responseTime: responseTime,
        score: questionScore,
        timestamp: new Date()
      };

      participant.answers.push(answer);
      participant.score += questionScore;
      participant.lastActivity = new Date();

      // Élimination si plus de vies
      if (participant.lives <= 0) {
        this.eliminateParticipant(battleId, studentId);
      }

      logger.info(`Réponse soumise battle ${battleId}: étudiant ${studentId}, score ${questionScore}`);

      return {
        success: true,
        answer: answer,
        participant: {
          score: participant.score,
          lives: participant.lives,
          eliminated: participant.lives <= 0
        }
      };

    } catch (error) {
      logger.error('Erreur soumission réponse:', error);
      return { success: false, message: 'Erreur lors de la soumission' };
    }
  }

  /**
   * Éliminer un participant
   */
  eliminateParticipant(battleId, studentId) {
    const battle = this.activeBattles.get(battleId);
    if (!battle) return;

    const participant = battle.participants.get(studentId);
    if (!participant) return;

    // Déplacer vers les éliminés
    battle.eliminated.set(studentId, {
      ...participant,
      eliminatedAt: new Date(),
      finalRank: battle.participants.size + battle.eliminated.size
    });

    battle.participants.delete(studentId);

    logger.info(`Participant ${studentId} éliminé de la battle ${battleId}`);

    // Vérifier si la battle doit se terminer
    if (battle.participants.size <= 1) {
      this.endBattle(battleId);
    }
  }

  /**
   * Terminer une question
   */
  endQuestion(battleId) {
    const battle = this.activeBattles.get(battleId);
    if (!battle || battle.status !== 'IN_PROGRESS') return;

    // Mettre à jour le leaderboard
    this.updateLeaderboard(battleId);

    // Passer à la question suivante ou terminer
    battle.currentQuestionIndex++;

    if (battle.currentQuestionIndex >= battle.questions.length ||
        battle.participants.size <= 1) {
      this.endBattle(battleId);
    } else {
      // Pause entre questions
      setTimeout(() => {
        this.startQuestion(battleId);
      }, 3000); // 3 secondes de pause
    }
  }

  /**
   * Mettre à jour le classement
   */
  updateLeaderboard(battleId) {
    const battle = this.activeBattles.get(battleId);
    if (!battle) return;

    battle.leaderboard = Array.from(battle.participants.values())
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        // En cas d'égalité, privilégier le plus rapide
        const aAvgTime = a.answers.reduce((sum, ans) => sum + ans.responseTime, 0) / a.answers.length;
        const bAvgTime = b.answers.reduce((sum, ans) => sum + ans.responseTime, 0) / b.answers.length;
        return aAvgTime - bAvgTime;
      })
      .map((participant, index) => ({
        rank: index + 1,
        studentId: participant.studentId,
        studentName: participant.studentName,
        score: participant.score,
        lives: participant.lives,
        answers: participant.answers.length
      }));
  }

  /**
   * Terminer une battle
   */
  async endBattle(battleId) {
    try {
      const battle = this.activeBattles.get(battleId);
      if (!battle) return;

      battle.status = 'FINISHED';
      battle.endedAt = new Date();

      // Classement final
      this.updateLeaderboard(battleId);

      // Calculer les récompenses
      const rewards = this.calculateRewards(battle);

      // Sauvegarder dans l'historique
      this.battleHistory.set(battleId, {
        ...battle,
        rewards: rewards,
        duration: battle.endedAt - battle.startedAt
      });

      // Nettoyer les battles actives après 10 minutes
      setTimeout(() => {
        this.activeBattles.delete(battleId);
      }, 10 * 60 * 1000);

      logger.info(`Battle ${battleId} terminée`, {
        participants: battle.participants.size + battle.eliminated.size,
        duration: battle.endedAt - battle.startedAt,
        winner: battle.leaderboard[0]?.studentName
      });

      return {
        success: true,
        battle: battle,
        leaderboard: battle.leaderboard,
        rewards: rewards
      };

    } catch (error) {
      logger.error('Erreur fin de battle:', error);
    }
  }

  /**
   * Calculer les récompenses
   */
  calculateRewards(battle) {
    const rewards = {};

    battle.leaderboard.forEach((participant, index) => {
      let points = 0;
      let badge = null;

      switch (index) {
        case 0: // 1er place
          points = 500;
          badge = '🥇 Champion Battle Royale';
          break;
        case 1: // 2ème place
          points = 300;
          badge = '🥈 Vice-Champion';
          break;
        case 2: // 3ème place
          points = 200;
          badge = '🥉 Podium Battle';
          break;
        default:
          points = Math.max(50, 100 - (index * 10)); // Points de participation
          if (index < 5) {
            badge = '🏆 Top 5 Battle';
          }
      }

      rewards[participant.studentId] = {
        rank: participant.rank,
        points: points,
        badge: badge,
        achievements: this.calculateAchievements(participant, battle)
      };
    });

    return rewards;
  }

  /**
   * Calculer les achievements
   */
  calculateAchievements(participant, battle) {
    const achievements = [];

    // Parfait score
    const correctAnswers = participant.answers.filter(a => a.isCorrect).length;
    if (correctAnswers === battle.questions.length) {
      achievements.push('🎯 Score Parfait');
    }

    // Vitesse éclair
    const avgResponseTime = participant.answers.reduce((sum, a) => sum + a.responseTime, 0) / participant.answers.length;
    if (avgResponseTime < 5000) { // Moins de 5 secondes en moyenne
      achievements.push('⚡ Vitesse Éclair');
    }

    // Survivant
    if (participant.lives === 3) {
      achievements.push('🛡️ Survivant Parfait');
    }

    return achievements;
  }

  /**
   * Générer les questions pour une battle
   */
  generateBattleQuestions(subject, educationLevel, count) {
    const questions = [];
    const questionPool = this.questionBank[educationLevel]?.[subject.toLowerCase()] || [];

    if (questionPool.length === 0) {
      // Questions par défaut si pas de banque
      return this.generateDefaultQuestions(subject, educationLevel, count);
    }

    // Mélanger et sélectionner
    const shuffled = [...questionPool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(count, shuffled.length));

    // Compléter avec des questions générées si nécessaire
    if (selected.length < count) {
      const additional = this.generateDefaultQuestions(
        subject,
        educationLevel,
        count - selected.length
      );
      questions.push(...selected, ...additional);
    } else {
      questions.push(...selected);
    }

    return questions.map((q, index) => ({
      ...q,
      index: index,
      timeLimit: this.config.questionTime
    }));
  }

  /**
   * Générer des questions par défaut
   */
  generateDefaultQuestions(subject, level, count) {
    const questions = [];

    for (let i = 0; i < count; i++) {
      questions.push({
        id: `default_${subject}_${level}_${i}`,
        question: `Question ${i + 1} de ${subject} niveau ${level}`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correct: Math.floor(Math.random() * 4),
        difficulty: 'moyen',
        explanation: 'Question générée automatiquement pour la battle.'
      });
    }

    return questions;
  }

  /**
   * Formater une battle pour le client
   */
  formatBattleForClient(battle) {
    return {
      id: battle.id,
      status: battle.status,
      subject: battle.subject,
      educationLevel: battle.educationLevel,
      region: battle.region,
      participantCount: battle.participants.size,
      maxParticipants: battle.maxParticipants,
      currentQuestion: battle.currentQuestionIndex,
      totalQuestions: battle.questions.length,
      createdAt: battle.createdAt,
      startedAt: battle.startedAt,
      metadata: battle.metadata,
      leaderboard: battle.leaderboard
    };
  }

  /**
   * Obtenir les battles actives
   */
  getActiveBattles(filters = {}) {
    const battles = Array.from(this.activeBattles.values());

    return battles
      .filter(battle => {
        if (filters.status && battle.status !== filters.status) return false;
        if (filters.subject && battle.subject !== filters.subject) return false;
        if (filters.educationLevel && battle.educationLevel !== filters.educationLevel) return false;
        if (filters.region && battle.region !== filters.region) return false;
        return true;
      })
      .map(battle => this.formatBattleForClient(battle));
  }

  /**
   * Obtenir les statistiques générales
   */
  getStats() {
    return {
      activeBattles: this.activeBattles.size,
      totalParticipants: Array.from(this.activeBattles.values())
        .reduce((sum, battle) => sum + battle.participants.size, 0),
      battleHistory: this.battleHistory.size,
      questionsBank: Object.keys(this.questionBank).reduce((sum, level) => {
        return sum + Object.keys(this.questionBank[level]).reduce((levelSum, subject) => {
          return levelSum + this.questionBank[level][subject].length;
        }, 0);
      }, 0)
    };
  }

  /**
   * Nettoyer les battles inactives
   */
  cleanupInactiveBattles() {
    const now = new Date();
    const timeout = 30 * 60 * 1000; // 30 minutes

    for (const [battleId, battle] of this.activeBattles) {
      const lastActivity = Math.max(
        ...Array.from(battle.participants.values()).map(p => p.lastActivity.getTime())
      );

      if (now.getTime() - lastActivity > timeout) {
        this.activeBattles.delete(battleId);
        logger.info(`Battle inactive supprimée: ${battleId}`);
      }
    }
  }
}

// Créer l'instance du service
const battleRoyaleService = new BattleRoyaleService();

// Nettoyer les battles inactives toutes les 10 minutes
setInterval(() => {
  battleRoyaleService.cleanupInactiveBattles();
}, 10 * 60 * 1000);

module.exports = battleRoyaleService;