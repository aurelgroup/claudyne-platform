// ====================================================================
// 💳 ENDPOINTS MOBILE MONEY - MTN & ORANGE MONEY CAMEROUN
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
  const statuses = ['pending', 'completed', 'failed'];
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

// Endpoint webhook pour confirmation de paiement (MTN/Orange)
app.post('/api/payments/webhook/:provider', (req, res) => {
  const { provider } = req.params;
  const webhookData = req.body;

  console.log(`🔔 Webhook reçu de ${provider.toUpperCase()}:`, webhookData);

  // Traitement du webhook selon le provider
  if (provider === 'mtn') {
    // Logique spécifique MTN
    console.log('📱 Traitement webhook MTN Mobile Money');
  } else if (provider === 'orange') {
    // Logique spécifique Orange Money
    console.log('🍊 Traitement webhook Orange Money');
  }

  // Réponse de confirmation au provider
  res.status(200).json({
    success: true,
    message: 'Webhook traité avec succès'
  });
});

// Valider un numéro de téléphone pour Mobile Money
app.post('/api/payments/validate-phone', (req, res) => {
  const { phone, operator } = req.body;

  if (!phone) {
    return res.status(400).json({
      success: false,
      message: 'Numéro de téléphone requis'
    });
  }

  // Validation des préfixes camerounais
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  const phoneRegex = /^(\+237|237)?(6[5-9]|2[2-3])\d{7}$/;

  if (!phoneRegex.test(cleanPhone)) {
    return res.status(400).json({
      success: false,
      message: 'Format de numéro de téléphone camerounais invalide'
    });
  }

  // Détection automatique de l'opérateur
  const detectedOperator = cleanPhone.match(/6[7,5,0-4,8]/) ? 'mtn' :
                          cleanPhone.match(/6[9,5-9]/) ? 'orange' : 'unknown';

  res.json({
    success: true,
    data: {
      phone: cleanPhone,
      operator: detectedOperator,
      valid: true,
      formatted: `+237 ${cleanPhone.slice(-9, -7)} ${cleanPhone.slice(-7, -4)} ${cleanPhone.slice(-4, -2)} ${cleanPhone.slice(-2)}`
    }
  });
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