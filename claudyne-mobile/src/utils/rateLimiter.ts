/**
 * 🛡️ RATE LIMITER ULTRA-SÉCURISÉ CLAUDYNE
 * Protection contre spam et attaques DDoS
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  blockDurationMs?: number;
}

interface RequestRecord {
  count: number;
  firstRequest: number;
  lastRequest: number;
  blocked?: number;
}

export class RateLimiter {
  private requests: Map<string, RequestRecord> = new Map();

  // Configuration par défaut ultra-stricte
  private static readonly DEFAULT_CONFIGS: Record<string, RateLimitConfig> = {
    // Authentification ultra-protégée
    login: {
      maxRequests: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
      blockDurationMs: 30 * 60 * 1000, // 30 minutes de blocage
    },

    // Récupération mot de passe très protégée
    passwordReset: {
      maxRequests: 3,
      windowMs: 60 * 60 * 1000, // 1 heure
      blockDurationMs: 2 * 60 * 60 * 1000, // 2 heures de blocage
    },

    // API générale
    api: {
      maxRequests: 100,
      windowMs: 60 * 1000, // 1 minute
      blockDurationMs: 5 * 60 * 1000, // 5 minutes de blocage
    },

    // Battle Royale (temps réel)
    battle: {
      maxRequests: 30,
      windowMs: 60 * 1000, // 1 minute
      blockDurationMs: 2 * 60 * 1000, // 2 minutes de blocage
    },

    // Mentor IA (conversation)
    mentor: {
      maxRequests: 20,
      windowMs: 60 * 1000, // 1 minute
      blockDurationMs: 1 * 60 * 1000, // 1 minute de blocage
    },
  };

  /**
   * Vérifier si une requête est autorisée
   */
  isAllowed(
    identifier: string,
    type: keyof typeof RateLimiter.DEFAULT_CONFIGS = 'api'
  ): {
    allowed: boolean;
    remaining?: number;
    resetTime?: number;
    blockTime?: number;
  } {
    const config = RateLimiter.DEFAULT_CONFIGS[type];
    const now = Date.now();
    const key = `${type}:${identifier}`;

    let record = this.requests.get(key);

    // Vérifier si toujours bloqué
    if (record?.blocked && now < record.blocked) {
      return {
        allowed: false,
        blockTime: record.blocked - now,
      };
    }

    // Nettoyer le blocage expiré
    if (record?.blocked && now >= record.blocked) {
      record.blocked = undefined;
      record.count = 0;
      record.firstRequest = now;
    }

    // Initialiser ou réinitialiser la fenêtre
    if (!record || (now - record.firstRequest) > config.windowMs) {
      record = {
        count: 1,
        firstRequest: now,
        lastRequest: now,
      };
      this.requests.set(key, record);

      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: now + config.windowMs,
      };
    }

    // Incrémenter le compteur
    record.count++;
    record.lastRequest = now;

    // Vérifier la limite
    if (record.count > config.maxRequests) {
      // Bloquer l'utilisateur
      if (config.blockDurationMs) {
        record.blocked = now + config.blockDurationMs;
      }

      this.requests.set(key, record);

      return {
        allowed: false,
        blockTime: config.blockDurationMs,
      };
    }

    this.requests.set(key, record);

    return {
      allowed: true,
      remaining: config.maxRequests - record.count,
      resetTime: record.firstRequest + config.windowMs,
    };
  }

  /**
   * Enregistrer une requête (même logique que isAllowed mais sans vérification)
   */
  recordRequest(
    identifier: string,
    type: keyof typeof RateLimiter.DEFAULT_CONFIGS = 'api'
  ): void {
    this.isAllowed(identifier, type);
  }

  /**
   * Réinitialiser le rate limiting pour un utilisateur
   */
  reset(
    identifier: string,
    type?: keyof typeof RateLimiter.DEFAULT_CONFIGS
  ): void {
    if (type) {
      const key = `${type}:${identifier}`;
      this.requests.delete(key);
    } else {
      // Réinitialiser tous les types pour cet utilisateur
      const keysToDelete = Array.from(this.requests.keys())
        .filter(key => key.endsWith(`:${identifier}`));

      keysToDelete.forEach(key => this.requests.delete(key));
    }
  }

  /**
   * Obtenir les statistiques pour un utilisateur
   */
  getStats(
    identifier: string,
    type: keyof typeof RateLimiter.DEFAULT_CONFIGS = 'api'
  ): {
    requests: number;
    remaining: number;
    blocked: boolean;
    resetTime?: number;
    blockTime?: number;
  } {
    const config = RateLimiter.DEFAULT_CONFIGS[type];
    const key = `${type}:${identifier}`;
    const record = this.requests.get(key);
    const now = Date.now();

    if (!record) {
      return {
        requests: 0,
        remaining: config.maxRequests,
        blocked: false,
      };
    }

    const isBlocked = record.blocked && now < record.blocked;
    const isWindowExpired = (now - record.firstRequest) > config.windowMs;

    if (isWindowExpired && !isBlocked) {
      return {
        requests: 0,
        remaining: config.maxRequests,
        blocked: false,
      };
    }

    return {
      requests: record.count,
      remaining: Math.max(0, config.maxRequests - record.count),
      blocked: isBlocked || false,
      resetTime: record.firstRequest + config.windowMs,
      blockTime: record.blocked ? record.blocked - now : undefined,
    };
  }

  /**
   * Nettoyer les anciens enregistrements
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.requests.forEach((record, key) => {
      const [type] = key.split(':');
      const config = RateLimiter.DEFAULT_CONFIGS[type as keyof typeof RateLimiter.DEFAULT_CONFIGS];

      if (!config) return;

      const isExpired = (now - record.firstRequest) > config.windowMs;
      const isUnblocked = !record.blocked || now >= record.blocked;

      if (isExpired && isUnblocked) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.requests.delete(key));
  }

  /**
   * Obtenir la configuration pour un type
   */
  static getConfig(type: keyof typeof RateLimiter.DEFAULT_CONFIGS): RateLimitConfig {
    return RateLimiter.DEFAULT_CONFIGS[type];
  }

  /**
   * Formater le temps restant en format lisible
   */
  static formatTimeRemaining(ms: number): string {
    const seconds = Math.ceil(ms / 1000);
    const minutes = Math.ceil(seconds / 60);
    const hours = Math.ceil(minutes / 60);

    if (hours > 1) {
      return `${hours} heure(s)`;
    } else if (minutes > 1) {
      return `${minutes} minute(s)`;
    } else {
      return `${seconds} seconde(s)`;
    }
  }
}

// Instance globale
export const globalRateLimiter = new RateLimiter();

// Nettoyer automatiquement toutes les heures
setInterval(() => {
  globalRateLimiter.cleanup();
}, 60 * 60 * 1000);

export default RateLimiter;