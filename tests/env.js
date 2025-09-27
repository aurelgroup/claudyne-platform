/**
 * Variables d'environnement pour tests
 */

process.env.NODE_ENV = 'test';
process.env.PORT = '3333';
process.env.DATABASE_URL = 'postgres://test_user:test_pass@localhost:5432/claudyne_test';
process.env.JWT_SECRET = 'test_jwt_secret_key_claudyne_testing_super_secure';
process.env.BCRYPT_ROUNDS = '4';

// Services externes en mode test
process.env.MTN_API_URL = 'https://sandbox.momoapi.mtn.com';
process.env.ORANGE_API_URL = 'https://api.orange.com/sandbox';
process.env.EMAIL_SERVICE = 'test';

// Configuration mobile test
process.env.MOBILE_APP_VERSION = '1.0.0-test';
process.env.API_TIMEOUT = '5000';

console.log('🔧 Variables d\'environnement test configurées');