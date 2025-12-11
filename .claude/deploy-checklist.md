# CRITICAL: Deployment Location Reference

## ⚠️ NGINX Configuration

**NGINX serves static files from:** `/opt/claudyne/`

**NOT from:** `/var/www/claudyne/public/`

## ✅ Correct Deployment Paths

### Frontend Files
All HTML, CSS, JS files must go to: `/opt/claudyne/`

```bash
/opt/claudyne/
├── index.html
├── student-interface-modern.html
├── admin-interface.html
├── parent-interface.html
├── lessons.html
├── sw.js
└── clear-cache.html
```

### Backend Files
Backend source code goes to: `/opt/claudyne/backend/src/`

```bash
/opt/claudyne/backend/src/
├── routes/
│   ├── students.js
│   ├── quiz.js
│   ├── mentor.js
│   └── ...
├── models/
└── utils/
```

## 🚨 Common Mistakes to Avoid

❌ **WRONG:** `scp file.html root@89.117.58.53:/var/www/claudyne/public/`

✅ **CORRECT:** `scp file.html root@89.117.58.53:/opt/claudyne/`

## 🔧 Quick Reference Commands

### Verify NGINX root directory
```bash
ssh root@89.117.58.53 "cat /etc/nginx/sites-enabled/claudyne | grep 'root '"
# Should show: root /opt/claudyne;
```

### Check file timestamps after deployment
```bash
ssh root@89.117.58.53 "ls -lh /opt/claudyne/*.html /opt/claudyne/sw.js"
```

### Verify what NGINX is serving
```bash
curl -s https://www.claudyne.com/sw.js | grep "CACHE_NAME"
```

## 📋 Pre-Deployment Checklist

- [ ] Bump service worker version in `sw.js`
- [ ] Test locally first
- [ ] Use `./deploy.sh all` for deployment
- [ ] Verify files deployed to `/opt/claudyne/`
- [ ] Check PM2 status after backend deployment
- [ ] Test health endpoint: `curl https://www.claudyne.com/api/health`
- [ ] Share cache clear page with users: `https://www.claudyne.com/clear-cache.html`

## 🎯 Post-Deployment Verification

```bash
# 1. Check file was deployed
ssh root@89.117.58.53 "ls -lh /opt/claudyne/student-interface-modern.html"

# 2. Verify NGINX is serving the new version
curl -I https://www.claudyne.com/student-interface-modern.html | grep "Last-Modified"

# 3. Check service worker version
curl -s https://www.claudyne.com/sw.js | grep "CACHE_NAME"

# 4. Backend health check
curl -s https://www.claudyne.com/api/health | jq .
```
