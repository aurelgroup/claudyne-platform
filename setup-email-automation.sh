#!/bin/bash

# =================================================
# CONFIGURATION EMAIL AUTOMATION PRODUCTION CLAUDYNE
# Setup SMTP + Templates + Déclencheurs automatiques
# =================================================

echo "📧 Configuration Email Automation Production"
echo "👨‍👩‍👧‍👦 En hommage à Meffo Mehtah Tchandjio Claudine"
echo ""

VPS_IP="89.117.58.53"
VPS_USER="root"

ssh $VPS_USER@$VPS_IP << 'EOF'
    echo "📧 CONFIGURATION EMAIL AUTOMATION"
    echo "================================="

    cd /var/www/claudyne/backend

    # 1. VÉRIFIER CONFIGURATION EMAIL ACTUELLE
    echo "📋 Configuration email actuelle:"
    grep -E "SMTP|EMAIL" .env 2>/dev/null || echo "❌ Configuration email manquante"
    echo ""

    # 2. AJOUTER CONFIGURATION EMAIL PRODUCTION
    echo "📝 Mise à jour configuration email..."

    # Backup .env
    cp .env .env.backup.email.$(date +%Y%m%d_%H%M%S)

    # Ajouter/mettre à jour config email
    cat >> .env << 'EMAILEOF'

# ===========================================
# EMAIL AUTOMATION CONFIGURATION PRODUCTION
# ===========================================

# SMTP Configuration (Gmail/Professional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@claudyne.com
SMTP_PASS=change_to_app_password_in_production

# Email Sending Configuration
FROM_EMAIL=noreply@claudyne.com
FROM_NAME=Équipe Claudyne
SUPPORT_EMAIL=support@claudyne.com

# Email Templates & Automation
EMAIL_AUTOMATION_ENABLED=true
EMAIL_QUEUE_ENABLED=true
EMAIL_RETRY_ATTEMPTS=3
EMAIL_RETRY_DELAY=5000

# Welcome Email Settings
WELCOME_EMAIL_ENABLED=true
WELCOME_EMAIL_DELAY=0

# Password Reset Settings
PASSWORD_RESET_ENABLED=true
PASSWORD_RESET_EXPIRY=3600000

# Notification Settings
NOTIFICATION_EMAIL_ENABLED=true
DIGEST_EMAIL_ENABLED=true
DIGEST_EMAIL_FREQUENCY=weekly

# Prix Claudine Email Notifications
PRIX_CLAUDINE_EMAIL_ENABLED=true
BATTLE_NOTIFICATION_ENABLED=true

# Email Rate Limiting
EMAIL_RATE_LIMIT_PER_HOUR=100
EMAIL_RATE_LIMIT_PER_DAY=500
EMAILEOF

    echo "✅ Configuration email ajoutée"

    # 3. INSTALLER DÉPENDANCES EMAIL SI NÉCESSAIRES
    echo ""
    echo "📦 Vérification dépendances email..."

    # Vérifier si nodemailer est installé
    if npm list nodemailer > /dev/null 2>&1; then
        echo "✅ Nodemailer installé"
    else
        echo "📥 Installation Nodemailer..."
        npm install nodemailer --save
    fi

    # 4. CRÉER SERVICE EMAIL AUTOMATION
    echo ""
    echo "📝 Création service email automation..."

    mkdir -p src/services/email

    cat > src/services/email/emailService.js << 'EMAILSERVICEEOF'
/**
 * Service Email Automation Claudyne
 * Gestion envoi emails automatiques
 */

const nodemailer = require('nodemailer');
const logger = require('../../utils/logger');

class EmailService {
    constructor() {
        this.transporter = null;
        this.isEnabled = process.env.EMAIL_AUTOMATION_ENABLED === 'true';
        this.initTransporter();
    }

