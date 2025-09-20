#!/usr/bin/env node

/**
 * Script d'initialisation SQLite pour développement
 * Crée la base de données, les tables et l'utilisateur admin par défaut
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

// Configuration admin par défaut
const ADMIN_CONFIG = {
  email: 'admin@claudyne.com',
  password: 'admin123',
  firstName: 'Admin',
  lastName: 'Claudyne'
};

async function initializeSQLiteDB() {
  try {
    console.log('🚀 Initialisation de la base de données SQLite Claudyne...');

    // Créer le dossier database s'il n'existe pas
    const databaseDir = path.join(__dirname, 'database');
    if (!fs.existsSync(databaseDir)) {
      fs.mkdirSync(databaseDir, { recursive: true });
      console.log('📁 Dossier database créé');
    }

    // Import des modèles avec configuration SQLite
    const { sequelize, initializeModels } = require('./src/config/database');
    const models = initializeModels();
    const { User, Family } = models;

    // Test de connexion
    await sequelize.authenticate();
    console.log('✅ Connexion SQLite établie');

    // Synchronisation des modèles (création des tables)
    await sequelize.sync({ force: false });
    console.log('✅ Tables SQLite synchronisées');

    // Vérifier si l'admin existe déjà
    let adminUser = await User.findOne({
      where: { email: ADMIN_CONFIG.email }
    });

    if (adminUser) {
      console.log('👤 Administrateur existe déjà, mise à jour du mot de passe...');

      // Mettre à jour le mot de passe
      const hashedPassword = await bcrypt.hash(ADMIN_CONFIG.password, 12);
      await adminUser.update({
        password: hashedPassword,
        isActive: true,
        isVerified: true,
        emailVerifiedAt: new Date()
      });

      console.log('✅ Mot de passe administrateur mis à jour');
    } else {
      console.log('👤 Création du compte administrateur...');

      // Créer une famille admin (optionnel)
      const adminFamily = await Family.create({
        id: uuidv4(),
        name: 'Famille Admin',
        displayName: 'Administration Claudyne',
        status: 'ACTIVE',
        subscriptionType: 'PREMIUM',
        subscriptionStatus: 'ACTIVE',
        country: 'Cameroun',
        language: 'fr',
        timezone: 'Africa/Douala'
      });

      // Créer l'utilisateur admin
      const hashedPassword = await bcrypt.hash(ADMIN_CONFIG.password, 12);
      adminUser = await User.create({
        id: uuidv4(),
        email: ADMIN_CONFIG.email,
        password: hashedPassword,
        firstName: ADMIN_CONFIG.firstName,
        lastName: ADMIN_CONFIG.lastName,
        role: 'ADMIN',
        userType: 'ADMIN',
        isActive: true,
        isVerified: true,
        emailVerifiedAt: new Date(),
        familyId: adminFamily.id,
        language: 'fr',
        timezone: 'Africa/Douala'
      });

      console.log('✅ Administrateur créé avec succès');
    }

    // Afficher les informations de connexion
    console.log('\n🎯 === INFORMATIONS DE CONNEXION ADMIN ===');
    console.log(`📧 Email: ${ADMIN_CONFIG.email}`);
    console.log(`🔑 Mot de passe: ${ADMIN_CONFIG.password}`);
    console.log(`🌐 Interface admin: http://localhost:3001/admin-secure-k7m9x4n2p8w5z1c6`);
    console.log('==========================================\n');

    // Statistiques de la base
    const userCount = await User.count();
    const familyCount = await Family.count();

    console.log('📊 Statistiques:');
    console.log(`   👥 Utilisateurs: ${userCount}`);
    console.log(`   🏠 Familles: ${familyCount}`);

    await sequelize.close();
    console.log('✅ Initialisation SQLite terminée avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation SQLite:', error);
    process.exit(1);
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  initializeSQLiteDB();
}

module.exports = { initializeSQLiteDB, ADMIN_CONFIG };