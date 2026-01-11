/**
 * ClaudyneAnalysisModules - Modules d'analyse spécialisés avancés
 *
 * Modules d'analyse sophistiqués pour la sécurité, performance, qualité et architecture
 * Spécialisés pour les technologies utilisées dans Claudyne (Node.js, React, React Native)
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// ===========================================
// MODULE DE SÉCURITÉ AVANCÉ
// ===========================================
class AdvancedSecurityAnalyzer {
    constructor() {
        this.vulnDatabase = this.loadVulnerabilityDatabase();
        this.securityPatterns = this.loadSecurityPatterns();
        this.cryptoPatterns = this.loadCryptoPatterns();
        this.authPatterns = this.loadAuthPatterns();
    }

    loadVulnerabilityDatabase() {
        return {
            // Vulnérabilités spécifiques Node.js
            node: {
                'eval': { severity: 'critical', cwe: 'CWE-95' },
                'child_process.exec': { severity: 'high', cwe: 'CWE-78' },
                'fs.readFile.*req.query': { severity: 'critical', cwe: 'CWE-22' },
                'Buffer.*from.*req.body': { severity: 'high', cwe: 'CWE-120' }
            },
            // Vulnérabilités React/Frontend
            react: {
                'dangerouslySetInnerHTML': { severity: 'high', cwe: 'CWE-79' },
                'document.cookie': { severity: 'medium', cwe: 'CWE-315' },
                'localStorage.setItem.*password': { severity: 'high', cwe: 'CWE-312' },
                'window.location.*=.*req': { severity: 'high', cwe: 'CWE-601' }
            },
            // Vulnérabilités React Native
            native: {
                'AsyncStorage.setItem.*password': { severity: 'high', cwe: 'CWE-312' },
                'Linking.openURL.*user': { severity: 'medium', cwe: 'CWE-601' },
                'NativeModules.*exec': { severity: 'high', cwe: 'CWE-78' }
            }
        };
    }

    loadSecurityPatterns() {
        return {
            // Injection SQL
            sqlInjection: [
                /query\s*\(\s*['"`].*\$\{.*\}.*['"`]/gi,
                /SELECT.*\+.*\$\{/gi,
                /INSERT.*\+.*\$\{/gi,
                /UPDATE.*\+.*\$\{/gi,
                /DELETE.*\+.*\$\{/gi,
                /WHERE.*\+.*\$\{/gi,
                /\.raw\(['"`].*\$\{/gi
            ],

            // XSS
            xss: [
                /innerHTML\s*=\s*['"`].*\$\{/gi,
                /outerHTML\s*=\s*['"`].*\$\{/gi,
                /document\.write\(['"`].*\$\{/gi,
                /\.html\(['"`].*\$\{/gi,
                /React\.createElement\(['"`].*\$\{/gi,
                /dangerouslySetInnerHTML.*\$\{/gi
            ],

            // LDAP Injection
            ldapInjection: [
                /ldap.*search.*\$\{/gi,
                /ActiveDirectory.*findUser.*\$\{/gi
            ],

            // Command Injection
            commandInjection: [
                /exec\(['"`].*\$\{/gi,
                /spawn\(['"`].*\$\{/gi,
                /execSync\(['"`].*\$\{/gi,
                /child_process.*\$\{/gi
            ],

            // Path Traversal
            pathTraversal: [
                /readFile.*\.\.\//gi,
                /createReadStream.*\.\.\//gi,
                /path\.join.*req\./gi,
                /fs\..*\(.*req\..*\)/gi
            ],

            // Regex DoS
            regexDos: [
                /new RegExp\(['"`].*\(\.\*\)\+/gi,
                /\.match\(['"`].*\(\.\*\)\+/gi,
                /\.replace\(['"`].*\(\.\*\)\+/gi
            ]
        };
    }

    loadCryptoPatterns() {
        return {
            weakAlgorithms: [
                /crypto\.createHash\(['"`](md5|sha1)['"`]/gi,
                /crypto\.createCipher\(['"`](des|rc4)['"`]/gi,
                /bcrypt\.hash.*rounds:\s*[1-9](?![0-9])/gi // rounds < 10
            ],

            weakKeys: [
                /crypto\.randomBytes\([1-7]\)/gi, // Moins de 8 bytes
                /Math\.random\(\).*password/gi,
                /Date\.now\(\).*token/gi
            ],

            hardcodedSecrets: [
                /password\s*[:=]\s*['"`][^'"`]{3,}['"`]/gi,
                /api[_-]?key\s*[:=]\s*['"`][a-zA-Z0-9]{10,}['"`]/gi,
                /secret\s*[:=]\s*['"`][^'"`]{8,}['"`]/gi,
                /token\s*[:=]\s*['"`][a-zA-Z0-9]{20,}['"`]/gi,
                /private[_-]?key\s*[:=]/gi
            ]
        };
    }

    loadAuthPatterns() {
        return {
            insecureAuth: [
                /session.*secure:\s*false/gi,
                /cookie.*httpOnly:\s*false/gi,
                /cors.*credentials:\s*true.*origin:\s*['"`]\*['"`]/gi,
                /jwt\.sign.*expiresIn:\s*['"`]\d+d['"`]/gi, // Expiration trop longue
                /req\.session.*admin.*true.*req\.query/gi
            ],

            missingAuth: [
                /app\.(get|post|put|delete).*admin.*no.*auth/gi,
                /router\.(get|post).*\/api\/.*without.*middleware/gi
            ]
        };
    }

    async analyzeFile(content, filePath) {
        const issues = [];
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNumber = i + 1;

            // Analyse ligne par ligne
            issues.push(...this.analyzeLine(line, lineNumber, filePath));
        }

        // Analyse contexte global
        issues.push(...this.analyzeGlobalContext(content, filePath));

        return issues;
    }

    analyzeLine(line, lineNumber, filePath) {
        const issues = [];
        const fileExtension = path.extname(filePath);
        const context = this.determineContext(filePath);

        // Analyse selon le contexte
        if (context === 'backend') {
            issues.push(...this.analyzeBackendSecurity(line, lineNumber, filePath));
        } else if (context === 'frontend') {
            issues.push(...this.analyzeFrontendSecurity(line, lineNumber, filePath));
        } else if (context === 'mobile') {
            issues.push(...this.analyzeMobileSecurity(line, lineNumber, filePath));
        }

        // Analyses communes
        issues.push(...this.analyzeCommonVulnerabilities(line, lineNumber, filePath));
        issues.push(...this.analyzeCryptoSecurity(line, lineNumber, filePath));
        issues.push(...this.analyzeAuthSecurity(line, lineNumber, filePath));

        return issues;
    }

    determineContext(filePath) {
        if (filePath.includes('backend')) return 'backend';
        if (filePath.includes('frontend')) return 'frontend';
        if (filePath.includes('claudyne-mobile')) return 'mobile';
        return 'unknown';
    }

    analyzeBackendSecurity(line, lineNumber, filePath) {
        const issues = [];

        // SQL Injection
        for (const pattern of this.securityPatterns.sqlInjection) {
            if (pattern.test(line)) {
                issues.push({
                    type: 'security',
                    category: 'sql-injection',
                    priority: 'critical',
                    cwe: 'CWE-89',
                    message: 'Risque d\'injection SQL - Requête construite avec interpolation',
                    line: lineNumber,
                    file: filePath,
                    code: line.trim(),
                    suggestion: 'Utiliser des requêtes préparées ou un ORM'
                });
            }
        }

        // Command Injection
        for (const pattern of this.securityPatterns.commandInjection) {
            if (pattern.test(line)) {
                issues.push({
                    type: 'security',
                    category: 'command-injection',
                    priority: 'critical',
                    cwe: 'CWE-78',
                    message: 'Risque d\'injection de commande système',
                    line: lineNumber,
                    file: filePath,
                    code: line.trim(),
                    suggestion: 'Valider et échapper les entrées utilisateur'
                });
            }
        }

        // Path Traversal
        for (const pattern of this.securityPatterns.pathTraversal) {
            if (pattern.test(line)) {
                issues.push({
                    type: 'security',
                    category: 'path-traversal',
                    priority: 'high',
                    cwe: 'CWE-22',
                    message: 'Risque de traversée de répertoire',
                    line: lineNumber,
                    file: filePath,
                    code: line.trim(),
                    suggestion: 'Valider et nettoyer les chemins de fichiers'
                });
            }
        }

        return issues;
    }

    analyzeFrontendSecurity(line, lineNumber, filePath) {
        const issues = [];

        // XSS
        for (const pattern of this.securityPatterns.xss) {
            if (pattern.test(line)) {
                issues.push({
                    type: 'security',
                    category: 'xss',
                    priority: 'high',
                    cwe: 'CWE-79',
                    message: 'Risque XSS - Insertion de contenu non échappé',
                    line: lineNumber,
                    file: filePath,
                    code: line.trim(),
                    suggestion: 'Échapper le contenu ou utiliser textContent'
                });
            }
        }

        // Storage de données sensibles
        if (/localStorage\.setItem.*password|sessionStorage\.setItem.*password/gi.test(line)) {
            issues.push({
                type: 'security',
                category: 'insecure-storage',
                priority: 'high',
                cwe: 'CWE-312',
                message: 'Stockage de données sensibles en local',
                line: lineNumber,
                file: filePath,
                code: line.trim(),
                suggestion: 'Ne pas stocker de mots de passe côté client'
            });
        }

        return issues;
    }

    analyzeMobileSecurity(line, lineNumber, filePath) {
        const issues = [];

        // AsyncStorage de données sensibles
        if (/AsyncStorage\.setItem.*password|SecureStore\.setItemAsync.*password/gi.test(line)) {
            issues.push({
                type: 'security',
                category: 'insecure-mobile-storage',
                priority: 'high',
                cwe: 'CWE-312',
                message: 'Stockage potentiellement non sécurisé de données sensibles',
                line: lineNumber,
                file: filePath,
                code: line.trim(),
                suggestion: 'Utiliser Expo SecureStore pour les données sensibles'
            });
        }

        // Deep linking non sécurisé
        if (/Linking\.openURL.*\$\{|Linking\.getInitialURL.*user/gi.test(line)) {
            issues.push({
                type: 'security',
                category: 'insecure-deep-linking',
                priority: 'medium',
                cwe: 'CWE-601',
                message: 'Deep linking potentiellement non sécurisé',
                line: lineNumber,
                file: filePath,
                code: line.trim(),
                suggestion: 'Valider les URLs avant ouverture'
            });
        }

        return issues;
    }

    analyzeCommonVulnerabilities(line, lineNumber, filePath) {
        const issues = [];

        // eval() usage
        if (/\beval\s*\(/gi.test(line)) {
            issues.push({
                type: 'security',
                category: 'code-injection',
                priority: 'critical',
                cwe: 'CWE-95',
                message: 'Utilisation dangereuse d\'eval()',
                line: lineNumber,
                file: filePath,
                code: line.trim(),
                suggestion: 'Éviter eval(), utiliser JSON.parse() ou des alternatives sûres'
            });
        }

        // Regex DoS
        for (const pattern of this.securityPatterns.regexDos) {
            if (pattern.test(line)) {
                issues.push({
                    type: 'security',
                    category: 'regex-dos',
                    priority: 'medium',
                    cwe: 'CWE-400',
                    message: 'Regex potentiellement vulnérable au ReDoS',
                    line: lineNumber,
                    file: filePath,
                    code: line.trim(),
                    suggestion: 'Optimiser l\'expression régulière'
                });
            }
        }

        return issues;
    }

    analyzeCryptoSecurity(line, lineNumber, filePath) {
        const issues = [];

        // Algorithmes faibles
        for (const pattern of this.cryptoPatterns.weakAlgorithms) {
            if (pattern.test(line)) {
                issues.push({
                    type: 'security',
                    category: 'weak-crypto',
                    priority: 'high',
                    cwe: 'CWE-327',
                    message: 'Algorithme cryptographique faible ou obsolète',
                    line: lineNumber,
                    file: filePath,
                    code: line.trim(),
                    suggestion: 'Utiliser SHA-256 ou plus récent, AES pour le chiffrement'
                });
            }
        }

        // Clés faibles
        for (const pattern of this.cryptoPatterns.weakKeys) {
            if (pattern.test(line)) {
                issues.push({
                    type: 'security',
                    category: 'weak-key',
                    priority: 'high',
                    cwe: 'CWE-326',
                    message: 'Génération de clé cryptographique faible',
                    line: lineNumber,
                    file: filePath,
                    code: line.trim(),
                    suggestion: 'Utiliser crypto.randomBytes() avec au moins 32 bytes'
                });
            }
        }

        // Secrets hardcodés
        for (const pattern of this.cryptoPatterns.hardcodedSecrets) {
            if (pattern.test(line)) {
                issues.push({
                    type: 'security',
                    category: 'hardcoded-secret',
                    priority: 'critical',
                    cwe: 'CWE-798',
                    message: 'Secret potentiellement hardcodé détecté',
                    line: lineNumber,
                    file: filePath,
                    code: line.replace(/['"`][^'"`]*['"`]/g, '"***"'),
                    suggestion: 'Utiliser des variables d\'environnement'
                });
            }
        }

        return issues;
    }

    analyzeAuthSecurity(line, lineNumber, filePath) {
        const issues = [];

        // Configuration d'authentification non sécurisée
        for (const pattern of this.authPatterns.insecureAuth) {
            if (pattern.test(line)) {
                issues.push({
                    type: 'security',
                    category: 'insecure-auth',
                    priority: 'high',
                    cwe: 'CWE-287',
                    message: 'Configuration d\'authentification non sécurisée',
                    line: lineNumber,
                    file: filePath,
                    code: line.trim(),
                    suggestion: 'Activer les options de sécurité (secure, httpOnly, etc.)'
                });
            }
        }

        return issues;
    }

    analyzeGlobalContext(content, filePath) {
        const issues = [];

        // Analyse des imports/requires dangereux
        const dangerousModules = ['child_process', 'vm', 'eval', 'fs'];
        dangerousModules.forEach(module => {
            const regex = new RegExp(`require\\(['"\`]${module}['"\`]\\)`, 'gi');
            if (regex.test(content)) {
                issues.push({
                    type: 'security',
                    category: 'dangerous-import',
                    priority: 'medium',
                    message: `Import de module potentiellement dangereux: ${module}`,
                    file: filePath,
                    suggestion: 'Vérifier la nécessité et sécuriser l\'usage'
                });
            }
        });

        return issues;
    }
}

// ===========================================
// MODULE DE PERFORMANCE AVANCÉ
// ===========================================
class AdvancedPerformanceAnalyzer {
    constructor() {
        this.performancePatterns = this.loadPerformancePatterns();
        this.optimizationHints = this.loadOptimizationHints();
    }

    loadPerformancePatterns() {
        return {
            // Opérations synchrones bloquantes
            blockingOps: [
                /fs\.readFileSync/gi,
                /fs\.writeFileSync/gi,
                /crypto\.pbkdf2Sync/gi,
                /bcrypt\.hashSync/gi,
                /\.exec\s*\(/gi
            ],

            // Boucles inefficaces
            inefficientLoops: [
                /for\s*\([^)]*\.length[^)]*\+\+/gi,
                /while\s*\([^)]*\.length/gi,
                /forEach.*forEach/gi, // Boucles imbriquées
                /map.*map.*map/gi // Chaînage excessif
            ],

            // Opérations DOM coûteuses (React)
            expensiveDOM: [
                /document\.getElementById.*loop/gi,
                /document\.querySelector.*for/gi,
                /innerHTML.*\+=/gi,
                /appendChild.*for/gi
            ],

            // Memory leaks potentiels
            memoryLeaks: [
                /setInterval(?!.*clearInterval)/gi,
                /setTimeout(?!.*clearTimeout)/gi,
                /addEventListener(?!.*removeEventListener)/gi,
                /new Array\(\d{4,}\)/gi // Grands tableaux
            ],

            // Requêtes N+1
            nPlusOne: [
                /for.*await.*query/gi,
                /forEach.*await.*find/gi,
                /map.*await.*findOne/gi
            ]
        };
    }

    loadOptimizationHints() {
        return {
            react: [
                {
                    pattern: /useEffect\(\s*\(\)\s*=>\s*\{[\s\S]*?\},\s*\[\]\s*\)/gi,
                    suggestion: 'Considérer useMemo ou useCallback pour optimiser'
                },
                {
                    pattern: /\.map\(.*=>\s*<.*>/gi,
                    suggestion: 'Ajouter une key prop unique pour les listes'
                }
            ],

            node: [
                {
                    pattern: /console\.log.*production/gi,
                    suggestion: 'Supprimer les console.log en production'
                },
                {
                    pattern: /JSON\.parse\(.*JSON\.stringify/gi,
                    suggestion: 'Utiliser une librairie de deep clone optimisée'
                }
            ]
        };
    }

    async analyzeFile(content, filePath) {
        const issues = [];
        const lines = content.split('\n');
        const context = this.determineContext(filePath);

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNumber = i + 1;

            // Analyse selon le contexte
            if (context === 'backend') {
                issues.push(...this.analyzeBackendPerformance(line, lineNumber, filePath));
            } else if (context === 'frontend' || context === 'mobile') {
                issues.push(...this.analyzeFrontendPerformance(line, lineNumber, filePath));
            }

            // Analyses communes
            issues.push(...this.analyzeCommonPerformance(line, lineNumber, filePath));
        }

        // Analyse globale
        issues.push(...this.analyzeGlobalPerformance(content, filePath, context));

        return issues;
    }

    determineContext(filePath) {
        if (filePath.includes('backend')) return 'backend';
        if (filePath.includes('frontend')) return 'frontend';
        if (filePath.includes('claudyne-mobile')) return 'mobile';
        return 'unknown';
    }

    analyzeBackendPerformance(line, lineNumber, filePath) {
        const issues = [];

        // Opérations synchrones
        for (const pattern of this.performancePatterns.blockingOps) {
            if (pattern.test(line)) {
                issues.push({
                    type: 'performance',
                    category: 'blocking-operation',
                    priority: 'high',
                    message: 'Opération synchrone bloquante détectée',
                    line: lineNumber,
                    file: filePath,
                    code: line.trim(),
                    suggestion: 'Utiliser la version asynchrone'
                });
            }
        }

        // Problème N+1
        for (const pattern of this.performancePatterns.nPlusOne) {
            if (pattern.test(line)) {
                issues.push({
                    type: 'performance',
                    category: 'n-plus-one',
                    priority: 'high',
                    message: 'Problème N+1 potentiel détecté',
                    line: lineNumber,
                    file: filePath,
                    code: line.trim(),
                    suggestion: 'Utiliser des requêtes avec JOIN ou includeAll'
                });
            }
        }

        return issues;
    }

    analyzeFrontendPerformance(line, lineNumber, filePath) {
        const issues = [];

        // Opérations DOM coûteuses
        for (const pattern of this.performancePatterns.expensiveDOM) {
            if (pattern.test(line)) {
                issues.push({
                    type: 'performance',
                    category: 'expensive-dom',
                    priority: 'medium',
                    message: 'Opération DOM potentiellement coûteuse',
                    line: lineNumber,
                    file: filePath,
                    code: line.trim(),
                    suggestion: 'Minimiser les manipulations DOM, utiliser des refs'
                });
            }
        }

        // Re-renders inutiles (React)
        if (/useEffect.*\[\].*setState/gi.test(line)) {
            issues.push({
                type: 'performance',
                category: 'unnecessary-render',
                priority: 'medium',
                message: 'Re-render potentiellement inutile',
                line: lineNumber,
                file: filePath,
                code: line.trim(),
                suggestion: 'Vérifier les dépendances useEffect'
            });
        }

        return issues;
    }

    analyzeCommonPerformance(line, lineNumber, filePath) {
        const issues = [];

        // Boucles inefficaces
        for (const pattern of this.performancePatterns.inefficientLoops) {
            if (pattern.test(line)) {
                issues.push({
                    type: 'performance',
                    category: 'inefficient-loop',
                    priority: 'medium',
                    message: 'Boucle potentiellement inefficace',
                    line: lineNumber,
                    file: filePath,
                    code: line.trim(),
                    suggestion: 'Optimiser la boucle ou utiliser des méthodes array natives'
                });
            }
        }

        // Memory leaks potentiels
        for (const pattern of this.performancePatterns.memoryLeaks) {
            if (pattern.test(line)) {
                issues.push({
                    type: 'performance',
                    category: 'memory-leak',
                    priority: 'high',
                    message: 'Fuite mémoire potentielle',
                    line: lineNumber,
                    file: filePath,
                    code: line.trim(),
                    suggestion: 'Nettoyer les timers et event listeners'
                });
            }
        }

        return issues;
    }

    analyzeGlobalPerformance(content, filePath, context) {
        const issues = [];

        // Analyse de la complexité du fichier
        const complexity = this.calculateComplexity(content);
        if (complexity > 50) {
            issues.push({
                type: 'performance',
                category: 'high-complexity',
                priority: 'medium',
                message: `Complexité élevée détectée (${complexity})`,
                file: filePath,
                suggestion: 'Refactoriser en fonctions plus petites'
            });
        }

        // Analyse de la taille du bundle (estimation)
        const bundleSize = this.estimateBundleSize(content);
        if (bundleSize > 100000) { // 100KB
            issues.push({
                type: 'performance',
                category: 'large-bundle',
                priority: 'medium',
                message: `Fichier volumineux (~${Math.round(bundleSize/1000)}KB)`,
                file: filePath,
                suggestion: 'Considérer le code splitting'
            });
        }

        return issues;
    }

    calculateComplexity(content) {
        const keywords = ['if', 'else', 'while', 'for', 'switch', 'case', 'catch', 'try', '&&', '||'];
        let complexity = 1;

        keywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'g');
            const matches = content.match(regex);
            if (matches) {
                complexity += matches.length;
            }
        });

        return complexity;
    }

    estimateBundleSize(content) {
        return Buffer.byteLength(content, 'utf8');
    }
}

// ===========================================
// MODULE DE QUALITÉ DE CODE AVANCÉ
// ===========================================
class AdvancedCodeQualityAnalyzer {
    constructor() {
        this.qualityPatterns = this.loadQualityPatterns();
        this.codeSmells = this.loadCodeSmells();
        this.bestPractices = this.loadBestPractices();
    }

    loadQualityPatterns() {
        return {
            // Nommage
            naming: [
                /var\s+[a-z]+\d+/gi, // Variables avec chiffres
                /function\s+[a-z]{1,2}\s*\(/gi, // Noms trop courts
                /const\s+[A-Z_]+\s*=/gi, // Constants mal nommées
            ],

            // Duplication
            duplication: [
                // Détection basique de duplication
            ],

            // Complexité
            complexity: [
                /if.*if.*if.*if/gi, // Conditions imbriquées
                /try.*catch.*try.*catch/gi, // Exception handling complexe
            ]
        };
    }

    loadCodeSmells() {
        return {
            // Long Parameter List
            longParameterList: /function.*\([^)]{50,}\)/gi,

            // Large Class
            largeClass: /class\s+\w+[\s\S]{2000,}^}/gm,

            // Dead Code
            deadCode: [
                /\/\*[\s\S]*?\*\//g, // Commentaires longs
                /console\.log.*debug/gi,
                /TODO.*FIXME/gi
            ],

            // Magic Numbers
            magicNumbers: /\b(?!0|1|2|10|100|1000)(\d{3,})\b/g
        };
    }

    loadBestPractices() {
        return {
            react: [
                {
                    pattern: /function\s+(\w+)\s*\([^)]*\)\s*\{/gi,
                    rule: 'Component names should be PascalCase',
                    check: (match) => /^[A-Z]/.test(match[1])
                }
            ],

            node: [
                {
                    pattern: /require\(['"`]([^'"`]+)['"`]\)/gi,
                    rule: 'Prefer absolute imports over relative',
                    check: (match) => !match[1].startsWith('../')
                }
            ]
        };
    }

    async analyzeFile(content, filePath) {
        const issues = [];
        const lines = content.split('\n');

        // Analyse ligne par ligne
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNumber = i + 1;
            issues.push(...this.analyzeLine(line, lineNumber, filePath));
        }

        // Analyse globale
        issues.push(...this.analyzeGlobalQuality(content, filePath));

        return issues;
    }

    analyzeLine(line, lineNumber, filePath) {
        const issues = [];

        // Ligne trop longue
        if (line.length > 120) {
            issues.push({
                type: 'quality',
                category: 'long-line',
                priority: 'low',
                message: `Ligne trop longue (${line.length} caractères)`,
                line: lineNumber,
                file: filePath,
                suggestion: 'Diviser en plusieurs lignes'
            });
        }

        // TODO/FIXME
        if (/TODO|FIXME|HACK|XXX/i.test(line)) {
            issues.push({
                type: 'quality',
                category: 'technical-debt',
                priority: 'low',
                message: 'Code temporaire ou à finaliser',
                line: lineNumber,
                file: filePath,
                suggestion: 'Finaliser l\'implémentation'
            });
        }

        // console.log oublié
        if (/console\.log/gi.test(line) && !filePath.includes('test')) {
            issues.push({
                type: 'quality',
                category: 'debug-code',
                priority: 'low',
                message: 'console.log détecté',
                line: lineNumber,
                file: filePath,
                suggestion: 'Utiliser un logger approprié ou supprimer'
            });
        }

        // Conditions complexes
        if ((line.match(/&&|\|\|/g) || []).length > 3) {
            issues.push({
                type: 'quality',
                category: 'complex-condition',
                priority: 'medium',
                message: 'Condition complexe difficile à lire',
                line: lineNumber,
                file: filePath,
                suggestion: 'Extraire en variables ou fonctions'
            });
        }

        // Magic numbers
        const magicNumbers = line.match(/\b(?!0|1|2|10|100|1000)(\d{3,})\b/g);
        if (magicNumbers && !line.includes('//') && !line.includes('const')) {
            issues.push({
                type: 'quality',
                category: 'magic-number',
                priority: 'low',
                message: `Nombre magique détecté: ${magicNumbers.join(', ')}`,
                line: lineNumber,
                file: filePath,
                suggestion: 'Extraire en constante nommée'
            });
        }

        return issues;
    }

    analyzeGlobalQuality(content, filePath) {
        const issues = [];

        // Fonction trop longue
        const functions = this.extractFunctions(content);
        functions.forEach(func => {
            if (func.lineCount > 50) {
                issues.push({
                    type: 'quality',
                    category: 'long-function',
                    priority: 'medium',
                    message: `Fonction trop longue: ${func.name} (${func.lineCount} lignes)`,
                    line: func.startLine,
                    file: filePath,
                    suggestion: 'Diviser en fonctions plus petites'
                });
            }
        });

        // Fichier trop long
        const lineCount = content.split('\n').length;
        if (lineCount > 500) {
            issues.push({
                type: 'quality',
                category: 'large-file',
                priority: 'medium',
                message: `Fichier volumineux (${lineCount} lignes)`,
                file: filePath,
                suggestion: 'Diviser en modules plus petits'
            });
        }

        // Duplication de code (basique)
        const duplicates = this.findDuplicatedLines(content);
        if (duplicates > 10) {
            issues.push({
                type: 'quality',
                category: 'code-duplication',
                priority: 'medium',
                message: `Code dupliqué détecté (${duplicates} lignes)`,
                file: filePath,
                suggestion: 'Extraire le code commun en fonctions'
            });
        }

        return issues;
    }

    extractFunctions(content) {
        const functions = [];
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const funcMatch = line.match(/function\s+(\w+)|const\s+(\w+)\s*=.*=>/);

            if (funcMatch) {
                const name = funcMatch[1] || funcMatch[2];
                let braceCount = 0;
                let endLine = i;

                // Trouver la fin de la fonction
                for (let j = i; j < lines.length; j++) {
                    const currentLine = lines[j];
                    braceCount += (currentLine.match(/\{/g) || []).length;
                    braceCount -= (currentLine.match(/\}/g) || []).length;

                    if (braceCount === 0 && j > i) {
                        endLine = j;
                        break;
                    }
                }

                functions.push({
                    name,
                    startLine: i + 1,
                    endLine: endLine + 1,
                    lineCount: endLine - i
                });
            }
        }

        return functions;
    }

    findDuplicatedLines(content) {
        const lines = content.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 10 && !line.startsWith('//'));

        const counts = {};
        let duplicates = 0;

        lines.forEach(line => {
            counts[line] = (counts[line] || 0) + 1;
            if (counts[line] === 2) {
                duplicates += 2;
            } else if (counts[line] > 2) {
                duplicates++;
            }
        });

        return duplicates;
    }
}

// ===========================================
// MODULE D'ANALYSE ARCHITECTURALE AVANCÉ
// ===========================================
class AdvancedArchitectureAnalyzer {
    constructor() {
        this.architecturePatterns = this.loadArchitecturePatterns();
        this.dependencyRules = this.loadDependencyRules();
    }

    loadArchitecturePatterns() {
        return {
            // Violations de couches
            layerViolations: [
                {
                    rule: 'Models should not import routes',
                    pattern: /models.*require.*routes/gi
                },
                {
                    rule: 'Views should not import models directly',
                    pattern: /components.*require.*models/gi
                },
                {
                    rule: 'Utils should not import business logic',
                    pattern: /utils.*require.*services/gi
                }
            ],

            // Cycles de dépendances
            circularDependencies: [
                // Détecté par analyse des imports
            ],

            // Anti-patterns
            antiPatterns: [
                {
                    pattern: /God.*Class|Manager.*Manager|Util.*Util/gi,
                    message: 'Possible God Class or excessive responsibilities'
                }
            ]
        };
    }

    loadDependencyRules() {
        return {
            backend: {
                models: ['sequelize', 'mongoose'],
                controllers: ['express', 'models'],
                routes: ['express', 'controllers'],
                middleware: ['express'],
                utils: []
            },

            frontend: {
                components: ['react', 'hooks'],
                hooks: ['react'],
                services: ['axios'],
                utils: []
            }
        };
    }

    async analyzeProject(projectStructure) {
        const issues = [];

        // Analyse de la structure globale
        issues.push(...this.analyzeProjectStructure(projectStructure));

        // Analyse des dépendances
        issues.push(...await this.analyzeDependencies(projectStructure));

        return issues;
    }

    analyzeProjectStructure(projectStructure) {
        const issues = [];

        // Vérifier la séparation des responsabilités
        Object.entries(projectStructure).forEach(([module, files]) => {
            const fileCount = files.length;

            if (fileCount > 50) {
                issues.push({
                    type: 'architecture',
                    category: 'large-module',
                    priority: 'medium',
                    message: `Module ${module} trop volumineux (${fileCount} fichiers)`,
                    suggestion: 'Considérer la division en sous-modules'
                });
            }

            // Vérifier les conventions de nommage
            files.forEach(file => {
                if (!this.followsNamingConvention(file.name, module)) {
                    issues.push({
                        type: 'architecture',
                        category: 'naming-convention',
                        priority: 'low',
                        message: `Fichier ne suit pas les conventions: ${file.name}`,
                        file: file.path,
                        suggestion: 'Renommer selon les conventions du projet'
                    });
                }
            });
        });

        return issues;
    }

    followsNamingConvention(fileName, module) {
        const conventions = {
            backend: /^[a-z][a-zA-Z0-9]*\.(js|ts)$/,
            frontend: /^[A-Z][a-zA-Z0-9]*\.(tsx?|jsx?)$/,
            mobile: /^[A-Z][a-zA-Z0-9]*\.(tsx?|jsx?)$/
        };

        return conventions[module]?.test(fileName) || true;
    }

    async analyzeDependencies(projectStructure) {
        const issues = [];
        const dependencyGraph = await this.buildDependencyGraph(projectStructure);

        // Détecter les cycles
        const cycles = this.detectCircularDependencies(dependencyGraph);
        cycles.forEach(cycle => {
            issues.push({
                type: 'architecture',
                category: 'circular-dependency',
                priority: 'high',
                message: `Dépendance circulaire détectée: ${cycle.join(' -> ')}`,
                suggestion: 'Refactoriser pour éliminer le cycle'
            });
        });

        return issues;
    }

    async buildDependencyGraph(projectStructure) {
        const graph = new Map();

        for (const [module, files] of Object.entries(projectStructure)) {
            for (const file of files) {
                try {
                    const content = await fs.readFile(file.path, 'utf8');
                    const dependencies = this.extractDependencies(content);
                    graph.set(file.path, dependencies);
                } catch (error) {
                    // Ignorer les erreurs de lecture
                }
            }
        }

        return graph;
    }

    extractDependencies(content) {
        const dependencies = [];

        // Extraire les require/import
        const requireRegex = /require\(['"`]([^'"`]+)['"`]\)/g;
        const importRegex = /import.*from\s+['"`]([^'"`]+)['"`]/g;

        let match;
        while ((match = requireRegex.exec(content)) !== null) {
            if (!match[1].startsWith('.')) continue; // Ignorer les modules externes
            dependencies.push(match[1]);
        }

        while ((match = importRegex.exec(content)) !== null) {
            if (!match[1].startsWith('.')) continue;
            dependencies.push(match[1]);
        }

        return dependencies;
    }

    detectCircularDependencies(graph) {
        const cycles = [];
        const visited = new Set();
        const stack = new Set();

        for (const [node] of graph) {
            if (!visited.has(node)) {
                this.dfsForCycles(node, graph, visited, stack, [], cycles);
            }
        }

        return cycles;
    }

    dfsForCycles(node, graph, visited, stack, path, cycles) {
        visited.add(node);
        stack.add(node);
        path.push(node);

        const dependencies = graph.get(node) || [];

        for (const dep of dependencies) {
            if (stack.has(dep)) {
                // Cycle détecté
                const cycleStart = path.indexOf(dep);
                cycles.push(path.slice(cycleStart).concat([dep]));
            } else if (!visited.has(dep)) {
                this.dfsForCycles(dep, graph, visited, stack, path, cycles);
            }
        }

        stack.delete(node);
        path.pop();
    }
}

module.exports = {
    AdvancedSecurityAnalyzer,
    AdvancedPerformanceAnalyzer,
    AdvancedCodeQualityAnalyzer,
    AdvancedArchitectureAnalyzer
};