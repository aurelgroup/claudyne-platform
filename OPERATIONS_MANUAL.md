# Claudyne Operations Manual - Complete Index

**Last Updated**: 2025-12-02
**Status**: ✅ PRODUCTION READY
**Version**: 1.0

---

## 📚 Complete Operations Documentation Suite

This is the master index for all production operations documentation for Claudyne. Use this guide to find the right document for your task.

---

## Quick Navigation by Task

### 🚀 **I Need to Deploy to Production**

1. **First time deploying?** → Read `PRODUCTION_RUNBOOK.md` (complete guide)
2. **Automated deployment** → Run `./DEPLOY_PROD_NOW.sh` (handles everything)
3. **Manual deployment** → Follow `PRODUCTION_RUNBOOK.md` deployment steps
4. **Verifying deployment** → Use `DEPLOYMENT_VERIFICATION.md` quick checklist

**Key files**:
- `PRODUCTION_RUNBOOK.md` - Complete deployment guide
- `DEPLOY_PROD_NOW.sh` - Automated bash script
- `DEPLOYMENT_VERIFICATION.md` - Post-deployment checks
- `DEPLOYMENT_SECURITY_HARDENING.md` - Security details

---

### 📊 **I Need to Monitor Production**

1. **Quick status check** → `node backend/health-monitor.js`
2. **Continuous monitoring** → `DEPLOYMENT_VERIFICATION.md` (monitoring setup)
3. **Performance metrics** → `DEPLOYMENT_VERIFICATION.md` (metrics section)
4. **Log monitoring** → `DEPLOYMENT_VERIFICATION.md` (log aggregation)

**Key tools**:
- `backend/health-monitor.js` - Health check tool
- PM2 logs - `pm2 logs claudyne-backend`
- PostgreSQL monitoring - See `DEPLOYMENT_VERIFICATION.md`

---

### 🆘 **Production is Having an Issue**

1. **Identify severity** → `INCIDENT_RESPONSE_PLAYBOOK.md` (severity matrix)
2. **Find your issue** → Use table of contents in playbook
3. **Follow step-by-step** → Execute diagnosis and fix procedures
4. **Document incident** → Use incident log template at end of playbook

**Common scenarios**:
- **Service down** → Section 1 of playbook
- **Slow responses** → Section 2 of playbook
- **Memory issues** → Section 3 of playbook
- **Database problems** → Sections 5-6 of playbook
- **Startup failures** → Section 7 of playbook
- **High errors** → Section 8 of playbook

---

### 🔄 **Need to Rollback?**

1. **Emergency rollback (< 5 min)** → `INCIDENT_RESPONSE_PLAYBOOK.md` (section 9, quick)
2. **Full rollback (verified)** → `INCIDENT_RESPONSE_PLAYBOOK.md` (section 9, full)
3. **Manual rollback** → `PRODUCTION_RUNBOOK.md` (rollback section)

---

### 🔒 **Security & Secrets Management**

1. **Secrets rotation** → `PRODUCTION_RUNBOOK.md` (security notes)
2. **Security checklist** → `PRODUCTION_RUNBOOK.md` (security checklist)
3. **Security hardening** → `DEPLOYMENT_SECURITY_HARDENING.md`
4. **Environment setup** → `.env.example` (template, never commit actual values)

**Important**:
- Never commit `.env.production`
- Rotate JWT secrets every 90 days
- Always backup production secrets

---

### 💾 **Database Operations**

1. **Connection monitoring** → `DEPLOYMENT_VERIFICATION.md` (database health)
2. **Slow query logging** → `DEPLOYMENT_VERIFICATION.md` (database health)
3. **Backup verification** → `DEPLOYMENT_VERIFICATION.md` (backup checking)
4. **Migrations** → `backend/migrations/README.md`

**All migrations are idempotent (IF NOT EXISTS)**

---

### 📈 **Performance & Optimization**

1. **Memory profiling** → `DEPLOYMENT_VERIFICATION.md` (section 5)
2. **Performance tuning** → `PRODUCTION_RUNBOOK.md` (performance tuning)
3. **Node.js optimization** → `PRODUCTION_RUNBOOK.md` (Node.js options)
4. **PM2 clustering** → `PRODUCTION_RUNBOOK.md` (PM2 cluster mode)

---

### 📋 **Monthly/Quarterly Checklist**

1. **Monthly maintenance** → `DEPLOYMENT_VERIFICATION.md` (monthly checklist)
2. **Quarterly secret rotation** → `PRODUCTION_RUNBOOK.md` (security notes)
3. **CI/CD verification** → See GitHub Actions in `.github/workflows/`

