/**
 * Script pour créer ou réinitialiser le compte administrateur
 * Usage: node scripts/create-admin.js
 */

const bcrypt = require('bcryptjs');
const database = require('../src/config/database');
const logger = require('../src/utils/logger');

async function createAdminAccount() {
  try {
    console.log('🔧 Création/Réinitialisation du compte administrateur Claudyne...\n');

    // Initialiser les modèles
    const models = database.initializeModels();
    const { User } = models;

    // Données du compte admin
    const adminData = {
      email: 'admin@claudyne.com',
      password: 'AdminClaudyne2024',
      firstName: 'Admin',
      lastName: 'Claudyne',
      role: 'ADMIN',
      userType: 'INDIVIDUAL',
      isActive: true,
      emailVerified: true,
      subscriptionStatus: 'ACTIVE',
      subscriptionPlan: 'NONE'
    };

    // Vérifier si l'admin existe déjà
    let admin = await User.findOne({ where: { email: adminData.email } });

    if (admin) {
      console.log('✅ Compte admin existant trouvé');
      console.log(`   Email: ${admin.email}`);
      console.log(`   Nom: ${admin.firstName} ${admin.lastName}`);
      console.log(`   Rôle: ${admin.role}\n`);

      // Réinitialiser le mot de passe
      const hashedPassword = await bcrypt.hash(adminData.password, 10);
      await admin.update({
        password: hashedPassword,
        isActive: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
        role: 'ADMIN'
      });

      console.log('🔄 Mot de passe réinitialisé avec succès!');
    } else {
      console.log('📝 Création d\'un nouveau compte admin...\n');

      // Hash du mot de passe
      const hashedPassword = await bcrypt.hash(adminData.password, 10);

      // Créer le compte admin
      admin = await User.create({
        ...adminData,
        password: hashedPassword
      });

      console.log('✅ Compte admin créé avec succès!');
    }

    // Afficher les détails de connexion
    console.log('\n' + '='.repeat(60));
    console.log('🔐 IDENTIFIANTS DE CONNEXION');
    console.log('='.repeat(60));
    console.log(`URL Admin: https://claudyne.com/admin-secure-k7m9x4n2p8w5z1c6`);
    console.log(`Email/Credential: ${adminData.email}`);
    console.log(`Mot de passe: ${adminData.password}`);
    console.log('='.repeat(60));
    console.log('\n✅ Script terminé avec succès!\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Erreur lors de la création du compte admin:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Exécuter le script
createAdminAccount();
