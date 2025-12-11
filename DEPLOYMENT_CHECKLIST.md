# Claudyne Deployment Checklist
**Use this checklist every time you deploy to production**

## Pre-Deployment Checks

### 1. Environment Variables
```bash
# Verify all required env vars are set in .env.production
ssh root@89.117.58.53 "cd /opt/claudyne && cat .env.production | grep -E 'CORS_ORIGIN|DB_HOST|JWT_SECRET'"
```

**CRITICAL:** Ensure CORS_ORIGIN includes ALL domain variants:
- ✅ `https://claudyne.com`
- ✅ `https://www.claudyne.com`
- ✅ `http://claudyne.com` (for redirects)
- ✅ `http://www.claudyne.com` (for redirects)
- ✅ `http://localhost:3000` (for local dev)

### 2. Test Locally First
```bash
# Check for undefined variables in frontend
grep -n "phone:" index.html | grep -v "phoneE164"
# Should return NOTHING - if found, there's a bug

# Verify service worker version was bumped
grep "CACHE_NAME" sw.js
```

### 3. Backend Status Check
```bash
ssh root@89.117.58.53 "pm2 status claudyne-backend"
# Should show 'online' status
```

## Deployment Steps

### IMPORTANT: NGINX serves from /opt/claudyne/ NOT /var/www/claudyne/public/

### 1. Use Automated Deployment Script (RECOMMENDED)
```bash
# Deploy everything (frontend + backend)
./deploy.sh all

# Deploy only frontend
./deploy.sh frontend

# Deploy only backend
./deploy.sh backend
```

### 2. Manual Deployment (if needed)
```bash
# CRITICAL: Always deploy to /opt/claudyne/ (NGINX root directory)
# Frontend files
scp index.html root@89.117.58.53:/opt/claudyne/
scp student-interface-modern.html root@89.117.58.53:/opt/claudyne/
scp admin-interface.html root@89.117.58.53:/opt/claudyne/
scp parent-interface.html root@89.117.58.53:/opt/claudyne/
scp sw.js root@89.117.58.53:/opt/claudyne/
scp clear-cache.html root@89.117.58.53:/opt/claudyne/

# Backend files (if changed)
scp -r backend/src/routes/* root@89.117.58.53:/opt/claudyne/backend/src/routes/
scp -r backend/src/models/* root@89.117.58.53:/opt/claudyne/backend/src/models/
```

### 2. Restart Backend
```bash
ssh root@89.117.58.53 "pm2 restart claudyne-backend --update-env && pm2 save"
sleep 5  # Wait for restart
```

### 3. Health Check
```bash
# Test backend directly
ssh root@89.117.58.53 'curl -s http://127.0.0.1:3001/health | jq .status'
# Should return: "healthy"

# Test via domain
ssh root@89.117.58.53 'curl -s https://www.claudyne.com/api/health | jq .status'
# Should return: "healthy"
```

### 4. Test CORS
```bash
ssh root@89.117.58.53 'curl -I -X OPTIONS http://127.0.0.1:3001/api/auth/register \
  -H "Origin: https://www.claudyne.com" \
  -H "Access-Control-Request-Method: POST" | grep "Access-Control-Allow-Origin"'
# Should return: Access-Control-Allow-Origin: https://www.claudyne.com
```

### 5. Test Registration Endpoint
```bash
ssh root@89.117.58.53 'curl -s -w "\nHTTP:%{http_code}\n" \
  -X POST https://www.claudyne.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"firstName\":\"Test\",\"lastName\":\"User\",\"email\":\"test-$(date +%s)@example.com\",\"phone\":\"+237612345678\",\"dialCode\":\"+237\",\"password\":\"Abcdef12\",\"acceptTerms\":true,\"accountType\":\"PARENT\",\"familyName\":\"Test\"}" \
  | tail -2'
# Should return: HTTP:201 or HTTP:200
```

## Post-Deployment Browser Testing

### Clear Browser (CRITICAL)
1. Open DevTools (F12)
2. Application → Service Workers → Click "Unregister"
3. Application → Storage → Check ALL boxes → "Clear site data"
4. **Close browser completely** (not just tab)
5. Reopen browser

### Verify Service Worker
1. Open https://www.claudyne.com
2. Check console: `🚀 Service Worker Claudyne initialisé - Version claudyne-vX.X.X`
3. Verify version matches deployed version

### Test Registration
1. Fill registration form
2. Submit
3. Check console for NO errors:
   - ❌ "phone is not defined"
   - ❌ "Not allowed by CORS"
   - ❌ "503 Service Unavailable"

## Common Issues Quick Reference

| Issue | Quick Check | Quick Fix |
|-------|-------------|-----------|
| **"phone is not defined"** | `grep "phone:" index.html` | Use `phoneE164` instead of `phone` |
| **503 Service Unavailable** | `pm2 status claudyne-backend` | `pm2 restart claudyne-backend` |
| **Not allowed by CORS** | `grep CORS_ORIGIN .env.production` | Add `https://www.claudyne.com` to CORS_ORIGIN |
| **Backend not responding** | `lsof -i :3001` | Kill rogue process, restart PM2 |
| **Old cached version** | Check service worker version | User: Unregister SW, clear storage |

## Monitoring (Set Up Once)

```bash
# Add to crontab for automatic health checks
ssh root@89.117.58.53 'crontab -e'

# Add this line (runs every 5 minutes):
*/5 * * * * curl -sf http://127.0.0.1:3001/health > /dev/null || echo "Backend down at $(date)" >> /var/log/claudyne-health.log
```

## Success Criteria ✅

- [ ] PM2 shows "online" with 0-2 restarts
- [ ] `/health` returns `{"status":"healthy"}`
- [ ] CORS preflight returns proper headers
- [ ] Registration returns 201/200
- [ ] Browser shows correct SW version
- [ ] Registration form works without errors

---

**Golden Rule:** Test locally → Deploy → Verify health → Test in browser
