/**
 * COMPRESSION ADAPTATIVE CAMEROUN
 * Optimisation spéciale pour réseaux 2G/3G camerounais
 * Détection automatique et adaptation intelligente
 */

const compression = require('compression');
const zlib = require('zlib');

class CameroonCompressionMiddleware {
    constructor() {
        this.networkProfiles = {
            '2G-slow': {
                compressionLevel: 9,    // Maximum compression
                threshold: 512,         // 512 bytes minimum
                chunkSize: 4096,       // Small chunks for 2G
                timeout: 30000,        // 30s timeout
                priority: 'compression' // Favor compression over speed
            },
            '2G-regular': {
                compressionLevel: 8,
                threshold: 1024,
                chunkSize: 8192,
                timeout: 20000,
                priority: 'compression'
            },
            '3G-slow': {
                compressionLevel: 6,
                threshold: 1024,
                chunkSize: 16384,
                timeout: 15000,
                priority: 'balanced'
            },
            '3G-regular': {
                compressionLevel: 4,
                threshold: 2048,
                chunkSize: 32768,
                timeout: 10000,
                priority: 'speed'
            },
            '4G+': {
                compressionLevel: 2,
                threshold: 4096,
                chunkSize: 65536,
                timeout: 5000,
                priority: 'speed'
            }
        };

        this.compressionStats = {
            totalRequests: 0,
            compressedRequests: 0,
            totalSavings: 0,
            networkBreakdown: {}
        };
    }

    // ================================
    // DÉTECTION QUALITÉ RÉSEAU
    // ================================
    detectNetworkQuality(req) {
        // Méthode 1: Header explicite du client
        const clientNetwork = req.headers['x-network-quality'];
        if (clientNetwork && this.networkProfiles[clientNetwork]) {
            return clientNetwork;
        }

        // Méthode 2: User-Agent mobile detection
        const userAgent = req.headers['user-agent'] || '';
        const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);

        // Méthode 3: Connection header (si disponible)
        const connection = req.headers['x-connection-type'];
        if (connection) {
            switch (connection.toLowerCase()) {
                case 'slow-2g': return '2G-slow';
                case '2g': return '2G-regular';
                case 'slow-3g': return '3G-slow';
                case '3g': return '3G-regular';
                default: return isMobile ? '3G-regular' : '4G+';
            }
        }

        // Méthode 4: Géolocalisation Cameroun (fallback conservateur)
        const country = req.headers['x-country'] || req.headers['cf-ipcountry'];
        if (country === 'CM') {
            // Au Cameroun, présumer réseau plus lent par défaut
            return isMobile ? '2G-regular' : '3G-regular';
        }

