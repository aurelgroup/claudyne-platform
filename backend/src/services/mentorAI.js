/**
 * Service Mentor IA Claudyne
 * Intégration OpenAI optimisée pour l'éducation au Cameroun
 */

const OpenAI = require('openai');
const logger = require('../utils/logger');

class MentorAI {
  constructor() {
    this.openai = null;
    this.isConfigured = false;
    this.initializeOpenAI();

    // Contexte éducatif camerounais
    this.cameroonContext = {
      curriculum: {
        primary: ['Français', 'Mathématiques', 'Sciences', 'Histoire-Géographie', 'Anglais'],
        secondary: ['Mathématiques', 'Physique', 'Chimie', 'Biologie', 'Français', 'Anglais', 'Histoire', 'Géographie', 'Philosophie'],
        technical: ['Informatique', 'Électronique', 'Mécanique', 'Comptabilité', 'Secrétariat']
      },
      languages: ['français', 'anglais', 'fulfulde', 'ewondo', 'duala', 'bamiléké'],
      culturalContext: 'Contexte éducatif camerounais avec système bilingue français-anglais',
      examTypes: ['CEP', 'BEPC', 'Baccalauréat A', 'Baccalauréat C', 'Baccalauréat D', 'CAP', 'BEP', 'BTS']
    };

    // Cache des conversations pour contexte
    this.conversationCache = new Map();
  }

  initializeOpenAI() {
    const apiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY;

    if (apiKey && apiKey !== 'your_openai_api_key') {
      this.openai = new OpenAI({
        apiKey: apiKey,
        timeout: 30000, // 30s timeout pour réseaux lents Cameroun
      });
      this.isConfigured = true;
      logger.info('✅ OpenAI Mentor IA configuré');
    } else {
      logger.warn('⚠️  OpenAI non configuré - Mode simulation activé');
      this.isConfigured = false;
    }
  }

  /**
   * Générer une réponse de mentor personnalisée
   */
  async generateMentorResponse(studentId, message, context = {}) {
    try {
      if (!this.isConfigured) {
        return this.generateSimulatedResponse(message, context);
      }

      const {
        subject = 'général',
        educationLevel = 'COLLEGE',
        studentName = 'Étudiant',
        conversationHistory = [],
        difficulty = 'medium'
      } = context;

      // Construire le prompt contextualisé
      const systemPrompt = this.buildSystemPrompt(subject, educationLevel, studentName);
      const messages = this.buildConversationMessages(systemPrompt, conversationHistory, message);

      const completion = await this.openai.chat.completions.create({
        model: process.env.AI_MODEL || 'gpt-3.5-turbo',
        messages: messages,
        max_tokens: parseInt(process.env.AI_MAX_TOKENS) || 500,
        temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
        user: `student_${studentId}` // Pour tracking OpenAI
      });

      const response = completion.choices[0].message.content;

      // Mise à jour du cache de conversation
      this.updateConversationCache(studentId, message, response, context);

      // Log pour monitoring
      logger.info(`Mentor IA response generated for student ${studentId}`, {
        subject: subject,
        level: educationLevel,
        tokens: completion.usage?.total_tokens || 0,
        model: completion.model
      });

      return {
        response: response,
        confidence: this.calculateConfidence(completion),
        suggestions: this.generateFollowUpSuggestions(subject, response),
        metadata: {
          model: completion.model,
          tokensUsed: completion.usage?.total_tokens || 0,
          processingTime: Date.now()
        }
      };

    } catch (error) {
      logger.error('Erreur génération réponse Mentor IA:', error);

      // Fallback en cas d'erreur
      return this.generateSimulatedResponse(message, context);
    }
  }

  /**
   * Construire le prompt système adapté au Cameroun
   */
  buildSystemPrompt(subject, educationLevel, studentName) {
    const levelMapping = {
      'MATERNELLE': 'préscolaire',
      'PRIMAIRE': 'primaire',
      'COLLEGE': 'secondaire premier cycle',
      'LYCEE': 'secondaire second cycle',
      'TECHNIQUE': 'technique et professionnel',
      'SUPERIEUR': 'supérieur'
    };

    const level = levelMapping[educationLevel] || 'secondaire';

    return `Tu es Claudyne, un mentor IA bienveillant et expert en éducation au Cameroun.

CONTEXTE CAMEROUNAIS:
- Système éducatif bilingue français-anglais
- Curriculum national camerounais
- Adaptation aux réalités locales
- Respect des valeurs culturelles

PROFIL ÉTUDIANT:
- Nom: ${studentName}
- Niveau: ${level}
- Matière: ${subject}

TON RÔLE:
- Accompagner avec patience et encouragement
- Expliquer simplement et progressivement
- Utiliser des exemples du quotidien camerounais
- Valoriser les efforts et progrès
- Respecter le rythme d'apprentissage

STYLE DE COMMUNICATION:
- Bienveillant et encourageant
- Langage adapté au niveau
- Exemples concrets et locaux
- Questions pour stimuler la réflexion
- Célébrer les petites victoires

CONSIGNES SPÉCIALES:
- Utilise "tu" pour créer proximité
- Intègre des références culturelles camerounaises quand approprié
- Propose des exercices pratiques
- Encourage la curiosité
- Reste positif même face aux difficultés

En hommage à Meffo Mehtah Tchandjio Claudine, incarne les valeurs d'excellence éducative et de transmission du savoir.`;
  }

