/**
 * Service de gestion des tokens admin partagés via PostgreSQL
 * Résout le problème de partage de tokens entre instances Node.js
 */

const { Pool } = require('pg');

class TokenService {
    constructor() {
        // Configuration PostgreSQL pour production
        const isProduction = process.env.NODE_ENV === 'production';

        if (isProduction) {
            this.pool = new Pool({
                user: process.env.POSTGRES_USER || 'claudyne_user',
                host: process.env.POSTGRES_HOST || 'localhost',
                database: process.env.POSTGRES_DB || 'claudyne_prod',
                password: process.env.POSTGRES_PASSWORD || 'claudyne_secure_2024',
                port: process.env.POSTGRES_PORT || 5432,
            });
            this.initializeDatabase();
        } else {
            // En développement, simuler PostgreSQL avec SQLite
            this.pool = null;
            console.log('🔧 Mode développement: Token service utilise SQLite (simulation)');
        }
    }

    async initializeDatabase() {
        try {
            // Créer la table admin_tokens si elle n'existe pas
            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS admin_tokens (
                    id SERIAL PRIMARY KEY,
                    token VARCHAR(255) UNIQUE NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    expires_at TIMESTAMP NOT NULL,
                    is_active BOOLEAN DEFAULT true,
                    created_by VARCHAR(100) DEFAULT 'system'
                );
            `);

            // Index pour optimiser les performances
            await this.pool.query(`
                CREATE INDEX IF NOT EXISTS idx_admin_tokens_token ON admin_tokens(token);
                CREATE INDEX IF NOT EXISTS idx_admin_tokens_expires_at ON admin_tokens(expires_at);
                CREATE INDEX IF NOT EXISTS idx_admin_tokens_active ON admin_tokens(is_active);
            `);

            console.log('✅ Table admin_tokens initialisée avec succès');
        } catch (error) {
            console.error('❌ Erreur initialisation table admin_tokens:', error);
        }
    }

    /**
     * Générer un nouveau token admin
     */
    async generateToken() {
        try {
            const token = 'admin-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            const expiresAt = new Date(Date.now() + (24 * 60 * 60 * 1000)); // 24h

            if (this.pool) {
                // Production: utiliser PostgreSQL
                const result = await this.pool.query(
                    'INSERT INTO admin_tokens (token, expires_at) VALUES ($1, $2) RETURNING *',
                    [token, expiresAt]
                );
            } else {
                // Développement: utiliser global storage
                global.adminTokens = global.adminTokens || [];
                global.adminTokens.push({
                    token,
                    expires: expiresAt.getTime(),
                    created: Date.now()
                });
            }

            console.log('🔑 Token admin généré:', token.substring(0, 15) + '...');
            return {
                success: true,
                token,
                expiresAt
            };
        } catch (error) {
            console.error('❌ Erreur génération token:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Valider un token admin
     */
    async validateToken(token) {
        try {
            if (!token) {
                return { valid: false, reason: 'NO_TOKEN' };
            }

            if (this.pool) {
                // Production: utiliser PostgreSQL
                const result = await this.pool.query(
                    'SELECT * FROM admin_tokens WHERE token = $1 AND is_active = true AND expires_at > NOW()',
                    [token]
                );

                if (result.rows.length === 0) {
                    return { valid: false, reason: 'INVALID_OR_EXPIRED' };
                }

                const tokenData = result.rows[0];
                console.log('✅ Token validé:', token.substring(0, 15) + '...');

                return {
                    valid: true,
                    tokenData: {
                        id: tokenData.id,
                        token: tokenData.token,
                        createdAt: tokenData.created_at,
                        expiresAt: tokenData.expires_at
                    }
                };
            } else {
                // Développement: utiliser global storage
                global.adminTokens = global.adminTokens || [];
                const validToken = global.adminTokens.find(t =>
                    t.token === token && t.expires > Date.now()
                );

                if (!validToken) {
                    return { valid: false, reason: 'INVALID_OR_EXPIRED' };
                }

                console.log('✅ Token validé:', token.substring(0, 15) + '...');
                return {
                    valid: true,
                    tokenData: validToken
                };
            }
        } catch (error) {
            console.error('❌ Erreur validation token:', error);
            return { valid: false, reason: 'DATABASE_ERROR' };
        }
    }

    /**
     * Nettoyer les tokens expirés
     */
    async cleanupExpiredTokens() {
        try {
            const result = await this.pool.query(
                'DELETE FROM admin_tokens WHERE expires_at < NOW() OR is_active = false'
            );

            console.log(`🧹 ${result.rowCount} tokens expirés supprimés`);
            return result.rowCount;
        } catch (error) {
            console.error('❌ Erreur nettoyage tokens:', error);
            return 0;
        }
    }

    /**
     * Révoquer un token spécifique
     */
    async revokeToken(token) {
        try {
            const result = await this.pool.query(
                'UPDATE admin_tokens SET is_active = false WHERE token = $1',
                [token]
            );

            console.log('🔒 Token révoqué:', token.substring(0, 15) + '...');
            return result.rowCount > 0;
        } catch (error) {
            console.error('❌ Erreur révocation token:', error);
            return false;
        }
    }

    /**
     * Obtenir les statistiques des tokens
     */
    async getTokenStats() {
        try {
            const result = await this.pool.query(`
                SELECT
                    COUNT(*) as total_tokens,
                    COUNT(*) FILTER (WHERE is_active = true AND expires_at > NOW()) as active_tokens,
                    COUNT(*) FILTER (WHERE expires_at < NOW()) as expired_tokens
                FROM admin_tokens
            `);

            return result.rows[0];
        } catch (error) {
            console.error('❌ Erreur stats tokens:', error);
            return { total_tokens: 0, active_tokens: 0, expired_tokens: 0 };
        }
    }

    /**
     * Programmer le nettoyage automatique des tokens expirés
     */
    startCleanupSchedule() {
        // Nettoyer toutes les heures
        setInterval(async () => {
            await this.cleanupExpiredTokens();
        }, 60 * 60 * 1000); // 1 heure

        console.log('⏰ Nettoyage automatique des tokens programmé (toutes les heures)');
    }

    /**
     * Fermer la connexion PostgreSQL
     */
    async close() {
        await this.pool.end();
        console.log('📂 Connexion PostgreSQL fermée');
    }
}

// Instance singleton
const tokenService = new TokenService();

module.exports = tokenService;