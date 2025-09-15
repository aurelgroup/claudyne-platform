/**
 * Claudyne Parent Interface - Main App
 * Architecture modulaire avec lazy loading optimisé
 */

export class ParentApp {
    constructor() {
        this.currentPage = 'dashboard';
        this.modules = new Map();
        this.isOnline = navigator.onLine;
        this.isMobile = window.innerWidth < 768;
        this.performance = {
            loadStart: performance.now(),
            modules: new Map()
        };
    }

    async init() {
        console.log('[ParentApp] Initializing...');

        try {
            // Load critical shared modules first
            await this.loadCriticalModules();

            // Setup core functionality
            this.setupNavigation();
            this.setupOfflineDetection();
            this.setupPerformanceMonitoring();

            // Load non-critical CSS
            this.loadNonCriticalCSS();

            // Load initial page (dashboard)
            await this.loadPage('dashboard');

            // Setup mobile enhancements
            if (this.isMobile) {
                await this.setupMobileEnhancements();
            }

            // Hide loading screen
            this.hideLoading();

            // Preload likely next pages
            this.preloadPages(['children', 'messages']);

            console.log(`[ParentApp] Initialized in ${(performance.now() - this.performance.loadStart).toFixed(2)}ms`);

        } catch (error) {
            console.error('[ParentApp] Initialization failed:', error);
            this.showError(error);
        }
    }

    async loadCriticalModules() {
        const criticalModules = [
            { name: 'navigation', path: './shared/navigation.js' },
            { name: 'utils', path: './shared/utils.js' }
        ];

        // Load in parallel for performance
        const promises = criticalModules.map(async (module) => {
            const start = performance.now();
            try {
                const imported = await import(module.path);
                this.modules.set(module.name, imported);
                this.performance.modules.set(module.name, performance.now() - start);
                console.log(`[ParentApp] Loaded ${module.name} in ${(performance.now() - start).toFixed(2)}ms`);
            } catch (error) {
                console.error(`[ParentApp] Failed to load ${module.name}:`, error);
            }
        });

        await Promise.allSettled(promises);
    }

    async loadPage(pageId) {
        if (this.currentPage === pageId) return;

        const start = performance.now();
        console.log(`[ParentApp] Loading page: ${pageId}`);

        try {
            // Show loading indicator
            this.showPageLoading(pageId);

            // Lazy load module if not cached
            if (!this.modules.has(pageId)) {
                const module = await this.lazyLoadModule(pageId);
                this.modules.set(pageId, module);
            }

            // Get module and render
            const module = this.modules.get(pageId);
            if (module?.default) {
                const pageInstance = new module.default();
                await pageInstance.render();
            }

            // Update navigation
            this.updateNavigation(pageId);

            // Update current page
            this.currentPage = pageId;

            // Analytics
            this.trackPageView(pageId, performance.now() - start);

            console.log(`[ParentApp] Page ${pageId} loaded in ${(performance.now() - start).toFixed(2)}ms`);

        } catch (error) {
            console.error(`[ParentApp] Failed to load page ${pageId}:`, error);
            this.showPageError(pageId, error);
        }
    }

    async lazyLoadModule(moduleId) {
        const moduleMap = {
            dashboard: () => import('./modules/dashboard.js'),
            children: () => import('./modules/children.js'),
            planning: () => import('./modules/planning.js'),
            psychology: () => import('./modules/psychology.js'),
            messages: () => import('./modules/messages.js'),
            reports: () => import('./modules/reports.js'),
            finance: () => import('./modules/finance.js'),
            community: () => import('./modules/community.js'),
            settings: () => import('./modules/settings.js')
        };

        if (!moduleMap[moduleId]) {
            throw new Error(`Module ${moduleId} not found`);
        }

        console.log(`[ParentApp] Lazy loading: ${moduleId}`);
        return await moduleMap[moduleId]();
    }

    setupNavigation() {
        // Mobile bottom navigation
        document.addEventListener('click', (e) => {
            const navItem = e.target.closest('[data-page]');
            if (navItem) {
                e.preventDefault();
                const pageId = navItem.dataset.page;
                this.loadPage(pageId);

                // Update URL without reload
                history.pushState({ page: pageId }, '', `#${pageId}`);
            }
        });

        // Browser back/forward
        window.addEventListener('popstate', (e) => {
            const pageId = e.state?.page || window.location.hash.slice(1) || 'dashboard';
            this.loadPage(pageId);
        });

        // Desktop navigation
        this.renderDesktopNavigation();
    }