    initTransporter() {
        if (!this.isEnabled) {
            logger.info('📧 Email automation désactivé');
            return;
        }

        try {
            this.transporter = nodemailer.createTransporter({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT),
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });

            logger.info('📧 Transporteur email configuré');
        } catch (error) {
            logger.error('❌ Erreur configuration email:', error);
        }
    }

    async sendWelcomeEmail(user) {
        if (!this.isEnabled || !this.transporter) {
            logger.warn('📧 Service email non disponible pour welcome');
            return false;
        }

        try {
            const emailContent = this.generateWelcomeEmail(user);

            const mailOptions = {
                from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
                to: user.email,
                subject: 'Bienvenue sur Claudyne - Votre parcours éducatif commence !',
                html: emailContent
            };

            const result = await this.transporter.sendMail(mailOptions);
            logger.info(`📧 Email bienvenue envoyé à ${user.email}`);
            return true;

        } catch (error) {
            logger.error('❌ Erreur envoi email bienvenue:', error);
            return false;
        }
    }

    async sendPasswordResetEmail(user, resetToken) {
        if (!this.isEnabled || !this.transporter) {
            logger.warn('📧 Service email non disponible pour reset');
            return false;
        }

        try {
            const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
            const emailContent = this.generatePasswordResetEmail(user, resetLink);

            const mailOptions = {
                from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
                to: user.email,
                subject: 'Claudyne - Réinitialisation de votre mot de passe',
                html: emailContent
            };

            await this.transporter.sendMail(mailOptions);
            logger.info(`📧 Email reset password envoyé à ${user.email}`);
            return true;

        } catch (error) {
            logger.error('❌ Erreur envoi email reset:', error);
            return false;
        }
    }

    generateWelcomeEmail(user) {
        return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e, #16213e); color: white; border-radius: 10px; overflow: hidden;">
            <div style="padding: 30px; text-align: center;">
                <h1 style="color: #FFD700; margin-bottom: 20px;">🎓 Bienvenue ${user.firstName} !</h1>

                <p style="font-size: 18px; line-height: 1.6; margin-bottom: 20px;">
                    Nous sommes ravis de vous accueillir dans la famille Claudyne, votre plateforme éducative camerounaise.
                </p>

                <div style="background: rgba(255, 215, 0, 0.1); padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h2 style="color: #87CEEB; margin-bottom: 15px;">🚀 Commencez votre parcours</h2>
                    <ul style="text-align: left; color: #E6E6FA;">
                        <li>🎯 Explorez nos cours adaptés au système camerounais</li>
                        <li>🏆 Participez aux Battle Royale éducatifs</li>
                        <li>📊 Suivez votre progression en temps réel</li>
                        <li>🥇 Concourez pour le Prix Claudine</li>
                    </ul>
                </div>

                <a href="${process.env.FRONTEND_URL}/student"
                   style="display: inline-block; background: #FFD700; color: #1a1a2e; padding: 15px 30px;
                          text-decoration: none; border-radius: 25px; font-weight: bold; margin: 20px 0;">
                    🎓 Accéder à ma plateforme
                </a>

                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.2);">
                    <p style="margin: 0; font-style: italic; color: #FFD700;">
                        "La force du savoir en héritage"
                    </p>
                    <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.8;">
                        👨‍👩‍👧‍👦 En hommage à Meffo Mehtah Tchandjio Claudine
                    </p>
                </div>
            </div>
        </div>`;
    }

    generatePasswordResetEmail(user, resetLink) {
        return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1a1a2e, #16213e); color: white; padding: 30px; border-radius: 10px;">
                <h1 style="color: #FFD700; text-align: center;">🔐 Réinitialisation mot de passe</h1>

                <p>Bonjour ${user.firstName},</p>

                <p>Vous avez demandé la réinitialisation de votre mot de passe Claudyne.</p>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}"
                       style="display: inline-block; background: #FFD700; color: #1a1a2e;
                              padding: 15px 30px; text-decoration: none; border-radius: 25px;
                              font-weight: bold;">
                        🔑 Réinitialiser mon mot de passe
                    </a>
                </div>

                <p style="font-size: 14px; color: #B0C4DE;">
                    Ce lien expire dans 1 heure. Si vous n'avez pas demandé cette réinitialisation,
                    ignorez cet email.
                </p>

                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.2);">
                    <p style="margin: 0; font-style: italic; color: #FFD700;">
                        "La force du savoir en héritage"
                    </p>
                </div>
            </div>
        </div>`;
    }

    async testConnection() {
        if (!this.transporter) {
            return false;
        }

        try {
            await this.transporter.verify();
            logger.info('✅ Connexion SMTP vérifiée');
            return true;
        } catch (error) {
            logger.error('❌ Erreur connexion SMTP:', error);
            return false;
        }
    }
}

