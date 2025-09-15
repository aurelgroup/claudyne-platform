/**
 * Claudyne Parent Interface - IndexedDB Database Manager
 * Gestion des données locales pour l'interface parent
 */

class ClaudyneParentDB {
    constructor() {
        this.dbName = 'ClaudyneParent';
        this.version = 1;
        this.db = null;
    }

    // Initialisation de la base de données
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('[ParentDB] Erreur ouverture base:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('[ParentDB] Base de données initialisée');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                this.createStores(db);
            };
        });
    }

    // Création des stores
    createStores(db) {
        // Store pour les enfants
        if (!db.objectStoreNames.contains('children')) {
            const childrenStore = db.createObjectStore('children', {
                keyPath: 'id',
                autoIncrement: true
            });
            childrenStore.createIndex('name', 'name', { unique: false });
            childrenStore.createIndex('class', 'class', { unique: false });
        }

        // Store pour les performances
        if (!db.objectStoreNames.contains('performances')) {
            const performanceStore = db.createObjectStore('performances', {
                keyPath: 'id',
                autoIncrement: true
            });
            performanceStore.createIndex('childId', 'childId', { unique: false });
            performanceStore.createIndex('subject', 'subject', { unique: false });
            performanceStore.createIndex('date', 'date', { unique: false });
        }

        // Store pour les messages
        if (!db.objectStoreNames.contains('messages')) {
            const messagesStore = db.createObjectStore('messages', {
                keyPath: 'id',
                autoIncrement: true
            });
            messagesStore.createIndex('timestamp', 'timestamp', { unique: false });
            messagesStore.createIndex('sender', 'sender', { unique: false });
            messagesStore.createIndex('read', 'read', { unique: false });
        }

        // Store pour les événements/planning
        if (!db.objectStoreNames.contains('events')) {
            const eventsStore = db.createObjectStore('events', {
                keyPath: 'id',
                autoIncrement: true
            });
            eventsStore.createIndex('date', 'date', { unique: false });
            eventsStore.createIndex('type', 'type', { unique: false });
            eventsStore.createIndex('childId', 'childId', { unique: false });
        }

        // Store pour les préférences utilisateur
        if (!db.objectStoreNames.contains('preferences')) {
            const preferencesStore = db.createObjectStore('preferences', {
                keyPath: 'key'
            });
        }

        // Store pour les données synchronisées
        if (!db.objectStoreNames.contains('syncData')) {
            const syncStore = db.createObjectStore('syncData', {
                keyPath: 'endpoint'
            });
        }

        console.log('[ParentDB] Stores créés avec succès');
    }

    // === CHILDREN OPERATIONS ===
    async addChild(childData) {
        const transaction = this.db.transaction(['children'], 'readwrite');
        const store = transaction.objectStore('children');

        const child = {
            ...childData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        return new Promise((resolve, reject) => {
            const request = store.add(child);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllChildren() {
        const transaction = this.db.transaction(['children'], 'readonly');
        const store = transaction.objectStore('children');

        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async updateChild(id, updates) {
        const transaction = this.db.transaction(['children'], 'readwrite');
        const store = transaction.objectStore('children');

        return new Promise((resolve, reject) => {
            const getRequest = store.get(id);
            getRequest.onsuccess = () => {
                const child = getRequest.result;
                if (child) {
                    Object.assign(child, updates, {
                        updatedAt: new Date().toISOString()
                    });
                    const putRequest = store.put(child);
                    putRequest.onsuccess = () => resolve(putRequest.result);
                    putRequest.onerror = () => reject(putRequest.error);
                } else {
                    reject(new Error('Enfant non trouvé'));
                }
            };
            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    // === PERFORMANCE OPERATIONS ===
    async addPerformance(performanceData) {
        const transaction = this.db.transaction(['performances'], 'readwrite');
        const store = transaction.objectStore('performances');

        const performance = {
            ...performanceData,
            timestamp: new Date().toISOString()
        };

        return new Promise((resolve, reject) => {
            const request = store.add(performance);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getPerformancesByChild(childId, limit = 50) {
        const transaction = this.db.transaction(['performances'], 'readonly');
        const store = transaction.objectStore('performances');
        const index = store.index('childId');

        return new Promise((resolve, reject) => {
            const request = index.getAll(childId);
            request.onsuccess = () => {
                const results = request.result
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .slice(0, limit);
                resolve(results);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // === MESSAGES OPERATIONS ===
    async addMessage(messageData) {
        const transaction = this.db.transaction(['messages'], 'readwrite');
        const store = transaction.objectStore('messages');

        const message = {
            ...messageData,
            timestamp: new Date().toISOString(),
            read: false
        };

        return new Promise((resolve, reject) => {
            const request = store.add(message);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getRecentMessages(limit = 20) {
        const transaction = this.db.transaction(['messages'], 'readonly');
        const store = transaction.objectStore('messages');
        const index = store.index('timestamp');

        return new Promise((resolve, reject) => {
            const request = index.getAll();
            request.onsuccess = () => {
                const results = request.result
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                    .slice(0, limit);
                resolve(results);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async markMessageAsRead(messageId) {
        return this.updateMessage(messageId, { read: true });
    }

    async updateMessage(id, updates) {
        const transaction = this.db.transaction(['messages'], 'readwrite');
        const store = transaction.objectStore('messages');

        return new Promise((resolve, reject) => {
            const getRequest = store.get(id);
            getRequest.onsuccess = () => {
                const message = getRequest.result;
                if (message) {
                    Object.assign(message, updates);
                    const putRequest = store.put(message);
                    putRequest.onsuccess = () => resolve(putRequest.result);
                    putRequest.onerror = () => reject(putRequest.error);
                } else {
                    reject(new Error('Message non trouvé'));
                }
            };
            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    // === EVENTS OPERATIONS ===
    async addEvent(eventData) {
        const transaction = this.db.transaction(['events'], 'readwrite');
        const store = transaction.objectStore('events');

        const event = {
            ...eventData,
            createdAt: new Date().toISOString()
        };

        return new Promise((resolve, reject) => {
            const request = store.add(event);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getEventsForPeriod(startDate, endDate) {
        const transaction = this.db.transaction(['events'], 'readonly');
        const store = transaction.objectStore('events');
        const index = store.index('date');

        return new Promise((resolve, reject) => {
            const range = IDBKeyRange.bound(startDate, endDate);
            const request = index.getAll(range);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // === PREFERENCES OPERATIONS ===
    async setPreference(key, value) {
        const transaction = this.db.transaction(['preferences'], 'readwrite');
        const store = transaction.objectStore('preferences');

        const preference = { key, value, updatedAt: new Date().toISOString() };

        return new Promise((resolve, reject) => {
            const request = store.put(preference);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getPreference(key, defaultValue = null) {
        const transaction = this.db.transaction(['preferences'], 'readonly');
        const store = transaction.objectStore('preferences');

        return new Promise((resolve, reject) => {
            const request = store.get(key);
            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? result.value : defaultValue);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // === SYNC OPERATIONS ===
    async storeSyncData(endpoint, data) {
        const transaction = this.db.transaction(['syncData'], 'readwrite');
        const store = transaction.objectStore('syncData');

        const syncData = {
            endpoint,
            data,
            lastSync: new Date().toISOString()
        };

        return new Promise((resolve, reject) => {
            const request = store.put(syncData);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getSyncData(endpoint) {
        const transaction = this.db.transaction(['syncData'], 'readonly');
        const store = transaction.objectStore('syncData');

        return new Promise((resolve, reject) => {
            const request = store.get(endpoint);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // === UTILITY OPERATIONS ===
    async clearAllData() {
        const storeNames = ['children', 'performances', 'messages', 'events', 'preferences', 'syncData'];
        const transaction = this.db.transaction(storeNames, 'readwrite');

        const promises = storeNames.map(storeName => {
            return new Promise((resolve, reject) => {
                const store = transaction.objectStore(storeName);
                const request = store.clear();
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        });

        return Promise.all(promises);
    }

    async getDatabaseSize() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            return {
                used: estimate.usage,
                quota: estimate.quota,
                percentage: Math.round((estimate.usage / estimate.quota) * 100)
            };
        }
        return null;
    }

    // Export des données
    async exportData() {
        const allData = {};
        const storeNames = ['children', 'performances', 'messages', 'events', 'preferences'];

        for (const storeName of storeNames) {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);

            allData[storeName] = await new Promise((resolve, reject) => {
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }

        return {
            exportDate: new Date().toISOString(),
            version: this.version,
            data: allData
        };
    }
}

// Instance globale
const parentDB = new ClaudyneParentDB();

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ClaudyneParentDB;
} else if (typeof window !== 'undefined') {
    window.ClaudyneParentDB = ClaudyneParentDB;
    window.parentDB = parentDB;
}