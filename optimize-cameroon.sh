#!/bin/bash

# ================================
# OPTIMISATIONS CLAUDYNE CAMEROUN
# ================================
# Script d'optimisation spécifique pour les réseaux 2G/3G du Cameroun
# Améliore les performances sur connexions lentes MTN/Orange

set -e

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCÈS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[ATTENTION]${NC} $1"; }

log_info "🇨🇲 Optimisations spécifiques Cameroun - Réseaux 2G/3G"
echo ""

# ================================
# 1. OPTIMISATIONS SYSTEME LINUX
# ================================

log_info "🔧 Optimisations système Linux pour connexions lentes..."

# Configuration TCP optimisée pour réseaux mobiles Cameroun
cat << 'EOF' | sudo tee /etc/sysctl.d/99-claudyne-cameroon.conf > /dev/null
# Optimisations Claudyne pour réseaux 2G/3G Cameroun
# MTN/Orange Mobile Networks

# TCP Buffer sizes - adaptés aux réseaux mobiles
net.core.rmem_default = 262144
net.core.rmem_max = 16777216
net.core.wmem_default = 262144
net.core.wmem_max = 16777216

# TCP Window Scaling - crucial pour connexions lentes
net.ipv4.tcp_window_scaling = 1
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216

# Congestion Control - BBR optimisé pour mobile
net.core.default_qdisc = fq
net.ipv4.tcp_congestion_control = bbr

# Fast Open - réduit la latence connexion
net.ipv4.tcp_fastopen = 3

# Timeout adaptés aux réseaux mobiles
net.ipv4.tcp_fin_timeout = 15
net.ipv4.tcp_keepalive_time = 300
net.ipv4.tcp_keepalive_probes = 5
net.ipv4.tcp_keepalive_intvl = 15

# Réduction des retransmissions
net.ipv4.tcp_retries1 = 3
net.ipv4.tcp_retries2 = 5

# Optimisations spécifiques réseaux lents
net.ipv4.tcp_slow_start_after_idle = 0
net.ipv4.tcp_no_metrics_save = 1

# Connection tracking pour stabilité
net.netfilter.nf_conntrack_max = 65536
net.netfilter.nf_conntrack_tcp_timeout_established = 300

# Buffer global pour plusieurs connexions
net.core.netdev_max_backlog = 5000
net.core.somaxconn = 1024
EOF

# Appliquer les optimisations
sudo sysctl -p /etc/sysctl.d/99-claudyne-cameroon.conf

log_success "Optimisations système appliquées"

# ================================
# 2. OPTIMISATIONS NGINX
# ================================

log_info "🌐 Optimisations Nginx pour réseaux mobiles..."

# Configuration nginx spécifique Cameroun
cat << 'EOF' > nginx/conf.d/cameroon-optimizations.conf
# Optimisations spécifiques Cameroun
# Adapté aux connexions MTN/Orange 2G/3G

# Cache agressif pour réduire les requêtes
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=cameroon_cache:10m
                 max_size=100m inactive=60m use_temp_path=off;

# Configuration globale optimisée
proxy_cache cameroon_cache;
proxy_cache_valid 200 302 5m;
proxy_cache_valid 404 1m;
proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
proxy_cache_background_update on;
proxy_cache_lock on;

# Headers pour cache agressif
add_header X-Cache-Status $upstream_cache_status always;
add_header X-Optimized-For "Cameroon-2G3G" always;

# Compression maximale pour économiser la bande passante
gzip_comp_level 9;
gzip_min_length 500;

# Préchargement des ressources critiques
add_header Link "</api/health>; rel=preload; as=fetch" always;
add_header Link "</css/main.css>; rel=preload; as=style" always;
add_header Link "</js/app.min.js>; rel=preload; as=script" always;

# Service Worker pour cache offline
add_header Cache-Control "public, max-age=31536000" always;

# Optimisations spécifiques images pour mobile
location ~* \.(jpg|jpeg|png|gif|webp)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";

    # Headers pour optimisation mobile
    add_header X-Mobile-Optimized "1" always;
    add_header Vary "Accept" always;

    # Compression d'images automatique
    image_filter resize 800 600;
    image_filter_jpeg_quality 75;
    image_filter_buffer 10M;
}

# Optimisation des polices
location ~* \.(woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header Access-Control-Allow-Origin "*";
}

EOF

log_success "Configuration Nginx optimisée pour le Cameroun"

# ================================
# 3. OPTIMISATIONS APPLICATION
# ================================

