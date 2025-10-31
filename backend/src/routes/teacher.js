const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');

router.use(async (req, res, next) => {
  if (!req.models) {
    const database = require('../config/database');
    req.models = database.initializeModels();
  }
  next();
});

router.get('/dashboard', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentification requise' });
    const { Student, Subject, Progress } = req.models;
    const stats = {
      totalStudents: await Student.count({ where: { isActive: true } }),
      totalSubjects: await Subject.count(),
      totalLessons: await Progress.count({ where: { status: 'COMPLETED' } })
    };
    res.json({ success: true, data: { teacher: { id: req.user.id, email: req.user.email }, statistics: stats } });
  } catch (error) {
    logger.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: 'Erreur dashboard' });
  }
});

router.get('/profile', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentification requise' });
    const { User } = req.models;
    const user = await User.findByPk(req.user.id, { attributes: ['id', 'email', 'firstName', 'lastName', 'role', 'userType'] });
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    res.json({ success: true, data: user });
  } catch (error) {
    logger.error('Profile error:', error);
    res.status(500).json({ success: false, message: 'Erreur profil' });
  }
});

router.get('/students', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentification requise' });
    const { Student } = req.models;
    const students = await Student.findAll({ where: { isActive: true }, attributes: ['id', 'firstName', 'lastName', 'currentLevel', 'totalPoints'], limit: 50 });
    res.json({ success: true, count: students.length, data: students });
  } catch (error) {
    logger.error('Students error:', error);
    res.status(500).json({ success: false, message: 'Erreur étudiants' });
  }
});

router.get('/content', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentification requise' });
    const { Subject } = req.models;
    const subjects = await Subject.findAll({ limit: 50 });
    res.json({ success: true, count: subjects.length, data: subjects });
  } catch (error) {
    logger.error('Content error:', error);
    res.status(500).json({ success: false, message: 'Erreur contenu' });
  }
});

router.get('/preferences', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentification requise' });
    res.json({ success: true, data: { userId: req.user.id, language: 'fr', timezone: 'Africa/Douala' } });
  } catch (error) {
    logger.error('Preferences error:', error);
    res.status(500).json({ success: false, message: 'Erreur préférences' });
  }
});

router.post('/change-password', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentification requise' });
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ success: false, message: 'Mots de passe requis' });
    if (newPassword.length < 8) return res.status(400).json({ success: false, message: 'Mot de passe trop court' });
    const { User } = req.models;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(401).json({ success: false, message: 'Mot de passe incorrect' });
    await user.update({ password: await bcrypt.hash(newPassword, 12) });
    res.json({ success: true, message: 'Mot de passe modifié' });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Erreur changement mot de passe' });
  }
});

module.exports = router;