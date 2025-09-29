#!/usr/bin/env node
/**
 * start-claudyne-agent.js - Script de démarrage unifié pour l'agent Claudyne
 *
 * Point d'entrée principal pour démarrer tous les composants de l'agent
 * avec configuration automatique et interface utilisateur
 */

const ClaudyneCodeAgent = require('./ClaudyneCodeAgent');
const ClaudyneMonitoringDashboard = require('./ClaudyneMonitoringDashboard');
const ClaudyneWorkflowIntegration = require('./ClaudyneWorkflowIntegration');
const ClaudyneIntelligentRecommendations = require('./ClaudyneIntelligentRecommendations');

const path = require('path');
const fs = require('fs').promises;

class ClaudyneAgentLauncher {
    constructor() {
        this.config = this.loadConfiguration();
        this.components = {
            agent: null,
            dashboard: null,
            workflow: null,
            recommendations: null
        };
    }

    loadConfiguration() {
        const defaultConfig = {
            // Configuration de l'agent
            agent: {
                projectRoot: process.cwd(),
                watchMode: true,
                realTimeMode: true,
                analysisDepth: 'deep',
                autoFix: false
            },

            // Configuration du dashboard
            dashboard: {
                port: 3333,
                updateInterval: 5000
            },

            // Configuration workflow
            workflow: {
                gitIntegration: true,
                cicdIntegration: true,
                autoCommit: false,
                notifications: {
                    slack: process.env.SLACK_WEBHOOK_URL,
                    email: process.env.EMAIL_NOTIFICATIONS === 'true',
                    webhook: process.env.WEBHOOK_URL
                }
            },

            // Configuration recommandations
            recommendations: {
                enabled: true,
                learningMode: true
            }
        };

        // Charger la configuration personnalisée si elle existe
        try {
            const customConfig = require('./claudyne-agent-config.json');
            return { ...defaultConfig, ...customConfig };
        } catch (error) {
            return defaultConfig;
        }
    }

    async start() {
        console.log('🚀 Démarrage de l\'agent Claudyne...');
        console.log('=======================================');

        try {
            // Vérifications préliminaires
            await this.performPreflightChecks();

            // Initialiser les composants
            await this.initializeComponents();

            // Démarrer les services
            await this.startServices();

            // Configuration des signaux système
            this.setupSignalHandlers();

            // Affichage des informations de démarrage
            this.displayStartupInfo();

        } catch (error) {
            console.error('❌ Erreur lors du démarrage:', error);
            process.exit(1);
        }
    }

    async performPreflightChecks() {
        console.log('🔍 Vérifications préliminaires...');

        // Vérifier Node.js version
        const nodeVersion = process.version;
        const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
        if (majorVersion < 16) {
            throw new Error(`Node.js 16+ requis. Version actuelle: ${nodeVersion}`);
        }

        // Vérifier si c'est un projet Claudyne
        const isClaudyneProject = await this.isClaudyneProject();
        if (!isClaudyneProject) {
            console.warn('⚠️ Ne semble pas être un projet Claudyne, mais continuons...');
        }

        // Vérifier les dépendances requises
        await this.checkDependencies();

        // Vérifier les permissions
        await this.checkPermissions();

        console.log('✅ Vérifications préliminaires réussies');
    }

    async isClaudyneProject() {
        try {
            const packageJson = JSON.parse(
                await fs.readFile(path.join(this.config.agent.projectRoot, 'package.json'), 'utf8')
            );
            return packageJson.name && packageJson.name.includes('claudyne');
        } catch (error) {
            return false;
        }
    }

    async checkDependencies() {
        const requiredDeps = ['fs', 'path', 'events'];
        const optionalDeps = ['chokidar', 'express', 'socket.io'];

        for (const dep of requiredDeps) {
            try {
                require.resolve(dep);
            } catch (error) {
                throw new Error(`Dépendance requise manquante: ${dep}`);
            }
        }

        for (const dep of optionalDeps) {
            try {
                require.resolve(dep);
            } catch (error) {
                console.warn(`⚠️ Dépendance optionnelle manquante: ${dep}`);
                console.warn(`   Pour l'installer: npm install ${dep}`);
            }
        }
    }

