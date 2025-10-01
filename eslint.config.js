/**
 * Configuration ESLint pour Claudyne
 * Détecte les erreurs d'échappement et autres problèmes de qualité
 */

const js = require('@eslint/js');

module.exports = [
  // Configuration de base recommandée
  js.configs.recommended,

  {
    // Fichiers à analyser
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],

    // Fichiers à ignorer
    ignores: [
      'node_modules/**',
      'claudyne-mobile/node_modules/**',
      'frontend/node_modules/**',
      'backend/node_modules/**',
      'dist/**',
      'build/**',
      '.expo/**',
      'coverage/**',
      '*.min.js'
    ],

    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Node.js globals
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        console: 'readonly',
        exports: 'writable',
        global: 'readonly',
        module: 'readonly',
        process: 'readonly',
        require: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setImmediate: 'readonly',
        clearImmediate: 'readonly',

        // Browser globals (pour les fichiers frontend)
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        fetch: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly'
      }
    },

    rules: {
      // ==========================================
      // RÈGLES POUR DÉTECTER LES ERREURS D'ÉCHAPPEMENT
      // ==========================================

      /**
       * Détecte les échappements inutiles ou incorrects
       * Exemples détectés:
       * - "\!" au lieu de "!"
       * - "\(" au lieu de "("
       * - Apostrophes inutilement échappés dans template strings
       */
      'no-useless-escape': 'error',

      /**
       * Détecte les regex mal formées avec échappements incorrects
       */
      'no-invalid-regexp': 'error',

      /**
       * Évite les séquences d'échappement octales (obsolètes)
       * Exemple: "\123" au lieu de "\u0053"
       */
      'no-octal-escape': 'error',

      /**
       * Détecte les caractères de contrôle dans les regex
       */
      'no-control-regex': 'warn',

      // ==========================================
      // RÈGLES DE QUALITÉ GÉNÉRALE
      // ==========================================

      // Strings et Template Literals
      'no-template-curly-in-string': 'warn', // Détecte ${var} dans strings normaux
      'prefer-template': 'warn', // Préférer les template strings
      'quotes': ['warn', 'single', {
        avoidEscape: true,
        allowTemplateLiterals: true
      }],

      // Détection d'erreurs communes
      'no-constant-condition': 'warn',
      'no-dupe-args': 'error',
      'no-dupe-keys': 'error',
      'no-duplicate-case': 'error',
      'no-empty': 'warn',
      'no-ex-assign': 'error',
      'no-extra-boolean-cast': 'warn',
      'no-func-assign': 'error',
      'no-inner-declarations': 'warn',
      'no-irregular-whitespace': 'error',
      'no-obj-calls': 'error',
      'no-unreachable': 'warn',
      'use-isnan': 'error',
      'valid-typeof': 'error',

      // Variables non utilisées
      'no-unused-vars': ['warn', {
        vars: 'all',
        args: 'after-used',
        ignoreRestSiblings: true,
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],

      // Bonnes pratiques
      'no-var': 'warn', // Préférer const/let
      'prefer-const': 'warn',
      'eqeqeq': ['warn', 'smart'], // Préférer === à ==
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-with': 'error',

      // Async/Await
      'require-await': 'warn',
      'no-async-promise-executor': 'warn',

      // Console (warning en dev, mais ok)
      'no-console': 'off', // On garde les console.log pour ce projet

      // Déboggage
      'no-debugger': 'warn',
      'no-alert': 'warn',

      // Espaces et formatage (warnings légers)
      'indent': ['warn', 2, { SwitchCase: 1 }],
      'semi': ['warn', 'always'],
      'comma-dangle': ['warn', 'never'],
      'no-trailing-spaces': 'warn',
      'eol-last': ['warn', 'always']
    }
  },

  // Configuration spécifique pour les fichiers de test
  {
    files: ['**/*.test.js', '**/*.spec.js', '**/test/**/*.js'],
    rules: {
      'no-unused-vars': 'off',
      'no-console': 'off'
    }
  },

  // Configuration spécifique pour les fichiers de configuration
  {
    files: ['*.config.js', '*.config.mjs', 'ecosystem.config.js'],
    languageOptions: {
      sourceType: 'script'
    },
    rules: {
      'no-console': 'off'
    }
  }
];
