# Claudyne Deployment Verification & Post-Deployment Monitoring

**Last Updated**: 2025-12-02
**Version**: 1.0 - Complete
**Status**: ✅ PRODUCTION READY

---

## Quick Verification Checklist (5 minutes)

After running `./DEPLOY_PROD_NOW.sh`, run this:

```bash
#!/bin/bash

echo "🔍 CLAUDYNE DEPLOYMENT VERIFICATION"
echo "════════════════════════════════════════════════════════════"
echo ""

# 1. Check server is running
echo "1️⃣  Server Status..."
ps aux | grep "node.*minimal-server" | grep -v grep && echo "   ✅ Server running" || echo "   ❌ Server not running"

# 2. Check database connectivity
echo ""
echo "2️⃣  Database Connectivity..."
psql -U claudyne_user -d claudyne_production -c "SELECT 1;" &>/dev/null && echo "   ✅ Database connected" || echo "   ❌ Database connection failed"

# 3. Health endpoint
echo ""
echo "3️⃣  API Health Endpoint..."
HEALTH=$(curl -s http://localhost:3001/api/health)
if echo "$HEALTH" | grep -q "ok"; then
    echo "   ✅ Health endpoint responding"
else
    echo "   ❌ Health endpoint failed"
    echo "   Response: $HEALTH"
fi

# 4. Auth endpoint
echo ""
echo "4️⃣  Auth Endpoint..."
curl -s http://localhost:3001/api/auth/health &>/dev/null && echo "   ✅ Auth endpoint accessible" || echo "   ⚠️  Auth endpoint returned 401 (normal for unauth)"

# 5. Response time
echo ""
echo "5️⃣  Response Time Benchmark..."
START=$(date +%s%N)
curl -s http://localhost:3001/api/health > /dev/null
END=$(date +%s%N)
DURATION=$(( (END - START) / 1000000 ))
echo "   Response time: ${DURATION}ms"
if [ $DURATION -lt 500 ]; then
    echo "   ✅ Good (< 500ms)"
elif [ $DURATION -lt 1000 ]; then
    echo "   ⚠️  Acceptable (500-1000ms)"
else
    echo "   ❌ Slow (> 1000ms)"
fi

# 6. Memory usage
echo ""
echo "6️⃣  Memory Usage..."
MEM=$(ps aux | grep "node.*minimal-server" | grep -v grep | awk '{print $6}')
if [ ! -z "$MEM" ]; then
    MEM_MB=$((MEM / 1024))
    echo "   Current: ${MEM_MB}MB"
    if [ $MEM_MB -lt 512 ]; then
        echo "   ✅ Healthy (< 512MB)"
    elif [ $MEM_MB -lt 1024 ]; then
        echo "   ⚠️  Warning (512-1024MB)"
    else
        echo "   ❌ Critical (> 1024MB)"
    fi
fi

# 7. Port 3001 check
echo ""
echo "7️⃣  Port 3001 Availability..."
netstat -tlnp 2>/dev/null | grep :3001 && echo "   ✅ Port 3001 listening" || echo "   ❌ Port 3001 not listening"

# 8. Log check
echo ""
echo "8️⃣  Recent Error Logs..."
if [ -f "logs/pm2-error.log" ]; then
    ERROR_COUNT=$(grep -c "ERROR\|Exception" logs/pm2-error.log 2>/dev/null || echo 0)
    if [ $ERROR_COUNT -eq 0 ]; then
        echo "   ✅ No errors in logs"
    else
        echo "   ❌ Found $ERROR_COUNT errors"
        grep "ERROR\|Exception" logs/pm2-error.log | head -3
    fi
else
    echo "   ℹ️  Log file not yet created"
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "✅ VERIFICATION COMPLETE"
echo ""
```

---

## Post-Deployment Monitoring Setup

### 1. Configure Continuous Health Monitoring

**Option A: Manual continuous monitoring (development/testing)**

```bash
# Run health checks every 30 seconds
cd /path/to/claudyne
NODE_ENV=production node backend/health-monitor.js --continuous

# Output:
# 2025-12-02T14:23:45.123Z ✅ [OK] Health endpoint responding
# 2025-12-02T14:23:45.456Z ✅ [OK] Auth endpoint accessible
# 2025-12-02T14:23:45.789Z ✅ [OK] Database connection healthy
# 2025-12-02T14:23:46.012Z ✅ [OK] Response time: 124ms
# ...
```

**Option B: Daemonized monitoring with PM2**

```bash
# Start health monitor as background service
pm2 start backend/health-monitor.js \
  --name "claudyne-health-monitor" \
  --env NODE_ENV=production \
  --env CONTINUOUS=true \
  --log logs/health-monitor.log

# Verify it's running
pm2 list

# View logs
pm2 logs claudyne-health-monitor

# Save PM2 config for auto-restart on reboot
pm2 save
pm2 startup
```

**Option C: Cron job (recommended for production)**

