#!/usr/bin/env node

/**
 * 🤖 CLAUDYNE CODE AGENT - Version Optimisée
 * ==========================================
 * Agent d'analyse rapide et efficace pour tout le projet
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('\n🤖 CLAUDYNE CODE AGENT - Version Optimisée');
console.log('============================================\n');

class ClaudyneAgentOptimise {
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
      quality: 0,
      accessibility: 0,
      seo: 0
    };

    this.filesByType = new Map();
    this.lastModified = {};
  }

  start() {
    console.log('🚀 Démarrage de l\'agent optimisé...');

    // Démarrer immédiatement le serveur web
    this.startWebServer();

    // Effectuer un scan intelligent (éviter node_modules)
    this.performSmartScan();

    // Surveiller les fichiers importants
    this.startFileWatcher();

    console.log('✅ Agent Claudyne optimisé opérationnel');
    console.log(`📊 Dashboard: http://localhost:${this.config.port}`);
    console.log('🔍 Surveillance intelligente active...\n');
  }

  async performSmartScan() {
    console.log('🔍 Scan intelligent en cours...');

    const importantFiles = this.getImportantFiles();
    console.log(`📁 ${importantFiles.length} fichiers prioritaires trouvés`);

    let analyzed = 0;
    for (const file of importantFiles) {
      try {
        await this.analyzeFile(file, 'scan');
        analyzed++;

        if (analyzed % 5 === 0) {
          console.log(`📊 Progression: ${analyzed}/${importantFiles.length} analysés`);
        }
      } catch (error) {
        console.log(`⚠️ Erreur ${file}: ${error.message}`);
      }
    }

    console.log(`✅ Scan terminé: ${this.fileStats.analyzed} fichiers analysés`);
    console.log(`📊 Problèmes détectés: ${this.fileStats.issues}`);
    this.printQuickSummary();
  }

  getImportantFiles() {
    const files = [];

    // Fichiers racine importants
    const rootFiles = [
      'package.json',
      'README.md',
      'serve-admin.js',
      'claudyne-agent-setup.js',
      'claudyne-agent-simple.js'
    ];

    rootFiles.forEach(file => {
      const fullPath = path.join(this.config.projectPath, file);
      if (fs.existsSync(fullPath)) {
        files.push(fullPath);
      }
    });

    // Backend files
    const backendDir = path.join(this.config.projectPath, 'backend');
    if (fs.existsSync(backendDir)) {
      const backendFiles = [
        'minimal-server.js',
        'mobile-server.js',
        'sync-database.js',
        'database.js'
      ];

      backendFiles.forEach(file => {
        const fullPath = path.join(backendDir, file);
        if (fs.existsSync(fullPath)) {
          files.push(fullPath);
        }
      });

      // Backend routes et utils
      this.scanDirectory(path.join(backendDir, 'src'), files, 2);
    }

    // Frontend files
    const frontendDir = path.join(this.config.projectPath, 'frontend');
    if (fs.existsSync(frontendDir)) {
      this.scanDirectory(frontendDir, files, 3);
    }

    // Mobile files
    const mobileDir = path.join(this.config.projectPath, 'claudyne-mobile');
    if (fs.existsSync(mobileDir)) {
      const mobileFiles = [
        'package.json',
        'app.json',
        'index.js'
      ];

      mobileFiles.forEach(file => {
        const fullPath = path.join(mobileDir, file);
        if (fs.existsSync(fullPath)) {
          files.push(fullPath);
        }
      });

      this.scanDirectory(path.join(mobileDir, 'src'), files, 2);
    }

    // Styles globaux
    const stylesDir = path.join(this.config.projectPath, 'styles');
    if (fs.existsSync(stylesDir)) {
      this.scanDirectory(stylesDir, files, 1);
    }

    return files;
  }

  scanDirectory(dir, files, maxDepth, currentDepth = 0) {
    if (currentDepth >= maxDepth || !fs.existsSync(dir)) return;

    try {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        if (item.startsWith('.') || item === 'node_modules') continue;

        const fullPath = path.join(dir, item);
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
          this.scanDirectory(fullPath, files, maxDepth, currentDepth + 1);
        } else if (this.shouldAnalyze(fullPath)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Ignorer erreurs de permission
    }
  }

  shouldAnalyze(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const name = path.basename(filePath).toLowerCase();

    // Extensions à analyser
    const validExts = ['.js', '.ts', '.tsx', '.jsx', '.json', '.html', '.css', '.scss', '.md'];

    // Fichiers à ignorer
    const ignored = ['package-lock.json', '.env', 'yarn.lock'];

    return validExts.includes(ext) && !ignored.includes(name);
  }

  async analyzeFile(filePath, action = 'modified') {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(this.config.projectPath, filePath);
    const ext = path.extname(filePath).toLowerCase();

    // Compter par type
    this.filesByType.set(ext, (this.filesByType.get(ext) || 0) + 1);

    const analysis = {
      timestamp: new Date().toISOString(),
      file: relativePath,
      action: action,
      size: content.length,
      lines: content.split('\n').length,
      type: ext,
      issues: []
    };

    // Analyse selon le type
    switch (ext) {
      case '.js':
      case '.ts':
      case '.jsx':
      case '.tsx':
        analysis.issues.push(...this.analyzeCode(content, relativePath));
        break;
      case '.json':
        analysis.issues.push(...this.analyzeJSON(content, relativePath));
        break;
      case '.html':
        analysis.issues.push(...this.analyzeHTML(content, relativePath));
        break;
      case '.css':
      case '.scss':
        analysis.issues.push(...this.analyzeCSS(content, relativePath));
        break;
      case '.md':
        analysis.issues.push(...this.analyzeMarkdown(content, relativePath));
        break;
    }

    this.analysisResults.unshift(analysis);
    this.analysisResults = this.analysisResults.slice(0, 200);

    // Statistiques
    this.fileStats.analyzed++;
    this.fileStats.issues += analysis.issues.length;
    analysis.issues.forEach(issue => {
      this.fileStats[issue.type] = (this.fileStats[issue.type] || 0) + 1;
    });

    // Log des problèmes critiques
    const critical = analysis.issues.filter(i => i.severity === 'critical');
    if (critical.length > 0) {
      console.log(`🚨 ${critical.length} problème(s) critiques dans ${relativePath}`);
    }
  }

  analyzeCode(content, filePath) {
    const issues = [];

    // Sécurité
    const securityChecks = [
      { pattern: /password\s*[:=]\s*['"][^'"\s]{6,}/gi, message: '🚨 Mot de passe hardcodé', severity: 'critical' },
      { pattern: /api[_-]?key\s*[:=]\s*['"][^'"]{20,}/gi, message: '🔑 Clé API hardcodée', severity: 'critical' },
      { pattern: /console\.log\s*\([^)]*password/gi, message: '🔍 Mot de passe logué', severity: 'high' },
      { pattern: /eval\s*\(/gi, message: '⚠️ Usage d\'eval()', severity: 'high' },
      { pattern: /dangerouslySetInnerHTML/gi, message: '🕷️ XSS potentiel', severity: 'high' }
    ];

    securityChecks.forEach(({ pattern, message, severity }) => {
      if (pattern.test(content)) {
        issues.push({ type: 'security', severity, message });
      }
    });

    // Performance
    const perfChecks = [
      { pattern: /fs\.(readFileSync|writeFileSync)/gi, message: '🐌 I/O synchrone', severity: 'medium' },
      { pattern: /for\s*\([^)]*\.length[^)]*\)/gi, message: '🔄 Boucle inefficace', severity: 'low' },
      { pattern: /useEffect\s*\([^,]+\);/gi, message: '⚡ useEffect sans deps', severity: 'medium' }
    ];

    perfChecks.forEach(({ pattern, message, severity }) => {
      if (pattern.test(content)) {
        issues.push({ type: 'performance', severity, message });
      }
    });

    // Qualité
    const qualityChecks = [
      { pattern: /console\.(log|debug|info)/gi, message: '📝 Console.log détecté', severity: 'low' },
      { pattern: /\/\/(.*)(TODO|FIXME)/gi, message: '📋 TODO/FIXME', severity: 'info' },
      { pattern: /debugger;/gi, message: '🐛 Debugger oublié', severity: 'medium' }
    ];

    qualityChecks.forEach(({ pattern, message, severity }) => {
      if (pattern.test(content) && !filePath.includes('test')) {
        issues.push({ type: 'quality', severity, message });
      }
    });

    return issues;
  }

  analyzeJSON(content, filePath) {
    const issues = [];

    try {
      const data = JSON.parse(content);

      if (filePath.includes('package.json')) {
        // Dépendances obsolètes
        const deprecated = ['request', 'node-uuid'];
        if (data.dependencies) {
          Object.keys(data.dependencies).forEach(dep => {
            if (deprecated.includes(dep)) {
              issues.push({
                type: 'quality',
                severity: 'medium',
                message: `📦 Dépendance obsolète: ${dep}`
              });
            }
          });
        }

        // Scripts dangereux
        if (data.scripts) {
          Object.entries(data.scripts).forEach(([name, script]) => {
            if (script.includes('rm -rf') && !script.includes('node_modules')) {
              issues.push({
                type: 'security',
                severity: 'high',
                message: `🚨 Script dangereux: ${name}`
              });
            }
          });
        }
      }
    } catch (error) {
      issues.push({
        type: 'quality',
        severity: 'medium',
        message: '📄 JSON malformé'
      });
    }

    return issues;
  }

  analyzeHTML(content, filePath) {
    const issues = [];

    // Accessibilité
    if (!/<html[^>]*lang=/i.test(content)) {
      issues.push({ type: 'accessibility', severity: 'medium', message: '♿ Lang manquant' });
    }

    if (/<img[^>]*(?!.*alt=)/i.test(content)) {
      issues.push({ type: 'accessibility', severity: 'medium', message: '♿ Alt manquant' });
    }

    // SEO
    if (!/<title>/i.test(content)) {
      issues.push({ type: 'seo', severity: 'high', message: '🔍 Title manquant' });
    }

    return issues;
  }

  analyzeCSS(content, filePath) {
    const issues = [];

    const importantCount = (content.match(/!important/gi) || []).length;
    if (importantCount > 10) {
      issues.push({
        type: 'quality',
        severity: 'low',
        message: `🎨 Trop d'!important (${importantCount})`
      });
    }

    return issues;
  }

  analyzeMarkdown(content, filePath) {
    const issues = [];

    // Liens cassés basiques
    const links = content.match(/\[([^\]]*)\]\(([^)]*)\)/g);
    if (links && links.length > 10) {
      issues.push({
        type: 'quality',
        severity: 'info',
        message: `🔗 Beaucoup de liens (${links.length})`
      });
    }

    return issues;
  }

  printQuickSummary() {
    console.log('\n📊 ===== RÉSUMÉ RAPIDE =====');
    console.log(`📁 Fichiers: ${this.fileStats.analyzed}`);
    console.log(`⚠️  Problèmes: ${this.fileStats.issues}`);
    console.log(`🛡️  Sécurité: ${this.fileStats.security}`);
    console.log(`⚡ Performance: ${this.fileStats.performance}`);
    console.log(`✨ Qualité: ${this.fileStats.quality}`);
    console.log(`♿ Accessibilité: ${this.fileStats.accessibility}`);
    console.log(`🔍 SEO: ${this.fileStats.seo}\n`);
  }

  startFileWatcher() {
    console.log('👀 Surveillance intelligente...');

    setInterval(() => {
      const watchFiles = [
        'package.json',
        'backend/minimal-server.js',
        'backend/mobile-server.js',
        'claudyne-mobile/package.json'
      ];

      watchFiles.forEach(file => {
        const fullPath = path.join(this.config.projectPath, file);
        if (fs.existsSync(fullPath)) {
          try {
            const stats = fs.statSync(fullPath);
            const lastModified = stats.mtime.getTime();

            if (this.lastModified[file] && this.lastModified[file] < lastModified) {
              console.log(`🔄 Modification: ${file}`);
              this.analyzeFile(fullPath, 'modified');
            }
            this.lastModified[file] = lastModified;
          } catch (error) {
            // Ignorer
          }
        }
      });
    }, 3000);
  }

  startWebServer() {
    const server = http.createServer((req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');

      if (req.url === '/api/stats') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          stats: this.fileStats,
          uptime: Date.now() - this.startTime.getTime(),
          results: this.analysisResults.slice(0, 15),
          fileTypes: Object.fromEntries(this.filesByType)
        }));
        return;
      }

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(this.generateDashboard());
    });

    server.listen(this.config.port, () => {
      console.log(`📊 Dashboard disponible sur http://localhost:${this.config.port}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`❌ Port ${this.config.port} occupé. Essai du port 3334...`);
        this.config.port = 3334;
        server.listen(this.config.port, () => {
          console.log(`📊 Dashboard sur http://localhost:${this.config.port}`);
        });
      } else {
        console.error('❌ Erreur serveur:', err.message);
      }
    });
  }

  generateDashboard() {
    const issues = this.analysisResults.slice(0, 20);
    const uptime = Math.floor((Date.now() - this.startTime.getTime()) / 1000);
    const fileTypes = Array.from(this.filesByType.entries()).sort(([,a], [,b]) => b - a);

    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <title>🤖 Claudyne Agent • ${this.fileStats.issues} problèmes</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', system-ui, sans-serif;
            background: linear-gradient(135deg, #0f0f23 0%, #1a1a3a 100%);
            color: #fff;
            min-height: 100vh;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 15px; }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 25px;
            border-radius: 12px;
            margin-bottom: 25px;
            text-align: center;
            box-shadow: 0 8px 25px rgba(0,0,0,0.3);
        }
        .header h1 { font-size: 2.2rem; margin-bottom: 8px; }
        .header p { font-size: 1.1rem; opacity: 0.9; }
        .time { font-size: 0.85rem; opacity: 0.7; margin-top: 8px; }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 12px;
            margin-bottom: 25px;
        }
        .stat {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(8px);
            padding: 18px;
            border-radius: 12px;
            text-align: center;
            border: 1px solid rgba(255,255,255,0.15);
        }
        .stat h3 {
            font-size: 1.6rem;
            margin-bottom: 6px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .stat p { font-size: 0.8rem; opacity: 0.8; }
        .content {
            display: grid;
            grid-template-columns: 1fr 250px;
            gap: 25px;
        }
        .issues {
            background: rgba(255,255,255,0.06);
            border-radius: 12px;
            padding: 25px;
            border: 1px solid rgba(255,255,255,0.1);
        }
        .sidebar {
            background: rgba(255,255,255,0.06);
            border-radius: 12px;
            padding: 20px;
            border: 1px solid rgba(255,255,255,0.1);
            height: fit-content;
        }
        .issues h2, .sidebar h3 {
            margin-bottom: 18px;
            font-size: 1.2rem;
            color: #667eea;
        }
        .issue {
            background: rgba(255,255,255,0.1);
            margin: 10px 0;
            padding: 12px;
            border-radius: 8px;
            border-left: 4px solid;
            font-size: 0.85rem;
        }
        .critical { border-left-color: #ff4757; background: rgba(255,71,87,0.15); }
        .high { border-left-color: #ff6b6b; background: rgba(255,107,107,0.15); }
        .medium { border-left-color: #ffa502; background: rgba(255,165,2,0.15); }
        .low { border-left-color: #26de81; background: rgba(38,222,129,0.15); }
        .info { border-left-color: #3742fa; background: rgba(55,66,250,0.15); }
        .no-issues {
            text-align: center;
            padding: 30px;
            opacity: 0.6;
            font-style: italic;
        }
        .file-type {
            display: flex;
            justify-content: space-between;
            padding: 6px 8px;
            margin: 4px 0;
            background: rgba(255,255,255,0.1);
            border-radius: 4px;
            font-size: 0.8rem;
        }
        .refresh {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #667eea;
            color: white;
            border: none;
            padding: 10px 16px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 0.85rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .refresh:hover { background: #5a67d8; }
        .live {
            display: inline-block;
            width: 6px;
            height: 6px;
            background: #26de81;
            border-radius: 50%;
            margin-right: 6px;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        @media (max-width: 768px) {
            .content { grid-template-columns: 1fr; }
            .stats { grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 Claudyne Code Agent</h1>
            <p><span class="live"></span>Analyse Intelligente • Plateforme Éducative Camerounaise</p>
            <div class="time">Actif depuis ${Math.floor(uptime/60)}m ${uptime%60}s</div>
        </div>

        <div class="stats">
            <div class="stat">
                <h3>${this.fileStats.analyzed}</h3>
                <p>📁 Fichiers</p>
            </div>
            <div class="stat">
                <h3>${this.fileStats.issues}</h3>
                <p>⚠️ Problèmes</p>
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
            <div class="stat">
                <h3>${this.fileStats.accessibility}</h3>
                <p>♿ A11y</p>
            </div>
            <div class="stat">
                <h3>${this.fileStats.seo}</h3>
                <p>🔍 SEO</p>
            </div>
        </div>

        <div class="content">
            <div class="issues">
                <h2>📊 Problèmes Détectés</h2>
                ${issues.length === 0 ?
                  '<div class="no-issues">🎉 Excellent !<br>Aucun problème majeur détecté.</div>' :
                  issues.map(result =>
                    result.issues.map(issue => `
                      <div class="issue ${issue.severity}">
                        <strong>${issue.message}</strong><br>
                        <small>📁 ${result.file} (${result.type}) • ${new Date(result.timestamp).toLocaleTimeString()}</small>
                      </div>
                    `).join('')
                  ).join('')
                }
            </div>

            <div class="sidebar">
                <h3>📈 Fichiers par Type</h3>
                ${fileTypes.slice(0, 8).map(([ext, count]) => `
                    <div class="file-type">
                        <span>${ext}</span>
                        <span>${count}</span>
                    </div>
                `).join('')}

                <h3 style="margin-top: 20px;">🎯 État</h3>
                <div style="font-size: 0.8rem; opacity: 0.8; line-height: 1.4;">
                    ✅ Analyse intelligente<br>
                    👀 Surveillance active<br>
                    🚀 Optimisé pour Claudyne
                </div>
            </div>
        </div>
    </div>

    <button class="refresh" onclick="location.reload()">🔄</button>

    <script>
        // Auto-refresh toutes les 15 secondes
        setTimeout(() => location.reload(), 15000);

        // Notification si problèmes critiques
        fetch('/api/stats')
            .then(r => r.json())
            .then(data => {
                if (data.stats.security > 0) {
                    console.log('⚠️ Problèmes de sécurité détectés !');
                }
            })
            .catch(() => {});
    </script>
</body>
</html>`;
  }
}

// Démarrage
const agent = new ClaudyneAgentOptimise();
agent.start();

// Gestion arrêt
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt agent...');
  agent.printQuickSummary();
  process.exit(0);
});