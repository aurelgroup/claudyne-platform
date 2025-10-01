/**
 * Endpoints pour configuration email admin
 */

const fs = require('fs').promises;
const path = require('path');

// Email configuration endpoints
const emailConfigEndpoints = `
// ======================================
// EMAIL CONFIGURATION ENDPOINTS
// ======================================

// Sauvegarder configuration email
app.post('/api/admin/email-config', async (req, res) => {
    try {
        const { smtp, automation } = req.body;

        // Lire .env actuel
        const envPath = path.join(__dirname, '.env');
        let envContent = '';

        try {
            envContent = await fs.readFile(envPath, 'utf8');
        } catch (error) {
            console.log('Création nouveau fichier .env');
        }

        // Créer backup
        const backupPath = path.join(__dirname, \`.env.backup.\${Date.now()}\`);
        if (envContent) {
            await fs.writeFile(backupPath, envContent);
        }

        // Mettre à jour variables SMTP
        const smtpVars = {
            SMTP_HOST: smtp.host || 'smtp.gmail.com',
            SMTP_PORT: smtp.port || 587,
            SMTP_SECURE: smtp.secure ? 'true' : 'false',
            SMTP_USER: smtp.user || '',
            SMTP_PASS: smtp.password || '',

            // Variables automation
            FROM_EMAIL: smtp.user || '',
            FROM_NAME: automation.fromName || 'Équipe Claudyne',
            SUPPORT_EMAIL: automation.supportEmail || 'support@claudyne.com',

            EMAIL_AUTOMATION_ENABLED: automation.enabled ? 'true' : 'false',
            WELCOME_EMAIL_ENABLED: automation.welcomeEmailEnabled ? 'true' : 'false',
            WELCOME_EMAIL_DELAY: automation.welcomeEmailDelay || 0,
            PASSWORD_RESET_ENABLED: automation.passwordResetEnabled ? 'true' : 'false',
            PRIX_CLAUDINE_EMAIL_ENABLED: automation.prixClaudineEmailEnabled ? 'true' : 'false'
        };

        // Remplacer ou ajouter variables
        let newEnvContent = envContent;

        Object.entries(smtpVars).forEach(([key, value]) => {
            const regex = new RegExp(\`^\${key}=.*$\`, 'm');
            if (regex.test(newEnvContent)) {
                newEnvContent = newEnvContent.replace(regex, \`\${key}=\${value}\`);
            } else {
                newEnvContent += \`\n\${key}=\${value}\`;
            }
        });

        // Sauvegarder nouveau .env
        await fs.writeFile(envPath, newEnvContent);

        // Recharger variables d'environnement
        require('dotenv').config();

        res.json({
            success: true,
            message: 'Configuration email sauvegardée'
        });

    } catch (error) {
        console.error('Erreur sauvegarde email config:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
});

// Charger configuration email
app.get('/api/admin/email-config', async (req, res) => {
    try {
        const config = {
            smtp: {
                host: process.env.SMTP_HOST || '',
                port: parseInt(process.env.SMTP_PORT) || 587,
                user: process.env.SMTP_USER || '',
                secure: process.env.SMTP_SECURE === 'true'
            },
            automation: {
                enabled: process.env.EMAIL_AUTOMATION_ENABLED !== 'false',
                fromName: process.env.FROM_NAME || 'Équipe Claudyne',
                supportEmail: process.env.SUPPORT_EMAIL || 'support@claudyne.com',
                welcomeEmailEnabled: process.env.WELCOME_EMAIL_ENABLED !== 'false',
                welcomeEmailDelay: parseInt(process.env.WELCOME_EMAIL_DELAY) || 0,
                passwordResetEnabled: process.env.PASSWORD_RESET_ENABLED !== 'false',
                prixClaudineEmailEnabled: process.env.PRIX_CLAUDINE_EMAIL_ENABLED !== 'false'
            }
        };

        res.json({
            success: true,
            data: config
        });

    } catch (error) {
        console.error('Erreur lecture email config:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
});

// Test connexion SMTP
app.post('/api/admin/email-test-smtp', async (req, res) => {
    try {
        const emailService = require('./src/services/email/emailService');
        const success = await emailService.testConnection();

        res.json({
            success,
            message: success ? 'Connexion SMTP réussie' : 'Échec connexion SMTP'
        });

    } catch (error) {
        console.error('Erreur test SMTP:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
});

// Test email bienvenue
app.post('/api/admin/email-test-welcome', async (req, res) => {
    try {
        const { testEmail } = req.body;
        const emailService = require('./src/services/email/emailService');

        const testUser = {
            firstName: 'Test',
            lastName: 'User',
            email: testEmail
        };

        const success = await emailService.sendWelcomeEmail(testUser);

        res.json({
            success,
            message: success ? 'Email de bienvenue envoyé' : 'Échec envoi email'
        });

    } catch (error) {
        console.error('Erreur test email bienvenue:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
});

// Redémarrer service email
app.post('/api/admin/email-restart', async (req, res) => {
    try {
        // Recharger variables d'environnement
        require('dotenv').config();

        // Réinitialiser service email
        const emailService = require('./src/services/email/emailService');
        emailService.initTransporter();

        res.json({
            success: true,
            message: 'Service email redémarré'
        });

    } catch (error) {
        console.error('Erreur redémarrage email service:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
});
`;

module.exports = emailConfigEndpoints;