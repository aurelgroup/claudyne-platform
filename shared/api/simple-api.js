// API Simplifiée pour démarrage rapide
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware de base
app.use(cors());
app.use(express.json());

// Headers pour identifier le client
app.use((req, res, next) => {
  req.clientType = req.get('X-Client-Type') || 'web';
  req.isMobile = req.clientType === 'mobile';
  next();
});

// Route racine API
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Claudyne API Unifiée - Version Simple',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    clientType: req.clientType,
    features: {
      mobile: true,
      web: true,
      auth: true
    }
  });
});

// Authentification simplifiée
app.post('/api/auth/login', (req, res) => {
  const { email, password, clientType } = req.body;

  // Simulation auth réussie
  const user = {
    id: 1,
    name: 'Utilisateur Test',
    email: email || 'test@claudyne.com',
    role: 'student'
  };

  const token = 'mock_jwt_token_' + Date.now();

  res.json({
    success: true,
    token,
    user,
    expiresIn: '24h'
  });
});

// Profil utilisateur
app.get('/api/user/profile', (req, res) => {
  res.json({
    success: true,
    user: {
      id: 1,
      name: 'Étudiant Claudyne',
      email: 'etudiant@claudyne.com',
      role: 'student',
      grade: 'Terminale'
    }
  });
});

// Statistiques utilisateur
app.get('/api/user/stats', (req, res) => {
  res.json({
    success: true,
    stats: {
      coursesCompleted: 8,
      totalHours: 32,
      currentStreak: 12,
      points: 2450,
      level: 15,
      badges: ['first_course', 'week_streak', 'math_master', 'french_expert']
    }
  });
});

// Cours disponibles
app.get('/api/courses', (req, res) => {
  const courses = [
    {
      id: 1,
      title: 'Mathématiques Avancées',
      description: 'Algèbre, géométrie et analyse pour Terminale',
      level: 'Terminale',
      duration: '6 semaines',
      progress: 75,
      thumbnail: 'https://claudyne.com/images/math.jpg'
    },
    {
      id: 2,
      title: 'Physique-Chimie',
      description: 'Mécanique, thermodynamique et chimie organique',
      level: 'Terminale',
      duration: '8 semaines',
      progress: 45,
      thumbnail: 'https://claudyne.com/images/physics.jpg'
    },
    {
      id: 3,
      title: 'Français & Littérature',
      description: 'Analyse littéraire et expression écrite',
      level: 'Terminale',
      duration: '4 semaines',
      progress: 90,
      thumbnail: 'https://claudyne.com/images/french.jpg'
    }
  ];

  res.json({
    success: true,
    courses,
    total: courses.length
  });
});

// Configuration mobile
app.get('/api/mobile/config', (req, res) => {
  res.json({
    success: true,
    config: {
      apiUrl: 'http://localhost:3001/api',
      downloadUrl: 'https://claudyne.com/download/claudyne.apk',
      features: {
        pushNotifications: true,
        payments: false,
        analytics: true
      },
      theme: {
        primaryColor: '#667eea',
        secondaryColor: '#764ba2',
        accentColor: '#f093fb'
      },
      version: '1.0.0'
    }
  });
});

// Vérification version
app.get('/api/mobile/version-check', (req, res) => {
  const currentVersion = req.query.version || '1.0.0';
  const latestVersion = '1.0.0';
  const needsUpdate = false;

  res.json({
    success: true,
    currentVersion,
    latestVersion,
    needsUpdate,
    updateMessage: needsUpdate ?
      'Une nouvelle version est disponible!' :
      'Votre application est à jour'
  });
});

// Démarrage serveur
app.listen(PORT, () => {
  console.log(`
🚀====================================================================
   CLAUDYNE API UNIFIÉE DÉMARRÉE (VERSION SIMPLE)
======================================================================
📡 Port: ${PORT}
🌐 URL: http://localhost:${PORT}/api
📱 Mobile: Connecté
🌐 Web: Connecté
✅ Prêt pour développement
======================================================================🚀
  `);
});