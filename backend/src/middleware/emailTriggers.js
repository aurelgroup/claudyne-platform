/**
 * Middleware déclencheurs email automatiques
 */

const emailService = require('../services/email/emailService');
const logger = require('../utils/logger');

// Déclencher email de bienvenue après inscription
const triggerWelcomeEmail = async (req, res, next) => {
    // Hook après création utilisateur réussie
    const originalSend = res.send;

    res.send = function(data) {
        // Si inscription réussie, déclencher email
        if (res.statusCode === 201 && req.newUser) {
            setTimeout(async () => {
                try {
                    await emailService.sendWelcomeEmail(req.newUser);
                } catch (error) {
                    logger.error('Erreur email bienvenue:', error);
                }
            }, parseInt(process.env.WELCOME_EMAIL_DELAY) || 0);
        }

        originalSend.call(this, data);
    };

    next();
};

// Déclencher email reset password
const triggerPasswordResetEmail = async (user, resetToken) => {
    try {
        return await emailService.sendPasswordResetEmail(user, resetToken);
    } catch (error) {
        logger.error('Erreur email reset:', error);
        return false;
    }
};

module.exports = {
    triggerWelcomeEmail,
    triggerPasswordResetEmail
};
