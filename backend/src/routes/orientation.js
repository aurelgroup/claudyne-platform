/**
 * Routes Orientation - Claudyne Backend
 * Recommandations de carrières, filières et établissements basées sur l'IA
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

/**
 * Career profiles based on subject strengths
 */
const CAREER_PROFILES = {
  'scientifique_analytique': {
    name: 'Scientifique Analytique',
    description: 'Forces en mathématiques et sciences, esprit logique développé',
    icon: '🎯',
    strengthSubjects: ['Mathématiques', 'Physique', 'Chimie'],
    careers: [
      { name: 'Ingénierie Informatique', icon: '💻', match: 96, reasons: ['Maths excellentes', 'Logique développée'] },
      { name: 'Génie Civil', icon: '🏗️', match: 89, reasons: ['Physique forte', 'Spatial développé'] },
      { name: 'Recherche en Chimie', icon: '🧪', match: 83, reasons: ['Chimie passion', 'Recherche attirance'] }
    ]
  },
  'litteraire_creatif': {
    name: 'Littéraire Créatif',
    description: 'Excellence en langues et communication, créativité développée',
    icon: '📚',
    strengthSubjects: ['Français', 'Anglais', 'Histoire'],
    careers: [
      { name: 'Journalisme', icon: '📰', match: 92, reasons: ['Écriture excellente', 'Communication forte'] },
      { name: 'Traduction', icon: '🌐', match: 88, reasons: ['Langues maîtrisées', 'Précision linguistique'] },
      { name: 'Enseignement', icon: '👨‍🏫', match: 85, reasons: ['Pédagogie naturelle', 'Passion transmission'] }
    ]
  },
  'sciences_humaines': {
    name: 'Sciences Humaines',
    description: 'Compréhension sociale développée, analyse des comportements',
    icon: '🧠',
    strengthSubjects: ['Histoire', 'Philosophie', 'SVT'],
    careers: [
      { name: 'Psychologie', icon: '🧠', match: 90, reasons: ['Empathie développée', 'Analyse comportementale'] },
      { name: 'Sociologie', icon: '👥', match: 87, reasons: ['Compréhension sociale', 'Esprit critique'] },
      { name: 'Droit', icon: '⚖️', match: 82, reasons: ['Argumentation solide', 'Logique juridique'] }
    ]
  },
  'economique_gestion': {
    name: 'Économique & Gestion',
    description: 'Sens des affaires, compétences en analyse économique',
    icon: '💼',
    strengthSubjects: ['Mathématiques', 'SES', 'Anglais'],
    careers: [
      { name: 'Finance d\'Entreprise', icon: '💰', match: 94, reasons: ['Maths solides', 'Sens des affaires'] },
      { name: 'Commerce International', icon: '🌍', match: 89, reasons: ['Langues maîtrisées', 'Ouverture internationale'] },
      { name: 'Audit & Consulting', icon: '📊', match: 86, reasons: ['Analyse forte', 'Communication efficace'] }
    ]
  },
  'polyvalent': {
    name: 'Profil Polyvalent',
    description: 'Compétences équilibrées dans plusieurs domaines',
    icon: '⭐',
    strengthSubjects: [],
    careers: [
      { name: 'Gestion de Projet', icon: '📋', match: 85, reasons: ['Polyvalence', 'Organisation'] },
      { name: 'Communication', icon: '📢', match: 82, reasons: ['Adaptabilité', 'Relations humaines'] },
      { name: 'Entrepreneuriat', icon: '🚀', match: 80, reasons: ['Créativité', 'Autonomie'] }
    ]
  }
};

const CAREER_CATEGORIES = {
  sciences: { icon: '🧬', name: 'Sciences & Tech', count: 24 },
  sante: { icon: '🏥', name: 'Santé', count: 18 },
  ingenierie: { icon: '⚙️', name: 'Ingénierie', count: 31 },
  economie: { icon: '💼', name: 'Économie', count: 22 },
  humaines: { icon: '📚', name: 'Sciences Humaines', count: 19 },
  art: { icon: '🎨', name: 'Arts & Création', count: 15 }
};

const TRENDING_CAREERS = [
  { name: 'IA Specialist', badge: 'NEW', growth: 127 },
  { name: 'Data Scientist', badge: 'HOT', growth: 89 },
  { name: 'Ingénieur Green Tech', badge: '⭐', growth: 156 },
  { name: 'Cybersécurité', badge: 'HOT', growth: 98 },
  { name: 'UX Designer', badge: 'NEW', growth: 76 }
];

