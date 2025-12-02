# Claudyne Incident Response Playbook

**Last Updated**: 2025-12-02
**Version**: 1.0 - Complete
**Status**: ✅ PRODUCTION READY

---

## Overview

This playbook provides step-by-step incident response procedures for critical production issues. Follow the SEVERITY level to determine response time and escalation.

| Severity | Definition | Response Time | Escalation |
|----------|-----------|----------------|------------|
| **P1 - Critical** | Service completely down, > 50% users affected | 5 minutes | Immediate escalation |
| **P2 - High** | Partial outage, 10-50% users affected | 15 minutes | Notify lead engineer |
| **P3 - Medium** | Degraded performance, < 10% users affected | 1 hour | Queue for next sprint |
| **P4 - Low** | Minor issue, no user impact | Next day | Log for future improvement |

---

## 1. SERVICE DOWN - Backend Not Responding

**Severity**: P1 - CRITICAL
**Response Time**: 5 minutes
**Status Page**: UPDATE IMMEDIATELY

### Step 1: Verify the Issue (2 minutes)

```bash
# Is it actually down or network issue?
curl -v http://localhost:3001/api/health

# Check if process is running
ps aux | grep "node.*minimal-server" | grep -v grep

# Check if port is listening
netstat -tlnp | grep 3001

# Check logs for crashes
pm2 logs claudyne-backend --err --lines 20
tail -f logs/pm2-error.log
```

**If process is running but not responding:**
→ Skip to **Hanging Server** section

**If process crashed:**
→ Continue to Step 2

### Step 2: Check Recent Changes (3 minutes)

```bash
# What changed in last hour?
git log --oneline -10

# Any recent deployments?
ls -lht .backups/ | head -5

# Environment variables changed?
diff <(cat .backups/*/  .env.production.backup) .env.production 2>/dev/null || echo "No backups"
```

**If recent deployment looks problematic:**
→ Go to **ROLLBACK** section

**Otherwise:**
→ Continue to Step 3

### Step 3: Restart Server (2 minutes)

```bash
# Option A: With PM2 (recommended)
pm2 restart claudyne-backend
pm2 logs claudyne-backend --lines 50

# Option B: Manual restart
pkill -f "node.*minimal-server"
sleep 2
NODE_ENV=production npm run backend:prod > logs/manual-restart.log 2>&1 &

# Verify it started
sleep 5
curl http://localhost:3001/api/health
```

**If server starts successfully:**
→ RESOLVED - Monitor for 15 minutes, document in incident log

**If server crashes immediately:**
→ Go to **SERVER CRASHES ON STARTUP** section

---

## 2. HANGING SERVER - Responding but Slow/Stuck

**Severity**: P2 - HIGH
**Response Time**: 15 minutes
**Status Page**: DEGRADED

### Step 1: Diagnose Hanging (5 minutes)

```bash
# Check response time
time curl http://localhost:3001/api/health

# Monitor system resources
top -p $(pgrep -f "node.*minimal-server") -b -n 1

# Check CPU usage
ps aux | grep "node.*minimal-server" | grep -v grep | awk '{print $3, $6}'
# First number = CPU%, second = Memory KB

# Check database connections
psql -U claudyne_user -d claudyne_production << EOF
SELECT count(*) as connections,
       pg_size_pretty(pg_database_size('claudyne_production')) as db_size
FROM pg_stat_activity
WHERE datname = 'claudyne_production';
EOF

# Check for long-running queries
psql -U claudyne_user -d claudyne_production << EOF
SELECT pid, usename, query,
       extract(epoch from (now() - query_start)) as seconds_running
FROM pg_stat_activity
WHERE datname = 'claudyne_production'
AND state != 'idle'
AND query_start < now() - INTERVAL '5 seconds'
ORDER BY query_start;
EOF
```

### Step 2: Identify Root Cause

**If CPU is high (> 80%):**
→ Go to **HIGH CPU USAGE** section

