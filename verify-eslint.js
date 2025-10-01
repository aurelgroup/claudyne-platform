#!/usr/bin/env node

/**
 * Script de vérification de l'installation ESLint
 * Exécutez : node verify-eslint.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification de l\'installation ESLint pour Claudyne\n');
console.log('═'.repeat(60));
console.log('\n');

let allChecks = [];
let passed = 0;
let failed = 0;

// Helper pour exécuter des commandes
function runCommand(command, silent = true) {
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: silent ? 'pipe' : 'inherit' });
    return { success: true, output: output.trim() };
  } catch (error) {
    return { success: false, output: error.message };
  }
}

// Helper pour vérifier l'existence d'un fichier
function fileExists(filePath) {
  return fs.existsSync(path.join(__dirname, filePath));
}

// Helper pour afficher un check
function check(name, condition, details = '') {
  const result = condition ? '✅' : '❌';
  const status = condition ? 'PASS' : 'FAIL';

  console.log(`${result} ${name}`);
  if (details) {
    console.log(`   ${details}`);
  }
  console.log('');

  allChecks.push({ name, status, details });

  if (condition) {
    passed++;
  } else {
    failed++;
  }
}

// ==========================================
// VÉRIFICATIONS
// ==========================================

console.log('📦 VÉRIFICATION DES PACKAGES\n');

// Check 1: ESLint installé
const eslintVersion = runCommand('npm list eslint --depth=0');
check(
  'ESLint installé',
  eslintVersion.success && eslintVersion.output.includes('eslint@'),
  eslintVersion.success ? 'Version: ' + eslintVersion.output.match(/eslint@([\d.]+)/)?.[1] : 'Non installé'
);

// Check 2: @eslint/js installé
const eslintJs = runCommand('npm list @eslint/js --depth=0');
check(
  '@eslint/js installé',
  eslintJs.success,
  eslintJs.success ? 'Version: ' + eslintJs.output.match(/@eslint\/js@([\d.]+)/)?.[1] : 'Non installé'
);

console.log('📄 VÉRIFICATION DES FICHIERS DE CONFIGURATION\n');

// Check 3: eslint.config.js existe
check(
  'eslint.config.js présent',
  fileExists('eslint.config.js'),
  fileExists('eslint.config.js') ? 'Fichier de configuration trouvé' : 'Fichier manquant'
);

// Check 4: .eslintignore existe
check(
  '.eslintignore présent',
  fileExists('.eslintignore'),
  fileExists('.eslintignore') ? 'Fichier d\'ignore trouvé' : 'Fichier manquant'
);

// Check 5: .vscode/settings.json existe
check(
  '.vscode/settings.json présent',
  fileExists('.vscode/settings.json'),
  fileExists('.vscode/settings.json') ? 'Configuration VSCode trouvée' : 'Fichier manquant'
);

// Check 6: .vscode/extensions.json existe
check(
  '.vscode/extensions.json présent',
  fileExists('.vscode/extensions.json'),
  fileExists('.vscode/extensions.json') ? 'Extensions recommandées définies' : 'Fichier manquant'
);

console.log('🔧 VÉRIFICATION DES SCRIPTS NPM\n');

// Check 7: Script lint existe
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
check(
  'Script "npm run lint" configuré',
  packageJson.scripts && packageJson.scripts.lint && packageJson.scripts.lint.includes('eslint'),
  packageJson.scripts?.lint || 'Script manquant'
);

// Check 8: Script lint:fix existe
check(
  'Script "npm run lint:fix" configuré',
  packageJson.scripts && packageJson.scripts['lint:fix'] && packageJson.scripts['lint:fix'].includes('eslint'),
  packageJson.scripts?.['lint:fix'] || 'Script manquant'
);

console.log('🎯 VÉRIFICATION DES RÈGLES\n');

// Check 9: Configuration contient no-useless-escape
if (fileExists('eslint.config.js')) {
  const configContent = fs.readFileSync(path.join(__dirname, 'eslint.config.js'), 'utf8');

  check(
    'Règle "no-useless-escape" configurée',
    configContent.includes('no-useless-escape'),
    'Détection des échappements incorrects activée'
  );

  check(
    'Règle "no-invalid-regexp" configurée',
    configContent.includes('no-invalid-regexp'),
    'Détection des regex invalides activée'
  );

  check(
    'Règle "no-octal-escape" configurée',
    configContent.includes('no-octal-escape'),
    'Détection des octales obsolètes activée'
  );
}

console.log('🧪 TEST FONCTIONNEL\n');

// Check 10: ESLint peut s'exécuter
const eslintRun = runCommand('npx eslint --version', true);
check(
  'ESLint exécutable',
  eslintRun.success,
  eslintRun.success ? `Version ${eslintRun.output}` : 'Erreur d\'exécution'
);

// Check 11: Test sur un fichier simple
const testFile = path.join(__dirname, '.eslint-test-temp.js');
fs.writeFileSync(testFile, 'const x = "test\\!";');  // Erreur intentionnelle
const lintTest = runCommand(`npx eslint ${testFile}`, true);
fs.unlinkSync(testFile);

check(
  'Détection d\'erreurs fonctionne',
  lintTest.output.includes('no-useless-escape') || !lintTest.success,
  'ESLint détecte les échappements incorrects'
);

console.log('📚 VÉRIFICATION DE LA DOCUMENTATION\n');

// Check 12: Guide existe
check(
  'ESLINT-GUIDE.md présent',
  fileExists('ESLINT-GUIDE.md'),
  'Documentation utilisateur disponible'
);

// Check 13: Setup complete doc existe
check(
  'ESLINT-SETUP-COMPLETE.md présent',
  fileExists('ESLINT-SETUP-COMPLETE.md'),
  'Documentation d\'installation disponible'
);

// ==========================================
// RÉSUMÉ
// ==========================================

console.log('═'.repeat(60));
console.log('\n');
console.log('📊 RÉSUMÉ DE LA VÉRIFICATION\n');
console.log(`Total de vérifications : ${allChecks.length}`);
console.log(`✅ Réussies : ${passed}`);
console.log(`❌ Échouées : ${failed}`);
console.log(`📈 Taux de réussite : ${Math.round((passed / allChecks.length) * 100)}%`);
console.log('\n');

if (failed === 0) {
  console.log('🎉 INSTALLATION COMPLÈTE ET FONCTIONNELLE !');
  console.log('\n');
  console.log('Prochaines étapes :');
  console.log('1. Installez l\'extension VSCode ESLint');
  console.log('2. Exécutez : npm run lint:fix');
  console.log('3. Consultez ESLINT-GUIDE.md pour plus d\'infos');
  console.log('\n');
  process.exit(0);
} else {
  console.log('⚠️  INSTALLATION INCOMPLÈTE');
  console.log('\n');
  console.log('Vérifications échouées :');
  allChecks
    .filter(c => c.status === 'FAIL')
    .forEach(c => {
      console.log(`  - ${c.name}`);
      if (c.details) {
        console.log(`    ${c.details}`);
      }
    });
  console.log('\n');
  console.log('Consultez ESLINT-SETUP-COMPLETE.md pour résoudre les problèmes.');
  console.log('\n');
  process.exit(1);
}
