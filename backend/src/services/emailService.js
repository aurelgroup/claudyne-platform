/**
 * Service Email Claudyne - Gestion des notifications email
 * Configuration SMTP avec node25-ca.n0c.com
 * Support des templates de base de données
 */

const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
  constructor(models = null) {
    this.transporter = null;
    this.models = models;
    this.initializeTransporter();
  }

  /**
   * Initialise le transporteur SMTP
   */
  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'node25-ca.n0c.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false, // false pour 587 avec STARTTLS
        auth: {
          user: process.env.SMTP_USER || 'noreply@claudyne.com',
          pass: process.env.SMTP_PASS || 'Lamino12@lamino12'
        },
        tls: {
          rejectUnauthorized: false // Pour éviter les erreurs de certificat en développement
        }
      });

      logger.info('✅ Service Email Claudyne initialisé');
    } catch (error) {
      logger.error('❌ Erreur initialisation service email:', error);
    }
  }

  /**
   * Vérifie la connexion SMTP
   */
  async verifyConnection() {
    try {
      await this.transporter.verify();
      logger.info('✅ Connexion SMTP vérifiée avec succès');
      return true;
    } catch (error) {
      logger.error('❌ Erreur connexion SMTP:', error);
      return false;
    }
  }

  /**
   * Charge les modèles de base de données si disponibles
   */
  setModels(models) {
    this.models = models;
  }

  /**
   * Récupère un template depuis la base de données
   */
  async getTemplate(templateKey) {
    if (!this.models || !this.models.EmailTemplate) {
      return null;
    }

    try {
      const template = await this.models.EmailTemplate.getByKey(templateKey);
      if (template) {
        // Incrémenter le compteur d'usage
        await this.models.EmailTemplate.incrementUsage(template.id);
      }
      return template;
    } catch (error) {
      logger.warn(`Template ${templateKey} non trouvé en base de données:`, error.message);
      return null;
    }
  }

  /**
   * Remplace les variables dans le contenu du template
   */
  replaceVariables(content, variables) {
    let result = content;

    // Remplacer les variables simples et imbriquées
    Object.keys(variables).forEach(key => {
      if (typeof variables[key] === 'object' && variables[key] !== null) {
        // Variables imbriquées (ex: ${user.firstName})
        Object.keys(variables[key]).forEach(subKey => {
          const placeholder = `\${${key}.${subKey}}`;
          const value = variables[key][subKey] || '';
          result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
        });
      } else {
        // Variables simples (ex: ${resetToken})
        const placeholder = `\${${key}}`;
        const value = variables[key] || '';
        result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
      }
    });

    return result;
  }

  /**
   * Envoie un email avec un template de base de données ou fallback
   */
  async sendEmailWithTemplate(templateKey, to, variables, fallbackSubject, fallbackHtml) {
    try {
      // Essayer de récupérer le template depuis la base de données
      const template = await this.getTemplate(templateKey);

      let subject, html, text;

      if (template && template.isActive) {
        // Utiliser le template de la base de données
        subject = this.replaceVariables(template.subject, variables);
        html = this.replaceVariables(template.htmlContent, variables);
        text = template.textContent ? this.replaceVariables(template.textContent, variables) : null;

        logger.info(`📧 Utilisation du template DB: ${templateKey}`);
      } else {
        // Utiliser le template de fallback
        subject = fallbackSubject;
        html = fallbackHtml;
        text = null;

        logger.info(`📧 Utilisation du template fallback pour: ${templateKey}`);
      }

      return await this.sendEmail(to, subject, html, text);
    } catch (error) {
      logger.error(`❌ Erreur envoi email avec template ${templateKey}:`, error);
      throw error;
    }
  }

  /**
   * Envoie un email générique
   */
  async sendEmail(to, subject, html, text = null) {
    try {
      const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME || 'Équipe Claudyne'} <${process.env.EMAIL_FROM || 'noreply@claudyne.com'}>`,
        to,
        subject,
        html,
        text: text || this.stripHtml(html)
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`📧 Email envoyé avec succès à ${to}:`, result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      logger.error(`❌ Erreur envoi email à ${to}:`, error);
      throw error;
    }
  }

  /**
   * Email de bienvenue
   */
  async sendWelcomeEmail(user) {
    const templateKey = 'WELCOME_EMAIL';
    const variables = {
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: this.translateRole(user.role),
        userType: this.translateUserType(user.userType)
      },
      frontendUrl: process.env.FRONTEND_URL || 'https://claudyne.com'
    };

    // Template de fallback si pas de template en base
    const fallbackSubject = '🎓 Bienvenue dans Claudyne - La force du savoir en héritage';
    const fallbackHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">Bienvenue dans Claudyne</h1>
          <p style="color: #64748b; font-size: 16px; margin: 10px 0;">La force du savoir en héritage</p>
        </div>

        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #1e293b; margin-top: 0;">Bonjour ${user.firstName} ${user.lastName} ! 👋</h2>
          <p style="color: #475569; line-height: 1.6;">
            Nous sommes ravis de vous accueillir dans la communauté Claudyne. Votre compte a été créé avec succès !
          </p>

          <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
            <h3 style="color: #1e293b; margin: 0 0 10px 0;">Vos informations de compte :</h3>
            <p style="margin: 5px 0; color: #64748b;"><strong>Email :</strong> ${user.email}</p>
            <p style="margin: 5px 0; color: #64748b;"><strong>Rôle :</strong> ${this.translateRole(user.role)}</p>
            <p style="margin: 5px 0; color: #64748b;"><strong>Type :</strong> ${this.translateUserType(user.userType)}</p>
          </div>
        </div>

        <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #1e40af; margin-top: 0;">🚀 Prochaines étapes</h3>
          <ul style="color: #475569; line-height: 1.6; padding-left: 20px;">
            <li>Explorez votre tableau de bord personnalisé</li>
            <li>Participez aux Battle Royale éducatifs</li>
            <li>Consultez vos progrès et statistiques</li>
            <li>Découvrez le Prix Claudine saison 2025</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'https://claudyne.com'}"
             style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Accéder à Claudyne
          </a>
        </div>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; text-align: center;">
          <p style="color: #94a3b8; font-size: 14px; margin: 0;">
            En mémoire de Meffo Mehtah Tchandjio Claudine<br>
            💚 La force du savoir en héritage 💚
          </p>
          <p style="color: #94a3b8; font-size: 12px; margin: 10px 0 0 0;">
            Équipe Claudyne - <a href="mailto:contact@claudyne.com" style="color: #2563eb;">contact@claudyne.com</a>
          </p>
        </div>
      </div>
    `;

    return this.sendEmailWithTemplate(templateKey, user.email, variables, fallbackSubject, fallbackHtml);
  }

  /**
   * Email de réinitialisation de mot de passe
   */
  async sendPasswordResetEmail(user, resetToken) {
    const templateKey = 'PASSWORD_RESET';
    const resetUrl = `${process.env.FRONTEND_URL || 'https://claudyne.com'}/reset-password?token=${resetToken}`;

    const variables = {
      user: {
        firstName: user.firstName,
        lastName: user.lastName
      },
      resetToken,
      resetUrl,
      frontendUrl: process.env.FRONTEND_URL || 'https://claudyne.com'
    };

    // Template de fallback si pas de template en base
    const fallbackSubject = '🔐 Réinitialisation de votre mot de passe Claudyne';
    const fallbackHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #dc2626; margin: 0;">Réinitialisation de mot de passe</h1>
          <p style="color: #64748b; font-size: 16px; margin: 10px 0;">Claudyne - La force du savoir en héritage</p>
        </div>

        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #dc2626;">
          <h2 style="color: #1e293b; margin-top: 0;">Bonjour ${user.firstName} ${user.lastName},</h2>
          <p style="color: #475569; line-height: 1.6;">
            Vous avez demandé la réinitialisation de votre mot de passe Claudyne.
            Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}"
             style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Réinitialiser mon mot de passe
          </a>
        </div>

        <div style="background: #fffbeb; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="color: #92400e; margin: 0; font-size: 14px;">
            <strong>⚠️ Important :</strong> Ce lien est valide pendant 1 heure seulement.
            Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
          </p>
        </div>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; text-align: center;">
          <p style="color: #94a3b8; font-size: 14px; margin: 0;">
            En mémoire de Meffo Mehtah Tchandjio Claudine<br>
            💚 La force du savoir en héritage 💚
          </p>
          <p style="color: #94a3b8; font-size: 12px; margin: 10px 0 0 0;">
            Équipe Claudyne - <a href="mailto:contact@claudyne.com" style="color: #dc2626;">contact@claudyne.com</a>
          </p>
        </div>
      </div>
    `;

    return this.sendEmailWithTemplate(templateKey, user.email, variables, fallbackSubject, fallbackHtml);
  }

  /**
   * Email de vérification de compte
   */
  async sendEmailVerification(user, verificationToken) {
    const templateKey = 'EMAIL_VERIFICATION';
    const verifyUrl = `${process.env.FRONTEND_URL || 'https://claudyne.com'}/verify-email?token=${verificationToken}`;

    const variables = {
      user: {
        firstName: user.firstName,
        lastName: user.lastName
      },
      verificationToken,
      verifyUrl,
      frontendUrl: process.env.FRONTEND_URL || 'https://claudyne.com'
    };

    // Template de fallback si pas de template en base
    const fallbackSubject = '✅ Vérification de votre email Claudyne';
    const fallbackHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #059669; margin: 0;">Vérification d'email</h1>
          <p style="color: #64748b; font-size: 16px; margin: 10px 0;">Claudyne - La force du savoir en héritage</p>
        </div>

        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #059669;">
          <h2 style="color: #1e293b; margin-top: 0;">Bonjour ${user.firstName} ${user.lastName},</h2>
          <p style="color: #475569; line-height: 1.6;">
            Merci de vous être inscrit sur Claudyne ! Pour activer votre compte,
            veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous :
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}"
             style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Vérifier mon email
          </a>
        </div>

        <div style="background: #fffbeb; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="color: #92400e; margin: 0; font-size: 14px;">
            <strong>🔒 Sécurité :</strong> Ce lien est valide pendant 24 heures.
            Une fois votre email vérifié, vous aurez accès à toutes les fonctionnalités de Claudyne.
          </p>
        </div>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; text-align: center;">
          <p style="color: #94a3b8; font-size: 14px; margin: 0;">
            En mémoire de Meffo Mehtah Tchandjio Claudine<br>
            💚 La force du savoir en héritage 💚
          </p>
          <p style="color: #94a3b8; font-size: 12px; margin: 10px 0 0 0;">
            Équipe Claudyne - <a href="mailto:contact@claudyne.com" style="color: #059669;">contact@claudyne.com</a>
          </p>
        </div>
      </div>
    `;

    return this.sendEmailWithTemplate(templateKey, user.email, variables, fallbackSubject, fallbackHtml);
  }

  /**
   * Notification de Battle Royale
   */
  async sendBattleNotification(user, battleData) {
    const templateKey = battleData.type === 'invitation' ? 'BATTLE_INVITATION' : 'BATTLE_RESULTS';

    const variables = {
      user: {
        firstName: user.firstName,
        lastName: user.lastName
      },
      battle: battleData,
      frontendUrl: process.env.FRONTEND_URL || 'https://claudyne.com'
    };

    // Templates de fallback
    const fallbackSubject = `🏆 ${battleData.type === 'invitation' ? 'Invitation' : 'Résultats'} Battle Royale - ${battleData.subject}`;
    let fallbackHtml;

    if (battleData.type === 'invitation') {
      fallbackHtml = this.getBattleInvitationTemplate(user, battleData);
    } else {
      fallbackHtml = this.getBattleResultsTemplate(user, battleData);
    }

    return this.sendEmailWithTemplate(templateKey, user.email, variables, fallbackSubject, fallbackHtml);
  }

  /**
   * Template d'invitation Battle Royale
   */
  getBattleInvitationTemplate(user, battleData) {
    const joinUrl = `${process.env.FRONTEND_URL || 'https://claudyne.com'}/battle/${battleData.battleId}`;

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #7c3aed; margin: 0;">🏆 Battle Royale Éducatif</h1>
          <p style="color: #64748b; font-size: 16px; margin: 10px 0;">Claudyne - La force du savoir en héritage</p>
        </div>

        <div style="background: #faf5ff; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #7c3aed;">
          <h2 style="color: #1e293b; margin-top: 0;">Bonjour ${user.firstName} ! 🎯</h2>
          <p style="color: #475569; line-height: 1.6;">
            Une nouvelle bataille éducative vous attend ! Montrez vos connaissances et grimpez au classement.
          </p>

          <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
            <h3 style="color: #7c3aed; margin: 0 0 10px 0;">📚 Détails de la bataille :</h3>
            <p style="margin: 5px 0; color: #64748b;"><strong>Matière :</strong> ${battleData.subject}</p>
            <p style="margin: 5px 0; color: #64748b;"><strong>Niveau :</strong> ${battleData.level}</p>
            <p style="margin: 5px 0; color: #64748b;"><strong>Date :</strong> ${battleData.startTime}</p>
            <p style="margin: 5px 0; color: #64748b;"><strong>Durée :</strong> ${battleData.duration} minutes</p>
            <p style="margin: 5px 0; color: #64748b;"><strong>Participants :</strong> ${battleData.maxPlayers} maximum</p>
          </div>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${joinUrl}"
             style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Rejoindre la bataille
          </a>
        </div>

        <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="color: #92400e; margin: 0; font-size: 14px;">
            <strong>⏰ Attention :</strong> La bataille commence bientôt !
            Rejoignez-la avant qu'elle ne soit complète.
          </p>
        </div>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; text-align: center;">
          <p style="color: #94a3b8; font-size: 14px; margin: 0;">
            En mémoire de Meffo Mehtah Tchandjio Claudine<br>
            💚 La force du savoir en héritage 💚
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Template de résultats Battle Royale
   */
  getBattleResultsTemplate(user, battleData) {
    const isWinner = battleData.position === 1;
    const medalEmoji = battleData.position === 1 ? '🥇' : battleData.position === 2 ? '🥈' : battleData.position === 3 ? '🥉' : '🏅';

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: ${isWinner ? '#059669' : '#7c3aed'}; margin: 0;">
            ${medalEmoji} Résultats Battle Royale
          </h1>
          <p style="color: #64748b; font-size: 16px; margin: 10px 0;">Claudyne - La force du savoir en héritage</p>
        </div>

        <div style="background: ${isWinner ? '#f0fdf4' : '#faf5ff'}; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid ${isWinner ? '#059669' : '#7c3aed'};">
          <h2 style="color: #1e293b; margin-top: 0;">
            ${isWinner ? 'Félicitations' : 'Bravo'} ${user.firstName} ! ${medalEmoji}
          </h2>
          <p style="color: #475569; line-height: 1.6;">
            ${isWinner ? 'Vous avez remporté cette bataille éducative !' : `Vous avez terminé ${battleData.position}${battleData.position === 2 ? 'ème' : battleData.position === 3 ? 'ème' : 'ème'} sur ${battleData.totalParticipants} participants.`}
          </p>

          <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
            <h3 style="color: ${isWinner ? '#059669' : '#7c3aed'}; margin: 0 0 10px 0;">📊 Vos résultats :</h3>
            <p style="margin: 5px 0; color: #64748b;"><strong>Position :</strong> ${battleData.position}/${battleData.totalParticipants}</p>
            <p style="margin: 5px 0; color: #64748b;"><strong>Score :</strong> ${battleData.score} points</p>
            <p style="margin: 5px 0; color: #64748b;"><strong>Bonnes réponses :</strong> ${battleData.correctAnswers}/${battleData.totalQuestions}</p>
            <p style="margin: 5px 0; color: #64748b;"><strong>Temps moyen :</strong> ${battleData.averageTime}s par question</p>
            ${battleData.pointsEarned ? `<p style="margin: 5px 0; color: #059669;"><strong>Points gagnés :</strong> +${battleData.pointsEarned} 🎖️</p>` : ''}
          </div>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'https://claudyne.com'}/dashboard"
             style="background: ${isWinner ? '#059669' : '#7c3aed'}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Voir mon tableau de bord
          </a>
        </div>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; text-align: center;">
          <p style="color: #94a3b8; font-size: 14px; margin: 0;">
            En mémoire de Meffo Mehtah Tchandjio Claudine<br>
            💚 La force du savoir en héritage 💚
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Fonctions utilitaires
   */
  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '');
  }

  translateRole(role) {
    const roles = {
      'ADMIN': 'Administrateur',
      'MODERATOR': 'Modérateur',
      'PARENT': 'Parent',
      'STUDENT': 'Étudiant'
    };
    return roles[role] || role;
  }

  translateUserType(userType) {
    const types = {
      'MANAGER': 'Gestionnaire famille',
      'LEARNER': 'Parent apprenant',
      'STUDENT': 'Étudiant',
      'ADMIN': 'Administrateur'
    };
    return types[userType] || userType;
  }
}

module.exports = { EmailService };