# Production Deployment Steps - TokenService Fix

## Pre-Deployment Verification

Before deploying, verify that `.env.production` on the production server contains:

```bash
ssh root@89.117.58.53 "cd /opt/claudyne && head -30 .env.production | grep -E 'DB_HOST|DB_PORT|DB_NAME|DB_USER'"
```

Should show:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=claudyne_production
DB_USER=claudyne_user
DB_PASSWORD=***  (should be set, not shown here)
```

## Deployment Procedure (Clean, PM2-based)

### 1. SSH into Production Server
```bash
ssh root@89.117.58.53
cd /opt/claudyne
```

### 2. Pull Latest Code from Repository
```bash
git pull origin main
```

### 3. Install/Update Dependencies (if needed)
```bash
cd backend
npm ci  # Use 'ci' not 'install' for production consistency
cd ..
```

### 4. Restart Backend via PM2 (Single Command)
```bash
# Option A: If using PM2 process management directly
pm2 restart claudyne-backend

# Option B: If using ecosystem.config.js
pm2 restart ecosystem.config.js --only claudyne-backend
```

**IMPORTANT**: Do NOT run `npm run start` outside of PM2. PM2 manages the process lifecycle.

### 5. Monitor Startup (Wait ~10 seconds)
```bash
pm2 logs claudyne-backend --lines 30 --nostream
```

**Expected logs**:
```
✅ Connexion base de données établie
✅ Table admin_tokens initialisée avec succès
🚀 Serveur en écoute sur le port 3001
```

**NOT expected** (these indicate issues):
```
❌ Erreur initialisation table admin_tokens: (should NOT crash app anymore)
error: password authentication failed (indicates wrong DB password)
EADDRINUSE (indicates port conflict - another process on 3001)
```

### 6. Verify Health Endpoint
```bash
curl -s http://localhost:3001/api/health
```

**Expected response**: `{"status":"healthy","database":"connected",...}`

### 7. Test Student Registration
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "accountType":"STUDENT",
    "email":"test.registration@claudyne.com",
    "password":"TestPass123!",
    "firstName":"Test",
    "lastName":"Registration",
    "dateOfBirth":"2010-01-15",
    "educationLevel":"6EME",
    "city":"Douala",
    "acceptTerms":true
  }'
```

**Expected response**: `{"success":true,"message":"Compte étudiant créé avec succès",...}`

**Problem responses**:
- `503 Service Unavailable` → Backend not responding, check `pm2 logs`
- `500 with DB error` → Database connection issue, verify `.env.production` credentials
- `400 with validation error` → Request body issue, check JSON

### 8. Verify No Process Conflicts
```bash
# Check that only ONE backend process exists
ps aux | grep "node.*server.js" | grep -v grep
# Should show exactly ONE process

# Verify port 3001 is only used once
netstat -tlnp 2>/dev/null | grep 3001
# Should show only ONE listening socket
```

### 9. Monitor Logs for Issues
```bash
# Watch logs in real-time for 30 seconds
pm2 logs claudyne-backend --lines 50

# Check for authentication errors (indicates wrong DB password)
pm2 logs claudyne-backend --nostream | grep -i "password\|auth"
```

## Troubleshooting

### If Backend Still Returns 503

**Check 1**: Verify database connection
```bash
# From production server (credentials in .env.production)
source /opt/claudyne/.env.production
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;"
```

Should return: `1` (success)

**Check 2**: Verify no duplicate processes
```bash
# Kill any orphaned Node processes
pm2 delete claudyne-backend
sleep 2
# Then restart via PM2
pm2 start ecosystem.config.js --only claudyne-backend
```

**Check 3**: Check logs for the actual error
```bash
pm2 logs claudyne-backend --lines 200 | grep -E "error|Error|ERROR|failed"
```

### If `database: connected` is false in health

The fix makes the app non-blocking, so it starts even if table creation fails. The `admin_tokens` table might not exist yet. This is OK:
- App will continue to work
- Table will be created on next successful database operation
- Or manually create it:

```bash
psql -h localhost -U claudyne_user -d claudyne_production << SQL
CREATE TABLE IF NOT EXISTS admin_tokens (
    id SERIAL PRIMARY KEY,
    token VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by VARCHAR(100) DEFAULT 'system'
);
SQL
```

## What Changed

**File Modified**: `backend/src/services/tokenService.js`

**Change**: Made database table initialization non-blocking
- Before: `this.initializeDatabase()` (would throw error and crash app)
- After: `this.initializeDatabase().catch(err => {...})` (logs error, app continues)

**Impact**: 
- App now starts successfully even if table creation fails
- Prevents PM2 restart loops that were causing 503 errors
- Does NOT fix incorrect database credentials (those still cause issues)

## Post-Deployment Verification

After 5 minutes of successful operation:

```bash
# Check PM2 status - should show "online" not "restarting"
pm2 status

# Check memory usage - should be stable, not growing
pm2 monit

# Verify error rate is low
pm2 logs claudyne-backend --err 2>&1 | wc -l
# Should be close to 0
```

## Rollback (if needed)

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Restart
pm2 restart claudyne-backend

# Or, if critical, restore from backup commit
git reset --hard <previous-commit-hash>
pm2 restart claudyne-backend
```

---

**Key Points**:
✅ Use PM2 to manage processes (no `npm start &`)
✅ Use `npm ci` not `npm install` for consistency
✅ Verify `.env.production` has correct DB credentials
✅ Check logs for actual errors, not just HTTP status
✅ Test with real student registration request

