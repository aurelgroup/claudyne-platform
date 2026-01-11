#!/usr/bin/env node

/**
 * 🤖 CLAUDYNE CODE AGENT - Analyse Complète
 * =========================================
 * Agent d'analyse de code ligne par ligne pour TOUS les fichiers
 * Version étendue qui analyse l'ensemble du projet Claudyne
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('\n🤖 CLAUDYNE CODE AGENT - Analyse Complète');
console.log('==========================================\n');

class ClaudyneAgentComplet {
  constructor() {
    this.config = {
      port: 3333,
      projectPath: process.cwd(),
      // Patterns étendus pour analyser TOUS les fichiers
      watchPatterns: [
        '**/*.js',
        '**/*.ts',
        '**/*.tsx',
        '**/*.jsx',
        '**/*.json',
        '**/*.html',
        '**/*.css',
        '**/*.scss',
        '**/*.md'
      ],
      ignorePatterns: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/.next/**',
        '**/logs/**',
        '**/.git/**',
        '**/coverage/**',
        '**/tmp/**',
        '**/temp/**'
      ]
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

    this.fileTypes = new Map();
    this.lastModified = {};
    this.isScanning = false;
  }

  start() {
    console.log('🚀 Démarrage de l\'agent complet...');
    console.log('📂 Analyse TOUS les fichiers du projet');

    // Effectuer un scan complet
    this.performFullScan();

    // Démarrer le serveur web
    this.startWebServer();

    // Surveiller les fichiers
    this.startFileWatcher();

    console.log('✅ Agent Claudyne complet opérationnel');
    console.log(`📊 Dashboard: http://localhost:${this.config.port}`);
    console.log('🔍 Surveillance complète active...\n');
  }

  async performFullScan() {
    console.log('🔍 Scan complet du projet en cours...');
    this.isScanning = true;

    try {
      const allFiles = this.getAllProjectFiles();
      console.log(`📁 ${allFiles.length} fichiers trouvés`);

      let analyzed = 0;
      for (const file of allFiles) {
        try {
          await this.analyzeFile(file, 'scan');
          analyzed++;

          // Afficher le progrès
          if (analyzed % 10 === 0) {
            console.log(`📊 Progression: ${analyzed}/${allFiles.length} fichiers analysés`);
          }
        } catch (error) {
          // Ignorer les erreurs de fichiers individuels
          console.log(`⚠️ Erreur fichier ${file}: ${error.message}`);
        }
      }

      this.isScanning = false;
      console.log(`✅ Scan complet terminé: ${this.fileStats.analyzed} fichiers analysés`);
      console.log(`📊 Problèmes détectés: ${this.fileStats.issues}`);
      this.printSummary();

    } catch (error) {
      this.isScanning = false;
      console.error('❌ Erreur lors du scan complet:', error.message);
    }
  }

  getAllProjectFiles() {
    const files = [];

    const scanDirectory = (dir) => {
      try {
        const items = fs.readdirSync(dir);

        for (const item of items) {
          const fullPath = path.join(dir, item);
          const relativePath = path.relative(this.config.projectPath, fullPath);

          // Ignorer les dossiers/fichiers selon les patterns
          if (this.shouldIgnore(relativePath)) {
            continue;
          }

          const stats = fs.statSync(fullPath);

          if (stats.isDirectory()) {
            scanDirectory(fullPath);
          } else if (this.shouldAnalyze(fullPath)) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Ignorer les erreurs de permission
      }
    };

    scanDirectory(this.config.projectPath);
    return files;
  }

  shouldIgnore(relativePath) {
    return this.config.ignorePatterns.some(pattern => {
      const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
      return regex.test(relativePath);
    });
  }

  shouldAnalyze(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const analyzableExts = ['.js', '.ts', '.tsx', '.jsx', '.json', '.html', '.css', '.scss', '.md'];
    return analyzableExts.includes(ext);
  }

  async analyzeFile(filePath, action = 'modified') {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(this.config.projectPath, filePath);
      const ext = path.extname(filePath).toLowerCase();

      // Compter les types de fichiers
      this.fileTypes.set(ext, (this.fileTypes.get(ext) || 0) + 1);

      const analysis = {
        timestamp: new Date().toISOString(),
        file: relativePath,
        action: action,
        size: content.length,
        lines: content.split('\n').length,
        type: ext,
        issues: []
      };

      // Analyse selon le type de fichier
      switch (ext) {
        case '.js':
        case '.ts':
        case '.jsx':
        case '.tsx':
          analysis.issues.push(...this.analyzeJavaScript(content, relativePath));
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
      this.analysisResults = this.analysisResults.slice(0, 500); // Garder les 500 derniers

      // Mettre à jour les statistiques
      this.fileStats.analyzed++;
      this.fileStats.issues += analysis.issues.length;
      this.fileStats.security += analysis.issues.filter(i => i.type === 'security').length;
      this.fileStats.performance += analysis.issues.filter(i => i.type === 'performance').length;
      this.fileStats.quality += analysis.issues.filter(i => i.type === 'quality').length;
      this.fileStats.accessibility += analysis.issues.filter(i => i.type === 'accessibility').length;
      this.fileStats.seo += analysis.issues.filter(i => i.type === 'seo').length;

      // Afficher seulement les problèmes importants pendant le scan
      const criticalIssues = analysis.issues.filter(i => ['critical', 'high'].includes(i.severity));
      if (criticalIssues.length > 0 && !this.isScanning) {
        console.log(`⚠️  ${criticalIssues.length} problème(s) critiques dans ${relativePath}`);
        criticalIssues.forEach(issue => {
          const icon = issue.severity === 'critical' ? '🚨' : '⚠️';
          console.log(`   ${icon} ${issue.message}`);
        });
      }

    } catch (error) {
      throw new Error(`Erreur analyse ${filePath}: ${error.message}`);
    }
  }

  analyzeJavaScript(content, filePath) {
    const issues = [];

    // Analyse de sécurité
    issues.push(...this.checkSecurity(content, filePath));

    // Analyse de performance
    issues.push(...this.checkPerformance(content, filePath));

    // Analyse de qualité
    issues.push(...this.checkQuality(content, filePath));

    // Analyse React spécifique
    if (content.includes('React') || content.includes('jsx') || filePath.includes('.tsx')) {
      issues.push(...this.checkReact(content, filePath));
    }

    return issues;
  }

  analyzeJSON(content, filePath) {
    const issues = [];

    try {
      const data = JSON.parse(content);

      // Vérifier package.json
      if (filePath.includes('package.json')) {
        if (data.dependencies) {
          // Détecter les dépendances obsolètes
          const deprecatedDeps = ['request', 'node-uuid', 'gulp-util'];
          Object.keys(data.dependencies).forEach(dep => {
            if (deprecatedDeps.includes(dep)) {
              issues.push({
                type: 'quality',
                severity: 'medium',
                message: `📦 Dépendance obsolète: ${dep}`
              });
            }
          });
        }

        // Vérifier les scripts dangereux
        if (data.scripts) {
          Object.entries(data.scripts).forEach(([name, script]) => {
            if (script.includes('rm -rf') && !script.includes('node_modules')) {
              issues.push({
                type: 'security',
                severity: 'high',
                message: `🚨 Script potentiellement dangereux: ${name}`
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
      issues.push({
        type: 'accessibility',
        severity: 'medium',
        message: '♿ Attribut lang manquant sur html'
      });
    }

    if (/<img[^>]*(?!.*alt=)/i.test(content)) {
      issues.push({
        type: 'accessibility',
        severity: 'medium',
        message: '♿ Images sans attribut alt'
      });
    }

    // SEO
    if (!/<title>/i.test(content)) {
      issues.push({
        type: 'seo',
        severity: 'high',
        message: '🔍 Balise title manquante'
      });
    }

    if (!/<meta[^>]*description/i.test(content)) {
      issues.push({
        type: 'seo',
        severity: 'medium',
        message: '🔍 Meta description manquante'
      });
    }

    // Sécurité
    if (/javascript:/gi.test(content)) {
      issues.push({
        type: 'security',
        severity: 'high',
        message: '🚨 Liens javascript: détectés (XSS potentiel)'
      });
    }

    return issues;
  }

  analyzeCSS(content, filePath) {
    const issues = [];

    // Performance CSS
    if (/!important/gi.test(content)) {
      const count = (content.match(/!important/gi) || []).length;
      if (count > 10) {
        issues.push({
          type: 'quality',
          severity: 'low',
          message: `🎨 Trop d'utilisations de !important (${count})`
        });
      }
    }

    // Accessibilité
    if (!/font-size.*rem|font-size.*em/gi.test(content) && /font-size.*px/gi.test(content)) {
      issues.push({
        type: 'accessibility',
        severity: 'low',
        message: '♿ Utilisez rem/em au lieu de px pour la taille de police'
      });
    }

    return issues;
  }

  analyzeMarkdown(content, filePath) {
    const issues = [];

    // Vérifier les liens cassés (basique)
    const links = content.match(/\[([^\]]*)\]\(([^)]*)\)/g);
    if (links) {
      links.forEach(link => {
        const url = link.match(/\(([^)]*)\)/)[1];
        if (url.startsWith('http') && !url.includes('github.com') && !url.includes('localhost')) {
          issues.push({
            type: 'quality',
            severity: 'info',
            message: `🔗 Lien externe détecté: ${url}`
          });
        }
      });
    }

    return issues;
  }

  checkSecurity(content, filePath) {
    const issues = [];

    // Secrets hardcodés
    const secretPatterns = [
      { pattern: /password\s*[:=]\s*['"][^'"\s]{6,}/gi, message: '🚨 Mot de passe hardcodé' },
      { pattern: /api[_-]?key\s*[:=]\s*['"][^'"]{20,}/gi, message: '🔑 Clé API hardcodée' },
      { pattern: /secret\s*[:=]\s*['"][^'"]{10,}/gi, message: '🔐 Secret hardcodé' },
      { pattern: /token\s*[:=]\s*['"][^'"]{20,}/gi, message: '🎫 Token hardcodé' }
    ];

    secretPatterns.forEach(({ pattern, message }) => {
      if (pattern.test(content)) {
        issues.push({
          type: 'security',
          severity: 'critical',
          message: message
        });
      }
    });

    // Injections SQL
    if (/query\s*\([^)]*\$\{[^}]+\}/gi.test(content)) {
      issues.push({
        type: 'security',
        severity: 'high',
        message: '💉 Injection SQL potentielle'
      });
    }

    // eval() usage
    if (/\beval\s*\(/gi.test(content)) {
      issues.push({
        type: 'security',
        severity: 'high',
        message: '⚠️ Utilisation d\'eval() (dangereux)'
      });
    }

    return issues;
  }

  checkPerformance(content, filePath) {
    const issues = [];

    // Opérations synchrones
    const syncOps = [
      'fs.readFileSync',
      'fs.writeFileSync',
      'fs.existsSync',
      'fs.statSync'
    ];

    syncOps.forEach(op => {
      if (content.includes(op) && !filePath.includes('config')) {
        issues.push({
          type: 'performance',
          severity: 'medium',
          message: `🐌 Opération synchrone: ${op}`
        });
      }
    });

    // Boucles inefficaces
    if (/for\s*\([^)]*\.length[^)]*\)/gi.test(content)) {
      issues.push({
        type: 'performance',
        severity: 'low',
        message: '🔄 Boucle avec .length dans condition'
      });
    }

    return issues;
  }

  checkQuality(content, filePath) {
    const issues = [];

    // Console.log
    if (/console\.(log|debug|info)/gi.test(content) && !filePath.includes('test')) {
      issues.push({
        type: 'quality',
        severity: 'low',
        message: '📝 console.log détecté'
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

    // Fonctions très longues
    const functions = content.match(/function\s+\w+|(\w+\s*[:=]\s*\([^)]*\)\s*=>)/gi);
    if (functions && functions.length > 0) {
      functions.forEach(func => {
        const funcContent = this.extractFunctionContent(content, func);
        if (funcContent && funcContent.split('\n').length > 100) {
          issues.push({
            type: 'quality',
            severity: 'medium',
            message: '📏 Fonction très longue (>100 lignes)'
          });
        }
      });
    }

    return issues;
  }

  checkReact(content, filePath) {
    const issues = [];

    // useEffect sans dépendances
    if (/useEffect\s*\([^,]+\);/gi.test(content)) {
      issues.push({
        type: 'performance',
        severity: 'medium',
        message: '⚡ useEffect sans dépendances'
      });
    }

    // dangerouslySetInnerHTML
    if (/dangerouslySetInnerHTML/gi.test(content)) {
      issues.push({
        type: 'security',
        severity: 'high',
        message: '🕷️ dangerouslySetInnerHTML (risque XSS)'
      });
    }

    // Inline styles en React
    if (/style=\{\{[^}]+\}\}/gi.test(content)) {
      issues.push({
        type: 'quality',
        severity: 'low',
        message: '🎨 Styles inline détectés (préférer CSS modules)'
      });
    }

    return issues;
  }

  extractFunctionContent(content, functionHeader) {
    const index = content.indexOf(functionHeader);
    if (index === -1) return null;

    let braceCount = 0;
    let start = content.indexOf('{', index);
    if (start === -1) return null;

    for (let i = start; i < content.length; i++) {
      if (content[i] === '{') braceCount++;
      if (content[i] === '}') braceCount--;
      if (braceCount === 0) {
        return content.substring(start, i + 1);
      }
    }
    return null;
  }

  printSummary() {
    console.log('\n📊 ===== RÉSUMÉ ANALYSE COMPLÈTE =====');
    console.log(`📁 Fichiers analysés: ${this.fileStats.analyzed}`);
    console.log(`⚠️  Problèmes totaux: ${this.fileStats.issues}`);
    console.log(`🛡️  Sécurité: ${this.fileStats.security}`);
    console.log(`⚡ Performance: ${this.fileStats.performance}`);
    console.log(`✨ Qualité: ${this.fileStats.quality}`);
    console.log(`♿ Accessibilité: ${this.fileStats.accessibility}`);
    console.log(`🔍 SEO: ${this.fileStats.seo}`);

    console.log('\n📈 Types de fichiers:');
    Array.from(this.fileTypes.entries())
      .sort(([,a], [,b]) => b - a)
      .forEach(([ext, count]) => {
        console.log(`   ${ext}: ${count} fichiers`);
      });
    console.log('\n');
  }

  startFileWatcher() {
    console.log('👀 Démarrage surveillance étendue...');

    setInterval(() => {
      if (this.isScanning) return; // Ne pas surveiller pendant le scan

      // Surveiller uniquement les fichiers principaux
      const importantFiles = [
        'package.json',
        'claudyne-mobile/package.json',
        'backend/minimal-server.js',
        'backend/mobile-server.js',
        'frontend/pages/index.tsx',
        'README.md'
      ];

      importantFiles.forEach(file => {
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
            // Ignorer les erreurs
          }
        }
      });
    }, 5000); // Vérification toutes les 5 secondes
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
          results: this.analysisResults.slice(0, 20),
          fileTypes: Object.fromEntries(this.fileTypes),
          isScanning: this.isScanning
        }));
        return;
      }

      res.end(this.generateDashboard());
    });

    server.listen(this.config.port, () => {
      console.log(`📊 Dashboard complet démarré sur http://localhost:${this.config.port}`);
    });
  }

  generateDashboard() {
    const recentIssues = this.analysisResults.slice(0, 30);
    const uptime = Math.floor((Date.now() - this.startTime.getTime()) / 1000);
    const fileTypesArray = Array.from(this.fileTypes.entries()).sort(([,a], [,b]) => b - a);

    return `<!DOCTYPE html>
<html>
<head>
    <title>🤖 Claudyne Code Agent - Analyse Complète</title>
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
        .container { max-width: 1400px; margin: 0 auto; padding: 20px; }
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
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
        }
        .stat {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            padding: 20px;
            border-radius: 15px;
            text-align: center;
            border: 1px solid rgba(255,255,255,0.2);
        }
        .stat h3 {
            font-size: 1.8rem;
            margin-bottom: 8px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .stat p { font-size: 0.9rem; opacity: 0.8; }
        .content {
            display: grid;
            grid-template-columns: 1fr 300px;
            gap: 30px;
        }
        .issues {
            background: rgba(255,255,255,0.05);
            border-radius: 15px;
            padding: 30px;
            border: 1px solid rgba(255,255,255,0.1);
        }
        .sidebar {
            background: rgba(255,255,255,0.05);
            border-radius: 15px;
            padding: 20px;
            border: 1px solid rgba(255,255,255,0.1);
            height: fit-content;
        }
        .issues h2, .sidebar h3 {
            margin-bottom: 20px;
            font-size: 1.3rem;
            color: #667eea;
        }
        .issue {
            background: rgba(255,255,255,0.1);
            margin: 12px 0;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid;
            backdrop-filter: blur(5px);
            font-size: 0.9rem;
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
        .file-type {
            display: flex;
            justify-content: space-between;
            padding: 8px;
            margin: 5px 0;
            background: rgba(255,255,255,0.1);
            border-radius: 5px;
            font-size: 0.85rem;
        }
        .refresh {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 18px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 0.9rem;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        }
        .refresh:hover { background: #5a67d8; }
        .time { font-size: 0.9rem; opacity: 0.7; margin-top: 5px; }
        .scanning {
            display: inline-block;
            width: 8px;
            height: 8px;
            background: #ffa502;
            border-radius: 50%;
            margin-right: 8px;
            animation: pulse 1s infinite;
        }
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
        @media (max-width: 768px) {
            .content { grid-template-columns: 1fr; }
            .stats { grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 Claudyne Code Agent</h1>
            <p>${this.isScanning ? '<span class="scanning"></span>Analyse Complète en Cours' : '<span class="live"></span>Surveillance Complète Active'} • Plateforme Éducative</p>
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
                <p>♿ Accessibilité</p>
            </div>
            <div class="stat">
                <h3>${this.fileStats.seo}</h3>
                <p>🔍 SEO</p>
            </div>
        </div>

        <div class="content">
            <div class="issues">
                <h2>📊 Problèmes Détectés</h2>
                ${recentIssues.length === 0 ?
                  '<div class="no-issues">🎉 Aucun problème détecté !<br>Votre code semble en excellente santé.</div>' :
                  recentIssues.map(result =>
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
                <h3>📈 Types de Fichiers</h3>
                ${fileTypesArray.slice(0, 10).map(([ext, count]) => `
                    <div class="file-type">
                        <span>${ext}</span>
                        <span>${count}</span>
                    </div>
                `).join('')}

                <h3 style="margin-top: 25px;">🎯 Statut</h3>
                <div style="font-size: 0.85rem; opacity: 0.8; line-height: 1.5;">
                    ${this.isScanning ?
                      '🔄 Scan complet en cours...<br>📊 Analyse de tous les fichiers' :
                      '✅ Surveillance active<br>👀 Monitoring en temps réel'
                    }
                </div>
            </div>
        </div>
    </div>

    <button class="refresh" onclick="location.reload()">🔄</button>

    <script>
        // Auto-refresh toutes les 20 secondes
        setTimeout(() => location.reload(), 20000);

        // Titre dynamique
        document.title = '🤖 Claudyne Agent • ${this.fileStats.issues} problèmes • ' + new Date().toLocaleTimeString();

        // Notification si problèmes critiques
        fetch('/api/stats')
            .then(response => response.json())
            .then(data => {
                const critical = data.results.reduce((sum, r) =>
                    sum + r.issues.filter(i => i.severity === 'critical').length, 0);
                if (critical > 0) {
                    console.log(\`⚠️ Claudyne Agent: \${critical} problème(s) critique(s) détecté(s)\`);
                }
            })
            .catch(() => {});
    </script>
</body>
</html>`;
  }
}

// Démarrage de l'agent complet
const agent = new ClaudyneAgentComplet();
agent.start();

// Gestion propre de l'arrêt
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt de l\'agent Claudyne complet...');
  console.log('📊 Statistiques finales:');
  agent.printSummary();
  console.log('👋 Agent arrêté proprement');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Arrêt demandé...');
  process.exit(0);
});