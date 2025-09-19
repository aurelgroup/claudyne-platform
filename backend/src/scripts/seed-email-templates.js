/**
 * Script de peuplement des templates email Claudyne
 * Utilise les templates actuels comme base de données
 */

const { initializeModels } = require('../config/database');

// Templates de base avec leurs données
const emailTemplates = [
  {
    templateKey: 'WELCOME_EMAIL',
    name: 'Email de bienvenue',
    description: 'Email envoyé lors de la création d\'un nouveau compte utilisateur',
    category: 'AUTH',
    subject: '🎓 Bienvenue dans Claudyne - La force du savoir en héritage',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">Bienvenue dans Claudyne</h1>
          <p style="color: #64748b; font-size: 16px; margin: 10px 0;">La force du savoir en héritage</p>
        </div>

        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #1e293b; margin-top: 0;">Bonjour \${user.firstName} \${user.lastName} ! 👋</h2>
          <p style="color: #475569; line-height: 1.6;">
            Nous sommes ravis de vous accueillir dans la communauté Claudyne. Votre compte a été créé avec succès !
          </p>

          <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
            <h3 style="color: #1e293b; margin: 0 0 10px 0;">Vos informations de compte :</h3>
            <p style="margin: 5px 0; color: #64748b;"><strong>Email :</strong> \${user.email}</p>
            <p style="margin: 5px 0; color: #64748b;"><strong>Rôle :</strong> \${user.role}</p>
            <p style="margin: 5px 0; color: #64748b;"><strong>Type :</strong> \${user.userType}</p>
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
          <a href="\${frontendUrl}"
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
    `,
    textContent: `Bienvenue dans Claudyne - La force du savoir en héritage

Bonjour \${user.firstName} \${user.lastName} !

Nous sommes ravis de vous accueillir dans la communauté Claudyne. Votre compte a été créé avec succès !

Vos informations de compte :
- Email : \${user.email}
- Rôle : \${user.role}
- Type : \${user.userType}

Prochaines étapes :
- Explorez votre tableau de bord personnalisé
- Participez aux Battle Royale éducatifs
- Consultez vos progrès et statistiques
- Découvrez le Prix Claudine saison 2025

Accédez à Claudyne : \${frontendUrl}

En mémoire de Meffo Mehtah Tchandjio Claudine
💚 La force du savoir en héritage 💚

Équipe Claudyne - contact@claudyne.com`,
    variables: [
      'user.firstName',
      'user.lastName',
      'user.email',
      'user.role',
      'user.userType',
      'frontendUrl'
    ],
    isActive: true,
    isDefault: true
  },

  {
    templateKey: 'PASSWORD_RESET',
    name: 'Réinitialisation de mot de passe',
    description: 'Email envoyé pour la réinitialisation de mot de passe',
    category: 'AUTH',
    subject: '🔐 Réinitialisation de votre mot de passe Claudyne',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #dc2626; margin: 0;">Réinitialisation de mot de passe</h1>
          <p style="color: #64748b; font-size: 16px; margin: 10px 0;">Claudyne - La force du savoir en héritage</p>
        </div>

        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #dc2626;">
          <h2 style="color: #1e293b; margin-top: 0;">Bonjour \${user.firstName} \${user.lastName},</h2>
          <p style="color: #475569; line-height: 1.6;">
            Vous avez demandé la réinitialisation de votre mot de passe Claudyne.
            Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="\${resetUrl}"
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
    `,
    textContent: `Réinitialisation de votre mot de passe Claudyne

Bonjour \${user.firstName} \${user.lastName},

Vous avez demandé la réinitialisation de votre mot de passe Claudyne.
Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :

\${resetUrl}

⚠️ Important : Ce lien est valide pendant 1 heure seulement.
Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.

En mémoire de Meffo Mehtah Tchandjio Claudine
💚 La force du savoir en héritage 💚

Équipe Claudyne - contact@claudyne.com`,
    variables: [
      'user.firstName',
      'user.lastName',
      'resetToken',
      'resetUrl',
      'frontendUrl'
    ],
    isActive: true,
    isDefault: true
  },

  {
    templateKey: 'EMAIL_VERIFICATION',
    name: 'Vérification d\'email',
    description: 'Email envoyé pour la vérification de l\'adresse email',
    category: 'AUTH',
    subject: '✅ Vérification de votre email Claudyne',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #059669; margin: 0;">Vérification d'email</h1>
          <p style="color: #64748b; font-size: 16px; margin: 10px 0;">Claudyne - La force du savoir en héritage</p>
        </div>

        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #059669;">
          <h2 style="color: #1e293b; margin-top: 0;">Bonjour \${user.firstName} \${user.lastName},</h2>
          <p style="color: #475569; line-height: 1.6;">
            Merci de vous être inscrit sur Claudyne ! Pour activer votre compte,
            veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous :
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="\${verifyUrl}"
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
    `,
    textContent: `Vérification de votre email Claudyne

Bonjour \${user.firstName} \${user.lastName},

Merci de vous être inscrit sur Claudyne ! Pour activer votre compte,
veuillez vérifier votre adresse email en cliquant sur le lien ci-dessous :

\${verifyUrl}

🔒 Sécurité : Ce lien est valide pendant 24 heures.
Une fois votre email vérifié, vous aurez accès à toutes les fonctionnalités de Claudyne.

En mémoire de Meffo Mehtah Tchandjio Claudine
💚 La force du savoir en héritage 💚

Équipe Claudyne - contact@claudyne.com`,
    variables: [
      'user.firstName',
      'user.lastName',
      'verificationToken',
      'verifyUrl',
      'frontendUrl'
    ],
    isActive: true,
    isDefault: true
  },

  {
    templateKey: 'BATTLE_INVITATION',
    name: 'Invitation Battle Royale',
    description: 'Email d\'invitation pour participer à un Battle Royale',
    category: 'BATTLE',
    subject: '🏆 Invitation Battle Royale - \${battle.subject}',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #7c3aed; margin: 0;">🏆 Battle Royale Éducatif</h1>
          <p style="color: #64748b; font-size: 16px; margin: 10px 0;">Claudyne - La force du savoir en héritage</p>
        </div>

        <div style="background: #faf5ff; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #7c3aed;">
          <h2 style="color: #1e293b; margin-top: 0;">Bonjour \${user.firstName} ! 🎯</h2>
          <p style="color: #475569; line-height: 1.6;">
            Une nouvelle bataille éducative vous attend ! Montrez vos connaissances et grimpez au classement.
          </p>

          <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
            <h3 style="color: #7c3aed; margin: 0 0 10px 0;">📚 Détails de la bataille :</h3>
            <p style="margin: 5px 0; color: #64748b;"><strong>Matière :</strong> \${battle.subject}</p>
            <p style="margin: 5px 0; color: #64748b;"><strong>Niveau :</strong> \${battle.level}</p>
            <p style="margin: 5px 0; color: #64748b;"><strong>Date :</strong> \${battle.startTime}</p>
            <p style="margin: 5px 0; color: #64748b;"><strong>Durée :</strong> \${battle.duration} minutes</p>
            <p style="margin: 5px 0; color: #64748b;"><strong>Participants :</strong> \${battle.maxPlayers} maximum</p>
          </div>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="\${frontendUrl}/battle/\${battle.battleId}"
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
    `,
    textContent: `Battle Royale Éducatif - Invitation

Bonjour \${user.firstName} !

Une nouvelle bataille éducative vous attend ! Montrez vos connaissances et grimpez au classement.

Détails de la bataille :
- Matière : \${battle.subject}
- Niveau : \${battle.level}
- Date : \${battle.startTime}
- Durée : \${battle.duration} minutes
- Participants : \${battle.maxPlayers} maximum

Rejoindre la bataille : \${frontendUrl}/battle/\${battle.battleId}

⏰ Attention : La bataille commence bientôt !
Rejoignez-la avant qu'elle ne soit complète.

En mémoire de Meffo Mehtah Tchandjio Claudine
💚 La force du savoir en héritage 💚

Équipe Claudyne`,
    variables: [
      'user.firstName',
      'user.lastName',
      'battle.subject',
      'battle.level',
      'battle.startTime',
      'battle.duration',
      'battle.maxPlayers',
      'battle.battleId',
      'frontendUrl'
    ],
    isActive: true,
    isDefault: true
  },

  {
    templateKey: 'BATTLE_RESULTS',
    name: 'Résultats Battle Royale',
    description: 'Email des résultats d\'un Battle Royale',
    category: 'BATTLE',
    subject: '🏆 Résultats Battle Royale - \${battle.subject}',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #059669; margin: 0;">
            🥇 Résultats Battle Royale
          </h1>
          <p style="color: #64748b; font-size: 16px; margin: 10px 0;">Claudyne - La force du savoir en héritage</p>
        </div>

        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #059669;">
          <h2 style="color: #1e293b; margin-top: 0;">
            Félicitations \${user.firstName} ! 🏅
          </h2>
          <p style="color: #475569; line-height: 1.6;">
            Vous avez terminé \${battle.position}ème sur \${battle.totalParticipants} participants.
          </p>

          <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
            <h3 style="color: #059669; margin: 0 0 10px 0;">📊 Vos résultats :</h3>
            <p style="margin: 5px 0; color: #64748b;"><strong>Position :</strong> \${battle.position}/\${battle.totalParticipants}</p>
            <p style="margin: 5px 0; color: #64748b;"><strong>Score :</strong> \${battle.score} points</p>
            <p style="margin: 5px 0; color: #64748b;"><strong>Bonnes réponses :</strong> \${battle.correctAnswers}/\${battle.totalQuestions}</p>
            <p style="margin: 5px 0; color: #64748b;"><strong>Temps moyen :</strong> \${battle.averageTime}s par question</p>
            <p style="margin: 5px 0; color: #059669;"><strong>Points gagnés :</strong> +\${battle.pointsEarned} 🎖️</p>
          </div>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="\${frontendUrl}/dashboard"
             style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
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
    `,
    textContent: `Résultats Battle Royale

Félicitations \${user.firstName} !

Vous avez terminé \${battle.position}ème sur \${battle.totalParticipants} participants.

Vos résultats :
- Position : \${battle.position}/\${battle.totalParticipants}
- Score : \${battle.score} points
- Bonnes réponses : \${battle.correctAnswers}/\${battle.totalQuestions}
- Temps moyen : \${battle.averageTime}s par question
- Points gagnés : +\${battle.pointsEarned} 🎖️

Voir votre tableau de bord : \${frontendUrl}/dashboard

En mémoire de Meffo Mehtah Tchandjio Claudine
💚 La force du savoir en héritage 💚

Équipe Claudyne`,
    variables: [
      'user.firstName',
      'user.lastName',
      'battle.position',
      'battle.totalParticipants',
      'battle.score',
      'battle.correctAnswers',
      'battle.totalQuestions',
      'battle.averageTime',
      'battle.pointsEarned',
      'battle.subject',
      'frontendUrl'
    ],
    isActive: true,
    isDefault: true
  }
];

async function seedEmailTemplates() {
  try {
    console.log('🌱 Démarrage du peuplement des templates email...');

    // Initialiser les modèles
    const models = initializeModels();
    const { EmailTemplate } = models;

    // Synchroniser la base de données
    await models.sequelize.sync();

    let createdCount = 0;
    let updatedCount = 0;

    for (const templateData of emailTemplates) {
      try {
        // Vérifier si le template existe déjà
        const existingTemplate = await EmailTemplate.findOne({
          where: { templateKey: templateData.templateKey }
        });

        if (existingTemplate) {
          // Mettre à jour le template existant
          await existingTemplate.update(templateData);
          updatedCount++;
          console.log(`✅ Template mis à jour: ${templateData.name} (${templateData.templateKey})`);
        } else {
          // Créer un nouveau template
          await EmailTemplate.create(templateData);
          createdCount++;
          console.log(`🆕 Template créé: ${templateData.name} (${templateData.templateKey})`);
        }
      } catch (error) {
        console.error(`❌ Erreur avec le template ${templateData.templateKey}:`, error.message);
      }
    }

    console.log(`\n🎉 Peuplement terminé !`);
    console.log(`📊 Résumé:`);
    console.log(`   - Templates créés: ${createdCount}`);
    console.log(`   - Templates mis à jour: ${updatedCount}`);
    console.log(`   - Total: ${createdCount + updatedCount}`);

    // Fermer la connexion
    await models.sequelize.close();
    console.log('📦 Connexion fermée');

  } catch (error) {
    console.error('💥 Erreur lors du peuplement:', error);
    process.exit(1);
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  seedEmailTemplates().then(() => {
    console.log('✨ Script terminé avec succès !');
    process.exit(0);
  }).catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
}

module.exports = { seedEmailTemplates, emailTemplates };