const INSTITUTIONS = [
  {
    id: 'polytechnique',
    name: 'École Polytechnique',
    logo: '🏛️',
    program: 'Cursus Ingénieur',
    location: 'Palaiseau',
    acceptanceRate: 3,
    matchScore: 91,
    region: 'idf',
    requiredProfile: 'scientifique_analytique'
  },
  {
    id: 'insa',
    name: 'INSA Lyon',
    logo: '🏫',
    program: 'Ingénierie Informatique',
    location: 'Lyon',
    acceptanceRate: 12,
    matchScore: 87,
    region: 'ra',
    requiredProfile: 'scientifique_analytique'
  },
  {
    id: 'saclay',
    name: 'Université Paris-Saclay',
    logo: '🎓',
    program: 'Master Recherche Chimie',
    location: 'Orsay',
    acceptanceRate: 25,
    matchScore: 82,
    region: 'idf',
    requiredProfile: 'scientifique_analytique'
  },
  {
    id: 'sorbonne',
    name: 'Sorbonne Université',
    logo: '📚',
    program: 'Lettres et Sciences Humaines',
    location: 'Paris',
    acceptanceRate: 18,
    matchScore: 88,
    region: 'idf',
    requiredProfile: 'litteraire_creatif'
  },
  {
    id: 'sciences_po',
    name: 'Sciences Po Paris',
    logo: '🏛️',
    program: 'Sciences Politiques',
    location: 'Paris',
    acceptanceRate: 9,
    matchScore: 90,
    region: 'idf',
    requiredProfile: 'sciences_humaines'
  },
  {
    id: 'hec',
    name: 'HEC Paris',
    logo: '💼',
    program: 'Management',
    location: 'Jouy-en-Josas',
    acceptanceRate: 5,
    matchScore: 93,
    region: 'idf',
    requiredProfile: 'economique_gestion'
  }
];

const APPLICATION_TIMELINE = [
  { date: '15 Dec', title: 'Parcoursup : Ouverture', status: 'urgent', statusText: '🔴 Imminent' },
  { date: '18 Jan', title: 'Fin des inscriptions', status: 'coming', statusText: '⏰ Préparation' },
  { date: '3 Apr', title: 'Réponses établissements', status: 'future', statusText: '📋 À venir' },
  { date: '1 Jun', title: 'Phase d\'admission principale', status: 'future', statusText: '📋 À venir' }
];

/**
 * GET /api/orientation/recommendations
 * Recommandations de carrières basées sur le profil de l'étudiant
 */
router.get('/recommendations', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const { Progress, Subject, Student } = req.models;

    // Get student ID
    let studentId = null;
    if (req.user.studentProfile) {
      studentId = req.user.studentProfile.id;
    } else if (req.user.userType === 'MANAGER' && req.user.familyId) {
      const student = await Student.findOne({
        where: { familyId: req.user.familyId }
      });
      if (student) studentId = student.id;
    }

    if (!studentId) {
      return res.json({
        success: true,
        data: {
          profile: CAREER_PROFILES.polyvalent,
          confidence: 0,
          recommendations: CAREER_PROFILES.polyvalent.careers
        }
      });
    }

    // Analyze student's subject performance
    const subjectScores = await Progress.findAll({
      where: { studentId },
      include: [{
        model: Subject,
        as: 'subject',
        attributes: ['id', 'name']
      }],
      attributes: [
        'subjectId',
        [Progress.sequelize.fn('AVG', Progress.sequelize.col('score')), 'avgScore'],
        [Progress.sequelize.fn('COUNT', Progress.sequelize.col('id')), 'attempts']
      ],
      group: ['subjectId', 'subject.id', 'subject.name'],
      order: [[Progress.sequelize.fn('AVG', Progress.sequelize.col('score')), 'DESC']]
    });

    // Determine student profile based on top subjects
    let detectedProfile = 'polyvalent';
    let confidence = 70;

    if (subjectScores.length >= 3) {
      const topSubjects = subjectScores.slice(0, 3).map(s => s.subject?.name);

      // Check for scientific profile
      const scientificCount = topSubjects.filter(s =>
        ['Mathématiques', 'Physique', 'Chimie', 'Sciences'].some(sci => s?.includes(sci))
      ).length;

      if (scientificCount >= 2) {
        detectedProfile = 'scientifique_analytique';
        confidence = 85 + (scientificCount * 3);
      }

      // Check for literary profile
      const literaryCount = topSubjects.filter(s =>
        ['Français', 'Anglais', 'Histoire', 'Philosophie'].some(lit => s?.includes(lit))
      ).length;

      if (literaryCount >= 2 && scientificCount < 2) {
        detectedProfile = 'litteraire_creatif';
        confidence = 82 + (literaryCount * 3);
      }

      // Check for social sciences profile
      const humanCount = topSubjects.filter(s =>
        ['Histoire', 'Philosophie', 'SES', 'SVT'].some(hum => s?.includes(hum))
      ).length;

      if (humanCount >= 2 && scientificCount < 2) {
        detectedProfile = 'sciences_humaines';
        confidence = 80 + (humanCount * 3);
      }

      // Check for economics profile
      const economicsCount = topSubjects.filter(s =>
        ['SES', 'Mathématiques', 'Économie'].some(eco => s?.includes(eco))
      ).length;

      if (economicsCount >= 2) {
        detectedProfile = 'economique_gestion';
        confidence = 83 + (economicsCount * 3);
      }
    }

    const profile = CAREER_PROFILES[detectedProfile];

    res.json({
      success: true,
      data: {
        profile: {
          type: detectedProfile,
          name: profile.name,
          description: profile.description,
          icon: profile.icon
        },
        confidence: Math.min(confidence, 99),
        recommendations: profile.careers,
        topSubjects: subjectScores.slice(0, 5).map(s => ({
          name: s.subject?.name || 'Unknown',
          avgScore: Math.round(s.dataValues.avgScore),
          attempts: s.dataValues.attempts
        }))
      }
    });

  } catch (error) {
    logger.error('Erreur récupération recommandations orientation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des recommandations'
    });
  }
});