  /**
   * Construire l'historique de conversation
   */
  buildConversationMessages(systemPrompt, history, currentMessage) {
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Ajouter l'historique récent (max 10 derniers échanges)
    const recentHistory = history.slice(-10);
    for (const exchange of recentHistory) {
      messages.push({ role: 'user', content: exchange.userMessage });
      messages.push({ role: 'assistant', content: exchange.aiResponse });
    }

    // Ajouter le message actuel
    messages.push({ role: 'user', content: currentMessage });

    return messages;
  }

  /**
   * Calculer la confiance de la réponse
   */
  calculateConfidence(completion) {
    // Heuristiques simples pour estimer la confiance
    const choice = completion.choices[0];
    let confidence = 0.8; // Base

    if (choice.finish_reason === 'stop') confidence += 0.1;
    if (choice.message.content.length > 50) confidence += 0.05;
    if (choice.message.content.includes('?')) confidence += 0.05; // Questions pour engager

    return Math.min(confidence, 1.0);
  }

  /**
   * Générer des suggestions de suivi
   */
  generateFollowUpSuggestions(subject, response) {
    const suggestions = {
      'mathématiques': [
        'Veux-tu voir un autre exemple ?',
        'Essayons un exercice pratique',
        'Quelle partie te semble difficile ?'
      ],
      'français': [
        'Veux-tu qu\'on travaille la grammaire ?',
        'Essayons de construire une phrase',
        'Quel type de texte préfères-tu ?'
      ],
      'sciences': [
        'Veux-tu faire une expérience ?',
        'Comment cela se passe dans la nature ?',
        'Quelle application vois-tu au quotidien ?'
      ],
      'anglais': [
        'Let\'s practice pronunciation',
        'Veux-tu apprendre du vocabulaire ?',
        'Essayons une conversation simple'
      ],
      'général': [
        'Comment puis-je mieux t\'aider ?',
        'Veux-tu approfondir ce sujet ?',
        'As-tu d\'autres questions ?'
      ]
    };

    const subjectLower = subject.toLowerCase();
    const matchedSubject = Object.keys(suggestions).find(s => subjectLower.includes(s)) || 'général';

    return suggestions[matchedSubject].slice(0, 2); // Max 2 suggestions
  }

  /**
   * Mettre à jour le cache de conversation
   */
  updateConversationCache(studentId, userMessage, aiResponse, context) {
    if (!this.conversationCache.has(studentId)) {
      this.conversationCache.set(studentId, {
        messages: [],
        context: context,
        lastActivity: new Date()
      });
    }

    const conversation = this.conversationCache.get(studentId);
    conversation.messages.push({
      userMessage: userMessage,
      aiResponse: aiResponse,
      timestamp: new Date(),
      subject: context.subject
    });

    // Garder seulement les 20 derniers échanges
    if (conversation.messages.length > 20) {
      conversation.messages = conversation.messages.slice(-20);
    }

    conversation.lastActivity = new Date();
  }

