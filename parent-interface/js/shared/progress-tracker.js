/**
 * Claudyne Parent Interface - Progress Tracker
 * Suivi avancé des progrès avec analytics prédictives
 */

import { apiConfig } from './api-config.js';

export class ProgressTracker {
    constructor(options = {}) {
        this.options = {
            trackingInterval: 60000, // 1 minute
            predictionHorizon: 30, // 30 days
            confidenceThreshold: 0.7,
            dataRetention: 90, // 90 days
            ...options
        };

        this.progressData = new Map();
        this.milestones = new Map();
        this.predictions = new Map();
        this.trackingActive = false;
        this.observers = [];
    }

    async initialize() {
        console.log('[ProgressTracker] Initializing progress tracker...');

        await this.loadHistoricalData();
        this.setupMilestones();
        this.startTracking();

        console.log('[ProgressTracker] Progress tracker ready');
    }

    async loadHistoricalData() {
        try {
            const endpoints = apiConfig.getParentEndpoints();
            const response = await apiConfig.fetch(endpoints.progressHistorical);

            if (response.ok) {
                const data = await response.json();
                this.processHistoricalData(data);
            } else {
                this.loadMockData();
            }

        } catch (error) {
            console.error('[ProgressTracker] Failed to load historical data:', error);
            this.loadMockData();
        }
    }

    processHistoricalData(data) {
        data.children?.forEach(child => {
            this.progressData.set(child.id, {
                id: child.id,
                name: child.name,
                sessions: child.sessions || [],
                scores: child.scores || [],
                timeSpent: child.timeSpent || [],
                subjects: new Map(Object.entries(child.subjects || {})),
                achievements: child.achievements || [],
                trends: child.trends || {},
                lastUpdate: child.lastUpdate || Date.now()
            });
        });

        data.milestones?.forEach(milestone => {
            this.milestones.set(milestone.id, milestone);
        });
    }

    setupMilestones() {
        // Academic milestones
        this.addMilestone({
            id: 'academic_excellence',
            title: 'Excellence Académique',
            description: 'Maintenir une moyenne de 85% pendant 4 semaines',
            type: 'academic',
            target: 85,
            duration: 28, // days
            reward: 'badge_excellence'
        });

        this.addMilestone({
            id: 'consistency_champion',
            title: 'Champion de Régularité',
            description: 'Compléter toutes les sessions pendant 2 semaines',
            type: 'consistency',
            target: 100,
            duration: 14,
            reward: 'badge_consistency'
        });

        // Subject-specific milestones
        this.addMilestone({
            id: 'math_mastery',
            title: 'Maîtrise Mathématiques',
            description: 'Atteindre 90% en mathématiques',
            type: 'subject',
            subject: 'math',
            target: 90,
            reward: 'badge_math_master'
        });

        // Time-based milestones
        this.addMilestone({
            id: 'study_marathon',
            title: 'Marathon d\'Étude',
            description: 'Accumuler 50 heures d\'étude',
            type: 'time',
            target: 50 * 60, // minutes
            reward: 'badge_marathon'
        });
    }

    startTracking() {
        if (this.trackingActive) return;

        this.trackingActive = true;

        // Track progress every minute
        this.trackingInterval = setInterval(() => {
            this.recordProgressSnapshot();
        }, this.options.trackingInterval);

        // Generate predictions every 5 minutes
        this.predictionInterval = setInterval(() => {
            this.generatePredictions();
        }, 5 * 60 * 1000);

        console.log('[ProgressTracker] Tracking started');
    }

    stopTracking() {
        this.trackingActive = false;

        if (this.trackingInterval) {
            clearInterval(this.trackingInterval);
            this.trackingInterval = null;
        }

        if (this.predictionInterval) {
            clearInterval(this.predictionInterval);
            this.predictionInterval = null;
        }

        console.log('[ProgressTracker] Tracking stopped');
    }

