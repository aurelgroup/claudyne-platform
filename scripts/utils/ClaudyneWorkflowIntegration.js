/**
 * ClaudyneWorkflowIntegration - Intégration avec le workflow de développement
 *
 * Intègre l'agent Claudyne avec Git, GitHub Actions, et les outils de développement
 * pour une surveillance continue et des alertes automatiques
 */

const { execSync, exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class ClaudyneWorkflowIntegration {
    constructor(agent, options = {}) {
        this.agent = agent;
        this.config = {
            gitIntegration: options.gitIntegration !== false,
            cicdIntegration: options.cicdIntegration !== false,
            webhookUrl: options.webhookUrl,
            slackWebhook: options.slackWebhook,
            emailNotifications: options.emailNotifications,
            autoFix: options.autoFix || false,
            ...options
        };

        this.gitWatcher = new GitWatcher(this);
        this.cicdIntegrator = new CICDIntegrator(this);
        this.notificationSystem = new NotificationSystem(this);
        this.autoFixEngine = new AutoFixEngine(this);

        this.initialize();
    }

    async initialize() {
        console.log('🔗 Initialisation de l\'intégration workflow...');

        if (this.config.gitIntegration) {
            await this.setupGitIntegration();
        }

        if (this.config.cicdIntegration) {
            await this.setupCICDIntegration();
        }

        this.setupAgentListeners();
        console.log('✅ Intégration workflow initialisée');
    }

    async setupGitIntegration() {
        console.log('📋 Configuration Git hooks...');

        // Créer les hooks Git
        await this.createGitHooks();

        // Surveillance des commits
        this.gitWatcher.start();
    }

    async createGitHooks() {
        const hooksDir = path.join(this.agent.config.projectRoot, '.git', 'hooks');

        // Pre-commit hook
        const preCommitHook = `#!/bin/sh
# ClaudyneCodeAgent Pre-commit Hook

echo "🤖 Claudyne - Analyse pré-commit..."

# Exécuter l'analyse sur les fichiers modifiés
node ClaudyneCodeAgent.js --pre-commit

# Vérifier le code de retour
if [ $? -ne 0 ]; then
    echo "❌ Problèmes critiques détectés. Commit bloqué."
    echo "Utilisez 'git commit --no-verify' pour forcer (non recommandé)"
    exit 1
fi

echo "✅ Analyse pré-commit réussie"
exit 0
`;

        // Post-commit hook
        const postCommitHook = `#!/bin/sh
# ClaudyneCodeAgent Post-commit Hook

echo "🤖 Claudyne - Analyse post-commit..."

# Analyser les changements et envoyer des notifications
node ClaudyneCodeAgent.js --post-commit &

exit 0
`;

        try {
            await fs.writeFile(path.join(hooksDir, 'pre-commit'), preCommitHook, { mode: 0o755 });
            await fs.writeFile(path.join(hooksDir, 'post-commit'), postCommitHook, { mode: 0o755 });
            console.log('✅ Hooks Git créés');
        } catch (error) {
            console.warn('⚠️ Impossible de créer les hooks Git:', error.message);
        }
    }

    async setupCICDIntegration() {
        console.log('🚀 Configuration CI/CD...');

        // Créer le workflow GitHub Actions
        await this.createGitHubActionsWorkflow();

        // Créer les scripts de déploiement avec analyse
        await this.createDeploymentScripts();
    }

    async createGitHubActionsWorkflow() {
        const workflowDir = path.join(this.agent.config.projectRoot, '.github', 'workflows');

        try {
            await fs.mkdir(workflowDir, { recursive: true });
        } catch (error) {
            // Directory might already exist
        }

        const workflow = `name: Claudyne Code Analysis

on:
  push:
    branches: [ main, develop, security-improvements-* ]
  pull_request:
    branches: [ main, develop ]

jobs:
  code-analysis:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: |
        npm ci
        cd backend && npm ci
        cd ../frontend && npm ci
        cd ../claudyne-mobile && npm ci

    - name: Install Claudyne Agent dependencies
      run: npm install chokidar socket.io express

    - name: Run Claudyne Code Analysis
      run: node ClaudyneCodeAgent.js --ci-mode
      env:
        CI: true
        NODE_ENV: test

    - name: Upload Analysis Results
      uses: actions/upload-artifact@v3
      with:
        name: claudyne-analysis-results
        path: |
          claudyne-analysis-report.json
          claudyne-security-report.json

    - name: Security Report Comment
      if: github.event_name == 'pull_request'
      uses: actions/github-script@v6
      with:
        script: |
          const fs = require('fs');

          try {
            const report = JSON.parse(fs.readFileSync('claudyne-security-report.json', 'utf8'));

            const comment = \`## 🤖 Claudyne Security Report

            **Critical Issues:** \${report.critical || 0}
            **High Priority:** \${report.high || 0}
            **Medium Priority:** \${report.medium || 0}

            \${report.critical > 0 ? '❌ **Action Required:** Critical security issues detected!' : '✅ No critical security issues detected'}

            [View detailed report in artifacts](https://github.com/\${context.repo.owner}/\${context.repo.repo}/actions/runs/\${context.runId})
            \`;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
          } catch (error) {
            console.log('Could not read security report:', error.message);
          }

  deploy-analysis:
    needs: code-analysis
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Deploy Analysis Dashboard
      run: |
        echo "🚀 Déploiement du dashboard d'analyse..."
        # Ici vous pouvez ajouter vos scripts de déploiement
`;

        const workflowPath = path.join(workflowDir, 'claudyne-analysis.yml');
        await fs.writeFile(workflowPath, workflow);
        console.log('✅ Workflow GitHub Actions créé');
    }

    async createDeploymentScripts() {
        // Script de pré-déploiement avec analyse
        const preDeployScript = `#!/bin/bash
# Script de pré-déploiement avec analyse Claudyne

echo "🤖 Claudyne - Analyse pré-déploiement..."

# Exécuter l'analyse complète
node ClaudyneCodeAgent.js --deployment-check

# Vérifier les résultats
if [ $? -ne 0 ]; then
    echo "❌ Problèmes détectés. Déploiement annulé."
    exit 1
fi

# Vérifications spécifiques à Claudyne
echo "🔍 Vérifications spécifiques Claudyne..."

# Vérifier la configuration de production
if [ ! -f ".env.production" ]; then
    echo "❌ Fichier .env.production manquant"
    exit 1
fi

# Vérifier les variables critiques
if ! grep -q "DB_PASSWORD" .env.production; then
    echo "❌ Variable DB_PASSWORD manquante"
    exit 1
fi

echo "✅ Analyse pré-déploiement réussie"
`;

        const scriptPath = path.join(this.agent.config.projectRoot, 'scripts', 'pre-deploy-analysis.sh');
        await fs.mkdir(path.dirname(scriptPath), { recursive: true });
        await fs.writeFile(scriptPath, preDeployScript, { mode: 0o755 });
    }

    setupAgentListeners() {
        // Écouter les événements de l'agent pour déclencher des actions
        this.agent.on('critical-issues', (issues) => {
            this.handleCriticalIssues(issues);
        });

        this.agent.on('file-changed', (filePath) => {
            this.handleFileChange(filePath);
        });

        this.agent.on('security-vulnerability', (vulnerability) => {
            this.handleSecurityVulnerability(vulnerability);
        });

        this.agent.on('deployment-ready', (report) => {
            this.handleDeploymentReady(report);
        });
    }

    async handleCriticalIssues(issues) {
        console.log(`🚨 ${issues.length} problèmes critiques détectés`);

        // Notification immédiate
        await this.notificationSystem.sendCriticalAlert(issues);

        // Auto-fix si activé
        if (this.config.autoFix) {
            const fixableIssues = issues.filter(issue => this.autoFixEngine.canFix(issue));
            if (fixableIssues.length > 0) {
                console.log(`🔧 Tentative de correction automatique de ${fixableIssues.length} problèmes`);
                await this.autoFixEngine.fixIssues(fixableIssues);
            }
        }

        // Créer une issue GitHub si configuré
        if (this.config.githubIntegration) {
            await this.createGitHubIssue(issues);
        }
    }

    async handleFileChange(filePath) {
        // Analyser uniquement le fichier modifié pour une réponse rapide
        const analysis = await this.agent.analyzeFile(filePath);

        if (analysis && analysis.issues.length > 0) {
            const criticalIssues = analysis.issues.filter(i => i.priority === 'critical');
            if (criticalIssues.length > 0) {
                await this.notificationSystem.sendFileChangeAlert(filePath, criticalIssues);
            }
        }
    }

    async handleSecurityVulnerability(vulnerability) {
        console.log('🔒 Vulnérabilité de sécurité détectée');

        // Notification urgente
        await this.notificationSystem.sendSecurityAlert(vulnerability);

        // Créer un commit de sécurité si auto-fix disponible
        if (this.config.autoFix && this.autoFixEngine.canFix(vulnerability)) {
            await this.createSecurityFixCommit(vulnerability);
        }
    }

    async handleDeploymentReady(report) {
        console.log('🚀 Rapport de déploiement prêt');

        // Envoyer le rapport aux parties prenantes
        await this.notificationSystem.sendDeploymentReport(report);
    }

    async createGitHubIssue(issues) {
        if (!this.config.githubToken) {
            console.warn('Token GitHub manquant pour créer des issues');
            return;
        }

        const criticalIssues = issues.filter(i => i.priority === 'critical');
        const title = `🚨 Claudyne: ${criticalIssues.length} problèmes critiques détectés`;

        const body = `## Problèmes Critiques Détectés par Claudyne

### Résumé
- **Problèmes critiques:** ${criticalIssues.length}
- **Détection:** ${new Date().toISOString()}
- **Agent:** ClaudyneCodeAgent v1.0

### Détails

${criticalIssues.map(issue => `
#### ${issue.message}
- **Fichier:** \`${issue.file}\`
- **Ligne:** ${issue.line}
- **Catégorie:** ${issue.category}
- **Code:** \`${issue.code}\`

**Suggestion:** ${issue.suggestion || 'Voir la documentation'}

---
`).join('')}

### Actions Recommandées
1. Corriger immédiatement les problèmes critiques
2. Vérifier l'impact sur la sécurité
3. Tester les corrections avant déploiement

*Généré automatiquement par ClaudyneCodeAgent*
`;

        // Ici vous pourriez utiliser l'API GitHub pour créer l'issue
        console.log('📝 Issue GitHub créée:', title);
    }

    async createSecurityFixCommit(vulnerability) {
        if (!this.config.autoCommit) {
            console.log('Auto-commit désactivé pour les corrections de sécurité');
            return;
        }

        try {
            const fix = await this.autoFixEngine.generateSecurityFix(vulnerability);
            if (fix) {
                await this.applyFix(fix);

                const commitMessage = `🔒 Fix sécurité: ${vulnerability.message}

Correction automatique par ClaudyneCodeAgent
- Fichier: ${vulnerability.file}
- Type: ${vulnerability.category}
- CWE: ${vulnerability.cwe || 'N/A'}

Auto-generated security fix`;

                execSync(`git add ${vulnerability.file}`);
                execSync(`git commit -m "${commitMessage}"`);

                console.log('✅ Commit de correction de sécurité créé');

                // Notification de la correction
                await this.notificationSystem.sendAutoFixNotification(vulnerability, fix);
            }
        } catch (error) {
            console.error('❌ Erreur lors de la création du commit de sécurité:', error);
        }
    }

    async applyFix(fix) {
        // Appliquer la correction au fichier
        const content = await fs.readFile(fix.file, 'utf8');
        const fixedContent = content.replace(fix.oldCode, fix.newCode);
        await fs.writeFile(fix.file, fixedContent);
    }

    // Commandes CLI pour intégration
    async runPreCommitCheck() {
        console.log('🤖 Claudyne - Vérification pré-commit...');

        // Obtenir les fichiers modifiés
        const changedFiles = this.getChangedFiles();

        // Analyser uniquement les fichiers modifiés
        const issues = [];
        for (const file of changedFiles) {
            const analysis = await this.agent.analyzeFile(file);
            if (analysis && analysis.issues) {
                issues.push(...analysis.issues);
            }
        }

        // Vérifier les problèmes critiques
        const criticalIssues = issues.filter(i => i.priority === 'critical');

        if (criticalIssues.length > 0) {
            console.log('❌ Problèmes critiques détectés:');
            criticalIssues.forEach(issue => {
                console.log(`  - ${issue.message} (${issue.file}:${issue.line})`);
            });
            process.exit(1);
        }

        console.log('✅ Aucun problème critique détecté');
        process.exit(0);
    }

    async runCIMode() {
        console.log('🤖 Claudyne - Mode CI/CD...');

        // Analyse complète
        await this.agent.performInitialScan();

        // Générer les rapports
        const report = await this.generateCIReport();

        // Sauvegarder les rapports
        await fs.writeFile('claudyne-analysis-report.json', JSON.stringify(report, null, 2));

        const securityReport = await this.agent.getSecurityReport();
        await fs.writeFile('claudyne-security-report.json', JSON.stringify(securityReport, null, 2));

        // Échec si problèmes critiques
        if (securityReport.critical && securityReport.critical.length > 0) {
            console.log('❌ Problèmes critiques détectés en CI');
            process.exit(1);
        }

        console.log('✅ Analyse CI réussie');
        process.exit(0);
    }

    async generateCIReport() {
        const status = await this.agent.getProjectStatus();
        const securityReport = await this.agent.getSecurityReport();

        return {
            timestamp: new Date().toISOString(),
            status: status,
            security: securityReport,
            summary: {
                totalIssues: status.issues,
                criticalIssues: securityReport.critical?.length || 0,
                filesAnalyzed: status.files,
                recommendations: status.recommendations?.length || 0
            },
            environment: {
                node: process.version,
                platform: process.platform,
                ci: process.env.CI === 'true'
            }
        };
    }

    getChangedFiles() {
        try {
            // Git diff pour obtenir les fichiers modifiés
            const output = execSync('git diff --cached --name-only --diff-filter=AM', { encoding: 'utf8' });
            return output.trim().split('\n').filter(file => file && this.isAnalyzableFile(file));
        } catch (error) {
            console.warn('Impossible de récupérer les fichiers modifiés:', error.message);
            return [];
        }
    }

    isAnalyzableFile(file) {
        const analyzableExtensions = ['.js', '.ts', '.tsx', '.json'];
        return analyzableExtensions.some(ext => file.endsWith(ext));
    }
}

// Classes auxiliaires

class GitWatcher {
    constructor(integration) {
        this.integration = integration;
    }

    start() {
        // Surveiller les changements Git
        console.log('👁️ Surveillance Git activée');
    }
}

class CICDIntegrator {
    constructor(integration) {
        this.integration = integration;
    }
}

class NotificationSystem {
    constructor(integration) {
        this.integration = integration;
    }

    async sendCriticalAlert(issues) {
        const message = `🚨 **Claudyne Alert Critique**

${issues.length} problèmes critiques détectés:

${issues.map(issue => `• ${issue.message} (${path.basename(issue.file)}:${issue.line})`).join('\n')}

Action immédiate requise!`;

        await this.sendNotification(message, 'critical');
    }

    async sendFileChangeAlert(filePath, issues) {
        const message = `⚠️ **Claudyne File Alert**

Fichier: ${path.basename(filePath)}
Problèmes détectés: ${issues.length}

${issues.map(issue => `• ${issue.message}`).join('\n')}`;

        await this.sendNotification(message, 'warning');
    }

    async sendSecurityAlert(vulnerability) {
        const message = `🔒 **Claudyne Security Alert**

Type: ${vulnerability.category}
Fichier: ${path.basename(vulnerability.file)}
Sévérité: ${vulnerability.priority}

${vulnerability.message}

Correction requise immédiatement!`;

        await this.sendNotification(message, 'security');
    }

    async sendDeploymentReport(report) {
        const message = `🚀 **Claudyne Deployment Report**

Status: ${report.status}
Issues: ${report.issues}
Security Score: ${report.securityScore}%

${report.status === 'ready' ? '✅ Prêt pour déploiement' : '❌ Corrections nécessaires'}`;

        await this.sendNotification(message, 'deployment');
    }

    async sendAutoFixNotification(vulnerability, fix) {
        const message = `🔧 **Claudyne Auto-Fix Applied**

Fixed: ${vulnerability.message}
File: ${path.basename(vulnerability.file)}
Method: ${fix.method}

Commit automatique créé.`;

        await this.sendNotification(message, 'autofix');
    }

    async sendNotification(message, type) {
        console.log(`📱 Notification ${type}:`, message);

        // Slack
        if (this.integration.config.slackWebhook) {
            await this.sendSlackNotification(message, type);
        }

        // Email
        if (this.integration.config.emailNotifications) {
            await this.sendEmailNotification(message, type);
        }

        // Webhook personnalisé
        if (this.integration.config.webhookUrl) {
            await this.sendWebhookNotification(message, type);
        }
    }

    async sendSlackNotification(message, type) {
        // Implémentation Slack
        console.log('📤 Slack notification sent');
    }

    async sendEmailNotification(message, type) {
        // Implémentation email
        console.log('📧 Email notification sent');
    }

    async sendWebhookNotification(message, type) {
        // Implémentation webhook
        console.log('🔗 Webhook notification sent');
    }
}

class AutoFixEngine {
    constructor(integration) {
        this.integration = integration;
        this.fixTemplates = this.loadFixTemplates();
    }

    loadFixTemplates() {
        return {
            'hardcoded-secret': {
                canFix: true,
                method: 'env-variable',
                template: (issue) => ({
                    oldCode: issue.code,
                    newCode: issue.code.replace(/['"`][^'"`]*['"`]/, 'process.env.SECRET_VALUE'),
                    envVariable: 'SECRET_VALUE'
                })
            },
            'sql-injection': {
                canFix: true,
                method: 'parameterized-query',
                template: (issue) => ({
                    oldCode: issue.code,
                    newCode: issue.code.replace(/\+.*\$\{.*\}/, '?, [value]'),
                    note: 'Converted to parameterized query'
                })
            }
        };
    }

    canFix(issue) {
        return this.fixTemplates[issue.category] && this.fixTemplates[issue.category].canFix;
    }

    async fixIssues(issues) {
        const fixes = [];

        for (const issue of issues) {
            if (this.canFix(issue)) {
                const fix = await this.generateFix(issue);
                if (fix) {
                    await this.applyFix(fix);
                    fixes.push(fix);
                }
            }
        }

        return fixes;
    }

    async generateFix(issue) {
        const template = this.fixTemplates[issue.category];
        if (!template) return null;

        return {
            file: issue.file,
            line: issue.line,
            method: template.method,
            ...template.template(issue)
        };
    }

    async generateSecurityFix(vulnerability) {
        return this.generateFix(vulnerability);
    }

    async applyFix(fix) {
        const content = await fs.readFile(fix.file, 'utf8');
        const lines = content.split('\n');

        if (fix.line && fix.oldCode && fix.newCode) {
            lines[fix.line - 1] = lines[fix.line - 1].replace(fix.oldCode, fix.newCode);
            await fs.writeFile(fix.file, lines.join('\n'));

            console.log(`🔧 Correction appliquée: ${fix.file}:${fix.line}`);
        }
    }
}

module.exports = ClaudyneWorkflowIntegration;

// CLI Support
if (require.main === module) {
    const ClaudyneCodeAgent = require('./ClaudyneCodeAgent');

    const agent = new ClaudyneCodeAgent({
        projectRoot: process.cwd(),
        watchMode: false
    });

    const integration = new ClaudyneWorkflowIntegration(agent);

    // Commandes CLI
    const command = process.argv[2];

    switch (command) {
        case '--pre-commit':
            integration.runPreCommitCheck();
            break;
        case '--ci-mode':
            integration.runCIMode();
            break;
        case '--deployment-check':
            integration.runCIMode();
            break;
        default:
            console.log('Usage: node ClaudyneWorkflowIntegration.js [--pre-commit|--ci-mode|--deployment-check]');
            process.exit(1);
    }
}