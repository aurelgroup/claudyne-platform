// API Simplifiée avec Mobile Money intégré
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

// Middleware d'authentification (EXCLUT les routes payments)
const authMiddleware = (req, res, next) => {
  // Routes publiques (sans authentification)
  const publicRoutes = [
    '/api$',
    '/api/$',
    '/api/payments',
    '/health'
  ];

  // Vérifier si c'est une route publique
  const isPublicRoute = publicRoutes.some(route => {
    const regex = new RegExp(route);
    return regex.test(req.path) || req.path.startsWith('/api/payments');
  });

  if (isPublicRoute) {
    return next(); // Pas d'authentification requise
  }

  // Pour les autres routes, vérifier le token
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Token d'authentification manquant",
      code: "NO_TOKEN"
    });
  }
  next();
};

app.use(authMiddleware);

// Route racine API
app.get('/api', (req, res) => {
  res.json({
    name: "Claudyne API",
    version: "2.0.0",
    message: "API éducative camerounaise - En hommage à Meffo Mehtah Tchandjio Claudine",
    endpoints: [
      "/api/auth/login",
      "/api/user/profile",
      "/api/admin/pricing-plans",
      "/api/payments/methods",  // 🆕 Mobile Money
      "/api/payments/initialize", // 🆕 Mobile Money
      "/health"
    ],
    timestamp: new Date().toISOString()
  });
});

// ====================================================================
// 💳 MOBILE MONEY ENDPOINTS - MTN & ORANGE MONEY CAMEROUN
// ====================================================================

// Méthodes de paiement disponibles
app.get('/api/payments/methods', (req, res) => {
  const methods = [
    {
      id: 'mtn_momo',
      name: 'MTN Mobile Money',
      logo: 'https://claudyne.com/images/mtn-logo.png',
      available: true,
      description: 'Paiement via MTN MoMo',
      fees: '0%',
      limits: { min: 100, max: 500000 }
    },
    {
      id: 'orange_money',
      name: 'Orange Money',
      logo: 'https://claudyne.com/images/orange-logo.png',
      available: true,
      description: 'Paiement via Orange Money',
      fees: '0%',
      limits: { min: 100, max: 500000 }
    }
  ];

  res.json({
    success: true,
    data: { methods },
    message: 'Méthodes de paiement disponibles'
  });
});

// Initialiser un paiement Mobile Money
app.post('/api/payments/initialize', (req, res) => {
  const { amount, paymentMethod, phone, planId, userId } = req.body;

  // Validation des données
  if (!amount || !paymentMethod || !phone) {
    return res.status(400).json({
      success: false,
      message: 'Montant, méthode de paiement et numéro de téléphone requis'
    });
  }

  // Validation des numéros de téléphone camerounais
  const phoneRegex = /^(\+237|237)?(6[5-9]|2[2-3])\d{7}$/;
  if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
    return res.status(400).json({
      success: false,
      message: 'Numéro de téléphone camerounais invalide'
    });
  }

  // Validation de la méthode de paiement
  if (!['mtn_momo', 'orange_money'].includes(paymentMethod)) {
    return res.status(400).json({
      success: false,
      message: 'Méthode de paiement non supportée'
    });
  }

  // Générer un ID de transaction unique
  const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Simulation de l'initialisation du paiement
  const response = {
    success: true,
    data: {
      transactionId,
      amount: parseInt(amount),
      paymentMethod,
      phone: phone.replace(/\s/g, ''),
      status: 'pending',
      message: paymentMethod === 'mtn_momo'
        ? `Composez *126# et suivez les instructions pour payer ${amount} FCFA`
        : `Composez #144# et suivez les instructions pour payer ${amount} FCFA`,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
      qrCode: `https://claudyne.com/qr/${transactionId}` // URL QR code pour scan
    },
    message: 'Paiement initialisé avec succès'
  };

  console.log(`💳 Paiement initié: ${transactionId} - ${amount} FCFA via ${paymentMethod}`);

  res.json(response);
});