    recordProgressSnapshot() {
        this.progressData.forEach((childData, childId) => {
            const snapshot = this.createProgressSnapshot(childId);
            if (snapshot) {
                this.addProgressPoint(childId, snapshot);
                this.checkMilestones(childId, snapshot);
            }
        });
    }

    createProgressSnapshot(childId) {
        // Get current session data (if any)
        const currentSession = this.getCurrentSession(childId);
        if (!currentSession) return null;

        return {
            timestamp: Date.now(),
            sessionId: currentSession.id,
            score: currentSession.currentScore,
            timeSpent: currentSession.elapsedTime,
            subject: currentSession.subject,
            exercisesCompleted: currentSession.exercisesCompleted,
            correctAnswers: currentSession.correctAnswers,
            totalAnswers: currentSession.totalAnswers,
            engagement: this.calculateEngagement(currentSession),
            difficulty: currentSession.difficulty
        };
    }

    addProgressPoint(childId, snapshot) {
        const childData = this.progressData.get(childId);
        if (!childData) return;

        // Add to sessions
        childData.sessions.push(snapshot);

        // Update scores array
        childData.scores.push({
            timestamp: snapshot.timestamp,
            score: snapshot.score,
            subject: snapshot.subject
        });

        // Update time spent
        childData.timeSpent.push({
            timestamp: snapshot.timestamp,
            duration: snapshot.timeSpent,
            subject: snapshot.subject
        });

        // Update subject progress
        const subjectData = childData.subjects.get(snapshot.subject) || {
            totalTime: 0,
            totalSessions: 0,
            averageScore: 0,
            lastScore: 0,
            trend: 'stable'
        };

        subjectData.totalTime += snapshot.timeSpent;
        subjectData.totalSessions += 1;
        subjectData.lastScore = snapshot.score;
        subjectData.averageScore = this.calculateSubjectAverage(childId, snapshot.subject);
        subjectData.trend = this.calculateTrend(childId, snapshot.subject);

        childData.subjects.set(snapshot.subject, subjectData);
        childData.lastUpdate = Date.now();

        // Notify observers
        this.notifyObservers('progress_update', { childId, snapshot });
    }

    checkMilestones(childId, snapshot) {
        this.milestones.forEach((milestone, milestoneId) => {
            const progress = this.calculateMilestoneProgress(childId, milestone);

            if (progress.completed && !progress.alreadyAwarded) {
                this.awardMilestone(childId, milestoneId, milestone);
            } else if (progress.percentage >= 80 && !progress.nearCompletionNotified) {
                this.notifyNearCompletion(childId, milestoneId, milestone, progress);
            }
        });
    }

    calculateMilestoneProgress(childId, milestone) {
        const childData = this.progressData.get(childId);
        if (!childData) return { percentage: 0, completed: false };

        let progress = 0;
        let completed = false;

        switch (milestone.type) {
            case 'academic':
                progress = this.calculateAcademicProgress(childData, milestone);
                break;
            case 'consistency':
                progress = this.calculateConsistencyProgress(childData, milestone);
                break;
            case 'subject':
                progress = this.calculateSubjectProgress(childData, milestone);
                break;
            case 'time':
                progress = this.calculateTimeProgress(childData, milestone);
                break;
        }

        completed = progress >= milestone.target;

        return {
            percentage: Math.min((progress / milestone.target) * 100, 100),
            completed,
            currentValue: progress,
            targetValue: milestone.target,
            alreadyAwarded: this.isMilestoneAwarded(childId, milestone.id),
            nearCompletionNotified: this.isNearCompletionNotified(childId, milestone.id)
        };
    }

    calculateAcademicProgress(childData, milestone) {
        const recentScores = this.getRecentScores(childData, milestone.duration);
        if (recentScores.length === 0) return 0;

        const averageScore = recentScores.reduce((sum, score) => sum + score.score, 0) / recentScores.length;
        const consistentDays = this.getConsistentDays(recentScores, milestone.target);

        return consistentDays >= milestone.duration ? averageScore : 0;
    }

