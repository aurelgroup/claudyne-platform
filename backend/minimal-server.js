/**
 * Serveur minimal Claudyne sans dépendances externes
 * La force du savoir en héritage
 */

const http = require('http');
const url = require('url');
const querystring = require('querystring');

const PORT = process.env.PORT || 3001;

// Fonction utilitaire pour les headers CORS
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*'); // Permet toutes les origines
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'false'); // Désactivé pour permettre *
}

// Fonction pour envoyer une réponse JSON
function sendJSON(res, statusCode, data) {
  setCorsHeaders(res);
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data, null, 2));
}

// Fonction pour parser le body JSON
function parseBody(req, callback) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  req.on('end', () => {
    try {
      const parsed = body ? JSON.parse(body) : {};
      callback(null, parsed);
    } catch (error) {
      callback(error, null);
    }
  });
}

// Serveur HTTP
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const { pathname, query } = parsedUrl;
  const method = req.method;

  // Gestion des requêtes OPTIONS (CORS preflight)
  if (method === 'OPTIONS') {
    setCorsHeaders(res);
    res.writeHead(200);
    res.end();
    return;
  }

  // Route racine
  if (pathname === '/' && method === 'GET') {
    sendJSON(res, 200, {
      message: 'Bienvenue sur l\'API Claudyne ! 🎓',
      subtitle: 'La force du savoir en héritage',
      status: 'running',
      version: '1.0.0',
      tribute: 'En mémoire de Meffo Mehtah Tchandjio Claudine',
      endpoints: {
        health: '/health',
        api: '/api',
        frontend: 'http://localhost:3000'
      }
    });
    return;
  }

  // Health check
  if (pathname === '/health' && method === 'GET') {
    sendJSON(res, 200, {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'Claudyne API fonctionne correctement ! 💚',
      services: {
        api: 'operational',
        database: 'mock',
        cache: 'mock'
      }
    });
    return;
  }

  // API Health check
  if (pathname === '/api/health' && method === 'GET') {
    sendJSON(res, 200, {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'Claudyne API fonctionne correctement ! 💚',
      services: {
        api: 'operational',
        database: 'mock',
        cache: 'mock'
      }
    });
    return;
  }

  // API base
  if (pathname === '/api' && method === 'GET') {
    sendJSON(res, 200, {
      message: 'API Claudyne - Version Test',
      routes: {
        auth: '/api/auth',
        me: '/api/me',
        families: '/api/families',
        students: '/api/students',
        subjects: '/api/subjects',
        lessons: '/api/subjects/{id}/lessons',
        quizzes: '/api/lessons/{id}/quiz',
        'prix-claudine': '/api/prix-claudine',
        battles: '/api/battles'
      },
      note: 'Serveur de test - Données mockées'
    });
    return;
  }

  // Login
  if (pathname === '/api/auth/login' && method === 'POST') {
    parseBody(req, (err, body) => {
      if (err) {
        sendJSON(res, 400, { success: false, message: 'Corps de requête invalide' });
        return;
      }

      const { credential, password, email } = body;

      // Support pour email, nom ou téléphone
      const loginCredential = credential || email;

      if (!loginCredential || !password) {
        sendJSON(res, 400, { success: false, message: 'Identifiants requis' });
        return;
      }

      // Base d'utilisateurs réels
      const users = {
        // Parents
        'parent@claudyne.com': {
          password: 'parent123',
          user: { id: 'p1', firstName: 'Marie', lastName: 'Nguema', email: 'parent@claudyne.com', phone: '+237694123456', role: 'PARENT', userType: 'MANAGER' },
          family: { id: 'f1', name: 'Famille Nguema', displayName: 'Famille Nguema', status: 'ACTIVE', subscriptionType: 'PREMIUM', walletBalance: 45000, totalClaudinePoints: 234 }
        },
        'marie.nguema': {
          password: 'parent123',
          user: { id: 'p1', firstName: 'Marie', lastName: 'Nguema', email: 'parent@claudyne.com', phone: '+237694123456', role: 'PARENT', userType: 'MANAGER' },
          family: { id: 'f1', name: 'Famille Nguema', displayName: 'Famille Nguema', status: 'ACTIVE', subscriptionType: 'PREMIUM', walletBalance: 45000, totalClaudinePoints: 234 }
        },
        '+237694123456': {
          password: 'parent123',
          user: { id: 'p1', firstName: 'Marie', lastName: 'Nguema', email: 'parent@claudyne.com', phone: '+237694123456', role: 'PARENT', userType: 'MANAGER' },
          family: { id: 'f1', name: 'Famille Nguema', displayName: 'Famille Nguema', status: 'ACTIVE', subscriptionType: 'PREMIUM', walletBalance: 45000, totalClaudinePoints: 234 }
        },
        // Étudiants
        'etudiant@claudyne.com': {
          password: 'etudiant123',
          user: { id: 's1', firstName: 'Jean', lastName: 'Nguema', email: 'etudiant@claudyne.com', phone: '+237695123456', role: 'STUDENT', userType: 'STUDENT' },
          family: { id: 'f1', name: 'Famille Nguema', displayName: 'Famille Nguema', status: 'ACTIVE', subscriptionType: 'PREMIUM', walletBalance: 45000, totalClaudinePoints: 234 }
        },
        // Professeurs
        'prof@claudyne.com': {
          password: 'prof123',
          user: { id: 't1', firstName: 'Paul', lastName: 'Mbarga', email: 'prof@claudyne.com', phone: '+237696123456', role: 'TEACHER', userType: 'TEACHER' },
          family: null
        }
      };

      const userAccount = users[loginCredential.toLowerCase()];

      if (userAccount && userAccount.password === password) {
        sendJSON(res, 200, {
          success: true,
          message: `Connexion réussie ! Bienvenue ${userAccount.user.firstName} 🎉`,
          data: {
            user: userAccount.user,
            family: userAccount.family || {
              status: 'TRIAL',
              subscriptionType: 'TRIAL',
              walletBalance: 12500,
              totalClaudinePoints: 87
            },
            tokens: {
              accessToken: 'test-token-' + Date.now(),
              refreshToken: 'refresh-token-' + Date.now(),
              expiresIn: '7d'
            }
          }
        });
      } else {
        sendJSON(res, 400, {
          success: false,
          message: 'Identifiants requis'
        });
      }
    });
    return;
  }

  // Register
  if (pathname === '/api/auth/register' && method === 'POST') {
    parseBody(req, (err, body) => {
      if (err) {
        sendJSON(res, 400, { success: false, message: 'Corps de requête invalide' });
        return;
      }

      const { firstName, lastName, familyName, email, phone, password } = body;

      if (firstName && lastName && familyName && (email || phone) && password) {
        sendJSON(res, 201, {
          success: true,
          message: `Bienvenue dans Claudyne, ${firstName} ! 🎉`,
          data: {
            user: {
              id: '2',
              firstName,
              lastName,
              email,
              phone,
              role: 'PARENT',
              userType: 'MANAGER'
            },
            family: {
              id: '2',
              name: familyName,
              displayName: `Famille ${familyName}`,
              status: 'TRIAL',
              subscriptionType: 'TRIAL',
              walletBalance: 0,
              totalClaudinePoints: 0
            },
            tokens: {
              accessToken: 'test-token-' + Date.now(),
              refreshToken: 'refresh-token-' + Date.now(),
              expiresIn: '7d'
            },
            trial: {
              daysLeft: 7,
              features: ['basic_subjects', 'mentor_chat', 'progress_tracking']
            }
          }
        });
      } else {
        sendJSON(res, 400, {
          success: false,
          message: 'Données d\'inscription incomplètes'
        });
      }
    });
    return;
  }

  // Me
  if (pathname === '/api/me' && method === 'GET') {
    sendJSON(res, 200, {
      success: true,
      user: {
        id: '1',
        firstName: 'Test',
        lastName: 'Utilisateur',
        role: 'PARENT',
        userType: 'MANAGER'
      },
      family: {
        id: '1',
        name: 'Famille Test',
        status: 'TRIAL'
      }
    });
    return;
  }

  // Prix Claudine leaderboard
  if (pathname === '/api/prix-claudine/leaderboard' && method === 'GET') {
    sendJSON(res, 200, {
      success: true,
      data: {
        leaderboard: [
          {
            rank: 1,
            title: 'Excellence Individuelle',
            points: 100,
            recipient: { name: 'Amina Mbarga', avatar: '👩🏾' },
            region: 'Centre',
            city: 'Yaoundé'
          },
          {
            rank: 2,
            title: 'Leadership Étudiant',
            points: 95,
            recipient: { name: 'Kevin Foumane', avatar: '👨🏾' },
            region: 'Littoral',
            city: 'Douala'
          },
          {
            rank: 3,
            title: 'Progression Exceptionnelle',
            points: 87,
            recipient: { name: 'Karine Nkoulou', avatar: '👩🏾' },
            region: 'Littoral',
            city: 'Douala'
          }
        ],
        season: '2025-september',
        stats: {
          totalWinners: 156,
          totalPoints: 12450
        }
      }
    });
    return;
  }

  // Subjects/Matières
  if (pathname === '/api/subjects' && method === 'GET') {
    sendJSON(res, 200, {
      success: true,
      data: {
        subjects: [
          {
            id: 'math-6eme',
            title: 'Mathématiques 6ème',
            description: 'Mathématiques niveau sixième - Opérations, géométrie de base',
            level: '6ème',
            category: 'Mathématiques',
            icon: '🔢',
            color: '#3B82F6',
            lessons: 12,
            quizzes: 8,
            progress: 0,
            difficulty: 'Débutant'
          },
          {
            id: 'francais-6eme',
            title: 'Français 6ème',
            description: 'Français niveau sixième - Grammaire, conjugaison, littérature',
            level: '6ème',
            category: 'Français',
            icon: '📚',
            color: '#10B981',
            lessons: 15,
            quizzes: 10,
            progress: 0,
            difficulty: 'Débutant'
          },
          {
            id: 'sciences-6eme',
            title: 'Sciences 6ème',
            description: 'Sciences de la vie et de la terre niveau sixième',
            level: '6ème',
            category: 'Sciences',
            icon: '🔬',
            color: '#8B5CF6',
            lessons: 10,
            quizzes: 6,
            progress: 0,
            difficulty: 'Débutant'
          },
          {
            id: 'histoire-geo-6eme',
            title: 'Histoire-Géographie 6ème',
            description: 'Histoire et géographie du Cameroun et du monde',
            level: '6ème',
            category: 'Histoire-Géographie',
            icon: '🌍',
            color: '#F59E0B',
            lessons: 14,
            quizzes: 9,
            progress: 0,
            difficulty: 'Débutant'
          },
          {
            id: 'anglais-6eme',
            title: 'Anglais 6ème',
            description: 'Anglais niveau débutant - Vocabulaire et grammaire de base',
            level: '6ème',
            category: 'Langues',
            icon: '🇬🇧',
            color: '#EF4444',
            lessons: 11,
            quizzes: 7,
            progress: 0,
            difficulty: 'Débutant'
          }
        ]
      }
    });
    return;
  }

  // Lessons for a subject
  if (pathname.startsWith('/api/subjects/') && pathname.includes('/lessons') && method === 'GET') {
    const subjectId = pathname.split('/')[3];
    sendJSON(res, 200, {
      success: true,
      data: {
        lessons: [
          {
            id: 1,
            title: 'Introduction aux nombres',
            description: 'Découverte des nombres entiers et décimaux',
            duration: 25,
            type: 'video',
            content: {
              videoUrl: '/videos/math-intro-nombres.mp4',
              transcript: 'Les nombres sont la base des mathématiques...',
              keyPoints: [
                'Les nombres entiers',
                'Les nombres décimaux',
                'Comparaison de nombres'
              ]
            },
            completed: false,
            score: null
          },
          {
            id: 2,
            title: 'Les quatre opérations',
            description: 'Addition, soustraction, multiplication et division',
            duration: 30,
            type: 'interactive',
            content: {
              exercises: [
                {
                  question: 'Calculez: 25 + 37',
                  options: ['52', '62', '72', '82'],
                  correct: 1,
                  explanation: '25 + 37 = 62'
                }
              ]
            },
            completed: false,
            score: null
          }
        ]
      }
    });
    return;
  }

  // Quiz for a lesson
  if (pathname.startsWith('/api/lessons/') && pathname.includes('/quiz') && method === 'GET') {
    const lessonId = pathname.split('/')[3];
    sendJSON(res, 200, {
      success: true,
      data: {
        quiz: {
          id: 1,
          lessonId: parseInt(lessonId),
          title: 'Quiz: Introduction aux nombres',
          questions: [
            {
              id: 1,
              type: 'multiple_choice',
              question: 'Quel est le plus grand nombre ?',
              options: ['125', '215', '152', '251'],
              correct: 3,
              points: 10,
              explanation: '251 est le plus grand car 2 > 1 en position des centaines'
            },
            {
              id: 2,
              type: 'multiple_choice',
              question: 'Combien vaut 15 + 28 ?',
              options: ['43', '33', '53', '23'],
              correct: 0,
              points: 10,
              explanation: '15 + 28 = 43'
            },
            {
              id: 3,
              type: 'true_false',
              question: '0.5 est plus grand que 0.25',
              correct: true,
              points: 10,
              explanation: '0.5 (cinq dixièmes) > 0.25 (vingt-cinq centièmes)'
            }
          ],
          totalPoints: 30,
          passingScore: 18
        }
      }
    });
    return;
  }

  // Submit quiz answers
  if (pathname.startsWith('/api/lessons/') && pathname.includes('/quiz') && method === 'POST') {
    parseBody(req, (err, body) => {
      if (err) {
        sendJSON(res, 400, { success: false, message: 'Corps de requête invalide' });
        return;
      }

      const { answers } = body;
      let score = 0;
      let totalQuestions = 3;
      
      // Simulation de correction
      if (answers['1'] === 3) score += 10; // Question 1
      if (answers['2'] === 0) score += 10; // Question 2  
      if (answers['3'] === true) score += 10; // Question 3

      const passed = score >= 18;
      const claudinePoints = passed ? Math.floor(score * 0.5) : 0;

      sendJSON(res, 200, {
        success: true,
        data: {
          score: score,
          totalScore: 30,
          percentage: Math.round((score / 30) * 100),
          passed: passed,
          claudinePointsEarned: claudinePoints,
          feedback: passed 
            ? 'Félicitations ! Vous maîtrisez bien cette leçon ! 🎉'
            : 'Continuez vos efforts, vous progressez ! 💪',
          corrections: [
            { questionId: 1, correct: answers['1'] === 3, explanation: '251 est le plus grand nombre' },
            { questionId: 2, correct: answers['2'] === 0, explanation: '15 + 28 = 43' },
            { questionId: 3, correct: answers['3'] === true, explanation: '0.5 > 0.25' }
          ]
        }
      });
    });
    return;
  }

  // Student progress
  if (pathname === '/api/progress' && method === 'GET') {
    sendJSON(res, 200, {
      success: true,
      data: {
        global: {
          totalLessonsCompleted: 12,
          totalLessons: 45,
          totalQuizzesCompleted: 8,
          totalQuizzes: 25,
          averageScore: 78,
          claudinePointsTotal: 156,
          studyTimeMinutes: 2340,
          currentStreak: 5
        },
        subjects: [
          {
            subjectId: 'math-6eme',
            lessonsCompleted: 4,
            totalLessons: 12,
            quizzesCompleted: 3,
            totalQuizzes: 8,
            averageScore: 82,
            progressPercentage: 33,
            lastActivity: '2025-09-09T06:30:00Z'
          },
          {
            subjectId: 'francais-6eme',
            lessonsCompleted: 5,
            totalLessons: 15,
            quizzesCompleted: 3,
            totalQuizzes: 10,
            averageScore: 75,
            progressPercentage: 33,
            lastActivity: '2025-09-08T14:20:00Z'
          },
          {
            subjectId: 'sciences-6eme',
            lessonsCompleted: 2,
            totalLessons: 10,
            quizzesCompleted: 1,
            totalQuizzes: 6,
            averageScore: 90,
            progressPercentage: 20,
            lastActivity: '2025-09-07T16:45:00Z'
          }
        ],
        recentActivities: [
          {
            type: 'quiz_completed',
            subjectId: 'math-6eme',
            title: 'Quiz: Introduction aux nombres',
            score: 85,
            claudinePoints: 12,
            timestamp: '2025-09-09T06:30:00Z'
          },
          {
            type: 'lesson_completed',
            subjectId: 'francais-6eme',
            title: 'Les types de phrases',
            claudinePoints: 8,
            timestamp: '2025-09-08T14:20:00Z'
          },
          {
            type: 'achievement_unlocked',
            title: 'Première semaine complète',
            description: '7 jours consécutifs d\'activité',
            claudinePoints: 25,
            timestamp: '2025-09-07T20:00:00Z'
          }
        ],
        weeklyStats: [
          { day: 'Lun', lessonsCompleted: 2, studyTime: 45 },
          { day: 'Mar', lessonsCompleted: 1, studyTime: 30 },
          { day: 'Mer', lessonsCompleted: 3, studyTime: 60 },
          { day: 'Jeu', lessonsCompleted: 2, studyTime: 40 },
          { day: 'Ven', lessonsCompleted: 1, studyTime: 25 },
          { day: 'Sam', lessonsCompleted: 2, studyTime: 50 },
          { day: 'Dim', lessonsCompleted: 1, studyTime: 35 }
        ]
      }
    });
    return;
  }

  // Update lesson progress
  if (pathname.startsWith('/api/lessons/') && pathname.endsWith('/complete') && method === 'POST') {
    parseBody(req, (err, body) => {
      if (err) {
        sendJSON(res, 400, { success: false, message: 'Corps de requête invalide' });
        return;
      }

      const lessonId = pathname.split('/')[3];
      const { studyTime, notes } = body;

      // Simulation de mise à jour
      sendJSON(res, 200, {
        success: true,
        data: {
          lessonCompleted: true,
          claudinePointsEarned: 8,
          totalClaudinePoints: 164,
          progressUpdated: true,
          nextLesson: {
            id: parseInt(lessonId) + 1,
            title: 'Leçon suivante disponible'
          }
        }
      });
    });
    return;
  }

  // Achievements/Récompenses
  if (pathname === '/api/achievements' && method === 'GET') {
    sendJSON(res, 200, {
      success: true,
      data: {
        available: [
          {
            id: 'first_week',
            title: 'Première semaine',
            description: '7 jours consécutifs d\'activité',
            icon: '🔥',
            progress: 5,
            target: 7,
            claudinePoints: 25,
            unlocked: false
          },
          {
            id: 'math_master',
            title: 'Maître des maths',
            description: 'Terminer toutes les leçons de mathématiques',
            icon: '🔢',
            progress: 4,
            target: 12,
            claudinePoints: 50,
            unlocked: false
          },
          {
            id: 'quiz_champion',
            title: 'Champion des quiz',
            description: 'Obtenir 90% ou plus à 5 quiz',
            icon: '🏆',
            progress: 1,
            target: 5,
            claudinePoints: 35,
            unlocked: false
          }
        ],
        unlocked: [
          {
            id: 'first_login',
            title: 'Bienvenue !',
            description: 'Première connexion à Claudyne',
            icon: '🎉',
            claudinePoints: 10,
            unlockedAt: '2025-09-01T10:00:00Z'
          },
          {
            id: 'first_quiz',
            title: 'Premier quiz',
            description: 'Compléter votre premier quiz',
            icon: '📝',
            claudinePoints: 15,
            unlockedAt: '2025-09-03T14:30:00Z'
          }
        ]
      }
    });
    return;
  }

  // Payment methods
  if (pathname === '/api/payments/methods' && method === 'GET') {
    sendJSON(res, 200, {
      success: true,
      data: {
        methods: [
          {
            id: 'mtn_momo',
            name: 'MTN Mobile Money',
            icon: '📱',
            color: '#FFCC02',
            description: 'Paiement via MTN MoMo',
            fees: '1%',
            minAmount: 100,
            maxAmount: 1000000,
            available: true
          },
          {
            id: 'orange_money',
            name: 'Orange Money',
            icon: '🧡',
            color: '#FF6600',
            description: 'Paiement via Orange Money',
            fees: '1.5%',
            minAmount: 100,
            maxAmount: 500000,
            available: true
          },
          {
            id: 'bank_transfer',
            name: 'Virement bancaire',
            icon: '🏦',
            color: '#2563EB',
            description: 'Virement bancaire direct',
            fees: '0%',
            minAmount: 1000,
            maxAmount: 10000000,
            available: true
          }
        ],
        wallet: {
          balance: 12500,
          currency: 'XAF',
          lastUpdate: new Date().toISOString()
        }
      }
    });
    return;
  }

  // Subscription plans
  if (pathname === '/api/subscriptions/plans' && method === 'GET') {
    sendJSON(res, 200, {
      success: true,
      data: {
        plans: [
          {
            id: 'basic_monthly',
            name: 'Basique Mensuel',
            description: 'Accès aux matières de base, quiz et suivi de progression',
            price: 2500,
            currency: 'XAF',
            duration: 'monthly',
            features: [
              '5 matières de base',
              'Quiz illimités',
              'Suivi de progression',
              'Support par chat'
            ],
            popular: false
          },
          {
            id: 'premium_monthly',
            name: 'Premium Mensuel',
            description: 'Accès complet avec fonctionnalités avancées',
            price: 4500,
            currency: 'XAF',
            duration: 'monthly',
            features: [
              'Toutes les matières',
              'Quiz illimités',
              'Suivi avancé',
              'Support prioritaire',
              'Certificats',
              'Accès hors ligne'
            ],
            popular: true
          },
          {
            id: 'family_yearly',
            name: 'Famille Annuel',
            description: 'Plan familial pour plusieurs enfants',
            price: 45000,
            currency: 'XAF',
            duration: 'yearly',
            originalPrice: 54000,
            features: [
              'Jusqu\'à 5 enfants',
              'Toutes les matières',
              'Rapports familiaux',
              'Support prioritaire',
              'Réductions sur événements'
            ],
            popular: false
          }
        ]
      }
    });
    return;
  }

  // Initialize payment
  if (pathname === '/api/payments/initialize' && method === 'POST') {
    parseBody(req, (err, body) => {
      if (err) {
        sendJSON(res, 400, { success: false, message: 'Corps de requête invalide' });
        return;
      }

      const { amount, method, planId, phone } = body;

      // Validation basique
      if (!amount || !method || !planId) {
        sendJSON(res, 400, {
          success: false,
          message: 'Paramètres manquants: amount, method, planId requis'
        });
        return;
      }

      if ((method === 'mtn_momo' || method === 'orange_money') && !phone) {
        sendJSON(res, 400, {
          success: false,
          message: 'Numéro de téléphone requis pour les paiements mobile'
        });
        return;
      }

      // Simulation d'initialisation de paiement
      const transactionId = 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
      
      sendJSON(res, 200, {
        success: true,
        data: {
          transactionId: transactionId,
          status: 'pending',
          amount: amount,
          currency: 'XAF',
          method: method,
          planId: planId,
          phone: phone,
          message: method === 'mtn_momo' 
            ? `Code USSD envoyé au ${phone}. Tapez *126# pour finaliser le paiement.`
            : method === 'orange_money'
            ? `Code de confirmation envoyé au ${phone}. Suivez les instructions SMS.`
            : 'Instructions de virement bancaire envoyées par email.',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
          nextStep: method === 'bank_transfer' 
            ? 'check_transfer'
            : 'confirm_mobile_payment'
        }
      });
    });
    return;
  }

  // Check payment status
  if (pathname.startsWith('/api/payments/') && pathname.includes('/status') && method === 'GET') {
    const transactionId = pathname.split('/')[3];
    
    // Simulation de vérification de statut
    const randomStatus = Math.random();
    let status, message;
    
    if (randomStatus > 0.7) {
      status = 'completed';
      message = 'Paiement confirmé avec succès ! Votre abonnement est maintenant actif.';
    } else if (randomStatus > 0.3) {
      status = 'pending';
      message = 'Paiement en cours de traitement...';
    } else {
      status = 'failed';
      message = 'Paiement échoué. Veuillez réessayer.';
    }

    sendJSON(res, 200, {
      success: true,
      data: {
        transactionId: transactionId,
        status: status,
        message: message,
        completedAt: status === 'completed' ? new Date().toISOString() : null,
        subscription: status === 'completed' ? {
          planId: 'premium_monthly',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 jours
          status: 'active'
        } : null
      }
    });
    return;
  }

  // Top-up wallet
  if (pathname === '/api/wallet/topup' && method === 'POST') {
    parseBody(req, (err, body) => {
      if (err) {
        sendJSON(res, 400, { success: false, message: 'Corps de requête invalide' });
        return;
      }

      const { amount, method, phone } = body;

      if (!amount || !method || amount < 500) {
        sendJSON(res, 400, {
          success: false,
          message: 'Montant minimum 500 FCFA requis'
        });
        return;
      }

      const transactionId = 'topup_' + Date.now();
      
      sendJSON(res, 200, {
        success: true,
        data: {
          transactionId: transactionId,
          status: 'pending',
          amount: amount,
          newBalance: 12500 + parseInt(amount), // Simulation
          message: `Recharge de ${amount} FCFA en cours...`,
          estimatedCompletion: new Date(Date.now() + 2 * 60 * 1000).toISOString()
        }
      });
    });
    return;
  }

  // Admin Dashboard Stats
  if (pathname === '/api/admin/dashboard' && method === 'GET') {
    sendJSON(res, 200, {
      success: true,
      data: {
        stats: {
          totalFamilies: 142,
          activeFamilies: 98,
          totalStudents: 267,
          activeStudents: 189,
          totalRevenue: 1250000,
          monthlyRevenue: 180000,
          coursesCompleted: 1456,
          quizzesTaken: 2103
        },
        recentActivity: [
          {
            type: 'new_registration',
            message: 'Nouvelle famille: Mbarga',
            timestamp: '2025-09-09T07:30:00Z'
          },
          {
            type: 'payment_received',
            message: 'Paiement reçu: 4500 FCFA (Premium)',
            timestamp: '2025-09-09T07:15:00Z'
          },
          {
            type: 'quiz_completed',
            message: 'Quiz terminé: Mathématiques 6ème',
            timestamp: '2025-09-09T07:00:00Z'
          }
        ],
        topPerformingSubjects: [
          { name: 'Mathématiques', completionRate: 78, students: 156 },
          { name: 'Français', completionRate: 72, students: 142 },
          { name: 'Sciences', completionRate: 65, students: 123 }
        ]
      }
    });
    return;
  }

  // Admin Users Management
  if (pathname === '/api/admin/users' && method === 'GET') {
    sendJSON(res, 200, {
      success: true,
      data: {
        users: [
          {
            id: '1',
            firstName: 'Jean',
            lastName: 'Mbarga',
            email: 'jean.mbarga@email.com',
            phone: '+237690123456',
            familyName: 'Famille Mbarga',
            status: 'active',
            subscriptionType: 'premium',
            registrationDate: '2025-08-15T10:00:00Z',
            lastActivity: '2025-09-09T06:30:00Z',
            totalClaudinePoints: 156,
            children: 2
          },
          {
            id: '2',
            firstName: 'Marie',
            lastName: 'Nkomo',
            email: 'marie.nkomo@email.com',
            phone: '+237675987654',
            familyName: 'Famille Nkomo',
            status: 'active',
            subscriptionType: 'basic',
            registrationDate: '2025-08-20T14:30:00Z',
            lastActivity: '2025-09-08T18:15:00Z',
            totalClaudinePoints: 89,
            children: 1
          },
          {
            id: '3',
            firstName: 'Paul',
            lastName: 'Fouda',
            email: 'paul.fouda@email.com',
            phone: '+237698765432',
            familyName: 'Famille Fouda',
            status: 'trial',
            subscriptionType: 'trial',
            registrationDate: '2025-09-05T09:15:00Z',
            lastActivity: '2025-09-09T05:45:00Z',
            totalClaudinePoints: 23,
            children: 3
          }
        ],
        pagination: {
          total: 142,
          page: 1,
          limit: 20,
          totalPages: 8
        }
      }
    });
    return;
  }

  // Admin Content Management
  if (pathname === '/api/admin/content' && method === 'GET') {
    sendJSON(res, 200, {
      success: true,
      data: {
        subjects: [
          {
            id: 'math-6eme',
            title: 'Mathématiques 6ème',
            lessons: 12,
            quizzes: 8,
            students: 156,
            averageScore: 74,
            status: 'active'
          },
          {
            id: 'francais-6eme',
            title: 'Français 6ème',
            lessons: 15,
            quizzes: 10,
            students: 142,
            averageScore: 68,
            status: 'active'
          }
        ],
        pendingContent: [
          {
            id: 'history-6eme-lesson-5',
            type: 'lesson',
            title: 'Histoire: Les royaumes du Cameroun',
            status: 'pending_review',
            submittedBy: 'Prof. Atangana',
            submissionDate: '2025-09-08T15:00:00Z'
          }
        ]
      }
    });
    return;
  }

  // Admin Payments Management
  if (pathname === '/api/admin/payments' && method === 'GET') {
    sendJSON(res, 200, {
      success: true,
      data: {
        transactions: [
          {
            id: 'tx_1234567890',
            familyName: 'Famille Mbarga',
            amount: 4500,
            currency: 'XAF',
            method: 'mtn_momo',
            status: 'completed',
            planName: 'Premium Mensuel',
            transactionDate: '2025-09-09T07:15:00Z'
          },
          {
            id: 'tx_1234567891',
            familyName: 'Famille Nkomo',
            amount: 2500,
            currency: 'XAF',
            method: 'orange_money',
            status: 'completed',
            planName: 'Basique Mensuel',
            transactionDate: '2025-09-08T16:30:00Z'
          },
          {
            id: 'tx_1234567892',
            familyName: 'Famille Tchoua',
            amount: 4500,
            currency: 'XAF',
            method: 'bank_transfer',
            status: 'pending',
            planName: 'Premium Mensuel',
            transactionDate: '2025-09-09T05:00:00Z'
          }
        ],
        summary: {
          totalRevenue: 1250000,
          monthlyRevenue: 180000,
          pendingPayments: 12,
          completedPayments: 89,
          averageTransactionAmount: 3750
        }
      }
    });
    return;
  }

  // Admin Analytics
  if (pathname === '/api/admin/analytics' && method === 'GET') {
    sendJSON(res, 200, {
      success: true,
      data: {
        userGrowth: [
          { month: 'Janvier', users: 45 },
          { month: 'Février', users: 52 },
          { month: 'Mars', users: 63 },
          { month: 'Avril', users: 71 },
          { month: 'Mai', users: 89 },
          { month: 'Juin', users: 98 },
          { month: 'Juillet', users: 112 },
          { month: 'Août', users: 127 },
          { month: 'Septembre', users: 142 }
        ],
        revenueGrowth: [
          { month: 'Janvier', revenue: 95000 },
          { month: 'Février', revenue: 120000 },
          { month: 'Mars', revenue: 145000 },
          { month: 'Avril', revenue: 167000 },
          { month: 'Mai', revenue: 189000 },
          { month: 'Juin', revenue: 201000 },
          { month: 'Juillet', revenue: 223000 },
          { month: 'Août', revenue: 245000 },
          { month: 'Septembre', revenue: 180000 }
        ],
        regionalStats: [
          { region: 'Centre', families: 45, revenue: 456000 },
          { region: 'Littoral', families: 38, revenue: 398000 },
          { region: 'Ouest', families: 29, revenue: 287000 },
          { region: 'Nord-Ouest', families: 18, revenue: 109000 },
          { region: 'Sud-Ouest', families: 12, revenue: 89000 }
        ]
      }
    });
    return;
  }

  // Admin Settings
  if (pathname === '/api/admin/settings' && method === 'GET') {
    sendJSON(res, 200, {
      success: true,
      data: {
        platform: {
          siteName: 'Claudyne',
          tagline: 'La force du savoir en héritage',
          supportEmail: 'support@claudyne.com',
          supportPhone: '+237690000000'
        },
        pricing: {
          basicMonthly: 2500,
          premiumMonthly: 4500,
          familyYearly: 45000
        },
        features: {
          maxChildrenPerFamily: 5,
          trialDurationDays: 7,
          claudinePointsEnabled: true,
          achievementsEnabled: true
        },
        notifications: {
          emailNotificationsEnabled: true,
          smsNotificationsEnabled: true,
          pushNotificationsEnabled: false
        }
      }
    });
    return;
  }

  // Admin - Update trial period for family
  if (pathname.startsWith('/api/admin/users/') && pathname.includes('/trial') && method === 'PUT') {
    parseBody(req, (err, body) => {
      if (err) {
        sendJSON(res, 400, { success: false, message: 'Corps de requête invalide' });
        return;
      }

      const userId = pathname.split('/')[4];
      const { trialDays, reason } = body;

      sendJSON(res, 200, {
        success: true,
        data: {
          userId: userId,
          trialDaysUpdated: trialDays,
          newExpirationDate: new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString(),
          reason: reason,
          updatedBy: 'admin',
          updatedAt: new Date().toISOString()
        },
        message: `Période d'essai mise à jour: ${trialDays} jours`
      });
    });
    return;
  }

  // Admin - Free modules management
  if (pathname === '/api/admin/free-modules' && method === 'GET') {
    sendJSON(res, 200, {
      success: true,
      data: {
        freeModules: [
          {
            id: 'math-basics',
            title: 'Mathématiques - Les bases',
            description: 'Introduction aux nombres et opérations simples',
            subject: 'Mathématiques',
            level: '6ème',
            lessons: [
              {
                id: 'lesson-1',
                title: 'Compter jusqu\'à 100',
                duration: 15,
                type: 'interactive',
                free: true
              },
              {
                id: 'lesson-2', 
                title: 'Addition simple',
                duration: 20,
                type: 'video',
                free: true
              }
            ],
            quizzes: [
              {
                id: 'quiz-1',
                title: 'Quiz: Les nombres',
                questions: 5,
                free: true
              }
            ],
            isActive: true,
            createdAt: '2025-09-01T10:00:00Z'
          },
          {
            id: 'french-alphabet',
            title: 'Français - L\'alphabet',
            description: 'Apprentissage de l\'alphabet et lecture de base',
            subject: 'Français',
            level: '6ème',
            lessons: [
              {
                id: 'lesson-3',
                title: 'Les lettres de A à Z',
                duration: 25,
                type: 'interactive',
                free: true
              }
            ],
            quizzes: [
              {
                id: 'quiz-2',
                title: 'Quiz: L\'alphabet',
                questions: 8,
                free: true
              }
            ],
            isActive: true,
            createdAt: '2025-09-02T10:00:00Z'
          },
          {
            id: 'discovery-cameroon',
            title: 'Découverte du Cameroun',
            description: 'Géographie et culture camerounaise',
            subject: 'Histoire-Géographie',
            level: '6ème',
            lessons: [
              {
                id: 'lesson-4',
                title: 'Les 10 régions du Cameroun',
                duration: 30,
                type: 'video',
                free: true
              }
            ],
            quizzes: [],
            isActive: false,
            createdAt: '2025-09-03T10:00:00Z'
          }
        ],
        settings: {
          maxFreeLessonsPerSubject: 2,
          maxFreeQuizzesPerSubject: 1,
          freeContentDurationLimit: 30,
          allowFreeProgressTracking: true
        }
      }
    });
    return;
  }

  // Admin - Update free modules settings
  if (pathname === '/api/admin/free-modules/settings' && method === 'PUT') {
    parseBody(req, (err, body) => {
      if (err) {
        sendJSON(res, 400, { success: false, message: 'Corps de requête invalide' });
        return;
      }

      const { maxFreeLessons, maxFreeQuizzes, durationLimit, allowProgressTracking } = body;

      sendJSON(res, 200, {
        success: true,
        data: {
          settings: {
            maxFreeLessonsPerSubject: maxFreeLessons || 2,
            maxFreeQuizzesPerSubject: maxFreeQuizzes || 1,
            freeContentDurationLimit: durationLimit || 30,
            allowFreeProgressTracking: allowProgressTracking !== false
          },
          updatedAt: new Date().toISOString()
        },
        message: 'Paramètres des modules gratuits mis à jour'
      });
    });
    return;
  }

  // Admin - Toggle free module status
  if (pathname.startsWith('/api/admin/free-modules/') && pathname.includes('/toggle') && method === 'PUT') {
    const moduleId = pathname.split('/')[4];
    
    sendJSON(res, 200, {
      success: true,
      data: {
        moduleId: moduleId,
        newStatus: 'toggled',
        updatedAt: new Date().toISOString()
      },
      message: `Statut du module ${moduleId} mis à jour`
    });
    return;
  }

  // Public - Free modules for non-subscribers
  if (pathname === '/api/free-modules' && method === 'GET') {
    sendJSON(res, 200, {
      success: true,
      data: {
        freeModules: [
          {
            id: 'math-basics',
            title: 'Mathématiques - Les bases',
            description: 'Introduction gratuite aux mathématiques',
            subject: 'Mathématiques',
            icon: '🔢',
            color: '#3B82F6',
            lessons: 2,
            quizzes: 1,
            duration: 35,
            level: '6ème',
            free: true
          },
          {
            id: 'french-alphabet',
            title: 'Français - L\'alphabet',
            description: 'Découverte gratuite de l\'alphabet français',
            subject: 'Français',
            icon: '📚',
            color: '#10B981',
            lessons: 1,
            quizzes: 1,
            duration: 25,
            level: '6ème',
            free: true
          }
        ],
        message: 'Contenu gratuit disponible sans abonnement',
        upgradeMessage: 'Abonnez-vous pour accéder à tout le contenu et au suivi de progression'
      }
    });
    return;
  }

  // Admin - Communication: Get message history
  if (pathname === '/api/admin/messages/history' && method === 'GET') {
    const mockMessages = [
      {
        id: 'msg001',
        subject: 'Nouveautés Quiz Mathématiques',
        type: 'info',
        status: 'completed',
        sentDate: new Date(Date.now() - 86400000).toISOString(),
        recipientsCount: 125,
        openRate: 78
      },
      {
        id: 'msg002',
        subject: 'Promotion -20% pour les familles nombreuses',
        type: 'promotion',
        status: 'completed',
        sentDate: new Date(Date.now() - 172800000).toISOString(),
        recipientsCount: 89,
        openRate: 85
      },
      {
        id: 'msg003',
        subject: 'Maintenance programmée ce weekend',
        type: 'maintenance',
        status: 'scheduled',
        sentDate: new Date(Date.now() + 86400000).toISOString(),
        recipientsCount: 245,
        openRate: 0
      }
    ];

    sendJSON(res, 200, {
      success: true,
      data: { messages: mockMessages }
    });
    return;
  }

  // Admin - Communication: Send message
  if (pathname === '/api/admin/messages/send' && method === 'POST') {
    const { recipients, type, subject, content, scheduled } = body;
    
    // Simulate sending message
    const recipientCounts = {
      'all': 245,
      'active': 180,
      'trial': 45,
      'expired': 20,
      'custom': 32
    };

    sendJSON(res, 200, {
      success: true,
      data: {
        messageId: 'msg' + Math.random().toString(36).substr(2, 9),
        sentCount: recipientCounts[recipients] || 1,
        scheduled: scheduled,
        sentAt: scheduled ? null : new Date().toISOString()
      }
    });
    return;
  }

  // Admin - Reports: Get scheduled reports
  if (pathname === '/api/admin/scheduled-reports' && method === 'GET') {
    const mockReports = [
      {
        id: 'rpt001',
        type: 'Rapport utilisateurs',
        frequency: 'Hebdomadaire',
        format: 'pdf',
        status: 'active',
        lastRun: new Date(Date.now() - 86400000).toISOString(),
        nextRun: new Date(Date.now() + 518400000).toISOString()
      },
      {
        id: 'rpt002',
        type: 'Rapport revenus',
        frequency: 'Mensuel',
        format: 'excel',
        status: 'active',
        lastRun: new Date(Date.now() - 2592000000).toISOString(),
        nextRun: new Date(Date.now() + 604800000).toISOString()
      },
      {
        id: 'rpt003',
        type: 'Rapport engagement',
        frequency: 'Quotidien',
        format: 'csv',
        status: 'paused',
        lastRun: new Date(Date.now() - 172800000).toISOString(),
        nextRun: null
      }
    ];

    sendJSON(res, 200, {
      success: true,
      data: { reports: mockReports }
    });
    return;
  }

  // Admin - Reports: Generate report
  if (pathname === '/api/admin/reports/generate' && method === 'POST') {
    const { type, period, format } = body;
    
    // Simulate report generation
    const reportId = 'report_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const downloadUrl = `/downloads/reports/${reportId}.${format}`;

    sendJSON(res, 200, {
      success: true,
      data: {
        reportId,
        downloadUrl,
        generatedAt: new Date().toISOString(),
        type,
        period,
        format
      }
    });
    return;
  }

  // Admin - System: Get system health
  if (pathname === '/api/admin/system/health' && method === 'GET') {
    const uptime = Math.floor(Math.random() * 2592000); // Random uptime up to 30 days
    const cpu = Math.floor(Math.random() * 100);
    const memory = Math.floor(Math.random() * 2048) + 512;
    const errors = Math.floor(Math.random() * 10);

    let status = 'healthy';
    if (cpu > 80 || memory > 1800 || errors > 5) {
      status = 'warning';
    }
    if (cpu > 95 || memory > 2000 || errors > 8) {
      status = 'critical';
    }

    sendJSON(res, 200, {
      success: true,
      data: {
        status,
        uptime,
        cpu,
        memory,
        errors
      }
    });
    return;
  }

  // Admin - System: Get system logs
  if (pathname === '/api/admin/system/logs' && method === 'GET') {
    const now = new Date();
    const mockLogs = [
      {
        timestamp: new Date(now.getTime() - 300000).toISOString().substr(11, 8),
        level: 'INFO',
        message: 'User authentication successful for family ID 45'
      },
      {
        timestamp: new Date(now.getTime() - 600000).toISOString().substr(11, 8),
        level: 'INFO',
        message: 'Quiz completed: Mathématiques niveau CE1'
      },
      {
        timestamp: new Date(now.getTime() - 900000).toISOString().substr(11, 8),
        level: 'WARN',
        message: 'Payment gateway response time exceeded 3 seconds'
      },
      {
        timestamp: new Date(now.getTime() - 1200000).toISOString().substr(11, 8),
        level: 'ERROR',
        message: 'Failed to send email notification to user@example.com'
      },
      {
        timestamp: new Date(now.getTime() - 1500000).toISOString().substr(11, 8),
        level: 'INFO',
        message: 'Database backup completed successfully'
      }
    ];

    sendJSON(res, 200, {
      success: true,
      data: { logs: mockLogs }
    });
    return;
  }

  // Admin - System: Get backup status
  if (pathname === '/api/admin/system/backups' && method === 'GET') {
    const mockBackups = [
      {
        id: 'bkp001',
        type: 'Base de données',
        lastBackup: new Date(Date.now() - 86400000).toISOString(),
        nextBackup: new Date(Date.now() + 86400000).toISOString(),
        size: 52428800, // 50MB
        status: 'completed'
      },
      {
        id: 'bkp002',
        type: 'Fichiers utilisateur',
        lastBackup: new Date(Date.now() - 172800000).toISOString(),
        nextBackup: new Date(Date.now() + 518400000).toISOString(),
        size: 1073741824, // 1GB
        status: 'completed'
      },
      {
        id: 'bkp003',
        type: 'Configuration',
        lastBackup: new Date(Date.now() - 259200000).toISOString(),
        nextBackup: new Date(Date.now() + 86400000).toISOString(),
        size: 2097152, // 2MB
        status: 'pending'
      }
    ];

    sendJSON(res, 200, {
      success: true,
      data: { backups: mockBackups }
    });
    return;
  }

  // Admin - System: Trigger backup
  if (pathname === '/api/admin/system/backup' && method === 'POST') {
    sendJSON(res, 200, {
      success: true,
      data: {
        backupId: 'manual_' + Date.now(),
        startedAt: new Date().toISOString(),
        message: 'Sauvegarde manuelle initiée'
      }
    });
    return;
  }

  // Admin - Trial statistics
  if (pathname === '/api/admin/trial-stats' && method === 'GET') {
    sendJSON(res, 200, {
      success: true,
      data: {
        totalExtensions: 47,
        averageExtensionDays: 12,
        activeExtensions: 8
      }
    });
    return;
  }

  // Admin - Roles: Get all roles
  if (pathname === '/api/admin/roles' && method === 'GET') {
    const mockRoles = [
      {
        id: 'role001',
        name: 'Super Administrateur',
        description: 'Accès complet à toutes les fonctionnalités',
        level: 1,
        icon: '👑',
        status: 'active',
        userCount: 2,
        keyPermissions: ['Admin système', 'Finances', 'Utilisateurs'],
        createdAt: new Date(Date.now() - 86400000 * 30).toISOString()
      },
      {
        id: 'role002',
        name: 'Enseignant Senior',
        description: 'Création et validation du contenu pédagogique',
        level: 4,
        icon: '👨‍🏫',
        status: 'active',
        userCount: 8,
        keyPermissions: ['Contenu', 'Validation', 'Étudiants'],
        createdAt: new Date(Date.now() - 86400000 * 15).toISOString()
      },
      {
        id: 'role003',
        name: 'Modérateur',
        description: 'Surveillance et modération du contenu',
        level: 5,
        icon: '🛡️',
        status: 'active',
        userCount: 5,
        keyPermissions: ['Modération', 'Signalements', 'Contenu'],
        createdAt: new Date(Date.now() - 86400000 * 7).toISOString()
      },
      {
        id: 'role004',
        name: 'Validateur de contenu',
        description: 'Révision et approbation des cours',
        level: 6,
        icon: '✅',
        status: 'active',
        userCount: 3,
        keyPermissions: ['Validation', 'Contenu'],
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
      }
    ];

    sendJSON(res, 200, {
      success: true,
      data: {
        roles: mockRoles,
        counts: {
          admin: 2,
          teacher: 8,
          moderator: 5,
          validator: 3
        }
      }
    });
    return;
  }

  // Admin - Roles: Create new role
  if (pathname === '/api/admin/roles' && method === 'POST') {
    const { name, level, description, permissions } = body;
    
    sendJSON(res, 200, {
      success: true,
      data: {
        roleId: 'role_' + Date.now(),
        name,
        level,
        description,
        permissions,
        createdAt: new Date().toISOString()
      },
      message: `Rôle "${name}" créé avec succès`
    });
    return;
  }

  // Admin - Staff: Get all staff
  if (pathname === '/api/admin/staff' && method === 'GET') {
    const mockStaff = [
      {
        id: 'staff001',
        firstName: 'Marie',
        lastName: 'Ndongo',
        email: 'marie.ndongo@claudyne.com',
        phone: '+237 677 12 34 56',
        roleName: 'Enseignante Senior',
        roleIcon: '👩‍🏫',
        speciality: 'Mathématiques',
        region: 'Centre',
        performanceScore: 92,
        status: 'active',
        lastActivity: new Date(Date.now() - 3600000).toISOString(),
        hireDate: new Date(Date.now() - 86400000 * 365).toISOString()
      },
      {
        id: 'staff002',
        firstName: 'Jean',
        lastName: 'Mballa',
        email: 'jean.mballa@claudyne.com',
        phone: '+237 699 87 65 43',
        roleName: 'Modérateur',
        roleIcon: '🛡️',
        speciality: 'Support technique',
        region: 'Littoral',
        performanceScore: 88,
        status: 'active',
        lastActivity: new Date(Date.now() - 1800000).toISOString(),
        hireDate: new Date(Date.now() - 86400000 * 180).toISOString()
      },
      {
        id: 'staff003',
        firstName: 'Pascaline',
        lastName: 'Essomba',
        email: 'pascaline.essomba@claudyne.com',
        phone: '+237 655 23 45 67',
        roleName: 'Validatrice',
        roleIcon: '✅',
        speciality: 'Français',
        region: 'Ouest',
        performanceScore: 95,
        status: 'active',
        lastActivity: new Date(Date.now() - 7200000).toISOString(),
        hireDate: new Date(Date.now() - 86400000 * 90).toISOString()
      },
      {
        id: 'staff004',
        firstName: 'Paul',
        lastName: 'Fouda',
        email: 'paul.fouda@claudyne.com',
        phone: '+237 678 11 22 33',
        roleName: 'Enseignant',
        roleIcon: '👨‍🏫',
        speciality: 'Sciences',
        region: 'Nord-Ouest',
        performanceScore: 76,
        status: 'in_training',
        lastActivity: new Date(Date.now() - 14400000).toISOString(),
        hireDate: new Date(Date.now() - 86400000 * 30).toISOString()
      }
    ];

    const mockPerformance = [
      {
        department: 'Enseignants',
        memberCount: 12,
        avgScore: 87
      },
      {
        department: 'Modérateurs',
        memberCount: 5,
        avgScore: 91
      },
      {
        department: 'Validateurs',
        memberCount: 3,
        avgScore: 94
      },
      {
        department: 'Support',
        memberCount: 4,
        avgScore: 82
      }
    ];

    sendJSON(res, 200, {
      success: true,
      data: {
        staff: mockStaff,
        stats: {
          total: 24,
          activeToday: 18,
          inTraining: 3,
          pendingEvaluations: 7
        },
        performance: mockPerformance
      }
    });
    return;
  }

  // Admin - Staff: Add new staff member
  if (pathname === '/api/admin/staff' && method === 'POST') {
    const { firstName, lastName, email, phone, role, region, speciality, hireDate, bio, sendWelcomeEmail } = body;
    
    sendJSON(res, 200, {
      success: true,
      data: {
        staffId: 'staff_' + Date.now(),
        firstName,
        lastName,
        email,
        role,
        region,
        speciality,
        welcomeEmailSent: sendWelcomeEmail,
        createdAt: new Date().toISOString()
      },
      message: `${firstName} ${lastName} ajouté(e) avec succès à l'équipe`
    });
    return;
  }

  // Admin - Create account
  if (pathname === '/api/admin/accounts/create' && method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const { subscriberId, accountType, formData } = JSON.parse(body);

        // Validation des données
        if (!subscriberId || !accountType || !formData) {
          sendJSON(res, 400, {
            success: false,
            message: 'Données de création de compte manquantes'
          });
          return;
        }

        // Validation des champs requis selon le type de compte
        const requiredFields = ['email', 'phone', 'subscription'];
        if (accountType === 'individual') {
          requiredFields.push('firstName', 'lastName');
        } else {
          requiredFields.push('familyName', 'parentFirstName', 'parentLastName', 'numChildren');
        }

        const missingFields = requiredFields.filter(field => !formData[field]);
        if (missingFields.length > 0) {
          sendJSON(res, 400, {
            success: false,
            message: `Champs manquants: ${missingFields.join(', ')}`
          });
          return;
        }

        // Validation email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          sendJSON(res, 400, {
            success: false,
            message: 'Format email invalide'
          });
          return;
        }

        // Simulation de la création du compte
        const account = {
          id: Date.now().toString(),
          subscriberId: subscriberId,
          accountType: accountType,
          status: formData.subscription === 'trial' ? 'trial' : 'active',
          subscription: formData.subscription,
          email: formData.email,
          phone: formData.phone,
          createdAt: new Date().toISOString(),
          createdBy: 'admin@claudyne.com'
        };

        if (accountType === 'individual') {
          account.firstName = formData.firstName;
          account.lastName = formData.lastName;
          account.dateOfBirth = formData.dateOfBirth;
          account.fullName = `${formData.firstName} ${formData.lastName}`;
        } else {
          account.familyName = formData.familyName;
          account.parentFirstName = formData.parentFirstName;
          account.parentLastName = formData.parentLastName;
          account.numChildren = parseInt(formData.numChildren);
          account.parentFullName = `${formData.parentFirstName} ${formData.parentLastName}`;
        }

        // Ici, vous pourriez sauvegarder dans une base de données
        console.log('Nouveau compte créé:', account);

        sendJSON(res, 201, {
          success: true,
          data: {
            account: account,
            message: `Compte ${subscriberId} créé avec succès`
          }
        });

      } catch (error) {
        console.error('Erreur lors de la création du compte:', error);
        sendJSON(res, 500, {
          success: false,
          message: 'Erreur interne du serveur'
        });
      }
    });
    return;
  }

  // Admin - Trial extensions history
  if (pathname === '/api/admin/trial-history' && method === 'GET') {
    sendJSON(res, 200, {
      success: true,
      data: {
        extensions: [
          {
            id: 'ext_001',
            familyName: 'Famille Mbarga',
            originalTrialDays: 7,
            extendedTrialDays: 14,
            reason: 'Première famille inscrite - bonus',
            extendedBy: 'admin@claudyne.com',
            extendedAt: '2025-09-08T10:00:00Z',
            status: 'active'
          },
          {
            id: 'ext_002',
            familyName: 'Famille Nkomo',
            originalTrialDays: 7,
            extendedTrialDays: 10,
            reason: 'Problème technique résolu',
            extendedBy: 'admin@claudyne.com',
            extendedAt: '2025-09-07T15:30:00Z',
            status: 'completed'
          },
          {
            id: 'ext_003',
            familyName: 'Famille Fouda',
            originalTrialDays: 7,
            extendedTrialDays: 21,
            reason: 'Famille nombreuse - 3 enfants',
            extendedBy: 'admin@claudyne.com',
            extendedAt: '2025-09-06T09:15:00Z',
            status: 'active'
          }
        ],
        statistics: {
          totalExtensions: 15,
          averageExtensionDays: 12,
          mostCommonReason: 'Support technique',
          activeExtensions: 8
        }
      }
    });
    return;
  }

  // Moderator endpoints
  // Get pending content for moderation
  if (pathname === '/api/moderator/pending-content' && method === 'GET') {
    sendJSON(res, 200, {
      success: true,
      data: {
        pendingContent: [
          {
            id: 'content_001',
            type: 'course',
            title: 'Les fractions simples',
            subject: 'Mathématiques',
            level: 'CE1',
            author: 'Prof. Atangana',
            submissionDate: '2025-09-09T08:00:00Z',
            status: 'pending',
            priority: 'high',
            description: 'Introduction aux fractions avec des exemples pratiques'
          },
          {
            id: 'content_002',
            type: 'quiz',
            title: 'Quiz: Conjugaison présent',
            subject: 'Français',
            level: 'CM1',
            author: 'Prof. Mballa',
            submissionDate: '2025-09-09T07:30:00Z',
            status: 'pending',
            priority: 'medium',
            description: 'Quiz sur la conjugaison au présent de l\'indicatif'
          },
          {
            id: 'content_003',
            type: 'resource',
            title: 'Cartes géographiques du Cameroun',
            subject: 'Géographie',
            level: '6ème',
            author: 'Prof. Essomba',
            submissionDate: '2025-09-08T16:45:00Z',
            status: 'pending',
            priority: 'low',
            description: 'Collection de cartes détaillées des 10 régions'
          }
        ],
        stats: {
          totalPending: 35,
          pendingCourses: 12,
          pendingQuizzes: 8,
          pendingResources: 15,
          avgWaitingTime: '2.5 jours'
        }
      }
    });
    return;
  }

  // Validate content
  if (pathname.startsWith('/api/moderator/validate-content/') && method === 'POST') {
    parseBody(req, (err, body) => {
      if (err) {
        sendJSON(res, 400, { success: false, message: 'Corps de requête invalide' });
        return;
      }

      const contentId = pathname.split('/')[4];
      const { action, moderatorId, comments } = body;

      sendJSON(res, 200, {
        success: true,
        data: {
          contentId: contentId,
          action: action,
          moderatorId: moderatorId,
          processedAt: new Date().toISOString(),
          comments: comments,
          notificationSent: true
        },
        message: action === 'approve' ? 'Contenu approuvé avec succès' :
                action === 'reject' ? 'Contenu rejeté' : 'Révision demandée'
      });
    });
    return;
  }

  // Bulk validation
  if (pathname === '/api/moderator/bulk-validate' && method === 'POST') {
    parseBody(req, (err, body) => {
      if (err) {
        sendJSON(res, 400, { success: false, message: 'Corps de requête invalide' });
        return;
      }

      const { moderatorId, action } = body;
      const validatedCount = Math.floor(Math.random() * 10) + 5; // Simulate 5-14 validations

      sendJSON(res, 200, {
        success: true,
        data: {
          validated: validatedCount,
          action: action,
          moderatorId: moderatorId,
          processedAt: new Date().toISOString()
        },
        message: `${validatedCount} contenus validés avec succès`
      });
    });
    return;
  }

  // Forum moderation - Approve post
  if (pathname.startsWith('/api/moderator/forum/approve/') && method === 'POST') {
    parseBody(req, (err, body) => {
      if (err) {
        sendJSON(res, 400, { success: false, message: 'Corps de requête invalide' });
        return;
      }

      const postId = pathname.split('/')[5];
      const { moderatorId } = body;

      sendJSON(res, 200, {
        success: true,
        data: {
          postId: postId,
          status: 'approved',
          moderatorId: moderatorId,
          approvedAt: new Date().toISOString()
        },
        message: 'Post approuvé avec succès'
      });
    });
    return;
  }

  // Forum moderation - Delete post
  if (pathname.startsWith('/api/moderator/forum/delete/') && method === 'DELETE') {
    parseBody(req, (err, body) => {
      if (err) {
        sendJSON(res, 400, { success: false, message: 'Corps de requête invalide' });
        return;
      }

      const postId = pathname.split('/')[5];
      const { moderatorId, reason } = body;

      sendJSON(res, 200, {
        success: true,
        data: {
          postId: postId,
          status: 'deleted',
          moderatorId: moderatorId,
          reason: reason,
          deletedAt: new Date().toISOString()
        },
        message: 'Post supprimé avec succès'
      });
    });
    return;
  }

  // User warning
  if (pathname.startsWith('/api/moderator/users/warn/') && method === 'POST') {
    parseBody(req, (err, body) => {
      if (err) {
        sendJSON(res, 400, { success: false, message: 'Corps de requête invalide' });
        return;
      }

      const userId = pathname.split('/')[5];
      const { moderatorId, reason, severity } = body;

      sendJSON(res, 200, {
        success: true,
        data: {
          warningId: 'warn_' + Date.now(),
          userId: userId,
          moderatorId: moderatorId,
          reason: reason,
          severity: severity,
          issuedAt: new Date().toISOString(),
          notificationSent: true
        },
        message: 'Avertissement envoyé avec succès'
      });
    });
    return;
  }

  // Quality check
  if (pathname === '/api/moderator/quality-check' && method === 'POST') {
    parseBody(req, (err, body) => {
      if (err) {
        sendJSON(res, 400, { success: false, message: 'Corps de requête invalide' });
        return;
      }

      const { moderatorId, checkType } = body;
      const score = Math.random() * 1.5 + 3.5; // Score between 3.5 and 5

      sendJSON(res, 200, {
        success: true,
        data: {
          checkId: 'qc_' + Date.now(),
          moderatorId: moderatorId,
          checkType: checkType,
          score: Math.round(score * 10) / 10,
          issues: Math.floor(Math.random() * 5),
          improvements: Math.floor(Math.random() * 3),
          completedAt: new Date().toISOString()
        },
        message: `Audit qualité terminé avec un score de ${Math.round(score * 10) / 10}/5`
      });
    });
    return;
  }

  // Generate quality report
  if (pathname === '/api/moderator/quality-report' && method === 'GET') {
    // Simulate PDF generation
    setCorsHeaders(res);
    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=rapport-qualite.pdf'
    });
    res.end('PDF content would be here');
    return;
  }

  // Generate moderation report
  if (pathname === '/api/moderator/moderation-report' && method === 'GET') {
    // Simulate PDF generation
    setCorsHeaders(res);
    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=rapport-moderation.pdf'
    });
    res.end('PDF content would be here');
    return;
  }

  // Export moderation data
  if (pathname === '/api/moderator/export-data' && method === 'GET') {
    const exportData = {
      exportDate: new Date().toISOString(),
      moderationStats: {
        totalValidations: 156,
        totalRejections: 23,
        totalRevisions: 45
      },
      qualityMetrics: {
        averageScore: 4.2,
        totalAudits: 28
      }
    };

    setCorsHeaders(res);
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename=donnees-moderation.json'
    });
    res.end(JSON.stringify(exportData, null, 2));
    return;
  }

  // Get moderator users
  if (pathname === '/api/moderator/users' && method === 'GET') {
    sendJSON(res, 200, {
      success: true,
      data: {
        users: [
          {
            id: '1',
            name: 'Jean Mbarga',
            email: 'jean.mbarga@email.com',
            status: 'active',
            role: 'parent',
            createdAt: '2025-08-15T10:00:00Z',
            lastLogin: '2025-09-09T06:30:00Z',
            warningsCount: 0,
            suspensionCount: 0
          },
          {
            id: '2',
            name: 'Marie Nkomo',
            email: 'marie.nkomo@email.com',
            status: 'active',
            role: 'parent',
            createdAt: '2025-08-20T14:30:00Z',
            lastLogin: '2025-09-08T18:15:00Z',
            warningsCount: 1,
            suspensionCount: 0
          },
          {
            id: '3',
            name: 'Paul Fouda',
            email: 'paul.fouda@email.com',
            status: 'suspended',
            role: 'parent',
            createdAt: '2025-09-05T09:15:00Z',
            lastLogin: '2025-09-06T12:00:00Z',
            warningsCount: 3,
            suspensionCount: 1
          }
        ],
        stats: {
          total: 142,
          active: 128,
          suspended: 8,
          banned: 6
        }
      }
    });
    return;
  }

  // Suspend user
  if (pathname.startsWith('/api/moderator/users/suspend/') && method === 'POST') {
    parseBody(req, (err, body) => {
      if (err) {
        sendJSON(res, 400, { success: false, message: 'Corps de requête invalide' });
        return;
      }

      const userId = pathname.split('/')[5];
      const { moderatorId, duration, reason } = body;

      sendJSON(res, 200, {
        success: true,
        data: {
          suspensionId: 'susp_' + Date.now(),
          userId: userId,
          moderatorId: moderatorId,
          duration: duration,
          reason: reason,
          suspendedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString(),
          notificationSent: true
        },
        message: `Utilisateur suspendu pour ${duration} jours`
      });
    });
    return;
  }

  // Ban user
  if (pathname.startsWith('/api/moderator/users/ban/') && method === 'POST') {
    parseBody(req, (err, body) => {
      if (err) {
        sendJSON(res, 400, { success: false, message: 'Corps de requête invalide' });
        return;
      }

      const userId = pathname.split('/')[5];
      const { moderatorId, reason } = body;

      sendJSON(res, 200, {
        success: true,
        data: {
          banId: 'ban_' + Date.now(),
          userId: userId,
          moderatorId: moderatorId,
          reason: reason,
          bannedAt: new Date().toISOString(),
          permanent: true,
          notificationSent: true
        },
        message: 'Utilisateur banni définitivement'
      });
    });
    return;
  }

  // Moderator stats
  if (pathname === '/api/moderator/stats' && method === 'GET') {
    sendJSON(res, 200, {
      success: true,
      data: {
        pendingCourses: 12,
        pendingQuizzes: 8,
        pendingResources: 15,
        dailyValidations: 45,
        weeklyValidations: 312,
        monthlyValidations: 1287,
        averageProcessingTime: '2.5 heures'
      }
    });
    return;
  }

  // Forum stats
  if (pathname === '/api/moderator/forum-stats' && method === 'GET') {
    sendJSON(res, 200, {
      success: true,
      data: {
        reportedPosts: 5,
        activeDiscussions: 42,
        moderatedToday: 12,
        pendingReports: 3,
        resolvedReports: 15
      }
    });
    return;
  }

  // User management stats
  if (pathname === '/api/moderator/user-stats' && method === 'GET') {
    sendJSON(res, 200, {
      success: true,
      data: {
        suspendedUsers: 3,
        warningsIssued: 12,
        bannedUsers: 2,
        activeInvestigations: 4,
        resolvedDisputes: 18
      }
    });
    return;
  }

  // API pour la gestion des cours
  if (pathname === '/api/admin/courses' && method === 'POST') {
    parseBody(req, (err, body) => {
      if (err) {
        sendJSON(res, 400, { success: false, message: 'Corps de requête invalide' });
        return;
      }

      const { title, subject, level, description, content, duration, created_by } = body;
      
      // Validation
      if (!title || !subject || !level || !content) {
        sendJSON(res, 400, {
          success: false,
          message: 'Les champs titre, matière, niveau et contenu sont obligatoires'
        });
        return;
      }

      // Simuler la création du cours
      const courseId = 'COURS-' + Date.now();
      console.log('Nouveau cours créé:', { courseId, title, subject, level });

      sendJSON(res, 200, {
        success: true,
        message: 'Cours créé avec succès',
        data: {
          id: courseId,
          title,
          subject,
          level,
          description,
          content,
          duration: duration || 45,
          created_by,
          created_at: new Date().toISOString()
        }
      });
    });
    return;
  }

  // API pour la gestion des quiz
  if (pathname === '/api/admin/quizzes' && method === 'POST') {
    parseBody(req, (err, body) => {
      if (err) {
        sendJSON(res, 400, { success: false, message: 'Corps de requête invalide' });
        return;
      }

      const { title, subject, level, description, duration, passing_score, questions, created_by } = body;
      
      // Validation
      if (!title || !subject || !level || !questions || questions.length === 0) {
        sendJSON(res, 400, {
          success: false,
          message: 'Les champs titre, matière, niveau et au moins une question sont obligatoires'
        });
        return;
      }

      // Valider les questions
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        if (!question.question || !question.options || !question.correct_answer) {
          sendJSON(res, 400, {
            success: false,
            message: `Question ${i + 1} incomplète`
          });
          return;
        }
      }

      // Simuler la création du quiz
      const quizId = 'QUIZ-' + Date.now();
      console.log('Nouveau quiz créé:', { quizId, title, subject, level, questionCount: questions.length });

      sendJSON(res, 200, {
        success: true,
        message: 'Quiz créé avec succès',
        data: {
          id: quizId,
          title,
          subject,
          level,
          description,
          duration: duration || 20,
          passing_score: passing_score || 60,
          questions,
          created_by,
          created_at: new Date().toISOString()
        }
      });
    });
    return;
  }

  // API pour la gestion des ressources
  if (pathname === '/api/admin/resources' && method === 'POST') {
    parseBody(req, (err, body) => {
      if (err) {
        sendJSON(res, 400, { success: false, message: 'Corps de requête invalide' });
        return;
      }

      const { title, type, subject, level, description, url, is_premium, created_by } = body;
      
      // Validation
      if (!title || !type || !subject || !level) {
        sendJSON(res, 400, {
          success: false,
          message: 'Les champs titre, type, matière et niveau sont obligatoires'
        });
        return;
      }

      // Simuler la création de la ressource
      const resourceId = 'RES-' + Date.now();
      console.log('Nouvelle ressource créée:', { resourceId, title, type, subject, level });

      sendJSON(res, 200, {
        success: true,
        message: 'Ressource ajoutée avec succès',
        data: {
          id: resourceId,
          title,
          type,
          subject,
          level,
          description,
          url,
          is_premium: !!is_premium,
          created_by,
          created_at: new Date().toISOString()
        }
      });
    });
    return;
  }

  // API manquants pour éviter les 404
  if (pathname === '/api/admin/roles' && method === 'GET') {
    sendJSON(res, 200, {
      success: true,
      data: {
        roles: [
          { id: 'admin', name: 'Administrateur', level: 1 },
          { id: 'teacher', name: 'Enseignant', level: 3 },
          { id: 'moderator', name: 'Modérateur', level: 2 }
        ]
      }
    });
    return;
  }

  if (pathname === '/api/admin/staff' && method === 'GET') {
    sendJSON(res, 200, {
      success: true,
      data: {
        staff: [
          { id: 1, name: 'Admin Principal', role: 'admin', email: 'admin@claudyne.com' }
        ]
      }
    });
    return;
  }

  if (pathname === '/api/admin/free-modules' && method === 'GET') {
    sendJSON(res, 200, {
      success: true,
      data: {
        freeModules: [
          { id: 1, title: 'Module gratuit 1', subject: 'Mathématiques', active: true }
        ]
      }
    });
    return;
  }

  if (pathname === '/api/admin/messages/history' && method === 'GET') {
    sendJSON(res, 200, {
      success: true,
      data: {
        messages: [
          { id: 1, subject: 'Bienvenue', status: 'sent', date: new Date().toISOString() }
        ]
      }
    });
    return;
  }

  if (pathname === '/api/admin/scheduled-reports' && method === 'GET') {
    sendJSON(res, 200, {
      success: true,
      data: {
        reports: [
          { id: 1, type: 'Usage', frequency: 'weekly', status: 'active' }
        ]
      }
    });
    return;
  }

  if (pathname === '/api/admin/system/health' && method === 'GET') {
    sendJSON(res, 200, {
      success: true,
      data: {
        status: 'healthy',
        uptime: 86400,
        cpu: 25,
        memory: 512
      }
    });
    return;
  }

  if (pathname === '/api/admin/system/logs' && method === 'GET') {
    sendJSON(res, 200, {
      success: true,
      data: {
        logs: [
          { timestamp: new Date().toISOString(), level: 'INFO', message: 'Système démarré' }
        ]
      }
    });
    return;
  }

  if (pathname === '/api/admin/system/backups' && method === 'GET') {
    sendJSON(res, 200, {
      success: true,
      data: {
        backups: [
          { id: 1, type: 'Database', lastBackup: new Date().toISOString(), status: 'completed' }
        ]
      }
    });
    return;
  }

  if (pathname === '/api/admin/pricing-plans' && method === 'GET') {
    sendJSON(res, 200, {
      success: true,
      data: {
        plans: [
          { id: 1, name: 'Basique', price: 2500, duration: 'monthly', active: true },
          { id: 2, name: 'Premium', price: 4500, duration: 'monthly', active: true }
        ]
      }
    });
    return;
  }

  if (pathname === '/api/admin/subscribers/export' && method === 'GET') {
    setCorsHeaders(res);
    res.writeHead(200, {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename=subscribers.csv'
    });
    res.end('ID,Nom,Email,Type,Statut\n1,Test User,test@claudyne.com,individual,active');
    return;
  }

  // 404 pour toutes les autres routes
  sendJSON(res, 404, {
    success: false,
    message: `Route non trouvée: ${method} ${pathname}`,
    availableRoutes: ['/', '/health', '/api', '/api/auth/login', '/api/auth/register']
  });
});