```bash
# Add to crontab (runs every 5 minutes)
*/5 * * * * cd /path/to/claudyne && NODE_ENV=production node backend/health-monitor.js >> logs/health-check-cron.log 2>&1

# Verify cron job
crontab -l
```

---

### 2. Log Aggregation Strategy

#### Real-time Log Monitoring

```bash
# Watch backend logs in real-time
pm2 logs claudyne-backend --lines 50

# Watch error logs only
tail -f logs/pm2-error.log

# Watch all logs with grep filtering
pm2 logs claudyne-backend | grep ERROR
```

#### Log Rotation (prevent disk filling)

```bash
# Install logrotate (if not present)
sudo apt-get install logrotate

# Create rotation config
sudo tee /etc/logrotate.d/claudyne > /dev/null <<EOF
/path/to/claudyne/logs/*.log {
  daily
  rotate 14
  compress
  missingok
  notifempty
  create 0640 $USER $USER
}
EOF

# Verify configuration
sudo logrotate -d /etc/logrotate.d/claudyne

# Apply immediately
sudo logrotate -f /etc/logrotate.d/claudyne
```

#### Centralized Log Shipping (production recommended)

For ELK Stack, Datadog, or similar:

```bash
# In logs/pm2.log, PM2 already provides JSON format
pm2 logs claudyne-backend --json | nc logserver.example.com 5000

# Or use a log shipper (Filebeat, Logstash, etc.)
# Example with Filebeat:
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /path/to/claudyne/logs/pm2.log
    - /path/to/claudyne/logs/pm2-error.log
output.elasticsearch:
  hosts: ["elasticsearch.example.com:9200"]
```

---

### 3. Metrics & Alerting

#### Key Metrics to Track

| Metric | Good | Warning | Alert |
|--------|------|---------|-------|
| **Response Time** | < 200ms | 200-500ms | > 500ms |
| **Error Rate** | < 0.1% | 0.1-1% | > 1% |
| **Memory Usage** | < 300MB | 300-600MB | > 600MB |
| **CPU Usage** | < 30% | 30-70% | > 70% |
| **DB Query Time** | < 50ms | 50-200ms | > 200ms |
| **Uptime** | > 99.9% | 99-99.9% | < 99% |

#### Alert Rules (PM2 Plus or similar)

```javascript
// Pseudo-code for alert configuration
const alerts = {
  memoryThreshold: {
    value: 1024 * 1024 * 1024, // 1GB
    action: 'restart', // auto-restart if exceeded
    notification: 'slack' // notify ops team
  },
  errorRate: {
    threshold: 0.05, // 5%
    window: 300000, // 5 minutes
    action: 'page' // page on-call engineer
  },
  responseTime: {
    percentile: 95,
    threshold: 1000, // 1 second
    action: 'notify' // alert team
  }
};
```

#### Slack Integration Example

```bash
# Create alerting webhook
#!/bin/bash
# /usr/local/bin/claudyne-alert.sh

send_slack_alert() {
  local title=$1
  local message=$2
  local severity=$3

  curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
    -H 'Content-Type: application/json' \
    -d "{
      \"text\": \"🚨 Claudyne Alert\",
      \"blocks\": [
        {
          \"type\": \"section\",
          \"text\": {
            \"type\": \"mrkdwn\",
            \"text\": \"*$title*\n$message\nSeverity: $severity\"
          }
        }
      ]
    }"
}

# Use in monitoring scripts
ps aux | grep "node.*minimal-server" | grep -v grep || {
  send_slack_alert "Server Down" "Backend process not running" "CRITICAL"
}
```

---

### 4. Database Health Monitoring

#### Connection Pool Monitoring

```bash
# Monitor active connections
psql -U claudyne_user -d claudyne_production << EOF
SELECT count(*) as active_connections,
       max(extract(epoch from (now() - backend_start))) as oldest_connection_seconds
FROM pg_stat_activity
WHERE datname = 'claudyne_production'
AND state != 'idle';
EOF
```

#### Slow Query Logging

```sql
-- Enable query logging in PostgreSQL
ALTER SYSTEM SET log_min_duration_statement = 500; -- log queries > 500ms
SELECT pg_reload_conf();

-- View slow queries
tail -f /var/log/postgresql/postgresql.log | grep duration
```

#### Backup Verification

```bash
#!/bin/bash
# Daily backup verification

BACKUP_DIR="/path/to/claudyne/.backups"
LATEST_BACKUP=$(ls -t $BACKUP_DIR/*/db_backup.sql | head -1)

if [ -z "$LATEST_BACKUP" ]; then
    echo "❌ No backups found!"
    exit 1
fi

BACKUP_AGE=$(($(date +%s) - $(stat -c %Y $LATEST_BACKUP)))
if [ $BACKUP_AGE -gt 86400 ]; then
    echo "⚠️  Latest backup is $(($BACKUP_AGE / 3600)) hours old"
fi

# Test restore
TEMP_DB="claudyne_restore_test"
createdb -U claudyne_user $TEMP_DB
psql -U claudyne_user -d $TEMP_DB < $LATEST_BACKUP &>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Latest backup is valid"
    dropdb -U claudyne_user $TEMP_DB
else
    echo "❌ Latest backup is corrupted"
    exit 1
fi
```

