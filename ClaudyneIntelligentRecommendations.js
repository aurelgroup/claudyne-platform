/**
 * ClaudyneIntelligentRecommendations - Système de recommandations intelligentes
 *
 * Système d'IA pour générer des recommandations contextuelles et intelligentes
 * basées sur l'analyse du code, les patterns détectés et les bonnes pratiques
 */

const fs = require('fs').promises;
const path = require('path');

class ClaudyneIntelligentRecommendations {
    constructor(agent) {
        this.agent = agent;
        this.knowledgeBase = this.initializeKnowledgeBase();
        this.patternMatcher = new PatternMatcher();
        this.contextAnalyzer = new ContextAnalyzer();
        this.priorityEngine = new PriorityEngine();
        this.learningEngine = new LearningEngine();

        // Historique des recommandations pour apprentissage
        this.recommendationHistory = new Map();
        this.implementationFeedback = new Map();
    }

    initializeKnowledgeBase() {
        return {
            // Bonnes pratiques par technologie
            technologies: {
                nodejs: {
                    security: [
                        {
                            trigger: ['password', 'hardcoded'],
                            recommendation: 'Utiliser des variables d\'environnement',
                            priority: 'critical',
                            implementation: 'Remplacer par process.env.PASSWORD',
                            impact: 'Évite l\'exposition de secrets dans le code'
                        },
                        {
                            trigger: ['sql', 'injection'],
                            recommendation: 'Utiliser des requêtes préparées',
                            priority: 'critical',
                            implementation: 'Utiliser sequelize.query avec bind parameters',
                            impact: 'Prévient les attaques par injection SQL'
                        }
                    ],
                    performance: [
                        {
                            trigger: ['sync', 'blocking'],
                            recommendation: 'Convertir en opération asynchrone',
                            priority: 'high',
                            implementation: 'Utiliser await/async ou callbacks',
                            impact: 'Améliore la performance et évite le blocage'
                        },
                        {
                            trigger: ['for', 'length', 'inefficient'],
                            recommendation: 'Utiliser les méthodes array natives',
                            priority: 'medium',
                            implementation: 'Remplacer par forEach, map, filter, etc.',
                            impact: 'Code plus lisible et potentiellement plus rapide'
                        }
                    ]
                },

                react: {
                    performance: [
                        {
                            trigger: ['useEffect', 'dependency'],
                            recommendation: 'Optimiser les dépendances useEffect',
                            priority: 'medium',
                            implementation: 'Ajouter des dépendances spécifiques ou utiliser useCallback',
                            impact: 'Évite les re-renders inutiles'
                        },
                        {
                            trigger: ['map', 'key'],
                            recommendation: 'Ajouter des clés uniques aux listes',
                            priority: 'medium',
                            implementation: 'Ajouter key={item.id} ou index stable',
                            impact: 'Améliore les performances de rendu React'
                        }
                    ],
                    accessibility: [
                        {
                            trigger: ['button', 'onclick'],
                            recommendation: 'Améliorer l\'accessibilité',
                            priority: 'medium',
                            implementation: 'Ajouter aria-label et role appropriés',
                            impact: 'Meilleure accessibilité pour les utilisateurs'
                        }
                    ]
                },

                reactNative: {
                    performance: [
                        {
                            trigger: ['flatlist', 'performance'],
                            recommendation: 'Optimiser FlatList pour de grandes listes',
                            priority: 'high',
                            implementation: 'Utiliser getItemLayout, keyExtractor, removeClippedSubviews',
                            impact: 'Améliore les performances de scroll'
                        },
                        {
                            trigger: ['image', 'cache'],
                            recommendation: 'Optimiser le cache des images',
                            priority: 'medium',
                            implementation: 'Utiliser FastImage ou optimiser les tailles',
                            impact: 'Réduit l\'usage mémoire et améliore le chargement'
                        }
                    ],
                    security: [
                        {
                            trigger: ['asyncstorage', 'sensitive'],
                            recommendation: 'Utiliser un stockage sécurisé',
                            priority: 'high',
                            implementation: 'Remplacer par Expo SecureStore',
                            impact: 'Protège les données sensibles sur l\'appareil'
                        }
                    ]
                }
            },

            // Patterns d'architecture
            architecture: {
                separation: [
                    {
                        trigger: ['model', 'route', 'mixed'],
                        recommendation: 'Séparer les responsabilités',
                        priority: 'high',
                        implementation: 'Créer des couches distinctes (modèle, contrôleur, route)',
                        impact: 'Code plus maintenable et testable'
                    }
                ],
                scalability: [
                    {
                        trigger: ['large', 'file', 'monolith'],
                        recommendation: 'Diviser en modules plus petits',
                        priority: 'medium',
                        implementation: 'Extraire des fonctions/classes en fichiers séparés',
                        impact: 'Améliore la lisibilité et la maintenabilité'
                    }
                ]
            },

            // Patterns spécifiques Claudyne
            claudyne: {
                education: [
                    {
                        trigger: ['student', 'progress', 'tracking'],
                        recommendation: 'Implémenter un tracking robuste des progrès',
                        priority: 'high',
                        implementation: 'Utiliser des événements avec timestamps et validation',
                        impact: 'Données fiables pour le suivi pédagogique'
                    },
                    {
                        trigger: ['payment', 'security'],
                        recommendation: 'Renforcer la sécurité des paiements',
                        priority: 'critical',
                        implementation: 'Chiffrement bout-en-bout et validation serveur',
                        impact: 'Protection des données financières'
                    }
                ],
                performance: [
                    {
                        trigger: ['lesson', 'loading'],
                        recommendation: 'Optimiser le chargement des leçons',
                        priority: 'high',
                        implementation: 'Lazy loading et cache intelligent',
                        impact: 'Expérience utilisateur fluide'
                    }
                ]
            }
        };
    }

