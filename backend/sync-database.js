/**
 * CLAUDYNE DATABASE SYNCHRONIZATION ENGINE
 * Synchronisation bidirectionnelle JSON ↔ PostgreSQL
 * Automatisation complète avec monitoring
 * En hommage à Meffo Mehtah Tchandjio Claudine
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

class ClaudyneDatabaseSync {
    constructor() {
        this.usersFile = path.join(__dirname, 'users.json');
        this.logFile = path.join(__dirname, 'logs', 'sync.log');

        // Configuration PostgreSQL
        this.pgConfig = {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            database: process.env.DB_NAME || 'claudyne_production',
            user: process.env.DB_USER || 'claudyne_user',
            password: process.env.DB_PASSWORD || 'aujourdhui18D@',
            ssl: false,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
        };

        this.pool = null;
        this.isPostgresAvailable = false;

        this.initializeSync();
    }

    // ========================================
    // INITIALISATION
    // ========================================

    async initializeSync() {
        this.log('🚀 Initialisation Claudyne Database Sync Engine');

        // Créer répertoire logs
        const logsDir = path.dirname(this.logFile);
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }

        // Tester connexion PostgreSQL
        await this.testPostgreSQLConnection();

        // Première synchronisation
        if (this.isPostgresAvailable) {
            await this.syncJSONToPostgreSQL();
        }
    }

    async testPostgreSQLConnection() {
        try {
            this.pool = new Pool(this.pgConfig);

            const client = await this.pool.connect();
            await client.query('SELECT NOW()');
            client.release();

            this.isPostgresAvailable = true;
            this.log('✅ PostgreSQL connexion établie');

            // Créer table users si inexistante
            await this.ensureUsersTable();

        } catch (error) {
            this.isPostgresAvailable = false;
            this.log(`❌ PostgreSQL indisponible: ${error.message}`);
            this.log('🔄 Mode JSON pur activé');
        }
    }

    async ensureUsersTable() {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS users (
                id BIGSERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE,
                password VARCHAR(255) NOT NULL,
                "firstName" VARCHAR(255) NOT NULL,
                "lastName" VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                role VARCHAR(50) DEFAULT 'PARENT',
                "userType" VARCHAR(50) DEFAULT 'MANAGER',
                "isActive" BOOLEAN DEFAULT true,
                "isVerified" BOOLEAN DEFAULT false,
                "createdAt" TIMESTAMP DEFAULT NOW(),
                "updatedAt" TIMESTAMP DEFAULT NOW(),
                "lastLogin" TIMESTAMP
            );
        `;

        try {
            await this.pool.query(createTableQuery);
            this.log('✅ Table users créée/vérifiée');
        } catch (error) {
            this.log(`❌ Erreur création table: ${error.message}`);
        }
    }

    // ========================================
    // SYNCHRONISATION JSON → POSTGRESQL
    // ========================================

    async syncJSONToPostgreSQL() {
        if (!this.isPostgresAvailable) {
            this.log('⚠️ PostgreSQL indisponible - Sync annulée');
            return false;
        }

        try {
            const jsonUsers = this.loadJSONUsers();
            let syncCount = 0;

            this.log(`🔄 Sync JSON → PostgreSQL (${jsonUsers.length} utilisateurs)`);

            for (const user of jsonUsers) {
                const synced = await this.syncUserToPostgreSQL(user);
                if (synced) syncCount++;
            }

            this.log(`✅ Sync terminée: ${syncCount}/${jsonUsers.length} utilisateurs`);
            return true;

        } catch (error) {
            this.log(`❌ Erreur sync JSON → PostgreSQL: ${error.message}`);
            return false;
        }
    }

    async syncUserToPostgreSQL(jsonUser) {
        const upsertQuery = `
            INSERT INTO users (
                id, email, password, "firstName", "lastName", phone,
                role, "userType", "isActive", "isVerified", "createdAt", "lastLogin"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            ON CONFLICT (email) DO UPDATE SET
                password = EXCLUDED.password,
                "firstName" = EXCLUDED."firstName",
                "lastName" = EXCLUDED."lastName",
                phone = EXCLUDED.phone,
                role = EXCLUDED.role,
                "userType" = EXCLUDED."userType",
                "isActive" = EXCLUDED."isActive",
                "isVerified" = EXCLUDED."isVerified",
                "lastLogin" = EXCLUDED."lastLogin",
                "updatedAt" = NOW()
            RETURNING id;
        `;

        try {
            const values = [
                jsonUser.id,
                jsonUser.email,
                jsonUser.password,
                jsonUser.firstName,
                jsonUser.lastName,
                jsonUser.phone,
                jsonUser.role || 'PARENT',
                jsonUser.userType || 'MANAGER',
                jsonUser.isActive !== false,
                jsonUser.isVerified || false,
                jsonUser.createdAt ? new Date(jsonUser.createdAt) : new Date(),
                jsonUser.lastLogin ? new Date(jsonUser.lastLogin) : null
            ];

            const result = await this.pool.query(upsertQuery, values);
            return result.rows[0]?.id;

        } catch (error) {
            this.log(`❌ Erreur sync utilisateur ${jsonUser.email}: ${error.message}`);
            return false;
        }
    }

    // ========================================
    // SYNCHRONISATION POSTGRESQL → JSON
    // ========================================

    async syncPostgreSQLToJSON() {
        if (!this.isPostgresAvailable) {
            this.log('⚠️ PostgreSQL indisponible - Sync annulée');
            return false;
        }

        try {
            const pgUsers = await this.loadPostgreSQLUsers();

            this.log(`🔄 Sync PostgreSQL → JSON (${pgUsers.length} utilisateurs)`);

            // Convertir au format JSON
            const jsonUsers = pgUsers.map(user => ({
                id: parseInt(user.id),
                email: user.email,
                password: user.password,
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
                role: user.role,
                userType: user.userType,
                isActive: user.isActive,
                isVerified: user.isVerified,
                createdAt: user.createdAt.toISOString(),
                lastLogin: user.lastLogin ? user.lastLogin.toISOString() : null
            }));

            this.saveJSONUsers(jsonUsers);
            this.log(`✅ Sync PostgreSQL → JSON terminée: ${jsonUsers.length} utilisateurs`);

            return true;

        } catch (error) {
            this.log(`❌ Erreur sync PostgreSQL → JSON: ${error.message}`);
            return false;
        }
    }

    async loadPostgreSQLUsers() {
        const query = `
            SELECT id, email, password, "firstName", "lastName", phone,
                   role, "userType", "isActive", "isVerified", "createdAt", "lastLogin"
            FROM users
            WHERE "isActive" = true
            ORDER BY "createdAt" DESC
        `;

        const result = await this.pool.query(query);
        return result.rows;
    }

    // ========================================
    // SYNCHRONISATION BIDIRECTIONNELLE
    // ========================================

    async performFullSync() {
        this.log('🔄 === SYNCHRONISATION BIDIRECTIONNELLE COMPLÈTE ===');

        if (!this.isPostgresAvailable) {
            await this.testPostgreSQLConnection();
        }

        if (this.isPostgresAvailable) {
            // 1. JSON → PostgreSQL
            await this.syncJSONToPostgreSQL();

            // 2. PostgreSQL → JSON (pour récupérer IDs et timestamps)
            await this.syncPostgreSQLToJSON();
        } else {
            this.log('⚠️ Mode JSON pur - Pas de synchronisation PostgreSQL');
        }

        this.log('✅ === SYNCHRONISATION TERMINÉE ===');
    }

    // ========================================
    // UTILITAIRES JSON
    // ========================================

    loadJSONUsers() {
        try {
            if (fs.existsSync(this.usersFile)) {
                const data = fs.readFileSync(this.usersFile, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            this.log(`❌ Erreur lecture JSON: ${error.message}`);
        }
        return [];
    }

    saveJSONUsers(users) {
        try {
            fs.writeFileSync(this.usersFile, JSON.stringify(users, null, 2));
            this.log(`✅ JSON sauvegardé: ${users.length} utilisateurs`);
        } catch (error) {
            this.log(`❌ Erreur sauvegarde JSON: ${error.message}`);
        }
    }

    // ========================================
    // MONITORING ET LOGS
    // ========================================

    log(message) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${message}`;

        console.log(logEntry);

        try {
            fs.appendFileSync(this.logFile, logEntry + '\n');
        } catch (error) {
            console.error('Erreur écriture log:', error.message);
        }
    }

    // ========================================
    // SURVEILLANCE AUTOMATIQUE
    // ========================================

    startAutoSync(intervalMinutes = 5) {
        this.log(`🔄 Synchronisation automatique activée (${intervalMinutes} min)`);

        setInterval(async () => {
            await this.performFullSync();
        }, intervalMinutes * 60 * 1000);
    }

    // ========================================
    // API PUBLIQUE
    // ========================================

    async getStatus() {
        const jsonUsers = this.loadJSONUsers();
        let pgUsers = 0;

        if (this.isPostgresAvailable) {
            try {
                const result = await this.pool.query('SELECT COUNT(*) FROM users WHERE "isActive" = true');
                pgUsers = parseInt(result.rows[0].count);
            } catch (error) {
                this.log(`❌ Erreur count PostgreSQL: ${error.message}`);
            }
        }

        return {
            postgresAvailable: this.isPostgresAvailable,
            jsonUsers: jsonUsers.length,
            postgresUsers: pgUsers,
            lastSync: new Date().toISOString(),
            database: this.pgConfig.database
        };
    }
}

// ========================================
// EXPORT ET UTILISATION
// ========================================

module.exports = ClaudyneDatabaseSync;

// Utilisation directe si script exécuté
if (require.main === module) {
    require('dotenv').config();

    const sync = new ClaudyneDatabaseSync();

    // Arguments en ligne de commande
    const args = process.argv.slice(2);

    if (args.includes('--full-sync')) {
        setTimeout(() => sync.performFullSync(), 1000);
    } else if (args.includes('--auto-sync')) {
        setTimeout(() => sync.startAutoSync(2), 1000); // Toutes les 2 minutes
    } else if (args.includes('--status')) {
        setTimeout(async () => {
            const status = await sync.getStatus();
            console.log('📊 STATUS CLAUDYNE DATABASE:');
            console.log(JSON.stringify(status, null, 2));
        }, 1000);
    } else {
        console.log(`
🎓 CLAUDYNE DATABASE SYNC ENGINE
En hommage à Meffo Mehtah Tchandjio Claudine

Usage:
  node sync-database.js --full-sync     # Synchronisation complète
  node sync-database.js --auto-sync     # Synchronisation automatique
  node sync-database.js --status        # Statut des bases
        `);
    }
}