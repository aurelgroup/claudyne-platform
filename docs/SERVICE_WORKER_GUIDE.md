# Service Worker Best Practices for Claudyne

## What Happened & Why

### The Problem
Service workers are powerful but can cause issues if not configured correctly:

1. **API Interception** - Service worker was intercepting ALL `/api/` requests
2. **Short Timeouts** - Had a 3-second timeout on ALL API calls
3. **503 Errors** - Registration takes longer than 3 seconds, causing timeouts
4. **Cache Issues** - Old service workers stayed active even after updates

### The Solution
- **Don't intercept API calls** - Let them go directly to the server
- **Bump version** on every change to force cache invalidation
- **Clear instructions** for users to unregister old service workers

## Service Worker Rules

### Rule #1: Don't Intercept API Calls
API calls should go directly to the backend without service worker interference.

**❌ BAD:**
```javascript
if (url.pathname.includes('/api/')) {
    event.respondWith(handleAPIRequest(request));
}
```

**✅ GOOD:**
```javascript
if (url.pathname.includes('/api/')) {
    // Let API calls pass through without interception
    return;
}
```

**Why?** Service workers add complexity and timeout risks to time-sensitive operations like registration/authentication.

### Rule #2: Always Bump Version on Changes
Update `CACHE_NAME` every time you modify the service worker.

```javascript
// Before deployment
const CACHE_NAME = 'claudyne-v1.4.2';

// After changes
const CACHE_NAME = 'claudyne-v1.5.0';  // ← MUST increment
```

**Version Scheme:**
- **Major (1.x.x)**: Breaking changes, complete redesign
- **Minor (x.1.x)**: New features, significant changes
- **Patch (x.x.1)**: Bug fixes, small tweaks

### Rule #3: Cache Static Assets Only
Service workers should cache:
- ✅ HTML pages
- ✅ CSS files
- ✅ JavaScript files
- ✅ Images, fonts
- ❌ **NOT** API calls
- ❌ **NOT** Dynamic data

**Example:**
```javascript
const CRITICAL_RESOURCES = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/offline.html'
];
```

### Rule #4: Network First for Dynamic Content
For pages that change frequently, always fetch from network first.

```javascript
async function handlePageRequest(request) {
    try {
        // Try network first
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            return networkResponse;
        }
    } catch (error) {
        // Fallback to cache on network error
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
    }
}
```

### Rule #5: Handle Service Worker Updates
Always delete old caches when a new service worker activates.

```javascript
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter(cacheName => cacheName !== CACHE_NAME)
                    .map(cacheName => caches.delete(cacheName))
            );
        })
    );
});
```

## Deployment Workflow

### When You Change the Service Worker

1. **Update version:**
   ```javascript
   const CACHE_NAME = 'claudyne-v1.X.X';  // Increment
   ```

2. **Deploy files:**
   ```bash
   scp sw.js root@89.117.58.53:/opt/claudyne/
   scp sw.js root@89.117.58.53:/var/www/claudyne/public/
   ```

3. **Verify version on server:**
   ```bash
   ssh root@89.117.58.53 "grep CACHE_NAME /var/www/claudyne/public/sw.js"
   ```

4. **User instructions:**
   - Press F12 (DevTools)
   - Application → Service Workers
   - Click "Unregister"
   - Application → Storage → "Clear site data"
   - Close and reopen browser

## Testing Service Workers

### Test 1: Verify Version
```bash
# On server
grep "CACHE_NAME" /opt/claudyne/sw.js

# In browser console (after page load)
navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
        console.log('SW version:', registration.active?.scriptURL);
    });
});
```

### Test 2: Check API Passthrough
```javascript
// In sw.js, verify API calls return early
if (url.pathname.includes('/api/')) {
    return;  // ← Must be present!
}
```

### Test 3: Browser Console Check
After loading the page, console should show:
```
🚀 Service Worker Claudyne initialisé - Version claudyne-v1.5.0
```

## Common Issues & Solutions

### Issue: "Old service worker still active"
**Symptoms:** Browser shows old version number, changes not reflected

**Solution:**
```javascript
// User instructions:
1. Open DevTools (F12)
2. Application → Service Workers
3. Check "Update on reload"
4. Click "Unregister"
5. Hard reload: Ctrl+Shift+R
6. Close browser completely
7. Reopen
```

### Issue: "API calls failing with 503"
**Cause:** Service worker intercepting API calls

**Solution:** Remove API interception:
```javascript
if (url.pathname.includes('/api/')) {
    return;  // Don't intercept!
}
```

### Issue: "Service worker not updating"
**Cause:** Version not bumped or browser cache

**Solution:**
1. Bump `CACHE_NAME` version
2. Deploy new sw.js
3. Users must unregister old SW

### Issue: "CORS errors after SW update"
**Cause:** Service worker doesn't handle CORS correctly

**Solution:** Don't intercept API calls - let browser handle CORS

## Service Worker Debugging

### Chrome DevTools
1. **F12** → **Application** tab
2. **Service Workers** section shows:
   - Active service workers
   - Status (activated, waiting, installing)
   - Update button
   - Unregister button

3. **Console** shows service worker logs:
   ```
   🚀 Service Worker Claudyne initialisé
   📦 Cache progressif des ressources
   ✅ Ressource secondaire cachée: /parent-interface.html
   ```

### Firefox DevTools
1. **F12** → **Application** (or about:debugging#/runtime/this-firefox)
2. Shows all registered service workers
3. Can unregister and debug

### Safari DevTools
1. **Develop** → **Service Workers**
2. Shows registered workers
3. Can inspect and unregister

## Best Practices Summary

✅ **DO:**
- Bump version on every change
- Cache static assets (HTML, CSS, JS, images)
- Use Network First for dynamic content
- Delete old caches on activate
- Test after every deployment
- Provide clear unregister instructions to users

❌ **DON'T:**
- Intercept API calls
- Use short timeouts on critical operations
- Cache sensitive data (auth tokens)
- Forget to increment version
- Deploy without testing
- Cache API responses (unless intentional and well-tested)

## User Instructions Template

When you deploy a service worker update, send this to users:

```
📢 Claudyne Update Available!

We've released a new version with improvements. To get the latest:

1. Open Claude (F12 key)
2. Go to "Application" tab
3. Click "Service Workers" on the left
4. Click "Unregister" next to Claudyne
5. Go to "Storage" on the left
6. Click "Clear site data" button
7. Close your browser completely
8. Reopen and visit claudyne.com

You should see: "Version claudyne-v1.X.X" in the console.
```

## Monitoring

### Add This to Your Deployment Script
```bash
# Check SW version after deployment
SW_VERSION=$(ssh $SERVER "grep 'CACHE_NAME' /opt/claudyne/sw.js")
echo "Deployed Service Worker: $SW_VERSION"

# Verify it's deployed to public directory
SW_PUBLIC=$(ssh $SERVER "grep 'CACHE_NAME' /var/www/claudyne/public/sw.js")
echo "Public Service Worker: $SW_PUBLIC"

# They should match!
```

## Further Reading

- [MDN: Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Google: Service Worker Lifecycle](https://developers.google.com/web/fundamentals/primers/service-workers/lifecycle)
- [Jake Archibald: Service Worker Ready](https://jakearchibald.github.io/isserviceworkerready/)

---

**Remember:** Service workers are powerful but complex. When in doubt, keep it simple and let API calls pass through!
