  require('dotenv').config({ path: '/opt/claudyne/.env.production' });  

  module.exports = {
    apps: [{
      name: 'claudyne-backend',
      script: './src/server.js',
      cwd: '/opt/claudyne/backend',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        DB_HOST: process.env.DB_HOST || 'localhost',
        DB_PORT: process.env.DB_PORT || '5432',
        DB_NAME: process.env.DB_NAME || 'claudyne_production',
        DB_USER: process.env.DB_USER || 'claudyne_user',
        DB_PASSWORD: process.env.DB_PASSWORD,
        JWT_SECRET: process.env.JWT_SECRET,
        FRONTEND_URL: process.env.FRONTEND_URL || 'https://claudyne.com',
        CORS_ORIGIN: process.env.CORS_ORIGIN || 'https://claudyne.com'
      },
      error_file: '/opt/claudyne/logs/backend-error.log',
      out_file: '/opt/claudyne/logs/backend-out.log',
      time: true,
      max_memory_restart: '500M',
      restart_delay: 4000
    }]
  };


