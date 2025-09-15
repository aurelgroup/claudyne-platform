/**
 * Claudyne Parent Interface - Utilities
 * Fonctions utilitaires et helpers
 */

// Date et temps
export const DateUtils = {
    formatDate(date, locale = 'fr-FR') {
        return new Date(date).toLocaleDateString(locale);
    },

    formatTime(date, locale = 'fr-FR') {
        return new Date(date).toLocaleTimeString(locale, {
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    formatDateTime(date, locale = 'fr-FR') {
        return new Date(date).toLocaleString(locale);
    },

    formatRelativeTime(date) {
        const now = new Date();
        const diffMs = now - new Date(date);
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'À l\'instant';
        if (diffMins < 60) return `${diffMins}min`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}j`;
        return this.formatDate(date);
    },

    isToday(date) {
        const today = new Date();
        const checkDate = new Date(date);
        return checkDate.toDateString() === today.toDateString();
    },

    isThisWeek(date) {
        const now = new Date();
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
        const checkDate = new Date(date);
        return checkDate >= weekStart && checkDate < weekEnd;
    }
};

// Manipulation DOM
export const DOMUtils = {
    createElement(tag, className = '', innerHTML = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (innerHTML) element.innerHTML = innerHTML;
        return element;
    },

    removeElement(selector) {
        const element = typeof selector === 'string'
            ? document.querySelector(selector)
            : selector;
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
    },

    toggleClass(element, className, force) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (element) {
            return element.classList.toggle(className, force);
        }
    },

    fadeIn(element, duration = 300) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (element) {
            element.style.opacity = '0';
            element.style.display = 'block';

            const fadeStep = () => {
                let opacity = parseFloat(element.style.opacity);
                if ((opacity += 0.1) <= 1) {
                    element.style.opacity = opacity;
                    requestAnimationFrame(fadeStep);
                }
            };
            requestAnimationFrame(fadeStep);
        }
    },

    fadeOut(element, duration = 300) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (element) {
            const fadeStep = () => {
                let opacity = parseFloat(element.style.opacity || 1);
                if ((opacity -= 0.1) >= 0) {
                    element.style.opacity = opacity;
                    requestAnimationFrame(fadeStep);
                } else {
                    element.style.display = 'none';
                }
            };
            requestAnimationFrame(fadeStep);
        }
    }
};

// Validation
export const ValidationUtils = {
    isEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    isPhone(phone) {
        const re = /^[+]?[\d\s\-\(\)]{8,}$/;
        return re.test(phone);
    },

    isEmpty(value) {
        return !value || value.toString().trim().length === 0;
    },

    isNumeric(value) {
        return !isNaN(value) && !isNaN(parseFloat(value));
    },

    isInRange(value, min, max) {
        const num = parseFloat(value);
        return num >= min && num <= max;
    },

    sanitizeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
};

// Formatage des données
export const FormatUtils = {
    formatNumber(num, decimals = 0, locale = 'fr-FR') {
        return new Intl.NumberFormat(locale, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(num);
    },

    formatCurrency(amount, currency = 'XAF', locale = 'fr-CM') {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency
        }).format(amount);
    },

    formatPercentage(value, decimals = 1) {
        return `${this.formatNumber(value, decimals)}%`;
    },

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    },

    truncateText(text, maxLength, suffix = '...') {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - suffix.length) + suffix;
    },

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    camelToKebab(str) {
        return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
    }
};

// Utilitaires réseau
export const NetworkUtils = {
    async fetchWithTimeout(url, options = {}, timeout = 5000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    },

    async retryFetch(url, options = {}, maxRetries = 3, delay = 1000) {
        for (let i = 0; i <= maxRetries; i++) {
            try {
                const response = await fetch(url, options);
                if (response.ok) return response;
                if (i === maxRetries) throw new Error(`Failed after ${maxRetries} retries`);
            } catch (error) {
                if (i === maxRetries) throw error;
                await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
            }
        }
    },

    getConnectionType() {
        if ('connection' in navigator) {
            return navigator.connection.effectiveType || 'unknown';
        }
        return 'unknown';
    },

    isOnline() {
        return navigator.onLine;
    }
};

// Utilitaires stockage
export const StorageUtils = {
    set(key, value, storage = localStorage) {
        try {
            storage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Storage set error:', error);
            return false;
        }
    },

    get(key, defaultValue = null, storage = localStorage) {
        try {
            const item = storage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Storage get error:', error);
            return defaultValue;
        }
    },

    remove(key, storage = localStorage) {
        try {
            storage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    },

    clear(storage = localStorage) {
        try {
            storage.clear();
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    },

    getStorageSize(storage = localStorage) {
        let total = 0;
        for (let key in storage) {
            if (storage.hasOwnProperty(key)) {
                total += storage[key].length + key.length;
            }
        }
        return total;
    }
};

// Utilitaires performance
export const PerformanceUtils = {
    debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    },

    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    measureTime(label, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        console.log(`[Performance] ${label}: ${(end - start).toFixed(2)}ms`);
        return result;
    },

    async measureAsyncTime(label, fn) {
        const start = performance.now();
        const result = await fn();
        const end = performance.now();
        console.log(`[Performance] ${label}: ${(end - start).toFixed(2)}ms`);
        return result;
    }
};

// Utilitaires couleurs
export const ColorUtils = {
    getScoreColor(score) {
        if (score >= 80) return '#10b981'; // green
        if (score >= 60) return '#f59e0b'; // yellow
        return '#ef4444'; // red
    },

    getProgressColor(progress) {
        return this.getScoreColor(progress);
    },

    hexToRgba(hex, alpha = 1) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    },

    rgbaToHex(rgba) {
        const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
        if (match) {
            const hex = (x) => ("0" + parseInt(x).toString(16)).slice(-2);
            return "#" + hex(match[1]) + hex(match[2]) + hex(match[3]);
        }
        return rgba;
    }
};

// Utilitaires mobile
export const MobileUtils = {
    isMobile() {
        return window.innerWidth <= 768;
    },

    isTablet() {
        return window.innerWidth > 768 && window.innerWidth <= 1024;
    },

    isDesktop() {
        return window.innerWidth > 1024;
    },

    getTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    },

    getDeviceOrientation() {
        return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    },

    vibrate(pattern = 100) {
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    }
};

// Notifications
export class NotificationManager {
    constructor() {
        this.permission = Notification.permission;
    }

    async requestPermission() {
        if ('Notification' in window) {
            this.permission = await Notification.requestPermission();
            return this.permission === 'granted';
        }
        return false;
    }

    show(title, options = {}) {
        if (this.permission === 'granted') {
            return new Notification(title, {
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                ...options
            });
        }
        return null;
    }

    showToast(message, type = 'info', duration = 3000) {
        const toast = DOMUtils.createElement('div', `toast toast-${type}`, message);
        document.body.appendChild(toast);

        setTimeout(() => {
            DOMUtils.fadeOut(toast);
            setTimeout(() => DOMUtils.removeElement(toast), 300);
        }, duration);

        return toast;
    }
}

// Générateur d'IDs uniques
export const IDGenerator = {
    uuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    shortId(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },

    timestamp() {
        return Date.now().toString(36);
    }
};

// Export par défaut
export default {
    DateUtils,
    DOMUtils,
    ValidationUtils,
    FormatUtils,
    NetworkUtils,
    StorageUtils,
    PerformanceUtils,
    ColorUtils,
    MobileUtils,
    NotificationManager,
    IDGenerator
};