// Vérifier le statut d'un paiement
app.get('/api/payments/:transactionId/status', (req, res) => {
  const { transactionId } = req.params;

  if (!transactionId) {
    return res.status(400).json({
      success: false,
      message: 'ID de transaction requis'
    });
  }

  // Simulation du statut de paiement (randomisé pour démo)
  const randomStatus = Math.random() > 0.7 ? 'completed' : (Math.random() > 0.8 ? 'failed' : 'pending');

  const response = {
    success: true,
    data: {
      transactionId,
      status: randomStatus,
      amount: 8000, // Exemple
      paymentMethod: 'mtn_momo',
      phone: '+237670123456',
      timestamp: new Date().toISOString(),
      message: randomStatus === 'completed'
        ? 'Paiement confirmé avec succès'
        : randomStatus === 'failed'
        ? 'Paiement échoué - Vérifiez votre solde'
        : 'Paiement en cours de traitement'
    }
  };

  console.log(`📊 Statut vérifié: ${transactionId} - ${randomStatus}`);

  res.json(response);
});

// Configuration Mobile Money (pour tests)
app.get('/api/payments/config', (req, res) => {
  res.json({
    success: true,
    data: {
      sandbox: true,
      providers: {
        mtn: {
          available: true,
          testNumbers: ['+237670123456', '+237650123456', '+237680123456']
        },
        orange: {
          available: true,
          testNumbers: ['+237690123456', '+237655123456', '+237685123456']
        }
      },
      formulas: [
        { id: 1, name: 'Découverte', price: 0, currency: 'FCFA' },
        { id: 2, name: 'Individuelle', price: 8000, currency: 'FCFA' },
        { id: 3, name: 'Familiale', price: 15000, currency: 'FCFA' }
      ]
    }
  });
});

// Webhook pour confirmation de paiement (MTN/Orange)
app.post('/api/payments/webhook/:provider', (req, res) => {
  const { provider } = req.params;
  const webhookData = req.body;

  console.log(`🔔 Webhook reçu de ${provider.toUpperCase()}:`, webhookData);

  res.status(200).json({
    success: true,
    message: 'Webhook traité avec succès'
  });
});

// ====================================================================
// 🔐 AUTHENTIFICATION
// ====================================================================

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email et mot de passe requis"
    });
  }

  // Validation basique pour démo
  if (email === 'test@claudyne.com' && password === '123456') {
    res.json({
      success: true,
      data: {
        token: 'demo-token-' + Date.now(),
        user: {
          id: 1,
          email: email,
          name: 'Utilisateur Test',
          role: 'student'
        }
      },
      message: 'Connexion réussie'
    });
  } else {
    res.status(401).json({
      success: false,
      message: "Identifiants incorrects"
    });
  }
});

// ====================================================================
// 👤 PROFIL UTILISATEUR
// ====================================================================

app.get('/api/user/profile', (req, res) => {
  res.json({
    success: true,
    data: {
      id: 1,
      name: 'Élève Camerounais',
      email: 'test@claudyne.com',
      level: 'CM2',
      subscription: 'FAMILY',
      subjects: ['Français', 'Anglais', 'Mathématiques']
    }
  });
});

// ====================================================================
// 🔐 ADMIN ENDPOINTS - GESTION DES FORMULES
// ====================================================================

// GET Admin - Récupérer tous les plans tarifaires
app.get("/api/admin/pricing-plans", async (req, res) => {
  try {
    const plans = [
      {
        id: 1, code: "DISCOVERY", name: "Découverte",
        price_monthly: 0, max_students: 1, is_popular: false, is_active: true,
        features: ["Accès à 3 matières", "Exercices de base", "Suivi basique", "Support email"]
      },
      {
        id: 2, code: "INDIVIDUAL", name: "Individuelle",
        price_monthly: 8000, max_students: 1, is_popular: false, is_active: true,
        features: ["Accès illimité", "1 élève", "IA personnalisée", "Prix Claudine", "Support email"]
      },
      {
        id: 3, code: "FAMILY", name: "Familiale",
        price_monthly: 15000, original_price_monthly: 24000, max_students: 3, is_popular: true, is_active: true,
        features: ["Accès illimité", "Jusqu'à 3 enfants", "IA + Dashboard parents", "Prix Claudine", "Support prioritaire"]
      }
    ];

    const stats = { totalPlans: 3, activePlans: 3, popularPlan: "Familiale" };
    res.json({ success: true, data: { plans, stats } });
  } catch (error) {
    console.error("Erreur récupération plans:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'claudyne-api',
    version: '2.0.0',
    mobile_money: 'active'
  });
});

// Démarrage serveur
app.listen(PORT, () => {
  console.log(`🚀 Claudyne API avec Mobile Money démarrée sur le port ${PORT}`);
  console.log(`💳 Endpoints Mobile Money activés`);
  console.log(`🏆 En mémoire de Meffo Mehtah Tchandjio Claudine`);
});

module.exports = app;