**If Memory is high (> 1GB):**
→ Go to **HIGH MEMORY USAGE** section

**If Database has hanging queries:**
→ Go to **DATABASE HUNG QUERIES** section

**If nothing obvious:**
→ Go to **GRACEFUL RESTART** section

---

## 3. HIGH MEMORY USAGE - Memory Leak or Leak-like

**Severity**: P2 - HIGH
**Response Time**: 15 minutes

### Quick Fix (2 minutes)

```bash
# Check current memory
ps aux | grep "node.*minimal-server" | grep -v grep | awk '{print "Memory:", $6 / 1024, "MB"}'

# If > 1GB, immediate restart
if [ $(ps aux | grep "node.*minimal-server" | grep -v grep | awk '{print $6}') -gt 1048576 ]; then
    pm2 restart claudyne-backend --max-memory-restart 800M
fi
```

### Step 1: Identify Leak Pattern (5 minutes)

```bash
# Get baseline
ps aux | grep "node.*minimal-server" | awk '{print "Baseline:", $6 / 1024, "MB"}' > /tmp/mem-baseline.txt

# Wait 2 minutes
sleep 120

# Get current
ps aux | grep "node.*minimal-server" | awk '{print "Current:", $6 / 1024, "MB"}' >> /tmp/mem-baseline.txt

# Compare
cat /tmp/mem-baseline.txt
# If Current > Baseline + 100MB = possible leak
```

### Step 2: Collect Heap Dump

```bash
# Stop server gracefully
pm2 gracefulReload claudyne-backend

# Start with inspection enabled
pm2 start backend/minimal-server.js \
  --name claudyne-backend \
  --node-args="--inspect=9229 --max-old-space-size=2048" \
  --env NODE_ENV=production

# In Chrome: chrome://inspect
# Capture heap snapshot after 5 minutes of load

# Save for analysis
echo "Heap dump captured - analyze with Chrome DevTools"
```

### Step 3: Temporary Mitigation

```bash
# Set aggressive restart policy
pm2 restart claudyne-backend --max-memory-restart 500M
pm2 save

# This will auto-restart server when memory > 500MB
# Buys time while investigating root cause
```

**Action Items**:
- [ ] Open GitHub issue with "memory-leak" label
- [ ] Assign to backend team for investigation
- [ ] Monitor memory trend hourly
- [ ] If critical: scale horizontally with PM2 cluster mode

---

## 4. HIGH CPU USAGE - Stuck Loop or Expensive Operation

**Severity**: P2 - HIGH
**Response Time**: 15 minutes

### Step 1: Identify Hot Code (3 minutes)

```bash
# Profile CPU usage
npm install -g clinic

# Run profiler
clinic flame -- node backend/minimal-server.js

# Let it run for 2-3 minutes under load
# Kill with Ctrl+C
# Open report in browser (URL will be printed)
```

### Step 2: Temporary Fix

```bash
# If specific endpoint is causing high CPU:
# Quick patch: add rate limiting

# In minimal-server.js (temporary)
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100 // 100 requests per minute
});

app.use('/api/', limiter);

# Restart
pm2 restart claudyne-backend
```

**Action Items**:
- [ ] Identify which endpoint causes high CPU
- [ ] Add rate limiting if needed
- [ ] Optimize database queries (add indexes, reduce loops)
- [ ] Scale horizontally if load is legitimate

---

## 5. DATABASE HUNG QUERIES

**Severity**: P2 - HIGH
**Response Time**: 15 minutes

### Step 1: Identify Long-Running Queries

```bash
psql -U claudyne_user -d claudyne_production << EOF
SELECT pid, usename, application_name, query,
       extract(epoch from (now() - query_start)) as seconds,
       state
FROM pg_stat_activity
WHERE datname = 'claudyne_production'
AND query_start < now() - INTERVAL '1 minute'
ORDER BY query_start;
EOF
```

### Step 2: Kill Blocking Query (Use With Caution)

