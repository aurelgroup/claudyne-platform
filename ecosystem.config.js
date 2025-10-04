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
        DB_HOST: 'localhost',
        DB_PORT: '5432',
        DB_NAME: 'claudyne_production',
        DB_USER: 'claudyne_user',
        DB_PASSWORD: 'aujourdhui18D@',
        JWT_SECRET: 'ef81f74a2725c9e7b05ce887902ab375d392cebbc67a885bdf2e9cc870039f8e084037d865758226d7d820237a66d0d4c7492123c159f45acc8a33d823edb56b',
        JWT_EXPIRES_IN: '7d',
        JWT_REFRESH_SECRET: 'a7b3c8d2e9f5a4b1c6d8e3f7a2b9c5d1e8f4a6b3c7d2e9f5a1b8c4d7e3f6a2b9c5d1e8f4a7b3c6d2e9f5a1b8c4d7e3f6a2b9c5d1e8f4a7b3c6d2e9f5a1b8c4',
        JWT_REFRESH_EXPIRE: '30d',
        FRONTEND_URL: 'https://claudyne.com',
        CORS_ORIGIN: 'https://claudyne.com'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        DB_HOST: 'localhost',
        DB_PORT: '5432',
        DB_NAME: 'claudyne_production',
        DB_USER: 'claudyne_user',
        DB_PASSWORD: 'aujourdhui18D@',
        JWT_SECRET: 'ef81f74a2725c9e7b05ce887902ab375d392cebbc67a885bdf2e9cc870039f8e084037d865758226d7d820237a66d0d4c7492123c159f45acc8a33d823edb56b',
        JWT_EXPIRES_IN: '7d',
        JWT_REFRESH_SECRET: 'a7b3c8d2e9f5a4b1c6d8e3f7a2b9c5d1e8f4a6b3c7d2e9f5a1b8c4d7e3f6a2b9c5d1e8f4a7b3c6d2e9f5a1b8c4d7e3f6a2b9c5d1e8f4a7b3c6d2e9f5a1b8c4',
        JWT_REFRESH_EXPIRE: '30d',
        FRONTEND_URL: 'https://claudyne.com',
        CORS_ORIGIN: 'https://claudyne.com'
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
        DB_HOST: 'localhost',
        DB_PORT: '5432',
        DB_NAME: 'claudyne_production',
        DB_USER: 'claudyne_user',
        DB_PASSWORD: 'aujourdhui18D@',
        TZ: 'Africa/Douala'
      },
      env_production: {
        NODE_ENV: 'production',
        DB_HOST: 'localhost',
        DB_PORT: '5432',
        DB_NAME: 'claudyne_production',
        DB_USER: 'claudyne_user',
        DB_PASSWORD: 'aujourdhui18D@',
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