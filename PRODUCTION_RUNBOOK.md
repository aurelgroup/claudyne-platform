# 🚀 CLAUDYNE PRODUCTION RUNBOOK

**Last Updated**: 2025-12-02
**Version**: 1.0 - Security Hardened Release
**Status**: ✅ PRODUCTION READY

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Pre-Deployment](#pre-deployment)
3. [Deployment Steps](#deployment-steps)
4. [Monitoring](#monitoring)
5. [Troubleshooting](#troubleshooting)
6. [Rollback](#rollback)
7. [Security Checklist](#security-checklist)

---

## Quick Start

**TL;DR for experienced ops:**

```bash
# Get latest code
cd /path/to/claudyne && git pull origin main

# Run deployment script
./DEPLOY_PROD_NOW.sh

# Start backend
NODE_ENV=production npm run backend:prod

# Monitor
node backend/health-monitor.js --continuous
```

---

## Pre-Deployment

### 1. Environment Setup

```bash
# Verify .env.production exists (NEVER commit to git)
test -f .env.production && echo "✅ .env.production found" || echo "❌ Missing!"

# Verify it contains no placeholder values
grep "CHANGE_ME\|VOTRE\|TODO" .env.production && echo "⚠️ Placeholders found!" || echo "✅ All values configured"
```

### 2. Security Verification

```bash
# Check NO secrets in git
git log --all -p | grep -i "password=\|api_key=\|secret=" | head -5
# Should be empty

# Verify .env files ignored
git status | grep -i ".env"
# Should show nothing

# Scan for accidentally committed secrets
git ls-files | xargs grep -l "DB_PASSWORD\|JWT_SECRET\|API_KEY" 2>/dev/null
# Should only match .example files, NOT production files
```

### 3. Database Preparation

```bash
# Create PostgreSQL user (if new setup)
sudo -u postgres psql << EOF
CREATE USER claudyne_user WITH PASSWORD 'SECURE_PASSWORD_HERE';
CREATE DATABASE claudyne_production OWNER claudyne_user;
EOF

# Verify connectivity
psql -U claudyne_user -d claudyne_production -c "SELECT 1;"
```

### 4. Dependency Check

```bash
cd backend
npm ci --production  # Clean install, production deps only
```

---

## Deployment Steps

### Step 1: Backup Current State

```bash
# Database backup
pg_dump -U claudyne_user -d claudyne_production > \
  backup_$(date +%s).sql

# Current code commit (for quick rollback)
git rev-parse HEAD > backup_commit.txt
```

### 2: Pull Latest Code

```bash
git fetch origin
git pull origin main

# Verify commits
git log origin/main -5 --oneline
# Should show recent security hardening commits
```

### Step 3: Apply Migrations

```bash
cd backend

# Migration 001: Base schema
psql -U claudyne_user -d claudyne_production < \
  migrations/20250101_init_schema.sql

# Migration 002: Enhanced lessons
psql -U claudyne_user -d claudyne_production < \
  migrations/20250601_add_lessons_columns.sql

# Verify migrations applied
psql -U claudyne_user -d claudyne_production -c "\dt"
# Should show all tables created
```

### Step 4: Stop Current Server

```bash
# If using PM2
pm2 stop claudyne-backend
pm2 delete claudyne-backend

# OR if direct process
pkill -f "node.*minimal-server.js" || true
```

### Step 5: Start New Server

```bash
cd /path/to/claudyne

# Option A: PM2 (recommended for production)
pm2 start backend/minimal-server.js \
  --name claudyne-backend \
  --instances 2 \
  --env NODE_ENV=production \
  --env-file .env.production \
  --max-memory-restart 1G \
  --log logs/pm2.log \
  --error logs/pm2-error.log

# Option B: systemd
systemctl restart claudyne-backend

# Option C: Direct (for testing only)
NODE_ENV=production npm run backend:prod
```

### Step 6: Verify Startup

```bash
# Wait for server to start
sleep 5

# Check process
ps aux | grep "node.*minimal-server"

# Check logs
pm2 logs claudyne-backend --lines 50

# Health check
curl http://localhost:3001/api/health
# Should return 200 OK with health data
```

---

## Monitoring

### Health Check Script

```bash
# One-time check
node backend/health-monitor.js

# Continuous monitoring (every 30 seconds)
node backend/health-monitor.js --continuous

# Verbose output
VERBOSE=true node backend/health-monitor.js
```

### What It Checks

- ✅ API health endpoint (`/api/health`)
- ✅ Auth endpoint accessibility (`/api/auth/health`)
- ✅ Database connection
- ✅ Response times (< 500ms = good)
- ✅ Process uptime & memory

### Log Monitoring

```bash
# Real-time logs
pm2 logs claudyne-backend

# Specific error logs
tail -f logs/pm2-error.log

# Search logs
grep "ERROR\|WARN" logs/pm2.log | tail -20
```

### Metrics to Watch

| Metric | Good | Warning | Critical |
|--------|------|---------|----------|
| Response Time | < 500ms | 500-1000ms | > 1000ms |
| Error Rate | < 1% | 1-5% | > 5% |
| Memory Usage | < 512MB | 512-1024MB | > 1024MB |
| Uptime | > 99% | 95-99% | < 95% |
| DB Queries | < 100ms | 100-500ms | > 500ms |

---

## Troubleshooting

### Issue: "Cannot connect to database"

**Diagnosis:**
```bash
# Check PostgreSQL running
sudo systemctl status postgresql

# Check credentials
psql -U claudyne_user -d claudyne_production -c "SELECT 1;"

# Check .env.production
grep "DB_" .env.production | head -3
```

**Fix:**
```bash
# Restart PostgreSQL
sudo systemctl restart postgresql

# Or update DB credentials in .env.production
# Then restart backend
pm2 restart claudyne-backend
```

---

### Issue: "Port 3001 already in use"

**Diagnosis:**
```bash
lsof -i :3001
```

**Fix:**
```bash
# Kill existing process
kill -9 <PID>

# Or use different port
sed -i 's/PORT=3001/PORT=3002/' .env.production
npm run backend:prod
```

---

### Issue: "Migrations failed"

**Diagnosis:**
```bash
# Check migration file
cat backend/migrations/20250101_init_schema.sql

# Try running manually
psql -U claudyne_user -d claudyne_production -f \
  backend/migrations/20250101_init_schema.sql -v ON_ERROR_STOP=1
```

**Fix:**
```bash
# Migrations are idempotent (safe to re-run)
# Check PostgreSQL logs for specific errors
sudo tail -f /var/log/postgresql/postgresql.log
```

---

### Issue: "Server crashes on startup"

**Diagnosis:**
```bash
# Check logs
pm2 logs claudyne-backend --err

# Check for required files
test -f backend/minimal-server.js && echo "✅" || echo "❌"
test -d backend/src && echo "✅" || echo "❌"

# Manual startup for errors
NODE_ENV=production node backend/minimal-server.js
```

**Fix:**
```bash
# Ensure dependencies installed
npm ci --production

# Check .env.production for syntax errors
node -c .env.production || echo "Check manually"

# Verify Node.js version
node --version
# Should be 16+ (18, 20 recommended)
```

---

## Rollback

### Quick Rollback (< 5 minutes)

```bash
# Stop current server
pm2 stop claudyne-backend

# Get previous commit
PREV_COMMIT=$(cat backup_commit.txt)
git reset --hard $PREV_COMMIT

# Restore database
psql -U claudyne_user -d claudyne_production < backup_*.sql

# Restart
pm2 start claudyne-backend
```

### Full Rollback (with verification)

```bash
# 1. Stop all services
pm2 stop claudyne-backend
sudo systemctl stop nginx

# 2. Restore database from backup
DB_BACKUP=$(ls -t backup_*.sql | head -1)
psql -U claudyne_user -d claudyne_production -f $DB_BACKUP

# 3. Restore code
git reset --hard <STABLE_COMMIT_HASH>

# 4. Clear caches
redis-cli FLUSHALL  # If using Redis

# 5. Restart services
pm2 start claudyne-backend
sudo systemctl start nginx

# 6. Verify
curl http://localhost:3001/api/health
```

---

## Security Checklist

### Before Every Deployment

- [ ] No secrets in code (`git log --all | grep -i password`)
- [ ] `.env.production` not committed (`git status | grep .env`)
- [ ] Database backup created (`ls backup_*.sql`)
- [ ] Node.js version compatible (`node --version`)
- [ ] Dependencies clean install (`npm ci --production`)

### After Deployment

- [ ] Health endpoint responding (`curl /api/health`)
- [ ] No error logs (`pm2 logs | grep ERROR`)
- [ ] Database queries working (`curl /api/students | head`)
- [ ] Auth system operational (`curl /api/auth/health`)
- [ ] Response times acceptable (`< 1000ms`)
- [ ] SSL certificate valid (if HTTPS) (`openssl s_client`)

### Ongoing (Weekly)

- [ ] Rotate secrets (JWT keys, DB passwords)
- [ ] Review logs for suspicious activity
- [ ] Check disk space (`df -h`)
- [ ] Verify backups exist
- [ ] Test rollback procedure

---

## Security Notes

### Secrets Management

```bash
# NEVER do this:
echo "DB_PASSWORD=secret" >> .env.production
git add .env.production

# INSTEAD do this:
cp .env.example .env.production
# Edit .env.production locally (never commit)
# Use .gitignore to prevent accidents
```

### Rotating Secrets

```bash
# Every 90 days:
# 1. Generate new JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 2. Update .env.production
sed -i 's/JWT_SECRET=.*/JWT_SECRET=<NEW_SECRET>/' .env.production

# 3. Restart with new secret
pm2 restart claudyne-backend

# 4. Old tokens become invalid (expected)
```

### Audit Trail

```bash
# Monitor who logs in
curl -s http://localhost:3001/api/logs/auth | jq '.[-10:]'

# Check for failed attempts
grep "Failed\|Error" logs/pm2.log

# Admin action log
curl -s http://localhost:3001/api/logs/admin | jq '.'
```

---

## Performance Tuning

### Node.js Optimization

```bash
# In .env.production:
NODE_OPTIONS="--max-old-space-size=2048"
# Adjust based on available RAM (2GB = 2048)
```

### PM2 Cluster Mode

```bash
pm2 start backend/minimal-server.js \
  --instances max \
  # Uses all CPU cores
```

### Database Connection Pool

```bash
# In .env.production:
DB_POOL_MIN=5      # Min connections
DB_POOL_MAX=20     # Max connections (tune based on load)
```

---

## Contact & Support

**For issues:**
1. Check logs: `pm2 logs claudyne-backend`
2. Run health check: `node backend/health-monitor.js`
3. Verify `.env.production` is correct
4. Review this runbook section by section

**Escalation:**
- Backend crashes → Check logs, restart with `pm2 restart`
- Database errors → Verify PostgreSQL running, check backups
- Secret issues → Review security checklist, rotate immediately

---

## Deployment Log Template

```
═══════════════════════════════════════════════════════════
CLAUDYNE PRODUCTION DEPLOYMENT LOG
Date: $(date)
Deployed by: $USER
Commit: $(git rev-parse HEAD)
═══════════════════════════════════════════════════════════

PRE-DEPLOYMENT CHECKS:
✅ Secrets verified
✅ Database backed up
✅ Code pulled
✅ Migrations ready

DEPLOYMENT:
✅ Old server stopped
✅ Code updated
✅ Migrations applied
✅ New server started

POST-DEPLOYMENT:
✅ Health check passed
✅ Auth working
✅ API responding
✅ No errors in logs

STATUS: SUCCESS ✅
═══════════════════════════════════════════════════════════
```

---

**🎉 YOU ARE NOW PRODUCTION READY! 🎉**

For questions, refer to:
- `DEPLOYMENT_SECURITY_HARDENING.md` - Detailed deployment guide
- `BACKEND_ARCHITECTURE.md` - Backend structure
- `backend/migrations/README.md` - Database migration guide
- `DEPLOY_PROD_NOW.sh` - Automated deployment script