    calculateConsistencyProgress(childData, milestone) {
        const recentSessions = this.getRecentSessions(childData, milestone.duration);
        const daysWithSessions = new Set(
            recentSessions.map(session =>
                new Date(session.timestamp).toDateString()
            )
        ).size;

        return daysWithSessions;
    }

    calculateSubjectProgress(childData, milestone) {
        const subjectData = childData.subjects.get(milestone.subject);
        return subjectData ? subjectData.averageScore : 0;
    }

    calculateTimeProgress(childData, milestone) {
        const totalTime = childData.timeSpent.reduce((sum, time) => sum + time.duration, 0);
        return totalTime;
    }

    awardMilestone(childId, milestoneId, milestone) {
        const award = {
            milestoneId,
            childId,
            title: milestone.title,
            description: milestone.description,
            reward: milestone.reward,
            awardedAt: Date.now(),
            points: this.calculateMilestonePoints(milestone)
        };

        const childData = this.progressData.get(childId);
        if (childData) {
            childData.achievements.push(award);
        }

        // Send notification
        this.notifyObservers('milestone_achieved', award);

        // Send to server
        this.syncMilestoneAward(award);

        console.log(`[ProgressTracker] Milestone awarded: ${milestone.title} to ${childId}`);
    }

    generatePredictions() {
        this.progressData.forEach((childData, childId) => {
            const predictions = this.predictProgress(childId, childData);
            this.predictions.set(childId, predictions);
        });

        this.notifyObservers('predictions_updated', Object.fromEntries(this.predictions));
    }

    predictProgress(childId, childData) {
        const predictions = {
            overall: this.predictOverallProgress(childData),
            subjects: this.predictSubjectProgress(childData),
            milestones: this.predictMilestoneCompletion(childId, childData),
            risks: this.identifyRisks(childData),
            opportunities: this.identifyOpportunities(childData)
        };

        return predictions;
    }

    predictOverallProgress(childData) {
        const recentScores = this.getRecentScores(childData, 7);
        if (recentScores.length < 3) return null;

        const trend = this.calculateScoreTrend(recentScores);
        const currentAverage = recentScores.reduce((sum, s) => sum + s.score, 0) / recentScores.length;

        return {
            currentAverage,
            trend,
            predictedScore30Days: Math.max(0, Math.min(100, currentAverage + (trend * 30))),
            confidence: this.calculatePredictionConfidence(recentScores)
        };
    }

    predictSubjectProgress(childData) {
        const subjectPredictions = new Map();

        childData.subjects.forEach((subjectData, subject) => {
            const recentScores = this.getRecentSubjectScores(childData, subject, 14);
            if (recentScores.length < 3) return;

            const trend = this.calculateScoreTrend(recentScores);
            const prediction = {
                currentScore: subjectData.averageScore,
                trend,
                predictedScore: Math.max(0, Math.min(100, subjectData.averageScore + (trend * 30))),
                confidence: this.calculatePredictionConfidence(recentScores),
                recommendedActions: this.getRecommendedActions(subject, trend, subjectData.averageScore)
            };

            subjectPredictions.set(subject, prediction);
        });

        return Object.fromEntries(subjectPredictions);
    }

    predictMilestoneCompletion(childId, childData) {
        const milestonePredictions = [];

        this.milestones.forEach((milestone, milestoneId) => {
            const progress = this.calculateMilestoneProgress(childId, milestone);
            if (progress.completed) return;

            const timeToCompletion = this.estimateCompletionTime(childId, milestone, progress);

            milestonePredictions.push({
                milestoneId,
                title: milestone.title,
                currentProgress: progress.percentage,
                estimatedCompletion: timeToCompletion,
                probability: this.calculateCompletionProbability(progress, timeToCompletion)
            });
        });

        return milestonePredictions;
    }

