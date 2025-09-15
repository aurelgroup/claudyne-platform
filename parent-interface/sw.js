/**
 * Claudyne Parent Interface - Service Worker
 * Service Worker optimisé pour réseaux 2G/3G africains
 */

const CACHE_VERSION = 'claudyne-v1.2.0';
const CACHE_STATIC = `${CACHE_VERSION}-static`;
const CACHE_DYNAMIC = `${CACHE_VERSION}-dynamic`;
const CACHE_API = `${CACHE_VERSION}-api`;

// Ressources critiques à mettre en cache immédiatement
const CRITICAL_RESOURCES = [
    '/parent-interface/',
    '/parent-interface/index.html',
    '/parent-interface/js/main.js',
    '/parent-interface/manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Ressources à précharger en arrière-plan
const PRELOAD_RESOURCES = [
    '/parent-interface/js/modules/dashboard.js',
    '/parent-interface/js/modules/children.js',
    '/parent-interface/js/shared/widget-system.js',
    '/parent-interface/js/shared/analytics.js',
    '/parent-interface/js/shared/utils.js',
    '/parent-interface/js/shared/navigation.js'
];

// Configuration réseau
const NETWORK_TIMEOUT = 3000; // 3 secondes pour réseaux lents
const CACHE_STRATEGIES = {
    critical: 'cache-first',
    static: 'cache-first',
    api: 'network-first',
    dynamic: 'stale-while-revalidate'
};

// Installation du Service Worker
self.addEventListener('install', event => {
    console.log('🔧 Installation du Service Worker Claudyne');

    event.waitUntil(
        caches.open(CACHE_STATIC).then(cache => {
            console.log('📦 Mise en cache des ressources critiques');
            return cache.addAll(CRITICAL_RESOURCES).catch(error => {
                console.error('❌ Erreur lors de la mise en cache:', error);
                // Ne pas faire échouer l'installation pour les ressources manquantes
                return Promise.resolve();
            });
        }).then(() => {
            console.log('✅ Installation du Service Worker terminée');
            return self.skipWaiting();
        }).catch(error => {
            console.error('❌ Erreur lors de l\'installation:', error);
        })
    );
});

// Activation du Service Worker
self.addEventListener('activate', event => {
    console.log('🚀 Activation du Service Worker Claudyne');

    event.waitUntil(
        Promise.all([
            // Nettoyer les anciens caches
            cleanupOldCaches(),
            // Précharger les ressources secondaires
            preloadResources(),
            // Prendre le contrôle immédiatement
            self.clients.claim()
        ]).then(() => {
            console.log('✅ Service Worker activé et prêt');
        })
    );
});

// Stratégies de cache pour les requêtes
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Ignorer les requêtes non-GET
    if (event.request.method !== 'GET') return;

    // Ignorer les requêtes vers des domaines externes (sauf CDN)
    if (!url.origin.includes('claudyne.com') && !url.origin.includes('cdnjs.cloudflare.com')) {
        return;
    }

    event.respondWith(handleRequest(event.request));
});

// Gestionnaire principal des requêtes
async function handleRequest(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    try {
        // API calls - Network first avec fallback
        if (pathname.startsWith('/api/')) {
            return await networkFirstStrategy(request, CACHE_API);
        }

        // Ressources critiques - Cache first
        if (CRITICAL_RESOURCES.some(resource => pathname.includes(resource))) {
            return await cacheFirstStrategy(request, CACHE_STATIC);
        }

        // Modules JS - Stale while revalidate
        if (pathname.includes('/js/') && pathname.endsWith('.js')) {
            return await staleWhileRevalidateStrategy(request, CACHE_STATIC);
        }

        // CSS et fonts - Cache first
        if (pathname.endsWith('.css') || pathname.includes('font')) {
            return await cacheFirstStrategy(request, CACHE_STATIC);
        }

        // Images - Cache first avec compression
        if (pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/)) {
            return await handleImageRequest(request);
        }

        // HTML pages - Network first
        if (pathname.endsWith('/') || pathname.endsWith('.html')) {
            return await networkFirstStrategy(request, CACHE_DYNAMIC);
        }

        // Autres ressources - Stale while revalidate
        return await staleWhileRevalidateStrategy(request, CACHE_DYNAMIC);

    } catch (error) {
        console.error('❌ Erreur lors du traitement de la requête:', error);
        return await handleOfflineFallback(request);
    }
}

