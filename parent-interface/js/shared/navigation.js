/**
 * Claudyne Parent Interface - Navigation System
 * Navigation mobile-first avec gestes tactiles et PWA
 */

export class NavigationSystem {
    constructor(options = {}) {
        this.options = {
            enableSwipeGestures: true,
            enableBottomNav: true,
            animationDuration: 300,
            swipeThreshold: 50,
            ...options
        };

        this.currentPage = 'dashboard';
        this.isTransitioning = false;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.pages = ['dashboard', 'children', 'planning', 'psychology', 'messages'];
    }

    initialize() {
        console.log('[Navigation] Initializing navigation system...');

        this.setupBottomNavigation();
        this.setupSwipeGestures();
        this.setupKeyboardNavigation();
        this.setupURLRouting();

        // Initialize current page from URL
        this.handleInitialRoute();

        console.log('[Navigation] Navigation system ready');
    }

    setupBottomNavigation() {
        const bottomNav = document.querySelector('.bottom-nav');
        if (!bottomNav) return;

        bottomNav.addEventListener('click', (e) => {
            const navLink = e.target.closest('.nav-link');
            if (!navLink) return;

            e.preventDefault();
            const page = navLink.dataset.page;
            if (page && page !== this.currentPage) {
                this.navigateToPage(page);
            }
        });
    }

    setupSwipeGestures() {
        if (!this.options.enableSwipeGestures) return;

        const mainContent = document.querySelector('.main');
        if (!mainContent) return;

        mainContent.addEventListener('touchstart', (e) => {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
        }, { passive: true });

        mainContent.addEventListener('touchend', (e) => {
            if (!this.touchStartX || !this.touchStartY) return;

            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;

            const deltaX = touchEndX - this.touchStartX;
            const deltaY = touchEndY - this.touchStartY;

            // Only handle horizontal swipes (avoid interfering with vertical scroll)
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > this.options.swipeThreshold) {
                const currentIndex = this.pages.indexOf(this.currentPage);

                if (deltaX > 0 && currentIndex > 0) {
                    // Swipe right - previous page
                    this.navigateToPage(this.pages[currentIndex - 1]);
                } else if (deltaX < 0 && currentIndex < this.pages.length - 1) {
                    // Swipe left - next page
                    this.navigateToPage(this.pages[currentIndex + 1]);
                }
            }

            this.touchStartX = 0;
            this.touchStartY = 0;
        }, { passive: true });
    }

    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) return;

            const currentIndex = this.pages.indexOf(this.currentPage);

            switch (e.key) {
                case 'ArrowLeft':
                    if (currentIndex > 0) {
                        e.preventDefault();
                        this.navigateToPage(this.pages[currentIndex - 1]);
                    }
                    break;
                case 'ArrowRight':
                    if (currentIndex < this.pages.length - 1) {
                        e.preventDefault();
                        this.navigateToPage(this.pages[currentIndex + 1]);
                    }
                    break;
                case '1':
                case '2':
                case '3':
                case '4':
                case '5':
                    const pageIndex = parseInt(e.key) - 1;
                    if (pageIndex < this.pages.length) {
                        e.preventDefault();
                        this.navigateToPage(this.pages[pageIndex]);
                    }
                    break;
            }
        });
    }

    setupURLRouting() {
        window.addEventListener('hashchange', () => {
            this.handleRouteChange();
        });

        window.addEventListener('popstate', () => {
            this.handleRouteChange();
        });
    }

    handleInitialRoute() {
        const hash = window.location.hash.slice(1);
        const page = hash || 'dashboard';

        if (this.pages.includes(page)) {
            this.navigateToPage(page, false);
        } else {
            this.navigateToPage('dashboard', false);
        }
    }

    handleRouteChange() {
        const hash = window.location.hash.slice(1);
        const page = hash || 'dashboard';

        if (this.pages.includes(page) && page !== this.currentPage) {
            this.navigateToPage(page, false);
        }
    }

    async navigateToPage(page, updateURL = true) {
        if (this.isTransitioning || page === this.currentPage) return;

        console.log(`[Navigation] Navigating to: ${page}`);
        this.isTransitioning = true;

        try {
            // Update URL
            if (updateURL) {
                window.location.hash = page;
            }

            // Trigger page change
            await this.performPageTransition(page);

            // Update navigation state
            this.updateNavigationState(page);

            // Notify app of page change
            this.notifyPageChange(page);

        } catch (error) {
            console.error('[Navigation] Failed to navigate:', error);
        } finally {
            this.isTransitioning = false;
        }
    }

    async performPageTransition(page) {
        const currentPageEl = document.querySelector('.page.active');
        const newPageEl = document.getElementById(page);

        if (!newPageEl) {
            throw new Error(`Page element not found: ${page}`);
        }

        // Add transitioning classes
        if (currentPageEl) {
            currentPageEl.classList.add('page-exit');
        }
        newPageEl.classList.add('page-enter');

        // Wait for animation
        await new Promise(resolve => setTimeout(resolve, this.options.animationDuration));

        // Update page visibility
        document.querySelectorAll('.page').forEach(el => {
            el.classList.remove('active', 'page-exit', 'page-enter');
        });

        newPageEl.classList.add('active');
        this.currentPage = page;
    }

    updateNavigationState(page) {
        // Update bottom nav active state
        document.querySelectorAll('.nav-link').forEach(link => {
            if (link.dataset.page === page) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Update document title
        const pageTitles = {
            dashboard: 'Tableau de bord',
            children: 'Mes enfants',
            planning: 'Planification',
            psychology: 'Copilote émotionnel',
            messages: 'Messages'
        };

        document.title = `${pageTitles[page] || page} - Claudyne Parent`;
    }

    notifyPageChange(page) {
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('pagechange', {
            detail: {
                page,
                previousPage: this.currentPage
            }
        }));

        // Notify app if available
        if (window.app && typeof window.app.onPageChange === 'function') {
            window.app.onPageChange(page);
        }
    }

    // Public API
    getCurrentPage() {
        return this.currentPage;
    }

    getPages() {
        return [...this.pages];
    }

    addPage(pageId, position = -1) {
        if (!this.pages.includes(pageId)) {
            if (position >= 0) {
                this.pages.splice(position, 0, pageId);
            } else {
                this.pages.push(pageId);
            }
        }
    }

    removePage(pageId) {
        const index = this.pages.indexOf(pageId);
        if (index > -1) {
            this.pages.splice(index, 1);

            // Navigate away if removing current page
            if (pageId === this.currentPage) {
                this.navigateToPage(this.pages[0] || 'dashboard');
            }
        }
    }

    setSwipeGestures(enabled) {
        this.options.enableSwipeGestures = enabled;
        if (enabled) {
            this.setupSwipeGestures();
        }
    }

    // Programmatic navigation helpers
    goToDashboard() {
        return this.navigateToPage('dashboard');
    }

    goToChildren() {
        return this.navigateToPage('children');
    }

    goToPlanning() {
        return this.navigateToPage('planning');
    }

    goToPsychology() {
        return this.navigateToPage('psychology');
    }

    goToMessages() {
        return this.navigateToPage('messages');
    }

    goBack() {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            this.navigateToPage('dashboard');
        }
    }

    goForward() {
        window.history.forward();
    }
}

// Export global pour interactions HTML
if (typeof window !== 'undefined') {
    window.navigation = null; // Sera initialisé par main.js
}