# 🤖 Claudyne Code Agent

**Agent spécialisé d'analyse de code ligne par ligne pour la plateforme Claudyne**

L'agent Claudyne est un système autonome d'analyse, surveillance et optimisation du code qui fonctionne en continu pour maintenir la qualité, sécurité et performance de votre plateforme éducative.

## 🚀 Démarrage Rapide

### Installation des dépendances

```bash
# Dépendances requises
npm install chokidar express socket.io

# Ou avec yarn
yarn add chokidar express socket.io
```

### Lancement de l'agent

```bash
# Démarrage simple
node start-claudyne-agent.js

# Avec configuration personnalisée
node start-claudyne-agent.js --port 8080

# Mode CI/CD
node start-claudyne-agent.js --ci-mode
```

### Accès au Dashboard

Une fois démarré, ouvrez votre navigateur à l'adresse :
**http://localhost:3333**

## 📋 Fonctionnalités

### 🔍 Analyse Complète
- **Analyse ligne par ligne** de tout le code source
- **Détection en temps réel** des modifications
- **Surveillance continue** du backend, frontend et mobile
- **Analyse contextuelle** selon les technologies utilisées

### 🛡️ Sécurité Avancée
- Détection d'injections SQL
- Identification de vulnérabilités XSS
- Scan des secrets hardcodés
- Analyse des algorithmes cryptographiques faibles
- Vérification des configurations d'authentification

### ⚡ Performance
- Détection d'opérations synchrones bloquantes
- Analyse des boucles inefficaces
- Identification des fuites mémoire potentielles
- Détection des problèmes N+1
- Optimisations React/React Native spécifiques

### 🎯 Qualité de Code
- Analyse de la complexité cyclomatique
- Détection de code dupliqué
- Vérification des conventions de nommage
- Identification des "magic numbers"
- Analyse architecturale

### 💡 Recommandations Intelligentes
- Suggestions contextuelles basées sur l'IA
- Apprentissage automatique des patterns
- Recommandations spécifiques à Claudyne
- Priorisation intelligente des corrections

### 🔗 Intégration Workflow
- Hooks Git automatiques (pre-commit, post-commit)
- Intégration GitHub Actions
- Notifications Slack/Email
- Corrections automatiques optionnelles
- Rapports de déploiement

## 🏗️ Architecture

```
ClaudyneCodeAgent/
├── 🤖 ClaudyneCodeAgent.js          # Agent principal
├── 🌐 ClaudyneMonitoringDashboard.js # Dashboard web temps réel
├── 🔧 ClaudyneAnalysisModules.js    # Modules d'analyse spécialisés
├── 💡 ClaudyneIntelligentRecommendations.js # Système de recommandations IA
├── 🔗 ClaudyneWorkflowIntegration.js # Intégration Git/CI/CD
└── 🚀 start-claudyne-agent.js       # Script de démarrage unifié
```

### Composants Principaux

#### 🤖 Agent Principal
- Surveillance des fichiers en temps réel
- Coordination des analyses
- Gestion des événements
- Métriques et statistiques

#### 🔧 Modules d'Analyse
- **SecurityAnalyzer** : Détection de vulnérabilités
- **PerformanceAnalyzer** : Optimisations de performance
- **CodeQualityAnalyzer** : Qualité et conventions
- **ArchitectureAnalyzer** : Structure et dépendances

#### 💡 Recommandations Intelligentes
- Base de connaissances évolutive
- Analyse contextuelle
- Priorisation automatique
- Apprentissage des patterns

#### 🌐 Dashboard de Monitoring
- Interface web temps réel
- Graphiques et métriques
- Alertes visuelles
- Gestion des recommandations

## 📖 Utilisation

### Configuration Automatique

L'agent se configure automatiquement selon la structure détectée :

```javascript
// Structure Claudyne détectée
├── backend/          → Analyse Node.js + PostgreSQL
├── frontend/         → Analyse React + Next.js
├── claudyne-mobile/  → Analyse React Native + Expo
└── shared/           → Modules communs
```

### Modes de Fonctionnement

#### 🔄 Mode Surveillance (Défaut)
```bash
node start-claudyne-agent.js
```
- Surveillance continue des fichiers
- Analyse temps réel des modifications
- Dashboard web actif
- Notifications en cas de problèmes critiques

#### 🚀 Mode CI/CD
```bash
node start-claudyne-agent.js --ci-mode
```
- Analyse complète unique
- Génération de rapports JSON
- Exit code basé sur les problèmes critiques
- Parfait pour les pipelines de déploiement

#### 🔧 Mode Pre-commit
```bash
node ClaudyneWorkflowIntegration.js --pre-commit
```
- Analyse uniquement des fichiers modifiés
- Blocage en cas de problèmes critiques
- Intégration Git automatique

### Configuration Personnalisée

Créez un fichier `claudyne-agent-config.json` :

```json
{
  "agent": {
    "watchMode": true,
    "realTimeMode": true,
    "analysisDepth": "deep",
    "autoFix": false
  },
  "dashboard": {
    "port": 3333,
    "updateInterval": 5000
  },
  "workflow": {
    "gitIntegration": true,
    "cicdIntegration": true,
    "autoCommit": false,
    "notifications": {
      "slack": "https://hooks.slack.com/...",
      "email": true
    }
  },
  "recommendations": {
    "enabled": true,
    "learningMode": true
  }
}
```

## 🔔 Notifications et Alertes

### Types de Notifications

#### 🚨 Alertes Critiques
- Vulnérabilités de sécurité
- Injections SQL/XSS détectées
- Secrets hardcodés exposés
- Notifications immédiates

#### ⚠️ Alertes de Performance
- Opérations bloquantes
- Fuites mémoire potentielles
- Requêtes N+1
- Notifications périodiques