// Stratégie Cache First
async function cacheFirstStrategy(request, cacheName) {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
        return cachedResponse;
    }

    try {
        const networkResponse = await fetchWithTimeout(request);

        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.warn('⚠️ Ressource non disponible hors ligne:', request.url);
        throw error;
    }
}

// Stratégie Network First
async function networkFirstStrategy(request, cacheName) {
    try {
        const networkResponse = await fetchWithTimeout(request);

        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
            console.log('📦 Utilisation du cache pour:', request.url);
            return cachedResponse;
        }

        throw error;
    }
}

// Stratégie Stale While Revalidate
async function staleWhileRevalidateStrategy(request, cacheName) {
    const cachedResponse = await caches.match(request);

    // Mise à jour en arrière-plan
    const networkResponsePromise = fetchWithTimeout(request).then(response => {
        if (response.ok) {
            const cache = caches.open(cacheName);
            cache.then(c => c.put(request, response.clone()));
        }
        return response;
    }).catch(error => {
        console.warn('⚠️ Mise à jour réseau échouée:', request.url);
    });

    // Retourner le cache immédiatement si disponible
    return cachedResponse || networkResponsePromise;
}

// Gestion spéciale des images avec compression
async function handleImageRequest(request) {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
        return cachedResponse;
    }

    try {
        // Essayer WebP si supporté
        if (supportsWebP() && !request.url.includes('.webp')) {
            const webpUrl = request.url.replace(/\.(jpg|jpeg|png)$/, '.webp');
            const webpRequest = new Request(webpUrl);

            try {
                const webpResponse = await fetchWithTimeout(webpRequest);
                if (webpResponse.ok) {
                    const cache = await caches.open(CACHE_STATIC);
                    cache.put(request, webpResponse.clone());
                    return webpResponse;
                }
            } catch (webpError) {
                // Fallback vers l'image originale
            }
        }

        const networkResponse = await fetchWithTimeout(request);

        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_STATIC);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        // Fallback vers une image placeholder si disponible
        const placeholderResponse = await caches.match('/images/placeholder.png');
        return placeholderResponse || Response.error();
    }
}

