/**
 * Test d'inscription complet avec diagnostic
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: 'claudyne_production',
    user: process.env.DB_USER || 'claudyne_user',
    password: process.env.DB_PASSWORD || 'aujourdhui18D@',
    ssl: false
});

async function testInscription() {
    console.log('🧪 TEST D\'INSCRIPTION CLAUDYNE');
    console.log('================================\n');

    try {
        // Test 1: Connexion base de données
        console.log('1️⃣ Test connexion PostgreSQL...');
        const client = await pool.connect();
        console.log('✅ Connexion réussie\n');

        // Test 2: Vérifier les tables
        console.log('2️⃣ Vérification des tables...');
        const tablesResult = await client.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `);

        console.log(`Tables trouvées (${tablesResult.rows.length}):`);
        tablesResult.rows.forEach(row => console.log(`   - ${row.table_name}`));
        console.log('');

        // Vérifier si la table users existe
        const hasUsers = tablesResult.rows.some(r => r.table_name === 'users');
        const hasFamilies = tablesResult.rows.some(r => r.table_name === 'families');

        if (!hasUsers) {
            console.log('❌ Table "users" introuvable !');
            console.log('💡 Il faut exécuter les migrations Sequelize\n');
        } else {
            console.log('✅ Table "users" existe');
        }

        if (!hasFamilies) {
            console.log('❌ Table "families" introuvable !');
            console.log('💡 Il faut exécuter les migrations Sequelize\n');
        } else {
            console.log('✅ Table "families" existe\n');
        }

        // Test 3: Compter les utilisateurs existants
        if (hasUsers) {
            console.log('3️⃣ Utilisateurs existants...');
            const countResult = await client.query('SELECT COUNT(*) FROM users');
            console.log(`📊 ${countResult.rows[0].count} utilisateur(s) dans la base\n`);
        }

        // Test 4: Tester l'API register via fetch (simulation)
        console.log('4️⃣ Test API /api/auth/register...');
        const testData = {
            email: 'test.inscription@claudyne.com',
            password: 'Test1234',
            firstName: 'Test',
            lastName: 'Inscription',
            familyName: 'Famille Test',
            city: 'Douala',
            acceptTerms: 'true'
        };

        console.log('Données de test:', JSON.stringify(testData, null, 2));

        try {
            const response = await fetch('https://claudyne.com/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testData)
            });

            const result = await response.json();

            if (result.success) {
                console.log('✅ Inscription réussie !');
                console.log('Résultat:', JSON.stringify(result, null, 2));
            } else {
                console.log('❌ Inscription échouée');
                console.log('Erreur:', JSON.stringify(result, null, 2));
            }
        } catch (fetchError) {
            console.log('❌ Erreur lors de l\'appel API:', fetchError.message);
        }

        client.release();
        await pool.end();

        console.log('\n✅ Tests terminés');

    } catch (error) {
        console.error('❌ Erreur:', error.message);
        console.error(error);
        process.exit(1);
    }
}

testInscription();
