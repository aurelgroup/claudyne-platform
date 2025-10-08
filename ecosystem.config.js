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
        PORT: 3001
        // Secrets loaded from .env.production via dotenv in server.js
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
        // Secrets loaded from .env.production via dotenv in server.js
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
        TZ: 'Africa/Douala'
        // DB secrets loaded from .env.production via dotenv in subscriptionCron.js
      },
      env_production: {
        NODE_ENV: 'production',
        TZ: 'Africa/Douala'
        // DB secrets loaded from .env.production via dotenv in subscriptionCron.js
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