// Fallback hors ligne
async function handleOfflineFallback(request) {
    const url = new URL(request.url);

    // Page HTML - Retourner l'index en cache
    if (request.headers.get('accept')?.includes('text/html')) {
        const cachedIndex = await caches.match('/parent-interface/index.html');
        return cachedIndex || new Response(getOfflineHTML(), {
            headers: { 'Content-Type': 'text/html' }
        });
    }

    // API - Retourner des données mockées si disponibles
    if (url.pathname.startsWith('/api/')) {
        return new Response(JSON.stringify({
            error: 'Service temporairement indisponible',
            offline: true,
            timestamp: Date.now()
        }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Autres ressources
    return Response.error();
}

// Fetch avec timeout pour réseaux lents
async function fetchWithTimeout(request, timeout = NETWORK_TIMEOUT) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(request, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

// Nettoyage des anciens caches
async function cleanupOldCaches() {
    const cacheNames = await caches.keys();
    const oldCaches = cacheNames.filter(name =>
        name.startsWith('claudyne-') && !name.includes(CACHE_VERSION)
    );

    return Promise.all(
        oldCaches.map(name => caches.delete(name))
    );
}

// Préchargement des ressources
async function preloadResources() {
    try {
        const cache = await caches.open(CACHE_STATIC);

        // Précharger en arrière-plan sans bloquer
        PRELOAD_RESOURCES.forEach(async (resource) => {
            try {
                const response = await fetch(resource);
                if (response.ok) {
                    cache.put(resource, response);
                }
            } catch (error) {
                console.warn('⚠️ Préchargement échoué:', resource);
            }
        });
    } catch (error) {
        console.error('❌ Erreur lors du préchargement:', error);
    }
}

// Détection du support WebP
function supportsWebP() {
    const elem = document.createElement('canvas');
    return elem.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}

// HTML de fallback hors ligne
function getOfflineHTML() {
    return `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Claudyne - Hors ligne</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                       text-align: center; padding: 2rem; background: #fafbfc; }
                .offline-icon { font-size: 4rem; margin-bottom: 1rem; }
                h1 { color: #1e293b; margin-bottom: 1rem; }
                p { color: #64748b; margin-bottom: 2rem; }
                .retry-btn { background: #6366f1; color: white; border: none;
                            padding: 0.75rem 1.5rem; border-radius: 0.5rem;
                            font-size: 1rem; cursor: pointer; }
            </style>
        </head>
        <body>
            <div class="offline-icon">📱</div>
            <h1>Claudyne hors ligne</h1>
            <p>Vous êtes actuellement hors ligne. Certaines fonctionnalités peuvent être limitées.</p>
            <button class="retry-btn" onclick="window.location.reload()">
                Réessayer
            </button>
        </body>
        </html>
    `;
}

// Gestion des messages
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Notification de mise à jour
self.addEventListener('waiting', event => {
    console.log('🔄 Nouvelle version disponible');

    self.registration.getNotifications().then(notifications => {
        if (notifications.length === 0) {
            self.registration.showNotification('Claudyne', {
                body: 'Une nouvelle version est disponible',
                icon: '/images/icons/icon-192x192.png',
                badge: '/images/icons/icon-72x72.png',
                tag: 'update-available',
                requireInteraction: true,
                actions: [
                    { action: 'update', title: 'Mettre à jour' },
                    { action: 'dismiss', title: 'Plus tard' }
                ]
            });
        }
    });
});

// Gestion des clics sur notifications
self.addEventListener('notificationclick', event => {
    event.notification.close();

    if (event.action === 'update') {
        self.skipWaiting();
    }

    event.waitUntil(
        clients.openWindow('/parent-interface/')
    );
});

// Synchronisation en arrière-plan
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    console.log('🔄 Synchronisation en arrière-plan');

    try {
        // Synchroniser les données en attente
        const pendingData = await getStoredData('pendingSync');
        if (pendingData && pendingData.length > 0) {
            for (const item of pendingData) {
                await syncItem(item);
            }
            await clearStoredData('pendingSync');
        }
    } catch (error) {
        console.error('❌ Erreur lors de la synchronisation:', error);
    }
}

// Utilitaires de stockage
async function getStoredData(key) {
    return new Promise((resolve) => {
        const request = indexedDB.open('claudyne-sw', 1);
        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['data'], 'readonly');
            const store = transaction.objectStore('data');
            const getRequest = store.get(key);
            getRequest.onsuccess = () => resolve(getRequest.result?.value);
        };
        request.onerror = () => resolve(null);
    });
}

async function clearStoredData(key) {
    return new Promise((resolve) => {
        const request = indexedDB.open('claudyne-sw', 1);
        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['data'], 'readwrite');
            const store = transaction.objectStore('data');
            store.delete(key);
            transaction.oncomplete = () => resolve();
        };
        request.onerror = () => resolve();
    });
}

async function syncItem(item) {
    try {
        await fetch(item.url, {
            method: item.method,
            headers: item.headers,
            body: item.body
        });
        console.log('✅ Élément synchronisé:', item.url);
    } catch (error) {
        console.error('❌ Échec de synchronisation:', error);
    }
}

// Gestion des erreurs globales
self.addEventListener('error', event => {
    console.error('❌ Erreur dans le Service Worker:', event.error);
});

self.addEventListener('unhandledrejection', event => {
    console.error('❌ Promise rejetée dans Service Worker:', event.reason);
});

console.log('🚀 Service Worker Claudyne initialisé - Version', CACHE_VERSION);