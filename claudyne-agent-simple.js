#!/usr/bin/env node

/**
 * 🤖 CLAUDYNE CODE AGENT - Version Simple
 * =======================================
 * Agent d'analyse de code ligne par ligne pour Claudyne
 * Sans dépendances externes, prêt à l'emploi
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('\n🤖 CLAUDYNE CODE AGENT - Démarrage');
console.log('==================================\n');

class ClaudyneAgent {
  constructor() {
    this.config = {
      port: 3333,
      projectPath: process.cwd()
    };

    this.analysisResults = [];
    this.startTime = new Date();
    this.fileStats = {
      analyzed: 0,
      issues: 0,
      security: 0,
      performance: 0,
      quality: 0
    };

    this.lastModified = {};
  }

  start() {
    console.log('🚀 Démarrage de l\'agent...');

    // Effectuer un scan initial
    this.performInitialScan();

    // Démarrer le serveur web
    this.startWebServer();

    // Surveiller les fichiers (version simple avec polling)
    this.startFileWatcher();

    console.log('✅ Agent Claudyne opérationnel');
    console.log(`📊 Dashboard: http://localhost:${this.config.port}`);
    console.log('🔍 Surveillance active des fichiers...\n');
  }

  performInitialScan() {
    console.log('🔍 Scan initial du projet...');

    const filesToScan = [
      'package.json',
      'claudyne-mobile/package.json',
      'backend/minimal-server.js',
      'backend/mobile-server.js'
    ];

    filesToScan.forEach(file => {
      const fullPath = path.join(this.config.projectPath, file);
      if (fs.existsSync(fullPath)) {
        this.analyzeFile(fullPath, 'initial');
      }
    });

    console.log(`✅ Scan initial terminé: ${this.fileStats.analyzed} fichiers analysés`);
  }

  analyzeFile(filePath, action = 'modified') {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(this.config.projectPath, filePath);

      const analysis = {
        timestamp: new Date().toISOString(),
        file: relativePath,
        action: action,
        size: content.length,
        lines: content.split('\n').length,
        issues: []
      };

      // Analyse de sécurité
      analysis.issues.push(...this.checkSecurity(content, relativePath));

      // Analyse de performance
      analysis.issues.push(...this.checkPerformance(content, relativePath));

      // Analyse de qualité
      analysis.issues.push(...this.checkQuality(content, relativePath));

      this.analysisResults.unshift(analysis);
      this.analysisResults = this.analysisResults.slice(0, 100);

      // Mettre à jour les statistiques
      this.fileStats.analyzed++;
      this.fileStats.issues += analysis.issues.length;
      this.fileStats.security += analysis.issues.filter(i => i.type === 'security').length;
      this.fileStats.performance += analysis.issues.filter(i => i.type === 'performance').length;
      this.fileStats.quality += analysis.issues.filter(i => i.type === 'quality').length;

      if (analysis.issues.length > 0) {
        console.log(`⚠️  ${analysis.issues.length} problème(s) dans ${relativePath}`);
        analysis.issues.forEach(issue => {
          const icon = issue.severity === 'critical' ? '🚨' :
                      issue.severity === 'high' ? '⚠️' :
                      issue.severity === 'medium' ? '💡' : 'ℹ️';
          console.log(`   ${icon} ${issue.message}`);
        });
      }

    } catch (error) {
      console.error(`❌ Erreur lors de l'analyse de ${filePath}:`, error.message);
    }
  }

  checkSecurity(content, filePath) {
    const issues = [];

    // Détection de secrets hardcodés
    if (/password\s*[:=]\s*['"][^'"\s]{6,}/gi.test(content)) {
      issues.push({
        type: 'security',
        severity: 'critical',
        message: '🚨 Mot de passe potentiellement hardcodé détecté'
      });
    }

    if (/api[_-]?key\s*[:=]\s*['"][^'"]{20,}/gi.test(content)) {
      issues.push({
        type: 'security',
        severity: 'critical',
        message: '🔑 Clé API hardcodée détectée'
      });
    }

    // Détection d'injections SQL potentielles
    if (/query\s*\([^)]*\$\{[^}]+\}/gi.test(content)) {
      issues.push({
        type: 'security',
        severity: 'high',
        message: '💉 Injection SQL potentielle (interpolation directe)'
      });
    }

    // Détection XSS React
    if (/dangerouslySetInnerHTML/gi.test(content)) {
      issues.push({
        type: 'security',
        severity: 'high',
        message: '🕷️ Utilisation de dangerouslySetInnerHTML (risque XSS)'
      });
    }

    return issues;
  }

  checkPerformance(content, filePath) {
    const issues = [];

    // Opérations synchrones bloquantes
    if (/fs\.(readFileSync|writeFileSync|existsSync)/gi.test(content) && !filePath.includes('config')) {
      issues.push({
        type: 'performance',
        severity: 'medium',
        message: '🐌 Opération fichier synchrone (bloquante)'
      });
    }

    // Boucles potentiellement coûteuses
    if (/for\s*\([^)]*\.length[^)]*\)/gi.test(content)) {
      issues.push({
        type: 'performance',
        severity: 'low',
        message: '🔄 Boucle avec .length dans la condition (optimisable)'
      });
    }

    // React: useEffect sans dépendances
    if (/useEffect\s*\([^,]+\);/gi.test(content)) {
      issues.push({
        type: 'performance',
        severity: 'medium',
        message: '⚡ useEffect sans tableau de dépendances'
      });
    }

    return issues;
  }

  checkQuality(content, filePath) {
    const issues = [];

    // Console.log oubliés
    if (/console\.(log|debug|info)/gi.test(content) && !filePath.includes('test')) {
      issues.push({
        type: 'quality',
        severity: 'low',
        message: '📝 console.log détecté (à nettoyer avant production)'
      });
    }

    // TODO/FIXME
    if (/\/\/(.*)(TODO|FIXME|XXX|HACK)/gi.test(content)) {
      issues.push({
        type: 'quality',
        severity: 'info',
        message: '📋 TODO/FIXME détecté'
      });
    }

    // Dépendances obsolètes dans package.json
    if (filePath.includes('package.json') && content.includes('"version"')) {
      try {
        const pkg = JSON.parse(content);
        if (pkg.dependencies) {
          Object.keys(pkg.dependencies).forEach(dep => {
            if (dep.includes('deprecated') ||
                (dep === 'request' && pkg.dependencies[dep])) {
              issues.push({
                type: 'quality',
                severity: 'medium',
                message: `📦 Dépendance potentiellement obsolète: ${dep}`
              });
            }
          });
        }
      } catch (e) {
        // Ignore les erreurs de parsing JSON
      }
    }

    return issues;
  }

  startFileWatcher() {
    console.log('👀 Démarrage de la surveillance des fichiers...');

    // Version simple avec polling
    setInterval(() => {
      const filesToWatch = [
        'package.json',
        'claudyne-mobile/package.json',
        'claudyne-mobile/app.json',
        'backend/minimal-server.js',
        'backend/mobile-server.js'
      ];

      filesToWatch.forEach(file => {
        const fullPath = path.join(this.config.projectPath, file);
        if (fs.existsSync(fullPath)) {
          try {
            const stats = fs.statSync(fullPath);
            const lastModified = stats.mtime.getTime();

            if (this.lastModified[file] && this.lastModified[file] < lastModified) {
              console.log(`🔄 Modification détectée: ${file}`);
              this.analyzeFile(fullPath, 'modified');
            }
            this.lastModified[file] = lastModified;
          } catch (error) {
            // Ignore les erreurs de fichiers temporaires
          }
        }
      });
    }, 3000); // Vérification toutes les 3 secondes
  }

  startWebServer() {
    const server = http.createServer((req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');

      if (req.url === '/api/stats') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          stats: this.fileStats,
          uptime: Date.now() - this.startTime.getTime(),
          results: this.analysisResults.slice(0, 10)
        }));
        return;
      }

      // Dashboard HTML
      res.end(this.generateDashboard());
    });

    server.listen(this.config.port, () => {
      console.log(`📊 Dashboard démarré sur http://localhost:${this.config.port}`);
    });
  }

  generateDashboard() {
    const recentIssues = this.analysisResults.slice(0, 20);
    const uptime = Math.floor((Date.now() - this.startTime.getTime()) / 1000);

    return `<!DOCTYPE html>
<html>
<head>
    <title>🤖 Claudyne Code Agent</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', system-ui, sans-serif;
            background: linear-gradient(135deg, #0f0f23 0%, #1a1a3a 100%);
            color: #ffffff;
            min-height: 100vh;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px;
            border-radius: 15px;
            margin-bottom: 30px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        .header h1 { font-size: 2.5rem; margin-bottom: 10px; }
        .header p { font-size: 1.2rem; opacity: 0.9; }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            padding: 25px;
            border-radius: 15px;
            text-align: center;
            border: 1px solid rgba(255,255,255,0.2);
        }
        .stat h3 {
            font-size: 2rem;
            margin-bottom: 10px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .stat p { font-size: 1rem; opacity: 0.8; }
        .issues {
            background: rgba(255,255,255,0.05);
            border-radius: 15px;
            padding: 30px;
            border: 1px solid rgba(255,255,255,0.1);
        }
        .issues h2 {
            margin-bottom: 20px;
            font-size: 1.5rem;
            color: #667eea;
        }
        .issue {
            background: rgba(255,255,255,0.1);
            margin: 15px 0;
            padding: 20px;
            border-radius: 10px;
            border-left: 4px solid;
            backdrop-filter: blur(5px);
        }
        .critical { border-left-color: #ff4757; background: rgba(255,71,87,0.1); }
        .high { border-left-color: #ff6b6b; background: rgba(255,107,107,0.1); }
        .medium { border-left-color: #ffa502; background: rgba(255,165,2,0.1); }
        .low { border-left-color: #26de81; background: rgba(38,222,129,0.1); }
        .info { border-left-color: #3742fa; background: rgba(55,66,250,0.1); }
        .no-issues {
            text-align: center;
            padding: 40px;
            opacity: 0.6;
            font-style: italic;
        }
        .refresh {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #667eea;
            color: white;
            border: none;
            padding: 15px 20px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 1rem;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        }
        .refresh:hover { background: #5a67d8; }
        .time { font-size: 0.9rem; opacity: 0.7; margin-top: 5px; }
        .live {
            display: inline-block;
            width: 8px;
            height: 8px;
            background: #26de81;
            border-radius: 50%;
            margin-right: 8px;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 Claudyne Code Agent</h1>
            <p><span class="live"></span>Surveillance Continue • Plateforme Éducative Camerounaise</p>
            <div class="time">Actif depuis ${Math.floor(uptime/60)}m ${uptime%60}s</div>
        </div>

        <div class="stats">
            <div class="stat">
                <h3>${this.fileStats.analyzed}</h3>
                <p>📁 Fichiers Analysés</p>
            </div>
            <div class="stat">
                <h3>${this.fileStats.issues}</h3>
                <p>⚠️ Problèmes Détectés</p>
            </div>
            <div class="stat">
                <h3>${this.fileStats.security}</h3>
                <p>🛡️ Sécurité</p>
            </div>
            <div class="stat">
                <h3>${this.fileStats.performance}</h3>
                <p>⚡ Performance</p>
            </div>
            <div class="stat">
                <h3>${this.fileStats.quality}</h3>
                <p>✨ Qualité</p>
            </div>
        </div>

        <div class="issues">
            <h2>📊 Analyses Récentes</h2>
            ${recentIssues.length === 0 ?
              '<div class="no-issues">🎉 Aucun problème détecté récemment !<br>Votre code semble en bonne santé.</div>' :
              recentIssues.map(result =>
                result.issues.map(issue => `
                  <div class="issue ${issue.severity}">
                    <strong>${issue.message}</strong><br>
                    <small>📁 ${result.file} • ${new Date(result.timestamp).toLocaleTimeString()}</small>
                  </div>
                `).join('')
              ).join('')
            }
        </div>
    </div>

    <button class="refresh" onclick="location.reload()">🔄 Actualiser</button>

    <script>
        // Auto-refresh toutes les 15 secondes
        setTimeout(() => location.reload(), 15000);

        // Afficher un indicateur de dernière mise à jour
        document.title = '🤖 Claudyne Agent • ' + new Date().toLocaleTimeString();

        // Notification de nouveau problème
        fetch('/api/stats')
            .then(response => response.json())
            .then(data => {
                if (data.stats.issues > 0) {
                    console.log('Agent Claudyne:', data.stats.issues, 'problème(s) détecté(s)');
                }
            })
            .catch(() => {});
    </script>
</body>
</html>`;
  }
}

// Démarrage de l'agent
const agent = new ClaudyneAgent();
agent.start();

// Gestion propre de l'arrêt
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt de l\'agent Claudyne...');
  console.log('👋 Agent arrêté proprement');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Arrêt demandé...');
  process.exit(0);
});