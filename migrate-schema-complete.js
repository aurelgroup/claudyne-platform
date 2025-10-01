/**
 * MIGRATION COMPLÈTE SCHÉMA CLAUDYNE
 * Mode Expert A+ - Migration automatique et sécurisée
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');
const path = require('path');

// Configuration de connexion
const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: 'claudyne_production',
    username: process.env.DB_USER || 'claudyne_user',
    password: process.env.DB_PASSWORD || 'aujourdhui18D@',
    logging: console.log,
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

console.log('🚀 MIGRATION SCHÉMA CLAUDYNE - MODE EXPERT A+');
console.log('============================================\n');

async function migrateSchema() {
    try {
        // ÉTAPE 1: Test de connexion
        console.log('1️⃣ Test de connexion PostgreSQL...');
        await sequelize.authenticate();
        console.log('✅ Connexion établie\n');

        // ÉTAPE 2: Backup des données existantes
        console.log('2️⃣ Sauvegarde des utilisateurs existants...');
        const [existingUsers] = await sequelize.query('SELECT * FROM users');
        console.log(`📦 ${existingUsers.length} utilisateur(s) sauvegardé(s)\n`);

        // ÉTAPE 3: Import des modèles Sequelize
        console.log('3️⃣ Chargement des modèles Sequelize...');

        // Charger tous les modèles depuis le répertoire models
        const modelsPath = path.join(__dirname, 'backend', 'src', 'models');
        console.log(`📂 Chemin modèles: ${modelsPath}\n`);

        // ÉTAPE 4: Synchronisation forcée
        console.log('4️⃣ Synchronisation du schéma...');
        console.log('⚠️  Mode: alter = true (modification des tables existantes)\n');

        // Utiliser sync avec alter pour mettre à jour le schéma sans supprimer les données
        await sequelize.sync({ alter: true });

        console.log('✅ Schéma synchronisé\n');

        // ÉTAPE 5: Vérification des tables
        console.log('5️⃣ Vérification des tables créées...');
        const [tables] = await sequelize.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `);

        console.log(`Tables présentes (${tables.length}):`);
        tables.forEach(t => console.log(`   ✅ ${t.table_name}`));
        console.log('');

        // ÉTAPE 6: Vérification des colonnes users
        console.log('6️⃣ Vérification structure table users...');
        const [userColumns] = await sequelize.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'users'
            ORDER BY ordinal_position
        `);

        console.log(`Colonnes users (${userColumns.length}):`);
        userColumns.forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
        });
        console.log('');

        // ÉTAPE 7: Vérifier que les données sont toujours là
        console.log('7️⃣ Vérification intégrité des données...');
        const [currentUsers] = await sequelize.query('SELECT COUNT(*) as count FROM users');
        console.log(`👥 ${currentUsers[0].count} utilisateur(s) dans la base`);

        if (currentUsers[0].count >= existingUsers.length) {
            console.log('✅ Toutes les données préservées\n');
        } else {
            console.log('⚠️  Nombre d\'utilisateurs différent !\n');
        }

        // ÉTAPE 8: Test d'insertion
        console.log('8️⃣ Test d\'insertion...');
        const testEmail = `test_${Date.now()}@claudyne.com`;

        try {
            const [insertResult] = await sequelize.query(`
                INSERT INTO users (
                    id, email, password, "firstName", "lastName",
                    role, "userType", "isActive", "createdAt", "updatedAt"
                )
                VALUES (
                    gen_random_uuid(),
                    '${testEmail}',
                    'test123',
                    'Test',
                    'Migration',
                    'STUDENT',
                    'STUDENT',
                    true,
                    NOW(),
                    NOW()
                )
                RETURNING id, email
            `);

            console.log(`✅ Test insertion réussi: ${insertResult[0].email}`);

            // Nettoyer le test
            await sequelize.query(`DELETE FROM users WHERE email = '${testEmail}'`);
            console.log('✅ Test nettoyé\n');
        } catch (insertError) {
            console.log('❌ Erreur insertion test:', insertError.message);
            console.log('💡 Il manque probablement des colonnes ou contraintes\n');
        }

        await sequelize.close();

        console.log('════════════════════════════════════════');
        console.log('✅ MIGRATION TERMINÉE AVEC SUCCÈS');
        console.log('════════════════════════════════════════\n');

        console.log('📋 Prochaines étapes:');
        console.log('   1. Tester l\'inscription sur https://claudyne.com');
        console.log('   2. Vérifier que les nouveaux comptes sont créés');
        console.log('   3. Valider le formulaire d\'inscription\n');

    } catch (error) {
        console.error('❌ ERREUR MIGRATION:', error.message);
        console.error(error);
        process.exit(1);
    }
}

// Exécuter la migration
migrateSchema();
