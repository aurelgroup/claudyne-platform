/**
 * Script test email automation
 */

require('dotenv').config();
const emailService = require('./src/services/email/emailService');

const testUser = {
    firstName: 'Test',
    lastName: 'Claudyne',
    email: 'test@example.com' // Changer par votre email
};

async function testEmails() {
    console.log('📧 Test email automation Claudyne\n');

    // Test connexion
    console.log('1. Test connexion SMTP...');
    const connectionOK = await emailService.testConnection();
    console.log(connectionOK ? '✅ Connexion OK' : '❌ Connexion échouée');

    if (connectionOK) {
        // Test email bienvenue
        console.log('\n2. Test email bienvenue...');
        const welcomeOK = await emailService.sendWelcomeEmail(testUser);
        console.log(welcomeOK ? '✅ Email bienvenue envoyé' : '❌ Erreur email bienvenue');

        // Test email reset
        console.log('\n3. Test email reset password...');
        const resetOK = await emailService.sendPasswordResetEmail(testUser, 'test-token-123');
        console.log(resetOK ? '✅ Email reset envoyé' : '❌ Erreur email reset');
    }

    console.log('\n📧 Tests terminés');
}

testEmails().catch(console.error);