#### 💡 Recommandations
- Optimisations suggérées
- Améliorations de code
- Bonnes pratiques
- Notifications contextuelles

### Canaux de Notification

#### 📱 Slack Integration
```bash
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
```

#### 📧 Email Notifications
```bash
export EMAIL_NOTIFICATIONS="true"
export SMTP_HOST="smtp.gmail.com"
export SMTP_USER="notifications@claudyne.com"
export SMTP_PASS="your-app-password"
```

#### 🔗 Webhooks Personnalisés
```bash
export WEBHOOK_URL="https://your-webhook.com/claudyne-alerts"
```

## 🚀 Intégration CI/CD

### GitHub Actions

L'agent génère automatiquement un workflow `.github/workflows/claudyne-analysis.yml` :

```yaml
name: Claudyne Code Analysis
on: [push, pull_request]

jobs:
  code-analysis:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    - name: Run Claudyne Analysis
      run: node ClaudyneCodeAgent.js --ci-mode
```

### Hooks Git Automatiques

#### Pre-commit Hook
```bash
#!/bin/sh
echo "🤖 Claudyne - Analyse pré-commit..."
node ClaudyneCodeAgent.js --pre-commit
```

#### Post-commit Hook
```bash
#!/bin/sh
echo "🤖 Claudyne - Analyse post-commit..."
node ClaudyneCodeAgent.js --post-commit &
```

## 📊 Métriques et Rapports

### Dashboard Temps Réel
- **Métriques générales** : Fichiers analysés, lignes de code, problèmes
- **Sécurité** : Score de sécurité, vulnérabilités critiques
- **Performance** : Temps d'analyse, complexité moyenne
- **Graphiques** : Évolution des problèmes dans le temps

### Rapports Générés

#### Rapport d'Analyse Complet
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "summary": {
    "filesAnalyzed": 234,
    "linesAnalyzed": 45678,
    "totalIssues": 23,
    "securityIssues": 3,
    "performanceIssues": 12,
    "qualityIssues": 8
  },
  "topIssues": [...],
  "recommendations": [...]
}
```

#### Rapport de Sécurité
```json
{
  "total": 3,
  "critical": [
    {
      "type": "sql-injection",
      "file": "backend/routes/auth.js",
      "line": 45,
      "message": "Injection SQL détectée",
      "cwe": "CWE-89"
    }
  ],
  "recommendations": [...]
}
```

## 🛠️ Développement et Extension

### Ajout de Nouveaux Analyseurs

```javascript
class CustomAnalyzer {
    analyzeLine(line, lineNumber, filePath) {
        const issues = [];

        // Votre logique d'analyse
        if (this.detectCustomIssue(line)) {
            issues.push({
                type: 'custom',
                category: 'my-category',
                priority: 'medium',
                message: 'Problème personnalisé détecté',
                line: lineNumber,
                file: filePath,
                suggestion: 'Comment corriger'
            });
        }

        return issues;
    }
}
```

### Extension des Recommandations

```javascript
// Ajouter à ClaudyneIntelligentRecommendations
const customKnowledge = {
    trigger: ['custom-pattern'],
    recommendation: 'Utiliser une approche personnalisée',
    priority: 'medium',
    implementation: 'Remplacer par...',
    impact: 'Améliore la maintenabilité'
};
```

## 🔧 Dépannage

### Problèmes Courants

#### L'agent ne démarre pas
```bash
# Vérifier les dépendances
npm list chokidar express socket.io

# Réinstaller si nécessaire
npm install chokidar express socket.io
```

#### Dashboard inaccessible
```bash
# Vérifier que le port n'est pas occupé
netstat -an | grep 3333

# Utiliser un port différent
node start-claudyne-agent.js --port 8080
```

#### Analyse lente
```bash
# Mode analyse moins profonde
node start-claudyne-agent.js --analysis-depth shallow

# Exclure certains répertoires
export CLAUDYNE_IGNORE_DIRS="node_modules,dist,build"
```

### Logs de Debug

```bash
# Activer les logs détaillés
export DEBUG=claudyne:*
node start-claudyne-agent.js

# Logs spécifiques
export DEBUG=claudyne:security,claudyne:performance
```

## 📈 Performance et Optimisation

### Configurations Recommandées

#### Projet Petit (< 50 fichiers)
```json
{
  "analysisDepth": "deep",
  "updateInterval": 2000,
  "watchMode": true
}
```

#### Projet Moyen (50-200 fichiers)
```json
{
  "analysisDepth": "medium",
  "updateInterval": 5000,
  "watchMode": true
}
```

#### Projet Large (> 200 fichiers)
```json
{
  "analysisDepth": "shallow",
  "updateInterval": 10000,
  "watchMode": false,
  "scheduledScans": "0 */6 * * *"
}
```

## 🤝 Contribution

### Structure du Code

```
src/
├── analyzers/     # Modules d'analyse
├── dashboard/     # Interface web
├── integration/   # Intégrations externes
├── recommendations/ # Système d'IA
└── utils/         # Utilitaires
```

### Tests

```bash
# Tests unitaires
npm test

# Tests d'intégration
npm run test:integration

# Coverage
npm run coverage
```

## 📄 Licence

MIT - Voir le fichier LICENSE pour plus de détails.

## 📞 Support

- **Issues GitHub** : https://github.com/aurelgroup/claudyne-platform/issues
- **Email** : support@claudyne.com
- **Documentation** : https://docs.claudyne.com/agent

---

**🎓 Développé avec ❤️ pour l'éducation camerounaise**

*En hommage à Meffo Mehtah Tchandjio Claudine - "La force du savoir en héritage"*