  /**
   * Réponse simulée pour développement/fallback
   */
  generateSimulatedResponse(message, context) {
    const {
      subject = 'général',
      studentName = 'Étudiant',
      educationLevel = 'COLLEGE'
    } = context;

    const responses = {
      greeting: {
        responses: [
          `Bonjour ${studentName} ! Je suis Claudyne, ton mentor IA. Comment puis-je t'aider dans tes études aujourd'hui ?`,
          `Salut ${studentName} ! Prêt(e) à apprendre quelque chose de nouveau avec moi ?`,
          `Hello ${studentName} ! Qu'est-ce qu'on va découvrir ensemble aujourd'hui ?`
        ],
        suggestions: ['Dis-moi tes matières préférées', 'Quel sujet t\'intéresse ?']
      },

      mathématiques: {
        responses: [
          `Les mathématiques sont partout autour de nous au Cameroun ! Que ce soit pour calculer le prix au marché ou comprendre les proportions en cuisine. Quel concept veux-tu explorer ?`,
          `Excellente question en maths, ${studentName} ! Décomposons ce problème étape par étape, comme on construit une case traditionnelle : fondation d'abord !`,
          `Les maths peuvent sembler complexes, mais chaque problème a sa solution. Au Cameroun, nos ancêtres utilisaient déjà des concepts mathématiques pour l'architecture et l'agriculture !`
        ],
        suggestions: ['Montre-moi un exemple', 'Explique-moi autrement']
      },

      français: {
        responses: [
          `Le français est une belle langue qui nous unit au Cameroun ! Que veux-tu améliorer : la grammaire, l'expression écrite ou orale ?`,
          `Formidable, ${studentName} ! Le français nous ouvre tant de portes. Travaillons ensemble sur cette belle langue de Molière.`,
          `En français, chaque mot a sa beauté. Comme le disent nos griots, les mots ont le pouvoir de transformer le monde !`
        ],
        suggestions: ['Aide-moi en grammaire', 'Corrige mon texte']
      },

      sciences: {
        responses: [
          `Les sciences nous aident à comprendre notre belle nature camerounaise ! De la biodiversité de nos forêts aux volcans comme le mont Cameroun. Qu'est-ce qui t'intrigue ?`,
          `Excellente curiosité scientifique, ${studentName} ! La science explique tant de merveilles autour de nous au Cameroun.`,
          `Comme nos chercheurs camerounais, soyons curieux ! Quelle découverte scientifique veux-tu explorer ?`
        ],
        suggestions: ['Explique-moi ce phénomène', 'Donne-moi un exemple local']
      },

      anglais: {
        responses: [
          `English is very important in Cameroon! Let's practice together. What would you like to learn today, ${studentName}?`,
          `Great! English will help you communicate with many people in Cameroon and around the world. What shall we start with?`,
          `Excellent! Dans notre Cameroun bilingue, l'anglais est essentiel. Let's make it fun and easy!`
        ],
        suggestions: ['Help me with vocabulary', 'Practice conversation']
      },

      encouragement: {
        responses: [
          `Tu fais de beaux progrès, ${studentName} ! Continue comme ça, chaque petit pas compte.`,
          `Bravo ! Tu as l'esprit curieux, c'est la clé de la réussite. "La force du savoir en héritage" comme dit notre devise !`,
          `Excellent travail ! Tes efforts d'aujourd'hui construisent ton succès de demain.`
        ],
        suggestions: ['Continue cet exercice', 'Essaie un nouveau défi']
      },

      difficultés: {
        responses: [
          `C'est normal de trouver cela difficile, ${studentName}. Même les grands savants ont commencé par des questions simples. Décomposons ensemble !`,
          `Pas de souci ! Chaque difficulté est une opportunité d'apprendre. Prenons le temps qu'il faut.`,
          `Tu sais quoi ? Les plus belles réussites viennent après les plus grandes difficultés. On va y arriver ensemble !`
        ],
        suggestions: ['Explique-moi plus simplement', 'Donne-moi un exemple facile']
      }
    };

    // Détecter le type de message
    const lowerMessage = message.toLowerCase();
    let category = 'encouragement';

    if (lowerMessage.includes('bonjour') || lowerMessage.includes('salut') || lowerMessage.includes('hello')) {
      category = 'greeting';
    } else if (lowerMessage.includes('math') || lowerMessage.includes('calcul') || lowerMessage.includes('nombre')) {
      category = 'mathématiques';
    } else if (lowerMessage.includes('français') || lowerMessage.includes('grammaire') || lowerMessage.includes('écrire')) {
      category = 'français';
    } else if (lowerMessage.includes('science') || lowerMessage.includes('physique') || lowerMessage.includes('chimie')) {
      category = 'sciences';
    } else if (lowerMessage.includes('english') || lowerMessage.includes('anglais')) {
      category = 'anglais';
    } else if (lowerMessage.includes('difficile') || lowerMessage.includes('problème') || lowerMessage.includes('aide')) {
      category = 'difficultés';
    }

    const selectedCategory = responses[category];
    const response = selectedCategory.responses[Math.floor(Math.random() * selectedCategory.responses.length)];
    const suggestions = selectedCategory.suggestions || ['Continue notre conversation', 'Pose-moi une autre question'];

    return {
      response: response,
      confidence: 0.8,
      suggestions: suggestions,
      metadata: {
        model: 'claude-simulation',
        tokensUsed: 0,
        processingTime: Date.now(),
        mode: 'simulation'
      }
    };
  }