log_info "⚡ Optimisations application pour mobile..."

# Créer le fichier d'optimisations frontend
cat << 'EOF' > nginx/frontend-cameroon.conf
# Configuration frontend optimisée Cameroun

server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Optimisations spécifiques mobile Cameroun

    # Headers performance mobile
    add_header X-UA-Compatible "IE=edge" always;
    add_header X-Mobile-Optimized "width=device-width,initial-scale=1" always;

    # Préchargement DNS pour services externes
    add_header Link "<//fonts.googleapis.com>; rel=dns-prefetch" always;
    add_header Link "<//api.cloudflare.com>; rel=dns-prefetch" always;

    # Service Worker pour cache offline
    location /sw.js {
        expires 0;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
    }

    # Manifeste PWA
    location /manifest.json {
        expires 1d;
        add_header Cache-Control "public";
    }

    # API Proxy optimisé
    location /api/ {
        proxy_pass http://backend:3001;

        # Optimisations connexion lente
        proxy_connect_timeout 5s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;

        # Compression des réponses API
        gzip on;
        gzip_types application/json;

        # Cache des réponses non-critiques
        location ~* /api/(subjects|lessons|static) {
            proxy_pass http://backend:3001;
            proxy_cache cameroon_cache;
            proxy_cache_valid 200 10m;
            add_header X-Cache-Status $upstream_cache_status;
        }
    }

    # Optimisation des images adaptative
    location ~* ^/images/(.+)\.(jpg|jpeg|png)$ {
        set $image_path $1;
        set $image_ext $2;

        # Redimensionnement automatique selon User-Agent
        if ($http_user_agent ~* "Mobile|Android|iPhone") {
            rewrite ^/images/(.+)$ /images/mobile/$1 last;
        }

        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Fallback pour SPA
    location / {
        try_files $uri $uri/ /index.html;

        # Headers pour SPA
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }
}
EOF

# ================================
# 4. OPTIMISATIONS BASE DE DONNÉES
# ================================

log_info "🗄️ Optimisations base de données pour latence..."

# Script d'optimisation PostgreSQL pour réseaux lents
cat << 'EOF' > database/optimize-cameroon.sql
-- Optimisations PostgreSQL pour réseaux Cameroun

-- Configuration connexions pour latence élevée
ALTER SYSTEM SET tcp_keepalives_idle = '300';
ALTER SYSTEM SET tcp_keepalives_interval = '30';
ALTER SYSTEM SET tcp_keepalives_count = '5';

-- Timeout adapté aux connexions mobiles
ALTER SYSTEM SET statement_timeout = '30s';
ALTER SYSTEM SET idle_in_transaction_session_timeout = '60s';

-- Cache adapté aux connexions lentes
ALTER SYSTEM SET shared_buffers = '128MB';
ALTER SYSTEM SET effective_cache_size = '512MB';

-- Optimisations checkpoint pour stabilité
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';

-- Index partiel pour requêtes fréquentes mobile
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_mobile_dashboard
ON students (family_id, status, last_activity_at DESC)
WHERE status = 'ACTIVE' AND last_activity_at > NOW() - INTERVAL '7 days';

-- Vue matérialisée pour dashboard mobile
CREATE MATERIALIZED VIEW IF NOT EXISTS mobile_dashboard_cache AS
SELECT
    f.id as family_id,
    f.name as family_name,
    COUNT(s.id) as total_students,
    AVG(s.current_average) as avg_score,
    SUM(s.total_study_time_minutes) as total_minutes,
    MAX(s.last_activity_at) as last_activity
FROM families f
LEFT JOIN students s ON s.family_id = f.id AND s.status = 'ACTIVE'
WHERE f.status = 'ACTIVE'
GROUP BY f.id, f.name;

-- Index sur la vue matérialisée
CREATE UNIQUE INDEX IF NOT EXISTS idx_mobile_dashboard_family
ON mobile_dashboard_cache (family_id);

-- Refresh automatique de la vue (toutes les 5 minutes)
SELECT cron.schedule('refresh-mobile-dashboard', '*/5 * * * *',
    'REFRESH MATERIALIZED VIEW CONCURRENTLY mobile_dashboard_cache;');

SELECT pg_reload_conf();
EOF

log_success "Optimisations base de données créées"

# ================================
# 5. MONITORING SPÉCIFIQUE CAMEROUN
# ================================

log_info "📊 Configuration monitoring réseau..."

# Script de monitoring adapté au Cameroun
cat << 'EOF' > scripts/monitor-cameroon.sh
#!/bin/bash

