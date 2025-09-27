/**
 * Jest Configuration - Claudyne Testing Suite
 * Configuration complète pour tests unitaires, intégration et sécurité
 */

module.exports = {
  // Environment de test
  testEnvironment: 'node',

  // Patterns de fichiers de test
  testMatch: [
    '**/__tests__/**/*.js',
    '**/*.test.js',
    '**/*.spec.js'
  ],

  // Patterns à ignorer
  testPathIgnorePatterns: [
    '/node_modules/',
    '/backend/node_modules/',
    '/claudyne-mobile/node_modules/',
    '/dist/',
    '/build/'
  ],

  // Configuration de couverture
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html',
    'json'
  ],

  // Seuils de couverture (80%+ requis)
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    // Seuils spécifiques par module critique
    './backend/database.js': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './backend/minimal-server.js': {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75
    }
  },

  // Fichiers à inclure dans la couverture
  collectCoverageFrom: [
    'backend/**/*.js',
    'shared/**/*.js',
    'parent-interface/js/**/*.js',
    '*.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/dist/**',
    '!**/build/**',
    '!**/*.config.js',
    '!**/*.test.js',
    '!**/*.spec.js'
  ],

  // Setup et teardown
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  globalTeardown: '<rootDir>/tests/teardown.js',

  // Timeout pour tests
  testTimeout: 30000,

  // Configuration modules
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@backend/(.*)$': '<rootDir>/backend/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },

  // Variables d'environnement pour tests
  setupFiles: ['<rootDir>/tests/env.js'],

  // Configuration pour tests asynchrones
  maxWorkers: 4,

  // Verbose pour debug
  verbose: true,

  // Bail si échec critique
  bail: false,

  // Force exit après tests
  forceExit: true,

  // Détection de fuites mémoire
  detectLeaks: true,

  // Détection de handles ouverts
  detectOpenHandles: true,

  // Configuration pour tests parallèles
  maxConcurrency: 5,

  // Transformation des fichiers
  transform: {
    '^.+\\.js$': 'babel-jest'
  },

  // Extensions de fichiers
  moduleFileExtensions: ['js', 'json'],

  // Configuration pour mocks
  clearMocks: true,
  restoreMocks: true,

  // Reporters personnalisés
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './coverage',
      filename: 'jest-report.html',
      expand: true,
      hideIcon: false
    }]
  ]
};