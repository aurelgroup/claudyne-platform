/**
 * Script de vérification des utilisateurs Claudyne
 * Affiche les 10 derniers utilisateurs créés
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'claudyne_prod',
    user: process.env.DB_USER || 'claudyne_user',
    password: process.env.DB_PASSWORD || 'aujourdhui18D@',
    ssl: false
});

async function checkUsers() {
    try {
        console.log('🔍 Vérification des utilisateurs Claudyne...\n');

        // Test de connexion
        const client = await pool.connect();
        console.log('✅ Connexion PostgreSQL établie\n');

        // Récupérer les 10 derniers utilisateurs
        const query = `
            SELECT
                id,
                email,
                "firstName",
                "lastName",
                phone,
                role,
                "userType",
                "isActive",
                "createdAt"
            FROM users
            ORDER BY "createdAt" DESC
            LIMIT 10
        `;

        const result = await client.query(query);

        console.log(`📊 ${result.rows.length} utilisateur(s) récent(s):\n`);
        console.log('═'.repeat(100));

        result.rows.forEach((user, index) => {
            console.log(`\n${index + 1}. 👤 ${user.firstName} ${user.lastName}`);
            console.log(`   Email: ${user.email || 'N/A'}`);
            console.log(`   Phone: ${user.phone || 'N/A'}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Type: ${user.userType}`);
            console.log(`   Active: ${user.isActive ? '✅' : '❌'}`);
            console.log(`   Créé le: ${new Date(user.createdAt).toLocaleString('fr-FR')}`);
            console.log(`   ID: ${user.id}`);
        });

        console.log('\n' + '═'.repeat(100));

        // Statistiques par rôle
        const statsQuery = `
            SELECT
                role,
                COUNT(*) as count
            FROM users
            GROUP BY role
        `;
        const stats = await client.query(statsQuery);

        console.log('\n📈 Statistiques par rôle:');
        stats.rows.forEach(stat => {
            console.log(`   ${stat.role}: ${stat.count} utilisateur(s)`);
        });

        client.release();
        await pool.end();
        console.log('\n✅ Vérification terminée\n');

    } catch (error) {
        console.error('❌ Erreur:', error.message);

        // Si PostgreSQL n'est pas disponible, essayer le fichier JSON
        console.log('\n📁 Tentative de lecture du fichier users.json...');
        try {
            const fs = require('fs');
            const path = require('path');
            const usersFile = path.join(__dirname, 'backend', 'users.json');

            if (fs.existsSync(usersFile)) {
                const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
                console.log(`\n📊 ${users.length} utilisateur(s) dans users.json:\n`);

                users.forEach((user, index) => {
                    console.log(`${index + 1}. ${user.firstName || user.firstname} ${user.lastName || user.lastname}`);
                    console.log(`   Email: ${user.email}`);
                    console.log(`   Role: ${user.role}`);
                    console.log(`   Créé le: ${new Date(user.createdAt || user.createdat).toLocaleString('fr-FR')}\n`);
                });
            } else {
                console.log('❌ Fichier users.json introuvable');
            }
        } catch (jsonError) {
            console.error('❌ Erreur lecture JSON:', jsonError.message);
        }

        process.exit(1);
    }
}

checkUsers();
