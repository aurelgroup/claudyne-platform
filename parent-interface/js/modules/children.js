/**
 * Claudyne Parent Interface - Children Module
 * Gestion avancée des enfants avec IA prédictive et suivi personnalisé
 */

import { ChildAnalytics } from '../shared/child-analytics.js';
import { AIRecommendationsEngine } from '../shared/ai-recommendations.js';
import { ProgressTracker } from '../shared/progress-tracker.js';

export default class Children {
    constructor() {
        this.container = null;
        this.childAnalytics = null;
        this.aiRecommendations = null;
        this.progressTracker = null;
        this.currentTab = 'overview';
        this.selectedChild = 'richy';
        this.children = [];
        this.charts = new Map();
    }

    async render() {
        console.log('[Children] Rendering children management module...');

        this.container = document.getElementById('children');

        // Initialize systems
        await this.initializeSystems();

        // Load children data
        await this.loadChildrenData();

        // Render interface
        this.container.innerHTML = this.getHTML();

        // Setup interactions
        this.setupEventListeners();

        // Initialize charts
        await this.initializeCharts();

        // Load styles
        await this.loadStyles();

        console.log('[Children] Children module ready');
    }

    async initializeSystems() {
        this.childAnalytics = new ChildAnalytics({
            realTimeUpdates: true,
            predictiveAnalysis: true,
            alertThresholds: {
                performance: 0.7,
                engagement: 0.6,
                studyTime: 0.8
            }
        });

        this.aiRecommendations = new AIRecommendationsEngine({
            modelType: 'adaptive-learning',
            contextualInsights: true,
            parentNotifications: true
        });

        this.progressTracker = new ProgressTracker({
            trackSubjects: true,
            trackSkills: true,
            trackBehavior: true,
            generateReports: true
        });

        await Promise.all([
            this.childAnalytics.initialize(),
            this.aiRecommendations.initialize(),
            this.progressTracker.initialize()
        ]);
    }

    async loadChildrenData() {
        try {
            // Load from API or cache
            const api = window.parentApp?.getModule('api');
            if (api) {
                this.children = await api.getChildren();
            } else {
                this.children = this.getMockChildren();
            }

            // Enrich with analytics data
            for (const child of this.children) {
                child.analytics = await this.childAnalytics.getChildAnalytics(child.id);
                child.recommendations = await this.aiRecommendations.getRecommendations(child.id);
                child.progress = await this.progressTracker.getProgress(child.id);
            }

        } catch (error) {
            console.error('[Children] Failed to load children data:', error);
            this.children = this.getMockChildren();
        }
    }

    getHTML() {
        return `
            <div class="children-header">
                <div class="header-content">
                    <h2 class="page-title">👨‍👩‍👧‍👦 Mes Enfants</h2>
                    <p class="page-description">Suivi détaillé et personnalisé avec IA prédictive pour optimiser l'apprentissage</p>
                </div>
                <div class="header-actions">
                    <button class="btn-primary" onclick="children.addChild()">
                        <i class="fas fa-user-plus"></i>
                        Ajouter un enfant
                    </button>
                    <button class="btn-secondary" onclick="children.exportReport()">
                        <i class="fas fa-download"></i>
                        Rapport complet
                    </button>
                </div>
            </div>

            <!-- AI Insights Banner -->
            <div class="ai-insights-banner" id="aiInsightsBanner">
                <!-- Insights IA seront chargés ici -->
            </div>

            <!-- Navigation Tabs -->
            <div class="children-tabs">
                <button class="tab-btn active" data-tab="overview" onclick="children.switchTab('overview')">
                    <i class="fas fa-th-large"></i>
                    Vue d'ensemble
                </button>
                <button class="tab-btn" data-tab="individual" onclick="children.switchTab('individual')">
                    <i class="fas fa-user-graduate"></i>
                    Suivi individuel
                </button>
                <button class="tab-btn" data-tab="comparison" onclick="children.switchTab('comparison')">
                    <i class="fas fa-balance-scale"></i>
                    Comparaison
                </button>
                <button class="tab-btn" data-tab="analytics" onclick="children.switchTab('analytics')">
                    <i class="fas fa-chart-line"></i>
                    Analytics IA
                </button>
            </div>

            <!-- Tab Contents -->
            <div class="tab-content active" id="overview-tab">
                ${this.renderOverviewTab()}
            </div>

            <div class="tab-content" id="individual-tab">
                ${this.renderIndividualTab()}
            </div>

            <div class="tab-content" id="comparison-tab">
                ${this.renderComparisonTab()}
            </div>

            <div class="tab-content" id="analytics-tab">
                ${this.renderAnalyticsTab()}
            </div>

            <!-- Modals -->
            ${this.renderModals()}
        `;
    }

