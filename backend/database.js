/**
 * Claudyne Database Connection - PostgreSQL
 * Production-ready database connection with connection pooling
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const ClaudyneDatabaseSync = require('./sync-database');

// Fichier de stockage des utilisateurs temporaire
const usersFile = path.join(__dirname, 'users.json');

// Configuration de la base de données
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'claudyne_production',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};

// Pool de connexions avec fallback
let pool = null;
let useDatabase = false;

try {
    pool = new Pool(dbConfig);

    // Test de connexion au démarrage
    pool.connect((err, client, release) => {
        if (err) {
            console.error('❌ PostgreSQL non disponible:', err.message);
            console.log('🔄 Utilisation du mode fichier JSON temporaire');
            pool = null;
            useDatabase = false;
        } else {
            console.log(`✅ Connexion PostgreSQL établie (${dbConfig.database})`);
            useDatabase = true;
            release();
        }
    });

    // Gestion des erreurs de connexion
    pool?.on('error', (err, client) => {
        console.error('❌ Erreur PostgreSQL:', err);
        useDatabase = false;
    });
} catch (error) {
    console.error('❌ PostgreSQL non disponible, utilisation du mode fichier');
    useDatabase = false;
}

// Fonctions utilitaires pour l'authentification
class DatabaseAuth {

    // Charger les utilisateurs depuis le fichier JSON
    loadUsersFromFile() {
        try {
            if (fs.existsSync(usersFile)) {
                const data = fs.readFileSync(usersFile, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('❌ Erreur lecture fichier utilisateurs:', error);
        }
        return [];
    }

    // Sauvegarder les utilisateurs dans le fichier JSON
    saveUsersToFile(users) {
        try {
            fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
        } catch (error) {
            console.error('❌ Erreur sauvegarde fichier utilisateurs:', error);
        }
    }

    // Vérifier si un utilisateur existe par email
    async findUserByEmail(email) {
        if (useDatabase && pool) {
            const query = 'SELECT id, email, password, "firstName", "lastName", phone, role, "userType", "isActive" FROM users WHERE email = $1 AND "isActive" = true';
            try {
                const result = await pool.query(query, [email]);
                return result.rows[0] || null;
            } catch (error) {
                console.error('❌ Erreur findUserByEmail:', error);
                throw error;
            }
        } else {
            // Mode fichier JSON
            const users = this.loadUsersFromFile();
            return users.find(user => user.email === email && user.isActive) || null;
        }
    }

    // Créer un nouvel utilisateur
    async createUser(userData) {
        const { email, password, firstname, lastname, phone, role = 'PARENT', usertype = 'MANAGER' } = userData;

        if (useDatabase && pool) {
            const query = `
                INSERT INTO users (email, password, firstname, lastname, phone, role, usertype, isactive, isverified)
                VALUES ($1, $2, $3, $4, $5, $6, $7, true, false)
                RETURNING id, email, firstname, lastname, phone, role, usertype, isactive
            `;

            try {
                const result = await pool.query(query, [email, password, firstname, lastname, phone, role, usertype]);
                return result.rows[0];
            } catch (error) {
                console.error('❌ Erreur createUser:', error);
                throw error;
            }
        } else {
            // Mode fichier JSON
            const users = this.loadUsersFromFile();
            const newUser = {
                id: Date.now(), // Simple ID basé sur timestamp
                email,
                password,
                firstname,
                lastname,
                phone,
                role,
                usertype,
                isactive: true,
                isverified: false,
                createdat: new Date().toISOString()
            };

            users.push(newUser);
            this.saveUsersToFile(users);

            // Retourner l'utilisateur sans le mot de passe
            const { password: _, ...userWithoutPassword } = newUser;
            return userWithoutPassword;
        }
    }

    // Vérifier les identifiants de connexion (multi-méthodes)
    async authenticateUser(identifier, password) {
        if (useDatabase && pool) {
            // Supporter email, username, ou téléphone
            let query = `
                SELECT id, email, password, "firstName", "lastName", phone, role, "userType", "isActive"
                FROM users
                WHERE (email = $1 OR "firstName" = $1 OR "lastName" = $1 OR phone = $1)
                AND "isActive" = true
            `;

            try {
                const result = await pool.query(query, [identifier]);
                const user = result.rows[0];

                if (!user) {
                    return null;
                }

                // Dans un vrai système, on comparerait avec bcrypt
                // Pour l'instant, comparaison simple pour la compatibilité
                if (user.password === password) {
                    // Retourner l'utilisateur sans le mot de passe
                    const { password: _, ...userWithoutPassword } = user;
                    return userWithoutPassword;
                }

                return null;
            } catch (error) {
                console.error('❌ Erreur authenticateUser:', error);
                throw error;
            }
        } else {
            // Mode fichier JSON
            const users = this.loadUsersFromFile();
            const user = users.find(u =>
                (u.email === identifier || u.firstName === identifier || u.lastName === identifier || u.phone === identifier)
                && u.isActive
            );

            if (!user) {
                return null;
            }

            // Comparaison simple du mot de passe
            if (user.password === password) {
                // Retourner l'utilisateur sans le mot de passe
                const { password: _, ...userWithoutPassword } = user;
                return userWithoutPassword;
            }

            return null;
        }
    }

    // Mettre à jour la dernière connexion
    async updateLastLogin(userId) {
        if (!pool) {
            // Mode JSON - Mise à jour du fichier users.json
            try {
                const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
                const user = users.find(u => u.id === userId);
                if (user) {
                    user.lastlogin = new Date().toISOString();
                    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
                }
            } catch (error) {
                console.error('❌ Erreur updateLastLogin (JSON):', error);
            }
            return;
        }

        // Mode PostgreSQL
        const query = 'UPDATE users SET "updatedAt" = NOW(), "lastLoginAt" = NOW() WHERE id = $1';
        try {
            await pool.query(query, [userId]);
        } catch (error) {
            console.error('❌ Erreur updateLastLogin:', error);
        }
    }

    // Compter le nombre total d'utilisateurs
    async getUserCount() {
        const query = 'SELECT COUNT(*) as count FROM users WHERE isactive = true';
        try {
            const result = await pool.query(query);
            return parseInt(result.rows[0].count);
        } catch (error) {
            console.error('❌ Erreur getUserCount:', error);
            return 0;
        }
    }
}

// Export du pool et de la classe d'authentification
// Initialiser synchronisation automatique
const syncEngine = new ClaudyneDatabaseSync();

// Démarrer sync automatique en production
if (process.env.NODE_ENV === 'production') {
    syncEngine.startAutoSync(3); // Toutes les 3 minutes
}

module.exports = {
    pool,
    db: new DatabaseAuth(),
    syncEngine
};