/**
 * Service Worker pour Claudyne
 * Optimisation pour connexions 2G/3G et mode offline
 * Spécialement adapté pour le marché camerounais
 */

const CACHE_NAME = 'claudyne-v1.2.0';
const OFFLINE_URL = '/offline.html';

// Ressources critiques à mettre en cache
const CRITICAL_RESOURCES = [
    '/',
    '/index.html',
    '/admin-interface.html',
    '/student-interface-modern.html',
    '/styles/glassmorphism.css',
    '/styles/mobile-optimization.css',
    '/js/network-optimization.js',
    '/offline.html'
];

// Ressources secondaires (chargées en mode progressive)
const SECONDARY_RESOURCES = [
    '/student-interface.html',
    '/claudyne-demo.html'
];

// Installation du Service Worker
self.addEventListener('install', event => {
    console.log('🔧 Installation du Service Worker Claudyne');
    
    event.waitUntil(
        Promise.all([
            // Cache des ressources critiques
            caches.open(CACHE_NAME).then(cache => {
                console.log('📦 Mise en cache des ressources critiques');
                return cache.addAll(CRITICAL_RESOURCES.map(url => new Request(url, {cache: 'reload'})));
            }),
            // Prise de contrôle immédiate
            self.skipWaiting()
        ])
    );
});

// Activation du Service Worker
self.addEventListener('activate', event => {
    console.log('✅ Activation du Service Worker Claudyne');
    
    event.waitUntil(
        Promise.all([
            // Nettoyage des anciens caches
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(cacheName => cacheName !== CACHE_NAME)
                        .map(cacheName => {
                            console.log('🗑️ Suppression cache obsolète:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            }),
            // Prise de contrôle de toutes les pages
            self.clients.claim()
        ])
    );
});

// Stratégies de cache intelligentes selon le type de connexion
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);

    // Ignore les requêtes non-HTTP
    if (!request.url.startsWith('http')) {
        return;
    }

    // Stratégie différente selon le type de ressource
    if (url.pathname.endsWith('.html')) {
        event.respondWith(handlePageRequest(request));
    } else if (url.pathname.includes('/api/')) {
        event.respondWith(handleAPIRequest(request));
    } else if (isStaticResource(url.pathname)) {
        event.respondWith(handleStaticResource(request));
    } else {
        event.respondWith(handleOtherRequests(request));
    }
});

// Gestion des pages HTML - Cache First avec fallback
async function handlePageRequest(request) {
    try {
        // Tentative de récupération depuis le cache
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            console.log('📖 Page servie depuis le cache:', request.url);
            
            // Mise à jour en arrière-plan si en ligne
            if (navigator.onLine) {
                fetch(request).then(response => {
                    if (response.ok) {
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(request, response.clone());
                        });
                    }
                }).catch(() => {
                    // Ignore les erreurs de mise à jour en arrière-plan
                });
            }
            
            return cachedResponse;
        }

        // Si pas en cache et en ligne, récupérer et cacher
        if (navigator.onLine) {
            const networkResponse = await fetch(request);
            
            if (networkResponse.ok) {
                const cache = await caches.open(CACHE_NAME);
                cache.put(request, networkResponse.clone());
                console.log('🌐 Page récupérée et mise en cache:', request.url);
                return networkResponse;
            }
        }

        // Fallback vers la page offline
        console.log('📴 Redirection vers page offline');
        return caches.match(OFFLINE_URL);
        
    } catch (error) {
        console.error('❌ Erreur lors du chargement de page:', error);
        return caches.match(OFFLINE_URL);
    }
}

