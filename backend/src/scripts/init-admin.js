/**
 * Script d'initialisation Admin sécurisé - Claudyne
 * Crée le premier administrateur de manière sécurisée
 */

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

async function initializeAdmin() {
  try {
    // Import dynamique des modèles
    const database = require('../config/database');
    const models = database.initializeModels();
    const { User } = models;

    console.log('🔐 Initialisation du système administrateur Claudyne...\n');

    // Vérifier s'il existe déjà un admin
    const existingAdmin = await User.findOne({
      where: { role: 'ADMIN' }
    });

    if (existingAdmin) {
      console.log('⚠️  Un administrateur existe déjà:');
      console.log(`📧 Email: ${existingAdmin.email}`);
      console.log(`✅ Actif: ${existingAdmin.isActive ? 'Oui' : 'Non'}`);
      console.log(`🔓 Verrouillé: ${existingAdmin.lockedUntil ? 'Oui' : 'Non'}`);

      // Option pour réinitialiser le mot de passe
      const shouldReset = process.argv.includes('--reset-password');
      if (shouldReset) {
        console.log('\n🔄 Réinitialisation du mot de passe admin...');

        // Générer un nouveau mot de passe temporaire sécurisé
        const tempPassword = crypto.randomBytes(12).toString('base64').slice(0, 16);
        const hashedPassword = await bcrypt.hash(tempPassword, 12);

        // Mise à jour manuelle car le hook beforeUpdate n'existe pas
        await existingAdmin.update({
          password: hashedPassword,
          failedLoginAttempts: 0,
          lockedUntil: null,
          isActive: true,
          // Forcer le changement de mot de passe à la première connexion
          metadata: {
            ...existingAdmin.metadata,
            mustChangePassword: true,
            passwordResetAt: new Date()
          }
        }, {
          // Empêcher les hooks qui pourraient double-hasher
          silent: false
        });

        console.log('✅ Mot de passe admin réinitialisé!');
        console.log('\n🔐 NOUVEAUX IDENTIFIANTS (TEMPORAIRES):');
        console.log(`📧 Email: ${existingAdmin.email}`);
        console.log(`🔑 Mot de passe temporaire: ${tempPassword}`);
        console.log('\n⚠️  IMPORTANT: Changez ce mot de passe lors de la première connexion!');
        console.log('🌐 Interface Admin: http://localhost:3000/admin-interface.html');
      } else {
        console.log('\n💡 Pour réinitialiser le mot de passe, utilisez: --reset-password');
      }

      process.exit(0);
    }

    // Créer le premier admin
    console.log('👤 Création du premier administrateur système...');

    // Utiliser des variables d'environnement ou valeurs par défaut sécurisées
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@claudyne.cm';
    const tempPassword = process.env.ADMIN_TEMP_PASSWORD || crypto.randomBytes(16).toString('base64').slice(0, 20);

    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    const newAdmin = await User.create({
      id: uuidv4(),
      email: adminEmail,
      password: hashedPassword,
      firstName: 'Administrateur',
      lastName: 'Système',
      role: 'ADMIN',
      userType: 'ADMIN',
      isActive: true,
      isVerified: true,
      emailVerifiedAt: new Date(),
      language: 'fr',
      timezone: 'Africa/Douala',
      notificationPreferences: {
        email: true,
        sms: false,
        push: true,
        prixClaudine: true,
        battles: true,
        progress: true,
        payments: true
      },
      metadata: {
        mustChangePassword: true,
        createdBy: 'system-init',
        createdAt: new Date()
      },
      familyId: null
    });

    console.log('✅ Administrateur système créé avec succès!\n');
    console.log('🔐 IDENTIFIANTS ADMINISTRATEUR (TEMPORAIRES):');
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Mot de passe temporaire: ${tempPassword}`);
    console.log('\n⚠️  SÉCURITÉ IMPORTANTE:');
    console.log('1. Changez ce mot de passe lors de la première connexion');
    console.log('2. Activez l\'authentification à deux facteurs');
    console.log('3. Supprimez ce script après utilisation');
    console.log('\n🌐 Interface Admin: http://localhost:3000/admin-interface.html');

    // Test de validation
    const testUser = await User.findOne({ where: { email: adminEmail } });
    const passwordWorks = await testUser.comparePassword(tempPassword);
    console.log(`\n🧪 Test de connexion: ${passwordWorks ? '✅ RÉUSSI' : '❌ ÉCHEC'}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation admin:', error);
    process.exit(1);
  }
}

// Vérification des arguments
if (process.argv.includes('--help')) {
  console.log('📚 Script d\'initialisation Admin - Claudyne');
  console.log('\nUsage:');
  console.log('  node src/scripts/init-admin.js              # Créer le premier admin');
  console.log('  node src/scripts/init-admin.js --reset-password # Réinitialiser le mot de passe admin');
  console.log('\nVariables d\'environnement:');
  console.log('  ADMIN_EMAIL=email@domain.com    # Email admin (défaut: admin@claudyne.cm)');
  console.log('  ADMIN_TEMP_PASSWORD=password123  # Mot de passe temporaire (généré si absent)');
  process.exit(0);
}

initializeAdmin();