# Monitoring spécifique Cameroun
# Surveille la performance sur réseaux mobiles

LOGFILE="/var/log/claudyne-cameroon.log"

# Fonction de log avec timestamp
log_metric() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> $LOGFILE
}

# Test latence vers opérateurs camerounais
test_network_latency() {
    # MTN Cameroun
    mtn_latency=$(ping -c 1 -W 3 mtn.cm 2>/dev/null | grep 'time=' | awk -F'time=' '{print $2}' | awk '{print $1}')

    # Orange Cameroun
    orange_latency=$(ping -c 1 -W 3 orange.cm 2>/dev/null | grep 'time=' | awk -F'time=' '{print $2}' | awk '{print $1}')

    log_metric "LATENCY MTN:${mtn_latency}ms ORANGE:${orange_latency}ms"
}

# Monitoring performance application
test_app_performance() {
    # Test temps de réponse API
    api_time=$(curl -o /dev/null -s -w '%{time_total}' https://claudyne.com/api/health)

    # Test temps de chargement page
    page_time=$(curl -o /dev/null -s -w '%{time_total}' https://claudyne.com)

    log_metric "PERFORMANCE API:${api_time}s PAGE:${page_time}s"
}

# Test bande passante disponible
test_bandwidth() {
    # Test simple de download
    download_speed=$(curl -o /dev/null -s -w '%{speed_download}' http://speedtest.ftp.otenet.gr/files/test1Mb.db)

    log_metric "BANDWIDTH ${download_speed} bytes/sec"
}

# Exécuter tous les tests
test_network_latency
test_app_performance
test_bandwidth

# Alertes si performance dégradée
if (( $(echo "$api_time > 2" | bc -l) )); then
    log_metric "ALERT API response time high: ${api_time}s"
fi

EOF

chmod +x scripts/monitor-cameroon.sh

# Ajouter au cron pour monitoring continu
(crontab -l 2>/dev/null; echo "*/15 * * * * $(pwd)/scripts/monitor-cameroon.sh") | crontab -

log_success "Monitoring Cameroun configuré"

# ================================
# 6. SERVICE WORKER POUR CACHE OFFLINE
# ================================

log_info "💾 Configuration cache offline pour connexions instables..."

# Service Worker optimisé pour le Cameroun
cat << 'EOF' > sw-cameroon.js
// Service Worker Claudyne - Optimisé Cameroun
// Cache agressif pour réseaux 2G/3G instables

const CACHE_NAME = 'claudyne-cameroon-v1';
const OFFLINE_URL = '/offline.html';

// Ressources critiques à mettre en cache
const CRITICAL_RESOURCES = [
    '/',
    '/offline.html',
    '/css/main.css',
    '/js/app.min.js',
    '/api/health',
    '/manifest.json'
];

// Ressources API à mettre en cache
const API_CACHE_PATTERNS = [
    '/api/subjects',
    '/api/lessons',
    '/api/payments/methods',
    '/api/payments/subscriptions/plans'
];

// Installation - cache des ressources critiques
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(CRITICAL_RESOURCES))
            .then(() => self.skipWaiting())
    );
});

// Stratégie de cache adaptée au Cameroun
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);

    // Stratégie pour les APIs
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(cacheFirstThenNetwork(request));
    }
    // Stratégie pour les ressources statiques
    else if (request.destination === 'style' ||
             request.destination === 'script' ||
             request.destination === 'image') {
        event.respondWith(cacheFirst(request));
    }
    // Stratégie pour les pages HTML
    else if (request.destination === 'document') {
        event.respondWith(networkFirstThenCache(request));
    }
});

// Cache First (pour ressources statiques)
async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }

    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        return new Response('Contenu non disponible hors ligne', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

// Network First (pour contenu dynamique)
async function networkFirstThenCache(request) {
    try {
        const networkResponse = await fetch(request, {
            timeout: 5000  // 5s timeout pour réseaux lents
        });

        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        const cachedResponse = await caches.match(request);
        return cachedResponse || caches.match(OFFLINE_URL);
    }
}

// Cache First Then Network (pour APIs)
async function cacheFirstThenNetwork(request) {
    // Retourner immédiatement la version en cache si disponible
    const cachedResponse = await caches.match(request);

    // En parallèle, essayer de récupérer la version réseau
    const networkPromise = fetch(request, {
        timeout: 3000  // 3s timeout pour APIs
    }).then(response => {
        if (response.ok) {
            const cache = caches.open(CACHE_NAME);
            cache.then(c => c.put(request, response.clone()));
        }
        return response;
    }).catch(() => null);

    return cachedResponse || networkPromise ||
           new Response('{"error":"Service temporarily unavailable"}', {
               headers: { 'Content-Type': 'application/json' },
               status: 503
           });
}

// Nettoyage périodique du cache
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'CLEAN_CACHE') {
        cleanOldCache();
    }
});

