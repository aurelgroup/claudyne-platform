/**
 * 📊 MONITORING AVANCÉ CLAUDYNE
 * Surveillance temps réel pour familles camerounaises
 */

const logger = require('../utils/logger');
const { exec } = require('child_process');
const fs = require('fs').promises;
const http = require('http');
const path = require('path');

class HealthMonitor {
  constructor(config) {
    this.config = config;
    this.metrics = {
      uptime: process.uptime(),
      requests: 0,
      errors: 0,
      slowRequests: 0,
      averageResponseTime: 0,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      lastHealthCheck: new Date(),
      services: {
        api: 'unknown',
        database: 'unknown',
        mobile: 'unknown',
        sync: 'unknown'
      }
    };

    this.alerts = {
      errorThreshold: 10,           // 10 erreurs/5min
      responseTimeThreshold: 3000,  // 3s pour Cameroun
      memoryThreshold: 85,          // 85% RAM
      cpuThreshold: 80,             // 80% CPU
      diskThreshold: 90             // 90% disque
    };

    this.responseTimes = [];
    this.startTime = Date.now();

    this.startMonitoring();
  }

  // 🚀 DÉMARRAGE MONITORING
  startMonitoring() {
    logger.info('📊 Health monitor started');

    // Health checks périodiques
    setInterval(() => this.performHealthChecks(), 60000);      // 1 min
    setInterval(() => this.checkSystemResources(), 30000);     // 30s
    setInterval(() => this.checkEndpoints(), 120000);          // 2 min
    setInterval(() => this.generateReport(), 300000);          // 5 min
    setInterval(() => this.cleanupMetrics(), 600000);          // 10 min

    // Health check initial
    setTimeout(() => this.performHealthChecks(), 5000);
  }

  // 🩺 HEALTH CHECKS COMPLETS
  async performHealthChecks() {
    logger.info('🔍 Performing health checks...');

    const checks = await Promise.allSettled([
      this.checkAPIHealth(),
      this.checkDatabaseHealth(),
      this.checkMobileAPIHealth(),
      this.checkSyncService(),
      this.checkDiskSpace(),
      this.checkNetworkConnectivity()
    ]);

    const results = checks.map((check, index) => ({
      name: ['API', 'Database', 'Mobile API', 'Sync', 'Disk', 'Network'][index],
      status: check.status,
      value: check.value || check.reason?.message
    }));

    this.updateServiceStatus(results);
    this.metrics.lastHealthCheck = new Date();

    logger.info('Health checks completed', { results: results.length });
  }

