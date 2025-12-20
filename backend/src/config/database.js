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

// 🚨 SÉCURITÉ : Interdire SQLite en production
if (env === 'production' && (process.env.DB_TYPE === 'sqlite' || process.env.DB_DIALECT === 'sqlite')) {
  const errorMsg = '🚨 ERREUR FATALE : SQLite n\'est PAS autorisé en production !\n' +
                   `   DB_TYPE: ${process.env.DB_TYPE}\n` +
                   `   DB_DIALECT: ${process.env.DB_DIALECT}\n` +
                   '   Production DOIT utiliser PostgreSQL uniquement.';
  console.error(errorMsg);
  throw new Error(errorMsg);
}

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
  const PaymentTicket = require('../models/PaymentTicket')(sequelize);
  const Resource = require('../models/Resource')(sequelize);
  const Chapter = require('../models/Chapter')(sequelize);

  // Définition des associations
  defineAssociations({
    User,
    Family,
    Student,
    Subject,
    Lesson,
    Chapter,
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
    PaymentTicket,
  });

  return {
    User,
    Family,
    Student,
    Subject,
    Lesson,
    Chapter,
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
    PaymentTicket,
    Resource,
    sequelize
  };
}

// Définition des relations entre modèles
function defineAssociations(models) {
  const {
    User, Family, Student, Subject, Lesson, Chapter, Progress,
    Battle, PrixClaudine, Payment, Subscription,
    StudyGroup, StudyGroupMember, ForumCategory, ForumDiscussion, ForumPost,
    WellnessExercise, CareerProfile, Career, Institution, ApplicationDeadline,
    BattleParticipation, RevisionSession, PaymentTicket, Resource,
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

  // Relations Matière -> Chapitres (Nouvelle architecture)
  Subject.hasMany(Chapter, {
    foreignKey: 'subjectId',
    as: 'chapters',
    onDelete: 'CASCADE'
  });
  Chapter.belongsTo(Subject, {
    foreignKey: 'subjectId',
    as: 'subject'
  });

  // Relations Chapitre -> Leçons (Nouvelle architecture)
  Chapter.hasMany(Lesson, {
    foreignKey: 'chapterId',
    as: 'lessons',
    onDelete: 'SET NULL' // Si chapitre supprimé, les leçons restent (chapterId = null)
  });
  Lesson.belongsTo(Chapter, {
    foreignKey: 'chapterId',
    as: 'chapter'
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

  // Battle -> Subject association
  Battle.belongsTo(Subject, {
    foreignKey: 'subjectId',
    as: 'subject'
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
  // ==================== ASSOCIATIONS NOUVEAUX MODÈLES ====================
  
  // Relations Study Groups
  StudyGroup.hasMany(StudyGroupMember, {
    foreignKey: "groupId",
    as: "members",
    onDelete: "CASCADE"
  });
  StudyGroupMember.belongsTo(StudyGroup, {
    foreignKey: "groupId",
    as: "group"
  });
  
  StudyGroupMember.belongsTo(User, {
    foreignKey: "userId",
    as: "user"
  });
  User.hasMany(StudyGroupMember, {
    foreignKey: "userId",
    as: "studyGroupMemberships"
  });
  
  StudyGroup.belongsTo(User, {
    foreignKey: "createdBy",
    as: "creator"
  });
  StudyGroup.belongsTo(User, {
    foreignKey: "moderatorId",
    as: "moderator"
  });
  
  // Relations Forums
  ForumCategory.hasMany(ForumDiscussion, {
    foreignKey: "categoryId",
    as: "discussions",
    onDelete: "CASCADE"
  });
  ForumDiscussion.belongsTo(ForumCategory, {
    foreignKey: "categoryId",
    as: "category"
  });
  
  ForumDiscussion.hasMany(ForumPost, {
    foreignKey: "discussionId",
    as: "posts",
    onDelete: "CASCADE"
  });
  ForumPost.belongsTo(ForumDiscussion, {
    foreignKey: "discussionId",
    as: "discussion"
  });
  
  ForumDiscussion.belongsTo(User, {
    foreignKey: "authorId",
    as: "author"
  });
  ForumPost.belongsTo(User, {
    foreignKey: "authorId",
    as: "author"
  });
  
  // Relations Careers
  CareerProfile.hasMany(Career, {
    foreignKey: "profileId",
    as: "careers"
  });
  Career.belongsTo(CareerProfile, {
    foreignKey: "profileId",
    as: "profile"
  });
  
  Institution.hasMany(ApplicationDeadline, {
    foreignKey: "institutionId",
    as: "deadlines",
    onDelete: "CASCADE"
  });
  ApplicationDeadline.belongsTo(Institution, {
    foreignKey: "institutionId",
    as: "institution"
  });
  
  // Relations Battle Participation
  BattleParticipation.belongsTo(Battle, {
    foreignKey: "battleId",
    as: "battle"
  });
  BattleParticipation.belongsTo(Student, {
    foreignKey: "studentId",
    as: "student"
  });
  Battle.hasMany(BattleParticipation, {
    foreignKey: "battleId",
    as: "participations"
  });
  Student.hasMany(BattleParticipation, {
    foreignKey: "studentId",
    as: "battleParticipations"
  });
  
  // Relations Revision Sessions
  RevisionSession.belongsTo(Student, {
    foreignKey: "studentId",
    as: "student"
  });
  RevisionSession.belongsTo(Subject, {
    foreignKey: "subjectId",
    as: "subject"
  });
  Student.hasMany(RevisionSession, {
    foreignKey: "studentId",
    as: "revisionSessions"
  });

  // Relations Payment Tickets
  PaymentTicket.belongsTo(User, {
    foreignKey: "userId",
    as: "user"
  });
  User.hasMany(PaymentTicket, {
    foreignKey: "userId",
    as: "paymentTickets"
  });

  PaymentTicket.belongsTo(Family, {
    foreignKey: "familyId",
    as: "family"
  });
  Family.hasMany(PaymentTicket, {
    foreignKey: "familyId",
    as: "paymentTickets"
  });

  PaymentTicket.belongsTo(User, {
    foreignKey: "reviewedBy",
    as: "reviewer"
  });
  User.hasMany(PaymentTicket, {
    foreignKey: "reviewedBy",
    as: "reviewedTickets"
  });
}

module.exports = {
  sequelize,
  testConnection,
  initializeModels,
  config
};