    async generateRecommendations(analysisResults, context = {}) {
        const recommendations = [];

        // Analyser chaque fichier
        for (const [filePath, fileAnalysis] of analysisResults) {
            const fileRecommendations = await this.analyzeFile(filePath, fileAnalysis, context);
            recommendations.push(...fileRecommendations);
        }

        // Recommandations globales du projet
        const globalRecommendations = await this.generateGlobalRecommendations(analysisResults, context);
        recommendations.push(...globalRecommendations);

        // Prioriser et filtrer
        const prioritizedRecommendations = this.priorityEngine.prioritize(recommendations);

        // Apprentissage automatique
        this.learningEngine.learn(prioritizedRecommendations, context);

        return prioritizedRecommendations;
    }

    async analyzeFile(filePath, fileAnalysis, context) {
        const recommendations = [];
        const fileContext = await this.contextAnalyzer.analyzeFile(filePath, fileAnalysis);

        // Recommandations basées sur les issues détectées
        for (const issue of fileAnalysis.issues) {
            const issueRecommendations = this.generateIssueRecommendations(issue, fileContext);
            recommendations.push(...issueRecommendations);
        }

        // Recommandations préventives
        const preventiveRecommendations = this.generatePreventiveRecommendations(fileContext);
        recommendations.push(...preventiveRecommendations);

        // Recommandations d'optimisation
        const optimizationRecommendations = this.generateOptimizationRecommendations(fileContext);
        recommendations.push(...optimizationRecommendations);

        return recommendations;
    }

    generateIssueRecommendations(issue, fileContext) {
        const recommendations = [];
        const knowledge = this.findRelevantKnowledge(issue, fileContext);

        for (const knowledgeItem of knowledge) {
            const recommendation = {
                id: this.generateRecommendationId(issue, knowledgeItem),
                type: 'fix',
                category: issue.category,
                priority: this.calculatePriority(issue, knowledgeItem, fileContext),
                title: knowledgeItem.recommendation,
                description: this.generateDescription(issue, knowledgeItem, fileContext),
                implementation: this.generateImplementation(issue, knowledgeItem, fileContext),
                impact: knowledgeItem.impact,
                effort: this.estimateEffort(issue, knowledgeItem, fileContext),
                confidence: this.calculateConfidence(issue, knowledgeItem, fileContext),
                source: {
                    file: issue.file,
                    line: issue.line,
                    issue: issue
                },
                metadata: {
                    technology: fileContext.technology,
                    complexity: fileContext.complexity,
                    criticality: fileContext.criticality
                }
            };

            recommendations.push(recommendation);
        }

        return recommendations;
    }

