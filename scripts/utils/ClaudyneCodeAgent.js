/**
 * ClaudyneCodeAgent - Agent spécialisé d'analyse de code ligne par ligne
 *
 * Agent autonome pour analyser, surveiller et optimiser la plateforme Claudyne
 * - Backend Node.js avec PostgreSQL
 * - Frontend Next.js avec React
 * - Mobile React Native avec Expo
 *
 * @version 1.0.0
 * @author Agent Claudyne
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const EventEmitter = require('events');

class ClaudyneCodeAgent extends EventEmitter {
    constructor(options = {}) {
        super();

        this.config = {
            projectRoot: options.projectRoot || process.cwd(),
            watchMode: options.watchMode !== false,
            analysisDepth: options.analysisDepth || 'deep',
            realTimeMode: options.realTimeMode !== false,
            autoFix: options.autoFix || false,
            ...options
        };

        // Structures de surveillance
        this.watchedFiles = new Map();
        this.analysisResults = new Map();
        this.securityIssues = [];
        this.performanceIssues = [];
        this.codeQualityIssues = [];
        this.dependencies = new Map();
        this.recommendations = [];

        // Analyseurs spécialisés
        this.analyzers = {
            security: new SecurityAnalyzer(this),
            performance: new PerformanceAnalyzer(this),
            quality: new CodeQualityAnalyzer(this),
            dependencies: new DependencyAnalyzer(this),
            architecture: new ArchitectureAnalyzer(this)
        };

        // Métriques en temps réel
        this.metrics = {
            linesAnalyzed: 0,
            filesProcessed: 0,
            issuesFound: 0,
            fixesApplied: 0,
            lastScanTime: null,
            averageProcessingTime: 0
        };

        this.initialize();
    }

    async initialize() {
        console.log('🤖 ClaudyneCodeAgent - Initialisation...');

        try {
            await this.loadProjectStructure();
            await this.setupFileWatchers();
            await this.performInitialScan();

            if (this.config.realTimeMode) {
                this.startRealTimeMonitoring();
            }

            console.log('✅ Agent Claudyne initialisé avec succès');
            this.emit('ready');

        } catch (error) {
            console.error('❌ Erreur d\'initialisation:', error);
            this.emit('error', error);
        }
    }

    async loadProjectStructure() {
        console.log('📁 Analyse de la structure du projet...');

        const projectPaths = {
            backend: path.join(this.config.projectRoot, 'backend'),
            frontend: path.join(this.config.projectRoot, 'frontend'),
            mobile: path.join(this.config.projectRoot, 'claudyne-mobile'),
            shared: path.join(this.config.projectRoot, 'shared'),
            config: path.join(this.config.projectRoot, 'config')
        };

        this.projectStructure = {};

        for (const [key, dirPath] of Object.entries(projectPaths)) {
            try {
                const exists = await fs.access(dirPath).then(() => true).catch(() => false);
                if (exists) {
                    this.projectStructure[key] = await this.scanDirectory(dirPath);
                    console.log(`  ✓ ${key}: ${this.projectStructure[key].length} fichiers trouvés`);
                }
            } catch (error) {
                console.warn(`  ⚠️ ${key}: répertoire non accessible`);
            }
        }
    }

    async scanDirectory(dirPath) {
        const files = [];
        const allowedExtensions = ['.js', '.ts', '.tsx', '.json', '.sql', '.md'];

        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);

                if (entry.isDirectory() && !this.shouldIgnoreDirectory(entry.name)) {
                    const subFiles = await this.scanDirectory(fullPath);
                    files.push(...subFiles);
                } else if (entry.isFile()) {
                    const ext = path.extname(entry.name);
                    if (allowedExtensions.includes(ext)) {
                        files.push({
                            path: fullPath,
                            name: entry.name,
                            extension: ext,
                            size: (await fs.stat(fullPath)).size,
                            lastModified: (await fs.stat(fullPath)).mtime
                        });
                    }
                }
            }
        } catch (error) {
            console.warn(`Erreur lors du scan de ${dirPath}:`, error.message);
        }

        return files;
    }

    shouldIgnoreDirectory(dirName) {
        const ignoredDirs = [
            'node_modules', '.git', '.next', 'dist', 'build',
            'coverage', '.expo', 'android', 'ios', '.vscode'
        ];
        return ignoredDirs.includes(dirName) || dirName.startsWith('.');
    }

    async setupFileWatchers() {
        if (!this.config.watchMode) return;

        console.log('👁️ Configuration des observateurs de fichiers...');

        const chokidar = require('chokidar');

        const watchPaths = [
            path.join(this.config.projectRoot, 'backend/src/**/*.{js,ts}'),
            path.join(this.config.projectRoot, 'frontend/**/*.{js,ts,tsx}'),
            path.join(this.config.projectRoot, 'claudyne-mobile/src/**/*.{js,ts,tsx}'),
            path.join(this.config.projectRoot, '*.{js,json}')
        ];

        this.watcher = chokidar.watch(watchPaths, {
            ignored: /node_modules|\.git/,
            persistent: true,
            ignoreInitial: true
        });

        this.watcher
            .on('change', (filePath) => this.onFileChanged(filePath))
            .on('add', (filePath) => this.onFileAdded(filePath))
            .on('unlink', (filePath) => this.onFileDeleted(filePath));
    }

    async onFileChanged(filePath) {
        console.log(`🔄 Fichier modifié: ${path.relative(this.config.projectRoot, filePath)}`);
        await this.analyzeFile(filePath);
        this.emit('file-changed', filePath);
    }

    async onFileAdded(filePath) {
        console.log(`➕ Nouveau fichier: ${path.relative(this.config.projectRoot, filePath)}`);
        await this.analyzeFile(filePath);
        this.emit('file-added', filePath);
    }

    async onFileDeleted(filePath) {
        console.log(`➖ Fichier supprimé: ${path.relative(this.config.projectRoot, filePath)}`);
        this.watchedFiles.delete(filePath);
        this.analysisResults.delete(filePath);
        this.emit('file-deleted', filePath);
    }

    async performInitialScan() {
        console.log('🔍 Scan initial du code...');
        const startTime = Date.now();

        const allFiles = [];
        Object.values(this.projectStructure).forEach(files => allFiles.push(...files));

        console.log(`📊 ${allFiles.length} fichiers à analyser`);

        // Analyse en parallèle avec limitation
        const batchSize = 10;
        for (let i = 0; i < allFiles.length; i += batchSize) {
            const batch = allFiles.slice(i, i + batchSize);
            await Promise.all(batch.map(file => this.analyzeFile(file.path)));

            // Progression
            const progress = Math.round(((i + batchSize) / allFiles.length) * 100);
            console.log(`  📈 Progression: ${Math.min(progress, 100)}%`);
        }

        const duration = Date.now() - startTime;
        console.log(`✅ Scan initial terminé en ${duration}ms`);

        this.generateInitialReport();
    }

    async analyzeFile(filePath) {
        try {
            const fileInfo = {
                path: filePath,
                lastAnalyzed: Date.now(),
                issues: [],
                metrics: {},
                recommendations: []
            };

            const content = await fs.readFile(filePath, 'utf8');
            const lines = content.split('\n');

            // Analyse ligne par ligne
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const lineNumber = i + 1;

                // Analyses spécialisées
                await this.analyzeLine(line, lineNumber, filePath, fileInfo);
            }

            // Analyse globale du fichier
            await this.analyzeFileGlobal(content, filePath, fileInfo);

            this.analysisResults.set(filePath, fileInfo);
            this.metrics.linesAnalyzed += lines.length;
            this.metrics.filesProcessed++;

        } catch (error) {
            console.error(`Erreur analyse ${filePath}:`, error.message);
        }
    }

    async analyzeLine(line, lineNumber, filePath, fileInfo) {
        // Analyse de sécurité
        const securityIssues = this.analyzers.security.analyzeLine(line, lineNumber, filePath);
        if (securityIssues.length > 0) {
            fileInfo.issues.push(...securityIssues);
            this.securityIssues.push(...securityIssues);
        }

        // Analyse de performance
        const performanceIssues = this.analyzers.performance.analyzeLine(line, lineNumber, filePath);
        if (performanceIssues.length > 0) {
            fileInfo.issues.push(...performanceIssues);
            this.performanceIssues.push(...performanceIssues);
        }

        // Analyse de qualité
        const qualityIssues = this.analyzers.quality.analyzeLine(line, lineNumber, filePath);
        if (qualityIssues.length > 0) {
            fileInfo.issues.push(...qualityIssues);
            this.codeQualityIssues.push(...qualityIssues);
        }
    }

    async analyzeFileGlobal(content, filePath, fileInfo) {
        // Analyse architecturale
        const archIssues = this.analyzers.architecture.analyzeFile(content, filePath);
        fileInfo.issues.push(...archIssues);

        // Analyse des dépendances
        if (path.basename(filePath) === 'package.json') {
            const depIssues = await this.analyzers.dependencies.analyzePackageJson(content, filePath);
            fileInfo.issues.push(...depIssues);
        }

        // Métriques du fichier
        fileInfo.metrics = {
            lines: content.split('\n').length,
            complexity: this.calculateComplexity(content),
            duplicateLines: this.findDuplicateLines(content),
            size: Buffer.byteLength(content, 'utf8')
        };

        // Génération de recommandations
        fileInfo.recommendations = this.generateFileRecommendations(fileInfo);
    }

    calculateComplexity(content) {
        // Complexité cyclomatique simplifiée
        const keywords = ['if', 'else', 'while', 'for', 'switch', 'case', 'catch', 'try'];
        let complexity = 1; // Base complexity

        for (const keyword of keywords) {
            const regex = new RegExp(`\\b${keyword}\\b`, 'g');
            const matches = content.match(regex);
            if (matches) {
                complexity += matches.length;
            }
        }

        return complexity;
    }

    findDuplicateLines(content) {
        const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 5);
        const counts = {};
        let duplicates = 0;

        lines.forEach(line => {
            counts[line] = (counts[line] || 0) + 1;
            if (counts[line] === 2) duplicates++;
        });

        return duplicates;
    }

    generateFileRecommendations(fileInfo) {
        const recommendations = [];

        // Recommandations basées sur les métriques
        if (fileInfo.metrics.lines > 500) {
            recommendations.push({
                type: 'refactor',
                priority: 'medium',
                message: 'Fichier volumineux - considérer la division en modules plus petits',
                line: null
            });
        }

        if (fileInfo.metrics.complexity > 20) {
            recommendations.push({
                type: 'complexity',
                priority: 'high',
                message: 'Complexité élevée - simplifier la logique',
                line: null
            });
        }

        if (fileInfo.metrics.duplicateLines > 5) {
            recommendations.push({
                type: 'duplication',
                priority: 'medium',
                message: 'Code dupliqué détecté - extraire en fonctions communes',
                line: null
            });
        }

        return recommendations;
    }

    startRealTimeMonitoring() {
        console.log('🔄 Monitoring temps réel activé');

        // Monitoring périodique
        setInterval(() => {
            this.performHealthCheck();
        }, 30000); // Toutes les 30 secondes

        // Surveillance des processus
        setInterval(() => {
            this.monitorSystemResources();
        }, 60000); // Toutes les minutes
    }

    async performHealthCheck() {
        const issues = this.getAllIssues();
        const criticalIssues = issues.filter(i => i.priority === 'critical');

        if (criticalIssues.length > 0) {
            console.warn(`⚠️ ${criticalIssues.length} problèmes critiques détectés`);
            this.emit('critical-issues', criticalIssues);
        }

        this.emit('health-check', {
            timestamp: Date.now(),
            totalIssues: issues.length,
            criticalIssues: criticalIssues.length,
            metrics: this.metrics
        });
    }

    monitorSystemResources() {
        try {
            const memUsage = process.memoryUsage();
            const cpuUsage = process.cpuUsage();

            this.emit('system-metrics', {
                memory: {
                    used: Math.round(memUsage.heapUsed / 1024 / 1024),
                    total: Math.round(memUsage.heapTotal / 1024 / 1024)
                },
                cpu: cpuUsage,
                uptime: process.uptime()
            });
        } catch (error) {
            console.error('Erreur monitoring système:', error);
        }
    }

    getAllIssues() {
        return [
            ...this.securityIssues,
            ...this.performanceIssues,
            ...this.codeQualityIssues
        ];
    }

    generateInitialReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                filesAnalyzed: this.metrics.filesProcessed,
                linesAnalyzed: this.metrics.linesAnalyzed,
                totalIssues: this.getAllIssues().length,
                securityIssues: this.securityIssues.length,
                performanceIssues: this.performanceIssues.length,
                qualityIssues: this.codeQualityIssues.length
            },
            topIssues: this.getTopIssues(),
            recommendations: this.getTopRecommendations(),
            metrics: this.metrics
        };

        console.log('\n📊 RAPPORT D\'ANALYSE INITIAL');
        console.log('==============================');
        console.log(`📁 Fichiers analysés: ${report.summary.filesAnalyzed}`);
        console.log(`📝 Lignes analysées: ${report.summary.linesAnalyzed}`);
        console.log(`🚨 Problèmes trouvés: ${report.summary.totalIssues}`);
        console.log(`  🔒 Sécurité: ${report.summary.securityIssues}`);
        console.log(`  ⚡ Performance: ${report.summary.performanceIssues}`);
        console.log(`  ✨ Qualité: ${report.summary.qualityIssues}`);

        this.emit('initial-report', report);
        return report;
    }

    getTopIssues(limit = 10) {
        return this.getAllIssues()
            .sort((a, b) => this.getIssuePriorityScore(b) - this.getIssuePriorityScore(a))
            .slice(0, limit);
    }

    getIssuePriorityScore(issue) {
        const scores = { critical: 100, high: 75, medium: 50, low: 25 };
        return scores[issue.priority] || 0;
    }

    getTopRecommendations(limit = 10) {
        const allRecommendations = [];
        this.analysisResults.forEach(fileInfo => {
            allRecommendations.push(...fileInfo.recommendations);
        });

        return allRecommendations
            .sort((a, b) => this.getIssuePriorityScore(b) - this.getIssuePriorityScore(a))
            .slice(0, limit);
    }

    // API publique pour intégration
    async getProjectStatus() {
        return {
            status: 'active',
            lastScan: this.metrics.lastScanTime,
            issues: this.getAllIssues().length,
            files: this.metrics.filesProcessed,
            recommendations: this.getTopRecommendations(5)
        };
    }

    async getFileAnalysis(filePath) {
        return this.analysisResults.get(filePath) || null;
    }

    async getSecurityReport() {
        return {
            total: this.securityIssues.length,
            critical: this.securityIssues.filter(i => i.priority === 'critical'),
            high: this.securityIssues.filter(i => i.priority === 'high'),
            recommendations: this.securityIssues.slice(0, 10)
        };
    }

    destroy() {
        if (this.watcher) {
            this.watcher.close();
        }
        this.removeAllListeners();
        console.log('🛑 Agent Claudyne arrêté');
    }
}