        // Fallback: Assumer 3G regular
        return isMobile ? '3G-regular' : '4G+';
    }

    // ================================
    // COMPRESSION INTELLIGENTE
    // ================================
    getCompressionStrategy(networkQuality, contentType, contentSize) {
        const profile = this.networkProfiles[networkQuality];

        // Skip compression for small content
        if (contentSize < profile.threshold) {
            return { shouldCompress: false, reason: 'below_threshold' };
        }

        // Skip compression for already compressed content
        const precompressedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'video/', 'audio/', 'application/zip', 'application/gzip'
        ];

        if (precompressedTypes.some(type => contentType.includes(type))) {
            return { shouldCompress: false, reason: 'precompressed' };
        }

        // Highly compressible content types
        const highlyCompressible = [
            'text/html', 'text/css', 'text/javascript', 'application/javascript',
            'application/json', 'text/xml', 'application/xml', 'text/plain'
        ];

        const isHighlyCompressible = highlyCompressible.some(type =>
            contentType.includes(type)
        );

        return {
            shouldCompress: true,
            level: isHighlyCompressible ? profile.compressionLevel : Math.max(1, profile.compressionLevel - 2),
            chunkSize: profile.chunkSize,
            priority: profile.priority
        };
    }

    // ================================
    // MIDDLEWARE PRINCIPAL
    // ================================
    middleware() {
        return (req, res, next) => {
            this.compressionStats.totalRequests++;

            // Détecter qualité réseau
            const networkQuality = this.detectNetworkQuality(req);
            req.networkQuality = networkQuality;

            // Statistiques par réseau
            if (!this.compressionStats.networkBreakdown[networkQuality]) {
                this.compressionStats.networkBreakdown[networkQuality] = {
                    requests: 0,
                    compressed: 0,
                    savings: 0
                };
            }
            this.compressionStats.networkBreakdown[networkQuality].requests++;

            // Headers informatifs
            res.set('X-Network-Detected', networkQuality);
            res.set('X-Cameroon-Optimized', 'true');

            // Override de res.send pour compression intelligente
            const originalSend = res.send;
            const originalJson = res.json;
            const self = this;

            res.send = function(data) {
                return self.smartCompress(this, data, originalSend.bind(this), networkQuality);
            };

            res.json = function(obj) {
                const jsonData = JSON.stringify(obj);
                return self.smartCompress(this, jsonData, (compressedData) => {
                    this.set('Content-Type', 'application/json');
                    return originalSend.call(this, compressedData);
                }, networkQuality);
            };

            next();
        };
    }

    // ================================
    // COMPRESSION INTELLIGENTE
    // ================================
    smartCompress(res, data, originalMethod, networkQuality) {
        const contentType = res.get('Content-Type') || 'text/plain';
        const contentSize = Buffer.byteLength(data, 'utf8');

        const strategy = this.getCompressionStrategy(networkQuality, contentType, contentSize);

        if (!strategy.shouldCompress) {
            res.set('X-Compression-Skipped', strategy.reason);
            return originalMethod(data);
        }

        // Vérifier si le client accepte la compression
        const acceptEncoding = res.req.headers['accept-encoding'] || '';

        if (acceptEncoding.includes('gzip')) {
            return this.compressGzip(res, data, originalMethod, strategy, networkQuality);
        } else if (acceptEncoding.includes('deflate')) {
            return this.compressDeflate(res, data, originalMethod, strategy, networkQuality);
        } else {
            res.set('X-Compression-Skipped', 'not_accepted');
            return originalMethod(data);
        }
    }

    // ================================
    // COMPRESSION GZIP OPTIMISÉE
    // ================================
    compressGzip(res, data, originalMethod, strategy, networkQuality) {
        const startTime = Date.now();

        zlib.gzip(data, {
            level: strategy.level,
            chunkSize: strategy.chunkSize,
            windowBits: 15, // Maximum pour meilleure compression
            memLevel: 8,    // Balance mémoire/vitesse
        }, (err, compressed) => {
            if (err) {
                console.warn('⚠️ Erreur compression GZIP:', err.message);
                res.set('X-Compression-Error', 'gzip_failed');
                return originalMethod(data);
            }

            const compressionTime = Date.now() - startTime;
            const originalSize = Buffer.byteLength(data, 'utf8');
            const compressedSize = compressed.length;
            const savings = originalSize - compressedSize;
            const ratio = ((savings / originalSize) * 100).toFixed(2);

            // Statistiques
            this.compressionStats.compressedRequests++;
            this.compressionStats.totalSavings += savings;
            this.compressionStats.networkBreakdown[networkQuality].compressed++;
            this.compressionStats.networkBreakdown[networkQuality].savings += savings;

            // Headers informatifs
            res.set('Content-Encoding', 'gzip');
            res.set('Content-Length', compressedSize.toString());
            res.set('X-Original-Size', originalSize.toString());
            res.set('X-Compressed-Size', compressedSize.toString());
            res.set('X-Compression-Ratio', ratio + '%');
            res.set('X-Compression-Time', compressionTime + 'ms');
            res.set('X-Compression-Level', strategy.level.toString());

            // Log pour réseaux très lents
            if (networkQuality.includes('2G') && compressionTime > 1000) {
                console.log(`📶 Compression 2G: ${ratio}% savings, ${compressionTime}ms`);
            }

            return originalMethod(compressed);
        });
    }

    // ================================
    // COMPRESSION DEFLATE
    // ================================
    compressDeflate(res, data, originalMethod, strategy, networkQuality) {
        zlib.deflate(data, {
            level: strategy.level,
            chunkSize: strategy.chunkSize
        }, (err, compressed) => {
            if (err) {
                console.warn('⚠️ Erreur compression DEFLATE:', err.message);
                res.set('X-Compression-Error', 'deflate_failed');
                return originalMethod(data);
            }

            const originalSize = Buffer.byteLength(data, 'utf8');
            const compressedSize = compressed.length;
            const savings = originalSize - compressedSize;

            this.compressionStats.compressedRequests++;
            this.compressionStats.totalSavings += savings;

            res.set('Content-Encoding', 'deflate');
            res.set('Content-Length', compressedSize.toString());
            res.set('X-Compression-Method', 'deflate');

            return originalMethod(compressed);
        });
    }

    // ================================
    // COMPRESSION STREAMING (POUR GROS FICHIERS)
    // ================================
    streamCompress(networkQuality) {
        const profile = this.networkProfiles[networkQuality];

        return compression({
            level: profile.compressionLevel,
            threshold: profile.threshold,
            chunkSize: profile.chunkSize,
            filter: (req, res) => {
                // Ne pas compresser si déjà compressé
                const contentEncoding = res.get('Content-Encoding');
                if (contentEncoding) return false;

                // Compresser selon type de contenu
                const contentType = res.get('Content-Type') || '';
                return this.shouldStreamCompress(contentType);
            }
        });
    }

    shouldStreamCompress(contentType) {
        const compressibleTypes = [
            'text/', 'application/json', 'application/javascript',
            'application/xml', 'image/svg+xml'
        ];

        return compressibleTypes.some(type => contentType.includes(type));
    }

    // ================================
    // API STATISTIQUES
    // ================================
    getStats() {
        const totalSavingsKB = (this.compressionStats.totalSavings / 1024).toFixed(2);
        const compressionRate = this.compressionStats.totalRequests > 0 ?
            ((this.compressionStats.compressedRequests / this.compressionStats.totalRequests) * 100).toFixed(2) : 0;

        return {
            ...this.compressionStats,
            totalSavingsKB: parseFloat(totalSavingsKB),
            compressionRate: parseFloat(compressionRate) + '%',
            timestamp: new Date().toISOString()
        };
    }

    // Endpoint pour les stats de compression
    statsEndpoint() {
        return (req, res) => {
            res.json({
                success: true,
                compression_stats: this.getStats(),
                network_profiles: Object.keys(this.networkProfiles),
                cameroon_optimized: true
            });
        };
    }

    // ================================
    // OPTIMISATION MOBILE MONEY
    // ================================
    mobileMoneyCompressionMiddleware() {
        return (req, res, next) => {
            // Compression spéciale pour APIs Mobile Money (critiques au Cameroun)
            if (req.path.includes('mobile-money') || req.path.includes('payment')) {
                // Forcer compression maximale pour économiser data
                req.networkQuality = '2G-slow';
                res.set('X-Mobile-Money-Optimized', 'true');
                res.set('X-Force-Compression', 'true');
            }
            next();
        };
    }
}

module.exports = CameroonCompressionMiddleware;