    renderDesktopNavigation() {
        const desktopNav = document.getElementById('desktopNav');
        if (!desktopNav) return;

        const navItems = [
            { id: 'dashboard', label: 'Tableau de bord', icon: 'fas fa-chart-line' },
            { id: 'children', label: 'Mes enfants', icon: 'fas fa-user-graduate' },
            { id: 'planning', label: 'Planification', icon: 'fas fa-calendar-alt' },
            { id: 'psychology', label: 'Copilote Émotionnel', icon: 'fas fa-heart' },
            { id: 'messages', label: 'Messages', icon: 'fas fa-comments' },
            { id: 'reports', label: 'Rapports', icon: 'fas fa-chart-bar' },
            { id: 'finance', label: 'Finance', icon: 'fas fa-wallet' },
            { id: 'community', label: 'Communauté', icon: 'fas fa-users' },
            { id: 'settings', label: 'Paramètres', icon: 'fas fa-cog' }
        ];

        desktopNav.innerHTML = navItems.map(item => `
            <a href="#${item.id}" class="nav-link ${item.id === this.currentPage ? 'active' : ''}" data-page="${item.id}">
                <i class="${item.icon}"></i>
                <span>${item.label}</span>
            </a>
        `).join('');
    }

    async setupMobileEnhancements() {
        console.log('[ParentApp] Setting up mobile enhancements...');

        // Swipe gestures
        this.setupSwipeGestures();

        // Pull-to-refresh
        this.setupPullToRefresh();

        // Touch optimizations
        this.setupTouchOptimizations();
    }

    setupSwipeGestures() {
        let startX, startY, currentX, currentY;
        const threshold = 100;
        const restraint = 150;
        const allowedTime = 300;

        document.addEventListener('touchstart', (e) => {
            const touch = e.changedTouches[0];
            startX = touch.pageX;
            startY = touch.pageY;
            this.swipeTime = new Date().getTime();
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            const touch = e.changedTouches[0];
            currentX = touch.pageX;
            currentY = touch.pageY;

            const elapsedTime = new Date().getTime() - this.swipeTime;
            const distX = currentX - startX;
            const distY = currentY - startY;

            if (elapsedTime <= allowedTime && Math.abs(distX) >= threshold && Math.abs(distY) <= restraint) {
                if (distX > 0) {
                    this.swipeRight();
                } else {
                    this.swipeLeft();
                }
            }
        }, { passive: true });
    }

    swipeLeft() {
        const pages = ['dashboard', 'children', 'planning', 'psychology', 'messages'];
        const currentIndex = pages.indexOf(this.currentPage);
        if (currentIndex < pages.length - 1) {
            this.loadPage(pages[currentIndex + 1]);
        }
    }

    swipeRight() {
        const pages = ['dashboard', 'children', 'planning', 'psychology', 'messages'];
        const currentIndex = pages.indexOf(this.currentPage);
        if (currentIndex > 0) {
            this.loadPage(pages[currentIndex - 1]);
        }
    }

    setupPullToRefresh() {
        let startY, currentY, pullDistance = 0;
        const refreshThreshold = 80;
        let refreshIndicator = null;

        const createRefreshIndicator = () => {
            if (refreshIndicator) return;

            refreshIndicator = document.createElement('div');
            refreshIndicator.style.cssText = `
                position: fixed;
                top: -60px;
                left: 50%;
                transform: translateX(-50%);
                background: #6366f1;
                color: white;
                padding: 10px 20px;
                border-radius: 20px;
                z-index: 1000;
                transition: top 0.3s ease;
                font-size: 14px;
            `;
            refreshIndicator.innerHTML = '<i class="fas fa-sync-alt"></i> Tirer pour actualiser';
            document.body.appendChild(refreshIndicator);
        };

        document.addEventListener('touchstart', (e) => {
            if (window.scrollY === 0) {
                startY = e.touches[0].pageY;
                createRefreshIndicator();
            }
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (startY && window.scrollY === 0) {
                currentY = e.touches[0].pageY;
                pullDistance = Math.max(0, currentY - startY);

                if (pullDistance > 0) {
                    e.preventDefault();
                    refreshIndicator.style.top = Math.min(pullDistance - 60, 20) + 'px';

                    if (pullDistance > refreshThreshold) {
                        refreshIndicator.innerHTML = '<i class="fas fa-arrow-down"></i> Relâcher pour actualiser';
                        refreshIndicator.style.background = '#10b981';
                    }
                }
            }
        });

        document.addEventListener('touchend', (e) => {
            if (startY && pullDistance > refreshThreshold) {
                this.refreshCurrentPage();
            }

            if (refreshIndicator) {
                refreshIndicator.style.top = '-60px';
                setTimeout(() => {
                    if (refreshIndicator) {
                        refreshIndicator.remove();
                        refreshIndicator = null;
                    }
                }, 300);
            }

            startY = null;
            pullDistance = 0;
        }, { passive: true });
    }

    setupTouchOptimizations() {
        // Prevent 300ms tap delay
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);

