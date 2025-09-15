/**
 * Claudyne Parent Interface - Dashboard Intelligent
 * Widgets configurables drag & drop + Analytics temps réel + Export PDF/Excel
 */

import { WidgetSystem } from '../shared/widget-system.js';
import { AnalyticsEngine } from '../shared/analytics.js';
import { ExportManager } from '../shared/export.js';
import { mockData, getMockData } from '../shared/mock-data.js';

export default class Dashboard {
    constructor() {
        this.container = null;
        this.widgetSystem = null;
        this.analytics = null;
        this.exportManager = null;
        this.websocket = null;
        this.data = {
            metrics: {},
            children: [],
            activities: [],
            insights: []
        };
    }

    async render() {
        console.log('[Dashboard] Rendering intelligent dashboard...');

        this.container = document.getElementById('dashboard');

        try {
            // Try to initialize complex systems
            await this.initializeSystems();

            // Render dashboard structure
            this.container.innerHTML = this.getHTML();

            // Initialize real-time data
            await this.loadInitialData();

            // Setup widgets
            await this.setupWidgets();

            // Start real-time updates
            this.startRealTimeUpdates();

            // Load styles
            await this.loadStyles();

            console.log('[Dashboard] Dashboard intelligent ready');

        } catch (error) {
            console.warn('[Dashboard] Complex systems failed, falling back to simple dashboard:', error);

            // Fallback to simple dashboard with mock data
            this.renderSimpleDashboard();
        }
    }

