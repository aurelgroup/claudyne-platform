'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    await queryInterface.bulkInsert('email_templates', [
      {
        id: uuidv4(),
        templateKey: 'WELCOME',
        name: 'Email de bienvenue',
        description: 'Email envoyé lors de l\'inscription d\'un nouvel utilisateur',
        category: 'AUTH',
        subject: 'Bienvenue sur Claudyne ! 🎓 Votre voyage éducatif commence',
        htmlContent: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
            <div style="padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0 0 20px 0; font-size: 28px;">🎓 Bienvenue sur Claudyne !</h1>
              <p style="font-size: 18px; margin-bottom: 30px; opacity: 0.9;">Bonjour {{userName}},</p>

              <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border-radius: 15px; padding: 30px; margin: 30px 0;">
                <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                  Félicitations ! Vous venez de rejoindre la communauté Claudyne, la plateforme éducative camerounaise qui révolutionne l'apprentissage en famille.
                </p>

                <div style="margin: 25px 0;">
                  <h3 style="color: #FFD700; margin-bottom: 15px;">🌟 Ce qui vous attend :</h3>
                  <ul style="text-align: left; padding-left: 20px; font-size: 14px; line-height: 1.8;">
                    <li>Cours interactifs adaptés au système éducatif camerounais</li>
                    <li>Battle Royale éducatif pour motiver l'apprentissage</li>
                    <li>Suivi des progrès en temps réel pour toute la famille</li>
                    <li>Prix Claudine - concours annuel avec des récompenses</li>
                  </ul>
                </div>
              </div>

              <a href="{{loginUrl}}" style="display: inline-block; background: linear-gradient(45deg, #FFD700, #FFA500); color: #1a1a1a; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; margin: 20px 0;">
                🚀 Commencer l'aventure
              </a>

              <div style="margin-top: 40px; font-size: 12px; opacity: 0.8;">
                <p>Votre email : {{email}}</p>
                <p>Date d'inscription : {{date}}</p>
              </div>
            </div>
          </div>
        `,
        textContent: 'Bienvenue sur Claudyne ! Bonjour {{userName}}, vous venez de rejoindre notre communauté éducative. Connectez-vous sur {{loginUrl}} pour commencer.',
        variables: JSON.stringify(['userName', 'email', 'loginUrl', 'date']),
        isActive: true,
        isDefault: true,
        version: 1,
        usageCount: 0,
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        templateKey: 'PASSWORD_RESET',
        name: 'Réinitialisation de mot de passe',
        description: 'Email pour réinitialiser le mot de passe',
        category: 'AUTH',
        subject: 'Réinitialisation de votre mot de passe Claudyne 🔐',
        htmlContent: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
            <div style="padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0 0 20px 0; font-size: 28px;">🔐 Réinitialisation de mot de passe</h1>
              <p style="font-size: 18px; margin-bottom: 30px; opacity: 0.9;">Bonjour {{userName}},</p>

              <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border-radius: 15px; padding: 30px; margin: 30px 0;">
                <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                  Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe.
                </p>

                <a href="{{resetLink}}" style="display: inline-block; background: linear-gradient(45deg, #FF6B6B, #FF8E8E); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; margin: 20px 0;">
                  🔓 Réinitialiser mon mot de passe
                </a>

                <div style="margin-top: 25px; font-size: 14px; opacity: 0.8;">
                  <p>⏰ Ce lien expire dans {{expiryTime}}</p>
                  <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
                </div>
              </div>
            </div>
          </div>
        `,
        textContent: 'Réinitialisation de mot de passe pour {{userName}}. Utilisez ce lien : {{resetLink}} (expire dans {{expiryTime}})',
        variables: JSON.stringify(['userName', 'email', 'resetLink', 'expiryTime']),
        isActive: true,
        isDefault: true,
        version: 1,
        usageCount: 0,
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        templateKey: 'EMAIL_VERIFICATION',
        name: 'Vérification d\'email',
        description: 'Email pour vérifier l\'adresse email',
        category: 'AUTH',
        subject: 'Vérifiez votre email Claudyne ✉️',
        htmlContent: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
            <div style="padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0 0 20px 0; font-size: 28px;">✉️ Vérification d'email</h1>
              <p style="font-size: 18px; margin-bottom: 30px; opacity: 0.9;">Bonjour {{userName}},</p>

              <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border-radius: 15px; padding: 30px; margin: 30px 0;">
                <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                  Pour finaliser votre inscription sur Claudyne, veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous.
                </p>

                <div style="background: rgba(255, 255, 255, 0.15); border-radius: 10px; padding: 20px; margin: 20px 0; font-family: 'Courier New', monospace; font-size: 24px; font-weight: bold; letter-spacing: 3px;">
                  {{verificationCode}}
                </div>

                <a href="{{verificationLink}}" style="display: inline-block; background: linear-gradient(45deg, #4ECDC4, #44A08D); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; margin: 20px 0;">
                  ✅ Vérifier mon email
                </a>

                <div style="margin-top: 25px; font-size: 14px; opacity: 0.8;">
                  <p>⏰ Ce code expire dans {{expiryTime}}</p>
                </div>
              </div>
            </div>
          </div>
        `,
        textContent: 'Vérification d\'email pour {{userName}}. Code: {{verificationCode}} ou lien: {{verificationLink}}',
        variables: JSON.stringify(['userName', 'email', 'verificationCode', 'verificationLink', 'expiryTime']),
        isActive: true,
        isDefault: true,
        version: 1,
        usageCount: 0,
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        templateKey: 'BATTLE_INVITATION',
        name: 'Invitation Battle Royale',
        description: 'Invitation à participer à un Battle Royale',
        category: 'BATTLE',
        subject: '⚔️ Battle Royale Claudyne : {{battleTitle}} !',
        htmlContent: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%); color: white;">
            <div style="padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0 0 20px 0; font-size: 28px;">⚔️ Battle Royale !</h1>
              <p style="font-size: 18px; margin-bottom: 30px; opacity: 0.9;">{{userName}}, préparez-vous !</p>

              <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border-radius: 15px; padding: 30px; margin: 30px 0;">
                <h2 style="color: #FFD700; margin-bottom: 15px;">🏆 {{battleTitle}}</h2>
                <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                  Un nouveau Battle Royale éducatif commence ! Testez vos connaissances contre d'autres étudiants camerounais.
                </p>

                <div style="margin: 25px 0;">
                  <p><strong>📚 Matière :</strong> {{subject}}</p>
                  <p><strong>⏰ Début :</strong> {{startTime}}</p>
                  <p><strong>👥 Participants :</strong> {{maxParticipants}} max</p>
                  <p><strong>🎖️ Récompense :</strong> {{reward}} points</p>
                </div>

                <a href="{{joinLink}}" style="display: inline-block; background: linear-gradient(45deg, #FFD700, #FFA500); color: #1a1a1a; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; margin: 20px 0;">
                  ⚔️ Rejoindre le Battle !
                </a>
              </div>
            </div>
          </div>
        `,
        textContent: 'Battle Royale {{battleTitle}} ! Rejoignez sur {{joinLink}}. Début: {{startTime}}',
        variables: JSON.stringify(['userName', 'battleTitle', 'subject', 'startTime', 'maxParticipants', 'reward', 'joinLink']),
        isActive: true,
        isDefault: true,
        version: 1,
        usageCount: 0,
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        templateKey: 'BATTLE_RESULTS',
        name: 'Résultats Battle Royale',
        description: 'Résultats après un Battle Royale',
        category: 'BATTLE',
        subject: '🏆 Résultats du Battle: {{battleTitle}} - {{result}}',
        htmlContent: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%); color: white;">
            <div style="padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0 0 20px 0; font-size: 28px;">🏆 Résultats du Battle !</h1>
              <p style="font-size: 18px; margin-bottom: 30px; opacity: 0.9;">{{userName}}, voici vos résultats :</p>

              <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border-radius: 15px; padding: 30px; margin: 30px 0;">
                <h2 style="color: #FFD700; margin-bottom: 15px;">{{battleTitle}}</h2>

                <div style="font-size: 48px; margin: 20px 0;">{{resultEmoji}}</div>
                <h3 style="margin: 15px 0; font-size: 24px;">{{result}}</h3>

                <div style="margin: 25px 0; font-size: 16px;">
                  <p><strong>🎯 Votre score :</strong> {{userScore}}/{{maxScore}}</p>
                  <p><strong>📊 Classement :</strong> {{rank}}/{{totalParticipants}}</p>
                  <p><strong>⭐ Points gagnés :</strong> {{pointsEarned}}</p>
                  <p><strong>📈 Progression :</strong> {{progressPercent}}%</p>
                </div>

                <a href="{{leaderboardLink}}" style="display: inline-block; background: linear-gradient(45deg, #FFD700, #FFA500); color: #1a1a1a; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; margin: 20px 0;">
                  📊 Voir le classement
                </a>
              </div>
            </div>
          </div>
        `,
        textContent: 'Résultats Battle {{battleTitle}}: {{result}}. Score: {{userScore}}/{{maxScore}}, Rang: {{rank}}/{{totalParticipants}}',
        variables: JSON.stringify(['userName', 'battleTitle', 'result', 'resultEmoji', 'userScore', 'maxScore', 'rank', 'totalParticipants', 'pointsEarned', 'progressPercent', 'leaderboardLink']),
        isActive: true,
        isDefault: true,
        version: 1,
        usageCount: 0,
        createdAt: now,
        updatedAt: now
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('email_templates', null, {});
  }
};