        // Add touch feedback
        document.addEventListener('touchstart', (e) => {
            const element = e.target.closest('button, [data-page], .nav-item');
            if (element) {
                element.style.opacity = '0.7';
            }
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            const element = e.target.closest('button, [data-page], .nav-item');
            if (element) {
                setTimeout(() => {
                    element.style.opacity = '';
                }, 150);
            }
        }, { passive: true });
    }

    setupOfflineDetection() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.showNotification('Connexion rétablie', 'success');
            this.syncOfflineData();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showNotification('Mode hors ligne', 'info');
        });
    }

    setupPerformanceMonitoring() {
        // Monitor Core Web Vitals
        if ('PerformanceObserver' in window) {
            // Largest Contentful Paint
            new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lcp = entries[entries.length - 1];
                console.log('[Performance] LCP:', lcp.startTime);
            }).observe({ entryTypes: ['largest-contentful-paint'] });

            // First Input Delay
            new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const fid = entries[0];
                console.log('[Performance] FID:', fid.processingStart - fid.startTime);
            }).observe({ entryTypes: ['first-input'] });

            // Cumulative Layout Shift
            new PerformanceObserver((list) => {
                let cls = 0;
                for (const entry of list.getEntries()) {
                    if (!entry.hadRecentInput) {
                        cls += entry.value;
                    }
                }
                console.log('[Performance] CLS:', cls);
            }).observe({ entryTypes: ['layout-shift'] });
        }
    }

    loadNonCriticalCSS() {
        // Load component CSS
        const componentCSS = document.createElement('link');
        componentCSS.rel = 'stylesheet';
        componentCSS.href = './css/main.css';
        document.head.appendChild(componentCSS);
    }

    async preloadPages(pages) {
        // Preload modules with low priority
        if ('requestIdleCallback' in window) {
            requestIdleCallback(async () => {
                for (const pageId of pages) {
                    if (!this.modules.has(pageId)) {
                        try {
                            const module = await this.lazyLoadModule(pageId);
                            this.modules.set(pageId, module);
                            console.log(`[ParentApp] Preloaded: ${pageId}`);
                        } catch (error) {
                            console.warn(`[ParentApp] Preload failed: ${pageId}`, error);
                        }
                    }
                }
            });
        }
    }

    // UI State Management
    updateNavigation(pageId) {
        // Update mobile navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === pageId);
        });

        // Update desktop navigation
        document.querySelectorAll('.nav-link').forEach(item => {
            item.classList.toggle('active', item.dataset.page === pageId);
        });

        // Show/hide pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.toggle('active', page.id === pageId);
        });
    }

    showPageLoading(pageId) {
        const page = document.getElementById(pageId);
        if (page) {
            page.innerHTML = `
                <div style="display:flex;justify-content:center;align-items:center;height:200px;">
                    <div class="spinner"></div>
                </div>
            `;
        }
    }

    showPageError(pageId, error) {
        const page = document.getElementById(pageId);
        if (page) {
            page.innerHTML = `
                <div style="text-align:center;padding:2rem;color:#ef4444;">
                    <i class="fas fa-exclamation-triangle" style="font-size:2rem;margin-bottom:1rem;"></i>
                    <h3>Erreur de chargement</h3>
                    <p>${error.message}</p>
                    <button onclick="location.reload()" style="margin-top:1rem;padding:0.5rem 1rem;background:#6366f1;color:white;border:none;border-radius:4px;">
                        Réessayer
                    </button>
                </div>
            `;
        }
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        const app = document.getElementById('app');

        if (loading && app) {
            loading.style.opacity = '0';
            setTimeout(() => {
                loading.style.display = 'none';
                app.style.display = 'flex';
            }, 300);
        }
    }

    showError(error) {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.innerHTML = `
                <div style="text-align:center;color:#ef4444;">
                    <i class="fas fa-exclamation-triangle" style="font-size:3rem;margin-bottom:1rem;"></i>
                    <h2>Erreur</h2>
                    <p>${error.message}</p>
                    <button onclick="location.reload()" style="margin-top:1rem;padding:0.75rem 1.5rem;background:#6366f1;color:white;border:none;border-radius:8px;">
                        Réessayer
                    </button>
                </div>
            `;
        }
    }

    async refreshCurrentPage() {
        console.log(`[ParentApp] Refreshing page: ${this.currentPage}`);

        // Clear module cache for current page
        this.modules.delete(this.currentPage);

        // Reload page
        await this.loadPage(this.currentPage);

        this.showNotification('Page actualisée', 'success');
    }

    async syncOfflineData() {
        if (!this.isOnline) return;

        try {
            // Sync logic here
            console.log('[ParentApp] Syncing offline data...');
            // Implementation would sync with backend
        } catch (error) {
            console.error('[ParentApp] Sync failed:', error);
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 1rem;
            right: 1rem;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#6366f1'};
            color: white;
            padding: 1rem;
            border-radius: 8px;
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);

        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    trackPageView(pageId, loadTime) {
        // Analytics tracking
        console.log(`[Analytics] Page view: ${pageId}, Load time: ${loadTime.toFixed(2)}ms`);

        if (typeof gtag !== 'undefined') {
            gtag('event', 'page_view', {
                page_title: pageId,
                page_location: window.location.href,
                custom_parameter_1: loadTime
            });
        }
    }

    // Public API
    getModule(name) {
        return this.modules.get(name);
    }

    getCurrentPage() {
        return this.currentPage;
    }

    getPerformanceMetrics() {
        return {
            totalLoadTime: performance.now() - this.performance.loadStart,
            moduleLoadTimes: Object.fromEntries(this.performance.modules),
            isOnline: this.isOnline,
            isMobile: this.isMobile
        };
    }
}

// Global instance
window.parentApp = null;