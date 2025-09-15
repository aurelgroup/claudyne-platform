/**
 * Claudyne Parent Interface - Child Analytics
 * Analytics avancées par enfant avec IA prédictive
 */

import { apiConfig } from './api-config.js';

export class ChildAnalytics {
    constructor(childId, options = {}) {
        this.childId = childId;
        this.options = {
            predictionDays: 30,
            analysisDepth: 'detailed',
            realTimeUpdates: true,
            ...options
        };

        this.metrics = new Map();
        this.predictions = new Map();
        this.patterns = [];
        this.recommendations = [];
    }

    async initialize() {
        console.log(`[ChildAnalytics] Initializing analytics for child: ${this.childId}`);

        await this.loadHistoricalData();
        this.setupRealTimeTracking();
        this.generatePredictions();

        console.log(`[ChildAnalytics] Analytics ready for ${this.childId}`);
    }

    async loadHistoricalData() {
        try {
            const endpoints = apiConfig.getParentEndpoints();
            const response = await apiConfig.fetch(endpoints.childAnalytics(this.childId));

            if (response.ok) {
                const data = await response.json();
                this.processHistoricalData(data);
            } else {
                this.loadMockData();
            }

        } catch (error) {
            console.error('[ChildAnalytics] Failed to load data:', error);
            this.loadMockData();
        }
    }

    processHistoricalData(data) {
        // Process performance metrics
        this.metrics.set('performance', {
            averageScore: data.averageScore || 0,
            subjectScores: new Map(Object.entries(data.subjectScores || {})),
            progressRate: data.progressRate || 0,
            studyTime: data.studyTime || 0,
            completionRate: data.completionRate || 0
        });

        // Process behavioral patterns
        this.metrics.set('behavior', {
            engagementLevel: data.engagementLevel || 0,
            concentrationSpan: data.concentrationSpan || 0,
            learningPeaks: data.learningPeaks || [],
            difficultyAreas: data.difficultyAreas || [],
            motivationTrends: data.motivationTrends || []
        });

        // Process comparative data
        this.metrics.set('comparative', {
            peerComparison: data.peerComparison || {},
            historicalTrends: data.historicalTrends || [],
            improvementAreas: data.improvementAreas || []
        });
    }

    setupRealTimeTracking() {
        if (!this.options.realTimeUpdates) return;

        // WebSocket connection for real-time updates
        this.connectWebSocket();

        // Performance observer for interaction tracking
        this.setupPerformanceTracking();
    }