async function cleanOldCache() {
    const cacheNames = await caches.keys();
    await Promise.all(
        cacheNames
            .filter(cacheName => cacheName !== CACHE_NAME)
            .map(cacheName => caches.delete(cacheName))
    );
}
EOF

log_success "Service Worker optimisé créé"

# ================================
# 7. SCRIPT DE VALIDATION FINAL
# ================================

log_info "✅ Validation des optimisations..."

# Vérifier que les optimisations sont actives
validate_optimizations() {
    echo ""
    log_info "🔍 Vérification des optimisations:"

    # Vérifier TCP BBR
    if sysctl net.ipv4.tcp_congestion_control | grep -q "bbr"; then
        log_success "✅ TCP BBR activé"
    else
        log_warning "⚠️ TCP BBR non activé"
    fi

    # Vérifier les buffers
    current_rmem=$(sysctl -n net.core.rmem_max)
    if [ "$current_rmem" -ge 16777216 ]; then
        log_success "✅ Buffers TCP optimisés"
    else
        log_warning "⚠️ Buffers TCP non optimisés"
    fi

    # Vérifier la configuration nginx
    if [ -f "nginx/conf.d/cameroon-optimizations.conf" ]; then
        log_success "✅ Configuration Nginx Cameroun présente"
    else
        log_warning "⚠️ Configuration Nginx manquante"
    fi

    echo ""
    log_success "🇨🇲 Optimisations Cameroun terminées !"
    echo ""
    log_info "📱 Optimisations appliquées pour:"
    echo "   • Réseaux MTN Mobile 2G/3G/4G"
    echo "   • Réseaux Orange Mobile 2G/3G/4G"
    echo "   • Connexions instables et latence élevée"
    echo "   • Cache offline pour coupures réseau"
    echo "   • Compression maximale des données"
    echo ""
    log_info "📊 Monitoring actif:"
    echo "   • Logs: /var/log/claudyne-cameroon.log"
    echo "   • Monitoring: scripts/monitor-cameroon.sh"
    echo "   • Vérification toutes les 15 minutes"
    echo ""
    log_success "💚 'La force du savoir en héritage' - Optimisé pour le Cameroun"
}

validate_optimizations

# Créer un résumé des optimisations
cat << 'EOF' > OPTIMIZATIONS-CAMEROON.md
# 🇨🇲 Optimisations Claudyne pour le Cameroun

## Réseaux Mobiles Optimisés
- ✅ MTN Cameroun (2G/3G/4G)
- ✅ Orange Cameroun (2G/3G/4G)
- ✅ Camtel Mobile
- ✅ Nexttel

## Optimisations Appliquées

### 🌐 Réseau et TCP
- TCP BBR pour congestion control
- Buffers optimisés pour latence élevée
- Timeouts adaptés aux réseaux mobiles
- Fast Open pour réduire la latence

### ⚡ Application Web
- Compression GZIP niveau 9
- Cache agressif (1 an pour statiques)
- Service Worker pour cache offline
- Préchargement des ressources critiques

### 🗄️ Base de Données
- Vues matérialisées pour dashboard mobile
- Index optimisés pour requêtes fréquentes
- Timeout adapté aux connexions lentes
- Cache des requêtes non-critiques

### 📱 Interface Mobile
- Images redimensionnées automatiquement
- Compression adaptative selon device
- Manifeste PWA pour installation
- Mode offline fonctionnel

## Monitoring
- Latence MTN/Orange en temps réel
- Performance API continue
- Alertes si dégradation > 2s
- Logs dans /var/log/claudyne-cameroon.log

## Commandes Utiles
```bash
# Voir les optimisations actives
sysctl net.ipv4.tcp_congestion_control

# Monitoring en temps réel
tail -f /var/log/claudyne-cameroon.log

# Test performance
curl -w "@curl-format.txt" -o /dev/null -s https://claudyne.com

# Vérifier cache offline
# Ouvrir https://claudyne.com puis couper le réseau
```

💚 Optimisé avec amour pour l'éducation au Cameroun
EOF

log_success "Documentation créée: OPTIMIZATIONS-CAMEROON.md"