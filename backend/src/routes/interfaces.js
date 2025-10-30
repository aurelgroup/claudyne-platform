/**
 * Routes pour servir les interfaces utilisateur
 * /student, /parent, /teacher, /moderator, /admin
 */

const express = require('express');
const path = require('path');
const router = express.Router();

// Chemins des interfaces
const INTERFACES = {
  student: path.join(__dirname, '../../../student-interface-modern.html'),
  parent: path.join(__dirname, '../../../parent-interface'),
  teacher: path.join(__dirname, '../../../teacher-interface.html'),
  moderator: path.join(__dirname, '../../../moderator-interface.html'),
  admin: path.join(__dirname, '../../../admin-interface.html')
};

// Route /student - Interface étudiant
router.get('/student', (req, res) => {
  res.sendFile(INTERFACES.student);
});

// Route /parent - Interface parent (répertoire avec assets)
// Important: GET route before static to avoid redirect
router.get('/parent', (req, res) => {
  res.sendFile(path.join(INTERFACES.parent, 'index.html'));
});
router.use('/parent', express.static(INTERFACES.parent));

// Route /teacher - Interface enseignant
router.get('/teacher', (req, res) => {
  res.sendFile(INTERFACES.teacher);
});

// Route /moderator - Interface modérateur
router.get('/moderator', (req, res) => {
  res.sendFile(INTERFACES.moderator);
});

// Route /admin - Interface admin (sécurisée par Nginx)
router.get('/admin-secure-k7m9x4n2p8w5z1c6', (req, res) => {
  res.sendFile(INTERFACES.admin);
});

// Route /admin - Redirection vers la route sécurisée
router.get('/admin', (req, res) => {
  res.redirect('/admin-secure-k7m9x4n2p8w5z1c6');
});

module.exports = router;