// Gestion des appels API - Network First avec timeout court
async function handleAPIRequest(request) {
    try {
        // Timeout court pour les API (3 secondes)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const networkResponse = await fetch(request, {
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (networkResponse.ok) {
            // Cache les réponses API GET non sensibles
            if (request.method === 'GET' && !request.url.includes('auth')) {
                const cache = await caches.open(CACHE_NAME);
                cache.put(request, networkResponse.clone());
            }
            return networkResponse;
        }

        // Fallback vers cache pour les GET
        if (request.method === 'GET') {
            const cachedResponse = await caches.match(request);
            if (cachedResponse) {
                console.log('📡 API réponse depuis cache:', request.url);
                return cachedResponse;
            }
        }

        return new Response(
            JSON.stringify({ 
                error: 'Service temporarily unavailable',
                message: 'Connexion lente détectée, veuillez réessayer'
            }), 
            { 
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            }
        );

    } catch (error) {
        console.log('📡 API request failed, trying cache:', request.url);
        
        // Tentative de récupération depuis le cache
        if (request.method === 'GET') {
            const cachedResponse = await caches.match(request);
            if (cachedResponse) {
                return cachedResponse;
            }
        }

        return new Response(
            JSON.stringify({ 
                error: 'Network error',
                message: 'Veuillez vérifier votre connexion internet'
            }), 
            { 
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

// Gestion des ressources statiques - Cache First
async function handleStaticResource(request) {
    try {
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }

        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;

    } catch (error) {
        console.error('❌ Erreur ressource statique:', error);
        
        // Retour d'une réponse minimale pour CSS/JS manquant
        if (request.url.endsWith('.css')) {
            return new Response('/* Ressource CSS non disponible */', {
                headers: { 'Content-Type': 'text/css' }
            });
        }
        
        if (request.url.endsWith('.js')) {
            return new Response('// Ressource JS non disponible', {
                headers: { 'Content-Type': 'application/javascript' }
            });
        }

        throw error;
    }
}

// Gestion des autres requêtes
async function handleOtherRequests(request) {
    try {
        // Timeout normal pour les autres ressources (10 secondes)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(request, {
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        return response;

    } catch (error) {
        console.log('🌐 Autres requêtes échouées:', request.url);
        
        // Tentative cache en dernier recours
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        throw error;
    }
}

// Utilitaire pour identifier les ressources statiques
function isStaticResource(pathname) {
    const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2'];
    return staticExtensions.some(ext => pathname.endsWith(ext));
}

// Messages vers l'application principale
self.addEventListener('message', event => {
    const { type, data } = event.data;

    switch (type) {
        case 'CACHE_SECONDARY':
            // Cache les ressources secondaires en arrière-plan
            cacheSecondaryResources();
            break;
            
        case 'CLEAR_CACHE':
            // Nettoyage du cache sur demande
            clearAllCaches();
            break;
            
        case 'GET_CACHE_SIZE':
            // Retourne la taille du cache
            getCacheSize().then(size => {
                event.ports[0].postMessage({ size });
            });
            break;
    }
});

// Cache progressif des ressources secondaires
async function cacheSecondaryResources() {
    console.log('📦 Cache progressif des ressources secondaires');
    
    const cache = await caches.open(CACHE_NAME);
    
    for (const url of SECONDARY_RESOURCES) {
        try {
            await cache.add(url);
            console.log('✅ Ressource secondaire cachée:', url);
        } catch (error) {
            console.warn('⚠️ Impossible de cacher:', url, error);
        }
    }
}

// Nettoyage complet du cache
async function clearAllCaches() {
    const cacheNames = await caches.keys();
    
    await Promise.all(
        cacheNames.map(cacheName => {
            console.log('🗑️ Suppression cache:', cacheName);
            return caches.delete(cacheName);
        })
    );
    
    console.log('🧹 Tous les caches ont été supprimés');
}

// Calcul de la taille du cache
async function getCacheSize() {
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();
    
    let totalSize = 0;
    
    for (const request of requests) {
        try {
            const response = await cache.match(request);
            if (response) {
                const blob = await response.blob();
                totalSize += blob.size;
            }
        } catch (error) {
            console.warn('⚠️ Erreur calcul taille:', error);
        }
    }
    
    return {
        bytes: totalSize,
        mb: (totalSize / 1024 / 1024).toFixed(2),
        items: requests.length
    };
}

// Gestion des erreurs globales
self.addEventListener('error', event => {
    console.error('❌ Erreur Service Worker:', event.error);
});

self.addEventListener('unhandledrejection', event => {
    console.error('❌ Promise rejetée dans Service Worker:', event.reason);
});

console.log('🚀 Service Worker Claudyne initialisé - Version', CACHE_NAME);