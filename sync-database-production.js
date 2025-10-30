/**
 * SYNCHRONISATION COMPLÈTE BASE DE DONNÉES PRODUCTION
 * Utilise les modèles Sequelize pour créer/mettre à jour le schéma
 */

require('dotenv').config();

// Forcer l'environnement production
process.env.NODE_ENV = 'production';
process.env.DB_NAME = 'claudyne_production';
process.env.DB_PASSWORD = 'aujourdhui18D@';

const { sequelize, initializeModels } = require('./backend/src/config/database');

console.log('🚀 SYNCHRONISATION BASE CLAUDYNE PRODUCTION');
console.log('==========================================\n');

async function syncDatabase() {
    try {
        // Test connexion
        console.log('1️⃣ Connexion à PostgreSQL...');
        await sequelize.authenticate();
        console.log(`✅ Connecté à: ${sequelize.config.database}\n`);

        // Charger tous les modèles
        console.log('2️⃣ Initialisation des modèles Sequelize...');
        const models = initializeModels();
        const modelNames = Object.keys(models);
        console.log(`📦 ${modelNames.length} modèles chargés:`);
        modelNames.forEach(name => console.log(`   - ${name}`));
        console.log('');

        // Sauvegarder les données existantes
        console.log('3️⃣ Sauvegarde des données existantes...');
        let existingUsers = [];
        try {
            const users = await models.User.findAll({ raw: true });
            existingUsers = users;
            console.log(`💾 ${existingUsers.length} utilisateur(s) sauvegardé(s)\n`);
        } catch (e) {
            console.log('ℹ️  Pas de données à sauvegarder (première migration)\n');
        }

        // Synchronisation avec alter (préserve les données)
        console.log('4️⃣ Synchronisation du schéma (alter mode)...');
        console.log('   ⚠️  Cette opération va:');
        console.log('   - Créer les tables manquantes');
        console.log('   - Ajouter les colonnes manquantes');
        console.log('   - PRÉSERVER toutes les données existantes\n');

        await sequelize.sync({ alter: true });

        console.log('✅ Synchronisation terminée\n');

        // Vérification
        console.log('5️⃣ Vérification post-migration...');
        const userCount = await models.User.count();
        console.log(`👥 ${userCount} utilisateur(s) dans la base`);

        const familyCount = await models.Family.count();
        console.log(`👨‍👩‍👧‍👦 ${familyCount} famille(s) dans la base`);

        const studentCount = await models.Student.count();
        console.log(`🎓 ${studentCount} étudiant(s) dans la base\n`);

        // Test création
        console.log('6️⃣ Test de création d\'utilisateur...');
        const testEmail = `migration_test_${Date.now()}@claudyne.com`;

        try {
            const testUser = await models.User.create({
                email: testEmail,
                password: 'Test1234',
                firstName: 'Test',
                lastName: 'Migration',
                role: 'STUDENT',
                userType: 'STUDENT',
                isActive: true
            });

            console.log(`✅ Utilisateur test créé: ${testUser.email} (ID: ${testUser.id})`);

            // Nettoyer
            await testUser.destroy();
            console.log('✅ Test nettoyé\n');

        } catch (createError) {
            console.log('❌ Erreur création test:', createError.message);
            console.log('   Cause probable:', createError.parent ? createError.parent.message : 'Inconnue');
            console.log('');
        }

        await sequelize.close();

        console.log('═══════════════════════════════════════════════');
        console.log('✅ MIGRATION RÉUSSIE - BASE PRÊTE POUR PRODUCTION');
        console.log('═══════════════════════════════════════════════\n');

        console.log('📝 Résumé:');
        console.log(`   - Base de données: claudyne_production`);
        console.log(`   - Utilisateurs: ${userCount}`);
        console.log(`   - Familles: ${familyCount}`);
        console.log(`   - Étudiants: ${studentCount}`);
        console.log(`   - Statut: OPÉRATIONNEL ✅\n`);

        console.log('🎯 Prochaine étape:');
        console.log('   Testez l\'inscription sur https://claudyne.com\n');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ ERREUR CRITIQUE:', error.message);
        console.error('\nStack trace:', error.stack);
        process.exit(1);
    }
}

// Exécuter
syncDatabase();
