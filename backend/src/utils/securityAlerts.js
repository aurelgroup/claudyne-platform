/**
 * Système d'alertes de sécurité pour Claudyne
 * Détecte et notifie les tentatives d'intrusion
 */

const logger = require('./logger');

class SecurityAlerts {
    constructor() {
        this.suspiciousAttempts = new Map();
        this.alertThresholds = {
            failedLogins: 5,
            invalidTokens: 10,
            suspiciousIPs: 20,
            timeWindow: 15 * 60 * 1000 // 15 minutes
        };
    }

    /**
     * Enregistre une tentative de connexion échouée
     */
    recordFailedLogin(ip, userAgent, email = null) {
        const key = `failed_login_${ip}`;
        this.incrementCounter(key, {
            type: 'failed_login',
            ip,
            userAgent,
            email,
            timestamp: Date.now()
        });

        if (this.getCounter(key) >= this.alertThresholds.failedLogins) {
            this.triggerAlert('MULTIPLE_FAILED_LOGINS', {
                ip,
                count: this.getCounter(key),
                timeWindow: this.alertThresholds.timeWindow / 60000
            });
        }
    }

    /**
     * Enregistre une tentative avec token invalide
     */
    recordInvalidToken(ip, userAgent, route) {
        const key = `invalid_token_${ip}`;
        this.incrementCounter(key, {
            type: 'invalid_token',
            ip,
            userAgent,
            route,
            timestamp: Date.now()
        });

        if (this.getCounter(key) >= this.alertThresholds.invalidTokens) {
            this.triggerAlert('MULTIPLE_INVALID_TOKENS', {
                ip,
                count: this.getCounter(key),
                route
            });
        }
    }

    /**
     * Détecte les tentatives de scan de ports/routes
     */
    recordSuspiciousActivity(ip, userAgent, route, statusCode) {
        const key = `suspicious_${ip}`;
        this.incrementCounter(key, {
            type: 'suspicious_scan',
            ip,
            userAgent,
            route,
            statusCode,
            timestamp: Date.now()
        });

        if (this.getCounter(key) >= this.alertThresholds.suspiciousIPs) {
            this.triggerAlert('POTENTIAL_SCANNING_ATTACK', {
                ip,
                count: this.getCounter(key),
                lastRoute: route
            });
        }
    }

    /**
     * Incrémente un compteur avec nettoyage automatique
     */
    incrementCounter(key, metadata) {
        const now = Date.now();

        if (!this.suspiciousAttempts.has(key)) {
            this.suspiciousAttempts.set(key, {
                count: 0,
                firstSeen: now,
                lastSeen: now,
                attempts: []
            });
        }

        const data = this.suspiciousAttempts.get(key);

        // Nettoyer les tentatives anciennes
        data.attempts = data.attempts.filter(
            attempt => now - attempt.timestamp < this.alertThresholds.timeWindow
        );

        data.attempts.push(metadata);
        data.count = data.attempts.length;
        data.lastSeen = now;

        this.suspiciousAttempts.set(key, data);
    }

    /**
     * Obtient le nombre de tentatives récentes
     */
    getCounter(key) {
        const data = this.suspiciousAttempts.get(key);
        return data ? data.count : 0;
    }

    /**
     * Déclenche une alerte de sécurité
     */
    triggerAlert(alertType, details) {
        const alert = {
            type: alertType,
            severity: this.getAlertSeverity(alertType),
            timestamp: new Date().toISOString(),
            details,
            recommendedAction: this.getRecommendedAction(alertType)
        };

        // Log l'alerte
        logger.logSecurity(alertType, alert);

        // Notifier les administrateurs (email, webhook, etc.)
        this.notifyAdministrators(alert);

        // En production, on pourrait aussi bloquer l'IP automatiquement
        if (process.env.NODE_ENV === 'production' && alert.severity === 'HIGH') {
            this.suggestIPBlock(details.ip);
        }
    }

    /**
     * Détermine la sévérité de l'alerte
     */
    getAlertSeverity(alertType) {
        const severityMap = {
            'MULTIPLE_FAILED_LOGINS': 'MEDIUM',
            'MULTIPLE_INVALID_TOKENS': 'HIGH',
            'POTENTIAL_SCANNING_ATTACK': 'HIGH',
            'BRUTE_FORCE_ATTACK': 'CRITICAL',
            'SQL_INJECTION_ATTEMPT': 'CRITICAL'
        };

        return severityMap[alertType] || 'LOW';
    }

    /**
     * Recommandations d'action pour chaque type d'alerte
     */
    getRecommendedAction(alertType) {
        const actionMap = {
            'MULTIPLE_FAILED_LOGINS': 'Vérifier si c\'est un utilisateur légitime ou un attaquant',
            'MULTIPLE_INVALID_TOKENS': 'Bloquer l\'IP temporairement et analyser les logs',
            'POTENTIAL_SCANNING_ATTACK': 'Bloquer l\'IP et vérifier les autres activités',
            'BRUTE_FORCE_ATTACK': 'Bloquer l\'IP immédiatement',
            'SQL_INJECTION_ATTEMPT': 'Bloquer l\'IP et auditer la sécurité des requêtes'
        };

        return actionMap[alertType] || 'Analyser l\'activité et prendre les mesures appropriées';
    }

    /**
     * Notifie les administrateurs
     */
    async notifyAdministrators(alert) {
        try {
            // Ici on pourrait intégrer avec:
            // - Service d'email
            // - Slack/Discord webhook
            // - SMS d'urgence
            // - Dashboard en temps réel

            console.log('🚨 ALERTE SÉCURITÉ:', JSON.stringify(alert, null, 2));

            // Exemple d'intégration webhook (à configurer)
            if (process.env.SECURITY_WEBHOOK_URL) {
                // await this.sendWebhookAlert(alert);
            }

        } catch (error) {
            logger.error('Erreur notification sécurité:', error);
        }
    }

    /**
     * Suggère le blocage d'une IP
     */
    suggestIPBlock(ip) {
        logger.logSecurity('IP_BLOCK_SUGGESTION', {
            ip,
            reason: 'Activité suspecte détectée',
            timestamp: new Date().toISOString(),
            action: 'Ajouter à la blacklist firewall'
        });
    }

    /**
     * Nettoie les anciennes données
     */
    cleanup() {
        const now = Date.now();

        for (const [key, data] of this.suspiciousAttempts.entries()) {
            if (now - data.lastSeen > this.alertThresholds.timeWindow * 2) {
                this.suspiciousAttempts.delete(key);
            }
        }
    }

    /**
     * Statistiques de sécurité
     */
    getSecurityStats() {
        const stats = {
            activeWatches: this.suspiciousAttempts.size,
            topSuspiciousIPs: [],
            alertTypes: {},
            timeWindow: this.alertThresholds.timeWindow / 60000
        };

        // Analyser les IPs les plus suspectes
        const ipCounts = new Map();
        for (const [key, data] of this.suspiciousAttempts.entries()) {
            if (data.attempts.length > 0) {
                const ip = data.attempts[0].ip;
                ipCounts.set(ip, (ipCounts.get(ip) || 0) + data.count);
            }
        }

        stats.topSuspiciousIPs = Array.from(ipCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([ip, count]) => ({ ip, attempts: count }));

        return stats;
    }
}

// Nettoyage automatique toutes les heures
const securityAlerts = new SecurityAlerts();
setInterval(() => {
    securityAlerts.cleanup();
}, 60 * 60 * 1000);

module.exports = securityAlerts;