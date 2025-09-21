/**
 * Middleware d'authentification admin utilisant le TokenService PostgreSQL
 */

const tokenService = require('../services/tokenService');

async function validateAdminToken(req, res, next) {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        console.log('🔍 Validation token:', token?.substring(0, 20) + '...');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token d\'authentification manquant',
                code: 'NO_TOKEN'
            });
        }

        // Valider le token via PostgreSQL
        const validation = await tokenService.validateToken(token);

        if (!validation.valid) {
            let message = 'Token invalide ou expiré';
            let code = 'INVALID_TOKEN';

            switch (validation.reason) {
                case 'NO_TOKEN':
                    message = 'Token d\'authentification manquant';
                    code = 'NO_TOKEN';
                    break;
                case 'INVALID_OR_EXPIRED':
                    message = 'Token invalide ou expiré';
                    code = 'INVALID_TOKEN';
                    break;
                case 'DATABASE_ERROR':
                    message = 'Erreur de validation du token';
                    code = 'DATABASE_ERROR';
                    break;
            }

            return res.status(401).json({
                success: false,
                message,
                code
            });
        }

        // Token valide, ajouter les informations du token à la requête
        req.adminToken = validation.tokenData;
        console.log('✅ Token admin validé avec succès');

        next();
    } catch (error) {
        console.error('❌ Erreur validation token admin:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne lors de la validation du token',
            code: 'INTERNAL_ERROR'
        });
    }
}

module.exports = {
    validateAdminToken
};