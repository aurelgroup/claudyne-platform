/**
 * Claudyne Parent Interface - API Configuration
 * Centralized API endpoint management
 */

import { mockData, getMockData, mockApiCall } from './mock-data.js';

class APIConfig {
    constructor() {
        this.isDevelopment = window.location.hostname === 'localhost' ||
                           window.location.hostname === '127.0.0.1' ||
                           window.location.port !== '';

        this.baseURL = this.isDevelopment
            ? `http://${window.location.hostname}:3001/api`
            : 'https://api.claudyne.com';

        this.websocketURL = this.isDevelopment
            ? `ws://${window.location.hostname}:3001/ws`
            : 'wss://api.claudyne.com';
    }

    // Parent API endpoints
    getParentEndpoints() {
        return {
            children: `${this.baseURL}/parent/children`,
            childrenProfiles: `${this.baseURL}/parent/children/profiles`,
            childAnalytics: (childId) => `${this.baseURL}/parent/children/${childId}/analytics`,
            childComparison: (childId) => `${this.baseURL}/parent/children/${childId}/compare`,
            siblingComparison: (childId) => `${this.baseURL}/parent/children/${childId}/siblings-compare`,
            progressHistorical: `${this.baseURL}/parent/progress/historical`,
            messages: `${this.baseURL}/parent/messages`,
            notifications: `${this.baseURL}/parent/notifications`
        };
    }

    // AI API endpoints
    getAIEndpoints() {
        return {
            recommendations: `${this.baseURL}/ai/recommendations`,
            childAnalysis: (childId) => `${this.baseURL}/ai/analysis/${childId}`,
            learningPatterns: `${this.baseURL}/ai/patterns`,
            interventions: `${this.baseURL}/ai/interventions`
        };
    }

    // WebSocket endpoints
    getWebSocketEndpoints() {
        return {
            aiRecommendations: `${this.websocketURL}/ai/recommendations`,
            childAnalytics: (childId) => `${this.websocketURL}/child/${childId}/analytics`,
            notifications: `${this.websocketURL}/notifications`
        };
    }

    // Mock data fallback when API is not available
    shouldUseMockData() {
        return this.isDevelopment;
    }

    // Default request headers
    getDefaultHeaders() {
        return {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    // Auth headers
    getAuthHeaders() {
        const token = localStorage.getItem('parentToken');
        const headers = this.getDefaultHeaders();

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    }

    // Fetch wrapper with error handling
    async fetch(endpoint, options = {}) {
        const config = {
            headers: this.getAuthHeaders(),
            ...options
        };

        try {
            const response = await fetch(endpoint, config);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return response;
        } catch (error) {
            console.warn(`[APIConfig] Request failed to ${endpoint}:`, error.message);

            // Return mock response in development
            if (this.shouldUseMockData()) {
                return this.getMockResponse(endpoint);
            }

            throw error;
        }
    }

    // Mock response for development
    getMockResponse(endpoint) {
        return {
            ok: true,
            status: 200,
            json: async () => this.getMockData(endpoint)
        };
    }

    // Mock data based on endpoint
    getMockData(endpoint) {
        // Children profiles
        if (endpoint.includes('/children/profiles')) {
            return getMockData('children');
        }

        // Individual child analytics
        if (endpoint.includes('/analytics')) {
            const childId = this.extractChildIdFromEndpoint(endpoint);
            if (childId) {
                const child = getMockData('children', []).find(c => c.id === childId);
                return child ? {
                    averageScore: child.averageScore,
                    subjectScores: child.subjectScores,
                    progressRate: 5.2,
                    studyTime: child.weeklyStats.studyHours * 60, // Convert to minutes
                    completionRate: 89,
                    engagementLevel: 82,
                    concentrationSpan: 45,
                    learningPeaks: [],
                    difficultyAreas: ['geometry', 'algebra'],
                    motivationTrends: [85, 87, 82, 90, 88]
                } : {};
            }
            return getMockData('dashboard.metrics');
        }

        // Historical progress data
        if (endpoint.includes('/progress/historical')) {
            return {
                daily: Array.from({ length: 30 }, (_, i) => ({
                    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    score: 70 + Math.random() * 30,
                    studyTime: 30 + Math.random() * 120,
                    completedExercises: Math.floor(Math.random() * 10)
                }))
            };
        }

        // Dashboard data
        if (endpoint.includes('/dashboard')) {
            return getMockData('dashboard');
        }

        // Messages data
        if (endpoint.includes('/messages')) {
            return getMockData('messages');
        }

        // Planning data
        if (endpoint.includes('/planning')) {
            return getMockData('planning');
        }

        // Psychology data
        if (endpoint.includes('/psychology')) {
            return getMockData('psychology');
        }

        // Reports data
        if (endpoint.includes('/reports')) {
            return getMockData('reports');
        }

        // Finance data
        if (endpoint.includes('/finance')) {
            return getMockData('finance');
        }

        // Community data
        if (endpoint.includes('/community')) {
            return getMockData('community');
        }

        // Settings data
        if (endpoint.includes('/settings')) {
            return getMockData('settings');
        }

        // AI analysis data
        if (endpoint.includes('/ai/analysis')) {
            const childId = this.extractChildIdFromEndpoint(endpoint);
            return {
                childId: childId,
                insights: getMockData('dashboard.aiInsight'),
                recommendations: getMockData(`psychology.emotionalState.${childId}.recommendations`, []),
                performance: getMockData(`dashboard.subjectPerformance.${childId}`, [])
            };
        }

        return {};
    }

    // Helper method to extract child ID from endpoint
    extractChildIdFromEndpoint(endpoint) {
        const matches = endpoint.match(/\/children\/([^\/]+)/) || endpoint.match(/\/analysis\/([^\/]+)/);
        return matches ? matches[1] : null;
    }

    // Health check
    async healthCheck() {
        try {
            const response = await fetch(`${this.baseURL}/health`);
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}

// Export singleton instance
export const apiConfig = new APIConfig();
export default apiConfig;