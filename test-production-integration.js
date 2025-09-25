#!/usr/bin/env node

/**
 * Test d'intégration production complète Claudyne
 * Vérifie Web + API + Mobile en production
 */

const fetch = require('node-fetch');

// Configuration production
const PRODUCTION_URLS = {
  WEB: 'https://claudyne.com',
  API_HTTP: 'http://89.117.58.53:3001/api',
  API_DOMAIN: 'https://api.claudyne.com/api', // Une fois DNS configuré
  MOBILE_APK: 'https://claudyne.com/download/claudyne.apk'
};

const TEST_USER = {
  email: 'test@claudyne.com',
  password: 'test123',
  clientType: 'mobile'
};

// Couleurs
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = (message, color = colors.reset) => {
  console.log(`${color}${message}${colors.reset}`);
};

const success = (message) => log(`✅ ${message}`, colors.green);
const error = (message) => log(`❌ ${message}`, colors.red);
const info = (message) => log(`ℹ️  ${message}`, colors.blue);
const warning = (message) => log(`⚠️  ${message}`, colors.yellow);

// =================================================================
// TESTS DE PRODUCTION
// =================================================================

/**
 * Test 1: Site web en production
 */
async function testWebProduction() {
  try {
    info('Test du site web production...');

    const response = await fetch(PRODUCTION_URLS.WEB, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Claudyne Test Bot)'
      }
    });

    if (response.ok) {
      const html = await response.text();

      if (html.includes('Claudyne') && html.length > 50000) {
        success(`Site web accessible - Taille: ${html.length} bytes`);

        // Vérifier les éléments clés
        const hasTitle = html.includes('<title>') && html.includes('Claudyne');
        const hasCSS = html.includes('.css') || html.includes('style');
        const hasJS = html.includes('.js') || html.includes('script');

        if (hasTitle && hasCSS && hasJS) {
          success('Structure HTML complète détectée');
        } else {
          warning('Structure HTML incomplète');
        }

        return true;
      } else {
        error('Contenu web invalide ou trop petit');
        return false;
      }
    } else {
      error(`Site web inaccessible: ${response.status}`);
      return false;
    }
  } catch (err) {
    error(`Erreur test web: ${err.message}`);
    return false;
  }
}

/**
 * Test 2: API production (IP directe)
 */
async function testAPIProduction() {
  try {
    info('Test API production (IP directe)...');

    const response = await fetch(PRODUCTION_URLS.API_HTTP, {
      timeout: 10000,
      headers: {
        'X-Client-Type': 'mobile',
        'User-Agent': 'Claudyne Mobile Test'
      }
    });

    if (response.ok) {
      const data = await response.json();

      if (data.success && data.version && data.features) {
        success(`API production OK - Version: ${data.version}`);
        success(`Features: Mobile=${data.features.mobile}, Auth=${data.features.auth}`);
        return data;
      } else {
        error('Réponse API invalide');
        return null;
      }
    } else {
      error(`API inaccessible: ${response.status}`);
      return null;
    }
  } catch (err) {
    error(`Erreur API production: ${err.message}`);
    return null;
  }
}

/**
 * Test 3: Endpoints critiques mobile
 */
async function testMobileEndpoints() {
  try {
    info('Test des endpoints critiques mobile...');

    const headers = {
      'Content-Type': 'application/json',
      'X-Client-Type': 'mobile'
    };

    // Test courses
    const coursesResponse = await fetch(`${PRODUCTION_URLS.API_HTTP.replace('/api', '')}/api/courses`, {
      headers,
      timeout: 10000
    });

    if (coursesResponse.ok) {
      const coursesData = await coursesResponse.json();
      success(`Courses API: ${coursesData.courses?.length || 0} cours disponibles`);
    } else {
      warning('Endpoint courses non accessible');
    }

    // Test user stats
    const statsResponse = await fetch(`${PRODUCTION_URLS.API_HTTP.replace('/api', '')}/api/user/stats`, {
      headers,
      timeout: 10000
    });

    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      success(`Stats API: ${statsData.stats?.points || 0} points, streak ${statsData.stats?.currentStreak || 0}`);
    } else {
      warning('Endpoint stats non accessible');
    }

    // Test mobile config
    const configResponse = await fetch(`${PRODUCTION_URLS.API_HTTP.replace('/api', '')}/api/mobile/config`, {
      headers,
      timeout: 10000
    });

    if (configResponse.ok) {
      const configData = await configResponse.json();
      success(`Mobile config: API URL = ${configData.config?.apiUrl || 'N/A'}`);
    } else {
      warning('Endpoint mobile config non accessible');
    }

    return true;
  } catch (err) {
    error(`Erreur endpoints mobile: ${err.message}`);
    return false;
  }
}

/**
 * Test 4: Authentification mobile
 */
