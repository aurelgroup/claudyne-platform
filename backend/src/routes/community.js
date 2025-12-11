/**
 * Routes Communauté - Claudyne Backend
 * Groupes d'étude, leaderboard, forum discussions
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { Op } = require('sequelize');

router.use(async (req, res, next) => {
  if (!req.models) {
    const database = require('../config/database');
    req.models = database.initializeModels();
  }
  next();
});

// NO MORE MOCK DATA - using real database now

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

    const { StudyGroup, StudyGroupMember, Subject } = req.models;
    const { status } = req.query; // 'active', 'all'

    // Build where clause
    const where = {};
    if (status === 'active') {
      where.isActive = true;
    }

    // Fetch groups from database
    const groups = await StudyGroup.findAll({
      where,
      include: [
        {
          model: StudyGroupMember,
          as: 'members',
          attributes: ['id', 'studentId', 'isActive', 'lastActiveAt']
        }
      ],
      order: [['currentMembersCount', 'DESC']]
    });

    // Format groups for response
    const formattedGroups = groups.map(group => {
      const activeMembers = group.members ? group.members.filter(m => m.isActive).length : 0;

      return {
        id: group.id,
        name: group.name,
        subject: group.subjectId || 'Général',
        avatar: getSubjectEmoji(group.subjectId),
        memberCount: group.currentMembersCount,
        activeMembers: activeMembers,
        currentTopic: group.metadata?.currentTopic || 'Discussion générale',
        description: group.description,
        isActive: group.isActive,
        level: group.level,
        region: group.region,
        city: group.city
      };
    });

    res.json({
      success: true,
      data: {
        groups: formattedGroups,
        total: formattedGroups.length
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

// Helper function to get emoji for subject
function getSubjectEmoji(subjectId) {
  const emojiMap = {
    'mathematiques': '📐',
    'maths': '📐',
    'chimie': '⚗️',
    'physique': '⚛️',
    'francais': '📚',
    'anglais': '🇬🇧',
    'histoire': '🏛️',
    'geographie': '🌍',
    'svt': '🧬',
    'philosophie': '🤔'
  };
  return emojiMap[subjectId?.toLowerCase()] || '📚';
}

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
      attributes: ['id', 'firstName', 'lastName', 'currentLevel', 'experiencePoints'],
      limit: parseInt(limit) + 10 // Get extra to account for current user
    });

    // Calculate XP earned in period for each student
    const leaderboardData = await Promise.all(
      students.map(async (student) => {
        const progressInPeriod = await Progress.findAll({
          where: {
            studentId: student.id,
            createdAt: {
              [Op.gte]: startDate
            }
          },
          attributes: ['score', 'claudinePointsEarned']
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

    const { ForumDiscussion, ForumCategory, User } = req.models;
    const { limit = 10, category } = req.query;

    // Build where clause
    const where = {};
    if (category) {
      // Find category by name
      const cat = await ForumCategory.findOne({ where: { name: category } });
      if (cat) {
        where.categoryId = cat.id;
      }
    }

    // Fetch discussions from database
    const discussions = await ForumDiscussion.findAll({
      where,
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'firstName', 'lastName']
        },
        {
          model: ForumCategory,
          as: 'category',
          attributes: ['name', 'icon', 'color']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    });

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

    // Format discussions for response
    const formattedDiscussions = discussions.map(d => {
      const author = d.author;
      const displayName = author ? `${author.firstName?.charAt(0)}_${author.lastName?.slice(0, 3)}` : 'Anonyme';

      // Determine status
      let status = '';
      let statusLabel = '';
      const hoursSinceCreation = (new Date() - new Date(d.createdAt)) / (1000 * 60 * 60);

      if (hoursSinceCreation < 1) {
        status = 'new';
        statusLabel = 'Nouveau';
      } else if (d.viewsCount > 200 || d.repliesCount > 10) {
        status = 'hot';
        statusLabel = '🔥 Popular';
      }

      return {
        id: d.id,
        title: d.title,
        author: displayName,
        avatar: getDiscussionEmoji(d.category?.name),
        category: d.category?.name || 'Général',
        replyCount: d.repliesCount,
        viewCount: d.viewsCount,
        createdAt: d.createdAt,
        timeAgo: formatTimeAgo(d.createdAt),
        status,
        statusLabel,
        meta: `par ${displayName} • ${formatTimeAgo(d.createdAt)} • ${d.repliesCount} réponses`,
        isPinned: d.isPinned,
        isLocked: d.isLocked
      };
    });

    res.json({
      success: true,
      data: {
        discussions: formattedDiscussions,
        total: formattedDiscussions.length
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

// Helper function to get emoji for discussion category
function getDiscussionEmoji(categoryName) {
  const emojiMap = {
    'Mathématiques': '📐',
    'Chimie': '⚗️',
    'Physique': '⚛️',
    'Français': '📚',
    'Anglais': '🇬🇧',
    'Méthodologie': '📊',
    'Motivation': '💪',
    'Questions': '🤔'
  };
  return emojiMap[categoryName] || '💡';
}

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

    const { StudyGroup, StudyGroupMember, Student } = req.models;
    const { groupId } = req.body;

    if (!groupId) {
      return res.status(400).json({
        success: false,
        message: 'ID du groupe requis'
      });
    }

    // Find the group
    const group = await StudyGroup.findByPk(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Groupe non trouvé'
      });
    }

    // Check if group is full
    if (group.currentMembersCount >= group.maxMembers) {
      return res.status(400).json({
        success: false,
        message: 'Le groupe est complet'
      });
    }

    // Find student profile
    const student = await Student.findOne({ where: { userId: req.user.id } });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Profil étudiant non trouvé'
      });
    }

    // Check if already a member
    const existingMember = await StudyGroupMember.findOne({
      where: { groupId, studentId: student.id }
    });

    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'Vous êtes déjà membre de ce groupe'
      });
    }

    // Add member to group
    await StudyGroupMember.create({
      groupId,
      studentId: student.id,
      role: 'MEMBER',
      joinedAt: new Date(),
      isActive: true
    });

    logger.info('Student joined study group', {
      userId: req.user.id,
      studentId: student.id,
      groupId,
      groupName: group.name
    });

    res.json({
      success: true,
      data: {
        message: `Vous avez rejoint le groupe "${group.name}"`,
        group: {
          id: group.id,
          name: group.name,
          description: group.description
        }
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
// Route pour obtenir les catégories de forums
router.get('/forums/categories', async (req, res) => {
  try {
    const { ForumCategory, ForumDiscussion } = req.models;
    const { sequelize } = require('../config/database');

    // Récupérer toutes les catégories avec le nombre de discussions
    const categories = await ForumCategory.findAll({
      include: [{
        model: ForumDiscussion,
        as: 'discussions',
        attributes: []
      }],
      attributes: {
        include: [
          [sequelize.fn('COUNT', sequelize.col('discussions.id')), 'discussionCount']
        ]
      },
      group: ['ForumCategory.id'],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        categories: categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          icon: cat.icon,
          color: cat.color,
          order: cat.order,
          isActive: cat.isActive,
          discussionCount: parseInt(cat.dataValues.discussionCount) || 0
        }))
      }
    });

  } catch (error) {
    console.error('Erreur récupération catégories forums:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des catégories de forums'
    });
  }
});

module.exports = router;