module.exports = new EmailService();
EMAILSERVICEEOF

    # 5. INTÉGRER SERVICE DANS L'APPLICATION
    echo ""
    echo "🔗 Intégration service email dans l'app..."

    # Créer middleware pour déclencher emails
    cat > src/middleware/emailTriggers.js << 'TRIGGEREOF'
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
TRIGGEREOF

    # 6. TESTER SERVICE EMAIL
    echo ""
    echo "🧪 Test service email..."

    node -e "
        require('dotenv').config();
        const emailService = require('./src/services/email/emailService');

        console.log('📧 Test connexion SMTP...');
        emailService.testConnection()
            .then(success => {
                console.log(success ? '✅ SMTP OK' : '❌ SMTP ERROR');
                process.exit(0);
            })
            .catch(err => {
                console.log('❌ Erreur test:', err.message);
                process.exit(1);
            });
    " || echo "⚠️ Test SMTP échoué - Configuration à ajuster"

    # 7. REDÉMARRER BACKEND AVEC NOUVELLE CONFIG
    echo ""
    echo "🔄 Redémarrage backend avec email automation..."
    pm2 restart claudyne-backend

    # Attendre redémarrage
    sleep 3

    # 8. VÉRIFIER LOGS DÉMARRAGE
    echo ""
    echo "📝 Logs démarrage backend:"
    pm2 logs claudyne-backend --lines 5 --nostream | tail -5

    # 9. CRÉER SCRIPT TEST EMAIL MANUEL
    echo ""
    echo "📝 Création script test email manuel..."

    cat > /var/www/claudyne/scripts/test-email.js << 'TESTEOF'
/**
 * Script test email automation
 */

require('dotenv').config();
const emailService = require('./src/services/email/emailService');

const testUser = {
    firstName: 'Test',
    lastName: 'Claudyne',
    email: 'test@example.com' // Changer par votre email
};

async function testEmails() {
    console.log('📧 Test email automation Claudyne\n');

    // Test connexion
    console.log('1. Test connexion SMTP...');
    const connectionOK = await emailService.testConnection();
    console.log(connectionOK ? '✅ Connexion OK' : '❌ Connexion échouée');

    if (connectionOK) {
        // Test email bienvenue
        console.log('\n2. Test email bienvenue...');
        const welcomeOK = await emailService.sendWelcomeEmail(testUser);
        console.log(welcomeOK ? '✅ Email bienvenue envoyé' : '❌ Erreur email bienvenue');

        // Test email reset
        console.log('\n3. Test email reset password...');
        const resetOK = await emailService.sendPasswordResetEmail(testUser, 'test-token-123');
        console.log(resetOK ? '✅ Email reset envoyé' : '❌ Erreur email reset');
    }

    console.log('\n📧 Tests terminés');
}

testEmails().catch(console.error);
TESTEOF

    # 10. STATUT FINAL
    echo ""
    echo "📊 EMAIL AUTOMATION CONFIGURÉ:"
    echo "=============================="
    echo "✅ Service email: src/services/email/emailService.js"
    echo "✅ Middleware: src/middleware/emailTriggers.js"
    echo "✅ Configuration: .env mise à jour"
    echo "✅ Script test: /var/www/claudyne/scripts/test-email.js"
    echo ""
    echo "📧 Types d'emails automatiques:"
    echo "   🎉 Email de bienvenue (inscription)"
    echo "   🔐 Email reset password"
    echo "   📊 Notifications Prix Claudine (à venir)"
    echo "   ⚔️ Notifications Battle Royale (à venir)"
    echo ""
    echo "🔧 Configuration SMTP à ajuster:"
    echo "   SMTP_USER: Votre email Gmail/professionnel"
    echo "   SMTP_PASS: App password Gmail ou mot de passe"

EOF

echo ""
echo "✅ Email automation configuré ! 📧🚀"