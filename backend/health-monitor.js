#!/usr/bin/env node

/**
 * Health Monitor for Claudyne Backend
 * Comprehensive health checks for production servers
 * Run: node health-monitor.js
 */

const http = require('http');
const https = require('https');

const config = {
  baseUrl: process.env.BASE_URL || 'http://localhost:3001',
  checkInterval: 30000, // 30 seconds
  timeoutMs: 5000,
  verbose: process.env.VERBOSE === 'true',
};

const checks = {
  api: [],
  db: [],
  system: [],
};

const log = (level, msg) => {
  const timestamp = new Date().toISOString();
  const icon = { info: 'ℹ️', ok: '✅', warn: '⚠️', error: '❌' }[level] || '📌';
  console.log(`${timestamp} ${icon} [${level.toUpperCase()}] ${msg}`);
};

async function makeRequest(url, timeout = config.timeoutMs) {
  return new Promise((resolve, reject) => {
    const req = (url.startsWith('https') ? https : http).get(url, { timeout }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout after ${timeout}ms`));
    });

    req.on('error', reject);
  });
}

async function checkHealthEndpoint() {
  try {
    const res = await makeRequest(`${config.baseUrl}/api/health`);
    if (res.status === 200) {
      checks.api.push({ test: 'Health Endpoint', status: 'PASS', details: res.data });
      log('ok', 'Health endpoint responding');
      return true;
    } else {
      checks.api.push({ test: 'Health Endpoint', status: 'FAIL', details: `HTTP ${res.status}` });
      log('warn', `Health endpoint returned ${res.status}`);
      return false;
    }
  } catch (err) {
    checks.api.push({ test: 'Health Endpoint', status: 'FAIL', details: err.message });
    log('error', `Health endpoint check failed: ${err.message}`);
    return false;
  }
}

async function checkAuthEndpoint() {
  try {
    const res = await makeRequest(`${config.baseUrl}/api/auth/health`);
    if (res.status === 200 || res.status === 401) {
      checks.api.push({ test: 'Auth Endpoint', status: 'PASS' });
      log('ok', 'Auth endpoint accessible');
      return true;
    }
  } catch (err) {
    checks.api.push({ test: 'Auth Endpoint', status: 'FAIL', details: err.message });
    log('error', `Auth endpoint check failed: ${err.message}`);
    return false;
  }
}

async function checkDatabaseConnection() {
  try {
    const res = await makeRequest(`${config.baseUrl}/api/health/db`);
    if (res.status === 200) {
      checks.db.push({ test: 'Database Connection', status: 'PASS' });
      log('ok', 'Database connection healthy');
      return true;
    }
  } catch (err) {
    checks.db.push({ test: 'Database Connection', status: 'FAIL', details: err.message });
    log('warn', `Database check failed: ${err.message}`);
    return false;
  }
}

async function checkResponseTime() {
  try {
    const start = Date.now();
    await makeRequest(`${config.baseUrl}/api/health`);
    const duration = Date.now() - start;

    checks.system.push({ test: 'Response Time', status: duration < 1000 ? 'PASS' : 'WARN', details: `${duration}ms` });

    if (duration < 500) {
      log('ok', `Response time: ${duration}ms`);
    } else if (duration < 1000) {
      log('warn', `Slow response: ${duration}ms`);
    } else {
      log('error', `Very slow response: ${duration}ms`);
    }
    return true;
  } catch (err) {
    checks.system.push({ test: 'Response Time', status: 'FAIL' });
    return false;
  }
}

async function checkProcessHealth() {
  try {
    const res = await makeRequest(`${config.baseUrl}/api/health/process`);
    if (res.status === 200) {
      const data = JSON.parse(res.data);
      checks.system.push({ test: 'Process Health', status: 'PASS', details: data });
      log('ok', `Memory: ${Math.round(data.uptime / 60)}m uptime`);
      return true;
    }
  } catch (err) {
    log('info', 'Process health endpoint not available');
    return false;
  }
}

async function runAllChecks() {
  log('info', `Running health checks against ${config.baseUrl}`);
  checks.api = [];
  checks.db = [];
  checks.system = [];

  await Promise.all([
    checkHealthEndpoint(),
    checkAuthEndpoint(),
    checkDatabaseConnection(),
    checkResponseTime(),
    checkProcessHealth(),
  ]);

  // Summary
  const allChecks = [...checks.api, ...checks.db, ...checks.system];
  const passed = allChecks.filter((c) => c.status === 'PASS').length;
  const total = allChecks.length;

  log('info', `\n${'='.repeat(50)}`);
  log('info', `Health Check Summary: ${passed}/${total} passed`);
  log('info', `${'='.repeat(50)}\n`);

  if (config.verbose) {
    console.log(JSON.stringify(checks, null, 2));
  }

  return passed === total;
}

// Main
(async () => {
  try {
    const healthy = await runAllChecks();

    // Continuous monitoring if requested
    if (process.env.CONTINUOUS === 'true') {
      log('info', `Continuous monitoring enabled. Next check in ${config.checkInterval / 1000}s...`);
      setInterval(runAllChecks, config.checkInterval);
    } else {
      process.exit(healthy ? 0 : 1);
    }
  } catch (err) {
    log('error', `Monitor crashed: ${err.message}`);
    process.exit(1);
  }
})();
