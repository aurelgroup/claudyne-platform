// ====================================================================
// 🔐 PROTECTION ADMIN RENFORCÉE - CORRECTION BACKEND
// ====================================================================

// Route admin avec protection STRICTE
app.get('/admin-secure-k7m9x4n2p8w5z1c6', (req, res) => {
  // ÉTAPE 1: Vérification du token OBLIGATOIRE
  const adminToken = req.headers.authorization?.replace('Bearer ', '') || req.query.token;

  // PROTECTION CRITIQUE: Refuser TOUT accès sans token valide
  if (!adminToken || adminToken !== 'admin-secure-token-claudyne-2025') {
    console.log(`🚨 TENTATIVE D'ACCÈS ADMIN REFUSÉE - Token: ${adminToken ? 'invalide' : 'manquant'} - IP: ${req.ip}`);
    return res.status(401).json({
      success: false,
      message: "🚨 ACCÈS REFUSÉ - Authentification admin requise",
      error: "UNAUTHORIZED_ADMIN_ACCESS",
      timestamp: new Date().toISOString(),
      ip: req.ip
    });
  }

  // ÉTAPE 2: Token valide - Log de sécurité et service de l'interface
  console.log(`✅ ACCÈS ADMIN AUTORISÉ - Token valide - IP: ${req.ip} - ${new Date().toISOString()}`);

  // ÉTAPE 3: Servir l'interface admin sécurisée
  const fs = require('fs');
  const path = require('path');
  const adminPath = path.join(__dirname, 'admin-interface.html');

  try {
    // Vérifier que le fichier existe avant de le lire
    if (!fs.existsSync(adminPath)) {
      console.error(`❌ ERREUR: Fichier admin interface non trouvé: ${adminPath}`);
      return res.status(404).json({
        success: false,
        message: "Interface admin indisponible - Fichier manquant",
        error: "ADMIN_FILE_NOT_FOUND"
      });
    }

    // Lire et servir le fichier admin
    const adminHtml = fs.readFileSync(adminPath, 'utf8');
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.send(adminHtml);

  } catch (error) {
    console.error(`❌ ERREUR lecture fichier admin:`, error);
    res.status(500).json({
      success: false,
      message: "Erreur interne serveur - Interface admin",
      error: "ADMIN_FILE_READ_ERROR"
    });
  }
});

// ====================================================================
// 🛡️ MIDDLEWARE DE SÉCURITÉ SUPPLÉMENTAIRE
// ====================================================================

// Middleware pour logger toutes les tentatives d'accès aux routes sensibles
app.use('/admin*', (req, res, next) => {
  console.log(`🔍 ACCÈS ROUTE ADMIN - ${req.method} ${req.path} - IP: ${req.ip} - User-Agent: ${req.get('User-Agent')}`);
  next();
});