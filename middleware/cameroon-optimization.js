/**
 * ⚡ OPTIMISATIONS SPÉCIFIQUES CAMEROUN
 * Middleware pour réseaux 2G/3G et mobile money
 */

const compression = require('compression');
const logger = require('../utils/logger');

class CameroonOptimization {
  constructor() {
    this.networkProfiles = {
      '2g': {
        compressionLevel: 9,
        maxPayloadSize: 50000,  // 50KB max
        cacheTime: 7200,       // 2h cache
        batchSize: 5
      },
      '3g': {
        compressionLevel: 6,
        maxPayloadSize: 200000, // 200KB max
        cacheTime: 3600,       // 1h cache
        batchSize: 15
      },
      '4g': {
        compressionLevel: 3,
        maxPayloadSize: 1000000, // 1MB max
        cacheTime: 1800,        // 30min cache
        batchSize: 50
      },
      'wifi': {
        compressionLevel: 1,
        maxPayloadSize: 5000000, // 5MB max
        cacheTime: 900,         // 15min cache
        batchSize: 100
      }
    };

    this.regions = {
      'Centre': { timezone: 'Africa/Douala', currency: 'XAF' },
      'Littoral': { timezone: 'Africa/Douala', currency: 'XAF' },
      'Ouest': { timezone: 'Africa/Douala', currency: 'XAF' },
      'Nord-Ouest': { timezone: 'Africa/Douala', currency: 'XAF' },
      'Sud-Ouest': { timezone: 'Africa/Douala', currency: 'XAF' },
      'Nord': { timezone: 'Africa/Douala', currency: 'XAF' },
      'Adamaoua': { timezone: 'Africa/Douala', currency: 'XAF' },
      'Est': { timezone: 'Africa/Douala', currency: 'XAF' },
      'Sud': { timezone: 'Africa/Douala', currency: 'XAF' },
      'Extrême-Nord': { timezone: 'Africa/Douala', currency: 'XAF' }
    };
  }

  // 🌍 DÉTECTION RÉSEAU INTELLIGENT
  detectNetworkQuality(req) {
    // Headers de détection réseau
    const connection = req.headers['x-connection']?.toLowerCase() ||
                      req.headers['connection-type']?.toLowerCase() ||
                      'unknown';

    const userAgent = req.headers['user-agent'] || '';
    const acceptEncoding = req.headers['accept-encoding'] || '';

    // Analyse user agent pour mobile
    const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);
    const isLowEnd = /android 4|android 5|windows phone/i.test(userAgent);

    // Détection réseau par headers
    if (['2g', 'slow-2g', 'edge'].includes(connection)) {
      return '2g';
    } else if (['3g', 'hspa'].includes(connection)) {
      return '3g';
    } else if (['4g', 'lte'].includes(connection)) {
      return '4g';
    } else if (connection === 'wifi') {
      return 'wifi';
    }

