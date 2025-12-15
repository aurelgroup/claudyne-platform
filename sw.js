/**
 * Service Worker pour Claudyne
 * Optimisation pour connexions 2G/3G et mode offline
 * Spécialement adapté pour le marché camerounais
 */

const CACHE_NAME = 'claudyne-v1.6.1';
const OFFLINE_URL = '/offline.html';

// Ressources critiques à mettre en cache
const CRITICAL_RESOURCES = [
    '/',
    '/index.html',
    '/admin-interface.html',
    '/admin-secure-k7m9x4n2p8w5z1c6',
    '/student-interface-modern.html'
];

// Ressources secondaires (chargées en mode progressive)
const SECONDARY_RESOURCES = [
    '/parent-interface/index.html',
    '/moderator-interface.html'
];

// Installation du Service Worker
self.addEventListener('install', event => {
    console.log('🔧 Installation du Service Worker Claudyne');

    event.waitUntil(
        Promise.all([
            // Cache des ressources critiques avec gestion d'erreur
            cacheResourcesSafely(CRITICAL_RESOURCES),
            // Prise de contrôle immédiate
            self.skipWaiting()
        ])
    );
});

// Cache les ressources de manière sécurisée (ne plante pas si une ressource n'existe pas)
async function cacheResourcesSafely(resources) {
    const cache = await caches.open(CACHE_NAME);
    console.log('📦 Mise en cache sécurisée des ressources critiques');

    const cachePromises = resources.map(async (url) => {
        try {
            const request = new Request(url, {cache: 'reload'});
            const response = await fetch(request);

            if (response.ok) {
                await cache.put(request, response);
                console.log('✅ Ressource cachée:', url);
            } else {
                console.warn('⚠️ Ressource non trouvée (ignorée):', url, response.status);
            }
        } catch (error) {
            console.warn('⚠️ Impossible de cacher (ignoré):', url, error.message);
        }
    });

    await Promise.allSettled(cachePromises);
    console.log('📦 Cache initial terminé');
}

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
    if (url.pathname.endsWith('.html') || url.pathname === '/admin-secure-k7m9x4n2p8w5z1c6') {
        event.respondWith(handlePageRequest(request));
    } else if (url.pathname.includes('/api/')) {
        // NE PAS INTERCEPTER les appels API - laisser le navigateur les gérer directement
        // Ceci évite les timeouts et problèmes de cache avec les requêtes POST/PUT/PATCH
        return;
    } else if (isStaticResource(url.pathname)) {
        event.respondWith(handleStaticResource(request));
    } else {
        event.respondWith(handleOtherRequests(request));
    }
});

// Gestion des pages HTML - Cache First avec fallback
async function handlePageRequest(request) {
    try {
        const url = new URL(request.url);

        // Si c'est le chemin admin sécurisé, servir admin-interface.html TOUJOURS FRAIS
        if (url.pathname === '/admin-secure-k7m9x4n2p8w5z1c6') {
            console.log('🔐 Requête admin sécurisée - NETWORK FIRST');
            const adminRequest = new Request('/admin-interface.html', {
                method: request.method,
                headers: request.headers,
                cache: 'no-cache' // Force la récupération réseau
            });

            // NETWORK FIRST pour l'admin - toujours la version fraîche
            try {
                const networkResponse = await fetch(adminRequest);
                if (networkResponse.ok) {
                    console.log('📡 Admin interface servie depuis le réseau (fraîche)');
                    return networkResponse;
                }
            } catch (error) {
                console.log('⚠️ Réseau indisponible, fallback vers cache');
            }

            // Fallback vers le cache seulement si le réseau échoue
            const cachedResponse = await caches.match(adminRequest);
            if (cachedResponse) {
                console.log('📖 Admin interface servie depuis le cache (fallback)');
                return cachedResponse;
            }

            // Sinon récupérer depuis le réseau
            if (navigator.onLine) {
                try {
                    const networkResponse = await fetch(adminRequest);
                    if (networkResponse.ok) {
                        const cache = await caches.open(CACHE_NAME);
                        cache.put(adminRequest, networkResponse.clone());
                        console.log('🌐 Admin interface récupérée et mise en cache');
                        return networkResponse;
                    }
                } catch (error) {
                    console.warn('⚠️ Impossible de récupérer admin-interface.html depuis le réseau');
                }
            }
        }

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

// Gestion des appels API - Network First avec timeout adapté
async function handleAPIRequest(request) {
    try {
        // Timeout adapté selon la méthode: POST/PUT/PATCH = 15s, GET = 3s
        const timeout = ['POST', 'PUT', 'PATCH'].includes(request.method) ? 15000 : 3000;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

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
            const request = new Request(url);
            const response = await fetch(request);

            if (response.ok) {
                await cache.put(request, response);
                console.log('✅ Ressource secondaire cachée:', url);
            } else {
                console.warn('⚠️ Ressource secondaire non trouvée (ignorée):', url, response.status);
            }
        } catch (error) {
            console.warn('⚠️ Impossible de cacher ressource secondaire:', url, error.message);
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