```bash
# Find blocking PID
psql -U claudyne_user -d claudyne_production << EOF
SELECT pid, usename, query FROM pg_stat_activity
WHERE datname = 'claudyne_production'
AND query_start < now() - INTERVAL '5 minutes';
EOF

# Kill it (graceful)
psql -U claudyne_user -d claudyne_production << EOF
SELECT pg_terminate_backend(PID);
EOF
```

### Step 3: Check Locks

```bash
psql -U claudyne_user -d claudyne_production << EOF
SELECT relation::regclass, mode, granted FROM pg_locks
WHERE database = (SELECT oid FROM pg_database WHERE datname = 'claudyne_production')
AND NOT granted
ORDER BY relation;
EOF
```

**Action Items**:
- [ ] Add indexes: `CREATE INDEX IF NOT EXISTS ...`
- [ ] Analyze query plan: `EXPLAIN ANALYZE SELECT ...`
- [ ] Split large transactions into smaller batches

---

## 6. DATABASE CONNECTION FAILURES

**Severity**: P1 - CRITICAL
**Response Time**: 5 minutes

### Step 1: Verify Database is Up

```bash
# Is PostgreSQL running?
sudo systemctl status postgresql

# Can we connect at all?
psql -U claudyne_user -d claudyne_production -c "SELECT 1;"

# Check connection limit
psql -U claudyne_user -d claudyne_production << EOF
SHOW max_connections;
SELECT count(*) FROM pg_stat_activity;
EOF

# Check if at limit
psql -U claudyne_user -d claudyne_production -c "SHOW max_connections" | head -1
psql -U claudyne_user -d claudyne_production -c "SELECT count(*) FROM pg_stat_activity"
```

### Step 2: If PostgreSQL is Down

```bash
# Check why
sudo systemctl start postgresql
sudo systemctl status postgresql

# Check logs
sudo tail -f /var/log/postgresql/postgresql.log

# Common issues:
# 1. Disk full?
df -h | grep postgres

# 2. OOM kill?
dmesg | tail -20

# 3. Port conflict?
sudo lsof -i :5432
```

### Step 3: If at Connection Limit

```bash
# Increase limit (requires PostgreSQL restart)
sudo -u postgres psql << EOF
ALTER SYSTEM SET max_connections = 200;
SELECT pg_reload_conf();
EOF

# Restart PostgreSQL
sudo systemctl restart postgresql

# Verify
psql -U claudyne_user -d claudyne_production -c "SHOW max_connections;"
```

---

## 7. SERVER CRASHES ON STARTUP

**Severity**: P1 - CRITICAL
**Response Time**: 5 minutes

### Step 1: Get Error Message (2 minutes)

```bash
# Run directly (not with PM2) to see errors
cd /c/Users/fa_nono/Documents/CADD/Claudyne
NODE_ENV=production node backend/minimal-server.js

# Output should show:
# - Module not found
# - Syntax errors
# - Missing env variables
# - Port already in use
```

### Step 2: Diagnose by Error Type

**Error: `Cannot find module`**
```bash
# Solution: Install dependencies
cd backend
npm ci --production
# or
npm install --production
```

**Error: `EADDRINUSE`** (port 3001 already in use)
```bash
# Solution: Kill existing process
lsof -i :3001
kill -9 <PID>
# Then restart
pm2 restart claudyne-backend
```

**Error: `SyntaxError`**
```bash
# Check for recent changes
git diff HEAD~1..HEAD backend/
# Revert if needed
git revert --no-edit <commit-hash>
```

**Error: `.env.production not found`**
```bash
# Solution: Create it
cp .env.example .env.production
# Fill in actual values
nano .env.production
```

---

## 8. HIGH ERROR RATE IN LOGS

**Severity**: P2 - HIGH
**Response Time**: 15 minutes

### Step 1: Categorize Errors (5 minutes)