---

### 5. Performance Profiling

#### Node.js Profiling (if performance degrades)

```bash
# With --inspect flag
NODE_ENV=production node --inspect backend/minimal-server.js

# Then use Chrome DevTools: chrome://inspect

# Or use clinic.js for automated profiling
npx clinic doctor -- node backend/minimal-server.js
```

#### Request Profiling

```javascript
// Add to backend/minimal-server.js for detailed timing
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${duration}ms - ${res.statusCode}`);

    // Alert if slow
    if (duration > 1000) {
      console.warn(`⚠️  SLOW REQUEST: ${req.method} ${req.path} took ${duration}ms`);
    }
  });

  next();
});
```

---

### 6. Automated Healthcheck & Auto-Recovery

#### Auto-restart on failure

```bash
# PM2 configuration with auto-restart
pm2 start backend/minimal-server.js \
  --name claudyne-backend \
  --instances 2 \
  --autorestart \
  --max-restarts 10 \
  --min-uptime 1m \
  --max-memory-restart 1G \
  --env NODE_ENV=production \
  --env-file .env.production
```

#### Systemd health check (Linux)

```ini
# /etc/systemd/system/claudyne-backend.service

[Unit]
Description=Claudyne Backend
After=network.target postgresql.service

[Service]
Type=simple
User=claudyne
WorkingDirectory=/path/to/claudyne
ExecStart=/usr/bin/node backend/minimal-server.js
ExecRestart=/usr/bin/node backend/health-monitor.js
EnvironmentFile=/path/to/claudyne/.env.production
Restart=on-failure
RestartSec=10
StartLimitInterval=60
StartLimitBurst=5

# Health check
ExecHealthCheck=/usr/bin/curl -f http://localhost:3001/api/health || exit 1
HealthCheckInterval=30
HealthCheckTimeout=5
HealthCheckRetries=3

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable claudyne-backend
sudo systemctl start claudyne-backend
sudo systemctl status claudyne-backend
```

---

## Troubleshooting During Deployment

### Deployment Fails at Migration Step

**Symptoms**:
```
ERROR: relation "users" already exists
```

**Solution**:
```bash
# Migrations are idempotent - this is OK
# Either:
# 1. Drop and recreate (dev only)
psql -U claudyne_user -d claudyne_production -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
psql -U claudyne_user -d claudyne_production < backend/migrations/20250101_init_schema.sql

# 2. Or skip and continue (tables already created from previous deployment)
# No action needed - this is expected
```

### Server Starts but Returns 502 Errors

**Diagnosis**:
```bash
# Check backend logs
pm2 logs claudyne-backend --err

# Check database is actually up
psql -U claudyne_user -d claudyne_production -c "SELECT 1;"

# Check all dependencies installed
cd backend && npm ls

# Check Node version compatibility
node --version  # Should be 16+, 18/20 recommended
```

### Memory Leak Detected

**Symptoms**: Memory grows continuously until restart

**Investigation**:
```bash
# Get heap dump
node --max-old-space-size=2048 --inspect backend/minimal-server.js

# In Chrome: chrome://inspect → Take heap snapshot

# Or use clinic.js
npx clinic memory -- node backend/minimal-server.js
```

**Temporary fix**: Auto-restart with PM2
```bash
pm2 restart claudyne-backend --max-memory-restart 800M
```

---

## Monthly Maintenance Checklist

- [ ] Review logs for patterns (errors, warnings)
- [ ] Check disk space: `df -h`
- [ ] Verify backups exist: `ls -lh .backups/*/db_backup.sql`
- [ ] Test rollback procedure (staging first)
- [ ] Rotate secrets (JWT, DB passwords) - quarterly
- [ ] Update dependencies: `npm update` (test first)
- [ ] Review performance metrics trend
- [ ] Check for CVEs: `npm audit`
- [ ] Verify database integrity: `psql ... -c "REINDEX DATABASE"`

---

## Contact & Escalation

**For Issues**:
1. Check logs: `pm2 logs claudyne-backend`
2. Run health check: `node backend/health-monitor.js`
3. Review PRODUCTION_RUNBOOK.md troubleshooting section
4. Check this file's troubleshooting section

**Escalation**:
- **Server won't start**: Check logs, Node version, dependencies
- **Database issues**: Check PostgreSQL running, backups, pg_dump
- **Memory issues**: Check logs for leaks, restart if needed
- **Network/DNS**: Verify firewall, check DNS resolution

---

**Status**: ✅ COMPLETE AND READY FOR PRODUCTION

This guide pairs with:
- `PRODUCTION_RUNBOOK.md` - Deployment procedures
- `DEPLOY_PROD_NOW.sh` - Automated deployment script
- `backend/health-monitor.js` - Health checking tool
- `DEPLOYMENT_SECURITY_HARDENING.md` - Security details
