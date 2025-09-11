/**
 * Modèle Prix Claudine
 * Gère les récompenses et classements nationaux
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PrixClaudine = sequelize.define('PrixClaudine', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    
    // Informations de base
    season: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '2025-september',
      comment: 'Saison du Prix Claudine (format: YYYY-month)'
    },
    
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Titre du Prix Claudine obtenu'
    },
    
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Description de la réalisation qui a mérité le prix'
    },
    
    // Type de prix
    awardType: {
      type: DataTypes.ENUM(
        'INDIVIDUAL_EXCELLENCE', // Excellence individuelle
        'FAMILY_ACHIEVEMENT',    // Réalisation familiale
        'COMMUNITY_IMPACT',      // Impact communautaire
        'PERSEVERANCE',          // Prix de la persévérance
        'SOLIDARITY',            // Prix de la solidarité
        'CREATIVITY',            // Prix de la créativité
        'LEADERSHIP',            // Prix du leadership
        'SPECIAL_MENTION'        // Mention spéciale
      ),
      allowNull: false
    },
    
    // Catégorie par niveau
    category: {
      type: DataTypes.ENUM(
        'MATERNELLE',      // 3-6 ans
        'PRIMAIRE',        // 6-12 ans
        'COLLEGE',         // 12-15 ans
        'LYCEE',           // 15-18 ans
        'ADULTE',          // Apprenants adultes
        'FAMILLE',         // Prix famille
        'ETABLISSEMENT'    // Prix établissement
      ),
      allowNull: false
    },
    
    // Points et classement
    points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 1000
      },
      comment: 'Points obtenus pour ce prix'
    },
    
    rank: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Rang dans la catégorie (1 = premier, etc.)'
    },
    
    totalParticipants: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Nombre total de participants dans la catégorie'
    },
    
    // Localisation
    region: {
      type: DataTypes.ENUM(
        'Centre', 'Littoral', 'Ouest', 'Sud-Ouest', 
        'Nord-Ouest', 'Nord', 'Extrême-Nord', 'Est', 'Sud', 'Adamaoua',
        'DIASPORA' // Pour les camerounais à l'étranger
      ),
      allowNull: true
    },
    
    city: {
      type: DataTypes.STRING,
      allowNull: true
    },
    
    // Critères d'évaluation
    evaluationCriteria: {
      type: DataTypes.JSONB,
      defaultValue: {
        academicExcellence: 0,     // Excellence académique (/25)
        perseverance: 0,           // Persévérance (/25)
        solidarity: 0,             // Solidarité et entraide (/25)
        familyValues: 0,           // Valeurs familiales (/25)
        totalScore: 0              // Score total (/100)
      },
      comment: 'Détail des critères d\\'évaluation'
    },
    
    // Jury et validation
    juryComments: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Commentaires du jury'
    },
    
    validatedBy: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Nom du membre du jury qui a validé'
    },
    
    validatedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Récompense
    reward: {
      type: DataTypes.JSONB,
      defaultValue: {
        monetary: 0,              // Récompense monétaire en FCFA
        materials: [],            // Matériels offerts
        recognition: '',          // Type de reconnaissance
        certificate: true,        // Certificat numérique
        specialMention: false     // Mention spéciale
      },
      comment: 'Détails de la récompense accordée'
    },
    
    // Statut du prix
    status: {
      type: DataTypes.ENUM('NOMINATED', 'WINNER', 'FINALIST', 'PARTICIPANT'),
      allowNull: false,
      defaultValue: 'NOMINATED'
    },
    
    // Dates importantes
    nominationDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    
    evaluationDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    announcementDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Témoignages et inspiration
    testimonial: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Témoignage du lauréat ou de la famille'
    },
    
    inspirationStory: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Histoire inspirante à partager avec la communauté'
    },
    
    // Médias
    photos: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'URLs des photos associées au prix'
    },
    
    videos: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'URLs des vidéos de présentation ou de remise'
    },
    
    // Impact et suivi
    impactMetrics: {
      type: DataTypes.JSONB,
      defaultValue: {
        studentsInspired: 0,       // Nombre d'étudiants inspirés
        familiesImpacted: 0,       // Familles impactées positivement
        communityReach: 0,         // Portée dans la communauté
        mediaVisibility: 0         // Visibilité médiatique (vues, partages)
      },
      comment: 'Métriques d\\'impact du prix'
    },
    
    // Parrainage et partenariats
    sponsors: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Liste des sponsors ou partenaires du prix'
    },
    
    // Métadonnées
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Données additionnelles spécifiques à chaque prix'
    },
    
    // Relations
    studentId: {
      type: DataTypes.UUID,
      allowNull: true, // Null pour les prix familiaux
      references: {
        model: 'Students',
        key: 'id'
      }
    },
    
    familyId: {
      type: DataTypes.UUID,
      allowNull: true, // Null pour les prix individuels hors famille
      references: {
        model: 'Families',
        key: 'id'
      }
    }
  }, {
    tableName: 'prix_claudine',
    timestamps: true,
    paranoid: true,
    
    indexes: [
      {
        fields: ['season']
      },
      {
        fields: ['awardType']
      },
      {
        fields: ['category']
      },
      {
        fields: ['status']
      },
      {
        fields: ['rank']
      },
      {
        fields: ['points']
      },
      {
        fields: ['region']
      },
      {
        fields: ['studentId']
      },
      {
        fields: ['familyId']
      },
      {
        fields: ['validatedAt']
      },
      {
        fields: ['announcementDate']
      },
      // Index composé pour le classement
      {
        fields: ['season', 'category', 'rank']
      },
      {
        fields: ['season', 'region', 'points']
      }
    ],
    
    // Validation au niveau du modèle
    validate: {
      // Un prix doit concerner soit un étudiant, soit une famille
      mustHaveRecipient() {
        if (!this.studentId && !this.familyId) {
          throw new Error('Un prix doit être attribué à un étudiant ou à une famille');
        }
      },
      
      // Vérifier la cohérence des points et du rang
      validateRankPoints() {
        if (this.rank && this.rank < 1) {
          throw new Error('Le rang doit être supérieur à 0');
        }
        
        if (this.totalParticipants && this.rank && this.rank > this.totalParticipants) {
          throw new Error('Le rang ne peut pas dépasser le nombre de participants');
        }
      }
    },
    
    // Hooks du modèle
    hooks: {
      beforeValidate: (prix) => {
        // Calcul automatique du score total si les critères sont fournis
        if (prix.evaluationCriteria && typeof prix.evaluationCriteria === 'object') {
          const criteria = prix.evaluationCriteria;
          const totalScore = (criteria.academicExcellence || 0) + 
                           (criteria.perseverance || 0) + 
                           (criteria.solidarity || 0) + 
                           (criteria.familyValues || 0);
          
          prix.evaluationCriteria = {
            ...criteria,
            totalScore
          };
        }
        
        // Attribution automatique des points selon le type de prix et le rang
        if (prix.rank && !prix.points) {
          const basePoints = {
            'INDIVIDUAL_EXCELLENCE': 100,
            'FAMILY_ACHIEVEMENT': 150,
            'COMMUNITY_IMPACT': 120,
            'PERSEVERANCE': 80,
            'SOLIDARITY': 90,
            'CREATIVITY': 85,
            'LEADERSHIP': 110,
            'SPECIAL_MENTION': 60
          };
          
          const base = basePoints[prix.awardType] || 50;
          
          // Bonus selon le rang
          if (prix.rank === 1) {
            prix.points = base;
          } else if (prix.rank === 2) {
            prix.points = Math.floor(base * 0.8);
          } else if (prix.rank === 3) {
            prix.points = Math.floor(base * 0.6);
          } else {
            prix.points = Math.floor(base * 0.4);
          }
        }
      }
    }
  });
  
  // Méthodes d'instance
  PrixClaudine.prototype.isWinner = function() {
    return this.status === 'WINNER';
  };
  
  PrixClaudine.prototype.isFinalist = function() {
    return this.status === 'FINALIST';
  };
  
  PrixClaudine.prototype.getDisplayTitle = function() {
    const typeLabels = {
      'INDIVIDUAL_EXCELLENCE': 'Excellence Individuelle',
      'FAMILY_ACHIEVEMENT': 'Réalisation Familiale',
      'COMMUNITY_IMPACT': 'Impact Communautaire',
      'PERSEVERANCE': 'Prix de la Persévérance',
      'SOLIDARITY': 'Prix de la Solidarité',
      'CREATIVITY': 'Prix de la Créativité',
      'LEADERSHIP': 'Prix du Leadership',
      'SPECIAL_MENTION': 'Mention Spéciale'
    };
    
    return typeLabels[this.awardType] || this.title;
  };
  
  PrixClaudine.prototype.getCategoryLabel = function() {
    const categoryLabels = {
      'MATERNELLE': 'Maternelle (3-6 ans)',
      'PRIMAIRE': 'Primaire (6-12 ans)',
      'COLLEGE': 'Collège (12-15 ans)',
      'LYCEE': 'Lycée (15-18 ans)',
      'ADULTE': 'Apprenant Adulte',
      'FAMILLE': 'Prix Famille',
      'ETABLISSEMENT': 'Prix Établissement'
    };
    
    return categoryLabels[this.category] || this.category;
  };
  
  PrixClaudine.prototype.getRankSuffix = function() {
    if (!this.rank) return '';
    
    const suffixes = {
      1: 'er',
      2: 'ème',
      3: 'ème'
    };
    
    return this.rank + (suffixes[this.rank] || 'ème');
  };
  
  PrixClaudine.prototype.getMonetaryReward = function() {
    return this.reward?.monetary || 0;
  };
  
  PrixClaudine.prototype.hasCertificate = function() {
    return this.reward?.certificate === true;
  };
  
  PrixClaudine.prototype.generateCertificateData = function() {
    return {
      recipientName: this.title,
      awardType: this.getDisplayTitle(),
      category: this.getCategoryLabel(),
      rank: this.getRankSuffix(),
      season: this.season,
      points: this.points,
      dateAwarded: this.announcementDate || this.createdAt,
      validatedBy: this.validatedBy,
      testimonial: this.testimonial
    };
  };
  
  // Méthodes de classe
  PrixClaudine.getCurrentSeason = function() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    // La saison suit l'année scolaire camerounaise (septembre à juillet)
    if (month >= 9) {
      return `${year}-september`;
    } else {
      return `${year-1}-september`;
    }
  };
  
  PrixClaudine.getLeaderboard = function(options = {}) {
    const {
      season = this.getCurrentSeason(),
      category = null,
      region = null,
      limit = 10,
      status = 'WINNER'
    } = options;
    
    const where = {
      season,
      status
    };
    
    if (category) where.category = category;
    if (region) where.region = region;
    
    return this.findAll({
      where,
      order: [['points', 'DESC'], ['rank', 'ASC']],
      limit,
      include: [
        {
          model: sequelize.models.Student,
          as: 'student',
          required: false
        },
        {
          model: sequelize.models.Family,
          as: 'family',
          required: false
        }
      ]
    });
  };
  
  PrixClaudine.getTopFamilies = function(season = null, limit = 5) {
    season = season || this.getCurrentSeason();
    
    return this.findAll({
      where: {
        season,
        awardType: 'FAMILY_ACHIEVEMENT',
        status: 'WINNER'
      },
      order: [['points', 'DESC'], ['validatedAt', 'ASC']],
      limit,
      include: [{
        model: sequelize.models.Family,
        as: 'family',
        include: ['students']
      }]
    });
  };
  
  PrixClaudine.getRegionalStats = function(season = null) {
    season = season || this.getCurrentSeason();
    
    return this.findAll({
      where: { season, status: 'WINNER' },
      attributes: [
        'region',
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalWinners'],
        [sequelize.fn('SUM', sequelize.col('points')), 'totalPoints'],
        [sequelize.fn('AVG', sequelize.col('points')), 'averagePoints']
      ],
      group: ['region'],
      order: [[sequelize.fn('SUM', sequelize.col('points')), 'DESC']]
    });
  };
  
  PrixClaudine.createAward = async function(awardData) {
    const {
      studentId,
      familyId,
      awardType,
      category,
      title,
      description,
      region,
      city,
      evaluationCriteria,
      juryComments
    } = awardData;
    
    return this.create({
      studentId,
      familyId,
      awardType,
      category,
      title: title || `Prix ${awardType} - ${category}`,
      description,
      region,
      city,
      season: this.getCurrentSeason(),
      evaluationCriteria,
      juryComments,
      status: 'NOMINATED',
      nominationDate: new Date()
    });
  };
  
  PrixClaudine.validateWinner = async function(prixId, validatorName, comments = null) {
    const prix = await this.findByPk(prixId);
    
    if (!prix) {
      throw new Error('Prix Claudine non trouvé');
    }
    
    return prix.update({
      status: 'WINNER',
      validatedBy: validatorName,
      validatedAt: new Date(),
      juryComments: comments || prix.juryComments,
      announcementDate: new Date()
    });
  };
  
  return PrixClaudine;
};