    identifyRisks(childData) {
        const risks = [];

        // Declining performance risk
        const overallTrend = this.calculateOverallTrend(childData);
        if (overallTrend < -2) {
            risks.push({
                type: 'declining_performance',
                severity: 'high',
                description: 'Performance en baisse continue',
                impact: 'Academic progress at risk',
                mitigation: ['Additional tutoring', 'Review study methods', 'Check for external factors']
            });
        }

        // Inconsistency risk
        const consistencyScore = this.calculateConsistencyScore(childData);
        if (consistencyScore < 0.6) {
            risks.push({
                type: 'inconsistent_study',
                severity: 'medium',
                description: 'Habitudes d\'étude irrégulières',
                impact: 'Reduced learning effectiveness',
                mitigation: ['Establish routine', 'Set daily goals', 'Use reminders']
            });
        }

        // Subject-specific risks
        childData.subjects.forEach((subjectData, subject) => {
            if (subjectData.averageScore < 60) {
                risks.push({
                    type: 'subject_difficulty',
                    severity: 'high',
                    subject,
                    description: `Difficultés en ${subject}`,
                    impact: 'Subject failure risk',
                    mitigation: [`Focused ${subject} sessions`, 'Identify knowledge gaps', 'Seek additional help']
                });
            }
        });

        return risks;
    }

    identifyOpportunities(childData) {
        const opportunities = [];

        // High-performing subjects
        childData.subjects.forEach((subjectData, subject) => {
            if (subjectData.averageScore > 85 && subjectData.trend === 'improving') {
                opportunities.push({
                    type: 'subject_mastery',
                    subject,
                    description: `Excellence en ${subject}`,
                    potential: 'Advanced learning opportunities',
                    recommendations: [`Advanced ${subject} challenges`, 'Peer tutoring', 'Competition participation']
                });
            }
        });

        // Improving trends
        const overallTrend = this.calculateOverallTrend(childData);
        if (overallTrend > 3) {
            opportunities.push({
                type: 'positive_momentum',
                description: 'Momentum positif établi',
                potential: 'Accelerated progress possible',
                recommendations: ['Increase challenge level', 'Set ambitious goals', 'Maintain motivation']
            });
        }

        return opportunities;
    }

    // Helper methods
    getCurrentSession(childId) {
        // Mock implementation - in real app, get from session manager
        return {
            id: 'session_' + Date.now(),
            currentScore: 85 + Math.random() * 10,
            elapsedTime: 25 + Math.random() * 20,
            subject: ['math', 'french', 'physics'][Math.floor(Math.random() * 3)],
            exercisesCompleted: Math.floor(5 + Math.random() * 10),
            correctAnswers: Math.floor(8 + Math.random() * 5),
            totalAnswers: 15,
            difficulty: 'intermediate'
        };
    }

    calculateEngagement(session) {
        const timeEngagement = Math.min(session.elapsedTime / 30, 1);
        const accuracyEngagement = session.correctAnswers / session.totalAnswers;
        return (timeEngagement + accuracyEngagement) / 2;
    }

    calculateSubjectAverage(childId, subject) {
        const childData = this.progressData.get(childId);
        if (!childData) return 0;

        const subjectScores = childData.scores.filter(s => s.subject === subject);
        if (subjectScores.length === 0) return 0;

        return subjectScores.reduce((sum, s) => sum + s.score, 0) / subjectScores.length;
    }

    calculateTrend(childId, subject) {
        const recentScores = this.getRecentSubjectScores(this.progressData.get(childId), subject, 7);
        if (recentScores.length < 3) return 'stable';

        const trend = this.calculateScoreTrend(recentScores);
        if (trend > 2) return 'improving';
        if (trend < -2) return 'declining';
        return 'stable';
    }

    getRecentScores(childData, days) {
        const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
        return childData.scores.filter(s => s.timestamp > cutoff);
    }

    getRecentSessions(childData, days) {
        const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
        return childData.sessions.filter(s => s.timestamp > cutoff);
    }

    getRecentSubjectScores(childData, subject, days) {
        const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
        return childData.scores.filter(s => s.subject === subject && s.timestamp > cutoff);
    }