    generatePreventiveRecommendations(fileContext) {
        const recommendations = [];

        // Analyser les patterns potentiellement problématiques
        const risks = this.patternMatcher.identifyRisks(fileContext);

        for (const risk of risks) {
            if (risk.probability > 0.7) { // Seuil de probabilité
                recommendations.push({
                    id: `preventive_${risk.pattern}_${Date.now()}`,
                    type: 'preventive',
                    category: risk.category,
                    priority: 'medium',
                    title: `Prévenir le risque: ${risk.description}`,
                    description: `Pattern détecté qui pourrait évoluer vers un problème`,
                    implementation: risk.prevention,
                    impact: 'Évite des problèmes futurs',
                    effort: 'low',
                    confidence: risk.probability,
                    source: {
                        file: fileContext.filePath,
                        pattern: risk.pattern
                    }
                });
            }
        }

        return recommendations;
    }

    generateOptimizationRecommendations(fileContext) {
        const recommendations = [];

        // Optimisations basées sur les métriques
        if (fileContext.metrics.complexity > 15) {
            recommendations.push({
                id: `optimization_complexity_${Date.now()}`,
                type: 'optimization',
                category: 'complexity',
                priority: 'medium',
                title: 'Réduire la complexité du code',
                description: `Complexité actuelle: ${fileContext.metrics.complexity}. Objectif: < 15`,
                implementation: 'Extraire des fonctions plus petites, simplifier les conditions',
                impact: 'Code plus maintenable et testable',
                effort: 'medium',
                confidence: 0.8,
                source: {
                    file: fileContext.filePath,
                    metric: 'complexity'
                }
            });
        }

        if (fileContext.metrics.lines > 300) {
            recommendations.push({
                id: `optimization_size_${Date.now()}`,
                type: 'optimization',
                category: 'size',
                priority: 'low',
                title: 'Diviser le fichier volumineux',
                description: `Fichier de ${fileContext.metrics.lines} lignes`,
                implementation: 'Extraire des modules ou classes séparés',
                impact: 'Meilleure organisation du code',
                effort: 'high',
                confidence: 0.9,
                source: {
                    file: fileContext.filePath,
                    metric: 'size'
                }
            });
        }

        return recommendations;
    }

    generateGlobalRecommendations(analysisResults, context) {
        const recommendations = [];

        // Analyser les patterns globaux
        const globalPatterns = this.analyzeGlobalPatterns(analysisResults);

        // Recommandations d'architecture
        if (globalPatterns.circularDependencies > 0) {
            recommendations.push({
                id: 'global_circular_deps',
                type: 'architecture',
                category: 'dependencies',
                priority: 'high',
                title: 'Résoudre les dépendances circulaires',
                description: `${globalPatterns.circularDependencies} cycles détectés`,
                implementation: 'Refactoriser l\'architecture pour éliminer les cycles',
                impact: 'Architecture plus robuste et maintenable',
                effort: 'high',
                confidence: 1.0,
                scope: 'global'
            });
        }

        // Recommandations de sécurité globales
        const criticalSecurityIssues = this.countIssuesByPriority(analysisResults, 'critical', 'security');
        if (criticalSecurityIssues > 5) {
            recommendations.push({
                id: 'global_security_audit',
                type: 'security',
                category: 'audit',
                priority: 'critical',
                title: 'Audit de sécurité complet recommandé',
                description: `${criticalSecurityIssues} problèmes critiques détectés`,
                implementation: 'Effectuer un audit de sécurité complet avec un expert',
                impact: 'Sécurisation complète de la plateforme',
                effort: 'high',
                confidence: 1.0,
                scope: 'global'
            });
        }

        // Recommandations de performance
        const performanceIssues = this.countIssuesByCategory(analysisResults, 'performance');
        if (performanceIssues > 10) {
            recommendations.push({
                id: 'global_performance_optimization',
                type: 'performance',
                category: 'optimization',
                priority: 'medium',
                title: 'Plan d\'optimisation des performances',
                description: `${performanceIssues} problèmes de performance détectés`,
                implementation: 'Prioriser et résoudre systématiquement les problèmes',
                impact: 'Amélioration globale des performances',
                effort: 'medium',
                confidence: 0.8,
                scope: 'global'
            });
        }

        return recommendations;
    }

