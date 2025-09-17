/**
 * Claudyne Parent Interface - API Service
 * Connects to the real Claudyne backend APIs
 */

class ApiService {
    constructor() {
        this.baseURL = 'http://localhost:3001/api';
        this.token = localStorage.getItem('claudyne_token');
        this.headers = {
            'Content-Type': 'application/json',
            'Authorization': this.token ? `Bearer ${this.token}` : ''
        };
    }

    /**
     * Generic API request handler
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.headers,
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error(`API request failed: ${endpoint}`, error);
            throw error;
        }
    }

    /**
     * Authentication methods
     */
    async login(email, password) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (response.success && response.data.token) {
            this.token = response.data.token;
            localStorage.setItem('claudyne_token', this.token);
            this.headers.Authorization = `Bearer ${this.token}`;
        }

        return response;
    }

    async logout() {
        localStorage.removeItem('claudyne_token');
        this.token = null;
        this.headers.Authorization = '';
    }

    /**
     * Family and Children data
     */
    async getFamilyData() {
        return await this.request('/families/profile');
    }

    async getChildren() {
        return await this.request('/students');
    }

    async getChildProgress(studentId) {
        return await this.request(`/progress/student/${studentId}`);
    }

    /**
     * Dashboard metrics
     */
    async getDashboardMetrics() {
        try {
            const response = await this.request('/families/dashboard');
            return {
                success: true,
                data: this.transformDashboardData(response.data)
            };
        } catch (error) {
            // Fallback to mock data if API fails
            const { mockData } = await import('./mock-data.js');
            return {
                success: false,
                data: mockData.dashboard,
                fallback: true
            };
        }
    }

    /**
     * Transform backend data to match frontend expectations
     */
    transformDashboardData(backendData) {
        return {
            metrics: {
                totalExercises: {
                    value: backendData.totalExercises || 0,
                    label: "Exercices complétés cette semaine",
                    change: `+${backendData.exerciseGrowth || 0}% vs semaine dernière`,
                    type: (backendData.exerciseGrowth || 0) >= 0 ? "positive" : "negative"
                },
                averageScore: {
                    value: `${backendData.averageScore || 0}%`,
                    label: "Score moyen général",
                    change: `${backendData.scoreChange || 0}% ce mois`,
                    type: (backendData.scoreChange || 0) >= 0 ? "positive" : "negative"
                },
                studyTime: {
                    value: `${Math.round((backendData.studyTimeMinutes || 0) / 60)}h`,
                    label: "Temps d'étude cette semaine",
                    change: `${backendData.studyTimeChange || 0}h vs objectif`,
                    type: (backendData.studyTimeChange || 0) >= 0 ? "positive" : "negative"
                },
                achievements: {
                    value: backendData.newAchievements || 0,
                    label: "Nouveaux badges débloqués",
                    change: "cette semaine",
                    type: "neutral"
                }
            },
            children: backendData.children || [],
            activities: backendData.recentActivities || [],
            insights: backendData.insights || []
        };
    }

    /**
     * Payments and subscriptions
     */
    async getPaymentMethods() {
        return await this.request('/payments/methods');
    }

    async getSubscriptionPlans() {
        return await this.request('/payments/subscriptions/plans');
    }

    async getPaymentHistory() {
        return await this.request('/payments/history');
    }

    async initializePayment(paymentData) {
        return await this.request('/payments/initialize', {
            method: 'POST',
            body: JSON.stringify(paymentData)
        });
    }

    async checkPaymentStatus(transactionId) {
        return await this.request(`/payments/${transactionId}/status`);
    }

    /**
     * Messages and notifications
     */
    async getMessages() {
        return await this.request('/notifications');
    }

    async markMessageAsRead(messageId) {
        return await this.request(`/notifications/${messageId}/read`, {
            method: 'PUT'
        });
    }

    /**
     * Reports and analytics
     */
    async getProgressReports(filters = {}) {
        const params = new URLSearchParams(filters);
        return await this.request(`/progress/reports?${params}`);
    }

    async exportReport(reportType, format = 'pdf') {
        return await this.request(`/progress/export/${reportType}?format=${format}`);
    }

    /**
     * Settings
     */
    async updateFamily(data) {
        return await this.request('/families/profile', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async updateNotificationSettings(settings) {
        return await this.request('/families/notification-settings', {
            method: 'PUT',
            body: JSON.stringify(settings)
        });
    }

    /**
     * Health check
     */
    async checkConnection() {
        try {
            const response = await fetch(`${this.baseURL.replace('/api', '')}/health`);
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    /**
     * Utility methods
     */
    isAuthenticated() {
        return !!this.token;
    }

    async validateToken() {
        try {
            await this.request('/auth/validate');
            return true;
        } catch (error) {
            this.logout();
            return false;
        }
    }
}

// Create singleton instance
const apiService = new ApiService();

// Configuration flag to switch between API and mock data
export const USE_REAL_API = true; // Set to false to use mock data

/**
 * Smart data fetcher that uses real API or falls back to mock data
 */
export async function getData(endpoint, fallbackMockData = null) {
    if (!USE_REAL_API) {
        const { mockData } = await import('./mock-data.js');
        return {
            success: true,
            data: fallbackMockData || mockData,
            source: 'mock'
        };
    }

    try {
        // Check if backend is available
        const isOnline = await apiService.checkConnection();
        if (!isOnline) {
            throw new Error('Backend not available');
        }

        // Try to get real data
        const response = await apiService.request(endpoint);
        return {
            success: true,
            data: response.data,
            source: 'api'
        };
    } catch (error) {
        console.warn(`API call failed for ${endpoint}, falling back to mock data:`, error);

        // Fallback to mock data
        const { mockData } = await import('./mock-data.js');
        return {
            success: false,
            data: fallbackMockData || mockData,
            source: 'mock',
            error: error.message
        };
    }
}

export default apiService;