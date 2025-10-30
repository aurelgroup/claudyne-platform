// ====================================================================
// 🔐 ROUTE ADMIN SÉCURISÉE - SOLUTION DURABLE
// ====================================================================

// RESTREINDRE STRICTEMENT L'ACCÈS ADMIN
app.get('/admin-secure-k7m9x4n2p8w5z1c6', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;

  // ✅ PROTECTION ABSOLUE - Aucun accès sans token valide
  if (!token || token !== 'admin-secure-token-claudyne-2025') {
    console.log(`🚨 TENTATIVE ACCÈS ADMIN REFUSÉE - IP: ${req.ip} - Token: ${token ? 'invalide' : 'absent'} - ${new Date().toISOString()}`);
    return res.status(401).json({
      success: false,
      message: "🔐 Authentification admin requise",
      error: "UNAUTHORIZED_ACCESS",
      timestamp: new Date().toISOString()
    });
  }

  console.log(`✅ ACCÈS ADMIN AUTORISÉ - IP: ${req.ip} - ${new Date().toISOString()}`);

  // ✅ SERVIR INTERFACE ADMIN SÉCURISÉE
  const fs = require('fs');
  const path = require('path');

  // Chemin sécurisé vers l'interface admin
  const adminPath = path.join(__dirname, '../..', 'admin-interface.html.BLOCKED-FOR-SECURITY');

  try {
    if (!fs.existsSync(adminPath)) {
      console.error(`❌ Interface admin non trouvée: ${adminPath}`);
      return res.status(404).json({
        success: false,
        message: "Interface admin indisponible",
        error: "ADMIN_INTERFACE_NOT_FOUND"
      });
    }

    const adminHtml = fs.readFileSync(adminPath, 'utf8');
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.send(adminHtml);

  } catch (error) {
    console.error(`❌ ERREUR lecture interface admin:`, error);
    res.status(500).json({
      success: false,
      message: "Erreur interne serveur",
      error: "ADMIN_INTERFACE_ERROR"
    });
  }
});