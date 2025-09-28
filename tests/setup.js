/**
 * Setup global pour les tests Jest
 * Configuration environnement de test Claudyne
 */

// Timeout global pour tests longs
jest.setTimeout(30000);

// Variables d'environnement test
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgres://test_user:test_pass@localhost:5432/claudyne_test';
process.env.JWT_SECRET = 'test_jwt_secret_key_claudyne_testing';
process.env.BCRYPT_ROUNDS = '4'; // Réduction pour vitesse tests

// Mocks globaux pour services externes
global.mockMTNMobileMoney = {
  requestPayment: jest.fn(),
  checkStatus: jest.fn(),
  validateNumber: jest.fn()
};

global.mockOrangeMoney = {
  requestPayment: jest.fn(),
  checkStatus: jest.fn(),
  validateNumber: jest.fn()
};

global.mockEmailService = {
  sendEmail: jest.fn(),
  sendWelcomeEmail: jest.fn(),
  sendPasswordReset: jest.fn()
};

// Configuration base de données test
global.testDbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'claudyne_test',
  username: 'test_user',
  password: 'test_pass',
  dialect: 'postgres',
  logging: false
};

// Utilisateurs de test
global.testUsers = {
  parent: {
    id: 'test-parent-001',
    email: 'parent.test@claudyne.com',
    password: 'TestPassword123!',
    name: 'Parent Test',
    role: 'parent',
    children: ['test-child-001', 'test-child-002']
  },
  student: {
    id: 'test-student-001',
    email: 'student.test@claudyne.com',
    password: 'StudentPass123!',
    name: 'Étudiant Test',
    role: 'student',
    grade: 'CM2',
    parentId: 'test-parent-001'
  },
  admin: {
    id: 'test-admin-001',
    email: 'admin.test@claudyne.com',
    password: 'AdminSecret123!',
    name: 'Admin Test',
    role: 'admin'
  }
};

// Données de test éducatives
global.testEducationData = {
  subjects: [
    {
      id: 'math-cm2',
      name: 'Mathématiques',
      grade: 'CM2',
      curriculum: 'cameroon'
    },
    {
      id: 'francais-cm2',
      name: 'Français',
      grade: 'CM2',
      curriculum: 'cameroon'
    }
  ],
  lessons: [
    {
      id: 'lesson-001',
      title: 'Les fractions',
      subjectId: 'math-cm2',
      difficulty: 'medium',
      points: 50
    },
    {
      id: 'lesson-002',
      title: 'Grammaire - Les verbes',
      subjectId: 'francais-cm2',
      difficulty: 'easy',
      points: 30
    }
  ]
};

// Helper pour nettoyer la base après chaque test
global.cleanupTestDb = async () => {
  if (global.testDb) {
    await global.testDb.query('TRUNCATE TABLE users CASCADE');
    await global.testDb.query('TRUNCATE TABLE families CASCADE');
    await global.testDb.query('TRUNCATE TABLE students CASCADE');
    await global.testDb.query('TRUNCATE TABLE lessons CASCADE');
    await global.testDb.query('TRUNCATE TABLE progress CASCADE');
  }
};

// Helper pour créer token JWT test
global.createTestToken = (userId, role = 'student') => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { userId, role, clientType: 'test' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

// Mock console pour réduire verbosité
global.mockConsole = () => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'info').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
};

// Restore console
global.restoreConsole = () => {
  console.log.mockRestore?.();
  console.info.mockRestore?.();
  console.warn.mockRestore?.();
  console.error.mockRestore?.();
};

console.log('🧪 Jest setup configuré pour Claudyne - Environment de test prêt');