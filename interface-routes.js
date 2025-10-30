// ====================================================================
// 🎓 INTERFACES UTILISATEURS PROTÉGÉES
// ====================================================================

// Interface Étudiant
app.get('/student', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;

  // Pour l'instant, servir l'interface sans token pour le test
  // TODO: Intégrer avec JWT auth en production

  const fs = require('fs');
  const path = require('path');
  const filePath = path.join(__dirname, '../../student-interface-modern.html');

  try {
    if (!fs.existsSync(filePath)) {
      console.error(`Interface étudiant non trouvée: ${filePath}`);
      return res.status(404).json({
        success: false,
        message: "Interface étudiant indisponible",
        error: "STUDENT_INTERFACE_NOT_FOUND"
      });
    }

    const html = fs.readFileSync(filePath, 'utf8');
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.send(html);

    console.log(`Interface étudiant servie - IP: ${req.ip} - ${new Date().toISOString()}`);
  } catch (error) {
    console.error(`ERREUR interface étudiant:`, error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur - Interface étudiant",
      error: "STUDENT_INTERFACE_ERROR"
    });
  }
});

// Interface Enseignant
app.get('/teacher', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;

  const fs = require('fs');
  const path = require('path');
  const filePath = path.join(__dirname, '../../teacher-interface.html');

  try {
    if (!fs.existsSync(filePath)) {
      console.error(`Interface enseignant non trouvée: ${filePath}`);
      return res.status(404).json({
        success: false,
        message: "Interface enseignant indisponible",
        error: "TEACHER_INTERFACE_NOT_FOUND"
      });
    }

    const html = fs.readFileSync(filePath, 'utf8');
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.send(html);

    console.log(`Interface enseignant servie - IP: ${req.ip} - ${new Date().toISOString()}`);
  } catch (error) {
    console.error(`ERREUR interface enseignant:`, error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur - Interface enseignant",
      error: "TEACHER_INTERFACE_ERROR"
    });
  }
});

// Interface Modérateur
app.get('/moderator', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;

  const fs = require('fs');
  const path = require('path');
  const filePath = path.join(__dirname, '../../moderator-interface.html');

  try {
    if (!fs.existsSync(filePath)) {
      console.error(`Interface modérateur non trouvée: ${filePath}`);
      return res.status(404).json({
        success: false,
        message: "Interface modérateur indisponible",
        error: "MODERATOR_INTERFACE_NOT_FOUND"
      });
    }

    const html = fs.readFileSync(filePath, 'utf8');
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.send(html);

    console.log(`Interface modérateur servie - IP: ${req.ip} - ${new Date().toISOString()}`);
  } catch (error) {
    console.error(`ERREUR interface modérateur:`, error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur - Interface modérateur",
      error: "MODERATOR_INTERFACE_ERROR"
    });
  }
});