/**
 * Migration script: SQLite to PostgreSQL
 * Migrates all data from SQLite to PostgreSQL
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');

// SQLite connection (source)
const sqliteDb = new Sequelize({
  dialect: 'sqlite',
  storage: './database/claudyne_production.sqlite',
  logging: console.log
});

// PostgreSQL connection (destination)
const postgresDb = new Sequelize(
  'claudyne_production',
  'claudyne_user',
  'claudyne_secure_prod_2025',
  {
    host: 'localhost',
    dialect: 'postgres',
    logging: console.log
  }
);

// Import models for both databases
const { initializeModels } = require('./src/config/database');

async function migrateData() {
  try {
    console.log('🚀 Starting SQLite to PostgreSQL migration...');

    // Test connections
    await sqliteDb.authenticate();
    console.log('✅ SQLite connection established');

    await postgresDb.authenticate();
    console.log('✅ PostgreSQL connection established');

    // Initialize PostgreSQL models and create tables
    console.log('📊 Creating PostgreSQL tables...');

    // Temporarily override sequelize for model initialization
    const originalSequelize = global.sequelize;
    global.sequelize = postgresDb;

    const models = initializeModels();
    await postgresDb.sync({ force: true }); // This will recreate all tables

    global.sequelize = originalSequelize;
    console.log('✅ PostgreSQL tables created');

    // Import User model for SQLite
    const UserSQLite = require('./src/models/User')(sqliteDb);

    // Get data from SQLite
    console.log('📥 Exporting data from SQLite...');
    const users = await sqliteDb.query('SELECT * FROM users WHERE deletedAt IS NULL', {
      type: Sequelize.QueryTypes.SELECT
    });

    console.log(`Found ${users.length} users to migrate`);

    // Insert data into PostgreSQL
    if (users.length > 0) {
      console.log('📤 Importing data to PostgreSQL...');

      for (const user of users) {
        try {
          // Convert dates properly
          const userData = {
            ...user,
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt),
            deletedAt: user.deletedAt ? new Date(user.deletedAt) : null,
            lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt) : null,
            emailVerifiedAt: user.emailVerifiedAt ? new Date(user.emailVerifiedAt) : null,
            phoneVerifiedAt: user.phoneVerifiedAt ? new Date(user.phoneVerifiedAt) : null,
            lockedUntil: user.lockedUntil ? new Date(user.lockedUntil) : null,
            resetPasswordExpires: user.resetPasswordExpires ? new Date(user.resetPasswordExpires) : null,
            phoneVerificationExpires: user.phoneVerificationExpires ? new Date(user.phoneVerificationExpires) : null
          };

          await postgresDb.query(`
            INSERT INTO users (
              id, email, phone, password, "firstName", "lastName", avatar, "dateOfBirth",
              gender, role, "userType", "isActive", "isVerified", "emailVerifiedAt",
              "phoneVerifiedAt", "twoFactorEnabled", "twoFactorSecret", "lastLoginAt",
              "lastLoginIp", "failedLoginAttempts", "lockedUntil", "resetPasswordToken",
              "resetPasswordExpires", "emailVerificationToken", "phoneVerificationCode",
              "phoneVerificationExpires", language, timezone, "notificationPreferences",
              metadata, "familyId", "createdAt", "updatedAt", "deletedAt"
            ) VALUES (
              :id, :email, :phone, :password, :firstName, :lastName, :avatar, :dateOfBirth,
              :gender, :role, :userType, :isActive, :isVerified, :emailVerifiedAt,
              :phoneVerifiedAt, :twoFactorEnabled, :twoFactorSecret, :lastLoginAt,
              :lastLoginIp, :failedLoginAttempts, :lockedUntil, :resetPasswordToken,
              :resetPasswordExpires, :emailVerificationToken, :phoneVerificationCode,
              :phoneVerificationExpires, :language, :timezone, :notificationPreferences,
              :metadata, :familyId, :createdAt, :updatedAt, :deletedAt
            )
          `, {
            replacements: userData,
            type: Sequelize.QueryTypes.INSERT
          });

          console.log(`✅ Migrated user: ${userData.email || userData.phone}`);
        } catch (error) {
          console.error(`❌ Error migrating user ${user.email}:`, error.message);
        }
      }
    }

    console.log('🎉 Migration completed successfully!');
    console.log(`📊 Migrated ${users.length} users to PostgreSQL`);

    // Verify migration
    const postgresUserCount = await postgresDb.query(
      'SELECT COUNT(*) as count FROM users',
      { type: Sequelize.QueryTypes.SELECT }
    );

    console.log(`✅ PostgreSQL now has ${postgresUserCount[0].count} users`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sqliteDb.close();
    await postgresDb.close();
  }
}

// Run migration
if (require.main === module) {
  migrateData()
    .then(() => {
      console.log('🏁 Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateData };