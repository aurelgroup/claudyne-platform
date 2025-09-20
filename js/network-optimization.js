/**
 * Système d'optimisation réseau pour connexions 2G/3G
 * Adapté pour le marché camerounais
 */

class NetworkOptimizer {
    constructor() {
        this.connectionType = 'unknown';
        this.isSlowConnection = false;
        this.isOffline = false;
        this.performanceMode = false;
        
        this.init();
    }

    init() {
        this.detectConnectionType();
        this.setupNetworkListeners();
        this.measureConnectionSpeed();
        this.applyOptimizations();
        
        // Vérification périodique de la connexion
        setInterval(() => {
            this.measureConnectionSpeed();
        }, 30000); // Toutes les 30 secondes
    }

    detectConnectionType() {
        // API Navigator Connection (supportée sur la plupart des navigateurs mobiles)
        if ('connection' in navigator) {
            const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            
            if (connection) {
                this.connectionType = connection.effectiveType || connection.type;
                
                // Détection des connexions lentes
                const slowTypes = ['slow-2g', '2g', '3g'];
                this.isSlowConnection = slowTypes.includes(this.connectionType);
                
                console.log(`🌐 Type de connexion détecté: ${this.connectionType}`);
                console.log(`🐌 Connexion lente: ${this.isSlowConnection}`);
            }
        }

        // Détection offline
        this.isOffline = !navigator.onLine;
    }

    setupNetworkListeners() {
        // Écoute des changements de connexion
        window.addEventListener('online', () => {
            this.isOffline = false;
            this.showConnectionStatus('Connexion rétablie', 'online');
            this.applyOptimizations();
        });

        window.addEventListener('offline', () => {
            this.isOffline = true;
            this.showConnectionStatus('Connexion perdue', 'offline');
            this.enableOfflineMode();
        });

        // Écoute des changements de type de connexion
        if ('connection' in navigator) {
            const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            if (connection) {
                connection.addEventListener('change', () => {
                    this.detectConnectionType();
                    this.applyOptimizations();
                });
            }
        }
    }

    measureConnectionSpeed() {
        if (this.isOffline) return;

        const startTime = Date.now();
        const testImage = new Image();
        
        testImage.onload = () => {
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            // Si le téléchargement prend plus de 3 secondes pour 1KB, c'est lent
            if (duration > 3000) {
                this.isSlowConnection = true;
                this.showConnectionStatus('Connexion lente détectée', 'slow');
            } else {
                this.isSlowConnection = false;
            }
            
            this.applyOptimizations();
        };
        
        testImage.onerror = () => {
            this.isSlowConnection = true;
            this.applyOptimizations();
        };
        
        // Image de test valide (GIF transparent 1x1)
        testImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
    }

    applyOptimizations() {
        const body = document.body;
        
        // Suppression des classes d'optimisation existantes
        body.classList.remove('slow-connection', 'offline-mode', 'performance-mode');
        
        if (this.isOffline) {
            this.enableOfflineMode();
        } else if (this.isSlowConnection || ['slow-2g', '2g', '3g'].includes(this.connectionType)) {
            this.enableSlowConnectionMode();
        } else {
            this.enableNormalMode();
        }
    }

    enableOfflineMode() {
        document.body.classList.add('offline-mode');
        this.disableHeavyFeatures();
        this.showConnectionStatus('Mode hors ligne', 'offline');
        console.log('🔴 Mode hors ligne activé');
    }

    enableSlowConnectionMode() {
        document.body.classList.add('slow-connection');
        this.enablePerformanceOptimizations();
        this.showConnectionStatus('Mode économique', 'slow');
        console.log('🟡 Mode connexion lente activé');
    }

    enableNormalMode() {
        // Réactivation progressive des fonctionnalités
        this.enableProgressiveLoading();
        console.log('🟢 Mode normal activé');
    }

    enablePerformanceOptimizations() {
        // Désactivation des animations coûteuses
        const style = document.createElement('style');
        style.id = 'performance-optimizations';
        style.textContent = `
            .slow-connection * {
                animation-duration: 0.1s !important;
                transition-duration: 0.1s !important;
            }
            .slow-connection .glass-effect {
                backdrop-filter: none !important;
                background: rgba(30, 30, 30, 0.95) !important;
            }
        `;
        
        // Suppression de l'ancien style s'il existe
        const existingStyle = document.getElementById('performance-optimizations');
        if (existingStyle) {
            existingStyle.remove();
        }
        
        document.head.appendChild(style);

        // Réduction de la fréquence des mises à jour
        this.reduceupdateFrequency();
        
        // Préchargement intelligent désactivé
        this.disablePreloading();
    }

    disableHeavyFeatures() {
        // Désactivation des fonctionnalités lourdes
        const heavyElements = document.querySelectorAll('.heavy-feature, .animation-intensive, .gpu-intensive');
        heavyElements.forEach(element => {
            element.style.display = 'none';
        });

        // Images en mode économique
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            if (!img.dataset.critical) {
                img.style.display = 'none';
            }
        });
    }

    enableProgressiveLoading() {
        document.body.classList.add('progressive-loading');
        
        // Chargement progressif des éléments non critiques
        const deferredElements = document.querySelectorAll('.preload-deferred');
        
        deferredElements.forEach((element, index) => {
            setTimeout(() => {
                element.classList.add('loaded');
            }, index * 200); // Décalage de 200ms entre chaque élément
        });
    }

    reduceupdateFrequency() {
        // Réduction de la fréquence des mises à jour automatiques
        const autoUpdateElements = document.querySelectorAll('[data-auto-update]');
        autoUpdateElements.forEach(element => {
            const currentInterval = element.dataset.autoUpdate || 5000;
            element.dataset.autoUpdate = Math.max(currentInterval * 3, 15000); // Au minimum 15 secondes
        });
    }

    disablePreloading() {
        // Désactivation du préchargement des ressources non critiques
        const preloadLinks = document.querySelectorAll('link[rel="preload"]:not([data-critical])');
        preloadLinks.forEach(link => {
            link.remove();
        });
    }

    showConnectionStatus(message, type) {
        // Suppression du statut existant
        const existingStatus = document.querySelector('.connection-status');
        if (existingStatus) {
            existingStatus.remove();
        }

        // Création du nouvel indicateur de statut
        const statusDiv = document.createElement('div');
        statusDiv.className = `connection-status connection-${type}`;
        statusDiv.textContent = message;
        
        // Icônes selon le type de connexion
        const icons = {
            'online': '🟢',
            'slow': '🟡', 
            'offline': '🔴'
        };
        
        statusDiv.textContent = `${icons[type] || '⚪'} ${message}`;
        
        document.body.appendChild(statusDiv);

        // Auto-suppression après 5 secondes (sauf si offline)
        if (type !== 'offline') {
            setTimeout(() => {
                statusDiv.remove();
            }, 5000);
        }
    }

    // Méthodes utilitaires pour les développeurs
    getConnectionInfo() {
        return {
            type: this.connectionType,
            isSlowConnection: this.isSlowConnection,
            isOffline: this.isOffline,
            performanceMode: this.performanceMode
        };
    }

    forcePerformanceMode(enabled = true) {
        this.performanceMode = enabled;
        if (enabled) {
            this.enableSlowConnectionMode();
        } else {
            this.enableNormalMode();
        }
    }
}

// Compression des images à la volée pour connexions lentes
class ImageOptimizer {
    static optimizeImage(img) {
        if (!img.src || img.dataset.optimized === 'true') return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        img.onload = function() {
            // Réduction de la qualité pour connexions lentes
            const networkOptimizer = window.claudyneNetworkOptimizer;
            let quality = 0.8;
            
            if (networkOptimizer && networkOptimizer.isSlowConnection) {
                quality = 0.4; // Qualité réduite pour connexions lentes
            }
            
            canvas.width = this.naturalWidth;
            canvas.height = this.naturalHeight;
            
            ctx.drawImage(this, 0, 0);
            
            try {
                const optimizedDataUrl = canvas.toDataURL('image/jpeg', quality);
                if (optimizedDataUrl.length < img.src.length) {
                    img.src = optimizedDataUrl;
                    img.dataset.optimized = 'true';
                }
            } catch (e) {
                console.warn('Erreur lors de l\'optimisation de l\'image:', e);
            }
        };
    }
}

// Cache intelligent pour les données
class SmartCache {
    constructor() {
        this.cache = new Map();
        this.maxSize = 50; // Taille maximum du cache
        this.ttl = 10 * 60 * 1000; // 10 minutes TTL par défaut
    }

    set(key, value, customTTL = null) {
        const ttl = customTTL || this.ttl;
        const expiry = Date.now() + ttl;
        
        this.cache.set(key, {
            value,
            expiry
        });

        // Nettoyage si le cache devient trop grand
        if (this.cache.size > this.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }
    }

    get(key) {
        const cached = this.cache.get(key);
        
        if (!cached) return null;
        
        if (Date.now() > cached.expiry) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.value;
    }

    clear() {
        this.cache.clear();
    }
}

// Initialisation automatique
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initialisation de l\'optimiseur réseau Claudyne...');
    
    // Instance globale de l'optimiseur
    window.claudyneNetworkOptimizer = new NetworkOptimizer();
    window.claudyneImageOptimizer = ImageOptimizer;
    window.claudyneSmartCache = new SmartCache();
    
    // Application des optimisations aux images existantes
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        if (window.claudyneNetworkOptimizer.isSlowConnection) {
            ImageOptimizer.optimizeImage(img);
        }
    });
    
    // Optimisation des nouvelles images ajoutées dynamiquement
    const imageObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const images = node.tagName === 'IMG' ? [node] : node.querySelectorAll('img');
                    images.forEach(img => {
                        if (window.claudyneNetworkOptimizer.isSlowConnection) {
                            ImageOptimizer.optimizeImage(img);
                        }
                    });
                }
            });
        });
    });
    
    imageObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    console.log('✅ Optimiseur réseau Claudyne initialisé avec succès');
});

// Export pour utilisation en module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NetworkOptimizer, ImageOptimizer, SmartCache };
}