```bash
# Get error summary
pm2 logs claudyne-backend --err --lines 100 | \
  grep -o "Error: [^0-9]*" | \
  sort | uniq -c | sort -rn

# Or
tail -100 logs/pm2-error.log | \
  grep -o "Error: [^0-9]*" | \
  sort | uniq -c | sort -rn
```

### Step 2: Identify if Error Pattern

```bash
# All same error? → Single root cause
# Many different errors? → Systemic issue

# If single error type:
pm2 logs claudyne-backend --err | grep "Your Error Message" | head -1

# If systemic:
# Check:
# 1. Database connectivity
psql -U claudyne_user -d claudyne_production -c "SELECT 1;"
# 2. Environment variables
grep -E "DB_|JWT_|API_" .env.production
# 3. Recent deployment
git log --oneline -5
```

---

## 9. ROLLBACK PROCEDURE - Emergency

**Severity**: P1 - CRITICAL
**Response Time**: 5 minutes

### Quick Rollback (< 5 minutes)

**DO NOT USE IF UNSURE - ask lead engineer first**

```bash
#!/bin/bash
set -e

cd /c/Users/fa_nono/Documents/CADD/Claudyne

echo "⚠️  INITIATING EMERGENCY ROLLBACK"
echo "════════════════════════════════════"

# 1. Find previous working commit
PREV_COMMIT=$(git log --oneline -3 | tail -1 | awk '{print $1}')
echo "Rolling back to: $PREV_COMMIT"
read -p "Confirm? (type 'yes'): " confirm
[ "$confirm" != "yes" ] && exit 1

# 2. Stop server
pm2 stop claudyne-backend

# 3. Reset code
git reset --hard $PREV_COMMIT

# 4. Restore database backup if exists
BACKUP_DIR=".backups"
if [ -d "$BACKUP_DIR" ]; then
    LATEST_BACKUP=$(ls -t $BACKUP_DIR/*/db_backup.sql | head -1)
    if [ ! -z "$LATEST_BACKUP" ]; then
        echo "Restoring database from: $LATEST_BACKUP"
        psql -U claudyne_user -d claudyne_production < $LATEST_BACKUP
    fi
fi

# 5. Restart
pm2 restart claudyne-backend
pm2 logs claudyne-backend --lines 20

echo ""
echo "✅ Rollback complete"
echo "Verify: curl http://localhost:3001/api/health"
```

### Full Rollback (with verification)

```bash
#!/bin/bash

cd /c/Users/fa_nono/Documents/CADD/Claudyne

echo "🔄 FULL ROLLBACK PROCEDURE"
echo "════════════════════════════════════"

# 1. Update status page FIRST
echo "📢 Update: 'We are investigating an issue. ETA 10 minutes.'"

# 2. Stop services
pm2 stop claudyne-backend

# 3. Find stable commit
echo "Recent commits:"
git log --oneline -10
read -p "Enter commit hash to rollback to: " TARGET_COMMIT

# 4. Verify commit
git show $TARGET_COMMIT --stat

# 5. Backup current state
mkdir -p .rollback-backup
cp .env.production .rollback-backup/.env.production.$(date +%s)
git bundle create .rollback-backup/current-state.bundle HEAD

# 6. Reset
git reset --hard $TARGET_COMMIT

# 7. Re-apply database migrations (idempotent)
psql -U claudyne_user -d claudyne_production < backend/migrations/20250101_init_schema.sql
psql -U claudyne_user -d claudyne_production < backend/migrations/20250601_add_lessons_columns.sql

# 8. Restart
npm ci --production
pm2 start backend/minimal-server.js --name claudyne-backend --env NODE_ENV=production

# 9. Verify health
sleep 5
curl http://localhost:3001/api/health

# 10. Post to status page
echo "✅ System restored. Running verification tests..."
node backend/health-monitor.js

echo "✅ Rollback complete and verified"
```

---

## 10. SECURITY INCIDENT - Possible Compromise

**Severity**: P1 - CRITICAL
**Response Time**: IMMEDIATE