    findRelevantKnowledge(issue, fileContext) {
        const relevantKnowledge = [];
        const technology = fileContext.technology;

        // Chercher dans la base de connaissances
        const techKnowledge = this.knowledgeBase.technologies[technology];
        if (techKnowledge) {
            Object.values(techKnowledge).forEach(categoryKnowledge => {
                categoryKnowledge.forEach(knowledge => {
                    if (this.isKnowledgeRelevant(knowledge, issue, fileContext)) {
                        relevantKnowledge.push(knowledge);
                    }
                });
            });
        }

        // Chercher dans les patterns Claudyne spécifiques
        if (fileContext.isClaudyneSpecific) {
            const claudyneKnowledge = this.knowledgeBase.claudyne;
            Object.values(claudyneKnowledge).forEach(categoryKnowledge => {
                categoryKnowledge.forEach(knowledge => {
                    if (this.isKnowledgeRelevant(knowledge, issue, fileContext)) {
                        relevantKnowledge.push(knowledge);
                    }
                });
            });
        }

        return relevantKnowledge;
    }

    isKnowledgeRelevant(knowledge, issue, fileContext) {
        // Vérifier si les triggers correspondent
        return knowledge.trigger.some(trigger =>
            issue.message.toLowerCase().includes(trigger) ||
            issue.category.toLowerCase().includes(trigger) ||
            (issue.code && issue.code.toLowerCase().includes(trigger))
        );
    }

    calculatePriority(issue, knowledgeItem, fileContext) {
        let basePriority = this.getPriorityScore(issue.priority);

        // Ajustements contextuels
        if (fileContext.criticality === 'high') basePriority += 20;
        if (fileContext.technology === 'production') basePriority += 15;
        if (knowledgeItem.priority === 'critical') basePriority += 30;

        // Conversion en priorité textuelle
        if (basePriority >= 80) return 'critical';
        if (basePriority >= 60) return 'high';
        if (basePriority >= 40) return 'medium';
        return 'low';
    }

    getPriorityScore(priority) {
        const scores = { critical: 100, high: 75, medium: 50, low: 25 };
        return scores[priority] || 25;
    }

    generateDescription(issue, knowledgeItem, fileContext) {
        return `${knowledgeItem.recommendation}

**Problème détecté:** ${issue.message}
**Localisation:** ${path.basename(issue.file)}:${issue.line}
**Contexte:** ${fileContext.technology} - ${fileContext.context}

**Pourquoi c'est important:** ${knowledgeItem.impact}`;
    }

    generateImplementation(issue, knowledgeItem, fileContext) {
        let implementation = knowledgeItem.implementation;

        // Personnaliser selon le contexte
        if (fileContext.technology === 'react' && issue.category === 'performance') {
            implementation += '\n\n**Considérations React:**\n- Utiliser React.memo si nécessaire\n- Vérifier les dépendances useEffect';
        }

        if (fileContext.isClaudyneSpecific) {
            implementation += '\n\n**Spécifique à Claudyne:**\n- Respecter les standards éducatifs\n- Assurer la compatibilité mobile';
        }

        return implementation;
    }

    estimateEffort(issue, knowledgeItem, fileContext) {
        let effort = 'medium';

        // Facteurs d'effort
        if (issue.category === 'security' && issue.priority === 'critical') effort = 'high';
        if (fileContext.complexity > 20) effort = 'high';
        if (knowledgeItem.implementation.length < 100) effort = 'low';

        return effort;
    }

