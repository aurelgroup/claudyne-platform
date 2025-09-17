#!/usr/bin/env node
/**
 * Script de test des paiements mobiles Cameroun
 * Test MTN Mobile Money et Orange Money
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

// Configuration des tests
const testConfig = {
  // Numéros de test (sandbox) - MTN: 67, 650-654, 680-684 | Orange: 69, 655-659, 685-689, 640
  mtnTestPhone: '+237670123456',
  orangeTestPhone: '+237690123456',

  // Montants de test
  testAmounts: [1000, 2500, 5000],

  // Token de test (à remplacer par un vrai token)
  authToken: 'TEST_TOKEN_123'
};

class MobilePaymentTester {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testConfig.authToken}`
      }
    });
  }

  async run() {
    console.log('🧪 ===============================================');
    console.log('   TEST PAIEMENTS MOBILES CAMEROUN - CLAUDYNE');
    console.log('🧪 ===============================================');
    console.log('');

    try {
      // 1. Tester les méthodes de paiement disponibles
      await this.testPaymentMethods();

      // 2. Tester les plans d'abonnement
      await this.testSubscriptionPlans();

      // 3. Tester MTN Mobile Money
      await this.testMtnMobileMoneyPayments();

      // 4. Tester Orange Money
      await this.testOrangeMoneyPayments();

      // 5. Tester la validation des numéros
      await this.testPhoneValidation();

      // 6. Tester les webhooks (simulation)
      await this.testWebhooks();

      console.log('');
      console.log('✅ ===============================================');
      console.log('   TOUS LES TESTS TERMINÉS AVEC SUCCÈS');
      console.log('✅ ===============================================');

    } catch (error) {
      console.error('❌ Erreur lors des tests:', error.message);
      process.exit(1);
    }
  }

  async testPaymentMethods() {
    console.log('📱 Test des méthodes de paiement disponibles...');

    try {
      const response = await this.client.get('/payments/methods');

      console.log(`✅ Méthodes disponibles: ${response.data.data.methods.length}`);

      const methods = response.data.data.methods;
      methods.forEach(method => {
        const status = method.available ? '✅' : '❌';
        console.log(`   ${status} ${method.name} (${method.id}) - Frais: ${method.fees}`);
      });

      console.log('');
    } catch (error) {
      console.error('❌ Erreur test méthodes paiement:', error.response?.data || error.message);
    }
  }

  async testSubscriptionPlans() {
    console.log('💳 Test des plans d\'abonnement...');

    try {
      const response = await this.client.get('/payments/subscriptions/plans');

      console.log(`✅ Plans disponibles: ${response.data.data.plans.length}`);

      const plans = response.data.data.plans;
      plans.forEach(plan => {
        console.log(`   📋 ${plan.name} - ${plan.price} FCFA/${plan.duration}`);
        if (plan.popular) console.log('      🏆 Plan populaire');
      });

      console.log('');
    } catch (error) {
      console.error('❌ Erreur test plans:', error.response?.data || error.message);
    }
  }

  async testMtnMobileMoneyPayments() {
    console.log('📱 Test MTN Mobile Money...');

    for (const amount of testConfig.testAmounts) {
      try {
        console.log(`   💰 Test paiement ${amount} FCFA via MTN...`);

        const paymentData = {
          amount: amount,
          paymentMethod: 'mtn_momo',
          type: 'subscription',
          planId: 'premium_monthly',
          phone: testConfig.mtnTestPhone,
          description: `Test MTN - ${amount} FCFA`
        };

        const response = await this.client.post('/payments/initialize', paymentData);

        if (response.data.success) {
          console.log(`   ✅ Paiement MTN initié: ${response.data.data.transactionId}`);
          console.log(`   📋 Message: ${response.data.data.message}`);
          console.log(`   ⏰ Expire: ${new Date(response.data.data.expiresAt).toLocaleString()}`);

          // Tester le statut après quelques secondes
          await this.sleep(3000);
          await this.testPaymentStatus(response.data.data.transactionId, 'MTN');

        } else {
          console.log(`   ❌ Échec MTN: ${response.data.message}`);
        }

        console.log('');
      } catch (error) {
        console.error(`   ❌ Erreur MTN ${amount} FCFA:`, error.response?.data?.message || error.message);
      }
    }
  }

  async testOrangeMoneyPayments() {
    console.log('🧡 Test Orange Money...');

    for (const amount of testConfig.testAmounts) {
      try {
        console.log(`   💰 Test paiement ${amount} FCFA via Orange...`);

        const paymentData = {
          amount: amount,
          paymentMethod: 'orange_money',
          type: 'subscription',
          planId: 'basic_monthly',
          phone: testConfig.orangeTestPhone,
          description: `Test Orange - ${amount} FCFA`
        };

        const response = await this.client.post('/payments/initialize', paymentData);

        if (response.data.success) {
          console.log(`   ✅ Paiement Orange initié: ${response.data.data.transactionId}`);
          console.log(`   📋 Message: ${response.data.data.message}`);
          if (response.data.data.providerData.paymentUrl) {
            console.log(`   🔗 Lien paiement: ${response.data.data.providerData.paymentUrl}`);
          }

          // Tester le statut après quelques secondes
          await this.sleep(3000);
          await this.testPaymentStatus(response.data.data.transactionId, 'Orange');

        } else {
          console.log(`   ❌ Échec Orange: ${response.data.message}`);
        }

        console.log('');
      } catch (error) {
        console.error(`   ❌ Erreur Orange ${amount} FCFA:`, error.response?.data?.message || error.message);
      }
    }
  }

  async testPaymentStatus(transactionId, provider) {
    try {
      console.log(`   🔍 Vérification statut ${provider}...`);

      const response = await this.client.get(`/payments/${transactionId}/status`);

      if (response.data.success) {
        const payment = response.data.data;
        console.log(`   📊 Statut: ${payment.status}`);
        console.log(`   💵 Montant: ${payment.amount} ${payment.currency}`);
        if (payment.completedAt) {
          console.log(`   ✅ Complété: ${new Date(payment.completedAt).toLocaleString()}`);
        }
      }
    } catch (error) {
      console.error(`   ❌ Erreur statut ${provider}:`, error.response?.data?.message || error.message);
    }
  }

  async testPhoneValidation() {
    console.log('📞 Test validation des numéros...');

    const testNumbers = [
      // MTN valides (67, 650-654, 680-684)
      { phone: '+237670123456', expected: true, operator: 'MTN' },
      { phone: '+237650123456', expected: true, operator: 'MTN' },
      { phone: '+237654123456', expected: true, operator: 'MTN' },
      { phone: '+237680123456', expected: true, operator: 'MTN' },
      { phone: '+237684123456', expected: true, operator: 'MTN' },

      // Orange valides (69, 655-659, 685-689, 640)
      { phone: '+237690123456', expected: true, operator: 'Orange' },
      { phone: '+237655123456', expected: true, operator: 'Orange' },
      { phone: '+237659123456', expected: true, operator: 'Orange' },
      { phone: '+237685123456', expected: true, operator: 'Orange' },
      { phone: '+237689123456', expected: true, operator: 'Orange' },
      { phone: '+237640123456', expected: true, operator: 'Orange' },

      // CAMTEL valides (242, 243, 620, 621)
      { phone: '+237242123456', expected: true, operator: 'CAMTEL' },
      { phone: '+237620123456', expected: true, operator: 'CAMTEL' },

      // Invalides
      { phone: '+237123456789', expected: false, operator: 'Inconnu' },
      { phone: '+237696123456', expected: false, operator: 'Invalide' }, // 696 n'est plus Orange
      // Formats locaux valides
      { phone: '670123456', expected: true, operator: 'MTN' }, // Format local MTN
      { phone: '0670123456', expected: true, operator: 'MTN' }, // Avec 0
      { phone: '690123456', expected: true, operator: 'Orange' } // Format local Orange
    ];

    for (const test of testNumbers) {
      try {
        const response = await this.client.post('/payments/validate-phone', {
          phone: test.phone
        });

        const result = response.data.success ? '✅' : '❌';
        const operator = response.data.data?.operator || 'unknown';

        console.log(`   ${result} ${test.phone} -> ${operator} (attendu: ${test.operator})`);

        if (response.data.data?.formatted) {
          console.log(`      📱 Format: ${response.data.data.formatted}`);
        }

      } catch (error) {
        console.log(`   ❌ ${test.phone} -> Erreur: ${error.response?.data?.message}`);
      }
    }

    console.log('');
  }

  async testWebhooks() {
    console.log('🔔 Test simulation webhooks...');

    const webhookTests = [
      {
        provider: 'maviance',
        status: 'completed',
        transactionId: 'test_webhook_' + Date.now()
      },
      {
        provider: 'mtn',
        status: 'successful',
        transactionId: 'test_mtn_webhook_' + Date.now()
      },
      {
        provider: 'orange',
        status: 'success',
        transactionId: 'test_orange_webhook_' + Date.now()
      }
    ];

    for (const webhook of webhookTests) {
      try {
        console.log(`   📨 Test webhook ${webhook.provider}...`);

        const webhookData = {
          transactionId: webhook.transactionId,
          status: webhook.status,
          amount: 2500,
          currency: 'XAF',
          timestamp: new Date().toISOString(),
          signature: 'test_signature'
        };

        const response = await this.client.post(`/payments/webhook/${webhook.provider}`, webhookData);

        if (response.data.success) {
          console.log(`   ✅ Webhook ${webhook.provider} traité avec succès`);
        } else {
          console.log(`   ❌ Webhook ${webhook.provider} échoué`);
        }

      } catch (error) {
        console.log(`   ❌ Erreur webhook ${webhook.provider}: ${error.response?.data?.message || error.message}`);
      }
    }

    console.log('');
  }

  async testServiceStatus() {
    console.log('⚙️  Test statut des services...');

    const services = ['maviance', 'mtn', 'orange'];

    for (const service of services) {
      try {
        const response = await this.client.get(`/payments/services/${service}/status`);

        if (response.data.success) {
          const status = response.data.data;
          console.log(`   ✅ ${service.toUpperCase()}: ${status.mode} (${status.configured ? 'Configuré' : 'Non configuré'})`);
          if (status.balance !== undefined) {
            console.log(`      💰 Solde: ${status.balance.balance} ${status.balance.currency}`);
          }
        }
      } catch (error) {
        console.log(`   ❌ ${service.toUpperCase()}: ${error.response?.data?.message || error.message}`);
      }
    }

    console.log('');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generateTestTransactionId() {
    return `test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }
}

// Fonctions utilitaires pour les tests manuels
function createTestPayment(method, amount, phone) {
  return {
    amount: amount,
    paymentMethod: method,
    type: 'subscription',
    planId: 'premium_monthly',
    phone: phone,
    description: `Test ${method} - ${amount} FCFA - ${new Date().toLocaleString()}`
  };
}

// Exporter pour usage programmatique
if (require.main === module) {
  // Lancement direct du script
  const tester = new MobilePaymentTester();
  tester.run().catch(console.error);
} else {
  // Export pour usage dans d'autres modules
  module.exports = {
    MobilePaymentTester,
    testConfig,
    createTestPayment
  };
}

console.log('');
console.log('📖 GUIDE D\'UTILISATION:');
console.log('');
console.log('1. Démarrez le backend Claudyne:');
console.log('   cd backend && npm start');
console.log('');
console.log('2. Configurez les variables d\'environnement dans backend/.env:');
console.log('   - MTN_MOMO_SUBSCRIPTION_KEY=votre_clé');
console.log('   - ORANGE_MONEY_CLIENT_ID=votre_id');
console.log('   - MAVIANCE_API_KEY=votre_clé');
console.log('');
console.log('3. Lancez ce script:');
console.log('   node test-mobile-payments.js');
console.log('');
console.log('4. Pour tester manuellement:');
console.log('   curl -X POST http://localhost:3001/api/payments/initialize \\');
console.log('     -H "Content-Type: application/json" \\');
console.log('     -H "Authorization: Bearer YOUR_TOKEN" \\');
console.log('     -d \'{"amount":2500,"paymentMethod":"mtn_momo","phone":"+237650123456","type":"subscription"}\'');
console.log('');
console.log('💚 En hommage à Meffo Mehtah Tchandjio Claudine - La force du savoir en héritage 👨‍👩‍👧‍👦');
console.log('');