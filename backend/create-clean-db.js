const { initializeModels } = require('./src/config/database');
const bcrypt = require('bcryptjs');

// Initialize all models properly
const models = initializeModels();

async function createCleanDatabase() {
  try {
    const { User, sequelize } = models;

    await sequelize.authenticate();
    console.log('✅ SQLite connected');

    await sequelize.sync({ force: true });
    console.log('✅ Tables created');

    const adminPassword = bcrypt.hashSync('admin123', 12);
    const admin = await User.create({
      email: 'admin@claudyne.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'Claudyne',
      role: 'ADMIN',
      userType: 'ADMIN',
      isActive: true,
      isVerified: true
    });

    console.log('✅ Admin created:', admin.email);
    console.log('🔑 Password: admin123');

    await sequelize.close();
    console.log('✅ Clean database ready!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createCleanDatabase();