/**
 * Gestionnaire WebSocket Claudyne - Temps Réel Avancé
 * Battle Royale, notifications temps réel, chat mentor IA, analytics live
 */

const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');

// Initialisation des modèles
let User, Family, Student, Battle, ChatMessage, Notification, Progress;

// Stockage des connexions actives
const activeConnections = new Map();
const battleRooms = new Map();
const mentorSessions = new Map();
const analyticsSubscribers = new Map();

function initializeModels() {
  if (!User) {
    const models = require('../config/database').initializeModels();
    User = models.User;
    Family = models.Family;
    Student = models.Student;
    Battle = models.Battle;
    ChatMessage = models.ChatMessage;
    Notification = models.Notification;
    Progress = models.Progress;
  }
}

/**
 * Configuration et gestionnaire principal Socket.IO
 */
function configureSocket(io) {
  initializeModels();

  // Configuration Socket.IO optimisée pour Cameroun
  io.engine.generateId = () => {
    return `claudyne_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Middleware d'authentification Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token ||
                   socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Token d\'authentification requis'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id, {
        include: [
          { model: Family, as: 'family' },
          { model: Student, as: 'students' }
        ]
      });

      if (!user) {
        return next(new Error('Utilisateur non trouvé'));
      }

      socket.user = user;
      socket.userId = user.id;
      socket.familyId = user.familyId;
      socket.role = user.role;

      logger.info(`Socket authenticated: ${user.email} (${user.role})`);
      next();

    } catch (error) {
      logger.error('Socket authentication failed:', error);
      next(new Error('Token invalide'));
    }
  });

  // ================================
  // GESTION DES CONNEXIONS
  // ================================

  io.on('connection', (socket) => {
    const { user, userId, familyId, role } = socket;

    logger.info(`User connected: ${user.email} - Socket: ${socket.id}`);

    // Enregistrer la connexion
    activeConnections.set(userId, {
      socketId: socket.id,
      user: user,
      connectedAt: new Date(),
      lastActivity: new Date()
    });

    // Rejoindre les rooms appropriées
    socket.join(`user_${userId}`);
    socket.join(`family_${familyId}`);
    socket.join(`role_${role}`);

    // Envoyer les statistiques de connexion
    socket.emit('connection_established', {
      socketId: socket.id,
      connectedUsers: activeConnections.size,
      activeBattles: battleRooms.size,
      timestamp: new Date()
    });

    // ================================
    // BATTLE ROYALE ÉDUCATIF
    // ================================

    // Rejoindre une battle
    socket.on('battle:join', async (data) => {
      try {
        const { battleId, studentId } = data;

        // Vérifier que l'étudiant appartient à la famille
        const student = await Student.findOne({
          where: { id: studentId, familyId: familyId }
        });

        if (!student) {
          return socket.emit('battle:error', { message: 'Étudiant non autorisé' });
        }

        // Rejoindre la battle room
        socket.join(`battle_${battleId}`);
        socket.currentBattle = battleId;
        socket.currentStudent = studentId;

        // Mettre à jour le cache des battles
        if (!battleRooms.has(battleId)) {
          battleRooms.set(battleId, {
            participants: new Map(),
            startedAt: new Date(),
            questions: [],
            currentQuestion: 0
          });
        }

        const battleRoom = battleRooms.get(battleId);
        battleRoom.participants.set(studentId, {
          socketId: socket.id,
          student: student,
          score: 0,
          answers: [],
          joinedAt: new Date()
        });

        // Notifier les autres participants
        socket.to(`battle_${battleId}`).emit('battle:participant_joined', {
          student: {
            id: student.id,
            firstName: student.firstName,
            lastName: student.lastName,
            educationLevel: student.educationLevel,
            currentAverage: student.currentAverage
          },
          participantCount: battleRoom.participants.size
        });

        // Envoyer l'état de la battle au nouveau participant
        socket.emit('battle:joined', {
          battleId: battleId,
          participants: Array.from(battleRoom.participants.values()).map(p => ({
            id: p.student.id,
            firstName: p.student.firstName,
            lastName: p.student.lastName,
            score: p.score
          })),
          currentQuestion: battleRoom.currentQuestion,
          questionsTotal: battleRoom.questions.length
        });

        logger.info(`Student ${studentId} joined battle ${battleId}`);

      } catch (error) {
        logger.error('Battle join error:', error);
        socket.emit('battle:error', { message: 'Erreur lors de la connexion à la battle' });
      }
    });

    // Répondre à une question
    socket.on('battle:answer', async (data) => {
      try {
        const { battleId, questionId, answer, timeSpent } = data;

        if (!socket.currentBattle || socket.currentBattle !== battleId) {
          return socket.emit('battle:error', { message: 'Vous n\'êtes pas dans cette battle' });
        }

        const battleRoom = battleRooms.get(battleId);
        const participant = battleRoom.participants.get(socket.currentStudent);

        if (!participant) {
          return socket.emit('battle:error', { message: 'Participant non trouvé' });
        }

        // Calculer le score (correct + bonus rapidité)
        let questionScore = 0;
        if (answer.correct) {
          questionScore = 100;
          // Bonus de rapidité (max 50 points)
          const rapidityBonus = Math.max(0, 50 - Math.floor(timeSpent / 1000));
          questionScore += rapidityBonus;
        }

        participant.score += questionScore;
        participant.answers.push({
          questionId,
          answer,
          timeSpent,
          score: questionScore,
          timestamp: new Date()
        });

        // Diffuser le score mis à jour
        io.to(`battle_${battleId}`).emit('battle:score_update', {
          studentId: socket.currentStudent,
          score: participant.score,
          lastAnswer: {
            correct: answer.correct,
            score: questionScore
          }
        });

        logger.info(`Battle ${battleId}: Student ${socket.currentStudent} scored ${questionScore}`);

      } catch (error) {
        logger.error('Battle answer error:', error);
        socket.emit('battle:error', { message: 'Erreur lors de la soumission de la réponse' });
      }
    });

    // Quitter une battle
    socket.on('battle:leave', () => {
      if (socket.currentBattle) {
        leaveBattle(socket);
      }
    });

    // ================================
    // MENTOR IA TEMPS RÉEL
    // ================================

    // Démarrer une session mentor
    socket.on('mentor:start_session', async (data) => {
      try {
        const { studentId, subject } = data;

        // Vérifier l'autorisation
        const student = await Student.findOne({
          where: { id: studentId, familyId: familyId }
        });

        if (!student) {
          return socket.emit('mentor:error', { message: 'Étudiant non autorisé' });
        }

        const sessionId = `mentor_${studentId}_${Date.now()}`;
        socket.join(`mentor_${sessionId}`);
        socket.currentMentorSession = sessionId;

        // Créer la session
        mentorSessions.set(sessionId, {
          studentId: studentId,
          subject: subject,
          messages: [],
          startedAt: new Date(),
          socketId: socket.id
        });

        socket.emit('mentor:session_started', {
          sessionId: sessionId,
          greeting: `Bonjour ${student.firstName} ! Je suis votre mentor IA Claudyne. Comment puis-je vous aider avec ${subject} aujourd'hui ?`
        });

        logger.info(`Mentor session started: ${sessionId} for student ${studentId}`);

      } catch (error) {
        logger.error('Mentor session start error:', error);
        socket.emit('mentor:error', { message: 'Erreur lors du démarrage de la session mentor' });
      }
    });

    // Message au mentor IA
    socket.on('mentor:message', async (data) => {
      try {
        const { sessionId, message } = data;

        if (!socket.currentMentorSession || socket.currentMentorSession !== sessionId) {
          return socket.emit('mentor:error', { message: 'Session mentor invalide' });
        }

        const session = mentorSessions.get(sessionId);
        if (!session) {
          return socket.emit('mentor:error', { message: 'Session non trouvée' });
        }

        // Ajouter le message à l'historique
        session.messages.push({
          role: 'user',
          content: message,
          timestamp: new Date()
        });

        // Simuler une réponse IA (à remplacer par vraie intégration OpenAI)
        const aiResponse = await generateMentorResponse(message, session);

        session.messages.push({
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date()
        });

        socket.emit('mentor:response', {
          sessionId: sessionId,
          message: aiResponse,
          timestamp: new Date()
        });

        // Sauvegarder dans la base de données
        await ChatMessage.create({
          studentId: session.studentId,
          sessionId: sessionId,
          userMessage: message,
          aiResponse: aiResponse,
          subject: session.subject
        });

        logger.info(`Mentor response sent for session ${sessionId}`);

      } catch (error) {
        logger.error('Mentor message error:', error);
        socket.emit('mentor:error', { message: 'Erreur lors du traitement du message' });
      }
    });

    // ================================
    // NOTIFICATIONS TEMPS RÉEL
    // ================================

    // Marquer une notification comme lue
    socket.on('notification:mark_read', async (data) => {
      try {
        const { notificationId } = data;

        await Notification.update(
          { isRead: true, readAt: new Date() },
          { where: { id: notificationId, userId: userId } }
        );

        socket.emit('notification:marked_read', { notificationId });

        logger.info(`Notification ${notificationId} marked as read by user ${userId}`);

      } catch (error) {
        logger.error('Notification mark read error:', error);
      }
    });

    // ================================
    // ANALYTICS TEMPS RÉEL
    // ================================

    // S'abonner aux analytics temps réel (admin seulement)
    socket.on('analytics:subscribe', () => {
      if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
        analyticsSubscribers.set(userId, socket.id);
        socket.join('analytics_live');

        socket.emit('analytics:subscribed', {
          realTimeUsers: activeConnections.size,
          activeBattles: battleRooms.size,
          mentorSessions: mentorSessions.size
        });

        logger.info(`Admin ${userId} subscribed to live analytics`);
      } else {
        socket.emit('analytics:error', { message: 'Accès non autorisé' });
      }
    });

    // ================================
    // PROGRESS TEMPS RÉEL
    // ================================

    // Mettre à jour le progrès en temps réel
    socket.on('progress:update', async (data) => {
      try {
        const { studentId, lessonId, progress, score } = data;

        // Vérifier l'autorisation
        const student = await Student.findOne({
          where: { id: studentId, familyId: familyId }
        });

        if (!student) {
          return socket.emit('progress:error', { message: 'Étudiant non autorisé' });
        }

        // Mettre à jour le progrès
        const [progressRecord] = await Progress.findOrCreate({
          where: { studentId: studentId, lessonId: lessonId },
          defaults: {
            status: 'IN_PROGRESS',
            progress: progress,
            score: score,
            startedAt: new Date(),
            lastActivityAt: new Date()
          }
        });

        await progressRecord.update({
          progress: progress,
          score: score,
          lastActivityAt: new Date(),
          status: progress >= 100 ? 'COMPLETED' : 'IN_PROGRESS',
          completedAt: progress >= 100 ? new Date() : null
        });

        // Notifier la famille en temps réel
        io.to(`family_${familyId}`).emit('progress:updated', {
          studentId: studentId,
          lessonId: lessonId,
          progress: progress,
          score: score,
          status: progressRecord.status
        });

        // Notifier les parents si milestone atteint
        if (progress >= 100) {
          io.to(`family_${familyId}`).emit('progress:lesson_completed', {
            student: {
              id: student.id,
              firstName: student.firstName,
              lastName: student.lastName
            },
            lessonId: lessonId,
            finalScore: score,
            completedAt: new Date()
          });
        }

        logger.info(`Progress updated: Student ${studentId}, Lesson ${lessonId}, Progress ${progress}%`);

      } catch (error) {
        logger.error('Progress update error:', error);
        socket.emit('progress:error', { message: 'Erreur lors de la mise à jour du progrès' });
      }
    });

    // ================================
    // GESTION DE LA DÉCONNEXION
    // ================================

    socket.on('disconnect', (reason) => {
      logger.info(`User disconnected: ${user.email} - Reason: ${reason}`);

      // Nettoyer les connexions
      activeConnections.delete(userId);
      analyticsSubscribers.delete(userId);

      // Quitter les battles actives
      if (socket.currentBattle) {
        leaveBattle(socket);
      }

      // Fermer les sessions mentor
      if (socket.currentMentorSession) {
        mentorSessions.delete(socket.currentMentorSession);
      }

      // Notifier les autres utilisateurs
      socket.broadcast.emit('user:disconnected', {
        userId: userId,
        connectedUsers: activeConnections.size
      });
    });

    // Heartbeat pour maintenir la connexion sur réseaux instables
    socket.on('heartbeat', () => {
      if (activeConnections.has(userId)) {
        activeConnections.get(userId).lastActivity = new Date();
      }
      socket.emit('heartbeat_ack', { timestamp: new Date() });
    });
  });

  // ================================
  // FONCTIONS UTILITAIRES
  // ================================

  function leaveBattle(socket) {
    const battleId = socket.currentBattle;
    const studentId = socket.currentStudent;

    if (battleRooms.has(battleId)) {
      const battleRoom = battleRooms.get(battleId);
      battleRoom.participants.delete(studentId);

      // Notifier les autres participants
      socket.to(`battle_${battleId}`).emit('battle:participant_left', {
        studentId: studentId,
        participantCount: battleRoom.participants.size
      });

      // Supprimer la battle si plus de participants
      if (battleRoom.participants.size === 0) {
        battleRooms.delete(battleId);
        logger.info(`Battle ${battleId} ended - no participants left`);
      }
    }

    socket.leave(`battle_${battleId}`);
    socket.currentBattle = null;
    socket.currentStudent = null;
  }

  // Simuler une réponse IA (à remplacer par OpenAI)
  async function generateMentorResponse(message, session) {
    // Réponses préprogrammées selon le contexte
    const responses = {
      greeting: [
        "Bonjour ! Je suis ravi de pouvoir vous aider dans votre apprentissage.",
        "Salut ! Comment puis-je vous accompagner aujourd'hui ?",
        "Hello ! Qu'est-ce que vous aimeriez apprendre ensemble ?"
      ],
      math: [
        "Les mathématiques sont fascinantes ! Quel concept souhaitez-vous explorer ?",
        "Excellente question en mathématiques ! Décomposons cela ensemble.",
        "Les maths peuvent sembler complexes, mais chaque problème a sa solution !"
      ],
      science: [
        "La science nous entoure partout ! Quelle découverte vous intrigue ?",
        "Formidable question scientifique ! Explorons ce phénomène ensemble.",
        "La curiosité scientifique est le premier pas vers la découverte !"
      ],
      default: [
        "Intéressant ! Pouvez-vous me donner plus de détails ?",
        "Je vois ce que vous voulez dire. Continuons à explorer cette idée.",
        "Très bonne observation ! Qu'est-ce qui vous fait penser cela ?"
      ]
    };

    const lowerMessage = message.toLowerCase();
    let category = 'default';

    if (lowerMessage.includes('bonjour') || lowerMessage.includes('salut') || lowerMessage.includes('hello')) {
      category = 'greeting';
    } else if (lowerMessage.includes('math') || lowerMessage.includes('calcul') || lowerMessage.includes('nombre')) {
      category = 'math';
    } else if (lowerMessage.includes('science') || lowerMessage.includes('physique') || lowerMessage.includes('chimie')) {
      category = 'science';
    }

    const categoryResponses = responses[category];
    const response = categoryResponses[Math.floor(Math.random() * categoryResponses.length)];

    return response;
  }

  // ================================
  // TÂCHES PÉRIODIQUES
  // ================================

  // Diffuser les analytics en temps réel
  setInterval(() => {
    if (analyticsSubscribers.size > 0) {
      const analytics = {
        timestamp: new Date(),
        connectedUsers: activeConnections.size,
        activeBattles: battleRooms.size,
        mentorSessions: mentorSessions.size,
        totalEvents: io.engine.clientsCount
      };

      io.to('analytics_live').emit('analytics:update', analytics);
    }
  }, 5000); // Toutes les 5 secondes

  // Nettoyer les sessions inactives
  setInterval(() => {
    const now = new Date();
    const timeout = 30 * 60 * 1000; // 30 minutes

    // Nettoyer les connexions inactives
    for (const [userId, connection] of activeConnections) {
      if (now - connection.lastActivity > timeout) {
        activeConnections.delete(userId);
        logger.info(`Cleaned inactive connection for user ${userId}`);
      }
    }

    // Nettoyer les sessions mentor inactives
    for (const [sessionId, session] of mentorSessions) {
      if (now - session.startedAt > timeout) {
        mentorSessions.delete(sessionId);
        logger.info(`Cleaned inactive mentor session ${sessionId}`);
      }
    }
  }, 10 * 60 * 1000); // Toutes les 10 minutes

  logger.info('🚀 WebSocket Claudyne configuré avec succès');
  logger.info(`📊 Fonctionnalités temps réel activées:`);
  logger.info(`   • Battle Royale éducatif`);
  logger.info(`   • Mentor IA temps réel`);
  logger.info(`   • Notifications push`);
  logger.info(`   • Analytics live`);
  logger.info(`   • Progress tracking`);
}

// ================================
// FONCTIONS PUBLIQUES
// ================================

/**
 * Envoyer une notification à un utilisateur
 */
async function sendNotificationToUser(userId, notification) {
  const io = require('../server').io;
  if (io) {
    io.to(`user_${userId}`).emit('notification:new', notification);
    logger.info(`Notification sent to user ${userId}`);
  }
}

/**
 * Envoyer une notification à toute une famille
 */
async function sendNotificationToFamily(familyId, notification) {
  const io = require('../server').io;
  if (io) {
    io.to(`family_${familyId}`).emit('notification:new', notification);
    logger.info(`Notification sent to family ${familyId}`);
  }
}

/**
 * Diffuser un événement système global
 */
async function broadcastSystemEvent(event, data) {
  const io = require('../server').io;
  if (io) {
    io.emit('system:event', { event, data, timestamp: new Date() });
    logger.info(`System event broadcasted: ${event}`);
  }
}

module.exports = {
  configureSocket,
  sendNotificationToUser,
  sendNotificationToFamily,
  broadcastSystemEvent
};