async function testMobileAuth() {
  try {
    info('Test authentification mobile...');

    const response = await fetch(`${PRODUCTION_URLS.API_HTTP.replace('/api', '')}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Type': 'mobile'
      },
      body: JSON.stringify(TEST_USER),
      timeout: 10000
    });

    if (response.ok) {
      const authData = await response.json();

      if (authData.success && authData.token) {
        success(`Auth mobile OK - Token: ${authData.token.substring(0, 20)}...`);
        success(`User: ${authData.user?.name || authData.user?.email || 'Test User'}`);
        return authData.token;
      } else {
        warning('Auth réponse invalide');
        return null;
      }
    } else {
      warning(`Auth mobile échoué: ${response.status}`);
      return null;
    }
  } catch (err) {
    error(`Erreur auth mobile: ${err.message}`);
    return null;
  }
}

/**
 * Test 5: Performance et optimisations Cameroun
 */
async function testPerformance() {
  try {
    info('Test performance optimisée Cameroun...');

    const startTime = Date.now();

    const response = await fetch(PRODUCTION_URLS.API_HTTP, {
      headers: {
        'X-Client-Type': 'mobile',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate'
      },
      timeout: 5000 // Test avec timeout court (3G)
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    if (response.ok) {
      const data = await response.json();

      if (responseTime < 2000) {
        success(`Performance excellente: ${responseTime}ms (< 2s pour 3G)`);
      } else if (responseTime < 5000) {
        warning(`Performance acceptable: ${responseTime}ms (< 5s pour 2G)`);
      } else {
        error(`Performance lente: ${responseTime}ms (> 5s)`);
      }

      // Vérifier les headers d'optimisation
      const hasCache = response.headers.get('cache-control');
      const hasCORS = response.headers.get('access-control-allow-origin');

      if (hasCache) success('Cache-Control header présent');
      if (hasCORS) success('CORS configuré pour mobile');

      return responseTime < 5000;
    } else {
      error('Erreur performance test');
      return false;
    }
  } catch (err) {
    if (err.type === 'request-timeout') {
      error('Timeout - Performance insuffisante pour 2G/3G');
    } else {
      error(`Erreur performance: ${err.message}`);
    }
    return false;
  }
}

/**
 * Test 6: Disponibilité APK mobile
 */
async function testAPKAvailability() {
  try {
    info('Test disponibilité APK mobile...');

    const response = await fetch(PRODUCTION_URLS.MOBILE_APK, {
      method: 'HEAD',
      timeout: 10000
    });

    if (response.ok) {
      const contentLength = response.headers.get('content-length');
      const contentType = response.headers.get('content-type');

      if (contentLength && parseInt(contentLength) > 1000000) { // > 1MB
        success(`APK disponible - Taille: ${Math.round(parseInt(contentLength) / 1024 / 1024)}MB`);
      } else {
        warning('APK semble trop petit ou invalide');
      }

      if (contentType && contentType.includes('application')) {
        success('Type de contenu APK correct');
      }

      return true;
    } else {
      error(`APK non accessible: ${response.status}`);
      return false;
    }
  } catch (err) {
    error(`Erreur test APK: ${err.message}`);
    return false;
  }
}

// =================================================================
// SCRIPT PRINCIPAL
// =================================================================

async function runProductionTests() {
  console.log('\n🚀======================================================================');
  console.log('   TEST INTÉGRATION PRODUCTION CLAUDYNE WEB + API + MOBILE');
  console.log('======================================================================🚀\n');

  let passedTests = 0;
  const totalTests = 6;

  // Test 1: Site web production
  if (await testWebProduction()) {
    passedTests++;
  }

  // Test 2: API production
  const apiData = await testAPIProduction();
  if (apiData) {
    passedTests++;
  }

  // Test 3: Endpoints mobile
  if (await testMobileEndpoints()) {
    passedTests++;
  }

  // Test 4: Auth mobile
  const authToken = await testMobileAuth();
  if (authToken) {
    passedTests++;
  }

  // Test 5: Performance
  if (await testPerformance()) {
    passedTests++;
  }

  // Test 6: APK
  if (await testAPKAvailability()) {
    passedTests++;
  }

  // Résumé final
  console.log('\n======================================================================');
  if (passedTests === totalTests) {
    success(`🎉 TOUS LES TESTS PRODUCTION RÉUSSIS (${passedTests}/${totalTests})`);
    success('✨ Claudyne est 100% opérationnel en production !');
  } else if (passedTests >= 4) {
    warning(`⚠️  ${passedTests}/${totalTests} tests réussis - Production partiellement opérationnelle`);
    info('🔧 Quelques ajustements mineurs nécessaires');
  } else {
    error(`❌ ${passedTests}/${totalTests} tests réussis - Problèmes critiques détectés`);
  }

  console.log('\n🌐 URLs PRODUCTION:');
  console.log(`   • Web: ${PRODUCTION_URLS.WEB}`);
  console.log(`   • API: ${PRODUCTION_URLS.API_HTTP}`);
  console.log(`   • APK: ${PRODUCTION_URLS.MOBILE_APK}`);

  console.log('\n📱 Prochaines étapes:');
  console.log('   1. Configurer DNS api.claudyne.com → 89.117.58.53');
  console.log('   2. Télécharger APK production depuis EAS');
  console.log('   3. Tester app mobile avec vraie API');
  console.log('   4. Déployer APK sur claudyne.com/download/');
  console.log('======================================================================\n');

  process.exit(passedTests === totalTests ? 0 : 1);
}

// Lancer les tests
runProductionTests().catch(err => {
  error(`Erreur critique: ${err.message}`);
  process.exit(1);
});