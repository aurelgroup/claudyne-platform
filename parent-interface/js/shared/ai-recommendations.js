/**
 * Claudyne Parent Interface - AI Recommendations Engine
 * Moteur de recommandations IA pour optimisation pédagogique
 */

import { apiConfig } from './api-config.js';

export class AIRecommendationsEngine {
    constructor(options = {}) {
        this.options = {
            apiEndpoint: '/api/ai/recommendations',
            realTimeUpdates: true,
            confidenceThreshold: 0.7,
            maxRecommendations: 10,
            ...options
        };

        this.recommendations = [];
        this.learningPatterns = new Map();
        this.childProfiles = new Map();
        this.websocket = null;
        this.isConnected = false;
    }

    async initialize() {
        console.log('[AIRecommendations] Initializing AI recommendations engine...');

        await this.loadChildProfiles();
        this.setupWebSocket();
        this.startAnalysisEngine();

        console.log('[AIRecommendations] AI recommendations engine ready');
    }

    async setupWebSocket() {
        if (!this.options.realTimeUpdates) return;

        try {
            const wsEndpoints = apiConfig.getWebSocketEndpoints();
            this.websocket = new WebSocket(wsEndpoints.aiRecommendations);

            this.websocket.onopen = () => {
                console.log('[AIRecommendations] WebSocket connected');
                this.isConnected = true;
                this.subscribeToUpdates();
            };

            this.websocket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleRealTimeRecommendation(data);
            };

            this.websocket.onclose = () => {
                console.log('[AIRecommendations] WebSocket disconnected');
                this.isConnected = false;
                // Only attempt to reconnect if not in development mode
                if (!apiConfig.shouldUseMockData()) {
                    setTimeout(() => this.setupWebSocket(), 5000);
                }
            };

        } catch (error) {
            console.error('[AIRecommendations] WebSocket setup failed:', error);
        }
    }

    subscribeToUpdates() {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify({
                type: 'subscribe',
                channels: ['child_analysis', 'learning_patterns', 'performance_insights'],
                userId: this.getUserId()
            }));
        }
    }

    handleRealTimeRecommendation(data) {
        switch (data.type) {
            case 'new_recommendation':
                this.addRecommendation(data.payload);
                break;
            case 'pattern_detected':
                this.updateLearningPattern(data.payload);
                break;
            case 'performance_insight':
                this.processPerformanceInsight(data.payload);
                break;
            case 'urgent_intervention':
                this.handleUrgentIntervention(data.payload);
                break;
        }
    }

    async loadChildProfiles() {
        try {
            const endpoints = apiConfig.getParentEndpoints();
            const response = await apiConfig.fetch(endpoints.childrenProfiles);

            if (response.ok) {
                const profiles = await response.json();
                profiles.forEach(profile => {
                    this.childProfiles.set(profile.id, profile);
                });
            } else {
                this.loadMockProfiles();
            }

        } catch (error) {
            console.error('[AIRecommendations] Failed to load profiles:', error);
            this.loadMockProfiles();
        }
    }

    startAnalysisEngine() {
        // Run analysis every 5 minutes
        setInterval(() => {
            this.runPeriodicAnalysis();
        }, 5 * 60 * 1000);

        // Run initial analysis
        setTimeout(() => this.runPeriodicAnalysis(), 1000);
    }

    async runPeriodicAnalysis() {
        console.log('[AIRecommendations] Running periodic analysis...');

        for (const [childId, profile] of this.childProfiles) {
            try {
                const recommendations = await this.analyzeChild(childId, profile);
                recommendations.forEach(rec => this.addRecommendation(rec));
            } catch (error) {
                console.error(`[AIRecommendations] Analysis failed for child ${childId}:`, error);
            }
        }

        this.pruneOldRecommendations();
        this.triggerUpdate();
    }

    async analyzeChild(childId, profile) {
        const analysis = await this.getChildAnalysis(childId);
        const recommendations = [];

        // Performance analysis
        const performanceRecs = this.analyzePerformance(childId, analysis.performance);
        recommendations.push(...performanceRecs);

        // Learning pattern analysis
        const patternRecs = this.analyzeLearningPatterns(childId, analysis.patterns);
        recommendations.push(...patternRecs);

        // Behavioral analysis
        const behaviorRecs = this.analyzeBehavior(childId, analysis.behavior);
        recommendations.push(...behaviorRecs);

        // Time optimization analysis
        const timeRecs = this.analyzeTimeOptimization(childId, analysis.timeData);
        recommendations.push(...timeRecs);

        return recommendations.filter(rec => rec.confidence >= this.options.confidenceThreshold);
    }

    analyzePerformance(childId, performance) {
        const recommendations = [];
        const profile = this.childProfiles.get(childId);

        // Low score detection
        if (performance.averageScore < 70) {
            recommendations.push({
                id: this.generateId(),
                childId: childId,
                type: 'performance_improvement',
                priority: 'high',
                confidence: 0.9,
                title: 'Amélioration Performance Urgente',
                description: `Score moyen de ${performance.averageScore}% nécessite une intervention`,
                actions: [
                    {
                        type: 'ai_tutoring',
                        title: 'Session IA Intensive',
                        duration: 60,
                        subjects: this.getWeakSubjects(performance.subjectScores)
                    },
                    {
                        type: 'review_basics',
                        title: 'Révision des Fondamentaux',
                        priority: 'immediate'
                    }
                ],
                estimatedImpact: '+15-20% performance',
                timeframe: '2 semaines',
                reasoning: 'Modèle IA détecte des lacunes critiques nécessitant intervention rapide'
            });
        }

        // Subject-specific recommendations
        Object.entries(performance.subjectScores).forEach(([subject, score]) => {
            if (score < 75) {
                recommendations.push({
                    id: this.generateId(),
                    childId: childId,
                    type: 'subject_improvement',
                    priority: score < 60 ? 'high' : 'medium',
                    confidence: 0.85,
                    title: `Soutien en ${subject}`,
                    description: `Score de ${score}% en ${subject} en dessous du potentiel`,
                    actions: [
                        {
                            type: 'targeted_exercises',
                            subject: subject,
                            difficulty: this.calculateOptimalDifficulty(score),
                            frequency: 'daily'
                        }
                    ],
                    estimatedImpact: `+${20 - (score/5)}% en ${subject}`,
                    timeframe: '3 semaines'
                });
            }
        });

        // Trend analysis
        if (performance.trend === 'declining') {
            recommendations.push({
                id: this.generateId(),
                childId: childId,
                type: 'trend_intervention',
                priority: 'high',
                confidence: 0.88,
                title: 'Intervention Tendance Déclinante',
                description: 'Baisse de performance détectée sur les dernières semaines',
                actions: [
                    {
                        type: 'motivation_boost',
                        title: 'Session Motivation',
                        methods: ['gamification', 'rewards', 'peer_interaction']
                    },
                    {
                        type: 'learning_style_analysis',
                        title: 'Analyse Style d\'Apprentissage'
                    }
                ],
                estimatedImpact: 'Arrêt de la baisse, +10% motivation',
                timeframe: '1 semaine'
            });
        }

        return recommendations;
    }

    analyzeLearningPatterns(childId, patterns) {
        const recommendations = [];

        // Optimal learning time detection
        const optimalTimes = this.detectOptimalLearningTimes(patterns);
        if (optimalTimes.length > 0) {
            recommendations.push({
                id: this.generateId(),
                childId: childId,
                type: 'time_optimization',
                priority: 'medium',
                confidence: 0.82,
                title: 'Optimisation Horaires d\'Étude',
                description: `Performance optimale détectée à ${optimalTimes[0].hour}h`,
                actions: [
                    {
                        type: 'schedule_adjustment',
                        optimalTimes: optimalTimes,
                        currentSchedule: patterns.currentSchedule
                    }
                ],
                estimatedImpact: '+15% efficacité d\'apprentissage',
                timeframe: 'Immédiat'
            });
        }

        // Learning style adaptation
        const dominantStyle = this.detectLearningStyle(patterns);
        if (dominantStyle.confidence > 0.8) {
            recommendations.push({
                id: this.generateId(),
                childId: childId,
                type: 'learning_style_adaptation',
                priority: 'medium',
                confidence: dominantStyle.confidence,
                title: `Adaptation Style ${dominantStyle.style}`,
                description: `Style d'apprentissage ${dominantStyle.style} identifié`,
                actions: [
                    {
                        type: 'content_adaptation',
                        style: dominantStyle.style,
                        methods: this.getMethodsForStyle(dominantStyle.style)
                    }
                ],
                estimatedImpact: '+20% engagement',
                timeframe: '1 semaine'
            });
        }

        return recommendations;
    }

    analyzeBehavior(childId, behavior) {
        const recommendations = [];

        // Attention span optimization
        if (behavior.averageAttentionSpan < 30) {
            recommendations.push({
                id: this.generateId(),
                childId: childId,
                type: 'attention_improvement',
                priority: 'medium',
                confidence: 0.79,
                title: 'Amélioration Attention',
                description: `Durée d'attention de ${behavior.averageAttentionSpan}min peut être améliorée`,
                actions: [
                    {
                        type: 'micro_sessions',
                        duration: 15,
                        frequency: 'high',
                        breaks: 'gamified'
                    },
                    {
                        type: 'focus_exercises',
                        techniques: ['mindfulness', 'breathing', 'visualization']
                    }
                ],
                estimatedImpact: '+50% durée d\'attention',
                timeframe: '4 semaines'
            });
        }

        // Stress level management
        if (behavior.stressLevel > 0.7) {
            recommendations.push({
                id: this.generateId(),
                childId: childId,
                type: 'stress_management',
                priority: 'high',
                confidence: 0.91,
                title: 'Gestion du Stress',
                description: 'Niveau de stress élevé détecté',
                actions: [
                    {
                        type: 'relaxation_sessions',
                        frequency: 'daily',
                        duration: 10
                    },
                    {
                        type: 'workload_adjustment',
                        reduction: 20
                    }
                ],
                estimatedImpact: 'Réduction stress 40%',
                timeframe: '1 semaine'
            });
        }

        return recommendations;
    }

    analyzeTimeOptimization(childId, timeData) {
        const recommendations = [];

        // Study session length optimization
        const optimalDuration = this.calculateOptimalSessionDuration(timeData);
        if (Math.abs(optimalDuration - timeData.averageDuration) > 10) {
            recommendations.push({
                id: this.generateId(),
                childId: childId,
                type: 'session_duration_optimization',
                priority: 'low',
                confidence: 0.75,
                title: 'Optimisation Durée Sessions',
                description: `Durée optimale estimée: ${optimalDuration}min vs actuel ${timeData.averageDuration}min`,
                actions: [
                    {
                        type: 'duration_adjustment',
                        currentDuration: timeData.averageDuration,
                        optimalDuration: optimalDuration,
                        gradualChange: true
                    }
                ],
                estimatedImpact: '+12% productivité',
                timeframe: '2 semaines'
            });
        }

        return recommendations;
    }

    // Recommendation management
    addRecommendation(recommendation) {
        // Check for duplicates
        const exists = this.recommendations.find(r =>
            r.childId === recommendation.childId &&
            r.type === recommendation.type
        );

        if (exists) {
            // Update existing recommendation
            Object.assign(exists, recommendation);
        } else {
            // Add new recommendation
            recommendation.timestamp = Date.now();
            recommendation.status = 'pending';
            this.recommendations.push(recommendation);
        }

        // Limit total recommendations
        if (this.recommendations.length > this.options.maxRecommendations) {
            this.recommendations.sort((a, b) => b.priority === 'high' ? 1 : -1);
            this.recommendations = this.recommendations.slice(0, this.options.maxRecommendations);
        }
    }

    updateLearningPattern(pattern) {
        this.learningPatterns.set(pattern.id, {
            ...pattern,
            lastUpdated: Date.now()
        });
    }

    processPerformanceInsight(insight) {
        console.log('[AIRecommendations] Processing insight:', insight);

        // Generate recommendations based on insight
        const recommendations = this.generateInsightRecommendations(insight);
        recommendations.forEach(rec => this.addRecommendation(rec));
    }

    handleUrgentIntervention(intervention) {
        console.warn('[AIRecommendations] Urgent intervention required:', intervention);

        const urgentRec = {
            id: this.generateId(),
            childId: intervention.childId,
            type: 'urgent_intervention',
            priority: 'urgent',
            confidence: 0.95,
            title: intervention.title,
            description: intervention.description,
            actions: intervention.actions,
            estimatedImpact: intervention.impact,
            timeframe: 'Immédiat',
            urgent: true
        };

        this.addRecommendation(urgentRec);
        this.triggerUrgentNotification(urgentRec);
    }

    pruneOldRecommendations() {
        const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days
        this.recommendations = this.recommendations.filter(rec =>
            rec.timestamp > cutoff || rec.status === 'active'
        );
    }

    // Helper methods
    async getChildAnalysis(childId) {
        try {
            const endpoints = apiConfig.getAIEndpoints();
            const response = await apiConfig.fetch(endpoints.childAnalysis(childId));

            if (response.ok) {
                return await response.json();
            }

            return this.getMockAnalysis(childId);

        } catch (error) {
            console.error('[AIRecommendations] Analysis fetch failed:', error);
            return this.getMockAnalysis(childId);
        }
    }

    getWeakSubjects(subjectScores) {
        return Object.entries(subjectScores)
            .filter(([_, score]) => score < 75)
            .map(([subject, _]) => subject);
    }

    calculateOptimalDifficulty(currentScore) {
        if (currentScore < 50) return 'basic';
        if (currentScore < 70) return 'intermediate';
        return 'advanced';
    }

    detectOptimalLearningTimes(patterns) {
        // Mock implementation - in real app, use ML analysis
        return [
            { hour: 9, efficiency: 0.92, confidence: 0.85 },
            { hour: 15, efficiency: 0.88, confidence: 0.79 }
        ];
    }

    detectLearningStyle(patterns) {
        // Mock implementation - in real app, analyze actual patterns
        return {
            style: 'visual',
            confidence: 0.84,
            indicators: ['image_interactions', 'diagram_time', 'color_preferences']
        };
    }

    getMethodsForStyle(style) {
        const methods = {
            visual: ['diagrams', 'charts', 'colors', 'images'],
            auditory: ['explanations', 'discussions', 'music', 'repetition'],
            kinesthetic: ['hands_on', 'movement', 'experiments', 'practice']
        };

        return methods[style] || methods.visual;
    }

    calculateOptimalSessionDuration(timeData) {
        // Mock calculation - in real app, use attention span data
        const baseOptimal = 45; // minutes
        const attentionFactor = timeData.attentionSpan / 30;
        return Math.round(baseOptimal * attentionFactor);
    }

    generateInsightRecommendations(insight) {
        // Generate recommendations based on AI insights
        return [{
            id: this.generateId(),
            childId: insight.childId,
            type: 'ai_insight',
            priority: insight.priority || 'medium',
            confidence: insight.confidence || 0.8,
            title: insight.title,
            description: insight.description,
            actions: insight.suggestedActions || [],
            estimatedImpact: insight.estimatedImpact,
            timeframe: insight.timeframe || '1 semaine'
        }];
    }

    // Mock data methods
    loadMockProfiles() {
        this.childProfiles.set('richy', {
            id: 'richy',
            name: 'Richy',
            age: 16,
            grade: 'Première',
            learningStyle: 'visual',
            subjects: ['math', 'physics', 'chemistry', 'french']
        });

        this.childProfiles.set('blandine', {
            id: 'blandine',
            name: 'Blandine',
            age: 14,
            grade: 'Troisième',
            learningStyle: 'auditory',
            subjects: ['french', 'history', 'geography', 'english']
        });
    }

    getMockAnalysis(childId) {
        return {
            performance: {
                averageScore: childId === 'richy' ? 78 : 92,
                subjectScores: childId === 'richy' ?
                    { math: 75, physics: 82, chemistry: 79, french: 76 } :
                    { french: 95, history: 91, geography: 89, english: 93 },
                trend: childId === 'richy' ? 'declining' : 'improving'
            },
            patterns: {
                optimalTimes: [9, 15],
                currentSchedule: [16, 19],
                learningStyle: childId === 'richy' ? 'visual' : 'auditory'
            },
            behavior: {
                averageAttentionSpan: childId === 'richy' ? 25 : 40,
                stressLevel: childId === 'richy' ? 0.8 : 0.3,
                engagementLevel: childId === 'richy' ? 0.6 : 0.9
            },
            timeData: {
                averageDuration: 60,
                attentionSpan: childId === 'richy' ? 25 : 40
            }
        };
    }

    // Utility methods
    generateId() {
        return 'rec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getUserId() {
        return localStorage.getItem('parentUserId') || 'parent';
    }

    getAuthHeaders() {
        return apiConfig.getAuthHeaders();
    }

    triggerUpdate() {
        window.dispatchEvent(new CustomEvent('aiRecommendationsUpdate', {
            detail: {
                recommendations: this.recommendations,
                patterns: Object.fromEntries(this.learningPatterns)
            }
        }));
    }

    triggerUrgentNotification(recommendation) {
        window.dispatchEvent(new CustomEvent('urgentRecommendation', {
            detail: recommendation
        }));
    }

    // Public API
    getRecommendations(childId = null) {
        if (childId) {
            return this.recommendations.filter(rec => rec.childId === childId);
        }
        return [...this.recommendations];
    }

    getRecommendationsByPriority(priority) {
        return this.recommendations.filter(rec => rec.priority === priority);
    }

    async executeRecommendation(recommendationId) {
        const recommendation = this.recommendations.find(r => r.id === recommendationId);
        if (!recommendation) return false;

        try {
            const response = await fetch(`/api/ai/recommendations/${recommendationId}/execute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders()
                }
            });

            if (response.ok) {
                recommendation.status = 'executed';
                recommendation.executedAt = Date.now();
                return true;
            }

            return false;

        } catch (error) {
            console.error('[AIRecommendations] Execution failed:', error);
            return false;
        }
    }

    dismissRecommendation(recommendationId) {
        const index = this.recommendations.findIndex(r => r.id === recommendationId);
        if (index > -1) {
            this.recommendations[index].status = 'dismissed';
            this.recommendations[index].dismissedAt = Date.now();
            return true;
        }
        return false;
    }

    async refresh() {
        await this.loadChildProfiles();
        await this.runPeriodicAnalysis();
    }

    disconnect() {
        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
        }
        this.isConnected = false;
    }
}

export { AIRecommendationsEngine };
export default AIRecommendationsEngine;