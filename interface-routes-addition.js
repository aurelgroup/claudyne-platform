// ====================================================================
// 🎓 INTERFACES UTILISATEURS PROTÉGÉES
// ====================================================================

// Middleware d'authentification pour interfaces utilisateurs
const authenticateUserInterface = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "🔐 Authentification requise pour accéder à cette interface",
      error: "NO_TOKEN",
      timestamp: new Date().toISOString()
    });
  }

  // Validation simple token (à améliorer avec JWT en production)
  const validTokens = [
    'student-token-claudyne-2025',
    'teacher-token-claudyne-2025',
    'moderator-token-claudyne-2025',
    'admin-secure-token-claudyne-2025'
  ];

  if (!validTokens.includes(token)) {
    return res.status(401).json({
      success: false,
      message: "🚨 Token d'authentification invalide",
      error: "INVALID_TOKEN",
      timestamp: new Date().toISOString()
    });
  }

  next();
};

// Interface Étudiant
app.get('/student', authenticateUserInterface, (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const filePath = path.join(__dirname, '../../student-interface.html');

  try {
    const html = fs.readFileSync(filePath, 'utf8');
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    res.status(404).json({
      success: false,
      message: "Interface étudiant indisponible",
      error: error.message
    });
  }
});

// Interface Enseignant
app.get('/teacher', authenticateUserInterface, (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const filePath = path.join(__dirname, '../../teacher-interface.html');

  try {
    const html = fs.readFileSync(filePath, 'utf8');
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    res.status(404).json({
      success: false,
      message: "Interface enseignant indisponible",
      error: error.message
    });
  }
});

// Interface Modérateur
app.get('/moderator', authenticateUserInterface, (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const filePath = path.join(__dirname, '../../moderator-interface.html');

  try {
    const html = fs.readFileSync(filePath, 'utf8');
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    res.status(404).json({
      success: false,
      message: "Interface modérateur indisponible",
      error: error.message
    });
  }
});

// Interface Admin (route existante à améliorer)
app.get('/admin-secure-k7m9x4n2p8w5z1c6', (req, res) => {
  const adminToken = req.headers.authorization?.replace('Bearer ', '') || req.query.token;

  if (!adminToken || adminToken !== 'admin-secure-token-claudyne-2025') {
    return res.status(401).json({
      success: false,
      message: "🚨 ACCÈS REFUSÉ - Authentification admin requise",
      error: "UNAUTHORIZED_ADMIN_ACCESS",
      timestamp: new Date().toISOString()
    });
  }

  const fs = require('fs');
  const path = require('path');
  const adminPath = path.join(__dirname, '../../admin-interface.html');

  try {
    const adminHtml = fs.readFileSync(adminPath, 'utf8');
    res.setHeader('Content-Type', 'text/html');
    res.send(adminHtml);
  } catch (error) {
    res.status(404).json({
      success: false,
      message: "Interface admin indisponible",
      error: error.message
    });
  }
});