    // Simple fallback render when complex systems fail
    renderSimpleDashboard() {
        if (!this.container) {
            this.container = document.getElementById('dashboard');
        }

        const metrics = getMockData('dashboard.metrics');
        const activities = getMockData('dashboard.recentActivities');
        const aiInsight = getMockData('dashboard.aiInsight');
        const richyPerf = getMockData('dashboard.subjectPerformance.richy');

        this.container.innerHTML = `
            <div class="page-header animate-in">
                <h2 class="page-title">Dashboard Intelligent</h2>
                <p class="page-description">Analytics en temps réel et insights personnalisés pour optimiser l'apprentissage de vos enfants</p>
            </div>

            <!-- Quick Stats -->
            <div class="card-grid animate-in" style="grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));">
                <div class="card metric-card">
                    <div class="metric-value">${metrics.totalExercises.value}</div>
                    <div class="metric-label">${metrics.totalExercises.label}</div>
                    <div class="metric-change ${metrics.totalExercises.type}">${metrics.totalExercises.change}</div>
                </div>
                <div class="card metric-card">
                    <div class="metric-value">${metrics.averageScore.value}</div>
                    <div class="metric-label">${metrics.averageScore.label}</div>
                    <div class="metric-change ${metrics.averageScore.type}">${metrics.averageScore.change}</div>
                </div>
                <div class="card metric-card">
                    <div class="metric-value">${metrics.studyTime.value}</div>
                    <div class="metric-label">${metrics.studyTime.label}</div>
                    <div class="metric-change ${metrics.studyTime.type}">${metrics.studyTime.change}</div>
                </div>
                <div class="card metric-card">
                    <div class="metric-value">${metrics.achievements.value}</div>
                    <div class="metric-label">${metrics.achievements.label}</div>
                    <div class="metric-change ${metrics.achievements.type}">${metrics.achievements.change}</div>
                </div>
            </div>

            <!-- AI Insights Alert -->
            <div class="card animate-in" style="border-left: 4px solid var(--warning); margin-bottom: 2rem;">
                <div class="card-body">
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                        <div style="width: 50px; height: 50px; background: rgba(249, 115, 22, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                            <i class="fas fa-brain" style="color: var(--warning); font-size: 1.5rem;"></i>
                        </div>
                        <div>
                            <h3 style="margin-bottom: 0.5rem;">${aiInsight.title}</h3>
                            <p style="opacity: 0.8;">${aiInsight.message}</p>
                        </div>
                    </div>
                    <div style="display: flex; gap: 1rem;">
                        ${aiInsight.actions.map(action => `
                            <button class="btn btn-${action.type}">
                                <i class="${action.icon}"></i>
                                ${action.text}
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>

            <!-- Main Content Grid -->
            <div class="card-grid">
                <!-- Recent Activities -->
                <div class="card animate-in">
                    <div class="card-header">
                        <i class="fas fa-clock" style="color: var(--accent);"></i>
                        <h3>Activités récentes</h3>
                    </div>
                    <div class="card-body">
                        ${activities.map(activity => `
                            <div class="activity-item">
                                <div class="activity-icon" style="background: ${activity.iconColor};">
                                    <i class="${activity.icon}"></i>
                                </div>
                                <div class="activity-content">
                                    <div class="activity-title">${activity.title}</div>
                                    <div class="activity-meta">${activity.meta}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Performance par matière -->
                <div class="card animate-in">
                    <div class="card-header">
                        <i class="fas fa-user-graduate" style="color: var(--primary);"></i>
                        <h3>Performance par matière - Richy</h3>
                    </div>
                    <div class="card-body">
                        ${richyPerf.map(subject => `
                            <div style="margin-bottom: 1rem;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                    <span>${subject.subject}</span>
                                    <span style="font-weight: 600; color: ${subject.color};">${subject.score}%</span>
                                </div>
                                <div class="progress">
                                    <div class="progress-bar" style="width: ${subject.score}%; background: ${subject.color};"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        console.log('[Dashboard] Simple dashboard rendered with mock data');
    }

    async initializeSystems() {
        // Widget System for drag & drop
        this.widgetSystem = new WidgetSystem({
            container: 'dashboard-grid',
            gridColumns: 12,
            gridRows: 'auto',
            enableDragDrop: true,
            enableResize: true,
            enableCustomization: true
        });

        // Analytics Engine
        this.analytics = new AnalyticsEngine({
            realTime: true,
            websocketUrl: 'wss://api.claudyne.com/parent/realtime',
            dataPoints: ['performance', 'engagement', 'insights', 'alerts']
        });

        // Export Manager
        this.exportManager = new ExportManager({
            formats: ['pdf', 'excel', 'csv'],
            templates: ['dashboard', 'performance', 'weekly-report']
        });
    }

    getHTML() {
        return `
            <div class="dashboard-header">
                <div class="header-content">
                    <div class="welcome-section">
                        <h1 class="dashboard-title">
                            👋 Bonjour Samuel !
                            <div class="title-badge">AI-Powered</div>
                        </h1>
                        <p class="dashboard-subtitle">
                            Analytics en temps réel et insights personnalisés pour optimiser l'apprentissage de vos enfants
                        </p>
                    </div>

                    <div class="header-actions">
                        <button class="btn-icon" onclick="dashboard.toggleCustomization()" title="Personnaliser">
                            <i class="fas fa-cog"></i>
                        </button>
                        <button class="btn-icon" onclick="dashboard.refreshData()" title="Actualiser">
                            <i class="fas fa-sync-alt" id="refresh-icon"></i>
                        </button>
                        <div class="dropdown">
                            <button class="btn-primary dropdown-toggle" onclick="dashboard.toggleExportMenu()">
                                <i class="fas fa-download"></i>
                                Exporter
                            </button>
                            <div class="dropdown-menu" id="exportMenu">
                                <a href="#" onclick="dashboard.exportData('pdf')">
                                    <i class="fas fa-file-pdf"></i> Rapport PDF
                                </a>
                                <a href="#" onclick="dashboard.exportData('excel')">
                                    <i class="fas fa-file-excel"></i> Données Excel
                                </a>
                                <a href="#" onclick="dashboard.exportData('csv')">
                                    <i class="fas fa-file-csv"></i> Export CSV
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Real-time Status -->
                <div class="realtime-status">
                    <div class="status-indicator" id="realtimeStatus">
                        <div class="status-dot"></div>
                        <span>Données en temps réel</span>
                    </div>
                    <div class="last-update" id="lastUpdate">
                        Dernière mise à jour: <span id="updateTime">--:--</span>
                    </div>
                </div>
            </div>

            <!-- Customization Panel -->
            <div class="customization-panel" id="customizationPanel">
                <div class="panel-header">
                    <h3>Personnaliser le tableau de bord</h3>
                    <button onclick="dashboard.toggleCustomization()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="panel-content">
                    <div class="widget-library" id="widgetLibrary">
                        <!-- Widgets disponibles seront chargés ici -->
                    </div>
                    <div class="layout-presets">
                        <h4>Mises en page prédéfinies</h4>
                        <div class="preset-grid">
                            <button class="preset-btn" onclick="dashboard.applyLayout('default')">
                                <div class="preset-preview">
                                    <div class="preview-grid">
                                        <div class="preview-widget"></div>
                                        <div class="preview-widget"></div>
                                        <div class="preview-widget wide"></div>
                                    </div>
                                </div>
                                <span>Standard</span>
                            </button>
                            <button class="preset-btn" onclick="dashboard.applyLayout('analytics')">
                                <div class="preset-preview">
                                    <div class="preview-grid">
                                        <div class="preview-widget wide"></div>
                                        <div class="preview-widget"></div>
                                        <div class="preview-widget"></div>
                                    </div>
                                </div>
                                <span>Analytics</span>
                            </button>
                            <button class="preset-btn" onclick="dashboard.applyLayout('compact')">
                                <div class="preset-preview">
                                    <div class="preview-grid compact">
                                        <div class="preview-widget small"></div>
                                        <div class="preview-widget small"></div>
                                        <div class="preview-widget small"></div>
                                        <div class="preview-widget small"></div>
                                    </div>
                                </div>
                                <span>Compact</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- AI Insight Alert -->
            <div class="ai-insight-container" id="aiInsightContainer">
                <!-- Les insights IA seront chargés dynamiquement -->
            </div>

            <!-- Widgets Grid -->
            <div class="dashboard-grid" id="dashboard-grid">
                <!-- Les widgets seront chargés dynamiquement -->
            </div>

            <!-- Real-time Activity Feed -->
            <div class="activity-feed" id="activityFeed">
                <div class="feed-header">
                    <h3>
                        <i class="fas fa-pulse"></i>
                        Activité en temps réel
                    </h3>
                    <button class="btn-toggle" onclick="dashboard.toggleActivityFeed()">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
                <div class="feed-content" id="feedContent">
                    <!-- Activités temps réel -->
                </div>
            </div>
        `;
    }

    async loadInitialData() {
        try {
            // Try to load real data first, fallback to mock data
            let metrics, children, activities, insights;

            try {
                // Attempt to load real data
                [metrics, children, activities, insights] = await Promise.all([
                    this.analytics.getMetrics(),
                    window.parentApp.getModule('api')?.getChildren(),
                    this.analytics.getRecentActivities(),
                    this.analytics.getAIInsights()
                ]);
            } catch (apiError) {
                console.warn('[Dashboard] API unavailable, using mock data:', apiError.message);
                // Use mock data when API is unavailable
                metrics = getMockData('dashboard.metrics');
                children = getMockData('children');
                activities = getMockData('dashboard.recentActivities');
                insights = getMockData('dashboard.aiInsight');
            }

            // Fallback to mock data if any data is missing
            this.data = {
                metrics: metrics || getMockData('dashboard.metrics'),
                children: children || getMockData('children'),
                activities: activities || getMockData('dashboard.recentActivities'),
                insights: insights || getMockData('dashboard.aiInsight')
            };

            // Mise à jour des métriques animées
            this.animateMetrics();

            // Affichage des insights IA
            this.displayAIInsights();

            console.log('[Dashboard] Data loaded successfully:', this.data);

        } catch (error) {
            console.error('[Dashboard] Failed to load initial data:', error);
            this.showDataError();
        }
    }

    async setupWidgets() {
        // Configuration des widgets par défaut
        const defaultWidgets = [
            {
                id: 'metrics-overview',
                type: 'metrics',
                title: 'Vue d\'ensemble',
                position: { x: 0, y: 0, w: 12, h: 2 },
                config: {
                    metrics: ['exercises', 'average', 'studyTime', 'achievements'],
                    showTrends: true
                }
            },
            {
                id: 'performance-chart',
                type: 'chart',
                title: 'Performance hebdomadaire',
                position: { x: 0, y: 2, w: 8, h: 4 },
                config: {
                    chartType: 'line',
                    dataSource: 'weekly-performance',
                    realTime: true
                }
            },
            {
                id: 'recent-activities',
                type: 'activity-list',
                title: 'Activités récentes',
                position: { x: 8, y: 2, w: 4, h: 4 },
                config: {
                    limit: 5,
                    autoRefresh: true,
                    showIcons: true
                }
            },
            {
                id: 'children-performance',
                type: 'children-grid',
                title: 'Performance par enfant',
                position: { x: 0, y: 6, w: 6, h: 3 },
                config: {
                    showSubjects: true,
                    showTrends: true,
                    comparisonMode: false
                }
            },
            {
                id: 'achievements',
                type: 'achievements',
                title: 'Badges & Récompenses',
                position: { x: 6, y: 6, w: 6, h: 3 },
                config: {
                    layout: 'grid',
                    showProgress: true,
                    animated: true
                }
            }
        ];

        // Charger la configuration sauvegardée ou utiliser celle par défaut
        const savedLayout = await this.loadUserLayout();
        const widgets = savedLayout || defaultWidgets;

        // Initialiser le système de widgets
        await this.widgetSystem.initialize(widgets);

        // Rendre les widgets
        for (const widget of widgets) {
            await this.renderWidget(widget);
        }
    }

    async renderWidget(widgetConfig) {
        const widgetElement = await this.widgetSystem.createWidget(widgetConfig);

        // Ajouter le contenu spécifique selon le type
        const content = await this.getWidgetContent(widgetConfig);
        this.widgetSystem.setWidgetContent(widgetConfig.id, content);

        // Ajouter les événements drag & drop
        this.widgetSystem.makeDraggable(widgetConfig.id);
        this.widgetSystem.makeResizable(widgetConfig.id);

        return widgetElement;
    }

    async getWidgetContent(config) {
        const renderers = {
            metrics: () => this.renderMetricsWidget(config),
            chart: () => this.renderChartWidget(config),
            'activity-list': () => this.renderActivityWidget(config),
            'children-grid': () => this.renderChildrenWidget(config),
            achievements: () => this.renderAchievementsWidget(config),
            calendar: () => this.renderCalendarWidget(config),
            goals: () => this.renderGoalsWidget(config),
            weather: () => this.renderWeatherWidget(config)
        };

        const renderer = renderers[config.type];
        return renderer ? await renderer() : '<div class="widget-error">Widget non supporté</div>';
    }

    async renderMetricsWidget(config) {
        const metrics = this.data.metrics;

        return `
            <div class="metrics-grid">
                <div class="metric-card" data-metric="exercises">
                    <div class="metric-icon">
                        <i class="fas fa-tasks"></i>
                    </div>
                    <div class="metric-content">
                        <div class="metric-value" data-counter="${metrics.totalExercises || 127}">0</div>
                        <div class="metric-label">Exercices complétés</div>
                        <div class="metric-trend positive">+15% cette semaine</div>
                    </div>
                </div>

                <div class="metric-card" data-metric="average">
                    <div class="metric-icon">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <div class="metric-content">
                        <div class="metric-value" data-counter="${metrics.averageScore || 89}">0</div>
                        <div class="metric-label">Score moyen (%)</div>
                        <div class="metric-trend positive">+3% ce mois</div>
                    </div>
                </div>

                <div class="metric-card" data-metric="study-time">
                    <div class="metric-icon">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="metric-content">
                        <div class="metric-value" data-counter="${metrics.studyTime || 24}">0</div>
                        <div class="metric-label">Heures d'étude</div>
                        <div class="metric-trend negative">-2h vs objectif</div>
                    </div>
                </div>

                <div class="metric-card" data-metric="achievements">
                    <div class="metric-icon">
                        <i class="fas fa-trophy"></i>
                    </div>
                    <div class="metric-content">
                        <div class="metric-value" data-counter="${metrics.achievements || 15}">0</div>
                        <div class="metric-label">Nouveaux badges</div>
                        <div class="metric-trend positive">+8 ce mois</div>
                    </div>
                </div>
            </div>
        `;
    }

    async renderChartWidget(config) {
        const chartId = `chart-${config.id}`;

        return `
            <div class="chart-widget">
                <div class="chart-controls">
                    <select class="chart-period" onchange="dashboard.updateChartPeriod('${config.id}', this.value)">
                        <option value="week">Cette semaine</option>
                        <option value="month">Ce mois</option>
                        <option value="quarter">Ce trimestre</option>
                    </select>
                </div>
                <div class="chart-container">
                    <canvas id="${chartId}" width="400" height="200"></canvas>
                </div>
                <div class="chart-legend" id="${chartId}-legend">
                    <!-- Légende générée dynamiquement -->
                </div>
            </div>
        `;
    }

    async renderActivityWidget(config) {
        const activities = this.data.activities.slice(0, config.config?.limit || 5);

        return `
            <div class="activity-widget">
                <div class="activity-list">
                    ${activities.map(activity => `
                        <div class="activity-item" data-id="${activity.id}">
                            <div class="activity-icon ${activity.type}">
                                <i class="fas fa-${this.getActivityIcon(activity.type)}"></i>
                            </div>
                            <div class="activity-content">
                                <div class="activity-title">${activity.title}</div>
                                <div class="activity-meta">
                                    ${this.formatTimeAgo(activity.timestamp)} • ${activity.child}
                                </div>
                            </div>
                            <div class="activity-score ${activity.scoreClass}">
                                ${activity.score || ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
                <button class="btn-link view-all" onclick="dashboard.viewAllActivities()">
                    Voir toutes les activités
                </button>
            </div>
        `;
    }

    async renderChildrenWidget(config) {
        const children = this.data.children;

        return `
            <div class="children-widget">
                <div class="children-grid">
                    ${children.map(child => `
                        <div class="child-card" data-child-id="${child.id}">
                            <div class="child-header">
                                <div class="child-avatar">
                                    <img src="${child.avatar}" alt="${child.name}">
                                </div>
                                <div class="child-info">
                                    <h4>${child.name}</h4>
                                    <p>${child.class} • ${child.school}</p>
                                </div>
                                <div class="child-status ${child.status}">
                                    <div class="status-dot"></div>
                                </div>
                            </div>

                            <div class="child-metrics">
                                <div class="metric">
                                    <span class="metric-label">Moyenne</span>
                                    <span class="metric-value">${child.average}/20</span>
                                </div>
                                <div class="metric">
                                    <span class="metric-label">Progression</span>
                                    <span class="metric-value ${child.trend}">${child.progressPercent}%</span>
                                </div>
                            </div>

                            <div class="subject-performance">
                                ${child.subjects?.map(subject => `
                                    <div class="subject-bar">
                                        <div class="subject-info">
                                            <span>${subject.name}</span>
                                            <span>${subject.score}%</span>
                                        </div>
                                        <div class="progress-bar">
                                            <div class="progress-fill" style="width: ${subject.score}%; background: ${this.getSubjectColor(subject.score)}"></div>
                                        </div>
                                    </div>
                                `).join('') || ''}
                            </div>

                            <button class="btn-child-detail" onclick="dashboard.viewChildDetails('${child.id}')">
                                Voir détails
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    async renderAchievementsWidget(config) {
        const achievements = [
            { icon: 'medal', name: 'Champion', category: 'Français', color: 'var(--secondary)' },
            { icon: 'fire', name: 'Série', category: '7 jours', color: 'var(--primary)' },
            { icon: 'star', name: 'Expert', category: 'Histoire', color: 'var(--warning)' },
            { icon: 'brain', name: 'Génie', category: 'Logique', color: '#8b5cf6' },
            { icon: 'rocket', name: 'Rapide', category: 'Réflexes', color: '#06b6d4' },
            { icon: 'leaf', name: 'Régulier', category: 'Assiduité', color: '#84cc16' }
        ];

        return `
            <div class="achievements-widget">
                <div class="achievements-grid">
                    ${achievements.map((achievement, index) => `
                        <div class="achievement-item" style="animation-delay: ${index * 0.1}s">
                            <div class="achievement-icon" style="background: ${achievement.color}">
                                <i class="fas fa-${achievement.icon}"></i>
                            </div>
                            <div class="achievement-name">${achievement.name}</div>
                            <div class="achievement-category">${achievement.category}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    startRealTimeUpdates() {
        // WebSocket connection pour les données temps réel
        this.connectWebSocket();

        // Fallback avec polling si WebSocket échoue
        this.startPolling();

        // Mise à jour de l'horodatage
        this.updateTimestamp();
        setInterval(() => this.updateTimestamp(), 60000);
    }

    connectWebSocket() {
        if (this.websocket) return;

        try {
            this.websocket = new WebSocket('wss://api.claudyne.com/parent/realtime');

            this.websocket.onopen = () => {
                console.log('[Dashboard] WebSocket connected');
                this.updateConnectionStatus(true);
            };

            this.websocket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleRealTimeUpdate(data);
            };

            this.websocket.onclose = () => {
                console.log('[Dashboard] WebSocket disconnected');
                this.updateConnectionStatus(false);
                // Reconnexion automatique
                setTimeout(() => this.connectWebSocket(), 5000);
            };

            this.websocket.onerror = (error) => {
                console.error('[Dashboard] WebSocket error:', error);
                this.updateConnectionStatus(false);
            };

        } catch (error) {
            console.error('[Dashboard] Failed to connect WebSocket:', error);
            this.updateConnectionStatus(false);
        }
    }

    handleRealTimeUpdate(data) {
        switch (data.type) {
            case 'performance_update':
                this.updatePerformanceData(data.payload);
                break;
            case 'new_activity':
                this.addNewActivity(data.payload);
                break;
            case 'ai_insight':
                this.displayNewInsight(data.payload);
                break;
            case 'achievement_unlocked':
                this.showAchievementNotification(data.payload);
                break;
        }

        this.updateTimestamp();
    }

    startPolling() {
        // Polling de secours pour les données critiques
        setInterval(async () => {
            if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
                try {
                    const updates = await this.analytics.getLatestUpdates();
                    this.handlePollingUpdates(updates);
                } catch (error) {
                    console.warn('[Dashboard] Polling update failed:', error);
                }
            }
        }, 30000); // Toutes les 30 secondes
    }

    // Animation et interaction methods
    animateMetrics() {
        const counters = document.querySelectorAll('[data-counter]');

        counters.forEach(counter => {
            const target = parseInt(counter.dataset.counter);
            let current = 0;
            const increment = target / 50;

            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }

                counter.textContent = Math.floor(current);
            }, 50);
        });
    }

    displayAIInsights() {
        const insights = this.data.insights;
        const container = document.getElementById('aiInsightContainer');

        if (insights.length > 0) {
            const insight = insights[0]; // Afficher le plus important

            container.innerHTML = `
                <div class="ai-insight-card">
                    <div class="insight-header">
                        <div class="ai-icon">
                            <i class="fas fa-brain"></i>
                        </div>
                        <div class="insight-content">
                            <h3>🤖 Insight IA - Action recommandée</h3>
                            <p>${insight.message}</p>
                        </div>
                        <button class="insight-close" onclick="this.parentElement.parentElement.style.display='none'">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="insight-actions">
                        <button class="btn-primary" onclick="dashboard.executeAIRecommendation('${insight.id}')">
                            <i class="fas fa-play"></i>
                            ${insight.actionLabel}
                        </button>
                        <button class="btn-secondary" onclick="dashboard.scheduleAIAction('${insight.id}')">
                            <i class="fas fa-calendar"></i>
                            Programmer plus tard
                        </button>
                    </div>
                </div>
            `;
        }
    }

    // Utility methods
    getMockChildren() {
        return [
            {
                id: 'richy',
                name: 'Richy Nono',
                class: 'Terminale S',
                school: 'Lycée de Yaoundé',
                avatar: '/assets/images/user-placeholder.svg',
                average: 15.2,
                trend: 'positive',
                progressPercent: 78,
                status: 'online',
                subjects: [
                    { name: 'Mathématiques', score: 65 },
                    { name: 'Physique', score: 78 },
                    { name: 'SVT', score: 82 },
                    { name: 'Philosophie', score: 71 }
                ]
            },
            {
                id: 'blandine',
                name: 'Blandine Mbarga',
                class: '3ème',
                school: 'Collège de Douala',
                avatar: '/assets/images/user-placeholder.svg',
                average: 17.8,
                trend: 'positive',
                progressPercent: 91,
                status: 'offline',
                subjects: [
                    { name: 'Français', score: 95 },
                    { name: 'Histoire-Géo', score: 89 },
                    { name: 'Anglais', score: 91 },
                    { name: 'Mathématiques', score: 76 }
                ]
            }
        ];
    }

    getActivityIcon(type) {
        const icons = {
            exercise: 'tasks',
            achievement: 'trophy',
            assignment: 'clipboard',
            lesson: 'book',
            test: 'pen',
            message: 'comment',
            session: 'play'
        };
        return icons[type] || 'circle';
    }

    getSubjectColor(score) {
        if (score >= 80) return 'var(--secondary)';
        if (score >= 60) return 'var(--warning)';
        return 'var(--danger)';
    }

    formatTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diff = now - time;

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 60) return `Il y a ${minutes}min`;
        if (hours < 24) return `Il y a ${hours}h`;
        return `Il y a ${days}j`;
    }

    updateConnectionStatus(connected) {
        const statusEl = document.getElementById('realtimeStatus');
        if (statusEl) {
            statusEl.className = `status-indicator ${connected ? 'connected' : 'disconnected'}`;
            statusEl.querySelector('span').textContent = connected ? 'Données en temps réel' : 'Mode hors ligne';
        }
    }

    updateTimestamp() {
        const timeEl = document.getElementById('updateTime');
        if (timeEl) {
            timeEl.textContent = new Date().toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }

    async loadStyles() {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '../css/main.css';
        document.head.appendChild(link);
    }

    // Public API methods
    async refreshData() {
        const refreshIcon = document.getElementById('refresh-icon');
        if (refreshIcon) {
            refreshIcon.classList.add('fa-spin');
        }

        try {
            await this.loadInitialData();
            await this.widgetSystem.refreshAllWidgets();

            if (window.parentApp) {
                window.parentApp.showNotification('Données actualisées', 'success');
            }
        } catch (error) {
            console.error('[Dashboard] Refresh failed:', error);
            if (window.parentApp) {
                window.parentApp.showNotification('Erreur lors de l\'actualisation', 'error');
            }
        } finally {
            if (refreshIcon) {
                refreshIcon.classList.remove('fa-spin');
            }
        }
    }

    toggleCustomization() {
        const panel = document.getElementById('customizationPanel');
        panel.classList.toggle('open');

        if (panel.classList.contains('open')) {
            this.loadWidgetLibrary();
        }
    }

    toggleExportMenu() {
        const menu = document.getElementById('exportMenu');
        menu.classList.toggle('open');
    }

    async exportData(format) {
        try {
            const data = await this.exportManager.generateReport(format, {
                data: this.data,
                widgets: this.widgetSystem.getWidgetConfigs(),
                dateRange: 'current-month'
            });

            this.exportManager.downloadFile(data, `claudyne-dashboard.${format}`);

            if (window.parentApp) {
                window.parentApp.showNotification(`Rapport ${format.toUpperCase()} généré`, 'success');
            }
        } catch (error) {
            console.error('[Dashboard] Export failed:', error);
            if (window.parentApp) {
                window.parentApp.showNotification('Erreur lors de l\'export', 'error');
            }
        }

        this.toggleExportMenu();
    }

    executeAIRecommendation(insightId) {
        // Lancer l'action recommandée par l'IA
        console.log('[Dashboard] Executing AI recommendation:', insightId);

        if (window.parentApp) {
            window.parentApp.showNotification('Session IA lancée', 'success');
        }
    }

    scheduleAIAction(insightId) {
        // Programmer l'action pour plus tard
        console.log('[Dashboard] Scheduling AI action:', insightId);

        if (window.parentApp) {
            window.parentApp.loadPage('planning');
        }
    }

    viewChildDetails(childId) {
        // Naviguer vers les détails de l'enfant
        if (window.parentApp) {
            window.parentApp.loadPage('children');
        }
    }

    viewAllActivities() {
        // Afficher toutes les activités
        if (window.parentApp) {
            window.parentApp.showNotification('Affichage de toutes les activités', 'info');
        }
    }
}

// Export global pour les interactions HTML
if (typeof window !== 'undefined') {
    window.dashboard = new Dashboard();
}

export default Dashboard;