/**
 * Modèle Étudiant Claudyne
 * Profils d'apprentissage pour enfants et adultes
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Student = sequelize.define('Student', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    
    // Informations de base
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: {
          args: [2, 50],
          msg: 'Le prénom doit contenir entre 2 et 50 caractères'
        }
      }
    },
    
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: {
          args: [2, 50],
          msg: 'Le nom doit contenir entre 2 et 50 caractères'
        }
      }
    },
    
    nickname: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Surnom d\'affichage dans l\'interface'
    },
    
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    
    gender: {
      type: DataTypes.ENUM('M', 'F', 'OTHER'),
      allowNull: true
    },
    
    avatar: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null
    },
    
    // Classification scolaire
    educationLevel: {
      type: DataTypes.ENUM(
        // Maternelle
        'MATERNELLE_PETITE', 'MATERNELLE_MOYENNE', 'MATERNELLE_GRANDE',
        // Primaire
        'SIL', 'CP', 'CE1', 'CE2', 'CM1', 'CM2',
        // Secondaire 1er cycle
        '6EME', '5EME', '4EME', '3EME',
        // Secondaire 2nd cycle
        'SECONDE', 'PREMIERE', 'TERMINALE',
        // Supérieur
        'SUPERIEUR',
        // Adulte
        'ADULTE_DEBUTANT', 'ADULTE_INTERMEDIAIRE', 'ADULTE_AVANCE'
      ),
      allowNull: false
    },
    
    schoolName: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Nom de l\'établissement scolaire'
    },

    schoolType: {
      type: DataTypes.ENUM('PUBLIC', 'PRIVE_LAIQUE', 'PRIVE_CONFESSIONNEL', 'INTERNATIONAL', 'DOMICILE'),
      allowNull: true
    },

    academicYear: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: () => {
        const year = new Date().getFullYear();
        return `${year}-${year + 1}`;
      }
    },
    
    // Type d'apprenant
    studentType: {
      type: DataTypes.ENUM('CHILD', 'ADULT_LEARNER'),
      allowNull: false,
      defaultValue: 'CHILD'
    },
    
    // Statut et progression
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    
    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'GRADUATED', 'TRANSFERRED'),
      defaultValue: 'ACTIVE'
    },
    
    // Moyennes et évaluations
    currentAverage: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 20
      },
      comment: 'Moyenne générale actuelle sur 20'
    },
    
    lastTermAverage: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 20
      }
    },
    
    classRank: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Rang dans la classe'
    },
    
    totalStudents: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Nombre total d\'étudiants dans la classe'
    },
    
    // Progression Claudyne
    totalLessonsCompleted: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    
    totalStudyTimeMinutes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Temps d\'étude total en minutes'
    },
    
    currentStreak: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Jours consécutifs d\'activité'
    },
    
    longestStreak: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    
    lastActivityAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Points et récompenses
    totalPoints: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Points totaux gagnés'
    },
    
    claudinePoints: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Points Prix Claudine spécifiques'
    },
    
    currentLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: 'Niveau de gamification'
    },
    
    experiencePoints: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Points d\'expérience pour progression de niveau'
    },
    
    // Battle Royale
    battleStats: {
      type: DataTypes.JSONB,
      defaultValue: {
        totalBattles: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        bestRank: null,
        favoriteSubject: null,
        totalAnswers: 0,
        correctAnswers: 0,
        averageResponseTime: 0
      }
    },
    
    // Prix Claudine
    prixClaudineStatus: {
      type: DataTypes.ENUM('NOT_ELIGIBLE', 'CANDIDATE', 'FINALIST', 'WINNER', 'ALUMNI'),
      defaultValue: 'NOT_ELIGIBLE'
    },
    
    prixClaudineRank: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Rang au classement Prix Claudine'
    },
    
    claudineAchievements: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Liste des achievements Prix Claudine obtenus'
    },
    
    // Préférences d'apprentissage
    learningStyle: {
      type: DataTypes.ENUM('VISUAL', 'AUDITORY', 'KINESTHETIC', 'READING'),
      allowNull: true
    },
    
    preferredLanguage: {
      type: DataTypes.STRING,
      defaultValue: 'fr'
    },
    
    difficultySetting: {
      type: DataTypes.ENUM('EASY', 'MEDIUM', 'HARD', 'ADAPTIVE'),
      defaultValue: 'ADAPTIVE'
    },
    
    // Matières et compétences
    strongSubjects: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Matières où l\'étudiant excelle'
    },
    
    weakSubjects: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Matières nécessitant plus d\'attention'
    },
    
    subjectPreferences: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Préférences et paramètres par matière'
    },
    
    // Restrictions et contrôles parentaux
    parentalRestrictions: {
      type: DataTypes.JSONB,
      defaultValue: {
        maxDailyTime: 120, // minutes
        allowedSubjects: 'all',
        chatRestricted: false,
        battleParticipation: true,
        restrictedHours: null
      }
    },
    
    // Santé et bien-être
    specialNeeds: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Besoins éducatifs particuliers'
    },
    
    medicalInfo: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Informations médicales pertinentes (allergies, etc.)'
    },
    
    // Contact et urgence
    emergencyContact: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    
    // Statistiques détaillées
    detailedStats: {
      type: DataTypes.JSONB,
      defaultValue: {
        subjectMastery: {},
        weeklyProgress: [],
        monthlyProgress: [],
        achievements: [],
        certificates: [],
        mentorInteractions: 0,
        helpRequestsCount: 0
      }
    },
    
    // Métadonnées
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    
    // Relations
    familyId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Families',
        key: 'id'
      }
    },
    
    userId: {
      type: DataTypes.UUID,
      allowNull: true, // Null pour les profils enfants sans compte utilisateur dédié
      references: {
        model: 'Users',
        key: 'id'
      }
    }
  }, {
    tableName: 'students',
    timestamps: true,
    paranoid: true,
    
    indexes: [
      {
        fields: ['familyId']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['educationLevel']
      },
      {
        fields: ['status']
      },
      {
        fields: ['studentType']
      },
      {
        fields: ['prixClaudineStatus']
      },
      {
        fields: ['prixClaudineRank']
      },
      {
        fields: ['claudinePoints']
      },
      {
        fields: ['totalPoints']
      },
      {
        fields: ['currentLevel']
      },
      {
        fields: ['lastActivityAt']
      },
      {
        fields: ['currentAverage']
      }
    ],
    
    // Validation
    validate: {
      // Validation de l'âge selon le type
      validateAgeForType() {
        if (this.dateOfBirth) {
          const age = Math.floor((new Date() - new Date(this.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000));
          
          if (this.studentType === 'CHILD' && age >= 18) {
            throw new Error('Un profil enfant ne peut pas avoir plus de 18 ans');
          }
          
          if (this.studentType === 'ADULT_LEARNER' && age < 16) {
            throw new Error('Un apprenant adulte doit avoir au moins 16 ans');
          }
        }
      },
      
      // Validation niveau éducatif / âge
      validateEducationLevel() {
        if (this.educationLevel && this.dateOfBirth) {
          const age = Math.floor((new Date() - new Date(this.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000));
          
          const maxAgeForLevel = {
            'MATERNELLE_PETITE': 4,
            'MATERNELLE_MOYENNE': 5,
            'MATERNELLE_GRANDE': 6,
            'SIL': 6,
            'CP': 7,
            'CE1': 8,
            'CE2': 9,
            'CM1': 10,
            'CM2': 11,
            '6EME': 12,
            '5EME': 13,
            '4EME': 14,
            '3EME': 15,
            'SECONDE': 16,
            'PREMIERE': 17,
            'TERMINALE': 18
          };
          
          const maxAge = maxAgeForLevel[this.educationLevel];
          if (maxAge && age > maxAge + 3) { // Tolérance de 3 ans
            console.warn(`Âge incohérent avec le niveau éducatif: ${age} ans pour ${this.educationLevel}`);
          }
        }
      }
    },
    
    // Hooks
    hooks: {
      beforeValidate: (student) => {
        // Génération automatique du nickname
        if (!student.nickname) {
          student.nickname = student.firstName;
        }
        
        // Mise à jour du streak
        if (student.lastActivityAt) {
          const daysDiff = Math.floor((new Date() - new Date(student.lastActivityAt)) / (24 * 60 * 60 * 1000));
          if (daysDiff === 1) {
            student.currentStreak += 1;
            student.longestStreak = Math.max(student.longestStreak, student.currentStreak);
          } else if (daysDiff > 1) {
            student.currentStreak = 0;
          }
        }
      }
    }
  });
  
  // Méthodes d'instance
  Student.prototype.getFullName = function() {
    return `${this.firstName} ${this.lastName}`.trim();
  };
  
  Student.prototype.getAge = function() {
    if (!this.dateOfBirth) return null;
    return Math.floor((new Date() - new Date(this.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000));
  };
  
  Student.prototype.getDisplayName = function() {
    return this.nickname || this.firstName;
  };
  
  Student.prototype.addPoints = async function(points, reason = 'Activity') {
    const newTotal = this.totalPoints + points;
    const newExp = this.experiencePoints + points;
    
    // Calcul du niveau (100 points par niveau)
    const newLevel = Math.floor(newExp / 100) + 1;
    const levelUp = newLevel > this.currentLevel;
    
    await this.update({
      totalPoints: newTotal,
      experiencePoints: newExp,
      currentLevel: newLevel
    });
    
    return { levelUp, newLevel, pointsAdded: points };
  };
  
  Student.prototype.addClaudinePoints = async function(points, achievement = null) {
    const updates = {
      claudinePoints: this.claudinePoints + points
    };
    
    if (achievement) {
      const achievements = [...this.claudineAchievements];
      achievements.push({
        achievement,
        points,
        date: new Date(),
        id: Date.now()
      });
      updates.claudineAchievements = achievements;
    }
    
    return this.update(updates);
  };
  
  Student.prototype.updateBattleStats = async function(battleResult) {
    const stats = { ...this.battleStats };
    stats.totalBattles += 1;
    
    if (battleResult.won) stats.wins += 1;
    else if (battleResult.lost) stats.losses += 1;
    else stats.draws += 1;
    
    if (battleResult.rank && (!stats.bestRank || battleResult.rank < stats.bestRank)) {
      stats.bestRank = battleResult.rank;
    }
    
    stats.totalAnswers += battleResult.answers || 0;
    stats.correctAnswers += battleResult.correctAnswers || 0;
    
    return this.update({ battleStats: stats });
  };
  
  Student.prototype.updateStreak = async function() {
    const now = new Date();
    const lastActivity = this.lastActivityAt ? new Date(this.lastActivityAt) : null;
    
    let newStreak = this.currentStreak;
    
    if (!lastActivity) {
      newStreak = 1;
    } else {
      const daysDiff = Math.floor((now - lastActivity) / (24 * 60 * 60 * 1000));
      
      if (daysDiff === 1) {
        newStreak += 1;
      } else if (daysDiff > 1) {
        newStreak = 1;
      }
      // Si daysDiff === 0, on garde le même streak
    }
    
    const newLongestStreak = Math.max(this.longestStreak, newStreak);
    
    return this.update({
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
      lastActivityAt: now
    });
  };
  
  Student.prototype.calculateMastery = function(subject) {
    const subjectStats = this.detailedStats.subjectMastery[subject];
    if (!subjectStats) return 0;
    
    const { completed, total, averageScore } = subjectStats;
    const completionRate = total > 0 ? completed / total : 0;
    const scoreRate = averageScore / 20; // Normaliser sur 20
    
    return Math.round((completionRate * 0.6 + scoreRate * 0.4) * 100);
  };
  
  Student.prototype.getWeeklyProgress = function() {
    const weeklyData = this.detailedStats.weeklyProgress || [];
    return weeklyData.slice(-4); // 4 dernières semaines
  };
  
  Student.prototype.isEligibleForPrixClaudine = function() {
    const requiredPoints = 50;
    const requiredAverage = 12.0;
    const requiredStreak = 7;
    
    return this.claudinePoints >= requiredPoints &&
           this.currentAverage >= requiredAverage &&
           this.currentStreak >= requiredStreak;
  };
  
  // Méthodes de classe
  Student.getTopPerformers = function(familyId = null, limit = 10) {
    const where = { status: 'ACTIVE' };
    if (familyId) where.familyId = familyId;
    
    return this.findAll({
      where,
      order: [['currentAverage', 'DESC'], ['claudinePoints', 'DESC']],
      limit
    });
  };
  
  Student.getClaudineLeaderboard = function(region = null, limit = 10) {
    const include = [{
      model: sequelize.models.Family,
      as: 'family',
      where: region ? { region } : {}
    }];
    
    return this.findAll({
      where: {
        prixClaudineStatus: ['CANDIDATE', 'FINALIST', 'WINNER'],
        claudinePoints: { [sequelize.Sequelize.Op.gt]: 0 }
      },
      include,
      order: [['claudinePoints', 'DESC'], ['prixClaudineRank', 'ASC']],
      limit
    });
  };
  
  Student.findByEducationLevel = function(level, region = null) {
    const where = { educationLevel: level };
    const include = [];
    
    if (region) {
      include.push({
        model: sequelize.models.Family,
        as: 'family',
        where: { region }
      });
    }
    
    return this.findAll({ where, include });
  };
  
  return Student;
};