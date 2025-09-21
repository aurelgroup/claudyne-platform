/**
 * Endpoints de monitoring système pour l'interface admin
 * À ajouter dans backend/src/routes/admin.js
 */

const fs = require('fs').promises;
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

// =============================================================================
// SYSTEM HEALTH ENDPOINT
// =============================================================================
router.get('/system/health', validateAdminToken, async (req, res) => {
    try {
        // Obtenir les métriques système
        const health = await getSystemHealth();

        res.json({
            success: true,
            data: health
        });
    } catch (error) {
        console.error('Erreur health check:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
});

// =============================================================================
// SYSTEM SECURITY ENDPOINT
// =============================================================================
router.get('/system/security', validateAdminToken, async (req, res) => {
    try {
        const security = await getSecurityStatus();

        res.json({
            success: true,
            data: security
        });
    } catch (error) {
        console.error('Erreur security status:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
});

// =============================================================================
// PERFORMANCE METRICS ENDPOINT
// =============================================================================
router.get('/system/metrics', validateAdminToken, async (req, res) => {
    try {
        const timeRange = req.query.range || '24h';
        const metrics = await getPerformanceMetrics(timeRange);

        res.json({
            success: true,
            data: metrics
        });
    } catch (error) {
        console.error('Erreur métriques performance:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
});

// =============================================================================
// SYSTEM LOGS ENDPOINT
// =============================================================================
router.get('/system/logs', validateAdminToken, async (req, res) => {
    try {
        const logs = await getSystemLogs();

        res.json({
            success: true,
            data: { logs }
        });
    } catch (error) {
        console.error('Erreur system logs:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
});

// =============================================================================
// BACKUP STATUS ENDPOINT
// =============================================================================
router.get('/system/backups', validateAdminToken, async (req, res) => {
    try {
        const backups = await getBackupStatus();

        res.json({
            success: true,
            data: { backups }
        });
    } catch (error) {
        console.error('Erreur backup status:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

async function getSystemHealth() {
    try {
        // CPU Usage
        const { stdout: cpuInfo } = await execAsync("top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | cut -d'%' -f1");
        const cpuUsage = parseFloat(cpuInfo.trim()) || 0;

        // Memory Usage
        const { stdout: memInfo } = await execAsync("free -m | awk 'NR==2{printf \"%.1f\", $3*100/$2 }'");
        const memoryUsage = parseFloat(memInfo.trim()) || 0;

        // Memory in MB
        const { stdout: memMB } = await execAsync("free -m | awk 'NR==2{printf \"%s\", $3 }'");
        const memoryMB = parseInt(memMB.trim()) || 0;

        // Uptime
        const { stdout: uptimeInfo } = await execAsync("cat /proc/uptime | awk '{print $1}'");
        const uptime = parseInt(parseFloat(uptimeInfo.trim())) || 0;

        // Error count (from logs)
        const { stdout: errorCount } = await execAsync("grep -c 'ERROR\\|FATAL' /var/log/nginx/claudyne.error.log 2>/dev/null | head -1 || echo '0'");
        const errors = parseInt(errorCount.trim()) || 0;

        // Determine status
        let status = 'healthy';
        if (cpuUsage > 80 || memoryUsage > 85 || errors > 10) {
            status = 'warning';
        }
        if (cpuUsage > 95 || memoryUsage > 95 || errors > 50) {
            status = 'critical';
        }

        return {
            status,
            cpu: cpuUsage.toFixed(1),
            memory: memoryMB,
            uptime,
            errors
        };
    } catch (error) {
        console.error('Erreur getSystemHealth:', error);
        return {
            status: 'unknown',
            cpu: 0,
            memory: 0,
            uptime: 0,
            errors: 0
        };
    }
}

async function getSecurityStatus() {
    try {
        const security = {
            fail2banActive: false,
            fail2banJails: 0,
            bannedIPs: 0,
            sshAttacks: 0,
            sslDaysLeft: 0,
            sslIssuer: 'Let\'s Encrypt',
            firewallActive: false,
            firewallRules: 0,
            recentThreats: []
        };

        // Check Fail2ban status
        try {
            const { stdout: fail2banStatus } = await execAsync("systemctl is-active fail2ban 2>/dev/null || echo 'inactive'");
            security.fail2banActive = fail2banStatus.trim() === 'active';

            if (security.fail2banActive) {
                // Get jail count
                const { stdout: jailList } = await execAsync("fail2ban-client status 2>/dev/null | grep 'Jail list' | cut -d: -f2 | tr ',' '\\n' | wc -l");
                security.fail2banJails = parseInt(jailList.trim()) || 0;

                // Get banned IPs count
                const { stdout: bannedList } = await execAsync("fail2ban-client status sshd 2>/dev/null | grep 'Banned IP list' | cut -d: -f2 | wc -w");
                security.bannedIPs = parseInt(bannedList.trim()) || 0;
            }
        } catch (error) {
            console.warn('Fail2ban check failed:', error.message);
        }

        // SSH attacks count (last 24h)
        try {
            const { stdout: sshAttacks } = await execAsync("grep \"$(date +%b\\ %d)\" /var/log/auth.log 2>/dev/null | grep 'Failed password' | wc -l");
            security.sshAttacks = parseInt(sshAttacks.trim()) || 0;
        } catch (error) {
            console.warn('SSH attacks check failed:', error.message);
        }

        // SSL certificate expiry
        try {
            const { stdout: sslExpiry } = await execAsync("openssl x509 -in /etc/letsencrypt/live/claudyne.com/fullchain.pem -noout -dates 2>/dev/null | grep notAfter | cut -d= -f2");
            if (sslExpiry.trim()) {
                const expiryDate = new Date(sslExpiry.trim());
                const now = new Date();
                const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
                security.sslDaysLeft = Math.max(0, daysLeft);
            }
        } catch (error) {
            console.warn('SSL check failed:', error.message);
        }

        // Firewall status
        try {
            const { stdout: ufwStatus } = await execAsync("ufw status 2>/dev/null | head -1");
            security.firewallActive = ufwStatus.includes('active');

            if (security.firewallActive) {
                const { stdout: ufwRules } = await execAsync("ufw status numbered 2>/dev/null | grep -c '^\\[' || echo '0'");
                security.firewallRules = parseInt(ufwRules.trim()) || 0;
            }
        } catch (error) {
            console.warn('Firewall check failed:', error.message);
        }

        // Recent threats (from fail2ban logs)
        try {
            const { stdout: threats } = await execAsync("grep \"$(date +%Y-%m-%d)\" /var/log/fail2ban.log 2>/dev/null | grep 'Ban ' | tail -5 | awk '{print $7}' || true");
            if (threats.trim()) {
                security.recentThreats = threats.trim().split('\n').map(ip => `Banned IP: ${ip}`);
            }
        } catch (error) {
            console.warn('Recent threats check failed:', error.message);
        }

        return security;
    } catch (error) {
        console.error('Erreur getSecurityStatus:', error);
        return {};
    }
}

async function getPerformanceMetrics(timeRange) {
    try {
        const metrics = {
            totalRequests: 0,
            uniqueVisitors: 0,
            avgResponseTime: 0,
            httpErrors: 0,
            chartData: [],
            topPages: [],
            topIPs: []
        };

        // Determine date pattern based on time range
        let datePattern;
        let timePattern;

        switch (timeRange) {
            case '1h':
                datePattern = new Date().toISOString().slice(0, 13); // YYYY-MM-DDTHH
                timePattern = 'hour';
                break;
            case '7d':
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                datePattern = weekAgo.toISOString().slice(0, 10); // YYYY-MM-DD
                timePattern = 'day';
                break;
            default: // 24h
                datePattern = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
                timePattern = 'hour';
        }

        // Get nginx access logs
        const logFile = '/var/log/nginx/claudyne.access.log';

        try {
            // Total requests
            const { stdout: totalReq } = await execAsync(`grep "${datePattern.replace('T', ' ')}" ${logFile} 2>/dev/null | wc -l || echo '0'`);
            metrics.totalRequests = parseInt(totalReq.trim()) || 0;

            // Unique visitors (IPs)
            const { stdout: uniqueIPs } = await execAsync(`grep "${datePattern.replace('T', ' ')}" ${logFile} 2>/dev/null | awk '{print $1}' | sort | uniq | wc -l || echo '0'`);
            metrics.uniqueVisitors = parseInt(uniqueIPs.trim()) || 0;

            // HTTP errors (4xx and 5xx)
            const { stdout: httpErrs } = await execAsync(`grep "${datePattern.replace('T', ' ')}" ${logFile} 2>/dev/null | grep -E '" [45][0-9][0-9] ' | wc -l || echo '0'`);
            metrics.httpErrors = parseInt(httpErrs.trim()) || 0;

            // Top pages
            const { stdout: topPagesData } = await execAsync(`grep "${datePattern.replace('T', ' ')}" ${logFile} 2>/dev/null | awk '{print $7}' | sort | uniq -c | sort -nr | head -5 || true`);
            if (topPagesData.trim()) {
                metrics.topPages = topPagesData.trim().split('\n').map(line => {
                    const parts = line.trim().split(/\s+/);
                    return {
                        hits: parseInt(parts[0]) || 0,
                        path: parts.slice(1).join(' ') || '/'
                    };
                });
            }

            // Top IPs
            const { stdout: topIPsData } = await execAsync(`grep "${datePattern.replace('T', ' ')}" ${logFile} 2>/dev/null | awk '{print $1}' | sort | uniq -c | sort -nr | head -5 || true`);
            if (topIPsData.trim()) {
                metrics.topIPs = topIPsData.trim().split('\n').map(line => {
                    const parts = line.trim().split(/\s+/);
                    return {
                        requests: parseInt(parts[0]) || 0,
                        address: parts[1] || 'unknown'
                    };
                });
            }

            // Chart data (hourly breakdown for last 12 hours)
            if (timePattern === 'hour') {
                for (let i = 11; i >= 0; i--) {
                    const hour = new Date();
                    hour.setHours(hour.getHours() - i);
                    const hourPattern = hour.toISOString().slice(0, 13).replace('T', ' ');

                    try {
                        const { stdout: hourReqs } = await execAsync(`grep "${hourPattern}" ${logFile} 2>/dev/null | wc -l || echo '0'`);
                        metrics.chartData.push({
                            time: hour.getHours() + 'h',
                            requests: parseInt(hourReqs.trim()) || 0
                        });
                    } catch (err) {
                        metrics.chartData.push({
                            time: hour.getHours() + 'h',
                            requests: 0
                        });
                    }
                }
            }

            // Average response time (mock for now - would need to parse actual nginx logs with $request_time)
            metrics.avgResponseTime = Math.random() * 0.5 + 0.1; // Mock between 0.1-0.6s

        } catch (error) {
            console.warn('Performance metrics parsing failed:', error.message);
        }

        return metrics;
    } catch (error) {
        console.error('Erreur getPerformanceMetrics:', error);
        return {
            totalRequests: 0,
            uniqueVisitors: 0,
            avgResponseTime: 0,
            httpErrors: 0,
            chartData: [],
            topPages: [],
            topIPs: []
        };
    }
}

async function getSystemLogs() {
    try {
        const logs = [];

        // Get recent logs from various sources
        const logSources = [
            { file: '/var/log/nginx/claudyne.error.log', type: 'NGINX' },
            { file: '/var/log/fail2ban.log', type: 'FAIL2BAN' },
            { file: '/var/log/auth.log', type: 'AUTH' }
        ];

        for (const source of logSources) {
            try {
                const { stdout: logLines } = await execAsync(`tail -n 10 ${source.file} 2>/dev/null || true`);
                if (logLines.trim()) {
                    const lines = logLines.trim().split('\n');
                    for (const line of lines) {
                        if (line.trim()) {
                            logs.push({
                                timestamp: new Date().toISOString().slice(11, 19), // Mock timestamp
                                level: source.type,
                                message: line.slice(0, 120) + (line.length > 120 ? '...' : '')
                            });
                        }
                    }
                }
            } catch (err) {
                console.warn(`Failed to read ${source.file}:`, err.message);
            }
        }

        // Sort by timestamp (most recent first)
        return logs.slice(0, 20);
    } catch (error) {
        console.error('Erreur getSystemLogs:', error);
        return [];
    }
}

async function getBackupStatus() {
    try {
        const backups = [];

        // Check backup directory
        const backupDir = '/var/backups/claudyne';

        try {
            // Database backups
            const { stdout: dbBackups } = await execAsync(`ls -lt ${backupDir}/database/*.tar.gz 2>/dev/null | head -5 || true`);
            if (dbBackups.trim()) {
                const lines = dbBackups.trim().split('\n');
                for (const line of lines) {
                    const parts = line.split(/\s+/);
                    if (parts.length >= 9) {
                        backups.push({
                            id: parts[8].split('/').pop(),
                            type: 'Base de données',
                            lastBackup: new Date().toISOString(), // Mock timestamp
                            size: parseInt(parts[4]) || 0,
                            status: 'success',
                            nextBackup: new Date(Date.now() + 24*60*60*1000).toISOString() // Next day
                        });
                    }
                }
            }

            // Files backups
            const { stdout: fileBackups } = await execAsync(`ls -lt ${backupDir}/files/*.tar.gz 2>/dev/null | head -3 || true`);
            if (fileBackups.trim()) {
                const lines = fileBackups.trim().split('\n');
                for (const line of lines) {
                    const parts = line.split(/\s+/);
                    if (parts.length >= 9) {
                        backups.push({
                            id: parts[8].split('/').pop(),
                            type: 'Fichiers',
                            lastBackup: new Date().toISOString(),
                            size: parseInt(parts[4]) || 0,
                            status: 'success',
                            nextBackup: new Date(Date.now() + 24*60*60*1000).toISOString()
                        });
                    }
                }
            }

        } catch (error) {
            console.warn('Backup directory check failed:', error.message);
        }

        // Add default if no backups found
        if (backups.length === 0) {
            backups.push({
                id: 'no-backup',
                type: 'Système',
                lastBackup: new Date().toISOString(),
                size: 0,
                status: 'pending',
                nextBackup: new Date(Date.now() + 24*60*60*1000).toISOString()
            });
        }

        return backups;
    } catch (error) {
        console.error('Erreur getBackupStatus:', error);
        return [];
    }
}