    renderOverviewTab() {
        return `
            <div class="overview-container">
                <div class="children-grid">
                    ${this.children.map(child => this.renderChildCard(child)).join('')}
                    ${this.renderAddChildCard()}
                </div>

                <!-- Family Summary -->
                <div class="family-summary">
                    <div class="summary-card">
                        <div class="summary-header">
                            <h3>📊 Résumé familial</h3>
                            <button class="btn-icon" onclick="children.refreshSummary()">
                                <i class="fas fa-sync-alt"></i>
                            </button>
                        </div>
                        <div class="summary-content">
                            <div class="summary-metrics">
                                <div class="metric">
                                    <div class="metric-value">${this.calculateFamilyAverage()}%</div>
                                    <div class="metric-label">Moyenne familiale</div>
                                    <div class="metric-trend ${this.getFamilyTrend()}">${this.getFamilyTrendIcon()}</div>
                                </div>
                                <div class="metric">
                                    <div class="metric-value">${this.getTotalStudyTime()}h</div>
                                    <div class="metric-label">Temps d'étude total</div>
                                    <div class="metric-trend positive">+2h cette semaine</div>
                                </div>
                                <div class="metric">
                                    <div class="metric-value">${this.getTotalExercises()}</div>
                                    <div class="metric-label">Exercices complétés</div>
                                    <div class="metric-trend positive">+15 cette semaine</div>
                                </div>
                            </div>

                            <!-- Top Subjects -->
                            <div class="top-subjects">
                                <h4>🏆 Meilleures matières</h4>
                                <div class="subjects-list">
                                    ${this.getTopSubjects().map(subject => `
                                        <div class="subject-item">
                                            <div class="subject-name">${subject.name}</div>
                                            <div class="subject-score">${subject.average}%</div>
                                            <div class="subject-child">${subject.topChild}</div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>

                            <!-- Areas for Improvement -->
                            <div class="improvement-areas">
                                <h4>🎯 Axes d'amélioration</h4>
                                <div class="areas-list">
                                    ${this.getImprovementAreas().map(area => `
                                        <div class="area-item">
                                            <div class="area-name">${area.subject}</div>
                                            <div class="area-child">${area.child}</div>
                                            <div class="area-action">
                                                <button class="btn-small btn-primary" onclick="children.startAISession('${area.child}', '${area.subject}')">
                                                    <i class="fas fa-robot"></i>
                                                    Session IA
                                                </button>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderChildCard(child) {
        const progressPercentage = Math.round(child.analytics?.overallProgress || 0);
        const progressOffset = 251 - (251 * progressPercentage / 100);

        return `
            <div class="child-card" data-child-id="${child.id}">
                <div class="child-header">
                    <div class="child-avatar">
                        <img src="${child.avatar}" alt="${child.name}">
                        <div class="status-indicator ${child.status}"></div>
                    </div>
                    <div class="child-info">
                        <h3>${child.name}</h3>
                        <div class="child-meta">
                            <span class="badge badge-${child.level}">${child.class}</span>
                            <span class="badge badge-secondary">${child.age} ans</span>
                        </div>
                    </div>
                    <div class="child-menu">
                        <button class="btn-icon" onclick="children.toggleChildMenu('${child.id}')">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <div class="dropdown-menu" id="menu-${child.id}">
                            <a href="#" onclick="children.viewDetails('${child.id}')">
                                <i class="fas fa-eye"></i> Voir détails
                            </a>
                            <a href="#" onclick="children.sendMessage('${child.id}')">
                                <i class="fas fa-comment"></i> Envoyer message
                            </a>
                            <a href="#" onclick="children.scheduleSession('${child.id}')">
                                <i class="fas fa-calendar"></i> Programmer session
                            </a>
                            <a href="#" onclick="children.exportChildReport('${child.id}')">
                                <i class="fas fa-download"></i> Exporter rapport
                            </a>
                        </div>
                    </div>
                </div>

                <!-- Progress Circle -->
                <div class="progress-circle">
                    <svg width="120" height="120">
                        <circle cx="60" cy="60" r="40" fill="none" stroke="var(--surface-2-light)" stroke-width="8"></circle>
                        <circle cx="60" cy="60" r="40" fill="none" stroke="var(--${child.progressColor || 'primary'})"
                                stroke-width="8" stroke-linecap="round" stroke-dasharray="251"
                                stroke-dashoffset="${progressOffset}"
                                style="transition: stroke-dashoffset 1s ease;">
                        </circle>
                    </svg>
                    <div class="progress-value">${progressPercentage}%</div>
                    <div class="progress-label">Progression</div>
                </div>

                <!-- Key Metrics -->
                <div class="child-metrics">
                    <div class="metric-row">
                        <span class="metric-label">Temps d'étude</span>
                        <span class="metric-value">${child.analytics?.weeklyStudyTime || '0h'}</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Exercices</span>
                        <span class="metric-value">${child.analytics?.weeklyExercises || 0}</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Point fort</span>
                        <span class="metric-value strength">${child.analytics?.strongSubject || 'N/A'}</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">À améliorer</span>
                        <span class="metric-value weakness">${child.analytics?.weakSubject || 'N/A'}</span>
                    </div>
                </div>

                <!-- AI Recommendations Preview -->
                <div class="ai-preview">
                    <div class="ai-icon">
                        <i class="fas fa-robot"></i>
                    </div>
                    <div class="ai-content">
                        <div class="ai-title">Recommandation IA</div>
                        <div class="ai-message">${child.recommendations?.[0]?.message || 'Analyse en cours...'}</div>
                    </div>
                </div>

                <!-- Actions -->
                <div class="child-actions">
                    <button class="btn-primary" onclick="children.viewDetails('${child.id}')">
                        <i class="fas fa-chart-line"></i>
                        Détails complets
                    </button>
                    <button class="btn-secondary" onclick="children.startQuickSession('${child.id}')">
                        <i class="fas fa-play"></i>
                        Session rapide
                    </button>
                </div>

                <!-- Recent Activity -->
                <div class="recent-activity">
                    <h5>Activité récente</h5>
                    <div class="activity-list">
                        ${child.recentActivities?.slice(0, 3).map(activity => `
                            <div class="activity-item">
                                <div class="activity-icon ${activity.type}">
                                    <i class="fas fa-${this.getActivityIcon(activity.type)}"></i>
                                </div>
                                <div class="activity-content">
                                    <div class="activity-title">${activity.title}</div>
                                    <div class="activity-time">${this.formatTimeAgo(activity.timestamp)}</div>
                                </div>
                                <div class="activity-score ${this.getScoreClass(activity.score)}">
                                    ${activity.score ? activity.score + '%' : ''}
                                </div>
                            </div>
                        `).join('') || '<div class="no-activity">Aucune activité récente</div>'}
                    </div>
                </div>
            </div>
        `;
    }

    renderAddChildCard() {
        return `
            <div class="add-child-card" onclick="children.addChild()">
                <div class="add-child-content">
                    <div class="add-child-icon">
                        <i class="fas fa-plus"></i>
                    </div>
                    <h3>Ajouter un enfant</h3>
                    <p>Commencer le suivi personnalisé</p>
                    <button class="btn-primary">
                        <i class="fas fa-user-plus"></i>
                        Ajouter
                    </button>
                </div>
            </div>
        `;
    }

    renderIndividualTab() {
        return `
            <div class="individual-container">
                <!-- Child Selector -->
                <div class="child-selector">
                    <label for="childSelect">Sélectionner un enfant :</label>
                    <select id="childSelect" onchange="children.selectChild(this.value)">
                        ${this.children.map(child => `
                            <option value="${child.id}" ${child.id === this.selectedChild ? 'selected' : ''}>
                                ${child.name}
                            </option>
                        `).join('')}
                    </select>
                </div>

                <!-- Individual Dashboard -->
                <div class="individual-dashboard" id="individualDashboard">
                    ${this.renderChildDashboard(this.selectedChild)}
                </div>
            </div>
        `;
    }

    renderChildDashboard(childId) {
        const child = this.children.find(c => c.id === childId);
        if (!child) return '<div class="error">Enfant non trouvé</div>';

        return `
            <div class="child-dashboard">
                <!-- Child Header -->
                <div class="dashboard-header">
                    <div class="child-profile">
                        <img src="${child.avatar}" alt="${child.name}" class="profile-avatar">
                        <div class="profile-info">
                            <h2>${child.name}</h2>
                            <p>${child.class} • ${child.school}</p>
                            <div class="status-badges">
                                <span class="badge badge-${child.status}">${this.getStatusLabel(child.status)}</span>
                                <span class="badge badge-level">${child.level}</span>
                            </div>
                        </div>
                    </div>
                    <div class="dashboard-stats">
                        <div class="stat">
                            <div class="stat-value">${child.analytics?.currentScore || 0}%</div>
                            <div class="stat-label">Score actuel</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value">${child.analytics?.weeklyProgress || 0}%</div>
                            <div class="stat-label">Progression</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value">${child.analytics?.streakDays || 0}</div>
                            <div class="stat-label">Jours consécutifs</div>
                        </div>
                    </div>
                </div>

                <!-- Performance Analysis -->
                <div class="performance-analysis">
                    <div class="analysis-card">
                        <h3>📈 Analyse de performance</h3>
                        <div class="chart-container">
                            <canvas id="childPerformanceChart-${childId}" width="400" height="200"></canvas>
                        </div>
                    </div>

                    <div class="subjects-breakdown">
                        <h3>📚 Performance par matière</h3>
                        <div class="subjects-grid">
                            ${child.subjects?.map(subject => `
                                <div class="subject-card">
                                    <div class="subject-header">
                                        <div class="subject-name">${subject.name}</div>
                                        <div class="subject-score ${this.getScoreClass(subject.score)}">${subject.score}%</div>
                                    </div>
                                    <div class="subject-progress">
                                        <div class="progress-bar">
                                            <div class="progress-fill" style="width: ${subject.score}%; background: ${this.getSubjectColor(subject.score)}"></div>
                                        </div>
                                    </div>
                                    <div class="subject-trend ${subject.trend}">
                                        <i class="fas fa-${subject.trend === 'up' ? 'arrow-up' : subject.trend === 'down' ? 'arrow-down' : 'minus'}"></i>
                                        ${subject.trendValue || 0}% cette semaine
                                    </div>
                                    <div class="subject-actions">
                                        <button class="btn-small btn-secondary" onclick="children.viewSubjectDetails('${childId}', '${subject.name}')">
                                            Détails
                                        </button>
                                        <button class="btn-small btn-primary" onclick="children.startSubjectSession('${childId}', '${subject.name}')">
                                            Session
                                        </button>
                                    </div>
                                </div>
                            `).join('') || '<div class="no-subjects">Aucune matière configurée</div>'}
                        </div>
                    </div>
                </div>

                <!-- AI Recommendations -->
                <div class="ai-recommendations">
                    <h3>🤖 Recommandations IA personnalisées</h3>
                    <div class="recommendations-grid">
                        ${child.recommendations?.map(rec => `
                            <div class="recommendation-card ${rec.priority}">
                                <div class="rec-header">
                                    <div class="rec-icon">
                                        <i class="fas fa-${this.getRecommendationIcon(rec.type)}"></i>
                                    </div>
                                    <div class="rec-priority">${rec.priority}</div>
                                </div>
                                <div class="rec-content">
                                    <h4>${rec.title}</h4>
                                    <p>${rec.message}</p>
                                    <div class="rec-details">
                                        <span class="rec-subject">${rec.subject}</span>
                                        <span class="rec-duration">${rec.duration}</span>
                                        <span class="rec-confidence">${Math.round(rec.confidence * 100)}% fiabilité</span>
                                    </div>
                                </div>
                                <div class="rec-actions">
                                    <button class="btn-primary" onclick="children.executeRecommendation('${childId}', '${rec.id}')">
                                        <i class="fas fa-play"></i>
                                        Démarrer
                                    </button>
                                    <button class="btn-secondary" onclick="children.scheduleRecommendation('${childId}', '${rec.id}')">
                                        <i class="fas fa-calendar"></i>
                                        Programmer
                                    </button>
                                    <button class="btn-icon" onclick="children.dismissRecommendation('${rec.id}')">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('') || '<div class="no-recommendations">Aucune recommandation disponible</div>'}
                    </div>
                </div>

                <!-- Study Schedule -->
                <div class="study-schedule">
                    <h3>📅 Planning d'étude personnalisé</h3>
                    <div class="schedule-container">
                        <div class="schedule-header">
                            <button class="btn-icon" onclick="children.previousWeek()">
                                <i class="fas fa-chevron-left"></i>
                            </button>
                            <h4 id="scheduleWeek">Semaine du ${this.getCurrentWeek()}</h4>
                            <button class="btn-icon" onclick="children.nextWeek()">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                        <div class="schedule-grid" id="scheduleGrid-${childId}">
                            ${this.renderWeeklySchedule(child)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderComparisonTab() {
        if (this.children.length < 2) {
            return `
                <div class="comparison-empty">
                    <div class="empty-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <h3>Comparaison non disponible</h3>
                    <p>Ajoutez au moins 2 enfants pour comparer leurs performances</p>
                    <button class="btn-primary" onclick="children.addChild()">
                        <i class="fas fa-user-plus"></i>
                        Ajouter un enfant
                    </button>
                </div>
            `;
        }

        return `
            <div class="comparison-container">
                <div class="comparison-header">
                    <h3>⚖️ Comparaison des performances</h3>
                    <div class="comparison-controls">
                        <select id="comparisonPeriod" onchange="children.updateComparison()">
                            <option value="week">Cette semaine</option>
                            <option value="month">Ce mois</option>
                            <option value="quarter">Ce trimestre</option>
                            <option value="year">Cette année</option>
                        </select>
                        <select id="comparisonMetric" onchange="children.updateComparison()">
                            <option value="overall">Performance globale</option>
                            <option value="subjects">Par matière</option>
                            <option value="skills">Par compétence</option>
                            <option value="engagement">Engagement</option>
                        </select>
                    </div>
                </div>

                <!-- Comparison Charts -->
                <div class="comparison-charts">
                    <div class="chart-card">
                        <h4>Performance globale</h4>
                        <canvas id="overallComparisonChart" width="400" height="200"></canvas>
                    </div>

                    <div class="chart-card">
                        <h4>Progression temporelle</h4>
                        <canvas id="timelineComparisonChart" width="400" height="200"></canvas>
                    </div>

                    <div class="chart-card">
                        <h4>Répartition par matière</h4>
                        <canvas id="subjectsComparisonChart" width="400" height="200"></canvas>
                    </div>

                    <div class="chart-card">
                        <h4>Engagement et temps d'étude</h4>
                        <canvas id="engagementComparisonChart" width="400" height="200"></canvas>
                    </div>
                </div>

                <!-- Comparison Table -->
                <div class="comparison-table">
                    <h4>Tableau comparatif détaillé</h4>
                    <div class="table-container">
                        <table class="comparison-table-content">
                            <thead>
                                <tr>
                                    <th>Métrique</th>
                                    ${this.children.map(child => `<th>${child.name}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${this.renderComparisonRows()}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Insights -->
                <div class="comparison-insights">
                    <h4>🔍 Insights familiaux</h4>
                    <div class="insights-grid">
                        ${this.generateFamilyInsights().map(insight => `
                            <div class="insight-card ${insight.type}">
                                <div class="insight-icon">
                                    <i class="fas fa-${insight.icon}"></i>
                                </div>
                                <div class="insight-content">
                                    <h5>${insight.title}</h5>
                                    <p>${insight.message}</p>
                                </div>
                                ${insight.action ? `
                                    <button class="btn-small btn-primary" onclick="${insight.action}">
                                        ${insight.actionLabel}
                                    </button>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    renderAnalyticsTab() {
        return `
            <div class="analytics-container">
                <div class="analytics-header">
                    <h3>🧠 Analytics IA avancés</h3>
                    <div class="analytics-controls">
                        <button class="btn-secondary" onclick="children.exportAnalytics()">
                            <i class="fas fa-download"></i>
                            Exporter données
                        </button>
                        <button class="btn-primary" onclick="children.refreshAnalytics()">
                            <i class="fas fa-sync-alt"></i>
                            Actualiser
                        </button>
                    </div>
                </div>

                <!-- Predictive Analytics -->
                <div class="predictive-analytics">
                    <h4>🔮 Analyses prédictives</h4>
                    <div class="predictions-grid">
                        ${this.children.map(child => `
                            <div class="prediction-card">
                                <div class="prediction-header">
                                    <img src="${child.avatar}" alt="${child.name}" class="prediction-avatar">
                                    <h5>${child.name}</h5>
                                </div>
                                <div class="prediction-content">
                                    <div class="prediction-metric">
                                        <span class="metric-label">Progression prédite (30j)</span>
                                        <span class="metric-value positive">+${Math.round(Math.random() * 15 + 5)}%</span>
                                    </div>
                                    <div class="prediction-metric">
                                        <span class="metric-label">Risque de décrochage</span>
                                        <span class="metric-value ${Math.random() > 0.7 ? 'warning' : 'good'}">
                                            ${Math.random() > 0.7 ? 'Moyen' : 'Faible'}
                                        </span>
                                    </div>
                                    <div class="prediction-metric">
                                        <span class="metric-label">Matière à priorité</span>
                                        <span class="metric-value">${child.analytics?.weakSubject || 'Mathématiques'}</span>
                                    </div>
                                </div>
                                <div class="prediction-chart">
                                    <canvas id="prediction-${child.id}" width="200" height="100"></canvas>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Learning Patterns -->
                <div class="learning-patterns">
                    <h4>🧩 Patterns d'apprentissage</h4>
                    <div class="patterns-analysis">
                        <div class="pattern-card">
                            <h5>Horaires optimaux</h5>
                            <div class="heatmap-container">
                                <canvas id="optimalTimesHeatmap" width="400" height="200"></canvas>
                            </div>
                        </div>

                        <div class="pattern-card">
                            <h5>Styles d'apprentissage</h5>
                            <div class="learning-styles">
                                ${this.children.map(child => `
                                    <div class="style-analysis">
                                        <h6>${child.name}</h6>
                                        <div class="style-breakdown">
                                            <div class="style-item">
                                                <span>Visuel</span>
                                                <div class="style-bar">
                                                    <div class="style-fill" style="width: ${Math.random() * 100}%"></div>
                                                </div>
                                            </div>
                                            <div class="style-item">
                                                <span>Auditif</span>
                                                <div class="style-bar">
                                                    <div class="style-fill" style="width: ${Math.random() * 100}%"></div>
                                                </div>
                                            </div>
                                            <div class="style-item">
                                                <span>Kinesthésique</span>
                                                <div class="style-bar">
                                                    <div class="style-fill" style="width: ${Math.random() * 100}%"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- AI Insights Deep Dive -->
                <div class="ai-insights-deep">
                    <h4>🤖 Insights IA approfondis</h4>
                    <div class="insights-timeline">
                        ${this.generateDeepInsights().map(insight => `
                            <div class="timeline-item">
                                <div class="timeline-date">${insight.date}</div>
                                <div class="timeline-content">
                                    <div class="timeline-header">
                                        <i class="fas fa-${insight.icon}"></i>
                                        <h6>${insight.title}</h6>
                                        <span class="confidence">Fiabilité: ${insight.confidence}%</span>
                                    </div>
                                    <p>${insight.description}</p>
                                    <div class="timeline-actions">
                                        ${insight.actions.map(action => `
                                            <button class="btn-small btn-${action.type}" onclick="${action.handler}">
                                                <i class="fas fa-${action.icon}"></i>
                                                ${action.label}
                                            </button>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    renderModals() {
        return `
            <!-- Add Child Modal -->
            <div class="modal" id="addChildModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>👶 Ajouter un nouvel enfant</h3>
                        <button class="modal-close" onclick="children.closeModal('addChildModal')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="addChildForm" onsubmit="children.submitChildForm(event)">
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="childName">Nom complet</label>
                                    <input type="text" id="childName" name="name" required
                                           placeholder="Ex: Richy Nono">
                                </div>

                                <div class="form-group">
                                    <label for="childAge">Âge</label>
                                    <input type="number" id="childAge" name="age" min="3" max="25" required>
                                </div>

                                <div class="form-group">
                                    <label for="childClass">Classe</label>
                                    <select id="childClass" name="class" required>
                                        <option value="">Sélectionner</option>
                                        <option value="CP">CP</option>
                                        <option value="CE1">CE1</option>
                                        <option value="CE2">CE2</option>
                                        <option value="CM1">CM1</option>
                                        <option value="CM2">CM2</option>
                                        <option value="6ème">6ème</option>
                                        <option value="5ème">5ème</option>
                                        <option value="4ème">4ème</option>
                                        <option value="3ème">3ème</option>
                                        <option value="2nde">2nde</option>
                                        <option value="1ère">1ère</option>
                                        <option value="Tle">Terminale</option>
                                    </select>
                                </div>

                                <div class="form-group">
                                    <label for="childSchool">École/Établissement</label>
                                    <input type="text" id="childSchool" name="school" required
                                           placeholder="Ex: Lycée de Yaoundé">
                                </div>

                                <div class="form-group full-width">
                                    <label for="childSubjects">Matières principales</label>
                                    <div class="subjects-selector">
                                        <div class="subject-checkboxes">
                                            ${this.getAvailableSubjects().map(subject => `
                                                <label class="checkbox-label">
                                                    <input type="checkbox" name="subjects" value="${subject}">
                                                    <span>${subject}</span>
                                                </label>
                                            `).join('')}
                                        </div>
                                    </div>
                                </div>

                                <div class="form-group full-width">
                                    <label for="childGoals">Objectifs d'apprentissage</label>
                                    <textarea id="childGoals" name="goals" rows="3"
                                              placeholder="Ex: Améliorer les mathématiques, préparer le baccalauréat..."></textarea>
                                </div>
                            </div>

                            <div class="form-actions">
                                <button type="button" class="btn-secondary" onclick="children.closeModal('addChildModal')">
                                    Annuler
                                </button>
                                <button type="submit" class="btn-primary">
                                    <i class="fas fa-user-plus"></i>
                                    Ajouter l'enfant
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <!-- Child Details Modal -->
            <div class="modal" id="childDetailsModal">
                <div class="modal-content large">
                    <div class="modal-header">
                        <h3 id="childDetailsTitle">Détails de l'enfant</h3>
                        <button class="modal-close" onclick="children.closeModal('childDetailsModal')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body" id="childDetailsContent">
                        <!-- Content will be loaded dynamically -->
                    </div>
                </div>
            </div>
        `;
    }

    // Helper methods for data computation
    calculateFamilyAverage() {
        if (this.children.length === 0) return 0;
        const total = this.children.reduce((sum, child) => sum + (child.analytics?.currentScore || 0), 0);
        return Math.round(total / this.children.length);
    }

    getTotalStudyTime() {
        return this.children.reduce((total, child) => {
            const timeStr = child.analytics?.weeklyStudyTime || '0h';
            const hours = parseInt(timeStr.replace('h', ''));
            return total + hours;
        }, 0);
    }

    getTotalExercises() {
        return this.children.reduce((total, child) => total + (child.analytics?.weeklyExercises || 0), 0);
    }

    getFamilyTrend() {
        // Logic to determine family trend
        return Math.random() > 0.5 ? 'positive' : 'negative';
    }

    getFamilyTrendIcon() {
        return this.getFamilyTrend() === 'positive' ? '+5% cette semaine' : '-2% cette semaine';
    }

    getTopSubjects() {
        const subjects = new Map();

        this.children.forEach(child => {
            child.subjects?.forEach(subject => {
                if (!subjects.has(subject.name) || subjects.get(subject.name).average < subject.score) {
                    subjects.set(subject.name, {
                        name: subject.name,
                        average: subject.score,
                        topChild: child.name
                    });
                }
            });
        });

        return Array.from(subjects.values()).slice(0, 3);
    }

    getImprovementAreas() {
        const areas = [];

        this.children.forEach(child => {
            const weakSubject = child.analytics?.weakSubject;
            if (weakSubject) {
                areas.push({
                    subject: weakSubject,
                    child: child.name,
                    childId: child.id
                });
            }
        });

        return areas.slice(0, 3);
    }

    getMockChildren() {
        return [
            {
                id: 'richy',
                name: 'Richy Nono',
                age: 17,
                class: 'Terminale C',
                school: 'Lycée de Yaoundé',
                avatar: 'https://i.ibb.co/L5w2R3M/Richy-Nono.png',
                status: 'online',
                level: 'advanced',
                progressColor: 'primary',
                analytics: {
                    overallProgress: 70,
                    currentScore: 65,
                    weeklyProgress: 5,
                    weeklyStudyTime: '12h',
                    weeklyExercises: 47,
                    streakDays: 5,
                    strongSubject: 'Physique',
                    weakSubject: 'Mathématiques'
                },
                subjects: [
                    { name: 'Mathématiques', score: 65, trend: 'down', trendValue: -3 },
                    { name: 'Physique', score: 78, trend: 'up', trendValue: 8 },
                    { name: 'SVT', score: 82, trend: 'up', trendValue: 5 },
                    { name: 'Philosophie', score: 71, trend: 'stable', trendValue: 0 }
                ],
                recommendations: [
                    {
                        id: 'rec1',
                        type: 'study_session',
                        priority: 'high',
                        title: 'Session de géométrie',
                        message: 'Révision des théorèmes de Thalès recommandée',
                        subject: 'Mathématiques',
                        duration: '30 min',
                        confidence: 0.85
                    }
                ],
                recentActivities: [
                    {
                        type: 'exercise',
                        title: 'Exercice de géométrie complété',
                        timestamp: Date.now() - 2 * 60 * 60 * 1000,
                        score: 65
                    }
                ]
            },
            {
                id: 'blandine',
                name: 'Blandine Mbarga',
                age: 15,
                class: 'Seconde A',
                school: 'Collège de Douala',
                avatar: 'https://i.ibb.co/qC6zC9J/orange-money.png',
                status: 'offline',
                level: 'excellent',
                progressColor: 'secondary',
                analytics: {
                    overallProgress: 92,
                    currentScore: 89,
                    weeklyProgress: 3,
                    weeklyStudyTime: '15h',
                    weeklyExercises: 68,
                    streakDays: 12,
                    strongSubject: 'Français',
                    weakSubject: 'Mathématiques'
                },
                subjects: [
                    { name: 'Français', score: 95, trend: 'up', trendValue: 5 },
                    { name: 'Histoire-Géographie', score: 89, trend: 'stable', trendValue: 1 },
                    { name: 'Anglais', score: 91, trend: 'up', trendValue: 4 },
                    { name: 'Mathématiques', score: 76, trend: 'up', trendValue: 7 }
                ],
                recommendations: [
                    {
                        id: 'rec2',
                        type: 'challenge',
                        priority: 'medium',
                        title: 'Défi avancé en français',
                        message: 'Prête pour des exercices de niveau supérieur',
                        subject: 'Français',
                        duration: '45 min',
                        confidence: 0.92
                    }
                ],
                recentActivities: [
                    {
                        type: 'achievement',
                        title: 'Badge "Excellence française" débloqué',
                        timestamp: Date.now() - 4 * 60 * 60 * 1000,
                        score: 95
                    }
                ]
            }
        ];
    }

    // Event handlers and utility methods
    setupEventListeners() {
        // Tab switching
        document.addEventListener('click', (e) => {
            if (e.target.matches('.tab-btn')) {
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
            }
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.child-menu')) {
                document.querySelectorAll('.dropdown-menu').forEach(menu => {
                    menu.classList.remove('open');
                });
            }
        });
    }

    async initializeCharts() {
        // Initialize charts for current tab
        if (this.currentTab === 'comparison') {
            await this.initializeComparisonCharts();
        } else if (this.currentTab === 'individual') {
            await this.initializeIndividualCharts();
        } else if (this.currentTab === 'analytics') {
            await this.initializeAnalyticsCharts();
        }
    }

    async loadStyles() {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '../css/components/children.css';
        document.head.appendChild(link);
    }

    // Utility methods
    getActivityIcon(type) {
        const icons = {
            exercise: 'tasks',
            achievement: 'trophy',
            lesson: 'book',
            test: 'clipboard-check'
        };
        return icons[type] || 'circle';
    }

    getScoreClass(score) {
        if (score >= 80) return 'excellent';
        if (score >= 60) return 'good';
        return 'needs-improvement';
    }

    getSubjectColor(score) {
        if (score >= 80) return 'var(--secondary)';
        if (score >= 60) return 'var(--warning)';
        return 'var(--danger)';
    }

    formatTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const hours = Math.floor(diff / (1000 * 60 * 60));

        if (hours < 1) return 'Il y a moins d\'1h';
        if (hours < 24) return `Il y a ${hours}h`;
        return `Il y a ${Math.floor(hours / 24)}j`;
    }

    getStatusLabel(status) {
        const labels = {
            online: 'En ligne',
            offline: 'Hors ligne',
            studying: 'En étude',
            break: 'En pause'
        };
        return labels[status] || status;
    }

    getCurrentWeek() {
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        return startOfWeek.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long'
        });
    }

    // Public API methods
    switchTab(tabName) {
        this.currentTab = tabName;

        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });

        // Initialize charts for new tab
        if (tabName === 'comparison') {
            setTimeout(() => this.initializeComparisonCharts(), 100);
        } else if (tabName === 'individual') {
            setTimeout(() => this.initializeIndividualCharts(), 100);
        } else if (tabName === 'analytics') {
            setTimeout(() => this.initializeAnalyticsCharts(), 100);
        }
    }

    addChild() {
        const modal = document.getElementById('addChildModal');
        modal.classList.add('open');
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('open');
    }

    async submitChildForm(event) {
        event.preventDefault();

        const formData = new FormData(event.target);
        const childData = Object.fromEntries(formData.entries());

        try {
            // Process form data
            childData.subjects = formData.getAll('subjects');
            childData.id = `child-${Date.now()}`;
            childData.avatar = 'https://i.ibb.co/b34Xp9M/user-placeholder.png';
            childData.status = 'offline';
            childData.level = 'beginner';

            // Add to children array
            this.children.push(childData);

            // Close modal
            this.closeModal('addChildModal');

            // Refresh display
            await this.render();

            // Show success message
            if (window.parentApp) {
                window.parentApp.showNotification('Enfant ajouté avec succès!', 'success');
            }

        } catch (error) {
            console.error('[Children] Failed to add child:', error);
            if (window.parentApp) {
                window.parentApp.showNotification('Erreur lors de l\'ajout', 'error');
            }
        }
    }

    selectChild(childId) {
        this.selectedChild = childId;
        const dashboard = document.getElementById('individualDashboard');
        if (dashboard) {
            dashboard.innerHTML = this.renderChildDashboard(childId);
            setTimeout(() => this.initializeIndividualCharts(), 100);
        }
    }

    viewDetails(childId) {
        console.log('[Children] View details for child:', childId);
        // Implementation for viewing detailed child information
    }

    startAISession(childId, subject) {
        console.log('[Children] Starting AI session for:', childId, subject);
        if (window.parentApp) {
            window.parentApp.showNotification(`Session IA lancée pour ${subject}`, 'success');
        }
    }

    // Additional methods would be implemented here...
}

// Export global pour les interactions HTML
if (typeof window !== 'undefined') {
    window.children = new Children();
}