/**
 * CLAUDYNE AUTHENTICATION SERVICE
 * Service d'authentification JWT robuste
 * En hommage à Meffo Mehtah Tchandjio Claudine
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const winston = require('winston');

class AuthService {
    constructor(config) {
        this.config = config || {};
        this.jwtSecret = this.config.jwt?.secret || process.env.JWT_SECRET || 'claudyne-secret-key-2024';
        this.jwtExpiresIn = this.config.jwt?.expiresIn || '7d';
        this.jwtAlgorithm = this.config.jwt?.algorithm || 'HS256';

        // Logger
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            transports: [
                new winston.transports.Console({
                    format: winston.format.simple()
                })
            ]
        });

        this.logger.info('🔐 Service d\'authentification initialisé');
    }

    // ================================
    // GÉNÉRATION ET VÉRIFICATION JWT
    // ================================
    generateToken(user) {
        try {
            const payload = {
                userId: user.id,
                email: user.email,
                role: user.role,
                firstname: user.firstname,
                lastname: user.lastname,
                iat: Math.floor(Date.now() / 1000)
            };

            return jwt.sign(payload, this.jwtSecret, {
                expiresIn: this.jwtExpiresIn,
                algorithm: this.jwtAlgorithm,
                issuer: 'claudyne-server',
                audience: 'claudyne-client'
            });
        } catch (error) {
            this.logger.error('❌ Erreur génération token:', error);
            throw new Error('Erreur lors de la génération du token');
        }
    }

    verifyToken(req, res, next) {
        try {
            const authHeader = req.headers.authorization;

            if (!authHeader) {
                return res.status(401).json({
                    success: false,
                    error: 'Token d\'authentification requis',
                    code: 'MISSING_TOKEN'
                });
            }

            const token = authHeader.replace('Bearer ', '');

            if (!token) {
                return res.status(401).json({
                    success: false,
                    error: 'Format de token invalide',
                    code: 'INVALID_TOKEN_FORMAT'
                });
            }

            const decoded = jwt.verify(token, this.jwtSecret, {
                algorithms: [this.jwtAlgorithm],
                issuer: 'claudyne-server',
                audience: 'claudyne-client'
            });

            // Vérifier l'expiration
            if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
                return res.status(401).json({
                    success: false,
                    error: 'Token expiré',
                    code: 'TOKEN_EXPIRED'
                });
            }

            // Ajouter les informations utilisateur à la requête
            req.user = decoded;
            req.token = token;

            next();
        } catch (error) {
            this.logger.warn('⚠️ Token invalide:', error.message);

            let errorCode = 'INVALID_TOKEN';
            let errorMessage = 'Token invalide';

            if (error.name === 'TokenExpiredError') {
                errorCode = 'TOKEN_EXPIRED';
                errorMessage = 'Token expiré';
            } else if (error.name === 'JsonWebTokenError') {
                errorCode = 'MALFORMED_TOKEN';
                errorMessage = 'Token malformé';
            }

            return res.status(401).json({
                success: false,
                error: errorMessage,
                code: errorCode
            });
        }
    }

    // ================================
    // MIDDLEWARE D'AUTORISATION
    // ================================
    requireAdmin(req, res, next) {
        // D'abord vérifier le token
        this.verifyToken(req, res, (error) => {
            if (error) return;

            // Vérifier le rôle admin
            if (!req.user || req.user.role !== 'ADMIN') {
                return res.status(403).json({
                    success: false,
                    error: 'Accès refusé - Privilèges administrateur requis',
                    code: 'INSUFFICIENT_PRIVILEGES'
                });
            }

            next();
        });
    }

    requireRole(allowedRoles) {
        return (req, res, next) => {
            // D'abord vérifier le token
            this.verifyToken(req, res, (error) => {
                if (error) return;

                // Vérifier le rôle
                if (!req.user || !allowedRoles.includes(req.user.role)) {
                    return res.status(403).json({
                        success: false,
                        error: `Accès refusé - Rôles autorisés: ${allowedRoles.join(', ')}`,
                        code: 'INSUFFICIENT_PRIVILEGES',
                        requiredRoles: allowedRoles,
                        userRole: req.user?.role
                    });
                }

                next();
            });
        };
    }

    // ================================
    // UTILITAIRES CRYPTOGRAPHIQUES
    // ================================
    async hashPassword(password) {
        try {
            const saltRounds = this.config.bcrypt?.rounds || 12;
            return await bcrypt.hash(password, saltRounds);
        } catch (error) {
            this.logger.error('❌ Erreur hashage mot de passe:', error);
            throw new Error('Erreur lors du hashage du mot de passe');
        }
    }

    async comparePassword(password, hash) {
        try {
            return await bcrypt.compare(password, hash);
        } catch (error) {
            this.logger.error('❌ Erreur comparaison mot de passe:', error);
            throw new Error('Erreur lors de la vérification du mot de passe');
        }
    }

    // ================================
    // VALIDATION DES DONNÉES
    // ================================
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validatePassword(password) {
        // Au moins 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(password);
    }

    validateUserData(userData) {
        const errors = [];

        if (!userData.email || !this.validateEmail(userData.email)) {
            errors.push('Email invalide');
        }

        if (!userData.password || !this.validatePassword(userData.password)) {
            errors.push('Mot de passe invalide (min. 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre)');
        }

        if (!userData.firstname || userData.firstname.trim().length < 2) {
            errors.push('Prénom requis (min. 2 caractères)');
        }

        if (!userData.lastname || userData.lastname.trim().length < 2) {
            errors.push('Nom requis (min. 2 caractères)');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // ================================
    // MIDDLEWARE DE VALIDATION
    // ================================
    validateRegistration(req, res, next) {
        const validation = this.validateUserData(req.body);

        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                error: 'Données d\'inscription invalides',
                code: 'VALIDATION_ERROR',
                details: validation.errors
            });
        }

        next();
    }

    validateLogin(req, res, next) {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email et mot de passe requis',
                code: 'MISSING_CREDENTIALS'
            });
        }

        if (!this.validateEmail(email)) {
            return res.status(400).json({
                success: false,
                error: 'Format d\'email invalide',
                code: 'INVALID_EMAIL_FORMAT'
            });
        }

        next();
    }

    // ================================
    // GESTION DES SESSIONS
    // ================================
    extractTokenInfo(token) {
        try {
            const decoded = jwt.decode(token);
            return {
                userId: decoded?.userId,
                email: decoded?.email,
                role: decoded?.role,
                iat: decoded?.iat,
                exp: decoded?.exp,
                isValid: decoded && decoded.exp > Math.floor(Date.now() / 1000)
            };
        } catch (error) {
            return { isValid: false };
        }
    }

    refreshToken(currentToken) {
        try {
            const decoded = jwt.verify(currentToken, this.jwtSecret);

            // Vérifier si le token expire bientôt (moins de 1 jour)
            const expirationTime = decoded.exp * 1000;
            const oneDay = 24 * 60 * 60 * 1000;

            if (expirationTime - Date.now() < oneDay) {
                // Générer un nouveau token
                return this.generateToken({
                    id: decoded.userId,
                    email: decoded.email,
                    role: decoded.role,
                    firstname: decoded.firstname,
                    lastname: decoded.lastname
                });
            }

            return currentToken; // Token encore valide
        } catch (error) {
            this.logger.error('❌ Erreur refresh token:', error);
            throw new Error('Impossible de renouveler le token');
        }
    }

    // ================================
    // SÉCURITÉ AVANCÉE
    // ================================
    generateApiKey(userId) {
        const payload = {
            userId,
            type: 'api_key',
            iat: Math.floor(Date.now() / 1000)
        };

        return jwt.sign(payload, this.jwtSecret, {
            algorithm: this.jwtAlgorithm,
            issuer: 'claudyne-server',
            audience: 'claudyne-api'
        });
    }

    verifyApiKey(apiKey) {
        try {
            return jwt.verify(apiKey, this.jwtSecret, {
                algorithms: [this.jwtAlgorithm],
                issuer: 'claudyne-server',
                audience: 'claudyne-api'
            });
        } catch (error) {
            return null;
        }
    }

    // ================================
    // CAMEROUN SPECIFIC
    // ================================
    isValidCameroonPhone(phone) {
        // Format Cameroun: +237XXXXXXXXX ou 237XXXXXXXXX ou 6XXXXXXXX
        const cameroonPhoneRegex = /^(\+237|237)?[6789]\d{8}$/;
        return cameroonPhoneRegex.test(phone?.replace(/\s+/g, ''));
    }

    // ================================
    // MONITORING
    // ================================
    getSecurityMetrics() {
        return {
            jwtAlgorithm: this.jwtAlgorithm,
            tokenExpiration: this.jwtExpiresIn,
            bcryptRounds: this.config.bcrypt?.rounds || 12,
            securityLevel: 'high',
            features: [
                'JWT Authentication',
                'Password Hashing',
                'Role-based Access',
                'Token Refresh',
                'API Keys',
                'Cameroon Phone Validation'
            ]
        };
    }
}

module.exports = AuthService;