    async checkPermissions() {
        try {
            await fs.access(this.config.agent.projectRoot, fs.constants.R_OK | fs.constants.W_OK);
        } catch (error) {
            throw new Error('Permissions insuffisantes sur le répertoire du projet');
        }
    }

    async initializeComponents() {
        console.log('🔧 Initialisation des composants...');

        // 1. Agent principal
        console.log('  📊 Initialisation de l\'agent d\'analyse...');
        this.components.agent = new ClaudyneCodeAgent(this.config.agent);

        // 2. Système de recommandations
        if (this.config.recommendations.enabled) {
            console.log('  💡 Initialisation du système de recommandations...');
            this.components.recommendations = new ClaudyneIntelligentRecommendations(
                this.components.agent
            );
        }

        // 3. Intégration workflow
        console.log('  🔗 Initialisation de l\'intégration workflow...');
        this.components.workflow = new ClaudyneWorkflowIntegration(
            this.components.agent,
            this.config.workflow
        );

        // 4. Dashboard de monitoring
        console.log('  🌐 Initialisation du dashboard...');
        this.components.dashboard = new ClaudyneMonitoringDashboard(
            this.components.agent,
            this.config.dashboard
        );
    }

    async startServices() {
        console.log('🚀 Démarrage des services...');

        // Attendre que l'agent soit prêt
        await new Promise((resolve) => {
            this.components.agent.once('ready', resolve);
        });

        // Démarrer le dashboard
        this.components.dashboard.start();

        console.log('✅ Tous les services sont démarrés');
    }

    setupSignalHandlers() {
        const gracefulShutdown = async (signal) => {
            console.log(`\n🛑 Signal ${signal} reçu, arrêt en cours...`);

            try {
                if (this.components.dashboard) {
                    this.components.dashboard.stop();
                }

                if (this.components.agent) {
                    this.components.agent.destroy();
                }

                console.log('✅ Arrêt propre terminé');
                process.exit(0);
            } catch (error) {
                console.error('❌ Erreur lors de l\'arrêt:', error);
                process.exit(1);
            }
        };

        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

        process.on('uncaughtException', (error) => {
            console.error('❌ Exception non gérée:', error);
            gracefulShutdown('UNCAUGHT_EXCEPTION');
        });

        process.on('unhandledRejection', (reason, promise) => {
            console.error('❌ Promesse rejetée non gérée:', reason);
            gracefulShutdown('UNHANDLED_REJECTION');
        });
    }

    displayStartupInfo() {
        console.log('\n🤖 CLAUDYNE CODE AGENT - DÉMARRÉ');
        console.log('=================================');
        console.log(`📁 Projet: ${this.config.agent.projectRoot}`);
        console.log(`🌐 Dashboard: http://localhost:${this.config.dashboard.port}`);
        console.log(`👁️  Surveillance: ${this.config.agent.watchMode ? 'Activée' : 'Désactivée'}`);
        console.log(`🔄 Temps réel: ${this.config.agent.realTimeMode ? 'Activé' : 'Désactivé'}`);
        console.log(`💡 Recommandations: ${this.config.recommendations.enabled ? 'Activées' : 'Désactivées'}`);
        console.log(`🔗 Intégration Git: ${this.config.workflow.gitIntegration ? 'Activée' : 'Désactivée'}`);
        console.log('\n📋 Commandes disponibles:');
        console.log('  Ctrl+C : Arrêter l\'agent');
        console.log('  Dashboard : Ouvrir http://localhost:' + this.config.dashboard.port);
        console.log('\n🎯 L\'agent surveille maintenant votre code...');

        // Configuration des événements de l'agent pour affichage
        this.setupEventLogging();
    }

