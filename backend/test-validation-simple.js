#!/usr/bin/env node
/**
 * Test simple de validation des numéros sans authentification
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testValidation() {
  console.log('🧪 Test de validation des préfixes Cameroun 2024');
  console.log('================================================');
  console.log('');

  // Test des numéros sans authentification (test direct des services)
  const testNumbers = [
    // MTN: 67, 650-654, 680-684
    { phone: '+237670123456', expected: 'MTN' },
    { phone: '+237650123456', expected: 'MTN' },
    { phone: '+237654123456', expected: 'MTN' },
    { phone: '+237680123456', expected: 'MTN' },
    { phone: '+237684123456', expected: 'MTN' },

    // Orange: 69, 655-659, 685-689, 640
    { phone: '+237690123456', expected: 'Orange' },
    { phone: '+237655123456', expected: 'Orange' },
    { phone: '+237659123456', expected: 'Orange' },
    { phone: '+237685123456', expected: 'Orange' },
    { phone: '+237689123456', expected: 'Orange' },
    { phone: '+237640123456', expected: 'Orange' },

    // CAMTEL: 242, 243, 620, 621
    { phone: '+237242123456', expected: 'CAMTEL' },
    { phone: '+237243123456', expected: 'CAMTEL' },
    { phone: '+237620123456', expected: 'CAMTEL' },
    { phone: '+237621123456', expected: 'CAMTEL' },

    // Invalides
    { phone: '+237696123456', expected: 'Invalide (ancien Orange)' },
    { phone: '+237665123456', expected: 'Invalide (entre plages)' },
  ];

  // Test direct avec les services
  const mavianceService = require('./src/services/mavianceService');

  console.log('Test avec service MAVIANCE:');
  console.log('---------------------------');

  testNumbers.forEach(test => {
    try {
      const operator = mavianceService.detectOperator(test.phone);
      const validation = mavianceService.validatePhoneNumber(test.phone);

      const operatorName = {
        'mtn': 'MTN',
        'orange': 'Orange',
        'camtel': 'CAMTEL',
        'unknown': 'Inconnu'
      }[operator] || operator;

      const status = validation.valid ? '✅' : '❌';
      console.log(`${status} ${test.phone} -> ${operatorName} (attendu: ${test.expected})`);

      if (validation.valid) {
        console.log(`   📱 Format: ${validation.formatted}`);
        const fees = mavianceService.calculateFees(2500, operator);
        if (fees && operator !== 'unknown') {
          console.log(`   💰 Frais 2500 FCFA: ${fees.amount} FCFA (${fees.breakdown})`);
        }
      }

    } catch (error) {
      console.log(`❌ ${test.phone} -> Erreur: ${error.message}`);
    }
  });

  console.log('');
  console.log('Test des formats multiples:');
  console.log('---------------------------');

  const formatTests = [
    '670123456',      // Format local
    '0670123456',     // Format avec 0
    '237670123456',   // Format sans +
    '+237670123456',  // Format international
  ];

  formatTests.forEach(phone => {
    try {
      const formatted = mavianceService.formatPhoneNumber(phone);
      const operator = mavianceService.detectOperator(formatted);
      const validation = mavianceService.validatePhoneNumber(formatted);

      console.log(`✅ ${phone} -> ${formatted} -> ${operator} (${validation.valid ? 'Valide' : 'Invalide'})`);
    } catch (error) {
      console.log(`❌ ${phone} -> Erreur: ${error.message}`);
    }
  });

  console.log('');
  console.log('🎯 Tests terminés !');
  console.log('');
  console.log('💡 Pour tester les endpoints API, vous devez:');
  console.log('1. Créer un compte utilisateur valide');
  console.log('2. Se connecter pour obtenir un token JWT');
  console.log('3. Utiliser ce token dans les headers Authorization');
}

// Lancer les tests
testValidation().catch(console.error);