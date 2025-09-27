/**
 * CLAUDYNE PRODUCTION MONITORING & HEALTH CHECK
 * Surveillance complète de l'écosystème Claudyne
 * En hommage à Meffo Mehtah Tchandjio Claudine
 */

const http = require('http');
const https = require('https');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class ClaudyneHealthMonitor {
    constructor() {
        this.baseUrl = 'https://claudyne.com';
        this.localBackend = 'http://localhost:3001';
        this.localMobile = 'http://localhost:3002';
        this.logFile = path.join(__dirname, 'logs', 'health-check.log');

        this.services = [
            { name: 'Frontend', url: `${this.baseUrl}`, critical: true },
            { name: 'Backend API', url: `${this.baseUrl}/api/ping`, critical: true },
            { name: 'Mobile API', url: `${this.baseUrl}/mobile-api/ping`, critical: false },
            { name: 'APK Download', url: `${this.baseUrl}/download/claudyne.apk`, critical: false },
        ];

        this.localServices = [
            { name: 'Local Backend', url: `${this.localBackend}/api/ping`, port: 3001 },
            { name: 'Local Mobile API', url: `${this.localMobile}/api/ping`, port: 3002 },
        ];

        this.systemServices = [
            'postgresql',
            'nginx',
            'claudyne-sync'
        ];

        this.pm2Apps = [
            'claudyne-frontend',
            'claudyne-backend',
            'claudyne-mobile-api'
        ];

        this.healthStatus = {
            timestamp: null,
            overall: 'unknown',
            services: {},
            system: {},
            database: {},
            warnings: [],
            errors: []
        };
    }

    // ========================================
    // LOGGING
    // ========================================

    log(message, level = 'INFO') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${level}] ${message}`;

        console.log(logEntry);

        // Créer répertoire logs si nécessaire
        const logsDir = path.dirname(this.logFile);
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }

        // Écrire dans fichier log
        fs.appendFileSync(this.logFile, logEntry + '\n');
    }

    // ========================================
    // TESTS HTTP
    // ========================================

    async testHttpEndpoint(url, timeout = 10000) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const isHttps = url.startsWith('https');
            const httpModule = isHttps ? https : http;

            const request = httpModule.get(url, {
                timeout,
                headers: {
                    'User-Agent': 'Claudyne-Health-Monitor',
                    'X-Client-Type': 'monitoring'
                }
            }, (response) => {
                const responseTime = Date.now() - startTime;
                const statusCode = response.statusCode;

                resolve({
                    success: statusCode >= 200 && statusCode < 400,
                    statusCode,
                    responseTime,
                    error: null
                });
            });

            request.on('error', (error) => {
                const responseTime = Date.now() - startTime;
                resolve({
                    success: false,
                    statusCode: 0,
                    responseTime,
                    error: error.message
                });
            });

            request.on('timeout', () => {
                request.destroy();
                const responseTime = Date.now() - startTime;
                resolve({
                    success: false,
                    statusCode: 0,
                    responseTime,
                    error: 'Timeout'
                });
            });
        });
    }

    // ========================================
    // TESTS SYSTÈME
    // ========================================

    async execCommand(command) {
        return new Promise((resolve) => {
            exec(command, (error, stdout, stderr) => {
                resolve({
                    success: !error,
                    stdout: stdout.trim(),
                    stderr: stderr.trim(),
                    error: error?.message
                });
            });
        });
    }

    async checkSystemService(serviceName) {
        const result = await this.execCommand(`systemctl is-active ${serviceName}`);
        return {
            name: serviceName,
            active: result.stdout === 'active',
            status: result.stdout,
            error: result.error
        };
    }

    async checkPM2App(appName) {
        const result = await this.execCommand(`pm2 jlist`);

        if (!result.success) {
            return {
                name: appName,
                online: false,
                error: 'PM2 not accessible'
            };
        }

        try {
            const apps = JSON.parse(result.stdout);
            const app = apps.find(a => a.name === appName);

            if (!app) {
                return {
                    name: appName,
                    online: false,
                    error: 'App not found'
                };
            }

            return {
                name: appName,
                online: app.pm2_env.status === 'online',
                status: app.pm2_env.status,
                restarts: app.pm2_env.restart_time,
                memory: Math.round(app.monit.memory / 1024 / 1024) + 'MB',
                cpu: app.monit.cpu + '%'
            };
        } catch (error) {
            return {
                name: appName,
                online: false,
                error: 'Parse error: ' + error.message
            };
        }
    }

    async checkDatabaseStatus() {
        // Test connexion PostgreSQL
        const pgResult = await this.execCommand('sudo -u postgres psql -d claudyne_production -c "SELECT version();" 2>/dev/null');

        // Test synchronisation
        const syncResult = await this.execCommand('claudyne-sync status 2>/dev/null');

        return {
            postgresql: {
                accessible: pgResult.success,
                version: pgResult.stdout.includes('PostgreSQL') ? 'OK' : 'Unknown',
                error: pgResult.error
            },
            synchronization: {
                working: syncResult.success,
                output: syncResult.stdout.slice(0, 200),
                error: syncResult.error
            }
        };
    }

    async checkDiskSpace() {
        const result = await this.execCommand('df -h / | tail -1');

        if (result.success) {
            const parts = result.stdout.split(/\s+/);
            const usage = parts[4] ? parseInt(parts[4].replace('%', '')) : 0;

            return {
                usage: usage + '%',
                available: parts[3],
                warning: usage > 80,
                critical: usage > 90
            };
        }

        return {
            usage: 'Unknown',
            warning: false,
            critical: false,
            error: result.error
        };
    }

    // ========================================
    // HEALTH CHECK COMPLET
    // ========================================

    async performHealthCheck() {
        this.log('🔍 === CLAUDYNE HEALTH CHECK START ===');
        this.healthStatus.timestamp = new Date().toISOString();

        // 1. Test Services Web
        this.log('🌐 Testing web services...');
        for (const service of this.services) {
            const result = await this.testHttpEndpoint(service.url);

            this.healthStatus.services[service.name] = {
                url: service.url,
                ...result,
                critical: service.critical
            };

            if (result.success) {
                this.log(`✅ ${service.name}: OK (${result.responseTime}ms)`);
            } else {
                const level = service.critical ? 'ERROR' : 'WARN';
                this.log(`❌ ${service.name}: ${result.error || 'HTTP ' + result.statusCode}`, level);

                if (service.critical) {
                    this.healthStatus.errors.push(`${service.name} is down`);
                } else {
                    this.healthStatus.warnings.push(`${service.name} is unavailable`);
                }
            }
        }

        // 2. Test Services Locaux
        this.log('🖥️ Testing local services...');
        for (const service of this.localServices) {
            const result = await this.testHttpEndpoint(service.url);

            this.healthStatus.services[service.name] = result;

            if (result.success) {
                this.log(`✅ ${service.name}: OK (port ${service.port})`);
            } else {
                this.log(`❌ ${service.name}: ${result.error || 'Port ' + service.port + ' unreachable'}`, 'WARN');
                this.healthStatus.warnings.push(`${service.name} (port ${service.port}) is down`);
            }
        }

        // 3. Test Services Système
        this.log('⚙️ Testing system services...');
        for (const serviceName of this.systemServices) {
            const result = await this.checkSystemService(serviceName);

            this.healthStatus.system[serviceName] = result;

            if (result.active) {
                this.log(`✅ ${serviceName}: Active`);
            } else {
                this.log(`❌ ${serviceName}: ${result.status}`, 'ERROR');
                this.healthStatus.errors.push(`System service ${serviceName} is not active`);
            }
        }

        // 4. Test Applications PM2
        this.log('📱 Testing PM2 applications...');
        for (const appName of this.pm2Apps) {
            const result = await this.checkPM2App(appName);

            this.healthStatus.system[`pm2_${appName}`] = result;

            if (result.online) {
                this.log(`✅ PM2 ${appName}: Online (${result.memory}, ${result.cpu})`);
            } else {
                this.log(`❌ PM2 ${appName}: ${result.error || result.status}`, 'ERROR');
                this.healthStatus.errors.push(`PM2 app ${appName} is not online`);
            }
        }

        // 5. Test Base de Données
        this.log('🗄️ Testing database...');
        const dbStatus = await this.checkDatabaseStatus();
        this.healthStatus.database = dbStatus;

        if (dbStatus.postgresql.accessible) {
            this.log('✅ PostgreSQL: Accessible');
        } else {
            this.log('❌ PostgreSQL: Not accessible', 'ERROR');
            this.healthStatus.errors.push('PostgreSQL database is not accessible');
        }

        if (dbStatus.synchronization.working) {
            this.log('✅ Database Sync: Working');
        } else {
            this.log('⚠️ Database Sync: Issues detected', 'WARN');
            this.healthStatus.warnings.push('Database synchronization has issues');
        }

        // 6. Test Espace Disque
        this.log('💾 Testing disk space...');
        const diskStatus = await this.checkDiskSpace();
        this.healthStatus.system.disk = diskStatus;

        if (diskStatus.critical) {
            this.log(`🚨 Disk Space: CRITICAL ${diskStatus.usage}`, 'ERROR');
            this.healthStatus.errors.push(`Disk space critical: ${diskStatus.usage}`);
        } else if (diskStatus.warning) {
            this.log(`⚠️ Disk Space: WARNING ${diskStatus.usage}`, 'WARN');
            this.healthStatus.warnings.push(`Disk space warning: ${diskStatus.usage}`);
        } else {
            this.log(`✅ Disk Space: OK ${diskStatus.usage} (${diskStatus.available} free)`);
        }

        // 7. Déterminer Statut Global
        if (this.healthStatus.errors.length > 0) {
            this.healthStatus.overall = 'critical';
        } else if (this.healthStatus.warnings.length > 0) {
            this.healthStatus.overall = 'warning';
        } else {
            this.healthStatus.overall = 'healthy';
        }

        this.log(`🎯 Overall Status: ${this.healthStatus.overall.toUpperCase()}`);
        this.log('🔍 === CLAUDYNE HEALTH CHECK END ===');

        return this.healthStatus;
    }

    // ========================================
    // RAPPORTS
    // ========================================

    generateReport() {
        const report = {
            summary: {
                timestamp: this.healthStatus.timestamp,
                overall: this.healthStatus.overall,
                errors: this.healthStatus.errors.length,
                warnings: this.healthStatus.warnings.length
            },
            details: this.healthStatus
        };

        // Sauvegarder rapport
        const reportFile = path.join(__dirname, 'logs', `health-report-${Date.now()}.json`);
        fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

        return report;
    }

    async sendAlert(status) {
        if (status.overall === 'critical') {
            this.log('🚨 CRITICAL ALERT: Claudyne system has critical issues!', 'ERROR');
            // Ici vous pourriez envoyer email, SMS, Slack, etc.
        } else if (status.overall === 'warning') {
            this.log('⚠️ WARNING: Claudyne system has warnings', 'WARN');
        }
    }

    // ========================================
    // MONITORING CONTINU
    // ========================================

    startContinuousMonitoring(intervalMinutes = 5) {
        this.log(`🔄 Starting continuous monitoring (every ${intervalMinutes} minutes)`);

        setInterval(async () => {
            const status = await this.performHealthCheck();
            await this.sendAlert(status);
        }, intervalMinutes * 60 * 1000);
    }
}

// ========================================
// UTILISATION
// ========================================

const monitor = new ClaudyneHealthMonitor();

if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.includes('--continuous')) {
        const interval = parseInt(args[args.indexOf('--continuous') + 1]) || 5;
        monitor.startContinuousMonitoring(interval);
    } else if (args.includes('--report')) {
        monitor.performHealthCheck().then((status) => {
            const report = monitor.generateReport();
            console.log('\n📊 HEALTH REPORT:');
            console.log(JSON.stringify(report.summary, null, 2));
        });
    } else {
        monitor.performHealthCheck().then((status) => {
            console.log(`\n🎯 Overall Status: ${status.overall.toUpperCase()}`);
            console.log(`❌ Errors: ${status.errors.length}`);
            console.log(`⚠️ Warnings: ${status.warnings.length}`);

            if (status.errors.length > 0) {
                console.log('\n🚨 ERRORS:');
                status.errors.forEach(error => console.log(`  - ${error}`));
            }

            if (status.warnings.length > 0) {
                console.log('\n⚠️ WARNINGS:');
                status.warnings.forEach(warning => console.log(`  - ${warning}`));
            }

            process.exit(status.errors.length > 0 ? 1 : 0);
        });
    }
}

module.exports = ClaudyneHealthMonitor;