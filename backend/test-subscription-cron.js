/**
 * Script de test pour les cron jobs de subscription
 * À exécuter directement sur le serveur pour tester les jobs
 */

const database = require('./src/config/database');
const SubscriptionService = require('./src/services/subscriptionService');
const logger = require('./src/utils/logger');

async function testSubscriptionJobs() {
  try {
    console.log('\n🧪 TEST DES CRON JOBS D\'ABONNEMENT\n');
    console.log('='.repeat(60));

    // Initialiser la base de données
    const models = database.initializeModels();
    const subscriptionService = new SubscriptionService(models);

    // Test 1: Générer le rapport quotidien
    console.log('\n📊 Test 1: Génération du rapport quotidien...');
    const report = await subscriptionService.generateDailyReport();
    console.log('✅ Rapport généré:', JSON.stringify(report, null, 2));

    // Test 2: Vérifier les essais expirés
    console.log('\n⏰ Test 2: Vérification des essais expirés...');
    const expiredTrials = await subscriptionService.checkExpiredTrials();
    console.log('✅ Résultat:', JSON.stringify(expiredTrials, null, 2));

    // Test 3: Vérifier les abonnements expirés
    console.log('\n⏰ Test 3: Vérification des abonnements expirés...');
    const expiredSubs = await subscriptionService.checkExpiredSubscriptions();
    console.log('✅ Résultat:', JSON.stringify(expiredSubs, null, 2));

    // Test 4: Envoyer les rappels d'expiration
    console.log('\n📧 Test 4: Envoi des rappels d\'expiration...');
    const reminders = await subscriptionService.sendExpirationReminders();
    console.log('✅ Résultat:', JSON.stringify(reminders, null, 2));

    console.log('\n' + '='.repeat(60));
    console.log('✅ TOUS LES TESTS SONT TERMINÉS AVEC SUCCÈS\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERREUR LORS DES TESTS:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Exécuter les tests
testSubscriptionJobs();
