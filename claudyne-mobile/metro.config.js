const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// SDK 54 Enhancements
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Enable experimental features for SDK 54
config.transformer = {
  ...config.transformer,
  // Support for new Metro features in SDK 54
  experimentalImportSupport: true,
  // CSS autoprefixing with lightningcss (SDK 54)
  cssAutoPrefix: true,
};

// Configuration pour accepter les connexions externes + SDK 54 optimizations
config.server = {
  ...config.server,
  port: 8082, // Use different port to avoid conflicts
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Autoriser les connexions depuis votre iPhone
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      return middleware(req, res, next);
    };
  }
};

module.exports = config;