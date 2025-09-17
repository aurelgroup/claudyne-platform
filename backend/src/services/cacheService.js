/**
 * Service de cache Claudyne
 * Gestion cache en mémoire ou Redis selon la configuration
 */

const logger = require('../utils/logger');

class CacheService {
  constructor() {
    this.memoryCache = new Map();
    this.isRedisEnabled = process.env.REDIS_ENABLED === 'true';
    this.isMemoryCacheEnabled = process.env.MEMORY_CACHE_ENABLED === 'true';
    this.defaultTTL = parseInt(process.env.CACHE_TTL) || 300; // 5 minutes

    if (this.isRedisEnabled) {
      this.initRedis();
    } else if (this.isMemoryCacheEnabled) {
      logger.info('🧠 Cache en mémoire activé pour développement');
      this.startCleanupInterval();
    } else {
      logger.warn('⚠️ Aucun système de cache activé');
    }
  }

  async initRedis() {
    try {
      const redis = require('redis');
      this.redisClient = redis.createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        db: process.env.REDIS_DB || 0
      });

      await this.redisClient.connect();
      logger.info('✅ Connexion Redis établie');
    } catch (error) {
      logger.error('❌ Erreur connexion Redis:', error);
      this.isRedisEnabled = false;
      if (this.isMemoryCacheEnabled) {
        logger.info('🔄 Basculement vers cache en mémoire');
        this.startCleanupInterval();
      }
    }
  }

  startCleanupInterval() {
    // Nettoyage automatique toutes les 60 secondes
    setInterval(() => {
      this.cleanupExpired();
    }, 60000);
  }

  cleanupExpired() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, value] of this.memoryCache.entries()) {
      if (value.expiry && now > value.expiry) {
        this.memoryCache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug(`🧹 Nettoyé ${cleaned} entrées expirées du cache`);
    }
  }

  /**
   * Stocke une valeur dans le cache
   */
  async set(key, value, ttl = this.defaultTTL) {
    try {
      if (this.isRedisEnabled && this.redisClient) {
        await this.redisClient.setEx(key, ttl, JSON.stringify(value));
        return true;
      } else if (this.isMemoryCacheEnabled) {
        const expiry = ttl > 0 ? Date.now() + (ttl * 1000) : null;
        this.memoryCache.set(key, {
          value: value,
          expiry: expiry,
          createdAt: Date.now()
        });
        return true;
      }
      return false;
    } catch (error) {
      logger.error(`Erreur cache SET ${key}:`, error);
      return false;
    }
  }

  /**
   * Récupère une valeur du cache
   */
  async get(key) {
    try {
      if (this.isRedisEnabled && this.redisClient) {
        const value = await this.redisClient.get(key);
        return value ? JSON.parse(value) : null;
      } else if (this.isMemoryCacheEnabled) {
        const cached = this.memoryCache.get(key);
        if (!cached) return null;

        // Vérifier expiration
        if (cached.expiry && Date.now() > cached.expiry) {
          this.memoryCache.delete(key);
          return null;
        }

        return cached.value;
      }
      return null;
    } catch (error) {
      logger.error(`Erreur cache GET ${key}:`, error);
      return null;
    }
  }

  /**
   * Supprime une clé du cache
   */
  async del(key) {
    try {
      if (this.isRedisEnabled && this.redisClient) {
        await this.redisClient.del(key);
        return true;
      } else if (this.isMemoryCacheEnabled) {
        return this.memoryCache.delete(key);
      }
      return false;
    } catch (error) {
      logger.error(`Erreur cache DEL ${key}:`, error);
      return false;
    }
  }

  /**
   * Vide tout le cache
   */
  async flush() {
    try {
      if (this.isRedisEnabled && this.redisClient) {
        await this.redisClient.flushDb();
        return true;
      } else if (this.isMemoryCacheEnabled) {
        this.memoryCache.clear();
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Erreur cache FLUSH:', error);
      return false;
    }
  }

  /**
   * Récupère ou calcule une valeur avec mise en cache
   */
  async getOrSet(key, callback, ttl = this.defaultTTL) {
    let value = await this.get(key);

    if (value === null) {
      value = await callback();
      if (value !== null && value !== undefined) {
        await this.set(key, value, ttl);
      }
    }

    return value;
  }

  /**
   * Statistiques du cache
   */
  getStats() {
    if (this.isMemoryCacheEnabled) {
      const now = Date.now();
      let expired = 0;
      let valid = 0;

      for (const [key, value] of this.memoryCache.entries()) {
        if (value.expiry && now > value.expiry) {
          expired++;
        } else {
          valid++;
        }
      }

      return {
        type: 'memory',
        total: this.memoryCache.size,
        valid: valid,
        expired: expired,
        enabled: true
      };
    } else if (this.isRedisEnabled) {
      return {
        type: 'redis',
        enabled: true,
        connected: !!this.redisClient
      };
    } else {
      return {
        type: 'none',
        enabled: false
      };
    }
  }

  /**
   * Fermeture propre du service
   */
  async close() {
    try {
      if (this.isRedisEnabled && this.redisClient) {
        await this.redisClient.quit();
        logger.info('✅ Connexion Redis fermée');
      }
      if (this.isMemoryCacheEnabled) {
        this.memoryCache.clear();
        logger.info('✅ Cache mémoire vidé');
      }
    } catch (error) {
      logger.error('Erreur fermeture cache:', error);
    }
  }
}

// Instance singleton
const cacheService = new CacheService();

module.exports = cacheService;