    calculateConfidence(issue, knowledgeItem, fileContext) {
        let confidence = 0.7; // Base

        // Ajustements
        if (issue.cwe) confidence += 0.2; // Issue bien définie
        if (fileContext.technology === knowledgeItem.technology) confidence += 0.1;
        if (this.hasImplementationHistory(knowledgeItem)) confidence += 0.1;

        return Math.min(confidence, 1.0);
    }

    hasImplementationHistory(knowledgeItem) {
        // Vérifier si cette recommandation a déjà été implémentée avec succès
        return this.implementationFeedback.has(knowledgeItem.trigger.join(','));
    }

    analyzeGlobalPatterns(analysisResults) {
        const patterns = {
            circularDependencies: 0,
            duplicatedCode: 0,
            inconsistentPatterns: 0
        };

        // Analyser tous les résultats pour détecter des patterns globaux
        for (const [filePath, analysis] of analysisResults) {
            analysis.issues.forEach(issue => {
                if (issue.category === 'circular-dependency') patterns.circularDependencies++;
                if (issue.category === 'code-duplication') patterns.duplicatedCode++;
            });
        }

        return patterns;
    }

    countIssuesByPriority(analysisResults, priority, type = null) {
        let count = 0;
        for (const [filePath, analysis] of analysisResults) {
            count += analysis.issues.filter(issue =>
                issue.priority === priority &&
                (type === null || issue.type === type)
            ).length;
        }
        return count;
    }

    countIssuesByCategory(analysisResults, category) {
        let count = 0;
        for (const [filePath, analysis] of analysisResults) {
            count += analysis.issues.filter(issue => issue.category === category).length;
        }
        return count;
    }

    generateRecommendationId(issue, knowledgeItem) {
        const hash = require('crypto').createHash('md5');
        hash.update(`${issue.file}_${issue.line}_${knowledgeItem.recommendation}`);
        return hash.digest('hex').substring(0, 8);
    }

    // API pour feedback et apprentissage
    recordImplementation(recommendationId, success, feedback = null) {
        this.implementationFeedback.set(recommendationId, {
            success,
            feedback,
            timestamp: Date.now()
        });

        this.learningEngine.updateFromFeedback(recommendationId, success, feedback);
    }

    getRecommendationsForFile(filePath) {
        return Array.from(this.recommendationHistory.values())
            .filter(rec => rec.source && rec.source.file === filePath);
    }

    getTopRecommendations(limit = 10) {
        return Array.from(this.recommendationHistory.values())
            .sort((a, b) => this.getPriorityScore(b.priority) - this.getPriorityScore(a.priority))
            .slice(0, limit);
    }
}

// Classes auxiliaires

class PatternMatcher {
    identifyRisks(fileContext) {
        const risks = [];

        // Patterns risqués basés sur le contenu
        if (fileContext.hasAsyncOperations && fileContext.hasLoops) {
            risks.push({
                pattern: 'async_in_loop',
                description: 'Opérations asynchrones dans des boucles',
                category: 'performance',
                probability: 0.8,
                prevention: 'Utiliser Promise.all() ou des alternatives'
            });
        }

        if (fileContext.hasUserInput && !fileContext.hasValidation) {
            risks.push({
                pattern: 'unvalidated_input',
                description: 'Entrées utilisateur non validées',
                category: 'security',
                probability: 0.9,
                prevention: 'Ajouter une validation des entrées'
            });
        }

        return risks;
    }
}

class ContextAnalyzer {
    async analyzeFile(filePath, fileAnalysis) {
        const context = {
            filePath,
            technology: this.determineTechnology(filePath),
            context: this.determineContext(filePath),
            complexity: fileAnalysis.metrics?.complexity || 0,
            lines: fileAnalysis.metrics?.lines || 0,
            criticality: this.determineCriticality(filePath),
            isClaudyneSpecific: this.isClaudyneSpecific(filePath),
            hasAsyncOperations: this.hasAsyncOperations(fileAnalysis),
            hasLoops: this.hasLoops(fileAnalysis),
            hasUserInput: this.hasUserInput(fileAnalysis),
            hasValidation: this.hasValidation(fileAnalysis),
            metrics: fileAnalysis.metrics || {}
        };

        return context;
    }