### Immediate Actions (5 minutes)

```bash
# 1. Isolate the system (pull from load balancer if applicable)
# 2. DO NOT DELETE LOGS

# 3. Check for unauthorized access
psql -U claudyne_user -d claudyne_production << EOF
SELECT * FROM admin_logs
ORDER BY created_at DESC
LIMIT 50;
EOF

# 4. Check git history for suspicious commits
git log --all --source --remotes --decorate --oneline -20

# 5. Look for suspicious files
find . -type f -newermt "1 hour ago" | grep -v node_modules | grep -v ".git"

# 6. Check environment for exposed secrets
env | grep -E "PASSWORD|SECRET|KEY"

# 7. Rotate all secrets IMMEDIATELY
# Generate new JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Update .env.production
sed -i 's/JWT_SECRET=.*/JWT_SECRET=<NEW_SECRET>/' .env.production

# New database password
# ALTER USER claudyne_user WITH PASSWORD 'new_secure_password';
```

### Investigation (ongoing)

```bash
# Review all commits in last 24 hours
git log --oneline --since="24 hours ago"

# Check for code changes in sensitive files
git diff <safe-commit> HEAD -- backend/

# Audit user access logs
grep "user.*login\|auth.*fail" logs/pm2.log

# Look for database changes
psql -U claudyne_user -d claudyne_production << EOF
SELECT * FROM admin_logs
WHERE created_at > now() - INTERVAL '1 day'
ORDER BY created_at DESC;
EOF
```

### Post-Incident

- [ ] Disable any compromised user accounts
- [ ] Force password resets for all admin users
- [ ] Rotate JWT secrets
- [ ] Change database password
- [ ] Review and update `.gitignore` to prevent future exposure
- [ ] Enable 2FA on GitHub
- [ ] Audit all git history for other exposures
- [ ] Update security documentation
- [ ] Post-mortem meeting within 24 hours

---

## ESCALATION CONTACTS

```
Lead Engineer: [NAME] [PHONE] [EMAIL]
DevOps Lead: [NAME] [PHONE] [EMAIL]
Database Admin: [NAME] [PHONE] [EMAIL]
Security Team: [EMAIL] [SLACK]
```

---

## INCIDENT LOG TEMPLATE

```
═══════════════════════════════════════════════════════════
CLAUDYNE INCIDENT LOG
Date: 2025-12-02
Severity: P2 - HIGH
Duration: 14 minutes (14:15 - 14:29 UTC)
═══════════════════════════════════════════════════════════

SYMPTOMS:
- API returning 502 errors
- Health check failing
- Database connections timing out

ROOT CAUSE:
- PostgreSQL process killed by OOM
- Memory pressure from background job leak

DETECTION TIME: 14:15
MITIGATION START: 14:16
RESOLUTION TIME: 14:29
USERS AFFECTED: ~500 (45% of user base)

ACTIONS TAKEN:
1. ✅ Restarted PostgreSQL service (14:17)
2. ✅ Cleared client connections (14:18)
3. ✅ Restarted backend server (14:20)
4. ✅ Verified health endpoints (14:29)

FOLLOW-UP:
- [ ] Investigate background job memory leak
- [ ] Implement stricter monitoring on memory
- [ ] Add OOM prevention with PM2 limits
- [ ] Update runbooks with this scenario

LESSONS LEARNED:
- Background jobs need memory limits
- Need earlier warning before OOM
- Could have mitigated faster with stricter limits

PREVENTION:
- Set PM2 max-memory-restart to 800M
- Monitor background job queue size
- Add alerting at 70% memory usage

═══════════════════════════════════════════════════════════
```

---

**Status**: ✅ COMPLETE

This playbook is meant to be used alongside:
- `PRODUCTION_RUNBOOK.md` - Standard operations
- `DEPLOYMENT_VERIFICATION.md` - Verification procedures
- `backend/health-monitor.js` - Automated health checks