    calculateScoreTrend(scores) {
        if (scores.length < 2) return 0;

        const recent = scores.slice(-Math.min(5, scores.length));
        const older = scores.slice(0, Math.max(1, scores.length - 5));

        const recentAvg = recent.reduce((sum, s) => sum + s.score, 0) / recent.length;
        const olderAvg = older.reduce((sum, s) => sum + s.score, 0) / older.length;

        return recentAvg - olderAvg;
    }

    calculateOverallTrend(childData) {
        const recentScores = this.getRecentScores(childData, 14);
        return this.calculateScoreTrend(recentScores);
    }

    calculateConsistencyScore(childData) {
        const last14Days = this.getRecentSessions(childData, 14);
        const daysWithSessions = new Set(
            last14Days.map(s => new Date(s.timestamp).toDateString())
        ).size;

        return daysWithSessions / 14;
    }

    calculatePredictionConfidence(scores) {
        const dataPoints = scores.length;
        const variance = this.calculateVariance(scores.map(s => s.score));

        const dataConfidence = Math.min(dataPoints / 10, 1);
        const stabilityConfidence = Math.max(0, 1 - (variance / 100));

        return (dataConfidence + stabilityConfidence) / 2;
    }

    calculateVariance(values) {
        if (values.length === 0) return 0;

        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const squaredDiffs = values.map(val => Math.pow(val - mean, 2));

        return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
    }

    getRecommendedActions(subject, trend, currentScore) {
        const actions = [];

        if (trend < -2) {
            actions.push(`Révision intensive en ${subject}`);
            actions.push('Identifier les lacunes');
        }

        if (currentScore < 70) {
            actions.push('Sessions de soutien');
            actions.push('Exercices de renforcement');
        }

        if (trend > 2 && currentScore > 80) {
            actions.push('Défis avancés');
            actions.push('Projets d\'approfondissement');
        }

        return actions;
    }

    estimateCompletionTime(childId, milestone, progress) {
        // Simple estimation based on current progress rate
        const progressRate = this.calculateProgressRate(childId, milestone);
        const remainingProgress = milestone.target - progress.currentValue;

        if (progressRate <= 0) return null;

        return Math.ceil(remainingProgress / progressRate); // days
    }

    calculateProgressRate(childId, milestone) {
        // Calculate progress rate for the specific milestone type
        const childData = this.progressData.get(childId);
        if (!childData) return 0;

        const recentData = this.getRecentSessions(childData, 7);
        if (recentData.length === 0) return 0;

        switch (milestone.type) {
            case 'academic':
                return this.calculateScoreTrend(this.getRecentScores(childData, 7));
            case 'time':
                return recentData.reduce((sum, s) => sum + s.timeSpent, 0) / 7; // per day
            default:
                return 1; // default rate
        }
    }

    calculateCompletionProbability(progress, timeToCompletion) {
        if (!timeToCompletion) return 0;
        if (timeToCompletion > 90) return 0.1; // Very unlikely if > 3 months

        const progressFactor = progress.percentage / 100;
        const timeFactor = Math.max(0, 1 - (timeToCompletion / 30)); // Decreases over 30 days

        return Math.min(0.95, (progressFactor + timeFactor) / 2);
    }

    calculateMilestonePoints(milestone) {
        const basePoints = {
            academic: 100,
            consistency: 50,
            subject: 75,
            time: 25
        };

        return basePoints[milestone.type] || 50;
    }

    getConsistentDays(scores, threshold) {
        let consecutiveDays = 0;
        let maxConsecutive = 0;

        scores.forEach(score => {
            if (score.score >= threshold) {
                consecutiveDays++;
                maxConsecutive = Math.max(maxConsecutive, consecutiveDays);
            } else {
                consecutiveDays = 0;
            }
        });

        return maxConsecutive;
    }

    // Milestone management
    addMilestone(milestone) {
        this.milestones.set(milestone.id, {
            ...milestone,
            createdAt: Date.now(),
            active: true
        });
    }

    isMilestoneAwarded(childId, milestoneId) {
        const childData = this.progressData.get(childId);
        return childData?.achievements.some(a => a.milestoneId === milestoneId) || false;
    }

