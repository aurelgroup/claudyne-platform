const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database/claudyne_clean.sqlite',
  logging: false
});

async function testLogin() {
  try {
    const [results] = await sequelize.query('SELECT email, password FROM Users WHERE email = ?', {
      replacements: ['admin@claudyne.com']
    });

    if (results.length > 0) {
      const user = results[0];
      console.log('✅ User found:', user.email);
      const passwordMatch = bcrypt.compareSync('admin123', user.password);
      console.log('🔑 Password test:', passwordMatch ? 'SUCCESS' : 'FAILED');
    } else {
      console.log('❌ User not found');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

testLogin();