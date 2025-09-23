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
            this.transporter = nodemailer.createTransport({
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