    setupPerformanceTracking() {
        if (!window.PerformanceObserver) {
            console.warn('[ChildAnalytics] PerformanceObserver not supported');
            return;
        }

        try {
            // Track user interactions for engagement metrics
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (entry.entryType === 'measure') {
                        this.trackPerformanceEntry(entry);
                    }
                });
            });

            observer.observe({ entryTypes: ['measure'] });
            this.performanceObserver = observer;

        } catch (error) {
            console.error('[ChildAnalytics] Performance tracking setup failed:', error);
        }
    }

    trackPerformanceEntry(entry) {
        // Track performance metrics for engagement analysis
        const engagementData = {
            type: 'performance_metric',
            name: entry.name,
            duration: entry.duration,
            timestamp: entry.startTime + performance.timeOrigin
        };

        // Update behavior metrics based on performance data
        if (entry.name.includes('exercise') || entry.name.includes('lesson')) {
            this.updateBehaviorMetrics({
                engagement: Math.min(100, (entry.duration / 1000) * 10), // Convert to engagement score
                concentrationTime: entry.duration / 1000,
                timestamp: engagementData.timestamp
            });
        }
    }

    connectWebSocket() {
        try {
            const wsEndpoints = apiConfig.getWebSocketEndpoints();
            this.websocket = new WebSocket(wsEndpoints.childAnalytics(this.childId));

            this.websocket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.processRealTimeUpdate(data);
            };

            this.websocket.onerror = (error) => {
                console.error('[ChildAnalytics] WebSocket error:', error);
            };

            this.websocket.onclose = () => {
                console.log('[ChildAnalytics] WebSocket connection closed');
                // Only attempt to reconnect if not in development mode
                if (!apiConfig.shouldUseMockData()) {
                    setTimeout(() => this.connectWebSocket(), 5000);
                }
            };

        } catch (error) {
            console.error('[ChildAnalytics] WebSocket connection failed:', error);
        }
    }

    processRealTimeUpdate(data) {
        switch (data.type) {
            case 'exercise_completed':
                this.updatePerformanceMetrics(data.payload);
                break;
            case 'behavior_update':
                this.updateBehaviorMetrics(data.payload);
                break;
            case 'learning_pattern':
                this.addLearningPattern(data.payload);
                break;
        }

        this.generatePredictions();
        this.triggerUpdate();
    }

    updatePerformanceMetrics(data) {
        const performance = this.metrics.get('performance');
        if (!performance) return;

        // Update average score
        const newScore = data.score;
        const currentAvg = performance.averageScore;
        const sessionCount = data.sessionCount || 1;

        performance.averageScore = ((currentAvg * (sessionCount - 1)) + newScore) / sessionCount;

        // Update subject scores
        if (data.subject) {
            performance.subjectScores.set(data.subject, newScore);
        }

        // Update study time
        performance.studyTime += data.duration || 0;

        // Calculate progress rate
        performance.progressRate = this.calculateProgressRate();

        this.metrics.set('performance', performance);
    }

    updateBehaviorMetrics(data) {
        const behavior = this.metrics.get('behavior');
        if (!behavior) return;

        // Update engagement level
        if (data.engagement !== undefined) {
            behavior.engagementLevel = data.engagement;
        }

        // Update concentration span
        if (data.concentrationTime) {
            behavior.concentrationSpan = data.concentrationTime;
        }

        // Add learning peaks
        if (data.learningPeak) {
            behavior.learningPeaks.push({
                time: data.timestamp,
                intensity: data.learningPeak,
                subject: data.subject
            });
        }

        this.metrics.set('behavior', behavior);
    }

    addLearningPattern(pattern) {
        this.patterns.push({
            ...pattern,
            timestamp: Date.now(),
            childId: this.childId
        });

        // Keep only recent patterns
        if (this.patterns.length > 100) {
            this.patterns = this.patterns.slice(-100);
        }
    }

    generatePredictions() {
        const performance = this.metrics.get('performance');
        const behavior = this.metrics.get('behavior');

        if (!performance || !behavior) return;

        // Predict next week performance
        const nextWeekPrediction = this.predictPerformance(7);

        // Predict learning difficulties
        const difficultyPrediction = this.predictDifficulties();

        // Predict optimal study times
        const optimalTimes = this.predictOptimalStudyTimes();

        this.predictions.set('performance', nextWeekPrediction);
        this.predictions.set('difficulties', difficultyPrediction);
        this.predictions.set('optimal_times', optimalTimes);

        // Generate recommendations based on predictions
        this.generateRecommendations();
    }

    predictPerformance(days) {
        const performance = this.metrics.get('performance');
        const currentTrend = performance.progressRate;

        // Simple linear prediction (in real app, use ML model)
        const prediction = {
            expectedScore: Math.min(100, performance.averageScore + (currentTrend * days)),
            confidence: this.calculateConfidence(),
            factors: this.getPerformanceFactors(),
            recommendations: []
        };

        return prediction;
    }

    predictDifficulties() {
        const behavior = this.metrics.get('behavior');
        const performance = this.metrics.get('performance');

        const difficulties = [];

        // Analyze subject scores for potential difficulties
        performance.subjectScores.forEach((score, subject) => {
            if (score < 70) {
                difficulties.push({
                    subject: subject,
                    severity: this.calculateSeverity(score),
                    probability: this.calculateDifficultyProbability(subject),
                    suggestedActions: this.getSuggestedActions(subject, score)
                });
            }
        });

        return difficulties;
    }

    predictOptimalStudyTimes() {
        const behavior = this.metrics.get('behavior');
        const peaks = behavior.learningPeaks || [];

        // Analyze learning peaks to find optimal times
        const timeAnalysis = new Map();

        peaks.forEach(peak => {
            const hour = new Date(peak.time).getHours();
            const current = timeAnalysis.get(hour) || { total: 0, count: 0 };
            current.total += peak.intensity;
            current.count += 1;
            timeAnalysis.set(hour, current);
        });

        // Find top 3 optimal hours
        const optimalHours = Array.from(timeAnalysis.entries())
            .map(([hour, data]) => ({
                hour: parseInt(hour),
                averageIntensity: data.total / data.count,
                frequency: data.count
            }))
            .sort((a, b) => b.averageIntensity - a.averageIntensity)
            .slice(0, 3);

        return optimalHours;
    }

    generateRecommendations() {
        this.recommendations = [];

        const performance = this.metrics.get('performance');
        const predictions = this.predictions.get('difficulties') || [];

        // Performance-based recommendations
        if (performance.averageScore < 75) {
            this.recommendations.push({
                type: 'performance_improvement',
                priority: 'high',
                title: 'Amélioration des performances',
                description: 'Des sessions d\'étude supplémentaires sont recommandées',
                action: 'schedule_extra_sessions',
                estimatedImpact: '+15% performance'
            });
        }

        // Difficulty-based recommendations
        predictions.forEach(difficulty => {
            if (difficulty.severity === 'high') {
                this.recommendations.push({
                    type: 'difficulty_support',
                    priority: 'urgent',
                    title: `Support en ${difficulty.subject}`,
                    description: `Difficultés détectées en ${difficulty.subject}`,
                    action: 'ai_tutoring_session',
                    estimatedImpact: difficulty.suggestedActions[0]
                });
            }
        });

        // Time optimization recommendations
        const optimalTimes = this.predictions.get('optimal_times') || [];
        if (optimalTimes.length > 0) {
            this.recommendations.push({
                type: 'time_optimization',
                priority: 'medium',
                title: 'Optimisation des horaires',
                description: `Meilleure performance à ${optimalTimes[0].hour}h`,
                action: 'schedule_optimization',
                estimatedImpact: '+10% efficacité'
            });
        }
    }

    // Comparative analytics
    async compareWithPeers() {
        try {
            const endpoints = apiConfig.getParentEndpoints();
            const response = await apiConfig.fetch(endpoints.childComparison(this.childId));

            if (response.ok) {
                return await response.json();
            }

            return this.getMockComparison();

        } catch (error) {
            console.error('[ChildAnalytics] Comparison failed:', error);
            return this.getMockComparison();
        }
    }

    async compareWithSiblings() {
        try {
            const endpoints = apiConfig.getParentEndpoints();
            const response = await apiConfig.fetch(endpoints.siblingComparison(this.childId));

            if (response.ok) {
                return await response.json();
            }

            return this.getMockSiblingComparison();

        } catch (error) {
            console.error('[ChildAnalytics] Sibling comparison failed:', error);
            return this.getMockSiblingComparison();
        }
    }

    // Helper methods
    calculateProgressRate() {
        const performance = this.metrics.get('performance');
        const recentScores = this.getRecentScores(7); // Last 7 days

        if (recentScores.length < 2) return 0;

        const firstScore = recentScores[0];
        const lastScore = recentScores[recentScores.length - 1];

        return ((lastScore - firstScore) / firstScore) * 100;
    }

    calculateConfidence() {
        const dataPoints = this.patterns.length;
        const recency = this.getDataRecency();

        // Confidence based on data quantity and recency
        const baseConfidence = Math.min(dataPoints / 50, 1) * 0.7;
        const recencyBonus = recency * 0.3;

        return Math.min(baseConfidence + recencyBonus, 0.95);
    }

    calculateSeverity(score) {
        if (score < 50) return 'high';
        if (score < 65) return 'medium';
        return 'low';
    }

    calculateDifficultyProbability(subject) {
        const performance = this.metrics.get('performance');
        const subjectScore = performance.subjectScores.get(subject) || 0;

        return Math.max(0, (75 - subjectScore) / 75);
    }

    getSuggestedActions(subject, score) {
        const actions = [];

        if (score < 50) {
            actions.push('Session IA intensive recommandée');
            actions.push('Révision des bases nécessaire');
        } else if (score < 65) {
            actions.push('Exercices supplémentaires');
            actions.push('Session de soutien');
        }

        return actions;
    }

    getPerformanceFactors() {
        return [
            'Régularité des sessions',
            'Concentration en classe',
            'Temps d\'étude quotidien',
            'Compréhension des concepts'
        ];
    }

    getRecentScores(days) {
        // Mock implementation - would get real data from API
        return [78, 82, 79, 85, 88, 87, 90];
    }

    getDataRecency() {
        if (this.patterns.length === 0) return 0;

        const latestPattern = this.patterns[this.patterns.length - 1];
        const hoursSinceUpdate = (Date.now() - latestPattern.timestamp) / (1000 * 60 * 60);

        return Math.max(0, 1 - (hoursSinceUpdate / 24)); // Decay over 24 hours
    }

    // Mock data methods
    loadMockData() {
        this.metrics.set('performance', {
            averageScore: 85,
            subjectScores: new Map([
                ['math', 78],
                ['french', 92],
                ['physics', 82],
                ['chemistry', 79]
            ]),
            progressRate: 5.2,
            studyTime: 120, // minutes
            completionRate: 89
        });

        this.metrics.set('behavior', {
            engagementLevel: 82,
            concentrationSpan: 45, // minutes
            learningPeaks: [
                { time: Date.now() - 3600000, intensity: 0.9, subject: 'math' },
                { time: Date.now() - 7200000, intensity: 0.8, subject: 'french' }
            ],
            difficultyAreas: ['geometry', 'algebra'],
            motivationTrends: [85, 87, 82, 90, 88]
        });
    }

    getMockComparison() {
        return {
            percentile: 78,
            averageScore: 82,
            childScore: 85,
            topPerformers: 3,
            totalPeers: 125,
            strengths: ['French', 'History'],
            improvements: ['Mathematics']
        };
    }

    getMockSiblingComparison() {
        return {
            siblings: [
                {
                    name: 'Blandine',
                    averageScore: 92,
                    strongSubjects: ['French', 'History'],
                    comparison: 'performing_better'
                }
            ],
            familyAverage: 88.5,
            recommendations: [
                'Peer learning sessions between siblings',
                'Competitive study challenges'
            ]
        };
    }

    // Utility methods
    getAuthHeaders() {
        return apiConfig.getAuthHeaders();
    }

    triggerUpdate() {
        // Dispatch custom event for UI updates
        window.dispatchEvent(new CustomEvent('childAnalyticsUpdate', {
            detail: {
                childId: this.childId,
                metrics: this.metrics,
                predictions: this.predictions,
                recommendations: this.recommendations
            }
        }));
    }

    // Public API
    getMetrics() {
        return Object.fromEntries(this.metrics);
    }

    getPredictions() {
        return Object.fromEntries(this.predictions);
    }

    getRecommendations() {
        return [...this.recommendations];
    }

    async refresh() {
        await this.loadHistoricalData();
        this.generatePredictions();
        this.triggerUpdate();
    }

    disconnect() {
        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
        }
    }
}

export default ChildAnalytics;