  /**
   * Analyser le niveau de compréhension de l'étudiant
   */
  async analyzeStudentUnderstanding(studentId, responses) {
    try {
      if (!this.isConfigured || responses.length < 3) {
        return this.getBasicUnderstandingAnalysis(responses);
      }

      const analysisPrompt = `Analyse les réponses suivantes d'un étudiant camerounais pour évaluer son niveau de compréhension:

${responses.map((r, i) => `${i + 1}. Question: ${r.question}\nRéponse: ${r.answer}\n`).join('\n')}

Fournis une analyse JSON avec:
- comprehensionLevel (1-5)
- strengths (points forts)
- weaknesses (difficultés)
- recommendations (conseils personnalisés)
- nextTopics (sujets à aborder)

Réponds uniquement en JSON valide.`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: analysisPrompt }],
        max_tokens: 400,
        temperature: 0.3
      });

      return JSON.parse(completion.choices[0].message.content);

    } catch (error) {
      logger.error('Erreur analyse compréhension:', error);
      return this.getBasicUnderstandingAnalysis(responses);
    }
  }

  /**
   * Analyse basique de compréhension (fallback)
   */
  getBasicUnderstandingAnalysis(responses) {
    const correct = responses.filter(r => r.correct).length;
    const total = responses.length;
    const percentage = total > 0 ? (correct / total) * 100 : 0;

    let level = 1;
    if (percentage >= 80) level = 5;
    else if (percentage >= 60) level = 4;
    else if (percentage >= 40) level = 3;
    else if (percentage >= 20) level = 2;

    return {
      comprehensionLevel: level,
      strengths: percentage > 50 ? ['Bonne participation', 'Efforts constants'] : ['Persévérance'],
      weaknesses: percentage < 50 ? ['Besoin de plus de pratique', 'Concepts à revoir'] : [],
      recommendations: [
        'Continue tes efforts',
        'Pose des questions quand tu ne comprends pas',
        'Pratique régulièrement'
      ],
      nextTopics: ['Révision des bases', 'Exercices pratiques']
    };
  }

  /**
   * Générer un plan d'apprentissage personnalisé
   */
  async generateLearningPlan(studentProfile) {
    const {
      name,
      level,
      subjects,
      strengths = [],
      weaknesses = [],
      goals = []
    } = studentProfile;

    // Plan personnalisé selon le profil
    const plan = {
      studentName: name,
      educationLevel: level,
      duration: '4 semaines',
      objectives: this.generateObjectives(level, subjects, goals),
      weeklyPlan: this.generateWeeklyPlan(subjects, strengths, weaknesses),
      assessments: this.generateAssessments(subjects),
      resources: this.getCameroonianResources(level, subjects)
    };

    return plan;
  }

  generateObjectives(level, subjects, goals) {
    const baseObjectives = {
      'PRIMAIRE': ['Maîtriser les bases', 'Développer la curiosité', 'Prendre confiance'],
      'COLLEGE': ['Approfondir les concepts', 'Développer l\'autonomie', 'Préparer le BEPC'],
      'LYCEE': ['Maîtriser les matières', 'Préparer le Baccalauréat', 'Choisir son orientation']
    };

    return baseObjectives[level] || baseObjectives['COLLEGE'];
  }

  generateWeeklyPlan(subjects, strengths, weaknesses) {
    const weeks = [];

    for (let i = 1; i <= 4; i++) {
      weeks.push({
        week: i,
        theme: `Semaine ${i}: Progression ciblée`,
        activities: subjects.map(subject => ({
          subject: subject,
          focus: weaknesses.includes(subject) ? 'Renforcement' : 'Approfondissement',
          duration: '45 minutes',
          type: 'Exercices interactifs'
        }))
      });
    }

    return weeks;
  }

  generateAssessments(subjects) {
    return subjects.map(subject => ({
      subject: subject,
      type: 'Quiz interactif',
      frequency: 'Fin de semaine',
      criteria: ['Compréhension', 'Application', 'Analyse']
    }));
  }

  getCameroonianResources(level, subjects) {
    return {
      books: [
        'Collection EDICEF Cameroun',
        'Manuels officiels MINEDUB',
        'Livres Nathan Cameroun'
      ],
      digital: [
        'Plateforme Claudyne',
        'Khan Academy (français)',
        'Ressources UNESCO'
      ],
      local: [
        'Bibliothèques communautaires',
        'Centres culturels français',
        'Espaces numériques'
      ]
    };
  }

  /**
   * Nettoyer le cache périodiquement
   */
  cleanupCache() {
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 heures

    for (const [studentId, conversation] of this.conversationCache) {
      if (now - conversation.lastActivity > maxAge) {
        this.conversationCache.delete(studentId);
        logger.info(`Cleaned conversation cache for student ${studentId}`);
      }
    }
  }

  /**
   * Obtenir les statistiques d'utilisation
   */
  getUsageStats() {
    return {
      activeSessions: this.conversationCache.size,
      isConfigured: this.isConfigured,
      provider: this.isConfigured ? 'OpenAI' : 'Simulation',
      cacheSize: this.conversationCache.size
    };
  }
}

// Initialiser et exporter le service
const mentorAI = new MentorAI();

// Nettoyer le cache toutes les heures
setInterval(() => {
  mentorAI.cleanupCache();
}, 60 * 60 * 1000);

module.exports = mentorAI;