  // 🌐 CHECK API PRINCIPAL
  async checkAPIHealth() {
    return new Promise((resolve, reject) => {
      const port = this.config?.app?.port || 3001;
      const options = {
        hostname: 'localhost',
        port: port,
        path: '/health',
        timeout: 5000
      };

      const req = http.get(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const healthData = JSON.parse(data);
            this.metrics.services.api = healthData.status === 'healthy' ? 'operational' : 'degraded';
            resolve(healthData);
          } catch (error) {
            this.metrics.services.api = 'error';
            reject(error);
          }
        });
      });

      req.on('error', (error) => {
        this.metrics.services.api = 'offline';
        reject(error);
      });

      req.on('timeout', () => {
        this.metrics.services.api = 'timeout';
        req.destroy();
        reject(new Error('API health check timeout'));
      });
    });
  }

  // 🗄️ CHECK DATABASE
  async checkDatabaseHealth() {
    try {
      // Simuler check database - en production, utiliser vraie connexion
      const { db } = require('../backend/database');

      if (db && typeof db.isConnected === 'function') {
        const connected = db.isConnected();
        this.metrics.services.database = connected ? 'operational' : 'fallback';
        return { status: connected ? 'connected' : 'fallback' };
      } else {
        this.metrics.services.database = 'unknown';
        return { status: 'unknown' };
      }
    } catch (error) {
      this.metrics.services.database = 'error';
      throw error;
    }
  }

  // 📱 CHECK MOBILE API
  async checkMobileAPIHealth() {
    return new Promise((resolve, reject) => {
      const port = this.config?.app?.mobilePort || 3002;
      const options = {
        hostname: 'localhost',
        port: port,
        path: '/mobile-api/ping',
        timeout: 5000
      };

      const req = http.get(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const pingData = JSON.parse(data);
            this.metrics.services.mobile = pingData.mobile_api === 'active' ? 'operational' : 'degraded';
            resolve(pingData);
          } catch (error) {
            this.metrics.services.mobile = 'error';
            reject(error);
          }
        });
      });

      req.on('error', (error) => {
        this.metrics.services.mobile = 'offline';
        reject(error);
      });

      req.on('timeout', () => {
        this.metrics.services.mobile = 'timeout';
        req.destroy();
        reject(new Error('Mobile API timeout'));
      });
    });
  }

  // 🔄 CHECK SERVICE SYNC
  async checkSyncService() {
    try {
      // Check si service systemd est actif
      return new Promise((resolve, reject) => {
        exec('systemctl is-active claudyne-sync || echo "inactive"', (error, stdout) => {
          const status = stdout.trim();
          this.metrics.services.sync = status === 'active' ? 'operational' : 'inactive';
          resolve({ status });
        });
      });
    } catch (error) {
      this.metrics.services.sync = 'error';
      throw error;
    }
  }

  // 💾 CHECK ESPACE DISQUE
  async checkDiskSpace() {
    return new Promise((resolve, reject) => {
      exec('df -h /', (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }

        try {
          const lines = stdout.split('\n');
          const diskLine = lines[1];
          const usage = diskLine.split(/\s+/)[4];
          const usagePercent = parseInt(usage.replace('%', ''));

          if (usagePercent > this.alerts.diskThreshold) {
            logger.alert('warning', `Disk usage high: ${usagePercent}%`, {
              usage: usagePercent,
              threshold: this.alerts.diskThreshold
            });
          }

          resolve({ usage: usagePercent });
        } catch (parseError) {
          reject(parseError);
        }
      });
    });
  }

  // 🌐 CHECK CONNECTIVITÉ RÉSEAU
  async checkNetworkConnectivity() {
    return new Promise((resolve) => {
      exec('ping -c 1 google.com', (error) => {
        const connected = !error;
        resolve({ connected });
      });
    });
  }

  // 📈 CHECK RESSOURCES SYSTÈME
  async checkSystemResources() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    // Calcul pourcentage mémoire
    const totalMem = require('os').totalmem();
    const memPercent = (memUsage.heapUsed / totalMem) * 100;

    // Update metrics
    this.metrics.memoryUsage = memUsage;
    this.metrics.cpuUsage = cpuUsage;

    // Alertes ressources
    if (memPercent > this.alerts.memoryThreshold) {
      logger.alert('warning', `Memory usage high: ${memPercent.toFixed(2)}%`, {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        threshold: this.alerts.memoryThreshold
      });
    }

    // Log métriques système
    logger.performance('System resources', 0, {
      memoryPercent: memPercent.toFixed(2),
      heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024)
    });
  }

  // 🌐 CHECK ENDPOINTS CRITIQUES
  async checkEndpoints() {
    const endpoints = [
      { path: '/health', name: 'Health Check' },
      { path: '/api/subjects', name: 'Subjects API' },
      { path: '/mobile-api/ping', name: 'Mobile Ping' }
    ];

    for (const endpoint of endpoints) {
      try {
        await this.checkEndpoint(endpoint);
      } catch (error) {
        logger.warn(`Endpoint ${endpoint.name} check failed`, {
          path: endpoint.path,
          error: error.message
        });
      }
    }
  }

  // 🎯 CHECK ENDPOINT SPÉCIFIQUE
  async checkEndpoint(endpoint) {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const port = endpoint.path.includes('mobile-api') ? 3002 : 3001;
      const options = {
        hostname: 'localhost',
        port: port,
        path: endpoint.path,
        timeout: 5000
      };

      const req = http.get(options, (res) => {
        const responseTime = Date.now() - startTime;

        if (responseTime > this.alerts.responseTimeThreshold) {
          logger.alert('warning', `Slow endpoint response: ${endpoint.name}`, {
            responseTime,
            threshold: this.alerts.responseTimeThreshold,
            path: endpoint.path
          });
        }

        resolve({ responseTime, statusCode: res.statusCode });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Endpoint timeout: ${endpoint.name}`));
      });
    });
  }

  // 📊 UPDATE STATUS SERVICES
  updateServiceStatus(results) {
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        // Service OK
      } else {
        logger.warn(`Service check failed: ${result.name}`, {
          error: result.value
        });
      }
    });
  }

  // 📈 ENREGISTREMENT MÉTRIQUES REQUEST
  recordRequest(responseTime, statusCode) {
    this.metrics.requests++;

    if (statusCode >= 400) {
      this.metrics.errors++;
    }

    if (responseTime > this.alerts.responseTimeThreshold) {
      this.metrics.slowRequests++;
    }

    // Garder historique des temps de réponse
    this.responseTimes.push(responseTime);
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-500); // Garder 500 derniers
    }

    // Calcul moyenne temps réponse
    this.metrics.averageResponseTime = this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
  }

  // 📋 GÉNÉRATION RAPPORT
  async generateReport() {
    const uptime = Date.now() - this.startTime;
    const uptimeHours = (uptime / (1000 * 60 * 60)).toFixed(2);

    const report = {
      timestamp: new Date().toISOString(),
      uptime: {
        milliseconds: uptime,
        hours: uptimeHours,
        formatted: this.formatUptime(uptime)
      },
      requests: {
        total: this.metrics.requests,
        errors: this.metrics.errors,
        errorRate: ((this.metrics.errors / this.metrics.requests) * 100).toFixed(2) + '%',
        slowRequests: this.metrics.slowRequests,
        averageResponseTime: Math.round(this.metrics.averageResponseTime)
      },
      services: this.metrics.services,
      memory: {
        heapUsedMB: Math.round(this.metrics.memoryUsage.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(this.metrics.memoryUsage.heapTotal / 1024 / 1024),
        rss: Math.round(this.metrics.memoryUsage.rss / 1024 / 1024)
      },
      lastHealthCheck: this.metrics.lastHealthCheck
    };

    logger.info('📊 Health Report Generated', report);

    // Sauvegarde rapport
    await this.saveReport(report);

    return report;
  }

  // 💾 SAUVEGARDE RAPPORT
  async saveReport(report) {
    try {
      const reportsDir = path.join(__dirname, '../logs/reports');
      await fs.mkdir(reportsDir, { recursive: true });

      const filename = `health-report-${new Date().toISOString().split('T')[0]}.json`;
      const filepath = path.join(reportsDir, filename);

      await fs.writeFile(filepath, JSON.stringify(report, null, 2));
    } catch (error) {
      logger.error('Failed to save health report', { error: error.message });
    }
  }

  // 🧹 NETTOYAGE MÉTRIQUES
  cleanupMetrics() {
    // Reset compteurs périodiques
    if (this.metrics.requests > 10000) {
      this.metrics.requests = Math.floor(this.metrics.requests / 2);
      this.metrics.errors = Math.floor(this.metrics.errors / 2);
      this.metrics.slowRequests = Math.floor(this.metrics.slowRequests / 2);
    }

    // Nettoyage temps de réponse
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-500);
    }

    logger.info('🧹 Metrics cleanup completed');
  }

  // 🎯 UTILITAIRES
  formatUptime(uptime) {
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}j ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else {
      return `${minutes}m ${seconds % 60}s`;
    }
  }

  // 📊 API PUBLIQUE
  getMetrics() {
    return {
      ...this.metrics,
      uptime: Date.now() - this.startTime,
      responseTimes: this.responseTimes.slice(-100) // 100 derniers
    };
  }

  // 🚨 MIDDLEWARE ALERTES
  getAlertMiddleware() {
    return (req, res, next) => {
      const startTime = Date.now();

      res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        this.recordRequest(responseTime, res.statusCode);
      });

      next();
    };
  }

  // 🛑 ARRÊT MONITORING
  stop() {
    logger.info('📊 Health monitor stopping...');
    // Cleanup des intervals si nécessaire
  }
}

module.exports = HealthMonitor;