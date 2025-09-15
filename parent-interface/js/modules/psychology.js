/**
 * Claudyne Parent Interface - Psychology Module
 * Copilote émotionnel et bien-être familial avec IA
 */

export class PsychologyModule {
    constructor(options = {}) {
        this.options = {
            websocketUrl: 'wss://api.claudyne.com/parent/psychology',
            aiEndpoint: '/api/parent/psychology/insights',
            updateInterval: 30000,
            ...options
        };

        this.websocket = null;
        this.isConnected = false;
        this.currentData = null;
        this.recommendations = [];
        this.relaxationSessions = new Map();
    }

    async initialize() {
        console.log('[Psychology] Initializing psychology module...');

        await this.setupWebSocket();
        await this.loadPsychologyData();
        this.setupRelaxationSessions();
        this.startRealTimeUpdates();

        console.log('[Psychology] Psychology module ready');
    }

    async setupWebSocket() {
        try {
            this.websocket = new WebSocket(this.options.websocketUrl);

            this.websocket.onopen = () => {
                console.log('[Psychology] WebSocket connected');
                this.isConnected = true;
                this.subscribeToUpdates();
            };

            this.websocket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleRealTimeUpdate(data);
            };

            this.websocket.onclose = () => {
                console.log('[Psychology] WebSocket disconnected');
                this.isConnected = false;
                setTimeout(() => this.setupWebSocket(), 5000);
            };

            this.websocket.onerror = (error) => {
                console.error('[Psychology] WebSocket error:', error);
                this.isConnected = false;
            };

        } catch (error) {
            console.error('[Psychology] Failed to setup WebSocket:', error);
        }
    }

    subscribeToUpdates() {
        if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) return;

        const subscription = {
            type: 'subscribe',
            channels: ['emotional_state', 'ai_recommendations', 'behavioral_analysis'],
            userId: this.getUserId()
        };

        this.websocket.send(JSON.stringify(subscription));
    }

    handleRealTimeUpdate(data) {
        switch (data.type) {
            case 'emotional_state_update':
                this.updateEmotionalState(data.payload);
                break;
            case 'new_ai_recommendation':
                this.addAIRecommendation(data.payload);
                break;
            case 'behavioral_analysis_update':
                this.updateBehavioralAnalysis(data.payload);
                break;
            case 'stress_alert':
                this.handleStressAlert(data.payload);
                break;
        }
    }

    async render() {
        return `
            <div class="psychology-container">
                <div class="psychology-header">
                    <h2 class="psychology-title">Copilote Émotionnel</h2>
                    <p class="psychology-description">Soutien psychologique et bien-être familial personnalisé</p>
                </div>

                <div class="psychology-grid">
                    ${this.renderEmotionalStateCard()}
                    ${this.renderAIRecommendationsCard()}
                    ${this.renderRelaxationCard()}
                    ${this.renderBehavioralAnalysisCard()}
                </div>
            </div>
        `;
    }

    renderEmotionalStateCard() {
        const data = this.currentData?.emotionalState || this.getMockEmotionalState();

        return `
            <div class="psychology-card animate-fade-in">
                <div class="card-header">
                    <i class="fas fa-heart psychology-icon-heart"></i>
                    <h3>État émotionnel général</h3>
                </div>
                <div class="card-body">
                    <div class="emotional-overview">
                        <div class="emotion-display">
                            <div class="emotion-emoji">${data.overallEmoji}</div>
                            <div class="emotion-status">${data.familyStatus}</div>
                            <div class="stress-level">Niveau de stress: ${data.stressLevel}</div>
                        </div>

                        <div class="wellbeing-metrics">
                            ${data.children.map(child => `
                                <div class="wellbeing-item">
                                    <div class="wellbeing-header">
                                        <span>Bien-être ${child.name}</span>
                                        <span class="wellbeing-score" style="color: ${this.getWellbeingColor(child.score)}">${child.score}%</span>
                                    </div>
                                    <div class="wellbeing-progress">
                                        <div class="progress-bar" style="width: ${child.score}%; background: ${this.getWellbeingColor(child.score)};"></div>
                                    </div>
                                </div>
                            `).join('')}

                            <div class="wellbeing-item">
                                <div class="wellbeing-header">
                                    <span>Harmonie familiale</span>
                                    <span class="wellbeing-score" style="color: ${this.getWellbeingColor(data.familyHarmony)}">${data.familyHarmony}%</span>
                                </div>
                                <div class="wellbeing-progress">
                                    <div class="progress-bar" style="width: ${data.familyHarmony}%; background: ${this.getWellbeingColor(data.familyHarmony)};"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderAIRecommendationsCard() {
        const recommendations = this.recommendations.length > 0 ? this.recommendations : this.getMockRecommendations();

        return `
            <div class="psychology-card animate-fade-in">
                <div class="card-header">
                    <i class="fas fa-brain psychology-icon-brain"></i>
                    <h3>Recommandations IA</h3>
                </div>
                <div class="card-body">
                    <div class="ai-recommendations">
                        ${recommendations.map(rec => `
                            <div class="recommendation-item ${rec.priority}-priority">
                                <div class="recommendation-icon">${this.getRecommendationIcon(rec.type)}</div>
                                <div class="recommendation-content">
                                    <div class="recommendation-title">${rec.title}</div>
                                    <div class="recommendation-message">${rec.message}</div>
                                    ${rec.actionLabel ? `
                                        <button class="recommendation-action btn btn-small btn-primary"
                                                onclick="psychologyModule.executeRecommendation('${rec.id}')">
                                            ${rec.actionLabel}
                                        </button>
                                    ` : ''}
                                </div>
                                <div class="recommendation-meta">
                                    <span class="confidence">Confiance: ${Math.round(rec.confidence * 100)}%</span>
                                    <span class="timestamp">${this.formatTimestamp(rec.timestamp)}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <button class="btn btn-primary full-width psychology-consult-btn"
                            onclick="psychologyModule.requestConsultation()">
                        <i class="fas fa-comments"></i>
                        Consultation avec psychologue
                    </button>
                </div>
            </div>
        `;
    }

    renderRelaxationCard() {
        return `
            <div class="psychology-card animate-fade-in">
                <div class="card-header">
                    <i class="fas fa-spa psychology-icon-spa"></i>
                    <h3>Espace détente</h3>
                </div>
                <div class="card-body">
                    <div class="relaxation-center">
                        <div class="relaxation-intro">
                            <div class="relaxation-icon">
                                <i class="fas fa-leaf"></i>
                            </div>
                            <div class="relaxation-title">Moment de sérénité</div>
                            <div class="relaxation-subtitle">Prenez 5 minutes pour vous détendre</div>
                        </div>

                        <div class="relaxation-activities">
                            <button class="relaxation-activity" onclick="psychologyModule.startRelaxation('breathing')">
                                <i class="fas fa-wind"></i>
                                <span>Respiration</span>
                            </button>
                            <button class="relaxation-activity" onclick="psychologyModule.startRelaxation('meditation')">
                                <i class="fas fa-music"></i>
                                <span>Méditation</span>
                            </button>
                            <button class="relaxation-activity" onclick="psychologyModule.startRelaxation('affirmations')">
                                <i class="fas fa-smile"></i>
                                <span>Affirmations</span>
                            </button>
                            <button class="relaxation-activity" onclick="psychologyModule.startRelaxation('gratitude')">
                                <i class="fas fa-heart"></i>
                                <span>Gratitude</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderBehavioralAnalysisCard() {
        const analysis = this.currentData?.behavioralAnalysis || this.getMockBehavioralAnalysis();

        return `
            <div class="psychology-card animate-fade-in">
                <div class="card-header">
                    <i class="fas fa-chart-pie psychology-icon-chart"></i>
                    <h3>Analyse comportementale</h3>
                </div>
                <div class="card-body">
                    <div class="behavioral-analysis">
                        ${analysis.children.map(child => `
                            <div class="child-analysis">
                                <h4 class="child-name">${child.name} - Dernière semaine</h4>
                                <div class="behavioral-metrics">
                                    ${child.metrics.map(metric => `
                                        <div class="metric-row">
                                            <span class="metric-label">${metric.label}</span>
                                            <div class="metric-indicator">
                                                ${this.renderMetricBars(metric.value, 5)}
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    renderMetricBars(value, total) {
        const filledBars = Math.min(value, total);
        const emptyBars = total - filledBars;

        let bars = '';
        for (let i = 0; i < filledBars; i++) {
            bars += '<div class="metric-bar filled"></div>';
        }
        for (let i = 0; i < emptyBars; i++) {
            bars += '<div class="metric-bar empty"></div>';
        }

        return bars;
    }

    getWellbeingColor(score) {
        if (score >= 80) return 'var(--success-color)';
        if (score >= 60) return 'var(--warning-color)';
        return 'var(--danger-color)';
    }

    getRecommendationIcon(type) {
        const icons = {
            attention: '⚠️',
            success: '✅',
            suggestion: '💡',
            urgent: '🚨',
            info: 'ℹ️'
        };
        return icons[type] || '💡';
    }

    // AI Recommendations Management
    async executeRecommendation(recommendationId) {
        const recommendation = this.recommendations.find(r => r.id === recommendationId);
        if (!recommendation) return;

        try {
            switch (recommendation.action) {
                case 'start_ai_session':
                    await this.startAISession(recommendation.subject, recommendation.child);
                    break;
                case 'schedule_consultation':
                    await this.scheduleConsultation(recommendation.child);
                    break;
                case 'family_activity':
                    await this.suggestFamilyActivity(recommendation.activity);
                    break;
                default:
                    console.log('[Psychology] Executing recommendation:', recommendation.id);
            }

            this.markRecommendationExecuted(recommendationId);

        } catch (error) {
            console.error('[Psychology] Failed to execute recommendation:', error);
        }
    }

    async startAISession(subject, child) {
        // Start AI-powered study session
        const sessionData = {
            child: child,
            subject: subject,
            type: 'emotional_support',
            duration: 30,
            focus: 'confidence_building'
        };

        console.log('[Psychology] Starting AI session:', sessionData);
        // Trigger AI session in student interface
    }

    async requestConsultation() {
        try {
            const response = await fetch('/api/parent/psychology/consultation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders()
                },
                body: JSON.stringify({
                    type: 'family_consultation',
                    urgency: 'normal',
                    concerns: this.getActiveConcerns()
                })
            });

            if (response.ok) {
                const result = await response.json();
                this.showConsultationConfirmation(result);
            }

        } catch (error) {
            console.error('[Psychology] Failed to request consultation:', error);
        }
    }

    // Relaxation Sessions
    setupRelaxationSessions() {
        this.relaxationSessions.set('breathing', {
            name: 'Respiration Guidée',
            duration: 300, // 5 minutes
            instructions: [
                'Installez-vous confortablement',
                'Fermez les yeux doucement',
                'Inspirez profondément par le nez (4 sec)',
                'Retenez votre souffle (4 sec)',
                'Expirez lentement par la bouche (6 sec)',
                'Répétez ce cycle'
            ]
        });

        this.relaxationSessions.set('meditation', {
            name: 'Méditation Guidée',
            duration: 600, // 10 minutes
            audioUrl: '/assets/audio/meditation-family.mp3',
            instructions: [
                'Trouvez un endroit calme',
                'Asseyez-vous confortablement',
                'Concentrez-vous sur votre respiration',
                'Laissez passer les pensées sans les juger',
                'Revenez à votre respiration si besoin'
            ]
        });

        this.relaxationSessions.set('affirmations', {
            name: 'Affirmations Positives',
            duration: 180, // 3 minutes
            affirmations: [
                'Je suis un parent aimant et bienveillant',
                'Mes enfants grandissent dans un environnement sain',
                'Je fais de mon mieux chaque jour',
                'Notre famille est unie et forte',
                'Je mérite des moments de détente'
            ]
        });

        this.relaxationSessions.set('gratitude', {
            name: 'Pratique de Gratitude',
            duration: 240, // 4 minutes
            prompts: [
                'Pensez à 3 choses pour lesquelles vous êtes reconnaissant aujourd\'hui',
                'Qu\'est-ce qui vous rend fier de vos enfants?',
                'Quel moment de joie avez-vous partagé récemment?',
                'Comment votre famille vous apporte-t-elle du bonheur?'
            ]
        });
    }

    async startRelaxation(type) {
        const session = this.relaxationSessions.get(type);
        if (!session) return;

        // Create relaxation modal
        const modal = this.createRelaxationModal(session);
        document.body.appendChild(modal);

        // Start session
        await this.runRelaxationSession(session, modal);
    }

    createRelaxationModal(session) {
        const modal = document.createElement('div');
        modal.className = 'relaxation-modal';
        modal.innerHTML = `
            <div class="relaxation-overlay">
                <div class="relaxation-content">
                    <div class="relaxation-header">
                        <h3>${session.name}</h3>
                        <button class="close-relaxation" onclick="this.closest('.relaxation-modal').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="relaxation-body">
                        <div class="relaxation-timer">
                            <div class="timer-display">
                                <span class="minutes">${Math.floor(session.duration / 60)}</span>
                                <span class="separator">:</span>
                                <span class="seconds">${String(session.duration % 60).padStart(2, '0')}</span>
                            </div>
                            <div class="timer-circle">
                                <svg class="timer-svg" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="45" class="timer-track"></circle>
                                    <circle cx="50" cy="50" r="45" class="timer-progress"></circle>
                                </svg>
                            </div>
                        </div>
                        <div class="relaxation-instruction">
                            <p>Préparez-vous à commencer...</p>
                        </div>
                        <div class="relaxation-controls">
                            <button class="btn btn-primary start-session">Commencer</button>
                            <button class="btn btn-secondary pause-session" style="display: none;">Pause</button>
                            <button class="btn btn-danger stop-session" style="display: none;">Arrêter</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        return modal;
    }

    async runRelaxationSession(session, modal) {
        let remainingTime = session.duration;
        let isPaused = false;
        let currentInstructionIndex = 0;
        let timer = null;

        const startBtn = modal.querySelector('.start-session');
        const pauseBtn = modal.querySelector('.pause-session');
        const stopBtn = modal.querySelector('.stop-session');
        const instruction = modal.querySelector('.relaxation-instruction p');
        const minutesEl = modal.querySelector('.minutes');
        const secondsEl = modal.querySelector('.seconds');
        const progressCircle = modal.querySelector('.timer-progress');

        const updateTimer = () => {
            const minutes = Math.floor(remainingTime / 60);
            const seconds = remainingTime % 60;

            minutesEl.textContent = minutes;
            secondsEl.textContent = String(seconds).padStart(2, '0');

            const progress = ((session.duration - remainingTime) / session.duration) * 283;
            progressCircle.style.strokeDashoffset = 283 - progress;
        };

        const updateInstruction = () => {
            if (session.instructions && session.instructions.length > 0) {
                const instructionText = session.instructions[currentInstructionIndex];
                instruction.textContent = instructionText;
                currentInstructionIndex = (currentInstructionIndex + 1) % session.instructions.length;
            }
        };

        startBtn.addEventListener('click', () => {
            startBtn.style.display = 'none';
            pauseBtn.style.display = 'inline-block';
            stopBtn.style.display = 'inline-block';

            timer = setInterval(() => {
                if (!isPaused) {
                    remainingTime--;
                    updateTimer();

                    // Update instruction every 30 seconds
                    if (remainingTime % 30 === 0) {
                        updateInstruction();
                    }

                    if (remainingTime <= 0) {
                        clearInterval(timer);
                        this.completeRelaxationSession(modal);
                    }
                }
            }, 1000);

            updateInstruction();
        });

        pauseBtn.addEventListener('click', () => {
            isPaused = !isPaused;
            pauseBtn.textContent = isPaused ? 'Reprendre' : 'Pause';
        });

        stopBtn.addEventListener('click', () => {
            clearInterval(timer);
            modal.remove();
        });
    }

    completeRelaxationSession(modal) {
        const body = modal.querySelector('.relaxation-body');
        body.innerHTML = `
            <div class="relaxation-complete">
                <div class="complete-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h3>Session terminée!</h3>
                <p>Félicitations pour avoir pris ce moment pour vous.</p>
                <div class="complete-feedback">
                    <p>Comment vous sentez-vous?</p>
                    <div class="mood-buttons">
                        <button class="mood-btn" onclick="psychologyModule.recordMood('great')">😊 Très bien</button>
                        <button class="mood-btn" onclick="psychologyModule.recordMood('good')">🙂 Bien</button>
                        <button class="mood-btn" onclick="psychologyModule.recordMood('neutral')">😐 Neutre</button>
                        <button class="mood-btn" onclick="psychologyModule.recordMood('tired')">😴 Fatigué</button>
                    </div>
                </div>
                <button class="btn btn-primary" onclick="this.closest('.relaxation-modal').remove()">
                    Fermer
                </button>
            </div>
        `;
    }

    async recordMood(mood) {
        try {
            await fetch('/api/parent/psychology/mood', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders()
                },
                body: JSON.stringify({
                    mood: mood,
                    timestamp: Date.now(),
                    context: 'relaxation_session'
                })
            });
        } catch (error) {
            console.error('[Psychology] Failed to record mood:', error);
        }
    }

    // Data Management
    async loadPsychologyData() {
        try {
            const response = await fetch('/api/parent/psychology/data', {
                headers: this.getAuthHeaders()
            });

            if (response.ok) {
                this.currentData = await response.json();
            } else {
                this.currentData = this.getMockPsychologyData();
            }

            // Load AI recommendations
            await this.loadAIRecommendations();

        } catch (error) {
            console.error('[Psychology] Failed to load psychology data:', error);
            this.currentData = this.getMockPsychologyData();
        }
    }

    async loadAIRecommendations() {
        try {
            const response = await fetch(this.options.aiEndpoint, {
                headers: this.getAuthHeaders()
            });

            if (response.ok) {
                this.recommendations = await response.json();
            } else {
                this.recommendations = this.getMockRecommendations();
            }

        } catch (error) {
            console.error('[Psychology] Failed to load AI recommendations:', error);
            this.recommendations = this.getMockRecommendations();
        }
    }

    startRealTimeUpdates() {
        setInterval(() => {
            if (!this.isConnected) {
                this.loadPsychologyData();
            }
        }, this.options.updateInterval);
    }

    // Mock Data
    getMockPsychologyData() {
        return {
            emotionalState: this.getMockEmotionalState(),
            behavioralAnalysis: this.getMockBehavioralAnalysis()
        };
    }

    getMockEmotionalState() {
        return {
            overallEmoji: '😊',
            familyStatus: 'Famille épanouie',
            stressLevel: 'Faible',
            familyHarmony: 85,
            children: [
                { name: 'Richy', score: 78 },
                { name: 'Blandine', score: 92 }
            ]
        };
    }

    getMockRecommendations() {
        return [
            {
                id: 'rec-1',
                type: 'attention',
                priority: 'high',
                title: 'Attention',
                message: 'Richy montre des signes de stress liés aux mathématiques. Privilégier des sessions courtes et encourageantes.',
                actionLabel: 'Démarrer la session IA',
                action: 'start_ai_session',
                subject: 'Mathématiques',
                child: 'Richy',
                confidence: 0.85,
                timestamp: Date.now()
            },
            {
                id: 'rec-2',
                type: 'success',
                priority: 'medium',
                title: 'Réussite',
                message: 'Excellente dynamique avec Blandine. Maintenir les encouragements positifs.',
                child: 'Blandine',
                confidence: 0.92,
                timestamp: Date.now() - 3600000
            },
            {
                id: 'rec-3',
                type: 'suggestion',
                priority: 'low',
                title: 'Suggestion',
                message: 'Organiser une activité familiale ce weekend pour renforcer les liens.',
                actionLabel: 'Voir les suggestions',
                action: 'family_activity',
                activity: 'weekend_activities',
                confidence: 0.78,
                timestamp: Date.now() - 7200000
            }
        ];
    }

    getMockBehavioralAnalysis() {
        return {
            children: [
                {
                    name: 'Richy',
                    metrics: [
                        { label: 'Motivation', value: 3 },
                        { label: 'Concentration', value: 4 },
                        { label: 'Confiance', value: 5 }
                    ]
                },
                {
                    name: 'Blandine',
                    metrics: [
                        { label: 'Motivation', value: 5 },
                        { label: 'Concentration', value: 4 },
                        { label: 'Confiance', value: 5 }
                    ]
                }
            ]
        };
    }

    // Utility Methods
    getUserId() {
        return localStorage.getItem('parentUserId') || 'parent-user';
    }

    getAuthHeaders() {
        const token = localStorage.getItem('parentToken');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    formatTimestamp(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;

        if (diff < 60000) return 'À l\'instant';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}min`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
        return `${Math.floor(diff / 86400000)}j`;
    }

    getActiveConcerns() {
        return this.recommendations
            .filter(rec => rec.priority === 'high')
            .map(rec => ({
                child: rec.child,
                subject: rec.subject,
                type: rec.type
            }));
    }

    markRecommendationExecuted(recommendationId) {
        this.recommendations = this.recommendations.filter(rec => rec.id !== recommendationId);

        // Trigger UI update
        if (window.app && window.app.currentModule === 'psychology') {
            window.app.renderCurrentModule();
        }
    }

    updateEmotionalState(data) {
        if (this.currentData) {
            this.currentData.emotionalState = { ...this.currentData.emotionalState, ...data };
        }
        this.triggerUIUpdate();
    }

    updateBehavioralAnalysis(data) {
        if (this.currentData) {
            this.currentData.behavioralAnalysis = { ...this.currentData.behavioralAnalysis, ...data };
        }
        this.triggerUIUpdate();
    }

    addAIRecommendation(recommendation) {
        this.recommendations.unshift(recommendation);
        this.triggerUIUpdate();
    }

    handleStressAlert(alert) {
        // Show urgent notification
        this.showStressAlert(alert);
    }

    showStressAlert(alert) {
        const notification = document.createElement('div');
        notification.className = 'stress-alert-notification';
        notification.innerHTML = `
            <div class="alert-content">
                <div class="alert-icon">🚨</div>
                <div class="alert-message">
                    <h4>Alerte Stress</h4>
                    <p>${alert.message}</p>
                </div>
                <button class="alert-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 10000);
    }

    triggerUIUpdate() {
        // Trigger UI refresh if psychology module is currently active
        if (window.app && window.app.currentModule === 'psychology') {
            window.app.renderCurrentModule();
        }
    }

    // Public API
    async refresh() {
        await this.loadPsychologyData();
        await this.loadAIRecommendations();
    }

    disconnect() {
        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
        }
        this.isConnected = false;
    }
}

// Export for global access
if (typeof window !== 'undefined') {
    window.psychologyModule = null; // Sera initialisé par main.js
}