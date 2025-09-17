/**
 * Backend minimal Claudyne pour démonstration
 * Fournit les APIs de base pour tester les interfaces
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Middleware de logging simple
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Route de santé
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'claudyne-backend',
    version: '1.0.0'
  });
});

// Route de bienvenue
app.get('/', (req, res) => {
  res.json({
    message: 'Bienvenue sur l\'API Claudyne 🎓',
    subtitle: 'La force du savoir en héritage',
    documentation: '/api/docs',
    health: '/health',
    version: '1.0.0',
    tribute: 'En mémoire de Meffo Mehtah Tchandjio Claudine',
    contact: 'contact@claudyne.cm'
  });
});

// Routes API de base
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'API Claudyne opérationnelle',
    endpoints: [
      'GET /api/me - Profil utilisateur',
      'GET /api/stats - Statistiques',
      'GET /api/admin/dashboard - Dashboard admin',
      'GET /api/families - Gestion familles',
      'GET /api/students - Gestion étudiants',
      'GET /api/subjects - Matières',
      'GET /api/battles - Battle Royale',
      'GET /api/prix-claudine - Prix Claudine',
      'GET /api/payments - Paiements',
      'POST /api/mentor/chat - Chat mentor',
      'GET /api/progress - Progression',
      'GET /api/notifications - Notifications'
    ]
  });
});

// Profil utilisateur simulé
app.get('/api/me', (req, res) => {
  res.json({
    success: true,
    user: {
      id: 'demo-user-001',
      firstName: 'Démonstration',
      lastName: 'Claudyne',
      email: 'demo@claudyne.cm',
      role: 'ADMIN',
      userType: 'MANAGER'
    },
    family: {
      id: 'demo-family-001',
      name: 'Famille Démonstration',
      displayName: 'Famille Demo Claudyne',
      status: 'ACTIVE',
      subscriptionType: 'PREMIUM',
      walletBalance: 50000,
      claudinePoints: 1250
    },
    permissions: {
      canManageFamily: true,
      canAccessAdmin: true,
      canParticipateInBattles: true
    }
  });
});

// Statistiques simulées
app.get('/api/stats', (req, res) => {
  res.json({
    success: true,
    stats: {
      platform: {
        totalFamilies: 156,
        totalStudents: 423,
        totalUsers: 892
      },
      battles: {
        totalBattles: 45,
        activeBattles: 3
      },
      prixClaudine: {
        candidates: 89,
        finalists: 12,
        winners: 3
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Dashboard admin simulé
app.get('/api/admin/dashboard', (req, res) => {
  res.json({
    success: true,
    data: {
      stats: {
        totalFamilies: 156,
        activeFamilies: 142,
        totalStudents: 423,
        activeStudents: 398,
        totalRevenue: 2450000,
        monthlyRevenue: 185000,
        avgRevenuePerFamily: 15000,
        totalSubscriptions: 156
      },
      charts: {
        revenueData: [
          { month: 'Jan', revenue: 120000 },
          { month: 'Fév', revenue: 145000 },
          { month: 'Mar', revenue: 160000 },
          { month: 'Avr', revenue: 185000 }
        ],
        subscriptionData: [
          { type: 'BASIC', count: 45 },
          { type: 'PREMIUM', count: 89 },
          { type: 'FAMILY', count: 22 }
        ]
      },
      recentActivities: [
        {
          id: 1,
          type: 'NEW_FAMILY',
          message: 'Nouvelle famille inscrite: Famille Mballa',
          timestamp: new Date().toISOString()
        },
        {
          id: 2,
          type: 'PAYMENT',
          message: 'Paiement reçu: 25,000 FCFA via MTN',
          timestamp: new Date().toISOString()
        }
      ]
    }
  });
});

// Familles simulées
app.get('/api/families', (req, res) => {
  res.json({
    success: true,
    data: {
      families: [
        {
          id: 'fam-001',
          name: 'Famille Nkoulou',
          manager: 'Jean Nkoulou',
          email: 'jean.nkoulou@email.cm',
          students: 2,
          status: 'ACTIVE',
          subscription: 'PREMIUM',
          balance: 35000
        },
        {
          id: 'fam-002',
          name: 'Famille Mballa',
          manager: 'Marie Mballa',
          email: 'marie.mballa@email.cm',
          students: 3,
          status: 'ACTIVE',
          subscription: 'FAMILY',
          balance: 48000
        }
      ],
      total: 156,
      page: 1,
      limit: 20
    }
  });
});

// Chat mentor simulé
app.post('/api/mentor/chat', (req, res) => {
  const responses = [
    "Excellente question ! Je suis là pour t'aider à comprendre 😊",
    "C'est normal d'avoir des difficultés avec cette notion. Essayons ensemble !",
    "Bravo pour ton effort ! Tu progresses très bien 👏",
    "Laisse-moi t'expliquer cette leçon étape par étape...",
    "As-tu pensé à revoir la leçon précédente ? Elle t'aidera à mieux comprendre."
  ];

  const randomResponse = responses[Math.floor(Math.random() * responses.length)];

  res.json({
    success: true,
    data: {
      userMessage: {
        id: Date.now(),
        role: 'user',
        content: req.body.message,
        timestamp: new Date().toISOString()
      },
      assistantMessage: {
        id: Date.now() + 1,
        role: 'assistant',
        content: randomResponse,
        timestamp: new Date().toISOString(),
        metadata: {
          aiModel: 'claudyne-mentor-v1',
          confidence: 0.95
        }
      }
    }
  });
});

// Gestion d'erreurs
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route API non trouvée: ${req.method} ${req.originalUrl}`,
    suggestion: 'Consultez /api pour voir les endpoints disponibles'
  });
});

app.use((error, req, res, next) => {
  console.error('Erreur API:', error);
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log('🚀 ============================================');
  console.log('   BACKEND CLAUDYNE DÉMARRÉ');
  console.log('🚀 ============================================');
  console.log('');
  console.log(`✅ API Backend: http://localhost:${PORT}`);
  console.log(`🩺 Health Check: http://localhost:${PORT}/health`);
  console.log(`📡 API Base: http://localhost:${PORT}/api`);
  console.log('');
  console.log('🏆 APIs simulées disponibles:');
  console.log('   👨‍💼 Admin Dashboard');
  console.log('   👨‍👩‍👧‍👦 Gestion Familles');
  console.log('   🎓 Gestion Étudiants');
  console.log('   🤖 Chat Mentor IA');
  console.log('   📊 Statistiques');
  console.log('   🔐 Authentification');
  console.log('');
  console.log('💚 Prêt pour les tests des interfaces !');
  console.log('👨‍👩‍👧‍👦 En hommage à Meffo Mehtah Tchandjio Claudine');
  console.log('');
});

// Gestion gracieuse de l'arrêt
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du backend Claudyne...');
  console.log('👋 À bientôt !');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Signal SIGTERM reçu, arrêt du backend...');
  process.exit(0);
});