    // Fallback : estimation par device
    if (isLowEnd || !acceptEncoding.includes('gzip')) {
      return '2g';
    } else if (isMobile) {
      return '3g';
    } else {
      return '4g';
    }
  }

  // 🎯 COMPRESSION ADAPTATIVE MIDDLEWARE
  adaptiveCompression() {
    return (req, res, next) => {
      const networkType = this.detectNetworkQuality(req);
      const profile = this.networkProfiles[networkType];

      // Configuration compression dynamique
      compression({
        level: profile.compressionLevel,
        threshold: 1024,
        filter: (req, res) => {
          // Skip compression pour certains types
          if (req.headers['x-no-compression']) return false;
          if (res.getHeader('content-type')?.startsWith('image/')) return false;
          return true;
        }
      })(req, res, () => {
        // Headers informatifs
        res.set('X-Network-Detected', networkType);
        res.set('X-Compression-Level', profile.compressionLevel);
        res.set('X-Max-Payload', profile.maxPayloadSize);

        // Limite taille réponse
        res.locals.maxPayloadSize = profile.maxPayloadSize;
        res.locals.networkProfile = profile;
        res.locals.networkType = networkType;

        logger.cameroon('Réseau détecté', req.headers['x-region'] || 'Centre', {
          networkType,
          compression: profile.compressionLevel,
          userAgent: req.headers['user-agent']
        });

        next();
      });
    };
  }

  // 📱 OPTIMISATION MOBILE MONEY
  mobileMoneyOptimization() {
    return (req, res, next) => {
      if (req.path.includes('/payment') || req.path.includes('/mobile-money')) {
        const networkType = res.locals.networkType || '3g';
        const profile = res.locals.networkProfile || this.networkProfiles['3g'];

        // Headers spécifiques mobile money
        res.set('X-Mobile-Money-Optimized', 'true');
        res.set('X-Batch-Size', profile.batchSize);

        // Cache plus long pour les opérations lentes
        if (networkType === '2g') {
          res.set('Cache-Control', 'public, max-age=14400'); // 4h pour 2G
        } else {
          res.set('Cache-Control', 'public, max-age=3600');  // 1h normal
        }

        logger.payment('Mobile Money request optimized', req.body?.transactionId, {
          networkType,
          batchSize: profile.batchSize
        });
      }

      next();
    };
  }

  // 🏫 OPTIMISATION CONTENU ÉDUCATIF
  educationalContentOptimization() {
    return (req, res, next) => {
      if (req.path.includes('/lessons') || req.path.includes('/subjects')) {
        const networkType = res.locals.networkType || '3g';
        const profile = res.locals.networkProfile || this.networkProfiles['3g'];

        // Ajuster la qualité du contenu
        if (networkType === '2g') {
          req.query.quality = 'low';
          req.query.images = 'compressed';
          req.query.videos = 'disabled';
        } else if (networkType === '3g') {
          req.query.quality = 'medium';
          req.query.images = 'optimized';
          req.query.videos = 'low';
        }

        // Headers éducatifs
        res.set('X-Education-Optimized', 'true');
        res.set('X-Content-Quality', req.query.quality);

        logger.student('Contenu éducatif optimisé', req.query.student_id, {
          networkType,
          quality: req.query.quality
        });
      }

      next();
    };
  }

  // 🌍 LOCALISATION CAMEROUN
  cameroonLocalization() {
    return (req, res, next) => {
      const region = req.headers['x-region'] ||
                    req.query.region ||
                    'Centre'; // Défaut Yaoundé

      const regionConfig = this.regions[region] || this.regions['Centre'];

      // Headers de localisation
      res.set('X-Region', region);
      res.set('X-Timezone', regionConfig.timezone);
      res.set('X-Currency', regionConfig.currency);
      res.set('X-Country', 'CM');

      // Variables locales
      res.locals.region = region;
      res.locals.timezone = regionConfig.timezone;
      res.locals.currency = regionConfig.currency;

      // Formatage dates en heure locale
      res.locals.formatDate = (date) => {
        return new Intl.DateTimeFormat('fr-CM', {
          timeZone: regionConfig.timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }).format(new Date(date));
      };

      // Formatage currency XAF
      res.locals.formatCurrency = (amount) => {
        return new Intl.NumberFormat('fr-CM', {
          style: 'currency',
          currency: 'XAF',
          minimumFractionDigits: 0
        }).format(amount);
      };

      next();
    };
  }

  // 🔄 CACHE INTELLIGENT POUR RÉSEAUX LENTS
  intelligentCaching() {
    return (req, res, next) => {
      const networkType = res.locals.networkType || '3g';
      const profile = res.locals.networkProfile || this.networkProfiles['3g'];

      // Stratégies de cache par type de contenu
      if (req.path.includes('/static/') || req.path.includes('/images/')) {
        // Assets statiques : cache très long
        res.set('Cache-Control', 'public, max-age=31536000'); // 1 an
        res.set('ETag', true);
      } else if (req.path.includes('/api/lessons/') || req.path.includes('/api/subjects/')) {
        // Contenu éducatif : cache adaptatif
        res.set('Cache-Control', `public, max-age=${profile.cacheTime}`);
      } else if (req.path.includes('/api/families/') || req.path.includes('/api/students/')) {
        // Données utilisateur : cache court
        res.set('Cache-Control', 'private, max-age=300'); // 5 min
      } else {
        // API générale : pas de cache
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      }

      next();
    };
  }

  // 📊 MONITORING PERFORMANCE CAMEROUN
  performanceMonitoring() {
    return (req, res, next) => {
      const startTime = Date.now();

      res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        const networkType = res.locals.networkType;
        const region = res.locals.region;

        // Métriques par région et réseau
        const metrics = {
          responseTime,
          networkType,
          region,
          statusCode: res.statusCode,
          contentLength: res.get('Content-Length') || 0,
          url: req.path
        };

        // Alertes performance selon réseau
        const thresholds = {
          '2g': 5000,  // 5s max pour 2G
          '3g': 3000,  // 3s max pour 3G
          '4g': 1000,  // 1s max pour 4G
          'wifi': 500  // 500ms max pour WiFi
        };

        if (responseTime > thresholds[networkType]) {
          logger.alert('warning', `Requête lente ${networkType}`, metrics);
        }

        logger.performance('Request performance', responseTime, metrics);
      });

      next();
    };
  }

  // 🎯 PIPELINE COMPLET D'OPTIMISATION
  getOptimizationPipeline() {
    return [
      this.adaptiveCompression(),
      this.cameroonLocalization(),
      this.intelligentCaching(),
      this.mobileMoneyOptimization(),
      this.educationalContentOptimization(),
      this.performanceMonitoring()
    ];
  }

  // 📈 MÉTRIQUES CAMEROUN
  getCameroonMetrics() {
    return {
      supportedNetworks: Object.keys(this.networkProfiles),
      supportedRegions: Object.keys(this.regions),
      optimizations: [
        'Compression adaptative',
        'Cache intelligent',
        'Mobile Money optimisé',
        'Contenu éducatif adaptatif',
        'Localisation complète'
      ]
    };
  }
}

module.exports = new CameroonOptimization();