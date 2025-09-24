// ====================================================================
// 🔧 CLAUDYNE - CONFIGURATION ENVIRONNEMENT PARTAGÉE
// ====================================================================
// Configuration unifiée pour Web App & Mobile App
// ====================================================================

const environment = {
  // 🌐 Configuration du serveur
  SERVER: {
    HOST: process.env.HOST || 'localhost',
    PORT: process.env.PORT || 3001,
    URL: process.env.SERVER_URL || 'http://localhost:3001',
    DOMAIN: process.env.DOMAIN || 'claudyne.com',
    SECURE: process.env.NODE_ENV === 'production'
  },

  // 📱 URLs API pour mobile
  API: {
    BASE_URL: process.env.NODE_ENV === 'production'
      ? 'https://api.claudyne.com'
      : 'http://localhost:3001/api',

    WEB_URL: process.env.NODE_ENV === 'production'
      ? 'https://claudyne.com'
      : 'http://localhost:3000',

    MOBILE_DOWNLOAD: process.env.NODE_ENV === 'production'
      ? 'https://claudyne.com/download/claudyne.apk'
      : 'http://localhost:3000/download/claudyne.apk'
  },

  // 🗄️ Base de données
  DATABASE: {
    TYPE: process.env.DB_TYPE || 'postgresql',
    HOST: process.env.DB_HOST || 'localhost',
    PORT: process.env.DB_PORT || 5432,
    NAME: process.env.DB_NAME || 'claudyne_db',
    USER: process.env.DB_USER || 'claudyne_user',
    PASSWORD: process.env.DB_PASSWORD || '',

    // Fallback vers JSON pour développement
    USE_JSON_FALLBACK: process.env.USE_JSON_FALLBACK === 'true',
    JSON_PATH: process.env.JSON_DB_PATH || './database/data.json'
  },

  // 🔐 Authentification
  AUTH: {
    JWT_SECRET: process.env.JWT_SECRET || 'claudyne_secret_2025',
    JWT_EXPIRATION: process.env.JWT_EXPIRATION || '24h',
    ADMIN_TOKEN: process.env.ADMIN_TOKEN || 'admin_secure_token',
    BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 10
  },

  // 📧 Email & Notifications
  EMAIL: {
    SERVICE: process.env.EMAIL_SERVICE || 'gmail',
    USER: process.env.EMAIL_USER || '',
    PASSWORD: process.env.EMAIL_PASSWORD || '',
    FROM: process.env.EMAIL_FROM || 'noreply@claudyne.com'
  },

  // 🔔 Push Notifications (Mobile)
  PUSH: {
    EXPO_ACCESS_TOKEN: process.env.EXPO_ACCESS_TOKEN || '',
    FCM_SERVER_KEY: process.env.FCM_SERVER_KEY || ''
  },

  // 💳 Paiements (Mobile Money, etc.)
  PAYMENTS: {
    MTN_MOMO: {
      API_USER: process.env.MTN_MOMO_API_USER || '',
      API_KEY: process.env.MTN_MOMO_API_KEY || '',
      SUBSCRIPTION_KEY: process.env.MTN_MOMO_SUBSCRIPTION_KEY || '',
      ENVIRONMENT: process.env.MTN_MOMO_ENV || 'sandbox'
    },

    ORANGE_MONEY: {
      MERCHANT_KEY: process.env.ORANGE_MONEY_MERCHANT_KEY || '',
      SECRET_KEY: process.env.ORANGE_MONEY_SECRET_KEY || ''
    }
  },

  // 📊 Analytics & Monitoring
  ANALYTICS: {
    GOOGLE_ANALYTICS_ID: process.env.GA_ID || '',
    MIXPANEL_TOKEN: process.env.MIXPANEL_TOKEN || '',
    SENTRY_DSN: process.env.SENTRY_DSN || ''
  },

  // 🎯 Features Flags
  FEATURES: {
    MOBILE_APP_ENABLED: process.env.MOBILE_APP_ENABLED !== 'false',
    PAYMENTS_ENABLED: process.env.PAYMENTS_ENABLED === 'true',
    NOTIFICATIONS_ENABLED: process.env.NOTIFICATIONS_ENABLED === 'true',
    ANALYTICS_ENABLED: process.env.ANALYTICS_ENABLED === 'true',
    DEBUG_MODE: process.env.DEBUG_MODE === 'true'
  },

  // 🎓 Application spécifique
  APP: {
    NAME: 'Claudyne',
    VERSION: process.env.APP_VERSION || '1.0.0',
    DESCRIPTION: 'La force du savoir en héritage',

    // Limites
    MAX_UPLOAD_SIZE: process.env.MAX_UPLOAD_SIZE || '10mb',
    MAX_USERS_PER_CLASS: parseInt(process.env.MAX_USERS_PER_CLASS) || 30,
    SESSION_TIMEOUT: parseInt(process.env.SESSION_TIMEOUT) || 3600000, // 1h

    // URLs importantes
    TERMS_URL: '/terms',
    PRIVACY_URL: '/privacy',
    SUPPORT_EMAIL: 'support@claudyne.com'
  },

  // 🌍 Localisation
  LOCALE: {
    DEFAULT: process.env.DEFAULT_LOCALE || 'fr',
    SUPPORTED: ['fr', 'en'],
    TIMEZONE: process.env.TIMEZONE || 'Africa/Douala'
  },

  // 🛡️ Sécurité
  SECURITY: {
    CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
    RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000, // 15min
    RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX) || 100,

    // Headers sécurisés
    SECURITY_HEADERS: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    }
  },

  // 🎨 Thème & UI
  THEME: {
    PRIMARY_COLOR: '#667eea',
    SECONDARY_COLOR: '#764ba2',
    ACCENT_COLOR: '#f093fb',
    DARK_MODE_ENABLED: true
  }
};

