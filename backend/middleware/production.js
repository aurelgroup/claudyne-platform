/**
 * CLAUDYNE PRODUCTION MIDDLEWARE
 * Middleware expert optimisé pour la production Cameroun
 */

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

class ProductionMiddleware {
    constructor(config) {
        this.config = config;
        this.setupLogging();
    }

    // ================================
    // LOGGING OPTIMISÉ
    // ================================
    setupLogging() {
        // Créer répertoire logs
        const logsDir = path.dirname(this.config.logging.paths.combined);
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }

        // Streams de logs
        this.accessLogStream = fs.createWriteStream(this.config.logging.paths.access, { flags: 'a' });
        this.errorLogStream = fs.createWriteStream(this.config.logging.paths.error, { flags: 'a' });
    }

    // ================================
    // SECURITY MIDDLEWARE
    // ================================
    security() {
        return [
            // Helmet sécurité
            helmet(this.config.security.helmet),

            // Rate limiting adapté Cameroun (réseau lent)
            rateLimit({
                ...this.config.security.rateLimit,
                standardHeaders: true,
                legacyHeaders: false,
                handler: (req, res) => {
                    res.status(429).json({
                        success: false,
                        message: 'Trop de requêtes. Veuillez patienter.',
                        retryAfter: Math.ceil(this.config.security.rateLimit.windowMs / 1000)
                    });
                }
            }),

            // Validation des headers
            (req, res, next) => {
                // Bloquer les user-agents suspects
                const userAgent = req.get('User-Agent') || '';
                const suspiciousAgents = ['curl', 'wget', 'python', 'bot'];

                if (suspiciousAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
                    // Permettre curl en développement
                    if (process.env.NODE_ENV !== 'production' || req.path.includes('/health')) {
                        return next();
                    }
                    return res.status(403).json({
                        success: false,
                        message: 'Accès non autorisé'
                    });
                }
                next();
            }
        ];
    }

    // ================================
    // PERFORMANCE MIDDLEWARE
    // ================================
    performance() {
        return [
            // Compression optimisée Cameroun
            compression({
                ...this.config.performance.compression,
                filter: (req, res) => {
                    // Ne pas compresser les images
                    if (req.headers['content-type']?.startsWith('image/')) {
                        return false;
                    }
                    return compression.filter(req, res);
                }
            }),

            // Cache headers intelligents
            (req, res, next) => {
                const staticPaths = ['/css/', '/js/', '/images/', '/fonts/'];
                const isStatic = staticPaths.some(path => req.path.includes(path));

                if (isStatic) {
                    res.set('Cache-Control', 'public, max-age=31536000'); // 1 an
                } else if (req.path.includes('/api/')) {
                    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
                } else {
                    res.set('Cache-Control', 'public, max-age=3600'); // 1 heure
                }
                next();
            },

            // Timeout adapté aux réseaux lents
            (req, res, next) => {
                req.setTimeout(this.config.performance.timeouts.request);
                next();
            }
        ];
    }

    // ================================
    // LOGGING MIDDLEWARE
    // ================================
    logging() {
        return [
            // Morgan access logs
            morgan('combined', {
                stream: this.accessLogStream,
                skip: (req, res) => req.path === '/health' || req.path === '/api/ping'
            }),

            // Morgan console en développement
            process.env.NODE_ENV !== 'production' ? morgan('dev') : (req, res, next) => next(),

            // Error logging
            (err, req, res, next) => {
                if (err) {
                    const errorLog = {
                        timestamp: new Date().toISOString(),
                        error: err.message,
                        stack: err.stack,
                        url: req.url,
                        method: req.method,
                        ip: req.ip,
                        userAgent: req.get('User-Agent')
                    };

                    this.errorLogStream.write(JSON.stringify(errorLog) + '\n');
                }
                next(err);
            }
        ];
    }

    // ================================
    // MOBILE OPTIMIZATION
    // ================================
    mobileOptimization() {
        return [
            (req, res, next) => {
                const isMobile = req.headers['x-mobile'] === 'true' ||
                                req.path.includes('/mobile-api/');

                if (isMobile) {
                    // Headers spécifiques mobile
                    res.set('X-Mobile-Optimized', 'true');
                    res.set('Vary', 'User-Agent');

                    // Compression plus agressive pour mobile
                    if (this.config.performance.mobile.compression) {
                        res.set('Content-Encoding', 'gzip');
                    }

                    // Cache plus long pour mobile (réseau lent)
                    res.set('Cache-Control', `public, max-age=${this.config.performance.mobile.cacheTtl}`);
                }
                next();
            }
        ];
    }

    // ================================
    // CAMEROUN SPECIFIC
    // ================================
    cameroonOptimization() {
        return [
            // Géolocalisation Cameroun
            (req, res, next) => {
                const country = req.headers['x-country'] || req.headers['cf-ipcountry'];
                if (country === 'CM') {
                    res.set('X-Optimized-For', 'Cameroon');
                    res.set('X-Currency', 'XAF');
                    res.set('X-Timezone', 'Africa/Douala');
                }
                next();
            },

            // Optimisation réseau 2G/3G
            (req, res, next) => {
                const connection = req.headers['x-connection'] || 'unknown';
                if (['2g', '3g', 'slow-2g'].includes(connection.toLowerCase())) {
                    // Réduire la taille des réponses
                    res.locals.networkOptimized = true;
                    res.set('X-Network-Optimized', 'true');
                }
                next();
            }
        ];
    }

    // ================================
    // ERROR HANDLING
    // ================================
    errorHandling() {
        return [
            // 404 Handler
            (req, res, next) => {
                res.status(404).json({
                    success: false,
                    message: `Route non trouvée: ${req.method} ${req.path}`,
                    timestamp: new Date().toISOString(),
                    requestId: req.id || 'unknown'
                });
            },

            // Global Error Handler
            (err, req, res, next) => {
                console.error('❌ Erreur production:', err);

                // Ne pas exposer les erreurs en production
                const isDev = process.env.NODE_ENV !== 'production';

                res.status(err.status || 500).json({
                    success: false,
                    message: isDev ? err.message : 'Erreur serveur interne',
                    timestamp: new Date().toISOString(),
                    requestId: req.id || 'unknown',
                    ...(isDev && { stack: err.stack })
                });
            }
        ];
    }

    // ================================
    // HEALTH MONITORING
    // ================================
    healthMonitoring() {
        return [
            (req, res, next) => {
                // Mesurer le temps de réponse
                req.startTime = Date.now();

                res.on('finish', () => {
                    const responseTime = Date.now() - req.startTime;

                    // Logger les requêtes lentes
                    if (responseTime > this.config.monitoring.alerts.responseTimeThreshold) {
                        console.warn(`⚠️ Requête lente: ${req.method} ${req.path} - ${responseTime}ms`);
                    }
                });

                next();
            }
        ];
    }

    // ================================
    // SETUP COMPLET
    // ================================
    apply(app) {
        console.log('🔧 Application des middlewares de production...');

        // Ordre important des middlewares
        app.use(this.healthMonitoring());
        app.use(this.security());
        app.use(this.performance());
        app.use(this.logging());
        app.use(this.mobileOptimization());
        app.use(this.cameroonOptimization());

        console.log('✅ Middlewares de production appliqués');
        return this;
    }

    applyErrorHandling(app) {
        app.use(this.errorHandling());
        console.log('✅ Gestion d\'erreurs de production appliquée');
        return this;
    }
}

module.exports = ProductionMiddleware;