// Analyseurs spécialisés
class SecurityAnalyzer {
    constructor(agent) {
        this.agent = agent;
        this.patterns = this.loadSecurityPatterns();
    }

    loadSecurityPatterns() {
        return {
            sqlInjection: [
                /query.*\+.*\$\{/g,
                /SELECT.*\+.*\$\{/gi,
                /INSERT.*\+.*\$\{/gi,
                /UPDATE.*\+.*\$\{/gi,
                /DELETE.*\+.*\$\{/gi
            ],
            xss: [
                /innerHTML.*\+/g,
                /document\.write.*\+/g,
                /\.html\(.*\+/g
            ],
            secrets: [
                /password\s*[:=]\s*['"]/gi,
                /api[_-]?key\s*[:=]\s*['"]/gi,
                /secret\s*[:=]\s*['"]/gi,
                /token\s*[:=]\s*['"]/gi
            ],
            crypto: [
                /crypto\.createHash\(['"]md5/gi,
                /crypto\.createHash\(['"]sha1/gi
            ]
        };
    }

    analyzeLine(line, lineNumber, filePath) {
        const issues = [];

        // Détection SQL Injection
        for (const pattern of this.patterns.sqlInjection) {
            if (pattern.test(line)) {
                issues.push({
                    type: 'security',
                    category: 'sql-injection',
                    priority: 'critical',
                    message: 'Risque d\'injection SQL détecté',
                    line: lineNumber,
                    file: filePath,
                    code: line.trim()
                });
            }
        }

        // Détection XSS
        for (const pattern of this.patterns.xss) {
            if (pattern.test(line)) {
                issues.push({
                    type: 'security',
                    category: 'xss',
                    priority: 'high',
                    message: 'Risque XSS détecté',
                    line: lineNumber,
                    file: filePath,
                    code: line.trim()
                });
            }
        }

        // Détection de secrets hardcodés
        for (const pattern of this.patterns.secrets) {
            if (pattern.test(line)) {
                issues.push({
                    type: 'security',
                    category: 'hardcoded-secret',
                    priority: 'critical',
                    message: 'Secret potentiellement hardcodé détecté',
                    line: lineNumber,
                    file: filePath,
                    code: line.replace(/['"'].*['"']/, '"***"') // Masquer la valeur
                });
            }
        }

        // Détection d'algorithmes cryptographiques faibles
        for (const pattern of this.patterns.crypto) {
            if (pattern.test(line)) {
                issues.push({
                    type: 'security',
                    category: 'weak-crypto',
                    priority: 'medium',
                    message: 'Algorithme cryptographique faible détecté',
                    line: lineNumber,
                    file: filePath,
                    code: line.trim()
                });
            }
        }

        return issues;
    }
}

class PerformanceAnalyzer {
    constructor(agent) {
        this.agent = agent;
    }

    analyzeLine(line, lineNumber, filePath) {
        const issues = [];

        // Détection de boucles synchrones
        if (/for\s*\(.*\.length/.test(line) && /\+\+/.test(line)) {
            issues.push({
                type: 'performance',
                category: 'inefficient-loop',
                priority: 'medium',
                message: 'Boucle potentiellement inefficace détectée',
                line: lineNumber,
                file: filePath,
                suggestion: 'Considérer l\'utilisation de forEach() ou map()'
            });
        }

        // Détection de requêtes synchrones
        if (/\.sync\(/.test(line) || /Sync\(/.test(line)) {
            issues.push({
                type: 'performance',
                category: 'sync-operation',
                priority: 'high',
                message: 'Opération synchrone détectée',
                line: lineNumber,
                file: filePath,
                suggestion: 'Utiliser la version asynchrone'
            });
        }

        // Détection de console.log en production
        if (/console\.log/.test(line) && filePath.includes('production')) {
            issues.push({
                type: 'performance',
                category: 'debug-code',
                priority: 'low',
                message: 'console.log détecté en production',
                line: lineNumber,
                file: filePath,
                suggestion: 'Utiliser un logger approprié'
            });
        }

        return issues;
    }
}

class CodeQualityAnalyzer {
    constructor(agent) {
        this.agent = agent;
    }

    analyzeLine(line, lineNumber, filePath) {
        const issues = [];

        // Détection de code dupliqué (basique)
        if (line.length > 100) {
            issues.push({
                type: 'quality',
                category: 'long-line',
                priority: 'low',
                message: 'Ligne trop longue',
                line: lineNumber,
                file: filePath,
                suggestion: 'Diviser en plusieurs lignes'
            });
        }

        // Détection de TODO/FIXME
        if (/TODO|FIXME|HACK/i.test(line)) {
            issues.push({
                type: 'quality',
                category: 'todo',
                priority: 'low',
                message: 'Code temporaire détecté',
                line: lineNumber,
                file: filePath,
                suggestion: 'Finaliser l\'implémentation'
            });
        }

        // Détection de fonctions trop complexes (approximation)
        if (/function.*\{$/.test(line) || /const.*=.*\{$/.test(line)) {
            // Marquer pour analyse de complexité
        }

        return issues;
    }
}

class DependencyAnalyzer {
    constructor(agent) {
        this.agent = agent;
        this.vulnerablePackages = new Set(['lodash@4.17.15', 'serialize-javascript@3.0.0']);
    }

    async analyzePackageJson(content, filePath) {
        const issues = [];

        try {
            const packageJson = JSON.parse(content);
            const allDeps = {
                ...packageJson.dependencies,
                ...packageJson.devDependencies
            };

            for (const [pkg, version] of Object.entries(allDeps)) {
                const fullName = `${pkg}@${version}`;

                if (this.vulnerablePackages.has(fullName)) {
                    issues.push({
                        type: 'dependency',
                        category: 'vulnerable-package',
                        priority: 'high',
                        message: `Dépendance vulnérable détectée: ${pkg}`,
                        file: filePath,
                        suggestion: 'Mettre à jour vers une version sécurisée'
                    });
                }

                // Vérification des versions obsolètes (basique)
                if (version.startsWith('^0.') || version.startsWith('~0.')) {
                    issues.push({
                        type: 'dependency',
                        category: 'outdated-package',
                        priority: 'low',
                        message: `Version potentiellement obsolète: ${pkg}`,
                        file: filePath,
                        suggestion: 'Vérifier les mises à jour disponibles'
                    });
                }
            }
        } catch (error) {
            issues.push({
                type: 'dependency',
                category: 'invalid-json',
                priority: 'medium',
                message: 'Fichier package.json invalide',
                file: filePath,
                error: error.message
            });
        }

        return issues;
    }
}

class ArchitectureAnalyzer {
    constructor(agent) {
        this.agent = agent;
    }

    analyzeFile(content, filePath) {
        const issues = [];

        // Analyse des imports/requires
        const imports = this.extractImports(content);

        // Détection d'imports circulaires (basique)
        if (imports.length > 20) {
            issues.push({
                type: 'architecture',
                category: 'too-many-imports',
                priority: 'medium',
                message: 'Trop d\'imports détectés',
                file: filePath,
                suggestion: 'Revoir la structure des dépendances'
            });
        }

        // Détection de violations de couches
        if (filePath.includes('/models/') && content.includes('require(.*routes)')) {
            issues.push({
                type: 'architecture',
                category: 'layer-violation',
                priority: 'high',
                message: 'Violation de couche: modèle dépend de route',
                file: filePath,
                suggestion: 'Respecter l\'architecture en couches'
            });
        }

        return issues;
    }

    extractImports(content) {
        const imports = [];
        const requireRegex = /require\(['"`]([^'"`]+)['"`]\)/g;
        const importRegex = /import.*from\s+['"`]([^'"`]+)['"`]/g;

        let match;
        while ((match = requireRegex.exec(content)) !== null) {
            imports.push(match[1]);
        }
        while ((match = importRegex.exec(content)) !== null) {
            imports.push(match[1]);
        }

        return imports;
    }
}

module.exports = ClaudyneCodeAgent;

// Utilisation autonome si exécuté directement
if (require.main === module) {
    const agent = new ClaudyneCodeAgent({
        projectRoot: __dirname,
        watchMode: true,
        realTimeMode: true
    });

    // Gestion des événements
    agent.on('ready', () => {
        console.log('🚀 Agent prêt à surveiller le code');
    });

    agent.on('critical-issues', (issues) => {
        console.log('🚨 PROBLÈMES CRITIQUES DÉTECTÉS:');
        issues.forEach(issue => {
            console.log(`  - ${issue.message} (${issue.file}:${issue.line})`);
        });
    });

    agent.on('file-changed', (filePath) => {
        console.log(`📝 Analyse mise à jour: ${path.relative(__dirname, filePath)}`);
    });

    // Arrêt propre
    process.on('SIGINT', () => {
        console.log('\n🛑 Arrêt de l\'agent...');
        agent.destroy();
        process.exit(0);
    });
}