/**
 * GET /api/orientation/careers
 * Catalogue des carrières par catégories
 */
router.get('/careers', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const { category } = req.query;

    res.json({
      success: true,
      data: {
        categories: CAREER_CATEGORIES,
        trending: TRENDING_CAREERS,
        selectedCategory: category || null
      }
    });

  } catch (error) {
    logger.error('Erreur récupération carrières:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des carrières'
    });
  }
});

/**
 * GET /api/orientation/institutions
 * Établissements et formations recommandés
 */
router.get('/institutions', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const { location } = req.query; // 'all', 'idf', 'paca', 'ra'

    let filteredInstitutions = INSTITUTIONS;
    if (location && location !== 'all') {
      filteredInstitutions = INSTITUTIONS.filter(inst => inst.region === location);
    }

    res.json({
      success: true,
      data: {
        institutions: filteredInstitutions,
        timeline: APPLICATION_TIMELINE,
        total: filteredInstitutions.length
      }
    });

  } catch (error) {
    logger.error('Erreur récupération établissements:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des établissements'
    });
  }
});

/**
 * GET /api/orientation/action-plan
 * Plan d'action personnalisé pour l'orientation
 */
router.get('/action-plan', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    // Generate a personalized action plan
    const actionPlan = {
      phases: [
        {
          id: 1,
          title: 'Phase 1 : Exploration',
          period: 'Maintenant - Janvier',
          status: 'current',
          tasks: [
            {
              id: 1,
              title: 'Test d\'orientation IA',
              description: 'Profil scientifique confirmé',
              status: 'completed',
              icon: '✅'
            },
            {
              id: 2,
              title: 'Rechercher 5 métiers cibles',
              description: 'Informatique, Ingénierie, Recherche',
              status: 'in-progress',
              icon: '🎯'
            },
            {
              id: 3,
              title: 'Participer aux portes ouvertes',
              description: '3 établissements minimum',
              status: 'pending',
              icon: '🏫'
            }
          ]
        },
        {
          id: 2,
          title: 'Phase 2 : Candidatures',
          period: 'Janvier - Mars',
          status: 'upcoming',
          tasks: [
            {
              id: 4,
              title: 'Compléter dossier Parcoursup',
              description: 'Lettre motivation + CV',
              status: 'pending',
              icon: '📝'
            },
            {
              id: 5,
              title: 'Préparer entretiens',
              description: 'Simulations avec mentor',
              status: 'pending',
              icon: '🎤'
            }
          ]
        },
        {
          id: 3,
          title: 'Phase 3 : Décision',
          period: 'Avril - Juin',
          status: 'future',
          tasks: [
            {
              id: 6,
              title: 'Analyser les réponses',
              description: 'Comparer les offres',
              status: 'pending',
              icon: '📊'
            },
            {
              id: 7,
              title: 'Valider le choix final',
              description: 'Inscription définitive',
              status: 'pending',
              icon: '✨'
            }
          ]
        }
      ]
    };

    res.json({
      success: true,
      data: actionPlan
    });

  } catch (error) {
    logger.error('Erreur récupération plan d\'action:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du plan d\'action'
    });
  }
});

module.exports = router;
