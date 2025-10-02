/**
 * CLAUDYNE PRODUCTION CONFIGURATION
 * Configuration experte optimisée pour le Cameroun
 */

const dotenv = require('dotenv');
const path = require('path');

// Charger variables d'environnement
dotenv.config({ path: path.join(__dirname, '../../.env.production') });

const config = {
    // ================================
    // CORE SETTINGS
    // ================================
    app: {
        name: 'Claudyne Production',
        version: '2.0.0',
        environment: 'production',
        port: parseInt(process.env.PORT) || 3001,
        mobilePort: parseInt(process.env.MOBILE_PORT) || 3002,
        timezone: process.env.TIMEZONE || 'Africa/Douala',
        locale: process.env.LOCALE || 'fr_CM'
    },

    // ================================
    // DATABASE OPTIMIZED
    // ================================
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME || 'claudyne_production',
        username: process.env.DB_USER || 'claudyne_user',
        password: process.env.DB_PASSWORD,
        ssl: process.env.DB_SSL === 'true',
        pool: {
            min: parseInt(process.env.DB_POOL_MIN) || 2,
            max: parseInt(process.env.DB_POOL_MAX) || 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: parseInt(process.env.DB_TIMEOUT) || 30000
        },
        options: {
            charset: 'utf8',
            timezone: '+01:00', // UTC+1 Cameroun
            logging: false, // Disable en production
            benchmark: false,
            define: {
                underscored: true,
                freezeTableName: true,
                charset: 'utf8',
                dialectOptions: {
                    collate: 'utf8_general_ci'
                }
            }
        }
    },

    // ================================
    // SECURITY PRODUCTION
    // ================================
    security: {
        jwt: {
            secret: process.env.JWT_SECRET,
            expiresIn: process.env.JWT_EXPIRES_IN || '7d',
            algorithm: 'HS256'
        },
        bcrypt: {
            rounds: parseInt(process.env.BCRYPT_ROUNDS) || 12
        },
        rateLimit: {
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000, // 15 min
            max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
            message: 'Trop de requêtes, réessayez plus tard'
        },
        cors: {
            origin: process.env.CORS_ORIGIN?.split(',') || ['https://claudyne.com'],
            credentials: process.env.CORS_CREDENTIALS === 'true',
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
        },
        helmet: {
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
                    styleSrcElem: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
                    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdnjs.cloudflare.com"],
                    scriptSrcElem: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
                    imgSrc: ["'self'", "data:", "https:", "https://i.ibb.co"],
                    connectSrc: ["'self'", "https://claudyne.com"],
                    fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"]
                }
            },
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true
            }
        }
    },

    // ================================
    // PERFORMANCE CAMEROUN
    // ================================
    performance: {
        compression: {
            level: parseInt(process.env.COMPRESSION_LEVEL) || 6,
            threshold: 1024,
            filter: (req, res) => {
                if (req.headers['x-no-compression']) return false;
                return true;
            }
        },
        cache: {
            ttl: parseInt(process.env.CACHE_TTL) || 3600,
            checkperiod: 600
        },
        timeouts: {
            request: parseInt(process.env.REQUEST_TIMEOUT) || 30000,
            keepAlive: parseInt(process.env.KEEP_ALIVE_TIMEOUT) || 65000
        },
        mobile: {
            compression: process.env.MOBILE_COMPRESSION === 'true',
            cacheTtl: parseInt(process.env.MOBILE_CACHE_TTL) || 7200,
            responseLimit: parseInt(process.env.MOBILE_RESPONSE_LIMIT) || 50000
        }
    },

    // ================================
    // SYNCHRONIZATION
    // ================================
    sync: {
        enabled: process.env.AUTO_SYNC_ENABLED === 'true',
        interval: parseInt(process.env.AUTO_SYNC_INTERVAL) || 5, // minutes
        retryAttempts: parseInt(process.env.SYNC_RETRY_ATTEMPTS) || 3,
        backupEnabled: process.env.SYNC_BACKUP_ENABLED === 'true',
        jsonPath: path.join(__dirname, '../../data/users.json'),
        backupPath: path.join(__dirname, '../../backups')
    },

    // ================================
    // LOGGING PRODUCTION
    // ================================
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        file: process.env.LOG_FILE === 'true',
        rotation: process.env.LOG_ROTATION || 'daily',
        maxFiles: parseInt(process.env.LOG_MAX_FILES) || 30,
        format: 'combined',
        paths: {
            access: path.join(__dirname, '../../logs/access.log'),
            error: path.join(__dirname, '../../logs/error.log'),
            combined: path.join(__dirname, '../../logs/combined.log')
        }
    },

    // ================================
    // MONITORING
    // ================================
    monitoring: {
        healthCheck: {
            interval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 60000,
            endpoints: [
                '/api/health',
                '/api/ping',
                '/mobile-api/ping'
            ]
        },
        metrics: {
            enabled: process.env.METRICS_ENABLED === 'true',
            interval: 300000, // 5 minutes
            retention: 86400000 // 24 heures
        },
        alerts: {
            errorThreshold: 10,
            responseTimeThreshold: 5000,
            cpuThreshold: 80,
            memoryThreshold: 85
        }
    },

    // ================================
    // EMAIL CONFIGURATION
    // ================================
    email: {
        smtp: {
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        },
        from: {
            name: 'Claudyne',
            address: 'support@claudyne.com'
        },
        templates: {
            welcome: path.join(__dirname, '../templates/welcome.html'),
            reset: path.join(__dirname, '../templates/reset.html'),
            notification: path.join(__dirname, '../templates/notification.html')
        }
    },

    // ================================
    // CAMEROUN SPECIFICS
    // ================================
    cameroon: {
        currency: 'XAF',
        defaultRegion: 'Centre',
        educationLevels: [
            'CP', 'CE1', 'CE2', 'CM1', 'CM2',
            '6EME', '5EME', '4EME', '3EME',
            '2NDE', '1ERE', 'TALE'
        ],
        subjects: [
            'MATH', 'FRANCAIS', 'ANGLAIS', 'SVT',
            'PHYSIQUE', 'HISTOIRE', 'ECM', 'EPS'
        ],
        payments: {
            mtn: {
                enabled: true,
                apiKey: process.env.MTN_MOMO_API_KEY,
                fees: 0.01 // 1%
            },
            orange: {
                enabled: true,
                apiKey: process.env.ORANGE_MONEY_API_KEY,
                fees: 0.015 // 1.5%
            }
        }
    },

    // ================================
    // URLS PRODUCTION
    // ================================
    urls: {
        frontend: process.env.FRONTEND_URL || 'https://claudyne.com',
        backend: process.env.BACKEND_URL || 'https://claudyne.com/api',
        mobileApi: process.env.MOBILE_API_URL || 'https://claudyne.com/mobile-api',
        cdn: process.env.CDN_URL || 'https://cdn.claudyne.com',
        webhook: process.env.PAYMENT_WEBHOOK_SECRET
    },

    // ================================
    // BACKUP CONFIGURATION
    // ================================
    backup: {
        enabled: process.env.BACKUP_ENABLED === 'true',
        interval: parseInt(process.env.BACKUP_INTERVAL) || 86400000, // 24h
        retention: parseInt(process.env.BACKUP_RETENTION) || 30, // jours
        destinations: {
            local: path.join(__dirname, '../../backups'),
            remote: process.env.BACKUP_REMOTE_PATH
        },
        compression: true,
        encryption: true
    }
};

// ================================
// VALIDATION CONFIGURATION
// ================================
function validateConfig() {
    const required = [
        'DB_PASSWORD',
        'JWT_SECRET'
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        throw new Error(`Variables d'environnement manquantes: ${missing.join(', ')}`);
    }

    // Validation JWT secret
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
        throw new Error('JWT_SECRET doit faire au moins 32 caractères');
    }

    console.log('✅ Configuration production validée');
}

// Valider au chargement
validateConfig();

module.exports = config;