// Démarrage du serveur sur toutes les interfaces
server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('🎓 ============================================');
  console.log('   CLAUDYNE - La force du savoir en héritage');
  console.log('🎓 ============================================');
  console.log('');
  console.log(`✅ Serveur API minimal démarré sur le port ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`🩺 Health: http://localhost:${PORT}/health`);
  console.log(`📡 API: http://localhost:${PORT}/api`);
  console.log('');
  console.log('👥 Comptes de test disponibles:');
  console.log('   📧 Email: test@claudyne.com / Mot de passe: 123456');
  console.log('   📱 Téléphone: +237612345678 / Mot de passe: 123456');
  console.log('');
  console.log('🏆 En mémoire de Meffo Mehtah Tchandjio Claudine');
  console.log('💚 Prêt pour le frontend sur http://localhost:3000');
  console.log('');
});

// Gestion gracieuse de l'arrêt
process.on('SIGINT', () => {
  console.log('\n👋 Arrêt de Claudyne API...');
  console.log('🌟 Merci d\'avoir testé Claudyne !');
  process.exit(0);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`❌ Le port ${PORT} est déjà utilisé.`);
    console.log('Solution: Arrêtez le processus existant ou changez le port.');
  } else {
    console.log('❌ Erreur serveur:', err.message);
  }
});

module.exports = server;