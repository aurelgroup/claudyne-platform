/**
 * Routes Communauté - Claudyne Backend
 * Groupes d'étude, leaderboard, forum discussions
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

// Mock study groups data
const STUDY_GROUPS = [
  {
    id: 'maths-terminale',
    name: 'Maths Terminale S',
    subject: 'Mathématiques',
    avatar: '📐',
    memberCount: 24,
    activeMembers: 3,
    currentTopic: 'Intégrales',
    description: 'Groupe d\'entraide pour les mathématiques de Terminale S',
    isActive: true
  },
  {
    id: 'chimie-organique',
    name: 'Chimie Organique',
    subject: 'Chimie',
    avatar: '⚗️',
    memberCount: 18,
    activeMembers: 7,
    currentTopic: 'Réactions',
    description: 'Étude approfondie de la chimie organique',
    isActive: true
  },
  {
    id: 'bac-2025',
    name: 'BAC 2025 - Entraide',
    subject: 'Général',
    avatar: '📚',
    memberCount: 156,
    activeMembers: 23,
    currentTopic: 'Discussion générale',
    description: 'Entraide générale pour la préparation du BAC 2025',
    isActive: true
  },
  {
    id: 'physique-quantique',
    name: 'Physique Quantique',
    subject: 'Physique',
    avatar: '⚛️',
    memberCount: 12,
    activeMembers: 2,
    currentTopic: 'Mécanique quantique',
    description: 'Pour les passionnés de physique avancée',
    isActive: false
  }
];

/**
 * GET /api/community/groups
 * Récupérer les groupes d'étude disponibles
 */
router.get('/groups', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const { status } = req.query; // 'active', 'all'

    let groups = STUDY_GROUPS;
    if (status === 'active') {
      groups = STUDY_GROUPS.filter(g => g.isActive);
    }

    res.json({
      success: true,
      data: {
        groups,
        total: groups.length
      }
    });

  } catch (error) {
    logger.error('Erreur récupération groupes d\'étude:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des groupes'
    });
  }
});

/**
 * GET /api/community/leaderboard
 * Classement hebdomadaire des étudiants par XP
 */
router.get('/leaderboard', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const { Student, Progress } = req.models;
    const { period = 'weekly', limit = 20 } = req.query; // 'weekly', 'monthly', 'all-time'

    // Calculate time range
    const now = new Date();
    let startDate = new Date(now);
    if (period === 'weekly') {
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'monthly') {
      startDate.setMonth(now.getMonth() - 1);
    } else {
      startDate = new Date(0); // All time
    }

    // Get all active students
    const students = await Student.findAll({
      where: { status: 'ACTIVE' },
      attributes: ['id', 'firstName', 'lastName', 'currentLevel', 'currentXP'],
      limit: parseInt(limit) + 10 // Get extra to account for current user
    });

    // Calculate XP earned in period for each student
    const leaderboardData = await Promise.all(
      students.map(async (student) => {
        const progressInPeriod = await Progress.findAll({
          where: {
            studentId: student.id,
            createdAt: {
              [Progress.sequelize.Op.gte]: startDate
            }
          },
          attributes: ['score', 'xpEarned']
        });

        const xpEarned = progressInPeriod.reduce((sum, p) => {
          // Calculate XP from score (assuming 1 point = 10 XP)
          return sum + ((p.xpEarned || 0) > 0 ? p.xpEarned : (p.score || 0) * 10);
        }, 0);

        // Generate anonymous display name
        const displayName = `${student.firstName?.charAt(0) || 'A'}_${student.lastName?.slice(0, 3) || 'Etu'}`;

        return {
          studentId: student.id,
          displayName,
          xp: Math.round(xpEarned),
          level: student.currentLevel || 1,
          avatar: ['🥇', '🥈', '🥉', '👤', '⭐'][Math.floor(Math.random() * 5)]
        };
      })
    );

    // Sort by XP and assign ranks
    leaderboardData.sort((a, b) => b.xp - a.xp);
    const rankedLeaderboard = leaderboardData.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));

    // Find current user's rank
    let currentUserRank = null;
    if (req.user.studentProfile) {
      const currentStudent = rankedLeaderboard.find(e => e.studentId === req.user.studentProfile.id);
      if (currentStudent) {
        currentUserRank = {
          ...currentStudent,
          isCurrentUser: true
        };
      }
    }

    // Return top N + current user if not in top N
    let topRanks = rankedLeaderboard.slice(0, parseInt(limit));
    if (currentUserRank && currentUserRank.rank > parseInt(limit)) {
      topRanks.push(currentUserRank);
    }

    res.json({
      success: true,
      data: {
        leaderboard: topRanks,
        currentUser: currentUserRank,
        period,
        totalParticipants: rankedLeaderboard.length
      }
    });

  } catch (error) {
    logger.error('Erreur récupération leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du classement'
    });
  }
});