---

## 📖 Document Overview

### Core Operational Documents

| Document | Purpose | When to Use | Page Length |
|----------|---------|-----------|------------|
| **PRODUCTION_RUNBOOK.md** | Complete deployment & operations guide | Every deployment, standard operations | 400+ lines |
| **DEPLOY_PROD_NOW.sh** | Automated deployment script | Routine deployments | 217 lines |
| **DEPLOYMENT_VERIFICATION.md** | Post-deploy verification & monitoring | After deployment, ongoing monitoring | 543 lines |
| **INCIDENT_RESPONSE_PLAYBOOK.md** | Step-by-step incident procedures | When production has issues | 723 lines |
| **DEPLOYMENT_SECURITY_HARDENING.md** | Security details & checklist | Before first deployment, security reviews | 200 lines |
| **backend/health-monitor.js** | Automated health checking tool | Continuous monitoring, CI/CD | 181 lines |

### Reference Documents

| Document | Purpose | Location |
|----------|---------|----------|
| **backend/migrations/README.md** | Database migration guide | `backend/migrations/` |
| **BACKEND_ARCHITECTURE.md** | Backend structure explanation | Root directory |
| **APK_MANAGEMENT.md** | Mobile APK strategy | `claudyne-mobile/` |
| **.env.example** | Environment template (clean, safe) | Root & `backend/` |

---

## 🔑 Key Commands Reference

### Health & Monitoring

```bash
# Quick health check
node backend/health-monitor.js

# Continuous monitoring
CONTINUOUS=true node backend/health-monitor.js

# Watch real-time logs
pm2 logs claudyne-backend

# Check memory usage
ps aux | grep "node.*minimal-server"
```

### Deployment

```bash
# Automated deployment (RECOMMENDED)
./DEPLOY_PROD_NOW.sh

# Manual deployment (step by step)
git pull origin main
cd backend && npm ci --production
NODE_ENV=production npm run backend:prod

# Verify after deploy
curl http://localhost:3001/api/health
```

### Rollback

```bash
# Quick rollback
pm2 stop claudyne-backend
git reset --hard <previous-commit>
pm2 restart claudyne-backend

# Full rollback (with verification)
# See INCIDENT_RESPONSE_PLAYBOOK.md section 9
```

### Database

```bash
# Connect to production database
psql -U claudyne_user -d claudyne_production

# Backup database
pg_dump -U claudyne_user -d claudyne_production > backup.sql

# Apply migrations
psql -U claudyne_user -d claudyne_production < backend/migrations/20250101_init_schema.sql
psql -U claudyne_user -d claudyne_production < backend/migrations/20250601_add_lessons_columns.sql
```

### Secret Rotation

```bash
# Generate new JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Update .env.production
sed -i 's/JWT_SECRET=.*/JWT_SECRET=<NEW_VALUE>/' .env.production

# Restart server
pm2 restart claudyne-backend
```

---

## 📊 Standard Metrics & SLAs

### Performance Targets

| Metric | Target | Warning | Alert |
|--------|--------|---------|-------|
| API Response Time (p95) | < 500ms | 500-1000ms | > 1000ms |
| Error Rate | < 0.1% | 0.1-1% | > 1% |
| Database Query Time (p95) | < 100ms | 100-500ms | > 500ms |
| Memory Usage | < 300MB | 300-600MB | > 600MB |
| CPU Usage | < 30% | 30-70% | > 70% |
| Uptime | > 99.9% | 99-99.9% | < 99% |

### Alerting Thresholds

Set alerts when:
- **Memory > 600MB** → Issue warning
- **Memory > 800MB** → Trigger auto-restart
- **Error rate > 1%** → Page on-call engineer
- **Response time > 1000ms** → Page on-call engineer
- **Database down** → Immediate escalation

---

## 🎯 Runbook Decision Tree

```
Production Issue Detected
│
├─ Is service responding at all?
│  ├─ NO → SERVICE DOWN (INCIDENT_RESPONSE_PLAYBOOK section 1)
│  └─ YES → Is it slow?
│     ├─ YES → HANGING SERVER (section 2)
│     └─ NO → Check error rate
│        ├─ HIGH → Check logs (section 8)
│        └─ NORMAL → Check resources
│           ├─ High Memory → section 3
│           ├─ High CPU → section 4
│           └─ Database Issue → sections 5-6
│
└─ Need to rollback?
   └─ YES → INCIDENT_RESPONSE_PLAYBOOK section 9
```

