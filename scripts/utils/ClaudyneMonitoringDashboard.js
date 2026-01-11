/**
 * ClaudyneMonitoringDashboard - Interface de surveillance en temps réel
 *
 * Dashboard web pour visualiser les analyses et métriques de l'agent Claudyne
 * Interface temps réel avec WebSocket pour les mises à jour
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs').promises;

class ClaudyneMonitoringDashboard {
    constructor(agent, options = {}) {
        this.agent = agent;
        this.config = {
            port: options.port || 3333,
            updateInterval: options.updateInterval || 5000,
            ...options
        };

        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server);

        this.connectedClients = new Set();
        this.metrics = {
            pageViews: 0,
            activeConnections: 0,
            lastUpdate: null
        };

        this.setupExpress();
        this.setupWebSocket();
        this.setupAgentListeners();
    }

    setupExpress() {
        // Middleware
        this.app.use(express.static(path.join(__dirname, 'public')));
        this.app.use(express.json());

        // Routes API
        this.app.get('/api/status', async (req, res) => {
            const status = await this.agent.getProjectStatus();
            res.json({
                ...status,
                dashboard: {
                    uptime: process.uptime(),
                    connections: this.connectedClients.size,
                    lastUpdate: this.metrics.lastUpdate
                }
            });
        });

        this.app.get('/api/security-report', async (req, res) => {
            const report = await this.agent.getSecurityReport();
            res.json(report);
        });

        this.app.get('/api/file-analysis/:path(*)', async (req, res) => {
            const filePath = req.params.path;
            const analysis = await this.agent.getFileAnalysis(filePath);
            res.json(analysis || { error: 'Fichier non trouvé' });
        });

        this.app.get('/api/metrics', (req, res) => {
            res.json({
                agent: this.agent.metrics,
                dashboard: this.metrics,
                issues: {
                    total: this.agent.getAllIssues().length,
                    critical: this.agent.getAllIssues().filter(i => i.priority === 'critical').length,
                    high: this.agent.getAllIssues().filter(i => i.priority === 'high').length
                }
            });
        });

        // Route principale
        this.app.get('/', (req, res) => {
            this.metrics.pageViews++;
            res.send(this.generateDashboardHTML());
        });
    }

    setupWebSocket() {
        this.io.on('connection', (socket) => {
            console.log(`📱 Nouvelle connexion dashboard: ${socket.id}`);
            this.connectedClients.add(socket.id);
            this.metrics.activeConnections = this.connectedClients.size;

            // Envoi des données initiales
            socket.emit('initial-data', {
                metrics: this.agent.metrics,
                issues: this.agent.getAllIssues(),
                recommendations: this.agent.getTopRecommendations(10)
            });

            socket.on('disconnect', () => {
                console.log(`📱 Déconnexion dashboard: ${socket.id}`);
                this.connectedClients.delete(socket.id);
                this.metrics.activeConnections = this.connectedClients.size;
            });

            socket.on('request-file-analysis', async (filePath) => {
                const analysis = await this.agent.getFileAnalysis(filePath);
                socket.emit('file-analysis-result', { filePath, analysis });
            });
        });

        // Envoi périodique des métriques
        setInterval(() => {
            this.broadcastMetrics();
        }, this.config.updateInterval);
    }

    setupAgentListeners() {
        this.agent.on('file-changed', (filePath) => {
            this.io.emit('file-changed', {
                filePath: path.relative(this.agent.config.projectRoot, filePath),
                timestamp: Date.now()
            });
        });

        this.agent.on('critical-issues', (issues) => {
            this.io.emit('critical-alert', {
                issues,
                timestamp: Date.now()
            });
        });

        this.agent.on('health-check', (data) => {
            this.io.emit('health-update', data);
            this.metrics.lastUpdate = data.timestamp;
        });

        this.agent.on('system-metrics', (data) => {
            this.io.emit('system-metrics', data);
        });
    }

    broadcastMetrics() {
        const data = {
            agent: this.agent.metrics,
            issues: {
                total: this.agent.getAllIssues().length,
                byPriority: this.getIssuesByPriority(),
                byCategory: this.getIssuesByCategory()
            },
            files: this.agent.metrics.filesProcessed,
            lines: this.agent.metrics.linesAnalyzed,
            timestamp: Date.now()
        };

        this.io.emit('metrics-update', data);
    }

    getIssuesByPriority() {
        const issues = this.agent.getAllIssues();
        return {
            critical: issues.filter(i => i.priority === 'critical').length,
            high: issues.filter(i => i.priority === 'high').length,
            medium: issues.filter(i => i.priority === 'medium').length,
            low: issues.filter(i => i.priority === 'low').length
        };
    }

    getIssuesByCategory() {
        const issues = this.agent.getAllIssues();
        const categories = {};

        issues.forEach(issue => {
            categories[issue.category] = (categories[issue.category] || 0) + 1;
        });

        return categories;
    }

    generateDashboardHTML() {
        return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Claudyne Code Agent - Dashboard</title>
    <script src="/socket.io/socket.io.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            min-height: 100vh;
        }

        .header {
            background: rgba(0,0,0,0.2);
            padding: 1rem 2rem;
            backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        .header h1 {
            font-size: 2rem;
            margin-bottom: 0.5rem;
        }

        .header .subtitle {
            opacity: 0.8;
            font-size: 1rem;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 2rem;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
        }

        .card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 1.5rem;
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: transform 0.3s ease;
        }

        .card:hover {
            transform: translateY(-5px);
        }

        .card h2 {
            margin-bottom: 1rem;
            font-size: 1.3rem;
            color: #fff;
        }

        .metric {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.5rem 0;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        .metric:last-child {
            border-bottom: none;
        }

        .metric-value {
            font-weight: bold;
            font-size: 1.1rem;
        }

        .status-indicator {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            display: inline-block;
            margin-right: 8px;
        }

        .status-ok { background: #4CAF50; }
        .status-warning { background: #FF9800; }
        .status-error { background: #F44336; }

        .issue-item {
            background: rgba(0,0,0,0.3);
            padding: 1rem;
            margin: 0.5rem 0;
            border-radius: 8px;
            border-left: 4px solid;
        }

        .issue-critical { border-left-color: #F44336; }
        .issue-high { border-left-color: #FF9800; }
        .issue-medium { border-left-color: #FFC107; }
        .issue-low { border-left-color: #4CAF50; }

        .issue-title {
            font-weight: bold;
            margin-bottom: 0.5rem;
        }

        .issue-details {
            font-size: 0.9rem;
            opacity: 0.8;
        }

        .chart-container {
            position: relative;
            height: 300px;
            margin-top: 1rem;
        }

        .real-time-indicator {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(76, 175, 80, 0.9);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.9rem;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.7; }
            100% { opacity: 1; }
        }

        .alert {
            background: rgba(244, 67, 54, 0.9);
            color: white;
            padding: 1rem;
            border-radius: 8px;
            margin: 1rem 0;
            animation: slideIn 0.5s ease;
        }

        @keyframes slideIn {
            from { transform: translateX(-100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }

        .file-list {
            max-height: 400px;
            overflow-y: auto;
        }

        .file-item {
            padding: 0.5rem;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            cursor: pointer;
            transition: background 0.3s ease;
        }

        .file-item:hover {
            background: rgba(255,255,255,0.1);
        }

        .recommendations {
            list-style: none;
        }

        .recommendation {
            background: rgba(0,0,0,0.2);
            padding: 1rem;
            margin: 0.5rem 0;
            border-radius: 8px;
            border-left: 4px solid #2196F3;
        }
    </style>
</head>
<body>
    <div class="real-time-indicator">
        <span class="status-indicator status-ok"></span>
        Temps Réel Actif
    </div>

    <div class="header">
        <h1>🤖 Claudyne Code Agent Dashboard</h1>
        <p class="subtitle">Surveillance et analyse en temps réel de la plateforme Claudyne</p>
    </div>

    <div class="container">
        <!-- Métriques générales -->
        <div class="card">
            <h2>📊 Métriques Générales</h2>
            <div class="metric">
                <span>Fichiers analysés</span>
                <span class="metric-value" id="files-count">-</span>
            </div>
            <div class="metric">
                <span>Lignes de code</span>
                <span class="metric-value" id="lines-count">-</span>
            </div>
            <div class="metric">
                <span>Problèmes détectés</span>
                <span class="metric-value" id="issues-count">-</span>
            </div>
            <div class="metric">
                <span>Dernière analyse</span>
                <span class="metric-value" id="last-scan">-</span>
            </div>
        </div>

        <!-- État de sécurité -->
        <div class="card">
            <h2>🔒 Sécurité</h2>
            <div class="metric">
                <span>Problèmes critiques</span>
                <span class="metric-value" id="critical-issues">-</span>
            </div>
            <div class="metric">
                <span>Problèmes élevés</span>
                <span class="metric-value" id="high-issues">-</span>
            </div>
            <div class="metric">
                <span>Score sécurité</span>
                <span class="metric-value" id="security-score">-</span>
            </div>
        </div>

        <!-- Performance -->
        <div class="card">
            <h2>⚡ Performance</h2>
            <div class="metric">
                <span>Temps d'analyse moyen</span>
                <span class="metric-value" id="avg-time">-</span>
            </div>
            <div class="metric">
                <span>Complexité moyenne</span>
                <span class="metric-value" id="avg-complexity">-</span>
            </div>
            <div class="metric">
                <span>Fichiers optimisables</span>
                <span class="metric-value" id="optimizable">-</span>
            </div>
        </div>

        <!-- Graphique des issues -->
        <div class="card">
            <h2>📈 Évolution des Problèmes</h2>
            <div class="chart-container">
                <canvas id="issuesChart"></canvas>
            </div>
        </div>

        <!-- Problèmes récents -->
        <div class="card">
            <h2>🚨 Problèmes Récents</h2>
            <div id="recent-issues">
                <p>Chargement...</p>
            </div>
        </div>

        <!-- Recommandations -->
        <div class="card">
            <h2>💡 Recommandations</h2>
            <ul class="recommendations" id="recommendations">
                <li>Chargement des recommandations...</li>
            </ul>
        </div>

        <!-- Fichiers surveillés -->
        <div class="card">
            <h2>📁 Fichiers Surveillés</h2>
            <div class="file-list" id="watched-files">
                <p>Chargement...</p>
            </div>
        </div>

        <!-- Système -->
        <div class="card">
            <h2>🖥️ Système</h2>
            <div class="metric">
                <span>Mémoire utilisée</span>
                <span class="metric-value" id="memory-usage">-</span>
            </div>
            <div class="metric">
                <span>Connexions actives</span>
                <span class="metric-value" id="active-connections">-</span>
            </div>
            <div class="metric">
                <span>Uptime</span>
                <span class="metric-value" id="uptime">-</span>
            </div>
        </div>
    </div>

    <script>
        // Configuration WebSocket
        const socket = io();
        let issuesChart;

        // Initialisation
        socket.on('connect', () => {
            console.log('Connecté au dashboard');
            updateConnectionStatus(true);
        });

        socket.on('disconnect', () => {
            console.log('Déconnecté du dashboard');
            updateConnectionStatus(false);
        });

        // Données initiales
        socket.on('initial-data', (data) => {
            updateMetrics(data.metrics);
            updateIssues(data.issues);
            updateRecommendations(data.recommendations);
            initializeChart();
        });

        // Mises à jour en temps réel
        socket.on('metrics-update', (data) => {
            updateMetrics(data.agent);
            updateIssuesCount(data.issues);
            updateChart(data);
        });

        socket.on('file-changed', (data) => {
            showNotification(\`Fichier modifié: \${data.filePath}\`, 'info');
        });

        socket.on('critical-alert', (data) => {
            showCriticalAlert(data.issues);
        });

        socket.on('health-update', (data) => {
            updateHealthStatus(data);
        });

        socket.on('system-metrics', (data) => {
            updateSystemMetrics(data);
        });

        // Fonctions de mise à jour
        function updateMetrics(metrics) {
            document.getElementById('files-count').textContent = metrics.filesProcessed || 0;
            document.getElementById('lines-count').textContent = (metrics.linesAnalyzed || 0).toLocaleString();
            document.getElementById('last-scan').textContent = metrics.lastScanTime ?
                new Date(metrics.lastScanTime).toLocaleTimeString() : 'Jamais';
        }

        function updateIssuesCount(issues) {
            document.getElementById('issues-count').textContent = issues.total || 0;
            document.getElementById('critical-issues').textContent = issues.byPriority?.critical || 0;
            document.getElementById('high-issues').textContent = issues.byPriority?.high || 0;

            // Calcul du score de sécurité
            const total = issues.total || 1;
            const critical = issues.byPriority?.critical || 0;
            const score = Math.max(0, 100 - (critical * 20) - ((issues.byPriority?.high || 0) * 10));
            document.getElementById('security-score').textContent = score + '%';
        }

        function updateIssues(issues) {
            const container = document.getElementById('recent-issues');
            if (!issues || issues.length === 0) {
                container.innerHTML = '<p>Aucun problème détecté</p>';
                return;
            }

            container.innerHTML = issues.slice(0, 5).map(issue => \`
                <div class="issue-item issue-\${issue.priority}">
                    <div class="issue-title">\${issue.message}</div>
                    <div class="issue-details">
                        \${issue.file ? \`Fichier: \${issue.file.split('/').pop()}\` : ''}
                        \${issue.line ? \` - Ligne: \${issue.line}\` : ''}
                    </div>
                </div>
            \`).join('');
        }

        function updateRecommendations(recommendations) {
            const container = document.getElementById('recommendations');
            if (!recommendations || recommendations.length === 0) {
                container.innerHTML = '<li>Aucune recommandation</li>';
                return;
            }

            container.innerHTML = recommendations.slice(0, 5).map(rec => \`
                <li class="recommendation">
                    <strong>\${rec.message}</strong>
                    \${rec.suggestion ? \`<br><small>\${rec.suggestion}</small>\` : ''}
                </li>
            \`).join('');
        }

        function updateSystemMetrics(data) {
            if (data.memory) {
                document.getElementById('memory-usage').textContent =
                    \`\${data.memory.used}MB / \${data.memory.total}MB\`;
            }

            if (data.uptime) {
                const hours = Math.floor(data.uptime / 3600);
                const minutes = Math.floor((data.uptime % 3600) / 60);
                document.getElementById('uptime').textContent = \`\${hours}h \${minutes}m\`;
            }
        }

        function initializeChart() {
            const ctx = document.getElementById('issuesChart').getContext('2d');
            issuesChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Problèmes Critiques',
                        data: [],
                        borderColor: '#F44336',
                        backgroundColor: 'rgba(244, 67, 54, 0.1)',
                        tension: 0.1
                    }, {
                        label: 'Problèmes Élevés',
                        data: [],
                        borderColor: '#FF9800',
                        backgroundColor: 'rgba(255, 152, 0, 0.1)',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: { color: 'white' }
                        }
                    },
                    scales: {
                        x: {
                            ticks: { color: 'white' },
                            grid: { color: 'rgba(255,255,255,0.1)' }
                        },
                        y: {
                            ticks: { color: 'white' },
                            grid: { color: 'rgba(255,255,255,0.1)' }
                        }
                    }
                }
            });
        }

        function updateChart(data) {
            if (!issuesChart) return;

            const now = new Date().toLocaleTimeString();
            const maxPoints = 20;

            // Ajouter nouveau point
            issuesChart.data.labels.push(now);
            issuesChart.data.datasets[0].data.push(data.issues.byPriority?.critical || 0);
            issuesChart.data.datasets[1].data.push(data.issues.byPriority?.high || 0);

            // Limiter le nombre de points
            if (issuesChart.data.labels.length > maxPoints) {
                issuesChart.data.labels.shift();
                issuesChart.data.datasets[0].data.shift();
                issuesChart.data.datasets[1].data.shift();
            }

            issuesChart.update('none');
        }

        function showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.className = 'alert';
            notification.textContent = message;

            document.body.appendChild(notification);

            setTimeout(() => {
                notification.remove();
            }, 5000);
        }

        function showCriticalAlert(issues) {
            const alert = document.createElement('div');
            alert.className = 'alert';
            alert.innerHTML = \`
                <strong>🚨 ALERTE CRITIQUE</strong><br>
                \${issues.length} problème(s) critique(s) détecté(s)
            \`;

            document.body.appendChild(alert);

            setTimeout(() => {
                alert.remove();
            }, 10000);
        }

        function updateConnectionStatus(connected) {
            const indicator = document.querySelector('.real-time-indicator .status-indicator');
            if (connected) {
                indicator.className = 'status-indicator status-ok';
            } else {
                indicator.className = 'status-indicator status-error';
            }
        }

        // Chargement initial des données
        fetch('/api/metrics')
            .then(res => res.json())
            .then(data => {
                updateMetrics(data.agent);
                updateIssuesCount(data.issues);
            })
            .catch(err => console.error('Erreur chargement métriques:', err));
    </script>
</body>
</html>
        `;
    }

    start() {
        this.server.listen(this.config.port, () => {
            console.log(`🌐 Dashboard Claudyne démarré sur http://localhost:${this.config.port}`);
        });
    }

    stop() {
        this.server.close();
        console.log('🛑 Dashboard arrêté');
    }
}

module.exports = ClaudyneMonitoringDashboard;