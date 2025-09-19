/**
 * Fixed Migration script: SQLite to PostgreSQL
 * Migrates all data from SQLite to PostgreSQL
 */

require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');
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

// Define User model for PostgreSQL
const User = postgresDb.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  gender: {
    type: DataTypes.ENUM('M', 'F', 'OTHER'),
    allowNull: true
  },
  role: {
    type: DataTypes.ENUM('PARENT', 'STUDENT', 'ADMIN', 'MODERATOR'),
    allowNull: false,
    defaultValue: 'PARENT'
  },
  userType: {
    type: DataTypes.ENUM('MANAGER', 'LEARNER', 'STUDENT', 'ADMIN'),
    allowNull: false,
    defaultValue: 'MANAGER'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  emailVerifiedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  phoneVerifiedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  twoFactorEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  twoFactorSecret: {
    type: DataTypes.STRING,
    allowNull: true
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastLoginIp: {
    type: DataTypes.INET,
    allowNull: true
  },
  failedLoginAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lockedUntil: {
    type: DataTypes.DATE,
    allowNull: true
  },
  resetPasswordToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  resetPasswordExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  emailVerificationToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  phoneVerificationCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  phoneVerificationExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  language: {
    type: DataTypes.STRING,
    defaultValue: 'fr'
  },
  timezone: {
    type: DataTypes.STRING,
    defaultValue: 'Africa/Douala'
  },
  notificationPreferences: {
    type: DataTypes.JSONB,
    defaultValue: {
      email: true,
      sms: false,
      push: true,
      prixClaudine: true,
      battles: true,
      progress: true,
      payments: true
    }
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  familyId: {
    type: DataTypes.UUID,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  paranoid: true
});

async function migrateData() {
  try {
    console.log('🚀 Starting SQLite to PostgreSQL migration...');

    // Test connections
    await sqliteDb.authenticate();
    console.log('✅ SQLite connection established');

    await postgresDb.authenticate();
    console.log('✅ PostgreSQL connection established');

    // Create PostgreSQL tables
    console.log('📊 Creating PostgreSQL tables...');
    await postgresDb.sync({ force: true });
    console.log('✅ PostgreSQL tables created');

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

          // Create user using Sequelize model
          await User.create(userData);

          console.log(`✅ Migrated user: ${userData.email || userData.phone}`);
        } catch (error) {
          console.error(`❌ Error migrating user ${user.email}:`, error.message);
        }
      }
    }

    console.log('🎉 Migration completed successfully!');
    console.log(`📊 Migrated ${users.length} users to PostgreSQL`);

    // Verify migration
    const postgresUserCount = await User.count();
    console.log(`✅ PostgreSQL now has ${postgresUserCount} users`);

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