    setupEventLogging() {
        const agent = this.components.agent;

        agent.on('file-changed', (filePath) => {
            const relativePath = path.relative(this.config.agent.projectRoot, filePath);
            console.log(`📝 ${new Date().toLocaleTimeString()} - Fichier modifié: ${relativePath}`);
        });

        agent.on('critical-issues', (issues) => {
            console.log(`🚨 ${new Date().toLocaleTimeString()} - ${issues.length} problèmes critiques détectés!`);
        });

        agent.on('health-check', (data) => {
            if (data.criticalIssues > 0) {
                console.log(`⚠️  ${new Date().toLocaleTimeString()} - Santé: ${data.criticalIssues} problèmes critiques`);
            }
        });

        // Affichage périodique des métriques
        setInterval(() => {
            const metrics = agent.metrics;
            console.log(`📊 ${new Date().toLocaleTimeString()} - Analysés: ${metrics.filesProcessed} fichiers, ${metrics.linesAnalyzed} lignes`);
        }, 60000); // Toutes les minutes
    }

    // Méthodes utilitaires pour la configuration
    async createDefaultConfig() {
        const configPath = path.join(this.config.agent.projectRoot, 'claudyne-agent-config.json');

        const defaultConfig = {
            agent: {
                watchMode: true,
                realTimeMode: true,
                analysisDepth: 'deep',
                autoFix: false
            },
            dashboard: {
                port: 3333,
                updateInterval: 5000
            },
            workflow: {
                gitIntegration: true,
                cicdIntegration: true,
                notifications: {
                    slack: null,
                    email: false
                }
            },
            recommendations: {
                enabled: true,
                learningMode: true
            }
        };

        await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2));
        console.log(`✅ Configuration par défaut créée: ${configPath}`);
    }
}

// CLI Support
if (require.main === module) {
    const launcher = new ClaudyneAgentLauncher();

    // Gestion des arguments CLI
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
🤖 Claudyne Code Agent - Analyseur de code intelligent

USAGE:
  node start-claudyne-agent.js [options]

OPTIONS:
  --help, -h              Afficher cette aide
  --config-only           Créer uniquement le fichier de configuration
  --no-dashboard          Démarrer sans le dashboard web
  --no-watch              Désactiver la surveillance des fichiers
  --port <number>         Port pour le dashboard (défaut: 3333)
  --ci-mode               Mode CI/CD (sans interface)

EXEMPLES:
  node start-claudyne-agent.js
  node start-claudyne-agent.js --port 8080
  node start-claudyne-agent.js --no-dashboard --ci-mode

ENVIRONMENT:
  CLAUDYNE_PORT           Port pour le dashboard
  SLACK_WEBHOOK_URL       URL webhook Slack pour notifications
  EMAIL_NOTIFICATIONS     Activer notifications email (true/false)

Pour plus d'informations: https://github.com/aurelgroup/claudyne-platform
        `);
        process.exit(0);
    }

    if (args.includes('--config-only')) {
        launcher.createDefaultConfig().then(() => {
            console.log('Configuration créée avec succès');
            process.exit(0);
        }).catch(error => {
            console.error('Erreur création config:', error);
            process.exit(1);
        });
        return;
    }

    // Appliquer les arguments CLI
    if (args.includes('--no-dashboard')) {
        launcher.config.dashboard.enabled = false;
    }

    if (args.includes('--no-watch')) {
        launcher.config.agent.watchMode = false;
        launcher.config.agent.realTimeMode = false;
    }

    const portIndex = args.indexOf('--port');
    if (portIndex !== -1 && args[portIndex + 1]) {
        launcher.config.dashboard.port = parseInt(args[portIndex + 1]);
    }

    if (process.env.CLAUDYNE_PORT) {
        launcher.config.dashboard.port = parseInt(process.env.CLAUDYNE_PORT);
    }

    // Démarrage
    launcher.start().catch(error => {
        console.error('Erreur fatale:', error);
        process.exit(1);
    });
}

module.exports = ClaudyneAgentLauncher;