    determineTechnology(filePath) {
        if (filePath.includes('backend')) return 'nodejs';
        if (filePath.includes('frontend')) return 'react';
        if (filePath.includes('claudyne-mobile')) return 'reactNative';
        return 'unknown';
    }

    determineContext(filePath) {
        if (filePath.includes('/models/')) return 'model';
        if (filePath.includes('/routes/')) return 'route';
        if (filePath.includes('/components/')) return 'component';
        if (filePath.includes('/services/')) return 'service';
        if (filePath.includes('/utils/')) return 'utility';
        return 'unknown';
    }

    determineCriticality(filePath) {
        const criticalPaths = ['/auth/', '/payment/', '/security/', '/admin/'];
        if (criticalPaths.some(path => filePath.includes(path))) return 'high';
        if (filePath.includes('/core/') || filePath.includes('/models/')) return 'medium';
        return 'low';
    }

    isClaudyneSpecific(filePath) {
        const claudynePatterns = ['/student/', '/lesson/', '/progress/', '/family/', '/battle/'];
        return claudynePatterns.some(pattern => filePath.includes(pattern));
    }

    hasAsyncOperations(fileAnalysis) {
        return fileAnalysis.issues?.some(issue =>
            issue.code?.includes('await') ||
            issue.code?.includes('async') ||
            issue.code?.includes('Promise')
        ) || false;
    }

    hasLoops(fileAnalysis) {
        return fileAnalysis.issues?.some(issue =>
            issue.code?.includes('for') ||
            issue.code?.includes('while') ||
            issue.code?.includes('forEach')
        ) || false;
    }

    hasUserInput(fileAnalysis) {
        return fileAnalysis.issues?.some(issue =>
            issue.code?.includes('req.body') ||
            issue.code?.includes('req.query') ||
            issue.code?.includes('req.params')
        ) || false;
    }

    hasValidation(fileAnalysis) {
        return fileAnalysis.issues?.some(issue =>
            issue.code?.includes('validate') ||
            issue.code?.includes('joi') ||
            issue.code?.includes('validator')
        ) || false;
    }
}

class PriorityEngine {
    prioritize(recommendations) {
        return recommendations
            .sort((a, b) => {
                // Tri par priorité puis par confidence
                const priorityA = this.getPriorityScore(a.priority);
                const priorityB = this.getPriorityScore(b.priority);

                if (priorityA !== priorityB) {
                    return priorityB - priorityA;
                }

                return (b.confidence || 0) - (a.confidence || 0);
            })
            .map(rec => ({
                ...rec,
                rank: this.calculateRank(rec)
            }));
    }

    getPriorityScore(priority) {
        const scores = { critical: 100, high: 75, medium: 50, low: 25 };
        return scores[priority] || 25;
    }

    calculateRank(recommendation) {
        let rank = this.getPriorityScore(recommendation.priority);
        rank += (recommendation.confidence || 0) * 20;
        rank += recommendation.type === 'security' ? 10 : 0;
        rank += recommendation.effort === 'low' ? 5 : 0;
        return Math.round(rank);
    }
}

class LearningEngine {
    constructor() {
        this.patterns = new Map();
        this.successRates = new Map();
    }

    learn(recommendations, context) {
        // Apprendre des patterns de recommandations
        recommendations.forEach(rec => {
            const pattern = `${rec.category}_${rec.type}`;
            if (!this.patterns.has(pattern)) {
                this.patterns.set(pattern, {
                    count: 0,
                    contexts: [],
                    successRate: 0.5
                });
            }

            const patternData = this.patterns.get(pattern);
            patternData.count++;
            patternData.contexts.push(context);
        });
    }

    updateFromFeedback(recommendationId, success, feedback) {
        if (!this.successRates.has(recommendationId)) {
            this.successRates.set(recommendationId, []);
        }

        this.successRates.get(recommendationId).push({
            success,
            feedback,
            timestamp: Date.now()
        });
    }

    getPatternSuccessRate(pattern) {
        const data = this.patterns.get(pattern);
        return data ? data.successRate : 0.5;
    }
}

module.exports = ClaudyneIntelligentRecommendations;