// 🔧 Fonction utilitaire pour récupérer la config
const getConfig = (key) => {
  const keys = key.split('.');
  let config = environment;

  for (const k of keys) {
    if (config && typeof config === 'object' && k in config) {
      config = config[k];
    } else {
      return undefined;
    }
  }

  return config;
};

// 🌐 URLs dynamiques basées sur l'environnement
const getApiUrl = (endpoint = '') => {
  const baseUrl = environment.API.BASE_URL;
  return endpoint ? `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}` : baseUrl;
};

const getWebUrl = (path = '') => {
  const baseUrl = environment.API.WEB_URL;
  return path ? `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}` : baseUrl;
};

// 📱 Configuration spécifique mobile
const getMobileConfig = () => ({
  apiUrl: environment.API.BASE_URL,
  downloadUrl: environment.API.MOBILE_DOWNLOAD,
  pushNotifications: environment.FEATURES.NOTIFICATIONS_ENABLED,
  payments: environment.FEATURES.PAYMENTS_ENABLED,
  analytics: environment.FEATURES.ANALYTICS_ENABLED,
  theme: environment.THEME
});

// 🌐 Configuration spécifique web
const getWebConfig = () => ({
  serverUrl: environment.SERVER.URL,
  apiUrl: environment.API.BASE_URL,
  features: environment.FEATURES,
  theme: environment.THEME,
  security: environment.SECURITY
});

// 🔐 Validation de configuration critique
const validateConfig = () => {
  const required = [
    'SERVER.PORT',
    'DATABASE.HOST',
    'AUTH.JWT_SECRET'
  ];

  const missing = required.filter(key => !getConfig(key));

  if (missing.length > 0) {
    console.error('❌ Configuration manquante:', missing);
    process.exit(1);
  }

  console.log('✅ Configuration validée');
};

// Export
module.exports = {
  environment,
  getConfig,
  getApiUrl,
  getWebUrl,
  getMobileConfig,
  getWebConfig,
  validateConfig
};

// 🚀 Auto-validation en production
if (process.env.NODE_ENV === 'production') {
  validateConfig();
}