/**
 * GET /api/community/discussions
 * Discussions récentes du forum
 */
router.get('/discussions', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const { limit = 10, category } = req.query;

    // Mock recent discussions
    const discussions = [
      {
        id: 'disc-1',
        title: 'Aide sur les intégrales par parties',
        author: 'Marie_T',
        avatar: '🤔',
        category: 'Mathématiques',
        replyCount: 3,
        viewCount: 45,
        createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 min ago
        status: 'new',
        statusLabel: 'Nouveau'
      },
      {
        id: 'disc-2',
        title: 'Astuce pour retenir les formules de chimie',
        author: 'Paul_K',
        avatar: '💡',
        category: 'Chimie',
        replyCount: 12,
        viewCount: 234,
        createdAt: new Date(Date.now() - 60 * 60 * 1000), // 1h ago
        status: 'hot',
        statusLabel: '🔥 Popular'
      },
      {
        id: 'disc-3',
        title: 'Retour d\'expérience: organisation révisions',
        author: 'Camille_B',
        avatar: '📊',
        category: 'Méthodologie',
        replyCount: 8,
        viewCount: 156,
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3h ago
        status: '',
        statusLabel: ''
      },
      {
        id: 'disc-4',
        title: 'Question sur la géométrie dans l\'espace',
        author: 'Lucas_G',
        avatar: '📐',
        category: 'Mathématiques',
        replyCount: 6,
        viewCount: 89,
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5h ago
        status: '',
        statusLabel: ''
      },
      {
        id: 'disc-5',
        title: 'Préparation oral français BAC',
        author: 'Emma_L',
        avatar: '📚',
        category: 'Français',
        replyCount: 15,
        viewCount: 312,
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8h ago
        status: 'hot',
        statusLabel: '🔥 Popular'
      }
    ];

    // Filter by category if provided
    let filteredDiscussions = discussions;
    if (category) {
      filteredDiscussions = discussions.filter(d => d.category === category);
    }

    // Limit results
    const limitedDiscussions = filteredDiscussions.slice(0, parseInt(limit));

    // Format time ago
    const formatTimeAgo = (date) => {
      const seconds = Math.floor((new Date() - date) / 1000);
      if (seconds < 60) return `${seconds} sec`;
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes} min`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h`;
      const days = Math.floor(hours / 24);
      return `${days}j`;
    };

    const formattedDiscussions = limitedDiscussions.map(d => ({
      ...d,
      timeAgo: formatTimeAgo(d.createdAt),
      meta: `par ${d.author} • ${formatTimeAgo(d.createdAt)} • ${d.replyCount} réponses`
    }));

    res.json({
      success: true,
      data: {
        discussions: formattedDiscussions,
        total: filteredDiscussions.length
      }
    });

  } catch (error) {
    logger.error('Erreur récupération discussions:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des discussions'
    });
  }
});

/**
 * POST /api/community/groups/join
 * Rejoindre un groupe d'étude
 */
router.post('/groups/join', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const { groupId } = req.body;

    if (!groupId) {
      return res.status(400).json({
        success: false,
        message: 'ID du groupe requis'
      });
    }

    const group = STUDY_GROUPS.find(g => g.id === groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Groupe non trouvé'
      });
    }

    // Log the join (could store in database)
    logger.info('Student joined study group', {
      userId: req.user.id,
      groupId,
      groupName: group.name
    });

    res.json({
      success: true,
      data: {
        message: `Vous avez rejoint le groupe "${group.name}"`,
        group
      }
    });

  } catch (error) {
    logger.error('Erreur rejoindre groupe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'adhésion au groupe'
    });
  }
});

module.exports = router;
