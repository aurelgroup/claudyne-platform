#!/usr/bin/env node
/**
 * Test rapide des préfixes téléphoniques Cameroun 2024
 */

const mavianceService = require('./src/services/mavianceService');

console.log('🧪 Test validation préfixes Cameroun 2024');
console.log('================================================');
console.log('');

const testNumbers = [
  // MTN: 67XXXXXXX, 650-654XXXXXX, 680-684XXXXXX
  { phone: '+237670123456', expected: 'mtn', description: 'MTN 67X' },
  { phone: '+237650012345', expected: 'mtn', description: 'MTN 650' },
  { phone: '+237651012345', expected: 'mtn', description: 'MTN 651' },
  { phone: '+237654012345', expected: 'mtn', description: 'MTN 654' },
  { phone: '+237680012345', expected: 'mtn', description: 'MTN 680' },
  { phone: '+237684012345', expected: 'mtn', description: 'MTN 684' },

  // Orange: 69XXXXXXX, 655-659XXXXXX, 685-689XXXXXX, 640XXXXXX
  { phone: '+237690123456', expected: 'orange', description: 'Orange 69X' },
  { phone: '+237655012345', expected: 'orange', description: 'Orange 655' },
  { phone: '+237659012345', expected: 'orange', description: 'Orange 659' },
  { phone: '+237685012345', expected: 'orange', description: 'Orange 685' },
  { phone: '+237689012345', expected: 'orange', description: 'Orange 689' },
  { phone: '+237640012345', expected: 'orange', description: 'Orange 640' },

  // CAMTEL: 242XXXXXX, 243XXXXXX, 620XXXXXX, 621XXXXXX
  { phone: '+237242012345', expected: 'camtel', description: 'CAMTEL 242' },
  { phone: '+237243012345', expected: 'camtel', description: 'CAMTEL 243' },
  { phone: '+237620012345', expected: 'camtel', description: 'CAMTEL 620' },
  { phone: '+237621012345', expected: 'camtel', description: 'CAMTEL 621' },

  // Tests de limites/frontières
  { phone: '+237649012345', expected: 'unknown', description: 'Limite 649 (invalide)' },
  { phone: '+237655012345', expected: 'orange', description: 'Limite 655 (Orange)' },
  { phone: '+237660012345', expected: 'unknown', description: 'Limite 660 (invalide)' },
  { phone: '+237679012345', expected: 'unknown', description: 'Limite 679 (invalide)' },
  { phone: '+237685012345', expected: 'orange', description: 'Limite 685 (Orange)' },
  { phone: '+237690012345', expected: 'orange', description: 'Limite 690 (Orange)' },

  // Anciens préfixes (maintenant invalides)
  { phone: '+237696012345', expected: 'unknown', description: 'Ancien Orange 696 (invalide)' },
  { phone: '+237665012345', expected: 'unknown', description: 'Entre plages 665 (invalide)' },
];

console.log('Tests de validation:');
console.log('-------------------');
testNumbers.forEach(test => {
  const operator = mavianceService.detectOperator(test.phone);
  const validation = mavianceService.validatePhoneNumber(test.phone);
  const status = operator === test.expected ? '✅' : '❌';
  const validStatus = validation.valid ? '✅' : '❌';

  console.log(`${status}${validStatus} ${test.phone} -> ${operator} (attendu: ${test.expected}) - ${test.description}`);
  if (operator !== test.expected) {
    console.log(`   ⚠️  ERREUR: attendu "${test.expected}", reçu "${operator}"`);
  }
});

console.log('');
console.log('Tests de formats:');
console.log('----------------');
const formatTests = [
  { phone: '670123456', description: 'Format local' },
  { phone: '0670123456', description: 'Format avec 0' },
  { phone: '+237670123456', description: 'Format international' },
  { phone: '237670123456', description: 'Format sans +' },
];

formatTests.forEach(test => {
  const formatted = mavianceService.formatPhoneNumber(test.phone);
  const operator = mavianceService.detectOperator(formatted);
  const validation = mavianceService.validatePhoneNumber(formatted);

  console.log(`✅ ${test.phone} -> ${formatted} -> ${operator} (${validation.valid ? 'Valide' : 'Invalide'}) - ${test.description}`);
});

console.log('');
console.log('🎯 Test terminé !');