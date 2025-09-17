/**
 * Routes pour Mentor IA - Claudyne Backend
 * Chat avec l'IA pédagogique Claudyne
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

router.use(async (req, res, next) => {
  if (!req.models) {
    const database = require('../config/database');
    req.models = database.initializeModels();
  }
  next();
});

// Récupérer l'historique du chat
router.get('/chat/:sessionId?', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const { ChatMessage, Student } = req.models;
    const { sessionId } = req.params;
    const { limit = 50, studentId } = req.query;

    let targetStudentId;

    // Si l'utilisateur est un étudiant, utiliser son profil
    if (req.user.studentProfile) {
      targetStudentId = req.user.studentProfile.id;
    }
    // Si l'utilisateur est un parent, il peut spécifier l'ID de l'enfant
    else if (req.user.userType === 'MANAGER' && studentId) {
      // Vérifier que l'étudiant appartient à la même famille
      const student = await Student.findOne({
        where: {
          id: studentId,
          familyId: req.user.familyId
        }
      });

      if (!student) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé à cet étudiant'
        });
      }

      targetStudentId = studentId;
    }
    else {
      return res.status(400).json({
        success: false,
        message: 'ID étudiant requis pour les parents'
      });
    }

    const where = { studentId: targetStudentId };
    if (sessionId) {
      where.sessionId = sessionId;
    }

    const messages = await ChatMessage.findAll({
      where,
      order: [['createdAt', 'ASC']],
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: {
        messages: messages.map(m => m.toJSON()),
        sessionId: sessionId || (messages[0]?.sessionId)
      }
    });

  } catch (error) {
    logger.error('Erreur récupération chat:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du chat'
    });
  }
});

// Envoyer un message au mentor IA
router.post('/chat', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const { ChatMessage, Student } = req.models;
    const { message, sessionId, studentId } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message requis'
      });
    }

    let targetStudentId;

    // Si l'utilisateur est un étudiant, utiliser son profil
    if (req.user.studentProfile) {
      targetStudentId = req.user.studentProfile.id;
    }
    // Si l'utilisateur est un parent, il peut spécifier l'ID de l'enfant
    else if (req.user.userType === 'MANAGER' && studentId) {
      // Vérifier que l'étudiant appartient à la même famille
      const student = await Student.findOne({
        where: {
          id: studentId,
          familyId: req.user.familyId
        }
      });

      if (!student) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé à cet étudiant'
        });
      }

      targetStudentId = studentId;
    }
    else {
      return res.status(400).json({
        success: false,
        message: 'ID étudiant requis pour les parents'
      });
    }

    // Enregistrer le message de l'utilisateur
    const userMessage = await ChatMessage.create({
      studentId: targetStudentId,
      sessionId: sessionId,
      role: 'user',
      content: message,
      messageType: 'text',
      metadata: {
        sentBy: req.user.userType, // Indiquer si envoyé par l'étudiant ou le parent
        sentByUserId: req.user.id
      }
    });

    // Simuler une réponse de l'IA (ici on intégrerait avec OpenAI)
    const aiResponses = [
      "C'est une excellente question ! Laisse-moi t'expliquer...",
      "Je vois que tu travailles dur ! Continue comme ça 💪",
      "Hmm, cette notion peut être difficile. Essayons une autre approche...",
      "Bravo ! Tu progresses très bien dans cette matière 🎉",
      "As-tu pensé à revoir la leçon précédente avant de continuer ?"
    ];

    const aiResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];

    const assistantMessage = await ChatMessage.create({
      studentId: targetStudentId,
      sessionId: userMessage.sessionId,
      role: 'assistant',
      content: aiResponse,
      messageType: 'text',
      metadata: {
        aiModel: 'claudyne-mentor-v1',
        confidence: 0.85,
        sentiment: 'positive'
      }
    });

    res.json({
      success: true,
      data: {
        userMessage: userMessage.toJSON(),
        assistantMessage: assistantMessage.toJSON(),
        sessionId: userMessage.sessionId
      }
    });

  } catch (error) {
    logger.error('Erreur envoi message mentor:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi du message'
    });
  }
});

module.exports = router;