---

## 📞 Escalation & Contacts

### Severity Levels

- **P1 (Critical)**: Response < 5 min, immediate escalation
- **P2 (High)**: Response < 15 min, notify lead engineer
- **P3 (Medium)**: Response < 1 hour, queue for sprint
- **P4 (Low)**: Response < 1 day, log for future

### Escalation Chain

```
On-Call Engineer
    ↓
Tech Lead
    ↓
CTO
    ↓
External Support (if needed)
```

### Key Contacts

| Role | Name | Phone | Email |
|------|------|-------|-------|
| Tech Lead | [FILL] | [FILL] | [FILL] |
| DevOps | [FILL] | [FILL] | [FILL] |
| DBA | [FILL] | [FILL] | [FILL] |
| Security | [FILL] | [FILL] | [FILL] |

---

## 🔍 Troubleshooting Matrix

| Symptom | Likely Cause | Section | Quick Fix |
|---------|--------------|---------|-----------|
| API returns 502 | Backend down | P1 | Restart with `pm2 restart` |
| Slow responses | High load or query | P2 | Check resources, optimize DB |
| Memory growing | Memory leak | P2 | Restart with memory limit |
| Database won't connect | PostgreSQL down | P1 | `sudo systemctl restart postgresql` |
| Server crashes on start | Missing deps/env | P1 | `npm ci --production` |
| High error rate | Application bug | P3 | Check logs, roll back if recent change |
| Port already in use | Process not stopped | P3 | `lsof -i :3001` then kill |

---

## ✅ Pre-Production Checklist

Before going live with any deployment:

- [ ] Database backups created
- [ ] `.env.production` configured (no placeholders)
- [ ] Secrets not in git history
- [ ] Migrations tested on staging
- [ ] Health check endpoints verified
- [ ] PM2 configured with auto-restart
- [ ] Log rotation configured
- [ ] Monitoring active
- [ ] Incident response team briefed
- [ ] Rollback procedure tested

---

## 📚 Document Cross-References

### Quick Links to Key Sections

**PRODUCTION_RUNBOOK.md**:
- Pre-deployment: Lines 41-87
- Deployment steps: Lines 91-181
- Monitoring: Lines 185-229
- Troubleshooting: Lines 233-327
- Rollback: Lines 331-373
- Security: Lines 377-449

**DEPLOYMENT_VERIFICATION.md**:
- Quick checklist: Lines 1-85
- Monitoring setup: Lines 87-265
- Health monitoring: Lines 267-310
- Database monitoring: Lines 312-395
- Auto-recovery: Lines 397-475

**INCIDENT_RESPONSE_PLAYBOOK.md**:
- Severity matrix: Lines 1-20
- Service down: Lines 24-75
- Hanging server: Lines 77-150
- Memory issues: Lines 152-214
- CPU issues: Lines 216-264
- Database issues: Lines 266-336
- Rollback: Lines 372-445
- Security incidents: Lines 447-510

---

## 🎓 Learning Path

**New to Claudyne operations?** Follow this order:

1. **Start with**: `PRODUCTION_RUNBOOK.md` - Read the whole thing (30 min)
2. **Practice**: Run `./DEPLOY_PROD_NOW.sh` on staging (20 min)
3. **Study**: `INCIDENT_RESPONSE_PLAYBOOK.md` - Focus on P2 issues (20 min)
4. **Deep dive**: `DEPLOYMENT_VERIFICATION.md` - Learn monitoring (20 min)
5. **Reference**: Keep this manual (`OPERATIONS_MANUAL.md`) bookmarked

**Total onboarding time**: ~90 minutes

---

## 📞 Support & Updates

This manual is version 1.0 (2025-12-02). Check for updates:

```bash
# Get recent changes
git log --oneline OPERATIONS_MANUAL.md PRODUCTION_RUNBOOK.md \
  INCIDENT_RESPONSE_PLAYBOOK.md DEPLOYMENT_VERIFICATION.md

# Pull latest
git pull origin main
```

---

## 🏁 Summary

You now have comprehensive operations documentation covering:

✅ Deployment procedures (automated & manual)
✅ Verification and monitoring
✅ Incident response with step-by-step procedures
✅ Security and secrets management
✅ Performance optimization
✅ Database operations
✅ Rollback procedures
✅ Escalation contacts

**Status**: PRODUCTION READY ✅

For any questions: Refer to the relevant document above.

---

**Last Updated**: 2025-12-02
**Maintained by**: DevOps Team
**Repository**: https://github.com/aurelgroup/claudyne-platform
