/**
 * Configuration PM2 pour Production Claudyne
 * "La force du savoir en héritage"
 * En hommage à Meffo Mehtah Tchandjio Claudine 👨‍👩‍👧‍👦
 */

module.exports = {
  apps: [
    {
      // ===== FRONTEND SERVER =====
      name: 'claudyne-frontend',
      script: 'server.js',
      cwd: '/var/www/claudyne/claudyne-platform',
      
      // Configuration des instances
      instances: 'max', // Utilise tous les CPU disponibles
      exec_mode: 'cluster',
      
      // Variables d'environnement
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        
        // Optimisations performance
        UV_THREADPOOL_SIZE: 128,
        NODE_OPTIONS: '--max-old-space-size=2048'
      },
      
      // Gestion des logs
      log_file: './logs/frontend-combined.log',
      out_file: './logs/frontend-out.log',
      error_file: './logs/frontend-err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true,
      
      // Auto-restart et monitoring
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
      
      // Surveillance de fichiers (désactivé en production)
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.git'],
      
      // Autres options
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      
      // Scripts de hooks
      post_update: ['npm ci --only=production'],
      
      // Métadonnées
      instance_var: 'INSTANCE_ID',
      source_map_support: false
    },
    
    {
      // ===== BACKEND API SERVER =====
      name: 'claudyne-backend',
      script: 'src/server.js',
      cwd: '/var/www/claudyne/claudyne-platform/backend',
      
      // Configuration des instances (API généralement en single)
      instances: 1,
      exec_mode: 'fork',
      
      // Variables d'environnement
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        
        // Base de données
        DB_HOST: 'localhost',
        DB_PORT: 5432,
        DB_NAME: 'claudyne_prod',
        DB_USER: 'claudyne_user',
        
        // Redis
        REDIS_HOST: 'localhost',
        REDIS_PORT: 6379,
        
        // Sécurité
        JWT_EXPIRES_IN: '24h',
        
        // API externes
        API_URL: 'https://claudyne.com/api',
        APP_URL: 'https://claudyne.com',
        
        // Email
        EMAIL_HOST: 'smtp.gmail.com',
        EMAIL_PORT: 587,
        
        // Logs
        LOG_LEVEL: 'info',
        
        // Optimisations
        UV_THREADPOOL_SIZE: 64,
        NODE_OPTIONS: '--max-old-space-size=1024'
      },
      
      // Gestion des logs
      log_file: './logs/backend-combined.log',
      out_file: './logs/backend-out.log',
      error_file: './logs/backend-err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true,
      
      // Auto-restart et monitoring
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '800M',
      
      // Surveillance de fichiers (désactivé en production)
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.git'],
      
      // Autres options
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      
      // Scripts de hooks
      post_update: ['npm ci --only=production', 'npx sequelize-cli db:migrate'],
      
      // Métadonnées
      source_map_support: false
    }
  ],
  
  // ===== CONFIGURATION GLOBALE PM2 =====
  deploy: {
    production: {
      user: 'claudyne',
      host: ['claudyne.com'],
      ref: 'origin/main',
      repo: 'https://github.com/claudyne.com/claudyne-platform.git',
      path: '/var/www/claudyne',
      
      // Commandes de déploiement
      'pre-deploy-local': '',
      'post-deploy': [
        'npm install',
        'cd backend && npm install',
        'cd backend && npx sequelize-cli db:migrate',
        'pm2 reload ecosystem.production.config.js --env production',
        'pm2 save'
      ].join(' && '),
      
      // Variables d'environnement pour le déploiement
      env: {
        NODE_ENV: 'production'
      }
    }
  },
  
  // ===== CONFIGURATION MONITORING =====
  monit: {
    // Interface web PM2 Plus (optionnel)
    // pm2_web_interface: true,
    // pm2_web_port: 9615,
    
    // Monitoring système
    system_monitoring: true,
    
    // Alertes (nécessite PM2 Plus)
    // alerts: {
    //   cpu: {
    //     threshold: 80,
    //     actions: ['restart']
    //   },
    //   memory: {
    //     threshold: '800MB',
    //     actions: ['restart']
    //   }
    // }
  },
  
  // ===== CONFIGURATION LOGS =====
  log_config: {
    // Rotation automatique des logs
    log_type: 'json',
    
    // Taille maximum des fichiers de logs
    max_size: '10M',
    
    // Nombre de fichiers de logs à conserver
    retain: 7,
    
    // Compression des anciens logs
    compress: true,
    
    // Format des dates dans les logs
    dateFormat: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Logs au format JSON pour faciliter le parsing
    format_logs: true
  },
  
  // ===== MÉTADONNÉES =====
  metadata: {
    name: 'Claudyne Educational Platform',
    description: 'Plateforme éducative camerounaise - La force du savoir en héritage',
    version: '1.2.0',
    author: 'Équipe Claudyne <dev@claudyne.com>',
    tribute: 'En hommage à Meffo Mehtah Tchandjio Claudine 👨‍👩‍👧‍👦',
    website: 'https://claudyne.com',
    
    // Configuration spécifique Cameroun
    target_market: 'Cameroun',
    optimization: ['2G', '3G', 'Mobile-first', 'Low-bandwidth'],
    languages: ['French', 'English'],
    currency: 'FCFA (XAF)',
    timezone: 'Africa/Douala',
    
    // Fonctionnalités
    features: {
      pwa: true,
      offline_mode: true,
      service_worker: true,
      mobile_payments: ['MTN Mobile Money', 'Orange Money'],
      network_optimization: true,
      family_management: true,
      gamification: 'Prix Claudine',
      glassmorphism_ui: true
    },
    
    // Contacts support
    support: {
      email: 'support@claudyne.com',
      technical: 'dev@claudyne.com',
      emergency: '+237 XXX XXX XXX'
    }
  }
};