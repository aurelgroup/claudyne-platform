/**
 * Serveur simple Claudyne pour démarrage rapide
 * La force du savoir en héritage
 */

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

// Configuration CORS pour le frontend
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// Route de bienvenue
app.get('/', (req, res) => {
  res.json({
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
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'Claudyne API fonctionne correctement ! 💚',
    services: {
      api: 'operational',
      database: 'connecting...',
      cache: 'connecting...'
    }
  });
});

// Routes API de base
app.get('/api', (req, res) => {
  res.json({
    message: 'API Claudyne - En cours de développement',
    routes: {
      auth: '/api/auth',
      families: '/api/families',
      students: '/api/students',
      'prix-claudine': '/api/prix-claudine',
      battles: '/api/battles',
      subjects: '/api/subjects'
    },
    note: 'Serveur de développement - Base de données à configurer'
  });
});

// Route auth mock pour tests
app.post('/api/auth/login', (req, res) => {
  const { credential, password } = req.body;
  
  // Mock simple pour tests
  if (credential && password) {
    res.json({
      success: true,
      message: 'Connexion test réussie ! 🎉',
      data: {
        user: {
          id: '1',
          firstName: 'Test',
          lastName: 'Utilisateur',
          email: credential.includes('@') ? credential : null,
          phone: !credential.includes('@') ? credential : null,
          role: 'PARENT',
          userType: 'MANAGER'
        },
        family: {
          id: '1',
          name: 'Famille Test',
          displayName: 'Famille Test',
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
    res.status(400).json({
      success: false,
      message: 'Identifiants requis'
    });
  }
});

// Route inscription mock
app.post('/api/auth/register', (req, res) => {
  const { firstName, lastName, familyName, email, phone, password } = req.body;
  
  if (firstName && lastName && familyName && (email || phone) && password) {
    res.status(201).json({
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
    res.status(400).json({
      success: false,
      message: 'Données d\'inscription incomplètes'
    });
  }
});

// Route me mock
app.get('/api/me', (req, res) => {
  res.json({
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
});

// Prix Claudine mock
app.get('/api/prix-claudine/leaderboard', (req, res) => {
  res.json({
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
});

// Gestion des erreurs 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route non trouvée: ${req.method} ${req.originalUrl}`,
    availableRoutes: ['/', '/health', '/api', '/api/auth/login', '/api/auth/register']
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log('');
  console.log('🎓 ============================================');
  console.log('   CLAUDYNE - La force du savoir en héritage');
  console.log('🎓 ============================================');
  console.log('');
  console.log(`✅ Serveur API démarré sur le port ${PORT}`);
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

module.exports = app;