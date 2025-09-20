#!/usr/bin/env node

/**
 * Script pour réinitialiser le mot de passe administrateur
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');

// Configuration simple pour les identifiants admin
const ADMIN_CREDENTIALS = {
  email: 'admin@claudyne.com',
  password: 'admin123' // Mot de passe par défaut
};

async function resetAdminPassword() {
  try {
    console.log('🔄 Réinitialisation du mot de passe administrateur...');

    // Import des modèles
    const { sequelize, initializeModels } = require('./backend/src/config/database');
    const models = initializeModels();
    const { User } = models;

    // Tester la connexion
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données établie');

    // Chercher l'utilisateur admin
    let admin = await User.findOne({
      where: {
        email: ADMIN_CREDENTIALS.email
      }
    });

    const hashedPassword = await bcrypt.hash(ADMIN_CREDENTIALS.password, 12);

    if (admin) {
      // Mettre à jour le mot de passe
      await admin.update({
        password: hashedPassword,
        isActive: true,
        isVerified: true
      });
      console.log('✅ Mot de passe administrateur mis à jour');
    } else {
      // Créer un nouvel admin
      admin = await User.create({
        email: ADMIN_CREDENTIALS.email,
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'Claudyne',
        role: 'ADMIN',
        userType: 'ADMIN',
        isActive: true,
        isVerified: true,
        emailVerifiedAt: new Date()
      });
      console.log('✅ Nouvel administrateur créé');
    }

    console.log('\n🎯 Identifiants administrateur :');
    console.log(`📧 Email: ${ADMIN_CREDENTIALS.email}`);
    console.log(`🔑 Mot de passe: ${ADMIN_CREDENTIALS.password}`);
    console.log('\n🌐 Interface admin: https://claudyne.com/admin-secure-k7m9x4n2p8w5z1c6');

    await sequelize.close();
    console.log('\n✅ Réinitialisation terminée avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation:', error);
    process.exit(1);
  }
}

// Exécuter le script
if (require.main === module) {
  resetAdminPassword();
}

module.exports = { resetAdminPassword, ADMIN_CREDENTIALS };