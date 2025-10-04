/**
 * Configuration PM2 pour Claudyne
 * Frontend (port 3000) + Backend (port 3001)
 * En hommage à Meffo Mehtah Tchandjio Claudine
 */

module.exports = {
  apps: [
    {
      name: 'claudyne-frontend',
      script: 'server.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/claudyne/frontend-error.log',
      out_file: '/var/log/claudyne/frontend-out.log',
      log_file: '/var/log/claudyne/frontend-combined.log',
      time: true,
      max_memory_restart: '300M',
      restart_delay: 4000
    },
    {
      name: 'claudyne-backend',
      script: 'backend/src/server.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        DB_HOST: process.env.DB_HOST || 'localhost',
        DB_PORT: process.env.DB_PORT || '5432',
        DB_NAME: process.env.DB_NAME || 'claudyne_production',
        DB_USER: process.env.DB_USER || 'claudyne_user',
        DB_PASSWORD: process.env.DB_PASSWORD, // ⚠️ MUST be set in system env
        JWT_SECRET: process.env.JWT_SECRET, // ⚠️ MUST be set in system env
        JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET, // ⚠️ MUST be set in system env
        JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || '30d',
        FRONTEND_URL: process.env.FRONTEND_URL || 'https://claudyne.com',
        CORS_ORIGIN: process.env.CORS_ORIGIN || 'https://claudyne.com'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        DB_HOST: process.env.DB_HOST || 'localhost',
        DB_PORT: process.env.DB_PORT || '5432',
        DB_NAME: process.env.DB_NAME || 'claudyne_production',
        DB_USER: process.env.DB_USER || 'claudyne_user',
        DB_PASSWORD: process.env.DB_PASSWORD, // ⚠️ MUST be set in system env
        JWT_SECRET: process.env.JWT_SECRET, // ⚠️ MUST be set in system env
        JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET, // ⚠️ MUST be set in system env
        JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || '30d',
        FRONTEND_URL: process.env.FRONTEND_URL || 'https://claudyne.com',
        CORS_ORIGIN: process.env.CORS_ORIGIN || 'https://claudyne.com'
      },
      error_file: '/var/log/claudyne/backend-error.log',
      out_file: '/var/log/claudyne/backend-out.log',
      log_file: '/var/log/claudyne/backend-combined.log',
      time: true,
      max_memory_restart: '500M',
      restart_delay: 4000
    },
    {
      name: 'claudyne-cron',
      script: 'backend/src/jobs/subscriptionCron.js',
      instances: 1,
      exec_mode: 'fork',
      cron_restart: '0 0 * * *', // Redémarrer tous les jours à minuit
      env: {
        NODE_ENV: 'production',
        DB_HOST: process.env.DB_HOST || 'localhost',
        DB_PORT: process.env.DB_PORT || '5432',
        DB_NAME: process.env.DB_NAME || 'claudyne_production',
        DB_USER: process.env.DB_USER || 'claudyne_user',
        DB_PASSWORD: process.env.DB_PASSWORD, // ⚠️ MUST be set in system env
        TZ: 'Africa/Douala'
      },
      env_production: {
        NODE_ENV: 'production',
        DB_HOST: process.env.DB_HOST || 'localhost',
        DB_PORT: process.env.DB_PORT || '5432',
        DB_NAME: process.env.DB_NAME || 'claudyne_production',
        DB_USER: process.env.DB_USER || 'claudyne_user',
        DB_PASSWORD: process.env.DB_PASSWORD, // ⚠️ MUST be set in system env
        TZ: 'Africa/Douala'
      },
      error_file: '/var/log/claudyne/cron-error.log',
      out_file: '/var/log/claudyne/cron-out.log',
      log_file: '/var/log/claudyne/cron-combined.log',
      time: true,
      max_memory_restart: '200M',
      restart_delay: 4000,
      autorestart: true,
      watch: false
    }
  ]
};