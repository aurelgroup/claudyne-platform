/**
 * Configuration de la base de données PostgreSQL pour Claudyne
 * Gestion des connexions et modèles Sequelize
 */

const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

// Configuration selon l'environnement
const config = {
  development: {
    dialect: process.env.DB_DIALECT || 'postgres',
    // SQLite fallback (si DB_DIALECT=sqlite)
    storage: process.env.DB_STORAGE || './database/claudyne.sqlite',
    logging: (msg) => logger.debug(`[SQL] ${msg}`),
    // Configuration PostgreSQL (par défaut)
    username: process.env.DB_USER || 'claudyne_user',
    password: process.env.DB_PASSWORD || 'claudyne_secure_password',
    database: process.env.DB_NAME || 'claudyne_dev',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  },
  
  test: {
    username: process.env.DB_USER || 'claudyne_user',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.TEST_DB_NAME || 'claudyne_test',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  
  production: {
    dialect: process.env.DB_TYPE || 'postgres',
    // SQLite fallback (si DB_TYPE=sqlite)
    storage: process.env.DB_STORAGE || './database/claudyne_production.sqlite',
    logging: false,
    // Configuration PostgreSQL (par défaut)
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    pool: {
      max: 20,
      min: 5,
      acquire: 60000,
      idle: 10000
    },
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  }
};

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Création de l'instance Sequelize
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

// Test de la connexion
async function testConnection() {
  try {
    await sequelize.authenticate();
    logger.info(`✅ Connexion base de données établie (${env} - ${dbConfig.dialect})`);
    return true;
  } catch (error) {
    logger.error('❌ Impossible de se connecter à la base de données:', error);
    return false;
  }
}

// Fonction pour initialiser les modèles
function initializeModels() {
  // Import des modèles existants
  const User = require('../models/User')(sequelize);
  const Family = require('../models/Family')(sequelize);
  const Student = require('../models/Student')(sequelize);
  const Subject = require('../models/Subject')(sequelize);
  const Lesson = require('../models/Lesson')(sequelize);
  const Progress = require('../models/Progress')(sequelize);
  const Battle = require('../models/Battle')(sequelize);
  const PrixClaudine = require('../models/PrixClaudine')(sequelize);
  const Payment = require('../models/Payment')(sequelize);
  const Subscription = require('../models/Subscription')(sequelize);
  const ChatMessage = require('../models/ChatMessage')(sequelize);
  const Notification = require('../models/Notification')(sequelize);
  const AdminSetting = require('../models/AdminSetting')(sequelize);
  const EmailTemplate = require('../models/EmailTemplate')(sequelize);

  // Import des nouveaux modèles
  const StudyGroup = require('../models/StudyGroup')(sequelize);
  const StudyGroupMember = require('../models/StudyGroupMember')(sequelize);
  const ForumCategory = require('../models/ForumCategory')(sequelize);
  const ForumDiscussion = require('../models/ForumDiscussion')(sequelize);
  const ForumPost = require('../models/ForumPost')(sequelize);
  const WellnessExercise = require('../models/WellnessExercise')(sequelize);
  const CareerProfile = require('../models/CareerProfile')(sequelize);
  const Career = require('../models/Career')(sequelize);
  const Institution = require('../models/Institution')(sequelize);
  const ApplicationDeadline = require('../models/ApplicationDeadline')(sequelize);
  const BattleParticipation = require('../models/BattleParticipation')(sequelize);
  const RevisionSession = require('../models/RevisionSession')(sequelize);

  // Définition des associations
  defineAssociations({
    User,
    Family,
    Student,
    Subject,
    Lesson,
    Progress,
    Battle,
    PrixClaudine,
    Payment,
    Subscription,
    ChatMessage,
    Notification,
    AdminSetting,
    EmailTemplate,
    StudyGroup,
    StudyGroupMember,
    ForumCategory,
    ForumDiscussion,
    ForumPost,
    WellnessExercise,
    CareerProfile,
    Career,
    Institution,
    ApplicationDeadline,
    BattleParticipation,
    RevisionSession
  });

  return {
    User,
    Family,
    Student,
    Subject,
    Lesson,
    Progress,
    Battle,
    PrixClaudine,
    Payment,
    Subscription,
    ChatMessage,
    Notification,
    AdminSetting,
    EmailTemplate,
    StudyGroup,
    StudyGroupMember,
    ForumCategory,
    ForumDiscussion,
    ForumPost,
    WellnessExercise,
    CareerProfile,
    Career,
    Institution,
    ApplicationDeadline,
    BattleParticipation,
    RevisionSession,
    sequelize
  };
}

// Définition des relations entre modèles
function defineAssociations(models) {
  const {
    User, Family, Student, Subject, Lesson, Progress,
    Battle, PrixClaudine, Payment, Subscription,
    ChatMessage, Notification, AdminSetting, EmailTemplate
  } = models;

  // Relations Famille -> Utilisateurs
  Family.hasMany(User, { 
    foreignKey: 'familyId', 
    as: 'members',
    onDelete: 'CASCADE'
  });
  User.belongsTo(Family, { 
    foreignKey: 'familyId', 
    as: 'family' 
  });

  // Relations Famille -> Étudiants
  Family.hasMany(Student, { 
    foreignKey: 'familyId', 
    as: 'students',
    onDelete: 'CASCADE'
  });
  Student.belongsTo(Family, { 
    foreignKey: 'familyId', 
    as: 'family' 
  });

  // Relations Utilisateur -> Étudiant (profil enfant)
  User.hasOne(Student, { 
    foreignKey: 'userId', 
    as: 'studentProfile',
    onDelete: 'CASCADE'
  });
  Student.belongsTo(User, { 
    foreignKey: 'userId', 
    as: 'user' 
  });

  // Relations Matière -> Leçons
  Subject.hasMany(Lesson, { 
    foreignKey: 'subjectId', 
    as: 'lessons',
    onDelete: 'CASCADE'
  });
  Lesson.belongsTo(Subject, { 
    foreignKey: 'subjectId', 
    as: 'subject' 
  });

  // Relations Progrès Étudiant
  Student.hasMany(Progress, { 
    foreignKey: 'studentId', 
    as: 'progress',
    onDelete: 'CASCADE'
  });
  Progress.belongsTo(Student, { 
    foreignKey: 'studentId', 
    as: 'student' 
  });

  Progress.belongsTo(Lesson, { 
    foreignKey: 'lessonId', 
    as: 'lesson' 
  });
  Lesson.hasMany(Progress, { 
    foreignKey: 'lessonId', 
    as: 'studentProgress' 
  });

  // Relations Battle Royale
  Battle.belongsToMany(Student, { 
    through: 'BattleParticipants',
    foreignKey: 'battleId',
    otherKey: 'studentId',
    as: 'participants'
  });
  Student.belongsToMany(Battle, { 
    through: 'BattleParticipants',
    foreignKey: 'studentId',
    otherKey: 'battleId',
    as: 'battles'
  });

  // Relations Prix Claudine
  Student.hasMany(PrixClaudine, { 
    foreignKey: 'studentId', 
    as: 'claudineAwards',
    onDelete: 'CASCADE'
  });
  PrixClaudine.belongsTo(Student, { 
    foreignKey: 'studentId', 
    as: 'student' 
  });

  Family.hasMany(PrixClaudine, { 
    foreignKey: 'familyId', 
    as: 'claudineAwards',
    onDelete: 'CASCADE'
  });
  PrixClaudine.belongsTo(Family, { 
    foreignKey: 'familyId', 
    as: 'family' 
  });

  // Relations Paiements et Abonnements
  Family.hasMany(Payment, { 
    foreignKey: 'familyId', 
    as: 'payments',
    onDelete: 'CASCADE'
  });
  Payment.belongsTo(Family, { 
    foreignKey: 'familyId', 
    as: 'family' 
  });

  Family.hasOne(Subscription, { 
    foreignKey: 'familyId', 
    as: 'subscription',
    onDelete: 'CASCADE'
  });
  Subscription.belongsTo(Family, { 
    foreignKey: 'familyId', 
    as: 'family' 
  });

  // Relations Messages Chat Mentor
  Student.hasMany(ChatMessage, { 
    foreignKey: 'studentId', 
    as: 'chatMessages',
    onDelete: 'CASCADE'
  });
  ChatMessage.belongsTo(Student, { 
    foreignKey: 'studentId', 
    as: 'student' 
  });

  // Relations Notifications
  User.hasMany(Notification, { 
    foreignKey: 'userId', 
    as: 'notifications',
    onDelete: 'CASCADE'
  });
  Notification.belongsTo(User, { 
    foreignKey: 'userId', 
    as: 'user' 
  });
}

module.exports = {
  sequelize,
  testConnection,
  initializeModels,
  config
};