    isNearCompletionNotified(childId, milestoneId) {
        // In real app, track notifications to avoid spam
        return false;
    }

    notifyNearCompletion(childId, milestoneId, milestone, progress) {
        this.notifyObservers('milestone_near_completion', {
            childId,
            milestoneId,
            milestone,
            progress
        });
    }

    // Observer pattern
    addObserver(callback) {
        this.observers.push(callback);
    }

    removeObserver(callback) {
        const index = this.observers.indexOf(callback);
        if (index > -1) {
            this.observers.splice(index, 1);
        }
    }

    notifyObservers(event, data) {
        this.observers.forEach(callback => {
            try {
                callback(event, data);
            } catch (error) {
                console.error('[ProgressTracker] Observer error:', error);
            }
        });
    }

    // API methods
    async syncMilestoneAward(award) {
        try {
            await fetch('/api/parent/milestones/award', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders()
                },
                body: JSON.stringify(award)
            });
        } catch (error) {
            console.error('[ProgressTracker] Failed to sync milestone award:', error);
        }
    }

    // Mock data
    loadMockData() {
        const mockData = {
            children: [
                {
                    id: 'richy',
                    name: 'Richy',
                    sessions: this.generateMockSessions('richy', 30),
                    scores: this.generateMockScores('richy', 30),
                    timeSpent: this.generateMockTimeData('richy', 30),
                    subjects: {
                        math: { totalTime: 1200, totalSessions: 15, averageScore: 78, trend: 'improving' },
                        physics: { totalTime: 900, totalSessions: 12, averageScore: 82, trend: 'stable' },
                        french: { totalTime: 600, totalSessions: 8, averageScore: 85, trend: 'stable' }
                    },
                    achievements: [],
                    trends: { overall: 'improving' }
                }
            ]
        };

        this.processHistoricalData(mockData);
    }

    generateMockSessions(childId, days) {
        const sessions = [];
        const now = Date.now();

        for (let i = 0; i < days; i++) {
            const timestamp = now - (i * 24 * 60 * 60 * 1000);
            sessions.push({
                timestamp,
                sessionId: `session_${i}`,
                score: 70 + Math.random() * 25,
                timeSpent: 20 + Math.random() * 40,
                subject: ['math', 'physics', 'french'][Math.floor(Math.random() * 3)],
                exercisesCompleted: Math.floor(5 + Math.random() * 10),
                engagement: 0.6 + Math.random() * 0.4
            });
        }

        return sessions;
    }

    generateMockScores(childId, days) {
        return this.generateMockSessions(childId, days).map(session => ({
            timestamp: session.timestamp,
            score: session.score,
            subject: session.subject
        }));
    }

    generateMockTimeData(childId, days) {
        return this.generateMockSessions(childId, days).map(session => ({
            timestamp: session.timestamp,
            duration: session.timeSpent,
            subject: session.subject
        }));
    }

    // Utility methods
    getAuthHeaders() {
        return apiConfig.getAuthHeaders();
    }

    // Public API
    getProgressData(childId = null) {
        if (childId) {
            return this.progressData.get(childId);
        }
        return Object.fromEntries(this.progressData);
    }

    getPredictions(childId = null) {
        if (childId) {
            return this.predictions.get(childId);
        }
        return Object.fromEntries(this.predictions);
    }

    getMilestones() {
        return Object.fromEntries(this.milestones);
    }

    getChildMilestones(childId) {
        const milestones = [];
        this.milestones.forEach((milestone, milestoneId) => {
            const progress = this.calculateMilestoneProgress(childId, milestone);
            milestones.push({
                ...milestone,
                progress
            });
        });
        return milestones;
    }

    async refresh() {
        await this.loadHistoricalData();
        this.generatePredictions();
    }

    destroy() {
        this.stopTracking();
        this.observers = [];
        this.progressData.clear();
        this.predictions.clear();
        this.milestones.clear();
    }
}

export default ProgressTracker;